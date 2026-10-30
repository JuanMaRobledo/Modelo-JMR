/* Expediente JMR: orquestación visual. Nunca recalcula, modifica ni publica valores. */
(function(){
'use strict';
const ROOT='JuanMaRobledo/Modelo-JMR-datos';
const RAW='https://raw.githubusercontent.com/'+ROOT+'/main/';
const CONTENTS='https://api.github.com/repos/'+ROOT+'/contents/';
const el=id=>document.getElementById(id);
const DOSSIER_VIEWS=['analisis','valoracion','financieros','indicadores','modelo','sensibilidades','revision'];
const params=new URLSearchParams(location.search);
const initialView=DOSSIER_VIEWS.includes(params.get('seccion'))?params.get('seccion'):'analisis';
const SHEETS_BY_VIEW={
  financieros:['Income Statement','Balance Sheet','Cash Flow Statement','Trailing 12 month Worskheet','Por acción','Dividendos'],
  indicadores:['Trailing Valuation','Forward Valuation','Márgenes','Eficiencia de capital','Salud Financiera','Crecimiento y Márgenes'],
  modelo:['Input sheet','Valuation output','Resumen de Valoración','Escenarios e historias',
    'Cost of capital worksheet','Descuento de múltiplos','Sensibilidad DCF']
};
const state={catalog:{valoraciones:[],analisis:[],auditorias:[]},files:[],ticker:'',view:initialView,ready:false,loc:null,reviewSha:null,reviewLoading:false,mosRequest:0,valuationRecord:null,frameMode:'',sheet:'',sheetByView:{},sensitivityMode:'sensibilidades'};
const TICKER=/^[A-Z0-9._-]{1,24}$/;
function valid(x){x=String(x||'').trim().toUpperCase();if(x==='GOOG')x='GOOGL';return TICKER.test(x)?x:'';}
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
    const catalog=await fetchJSON(RAW+'catalogo.json');
    if(!catalog||!Array.isArray(catalog.valoraciones))throw new Error('Catálogo oficial inválido.');
    state.catalog=catalog;
    state.files=[]; // Nunca depender del inventario histórico ni de una segunda API para construir las fichas.
    state.ready=true;
    const tickers=[...new Set((state.catalog.valoraciones||[]).map(path=>tickerFromName(String(path).split('/').pop())).filter(Boolean))].sort();
    el('tickers').replaceChildren(...tickers.map(t=>{const opt=document.createElement('option');opt.value=t;return opt;}));
    renderCatalogCards();
    status(tickers.length+' empresas activas en el catálogo oficial. Los archivos históricos no aparecen como fichas vigentes.');
    const requested=valid(new URLSearchParams(location.search).get('ticker'));
    if(requested)openCompany(requested);else if(state.ticker)openCompany(state.ticker);
  }catch(e){
    state.ready=false;status('No se pudo consultar el catálogo: '+e.message+'. Puedes abrir las secciones manualmente por ticker.','error');
    const requested=valid(new URLSearchParams(location.search).get('ticker'));
    if(requested)openCompany(requested);
  }
}

function catalogMarket(t){
  const p=new URLSearchParams(location.search);
  const market=p.get('mercado');
  if(market!=='colombia'&&market!=='internacional')return true;
  const isColombia=typeof window.jmrEsCOP==='function'?window.jmrEsCOP({ticker:t}):false;
  return market==='colombia'?isColombia:!isColombia;
}
function logoUrl(t){
  if(t==='NKE')return 'assets/logos/nike.svg';
  if(t==='UBER')return 'assets/logos/uber.svg';
  return 'https://images.financialmodelingprep.com/symbol/'+encodeURIComponent(t)+'.png';
}
function companyLogo(t,kind){
  const wrap=document.createElement('span');wrap.className=kind+'-logo-wrap';
  const fallback=document.createElement('span');fallback.className=kind+'-logo-fallback';
  fallback.textContent=t.slice(0,3);
  const img=document.createElement('img');img.className=kind+'-logo-image';
  img.alt='Logo de '+t;img.hidden=true;
  img.onload=()=>{img.hidden=false;fallback.hidden=true;};
  img.onerror=()=>{img.hidden=true;fallback.hidden=false;};
  img.src=logoUrl(t);
  wrap.append(img,fallback);
  return wrap;
}
function renderCatalogCards(){
  const q=String(el('catalogSearch').value||'').trim().toUpperCase();
  const paths=Array.isArray(state.catalog.valoraciones)?state.catalog.valoraciones:[];
  const tickers=[...new Set(paths.map(p=>tickerFromName(String(p).split('/').pop())).filter(valid))].sort();
  const matching=tickers.filter(t=>catalogMarket(t)&&(!q||t.includes(q)));
  const grid=el('catalogCards');
  grid.replaceChildren();
  const fragment=document.createDocumentFragment();
  matching.forEach(t=>{
    const p=pages(t);
    const card=document.createElement('article');
    card.className='catalog-card'+(state.ticker===t?' active':'');
    card.setAttribute('role','listitem');
    const head=document.createElement('div');head.className='card-identity';
    const title=document.createElement('strong');title.textContent=t;
    head.append(companyLogo(t,'card'),title);
    card.appendChild(head);
    const info=document.createElement('small');info.textContent='Valoración vigente en catálogo';
    card.appendChild(info);
    const supports=document.createElement('span');supports.className='card-caption';
    supports.textContent=(p.analysisPath?'Análisis disponible':'Análisis pendiente')+' · '+(p.auditPath?'Auditoría disponible':'Auditoría pendiente');
    card.appendChild(supports);
    const actions=document.createElement('div');actions.className='card-links';
    const open=document.createElement('button');open.type='button';open.className='card-open';
    open.textContent='Abrir ficha completa';
    open.addEventListener('click',()=>{openCompany(t);el('dossier').scrollIntoView({behavior:'smooth',block:'start'});});
    actions.appendChild(open);
    card.appendChild(actions);
    card.addEventListener('click',event=>{if(!event.target.closest('button,a'))open.click();});
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
  el('catalogEmpty').hidden=matching.length>0;
  el('catalogSection').hidden=false;
}

function pages(t){
  const officialPath=fromCatalog(state.catalog.valoraciones,t);
  // La ruta del catálogo es canónica; si falta el JSON real se mostrará un error al abrirlo,
  // pero un fallo de la API de inventario no puede vaciar el catálogo en el móvil.
  const inDirectory=!!officialPath&&/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(officialPath);
  const path=inDirectory?officialPath:'';
  const analysisPath=fromCatalog(state.catalog.analisis,t);
  const auditPath=fromCatalog(state.catalog.auditorias,t);
  const v=path?'visor.html?path='+encodeURIComponent(path):'visor.html?ticker='+encodeURIComponent(t);
  const a=analysisPath?'analisis-lectura.html?ticker='+encodeURIComponent(t)+'&analisis='+encodeURIComponent(analysisPath):'';
  return {
    valPath:path,official:!!officialPath&&inDirectory,analysisPath,auditPath,
    valoracion:{href:v,help:officialPath&&inDirectory?'Valoración indicada en el catálogo oficial.':'La valoración disponible aún no figura en el catálogo oficial; no se presenta como validada.'},
    analisis:{href:a,help:analysisPath?'Análisis asociado en el catálogo oficial; verificar que corresponda a la misma revisión.':'Biblioteca filtrada por ticker. No se atribuye automáticamente un informe antiguo a esta revisión.'},
    supuestos:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Libro completo original; cambios de entrada requieren guardar y no republican el estudio.'},
    financieros:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Estados financieros originales: resultados, balance, flujos de caja y series por acción.'},
    indicadores:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Rentabilidad, ratios de mercado, eficiencia y salud financiera/deuda.'},
    modelo:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Supuestos, DCF, costo de capital y todas las pestañas originales de la hoja de Google.'},
    revision:{href:'',help:'Observaciones y estado de revisión visual de esta empresa, sin iniciar automáticamente auditorías.'},
    auditoria:{href:'auditorias.html?ticker='+encodeURIComponent(t),help:auditPath?'Auditoría narrativa incluida en el catálogo oficial; cotejar dictamen y revisión con la valoración. Auditoría integral disponible desde la página de auditorías.':'No hay auditoría narrativa oficial para esta empresa. La página indica el estado real, sin sustituirla por otra empresa.'},
    auditoriaIntegral:{href:'auditoria-integral.html?ticker='+encodeURIComponent(t),help:'Auditoría integral DCF, supuestos, materialidad y dictamen técnico, filtrada por empresa. No sustituye la auditoría narrativa del expediente.'},
    sensibilidades:{href:v,help:'Sensibilidades DCF: consultar las matrices de la valoración oficial y la hoja fuente. Recalcular en el Visor es una simulación, no edita el expediente.'},
    sensibilidadMultiples:{href:'auditoria-multiplos.html?ticker='+encodeURIComponent(t),help:'Sensibilidades por múltiplo en el escenario Base; no reemplazan las matrices prioritarias del DCF.'}
  };
}

// Se muestra por encima de las pestañas, siempre vinculado al JSON oficial del catálogo.
// Nunca usa una revisión distinta ni convierte una cotización guardada en precio «actual».
async function loadMosSummary(t,p,requestId){
  const host=el('mosSummary');
  if(!p.valPath||typeof JmrMosSummary==='undefined')return;
  let rec;
  try{
    rec=await fetchJSON(RAW+p.valPath);
    if(state.ticker!==t||state.mosRequest!==requestId)return;
    if(rec.ticker&&String(rec.ticker).toUpperCase()!==t)throw new Error('Ticker diferente del catálogo');
    state.valuationRecord=rec;
    if(state.view==='sensibilidades')el('inlinePanel').innerHTML=sensitivityHtml(rec);
    const reference=Number(rec.precioAnalisis??rec.precio);
    const validRef=Number.isFinite(reference)&&reference>0?reference:null;
    const summary=JmrMosSummary.render(host,rec,{price:validRef,latest:false});
    if(!summary)return;
    // Un precio COP no se compara con una cotización USD. La API solo se usa en fichas USD.
    if(String(rec.currency||rec.moneda||'USD').toUpperCase()==='COP')return;
    try{
      const resp=await fetch('/api/quotes?symbols='+encodeURIComponent(t),{cache:'no-store',credentials:'same-origin'});
      if(!resp.ok)throw new Error('Sin cotización');
      const body=await resp.json(),last=Number(body?.prices?.[t]);
      if(state.ticker!==t||state.mosRequest!==requestId)return;
      if(Number.isFinite(last)&&last>0){
        const at=body.asOf&&Number.isFinite(Date.parse(body.asOf))?
          new Date(body.asOf).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'}):'fecha no disponible';
        JmrMosSummary.render(host,rec,{price:last,latest:true,source:body.source||'API de cotizaciones',asOf:at});
      }
    }catch(_){/* Se conserva explícitamente el precio de referencia del estudio. */}
  }catch(_){if(state.ticker===t&&state.mosRequest===requestId)host.hidden=true;}
}

function openCompany(input){
  const t=valid(input);
  if(!t){status('Ticker inválido. Usa letras, números, punto, guion o subrayado.','error');return;}
  state.ticker=t;state.loc=null;state.reviewSha=null;const mosRequest=++state.mosRequest;el('ticker').value=t;
  el('mosSummary').hidden=true;
  state.valuationRecord=null;state.sheet='';state.frameMode='';state.sheetByView={};
  renderCatalogCards();
  el('reviewPanel').hidden=true;
  el('reviewSaveStatus').textContent='';
  const u=new URL(location.href);u.searchParams.set('ticker',t);history.replaceState({},'',u.pathname+u.search+u.hash);
  el('companyTitle').textContent='Expediente '+t;
  el('companyLogo').replaceChildren(companyLogo(t,'overview'));
  const p=pages(t);
  if(!p.official){
    el('dossier').hidden=true;el('empty').hidden=false;
    el('empty').textContent='No hay una valoración vigente en el catálogo oficial para '+t+'. Consulta el archivo histórico por separado; no se mezclará con la ficha activa.';
    status(t+' no figura con una valoración vigente en el catálogo.','warning');return;
  }
  loadAuditRequest(t,p);
  el('revisionNotice').textContent=p.analysisPath
    ? 'Ficha vigente · Análisis y valoración asociados al catálogo. Auditoría: '+(p.auditPath?'disponible para consulta':'pendiente')+'.'
    : 'Valoración en catálogo; análisis fundamental pendiente de publicación. No se muestra un documento anterior como vigente.';
  el('dossier').hidden=false;el('empty').hidden=true;
  el('sheetLink').hidden=false;el('sheetLink').href=p.supuestos.href;
  readAuditNotes(t);
  loadMosSummary(t,p,mosRequest).catch(()=>{});
  showView(DOSSIER_VIEWS.includes(state.view)?state.view:'analisis');
  if(!p.official)status(t+' · Sin entrada oficial completa de valoración en catálogo; consulta disponible con reservas.','warning');
  else status(t+' · Valoración en catálogo; análisis y auditoría deben cotejarse con esa misma revisión.');
}

function updateDossierLocation(view,sheet){
  const url=new URL(location.href);
  url.searchParams.set('seccion',view);
  if(sheet && SHEETS_BY_VIEW[view])url.searchParams.set('sheet',sheet);
  else url.searchParams.delete('sheet');
  history.replaceState({},'',url.pathname+url.search+url.hash);
}
function safeSheetTitle(value){return String(value||'').replace(/[<>]/g,'');}
function currentSheet(view){
  const options=SHEETS_BY_VIEW[view]||[];
  const requested=state.sheetByView[view]||(!state.sheet&&view===state.view?params.get('sheet'):'');
  return options.includes(requested)?requested:options[0];
}
function renderSheetSubtabs(view){
  const host=el('sheetSubtabs'),info=el('sheetGroupInfo');
  const names=SHEETS_BY_VIEW[view];
  host.replaceChildren();
  host.hidden=!names;
  info.hidden=!names;
  if(!names)return;
  const current=currentSheet(view);
  const titles={financieros:'Estados financieros: informes originales anuales/LTM y series por acción.',
    indicadores:'Ratios y calidad financiera: valoración de mercado, márgenes, eficiencia y deuda.',
    modelo:'Hojas principales; el selector dentro del modelo permite consultar las 46 pestañas y anexos, incluidas las ocultas.'};
  info.textContent=titles[view];
  names.forEach(name=>{
    const button=document.createElement('button');
    button.type='button';button.dataset.sheet=name;button.textContent=name;
    button.classList.toggle('active',name===current);
    button.setAttribute('aria-pressed',String(name===current));
    button.addEventListener('click',()=>{state.sheetByView[view]=name;showView(view);});
    host.appendChild(button);
  });
}
function sensitivityHtml(rec){
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!rec)return '<p class="status-note">Cargando sensibilidades de la valoración oficial…</p>';
  const mats=rec.sensibilidadDCF?.matrices||[];
  const base=rec.valorEsperado?.dcfBase??rec.valorPrincipal;
  const fmt=n=>typeof n==='number'&&isFinite(n)?n.toLocaleString('es-CO',{maximumFractionDigits:2,minimumFractionDigits:2}):'N/D';
  let parts=['<h3>DCF · sensibilidades del escenario Base</h3><p>Valores por acción calculados en el modelo, no simulados en la página. La celda central debe coincidir con el DCF Base oficial.</p>'];
  if(!mats.length)parts.push('<p class="status-note">No hay matrices DCF certificadas en esta revisión.</p>');
  mats.forEach((m,i)=>{
    const rows=m.valores||[],rr=m.ejeFilas||[],cc=m.ejeColumnas||[];
    const valid=m.centroConciliado===true && rows.length===5 && rr.length===5 && cc.length===5 &&
      rows.every(r=>Array.isArray(r)&&r.length===5&&r.every(v=>typeof v==='number'&&isFinite(v))) &&
      typeof base==='number' && Math.abs(rows[2][2]-base)<.05;
    parts.push('<article><h3>'+esc(m.nombre||('Matriz '+(i+1)))+'</h3>');
    if(!valid){parts.push('<p class="status-note">Matriz no mostrada: centro o celdas sin conciliación con la revisión activa.</p></article>');return;}
    parts.push('<div class="sensitivity-table-scroll"><table><thead><tr><th>Supuesto ↓ / →</th>'+cc.map(v=>'<th>'+esc(fmt(v*100))+'%</th>').join('')+'</tr></thead><tbody>');
    rows.forEach((row,ri)=>{
      parts.push('<tr><th>'+esc(fmt(rr[ri]*100))+'%</th>'+
        row.map((v,ci)=>'<td'+(ri===2&&ci===2?' class="base-matrix"':'')+'>'+esc(fmt(v))+'</td>').join('')+'</tr>');
    });
    parts.push('</tbody></table></div><p>Centro Base: US$'+esc(fmt(base))+'. Ejes en % de los supuestos indicados por el título.</p></article>');
  });
  const mult=rec.sensibilidadMultiples;
  parts.push('<h3>Sensibilidades de múltiplos</h3>');
  if(mult?.controlesOK===0){
    parts.push('<p class="status-note">No certificadas en esta revisión: '+esc(mult.noDisponibles||0)+
      ' métodos pendientes. No se generan sensibilidades con anclas sin validar.</p>');
  }else if(mult?.controles?.length){
    parts.push('<p>Disponibilidad de los métodos en el archivo oficial:</p><ul>'+
      mult.controles.map(x=>'<li>'+esc(x.metodo)+': '+esc(x.estado||'N/D')+'</li>').join('')+'</ul>');
  }else parts.push('<p class="status-note">Esta revisión no contiene sensibilidades por múltiplos verificables.</p>');
  return parts.join('');
}
function selectWorkbookSheet(view,name){
  const frame=el('viewFrame');
  if(!SHEETS_BY_VIEW[view].includes(name))return;
  state.sheet=name;state.sheetByView[view]=name;
  const href='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent(name)+'&embedded=1&seccion='+view;
  const open=el('openOriginal');
  open.href='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent(name);
  open.textContent='Abrir hoja completa en otra pestaña ↗';open.hidden=false;
  const existing=frame.getAttribute('src')||'';
  // Reutilizar el lector ya cargado: no volver a descargar las 46 hojas al cambiar de tabla.
  if(state.frameMode==='workbook'&&existing.includes('editor-hoja.html?ticker='+encodeURIComponent(state.ticker))){
    frame.contentWindow?.postMessage({type:'jmr-select-source-sheet',ticker:state.ticker,sheet:name},location.origin);
  }else{
    state.frameMode='workbook';frame.setAttribute('src',href);
  }
}
function showView(view){
  if(!state.ticker||!DOSSIER_VIEWS.includes(view))return;
  state.view=view;
  const p=pages(state.ticker);
  document.querySelectorAll('[data-view]').forEach(button=>{
    const selected=button.dataset.view===view;
    button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));
    button.tabIndex=selected?0:-1;
  });
  renderSheetSubtabs(view);
  const frame=el('viewFrame'),inline=el('inlinePanel'),open=el('openOriginal'),help=el('viewHelp');
  const review=el('reviewPanel');
  review.hidden=view!=='revision'||!state.loc;
  if(view==='revision')el('reviewForm').hidden=!state.loc?.revision||state.reviewLoading;
  help.textContent=(p[view]||{}).help||'Información de la revisión activa de la empresa.';
  const isWorkbook=!!SHEETS_BY_VIEW[view];
  const isSensitivity=view==='sensibilidades';
  const isRevision=view==='revision';
  frame.hidden=isSensitivity||isRevision;
  inline.hidden=!isSensitivity&&!isRevision;
  open.hidden=isSensitivity||isRevision;
  if(isWorkbook){
    const sheet=currentSheet(view);
    selectWorkbookSheet(view,sheet);
    updateDossierLocation(view,sheet);
  }else if(isSensitivity){
    inline.innerHTML=sensitivityHtml(state.valuationRecord);
    updateDossierLocation(view);
  }else if(isRevision){
    if(!state.loc)inline.innerHTML='<p class="status-note">Cargando la revisión y las observaciones oficiales…</p>';
    else inline.innerHTML='<p class="status-note">Las observaciones se guardan por ticker y revisión. Si no hay auditoría publicada, su estado permanece pendiente; no se crea un resultado ficticio.</p>';
    updateDossierLocation(view);
  }else if(view==='analisis'&&!p.analysisPath){
    frame.hidden=true;inline.hidden=false;open.hidden=true;
    inline.innerHTML='<p class="status-note">Análisis fundamental no publicado para esta revisión. La valoración y las hojas pueden consultarse en sus pestañas.</p>';
    updateDossierLocation(view);
  }else{
    const route=p[view];
    if(!route?.href){frame.hidden=true;inline.hidden=false;open.hidden=true;inline.textContent='Vista no disponible para esta revisión.';return;}
    state.frameMode=view;
    if(frame.getAttribute('src')!==route.href)frame.setAttribute('src',route.href);
    open.href=route.href;open.textContent=view==='analisis'?'Abrir análisis como documento independiente ↗':'Abrir valoración completa ↗';
    updateDossierLocation(view);
  }
}
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
    const legacy=localStorage.getItem('jmr-audit-draft-v1:'+loc.valoracionPath.split('/').pop());
    if(legacy)return {estadoRevision:'EN_REVISION',puntos:legacy,actualizadoEn:new Date().toISOString(),revisionId:loc.revision};
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
  if(r.status===404){
    // Compatibilidad con las solicitudes previas escritas por nombre de archivo.
    const legacyPath='auditorias/solicitudes/'+loc.valoracionPath.split('/').pop();
    const old=await fetch(CONTENTS+legacyPath+'?ref=main',{cache:'no-store'});
    if(old.status===404)return {body:null,sha:null};
    if(!old.ok)throw new Error('No se pudo comprobar la solicitud histórica: HTTP '+old.status);
    const file=await old.json();
    const past=JSON.parse(GhOAuth.b64DecodeUnicode(String(file.content||'').replace(/\s/g,'')));
    if(past.schema==='jmr-audit-request-v1'&&past.ticker===loc.ticker&&past.valuationPath===loc.valoracionPath){
      return {body:{estadoRevision:'EN_REVISION',puntos:String(past.observaciones||''),actualizadoEn:past.updatedAt||past.createdAt||'',revisionId:loc.revision},sha:null};
    }
    throw new Error('La nota histórica no corresponde a esta revisión.');
  }
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
    if(state.view==='revision')showView('revision');
    el('reviewPanel').hidden=state.view!=='revision';
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
    if(state.view==='revision')el('inlinePanel').innerHTML='<p class="status-note">'+(p.auditPath?'Auditoría narrativa disponible en el catálogo; consúltala desde el histórico de auditorías.':'Auditoría económica aún no realizada. Esta ficha no presenta una auditoría inexistente.')+'</p>';
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

el('catalogSearch').addEventListener('input',renderCatalogCards);
el('lookup').addEventListener('submit',e=>{e.preventDefault();openCompany(el('ticker').value);});
el('reload').addEventListener('click',loadInventory);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
window.addEventListener('message',event=>{
  const frame=el('viewFrame'),data=event.data||{};
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(data.type!=='jmr-sheet-selected'||data.ticker!==state.ticker||typeof data.sheet!=='string')return;
  if(!SHEETS_BY_VIEW[state.view])return;
  // Un cambio del selector de las 46 hojas se refleja en la ruta del expediente.
  state.sheet=data.sheet;
  if(SHEETS_BY_VIEW[state.view].includes(data.sheet))state.sheetByView[state.view]=data.sheet;
  document.querySelectorAll('#sheetSubtabs button[data-sheet]').forEach(button=>{
    const selected=button.dataset.sheet===data.sheet;
    button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
  });
  updateDossierLocation(state.view,data.sheet);
  const open=el('openOriginal');
  open.href='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent(data.sheet);
});
el('viewFrame').addEventListener('load',function(){
  // Mismo origen: ocultar solamente la navegación duplicada, sin tocar los
  // botones, selectores, formularios o cálculos de la página original.
  try{
    const doc=this.contentDocument;
    if(state.frameMode==='workbook'&&state.sheet)
      this.contentWindow?.postMessage({type:'jmr-select-source-sheet',ticker:state.ticker,sheet:state.sheet},location.origin);
    if(!doc||doc.getElementById('jmr-dossier-embed'))return;
    const style=doc.createElement('style');style.id='jmr-dossier-embed';
    style.textContent='nav.appnav,#jmr-market-nav{display:none!important}';
    // Ocultar solamente la navegación redundante de vistas técnicas reutilizadas.
    if(doc.location.pathname.endsWith('/research.html')){
      style.textContent+='body.research-page .hero,body.research-page .disclaimer,body.research-page .tabs,body.research-page #ghConnectBanner,body.research-page .setup-panel,body.research-page .analysis-actions,body.research-page #editorToolbar{display:none!important}';
      style.textContent+='body.research-page .wrap{max-width:none;width:100%;padding:0 12px 32px}body.research-page .editor-grid{display:block!important}body.research-page .preview-shell{max-width:none;width:100%;margin:0}body.research-page .panel[data-panel=editor]{padding:0;border:0;display:block}';
    }
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
