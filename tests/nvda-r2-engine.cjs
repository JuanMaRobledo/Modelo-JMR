const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fixture=require('./fixtures/nvda-r2.json');
const context={module:{exports:{}},console};vm.runInNewContext(fs.readFileSync(__dirname+'/../docs/jmr_engine.js','utf8'),context);const engine=context.module.exports;
function near(a,b){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8,`${a} != ${b}`);}
function cell(t,a){const m=a.match(/^([A-Z]+)(\d+)$/);let c=0;for(const x of m[1])c=c*26+x.charCodeAt(0)-64;return fixture.tables[t]?.[+m[2]-1]?.[c-1]??null;}
test('LTM base funds both working capital and new borrowing from the actual revenue increment',()=>{
 const i=engine.insumosDesdeHoja(cell),s=i.porEscenario.base;
 near(s.revenueFY0,302970);near(s.nwcPctDeltaRevenue,56533/302970);near(s.netBorrowingPctDeltaRevenue,38860/302970);
 assert.notEqual(cell('Financials Multiples','D43'),s.revenueFY0);
});
for(const [n,i]of Object.entries(fixture.dcfInputs))test('NVDA four native DCF histories: '+n,()=>{const s=fixture.results[n];near(engine.runDCFDetalle(i,i.crecimientoAnios[1],s.rows[4].margin,i.crecimientoAnios[0],s.rows[0].margin).valuePerShare,s.value);});
test('Seven native multiple formulas match all63presentvalues and dividends',()=>{
 const i=engine.insumosDesdeHoja(cell);i.criterioConsolidacion='solo3';const a=engine.calcularModeloJMR(i);
 const names={EVEBITDA:'evEbitda',EVFCFF:'evFcff',PE:'pe',PFCFE:'pfcfe',POCF:'pocf',PV:'pv',PBV:'pbv'},sc={Conservadora:'cons',Base:'base',Optimista:'opt'};
 for(const r of fixture.relative)for(let k=0;k<3;k++)near(a.valorPresente.metodos[names[r.method]][sc[r.story]].vp[k],r.present_values[k]);
});
test('200DCF cells use the same10year economic model',()=>{
 const base=fixture.dcfInputs.Base,s=fixture.results.Base;
 for(const m of fixture.matrices)for(let y=0;y<5;y++)for(let x=0;x<5;x++){
  const i=JSON.parse(JSON.stringify(base));let margin=s.rows[4].margin,tvscale=1;
  const set=(k,v)=>{if(k==='wt')i.terminalWacc=v;else if(k==='g')i.terminalGrowth=v;else if(k==='roc')i.roicTerminal=v;else if(k==='margin')margin=v;else if(k==='s2cfactor')i.salesToCapital=v;else if(k==='tax')i.taxMarginal=v;else if(k==='w0')i.wacc=v;else if(k==='delta')i.crecimientoAnios=i.crecimientoAnios.map(g=>g+v);else if(k==='tvscale')tvscale=v;};
  set(m.row_key,m.row_values[y]);set(m.column_key,m.column_values[x]);
  const d=engine.runDCFDetalle(i,i.crecimientoAnios[1],margin,i.crecimientoAnios[0],s.rows[0].margin);
  const pvTerminal=d.terminalValue*d.wacc.slice(1).reduce((p,w)=>p/(1+w),1);
  near(d.valuePerShare+(tvscale-1)*pvTerminal/i.shares0,m.values[y][x]);
 }
});
test('Inverse reproduces the frozen analysis price',()=>{const i=JSON.parse(JSON.stringify(fixture.dcfInputs.Base));i.crecimientoAnios=i.crecimientoAnios.map(g=>g+fixture.inverse.delta);near(engine.runDCFDetalle(i,i.crecimientoAnios[1],i.marginBase,i.crecimientoAnios[0],i.marginY1Base).valuePerShare,210.96);});
