/* Expediente JMR: orquestación visual. Nunca recalcula, modifica ni publica valores. */
(function(){
'use strict';
const ROOT='JuanMaRobledo/Modelo-JMR-datos';
const RAW='https://raw.githubusercontent.com/'+ROOT+'/main/';
const CONTENTS='https://api.github.com/repos/'+ROOT+'/contents/';
const el=id=>document.getElementById(id);
const state={catalog:{valoraciones:[],analisis:[],auditorias:[]},files:[],ticker:'',view:'valoracion',ready:false};
const TICKER=/^[A-Z0-9._-]{1,24}$/;
function valid(x){x=String(x||'').trim().toUpperCase();return TICKER.test(x)?x:'';}
function tickerFromName(x){return String(x||'').match(/^([A-Za-z0-9._]+)-/)?.[1]?.toUpperCase()||'';}
function fromCatalog(arr,t){
  if(!Array.isArray(arr))return '';
  return arr.find(path=>{
    if(typeof path!=='string')return false;
    const name=path.split('/').pop().toUpperCase();
    return name.startsWith(t+'-') || name===t+'.MD' || name===t+'.JSON';
  })||'';
}
function status(s,level){el('status').textContent=s;el('status').dataset.level=level||'neutral';}
async function fetchJSON(url){
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
async function loadInventory(){
  status('Consultando catálogo e inventario vigente…');
  try{
    const [catalog,files]=await Promise.all([
      fetchJSON(RAW+'catalogo.json'),
      fetchJSON(CONTENTS+'valoraciones?ref=main')
    ]);
    if(!Array.isArray(files))throw new Error('El inventario de valoraciones no es una lista.');
    state.catalog=catalog||{};
    state.files=files.filter(f=>f.type==='file'&&/\.json$/i.test(f.name));
    state.ready=true;
    const tickers=[...new Set(state.files.map(f=>tickerFromName(f.name)).filter(Boolean))].sort();
    el('tickers').replaceChildren(...tickers.map(t=>{const opt=document.createElement('option');opt.value=t;return opt;}));
    status(tickers.length+' empresas con archivo vigente en datos; '+(state.catalog.valoraciones||[]).length+' figuran en el catálogo oficial. Las diferencias requieren conciliación.');
    const requested=valid(new URLSearchParams(location.search).get('ticker'));
    if(requested)openCompany(requested);else if(state.ticker)openCompany(state.ticker);
  }catch(e){
    state.ready=false;status('No se pudo consultar el catálogo: '+e.message+'. Puedes abrir las secciones manualmente por ticker.','error');
    const requested=valid(new URLSearchParams(location.search).get('ticker'));
    if(requested)openCompany(requested);
  }
}
function pages(t){
  const officialPath=fromCatalog(state.catalog.valoraciones,t);
  const candidates=state.files.filter(f=>tickerFromName(f.name)===t);
  const inDirectory=candidates.some(f=>f.path===officialPath);
  const mostRecent=candidates.sort((a,b)=>b.name.localeCompare(a.name,'en',{numeric:true}))[0];
  const path=(officialPath&&inDirectory)?officialPath:(mostRecent?.path||'');
  const analysisPath=fromCatalog(state.catalog.analisis,t);
  const auditPath=fromCatalog(state.catalog.auditorias,t);
  const v=path?'visor.html?path='+encodeURIComponent(path):'visor.html?ticker='+encodeURIComponent(t);
  const a='research.html?ticker='+encodeURIComponent(t)+(analysisPath?'&analisis='+encodeURIComponent(analysisPath):'');
  return {
    valPath:path,official:!!officialPath&&inDirectory,analysisPath,auditPath,
    valoracion:{href:v,help:officialPath&&inDirectory?'Valoración indicada en el catálogo oficial.':'La valoración disponible aún no figura en el catálogo oficial; no se presenta como validada.'},
    analisis:{href:a,help:analysisPath?'Análisis asociado en el catálogo oficial; verificar que corresponda a la misma revisión.':'Biblioteca filtrada por ticker. No se atribuye automáticamente un informe antiguo a esta revisión.'},
    supuestos:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Edición real en Google Sheets solo con autorización y permisos; guardar aquí NO republica el expediente.'},
    auditoria:{href:'auditorias.html?ticker='+encodeURIComponent(t),help:auditPath?'Auditoría narrativa incluida en el catálogo oficial; cotejar dictamen y revisión con la valoración. Auditoría integral disponible desde la página de auditorías.':'No hay auditoría narrativa oficial para esta empresa. La página indica el estado real, sin sustituirla por otra empresa.'},
    auditoriaIntegral:{href:'auditoria-integral.html?ticker='+encodeURIComponent(t),help:'Auditoría integral DCF, supuestos, materialidad y dictamen técnico, filtrada por empresa. No sustituye la auditoría narrativa del expediente.'},
    sensibilidades:{href:v,help:'Sensibilidades DCF: consultar las matrices de la valoración oficial y la hoja fuente. Recalcular en el Visor es una simulación, no edita el expediente.'},
    sensibilidadMultiples:{href:'auditoria-multiplos.html?ticker='+encodeURIComponent(t),help:'Sensibilidades por múltiplo en el escenario Base; no reemplazan las matrices prioritarias del DCF.'}
  };
}
function openCompany(input){
  const t=valid(input);
  if(!t){status('Ticker inválido. Usa letras, números, punto, guion o subrayado.','error');return;}
  state.ticker=t;el('ticker').value=t;
  const u=new URL(location.href);u.searchParams.set('ticker',t);history.replaceState({},'',u.pathname+u.search+u.hash);
  el('companyTitle').textContent='Expediente '+t;
  const p=pages(t);
  const official=p.official&&!!p.analysisPath&&!!p.auditPath;
  el('revisionNotice').textContent=official
    ? 'Valoración, análisis y auditoría constan en el catálogo. Esto no certifica por sí solo que compartan revisión ni que la auditoría esté aprobada.'
    : 'Expediente en consulta: faltan piezas del catálogo oficial o todavía no están conciliadas. No se equipara archivo existente a estudio publicado.';
  el('dossier').hidden=false;el('empty').hidden=true;
  el('sheetLink').hidden=false;el('sheetLink').href=p.suppuestos.href;
  const first=p.valPath?'valoracion': 'analisis';
  showView(state.view&&p[state.view]?state.view:first);
  if(!p.official)status(t+' · Sin entrada oficial completa de valoración en catálogo; consulta disponible con reservas.','warning');
  else status(t+' · Valoración en catálogo; análisis y auditoría deben cotejarse con esa misma revisión.');
}
function showView(view){
  if(!state.ticker)return;
  state.view=view;
  document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===view;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));});
  const sensitivity=view==='sensibilidades',auditing=view==='auditoria';
  el('sensitivityModes').hidden=!sensitivity;
  el('auditModes').hidden=!auditing;
  showDetail(sensitivity?(state.sensitivityMode||'sensibilidades'):auditing?(state.auditMode||'auditoria'):view);
}
function showDetail(kind){
  if(!state.ticker)return;
  const d=pages(state.ticker)[kind];if(!d)return;
  if(kind==='sensibilidades'||kind==='sensibilidadMultiples')state.sensitivityMode=kind;
  if(kind==='auditoria'||kind==='auditoriaIntegral')state.auditMode=kind;
  document.querySelectorAll('[data-audit]').forEach(b=>{
    const selected=b.dataset.audit===kind;
    b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
  });
  document.querySelectorAll('[data-sensitivity]').forEach(b=>{
    const selected=b.dataset.sensitivity===kind;
    b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
  });
  el('viewHelp').textContent=d.help;el('openOriginal').href=d.href;
  const frame=el('viewFrame');
  if(frame.getAttribute('src')!==d.href)frame.setAttribute('src',d.href);
}
el('lookup').addEventListener('submit',e=>{e.preventDefault();openCompany(el('ticker').value);});
el('reload').addEventListener('click',loadInventory);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-sensitivity]').forEach(b=>b.addEventListener('click',()=>showDetail(b.dataset.sensitivity)));
document.querySelectorAll('[data-audit]').forEach(b=>b.addEventListener('click',()=>showDetail(b.dataset.audit)));
el('viewFrame').addEventListener('load',function(){
  // Mismo origen: ocultar solamente la navegación duplicada, sin tocar los
  // botones, selectores, formularios o cálculos de la página original.
  try{
    const doc=this.contentDocument;
    if(!doc||doc.getElementById('jmr-dossier-embed'))return;
    const style=doc.createElement('style');style.id='jmr-dossier-embed';
    style.textContent='nav.appnav,#jmr-market-nav{display:none!important}';
    doc.head.appendChild(style);
  }catch(e){/* La vista original sigue siendo accesible desde el enlace superior. */}
});
loadInventory();
})();
