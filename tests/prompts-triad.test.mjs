import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../docs/prompts/', import.meta.url);
const docs = [
  {file:'valoracion-modelo-jmr-v5.md',role:'1/3',title:'VALORACIÓN',kind:'maestro'},
  {file:'research-fundamental-jmr-v5.md',role:'2/3',title:'ANÁLISIS FUNDAMENTAL',kind:'maestro'},
  {file:'auditoria-economica-jmr-v1.md',role:'3/3',title:'AUDITORÍA',kind:'maestro'}
].map(x=>({...x,s:fs.readFileSync(new URL(x.file,root),'utf8')}));

const headingNumbers = s => [...s.matchAll(/^#{2,4}\s+(\d{1,2})\.\s+/gm)].map(m=>Number(m[1]));
const narrativeChapterNumbers = s => {
  const section = s.split('## NIVEL 1 — Índice JMR (14 capítulos)')[1]?.split('## NIVEL 2')[0] || '';
  return [...section.matchAll(/^(\d{1,2})\. \*\*/gm)].map(m=>Number(m[1]));
};

test('hay tres prompts maestros únicos, separados y rotulados',()=>{
  assert.equal(docs.length,3);
  for(const d of docs){
    assert.match(d.s.split('\n')[0],new RegExp(d.title));
    if(d.kind==='maestro'){
      assert.ok(d.s.startsWith('# PROMPT MAESTRO '+d.role));
      assert.match(d.s,/Alcance exclusivo|Contrato operativo exclusivo/);
    }
  }
});

test('Research vigente: 14 capítulos y Nivel 2; auditoría independiente: 18 secciones',()=>{
  assert.deepEqual(narrativeChapterNumbers(docs[1].s),Array.from({length:14},(_,i)=>i+1));
  assert.match(docs[1].s,/5\. \*\*Ciclos de la empresa, del mercado y de la macroeconomía/);
  assert.match(docs[1].s,/## NIVEL 2 — Cálculos, estados y soportes/);
  assert.match(docs[1].s,/Tarea exclusiva de análisis|Alcance exclusivo — investigación y redacción/);
  assert.match(docs[1].s,/no modificar inputs, Sheets, fórmulas, escenarios, auditorías o catálogo/);
  assert.match(docs[1].s,/12 apartados verificables/);
  assert.match(docs[1].s,/no crear números, fuentes, matrices ni estimaciones/i);
  assert.deepEqual(headingNumbers(docs[2].s),Array.from({length:18},(_,i)=>i+1));
  assert.match(docs[2].s,/no modific|no modifica/i);
});

test('Valorar no dispara investigación ni auditoría y no altera publicación por sí mismo',()=>{
  assert.match(docs[0].s,/no crear el artículo fundamental/i);
  assert.match(docs[0].s,/no realizar la auditoría independiente/i);
  assert.match(docs[0].s,/no publicar ni sustituir la valoración oficial/i);
  assert.match(docs[0].s,/DCF inverso/);
  assert.match(docs[0].s,/Disrupción/);
});

test('No existe ya el gran encabezado duplicado de ambos prompts',()=>{
  const longLines=s=>new Set(s.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>75));
  const a=longLines(docs[0].s),b=longLines(docs[1].s);
  const overlap=[...a].filter(line=>b.has(line));
  assert.ok(overlap.length<=12,'Se repetían '+overlap.length+' instrucciones de gran tamaño');
});

test('Auditoría no modifica hojas y conserva evaluación causal',()=>{
  assert.match(docs[2].s,/VERIFICAR, CONTRADECIR Y EMITIR DICTAMEN/);
  assert.match(docs[2].s,/no modificar|no modifiques/i);
  assert.match(docs[2].s,/Auditoría condicionada/);
  assert.match(docs[2].s,/fuentes primarias/i);
  assert.match(docs[2].s,/18 SECCIONES/i);
});

test('contratos vigentes: copia de valoración, MOS solo Base y auditoría v1.3',()=>{
  assert.match(docs[0].s,/copia nueva por ticker y clase/i);
  assert.doesNotMatch(docs[0].s,/El margen de seguridad se aplica al esperado/i);
  assert.match(docs[0].s,/margen de seguridad se aplica SOLO al DCF\/FCFE\/SOTP Base/i);
  assert.match(docs[1].s,/MOS35% calculado únicamente sobre Base/i);
  assert.match(docs[1].s,/no modificar inputs, Sheets, fórmulas, escenarios, auditorías o catálogo/i);
  assert.match(docs[2].s,/prompt_version: auditoria-economica-jmr-v1\.3/i);
  assert.match(docs[0].s,/matrices Base 5×5 por cada múltiplo prioritario/);
  assert.doesNotMatch(docs[0].s,/No añadir sensibilidad a múltiplos/);
  assert.match(docs[2].s,/los 14 capítulos narrativos/);
  assert.doesNotMatch(docs[2].s,/los 13 capítulos narrativos/);
  for(const d of docs) assert.doesNotMatch(d.s,/Estilo JMR narrativo vigente \(13 capítulos/);

  assert.doesNotMatch(docs[2].s,/auditoria-economica-jmr-v1\.[012]/i);
});

test('las referencias activas y la interfaz usan el mismo contrato editorial',()=>{
  const style=fs.readFileSync(new URL('../docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md',import.meta.url),'utf8');
  const rules=fs.readFileSync(new URL('../modelo/REGLAS_VIGENTES.md',import.meta.url),'utf8');
  const interfaceJs=fs.readFileSync(new URL('../docs/research.js',import.meta.url),'utf8');
  const process=fs.readFileSync(new URL('../docs/PROCESO_UNICO_JMR.md',import.meta.url),'utf8');
  const styleSection=style.split('**Índice oficial de 14 capítulos')[1]?.split('## Contrato del capítulo 5')[0] || '';
  const sections=[...styleSection.matchAll(/^(\d{1,2})\. \*\*/gm)].map(m=>Number(m[1]));
  assert.deepEqual(sections,Array.from({length:14},(_,i)=>i+1));
  assert.match(styleSection,/5\. \*\*Ciclos de la empresa, del mercado y de la macroeconomía/);
  assert.match(rules,/\*\*Versión 23 · 30-oct-2026/);
  assert.match(process,/tres prompts maestros activos/i);
  assert.match(interfaceJs,/Índice JMR de 14 capítulos/);
  assert.doesNotMatch(interfaceJs,/Estilo JMR de 13 capítulos|Índice JMR de 13 capítulos/);
});
