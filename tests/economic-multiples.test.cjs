const test=require('node:test'),assert=require('node:assert/strict');
// DOMParser mínimo en pruebas Node, sin dependencias ni cifras reales de emisores.
global.DOMParser=class {
 parseFromString(html){
  const tableRows=[...html.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g)].map(m=>{
    const attributes=m[1],inner=m[2];
    const cells=[...inner.matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map(x=>({
      textContent:x[2].replace(/<[^>]+>/g,'').trim(),
      getAttribute:(k)=>x[1].match(new RegExp(k+'="([^"]*)"'))?.[1]??null
    }));
    return {
      textContent:cells.map(x=>x.textContent).join(' '),
      getAttribute:k=>attributes.match(new RegExp(k+'="([^"]*)"'))?.[1]??null,
      hasAttribute:k=>new RegExp(k+'=').test(attributes),
      querySelectorAll:()=>cells
    };
  });
  return {querySelectorAll:()=>tableRows};
 }
};
require('../docs/jmr-multiples-axes.js');
require('../docs/jmr-economic-multiples.js');
const S=global.JmrEconomicMultiples;
const row=(cells,at)=>'<tr'+(at?' data-row="'+at+'"':'')+'>'+cells.map((c,i)=>'<td'+(typeof c==='number'?' data-value="'+c+'"':'')+'>'+c+'</td>').join('')+'</tr>';
function valuation(){
 let html='<table>';
 for(const [name,roic] of [['Base',.2],['Conservador',.15],['Optimista',.25]]){
  html+=row(['Modelo Base · historia '+name]);
  const metric=(name,v)=>row([name,...Array(11).fill(''),v]);
  html+=metric('Revenue growth rate',.03)+metric('Tax rate',.25)+metric('ROIC',roic)+row(['Terminal cost of capital',.09]);
 }
 return html+'</table>';
}
function multiples(){
 let html='<table>';
 for(const name of ['Conservador','Base','Optimista']){
  html+=row([name]);
  for(const [key,val] of [['Revenues',1000],['Net Income Normalized',150],['EBIT',200],['EBITDA',250],['FCFE',100],['OCF',160]])
   html+=row([key,...Array(5).fill(0),val]);
 }
 return html+'</table>';
}
function pbv(){
 let html='<table>';for(const [i,j] of [[8,9],[19,20],[30,31]]){
  html+=row(['P/BV',...Array(6).fill(1),1],i);
  html+=row(['Patrimonio común proyectado',...Array(6).fill(1000),1000],j);
 }return html+'</table>';
}
const record={hojas:{valoracion:{
 'Valuation output':valuation(),
 'Financials Multiples':multiples(),
 'Cost of capital worksheet':'<table>'+row(['Cost of Component',.11])+'</table>',
 'PBV':pbv()
}}};
test('siete métodos × tres historias; centro justificado no coincide forzosamente con múltiplo de salida',()=>{
 assert.deepEqual(S.METHODS,['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV']);
 const expectCenters={'EV/EBITDA':8.5,'EV/FCFF':1/(.09-.03),'P/E':10,'P/FCFE':12.5,'P/OCF':7.8125,'P/V':1.5,'P/BV':1.5};
 for(const story of S.SCENARIOS)for(const [method,expected] of Object.entries(expectCenters)){
  const x=S.matrix(record,method,story);
  assert.equal(x.table.length,5,method+' '+story);
  assert.equal(x.table[0].length,5);
  assert.ok(Math.abs(x.center-expected)<.00001,method+': '+x.center+' vs '+expected);
  assert.match(S.render(record,method,story),/Múltiplo justificado central/);
 }
});
test('crecimiento insostenible, Ke insuficiente o patrimonio no disponible => N/D',()=>{
 assert.equal(S.calc('P/E',{g:.12,ke:.1,roe:.2}),null);
 assert.equal(S.calc('EV/EBITDA',{g:.15,wacc:.1,roic:.2,tax:.25,ebitEbitda:.8}),null);
 const clone=structuredClone(record);clone.hojas.valoracion.PBV='<table></table>';
 assert.match(S.render(clone,'P/BV','base'),/N\/D/);
});
test('reconoce diferencia entre crecimiento estable y proyección FY+3',()=>{
 const x=S.matrix(record,'EV/FCFF','base');
 assert.equal(x.params.g,.03);
 assert.equal(x.params.wacc,.09);
 assert.match(S.render(record,'EV/FCFF','base'),/no pronósticos perpetuos/);
});
