import { FIELDS } from "./core.js";
import { loadColombiaDossiers, valuationNumbers } from "./dossiers.js";
import { renderWeightSelector } from "./method-weights.js";
const $ = id => document.getElementById(id);
const ROOT = "https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/colombia/expedientes/";
const STORE = "jmr-colombia-dossiers-v1";
const numeric = n => typeof n === "number" && Number.isFinite(n);
const n0 = n => numeric(n) ? new Intl.NumberFormat("es-CO",{maximumFractionDigits:0}).format(n) : "N/D";
const cop = n => numeric(n) ? "COP " + n0(n) : "N/D";
const pct = n => numeric(n) ? (n * 100).toFixed(1).replace(".",",") + "%" : "N/D";
const doc = (url,text) => {
 const a=document.createElement("a");a.href=url;a.textContent=text;a.target="_blank";a.rel="noopener noreferrer";return a;
};
let dossiers=[],active=null;
function safeText(id,text) { $(id).textContent = text; }
function showStatus(s) { safeText("status",s); }
function table(headers,rows,css=""){
 const t=document.createElement("table"); if(css)t.className=css;
 const thead=document.createElement("thead"),tr=document.createElement("tr");
 headers.forEach(h=>{const th=document.createElement("th");th.textContent=h;tr.append(th);});
 thead.append(tr);t.append(thead);
 const body=document.createElement("tbody");
 rows.forEach(row=>{const r=document.createElement("tr");row.forEach(value=>{const td=document.createElement("td");td.textContent=String(value??"N/D");r.append(td);});body.append(r)});
 t.append(body);return t;
}
function replaceTable(id,headers,rows,css=""){ $(id).replaceChildren(table(headers,rows,css)); }
function markdown(id,content){
 const root=$(id),body=String(content||"").replace(/^---\s*\n[\s\S]*?\n---\s*\n/,"");
 if(!body){root.textContent="Informe no publicado en este expediente.";return;}
 if(window.marked&&window.DOMPurify){
  root.innerHTML=DOMPurify.sanitize(marked.parse(body,{gfm:true}),{FORBID_TAGS:["style","script","form","input"]});
  for(const a of root.querySelectorAll("a[href^='http']")){a.target="_blank";a.rel="noopener noreferrer";}
 }else root.textContent=body;
}
async function load(){
 showStatus("Sincronizando biblioteca Colombia…");
 const {dossiers:records,warning:problem}=await loadColombiaDossiers();
 dossiers=records;
 const select=$("ticker"),chosen=select.value||new URLSearchParams(location.search).get("ticker")||"PFGRUPOARG.CL";
 select.replaceChildren();
 for(const d of dossiers){const o=new Option((d.company||d.ticker)+" · "+d.ticker,d.ticker);select.add(o);}
 if(!dossiers.length){select.add(new Option("No hay expedientes",""));showStatus(problem||"No hay expedientes guardados.");return;}
 select.value=dossiers.some(d=>d.ticker===chosen)?chosen:dossiers[0].ticker;
 render(select.value);
 showStatus(dossiers.length+" expedientes accesibles"+(problem?" · Sincronización remota parcial: "+problem:"")+".");
}
function mapMethods(v){
 const all=Array.isArray(v.multiplesMethods)?v.multiplesMethods:[];
 const calculable=all.filter(m=>numeric(m.today)&&numeric(m.weight)&&m.weight>0);
 const weight=calculable.reduce((s,m)=>s+m.weight,0);
 return {all,calculable,weight};
}
function buildBoard(d){
 const v=d.valuationSummary||{};
 const canonical=v.valuationOutput||{};
 const cases=Array.isArray(v.dcfFcffIntrinsicScenarios)?v.dcfFcffIntrinsicScenarios:[];
 const get=n=>cases.find(c=>String(c.name).toLowerCase().includes(n))||{};
 const dcf={
   base:numeric(canonical.dcfBaseCOP)?canonical.dcfBaseCOP:(numeric(v.dcfPrimaryIntrinsicPerShareCOP)?v.dcfPrimaryIntrinsicPerShareCOP:null),
   conservador:numeric(canonical.dcfConservativeCOP)?canonical.dcfConservativeCOP:get("conserv").intrinsicPerPreferredShareCOP,
   optimista:numeric(canonical.dcfOptimisticCOP)?canonical.dcfOptimisticCOP:get("optim").intrinsicPerPreferredShareCOP
 };
 if(!numeric(dcf.base))return {output:null,methods:mapMethods(v),dcf};
 const info=mapMethods(v);
 const w=info.weight;
 const methodRows=info.calculable.map(m=>{
   const a=Array.isArray(m.anchors)?m.anchors:[];
   return {nombre:m.name,peso:m.weight/w,
     hoy:{base:m.today,conservador:numeric(a[0])?a[0]:null,optimista:numeric(a[2])?a[2]:null},
     fy3:numeric(m.year3)?{base:m.year3,conservador:null,optimista:null}:null};
 });
 const keys=["base","conservador","optimista"];
 const multi={};const combined={};
 keys.forEach(k=>{
   if(!methodRows.length){multi[k]=null;combined[k]=null;return;}
   const valid=methodRows.filter(m=>numeric(m.hoy[k]));
   const den=valid.reduce((s,m)=>s+m.peso,0);
   multi[k]=den?valid.reduce((s,m)=>s+m.peso*m.hoy[k],0)/den:null;
   combined[k]=numeric(multi[k])&&numeric(dcf[k])?0.6*dcf[k]+0.4*multi[k]:null;
 });
 const ke=v.holdingSotp?.assumptions?.holdingKe;
 const board={
  currency:"COP",precio:numeric(v.marketPrice)?v.marketPrice:d.quote?.price,
  precioLbl:"PF precio de análisis",mos:null,ke:numeric(ke)?ke:null,
  dcf:{hoy:dcf,peso:0.6,fy3:canonical.dcfYear3ExDividend||null},
  metodos:methodRows,mult:{hoy:multi,fy3:canonical.relativeYear3ExDividend||null,peso:0.4},
  pond:{hoy:combined,fy3:canonical.weightedYear3ExDividend||null},ve:null,hist:null,
  hoja:v.sheetUrl||v.cleanMasterSheetUrl||""
 };
 return {output:board,methods:info,dcf};
}
function render(ticker){
 const d=dossiers.find(x=>x.ticker===ticker);
 if(!d)return;active=d;
 const v=d.valuationSummary||{},quote=d.quote||{};
 const canonical=valuationNumbers(d);
 $("page").hidden=false;
 const date=v.priceDate||d.analysisDate;
 const qDate=quote.quotedAt?new Date(quote.quotedAt).toLocaleDateString("es-CO",{timeZone:"America/Bogota"}):"fecha no disponible";
 safeText("company",(d.company||d.ticker)+" · "+d.ticker);
 safeText("meta","Valoración del "+d.analysisDate+" · "+(d.instrument?.model||"modelo pendiente")+" · COP");
 const holding = canonical.holding; // La prioridad de holdings publicada es SOTP+múltiplos; libro y FCFF siguen como métodos opcionales.
 $("holdingPrimaryMetrics").hidden=!holding;
 $("primaryLabel").textContent=holding?"Holding · valor Base SOTP + múltiplos":"Modelo JMR Colombia · métodos de valoración";
 safeText("primaryValue",cop(canonical.primary));
 safeText("bookValue",cop(canonical.book));
 safeText("primaryUpside",numeric(v.marketPrice)&&v.marketPrice>0&&numeric(canonical.primary)?pct(canonical.primary/v.marketPrice-1):"N/D");
 safeText("price",cop(v.marketPrice));safeText("priceDate","Fuente de cierre: "+date+(v.valuationOutput ? " · DCF desde Valuation output" : " · DCF legado por expediente"));
 safeText("priceAt",cop(v.marketPrice));safeText("priceAtDate",date);
 safeText("priceToday",cop(quote.price));safeText("priceTodayDate","Última cotización disponible: "+qDate);
 safeText("change",numeric(v.marketPrice)&&numeric(quote.price)&&v.marketPrice>0?pct(quote.price/v.marketPrice-1):"N/D");
 renderWeightSelector(d,$("methodWeights"),result=>safeText("selectedWeightedValue",result.valid?cop(result.weighted):"N/D"));
 const {output,methods,dcf}=buildBoard(d);
 safeText("dcfBase",cop(numeric(canonical.base)?canonical.base:dcf.base));
 safeText("dcfExp",cop(canonical.expected));
 safeText("pDcf",numeric(v.marketPrice)&&numeric(dcf.base)&&dcf.base>0?(v.marketPrice/dcf.base).toFixed(2).replace(".",",")+"×":"N/D");
 $("board").innerHTML=holding ? '<p class="note">Holding: Base publicado = SOTP económico 60% + SOTP de múltiplos sectoriales 40%. El selector permite rebalancear los métodos; libro y DCF FCFF aparecen por separado como opcionales. Los valores privados comparten referencias y no son DCF certificado.</p>' : output ? JmrValueBoard.html(output) : '<p class="note">El DCF principal todavía no está calculado.</p>';
 const cases=Array.isArray(v.dcfFcffIntrinsicScenarios)?v.dcfFcffIntrinsicScenarios:[];
 replaceTable("scenarios",["Escenario","Probabilidad","DCF por PF (COP)","EV Cementos (millones COP)","EV Celsia (millones COP)"],
  cases.map(c=>[c.name,pct(c.weight),cop(c.intrinsicPerPreferredShareCOP),n0(c.enterpriseValueCementosCOPm),n0(c.enterpriseValueCelsiaCOPm)]));
 const all=methods.all;
 const missing=all.filter(m=>!numeric(m.today));
 replaceTable("unavailable",["Método","Valor","Explicación"],
  missing.length?missing.map(m=>[m.name,"N/D",m.status||"Sin denominadores ni comparables confirmados"]):[["Todos los métodos presentados","—","Los métodos numéricos aparecen en el tablero"]]);
 replaceTable("methods",["Método","Valor hoy","Objetivo FY+3 (exdiv.)","FY+3 descontado","Peso relativo","Fundamento"],
  all.map(m=>[m.name,cop(m.today),cop(m.year3),cop(m.year3PV),numeric(m.weight)?pct(m.weight):"No incluido",m.status||"Sin fundamento documentado"]));

 const sotp=$("sotp");sotp.replaceChildren();
 const sc=Array.isArray(v.valuationOutput?.sotpScenarios)?v.valuationOutput.sotpScenarios:[];
 const mainSotp=sc.find(s=>s.name==="Base")||{};
 const nav=numeric(v.valuationOutput?.marketSotpPrimaryCOP)?v.valuationOutput.marketSotpPrimaryCOP:(numeric(v.valuationOutput?.sotpCheck?.hybridNAVBaseCOP)?v.valuationOutput.sotpCheck.hybridNAVBaseCOP:v.base);
 for(const [label,value] of [
  ["VALOR CONTABLE NIIF PRO FORMA · OPCIONAL",canonical.book],
  ["SOTP MERCADO / NIIF · PRINCIPAL",nav],
  ["SOTP FCFF (patrimonio atribuible) · método secundario",mainSotp.valuePerPreferredShareCOP ?? v.valuationOutput?.dcfBaseCOP],
  ["NAV de la gerencia febrero 2026 · distinto método y fecha",v.valuationOutput?.sotpCheck?.managementNAVFebCOP],
  ["Múltiplos ponderados · PRINCIPAL",v.multiplesWeightedToday],
  ["VALOR BASE SOTP + SECTOR · 60%/40%",v.primaryValueCOP ?? v.combinedWeightedToday]
 ]){
  const el=document.createElement("div");el.className="metric";
  const l=document.createElement("small");l.textContent=label;
  const x=document.createElement("strong");x.textContent=cop(value);
  el.append(l,x);sotp.append(el);
 }
 const partList=Array.isArray(mainSotp.componentEquityCOPtrillions)?mainSotp.componentEquityCOPtrillions:[];
 const shares=numeric(mainSotp.economicShares)?mainSotp.economicShares:0;
 const bn=x=>numeric(x)?new Intl.NumberFormat("es-CO",{minimumFractionDigits:3,maximumFractionDigits:3}).format(x):"N/D";
 const partRows=partList.map(p=>[p.company,bn(p.equity),shares?cop(p.equity*1e12/shares):"N/D","Equity atribuible: SÍ suma al SOTP"]);
 if(partList.length)partRows.push(["TOTAL · SOTP FCFF",bn(mainSotp.totalEquityCOPtrillions),cop(mainSotp.valuePerPreferredShareCOP),"Valor intrínseco por acción del holding; proyecciones condicionadas"]);
 replaceTable("components",["Participación patrimonial (NO EV bruto)","COP billones","COP por PF","Tratamiento"],
   partRows.length?partRows:[["SOTP no disponible en este expediente","N/D","N/D","Se requiere el puente EV → equity por empresa"]]);
 const diffs=Array.isArray(v.valuationOutput?.sotpVarianceBase)?v.valuationOutput.sotpVarianceBase:[];
 replaceTable("sotpWaterfall",["Negocio / ajuste","FCFF equity · billones","Bolsa/NIIF · billones","Diferencia COP/PF","Explicación"],
  diffs.length?[
  ...diffs.map(t=>[t.component,bn(t.dcfCOPtrillions),bn(t.hybridMarketNAVCOPtrillions),cop(t.gapCOPPerShare),t.note]),
  ["TOTAL",bn(mainSotp.totalEquityCOPtrillions),bn(v.valuationOutput?.sotpCheck?.hybridNAVBaseCOP*shares/1e12),cop(v.valuationOutput?.sotpCheck?.gapCOPPerShare),"Comparación de dos SOTP distintos; no se suma NAV al FCFF"]
  ]:[["Sin conciliación publicada","N/D","N/D","N/D","Ver hoja Valuation output"]]);
 const comps=sc.find(s=>s.name==="Base")?.componentEquityCOPtrillions||[];
 const breakdown=v.fcffComponentsBase||{};
 const evKeys=[
  ["cementosConsolidatedEV","Cementos EV FCFF (antes de deuda/caja/NCI)"],
  ["celsiaCoreEV","Celsia Core EV FCFF"],
  ["celsiaGrowthEV","Celsia Growth EV estimado incremental"],
  ["odinsaConcessionsEV","Odinsa FCP concesiones EV 100% fondo"],
  ["odinsaGP_EV","Odinsa gestor GP EV"],
  ["pactiaFundEV","Pactia FCP EV 100% fondo"],
  ["pactiaGP_EV","Pactia gestor GP EV"]
 ];
 replaceTable("evDetails",["Motor de negocio","EV · COP billones","Regla de consolidación"],
   evKeys.map(([key,label])=>[label,bn(breakdown[key]),"NO sumar EV; aplicar puente EV→equity y cuota económica"]));
 const sens=Array.isArray(v.valuationOutput?.sensitivities)?v.valuationOutput.sensitivities:[];
 replaceTable("sensitivity",["Variable aislada","Efecto sobre DCF/PF","DCF Base resultante","Alcance y salvedad"],
  sens.length?sens.map(s=>[s.driver,cop(s.deltaCOPperShare),cop(s.adjustedFCFFCOP),s.scope||"Hipótesis de analista"]):[["Sin sensibilidad enlazada","N/D","N/D","Consultar controles de Valuation output"]]);
 const annual=d.observations.filter(o=>o.frequency==="annual");
 const years=[...new Set(annual.map(o=>o.fiscalDate))].sort().reverse().slice(0,10).reverse();
 const cols=["TotalRevenue","OperatingIncome","EBITDA","NetIncome","TotalDebt","CashAndCashEquivalents","OperatingCashFlow","CapitalExpenditure"];
 const rows=cols.map(key=>[FIELDS[key]?.[0]||key,...years.map(y=>{
  const v=annual.find(o=>o.field===key&&o.fiscalDate===y);
  return v? n0(v.value/1e6)+(v.currency?" "+v.currency:""):"N/D";
 })]);
 replaceTable("financials",["Concepto",...years],rows);
 markdown("fundamentalReport",d.reports?.research?.content);
 markdown("valuationReport",d.reports?.valuation?.content);
 const url=canonical.sheet;
 $("links").replaceChildren();
 if(url){$("links").append(doc(url,"Hoja DCF · Modelo JMR y auditoría aritmética"));$("links").append(document.createElement("br"));}
 if(v.valuationOutput){
   const note=document.createElement("p");note.className="note";
   note.textContent="Fuente final: Valuation output. Corte de publicación: "+new Date(v.valuationOutput.synchronizedAt).toLocaleString("es-CO",{timeZone:"America/Bogota"})+". La app muestra una copia publicada de esas celdas; cambios posteriores en la hoja requieren resincronizar el expediente.";
   $("links").append(note);
   const models=v.valuationOutput.submodels || [];
   if(models.length){
     const h=document.createElement("h4");h.textContent="Motores DCF individuales vinculados a Valuation output";$("links").append(h);
     const listing=document.createElement("div");listing.className="detail-links";
     for(const item of models){
       const a=doc(item.url,item.company+" · "+item.title);
       a.title=item.method||"Modelo DCF del negocio";
       a.style.display="block";a.style.margin="8px 0";
       listing.append(a);
     }
     $("links").append(listing);
   }
 }
 for(const s of d.sources||[]){if(/^https:\/\//.test(s.url)){ $("links").append(doc(s.url,s.role||"Fuente"));$("links").append(document.createElement("br"));}}
 const q="ticker="+encodeURIComponent(d.ticker);
 $("linked").href="colombia.html?"+q+"#valuation";
 $("editResearch").href="fundamental-colombia.html?"+q;
 history.replaceState(null,"",location.pathname+"?"+q+location.hash);
 const hash=location.hash.slice(1);activate(["resumen","fundamental","financieros","valoracion","analisis","fuentes"].includes(hash)?hash:"resumen");
}
function activate(tab){
 document.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("active",b.dataset.tab===tab);b.setAttribute("aria-selected",String(b.dataset.tab===tab));});
 document.querySelectorAll("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==tab);
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{history.replaceState(null,"",location.pathname+location.search+"#"+b.dataset.tab);activate(b.dataset.tab)});
window.addEventListener("hashchange",()=>activate(location.hash.slice(1)||"resumen"));
$("ticker").onchange=()=>render($("ticker").value);
$("reload").onclick=load;
load();