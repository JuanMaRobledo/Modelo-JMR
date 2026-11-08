import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('ChatGPT y Claude comparten la única puerta de entrada Floyd',()=>{
  const agents=read('AGENTS.md'),claude=read('CLAUDE.md');
  const contract=read('docs/CONTRATO_EJECUCION_FLOYD.md'),orders=read('docs/prompts/ordenes-floyd.md');
  const rules=read('modelo/REGLAS_VIGENTES.md');
  assert.match(agents,/ChatGPT, Claude y cualquier ejecutor/);
  for(const p of ['modelo/REGLAS_VIGENTES.md','docs/CONTRATO_EJECUCION_FLOYD.md','docs/prompts/ordenes-floyd.md'])
    assert.ok(agents.includes(p),'AGENTS no referencia '+p);
  assert.match(claude,/AGENTS.md/);
  assert.match(claude,/CONTRATO_EJECUCION_FLOYD.md/);
  assert.match(contract,/única secuencia operativa/);
  assert.match(orders,/Paridad obligatoria ChatGPT \/ Claude/);
  assert.match(rules,/Floyd es el perfil oficial por defecto/);
});

test('Floyd tiene F1-F5, H1/H2 y solo tres historias, con MOS sobre Base',()=>{
  const s=read('docs/CONTRATO_EJECUCION_FLOYD.md');
  for(const phase of ['F1 · Corte','F2 · Históricos','F3 · Supuestos','F4 · Investigación','F5 · Auditoría'])
    assert.ok(s.includes(phase),phase);
  for(const part of ['Históricos','Valoración','Conservadora, Base, Optimista','14 capítulos','12 apartados','MOS 35 %','NO_EJECUTADO','floyd-h1-h2-separados-v1','archivoFloyd','EN_REVISION'])
    assert.ok(s.includes(part),'Falta contrato: '+part);
  assert.match(s,/cinco fases/i);
  assert.match(s,/F1→F2→F3→F4/);
});

test('Las rutas de entrada de ambas plataformas llevan al contrato, no a cuatro fases de Floyd',()=>{
  const process=read('docs/PROCESO_UNICO_JMR.md');
  const chatgpt=read('docs/propuestas/fases/MODO_CHATGPT.md');
  const claude=read('CLAUDE.md');
  for(const doc of [process,chatgpt,claude])
    assert.ok(doc.includes('CONTRATO_EJECUCION_FLOYD.md'));
  assert.match(chatgpt,/Floyd utiliza F1 corte, F2 Históricos→Valoración, F3 tres historias/);
  assert.match(claude,/no.*cuatro fases/i);
});

test('El contrato editorial sigue siendo el mismo Nivel 1 14 + Nivel 2 12',()=>{
  const research=read('docs/prompts/research-fundamental-jmr-v5.md');
  const contract=read('docs/CONTRATO_EJECUCION_FLOYD.md');
  assert.match(research,/14 capítulos/);
  assert.match(research,/12 apartados/);
  assert.match(contract,/Nivel 1: 14 capítulos/);
  assert.match(contract,/Nivel 2: 12 apartados/);
});
