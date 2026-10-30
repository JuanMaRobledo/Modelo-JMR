import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../docs/prompts/', import.meta.url);
const docs = [
  {file:'valoracion-modelo-jmr-v5.md',role:'1/3',title:'VALORACIÓN',kind:'maestro'},
  {file:'research-fundamental-jmr-v5.md',role:'2/3',title:'RESEARCH FUNDAMENTAL',kind:'vigente'},
  {file:'auditoria-economica-jmr-v1.md',role:'3/3',title:'AUDITORÍA',kind:'maestro'}
].map(x=>({...x,s:fs.readFileSync(new URL(x.file,root),'utf8')}));

const headingNumbers = s => [...s.matchAll(/^#{2,4}\s+(\d{1,2})\.\s+/gm)].map(m=>Number(m[1]));
const narrativeChapterNumbers = s => {
  const section = s.split('## NIVEL 1 — Índice JMR (14 capítulos)')[1]?.split('## NIVEL 2')[0] || '';
  return [...section.matchAll(/^(\d{1,2})\. \*\*/gm)].map(m=>Number(m[1]));
};

test('existen tres contratos diferenciados: valoración, investigación vigente y auditoría',()=>{
  assert.equal(docs.length,3);
  for(const d of docs){
    assert.match(d.s.split('\n')[0],new RegExp(d.title));
    if(d.kind==='maestro'){
      assert.ok(d.s.startsWith('# PROMPT MAESTRO '+d.role));
      assert.match(d.s,/Alcance exclusivo|Contrato operativo exclusivo/);
    }else{
      assert.match(d.s,/^# PROMPT VIGENTE — RESEARCH FUNDAMENTAL/);
      assert.match(d.s,/Tarea exclusiva de análisis/);
      assert.match(d.s,/no modificar inputs, Sheets, fórmulas, escenarios, auditorías o catálogo/);
    }
  }
});

test('Research vigente: 14 capítulos y Nivel 2; auditoría independiente: 18 secciones',()=>{
  assert.deepEqual(narrativeChapterNumbers(docs[1].s),Array.from({length:14},(_,i)=>i+1));
  assert.match(docs[1].s,/5\. \*\*Ciclos de la empresa, del mercado y de la macroeconomía/);
  assert.match(docs[1].s,/## NIVEL 2 — Cálculos, estados y soportes/);
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
  assert.doesNotMatch(docs[2].s,/auditoria-economica-jmr-v1\.[012]/i);
});
