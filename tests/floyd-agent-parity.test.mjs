import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Floyd oficial R1–R6 es el contrato del Reboot, universal para agentes',()=>{
 const agents=read('AGENTS.md'),claude=read('CLAUDE.md'),rules=read('modelo/REGLAS_VIGENTES.md');
 for(const doc of [agents,claude,rules]){
   assert.match(doc,/Floyd/);
   assert.match(doc,/R1[–-]R6/);
   assert.match(doc,/CONTRATO_REBOOT_JMR/);
 }
 assert.match(agents,/ChatGPT, Claude, Gemini/);
 assert.match(rules,/contratoLibros=jmr-reboot-3libros-v1/);
 assert.match(rules,/F1[–-]F5/);
});
test('Floyd mantiene seis archivos, tres historias, MOS35 y auditoría independiente',()=>{
 const c=read('docs/CONTRATO_REBOOT_JMR.md'),o=read('docs/prompts/ordenes-reboot.md');
 for(const part of ['HISTÓRICOS','Conservadora','Optimista','MÚLTIPLOS','ANÁLISIS','14 capítulos','12 apartados','R1','R2','R3','R4','R5','R6','35 %','jmr-reboot-3libros-v1'])
   assert.ok(c.includes(part),'Falta requisito '+part);
 assert.match(o,/auditoría independiente/);
 assert.match(c,/"perfil_valoracion": "Floyd"/);
});
test('Floyd F1–F5 existe sólo como material archivado y no guía nuevas valoraciones',()=>{
 const a=read('AGENTS.md'),cl=read('CLAUDE.md');
 assert.match(a,/Floyd legado/);
 assert.match(cl,/No usar el Floyd antiguo/);
 assert.match(a,/archivo-v1/);
});
