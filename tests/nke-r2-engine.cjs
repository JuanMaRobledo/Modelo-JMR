'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../docs/jmr_engine.js'),f=require('./fixtures/nke-r2.json');
function near(a,b){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);}
function input(s){return {...f.inputs,crecimientoAnios:s.growth.slice(0,5),salesToCapital:s.s2c,salesToCapital2:s.s2c_late,roicTerminal:s.roic_terminal,terminalGrowth:s.g_terminal};}
function run(i,s){return engine.runDCFDetalle(i,i.crecimientoAnios[1],s.margin_adjusted,i.crecimientoAnios[0],i.marginY1Base);}
test('Detects R2 conventions from the actual Sheets snapshot',()=>{
 const i=engine.insumosDesdeHoja((h,a)=>{let m=a.match(/^([A-Z]+)(\d+)$/),c=0;for(const x of m[1])c=c*26+x.charCodeAt(0)-64;return f.cells[h]?.[+m[2]-1]?.[c-1]??null;});
 assert.equal(i.marginAnchoredYearOne,true);assert.equal(i.capitalRatioTransition,true);assert.equal(i.terminalCapitalFromROIC,true);
 near(run({...i,...input(f.scenarios.Base)},f.scenarios.Base).valuePerShare,f.scenarios.Base.result.value);
});
for(const [name,s]of Object.entries(f.scenarios))test('Four histories: '+name,()=>{
 const r=run(input(s),s);near(r.valuePerShare,s.result.value);
 for(let y=1;y<=10;y++){near(r.fcff[y],s.result.rows[y-1].fcff);near(r.reinvestment[y],s.result.rows[y-1].reinvestment);}
});
test('All 75 DCF sensitivity cells match frozen Sheets calculations',()=>{
 const s=f.scenarios.Base;
 for(let family=0;family<f.matrices.length;family++){
  const m=f.matrices[family];for(let y=0;y<5;y++)for(let x=0;x<5;x++){
   const i=input(s);let target=s.margin_adjusted;
   if(family===0){i.terminalWacc=m.y[y];i.terminalGrowth=m.x[x];}
   else if(family===1){i.roicTerminal=m.y[y];i.terminalGrowth=m.x[x];}
   else{i.crecimientoAnios=s.growth.slice(0,5).map(g=>g+m.y[y]);target=m.x[x];}
   near(engine.runDCFDetalle(i,i.crecimientoAnios[1],target,i.crecimientoAnios[0],i.marginY1Base).valuePerShare,m.values[y][x]);
  }
 }
});
test('Inverse reconstructs the frozen analysis price without a calibration factor',()=>{
 const s=f.scenarios.Base,i=input(s);i.crecimientoAnios=i.crecimientoAnios.map(g=>g+f.inverse.selected);near(run(i,s).valuePerShare,f.inverse.target);
});
test('Existing Netflix conventions keep the prior engine result',()=>{
 const i=f.legacyParams;assert.equal(i.marginAnchoredYearOne,undefined);near(engine.runDCFDetalle(i,i.growthBase,i.marginBase,i.growthY1Base,i.marginY1Base).valuePerShare,f.legacyExpected);
});
