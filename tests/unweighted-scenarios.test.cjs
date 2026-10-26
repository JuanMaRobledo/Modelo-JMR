const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},Intl,console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/valuation-board.js'),'utf8'),ctx);
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/nflx-scenarios.json')));
const fixture=data.record;
fixture.mos=.35;
test('saved unweighted NFLX shows the ordinary mean and disruption separately',()=>{
 const html=ctx.window.JmrValueBoard.veHtml(ctx.window.JmrValueBoard.fromRecord(fixture));
 assert.match(html,/17,01/);assert.match(html,/71,68/);assert.match(html,/103,08/);
 assert.match(html,/46,59/);assert.match(html,/sin probabilidades asignadas/i);
 assert.match(html,/Promedio condicionado/);assert.match(html,/US\$75,00/);
 assert.match(html,/Disrupción excluida/);assert.match(html,/jvb-stress/);
 assert.doesNotMatch(html,/class="jvb-big"><span class="v">US\$0,00/);
});
test('direct XLSX adapter reads specialized NFLX sheet with no probabilities',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../docs/visor.html'),'utf8');
 const fn=source.slice(source.indexOf('  function readUnifiedStories('),source.indexOf('  function readHistoricalMultiples('));
 const s=data;
 const c={wb:{Sheets:s.values},cellVal:(ws,a)=>{const m=a.match(/([A-Z]+)(\d+)/);let col=0;for(const ch of m[1])col=col*26+ch.charCodeAt(0)-64;return ws?.[+m[2]-1]?.[col-1];}};
 vm.runInNewContext(fn+';result=readUnifiedStories(wb)',c);
 assert.equal(c.result.historias.length,4);
 const ordinary=c.result.historias.slice(0,3);
 const mean=ordinary.reduce((sum,h)=>sum+h.valor,0)/3;
 assert.ok(Math.abs(c.result.valor-mean)<1e-10);
 assert.ok(Math.abs(c.result.valor-c.result.historias.reduce((sum,h)=>sum+h.valor,0)/4)>1);
 assert.equal(c.result.historias[3].valor,17.013431712056608);
 assert(c.result.historias.every(h=>h.probabilidad===null));
 assert(Math.abs(c.result.historias[0].crecimiento-.12)<.001);
});
