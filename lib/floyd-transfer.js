import { createHash } from 'node:crypto';

export const CONTRACT = 'jmr-reboot-3libros-v1';
const BOOKS = ['H', 'D-B', 'D-C', 'D-O', 'M'];
const STAGES = ['H_TO_D', 'H_TO_M', 'D_TO_M', 'RESULTS_TO_DB'];
const cellRx = /^([A-Z]{1,2})([1-9][0-9]*)$/;
const hex = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fail(message) { throw new Error('Floyd sync: ' + message); }
function colNumber(col) { return [...col].reduce((n, x) => 26*n+x.charCodeAt(0)-64, 0); }
function legalTarget(stage, book, sheet, cell) {
  const m = cellRx.exec(cell);
  if (!m) return false;
  const c = colNumber(m[1]), r=+m[2];
  if (stage === 'H_TO_D') return /^D-[BCO]$/.test(book) && sheet==='Input sheet' && c>=2 && c<=3 && [11,12,13,14,15,18,21,23].includes(r);
  if (stage === 'H_TO_M') return book==='M' && ['Income Statement','Balance Sheet','Cash Flow Statement'].includes(sheet) && c>=2 && c<=12 && r>=3 && r<=40;
  if (stage === 'D_TO_M') return book==='M' && sheet==='Entradas desde DCF' && c>=2 && c<=4 && r>=5 && r<=12;
  if (stage === 'RESULTS_TO_DB') return book==='D-B' && sheet==='Resumen de valoraciones' &&
    ((c===3 || c===5) && [5,6,7,8,9,10,11].includes(r) ||
     (c>=2 && c<=5 && r>=24 && r<=29) ||
     (c===2 && [32,33].includes(r)));
  return false;
}
function legalSource(stage, book, sheet) {
  if (stage==='H_TO_D'||stage==='H_TO_M') return book==='H' &&
    ['Income Statement','Balance Sheet','Cash Flow Statement','Entradas históricas auxiliares'].includes(sheet);
  if (stage==='D_TO_M') return ['D-B','D-C','D-O'].includes(book) &&
    ['Input sheet','Valuation output','Cost of capital worksheet'].includes(sheet);
  if (stage==='RESULTS_TO_DB') return ['D-C','D-O','M'].includes(book) &&
    ['Input sheet','Valuation output','Cost of capital worksheet','Resumen de Valoración','Descuento de múltiplos','Entradas desde DCF'].includes(sheet);
  return false;
}
export function validateManifest(manifest) {
  if (manifest?.contratoLibros!==CONTRACT || !/^[A-Z0-9-]+$/.test(manifest?.revisionId||'')) fail('identidad de contrato o revision invalida');
  const keys=Object.keys(manifest.books||{});
  if (keys.length!==5 || !BOOKS.every(k=>keys.includes(k))) fail('se requieren exactamente H, D-B, D-C, D-O, M');
  const ids=keys.map(k=>manifest.books[k]);
  if (ids.some(x=>!(/^[A-Za-z0-9_-]{20,}$/.test(x))) || new Set(ids).size!==5) fail('IDs de libros no validos o duplicados');
  if (!Array.isArray(manifest.transfers)||manifest.transfers.length===0) fail('no hay traspasos');
  const dests=new Set();
  for(const t of manifest.transfers){
    if(!STAGES.includes(t.stage) || !legalTarget(t.stage,t.to?.book,t.to?.sheet,t.to?.cell)) fail('destino no autorizado: '+JSON.stringify(t.to));
    if(!Array.isArray(t.terms)||!t.terms.length||t.terms.length>3) fail('fuentes invalidas');
    const id=t.stage+'|'+t.to.book+'|'+t.to.sheet+'|'+t.to.cell;
    if(dests.has(id)) fail('destino duplicado: '+id);
    dests.add(id);
    for(const src of t.terms) if(!legalSource(t.stage,src.book,src.sheet) ||
       !cellRx.test(src.cell||'') || ![-1,1].includes(src.factor??1)) fail('fuente o factor no permitido');
  }
  return true;
}
function input(snap, ref) {
  const c=snap?.sheets?.[ref.sheet]?.[ref.cell];
  if (!c) fail('celda ausente '+ref.book+' '+ref.sheet+'!'+ref.cell);
  if (typeof c.v!=='number'||!Number.isFinite(c.v)) fail('origen no numerico '+ref.book+' '+ref.sheet+'!'+ref.cell);
  return c;
}
export function planStage(manifest, snapshots, stage) {
  validateManifest(manifest);
  if(!STAGES.includes(stage)) fail('etapa desconocida');
  const selected=manifest.transfers.filter(t=>t.stage===stage);
  if(!selected.length) fail('etapa sin mapeos aprobados');
  const updates=[],proof=[];
  for(const t of selected){
    const dest=snapshots[t.to.book];
    if(!dest) fail('libro destino no leido '+t.to.book);
    const before=dest.sheets?.[t.to.sheet]?.[t.to.cell];
    if(before?.formula || before?.raw?.formulaValue) fail('PROTECCION: no reemplazar formula '+t.to.sheet+'!'+t.to.cell);
    if(before && before.raw && !('numberValue' in before.raw) && Object.keys(before.raw).length) fail('PROTECCION: celda no numerica '+t.to.sheet+'!'+t.to.cell);
    const elements=t.terms.map(s=>{
      const value=input(snapshots[s.book],s);
      return {source:s.book+'/'+s.sheet+'!'+s.cell, value:value.v, factor:s.factor??1};
    });
    const value=Number(elements.reduce((sum,x)=>sum+x.value*x.factor,0).toFixed(9));
    if(!Number.isFinite(value)) fail('resultado no numerico');
    updates.push({book:t.to.book,sheet:t.to.sheet,cell:t.to.cell,value,previous:before?.raw?.numberValue??null});
    proof.push({target:t.to.book+'/'+t.to.sheet+'!'+t.to.cell,terms:elements});
  }
  const snapshotsSha256=Object.fromEntries(BOOKS.filter(k=>snapshots[k]).map(k=>[k,snapshots[k].revision]));
  const signature=hex({revisionId:manifest.revisionId,stage,manifestSha256:hex(manifest),snapshotsSha256,updates,proof});
  return {revisionId:manifest.revisionId,stage,signature,manifestSha256:hex(manifest),snapshotsSha256,updates,proof};
}
export function verifyApplied(plan, snapshots) {
  for(const u of plan.updates){
    const c=snapshots[u.book]?.sheets?.[u.sheet]?.[u.cell];
    if(!c || !Number.isFinite(c.v) || Math.abs(c.v-u.value)>1e-7)
      fail('cambio no confirmado '+u.book+'/'+u.sheet+'!'+u.cell);
  }
  return {success:true,revisionId:plan.revisionId,stage:plan.stage,
    sourcePlanSha256:plan.signature,verifiedSha256:hex(plan.updates),
    afterRevisions:Object.fromEntries(Object.entries(snapshots).map(([k,v])=>[k,v.revision]))};
}
