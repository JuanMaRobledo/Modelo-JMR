import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../docs/prompts/',import.meta.url);
const docs=[
  {file:'valoracion-modelo-jmr-v5.md',role:'1/3',title:'VALORACIÓN'},
  {file:'research-fundamental-jmr-v5.md',role:'2/3',title:'ANÁLISIS FUNDAMENTAL'},
  {file:'auditoria-economica-jmr-v1.md',role:'3/3',title:'AUDITORÍA'}
].map(x=>({...x,s:fs.readFileSync(new URL(x.file,root),'utf8')}));
const headings=s=>[...s.matchAll(/^#{2,4}\s+(\d{1,2})\.\s+/gm)].map(m=>Number(m[1]));
test('hay exactamente tres prompts maestros separados y rotulados',()=>{
  for(const d of docs){
    assert.ok(d.s.startsWith('# PROMPT MAESTRO '+d.role));
    assert.match(d.s.split('\n')[0],new RegExp(d.title));
    assert.match(d.s,/Alcance exclusivo|Contrato operativo exclusivo/);
    for(const other of docs.filter(x=>x!==d))assert.ok(!d.s.startsWith('# PROMPT MAESTRO '+other.role));
  }
});
test('Análisis y Auditoría tienen sus 18 apartados distintos y sin reducción',()=>{
  assert.deepEqual(headings(docs[1].s),Array.from({length:18},(_,i)=>i+1));
  assert.deepEqual(headings(docs[2].s),Array.from({length:18},(_,i)=>i+1));
  assert.match(docs[1].s,/Nivel 1/);
  assert.match(docs[1].s,/Nivel 2/);
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


test('contratos depurados: una copia nueva, MOS Base y versión única de auditoría',()=>{
  assert.match(docs[0].s,/copia nueva por ticker y clase/i);
  assert.doesNotMatch(docs[0].s,/El margen de seguridad se aplica al esperado/i);
  assert.match(docs[0].s,/margen de seguridad se aplica SOLO al DCF\/FCFE\/SOTP Base/i);
  assert.match(docs[1].s,/sin crear una valoración propia/i);
  assert.match(docs[1].s,/SOLO respecto al valor principal Base/i);
  assert.match(docs[2].s,/prompt_version: auditoria-economica-jmr-v1\.1/i);
  assert.doesNotMatch(docs[2].s,/auditoria-economica-jmr-v1\.0/i);
});
