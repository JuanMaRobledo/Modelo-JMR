/* Expediente JMR: orquestación visual. Nunca recalcula, modifica ni publica valores. */
(function(){
'use strict';
const ROOT='JuanMaRobledo/Modelo-JMR-datos';
const RAW='https://raw.githubusercontent.com/'+ROOT+'/main/';
const CONTENTS='https://api.github.com/repos/'+ROOT+'/contents/';
const el=id=>document.getElementById(id);
const initialView=new URLSearchParams(location.search).get('seccion')==='analisis'?'analisis':'valoracion';
const state={catalog:{valoraciones:[],analisis:[],auditorias:[]},files:[],ticker:'',view:initialView,ready:false,loc:null,reviewSha:null,reviewLoading:false};
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
    const tickers=[...new Set((state.catalog.valoraciones||[]).map(path=>tickerFromName(String(path).split('/').pop())).filter(Boolean))].sort();
    el('tickers').replaceChildren(...tickers.map(t=>{const opt=document.createElement('option');opt.value=t;return opt;}));
    status(tickers.length+' empresas activas en el catálogo oficial. Los archivos históricos no aparecen como fichas vigentes.');
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
  // Nunca elegir automáticamente el último nombre del directorio: puede ser un expediente archivado.
  const path=(officialPath&&inDirectory)?officialPath:'';
  const analysisPath=fromCatalog(state.catalog.analisis,t);
  const auditPath=fromCatalog(state.catalog.auditorias,t);
  const v=path?'visor.html?path='+encodeURIComponent(path):'visor.html?ticker='+encodeURIComponent(t);
  const a='research.html?ticker='+encodeURIComponent(t)+(analysisPath?'&analisis='+encodeURIComponent(analysisPath):'');
  return {
    valPath:path,official:!!officialPath&&inDirectory,analysisPath,auditPath,
    valoracion:{href:v,help:officialPath&&inDirectory?'Valoración indicada en el catálogo oficial.':'La valoración disponible aún no figura en el catálogo oficial; no se presenta como validada.'},
    analisis:{href:a,help:analysisPath?'Análisis asociado en el catálogo oficial; verificar que corresponda a la misma revisión.':'Biblioteca filtrada por ticker. No se atribuye automáticamente un informe antiguo a esta revisión.'},
    supuestos:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Libro original completo: Input Sheet, Valuation Output, Múltiplos y Financial Multiples. Los cambios permitidos requieren autorización y no republican el expediente.'},
    auditoria:{href:'auditorias.html?ticker='+encodeURIComponent(t),help:auditPath?'Auditoría narrativa incluida en el catálogo oficial; cotejar dictamen y revisión con la valoración. Auditoría integral disponible desde la página de auditorías.':'No hay auditoría narrativa oficial para esta empresa. La página indica el estado real, sin sustituirla por otra empresa.'},
    auditoriaIntegral:{href:'auditoria-integral.html?ticker='+encodeURIComponent(t),help:'Auditoría integral DCF, supuestos, materialidad y dictamen técnico, filtrada por empresa. No sustituye la auditoría narrativa del expediente.'},
    sensibilidades:{href:v,help:'Sensibilidades DCF: consultar las matrices de la valoración oficial y la hoja fuente. Recalcular en el Visor es una simulación, no edita el expediente.'},
    sensibilidadMultiples:{href:'auditoria-multiplos.html?ticker='+encodeURIComponent(t),help:'Sensibilidades por múltiplo en el escenario Base; no reemplazan las matrices prioritarias del DCF.'}
  };
}

const DRAFT_PREFIX='jmr-audit-draft-v1:';
let noteRequestVersion=0;
function auditNoteLocation(t){
  const p=pages(t);
  if(!p.official||!/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(p.valPath))return null;
  const filename=p.valPath.split('/').pop();
  return {revision:p.valPath,path:'auditorias/solicitudes/'+filename,draftKey:DRAFT_PREFIX+filename};
}
function auditNoteStatus(message){el('auditReviewStatus').textContent=message;}
function auditNoteLink(path){
  const a=el('auditReviewLink');a.hidden=!path;
  if(path)a.href='https://github.com/'+ROOT+'/blob/main/'+path;
}
function getAuditDraft(key){try{return localStorage.getItem(key)||'';}catch(e){return '';}}
function storeAuditDraft(key,value){try{localStorage.setItem(key,value);}catch(e){auditNoteStatus('No se pudo guardar localmente; conserva una copia del texto.');}}
async function readAuditNotes(t){
  const request=++noteRequestVersion;
  const loc=auditNoteLocation(t),area=el('auditReviewNotes');
  area.value='';el('saveAuditRequest').disabled=!loc;
  el('connectAuditGithub').hidden=!!GhOAuth.getGhToken();
  auditNoteLink('');
  if(!loc){auditNoteStatus('La valoración todavía no está conciliada en catálogo; no se puede adjuntar una nota oficial.');return;}
  const draft=getAuditDraft(loc.draftKey);
  area.value=draft;
  auditNoteStatus(draft?'Borrador local recuperado; no se ha publicado.':'Consultando observaciones guardadas…');
  try{
    const res=await fetch(CONTENTS+loc.path+'?ref=main',{cache:'no-store'});
    if(request!==noteRequestVersion||state.ticker!==t)return;
    if(res.status===404){auditNoteStatus(draft?'Borrador local pendiente de sincronizar.':'No hay observaciones guardadas para esta revisión.');return;}
    if(!res.ok)throw Error('HTTP '+res.status);
    const file=await res.json();
    const record=JSON.parse(GhOAuth.b64DecodeUnicode(String(file.content||'').replace(/\s+/g,'')));
    if(request!==noteRequestVersion||state.ticker!==t)return;
    if(record.schema!=='jmr-audit-request-v1'||record.ticker!==t||record.valuationPath!==loc.revision)throw Error('La solicitud guardada pertenece a otra revisión.');
    if(!draft)area.value=String(record.observaciones||'');
    auditNoteLink(loc.path);
    auditNoteStatus(draft?'Borrador local pendiente. También existe una versión publicada.':'Observaciones sincronizadas con GitHub para esta revisión.');
  }catch(e){if(request===noteRequestVersion&&state.ticker===t)auditNoteStatus('No se pudo consultar GitHub: '+e.message+'. Se conserva el borrador local.');}
}
async function saveAuditNotes(){
  const t=state.ticker,loc=auditNoteLocation(t),notes=el('auditReviewNotes').value.trim();
  if(!loc){auditNoteStatus('Primero se requiere una valoración en el catálogo oficial.');return;}
  if(!notes){auditNoteStatus('Escribe al menos una observación antes de guardar.');return;}
  storeAuditDraft(loc.draftKey,notes);
  if(!GhOAuth.getGhToken()){
    el('connectAuditGithub').hidden=false;
    auditNoteStatus('Borrador local conservado. Conecta GitHub para que la auditoría lo pueda leer desde cualquier sesión.');
    return;
  }
  const button=el('saveAuditRequest');button.disabled=true;
  auditNoteStatus('Guardando observaciones…');
  try{
    const url=CONTENTS+loc.path;
    const headers=Object.assign({'Content-Type':'application/json'},GhOAuth.ghHeaders());
    const r=await fetch(url+'?ref=main',{headers,cache:'no-store'});
    if(!r.ok&&r.status!==404)throw Error('Error consultando versión anterior: HTTP '+r.status);
    const previous=r.ok?await r.json():null;
    if(state.ticker!==t||auditNoteLocation(t)?.path!==loc.path)throw Error('Cambió el expediente durante el guardado.');
    let createdAt=new Date().toISOString();
    if(previous){
      const old=JSON.parse(GhOAuth.b64DecodeUnicode(String(previous.content||'').replace(/\s+/g,'')));
      if(old.valuationPath!==loc.revision||old.ticker!==t)throw Error('Conflicto de versión: no se sobrescribirá otro expediente.');
      createdAt=old.createdAt||createdAt;
    }
    const doc={schema:'jmr-audit-request-v1',ticker:t,valuationPath:loc.revision,
      analysisPath:pages(t).analysisPath||null,estado:'PENDIENTE_AUDITORIA',
      observaciones:notes,createdAt,updatedAt:new Date().toISOString()};
    const payload={message:'Registrar observaciones de auditoría '+t,content:GhOAuth.b64EncodeUnicode(JSON.stringify(doc,null,2)),branch:'main'};
    if(previous)payload.sha=previous.sha;
    const saved=await fetch(url,{method:'PUT',headers,body:JSON.stringify(payload)});
    if(!saved.ok){const response=await saved.json().catch(()=>({}));throw Error(response.message||'HTTP '+saved.status);}
    if(state.ticker!==t)throw Error('Guardado en GitHub; cambió la empresa. Comprueba su expediente.');
    try{localStorage.removeItem(loc.draftKey);}catch(e){}
    auditNoteLink(loc.path);
    auditNoteStatus('Observaciones guardadas para '+t+'. Al pedir su auditoría se consultará este archivo.');
  }catch(e){auditNoteStatus('No se pudo guardar en GitHub: '+e.message+'. Borrador local conservado.');}
  finally{if(state.ticker===t)button.disabled=false;}
}

function openCompany(input){
  const t=valid(input);
  if(!t){status('Ticker inválido. Usa letras, números, punto, guion o subrayado.','error');return;}
  state.ticker=t;state.loc=null;state.reviewSha=null;el('ticker').value=t;
  el('reviewPanel').hidden=true;
  el('reviewSaveStatus').textContent='';
  const u=new URL(location.href);u.searchParams.set('ticker',t);history.replaceState({},'',u.pathname+u.search+u.hash);
  el('companyTitle').textContent='Expediente '+t;
  const p=pages(t);
  if(!p.official){
    el('dossier').hidden=true;el('empty').hidden=false;
    el('empty').textContent='No hay una valoración vigente en el catálogo oficial para '+t+'. Consulta el archivo histórico por separado; no se mezclará con la ficha activa.';
    status(t+' no figura con una valoración vigente en el catálogo.','warning');return;
  }
  loadAuditRequest(t,p);
  const official=p.official&&!!p.analysisPath&&!!p.auditPath;
  el('revisionNotice').textContent=official
    ? 'Valoración, análisis y auditoría constan en el catálogo. Esto no certifica por sí solo que compartan revisión ni que la auditoría esté aprobada.'
    : 'Expediente en consulta: faltan piezas del catálogo oficial o todavía no están conciliadas. No se equipara archivo existente a estudio publicado.';
  el('dossier').hidden=false;el('empty').hidden=true;
  el('sheetLink').hidden=false;el('sheetLink').href=p.supuestos.href;
  readAuditNotes(t);
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
  el('reviewPanel').hidden=!(view==='analisis'&&state.loc&&state.loc.revision);
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
el('auditReviewNotes').addEventListener('input',function(){
  const loc=auditNoteLocation(state.ticker);
  if(loc){storeAuditDraft(loc.draftKey,this.value);auditNoteStatus('Borrador guardado localmente; pulsa «Guardar para auditoría en GitHub» para sincronizar.');}
});
el('saveAuditRequest').addEventListener('click',saveAuditNotes);
el('connectAuditGithub').addEventListener('click',()=>GhOAuth.startLogin());

function noteMessage(message,bad){
  const target=el('reviewSaveStatus');
  target.textContent=message;
  target.dataset.level=bad?'error':'neutral';
}
function reviewDraftKey(loc){
  return 'jmr-review-draft-v1:'+loc.ticker+':'+loc.revision;
}
function reviewPath(loc){
  // La ruta es estable, la auditoría de ChatGPT/Claude la resolverá por revisión activa.
  return 'auditorias/solicitudes/'+loc.ticker+'/'+loc.revision+'.json';
}
function saveLocalDraft(){
  const loc=state.loc;
  if(!loc||!loc.revision)return;
  const key=reviewDraftKey(loc);
  const value=JSON.stringify({estadoRevision:el('auditReviewStatus').value,puntos:el('auditReviewNotes').value,
      actualizadoEn:new Date().toISOString(),revisionId:loc.revision});
  try{localStorage.setItem(key,value);}catch(_){}
  noteMessage('Borrador local en este navegador. Pulsa Guardar para enviarlo a GitHub.');
}
function getLocalDraft(loc){
  try{
    const s=localStorage.getItem(reviewDraftKey(loc));
    const parsed=s?JSON.parse(s):null;
    if(parsed&&parsed.revisionId===loc.revision)return parsed;
  }catch(_){}
  return null;
}
function reviewFields(request){
  const statuses=['EN_REVISION','LISTO','REHACER'];
  el('auditReviewStatus').value=statuses.includes(request?.estadoRevision)?request.estadoRevision:'EN_REVISION';
  el('auditReviewNotes').value=typeof request?.puntos==='string'?request.puntos:'';
}
async function fetchAuditStored(loc){
  const r=await fetch(CONTENTS+reviewPath(loc)+'?ref=main',{cache:'no-store'});
  if(r.status===404)return {body:null,sha:null};
  if(!r.ok)throw new Error('No se pudo consultar la revisión guardada (HTTP '+r.status+').');
  const x=await r.json();
  if(!x.sha||!x.content)throw new Error('Revisión incompleta en GitHub.');
  const data=JSON.parse(GhOAuth.b64DecodeUnicode(x.content.replace(/\s/g,'')));
  if(data.schema!=='jmr-audit-request-v1'||data.ticker!==loc.ticker||data.revisionId!==loc.revision){
    throw new Error('La revisión guardada no corresponde a la ficha activa. No se mezclaron datos.');
  }
  return {body:data,sha:x.sha};
}
async function loadAuditRequest(t,p){
  const marker=t+'|'+p.valPath;
  state.reviewLoading=true;
  el('reviewForm').hidden=true;
  el('reviewCompanyMeta').textContent='Leyendo revisión de la valoración oficial…';
  try{
    if(!p.official||!p.valPath)throw new Error('No hay valoración oficial activa.');
    const record=await fetchJSON(RAW+p.valPath);
    if(state.ticker!==t||marker!==t+'|'+pages(t).valPath)return;
    const revision=String(record.revisionId||'').trim();
    if(record.ticker!==t||!/^[A-Za-z0-9._-]{1,90}$/.test(revision))throw new Error('El registro no identifica una revisión válida; guardado bloqueado.');
    const loc={ticker:t,revision:revision,fechaCorte:String(record.fecha||''),valoracionPath:p.valPath};
    state.loc=loc;state.reviewSha=null;
    el('reviewPanel').hidden=state.view!=='analisis';
    el('reviewCompanyMeta').textContent=t+' · Revisión '+loc.revision+' · Corte '+(loc.fechaCorte||'N/D');
    const stored=await fetchAuditStored(loc);
    if(state.ticker!==t||state.loc!==loc)return;
    state.reviewSha=stored.sha;
    const draft=getLocalDraft(loc);
    const remoteDate=Date.parse(stored.body?.actualizadoEn||'')||0;
    const localDate=Date.parse(draft?.actualizadoEn||'')||0;
    const localPreferred=!!draft&&(!stored.body||localDate>remoteDate);
    reviewFields(localPreferred?draft:stored.body);
    el('reviewForm').hidden=false;
    noteMessage(localPreferred?'Borrador local sin publicar; guárdalo en GitHub.':stored.body?'Revisión cargada desde GitHub.':'No hay observaciones guardadas para esta revisión.');
    el('connectReviewGitHub').textContent=GhOAuth.getGhToken()?'GitHub conectado':'Conectar GitHub';
    el('connectReviewGitHub').disabled=!!GhOAuth.getGhToken();
  }catch(e){
    if(state.ticker===t)noteMessage('No se pudo preparar la revisión: '+e.message,true);
  }finally{if(state.ticker===t)state.reviewLoading=false;}
}
async function saveAuditRequest(){
  const loc=state.loc;
  if(!loc||loc.ticker!==state.ticker||state.reviewLoading){noteMessage('Todavía no se cargó una revisión oficial.',true);return;}
  const estado=el('auditReviewStatus').value;
  const puntos=el('auditReviewNotes').value.trim();
  if(!['EN_REVISION','LISTO','REHACER'].includes(estado)){noteMessage('Estado no válido.',true);return;}
  if(estado==='REHACER'&&!puntos){noteMessage('Describe qué debe rehacerse antes de guardar ese estado.',true);return;}
  const token=GhOAuth.getGhToken();
  if(!token){saveLocalDraft();noteMessage('Borrador local. Conecta GitHub para guardar en el expediente.',true);return;}
  const button=el('saveAuditRequest');
  button.disabled=true;
  noteMessage('Guardando en GitHub con comprobación de versión…');
  try{
    // Control optimista: nunca se pisa una edición publicada desde otro dispositivo.
    const latest=await fetchAuditStored(loc);
    if(latest.sha!==state.reviewSha)throw new Error('Otra sesión actualizó las notas. Recarga antes de guardar; tu borrador local queda conservado.');
    if(state.ticker!==loc.ticker||state.loc!==loc)throw new Error('Se cambió de empresa. No se escribió nada.');
    const data={schema:'jmr-audit-request-v1',ticker:loc.ticker,revisionId:loc.revision,
      fechaCorte:loc.fechaCorte,valoracionPath:loc.valoracionPath,estadoRevision:estado,puntos:puntos,
      auditoriaSolicitada:false,actualizadoEn:new Date().toISOString(),
      instruccion:'Cuando el usuario solicite auditar esta empresa, leer estos puntos y la revisión indicada. Estado LISTO significa revisión visual terminada, no auditoría aprobada.'};
    const body={message:'Revisión visual '+loc.ticker+' '+loc.revision,content:GhOAuth.b64EncodeUnicode(JSON.stringify(data,null,2)+'\n'),branch:'main'};
    if(state.reviewSha)body.sha=state.reviewSha;
    const res=await fetch(CONTENTS+reviewPath(loc),{method:'PUT',
      headers:{'Accept':'application/vnd.github+json','Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify(body)});
    if(!res.ok){const err=await res.json().catch(()=>({}));throw new Error(err.message||('GitHub devolvió HTTP '+res.status));}
    const result=await res.json();
    if(!result.content?.sha)throw new Error('GitHub no confirmó la versión escrita.');
    state.reviewSha=result.content.sha;
    try{localStorage.removeItem(reviewDraftKey(loc));}catch(_){}
    noteMessage('Guardado en GitHub · '+loc.ticker+' · '+loc.revision+'. La auditoría no se ejecutó.');
  }catch(e){saveLocalDraft();noteMessage('No guardado en GitHub: '+e.message,true);}
  finally{button.disabled=false;}
}
el('reviewForm').addEventListener('submit',e=>{e.preventDefault();saveAuditRequest();});
el('auditReviewStatus').addEventListener('change',saveLocalDraft);
el('auditReviewNotes').addEventListener('input',saveLocalDraft);
el('connectReviewGitHub').addEventListener('click',()=>GhOAuth.startLogin());
el('reloadAuditRequest').addEventListener('click',()=>{
 if(state.loc)loadAuditRequest(state.loc.ticker,pages(state.loc.ticker));
});

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
    // Un enlace al expediente dentro de un iframe no debe crear un expediente
    // dentro de sí mismo. Los enlaces a este módulo vuelven al nivel superior.
    doc.querySelectorAll('a[href]').forEach(function(a){
      try{const u=new URL(a.getAttribute('href'),doc.location.href);
        if(u.origin===location.origin && /\/(?:expediente|index)\.html$/.test(u.pathname))a.setAttribute('target','_top');
      }catch(e){}
    });
  }catch(e){/* La vista original sigue siendo accesible desde el enlace superior. */}
});
loadInventory();
})();
