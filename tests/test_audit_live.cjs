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
 assert.ok(result.ltm.length>0,'Se debe poder recalcular el puente LTM');
 assert.ok(result.assumptions.some(x=>x.label==='Margen EBIT objetivo'&&x.status==='Conciliado'&&Math.abs(x.model-.34)<1e-8),
   'El margen Base activo 34 % debe conciliar con la hoja; 21,30 % es solo histórico');
 assert.ok(result.assumptions.some(x=>x.label==='CAGR ingresos 1–5'&&x.status==='Conciliado'),
   'El CAGR de cinco años corresponde al 7,99 %');
 assert.ok(result.assumptions.some(x=>x.label==='CAGR ingresos 2–5'&&x.status==='Conciliado'&&Math.abs(x.model-.07494185688011479)<1e-7),
   'El CAGR años 2–5 es 7,49 %, no 7,99 %');
 assert.ok(result.assumptions.every(x=>x.status!=='Revisar origen'),
   'La documentación sincronizada no debe denunciar una falsa contradicción de supuestos');
 assert.equal(result.disruption.id,'C','Disrupción no entra en promedio ordinario');
 console.log('OK: smoke test sobre expediente de Netflix publicado. La existencia de salvedades o diferencias se informa, no se convierte en certificación.');
})().catch(e=>{console.error(e);process.exitCode=1;});
