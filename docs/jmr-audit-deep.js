/* Auditoría económica ampliada — controles ejecutados sobre el expediente publicado.
 * No confirma externamente fuentes ni certifica fórmulas de Sheets.
 * Datos históricos leídos de tablas guardadas, nunca de otra empresa. */
(function(root){
"use strict";
var SECTIONS=[
"Ficha de auditoría y alcance","Resumen ejecutivo y relato económico central","Trazabilidad, integridad y jerarquía de evidencia",
"Historia financiera: diez años y punto de partida","Crecimiento de ingresos: de la historia a la proyección",
"Márgenes operativos y normalización de beneficios","Reinversión, Sales-to-Capital, ROIC/ROE y asignación de capital",
"Costo del capital y riesgo","Convergencia y valor terminal","Validación independiente del valor intrínseco",
"Cuatro historias y probabilidades","Valoración por múltiplos: prueba independiente y secundaria",
"Sensibilidades económicas y escenarios alternativos","Coherencia de hojas, cálculos y presentación",
"Hallazgos priorizados y propuestas de corrección","Catalizadores, señales de refutación y seguimiento",
"Dictamen económico y resumen para escuchar","Fuentes primarias, limitaciones y registro de versión"];
var MULTS=["EV/EBITDA","EV/FCFF","P/E","P/FCFE","P/OCF","P/V","P/BV"];
function num(v){return typeof v==="number"&&isFinite(v);}
function near(a,b,strict){return num(a)&&num(b)&&Math.abs(a-b)<=(strict?0.000001:0.025);}
function fmt(n,pct){return !num(n)?"N/D":(pct?(n*100).toFixed(2)+" %":n.toLocaleString("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2}));}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function decode(s){return String(s||"").replace(/&#x([0-9a-f]+);/gi,function(_,c){return String.fromCharCode(parseInt(c,16));})
.replace(/&#(\d+);/g,function(_,c){return String.fromCharCode(parseInt(c,10));})
.replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g,function(c){return {"&nbsp;":" ","&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'"}[c];});}
function parseSheet(html){
 if(typeof html!=="string"||!html.includes("<table"))return [];
 var rows=[];
 (html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)||[]).forEach(function(tr){
  var cols=[];
  (tr.match(/<(?:td|th)\b[^>]*>[\s\S]*?<\/(?:td|th)>/gi)||[]).forEach(function(td){
   cols.push(decode(td.replace(/<[^>]*>/g,"").trim()));
  });if(cols.length)rows.push(cols);
 });return rows;
}
function decimal(s){
 if(num(s))return s;
 s=String(s==null?"":s).trim();
 if(!s||/^(?:N\/D|N\/P|N\/A|—|#)/i.test(s))return null;
 s=s.replace(/[−–]/g,"-").replace(/[^0-9,.-]/g,"");
 if(!s||s==="-")return null;
 var comma=s.lastIndexOf(","),dot=s.lastIndexOf(".");
 if(comma>=0&&dot>=0)s=comma>dot?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
 else if(comma>=0)s=s.replace(",",".");
 var v=Number(s);return isFinite(v)?v:null;
}
function findLine(rows,label){return rows.find(function(r){return r[0]===label;});}
function historical(v){
 var sheets=Object.assign({},v.hojas&&v.hojas.financieros,v.hojas&&v.hojas.valoracion,v.hojas&&v.hojas.analisis);
 var definitions=[
  ["Ingresos","Income Statement","Total Revenues",false],
  ["Crecimiento interanual","Income Statement","Total Revenues %Chg",true],
  ["Margen EBIT","Márgenes","Operating Margin",true],
  ["ROIC","Eficiencia de capital","Return on Invested Capital",true],
  ["ROE","Eficiencia de capital","Return on Equity",true],
  ["Flujo operativo","Cash Flow Statement","Cash from Operating Activities",false],
  ["Flujo de caja libre reportado","Cash Flow Statement","Free Cash Flow",false],
  ["Acciones en circulación","Income Statement","Shares Outstanding",false]
 ];
 var result=[];
 definitions.forEach(function(d){
  var rows=parseSheet(sheets[d[1]]),head=rows.find(function(row){return row.some(function(v){return /^(?:20\d{2}|19\d{2})$/.test(v);});})||[];
  var line=findLine(rows,d[2]),points=[],ltm=null;
  if(line)head.forEach(function(col,i){
   var val=decimal(line[i]);if(d[3]&&val!=null)val/=100;
   if(/^20\d{2}$/.test(col)){if(val!=null)points.push({year:Number(col),v:val});}
   if(/LTM|TTM/i.test(col))ltm={label:col,v:val};
  });
  points.sort(function(a,b){return a.year-b.year;});
  var last=points.slice(-1)[0],hist=points.slice(-10),aver=function(n){
   var x=points.slice(-n);return x.length===n?x.reduce(function(s,p){return s+p.v;},0)/n:null;
  };
  var vals=hist.map(function(p){return p.v;});
  var cagr={};if(d[0]==="Ingresos"&&last) [3,5,9].forEach(function(years){
   var old=points.find(function(p){return p.year===last.year-years;});
   cagr[years]=old&&old.v>0&&last.v>0?Math.pow(last.v/old.v,1/years)-1:null;
  });
  result.push({name:d[0],sheet:d[1],label:d[2],pct:d[3],years:points.length,first:points[0]||null,last:last||null,ltm:ltm,avg3:aver(3),avg5:aver(5),avg10:aver(10),
    min:vals.length?Math.min.apply(null,vals):null,max:vals.length?Math.max.apply(null,vals):null,cagr:cagr});
 });
 return result;
}
function analyze(v,markdown){
 v=v||{};markdown=String(markdown||"");
 var checks=[],issues=[],sheets=Object.assign({},v.hojas&&v.hojas.financieros,v.hojas&&v.hojas.valoracion,v.hojas&&v.hojas.analisis);
 function check(area,label,actual,expected,desc){
  var status=!num(actual)||!num(expected)?"nd":near(actual,expected,/probabilidades|Peso |pesos /i.test(label))?"ok":"fail";
  checks.push({area:area,label:label,status:status,actual:actual,expected:expected,detail:desc||""});
  if(status==="fail")issues.push({severity:"Alto",label:label,detail:"La cifra registrada no concilia con el recálculo disponible. "+(desc||"")});
 }
 function issue(severity,label,detail){issues.push({severity:severity,label:label,detail:detail});}
 var method=/SOTP/i.test(v.metodoPrincipal||"")||v.valoracionHolding?"SOTP":/FCFE|DDM|RESIDUAL/i.test(v.metodoPrincipal||"")?"FCFE":"DCF";
 var sc=(v.escenariosDCF&&v.escenariosDCF.historias)||(v.valorEsperado&&v.valorEsperado.historias)||[];
 var byId={};sc.forEach(function(s){byId[s.id]=s;});
 var base=byId.A||sc.find(function(h){return /^base$/i.test(h.nombre||"");});
 var normal=["B","A","D"].map(function(k){return byId[k];}).filter(Boolean);
 var disruption=byId.C||sc.find(function(h){return /disrup/i.test(h.nombre||"");});
 var probabilities=sc.every(function(x){return num(x.probabilidad)&&x.probabilidad>=0;});
 var totalMass=probabilities?sc.reduce(function(a,x){return a+x.probabilidad;},0):null;
 var ordinaryMass=probabilities&&normal.length===3?normal.reduce(function(a,x){return a+x.probabilidad;},0):null;
 var expectation=num(ordinaryMass)&&ordinaryMass>0&&normal.every(function(x){return num(x.valor);})
    ?normal.reduce(function(a,x){return a+x.valor*x.probabilidad;},0)/ordinaryMass:null;
 var va=v.valorEsperado||{},dm=v.descuentoMultiples||{},audit=v.auditoria||{};
 if(method==="DCF"){
  check("DCF","DCF Base frente al principal",base&&base.valor,v.valorPrincipal,"Se compara valor presente, no precio FY+3.");
  check("DCF","DCF Base frente al campo DCF hoy",dm.dcfHoy&&dm.dcfHoy.base,v.valorPrincipal,"Valor Base actual.");
  check("DCF","DCF Base frente al campo de valor esperado",va.dcfBase,v.valorPrincipal,"El promedio no sustituye al DCF Base.");
 }
 if(sc.length){
  check("Escenarios","Suma de probabilidades",totalMass,1,"Cuatro historias, incluida disrupción.");
  check("Escenarios","Promedio ordinario de tres historias",expectation,va.valor,"Solo Conservador, Base y Optimista, normalizando sus probabilidades existentes.");
  if(disruption&&v.escenariosDCF&&v.escenariosDCF.disrupcionSeparada!==true)issue("Alto","Disrupción no aislada","La historia extrema debe quedar fuera del promedio ordinario.");
  if(!probabilities)issue("Alto","Probabilidades incompletas","No es válido inventar un promedio ponderado ni asumir pesos iguales.");
 }else issue("Alto","Historias no disponibles","Falta el detalle estructurado de Conservador, Base, Optimista y Disrupción.");
 var mos=num(v.mos)?(v.mos>1?v.mos/100:v.mos):null;
 check("DCF","MOS sobre el valor principal",num(v.valorPrincipal)&&num(mos)?v.valorPrincipal*(1-mos):null,v.precioMOS,"El MOS debe aplicarse al DCF Base o método intrínseco principal.");
 var ms=Array.isArray(v.metodos)?v.metodos:[],modes=Array.isArray(dm.metodos)?dm.metodos:[];
 var modelWeight=ms.reduce(function(s,m){return s+(num(m.peso)?m.peso:0);},0);
 if(ms.length)check("Múltiplos","Suma de los pesos del tablero",modelWeight,1,"Métodos incluidos, aun con peso 0.");
 var weightM=modes.reduce(function(s,m){return s+(num(m.peso)?m.peso:0);},0);
 if(modes.length)check("Múltiplos","Peso total de múltiplos presentes",weightM,dm.pesoMultiplos,"No sumar pesos relativos como si fueran globales.");
 if(num(dm.pesoDcf)&&num(dm.pesoMultiplos))check("Múltiplos","Peso DCF más múltiplos",dm.pesoDcf+dm.pesoMultiplos,1);
 var k=dm.costoPatrimonio,baseRows=[],priceWeighted=0,validRows=true,fy3Weighted=0;
 MULTS.forEach(function(name){
  var m=modes.find(function(x){return x.nombre===name;});
  var fy=ms.find(function(x){return x.nombre===name;});
  var b=m&&m.base,ratio=(m&&num(dm.pesoMultiplos)&&dm.pesoMultiplos>0&&num(m.peso))?m.peso/dm.pesoMultiplos:null;
  if(m)check("Múltiplos",name+": peso relativo",ratio,m.pesoRelativo,"Peso condicional entre métodos no DCF.");
  if(b&&Array.isArray(b.vp)){
   var chosen=/solo\s*3/i.test(dm.criterio||"")?b.vp[2]:b.vp.length===3&&b.vp.every(num)?b.vp.reduce(function(a,x){return a+x;},0)/3:null;
   check("Múltiplos",name+": consolidación al presente",chosen,b.consolidado,"Respeta horizonte/criterio que consta en el registro.");
   if(Array.isArray(b.fy))check("Múltiplos",name+": FY+3 contra tabla de métodos",b.fy[2],fy&&fy.base);
   if(num(k)&&k>0&&Array.isArray(b.fy)&&/dividendos?\s+(?:proyectados?\s+)?cero/i.test(dm.formula||"")){
    check("Múltiplos",name+": VP3 sin dividendos",b.fy[2]/Math.pow(1+k,3),b.vp[2],"Solo aplica porque el registro declara dividendos proyectados cero.");
   }
  }
  if(m&&b&&num(b.consolidado)&&num(m.peso))priceWeighted+=m.peso*b.consolidado;
  else if(m&&num(m.peso)&&m.peso>0)validRows=false;
  if(fy&&num(fy.peso)&&num(fy.base))fy3Weighted+=fy.peso*fy.base;
  else if(fy&&num(fy.peso)&&fy.peso>0)validRows=false;
  baseRows.push({name:name,peso:m&&m.peso,ratio:ratio,fy3:fy&&fy.base,vp:b&&b.consolidado,center:(v.sensibilidadMultiples&&v.sensibilidadMultiples.controles||[]).find(function(c){return c.metodo===name&&c.escenario==="base";})});
 });
 var ml=validRows&&num(dm.pesoMultiplos)&&dm.pesoMultiplos>0?priceWeighted/dm.pesoMultiplos:null;
 check("Múltiplos","Valor relativo consolidado Base",ml,dm.multiplesHoy&&dm.multiplesHoy.base,"Suma de VP por método ponderada con pesos relativos.");
 var recombined=num(ml)&&num(dm.pesoDcf)&&num(dm.pesoMultiplos)&&dm.dcfHoy&&num(dm.dcfHoy.base)?
   dm.pesoDcf*dm.dcfHoy.base+dm.pesoMultiplos*ml:null;
 check("Múltiplos","Ponderado presente Base",recombined,dm.ponderadoHoy&&dm.ponderadoHoy.base,"Combinación secundaria; no reemplaza el valor intrínseco Base.");
 check("Múltiplos","Ponderado presente frente al tablero",recombined,v.valorPresentePonderado&&v.valorPresentePonderado.base);
 var dcfFy3=ms.find(function(x){return /DCF/i.test(x.nombre||"");});
 if(dcfFy3&&num(dcfFy3.peso)&&num(dcfFy3.base))fy3Weighted+=dcfFy3.peso*dcfFy3.base;
 if(ms.length)check("Múltiplos","Objetivo FY+3 ponderado",fy3Weighted,v.objetivoPonderado&&v.objetivoPonderado.base);
 if(num(k)&&k>0&&base&&num(base.valor)&&ms.some(function(x){return /DCF/i.test(x.nombre||"");})){
  var dcfRow=ms.find(function(x){return /DCF/i.test(x.nombre||"");});
  check("DCF","Capitalización DCF hoy hacia FY+3",base.valor*Math.pow(1+k,3),dcfRow.base,"Horizonte explícito a tres años; no confundir con DCF presente.");
 }
 var ci=v.crecimientoImplicito||{};
 if(ci.controles){
  check("DCF inverso","Residuo de reproducción declarado",ci.controles.residual,0,"El residuo proviene del control guardado; no recalcula el solver original.");
 }
 var inverseGap=num(ci.cagrImplicito)&&num(ci.cagrBase)?ci.cagrImplicito-ci.cagrBase:null;
 var marketGap=num(v.precio)&&base&&num(base.valor)&&base.valor>0?v.precio/base.valor-1:null;
 var assumptions=[];
 var assumptionsSheet=parseSheet(sheets["Supuestos Recomendados"]);
 var vo=parseSheet(sheets["Valuation output"]);
 var mRow=findLine(vo,"EBIT (Operating) margin");
 var firstYearMargin=mRow?decimal(mRow[2]):null;
 var rates=base&&Array.isArray(base.crecimientoAnual)?base.crecimientoAnual:null;
 var cagr25=rates&&rates.length>=5&&rates.slice(1,5).every(num)?
   Math.pow(rates.slice(1,5).reduce(function(acc,g){return acc*(1+g);},1),1/4)-1:null;
 [
  ["Revenue growth rate - año 1","Crecimiento año 1",rates&&rates[0],true],
  ["CAGR ingresos efectivo años 1–5","CAGR ingresos 1–5",base&&base.crecimiento,true],
  ["CAGR ingresos efectivo años 2–5","CAGR ingresos 2–5",cagr25,true],
  ["Margen EBIT año 1 Base · ACTIVO","Margen EBIT año 1",num(firstYearMargin)?firstYearMargin/100:null,true],
  ["Margen EBIT objetivo Base · ACTIVO","Margen EBIT objetivo",base&&base.margen,true],
  ["Sales to capital ratio - años 1-5","Sales-to-Capital",base&&(base.s2c||base.salesToCapital),false]
 ].forEach(function(row){
  var source=findLine(assumptionsSheet,row[0]),value=source?decimal(source[1]):null;
  if(num(value)&&row[3])value/=100;
  var status=!num(value)||!num(row[2])?"N/D":Math.abs(value-row[2])<=(row[3]?0.001:0.02)?"Conciliado":"Revisar origen";
  assumptions.push({label:row[1],source:value,model:row[2],pct:row[3],status:status});
  if(status==="Revisar origen")issue("Alto","Diferencia de supuestos activos: "+row[1],
   "Hoja activa: "+fmt(value,row[3])+" frente al DCF publicado: "+fmt(row[2],row[3])+
   ". Verificar fórmula, unidad, fecha y versión sin modificar hipótesis automáticamente.");
 });
 var histReference=findLine(assumptionsSheet,"Referencia histórica EBIT (21,30 % · NO activa en DCF)");
 if(histReference)assumptions.push({label:"Referencia histórica EBIT, no activa",source:decimal(histReference[1])/100,
   model:null,pct:true,status:"Solo referencia"});
 var histori=historical(v);
 var rev=histori.find(function(x){return x.name==="Ingresos";}),growth=histori.find(function(x){return x.name==="Crecimiento interanual";}),margin=histori.find(function(x){return x.name==="Margen EBIT";}),roic=histori.find(function(x){return x.name==="ROIC";});
 if(rev&&rev.years<10)issue("Medio","Historia de ingresos insuficiente","Serie legible de "+rev.years+" años en hoja, máximo solicitado 10.");
 if(!rev||!rev.ltm||!num(rev.ltm.v))issue("Alto","LTM de ingresos no verificable","Falta línea LTM legible para comparación histórica.");
 // Comprobación LTM reproducible cuando la hoja de fuentes contiene FY + 9M actual − 9M comparable.
 var ltms=[],ltmRows=parseSheet(sheets["Fuentes SEC y LTM"]);
 var lh=ltmRows.find(function(r){return r.some(function(x){return /9M2026|9M2025/.test(x);});})||[];
 // Solo filas con fuente SEC explícita en columna F: el bloque inferior es una serie
 // histórica de diez años y NO tiene columnas FY2025/9M2025/9M2026/LTM.
 var headerIndex=ltmRows.findIndex(function(r){return (r[0]||"").trim()==="Rubro"&&
  /FY2025/.test(r[1]||"")&&/9M2025/.test(r[2]||"")&&/9M2026/.test(r[3]||"")&&/LTM/.test(r[4]||"");});
 if(lh.length>=5&&headerIndex>=0)ltmRows.slice(headerIndex+1).forEach(function(r){
  if(!r[0]||!/sec\.gov\//i.test(r[5]||""))return;
  var x=decimal(r[1]),y=decimal(r[2]),z=decimal(r[3]),w=decimal(r[4]);
  if([x,y,z,w].every(num)){var match=near(x+z-y,w);ltms.push({name:r[0],actual:x+z-y,registered:w,ok:match});
   if(!match)issue("Alto","LTM: "+r[0],"FY anterior + acumulado actual − acumulado comparable no coincide con el LTM registrado.");}
 });
 if(ltms.length)checks.push({area:"LTM",label:"Puente LTM verificado: "+ltms.filter(function(x){return x.ok;}).length+"/"+ltms.length,status:ltms.every(function(x){return x.ok;})?"ok":"fail",detail:"Fuente: hoja Fuentes SEC y LTM; conciliación aritmética con cifras publicadas.",actual:null,expected:null});
 var sensSheet=parseSheet(sheets["Sensibilidad DCF e inverso"]),titleAt=sensSheet.findIndex(function(row){return /WACC terminal.*crecimiento perpetuo/i.test(row[0]||"");});
 var center=titleAt>=0&&sensSheet[titleAt+4]?decimal(sensSheet[titleAt+4][3]):null;
 if(center!=null)check("Sensibilidad","Centro DCF WACC terminal × g",center,v.valorPrincipal,"Centro de matriz registrada; no se reejecuta el modelo para toda la grilla.");
 var sm=v.sensibilidadMultiples||{},senControls=Array.isArray(sm.controles)?sm.controles:[],senOk=senControls.filter(function(c){return c.estado==="OK";}).length;
 var senNd=senControls.filter(function(c){return c.estado==="N/D";}).length;
 baseRows.forEach(function(m){if(m.center&&m.center.estado==="OK")check("Sensibilidad",m.name+": centro de matriz Base",m.center.centro,m.vp,"Centro calculado previamente, contrastado ahora contra consolidado VP.");});
 if(senNd>0)issue("Medio","Matrices de múltiplos incompletas",senNd+" controles de sensibilidad constan N/D; no se presume que se ejecutaron.");
 var secMatches=[...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)\s*$/gm)],seen={};
 secMatches.forEach(function(m){seen[Number(m[1])]=m[2].trim();});
 var sectionDetail=SECTIONS.map(function(s,i){return {number:i+1,title:s,present:seen[i+1]===s,otherHeading:seen[i+1]||null};});
 var sectionCount=sectionDetail.filter(function(s){return s.present;}).length;
 if(sectionCount<18)issue("Alto","Informe narrativo incompleto",sectionCount+"/18 títulos obligatorios exactos; faltan "+(18-sectionCount)+" secciones contractuales. El texto existente puede contener evidencia útil, pero no cumple el formato.");
 if(!markdown)issue("Alto","Sin informe narrativo verificable","No se recibió texto para auditar cobertura o argumentos.");
 var sources=v.fuentes&&v.fuentes.sources||{},sourceRows=Object.keys(sources).map(function(key){return Object.assign({key:key},sources[key]);});
 if(!sourceRows.length)issue("Alto","Sin inventario de fuentes","No consta origen, fecha y período por dato del expediente.");
 if(!sheets["Supuestos Recomendados"])issue("Medio","Sin hoja de supuestos justificados","Falta una tabla trazable de valores y anclas histórica/sectorial.");
 if(!sheets["Cost of capital worksheet"])issue("Alto","Costo de capital sin hoja","No se ha provisto cálculo de WACC/Ke que permita auditar fechas y premisas.");
 if(!sheets["Múltiplos históricos"])issue("Medio","Anclas históricas de múltiplos ausentes","No se puede revisar contra precio relativo propio.");
 if(!sheets["Financials Multiples"])issue("Medio","Denominadores de múltiplos no publicados","No se pueden examinar denominadores FY+3 por método.");
 if(modes.length<7)issue("Medio","Menos de siete múltiplos","Faltan métodos (también se exigen los de peso cero).");
 var reserves=(v.salvedades||[]).map(function(s){return {severity:"Reserva publicada",label:String(s),detail:"Requiere evidencia adicional o criterio económico antes de un dictamen sin reservas."};});
 if(reserves.length)issue("Alto","Reservas formales sin cerrar",reserves.length+" salvedades registradas; ninguna se considera resuelta por un test aritmético.");
 var critical=checks.filter(function(x){return x.status==="fail";}).length;
 return {ticker:v.ticker||"",method:method,checks:checks,issues:issues,reserves:reserves,scenarios:sc,
  weighted:expectation,ordinaryMass:ordinaryMass,disruption:disruption,base:base,marketGap:marketGap,inverseGap:inverseGap,
  historic:histori,assumptions:assumptions,methods:baseRows,sourceRows:sourceRows,ltm:ltms,sections:sectionDetail,sectionCount:sectionCount,
  sensitivity:{total:senControls.length,ok:senOk,nd:senNd,dcfCenter:center},missingEvidence:[
    "Conciliación de fórmulas y celdas contra archivo original ejecutable",
    "Confirmación de cifras primarias SEC/BVC y períodos originales",
    "Verificación externa de Rf, ERP, beta, Ke, WACC y fuentes fechadas",
    "Comparables homogéneos de los siete múltiplos y anclas A/B/C justificadas",
    "Reejecución independiente de toda la matriz DCF y sensibilidades económicas",
    "Revisión cualitativa y aprobación de las 18 secciones del informe"
  ],verdict:critical?"Inconsistencias matemáticas detectadas":(reserves.length||sectionCount<18||senNd?"Auditoría ampliada condicionada":"Conciliaciones internas sin diferencias; verificación externa pendiente")};
}
function report(a,v){
 var h="<div class='jmr-deep-report'><p class='notice'><strong>"+esc(a.verdict)+"</strong>. Esta pantalla recalcula controles sobre registros guardados; no examina por sí sola los estados originales de la SEC ni una hoja con fórmulas ejecutables.</p>";
 function table(head,rows){return "<div class='jmr-deep-scroll'><table><thead><tr>"+head.map(function(x){return "<th>"+esc(x)+"</th>";}).join("")+"</tr></thead><tbody>"+rows.map(function(row){return "<tr>"+row.map(function(x){return "<td>"+esc(x)+"</td>";}).join("")+"</tr>";}).join("")+"</tbody></table></div>";}
 h+="<h3>1. Controles reproducibles y discrepancias</h3>";
 h+="<p class='small muted'>Concilia: "+a.checks.filter(function(c){return c.status==="ok";}).length+" · Diferencias: "+a.checks.filter(function(c){return c.status==="fail";}).length+" · No verificables: "+a.checks.filter(function(c){return c.status==="nd";}).length+". No equivalen a auditoría externa.</p>";
 h+=table(["Bloque","Prueba","Resultado","Cálculo / evidencia"],a.checks.map(function(x){return [x.area,x.label,x.status==="ok"?"Conciliado":x.status==="fail"?"DIFERENCIA":"N/D",num(x.actual)||num(x.expected)?"Recalculado "+fmt(x.actual)+" · Registro "+fmt(x.expected)+(x.detail?" · "+x.detail:""):x.detail];}));
 h+="<h3>2. Historia financiera: comparación de hasta 10 años y LTM</h3><p class='small muted'>Promedios simples anuales sobre datos publicados en las hojas guardadas, separados del último LTM. N/D no se transforma en cero; comparabilidad y ajustes contables todavía requieren validación.</p>";
 h+=table(["Métrica","Último FY","LTM","Prom. 3A","Prom. 5A","Prom. 10A","Rango histórico"],a.historic.map(function(r){var f=function(x){return fmt(x,r.pct);};return [r.name,(r.last?r.last.year+": ":"")+f(r.last&&r.last.v),r.ltm?r.ltm.label+": "+f(r.ltm.v):"N/D",f(r.avg3),f(r.avg5),f(r.avg10),f(r.min)+" – "+f(r.max)];}));
 h+="<h3>Reconciliación LTM desde la hoja de fuentes</h3><p class='small muted'>Para flujos acumulados: FY anterior + 9M actual − 9M comparable = LTM. Las diferencias pueden reflejar clasificación o perímetro; deben documentarse, no corregirse a ciegas.</p>";
 h+="<p>Puentes publicados: "+a.ltm.filter(function(x){return x.ok;}).length+"/"+a.ltm.length+" concilian con tolerancia máxima de 0,025 unidades de la tabla.</p>";
 h+=table(["Rubro","LTM calculado","LTM registrado","Estado"],a.ltm.map(function(x){return [x.name,fmt(x.actual),fmt(x.registered),x.ok?"Concilia":"REVISAR"]; }));
 var rev=a.historic.find(function(x){return x.name==="Ingresos";}),margin=a.historic.find(function(x){return x.name==="Margen EBIT";}),roic=a.historic.find(function(x){return x.name==="ROIC";});
 h+="<p class='small muted'>CAGR de ingresos FY: 3 años "+fmt(rev&&rev.cagr[3],true)+", 5 años "+fmt(rev&&rev.cagr[5],true)+", 9 años "+fmt(rev&&rev.cagr[9],true)+". Se usan años fiscales completos, no se sustituye FY por LTM.</p>";
 h+="<h3>3. Contraste de hipótesis y mecanismo económico</h3>";
 h+=table(["Hipótesis Base","Modelo","Referencia histórica publicada","Pregunta de auditoría"],[
 ["Crecimiento ingresos (CAGR 1–5)",fmt(a.base&&a.base.crecimiento,true),"Último interanual LTM: "+fmt((a.historic.find(function(x){return x.name==="Crecimiento interanual";})||{}).ltm&&a.historic.find(function(x){return x.name==="Crecimiento interanual";}).ltm.v,true),"¿Volumen, precio, mezcla, adquisiciones o expansión sostienen la trayectoria?"],
 ["Margen EBIT sostenible",fmt(a.base&&a.base.margen,true),"Margen LTM "+fmt(margin&&margin.ltm&&margin.ltm.v,true)+" · promedio 5A "+fmt(margin&&margin.avg5,true),"¿Qué escala o eficiencia permite converger y cuáles son los riesgos de reversión?"],
 ["ROIC terminal",fmt(a.base&&a.base.roicTerminal,true),"ROIC LTM "+fmt(roic&&roic.ltm&&roic.ltm.v,true),"¿Qué ventaja persiste? Comparar con WACC terminal comprobado; una diferencia no es error automático."],
 ["Sales-to-Capital",fmt(a.base&&(a.base.s2c||a.base.salesToCapital)),"Serie histórica comparable: N/D si no se reconstruye","¿Las ventas incrementales requieren la misma reinversión que la industria?"],
 ["Crecimiento a perpetuidad",fmt(a.base&&a.base.terminalGrowth,true),"Comparar con moneda, inflación, Rf y WACC terminal: verificación documental pendiente","¿Es sostenible g a perpetuidad y hay diferencial WACC−g positivo?"]
 ]);
 h+="<p class='small muted'>Comparación de los supuestos ACTIVOS entre hoja y DCF publicado. La referencia histórica EBIT se muestra aparte: no reemplaza el margen objetivo del escenario Base. CAGR 1–5 y 2–5 utilizan horizontes distintos.</p>";
 h+=table(["Supuesto","Hoja de supuestos","Historia Base","Control"],a.assumptions.map(function(x){return [x.label,fmt(x.source,x.pct),fmt(x.model,x.pct),x.status];}));
 h+="<h3>4. Escenarios DCF y DCF inverso</h3>";
 h+=table(["Historia","Probabilidad publicada","Valor por acción","Crecimiento","Margen","ROIC terminal","g terminal"],(a.scenarios||[]).map(function(x){return [x.nombre||x.id,fmt(x.probabilidad,true),fmt(x.valor),fmt(x.crecimiento,true),fmt(x.margen,true),fmt(x.roicTerminal,true),fmt(x.terminalGrowth,true)];}));
 h+="<p>Promedio ordinario de tres historias = <strong>"+fmt(a.weighted)+"</strong>, normalizando las probabilidades conservador/base/optimista que suman "+fmt(a.ordinaryMass,true)+". Disrupción = <strong>"+fmt(a.disruption&&a.disruption.valor)+"</strong>, mostrada como estrés y excluida del promedio.</p>";
 var ci=v.crecimientoImplicito||{};
 h+="<p>Precio de referencia "+fmt(v.precio)+" ("+esc(v.precioReferenciaFecha||"fecha N/D")+") frente al DCF Base "+fmt(a.base&&a.base.valor)+": prima/descuento del mercado "+fmt(a.marketGap,true)+". El DCF inverso guardado implica CAGR "+fmt(ci.cagrImplicito,true)+" frente a Base "+fmt(ci.cagrBase,true)+"; brecha "+fmt(a.inverseGap==null?null:a.inverseGap*100)+" puntos porcentuales. No se reejecutó aquí el solver ni se interpretó esto como recomendación de compra/venta.</p>";
 h+="<h3>5. Los siete múltiplos: FY+3, VP y evidencia</h3><p class='small muted'>Incluye pesos cero. Las anclas A historia, B comparables y C fundamentos deben contrastarse en el módulo especializado y las fuentes de cada emisor; N/D no significa que el múltiplo sea inaplicable.</p>";
 h+=table(["Múltiplo","Peso global","FY+3 Base","Valor presente Base","Centro de sensibilidad","Anclas A/B/C"],a.methods.map(function(x){return [x.name,fmt(x.peso,true),fmt(x.fy3),fmt(x.vp),x.center?(x.center.estado+": "+fmt(x.center.centro)):"N/D","No certificadas en esta pantalla"]; }));
 h+="<p class='small muted'>Sensibilidades de múltiplos registradas: "+a.sensitivity.ok+"/"+a.sensitivity.total+" con estado OK; "+a.sensitivity.nd+" N/D. Centro de sensibilidad DCF: "+fmt(a.sensitivity.dcfCenter)+". Un control histórico guardado no demuestra que las matrices hayan sido recalculadas hoy.</p>";
 h+="<h3>6. Trazabilidad de las fuentes</h3><p class='small muted'>Son URLs y fechas declaradas por el expediente. Esta interfaz NO comprueba que cada URL respalde efectivamente el valor correspondiente.</p>";
 h+=table(["Dato","Origen declarado","Publicación","Corte","Limitación"],a.sourceRows.map(function(x){return [x.key,x.url||"N/D",x.publication_date||"N/D",x.cutoff_date||"N/D",x.method||"N/D"]; }));
 if(!a.sourceRows.length)h+="<p class='notice'>No hay manifiesto de fuentes por dato.</p>";
 h+="<h3>7. Cumplimiento de las 18 secciones del prompt maestro</h3><p class='small muted'>"+a.sectionCount+"/18 títulos exactamente presentes en el Markdown. Un título presente no verifica la calidad ni las cifras de su contenido.</p>";
 h+=table(["Sección obligatoria","Título","Estado"],a.sections.map(function(x){return [x.number,x.title,x.present?"Estructura presente":x.otherHeading?"Falta; encabezado distinto: "+x.otherHeading:"Falta estructura / evidencia"]; }));
 h+="<h3>8. Hallazgos y salvedades priorizados</h3>";
 h+=table(["Severidad","Hallazgo","Qué falta comprobar"],a.issues.concat(a.reserves).map(function(x){return [x.severity,x.label,x.detail];}));
 h+="<h3>9. Evidencia adicional necesaria para cerrar la auditoría</h3><ol>"+a.missingEvidence.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ol><p><strong>Dictamen:</strong> "+esc(a.verdict)+". No se alteró la valoración, sus pesos ni los supuestos; el análisis es de lectura.</p></div>";
 return h;
}
root.JmrDeepAudit={analyze:analyze,render:report,parseSheet:parseSheet,historical:historical,sections:SECTIONS};
})(typeof window!=="undefined"?window:globalThis);
