import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { visorAuditoria } from '../docs/v2/auditoria-usuario.mjs';
import { construirCatalogo } from '../scripts/v2-catalogo.mjs';

const texto = p=>fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
const html=texto('docs/jmr-v2.html');

test('EPAM y Oracle coexisten en el catálogo V2 y permanecen pendientes',()=>{
 const c=construirCatalogo(new URL('../docs/v2', import.meta.url).pathname);
 assert.deepEqual(c.errores,[]);
 assert.deepEqual(c.catalogo.empresas.map(x=>x.ticker),['EPAM','ORCL']);
 for(const e of c.catalogo.empresas){
   assert.equal(e.visorAuditoria,'pendientes');
   assert.equal(e.aprobacionUsuario,null);
   assert.equal(e.visibilidadApp,'PUBLICADA_PARA_REVISION');
   assert.ok(e.valorBase>0);
 }
});
test('solo la aprobación expresa y de esta revisión puede mover al visor auditado',()=>{
 const sha='a'.repeat(64);
 const exp={ticker:'TEST',fictional:false,estado:'EN_REVISION',libro:{sha256:sha},
  auditoriaUsuario:{resultado:'APROBADA',aprobadaPor:'JuanMaRobledo',fecha:'2026-11-13',evidencia:'revision-manual-documentada',revisionSha256:sha}};
 assert.equal(visorAuditoria(exp,{permitido:'EN_REVISION'}),'auditadas');
 exp.auditoriaUsuario.revisionSha256='b'.repeat(64);
 assert.equal(visorAuditoria(exp,{permitido:'EN_REVISION'}),'pendientes');
 exp.auditoriaUsuario.revisionSha256=sha;
 assert.equal(visorAuditoria(exp,{permitido:'EN_PROCESO'}),'pendientes');
 assert.equal(visorAuditoria({...exp,fictional:true},{permitido:'EN_REVISION'}),'pendientes');
});
test('ocho pestañas, estados financieros por estado e interfaz de edición integrados',()=>{
 const names=['analisis','valoracion','financieros','indicadores','modelo','sensibilidades','asuntos','revision'];
 for(const n of names){
   assert.match(html,new RegExp('data-v2-view="'+n+'"'));
   assert.match(html,new RegExp('data-v2-tab="'+n+'"'));
 }
 for(const id of ['incomeTable','balanceTable','cashflowTable'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const phrase of ['Estado de resultados','Estado de situación financiera','Estado de flujos de efectivo','Flujo de efectivo operativo','operatingCF','Los conceptos ausentes en el expediente normalizado aparecen como N/D']){
   assert.ok(html.includes(phrase),phrase);
 }
 assert.match(html,/await import\('\.\/v2\/editor-analisis\.mjs'\)/);
 assert.match(html,/id="viewPending"/);
 assert.match(html,/id="viewApproved"/);
});
test('el editor admite imágenes y guarda en rama de borradores, nunca altera motor ni autoaprueba',()=>{
 const src=texto('docs/v2/editor-analisis.mjs');
 assert.match(src,/const RAMA='v2\/analisis-borradores'/);
 assert.match(src,/image\/png,image\/jpeg,image\/webp/);
 assert.match(src,/Guardar borrador en GitHub/);
 assert.doesNotMatch(src,/auditoriaUsuario\s*=/);
 assert.match(src,/cleanHtml\(/);
});
