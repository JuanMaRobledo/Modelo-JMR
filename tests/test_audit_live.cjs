// NFLX live publication contract: a single immutable SEC September-2026 review.
// No values from prior filings, snapshots or unrelated tickers may be hard-coded.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

(async()=>{
  const repo='https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
  async function read(path) {
    const response=await fetch(repo+path+'?ref=main',{
      headers:{Accept:'application/vnd.github+json','User-Agent':'Modelo-JMR-audit-check'}
    });
    assert.ok(response.ok,'Missing published '+path+' status '+response.status);
    const data=await response.json();
    return Buffer.from(data.content.replace(/\s/g,''),'base64').toString('utf8');
  }
  const [valueSource,analysisSource,auditSource]=await Promise.all([
    read('valoraciones/NFLX-1792548021734.json'),
    read('analisis/NFLX-research-1792549859632-adttn.json'),
    read('auditorias/narrativas/NFLX.md')
  ]);
  const value=JSON.parse(valueSource),analysis=JSON.parse(analysisSource),audit=auditSource;
  const revision='NFLX-2026-10-22-SEC9M26-JMR-review-001';
  const near=(actual,expected,name,epsilon=1e-6)=>{
    assert.ok(Number.isFinite(actual)&&Number.isFinite(expected)&&
      Math.abs(actual-expected)<=Math.max(epsilon,Math.abs(expected)*1e-10),
      name+' expected '+expected+' actual '+actual);
  };
  assert.equal(value.revisionId,revision);
  assert.equal(analysis.revisionId,revision);
  assert.equal(analysis.linkedValuation.revisionId,revision);
  assert.equal(value.auditoria.revisionId,revision);
  assert.ok(audit.includes(revision),'Narrative has same revision id');
  assert.ok(audit.includes('US$69,94'),'Narrative has new Base');
  assert.ok(analysis.articleHtml.includes('US$69,94'),'First level has new Base');
  assert.ok(analysis.calculationHtml.includes(revision),'Second level has same review');
  assert.ok(/Valor intrínseco base/.test(analysis.articleHtml),'Hero must precede article');
  near(value.valorPrincipal,69.941968584,'DCF Base');
  near(analysis.linkedValuation.valorPrincipal,value.valorPrincipal,'Analysis valuation link');
  near(value.valorEsperado.valor,66.81052022016665,'Three-scenario expected');
  near(value.precioMOS,value.valorPrincipal*(1-value.mos),'MOS from Base');
  assert.equal(value.baseMOS,'dcfBase');
  assert.equal(value.fechaCorteContable,'2026-09-30');
  assert.equal(value.auditoria.candados.listos,18);
  assert.equal((analysis.articleHtml.match(/<h2>\d+\./g)||[]).length,18);
  assert.equal((audit.match(/^## \d+\./gm)||[]).length,18);
  assert.equal(Object.values(value.hojas).reduce((n,v)=>n+Object.keys(v).length,0),53);
  assert.ok(value.hojas.financieros['Cash Flow Statement'].includes('N/P'),
    'Uncertified non-GAAP U-FCF is not invented');
  const histories=value.escenariosDCF.historias;
  assert.equal(histories.length,4);
  const base=histories.find(x=>x.id==='A'),bad=histories.find(x=>x.id==='C');
  assert.deepEqual(base.crecimientoAnual,[.12,.11,.10,.09,.08]);
  near(base.valor,value.valorPrincipal,'Base DCF matches stored Base');
  near(base.roicTerminal,.2152,'Terminal ROIC disclosed');
  near(base.s2c,2,'Incremental sales/capital disclosed');
  near(bad.valor,15.548141897969396,'Separate disruption');
  assert.equal(value.escenariosDCF.disrupcionSeparada,true);
  const p=histories.filter(h=>h.id!=='C'),mass=p.reduce((s,h)=>s+h.probabilidad,0);
  near(mass,.9,'Ordinary probability mass');
  near(value.valorEsperado.valor,p.reduce((s,h)=>s+h.probabilidad*h.valor,0)/mass,
    'Expected excludes disruption');
  const methods=value.descuentoMultiples.metodos;
  assert.equal(methods.length,7);
  near(methods.reduce((s,m)=>s+m.pesoRelativo,0),1,'7 methods weights');
  near(value.descuentoMultiples.multiplesHoy.base,59.471491,'Multiples PV Base',.001);
  near(value.objetivoPonderado.base,83.433178,'FY+3 auxiliary',.001);
  assert.equal(value.sensibilidadMultiples.controles.length,21);
  for(const entry of value.sensibilidadMultiples.controles) {
    assert.equal(entry.estado,'OK',entry.metodo+' '+entry.escenario);
    const method=methods.find(m=>m.nombre===entry.metodo);
    assert.ok(method,'Unknown method '+entry.metodo);
    near(entry.centro,method[entry.escenario].consolidado,'Sensitivity center '+entry.metodo,0.003);
  }
  const replay=value.auditoria.replayDCF4Historias;
  assert.equal(replay.records.length,4);
  let checks=0;
  for(const r of replay.records){
    const h=histories.find(s=>s.id===r.id);
    let prior=r.baseRevenue,factor=1,pv=0;
    for(let i=0;i<10;i++){
      near(r.revenues[i],prior*(1+r.growth[i]),'Revenue '+r.id);checks++;
      near(r.ebit[i],r.revenues[i]*r.margin[i],'EBIT '+r.id);checks++;
      near(r.nopat[i],r.ebit[i]*(1-r.tax[i]),'NOPAT '+r.id);checks++;
      near(r.reinvest[i],Math.max(0,(r.revenues[i]-prior)/(i<5?r.s2cPrimero:r.s2cUltimo)),'Reinvestment '+r.id);checks++;
      near(r.fcff[i],r.nopat[i]-r.reinvest[i],'FCFF '+r.id);checks++;
      factor/=1+r.wacc[i];
      near(r.discountFactor[i],factor,'Discount '+r.id);checks++;
      near(r.pvFCFF[i],r.fcff[i]*factor,'Present value '+r.id);checks++;
      prior=r.revenues[i];pv+=r.pvFCFF[i];
    }
    const t=r.terminal,b=r.bridge;
    near(t.revenue,r.revenues[9]*(1+t.growth),'Terminal revenue');checks++;
    near(t.ebit,t.revenue*t.margin,'Terminal EBIT');checks++;
    near(t.nopat,t.ebit*(1-t.tax),'Terminal NOPAT');checks++;
    near(t.reinvest,t.nopat*t.growth/h.roicTerminal,'Terminal reinvest');checks++;
    near(t.fcff,t.nopat-t.reinvest,'Terminal FCFF');checks++;
    assert.ok(t.wacc>t.growth,'TV WACC > g');
    near(t.terminalValue,t.fcff/(t.wacc-t.growth),'Terminal value');checks++;
    near(t.pvTerminal,t.terminalValue*factor,'PV terminal');checks++;
    near(b.pvExplicit,pv,'PV forecast');checks++;
    near(b.ev,pv+t.pvTerminal,'EV');checks++;
    near(b.equity,b.ev-b.debt-b.minority+b.cash+b.nonOperating,'Equity');checks++;
    near(b.commonEquity,b.equity-b.options,'Net options');checks++;
    near(b.price,b.commonEquity/b.shares,'Share price');checks++;
    near(h.valor,b.price,'Saved story');checks++;
  }
  near(value.valorEsperado.valor,p.reduce((s,h)=>s+h.probabilidad*h.valor,0)/mass,
    'Replayed expected');checks++;
  assert.equal(checks,333,'Exact independent replay identity count');
  const script=fs.readFileSync('docs/jmr-audit-deep.js','utf8');
  const ctx={window:{}};vm.runInNewContext(script,ctx);
  const output=ctx.window.JmrDeepAudit.analyze(value,audit);
  assert.equal(output.sectionCount,18);
  assert.equal(output.methods.length,7);
  assert.ok(output.historic[0].years>=10,'Historical comparison retained');
  assert.equal(output.ltm.length,34,'LTM SEC bridges retained');
  assert.ok(output.ltm.every(x=>x.ok),'Every 2026 LTM bridge matches original SEC data');
  console.log('NFLX VERIFIED: same review across valuation, two-level analysis and audit;',
    '18 sections, 53 tabs, 21 methods/scenario centers, 333 FCFF identities, 34 SEC LTM bridges.');
})().catch(error=>{console.error(error);process.exitCode=1;});
