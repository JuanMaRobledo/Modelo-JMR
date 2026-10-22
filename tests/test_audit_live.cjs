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
 assert.ok(Math.abs(data.valorPrincipal-52.028422816333226)<1e-7,'DCF Base actualizado US$52,03');
 assert.deepEqual(Array.from(data.escenariosDCF.historias.find(h=>h.id==='A').crecimientoAnual),[.12,.11,.10,.09,.08],'Trayectoria Base acordada');
 assert.ok(Math.abs(data.escenariosDCF.historias.find(h=>h.id==='A').crecimiento-.09990908189157444)<1e-8,'CAGR 1–5 = 9,99%');
 assert.ok(Math.abs(data.valorEsperado.valor-49.671286099149796)<1e-7,'Promedio A/B/D excluye disrupción');
 assert.ok(Math.abs(data.descuentoMultiples.multiplesHoy.base-51.56522810754277)<1e-7,'Múltiplos FY+3 VP recalculados');
 assert.ok(Math.abs(data.objetivoPonderado.base-68.76116627495267)<1e-7,'FY+3 ponderado canónico 40% DCF y 60% siete múltiplos');
 assert.ok(Math.abs(data.precioMOS-data.valorPrincipal*(1-data.mos))<1e-7,'MOS sobre DCF Base');
 assert.equal(data.baseMOS,'dcfBase','Mantener selector MOS original');
 const newFailures=result.checks.filter(x=>x.status==='fail'&&['DCF','Escenarios','Múltiplos','Sensibilidad'].includes(x.area));
 assert.equal(newFailures.length,0,'Las conciliaciones de DCF/múltiplos no deben fallar: '+JSON.stringify(newFailures));
 console.log('OK: smoke test sobre expediente de Netflix publicado. La existencia de salvedades o diferencias se informa, no se convierte en certificación.');
})().catch(e=>{console.error(e);process.exitCode=1;});
