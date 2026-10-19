/* Modelo JMR · Auditoría por empresa. Lectura solamente; jamás cambia ponderaciones/DCF. */
(function(root){
"use strict";
const METHODS=["EV/EBITDA","EV/FCFF","P/E","P/FCFE","P/OCF","P/V","P/BV"];
const SCENARIOS=["conservador","base","optimista"];
const REPO="JuanMaRobledo/Modelo-JMR-datos";
const RAW="https://raw.githubusercontent.com/"+REPO+"/main/";
const API="https://api.github.com/repos/"+REPO+"/contents/";
const STORAGE="jmr-revision-multiplos-local-v1";
const state={audit:null,paths:{},coverage:null,record:null,ticker:"",filter:"todas",reviews:{}};
const $=id=>document.getElementById(id);
function finite(x){return typeof x==="number"&&Number.isFinite(x);}
function fmt(x,currency){return finite(x)?(currency==="COP"?"COP ":currency==="EUR"?"€":"US$")+x.toLocaleString("es-CO",{maximumFractionDigits:currency==="COP"?0:2,minimumFractionDigits:currency==="COP"?0:2}):"N/D";}
function percent(x){return finite(x)?(x*100).toFixed(1).replace(".",",")+" %":"N/D";}
function escapeHTML(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function byName(v,n){return (v||[]).find(x=>x.nombre===n);}
function methodView(record,name){
 const s=byName(record.seleccionMultiples?.metodos,name)||{};
 const m=byName(record.descuentoMultiples?.metodos,name)||{};
 const fy=byName(record.metodos,name)||{};
 const weight=finite(fy.peso)?fy.peso:0; // Solo peso aplicado en métodos, no metadatos históricos.
 return {nombre:name,peso:weight,control:s.control||"SIN CONTROL",rol:s.rol||"Sin dictamen",
 criterio:s.criterio||"Sin justificación económica estructurada; revisar expediente",
 actual:byName(record.multiplesHistoricos?.metodos,name)||null,
 vp3:SCENARIOS.map(k=>finite(m[k]?.vp?.[2])?m[k].vp[2]:null),
 consolidado:SCENARIOS.map(k=>finite(m[k]?.consolidado)?m[k].consolidado:null),
 fy3:SCENARIOS.map(k=>finite(fy[k])?fy[k]:null)};
}
function compare(record){
 const dm=record.descuentoMultiples||{},ds=record.escenariosDCF||{};
 const dcf=finite(ds.base)?ds.base:(finite(dm.dcfHoy?.base)?dm.dcfHoy.base:null);
 const wm=(record.metodos||[]).reduce((s,x)=>/DCF/i.test(x.nombre)?s:s+(finite(x.peso)?x.peso:0),0);
 const wdcf=(record.metodos||[]).find(x=>/DCF/i.test(x.nombre))?.peso;
 const multiples=METHODS.map(x=>methodView(record,x));
 const active=multiples.filter(x=>x.peso>0);
 const missing=active.some(x=>!finite(x.vp3[1]));
 const vp3=wm>0&&!missing?active.reduce((s,m)=>s+m.vp3[1]*m.peso,0)/wm:null;
 const gap=finite(dcf)&&dcf>0&&finite(vp3)?(vp3/dcf-1):null;
 return {dcf,pesoDcf:finite(wdcf)?wdcf:dm.pesoDcf,pesoMultiplos:wm,
 relativoHoy:finite(dm.multiplesHoy?.base)?dm.multiplesHoy.base:null,
 mezclaHoy:finite(record.valorPresentePonderado?.base)?record.valorPresentePonderado.base:null,
 fy3:finite(record.objetivoPonderado?.base)?record.objetivoPonderado.base:null,
 gap,gapVP3:vp3,metodos:multiples,weightSum:wm+(finite(wdcf)?wdcf:0)};
}
function reviewList(items,filter,query,reviews){
 const q=String(query||"").trim().toUpperCase();
 return items.filter(x=>{
  if(q&&!x.ticker.includes(q))return false;
  const t=reviews[x.ticker]?.estado||"pendiente";
  if(filter==="pendientes")return t==="pendiente";
  if(filter==="revisar")return x.clasificacion!=="MANTENER_EN_REVISION";
  if(filter==="aprobados")return t==="conforme";
  return true;
 });
}
function readReviews(){try{const p=JSON.parse(localStorage.getItem(STORAGE)||"{}");return p&&typeof p==="object"?p:{}}catch(e){return {};}}
function saveReviews(){try{localStorage.setItem(STORAGE,JSON.stringify(state.reviews));return true}catch(e){return false}}
function apiHeaders(){return (typeof GhOAuth!=="undefined"&&GhOAuth.ghHeaders)?GhOAuth.ghHeaders(GhOAuth.getGhToken()):{"Accept":"application/vnd.github+json"};}
async function githubJSON(path){
 try {let r=await fetch(RAW+path,{cache:"no-store"});if(r.ok)return await r.json();}catch(_){}
 const r=await fetch(API+path,{headers:apiHeaders(),cache:"no-store"});
 if(!r.ok)throw new Error("No se pudo consultar el dato ("+r.status+")");
 const file=await r.json();
 if(file.content){const txt=atob(file.content.replace(/\s/g,""));return JSON.parse(new TextDecoder().decode(Uint8Array.from(txt,c=>c.charCodeAt(0))));}
 return file;
}
async function listing(folder,pattern){
 const r=await fetch(API+folder+"?ref=main",{headers:apiHeaders(),cache:"no-store"});
 if(!r.ok)throw new Error("No se pudo listar "+folder+" ("+r.status+")");
 const list=await r.json();if(!Array.isArray(list))throw new Error("Listado inesperado de "+folder);
 const paths={};
 for(const f of list){const m=String(f.name||"").match(pattern);if(m)paths[m[1].toUpperCase()]=f.path;}
 return paths;
}
function inventory(audit,valuationPaths,analysisPaths){
 const valuation=Object.keys(valuationPaths).sort();
 const auditList=Array.isArray(audit.entradas)?audit.entradas:[];
 const audited=new Set(auditList.map(x=>x.ticker));
 const analysis=analysisPaths?Object.keys(analysisPaths).sort():null;
 const reportOnly=analysis?analysis.filter(x=>!valuationPaths[x]):null;
 const valuationOnly=analysis?valuation.filter(x=>!analysisPaths[x]):null;
 const unaudited=valuation.filter(x=>!audited.has(x));
 const vanished=auditList.map(x=>x.ticker).filter(x=>!valuationPaths[x]);
 return {valuation,analysis,reportOnly,valuationOnly,unaudited,vanished,
  entries:[...auditList.filter(x=>valuationPaths[x]),...unaudited.map(ticker=>({
   ticker,clasificacion:"SIN_AUDITORIA",observacion:"Valoración publicada después del corte de auditoría; requiere revisar sus múltiplos."
  }))]};
}
function paintCoverage(c){
 const node=$("coverage");if(!node)return;
 const line=(label,tickers,linkPage)=>{
  if(tickers===null)return "<p><strong>"+escapeHTML(label)+":</strong> inventario de informes temporalmente no accesible.</p>";
  if(!tickers.length)return "<p><strong>"+escapeHTML(label)+":</strong> ninguna.</p>";
  return "<p><strong>"+escapeHTML(label)+" ("+tickers.length+"):</strong> "+
    tickers.map(t=>'<a href="'+linkPage+'?ticker='+encodeURIComponent(t)+'">'+escapeHTML(t)+'</a>').join(", ")+".</p>";
 };
 node.innerHTML="<strong>Control de cobertura de acciones</strong><p>"+
  c.valuation.length+" valoraciones publicadas · "+(c.analysis?c.analysis.length:"N/D")+" informes · "+c.unaudited.length+" valoraciones sin auditoría del último corte.</p>"+
  line("Informe sin valoración",c.reportOnly,"research.html")+
  line("Valoración sin informe",c.valuationOnly,"visor.html")+
  line("Valoración aún sin dictamen de múltiplos",c.unaudited,"auditoria-multiplos.html")+
  (c.vanished.length?"<p><strong>Advertencia:</strong> "+c.vanished.length+" tickers constan en la auditoría, pero no en el catálogo vigente: "+escapeHTML(c.vanished.join(", "))+".</p>":"");
}
function setStatus(s){$("status").textContent=s;}
function badge(entry){
 if(!entry)return"Pendiente de evidencia";
 if(entry.clasificacion==="SIN_AUDITORIA")return"Sin dictamen de múltiplos";
 if(entry.clasificacion==="BRECHA_MATERIAL")return"Brecha material · revisar";
 if(entry.clasificacion==="BLOQUEO_O_MIGRACION")return"Reconciliación especial";
 return"Revisión económica pendiente";
}
function paintList(){
 const entries=reviewList(state.audit.entradas,state.filter,$("search").value,state.reviews);
 $("count").textContent=entries.length+" / "+state.audit.entradas.length+" empresas";
 $("companies").innerHTML=entries.map(e=>{
  const v=state.reviews[e.ticker]?.estado||"pendiente";
  const selected=state.ticker===e.ticker?" aria-current='true'":"";
  return '<button type="button" class="company '+(state.ticker===e.ticker?"selected":"")+'" data-ticker="'+escapeHTML(e.ticker)+'"'+selected+'><span><strong>'+escapeHTML(e.ticker)+'</strong><small>'+escapeHTML(badge(e))+'</small></span><span class="audit-progress">'+escapeHTML({pendiente:"Sin revisar",revisando:"En revisión",conforme:"Conforme",ajustes:"Requiere ajustes"}[v]||v)+'</span></button>';
 }).join("");
 if(!entries.length)$("companies").textContent="No hay empresas con este filtro.";
}
function summaryCards(rec,c,e){
 const curr=rec.currency||(currIsCOP(rec)?"COP":"USD");
 const holding=rec.valoracionHolding;
 if(holding){
  const base=holding.nav?.base,threshold=finite(base)&&finite(rec.mos)?base*(1-rec.mos):null;
  return '<div class="metrics"><article><small>SOTP Base · principal</small><strong>'+fmt(base,curr)+'</strong><span>NAV referencial · '+escapeHTML(holding.estado||'PRELIMINAR')+'</span></article><article><small>Umbral MOS sobre SOTP Base</small><strong>'+fmt(threshold,curr)+'</strong><span>MOS '+percent(rec.mos)+'</span></article></div><p class="small muted">Cotizadas a mercado y no cotizadas a libro. DCF opcional sin peso; no condiciona el SOTP. '+escapeHTML(holding.nota||'')+'</p>';
 }
 const gap=finite(c.gap)?(c.gap>=0?"+":"")+(c.gap*100).toFixed(1).replace(".",",")+" %":"N/D";
 const mos=rec.baseMOS==="dcfBase"&&finite(c.dcf)&&finite(rec.mos)?fmt(c.dcf*(1-rec.mos),curr):"Pendiente de validar";
 return '<div class="metrics">'+
 '<article><small>DCF Base · principal</small><strong>'+fmt(c.dcf,curr)+'</strong><span>MOS anclado exclusivamente al DCF</span></article>'+
 '<article><small>Múltiplos hoy · relativo</small><strong>'+fmt(c.relativoHoy,curr)+'</strong><span>No reemplaza el DCF</span></article>'+
 '<article><small>Combinación hoy · secundaria</small><strong>'+fmt(c.mezclaHoy,curr)+'</strong><span>DCF '+percent(c.pesoDcf)+' / relativos '+percent(c.pesoMultiplos)+'</span></article>'+
 '<article><small>Brecha VP3 vs DCF Base</small><strong>'+gap+'</strong><span>Diagnóstico, no objetivo de calibración</span></article>'+
 '</div><p class="small muted">Objetivo FY+3 combinado: <strong>'+fmt(c.fy3,curr)+'</strong> · Umbral de compra MOS: <strong>'+mos+'</strong> · matrices: '+escapeHTML(rec.sensibilidadMultiples?.controlesOK??"N/D")+' conciliadas / '+escapeHTML(rec.sensibilidadMultiples?.noDisponibles??"N/D")+' N/D. '+escapeHTML(e?.observacion||"")+'</p>';
}
function methodsTable(rec,c){
 const curr=rec.currency||((rec.market==="BVC"||/^(GRUPO|PF)/.test(rec.ticker))?"COP":"USD");
 return '<div class="table-wrap"><table class="audit-data-table audit-methods"><thead><tr><th>Método</th><th>Peso vigente</th><th>VP3 conserv.</th><th>VP3 base</th><th>VP3 optim.</th><th>Control / fundamento</th></tr></thead><tbody>'+
 c.metodos.map(m=>'<tr><th data-label="Método">'+escapeHTML(m.nombre)+'</th><td data-label="Peso vigente">'+percent(m.peso)+'</td>'+
 m.vp3.map((v,i)=>'<td data-label="'+['VP3 conservador','VP3 base','VP3 optimista'][i]+'">'+fmt(v,curr)+'</td>').join('')+
 '<td data-label="Control y fundamento"><strong>'+escapeHTML(m.control)+'</strong><div class="small">'+escapeHTML(m.criterio)+'</div></td></tr>').join('')+
 '</tbody></table></div><p class="small muted">Peso de selección vigente, no peso recomendado. Un método N/D o no comparable conserva peso 0 en la propuesta. P/V y P/BV permanecen visibles aun si no ponderan.</p>';
}
function historyTable(c){
 return '<div class="table-wrap"><table class="audit-data-table audit-history"><thead><tr><th>Método</th><th>Datos históricos válidos</th><th>Mediana 5A</th><th>Mediana depurada</th><th>Múltiplo de referencia</th></tr></thead><tbody>'+
 c.metodos.map(m=>{const o=m.actual,st=o?.estadisticas||{},cur=finite(o?.actual)?o.actual:null;
 return '<tr><th data-label="Método">'+escapeHTML(m.nombre)+'</th><td data-label="Datos históricos válidos">'+(Number.isInteger(st.n)?st.n:"N/D")+'</td><td data-label="Mediana 5A">'+(finite(st.mediana_5a)?st.mediana_5a.toFixed(2)+"×":"N/D")+'</td><td data-label="Mediana depurada">'+(finite(st.mediana_10a)?st.mediana_10a.toFixed(2)+"×":"N/D")+'</td><td data-label="Múltiplo de referencia">'+(finite(cur)?cur.toFixed(2)+"×":"N/D")+'</td></tr>'}).join('')+
 '</tbody></table></div><p class="small muted">A: se muestra lo guardado para cada empresa. “N/D” significa que falta evidencia estructurada; no es una estimación de referencia.</p>';
}
function matrixRows(rec,name,scenario){
 const html=rec.hojas?.valoracion?.["Sensibilidad por múltiplo"];if(!html)return null;
 const dom=new DOMParser().parseFromString(html,"text/html");
 const rows=dom.querySelectorAll("tr[data-row]");if(!rows.length)return null;
 const rmap={};rows.forEach(r=>{rmap[Number(r.getAttribute("data-row"))]=r;});
 const base=6+SCENARIOS.indexOf(scenario)*70+METHODS.indexOf(name)*10;
 const cells=n=>Array.from(rmap[n]?.querySelectorAll("td,th")||[]).map(td=>td.getAttribute("data-value")??td.textContent.trim());
 const heading=cells(base)[0]||name;
 if(!heading.includes(name))return null;
 return {heading,header:cells(base+2).slice(0,6),body:Array.from({length:5},(_,i)=>cells(base+3+i).slice(0,6)),validation:cells(base+8).filter(Boolean)};
}
function showMatrix(){
  if(!state.record)return;
  const method=$("matrixMethod").value,scenario=$("matrixScenario").value;
  const data=matrixRows(state.record,method,scenario),box=$("matrix");
  if(!data){box.innerHTML='<p class="muted">Matriz no disponible en el registro publicado. Revisar hoja fuente.</p>';return}
  const axis=typeof JmrMultiplesAxes!=="undefined"?JmrMultiplesAxes.labels(state.record,method,scenario):null;
  if(!axis){box.innerHTML='<p class="muted">N/D — falta múltiplo o fundamental FY+3 verificable para '+escapeHTML(method)+'. No se publican fracciones como si fueran múltiplos reales. Consulta la hoja original.</p>';return}
  const body=data.body.map((row,i)=>[axis.rows[i],...row.slice(1)]);
  box.innerHTML='<h4>'+escapeHTML(data.heading)+'</h4><p class="small muted">'+escapeHTML(axis.caption)+'</p>'+
    '<div class="table-wrap"><table class="sensitivity"><thead><tr>'+axis.header.map(x=>'<th>'+escapeHTML(x)+'</th>').join("")+'</tr></thead><tbody>'+
    body.map((row,i)=>'<tr>'+row.map((v,j)=>'<td class="'+(i===2&&j===3?"center-cell":"")+'">'+escapeHTML(v||"N/D")+'</td>').join("")+'</tr>').join("")+
    '</tbody></table></div><p class="small muted">Conciliación VP3: '+escapeHTML(data.validation.join(" · "))+
    '. Los ejes expresan cantidades económicas reales; las celdas conservan los valores presentes publicados. Disrupción queda separada.</p>';
}
function showEconomicMatrix(){
 const box=$("economicMatrix");
 if(!box||!state.record)return;
 box.innerHTML=typeof JmrEconomicMultiples!=="undefined"?
   JmrEconomicMultiples.render(state.record,$("matrixMethod").value,$("matrixScenario").value):
   '<p class="muted">No se cargó el cálculo de múltiplos económicamente justificados.</p>';
}
function showBothMatrices(){showMatrix();showEconomicMatrix();}
function reviewPanel(ticker){
 const rev=state.reviews[ticker]||{estado:"pendiente",nota:""};
 $("reviewState").value=rev.estado;
 $("reviewNote").value=rev.nota||"";
 $("reviewUpdated").textContent=rev.actualizado?"Revisión local guardada: "+rev.actualizado:"Todavía no hay revisión personal guardada";
}
function paintCompany(rec){
 const entry=state.audit.entradas.find(x=>x.ticker===rec.ticker);
 const c=compare(rec);const t=escapeHTML(rec.ticker);
 const name=escapeHTML(rec.nombreActivo||rec.ticker);
 $("companyDetail").hidden=false;
 $("auditTitle").textContent=rec.ticker+" — "+(rec.nombreActivo||"valoración JMR");
 $("auditSubtitle").textContent="Fecha del expediente: "+(rec.fecha||"no disponible")+" · "+badge(entry)+" · pesos y cifras de la valoración publicada";
 $("metrics").innerHTML=summaryCards(rec,c,entry);
 $("methods").innerHTML=methodsTable(rec,c);
 $("historical").innerHTML=historyTable(c);
 $("dossier").innerHTML='<div class="reference-grid"><article><h4>A · Historia propia</h4><p>Medianas de años económicamente comparables, exclusión de pérdidas, atípicos y cambios de régimen. '+(rec.multiplesHistoricos?"Hay estadísticas almacenadas.":"No hay anclas históricas estructuradas en el registro.")+'</p></article><article><h4>B · Comparables</h4><p>Seleccionar pares por crecimiento, ROIC, rentabilidad, riesgo y estructura de capital; justificar exclusiones y ajustes. Verificar fuentes y fecha antes de aprobar.</p></article><article><h4>C · Justificado</h4><p>Confrontar el múltiplo con sus fundamentales: P/E (riesgo, crecimiento, payout); P/V (margen); P/BV (ROE frente a Ke); múltiplos EV (ROIC y reinversión). No forzar su coincidencia con el DCF.</p></article></div>';
 const sheet=(typeof rec.hojaGoogle==="string"&&/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+/.test(rec.hojaGoogle))?rec.hojaGoogle:"";
 const market=currIsCOP(rec)?"&mercado=colombia":"";
 $("companyLinks").innerHTML=(sheet?'<a href="'+escapeHTML(sheet)+'" target="_blank" rel="noopener noreferrer">Hoja original ↗</a>':"")+
 '<a href="visor.html?'+(market?"mercado=colombia&":"")+'ticker='+encodeURIComponent(rec.ticker)+'">Visor JMR ↗</a>'+
 '<a href="research.html?ticker='+encodeURIComponent(rec.ticker)+market+'">Análisis fundamental ↗</a>';
 $("auditTechnical").textContent=rec.valoracionHolding ? "SOTP Base es el valor principal y la referencia del MOS. El DCF tiene peso cero. La combinación de métodos de holding permanece pendiente y no sustituye al SOTP." : "Pesos publicados: DCF "+percent(c.pesoDcf)+", múltiplos "+percent(c.pesoMultiplos)+"; suma "+percent(c.weightSum)+". La aprobación personal no modifica las valoraciones ni se publica automáticamente.";
 const choices=METHODS.map(m=>'<option value="'+escapeHTML(m)+'">'+escapeHTML(m)+'</option>').join("");
 $("matrixMethod").innerHTML=choices;
 $("matrixMethod").value="EV/EBITDA";$("matrixScenario").value="base";showBothMatrices();
 const dis=rec.escenariosDCF?.disrupcion??rec.valorEsperado?.disrupcionSeparada?.valor;
 $("disruption").textContent=finite(dis)?"Escenario de disrupción: "+fmt(dis,currIsCOP(rec)?"COP":"USD")+" (solo estrés, excluido del promedio).":"Disrupción permanece separada. Consultar el expediente para su valor o controles.";
 reviewPanel(rec.ticker);
 document.title=rec.ticker+" · Auditoría de múltiplos · JMR";
}
function currIsCOP(r){return r.currency==="COP"||r.market==="BVC"||/^(GRUPO|PF)/.test(r.ticker);}
async function selectCompany(ticker){
 if(!state.paths[ticker]){setStatus("No se encontró el JSON vigente para "+ticker);return}
 state.ticker=ticker;paintList();setStatus("Cargando "+ticker+"…");
 try{const rec=await githubJSON(state.paths[ticker]);if(rec.ticker!==ticker)throw new Error("Ticker no concilia con expediente");
 state.record=rec;paintCompany(rec);setStatus("Expediente "+ticker+" cargado · fuente main de Modelo-JMR-datos");
 const qs=new URLSearchParams(location.search);qs.set("ticker",ticker);history.replaceState(null,"","?"+qs.toString());
 }catch(e){setStatus("No se pudo cargar "+ticker+": "+e.message);}
}
function exportReviews(){
 const data={version:1,fuente:"Revisión personal local, no certificación automática",corte:"2026-10-18",exportado:new Date().toISOString(),revisiones:state.reviews};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="jmr-auditoria-multiplos-revisiones.json";link.click();URL.revokeObjectURL(url);
}
async function init(){
 state.reviews=readReviews();
 $("search").addEventListener("input",paintList);
 $("filter").addEventListener("change",e=>{state.filter=e.target.value;paintList()});
 $("companies").addEventListener("click",e=>{const b=e.target.closest("[data-ticker]");if(b)selectCompany(b.dataset.ticker)});
 $("matrixMethod").addEventListener("change",showBothMatrices);$("matrixScenario").addEventListener("change",showBothMatrices);
 $("reviewSave").addEventListener("click",()=>{
  if(!state.ticker)return;
  state.reviews[state.ticker]={estado:$("reviewState").value,nota:$("reviewNote").value.trim(),actualizado:new Date().toISOString()};
  const saved=saveReviews();reviewPanel(state.ticker);paintList();
  setStatus(saved?"Revisión local guardada para "+state.ticker+". Puedes exportarla en JSON.":"El navegador no permitió guardar; exporta las revisiones antes de salir.");
 });
 $("exportReviews").addEventListener("click",exportReviews);
 try{
  const [audit,paths,reports]=await Promise.all([
   githubJSON("auditorias/ponderaciones-38-2026-10-18.json"),
   listing("valoraciones",/^(.+)-\d{10,}\.json$/),
   listing("analisis",/^(.+)-research-.+\.json$/).catch(()=>null)
  ]);
  if(!Array.isArray(audit.entradas))throw new Error("Formato de auditoría inesperado");
  const coverage=inventory(audit,paths,reports);
  state.audit={...audit,entradas:coverage.entries};state.paths=paths;state.coverage=coverage;
  const totals=audit.resumen||{};
  const auditedCount=coverage.entries.length-coverage.unaudited.length;
  $("summary").textContent=coverage.valuation.length+' valoraciones publicadas · '+auditedCount+' incluidas en el dictamen · '+(totals.brechaMaterial??'N/D')+' brechas materiales en ese corte · '+(totals.especiales??'N/D')+' expedientes especiales. Los centros y sus cifras corresponden al corte del dictamen, no a nuevas valoraciones.';
  paintCoverage(coverage);
  paintList();
  const wanted=new URLSearchParams(location.search).get("ticker")?.toUpperCase();
  const first=wanted&&paths[wanted]?wanted:audit.entradas.find(x=>paths[x.ticker])?.ticker;
  if(first)await selectCompany(first);else setStatus("No hay empresas publicadas en la carpeta de valoraciones");
 }catch(e){setStatus("No se pudo abrir el inventario: "+e.message+". Comprueba conexión y acceso GitHub.");}
}
root.JmrMultiplesAudit={METHODS,SCENARIOS,methodView,compare,reviewList,methodsTable,historyTable,summaryCards,inventory};
if(typeof document!=="undefined")document.addEventListener("DOMContentLoaded",init);
})(typeof window!=="undefined"?window:globalThis);
