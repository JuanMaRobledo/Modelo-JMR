import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../docs/jmr-v2.html', import.meta.url), 'utf8');
const start = html.indexOf('const JMR_DCF=(()=>{');
const end = html.indexOf('const JMR_IND=(()=>{');
if (start<0 || end<=start) throw Error('No se encontró el motor FCFF integrado');
const engine = vm.runInNewContext(html.slice(start,end)+'\nJMR_DCF;', {});
const financials={revenue:21765.4,cash:19000,debt:45063,minority:1558,
 nonoperatingAssets:21119,optionsValue:0,shares:4315,effectiveTaxRate:.175,nol:0};
const a={growth1:.20,growth2to5:.20,margin1:3060.9/21765.4,
 marginTarget:3060.9/21765.4,marginConvergenceYear:1,salesToCapital1to5:.59,
 salesToCapital6to10:.59,waccInitial:.07055015741,waccTerminal:.0881,
 roicTerminal:.0881,gTerminal:.0458,marginalTax:.25,mos:.35,
 failureProbability:0,recoveryRate:.5};
const near=(actual,expected)=>Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*0.000002;
test('embedded browser FCFF matches original Ginsu Almarai reference',()=>{
  const v=engine.evaluateDCF(financials,a);
  assert.equal(v.status,'CANDIDATO');
  assert.ok(near(v.perShare,1.982961845));
  assert.ok(near(v.terminalValue,112533.7314));
  assert.ok(near(v.sumPV,-39139.26501));
  assert.ok(near(v.years[0].reinvestment,8853.722034));
  assert.ok(near(v.years[5].taxRate,0.19));
  assert.ok(near(v.mosPrice,v.perShare*0.65));
});
test('browser FCFF remains profile gated for financials',()=>{
  assert.equal(engine.evaluateDCF(financials,a,{profile:'banco'}).status,'INCOMPLETO');
});
