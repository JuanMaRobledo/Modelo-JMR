import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/jmr-v2.html'), js=read('docs/v2/editor-analisis.mjs'), doc=JSON.parse(read('docs/v2/analisis/ORCL.json'));
const model=JSON.parse(read('docs/v2/empresas/ORCL.json'));
const tabs=['analisis','valoracion','financieros','indicadores','modelo','sensibilidades','asuntos','revision'];
test('JMR V2: ocho pestañas idénticas al expediente Floyd, con paneles y selección accesible',()=>{
 const found=[...html.matchAll(/data-v2-view="([a-z]+)"/g)].map(m=>m[1]);
 assert.deepEqual(found,tabs);
 for(const tab of tabs)assert.match(html,new RegExp('data-v2-tab="'+tab+'"'));
 assert.match(html,/function selectV2Tab\(name\)/);
 assert.match(html,/ArrowRight/);
});
test('JMR V2: los tres estados financieros tienen tablas independientes y N\/D explícito',()=>{
 for(const id of ['incomeTable','balanceTable','cashflowTable'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Estados financieros/);
 assert.match(html,/Los conceptos ausentes en el expediente normalizado aparecen como N\/D/);
 assert.match(html,/Ingresos/);assert.match(html,/Resultado neto/);
 assert.match(html,/Pasivos totales/);assert.match(html,/Flujo de efectivo operativo/);
 assert.match(html,/Flujo libre \(derivado/);
});
test('ORCL: veinte capítulos del análisis extenso, editables en V2 sin modificar valores base',()=>{
 assert.equal(doc.ticker,'ORCL');
 assert.equal(doc.schemaVersion,'jmr-v2-analisis-1');
 const text=Object.values(doc.blocks).join('\n');
 for(let n=1;n<=20;n++)assert.match(text,new RegExp('<h3>'+n+'\\.'));
 assert.match(html,/editor-analisis\.mjs/);
 assert.match(html,/gh_oauth\.js/);
 assert.match(js,/contentEditable/);
 assert.match(js,/Insertar imagen/);
 assert.match(js,/Guardar borrador en GitHub/);
 assert.match(js,/v2\/analisis-borradores/);
 assert.equal(model.estado,'EN_REVISION');
 assert.equal(model.libro.valores.base,55.6560059420807);
 assert.equal(model.libro.valores.conservador,5.06884037140071);
 assert.equal(model.libro.valores.optimista,143.714427565269);
 assert.equal(model.auditoria,undefined);
});
test('Editar no equivale a publicar ni aprobar y el libro sigue separado',()=>{
 assert.match(html,/no recalcula ni publica esta ficha automáticamente/);
 assert.match(html,/no recalcula ni publica esta ficha automáticamente/);
 assert.match(js,/sin alterar DCF ni publicar automáticamente/);
 assert.match(model.documentLinks.workbook,/^https:\/\/docs\.google\.com\/spreadsheets\//);
 assert.match(model.documentLinks.annualReportsFolder,/^https:\/\/drive\.google\.com\/drive\/folders\//);
});
