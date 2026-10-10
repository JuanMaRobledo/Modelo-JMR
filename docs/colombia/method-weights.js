// Selector de métodos JMR Colombia: sin cambiar las valoraciones calculadas.
// Preferencias por ticker en este navegador. Rebalanceo proporcional de pesos base activos.
import { valuationNumbers } from "./dossiers.js";

const fmt = n => typeof n === "number" && Number.isFinite(n)
  ? "COP " + Math.round(n).toLocaleString("es-CO") : "N/D";
const pct = n => (n * 100).toLocaleString("es-CO", {maximumFractionDigits:1}) + "%";
const numeric = n => typeof n === "number" && Number.isFinite(n);
const STORE = "jmr-colombia-metodos-v2-";

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
  const weighted = denominator > 0 ? effective.reduce((sum,m) => sum + m.value * m.effectiveWeight, 0) : null;
  return {rows:effective, weighted, weightTotal:denominator > 0 ? effective.reduce((s,m)=>s+m.effectiveWeight,0):0, valid:denominator>0};
}

export function buildMethodCandidates(d) {
  const v = d.valuationSummary || {}, c = valuationNumbers(d), o = v.valuationOutput || {};
  const holding = d.instrument?.model === "holding";
  const options = [
    {id:"book", name:"Valor contable NIIF pro forma", value:holding?c.book:null,
      defaultWeight:holding?50:0,defaultSelected:holding,
      detail:"Patrimonio separado pro forma / acciones; referencia principal para holdings. No representa efectivo realizable."},
    {id:"market_sotp", name:"SOTP de mercado / NIIF", value:holding?c.marketSotp:null,
      defaultWeight:holding?25:0,defaultSelected:holding,
      detail:"Participadas cotizadas a mercado y activos privados a libros; correlacionado con el patrimonio."},
    {id:"dcf", name:"DCF FCFF / SOTP por FCFF", value:c.base,
      defaultWeight:holding?15:60,defaultSelected:true,
      detail:"Suma de valores patrimoniales de flujos descontados. En holdings puede depender de estimaciones privadas."}
  ];
  const m = Array.isArray(v.multiplesMethods)?v.multiplesMethods:[];
  const pb=m.find(x=>/P\/B|patrimonio/i.test(x.name)), dividend=m.find(x=>/dividend|dividendo|rendimiento/i.test(x.name));
  options.push({id:"pb",name:pb?.name||"P/B ajustado",value:pb?.today,
    defaultWeight:holding?6:24,defaultSelected:numeric(pb?.today),detail:pb?.status||"Múltiplo relativo; requiere anclas verificables."});
  options.push({id:"yield",name:dividend?.name||"Rendimiento por dividendo",value:dividend?.today,
    defaultWeight:holding?4:16,defaultSelected:numeric(dividend?.today),detail:dividend?.status||"Rendimiento exigido; pagos futuros pueden ser hipotéticos."});
  for(const mth of m) {
    if(mth===pb || mth===dividend) continue;
    options.push({id:"mult:"+String(mth.name),name:mth.name,value:mth.today,
      defaultWeight:0,defaultSelected:false,detail:mth.status||"Múltiplo secundario"});
  }
  if(holding) options.push({id:"issuer",name:"SOTP declarado por el emisor",value:o.sotpCheck?.managementNAVFebCOP ?? v.managementComparator?.perShare,
    defaultWeight:0,defaultSelected:false,detail:"Referencia gerencial externa; distinta fecha, metodología y posible correlación. No es un DCF independiente."});
  return options;
}

function getSaved(d) {
  try { const v=JSON.parse(localStorage.getItem(STORE+d.ticker)||"{}");return v&&typeof v==="object"?v:{}; }
  catch {return {};}
}
function save(d, state) {
  try {localStorage.setItem(STORE+d.ticker,JSON.stringify(state));}catch {}
}
function cell(row,content) {const td=document.createElement("td");if(content instanceof Node)td.append(content);else td.textContent=String(content??"");row.append(td);return td;}

export function renderWeightSelector(d,root) {
  if(!root) return;
  const methods=buildMethodCandidates(d), saved=getSaved(d);
  const state={selected:{...(saved.selected||{})},weights:{...(saved.weights||{})}};
  root.replaceChildren();
  const caption=document.createElement("p");caption.className="note";
  caption.textContent="Selecciona cada método y ajusta su peso inicial. Solo los métodos marcados y con valor numérico participan; sus pesos efectivos se reescalan automáticamente al 100 %. En holdings el valor contable sigue siendo la referencia principal, independiente del ponderado configurable.";
  root.append(caption);
  const wrap=document.createElement("div");wrap.className="table-wrap";
  const table=document.createElement("table");table.className="method-weight-table";
  const head=document.createElement("thead");const header=document.createElement("tr");
  ["Usar","Método","Valor por acción","Peso inicial","Peso rebalanceado"].forEach(h=>{const th=document.createElement("th");th.textContent=h;header.append(th)});head.append(header);table.append(head);
  const body=document.createElement("tbody"), fields=[];
  const refresh=()=>{
    const result=calculateWeights(methods,state.selected,state.weights);
    for(const item of fields){
      const row=result.rows.find(r=>r.id===item.id);
      item.effective.textContent=row.available?pct(row.effectiveWeight):"N/D";
      item.tr.dataset.active=String(row.active);
      item.checkbox.checked=row.active;
      item.checkbox.disabled=!row.available;
      item.weightInput.disabled=!row.available;
    }
    output.textContent=result.valid?fmt(result.weighted):"N/D · selecciona al menos un método con peso positivo";
    total.textContent=result.valid?"100,0 %": "0 %";
    caveat.textContent=result.valid?"Ponderado personalizado, NO un nuevo DCF ni valor intrínseco certificado. Los métodos contable, NAV y P/B están correlacionados.":"La selección no tiene peso positivo; no se calcula ponderado.";
    save(d,state);
  };
  for(const m of methods){
    const tr=document.createElement("tr"),check=document.createElement("input");check.type="checkbox";check.setAttribute("aria-label","Incluir "+m.name);check.checked=Object.prototype.hasOwnProperty.call(state.selected,m.id)?state.selected[m.id]:m.defaultSelected;check.disabled=!numeric(m.value);
    const name=document.createElement("div");name.textContent=m.name;name.style.fontWeight="600";
    const description=document.createElement("small");description.textContent=m.detail||"";description.style.color="var(--ink-soft)";
    const title=document.createElement("div");title.append(name,description);
    const input=document.createElement("input");input.type="number";input.min="0";input.max="10000";input.step="1";input.inputMode="decimal";input.value=String(Object.prototype.hasOwnProperty.call(state.weights,m.id)?state.weights[m.id]:m.defaultWeight);input.style.width="82px";input.setAttribute("aria-label","Peso inicial de "+m.name);input.disabled=!numeric(m.value);
    const eff=document.createElement("span");
    cell(tr,check);cell(tr,title);cell(tr,fmt(m.value));cell(tr,input);cell(tr,eff);
    check.addEventListener("change",()=>{state.selected[m.id]=check.checked;refresh();});
    input.addEventListener("input",()=>{state.weights[m.id]=Math.max(0,Number(input.value)||0);refresh();});
    body.append(tr);fields.push({id:m.id,tr,checkbox:check,weightInput:input,effective:eff});
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
