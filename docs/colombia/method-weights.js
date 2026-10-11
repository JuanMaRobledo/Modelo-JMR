// Selector de métodos JMR Colombia: sin cambiar las valoraciones calculadas.
// Preferencias por ticker en este navegador. Rebalanceo proporcional de pesos base activos.
import { valuationNumbers } from "./dossiers.js";

const fmt = n => typeof n === "number" && Number.isFinite(n)
  ? "COP " + Math.round(n).toLocaleString("es-CO") : "N/D";
const pct = n => (n * 100).toLocaleString("es-CO", {maximumFractionDigits:1}) + "%";
const numeric = n => typeof n === "number" && Number.isFinite(n);
const STORE = "jmr-colombia-metodos-v3-"; // No modificar preferencias guardadas de otros tickers.
const NEW_ARGOS_STORE = "jmr-colombia-metodos-v4-"; // Mantener preferencias de Argos separadas.
const NEW_SURA_STORE = "jmr-colombia-sura-damodaran-v2-"; // r2: base 60/40; no heredar la selección libro 60% + RE 40% anterior.
const isSura = d => d.ticker === "GRUPOSURA.CL" || d.ticker === "PFGRUPSURA.CL";
const preferenceKey = d => (isSura(d) ? NEW_SURA_STORE : d.ticker === "PFGRUPOARG.CL" ? NEW_ARGOS_STORE : STORE) + d.ticker;

export function calculateWeights(methods, selected = {}, weights = {}) {
  const rows = methods.map(m => {
    const enabled = numeric(m.value) && m.value >= 0;
    const raw = Object.prototype.hasOwnProperty.call(weights, m.id)
      ? Number(weights[m.id]) : m.defaultWeight;
    const active = enabled && (Object.prototype.hasOwnProperty.call(selected, m.id)
      ? selected[m.id] === true : m.defaultSelected === true);
    return {...m, available:enabled, active, rawWeight:Number.isFinite(raw) ? Math.max(0, raw) : 0};
  });
  const denominator = rows.reduce((sum,m) => sum + (m.active ? m.rawWeight : 0), 0);
  const effective = rows.map(m => ({...m, effectiveWeight:denominator > 0 && m.active ? m.rawWeight / denominator : 0}));
  const weighted = denominator > 0 ? effective.reduce((sum,m) => sum + (m.effectiveWeight > 0 ? m.value * m.effectiveWeight : 0), 0) : null;
  return {rows:effective, weighted, weightTotal:denominator > 0 ? effective.reduce((s,m)=>s+m.effectiveWeight,0):0, valid:denominator>0};
}

export function buildMethodCandidates(d) {
  const v = d.valuationSummary || {}, c = valuationNumbers(d), o = v.valuationOutput || {};
  const holding = d.instrument?.model === "holding";
  if (isSura(d)) {
    const b = o.bookValueProformaCOP, nav = o.bookLookThroughCOP, alt = o.roeterminalKeSensitivityCOP;
    // Regla canónica de holdings: 60% SOTP económico + 40% SOTP de múltiplos; el intrínseco RE se ofrece aparte.
    return [
      {id:"market_sotp",name:"SOTP económico · Cibest a bolsa + RE de SURA AM y Suramericana",value:o.marketSotpPrimaryCOP,defaultWeight:60,defaultSelected:true,detail:"Cibest al cierre BVC; privadas por rendimientos excedentes; resta deuda neta y VP de gastos de la matriz."},
      {id:"sector_sotp",name:"SOTP por P/E sectorial por participada",value:v.sectorSotpMultiplesCOP,defaultWeight:40,defaultSelected:true,detail:"P/E = promedio de mediana de pares LatAm y Damodaran emergentes; utilidad UDM del emisor."},
      {id:"dcf",name:"Valor intrínseco Damodaran · RE/DDM de las tres participadas",value:c.base,defaultWeight:0,defaultSelected:false,detail:"Único valor por flujos; Ke CAPM con prima país y ROE terminal según regla Damodaran. Condicionado a capital regulatorio."},
      {id:"book",name:"Patrimonio consolidado atribuible (NIIF)",value:b,defaultWeight:0,defaultSelected:false,detail:"Referencia oficial 2T26: no representa una venta forzosa ni NAV de mercado."},
      {id:"sotp_book",name:"NAV libro look-through · participadas",value:nav,defaultWeight:0,defaultSelected:false,detail:"Cuota económica del patrimonio de cada participada; correlacionado con el libro consolidado."},
      {id:"roe_ke",name:"Intrínseco RE si ROE terminal = Ke en las tres",value:alt,defaultWeight:0,defaultSelected:false,detail:"Sensibilidad, no segundo método independiente."},
      {id:"yield",name:"Dividendos/FCFE regulatorio",value:null,defaultWeight:0,defaultSelected:false,detail:"Pendiente CET1/RWA, reservas y dividendos legalmente distribuibles."},
      {id:"EV_EBITDA",name:"EV/EBITDA industrial",value:null,defaultWeight:0,defaultSelected:false,detail:"No aplica al holding financiero consolidado."}
    ];
  }
  // Bancos: el expediente declara sus pesos (p. ej. FCFE 80% + múltiplos 20%, P/B 65% / P/E 35%).
  const cw = !holding && v.combinedWeights && v.multiplesWeights ? {fcfe:v.combinedWeights.fcfe, pb:v.combinedWeights.multiples*v.multiplesWeights.pb, pe:v.combinedWeights.multiples*v.multiplesWeights.pe} : null;
  const options = [
    {id:"book", name:"Valor contable NIIF pro forma", value:holding?c.book:null,
      defaultWeight:0,defaultSelected:false,
      detail:"Patrimonio separado pro forma / acciones; indicador opcional, no representa efectivo realizable."},
    {id:"sotp_book", name:"SOTP contable por participadas · mismo libro NIIF", value:holding?c.book:null,
      defaultWeight:0,defaultSelected:false,
      detail:"Reconcilia el valor en libros desglosando las participadas. MISMA base económica que el método contable puro; desactivado por defecto para evitar duplicación estadística."},
    {id:"market_sotp", name:"SOTP económico mixto · cotizadas y privadas", value:holding?c.marketSotp:null,
      defaultWeight:holding?60:0,defaultSelected:holding,
      detail:"Cotizadas al precio vigente y privadas a referencias manager/NIIF; no es un DCF puro."},
    {id:"sector_sotp", name:"SOTP por múltiplos sectoriales · EV/EBITDA", value:holding? (numeric(v.sectorSotpMultiplesCOP)?v.sectorSotpMultiplesCOP:null):null,
      defaultWeight:holding?40:0,defaultSelected:holding&&numeric(v.sectorSotpMultiplesCOP),
      detail:"Cemento y energía a peers 2026, Odinsa/Pactia NAV gerencial; no son rutas totalmente independientes. NCI y caja disponible pendientes."},
    {id:"dcf", name:cw?"RE/FCFE financiero (después de capital regulatorio)":"DCF FCFF / SOTP por FCFF", value:c.base,
      defaultWeight:cw?Math.round(cw.fcfe*100):holding?0:60,defaultSelected:!holding,
      detail:cw?"Flujo al accionista después de retener capital regulatorio; Ke con prima país por cartera.":"Suma de valores patrimoniales de flujos descontados. En holdings puede depender de estimaciones privadas."}
  ];
  const m = Array.isArray(v.multiplesMethods)?v.multiplesMethods:[];
  const pb=m.find(x=>/P\/B|patrimonio/i.test(x.name)), dividend=m.find(x=>/dividend|dividendo|rendimiento/i.test(x.name));
  options.push({id:"pb",name:pb?.name||"P/B ajustado",value:pb?.today,
    defaultWeight:cw?Math.round(cw.pb*100):24,defaultSelected:!holding&&numeric(pb?.today),detail:pb?.status||"Múltiplo relativo; requiere anclas verificables."});
  options.push({id:"yield",name:dividend?.name||"Rendimiento por dividendo",value:dividend?.today,
    defaultWeight:holding?16:16,defaultSelected:!holding&&numeric(dividend?.today),detail:dividend?.status||"Rendimiento exigido; pagos futuros pueden ser hipotéticos."});
  const industrialNames=["EV/EBITDA","EV/FCFF","P/E","P/FCFE","P/OCF"];
  for(const name of industrialNames) {
    // Un método individual solo se activa con su propio denominador comparable.
    // Una antigua fila combinada 'P/FCFE y P/OCF' NO habilita ambas metodologías.
    const match = m.find(x => x !== pb && x !== dividend &&
      (x.name===name || x.name.startsWith(name+" ") || x.name.startsWith(name+" look-through")));
    const eligible = match && !/ y P\//i.test(match.name);
    const value=eligible && numeric(match?.today)?match.today:null;
    const bankPe = cw && name==="P/E" && numeric(value);
    options.push({id:"mult:"+name,name,value,defaultWeight:bankPe?Math.round(cw.pe*100):0,defaultSelected:bankPe,
      detail:eligible && match?.status?match.status:
      "N/D: faltan comparables homogéneos por participada. No se sustituye por cero ni por el propio DCF."});
  }
  if(holding) options.push({id:"issuer",name:"SOTP declarado por el emisor",value:null, // Referencia externa: permanece visible en el SOTP, pero no puede incluirse en un promedio de métodos propios.
    defaultWeight:0,defaultSelected:false,detail:"Solo referencia del emisor, NO metodología independiente ponderable. Consultar el importe en el panel SOTP."});
  return options;
}

function getSaved(d) {
  try { const v=JSON.parse(localStorage.getItem(preferenceKey(d))||"{}");return v&&typeof v==="object"?v:{}; }
  catch {return {};}
}
function save(d, state) {
  try {localStorage.setItem(preferenceKey(d),JSON.stringify(state));}catch {}
}
function cell(row,content) {const td=document.createElement("td");if(content instanceof Node)td.append(content);else td.textContent=String(content??"");row.append(td);return td;}

export function renderWeightSelector(d,root,onUpdate) {
  if(!root) return;
  const methods=buildMethodCandidates(d), saved=getSaved(d);
  const state={selected:{...(saved.selected||{})},weights:{...(saved.weights||{})}};
  root.replaceChildren();
  const caption=document.createElement("p");caption.className="note";
  caption.textContent = (isSura(d)
    ? "Grupo SURA: por defecto, 60% SOTP económico y 40% SOTP de múltiplos (regla canónica de holdings). El intrínseco Damodaran, el libro y el NAV contable son opcionales. Ajusta y renormaliza métodos individualmente."
    : "Activa o desactiva cada método y edita los puntos de peso. En otros holdings se conserva su ponderación original. Las preferencias se guardan por ticker en el navegador.");
  root.append(caption);
  const wrap=document.createElement("div");wrap.className="table-wrap";
  const table=document.createElement("table");table.className="method-weight-table";
  const head=document.createElement("thead");const header=document.createElement("tr");
  ["Usar","Método","Valor por acción","Peso inicial","Peso rebalanceado","Aporte COP/PF"].forEach(h=>{const th=document.createElement("th");th.textContent=h;header.append(th)});head.append(header);table.append(head);
  const body=document.createElement("tbody"), fields=[];
  const refresh=()=>{
    const result=calculateWeights(methods,state.selected,state.weights);
    for(const item of fields){
      const row=result.rows.find(r=>r.id===item.id);
      item.effective.textContent=row.available?pct(row.effectiveWeight):"N/D";
      item.contribution.textContent=row.available&&row.effectiveWeight>0?fmt(row.value*row.effectiveWeight):"—";
      item.tr.dataset.active=String(row.active);
      item.checkbox.checked=row.active;
      item.checkbox.disabled=!row.available;
      item.weightInput.disabled=!row.available;
    }
    output.textContent=result.valid?fmt(result.weighted):"N/D · selecciona al menos un método con peso positivo";
    total.textContent=result.valid?"100,0 %": "0 %";
    caveat.textContent=result.valid?"Ponderado personalizado, NO un nuevo DCF ni valor intrínseco certificado. Los métodos contable, NAV y P/B están correlacionados.":"La selección no tiene peso positivo; no se calcula ponderado.";
    save(d,state);
    if (typeof onUpdate === "function") onUpdate(result);
  };
  for(const m of methods){
    const tr=document.createElement("tr"),check=document.createElement("input");check.type="checkbox";check.setAttribute("aria-label","Incluir "+m.name);check.checked=Object.prototype.hasOwnProperty.call(state.selected,m.id)?state.selected[m.id]:m.defaultSelected;check.disabled=!numeric(m.value);
    const name=document.createElement("div");name.textContent=m.name;name.style.fontWeight="600";
    const description=document.createElement("small");description.textContent=m.detail||"";description.style.color="var(--ink-soft)";
    const title=document.createElement("div");title.append(name,description);
    const input=document.createElement("input");input.type="number";input.min="0";input.max="10000";input.step="1";input.inputMode="decimal";input.value=String(Object.prototype.hasOwnProperty.call(state.weights,m.id)?state.weights[m.id]:m.defaultWeight);input.style.width="82px";input.setAttribute("aria-label","Peso inicial de "+m.name);input.disabled=!numeric(m.value);
    const eff=document.createElement("span");
    const contribution=document.createElement("span");
    cell(tr,check);cell(tr,title);cell(tr,fmt(m.value));cell(tr,input);cell(tr,eff);cell(tr,contribution);
    check.addEventListener("change",()=>{state.selected[m.id]=check.checked;if(check.checked && !(Number(state.weights[m.id] ?? m.defaultWeight)>0)){state.weights[m.id]=10;input.value="10";}refresh();});
    input.addEventListener("input",()=>{state.weights[m.id]=Math.max(0,Number(input.value)||0);refresh();});
    body.append(tr);fields.push({id:m.id,tr,checkbox:check,weightInput:input,effective:eff,contribution});
  }
  table.append(body);wrap.append(table);root.append(wrap);
  const totals=document.createElement("div");totals.className="method-weight-result";
  const label=document.createElement("span");label.textContent="Ponderado con métodos seleccionados";
  const output=document.createElement("strong");output.className="method-weight-price";
  const weightLabel=document.createElement("span");weightLabel.textContent="Pesos efectivos: ";
  const total=document.createElement("strong");totals.append(label,output,weightLabel,total);
  const caveat=document.createElement("p");caveat.className="note";
  const reset=document.createElement("button");reset.className="btn";reset.type="button";reset.textContent="Restablecer selección y pesos";reset.addEventListener("click",()=>{state.selected={};state.weights={};fields.forEach(({id,weightInput})=>{const m=methods.find(x=>x.id===id);weightInput.value=String(m.defaultWeight)});refresh();});
  root.append(totals,caveat,reset);refresh();
}
