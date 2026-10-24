'use strict';
/** Regression: el informe publica solo sensibilidad de múltiplos Base
 * y ordena las matrices de DCF Base por riesgo (WACC/g/ROIC). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function table(map,max){
  const esc=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  return '<table>'+Array.from({length:max},(_,i)=>{
    const cells=map[i+1]||[];
    return '<tr data-row="'+(i+1)+'">'+Array.from({length:Math.max(9,cells.length)},(_,j)=>'<td>'+esc(cells[j])+'</td>').join('')+'</tr>';
  }).join('')+'</table>';
}
class FakeDOMParser {
  parseFromString(html){
    const rows=Array.from(html.matchAll(/<tr data-row="(\d+)">([\s\S]*?)<\/tr>/g),m=>({
      getAttribute:()=>m[1],
      querySelectorAll:()=>Array.from(m[2].matchAll(/<td>([\s\S]*?)<\/td>/g),c=>({textContent:c[1]}))
    }));
    return {querySelector:()=>({querySelectorAll:()=>rows})};
  }
}
function report(){
  const ctx={
    window:{},DOMParser:FakeDOMParser,JmrDisplayNumber:{format:x=>String(x),formatTable:()=>{}},
    JmrMultiplesAxes:{labels:()=>({header:['eje',1,2,3,4,5],rows:[1,2,3,4,5],caption:'Test'})},
    JmrEconomicMultiples:{SCENARIOS:['conservador','base','optimista'],METHODS:['EV/EBITDA','P/E'],
      matrix:()=>({center:10}),render:(r,m,s)=>'<p>'+m+s+'</p>'}
  };
  vm.runInNewContext(fs.readFileSync('docs/jmr-report-sheets.js','utf8'),ctx,{filename:'jmr-report-sheets.js'});
  return ctx.window.JmrReportSheets;
}
test('matrices de múltiplos solo Base; se preservan tablas de siete métodos',()=>{
  const rows={};
  for(let m=0;m<7;m++){
    const first=76+m*10;
    rows[first]=['BASE'];
    rows[first+2]=['Eje',8,9,10,11,12];
    for(let j=0;j<5;j++)rows[first+3+j]=[9+j,8,9,10,11,12];
    rows[first+8]=['Centro',10,10,10,10,10,10,10,'OK'];
  }
  const rec={ticker:'TEST',hojas:{valoracion:{'Sensibilidad por múltiplo':table(rows,230)}}};
  const html=report().renderMultiplesSensitivity(rec);
  assert.match(html,/Base · siete métodos/);
  assert.doesNotMatch(html,/Conservador · siete métodos|Optimista · siete métodos/);
  assert.equal((html.match(/class="jmr-matrix-card"/g)||[]).length,7);
});
test('múltiplo económicamente justificado también solo Base',()=>{
  const html=report().renderEconomicSensitivity({ticker:'TEST',hojas:{}});
  assert.match(html,/Base · siete métodos justificados/);
  assert.doesNotMatch(html,/Conservador · siete métodos justificados|Optimista · siete métodos justificados/);
});
test('prioridad WACC terminal por g, luego ROIC/g y después otras matrices; 8 precios Base al centro',()=>{
  const specs=[
    'WACC terminal × crecimiento perpetuo','ROIC terminal × crecimiento perpetuo',
    'Delta aditivo crecimiento1–5 × margen EBIT ajustado',
    'WACC inicial × crecimiento FY+1 a FY+5',
    'Sales-to-Capital × margen EBIT objetivo','ROIC terminal × WACC terminal',
    'Impuesto marginal × Sales-to-Capital','WACC terminal × escala del valor terminal'
  ],rows={};
  specs.forEach((title,i)=>{
    const start=4+11*i;
    rows[start]=[title];
    rows[start+1]=['Eje',1,2,3,4,5];
    for(let y=0;y<5;y++)rows[start+2+y]=[y+1,9,9,10,11,11];
  });
  rows[96]=['Peso VP terminal / VP operativo','76,89%'];
  const rec={ticker:'TEST',valorEsperado:{dcfBase:10},hojas:{valoracion:{'Sensibilidad DCF':table(rows,100)}}};
  const html=report().renderSensitivity(rec);
  const titles=Array.from(html.matchAll(/<h4>(.*?)<\/h4>/g),m=>m[1]);
  assert.equal(titles.length,8);
  assert.match(titles[0],/WACC terminal × crecimiento perpetuo/);
  assert.match(titles[1],/ROIC terminal × crecimiento perpetuo/);
  assert.match(titles[2],/ROIC terminal × WACC terminal/);
  assert.match(titles[5],/escala del valor terminal/);
  assert.match(html,/76,89%/);
  assert.equal((html.match(/<span class="jmr-base-tag">Base<\/span>/g)||[]).length,8);
});
