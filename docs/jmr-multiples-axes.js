/* Matrices de múltiplos: convertir factores internos a ejes económicos reales.
   Solo se emplean las anclas FY+3 de la MISMA hoja, historia y empresa. */
(function(root){
"use strict";
const KEYS={"EV/EBITDA":"EVEBITDA","EV/FCFF":"EVFCFF","P/E":"PE","P/FCFE":"PFCFE","P/OCF":"POCF","P/V":"PV","P/BV":"PBV"};
const DENOM={"EV/EBITDA":"EBITDA","EV/FCFF":"FCFF","P/E":"Beneficio neto","P/FCFE":"FCFE","P/OCF":"Flujo operativo","P/V":"Ventas","P/BV":"Patrimonio común"};
const SCENARIOS=["conservador","base","optimista"],FACTORS=[0.8,0.9,1,1.1,1.2];
function readNumber(cell){
 if(!cell)return null;
 const raw=cell.getAttribute("data-value");
 if(raw!==null&&raw.trim()!==""){const n=Number(raw);if(Number.isFinite(n))return n;}
 let s=cell.textContent.trim().replace(/(?:COP|USD|US\$|\$|€|×|x|\s)/gi,"").replace(/\u2212/g,"-");
 if(!/^-?[0-9.,]+$/.test(s))return null;
 if(s.includes(",")&&s.includes("."))s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
 else if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");
 else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,"");
 const n=Number(s);return Number.isFinite(n)?n:null;
}
function axes(record,method,scenario){
 const sheet=KEYS[method],i=SCENARIOS.indexOf(scenario);
 const html=record?.hojas?.valoracion?.[sheet];
 if(!sheet||i<0||typeof html!=="string"||!html.includes("<table"))return null;
 const rows=Array.from(new DOMParser().parseFromString(html,"text/html").querySelectorAll("table tr"));
 let a,b;
 const tagged=rows.filter(r=>r.hasAttribute("data-row"));
 if(tagged.length){
   const m=new Map(tagged.map(r=>[Number(r.getAttribute("data-row")),r]));
   const row=[8,19,30][i];a=m.get(row);b=m.get(row+1);
 }else{
   // Exportación antigua de un subconjunto de empresas sin etiquetas de filas.
   // No inferir ejes para EV/FCFF ni estructuras que no cumplan el patrón.
   if(!["EV/EBITDA","P/E","P/FCFE","P/OCF"].includes(method))return null;
   const starts=rows.map((r,n)=>({r,n})).filter(x=>/FY\+3\s*\(Estimate\)/i.test(x.r.textContent));
   if(starts.length!==3)return null;
   const offset=method==="EV/EBITDA"?1:2;
   a=rows[starts[i].n+offset];b=rows[starts[i].n+offset+1];
 }
 const multiple=readNumber(a?.querySelectorAll("td,th")[7]);
 const fundamental=readNumber(b?.querySelectorAll("td,th")[7]);
 if(!(multiple>0&&fundamental>0))return null;
 return {multiple,fundamental,denominator:DENOM[method]};
}
function fmt(x,mult){
 const digits=2; // Regla global: máximo dos decimales visibles, sin redondear cálculos fuente.
 return x.toLocaleString("es-CO",{minimumFractionDigits:digits,maximumFractionDigits:digits})+(mult?"×":"");
}
function labels(record,method,scenario){
 const a=axes(record,method,scenario);
 if(!a)return null;
 return {
  header:["Múltiplo / "+a.denominator+" FY+3 (unid. hoja)",...FACTORS.map(x=>fmt(x*a.fundamental,false))],
  rows:FACTORS.map(x=>fmt(x*a.multiple,true)),
  caption:"Centro: "+fmt(a.multiple,true)+" × "+fmt(a.fundamental,false)+" "+a.denominator+" FY+3 (unidades registradas en la hoja original)."
 };
}
root.JmrMultiplesAxes={axes,labels,readNumber};
})(typeof window!=="undefined"?window:globalThis);
