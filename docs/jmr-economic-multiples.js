/* Modelo JMR · sensibilidad económica de múltiplos justificados.
   Independiente del DCF: no recalcula DCF, MOS, pesos ni múltiplos seleccionados.
   Equilibrios de crecimiento ESTABLE, no extrapolación de CAGR FY+1..FY+3. */
(function(root){
'use strict';
const SCENARIOS=['conservador','base','optimista'];
const METHODS=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
const FACTORS=[.8,.9,1,1.1,1.2];
const DEFINITIONS={
 'EV/EBITDA':{x:'Crecimiento estable (g)',y:'ROIC sostenible',fixed:'WACC, impuestos y EBIT/EBITDA',formula:'(EBIT/EBITDA) × (1−t) × (1−g/ROIC) / (WACC−g)',need:['g','roic','wacc','tax','ebitEbitda']},
 'EV/FCFF':{x:'Crecimiento estable (g)',y:'WACC',fixed:'FCFF prospectivo ya después de reinversión',formula:'1 / (WACC−g)',need:['g','wacc']},
 'P/E':{x:'Crecimiento estable (g)',y:'Costo de equity (Ke)',fixed:'ROE sostenible; payout implícito = 1−g/ROE',formula:'(1−g/ROE) / (Ke−g)',need:['g','ke','roe']},
 'P/FCFE':{x:'Crecimiento estable (g)',y:'Costo de equity (Ke)',fixed:'FCFE prospectivo disponible para accionistas',formula:'1 / (Ke−g)',need:['g','ke']},
 'P/OCF':{x:'Crecimiento estable (g)',y:'Conversión FCFE/OCF',fixed:'Ke; conversión sostenible de OCF a FCFE',formula:'(FCFE/OCF) / (Ke−g)',need:['g','ke','conversion']},
 'P/V':{x:'Margen neto sostenible',y:'Crecimiento estable (g)',fixed:'ROE y Ke; reinversión implícita = g/ROE',formula:'Margen neto × (1−g/ROE) / (Ke−g)',need:['margin','g','roe','ke']},
 'P/BV':{x:'ROE sostenible',y:'Costo de equity (Ke)',fixed:'Crecimiento estable (g); clean surplus y capital común',formula:'(ROE−g) / (Ke−g)',need:['roe','ke','g']}
};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function number(text){
 if(text===null||text===undefined)return null;
 let s=String(text).trim().replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\u00a0/g,'');
 const percent=s.includes('%'),negative=/\([\d.,]+\)/.test(s);
 s=s.replace(/(?:COP|USD|US\$|\$|€|%|×|\s)/gi,'').replace(/[()]/g,'');
 if(!/^-?[\d.,]+$/.test(s))return null;
 if(s.includes('.')&&s.includes(','))s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
 else if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
 else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 let n=Number(s);if(!Number.isFinite(n))return null;
 if(negative)n=-n;
 return percent?n/100:n;
}
function rows(html){
 if(!html||typeof DOMParser==='undefined')return [];
 const d=new DOMParser().parseFromString(html,'text/html');
 return Array.from(d.querySelectorAll('table tr'),r=>{
  const cells=Array.from(r.querySelectorAll('td,th'),c=>({text:c.textContent.trim(),raw:c.getAttribute('data-value')}));
  return {label:cells[0]?.text?.trim()||'',cells,
   value:i=>{const v=cells[i];return v?number(v.raw!==null?v.raw:v.text):null}};
 });
}
function lastRate(row){
 if(!row)return null;
 const v=row.cells.slice(1).map(x=>number(x.raw!==null?x.raw:x.text)).filter(finite);
 return v.length?v[v.length-1]:null;
}
function firstRate(row){
 if(!row)return null;
 const v=row.cells.slice(1).map(x=>number(x.raw!==null?x.raw:x.text)).filter(finite);
 return v.length?v[0]:null;
}
function findIn(list,label,start=0,end=list.length){
 for(let i=start;i<end;i++)if(list[i].label.trim().toLowerCase()===label.toLowerCase())return list[i];
 return null;
}
function section(list,key){
 const starts=list.map((r,i)=>({...r,index:i})).filter(r=>SCENARIOS.includes(r.label.toLowerCase()));
 const target=starts.find(r=>r.label.toLowerCase()===key);
 if(!target)return [];
 const next=starts.find(r=>r.index>target.index);
 return list.slice(target.index+1,next?next.index:list.length);
}
function dcfSection(list,key){
 // Valuation output has a block per history; identify headings, not blindly reuse Base.
 const starts=list.map((r,i)=>({i,label:r.label.toLowerCase()}))
  .filter(r=>/^revenue growth rate$/i.test(r.label));
 const idx={base:0,conservador:1,optimista:2}[key];
 if(starts.length<3)return null;
 // Some publications have explicit section headings; enforce correct order if present.
 const head=list.slice(Math.max(0,starts[idx].i-4),starts[idx].i)
  .map(r=>r.label.toLowerCase()).join(' ');
 if(/historia|modelo/.test(head)&&!(head.includes(key)||key==='base'&&head.includes('modelo base')))return null;
 return list.slice(starts[idx].i,starts[idx+1]?.i??list.length);
}
function capitalCost(record){
 const list=rows(record?.hojas?.valoracion?.['Cost of capital worksheet']);
 const r=list.find(x=>/^Cost of Component$/i.test(x.label));
 const ke=firstRate(r);
 return finite(ke)&&ke>0&&ke<1?ke:null;
}
function inputs(record,scenario){
 const h=record?.hojas?.valoracion||{};
 const val=dcfSection(rows(h['Valuation output']),scenario);
 const fm=section(rows(h['Financials Multiples']),scenario);
 if(!val||!fm.length)return {error:'No están completas las historias correspondientes de Valuation output y Financials Multiples.'};
 const get=(s)=>findIn(fm,s)?.value(6);
 const rGrowth=findIn(val,'Revenue growth rate'),rCost=findIn(val,'Terminal cost of capital'),
       rRoic=findIn(val,'ROIC'),rTax=findIn(val,'Tax rate');
 const g=lastRate(rGrowth),wacc=firstRate(rCost),roic=lastRate(rRoic),tax=lastRate(rTax);
 const ke=capitalCost(record);
 const ebit=get('EBIT'),ebitda=get('EBITDA'),sales=get('Revenues'),ni=get('Net Income Normalized'),
       ocf=get('OCF'),fcfe=get('FCFE');
 const bv=typeof JmrMultiplesAxes!=='undefined'?JmrMultiplesAxes.axes(record,'P/BV',scenario)?.fundamental:null;
 const roe=finite(ni)&&finite(bv)&&bv>0?ni/bv:null;
 const margin=finite(ni)&&finite(sales)&&sales>0?ni/sales:null;
 const conversion=finite(fcfe)&&finite(ocf)&&ocf>0?fcfe/ocf:null;
 const ebitEbitda=finite(ebit)&&finite(ebitda)&&ebitda>0?ebit/ebitda:null;
 const params={g,wacc,roic,tax,ke,roe,margin,conversion,ebitEbitda};
 const source='Valuation output (g terminal, ROIC terminal, WACC terminal, impuesto terminal), Cost of capital worksheet (Ke), Financials Multiples FY+3 (margen, EBIT/EBITDA y FCFE/OCF), PBV FY+3 (equity común para ROE)';
 return {params,source};
}
function calc(method,p){
 const {g,wacc,roic,tax,ke,roe,margin,conversion,ebitEbitda}=p;
 const d=DEFINITIONS[method];if(!d||d.need.some(k=>!finite(p[k])))return null;
 if(!(g>=0&&g<.5&&g<Math.max(wacc||0,ke||0)))return null;
 if(method.startsWith('EV/')&&!(wacc>g))return null;
 if(method.startsWith('P/')&&!(ke>g))return null;
 let z=null;
 switch(method){
  case 'EV/EBITDA':
   if(!(roic>g&&tax>=0&&tax<1&&ebitEbitda>0&&ebitEbitda<=1.5))return null;
   z=ebitEbitda*(1-tax)*(1-g/roic)/(wacc-g);break;
  case 'EV/FCFF':z=1/(wacc-g);break;
  case 'P/E':
   if(!(roe>g))return null;z=(1-g/roe)/(ke-g);break;
  case 'P/FCFE':z=1/(ke-g);break;
  case 'P/OCF':
   if(!(conversion>0&&conversion<=2))return null;z=conversion/(ke-g);break;
  case 'P/V':
   if(!(roe>g&&margin>0&&margin<=1))return null;
   z=margin*(1-g/roe)/(ke-g);break;
  case 'P/BV':
   if(!(roe>g))return null;z=(roe-g)/(ke-g);break;
 }
 return finite(z)&&z>0&&z<=500?z:null;
}
function matrix(record,method,scenario){
 const def=DEFINITIONS[method],origin=inputs(record,scenario);
 if(!def)return {error:'Método desconocido'};
 if(origin.error)return {...origin,method,scenario,def};
 const p=origin.params,axes={
 'EV/EBITDA':['g','roic'],'EV/FCFF':['g','wacc'],'P/E':['g','ke'],'P/FCFE':['g','ke'],
 'P/OCF':['g','conversion'],'P/V':['margin','g'],'P/BV':['roe','ke']
 }[method];
 const [x,y]=axes;
 if(def.need.some(k=>!finite(p[k]))||!finite(p[x])||!finite(p[y]))
    return {error:'Faltan supuestos identificables: '+def.need.filter(k=>!finite(p[k])).join(', '),method,scenario,def,source:origin.source};
 const xValues=FACTORS.map(f=>p[x]*f),yValues=FACTORS.map(f=>p[y]*f);
 const table=yValues.map(yy=>xValues.map(xx=>calc(method,{...p,[x]:xx,[y]:yy})));
 const center=table[2][2];
 return {method,scenario,def,source:origin.source,params:p,xValues,yValues,table,center,
  error:center===null?'Inconsistencia económica (g ≥ tasa de descuento, ROE/ROIC insuficiente o flujos no sostenibles).':null};
}
function pct(v){return finite(v)?(100*v).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+' %':'N/D';}
function mult(v){return finite(v)?v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+'×':'N/D';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(record,method,scenario){
 const m=matrix(record,method,scenario);
 if(m.error)return '<p class="jmr-sheet-note">N/D — '+esc(m.error)+' No se generan múltiplos justificados sin fundamentos verificables. <em>No sustituye a la matriz de valor por acción.</em></p>';
 const format=(k,v)=>k==='conversion'?pct(v):pct(v);
 const x={ 'EV/EBITDA':'g','EV/FCFF':'g','P/E':'g','P/FCFE':'g','P/OCF':'g','P/V':'margin','P/BV':'roe'}[method];
 const y={ 'EV/EBITDA':'roic','EV/FCFF':'wacc','P/E':'ke','P/FCFE':'ke','P/OCF':'conversion','P/V':'g','P/BV':'ke'}[method];
 const header='<thead><tr><th scope="col">'+esc(m.def.y)+' / '+esc(m.def.x)+'</th>'+
   m.xValues.map(v=>'<th scope="col">'+format(x,v)+'</th>').join('')+'</tr></thead>';
 const body=m.table.map((row,i)=>'<tr><th scope="row">'+format(y,m.yValues[i])+'</th>'+
   row.map((z,j)=>'<td'+(i===2&&j===2?' class="jmr-matrix-base"':'')+'>'+mult(z)+'</td>').join('')+'</tr>').join('');
 const selected=record?.multiplosImplicitosDCF?.metodos?.find(z=>z.nombre===method)?.seleccionadoBase;
 return '<p class="jmr-sheet-note"><strong>Múltiplo justificado central: '+mult(m.center)+'</strong>. Múltiplo de salida seleccionado en la historia: '+(typeof selected==='number'?mult(selected):'consultar expediente')+'. Son conceptos distintos y no se igualan artificialmente.</p>'+
   '<div class="jmr-sheet-scroll"><table class="jmr-table jmr-matrix">'+header+'<tbody>'+body+'</tbody></table></div>'+
   '<p class="jmr-sheet-note"><strong>Fórmula estable:</strong> '+esc(m.def.formula)+'. Se mantienen constantes: '+esc(m.def.fixed)+'. Los factores ±20% solo determinan la amplitud; los ejes muestran porcentajes reales. Sensibilidades exploratorias, no pronósticos perpetuos ni sustitutos del DCF.</p>'+
   '<p class="jmr-sheet-note">Fuente: '+esc(m.source)+'. Validar sostenibilidad de estos supuestos antes de aprobar el método.</p>';
}
root.JmrEconomicMultiples={SCENARIOS,METHODS,DEFINITIONS,inputs,calc,matrix,render};
})(typeof window!=='undefined'?window:globalThis);
