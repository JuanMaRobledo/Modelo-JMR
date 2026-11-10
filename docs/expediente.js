/* Expediente JMR: orquestación visual. Nunca recalcula, modifica ni publica valores. */
(function(){
'use strict';
const ROOT='JuanMaRobledo/Modelo-JMR-datos';
const RAW='https://raw.githubusercontent.com/'+ROOT+'/main/';
const CONTENTS='https://api.github.com/repos/'+ROOT+'/contents/';
const el=id=>document.getElementById(id);
const DOSSIER_VIEWS=['analisis','valoracion','financieros','indicadores','modelo','sensibilidades','revision'];
// Candidatas A-1.2 en revisión visual, aún fuera del catálogo. Vacío desde 3-nov-2026: META y NVDA
// fueron sustituidas por sus revisiones 20261101 y XP-20261031-A12-R1 ya es la vigente del catálogo.
// Las copias de docs/revisiones-a12/ se conservan como evidencia (Modelo-JMR-datos/registro/REVISIONES.md).
const A12_REVIEW_TICKERS=new Set([]);
const isA12Review=t=>A12_REVIEW_TICKERS.has(t)&&params.get('candidato')==='A12';
const params=new URLSearchParams(location.search);
// Alias de enlaces antiguos o escritos a mano: «múltiplos» es una subpestaña de Valoración.
if(params.get('seccion')==='multiplos'){params.set('seccion','valoracion');params.set('metodo','multiplos');}
const initialView=DOSSIER_VIEWS.includes(params.get('seccion'))?params.get('seccion'):'analisis';
const SHEETS_BY_VIEW={
  financieros:['Income Statement','Balance Sheet','Cash Flow Statement','Trailing 12 month Worskheet','Por acción','Dividendos'],
  indicadores:['Trailing Valuation','Márgenes','Eficiencia de capital','Salud Financiera','Crecimiento y Márgenes'],
  modelo:['Input sheet','Valuation output','Resumen de Valoración','Escenarios e historias',
    'Cost of capital worksheet','Descuento de múltiplos','Sensibilidad DCF']
};
const displayFromUrl=params.get('modo')==='edicion'?'edicion':'visor';
const isReboot=()=>state.valuationRecord?.contratoLibros==='jmr-reboot-3libros-v1'||(state.valuationRecord?.perfil_valoracion==='Reboot'&&Boolean(state.valuationRecord?.libros?.dcf));
const sourceBookForView=view=>view==='financieros'||view==='indicadores'?'historicos':
  (isReboot()&&view==='valoracion'&&state.valuationMode==='multiplos')?'multiplos':'valoracion';
// Reboot reparte las pestañas en libros distintos: Históricos, DCF Base y Múltiplos.
const REBOOT_SHEETS={
  financieros:['Income Statement','Balance Sheet','Cash Flow Statement','Por acción','Dividendos'],
  indicadores:['Trailing Valuation','Márgenes','Eficiencia de capital','Salud Financiera'],
  modelo:['Presentación','Resumen de valoraciones','Input sheet','Valuation output','Cost of capital worksheet','Sensibilidades DCF']
};
const viewSheets=view=>isReboot()&&REBOOT_SHEETS[view]?REBOOT_SHEETS[view]:SHEETS_BY_VIEW[view];
const state={displayMode:displayFromUrl,workbookDisplayMode:'',workbookBook:'',catalog:{valoraciones:[],analisis:[],auditorias:[]},files:[],ticker:'',view:initialView,ready:false,loc:null,reviewSha:null,reviewLoading:false,mosRequest:0,valuationRecord:null,frameMode:'',sheet:'',sheetByView:{},sensitivityMode:'sensibilidades',valuationMode:params.get('metodo')==='multiplos'?'multiplos':'dcf'};
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
function controlModeloA(t){
  const path=fromCatalog(state.catalog.valoraciones,t);
  const control=state.catalog.controlModeloA;
  // Compatible con catálogos anteriores: no ocultar toda la app durante el despliegue coordinado.
  if(!control || !control.empresas)return {visible:true,estado:'SIN_CONTROL',detalle:'Método por verificar en esta revisión.'};
  const item=control.empresas[t];
  if(!item || !path || item.rutaValoracion!==path)
    return {visible:false,estado:'SIN_CLASIFICAR',detalle:'Revisión nueva o sin clasificación metodológica; verificar antes de publicar.'};
  if(!['A-1.2','Floyd','Reboot'].includes(item.metodo) || item.estado==='EXCLUIDA_HASTA_REHACER_A')
    return {visible:false,estado:'EXCLUIDA_HASTA_REHACER_A',detalle:'Versión anterior al Modelo A. Rehacer y conservar la revisión previa en el histórico.'};
  return {visible:true,metodo:item.metodo,estado:item.estado,detalle:item.diagnostico||'Revisión pendiente.',multiplos:item.multiplos};
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
    const tickers=[...new Set((state.catalog.valoraciones||[]).map(path=>tickerFromName(String(path).split('/').pop())).filter(Boolean))].filter(t=>controlModeloA(t).visible).sort();
    el('tickers').replaceChildren(...tickers.map(t=>{const opt=document.createElement('option');opt.value=t;return opt;}));
    renderCatalogCards();
    loadCardValues(tickers);
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
  const tickers=[...new Set(paths.map(p=>tickerFromName(String(p).split('/').pop())).filter(valid))].filter(t=>controlModeloA(t).visible).sort();
  const matching=tickers.filter(t=>catalogMarket(t)&&(!q||t.includes(q)));
  const chosenMarket=new URLSearchParams(location.search).get('mercado')||'all';
  document.querySelectorAll('#marketFilters [data-market]').forEach(b=>{
    const chosen=b.dataset.market===chosenMarket;
    b.classList.toggle('active',chosen);
    b.setAttribute('aria-pressed',String(chosen));
  });
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
    const values=cardValuesNode(t);
    const badge=values.querySelector('.cv-head');if(badge)head.appendChild(badge);
    card.appendChild(values);
    if(values.dataset.signal)card.dataset.signal=values.dataset.signal;
    // Estado del expediente en etiquetas cortas (antes, una frase larga).
    const supports=document.createElement('ul');supports.className='card-caption';
    const chip=(text,ok)=>{const li=document.createElement('li');li.textContent=text;li.className=ok?'ok':'pending';return li;};
    supports.append(
      chip(controlModeloA(t).estado==='INCOMPLETA_EN_REVISION'?
        ((controlModeloA(t).metodo==='Reboot'?'Floyd R1–R6':controlModeloA(t).metodo==='Floyd'?'Floyd':'Modelo A')+' · EN_REVISIÓN'):
        'Metodología por verificar',false),
      chip(p.analysisPath?'Análisis':'Análisis pendiente',!!p.analysisPath),
      chip(p.auditPath?'Auditoría':'Auditoría pendiente',!!p.auditPath));
    supports.setAttribute('aria-label','Valoración vigente en catálogo; estado del expediente');
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

// Semáforo de las fichas: valor intrínseco (misma base del resumen MOS), precio de hoy
// y zonas Value (70–65 %), Deep Value (60–55 %) y Valoración histórica (50–45 %) del valor intrínseco.
// Gris = el precio no cumple el MOS oficial (precio > valor intrínseco × (1 − MOS)).
const CARD_ZONES=[{key:'value',label:'Value',max:.70,min:.65},{key:'deep',label:'Deep Value',max:.60,min:.55},{key:'hist',label:'Histórica',max:.50,min:.45}];
state.cardData={};
async function loadCardValues(tickers){
  const recs=await Promise.all(tickers.map(async t=>{
    const p=pages(t);if(!p.valPath)return null;
    try{const rec=await fetchJSON(RAW+p.valPath);return [t,rec];}catch(_){return null;}
  }));
  recs.filter(Boolean).forEach(([t,rec])=>{
    const ref=Number(rec.precioAnalisis??rec.precio);
    state.cardData[t]={rec,price:Number.isFinite(ref)&&ref>0?ref:null,live:false};
  });
  renderCatalogCards();
  const usd=Object.keys(state.cardData).filter(t=>String(state.cardData[t].rec.currency||state.cardData[t].rec.moneda||'USD').toUpperCase()!=='COP');
  if(!usd.length)return;
  try{
    const resp=await fetch('/api/quotes?symbols='+encodeURIComponent(usd.join(',')),{cache:'no-store',credentials:'same-origin'});
    if(!resp.ok)return;
    const body=await resp.json();
    usd.forEach(t=>{const last=Number(body?.prices?.[t]);if(Number.isFinite(last)&&last>0){state.cardData[t].price=last;state.cardData[t].live=true;}});
    renderCatalogCards();
  }catch(_){/* Se conserva el precio de referencia del estudio. */}
}
function cardSignal(calc){
  if(!calc||calc.price===null)return {cls:'none',label:'Sin precio'};
  const r=calc.price/calc.base;
  if(r>1-calc.mos)return {cls:'gray',label:'No cumple MOS'};
  if(r<=.50)return {cls:'hist',label:'Zona histórica'};
  if(r<=.60)return {cls:'deep',label:'Zona Deep Value'};
  return {cls:'value',label:'Zona Value'};
}
function cardValuesNode(t){
  const box=document.createElement('div');box.className='card-values';
  const d=state.cardData[t];
  if(!d||typeof JmrMosSummary==='undefined'){box.innerHTML='<span class="card-values-loading">Cargando valores…</span>';return box;}
  const calc=JmrMosSummary.calculate(d.rec,d.price);
  if(!calc){box.innerHTML='<span class="card-values-loading">Valor intrínseco N/D</span>';return box;}
  const cop=/^COP$/i.test(String(d.rec.currency||d.rec.moneda||''));
  const m=n=>n==null?'—':(cop?'COP ':'US$ ')+n.toLocaleString('es-CO',{maximumFractionDigits:cop?0:2,minimumFractionDigits:cop?0:2});
  const sig=cardSignal(calc);
  box.dataset.signal=sig.cls;
  const ratio=calc.price===null?null:calc.price/calc.base;
  const rows=CARD_ZONES.map(z=>{
    const hit=ratio!==null&&ratio<=z.max&&ratio<=1-calc.mos;
    const gap=calc.price===null?'':(ratio<=z.max?(ratio<=1-calc.mos?'dentro':'en zona, sin MOS'):'falta '+((1-calc.base*z.max/calc.price)*100).toLocaleString('es-CO',{maximumFractionDigits:1})+'%');
    return '<li class="cv-zone cv-'+z.key+(hit?' hit':'')+'"><i></i><span>'+z.label+'</span><b>'+m(calc.base*z.min)+'–'+m(calc.base*z.max).replace(/^(COP |US\$ )/,'')+'</b><em>'+gap+'</em></li>';
  }).join('');
  // Potencial = valor intrínseco Base / precio − 1: verde si el precio está por debajo del valor.
  const up=calc.price?calc.base/calc.price-1:null;
  const upTxt=up===null?'—':(up>=0?'+':'')+(up*100).toLocaleString('es-CO',{maximumFractionDigits:1,minimumFractionDigits:1})+' %';
  box.innerHTML='<div class="cv-head"><span class="cv-light" title="'+sig.label+'"></span><strong>'+sig.label+'</strong></div>'+
    '<dl><div><dt>Valor intrínseco</dt><dd>'+m(calc.base)+'</dd></div><div><dt>'+(d.live?'Precio hoy':'Precio ref.')+'</dt><dd>'+m(calc.price)+'</dd></div>'+
    '<div class="cv-up '+(up===null?'':up>=0?'pos':'neg')+'"><dt>Potencial</dt><dd>'+upTxt+'</dd></div></dl>'+
    '<ul>'+rows+'</ul>';
  return box;
}

function pages(t){
  const officialPath=fromCatalog(state.catalog.valoraciones,t);
  // La ruta del catálogo es canónica; si falta el JSON real se mostrará un error al abrirlo,
  // pero un fallo de la API de inventario no puede vaciar el catálogo en el móvil.
  const inDirectory=!!officialPath&&/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(officialPath);
  const path=inDirectory?officialPath:'';
  const analysisPath=fromCatalog(state.catalog.analisis,t);
  const auditPath=fromCatalog(state.catalog.auditorias,t);
  const v=(path?'visor.html?path='+encodeURIComponent(path):'visor.html?ticker='+encodeURIComponent(t))+'&embed=expediente';
  const a=isA12Review(t)?'analisis-a12-revision.html?ticker='+encodeURIComponent(t):analysisPath?'analisis-lectura.html?ticker='+encodeURIComponent(t)+'&analisis='+encodeURIComponent(analysisPath):'';
  return {
    valPath:path,official:!!officialPath&&inDirectory,analysisPath,auditPath,
    valoracion:{href:v,help:officialPath&&inDirectory?'Valoración indicada en el catálogo oficial.':'La valoración disponible aún no figura en el catálogo oficial; no se presenta como validada.'},
    analisis:{href:a,help:isA12Review(t)?'Análisis Método A-1.2 candidato EN_REVISIÓN, no publicado en el catálogo financiero oficial. Solo lectura; cuatro escenarios y niveles 1–2. Los demás paneles conservan la valoración vigente.':analysisPath?'Análisis asociado en el catálogo oficial; verificar que corresponda a la misma revisión.':'Biblioteca filtrada por ticker. No se atribuye automáticamente un informe antiguo a esta revisión.'},
    supuestos:{href:'editor-hoja.html?ticker='+encodeURIComponent(t),help:'Libro completo original; cambios de entrada requieren guardar y no republican el estudio.'},
    financieros:{href:'editor-hoja.html?ticker='+encodeURIComponent(t)+'&libro=historicos',help:'Estados financieros originales: resultados, balance, flujos de caja y series por acción.'},
    indicadores:{href:'editor-hoja.html?ticker='+encodeURIComponent(t)+'&libro=historicos',help:'Rentabilidad, ratios de mercado, eficiencia y salud financiera/deuda.'},
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
    updateNativeLink();
    if(typeof JmrMultiplesPanel!=='undefined'){
      el('valuationSummary').innerHTML=JmrMultiplesPanel.summary(rec);
      if(state.view==='valoracion'&&state.valuationMode==='multiplos')el('inlinePanel').innerHTML=JmrMultiplesPanel.render(rec);
    }
    if(state.view==='sensibilidades'){el('inlinePanel').innerHTML=sensitivityHtml(rec);paintSensitivity(el('inlinePanel'),state.sensitivityRef);}
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

function hasUnsavedWorkbookEdits(){
  try{
    return state.frameMode==='workbook'&&!!el('viewFrame').contentWindow?.JmrSheetEditor?.hasPendingEdits?.();
  }catch(_){return false;}
}
function preventLosingWorkbookEdits(){
  if(!hasUnsavedWorkbookEdits())return false;
  status('Hay cambios financieros sin guardar. Guarda o descártalos antes de cambiar de empresa, pestaña o modo.','warning');
  return true;
}
function openCompany(input){
  const t=valid(input);
  if(!t){status('Ticker inválido. Usa letras, números, punto, guion o subrayado.','error');return;}
  const changedCompany=!!state.ticker&&state.ticker!==t;
  if(changedCompany&&preventLosingWorkbookEdits())return;
  if(changedCompany)state.valuationMode='dcf';
  state.ticker=t;state.loc=null;state.reviewSha=null;const mosRequest=++state.mosRequest;el('ticker').value=t;
  el('mosSummary').hidden=true;
  state.valuationRecord=null;state.sheet='';state.frameMode='';state.workbookDisplayMode='';state.workbookBook='';state.sheetByView={};
  // Respetar ?modo=edicion al abrir un vínculo directo. Al cambiar de
  // empresa, volver a Visor para evitar entrar editando otra hoja.
  if(changedCompany)state.displayMode='visor';
  renderCatalogCards();
  el('reviewPanel').hidden=true;
  el('reviewSaveStatus').textContent='';
  const u=new URL(location.href);u.searchParams.set('ticker',t);history.replaceState({},'',u.pathname+u.search+u.hash);
  el('companyTitle').textContent='Expediente '+t;
  const a12switch=el('candidateSwitch');
  if(a12switch){a12switch.hidden=!A12_REVIEW_TICKERS.has(t);a12switch.href=isA12Review(t)?'expediente.html?ticker='+encodeURIComponent(t)+'&seccion=analisis':'expediente.html?ticker='+encodeURIComponent(t)+'&seccion=analisis&candidato=A12';a12switch.textContent=isA12Review(t)?'Volver al análisis vigente':'Ver análisis A-1.2 EN_REVISIÓN';}
  el('companyLogo').replaceChildren(companyLogo(t,'overview'));
  const p=pages(t);
  const metodo=controlModeloA(t);
  if(!metodo.visible){
    el('dossier').hidden=true;el('catalogSection').hidden=false;el('empty').hidden=false;
    el('empty').textContent=t+' no aparece en el análisis vigente: '+metodo.detalle+' Puedes consultar su expediente anterior desde Histórico.';
    status(t+' · '+metodo.estado,'warning');
    return;
  }
  if(!p.official){
    el('dossier').hidden=true;el('empty').hidden=false;
    el('empty').textContent='No hay una valoración vigente en el catálogo oficial para '+t+'. Consulta el archivo histórico por separado; no se mezclará con la ficha activa.';
    status(t+' no figura con una valoración vigente en el catálogo.','warning');return;
  }
  loadAuditRequest(t,p);
  el('revisionNotice').textContent=p.analysisPath
    ? 'Ficha vigente · Análisis y valoración asociados al catálogo. Auditoría: '+(p.auditPath?'disponible para consulta':'pendiente')+'.'
    : 'Valoración en catálogo; análisis fundamental pendiente de publicación. No se muestra un documento anterior como vigente.';
  if(metodo.estado==='INCOMPLETA_EN_REVISION')el('revisionNotice').textContent+=' · MODELO A INCOMPLETO / EN_REVISIÓN: faltan conciliaciones, múltiplos o controles independientes.';
  if(isA12Review(t))el('revisionNotice').textContent='ANÁLISIS A-1.2 CANDIDATO EN_REVISIÓN, no incorporado al catálogo oficial. La pestaña de análisis muestra el nuevo informe; valoración, hojas y demás pestañas conservan la versión vigente. Auditoría económica pendiente.';
  el('dossier').hidden=false;el('empty').hidden=true;
  el('catalogSection').hidden=true; // Al abrir una empresa, el artículo es lo primero después del buscador.
  if(isA12Review(t)){el('mosSummary').hidden=true;el('mosSummary').replaceChildren();}else loadMosSummary(t,p,mosRequest).catch(()=>{});
  showView(DOSSIER_VIEWS.includes(state.view)?state.view:'analisis');
  if(!p.official)status(t+' · Sin entrada oficial completa de valoración en catálogo; consulta disponible con reservas.','warning');
  else status(t+' · Valoración en catálogo; análisis y auditoría deben cotejarse con esa misma revisión.');
}

function updateDossierLocation(view,sheet){
  const url=new URL(location.href);
  url.searchParams.set('seccion',view);
  if(sheet && viewSheets(view))url.searchParams.set('sheet',sheet);
  else url.searchParams.delete('sheet');
  if(state.displayMode==='edicion')url.searchParams.set('modo','edicion');
  else url.searchParams.delete('modo');
  if(view==='valoracion'&&state.valuationMode==='multiplos')url.searchParams.set('metodo','multiplos');
  else url.searchParams.delete('metodo');
  history.replaceState({},'',url.pathname+url.search+url.hash);
}
function safeSheetTitle(value){return String(value||'').replace(/[<>]/g,'');}
function currentSheet(view){
  const options=viewSheets(view)||[];
  const requested=state.sheetByView[view]||(!state.sheet&&view===state.view?params.get('sheet'):'');
  return requested&&typeof requested==='string'&&requested.length<=140?requested:options[0];
}
function renderSheetSubtabs(view){
  const host=el('sheetSubtabs'),info=el('sheetGroupInfo');
  const names=viewSheets(view);
  host.replaceChildren();
  host.hidden=!names;
  info.hidden=!names;
  if(!names)return;
  const current=currentSheet(view);
  const titles={financieros:'Estados financieros: informes originales anuales/LTM y series por acción.',
    indicadores:'Ratios y calidad financiera: valoración de mercado, márgenes, eficiencia y deuda.',
    modelo:'Hojas principales; el selector dentro del modelo permite consultar todas las pestañas (47 en el perfil vigente, con DCF FCFE solo informativa) y anexos, incluidas las ocultas.'};
  info.textContent=titles[view];
  const choices=names.includes(current)?names:[...names,current];
  choices.forEach(name=>{
    const button=document.createElement('button');
    button.type='button';button.dataset.sheet=name;button.textContent=name;
    button.classList.toggle('active',name===current);
    button.setAttribute('aria-pressed',String(name===current));
    button.addEventListener('click',()=>{if(preventLosingWorkbookEdits())return;state.sheetByView[view]=name;showView(view);});
    host.appendChild(button);
  });
}
function normalizeDcfMatrices(s){
  if(!s||typeof s!=='object')return [];
  // Formatos guardados en Modelo-JMR-datos: lista {nombre|title, ejeFilas|rows, ejeColumnas|columns,
  // valores|values}, diccionario {clave:{rows,columns,values}}, matriz/wacc/g antiguos y FCFE Ke×g.
  // Solo se adaptan celdas existentes; nunca se crean números ni se presume la conciliación.
  const flag=v=>v===true||v===false?v:null;
  const LABELS={waccVsTerminalGrowth:['WACC × crecimiento terminal','WACC','g terminal'],
    waccVsTerminalROIC:['ROIC terminal × crecimiento terminal','ROIC terminal','g terminal'],
    crecimientoVsMargen:['Crecimiento 1-5 × margen EBIT terminal','Crecimiento ventas (CAGR 1-5)','Margen EBIT terminal']};
  const split=t=>String(t||'').split(/\s+[×x]\s+/);
  const named=(m,name,key)=>{
    const lab=LABELS[key]||[];
    const title=m.nombre||m.title||lab[0]||name;
    const parts=split(title);
    return {nombre:title,ejeFilas:m.ejeFilas||m.rows,ejeColumnas:m.ejeColumnas||m.columns,valores:m.valores||m.values,
      etiquetaFilas:m.rowsLabel||lab[1]||(parts.length===2?parts[0]:''),
      etiquetaColumnas:m.columnsLabel||lab[2]||(parts.length===2?parts[1]:''),
      centroConciliado:flag(m.centroConciliado)??flag(s.centroConciliado)};
  };
  const result=[];
  if(Array.isArray(s.matrices))s.matrices.forEach((m,i)=>{if(m&&typeof m==='object')result.push(named(m,'Matriz DCF '+(i+1)));});
  else if(s.matrices&&typeof s.matrices==='object')
    Object.entries(s.matrices).forEach(([k,m],i)=>{if(m&&typeof m==='object')result.push(named(m,'Matriz DCF '+(i+1),k));});
  const raw=s.matriz;
  if(Array.isArray(raw))result.push(named({ejeFilas:s.wacc,ejeColumnas:s.g,valores:raw},'WACC × crecimiento terminal','waccVsTerminalGrowth'));
  else if(raw&&typeof raw==='object'&&Array.isArray(raw.valores))
    result.push(named({ejeFilas:raw.wacc||raw.ejeFilas,ejeColumnas:raw.g||raw.ejeColumnas,valores:raw.valores},'WACC × crecimiento terminal','waccVsTerminalGrowth'));
  if(Array.isArray(s.valorPorAccion)&&Array.isArray(s.KeEscenarios)&&Array.isArray(s.gEscenarios))
    result.push(named({ejeFilas:s.KeEscenarios,ejeColumnas:s.gEscenarios,valores:s.valorPorAccion,rowsLabel:'Ke',columnsLabel:'g terminal'},'Ke × crecimiento terminal · FCFE'));
  return result;
}
// El expediente muestra las matrices Base de la misma
// revisión/hoja y con el centro FY+3 reproducible. No crea precios ni
// interpreta N/A como cero; INTEGRADO_EN_REVISION NO es auditoría económica.
function nativeMultiplesHtml(rec){
  const s=rec?.sensibilidadMultiples;
  const floyd=['Floyd','Reboot'].includes(rec?.perfil_valoracion);
  const bank=s?.contrato==='review-relative-v1'&&s.tipo==='MULTIPLOS_BANCARIOS';
  const reboot=floyd && rec?.contratoLibros==='jmr-reboot-3libros-v1' && s?.contrato==='reboot-atlas-cinco-v1';
  if(!s||(!bank&&!reboot&&s.contrato!=='base-native-five-priority-v1'))return '';
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=x=>typeof x==='number'&&Number.isFinite(x)?
    x.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}):'N/D';
  const sourceOk=s.revisionId===rec.revisionId && s.sourceSheetId===rec.sheet_id &&
    /^[a-f0-9]{64}$/.test(s.resultadosSha256||'');
  if(!sourceOk)return '<p class="status-note">Sensibilidades de múltiplos ocultas: revisión, hoja o fotografía no coincide con el expediente.</p>';
  if(s.estadoPublicacion!=='INTEGRADO_EN_REVISION'||s.controlesTecnicosAprobados!==true)
    return '<p class="status-note">Matrices candidatas sin validación técnica: no mostradas como resultados oficiales.</p>';
  const core=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF'];
  const optional=['P/V','P/BV'];
  const expected=bank?['P/E','P/FCFE','P/BV']:[
    ...core,...(floyd?optional.filter(name=>Array.isArray(s.matrices)&&s.matrices.some(m=>m?.metodo===name)):optional)
  ];
  if(!Array.isArray(s.matrices)||s.matrices.length!==expected.length||
     !s.matrices.every((m,i)=>m?.metodo===expected[i]&&m.escenario==='base'))
    return '<p class="status-note">'+(bank?'Tres sensibilidades bancarias':floyd?'Sensibilidades Base Floyd':'Siete sensibilidades Base')+' incompletas o desordenadas: no se muestran matrices.</p>';
  if(bank&&(s.certificado!==false||s.pesoEnDCFPrincipal!==0||
     !s.matrices.every(m=>m.estado==='OK'&&m.peso===0&&m.ancla==='PROVISIONAL'&&m.anclaCertificada===false)))
    return '<p class="status-note">Contrastes bancarios sin reservas y peso cero conciliados: matrices no mostradas.</p>';
  let result='<p class="status-note">Matrices Base integradas técnicamente en EN_REVISION. Son sensibilidades del valor presente por acción de FY+3, no una auditoría económica ni un cambio del DCF.</p>';
  if(bank)result+='<p class="status-note">Contrastes bancarios provisionales · peso 0 % · anclas no certificadas. '+esc(s.advertencia||'')+'</p>';
  const multipleRows=bank||floyd;
  for(const m of s.matrices){
    result+='<section class="jmr-native-matrix sens-card"><h4>'+esc(m.metodo)+'</h4>';
    if(m.estado==='N/D'&&reboot){
      const detail=rec.descuentoMultiples?.metodos?.find(x=>x.nombre===m.metodo);
      if(m.peso===0&&detail?.peso===0&&m.matriz===null&&m.centro===null&&typeof m.motivo==='string'&&m.motivo.length>=25)
        result+='<p>N/D · sin ancla fiable · peso 0 %. '+esc(m.motivo)+'</p>';
      else result+='<p class="status-note">N/D sin causa o peso cero verificables: matriz no mostrada.</p>';
    }else if(m.estado==='N/A'){
      const detail=rec.descuentoMultiples?.metodos?.find(x=>x.nombre===m.metodo);
      if(detail?.peso===0&&m.estadoFuente==='N/D'&&m.motivo)
        result+='<p> N/A · fuente N/D · peso 0 %. '+esc(m.motivo)+'</p>';
      else result+='<p class="status-note">N/A sin causa y ponderación conciliadas: matriz no mostrada.</p>';
    }else if(m.estado==='OK'){
      const nums=a=>Array.isArray(a)&&a.length===5&&a.every(n=>typeof n==='number'&&Number.isFinite(n));
      const vpFY3=rec.descuentoMultiples?.metodos?.find(x=>x.nombre===m.metodo)?.base?.vp?.[2];
      const valid=nums(m.fundamentalFY3)&&nums(m.multiploElegido)&&
        Array.isArray(m.matriz)&&m.matriz.length===5&&m.matriz.every(nums)&&
        typeof m.centro==='number'&&Number.isFinite(m.centro)&&
        typeof m.vp3Original==='number'&&Number.isFinite(m.vp3Original)&&
        Math.abs(m.matriz[2][2]-m.centro)<=Math.max(.01,Math.abs(m.centro)*1e-8)&&
        Math.abs(m.centro-m.vp3Original)<=Math.max(.01,Math.abs(m.centro)*1e-8)&&
        (!floyd||(Number.isFinite(vpFY3)&&Math.abs(m.centro-vpFY3)<=Math.max(.01,Math.abs(m.centro)*1e-8)));
      if(!valid)result+='<p class="status-note">Matriz ocultada: centro FY+3, ejes o celdas no concilian.</p>';
      else{
        const columnAxis=multipleRows?m.fundamentalFY3:m.multiploElegido;
        const rowAxis=multipleRows?m.multiploElegido:m.fundamentalFY3;
        if(bank)result+='<p class="status-note">'+esc(m.fuenteAncla||'')+' '+esc(m.limitacion||'')+'</p>';
        result+='<p class="sens-axes">'+(multipleRows?'Filas: múltiplo elegido · Columnas: fundamental FY+3':'Filas: fundamental FY+3 · Columnas: múltiplo elegido')+'</p>'+
          '<div class="sensitivity-table-scroll"><table class="jmr-native-matrix-table"><thead><tr><th scope="col">'+(multipleRows?'Múltiplo ↓ · FY+3 →':'FY+3 ↓ · múltiplo →')+'</th>'+
          columnAxis.map(x=>'<th scope="col">'+esc(fmt(x))+(multipleRows?'':'×')+'</th>').join('')+'</tr></thead><tbody>';
        m.matriz.forEach((r,i)=>{result+='<tr><th scope="row">'+esc(fmt(rowAxis[i]))+(multipleRows?'×':'')+'</th>'+
          r.map((n,j)=>'<td data-v="'+n+'"'+(i===2&&j===2?' class="base-matrix"':'')+'>'+esc(fmt(n))+'</td>').join('')+'</tr>';});
        result+='</tbody></table></div><p class="sens-foot">Centro Base · VP FY+3: '+esc(fmt(m.centro))+' por acción.</p>';
      }
    }else result+='<p class="status-note">N/D · sin matriz certificada técnicamente; no equivale a cero.</p>';
    result+='</section>';
  }
  return result;
}
function sensitivityHtml(rec){
  const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!rec)return '<p class="status-note">Cargando sensibilidades de la valoración oficial…</p>';
  const mats=normalizeDcfMatrices(rec.sensibilidadDCF);
  const base=rec.valorEsperado?.dcfBase??rec.valorPrincipal;
  const price=typeof rec.precio==='number'&&isFinite(rec.precio)&&rec.precio>0?rec.precio:null;
  const fmt=n=>typeof n==='number'&&isFinite(n)?n.toLocaleString('es-CO',{maximumFractionDigits:2,minimumFractionDigits:2}):'N/D';
  // Ejes en tasas (|x|≤1,5) se muestran en %, otros ejes como número.
  const axis=list=>{const pct=list.every(v=>Math.abs(v)<=1.5);return v=>pct?v.toLocaleString('es-CO',{maximumFractionDigits:2,minimumFractionDigits:1,style:'percent'}):fmt(v);};
  const currencySymbol=String(rec.moneda||rec.currency||'USD').toUpperCase()==='COP'?'COP $':'US$';
  const money=n=>esc(currencySymbol)+' '+esc(fmt(n));
  let parts=['<div class="sens-head" data-intrinsic="'+(typeof base==='number'&&isFinite(base)?base:'')+'" data-price="'+(price??'')+'">'+
    '<div><h3>Sensibilidades del escenario Base</h3><p class="sens-intro">Valores por acción calculados en el modelo, no simulados en la página. La celda central coincide con el DCF Base oficial.</p></div>'+
    '<dl class="sens-kpis"><div><dt>Valor intrínseco Base</dt><dd>'+money(base)+'</dd></div>'+
    (price?'<div><dt>Precio de referencia</dt><dd>'+money(price)+'</dd></div>':'')+'</dl>'+
    '<div class="sens-controls"><span>Colorear frente a</span><div class="sens-toggle" role="group" aria-label="Referencia de color">'+
    '<button type="button" data-sens-ref="intrinsic" aria-pressed="true">Valor intrínseco</button>'+
    (price?'<button type="button" data-sens-ref="price" aria-pressed="false">Precio de mercado</button>':'')+'</div>'+
    '<span class="sens-legend"><span><i class="up"></i>Por encima</span><span><i class="down"></i>Por debajo</span><span>más intenso = más lejos</span></span></div></div>',
    '<h3 class="sens-section">DCF</h3>'];
  if(!mats.length)parts.push('<p class="status-note">No hay matrices DCF certificadas en esta revisión.</p>');
  else parts.push('<div class="sens-cards">');
  mats.forEach((m,i)=>{
    const rows=m.valores||[],rr=m.ejeFilas||[],cc=m.ejeColumnas||[];
    const num=v=>typeof v==='number'&&isFinite(v);
    // Se muestra solo si la valoración declara el centro conciliado y además lo reproduce numéricamente.
    const valid=m.centroConciliado===true && rows.length===5 && rr.length===5 && cc.length===5 &&
      rr.every(num) && cc.every(num) &&
      rows.every(r=>Array.isArray(r)&&r.length===5&&r.every(num)) &&
      typeof base==='number' && Math.abs(rows[2][2]-base)<Math.max(.05,Math.abs(base)*1e-6);
    parts.push('<article class="sens-card"><h4>'+esc(m.nombre||('Matriz '+(i+1)))+'</h4>');
    if(!valid){parts.push('<p class="status-note">Matriz no mostrada: '+(m.centroConciliado===true?'centro o celdas sin conciliación con la revisión activa.':'la valoración no declara el centro conciliado (centroConciliado).')+'</p></article>');return;}
    const fr=axis(rr),fc=axis(cc);
    if(m.etiquetaFilas||m.etiquetaColumnas)
      parts.push('<p class="sens-axes">Filas: '+esc(m.etiquetaFilas||'supuesto')+' · Columnas: '+esc(m.etiquetaColumnas||'supuesto')+'</p>');
    parts.push('<div class="sensitivity-table-scroll"><table class="sens-grid"><thead><tr><th scope="col">'+
      esc(m.etiquetaFilas&&m.etiquetaColumnas?'↓ · →':'Supuesto ↓ / →')+'</th>'+cc.map(v=>'<th scope="col">'+esc(fc(v))+'</th>').join('')+'</tr></thead><tbody>');
    rows.forEach((row,ri)=>{
      parts.push('<tr><th scope="row">'+esc(fr(rr[ri]))+'</th>'+
        row.map((v,ci)=>'<td data-v="'+v+'"'+(ri===2&&ci===2?' class="base-matrix"':'')+'>'+esc(fmt(v))+'</td>').join('')+'</tr>');
    });
    parts.push('</tbody></table></div><p class="sens-foot">Centro Base: '+esc(currencySymbol)+esc(fmt(base))+'.</p></article>');
  });
  if(mats.length)parts.push('</div>');
  const mult=rec.sensibilidadMultiples;
  parts.push('<h3 class="sens-section">Múltiplos</h3><div class="sens-cards">');
  const native=nativeMultiplesHtml(rec);
  if(native){parts.push(native);}
  else if(mult?.controlesOK===0){
    parts.push('<p class="status-note">No certificadas en esta revisión: '+esc(mult.noDisponibles||0)+
      ' métodos pendientes. No se generan sensibilidades con anclas sin validar.</p>');
  }else if(mult?.controles?.length){
    parts.push('<p>Disponibilidad de los métodos en el archivo oficial:</p><ul>'+
      mult.controles.map(x=>'<li>'+esc(x.metodo)+': '+esc(x.estado||'N/D')+'</li>').join('')+'</ul>');
  }else parts.push('<p class="status-note">Esta revisión no contiene sensibilidades por múltiplos verificables.</p>');
  parts.push('</div>');
  return parts.join('');
}
// Colorea cada celda frente a la referencia elegida: verde por encima, rojo por debajo,
// intensidad proporcional a la distancia (satura al ±30 %). No cambia ninguna cifra.
function paintSensitivity(root,ref){
  const head=root&&root.querySelector('.sens-head');
  if(!head)return;
  const mode=ref||head.dataset.ref||'intrinsic';
  const target=Number(mode==='price'?head.dataset.price:head.dataset.intrinsic);
  head.dataset.ref=mode;
  head.querySelectorAll('[data-sens-ref]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sensRef===mode)));
  const label=mode==='price'?'precio de mercado':'valor intrínseco Base';
  root.querySelectorAll('td[data-v]').forEach(td=>{
    const v=Number(td.dataset.v);
    td.classList.remove('sens-up','sens-down','sens-eq');td.style.removeProperty('--sens-mix');
    if(!isFinite(v)||!isFinite(target)||target<=0){td.removeAttribute('title');return;}
    const d=(v-target)/target;
    td.title=(d>=0?'+':'')+(d*100).toLocaleString('es-CO',{maximumFractionDigits:1})+' % frente al '+label;
    if(Math.abs(d)<.005){td.classList.add('sens-eq');return;}
    td.classList.add(d>0?'sens-up':'sens-down');
    td.style.setProperty('--sens-mix',Math.round(14+Math.min(Math.abs(d)/.3,1)*46)+'%');
  });
}
function sourceUrl(){
  const rec=state.valuationRecord;
  const book=sourceBookForView(state.view);
  const reboot=rec?.contratoLibros==='jmr-reboot-3libros-v1'||(rec?.perfil_valoracion==='Reboot'&&Boolean(rec?.libros?.dcf)),dcfBase=typeof rec?.libros?.dcf==='string'?rec.libros.dcf:rec?.libros?.dcf?.base;
  const url=String(reboot
    ?(book==='historicos'?rec?.libros?.historicos:book==='multiplos'?rec?.libros?.multiplos:(dcfBase||rec?.hojaGoogle))||''
    :(book==='historicos'&&rec?.perfil_valoracion==='Floyd'?rec?.libros?.historicos||'':rec?.libros?.valoracion||rec?.hojaGoogle||''));
  return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url)?url:'';
}
function updateNativeLink(){
  const link=el('openNativeSheet'),url=sourceUrl();
  link.hidden=!url||!['financieros','indicadores','modelo','valoracion','sensibilidades'].includes(state.view);
  link.textContent=state.displayMode==='edicion'?'Abrir hoja oficial en Google Sheets para editar ↗':'Consultar hoja oficial completa en Google Sheets ↗';
  if(url)link.href=url;else link.removeAttribute('href');
}
function syncReviewMode(){
  const edit=state.displayMode==='edicion';
  el('reviewForm').hidden=!edit||!state.loc||state.reviewLoading;
  el('reviewReadOnly').hidden=edit||!state.loc;
  el('reviewStatusRead').textContent='Estado: '+(el('auditReviewStatus').selectedOptions[0]?.textContent||'Sin estado');
  el('reviewNotesRead').textContent=el('auditReviewNotes').value.trim()||'No hay observaciones registradas para esta revisión.';
}
function selectWorkbookSheet(view,name){
  const frame=el('viewFrame');
  if(!['valoracion','sensibilidades'].includes(view)&&(!viewSheets(view)||typeof name!=='string'||!name.trim()||name.length>140))return;
  state.sheet=name;state.sheetByView[view]=name;
  const mode=state.displayMode;
  const book=sourceBookForView(view);
  const base='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent(name)+'&libro='+book+'&modo='+mode;
  const href=base+'&embedded=1&seccion='+view;
  const open=el('openOriginal');
  open.href=base;
  open.textContent=mode==='visor'?'Abrir visor de la hoja en otra pestaña ↗':'Abrir editor de la hoja en otra pestaña ↗';
  open.hidden=false;
  updateNativeLink();
  const existing=frame.getAttribute('src')||'';
  // Reutilizar una lectura solo si coincide empresa y modo.
  if(state.frameMode==='workbook'&&state.workbookDisplayMode===mode&&state.workbookBook===book&&existing.includes('editor-hoja.html?ticker='+encodeURIComponent(state.ticker))){
    frame.contentWindow?.postMessage({type:'jmr-select-source-sheet',ticker:state.ticker,sheet:name,section:view},location.origin);
  }else{
    state.frameMode='workbook';state.workbookDisplayMode=mode;state.workbookBook=book;frame.setAttribute('src',href);
  }
}
function showView(view){
  if(!state.ticker||!DOSSIER_VIEWS.includes(view))return;
  if(view!==state.view&&preventLosingWorkbookEdits())return;
  state.view=view;
  const displayNav=el('displayModes');
  displayNav.querySelectorAll('button[data-display-mode]').forEach(button=>{
    const chosen=button.dataset.displayMode===state.displayMode;
    button.classList.toggle('active',chosen);button.setAttribute('aria-pressed',String(chosen));
  });
  el('displayModeNote').textContent=state.displayMode==='visor'
    ? 'Lectura sin modificar celdas ni publicar cambios.'
    : view==='analisis'?'Edición del análisis vigente; guardar no republica la valoración.'
    : view==='revision'?'Edita observaciones; el guardado no ejecuta una auditoría.'
    : 'Edita entradas autorizadas. Usa Google Sheets para fórmulas y otras celdas.';
  updateNativeLink();
  const p=pages(state.ticker);
  document.querySelectorAll('[data-view]').forEach(button=>{
    const selected=button.dataset.view===view;
    button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));
    button.tabIndex=selected?0:-1;
  });
  renderSheetSubtabs(view);
  const modeNav=el('valuationModes'),summary=el('valuationSummary');
  modeNav.hidden=view!=='valoracion';
  summary.hidden=view!=='valoracion';
  if(view==='valoracion'){
    modeNav.querySelectorAll('button[data-valuation]').forEach(btn=>{
      const active=btn.dataset.valuation===state.valuationMode;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    summary.innerHTML=typeof JmrMultiplesPanel==='undefined'?
      '<p>Vista relativa pendiente de cargar.</p>':
      state.valuationRecord?JmrMultiplesPanel.summary(state.valuationRecord):
      '<p>Cargando comparación DCF / múltiplos de la revisión oficial…</p>';
  }
  const frame=el('viewFrame'),inline=el('inlinePanel'),open=el('openOriginal'),help=el('viewHelp');
  const review=el('reviewPanel');
  review.hidden=view!=='revision'||!state.loc;
  if(view==='revision')syncReviewMode();
  help.textContent=(p[view]||{}).help||'Información de la revisión activa de la empresa.';
  const isWorkbook=!!viewSheets(view);
  const isSensitivity=view==='sensibilidades';
  const isRevision=view==='revision';
  const isMultiples=view==='valoracion'&&state.valuationMode==='multiplos';
  frame.hidden=isSensitivity||isRevision||isMultiples;
  inline.hidden=!isSensitivity&&!isRevision&&!isMultiples;
  open.hidden=isSensitivity||isRevision;
  if(isWorkbook){
    const sheet=currentSheet(view);
    selectWorkbookSheet(view,sheet);
    updateDossierLocation(view,sheet);
  }else if(state.displayMode==='edicion'&&(view==='sensibilidades'||view==='valoracion')){
    frame.hidden=false;inline.hidden=true;
    let sheet=view==='sensibilidades'?'Sensibilidad DCF':state.valuationMode==='multiplos'?'Descuento de múltiplos':'Input sheet';
    if(isReboot()&&view==='sensibilidades')sheet='Sensibilidades DCF';
    selectWorkbookSheet(view,sheet);
    help.textContent='Edición vinculada a la hoja original. Para modificar fórmulas o celdas protegidas, abre Google Sheets con tu cuenta autorizada.';
    updateDossierLocation(view);
  }else if(isSensitivity){
    inline.innerHTML=sensitivityHtml(state.valuationRecord);
    paintSensitivity(inline,state.sensitivityRef);
    updateDossierLocation(view);
  }else if(isMultiples){
    inline.innerHTML=typeof JmrMultiplesPanel==='undefined'?
      '<p class="status-note">No se pudo cargar la tabla de múltiplos.</p>':
      JmrMultiplesPanel.render(state.valuationRecord);
    help.textContent='Valoración relativa por método: precios conservador, Base y optimista; valor presente individual cuando existe. Los valores visibles son la revisión publicada de la hoja oficial: Financials Multiples, Descuento de múltiplos y Sensibilidad por múltiplo. Si un método no está conciliado, se muestra N/D.';
    open.href='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent('Descuento de múltiplos');
    open.textContent='Consultar fórmula y hoja original ↗';
    updateDossierLocation(view);
  }else if(isRevision){
    if(!state.loc)inline.innerHTML='<p class="status-note">Cargando la revisión y las observaciones oficiales…</p>';
    else inline.innerHTML='<p class="status-note">Las observaciones se guardan por ticker y revisión. Si no hay auditoría publicada, su estado permanece pendiente; no se crea un resultado ficticio.</p>';
    updateDossierLocation(view);
  }else if(view==='analisis'&&state.displayMode==='edicion'&&!isA12Review(state.ticker)){
    const route='research.html?ticker='+encodeURIComponent(state.ticker)+(p.analysisPath?'&analisis='+encodeURIComponent(p.analysisPath):'');
    frame.hidden=false;inline.hidden=true;open.hidden=false;
    state.frameMode=view;
    if(frame.getAttribute('src')!==route)frame.setAttribute('src',route);
    open.href=route;open.textContent='Abrir editor del análisis completo ↗';
    help.textContent=p.analysisPath?'Editor del documento exacto del catálogo; no se modifica ni publica el DCF automáticamente.':'No hay análisis vigente: el editor no reutilizará un informe histórico como oficial.';
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
function reviewReadHeaders(){
  // Con GitHub conectado la lectura usa el token (5.000 consultas/hora) en vez del cupo anónimo de 60/hora
  // que comparten todas las fichas abiertas desde la misma red.
  try{return GhOAuth.ghHeaders();}catch(_){return {'Accept':'application/vnd.github+json'};}
}
async function fetchAuditStored(loc){
  const r=await fetch(CONTENTS+reviewPath(loc)+'?ref=main',{cache:'no-store',headers:reviewReadHeaders()});
  if(r.status===404){
    // Compatibilidad con las solicitudes previas escritas por nombre de archivo.
    const legacyPath='auditorias/solicitudes/'+loc.valoracionPath.split('/').pop();
    const old=await fetch(CONTENTS+legacyPath+'?ref=main',{cache:'no-store',headers:reviewReadHeaders()});
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
    syncReviewMode();
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
el('inlinePanel').addEventListener('click',event=>{
  const button=event.target.closest('[data-sens-ref]');
  if(!button)return;
  state.sensitivityRef=button.dataset.sensRef;
  paintSensitivity(el('inlinePanel'),state.sensitivityRef);
});
el('connectReviewGitHub').addEventListener('click',()=>GhOAuth.startLogin());
el('reloadAuditRequest').addEventListener('click',()=>{
 if(state.loc)loadAuditRequest(state.loc.ticker,pages(state.loc.ticker));
});

el('catalogSearch').addEventListener('input',renderCatalogCards);
el('marketFilters').addEventListener('click',event=>{
  const b=event.target.closest('button[data-market]');
  if(!b)return;
  const u=new URL(location.href),market=b.dataset.market;
  if(market==='all')u.searchParams.delete('mercado');
  else if(market==='colombia'||market==='internacional')u.searchParams.set('mercado',market);
  history.replaceState({},'',u.pathname+u.search+u.hash);
  renderCatalogCards();
});

el('lookup').addEventListener('submit',e=>{e.preventDefault();openCompany(el('ticker').value);});
el('reload').addEventListener('click',loadInventory);
el('displayModes').addEventListener('click',event=>{
  const button=event.target.closest('button[data-display-mode]');
  if(!button||!['visor','edicion'].includes(button.dataset.displayMode)||button.dataset.displayMode===state.displayMode)return;
  if(preventLosingWorkbookEdits())return;
  state.displayMode=button.dataset.displayMode;
  showView(state.view);
});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
el('valuationModes').addEventListener('click',event=>{
  const btn=event.target.closest('button[data-valuation]');
  if(!btn||!['dcf','multiplos'].includes(btn.dataset.valuation))return;
  if(preventLosingWorkbookEdits())return;
  state.valuationMode=btn.dataset.valuation;
  showView('valoracion');
});
window.addEventListener('message',event=>{
  const frame=el('viewFrame'),data=event.data||{};
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(data.type!=='jmr-sheet-selected'||data.ticker!==state.ticker||typeof data.sheet!=='string')return;
  if(!viewSheets(state.view))return;
  // Un cambio del selector de las 46 hojas se refleja en la ruta del expediente.
  state.sheet=data.sheet;
  state.sheetByView[state.view]=data.sheet;
  document.querySelectorAll('#sheetSubtabs button[data-sheet]').forEach(button=>{
    const selected=button.dataset.sheet===data.sheet;
    button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
  });
  updateDossierLocation(state.view,data.sheet);
  const open=el('openOriginal');
  open.href='editor-hoja.html?ticker='+encodeURIComponent(state.ticker)+'&sheet='+encodeURIComponent(data.sheet)+'&modo='+state.displayMode;
});
el('viewFrame').addEventListener('load',function(){
  // Mismo origen: ocultar solamente la navegación duplicada, sin tocar los
  // botones, selectores, formularios o cálculos de la página original.
  try{
    const doc=this.contentDocument;
    if(state.frameMode==='workbook'&&state.sheet)
      this.contentWindow?.postMessage({type:'jmr-select-source-sheet',ticker:state.ticker,sheet:state.sheet,section:state.view},location.origin);
    if(!doc||doc.getElementById('jmr-dossier-embed'))return;
    const style=doc.createElement('style');style.id='jmr-dossier-embed';
    style.textContent='nav.appnav,#jmr-market-nav{display:none!important}';
    // Ocultar solamente la navegación redundante de vistas técnicas reutilizadas.
    if(doc.location.pathname.endsWith('/research.html')){
      // El editor de análisis debe conservar sus controles y Guardar; nunca aplicar aquí el CSS de lectura.
      if(state.displayMode==='visor'){
        style.textContent+='body.research-page .hero,body.research-page .disclaimer,body.research-page .tabs,body.research-page #ghConnectBanner,body.research-page .setup-panel,body.research-page .analysis-actions,body.research-page #editorToolbar{display:none!important}';
      }else{
        style.textContent+='body.research-page .hero,body.research-page .disclaimer{display:none!important}';
      }
      style.textContent+='body.research-page .wrap{max-width:none;width:100%;padding:0 12px 32px}body.research-page .preview-shell{max-width:none;width:100%;margin:0}';
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

