const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
(async()=>{
 const base='https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
 async function read(path){
  const res=await fetch(base+path+'?ref=main',{headers:{'Accept':'application/vnd.github+json','User-Agent':'Modelo-JMR-audit-check'}});
  if(!res.ok)throw Error('Expediente publicado no disponible '+path+' HTTP '+res.status);
  const v=await res.json();
  return Buffer.from(v.content.replace(/\s/g,''),'base64').toString('utf8');
 }
 const [json,md]=await Promise.all([
  read('valoraciones/NFLX-1792548021734.json'),
  read('auditorias/narrativas/NFLX.md')
 ]);
 const script=fs.readFileSync('docs/jmr-audit-deep.js','utf8');
 const sandbox={window:{}};vm.runInNewContext(script,sandbox);
 const data=JSON.parse(json), result=sandbox.window.JmrDeepAudit.analyze(data,md);
 const errors=result.checks.filter(x=>x.status==='fail');
 const deferred=result.checks.filter(x=>x.status==='nd');
 console.log('Informe NFLX publicado: secciones',result.sectionCount,
   'métodos',result.methods.length,'años ingresos',result.historic[0].years,
   'puentes LTM',result.ltm.length,'conciliaciones fallidas',errors.length,'N/D',deferred.length);
 errors.forEach(x=>console.log('DISCREPANCIA',x.area,x.label,'recalculado',x.actual,'registrado',x.expected));
 assert.equal(result.sectionCount,18,'Narrativa editada con 18 secciones');
 assert.equal(result.methods.length,7,'Los siete múltiplos');
 assert.ok(result.historic[0].years>=10,'Diez años comparables');
 assert.equal(result.ltm.length,34,'Solo las 34 filas FY2025/9M2025/9M2026/LTM con fuente SEC deben probarse');
 assert.ok(result.ltm.every(x=>x.ok),'Los 34 puentes de flujo LTM deben conciliar con las cifras registradas');
 assert.ok(!result.checks.some(x=>x.area==='LTM'&&x.status==='fail'),'No confundir tabla histórica con bloque LTM');
 assert.ok(result.assumptions.some(x=>x.label==='Margen EBIT objetivo'&&x.status==='Conciliado'&&Math.abs(x.model-.34)<1e-8),
   'El margen Base activo 34 % debe conciliar con la hoja; 21,30 % es solo histórico');
 assert.ok(result.assumptions.some(x=>x.label==='CAGR ingresos 1–5'&&x.status==='Conciliado'),
   'El CAGR de cinco años corresponde al 9,99 %');
 assert.ok(result.assumptions.some(x=>x.label==='CAGR ingresos 2–5'&&x.status==='Conciliado'&&Math.abs(x.model-.0949429189823141)<1e-7),
   'El CAGR años 2–5 es 9,49 %, no 9,99 %');
 assert.ok(result.assumptions.every(x=>x.status!=='Revisar origen'),
   'La documentación sincronizada no debe denunciar una falsa contradicción de supuestos');
 assert.equal(result.disruption.id,'C','Disrupción no entra en promedio ordinario');
 assert.ok(Math.abs(data.valorPrincipal-56.90146613082062)<1e-7,'DCF Base actualizado US$56,90');
 assert.deepEqual(Array.from(data.escenariosDCF.historias.find(h=>h.id==='A').crecimientoAnual),[.12,.11,.10,.09,.08],'Trayectoria Base acordada');
 assert.ok(Math.abs(data.escenariosDCF.historias.find(h=>h.id==='A').crecimiento-.09990908189157444)<1e-8,'CAGR 1–5 = 9,99%');
 assert.ok(Math.abs(data.valorEsperado.valor-54.17145454958776)<1e-7,'Promedio A/B/D excluye disrupción');
 assert.ok(Math.abs(data.descuentoMultiples.multiplesHoy.base-52.277071694846036)<1e-7,'Múltiplos FY+3 VP recalculados');
 assert.ok(Math.abs(data.objetivoPonderado.base-70.93930235405065)<1e-7,'FY+3 ponderado canónico 40% DCF y 60% siete múltiplos');
 assert.ok(Math.abs(data.precioMOS-data.valorPrincipal*(1-data.mos))<1e-7,'MOS sobre DCF Base');
 assert.equal(data.baseMOS,'dcfBase','Mantener selector MOS original');
 const w=data.auditoria.reconstruccionWacc;
 assert.ok(w,'Debe quedar trazabilidad WACC reconstruido');
 assert.ok(Math.abs(w.rfTreasury10Y-.0513)<1e-12 && Math.abs(w.spreadSoberanoUsa-.0022)<1e-12,'Rf UST5,13% - spread US0,22pp');
 assert.ok(Math.abs(w.rfUsdAjustada-(w.rfTreasury10Y-w.spreadSoberanoUsa))<1e-12,'Rf ajustada 4,91%');
 assert.ok(Math.abs(w.erpMaduraNoAjustadaOct2026+w.spreadSoberanoUsa-w.erpMaduraAjustadaOct2026)<1e-12,'ERP Damodaran Oct2026 3,70+0,22=3,92%');
 assert.ok(Math.abs(w.erpEfectiva-(w.erpMaduraAjustadaOct2026+w.crpExtraAnalista))<1e-12,'ERP efectiva 4,42%');
 const beta=w.betaGlobalEntertainmentDesapalancada*(1+(1-w.corporateTax)*w.debtMarketUSDmm/w.equityValueUSDmm);
 assert.ok(Math.abs(beta-w.betaReapalancada)<1e-10,'Reapalancamiento beta Entertainment global');
 const ke=w.rfUsdAjustada+w.betaReapalancada*w.erpEfectiva;
 const wacc=ke*w.equityWeight+w.costDebtPreTax*(1-w.corporateTax)*w.debtWeight;
 assert.ok(Math.abs(ke-w.costEquity)<1e-10 && Math.abs(wacc-w.waccNuevo)<1e-10,'Ke y WACC reconciliados desde componentes');
 assert.ok(Math.abs(w.waccNuevo-.09164473900451407)<1e-9 && Math.abs(w.terminalWacc-w.waccNuevo)<1e-12,'Nuevo WACC9,16% y terminal vinculado');
 assert.ok(Math.abs(data.descuentoMultiples.costoPatrimonio-ke)<1e-10,'Ke de siete múltiplos igual WACC rebuilt Ke');
 assert.ok(data.escenariosDCF.historias.every(h=>h.valor>0&&Number.isFinite(h.valor)),'Cuatro DCF vigentes positivos');
 assert.ok(Math.abs(data.crecimientoImplicito.cagrImplicito-.1358978789907006)<1e-8,'DCF inverso 13,59% actualizado');
 assert.ok(Math.abs(w.sensibilidades.valoresPorAccionUSD.crp05-data.valorPrincipal)<1e-7,'La sensibilidad geográfica central concilia');
 assert.ok(w.sensibilidades.valoresPorAccionUSD.crp0>data.valorPrincipal && data.valorPrincipal>w.sensibilidades.valoresPorAccionUSD.crp1,'Riesgo geográfico en sensibilidad 0/50/100pb monotónico');
 assert.ok(Math.abs(data.precioMOS-36.98595298503341)<1e-7,'Precio compra con MOS 35% reconstruido');
 assert.ok(data.escenariosDCF.historias.find(h=>h.id==='C').valor>0 && data.escenariosDCF.historias.find(h=>h.id==='C').valor<20,'Caso de disrupción separado válido');
 assert.ok(data.auditoria.revisionDocumental22102026.cierres.some(x=>x.codigo==='NFLX-12'),'Cerrar falso supuesto de error Rf tras reconstrucción');
 assert.ok(!data.auditoria.revisionDocumental22102026.salvedadesAbiertas.some(x=>x.codigo==='NFLX-12'),'No reabrir contradicción ficticia Rf-Treasury');
 assert.ok(/3,92%/.test(data.hojas.valoracion['Cost of capital worksheet']) && /9,16%/.test(data.hojas.valoracion['Cost of capital worksheet']),'Snapshot de WACC reconstruido visible');
 assert.ok(md.includes('US$56,90') && md.includes('CRP') && md.includes('3,92%'),'Narrativa auditada concilia con nuevo WACC');
 assert.ok(data.hojas.valoracion['Evidencia deuda y geografía']?.includes('37.683,87'),'Tabla geografía SEC 9M2026 registrada');
 assert.ok(data.hojas.valoracion['Evidencia deuda y geografía']?.includes('15.158'),'Cuadre fair value de 13 bonos SEC');
 assert.ok(data.hojas.valoracion['Sensibilidad 7 metodos x historias']?.includes('OK'),'Matriz 14 escenarios publicada');
 assert.equal(data.sensibilidadMultiples.controlesOK,21,'21 centros siete múltiplos x tres historias');
 assert.equal(data.sensibilidadMultiples.noDisponibles,0,'Los 14 centros antes N/D fueron calculados');
 assert.equal(data.sensibilidadMultiples.controles.filter(x=>x.estado==='OK').length,21,'Todos los centros registrados concilian');
 assert.ok(data.auditoria.revisionDocumental22102026.cierres.some(x=>x.codigo==='NFLX-08'),'Se cierra salvedad de matrices sin inventar comparables');
 const bond=data.auditoria.evidenciaDeudaGeografia20261022;
 assert.equal(bond.bonos,13,'13 tramos de deuda con evidencia nota7');
 assert.ok(Math.abs(bond.region9M2026USDmm.total-37683.871)<1e-8,'Total ingresos 9M por región SEC');
 assert.equal(bond.distribucionPorPais.startsWith('N/D'),true,'Sin suponer distribución por países');
 assert.ok(Math.abs(bond.salesToCapital.empresaLTM-1.3740483329315363)<1e-8,'Ancla Sales-to-Capital Netflix LTM');
 assert.ok(Math.abs(bond.roicTerminal.industriaGlobalAfterTax-.1104082332093956)<1e-8,'Benchmark sectorial ROIC declarado');
 assert.ok(data.salvedades.some(x=>/peer|pares|comparables/i.test(x)),'No certificar comparables sin denominadores homogéneos');

 const sensitivityHtml=data.hojas.valoracion['Sensibilidad 7 metodos x historias']||'';
 assert.equal((sensitivityHtml.match(/#(?:ERROR|REF|VALUE|DIV\/0|N\/A)!/g)||[]).length,0,'Ninguna celda con error en matriz publicada');
 const parseCells=html=>[...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').trim());
 const gridRows=[...sensitivityHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>parseCells(m[1]));
 const asNum=x=>{const n=Number(String(x??'').replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:NaN;};
 const multNames=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
 let cellsChecked=0,centresChecked=0;
 for(let method=0;method<7;method++)for(let sc=0;sc<2;sc++){
   const scenario=sc?'optimista':'conservador',headerRow=6+(2*method+sc)*12;
   const axesX=gridRows[headerRow-1].slice(1,6).map(asNum),axesY=Array.from({length:5},(_,i)=>asNum(gridRows[headerRow+i][0]));
   assert.ok(axesX.every(Number.isFinite)&&axesY.every(Number.isFinite),'Cinco ejes numéricos no fraccionales '+method+' '+scenario);
   for(let i=0;i<5;i++)for(let j=0;j<5;j++){
      const cell=asNum(gridRows[headerRow+i][j+1]);
      assert.ok(Number.isFinite(cell)&&cell>=0,'Matriz inválida '+multNames[method]+' '+scenario+' fila '+i+' columna '+j);
      if(j>0) assert.ok(cell+0.025>=asNum(gridRows[headerRow+i][j]),'Múltiplo mayor no puede bajar el valor presente');
      cellsChecked++;
   }
   const ctr=data.sensibilidadMultiples.controles.find(x=>x.metodo===multNames[method]&&x.escenario===scenario);
   assert.ok(ctr&&ctr.estado==='OK','Control central no marcado OK');
   const mid=asNum(gridRows[headerRow+2][3]);
   assert.ok(Math.abs(mid-ctr.centro)<0.025,'Centro 5x5 conciliado a metodología '+multNames[method]+' '+scenario);
   assert.equal(gridRows[headerRow+6][3],'OK','Control dentro de hoja no es OK');
   centresChecked++;
 }
 assert.equal(cellsChecked,350,'350 salidas numéricas para catorce matrices');assert.equal(centresChecked,14,'14 centros distintos de escenario base');
 assert.equal(data.auditoria.reparacionSensibilidad20261022.erroresDespues,0,'Resultado auditado cero errores');
 const region=data.auditoria.evidenciaDeudaGeografia20261022.conciliacionLTMRegiones;
 assert.ok(region,'Regional LTM reconciliado en expediente');
 assert.ok(Math.abs(region.USDMillones.reduce((a,b)=>a+b,0)-49734.633)<1e-6,'Regiones suman LTM real USD 49.734,633 millones');
 assert.ok(Math.abs(region.participaciones.reduce((a,b)=>a+b,0)-1)<1e-10,'Peso regional suma 100%');
 assert.ok(data.hojas.valoracion['Evidencia deuda y geografía'].includes('49734,633')||data.hojas.valoracion['Evidencia deuda y geografía'].includes('49.734,633'),'Regiones LTM publicadas en hoja canónica');
 console.log('OK: 14 matrices × 25 = 350 celdas verificadas, centros numéricos y 4 regiones LTM SEC');
 const replay=data.auditoria.replayDCF4Historias;
 assert.ok(replay&&replay.records?.length===4,'Cuatro replay DCF de valor y flujos independientes');
 const nearDC=(observed,expected,detail)=>{assert.ok(typeof observed==='number'&&typeof expected==='number'&&Number.isFinite(observed)&&Number.isFinite(expected)&&Math.abs(observed-expected)<Math.max(1e-6,Math.abs(expected)*1e-10),detail+' calculado '+expected+' actual '+observed);};
 let auditIdentities=0;
 for(const record of replay.records){
   const history=data.escenariosDCF.historias.find(x=>x.id===record.id);
   assert.ok(history,'Historia registrada '+record.id);
   let pv=0,factor=1;
   for(let i=0;i<10;i++){
     const previous=i?record.revenues[i-1]:record.baseRevenue;
     const revenue=previous*(1+record.growth[i]);nearDC(record.revenues[i],revenue,'Ingresos '+record.id+' año'+(i+1));auditIdentities++;
     const ebit=revenue*record.margin[i];nearDC(record.ebit[i],ebit,'EBIT '+record.id+' año'+(i+1));auditIdentities++;
     const nopat=ebit*(1-record.tax[i]);nearDC(record.nopat[i],nopat,'NOPAT '+record.id+' año'+(i+1));auditIdentities++;
     const ratio=i<5?record.s2cPrimero:record.s2cUltimo;
     const reinvest=Math.max(0,(revenue-previous)/ratio);nearDC(record.reinvest[i],reinvest,'Reinversión '+record.id+' año'+(i+1));auditIdentities++;
     const fcff=nopat-reinvest;nearDC(record.fcff[i],fcff,'FCFF '+record.id+' año'+(i+1));auditIdentities++;
     factor/=1+record.wacc[i];nearDC(record.discountFactor[i],factor,'Factor descuento '+record.id+' año'+(i+1));auditIdentities++;
     const p=fcff*factor;nearDC(record.pvFCFF[i],p,'PV FCFF '+record.id+' año'+(i+1));auditIdentities++;pv+=p;
   }
   const t=record.terminal,b=record.bridge;
   nearDC(t.revenue,record.revenues[9]*(1+t.growth),'Ingreso terminal '+record.id);auditIdentities++;
   nearDC(t.ebit,t.revenue*t.margin,'EBIT terminal '+record.id);auditIdentities++;
   nearDC(t.nopat,t.ebit*(1-t.tax),'NOPAT terminal '+record.id);auditIdentities++;
   nearDC(t.reinvest,t.nopat*t.growth/history.roicTerminal,'Reinversión terminal '+record.id);auditIdentities++;
   nearDC(t.fcff,t.nopat-t.reinvest,'FCFF terminal '+record.id);auditIdentities++;
   assert.ok(t.wacc>t.growth,'WACC > crecimiento terminal '+record.id);
   nearDC(t.terminalValue,t.fcff/(t.wacc-t.growth),'Valor terminal '+record.id);auditIdentities++;
   nearDC(t.pvTerminal,t.terminalValue*factor,'PV terminal '+record.id);auditIdentities++;
   nearDC(b.pvExplicit,pv,'PV explícito '+record.id);auditIdentities++;
   nearDC(b.ev,pv+t.pvTerminal,'EV '+record.id);auditIdentities++;
   nearDC(b.equity,b.ev-b.debt-b.minority+b.cash+b.nonOperating,'Patrimonio '+record.id);auditIdentities++;
   nearDC(b.commonEquity,b.equity-b.options,'Patrimonio común '+record.id);auditIdentities++;
   nearDC(b.price,b.commonEquity/b.shares,'DCF por acción '+record.id);auditIdentities++;
   nearDC(history.valor,b.price,'Expediente DCF '+record.id);auditIdentities++;
 }
 const h3=data.escenariosDCF.historias.filter(h=>h.id!=='C');
 nearDC(data.valorEsperado.valor,h3.reduce((acc,h)=>acc+h.probabilidad*h.valor,0)/h3.reduce((acc,h)=>acc+h.probabilidad,0),'Promedio sin disrupción');auditIdentities++;
 assert.equal(auditIdentities,333,'333 conciliaciones independientes: 4×(70 anuales + 13 terminal/bridge) + promedio');
 console.log('OK: replay independiente de cuatro escenarios DCF con '+auditIdentities+' identidades numéricas (sin suplantar control SEC 124)');
 const primary=data.auditoria.reanudacionControlPrimario;
 assert.ok(primary,'Auditoría de fuente primaria SEC tras reanudación');
 const region=primary.regionesNueveMeses2026;
 const sum=Object.values(region.ingresos).reduce((acc,x)=>acc+x,0);
 assert.ok(Math.abs(sum-region.total)<1e-8 && Math.abs(region.total-37683.871)<1e-6,'SEC 9M2026 cuatro regiones = ingresos consolidados');
 for(const [key,raw] of Object.entries(region.ingresos))assert.ok(Math.abs(region.participaciones[key]-raw/region.total)<1e-11,'Peso SEC '+key);
 const opt=primary.opciones;
 assert.equal(opt.saldoDic2025+opt.otorgadas2026-opt.ejercidas2026-opt.expiradas2026,opt.saldoSep2026,'Roll-forward SEC stock options');
 assert.equal(opt.saldoSep2026,120175117,'Cantidad SEC 30sep2026');
 assert.equal(opt.plazoRemanentePromedio,'No reportado en la tabla trimestral','No inventar plazo exacto de opciones');
 const lease=primary.arrendamientos;
 assert.ok(Math.abs(lease.corrienteUSDmm+lease.noCorrienteUSDmm-lease.totalUSDmm)<1e-8,'SEC leases corrientes + no corrientes');
 assert.equal(primary.deuda.estado,'Estimado, no certificado','Costo deuda no equivale a YTM certificado');
 assert.ok(!/certificad[oa]s?/.test(region.limite.toLowerCase()) || /no permite/.test(region.limite),'Advertir límite regional para CRP');
 console.log('OK: controles SEC independientes sobre geografía, opciones, leases y límite de Kd sin alterar DCF principal');
 const newFailures=result.checks.filter(x=>x.status==='fail'&&['DCF','Escenarios','Múltiplos','Sensibilidad'].includes(x.area));
 assert.equal(newFailures.length,0,'Las conciliaciones de DCF/múltiplos no deben fallar: '+JSON.stringify(newFailures));
 console.log('OK: smoke test sobre expediente de Netflix publicado. La existencia de salvedades o diferencias se informa, no se convierte en certificación.');
})().catch(e=>{console.error(e);process.exitCode=1;});
