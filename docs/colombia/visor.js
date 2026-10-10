import { validateDossier, FIELDS } from "./core.js";
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
function getLocal(){
 try{const x=JSON.parse(localStorage.getItem(STORE)||"[]");
   return (Array.isArray(x)?x:[]).filter(d=>{try{validateDossier(d);return true;}catch{return false;}});
 }catch{return [];}
}
async function remote(){
 const res=await fetch(ROOT,{cache:"no-store",headers:{Accept:"application/vnd.github+json"}});
 if(!res.ok)throw Error("Sin acceso a expedientes publicados (HTTP "+res.status+")");
 const entries=await res.json();
 const paths=entries.filter(e=>e.type==="file"&&e.name.endsWith(".json"));
 const all=[];
 for(let i=0;i<paths.length;i+=8){
  const chunk=paths.slice(i,i+8);
  const records=await Promise.all(chunk.map(async entry=>{
   const r=await fetch(ROOT+encodeURIComponent(entry.name),{cache:"no-store"});
   if(!r.ok)return null;
   const file=await r.json();
   try{
    const bytes=Uint8Array.from(atob((file.content||"").replace(/\s/g,"")),c=>c.charCodeAt(0));
    const d=JSON.parse(new TextDecoder().decode(bytes));return validateDossier(d);
   }catch{return null;}
  }));
  all.push(...records.filter(Boolean));
 }
 return all;
}
function ordered(a,b){
 return String(b.updatedAt||b.publication?.revisedAt||b.retrievedAt||"").localeCompare(String(a.updatedAt||a.publication?.revisedAt||a.retrievedAt||""));
}
async function load(){
 showStatus("Sincronizando biblioteca Colombia…");
 const local=getLocal();let cloud=[],problem="";
 try{cloud=await remote();}catch(e){problem=e.message;}
 const merged=new Map();
 [...local,...cloud].sort(ordered).forEach(d=>{if(!merged.has(d.ticker))merged.set(d.ticker,d);});
 dossiers=[...merged.values()].sort((a,b)=>a.ticker.localeCompare(b.ticker));
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
  dcf:{hoy:dcf,peso:0.6,fy3:null},
  metodos:methodRows,mult:{hoy:multi,fy3:null,peso:0.4},
  pond:{hoy:combined,fy3:null},ve:null,hist:null,
  hoja:v.sheetUrl||v.cleanMasterSheetUrl||""
 };
 return {output:board,methods:info,dcf};
}
function render(ticker){
 const d=dossiers.find(x=>x.ticker===ticker);
 if(!d)return;active=d;
 const v=d.valuationSummary||{},quote=d.quote||{};
 $("page").hidden=false;
 const date=v.priceDate||d.analysisDate;
 const qDate=quote.quotedAt?new Date(quote.quotedAt).toLocaleDateString("es-CO",{timeZone:"America/Bogota"}):"fecha no disponible";
 safeText("company",(d.company||d.ticker)+" · "+d.ticker);
 safeText("meta","Valoración del "+d.analysisDate+" · "+(d.instrument?.model||"modelo pendiente")+" · COP");
 safeText("price",cop(v.marketPrice));safeText("priceDate","Fuente de cierre: "+date+(v.valuationOutput ? " · DCF desde Valuation output" : " · DCF legado por expediente"));
 safeText("priceAt",cop(v.marketPrice));safeText("priceAtDate",date);
 safeText("priceToday",cop(quote.price));safeText("priceTodayDate","Última cotización disponible: "+qDate);
 safeText("change",numeric(v.marketPrice)&&numeric(quote.price)&&v.marketPrice>0?pct(quote.price/v.marketPrice-1):"N/D");
 const {output,methods,dcf}=buildBoard(d);
 safeText("dcfBase",cop(dcf.base));
 safeText("dcfExp",cop(numeric(v.valuationOutput?.dcfExpectedCOP)?v.valuationOutput.dcfExpectedCOP:v.dcfPrimaryExpectedCOP));
 safeText("pDcf",numeric(v.marketPrice)&&numeric(dcf.base)&&dcf.base>0?(v.marketPrice/dcf.base).toFixed(2).replace(".",",")+"×":"N/D");
 $("board").innerHTML=output?JmrValueBoard.html(output):'<p class="note">El DCF principal todavía no está calculado. El SOTP no se presenta como si fuera FCFF.</p>';
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
 for(const [label,value] of [["SOTP bursátil / NIIF · Base",v.base],["Múltiplos independientes · VP hoy",v.multiplesWeightedToday],["SOTP + múltiplos · combinado antiguo",v.combinedWeightedToday]]){
  const el=document.createElement("div");el.className="metric";
  const l=document.createElement("small");l.textContent=label;
  const x=document.createElement("strong");x.textContent=cop(value);
  el.append(l,x);sotp.append(el);
 }
 const comps=cases.find(c=>c.name==="Base")?.breakdownCOPtrillions||{};
 const map={
  cementosConsolidatedEV:"Cementos · EV operativo",cementosEquityGroup:"Cementos · equity Grupo",
  argosUSFCFFAdditional:"Argos Materials · FCFF incremental",celsiaCoreEV:"Celsia · EV servicios",
  celsiaGrowthEV:"Celsia · EV Growth y JV",celsiaEquityGroup:"Celsia · equity Grupo",
  odinsaConcessionsEV:"Odinsa · EV concesiones",odinsaGP_EV:"Odinsa · EV gestor",
  odinsaEquityGroup:"Odinsa · equity Grupo",pactiaFundEV:"Pactia · EV fondo",
  pactiaGP_EV:"Pactia · EV gestor",pactiaEquityGroup:"Pactia · equity Grupo",
  urbanFCFF:"Desarrollo urbano · VPN",otherFCFF:"Otros · VPN",
  parentResidual:"Matriz · otros activos y pasivos netos",parentHQFCFFCost:"Matriz · VPN gastos",
  buybackCash:"Recompra · ajuste de caja"
 };
 replaceTable("components",["Concepto Base","COP billones","Naturaleza"],
  Object.entries(comps).map(([k,val])=>[map[k]||k,numeric(val)?n0(val*1000)+" mil millones":"N/D",/EV/.test(k)?"Valor empresa; NO sumar si ya se usa equity del mismo negocio":/Equity/.test(k)?"Patrimonio atribuible":"Ajuste del holding"]));
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
 const url=v.valuationOutput?.sheetUrl||v.sheetUrl||v.cleanMasterSheetUrl;
 $("links").replaceChildren();
 if(url){$("links").append(doc(url,"Hoja DCF · Modelo JMR y auditoría aritmética"));$("links").append(document.createElement("br"));}
 if(v.valuationOutput){const note=document.createElement("p");note.className="note";note.textContent="Fuente final: Valuation output. Corte de publicación: "+new Date(v.valuationOutput.synchronizedAt).toLocaleString("es-CO",{timeZone:"America/Bogota"})+". La app muestra una copia publicada de esas celdas; cambios posteriores en la hoja requieren resincronizar el expediente."; $("links").append(note);}
 for(const s of d.sources||[]){if(/^https:\/\//.test(s.url)){ $("links").append(doc(s.url,s.role||"Fuente"));$("links").append(document.createElement("br"));}}
 const q="ticker="+encodeURIComponent(d.ticker);
 $("linked").href="colombia.html?"+q+"#valuation";
 $("editResearch").href="colombia.html?"+q+"#research";
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