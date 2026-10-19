const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'docs/auditoria-multiplos.js'),'utf8');
const ctx={};vm.runInNewContext(source,ctx,{filename:'auditoria-multiplos.js'});
const audit=ctx.JmrMultiplesAudit;
const sample={
 ticker:'TEST',escenariosDCF:{conservador:80,base:100,optimista:120,disrupcion:20},
 metodos:[{nombre:'DCF Damodaran',peso:.6},{nombre:'EV/EBITDA',peso:.25},{nombre:'P/E',peso:.15}],
 descuentoMultiples:{dcfHoy:{base:100},multiplesHoy:{base:115},metodos:[
 {nombre:'EV/EBITDA',base:{vp:[110,111,112],consolidado:111},conservador:{vp:[70,75,80]},optimista:{vp:[120,130,140]}},
 {nombre:'P/E',base:{vp:[112,116,118],consolidado:116},conservador:{vp:[78,85,90]},optimista:{vp:[128,137,145]}}
 ]},
 seleccionMultiples:{metodos:[{nombre:'EV/EBITDA',pesoVigente:.25,control:'OK'},{nombre:'P/E',pesoVigente:.15,control:'OK'}]},
 valorPresentePonderado:{base:106},objetivoPonderado:{base:140}
};
test('existen los siete múltiplos, incluidos P/V y P/BV',()=>{
 assert.deepEqual(Array.from(audit.METHODS),['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV']);
 assert.equal(audit.SCENARIOS.length,3);assert.equal(audit.SCENARIOS.includes('disrupcion'),false);
});
test('peso efectivo no hereda sugerencias obsoletas',()=>{
 const s=structuredClone(sample);
 s.seleccionMultiples.metodos.push({nombre:'P/BV',pesoVigente:.3,control:'OK'});
 assert.equal(audit.methodView(s,'P/BV').peso,0);
});
test('DCF principal separado de VP3 y valor combinado',()=>{
 const s=audit.compare(sample);
 assert.equal(s.dcf,100);assert.ok(Math.abs(s.weightSum-1)<1e-8);
 assert.equal(s.relativoHoy,115);assert.equal(s.mezclaHoy,106);
 assert.equal(s.gapVP3,(112*.25+118*.15)/.4);
 assert.equal(s.gap,s.gapVP3/100-1);
 assert.equal(s.metodos.length,7);
});
test('en falta de anclas el múltiplo no se inventa',()=>{
 const s=structuredClone(sample);
 s.descuentoMultiples.metodos[0].base.vp[2]=null;
 assert.equal(audit.compare(s).gap,null);
});
test('filtrar revisiones no cambia la fuente de valoraciones',()=>{
 const items=[{ticker:'TEST',clasificacion:'BRECHA_MATERIAL'},{ticker:'OTRA',clasificacion:'MANTENER_EN_REVISION'}];
 const r={TEST:{estado:'conforme'},OTRA:{estado:'pendiente'}};
 assert.deepEqual(Array.from(audit.reviewList(items,'aprobados','',r),x=>x.ticker),['TEST']);
 assert.deepEqual(Array.from(audit.reviewList(items,'pendientes','',r),x=>x.ticker),['OTRA']);
});
test('página integrada y accesible por ticker desde visor',()=>{
 const html=fs.readFileSync(path.join(root,'docs/auditoria-multiplos.html'),'utf8');
 for(const id of ['companies','status','search','filter','companyDetail','auditTitle','metrics','methods','historical','dossier','matrixMethod','matrixScenario','matrix','reviewSave','reviewState','reviewNote','reviewUpdated','exportReviews'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/auditoria-multiplos\.js/);
 const visor=fs.readFileSync(path.join(root,'docs/visor.html'),'utf8');
 assert.match(visor,/auditoria-multiplos\.html\?ticker=/);
 const research=fs.readFileSync(path.join(root,'docs/research.html'),'utf8');
 assert.match(research,/href="auditoria-multiplos\.html"/);
});

test('diseño de auditoría: ancho completo y una columna principal en todas las pantallas',()=>{
 const html=fs.readFileSync(path.join(root,'docs/auditoria-multiplos.html'),'utf8');
 const css=html.slice(html.indexOf('/* Auditoría a ancho completo'),html.indexOf('</style>'));
 assert.ok(css.length>1800,'Debe existir el diseño responsive nuevo');
 assert.match(css,/\.wrap\{width:100%;max-width:none/);
 assert.match(css,/\.layout,\.columns,#companyDetail\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.reference-grid,\.review-grid\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.table-wrap\{width:100%;max-width:100%;min-width:0;overflow-x:auto/);
 assert.match(css,/\.audit-data-table thead\{display:none\}/);
 assert.match(css,/\.audit-data-table tbody td::before\{content:attr\(data-label\)/);
 assert.match(css,/table\.sensitivity\{width:100%;min-width:0;table-layout:fixed\}/);
});
test('tablas de cada empresa tienen rótulos móviles en cada columna de cada fila',()=>{
 const tables=[
  [audit.methodsTable(sample,audit.compare(sample)),['Método','Peso vigente','VP3 conservador','VP3 base','VP3 optimista','Control y fundamento']],
  [audit.historyTable(audit.compare(sample)),['Método','Datos históricos válidos','Mediana 5A','Mediana depurada','Múltiplo de referencia']]
 ];
 for(const [html,labels] of tables){
  assert.match(html,/class="audit-data-table/);
  assert.match(html,/class="table-wrap"/);
  for(const label of labels)assert.ok(html.includes('data-label="'+label+'"'),label+' falta en la tabla');
  assert.equal((html.match(/<tr><th data-label="Método">/g)||[]).length,7,'siete múltiplos presentes');
 }
});

test('inventario vivo señala informes sin valoración, valoraciones sin informe y empresas sin dictamen',()=>{
 const report=audit.inventory(
  {entradas:[{ticker:'AAPL',clasificacion:'MANTENER_EN_REVISION'},{ticker:'YA_NO_EXISTE'}]},
  {AAPL:'valoraciones/AAPL-1.json',EXTRA:'valoraciones/EXTRA-2.json'},
  {EXTRA:'analisis/EXTRA-research-1.json','PFDAVIGRP.CL':'analisis/PFDAVIGRP.CL-research-1.json'}
 );
 assert.deepEqual(Array.from(report.reportOnly),['PFDAVIGRP.CL']);
 assert.deepEqual(Array.from(report.valuationOnly),['AAPL']);
 assert.deepEqual(Array.from(report.unaudited),['EXTRA']);
 assert.deepEqual(Array.from(report.vanished),['YA_NO_EXISTE']);
 assert.equal(report.entries.length,2);
 assert.equal(report.entries.find(x=>x.ticker==='EXTRA').clasificacion,'SIN_AUDITORIA');
});
test('inventario no afirma que falten informes cuando falla su listado',()=>{
 const report=audit.inventory({entradas:[{ticker:'AAPL'}]},{AAPL:'valoraciones/AAPL-1.json'},null);
 assert.equal(report.reportOnly,null);
 assert.equal(report.valuationOnly,null);
 assert.equal(report.valuation.length,1);
});
test('aplicación expone la cobertura y no limita la lista a 38 valoraciones',()=>{
 const js=fs.readFileSync(path.join(root,'docs/auditoria-multiplos.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'docs/auditoria-multiplos.html'),'utf8');
 assert.match(html,/id="coverage"/);
 assert.match(js,/listing\("analisis",/);
 assert.match(js,/listing\("valoraciones",/);
 assert.doesNotMatch(js,/audit\.entradas\.length!==38/);
 assert.match(html,/Inventario actualizado autom/);
});
