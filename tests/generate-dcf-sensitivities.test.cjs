'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {runDCFDetalle}=require('../docs/jmr_engine.js');
const {build}=require('../scripts/generate_dcf_sensitivities.cjs');

const p={
 revenue0:1000,ebit0:250,shares0:100,netIncome0:120,
 taxEffective:.22,taxMarginal:.25,terminalGrowth:.035,roicTerminal:.15,
 wacc:.10,terminalWacc:.09,salesToCapital:1.2,salesToCapital2:1.5,
 convergenceYear:5,growthBase:.12,growthY1Base:.15,
 marginBase:.27,marginY1Base:.25,
 cash:100,debt:200,preferredStock:0,optionsValue:0,minorityInterests:0,
 nonOperatingAssets:0,probFailure:0,nol0:0,investedCapital0:900
};
const official=runDCFDetalle(p,p.growthBase,p.marginBase,p.growthY1Base,p.marginY1Base).valuePerShare;

test('las cuatro matrices reejecutan el DCF y concilian el Base en sus 25 centros',()=>{
 const v=build({ticker:'TEST',revision:'same-revision',dcfBase:official,inputs:p});
 assert.equal(v.matrices.length,4);
 for(const m of v.matrices){
  assert.equal(m.rows.values.length,5);
  assert.equal(m.cols.values.length,5);
  assert.equal(m.values.flat().length,25);
  assert.ok(m.values.flat().every(Number.isFinite));
  assert.ok(Math.abs(m.center-official)<.00001);
 }
});
test('riesgo de WACC: mayor costo no aumenta valor en fixture normal',()=>{
 const v=build({ticker:'TEST',revision:'same-revision',dcfBase:official,inputs:p});
 const grid=v.matrices.find(x=>x.id==='wacc-inicial-crecimiento').values;
 assert.ok(grid[0][2]>grid[4][2]);
 assert.ok(grid[2][0]<grid[2][4]);
});
test('rechaza centros que no coinciden con el DCF oficial',()=>{
 assert.throws(()=>build({ticker:'TEST',revision:'different-revision',dcfBase:official+12,inputs:p}),/no concilia/);
});
test('no aplica el motor FCFF bancario a un FCFE',()=>{
 assert.throws(()=>build({ticker:'BANCO',revision:'1',dcfBase:official,inputs:{...p,dcfFinanciero:{}}}),/FCFE/);
});
