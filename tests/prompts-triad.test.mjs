import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../docs/prompts/', import.meta.url);
test('nuevas revisiones usan A-1.2; B queda disponible y el legado no se convierte',()=>{
  const paths=['../modelo/REGLAS_VIGENTES.md','../modelo/METODOS_VALORACION.md',
    '../docs/PROCESO_UNICO_JMR.md','../docs/prompts/valoracion-modelo-jmr-v5.md'];
  for(const p of paths){
    const s=fs.readFileSync(new URL(p,import.meta.url),'utf8');
    assert.match(s,/A-1\.2/);
    assert.match(s,/salvo elección expresa de.*B/);
  }
  const rules=fs.readFileSync(new URL(paths[0],import.meta.url),'utf8');
  assert.match(rules,/exclusivamente para leer revisiones históricas/);
  assert.doesNotMatch(rules,/nunca A por defecto/);
});
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
  assert.match(rules,/\*\*Versión 40 · 11-nov-2026 \(Floyd R1–R6/);
  assert.match(rules,/Estilo JMR de 14 capítulos/);
  assert.match(process,/cinco fases/i);
  assert.match(process,/tres prompts maestros activos/i);
  assert.match(interfaceJs,/Índice JMR de 14 capítulos/);
  assert.match(interfaceJs,/jmr-research-prompt-v23-14-capitulos-20261030/);
  assert.match(interfaceJs,/jmr-valuation-prompt-a12-20261030/);
  assert.doesNotMatch(interfaceJs,/jmr-research-prompt-v19-narrativo-20261030/);
  assert.doesNotMatch(interfaceJs,/Estilo JMR de 13 capítulos|Índice JMR de 13 capítulos/);
});

test('Colombia comparte los tres prompts maestros y no revive Porter ni el índice de 18',()=>{
  const app=fs.readFileSync(new URL('../docs/research.js',import.meta.url),'utf8');
  const local=fs.readFileSync(new URL('../docs/prompts/colombia-nucleo-v1.md',import.meta.url),'utf8');
  const selection=app.split('var CO_PROMPTS = {')[1]?.split('function currentPrompt()')[0] || '';
  assert.match(selection,/research: \{ file: 'prompts\/research-fundamental-jmr-v5\.md'/);
  assert.match(selection,/valuation: \{ file: 'prompts\/valoracion-modelo-jmr-v5\.md'/);
  assert.doesNotMatch(selection,/colombia-research-v1\.md|colombia-valuation-v1\.md/);
  assert.match(local,/Nivel 1:\*\* 14 capítulos/);
  assert.match(local,/Nivel 2:\*\* 12 apartados/);
  assert.match(local,/Auditoría 3\/3/);
  assert.doesNotMatch(local,/Research v5: 18 secciones|cinco fuerzas de Porter.*obligatorio/i);
});


test('cinco fases JMR: valoración primero, históricos segundo, revisión tercero, publicación cuarto y auditoría guiada quinto',()=>{
  const root=new URL('../',import.meta.url);
  const read=(p)=>fs.readFileSync(new URL(p,root),'utf8');
  const process=read('docs/PROCESO_UNICO_JMR.md');
  const readme=read('docs/propuestas/fases/README.md');
  const rules=read('modelo/REGLAS_VIGENTES.md');
  const files=[
    'FASE_1_VALORACION_INICIAL.md',
    'FASE_2_HISTORICOS_COMPLETOS.md',
    'FASE_3_REVISION_SUPUESTOS.md',
    'FASE_4_ANALISIS_PUBLICACION.md',
    'FASE_5_AUDITORIA_GUIADA.md'
  ];
  for(const filename of files){
    assert.ok(readme.includes(filename),filename+' no está declarado en el README');
    assert.match(read('docs/propuestas/fases/'+filename),/Fase [1-5]/);
  }
  assert.match(rules,/Orden operativo obligatorio: cinco fases/);
  assert.match(read('docs/propuestas/fases/FASE_1_VALORACION_INICIAL.md'),/Input sheet/);
  assert.match(read('docs/propuestas/fases/FASE_2_HISTORICOS_COMPLETOS.md'),/hasta diez años|diez años|10 FY/i);
  assert.match(read('docs/propuestas/fases/FASE_3_REVISION_SUPUESTOS.md'),/Sales-to-Capital/);
  assert.match(read('docs/propuestas/fases/FASE_4_ANALISIS_PUBLICACION.md'),/EN_REVISION/);
  assert.match(read('docs/propuestas/fases/FASE_5_AUDITORIA_GUIADA.md'),/usuario/);
  assert.match(process,/Cinco fases|CINCO fases/);
  assert.match(readme,/Forward Valuation.*DEPRECADA/);
  assert.doesNotMatch(read('docs/expediente.js'),/indicadores:\['Trailing Valuation','Forward Valuation'/);
});


test('contrato Fase 1 cubre todas las hojas auxiliares y cinco múltiplos',()=>{
  const root=new URL('../',import.meta.url);
  const read=p=>fs.readFileSync(new URL(p,root),'utf8');
  const contract=read('docs/propuestas/fases/CONTRATO_INSUMOS_FASE_1.md');
  const fase=read('docs/propuestas/fases/FASE_1_VALORACION_INICIAL.md');
  const rules=read('modelo/REGLAS_VIGENTES.md');
  const names=['Input sheet','Cost of capital worksheet','R& D converter','Operating lease converter','Option value','Synthetic rating','Financials Multiples','EVEBITDA','EVFCFF','PFCFE','POCF','PE'];
  for(const name of names)assert.ok(contract.includes(name),name+' no está cubierto');
  assert.match(contract,/RSU\/SBC/);
  assert.ok(contract.includes('FY+1/+2/+3'));
  assert.match(fase,/CONTRATO_INSUMOS_FASE_1\.md/);
  assert.match(rules,/Cobertura integral de dependencias de Fase 1/);
});


test('Floyd es la ruta por defecto de operativas FCFF y conserva los gates de expediente', () => {
  const orders = fs.readFileSync(new URL('ordenes-floyd.md', root), 'utf8');
  const rules = fs.readFileSync(new URL('../modelo/REGLAS_VIGENTES.md', import.meta.url), 'utf8');
  const orquestador = fs.readFileSync(new URL('../docs/propuestas/fases/README.md', import.meta.url), 'utf8');
  assert.match(rules, /Floyd es el perfil oficial por defecto para nuevas valoraciones de empresas operativas/);
  assert.match(rules, /flujo compatible con FCFE\/SOTP/);
  assert.match(orquestador, /usa Floyd por defecto/);
  for (const doc of docs) assert.match(doc.s, /\(ordenes-floyd\.md\)/);
  assert.deepEqual([...orders.matchAll(/^## F([1-5]) ·/gm)].map(match => match[1]), ['1', '2', '3', '4', '5']);
  assert.match(orders, /Conservadora ≤ Base ≤ Optimista/);
  assert.match(orders, /Publica como EN_REVISION solo si/);
});


test('Floyd R1–R6: la IA solo hace tres tareas y no altera motor o libros',()=>{
  const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
  const rules=read('../modelo/REGLAS_VIGENTES.md');
  const contract=read('../docs/CONTRATO_REBOOT_JMR.md');
  const orders=read('../docs/prompts/ordenes-reboot.md');
  const prompt=read('../docs/prompts/PROMPT_MAESTRO_REBOOT.md');
  assert.match(rules,/exactamente tres funciones/);
  assert.match(rules,/10 ejercicios fiscales completos consecutivos/);
  assert.match(rules,/no puede modificar la configuración/);
  assert.match(contract,/tres funciones analíticas/);
  assert.match(contract,/fórmulas y vínculos preexistentes/);
  assert.match(orders,/No cambiar configuración de libros/);
  assert.match(prompt,/solo hace tres tareas analíticas/);
  assert.match(prompt,/Ante defectos, dejar bloqueo/);
});
