import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const contract=JSON.parse(read('docs/v2/metodologia/contrato-v2.json'));
const methodology=read('docs/v2/metodologia/CONTRATO_UNICO_LLM.md');

test('los agentes comparten el contrato exclusivo de V2 sin sobrescribir reglas Floyd',()=>{
 assert.equal(contract.version,'1.1.0');
 assert.deepEqual(contract.agents.slice(0,3),['ChatGPT','Claude','Gemini']);
 for(const p of ['AGENTS.md','CLAUDE.md','GEMINI.md']){
  const content=read(p);
  assert.match(content,/CONTRATO_UNICO_LLM\.md/);
  assert.match(content,/Floyd/);
 }
 assert.match(methodology,/Floyd/);
});

test('el contrato distingue publicación preliminar de auditoría y aprobación personal',()=>{
 assert.equal(contract.publication.appPublicationRequiresAudit,false);
 assert.equal(contract.publication.appPublicationRequiresOwnerApproval,false);
 assert.equal(contract.audit.ownerApprovalRequiredForAuditedViewer,true);
 assert.equal(contract.audit.aiCanApprove,false);
 assert.match(methodology,/independientemente de que estén auditados/);
 assert.match(methodology,/Pendientes de mi auditoría/);
 assert.match(methodology,/Auditadas y aprobadas por mí/);
});

test('el contrato mantiene tres escenarios, MOS sobre base, libros por perfil y ocho pestañas',()=>{
 assert.deepEqual(contract.scenarios,['conservador','base','optimista']);
 assert.equal(contract.marginOfSafety,0.35);
 assert.equal(contract.mosScenario,'base');
 assert.equal(contract.dossierTabs.length,8);
 for(const p of ['operativa','banco','aseguradora','holding','alto-crecimiento'])assert.ok(contract.profiles[p]);
 for(const term of ['Estados financieros','Modelo y supuestos','Sensibilidades'])assert.match(methodology,new RegExp(term));
});
