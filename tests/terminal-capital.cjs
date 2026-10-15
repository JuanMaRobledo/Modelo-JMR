const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../docs/jmr_engine.js'),'utf8'),c);
const input={revenue0:1000,ebit0:200,taxEffective:.25,taxMarginal:.25,wacc:.10,terminalWacc:.09,
 terminalGrowth:.03,convergenceYear:5,salesToCapital:2,salesToCapital2:3,roicTerminal:.20,
 reinvestLag:1,shares0:100,debt:0,cash:0};
const run=i=>c.runDCFDetalle(i,.08,.20,.08,.20);
const legacy=run(input),disabled=run({...input,smoothTerminalCapital:false});
assert.equal(legacy.valuePerShare,disabled.valuePerShare);
for(const rt of [.20,0]){
 const i={...input,roicTerminal:rt,smoothTerminalCapital:true},d=run(i),roc=rt||i.terminalWacc;
 for(let n=1;n<=5;n++)assert.equal(d.reinvestment[n],legacy.reinvestment[n]);
 for(let n=6;n<=10;n++){
  const alpha=(n-5)/5,intensity=(1-alpha)/i.salesToCapital2+alpha*d.margin[n]*(1-i.taxMarginal)/roc;
  assert.ok(Math.abs(d.reinvestment[n]-(d.revenue[n+1]-d.revenue[n])*intensity)<1e-9);
 }
 const ri11=d.revenue[11]*d.margin[10]*(1-i.taxMarginal)*i.terminalGrowth/roc;
 assert.ok(Math.abs(ri11/d.reinvestment[10]-(1+i.terminalGrowth))<1e-10);
}
console.log('PASS terminal capital: optional compatibility, both ROIC policies, years 6–10 and terminal continuity');
