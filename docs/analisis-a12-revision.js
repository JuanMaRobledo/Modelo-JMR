/* Lector de análisis candidatos A-1.2: no altera el catálogo, los estados ni la valoración vigente. */
(function(){
'use strict';
const REVIEW_TICKERS=new Set(['META','NVDA','XP']);
const qs=new URLSearchParams(location.search);
const ticker=String(qs.get('ticker')||'').toUpperCase();
const get=id=>document.getElementById(id);
const status=(msg,bad=false)=>{get('status').textContent=msg;get('status').classList.toggle('error',bad);};
const fmt=(n,p=2)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('es-CO',{minimumFractionDigits:p,maximumFractionDigits:p}):'Pendiente';
const esc=s=>String(s??'');
function isValid(record,val){
  if(!record||!val||record.ticker!==ticker||val.ticker!==ticker)return false;
  if(record.revisionId!==val.revisionId||record.linkedValuation?.revisionId!==val.revisionId)return false;
  if(record.version_metodo!=='A-1.2'||val.version_metodo!=='A-1.2')return false;
  if(val.publicadaEnApp!==false||val.certificacionEconomica!=='NO_CERTIFICADA')return false;
  if(val.publicationStage!=='PREPUBLICACION_CONTROLADA'||record.publicationStage!=='PREPUBLICACION_CONTROLADA')return false;
  if(!Array.isArray(val.valorEsperado?.historias)||val.valorEsperado.historias.length!==4)return false;
  if(!Number.isFinite(val.valorPrincipal)||!Number.isFinite(val.precioMOS)||Math.abs(val.valorPrincipal*.65-val.precioMOS)>1e-6)return false;
  return true;
}
async function loadJSON(file){
  const url='revisiones-a12/'+ticker+'-'+file+'.json';
  const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)throw new Error('No se pudo leer '+file+' (HTTP '+r.status+')');
  return r.json();
}
function safeArticle(markup){
  const template=document.createElement('template');
  template.innerHTML=String(markup||'');
  const allowed=new Set(['ARTICLE','SECTION','HEADER','NAV','OL','UL','LI','H1','H2','H3','H4','H5','H6','P','DIV','SPAN','STRONG','B','EM','I','U','SMALL','BR','HR','A','TABLE','THEAD','TBODY','TR','TH','TD','CAPTION','BLOCKQUOTE','CODE','PRE','SUP','SUB','DETAILS','SUMMARY']);
  for(const node of Array.from(template.content.querySelectorAll('*'))){
    if(!allowed.has(node.tagName)){node.remove();continue;}
    for(const attr of Array.from(node.attributes)){
      if(attr.name.startsWith('on')||(!['href','id','class','title','aria-label','data-metodo','data-jmr-revision','data-nivel','data-status'].includes(attr.name)))node.removeAttribute(attr.name);
    }
    if(node.tagName==='A'){
      const href=node.getAttribute('href')||'';
      if(!(/^(https:\/\/|#)/i).test(href))node.removeAttribute('href');
      node.setAttribute('rel','noopener noreferrer');
      node.setAttribute('target','_blank');
    }
  }
  return template.content;
}
const showHtml=html=>{const article=get('article');article.replaceChildren(safeArticle(html));};
function setPane(p,record,val){
  for(const btn of document.querySelectorAll('[data-pane]'))btn.setAttribute('aria-selected',String(btn.dataset.pane===p));
  if(p==='nivel1')showHtml(record.articleHtml||record.html);
  if(p==='nivel2')showHtml(record.calculationHtml||'<p>Nivel 2 pendiente.</p>');
  if(p==='escenarios'){
    const container=document.createElement('article');
    const heading=document.createElement('h2');heading.textContent='Historias y reservas del Método A-1.2';container.appendChild(heading);
    const table=document.createElement('table');const body=document.createElement('tbody');
    const columns=['Historia','Probabilidad','DCF USD/acción','MOS35% USD/acción'];
    const trHead=document.createElement('tr');
    for(const item of columns){const cell=document.createElement('th');cell.textContent=item;trHead.appendChild(cell);}body.appendChild(trHead);
    const order=['B','A','D','C'];
    for(const id of order){
      const item=val.valorEsperado.historias.find(x=>x.id===id);if(!item)continue;
      const tr=document.createElement('tr');
      for(const value of [item.nombre,fmt(item.probabilidad*100,1)+'%',fmt(item.valor),fmt(item.precioMOS)]){
        const td=document.createElement('td');td.textContent=esc(value);tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);container.appendChild(table);
    const p1=document.createElement('p');p1.textContent='DCF Base es el valor principal; Disrupción no entra en el promedio de tres. Los múltiplos son secundarios y pueden permanecer sin anclas certificadas.';container.appendChild(p1);
    const h=document.createElement('h3');h.textContent='Salvedades materiales pendientes';container.appendChild(h);
    const ul=document.createElement('ul');
    for(const item of (val.salvedades||[]).slice(0,14)){const li=document.createElement('li');li.textContent=esc(item);ul.appendChild(li);}container.appendChild(ul);
    get('article').replaceChildren(container);
  }
}
function metric(label,value){
  const div=document.createElement('div');div.className='metric';
  const small=document.createElement('small');small.textContent=label;
  const bold=document.createElement('strong');bold.textContent=value;
  div.append(small,bold);return div;
}
async function main(){
 if(!REVIEW_TICKERS.has(ticker)){status('No existe una revisión A-1.2 disponible para este ticker.',true);return;}
 const [val,record]=await Promise.all([loadJSON('valoracion'),loadJSON('analisis')]);
 if(!isValid(record,val))throw new Error('No concilian revisión, método, MOS o condición de prepublicación.');
 get('title').textContent=record.company+' · '+ticker;
 get('subtitle').textContent='Expediente '+record.revisionId+' · corte contable '+val.fechaCorteContable+' · método JMR A-1.2 · valoración candidata EN_REVISIÓN';
 get('back').href='expediente.html?ticker='+encodeURIComponent(ticker)+'&seccion=analisis';
 const target=get('summary');
 target.replaceChildren(
   metric('DCF Base candidato', 'US$'+fmt(val.valorPrincipal)),
   metric('Precio MOS35%', 'US$'+fmt(val.precioMOS)),
   metric('Precio de referencia · '+val.precioReferenciaFecha,'US$'+fmt(val.precio)),
   metric('Promedio tres historias', 'US$'+fmt(val.valorEsperado.valor))
 );target.hidden=false;
 const links=get('sheetLinks');
 const url=String(val.hojaGoogle||'');
 if(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+\/edit/.test(url)){
 const link=document.createElement('a');link.href=url;link.rel='noopener noreferrer';link.target='_blank';link.textContent='Abrir hoja del modelo A-1.2';links.replaceChildren(link);
 }
 for(const button of document.querySelectorAll('[data-pane]'))button.addEventListener('click',()=>setPane(button.dataset.pane,record,val));
 setPane('nivel1',record,val);
 status('Análisis A-1.2 disponible para revisión visual. No modifica la revisión vigente del catálogo.');
}
main().catch(e=>status('No fue posible cargar el candidato: '+String(e.message||e),true));
})();