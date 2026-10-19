const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('refrescar la hoja conserva siete métodos y el P/V aprobado de MP',()=>{
 const context={console,AbortSignal,setTimeout,clearTimeout,XLSX:{utils:{decode_cell:()=>({r:0,c:0}),encode_range:()=> 'A1',sheet_to_html:()=>'<table></table>'}}};context.globalThis=context;vm.runInNewContext(fs.readFileSync('docs/model-sync.js','utf8'),context);
 const n=v=>({v,w:String(v)}),sheets={'Input sheet':{},'Valuation output':{},'Resumen de Valoración':{G4:n(.25),D32:n(100)},'Descuento de múltiplos':{A5:n('Tasa de descuento: Ke'),B38:n(.8),B39:n(.2),B55:n(.2)},PV:{},PBV:{},'Escenarios e historias':{H10:n(100),H11:n(100)}};
 [100,80,-20,120].forEach((v,i)=>sheets['Escenarios e historias']['H'+(i+5)]=n(v));
 [12,23,34].forEach(r=>'FGH'.split('').forEach((c,i)=>sheets.PV[c+r]=n(10+i)));
 [41,42,43].forEach(r=>'BCDE'.split('').forEach((c,i)=>sheets.PV[c+r]=n(8+i)));
 const a=context.JmrModelSync.record({record:{ticker:'MP'},sheets,fetchedAt:'2026-10-19'});
 assert.equal(a.metodos.length,8);assert.equal(a.descuentoMultiples.metodos.length,7);assert.equal(a.metodos.find(m=>m.nombre==='P/V').peso,.2);assert.equal(a.metodos.find(m=>m.nombre==='P/V').base,12);assert.equal(a.precioMOS,75);
});
test('auditoría muestra SOTP y MOS sin exigir DCF',()=>{
 const c={};c.globalThis=c;vm.runInNewContext(fs.readFileSync('docs/auditoria-multiplos.js','utf8'),c);
 const html=c.JmrMultiplesAudit.summaryCards({ticker:'GRUPOARGOS',currency:'COP',mos:.35,valoracionHolding:{estado:'PRELIMINAR',nav:{base:18000}}},{},{});
 assert.match(html,/SOTP Base · principal/);assert.match(html,/11\.700/);assert.match(html,/DCF opcional sin peso/);assert.doesNotMatch(html,/DCF Base · principal/);
});
