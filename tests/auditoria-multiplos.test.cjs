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
