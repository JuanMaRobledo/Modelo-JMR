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

test('las matrices nativas Base se leen del JSON, sin fabricar N/D ni usar otra revisión',()=>{
  const names=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
  const mats=names.map((name,i)=>({
    metodo:name,escenario:'base',estado:i===1||i===3?'N/D':'OK',
    multiploElegido:[1,2,3,4,5],fundamentalFY3:[1,2,3,4,5],
    matriz:i===1||i===3?null:Array.from({length:5},()=>[10,10,10,10,10]),
    centro:i===1||i===3?null:10,vp3Original:10,
    motivo:i===1||i===3?'Flujo negativo pendiente de justificar':null
  }));
  const rec={ticker:'SHAK',revisionId:'SHAK-R2',sheet_id:'SHEET',
    descuentoMultiples:{metodos:names.map(nombre=>({nombre,base:{vp:[8,9,10]}}))},
    sensibilidadMultiples:{
      contrato:'base-native-five-priority-v1',revisionId:'SHAK-R2',
      sourceSheetId:'SHEET',resultadosSha256:'a'.repeat(64),
      estadoPublicacion:'INTEGRADO_EN_REVISION',controlesTecnicosAprobados:true,matrices:mats
    }
  };
  const good=report().renderMultiplesSensitivity(rec);
  assert.match(good,/integradas en EN_REVISION/);
  assert.equal((good.match(/<table class="jmr-table jmr-matrix">/g)||[]).length,5);
  assert.match(good,/EV\/FCFF[\s\S]*?N\/D/);
  assert.doesNotMatch(good,/Conservador · siete métodos|Optimista · siete métodos/);
  const candidate=JSON.parse(JSON.stringify(rec));
  candidate.sensibilidadMultiples.estadoPublicacion='CANDIDATO_NO_PUBLICADO';
  const unpublished=report().renderMultiplesSensitivity(candidate);
  assert.match(unpublished,/candidatas sin certificación/);
  assert.doesNotMatch(unpublished,/<table class="jmr-table jmr-matrix">/);
  const mismatched=JSON.parse(JSON.stringify(rec));
  mismatched.sensibilidadMultiples.revisionId='MELI-OLD';
  assert.match(report().renderMultiplesSensitivity(mismatched),/revisión, hoja o fotografía no coincide/);
  const wrongCenter=JSON.parse(JSON.stringify(rec));
  wrongCenter.sensibilidadMultiples.matrices[0].matriz[2][2]=111;
  const html=report().renderMultiplesSensitivity(wrongCenter);
  assert.match(html,/Matriz ocultada: centro FY\+3/);
  assert.equal((html.match(/<table class="jmr-table jmr-matrix">/g)||[]).length,4);
});
