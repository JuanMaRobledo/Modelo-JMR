import { loadColombiaDossiers, valuationNumbers } from "./dossiers.js";

const $ = id => document.getElementById(id);
const num = n => typeof n === "number" && Number.isFinite(n);
const cop = n => num(n) ? "COP " + new Intl.NumberFormat("es-CO", { maximumFractionDigits:0 }).format(n) : "N/D";
const pct = n => num(n) ? (100*n).toLocaleString("es-CO", {maximumFractionDigits:1}) + "%" : "N/D";
let dossiers = [], active = null;
function status(msg) { $("status").textContent=msg; }
function table(id, columns, data) {
  const root=$(id), table=document.createElement("table");
  const head=document.createElement("thead"), tr=document.createElement("tr");
  columns.forEach(col=>{const th=document.createElement("th");th.textContent=col;tr.append(th);});
  head.append(tr);table.append(head);
  const body=document.createElement("tbody");
  for(const row of data) {
    const tr=document.createElement("tr");
    row.forEach(value=>{const td=document.createElement("td");td.textContent=String(value??"N/D");tr.append(td);});
    body.append(tr);
  }
  table.append(body);root.replaceChildren(table);
}
function drawMarkdown(content) {
  const raw=String(content||"").replace(/^---\s*\n[\s\S]*?\n---\s*\n/,"").trim();
  const root=$("report"), toc=$("toc");
  toc.replaceChildren();
  const strong=document.createElement("strong");strong.textContent="Contenido";toc.append(strong);
  if(!raw){root.textContent="Todavía no se ha publicado un informe fundamental para este ticker.";return;}
  if(!window.marked||!window.DOMPurify){root.textContent=raw;return;}
  root.innerHTML=DOMPurify.sanitize(window.marked.parse(raw,{gfm:true}),{FORBID_TAGS:["script","style","form","input","iframe"]});
  root.querySelectorAll("a[href]").forEach(a=>{
    if(a.href.startsWith("https://")||a.href.startsWith("http://")){a.target="_blank";a.rel="noopener noreferrer";}
  });
  const headings=[...root.querySelectorAll("h1,h2,h3")];
  headings.forEach((h,i)=>{
    const id="fundamental-section-"+i;
    const previousId=h.id;h.id=id;
    if(previousId)root.querySelectorAll('a[href^="#"]').forEach(a=>{
      if(a.getAttribute("href")==="#"+previousId)a.setAttribute("href","#"+id);
    });
    const a=document.createElement("a");a.href="#"+id;a.textContent=h.textContent;
    if(h.tagName==="H3")a.className="depth3";
    toc.append(a);
  });
  if(!headings.length){
    const note=document.createElement("span");note.className="smallprint";
    note.textContent="El informe no tiene encabezados para crear un índice.";
    toc.append(note);
  }
}
function showSources(d, valuation) {
  const list=$("sources");list.replaceChildren();
  const seen=new Set();
  const entries=Array.isArray(d.sources)?d.sources:[];
  for(const source of entries) {
    if(!/^https:\/\//.test(source.url||"") || seen.has(source.url))continue;
    seen.add(source.url);
    const li=document.createElement("li"), link=document.createElement("a");
    link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=source.role||new URL(source.url).hostname;
    li.append(link);
    const context=document.createElement("span");context.className="smallprint";
    context.textContent=" · consultado "+(source.retrievedAt?.slice(0,10)||"fecha no informada");
    li.append(context);list.append(li);
  }
  const sheet=$("openSheet");
  if(valuation.sheet){sheet.href=valuation.sheet;sheet.hidden=false;}else{sheet.hidden=true;sheet.removeAttribute("href");}
  $("sync").textContent=(valuation.holding?"El SOTP de mercado es el valor principal; el DCF FCFF y el libro son secundarios. ":"") +"Los modelos proceden de "+valuation.source+(valuation.asOf?" · copia de resultados actualizada "+new Date(valuation.asOf).toLocaleString("es-CO",{timeZone:"America/Bogota"}):"")+". Cambios posteriores en la hoja requieren publicar de nuevo el expediente.";
}
function showReport(d) {
  const v=d.valuationSummary||{}, n=valuationNumbers(d), q="ticker="+encodeURIComponent(d.ticker);
  active=d;$("page").hidden=false;
  $("company").textContent=(d.company||d.ticker)+" · "+d.ticker;
  $("meta").textContent="Análisis del "+d.analysisDate+" · BVC · "+(d.instrument?.model||"modelo sin clasificar");
  $("scope").textContent=n.note;
  $("primary").textContent=cop(n.primary);
  $("book").textContent=cop(n.book);
  $("primaryLabel").textContent=n.holding?"SOTP mercado/NIIF · PRINCIPAL":"Valor intrínseco principal";
  $("upsideLabel").textContent=n.holding?"Potencial frente a SOTP de mercado":"Potencial frente a valor intrínseco";
  $("dcf").textContent=cop(n.base);
  $("expected").textContent=cop(n.expected);
  $("price").textContent=cop(n.price);
  $("priceDate").textContent=v.priceDate||d.analysisDate;
  $("upside").textContent=num(n.primary)&&num(n.price)&&n.price>0?pct(n.primary/n.price-1):"N/D";
  $("viewValuation").href="visor-colombia.html?"+q;
  $("openDCF").href="visor-colombia.html?"+q+"#valoracion";
  $("edit").href="colombia.html?"+q+"#research";
  $("openOriginal").href="colombia.html?"+q+"#research";
  drawMarkdown(d.reports?.research?.content);
  const cases=v.dcfFcffIntrinsicScenarios||[];
  table("scenarios",["Historia","Probabilidad","DCF FCFF por acción","Frente a precio"],cases.length?cases.map(c=>{
    const price=num(n.price)&&n.price>0?n.price:null;
    const x=c.intrinsicPerPreferredShareCOP;
    return [c.name,pct(c.weight),cop(x),num(x)&&price?pct(x/price-1):"N/D"];
  }):[["Pendiente","N/D","N/D","N/D"]]);
  const methods=v.multiplesMethods||[];
  table("relative",["Método","Valor hoy COP/acción","Peso relativo","Estado"],methods.length?methods.map(m=>[
    m.name,cop(m.today),num(m.weight)?pct(m.weight):"Excluido",
    m.status||"Sin detalle de homologación"
  ]):[["Múltiplos no publicados","N/D","N/D","Sin denominadores verificados"]]);
  showSources(d,n);
  history.replaceState(null,"",location.pathname+"?"+q+(location.hash||""));
  switchTab(location.hash.replace("#","")||"informe");
}
function switchTab(name) {
  if(!["informe","tesis","fuentes"].includes(name))name="informe";
  document.querySelectorAll("[data-tab]").forEach(b=>{
    const on=b.dataset.tab===name;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));
  });
  document.querySelectorAll("[data-panel]").forEach(el=>el.hidden=el.dataset.panel!==name);
}
async function load() {
  status("Cargando análisis colombianos y sus vínculos DCF…");
  let records=[], warning="";
  try{({dossiers:records,warning}=await loadColombiaDossiers());}
  catch(error){warning=error.message||String(error);}
  dossiers=records;
  const selector=$("ticker"),chosen=selector.value||new URLSearchParams(location.search).get("ticker")||"PFGRUPOARG.CL";
  selector.replaceChildren();
  if(!records.length){
    selector.add(new Option("No hay análisis publicados",""));
    $("page").hidden=true;status(warning||"No hay expedientes accesibles.");
    return;
  }
  records.forEach(d=>selector.add(new Option((d.company||d.ticker)+" · "+d.ticker,d.ticker)));
  selector.value=records.some(d=>d.ticker===chosen)?chosen:records[0].ticker;
  showReport(records.find(d=>d.ticker===selector.value));
  status(records.length+" expedientes de Colombia accesibles."+(warning?" Carga remota parcial: "+warning:""));
}
$("ticker").onchange=()=>showReport(dossiers.find(d=>d.ticker===$("ticker").value));
$("reload").onclick=load;
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{
  history.replaceState(null,"",location.pathname+location.search+"#"+b.dataset.tab);
  switchTab(b.dataset.tab);
}));
window.addEventListener("hashchange",()=>switchTab(location.hash.slice(1)));
$("copyReport").onclick=async()=>{
  const md=String(active?.reports?.research?.content||"").replace(/^---\s*\n[\s\S]*?\n---\s*\n/,"").trim();
  if(!md){status("No hay informe publicado para copiar.");return;}
  try{await navigator.clipboard.writeText(md);status("Análisis fundamental copiado, con 18 secciones y tablas.");}
  catch(e){status("No se pudo copiar automáticamente: "+(e?.message||"revisa los permisos del navegador"));}
};
$("exportMd").onclick=()=>{
  const md=String(active?.reports?.research?.content||"");
  if(!md){status("No hay informe publicado para exportar.");return;}
  const filename=(active.ticker||"Colombia").replace(/[^a-zA-Z0-9._-]/g,"_")+"-analisis-fundamental-"+(active.analysisDate||"reporte")+".md";
  const url=URL.createObjectURL(new Blob([md],{type:"text/markdown;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status("Archivo Markdown generado: "+filename);
};
load();