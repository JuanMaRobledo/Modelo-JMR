import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {construirCatalogo} from '../scripts/v2-catalogo.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/jmr-v2.html'),editor=read('docs/v2/editor-analisis.mjs');
const orcl=JSON.parse(read('docs/v2/analisis/ORCL.json'));
const epam=JSON.parse(read('docs/v2/analisis/EPAM.json'));
const epamModel=JSON.parse(read('docs/v2/empresas/EPAM.json'));
const keys=['tesis','negocio','industria','crecimiento','ciclos','finanzas','reinversion','gobierno','metodo','supuestos','valoracion','riesgos','catalizadores','fuentes'];
test('Oracle y EPAM cumplen el índice oficial de 14 capítulos y la separación de aprobación',()=>{
 for(const d of [orcl,epam]){
   assert.equal(d.schemaVersion,'jmr-v2-analisis-2');
   assert.deepEqual(Object.keys(d.blocks),keys);
   assert.equal(d.status,'BORRADOR_EDITORIAL_NO_AUDITADO');
   assert.ok(Object.values(d.blocks).every(s=>typeof s==='string'&&s.length>150));
 }
 assert.equal(orcl.migration.originalChapterCount,20);
 assert.equal(epamModel.estado,'EN_PROCESO');
 assert.ok(!epamModel.auditoriaUsuario);
 assert.match(editor,/\['ciclos','Ciclos de la empresa, del mercado y de la macroeconomía'\]/);
});
test('EPAM conserva supuestos y valores y documenta aritmética LTM',()=>{
 assert.equal(epamModel.financials.revenue,5648.806);
 assert.equal(epamModel.assumptions.base.growth1,0.065);
 assert.equal(epamModel.assumptions.base.marginTarget,0.125);
 assert.equal(epamModel.assumptions.base.waccInitial,0.0863);
 const audit=epamModel.revisionEconomicaV2;
 assert.equal(audit.conciliacionesConfirmadas[0].resultado,5648.806);
 assert.equal(audit.conciliacionesConfirmadas[1].resultado,594.172);
 assert.ok(Math.abs(audit.salidasActualesMotorV2.base-210.69113563005644)<1e-9);
 assert.ok(audit.porcentajeVPTerminalEV.base>69);
 assert.match(epam.blocks.fuentes,/5-nov-2026|resultados 3T2026/i);
});
test('Catálogo reproducible trae logos correctos y links hacia el análisis',()=>{
 const {catalogo,errores}=construirCatalogo(new URL('../docs/v2',import.meta.url).pathname);
 assert.deepEqual(errores,[]);
 assert.equal(catalogo.empresas.length,2);
 const epamRow=catalogo.empresas.find(x=>x.ticker==='EPAM');
 const orclRow=catalogo.empresas.find(x=>x.ticker==='ORCL');
 assert.match(epamRow.logoUrl,/EPAM_logo\.png$/);
 assert.match(orclRow.logoUrl,/Oracle_logo\.svg$/);
 assert.match(html,/id="catalogCards"/);
 assert.match(html,/v2-company-brand/);
 assert.match(html,/jmr-v2\.html\?ticker=/);
 assert.match(html,/Abrir valoración y análisis/);
 assert.match(html,/window\.print\(\)/);
});
