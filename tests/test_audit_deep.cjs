const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'../docs');
const js=fs.readFileSync(path.join(root,'jmr-audit-deep.js'),'utf8');
new vm.Script(js,{filename:'jmr-audit-deep.js'});
const context={window:{}};vm.runInNewContext(js,context);
const audit=context.window.JmrDeepAudit;
assert.equal(audit.sections.length,18);
function sheet(header,rows){return '<table><tbody>'+[header,...rows].map(r=>'<tr>'+r.map(s=>'<td>'+String(s)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
const yrs=['Serie','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','LTM Sep-2026'];
const prices=[100,102,103,104,105,106,107,108,109,110,111];
const rows=[['Total Revenues',...prices],['Total Revenues %Chg',...Array(11).fill('5,00%')],['Operating Profit',...prices]];
const basic={
 ticker:'TEST',metodoPrincipal:'DCF',valorPrincipal:100,mos:.3,precioMOS:70,precio:120,
 escenariosDCF:{disrupcionSeparada:true,historias:[
 {id:'A',nombre:'Base',probabilidad:.5,valor:100,crecimiento:.08,margen:.3,roicTerminal:.12,terminalGrowth:.03,s2c:1.5},
 {id:'B',nombre:'Conservador',probabilidad:.25,valor:70,crecimiento:.04,margen:.25,roicTerminal:.10,terminalGrowth:.02,s2c:1.3},
 {id:'C',nombre:'Disrupción',probabilidad:.1,valor:30,crecimiento:-.02,margen:.12,roicTerminal:.09,terminalGrowth:0,s2c:.8},
 {id:'D',nombre:'Optimista',probabilidad:.15,valor:130,crecimiento:.12,margen:.35,roicTerminal:.13,terminalGrowth:.04,s2c:1.6}]},
 valorEsperado:{dcfBase:100,valor:87/.9},
 fuentes:{sources:{financial_statements:{url:'https://www.sec.gov/example',publication_date:'2026-10-21',cutoff_date:'2026-09-30',method:'LTM'}}},
 hojas:{financieros:{'Income Statement':sheet(yrs,rows)},analisis:{
 'Márgenes':sheet(yrs,[['Operating Margin',...Array(11).fill('30,00%')]]),
 'Eficiencia de capital':sheet(yrs,[['Return on Invested Capital',...Array(11).fill('12,00%')]])},
 valoracion:{'Fuentes SEC y LTM':sheet(['Rubro','FY2025','9M2025','9M2026','LTM Sep2026'],[['Ingresos','100,00','20,00','30,00','110,00'],['Flujo negativo','-10,00','-3,00','-4,00','-11,00']]),
 'Supuestos Recomendados':sheet(['a'],[['Supuesto']]),'Cost of capital worksheet':sheet(['a'],[['WACC']]),'Múltiplos históricos':sheet(['a'],[['EV/EBITDA']]),
 'Financials Multiples':sheet(['a'],[['FY+3']]),
 'Sensibilidad DCF e inverso':sheet(['a'],[['WACC terminal × crecimiento perpetuo'],['','3%','3,5%','4%','4,5%','5%'],['8%','101','102','103','104','105'],['9%','101','102','103','104','105'],['10%','101','102','100','104','105'],['11%','101','102','103','104','105']])}},
 auditoria:{estado:'CON_SALVEDADES'},crecimientoImplicito:{cagrImplicito:.16,cagrBase:.08,controles:{residual:0}}
};
const mults=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
basic.metodos=[{nombre:'DCF Damodaran',peso:.3,base:133.1}].concat(mults.map(name=>({nombre:name,peso:.1,base:133.1})));
basic.descuentoMultiples={pesoDcf:.3,pesoMultiplos:.7,costoPatrimonio:.1,criterio:'Solo 3 años',formula:'VPn=Precio/(1+Ke)^n; dividendos proyectados cero',
dcfHoy:{base:100},multiplesHoy:{base:100},ponderadoHoy:{base:100},
metodos:mults.map(name=>({nombre:name,peso:.1,pesoRelativo:1/7,base:{fy:[110,121,133.1],vp:[100,100,100],consolidado:100}}))};
basic.objetivoPonderado={base:133.1};basic.valorPresentePonderado={base:100};
basic.sensibilidadMultiples={controles:mults.map(metodo=>({metodo,escenario:'base',estado:'OK',centro:100}))};
let md=audit.sections.map((x,i)=>'## '+(i+1)+'. '+x+'\ncontenido verificable').join('\n\n');
let out=audit.analyze(basic,md);
assert.equal(out.sectionCount,18,'18 títulos verdaderamente presentes');
assert.equal(out.ltm[0].ok,true,'puente LTM FY + acumulado actual − comparable');
assert.equal(out.ltm.length,2,'Flujos negativos no deben omitirse');
assert.equal(out.ltm[1].actual,-11,'Número negativo preservado');
assert.equal(out.historic[0].avg10,105.4,'media 10 años');
assert.equal(out.historic[0].ltm.v,111,'LTM separado de FY');
assert.equal(out.scenarios.length,4);
assert.equal(out.disruption.id,'C');
const failCases=out.checks.filter(c=>c.status==='fail');
if(failCases.length) console.error('Check details',failCases);
assert.equal(failCases.length,0,'conciliaciones estables del fixture');
assert.equal(out.methods.length,7);
assert.equal(out.sensitivity.ok,7);
assert.match(audit.render(out,basic),/18 secciones/);
let old=audit.analyze(basic,'## Alcance demostrado\nTexto');
assert.equal(old.sectionCount,0,'informes viejos no deben declararse completos');
assert.match(old.verdict,/condicionada/);
let wrong=JSON.parse(JSON.stringify(basic));wrong.valorPrincipal=125;
let flagged=audit.analyze(wrong,md);
assert.ok(flagged.checks.some(x=>x.status==='fail'),'discordancia DCF debe impedir aprobación');
assert.match(flagged.verdict,/Inconsistencias/);
const html=fs.readFileSync(path.join(root,'auditoria-integral.html'),'utf8');
assert.match(html,/src="jmr-audit-deep.js/);
assert.match(html,/renderDeep\(v,typeof narr==="string"\?narr:""\)/);
assert.match(html,/id="profundidad"/);
console.log('OK: auditoría ampliada — historial, LTM, DCF, promedio sin disrupción, 7 múltiplos, fuentes, narrativas y detección de errores');
