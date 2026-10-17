const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function engine(file){const ctx={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx);return ctx.module.exports;}
const current=engine(path.join(root,'Modelo-JMR/docs/jmr_engine.js'));
const inp={revenue0:1000,revenueFY0:1000,ebit0:200,shares0:100,sharesMultiplos:100,
 growthCons:.02,growthBase:.05,growthOpt:.08,marginCons:.17,marginBase:.20,marginOpt:.23,
 riskFreeRate:.03,matureMarketERP:.04,terminalGrowth:.03,wacc:.10,taxEffective:.25,taxMarginal:.25,
 convergenceYear:5,salesToCapital:2,salesToCapital2:2,debt:100,cash:100,
 daPctRevenue:.03,capexPctRevenue:-.04,nwcPctDeltaRevenue:.1,netBorrowingPctRevenue:0,
 interestOtherPctEBIT:0,buybackRate:0,dividendPerShare:.1,dividendGrowth:0,
 evEbitdaBase:10,evFcffBase:15,peBase:15,pfcfeBase:15,pocfBase:12,tipoEmpresa:'Madura',
 precioActual:10,mos:.35,costoPatrimonio:.1};
const legacy=current.calcularModeloJMR(inp);
assert.equal(legacy.precios.pv.base,null);
assert.equal(legacy.precios.pbv.base,null);
const richer={...inp,bookEquity0:500,pvBase:2,pbvBase:3,
 porEscenario:{cons:{otherEquityMovements:[-50,-50,-50]},base:{otherEquityMovements:[-100,-100,-100]},opt:{otherEquityMovements:[0,0,0]}},
 multiplos:{pv:{cons:1,base:2,opt:3},pbv:{cons:2,base:3,opt:4}}};
const result=current.calcularModeloJMR(richer);
for(const s of ['cons','base','opt']){
 assert.ok(Number.isFinite(legacy.precios.dcf[s]));
 assert.ok(Number.isFinite(legacy.valorPresente.ponderado[s]));
 assert.ok(Number.isFinite(legacy.precioObjetivo[s]));
 assert.equal(legacy.precios.dcf[s],result.precios.dcf[s]);
 assert.equal(legacy.valorPresente.ponderado[s],result.valorPresente.ponderado[s]);
 assert.equal(legacy.precioObjetivo[s],result.precioObjetivo[s]);
}
const f=result.financials.base;
assert.equal(f.bookEquity[1],500+f.netIncome[1]-f.dps[1]*f.shares[1]-100);
assert.equal(result.precios.pv.base,2*f.rev[3]/f.shares[3]+.3);
assert.equal(result.valorPresente.metodos.pbv.base.consolidado,
 result.valorPresente.metodos.pbv.base.vp.reduce((a,b)=>a+b,0)/3);
const invalid=current.calcularModeloJMR({...richer,bookEquity0:-10000});
assert.equal(invalid.precios.pbv.base,null);
assert.equal(invalid.valorPresente.ponderado.base,legacy.valorPresente.ponderado.base);
const ctx={window:{},localStorage:{getItem(){return null;}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'Modelo-JMR/docs/valuation-board.js'),'utf8'),ctx);
const board=ctx.window.JmrValueBoard;
let records=0;
for(const filename of fs.readdirSync(path.join(root,'Modelo-JMR-datos/valoraciones'))){
 const rec=JSON.parse(fs.readFileSync(path.join(root,'Modelo-JMR-datos/valoraciones',filename),'utf8'));
 const d=board.fromRecord(rec);records++;
 if(d.ve){
  assert.equal(d.ve.historias.length,3,filename);
  assert.ok(d.ve.historias.every(h=>h.id!=='C'));
  assert.ok(Math.abs(d.ve.valor-rec.valorEsperado.valor)<1e-8,filename);
  const html=board.veBox(d);
  assert.ok(html.includes('¿Qué pasaría si todo fallara?'),filename);
  assert.ok(!html.includes('NaN'),filename);
  const changed=JSON.parse(JSON.stringify(rec));changed.valorEsperado.historias.find(h=>h.id==='C').valor=1e10;
  assert.equal(board.fromRecord(changed).ve.valor,d.ve.valor,'Stress must not change average: '+filename);
 }
}
assert.equal(records,38);
// Parse every inline script as JavaScript, including the workbook importer.
const visor=fs.readFileSync(path.join(root,'Modelo-JMR/docs/visor.html'),'utf8');
for(const m of visor.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
 if(m[1].trim())new vm.Script(m[1]);
}
console.log('PASS: seven methods, equity rollforward, zero-weight invariance, 38 records, stress exclusion, importer syntax');
