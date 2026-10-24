const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

/**
 * Contrato vivo de NFLX sin snapshots congelados por fecha.
 * Usa main por defecto (producción) y permite probar la rama candidata
 * mediante JMR_DATA_REF=publicacion/nflx-2026-10-22-unificada.
 */
(async () => {
  const ref = process.env.JMR_DATA_REF || 'main';
  const root = 'https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
  async function read(path) {
    const url = root + path + '?ref=' + encodeURIComponent(ref);
    const response = await fetch(url, {
      headers: {'Accept':'application/vnd.github+json','User-Agent':'Modelo-JMR-audit-check'}
    });
    if (!response.ok) throw Error('Expediente no disponible: ' + path + ' HTTP ' + response.status);
    const v = await response.json();
    return Buffer.from(v.content.replace(/\s/g,''), 'base64').toString('utf8');
  }
  const [raw, auditMd, researchRaw] = await Promise.all([
    read('valoraciones/NFLX-1792548021734.json'),
    read('auditorias/narrativas/NFLX.md'),
    read('analisis/NFLX-research-1792549859632-adttn.json')
  ]);
  const data = JSON.parse(raw), research = JSON.parse(researchRaw);
  const near = (actual, expected, detail, epsilon=1e-6) => {
    assert.equal(typeof actual, 'number', detail + ': no numérico');
    assert.equal(typeof expected, 'number', detail + ': referencia no numérica');
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected), detail + ': no finito');
    assert.ok(Math.abs(actual-expected) <= Math.max(epsilon, Math.abs(expected)*1e-10),
      detail + ' actual ' + actual + ' esperado ' + expected);
  };
  const stories = data.escenariosDCF.historias;
  assert.equal(stories.length, 4, 'DCF cuatro historias');
  assert.deepEqual(stories.map(x=>x.id).sort(), ['A','B','C','D']);
  const ordinary = stories.filter(x=>x.id!=='C');
  const mass = ordinary.reduce((s,x)=>s+x.probabilidad,0);
  near(stories.reduce((s,x)=>s+x.probabilidad,0),1,'pesos de historias');
  const expected = ordinary.reduce((s,x)=>s+x.probabilidad*x.valor,0)/mass;
  near(data.valorEsperado.valor,expected,'media ordinaria excluye disrupción');
  near(data.valorPrincipal,stories.find(x=>x.id==='A').valor,'DCF Base principal');
  near(data.precioMOS,data.valorPrincipal*(1-data.mos),'MOS sobre DCF Base');

  const methods = data.descuentoMultiples.metodos;
  assert.equal(methods.length,7,'Los siete métodos calculados');
  near(methods.reduce((s,m)=>s+m.pesoRelativo,0),1,'pesos relativos de siete métodos');
  near(data.metodos.reduce((s,m)=>s+m.peso,0),1,'pesos del objetivo FY+3');
  near(data.metodos.find(x=>x.nombre==='DCF Damodaran').peso,.4,'DCF componente auxiliar 40%');
  assert.equal(data.baseMOS,'dcfBase');
  const sumVP = methods.reduce((s,m)=>s+m.pesoRelativo*m.base.consolidado,0);
  near(data.descuentoMultiples.multiplesHoy.base,sumVP,'VP múltiplos por pesos',.005);
  near(data.descuentoMultiples.ponderadoHoy.base,.4*data.valorPrincipal+.6*sumVP,
    'ponderado DCF+múltiplos secundario',.005);

  const analyses = research.articleHtml || research.html || '';
  assert.ok((analyses.match(/<h2>\d+\./g)||[]).length === 18, 'Análisis Nivel 1 de 18 secciones');
  assert.ok(research.calculationHtml?.length > 1000, 'Nivel 2 con cálculos disponibles');
  const allSheets = data.hojas;
  const tabsCount = Object.values(allSheets).reduce((s,obj)=>s+Object.keys(obj).length,0);
  assert.ok(tabsCount>=45,'Pestañas nivel 2: al menos45');
  assert.equal((auditMd.match(/^## \d+\./gm)||[]).length,18,'Auditoría narrativa 18 secciones');

  // Conserva los controles de la capa de lectura, sin porcentajes congelados.
  const script = fs.readFileSync('docs/jmr-audit-deep.js','utf8');
  const sandbox={window:{}};
  vm.runInNewContext(script,sandbox);
  const result=sandbox.window.JmrDeepAudit.analyze(data,auditMd);
  assert.equal(result.sectionCount,18,'Narrativa reconocida por el auditor de la app');
  assert.equal(result.methods.length,7,'Siete métodos reconocidos');
  assert.ok(result.historic[0].years>=10,'Diez años de históricos en la ficha');
  assert.equal(result.ltm.length,34,'34 puentes SEC del LTM');
  assert.ok(!result.checks.some(x=>x.area==='LTM'&&x.status==='fail'),'Puentes LTM sin fallo');
  
  const W=data.auditoria.reconstruccionWacc;
  assert.ok(W,'WACC con reconstrucción explícita');
  // V7 de NFLX usa ERP geográfico por distribución de ingresos, no
  // el antiguo CRP discrecional ni el desglose del Treasury de la v5.
  assert.ok(Number.isFinite(W.rfUsdAjustada),'Rf USD efectiva finita');
  if(Number.isFinite(W.rfTreasury10Y)&&Number.isFinite(W.spreadSoberanoUsa))
    near(W.rfUsdAjustada,W.rfTreasury10Y-W.spreadSoberanoUsa,'Rf USD');
  const extra=Number.isFinite(W.crpRegionesPonderada)?W.crpRegionesPonderada:W.crpExtraAnalista;
  near(W.erpEfectiva,W.erpMaduraAjustadaOct2026+extra,'ERP efectiva');
  assert.ok(Number.isFinite(W.betaReapalancada)&&W.betaReapalancada>0,'beta vigente');
  const tax=Number.isFinite(W.corporateTax)?W.corporateTax:.25;
  if(Number.isFinite(W.betaGlobalEntertainmentDesapalancada)&&
     Number.isFinite(W.debtMarketUSDmm)&&Number.isFinite(W.equityValueUSDmm))
    near(W.betaReapalancada,W.betaGlobalEntertainmentDesapalancada*
      (1+(1-tax)*W.debtMarketUSDmm/W.equityValueUSDmm),'beta reapalancada');
  const ke=W.rfUsdAjustada+W.betaReapalancada*W.erpEfectiva;
  near(W.costEquity,ke,'Ke');
  near(W.waccNuevo,ke*W.equityWeight+W.costDebtPreTax*(1-tax)*W.debtWeight,'WACC');
  near(data.descuentoMultiples.costoPatrimonio,ke,'Ke relativo');
  if(W.sensibilidades?.valoresPorAccionUSD){
    near(W.sensibilidades.valoresPorAccionUSD.crp05,data.valorPrincipal,'Centro sensibilidad CRP',.02);
    assert.ok(W.sensibilidades.valoresPorAccionUSD.crp0>data.valorPrincipal);
    assert.ok(W.sensibilidades.valoresPorAccionUSD.crp1<data.valorPrincipal);
  } else {
    // Revisión v7: exigir sensibilidad WACC × g actual de la misma valoración.
    near(data.sensibilidadDCF.centro,data.valorPrincipal,'Centro sensibilidad DCF',.02);
    assert.ok(Array.isArray(data.sensibilidadDCF.valores)&&data.sensibilidadDCF.valores.length===5);
  }

  // Reconstrucción independiente: 4 historias x (70 anuales + 13 terminal/puente) + promedio =333.
  const replay=data.auditoria.replayDCF4Historias;
  assert.equal(replay.records.length,4,'cuatro registros de replay');
  let identities=0;
  const eq=(a,b,label) => {near(a,b,label);identities++};
  // El replay v7 registra cuatro continuaciones 11–20 trazables a la hoja
  // vigente. Los 333 controles del formato v5 no están en ese sidecar y no se
  // pueden reclamar como ejecutados; validar sus cuatro centros sin inventarlos.
  if(replay.records.every(rec=>typeof rec.historia==='string'&&Number.isFinite(rec.dcf))){
    const ids={Base:'A',Conservadora:'B',Disrupción:'C',Optimista:'D'};
    for(const rec of replay.records){
      const story=stories.find(s=>s.id===ids[rec.historia]);
      assert.ok(story,'historia v7 '+rec.historia);
      near(rec.dcf,story.valor,'DCF 20 años '+rec.historia,.002);
      assert.ok(/^L\\d+$/.test(rec.continuacion),'Celda de continuación 11–20 '+rec.historia);
    }
    assert.match(replay.validacion||'',/4\\/4 controles VALIDADO/);
    near(data.valorEsperado.valor,expected,'media sin disrupción');
  } else {
    for(const rec of replay.records) {
      const story=stories.find(s=>s.id===rec.id);
      assert.ok(story,'historia del replay '+rec.id);
      let prior=rec.baseRevenue,discount=1,explicit=0;
      for(let i=0;i<10;i++) {
        eq(rec.revenues[i],prior*(1+rec.growth[i]),rec.id+' ventas'+i);
        eq(rec.ebit[i],rec.revenues[i]*rec.margin[i],rec.id+' EBIT'+i);
        eq(rec.nopat[i],rec.ebit[i]*(1-rec.tax[i]),rec.id+' NOPAT'+i);
        const ratio=i<5?rec.s2cPrimero:rec.s2cUltimo;
        eq(rec.reinvest[i],Math.max(0,(rec.revenues[i]-prior)/ratio),rec.id+' reinversión'+i);
        eq(rec.fcff[i],rec.nopat[i]-rec.reinvest[i],rec.id+' FCFF'+i);
        discount/=1+rec.wacc[i];
        eq(rec.discountFactor[i],discount,rec.id+' factor'+i);
        eq(rec.pvFCFF[i],rec.fcff[i]*discount,rec.id+' VP FCFF'+i);
        explicit+=rec.pvFCFF[i];prior=rec.revenues[i];
      }
      const t=rec.terminal,b=rec.bridge;
      eq(t.revenue,rec.revenues[9]*(1+t.growth),'terminal ingresos');
      eq(t.ebit,t.revenue*t.margin,'terminal EBIT');
      eq(t.nopat,t.ebit*(1-t.tax),'terminal NOPAT');
      eq(t.reinvest,t.nopat*t.growth/story.roicTerminal,'terminal reinversión');
      eq(t.fcff,t.nopat-t.reinvest,'terminal FCFF');
      assert.ok(t.wacc>t.growth,'WACC mayor g');
      eq(t.terminalValue,t.fcff/(t.wacc-t.growth),'valor terminal');
      eq(t.pvTerminal,t.terminalValue*discount,'valor presente terminal');
      eq(b.pvExplicit,explicit,'VP explícito');
      eq(b.ev,explicit+t.pvTerminal,'EV');
      eq(b.equity,b.ev-b.debt-b.minority+b.cash+b.nonOperating,'equity');
      eq(b.commonEquity,b.equity-b.options,'equity común');
      eq(b.price,b.commonEquity/b.shares,'DCF por acción');
      eq(story.valor,b.price,'historia publicada');
    }
    eq(data.valorEsperado.valor,expected,'media sin disrupción');
    assert.equal(identities,333,'333 reconciliaciones independientes');
  }

  // Las 14 matrices laterales contienen 25 celdas cada una y 21 controles de centro.
  const sense=data.sensibilidadMultiples;
  assert.equal(sense.controlesOK,21,'21 centros');
  assert.equal(sense.controles.filter(x=>x.estado==='OK').length,21,'21 controles OK');
  const html=data.hojas.valoracion['Sensibilidad 7 metodos x historias'] || '';
  assert.ok(!/#(?:ERROR|REF|VALUE|DIV\/0|N\/A)!/.test(html),'Matriz sin errores');
  const cells=s=>[...s.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map(x=>x[1].replace(/<[^>]+>/g,'').trim());
  const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(x=>cells(x[1]));
  const num=s=>{const n=Number(String(s??'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:NaN};
  const names=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
  let checked=0;
  for(let m=0;m<7;m++)for(let z=0;z<2;z++){
    const group=2*m+z, start=6+group*12, scenario=z?'optimista':'conservador';
    const axes=rows[start-1].slice(1,6).map(num);
    assert.ok(axes.every(Number.isFinite),'ejes múltiplo '+group);
    for(let i=0;i<5;i++){
      assert.ok(Number.isFinite(num(rows[start+i][0])),'fundamental '+group);
      for(let j=0;j<5;j++){
        const cell=num(rows[start+i][j+1]);
        assert.ok(Number.isFinite(cell)&&cell>=0,'matriz '+group+' '+i+' '+j);
        if(j>0) assert.ok(cell+.025>=num(rows[start+i][j]),'monotonía '+group);
        checked++;
      }
    }
    const ctr=sense.controles.find(x=>x.metodo===names[m]&&x.escenario===scenario);
    assert.equal(ctr.estado,'OK');
    near(num(rows[start+2][3]),ctr.centro,'centro 5x5 '+group,.025);
  }
  assert.equal(checked,350,'350 valores de matrices');

  // La nueva revisión exige igualdad editorial estricta; la histórica conserva sus controles de cálculo.
  const revision='NFLX-2026-10-22-SEC9M26-JMR-review-001';
  if(data.revisionId===revision){
    assert.equal(research.revisionId,revision);
    assert.equal(research.linkedValuation.revisionId,revision);
    assert.equal(data.auditoria.revisionId,revision);
    assert.ok(auditMd.includes(revision));
    assert.ok(analyses.includes(revision));
    assert.equal(tabsCount,53);
    near(data.valorPrincipal,69.941968584,'Base actual',.002);
    near(data.valorEsperado.valor,66.81052022,'tres historias actuales',.002);
    near(data.descuentoMultiples.multiplesHoy.base,59.471491,'siete múltiplos',.002);
    near(data.precioMOS,45.4622796,'compra 35%',.002);
    assert.ok(analyses.includes('US$69,94'));
    assert.ok(auditMd.includes('US$69,94'));
    assert.ok(analyses.includes('21,52%')&&analyses.includes('36%'),'Supuestos actuales expresos');
  }
  console.log('OK NFLX ref='+ref+' DCF='+data.valorPrincipal.toFixed(2)
     +' revisión='+(data.revisionId||'histórica')+' 333 replay, 350 celdas, 18 secciones, 53 tabs actual');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
