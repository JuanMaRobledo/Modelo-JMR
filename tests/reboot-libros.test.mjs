import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceBook, isFloydR1R6, FLOYD_R1R6_CONTRACT } from '../lib/model-sheet.js';

const id = 'A'.repeat(30);
const u = x => `https://docs.google.com/spreadsheets/d/${x}${id}/edit`;
const libros = { historicos:u('h'), dcf:{base:u('b'),conservadora:u('c'),optimista:u('o')}, multiplos:u('m') };
const nuevo = {perfil_valoracion:'Floyd',contratoLibros:FLOYD_R1R6_CONTRACT,libros};
const alias = {...nuevo,perfil_valoracion:'Reboot'};
const legado = {perfil_valoracion:'Floyd',contratoLibros:'floyd-h1-h2-separados-v1',libros:{historicos:u('h'),valoracion:u('v')}};

test('Floyd R1–R6 usa seis artefactos por contrato y ruta correcta de libros',()=>{
  assert.equal(isFloydR1R6(nuevo),true);
  assert.ok(sourceBook(nuevo,'valoracion').id.startsWith('b'));
  assert.ok(sourceBook(nuevo,'historicos').id.startsWith('h'));
  assert.ok(sourceBook(nuevo,'multiplos').id.startsWith('m'));
});
test('Reboot permanece como alias de lectura de candidato existente',()=>{
  assert.equal(isFloydR1R6(alias),true);
  assert.ok(sourceBook(alias,'multiplos').id.startsWith('m'));
});
test('Floyd F1–F5 archivado mantiene sus libros antiguos sin confusión',()=>{
  assert.equal(isFloydR1R6(legado),false);
  assert.ok(sourceBook(legado,'valoracion').id.startsWith('v'));
  assert.throws(()=>sourceBook(legado,'multiplos'),{status:409});
});
test('libro desconocido se rechaza',()=>{
  assert.throws(()=>sourceBook(nuevo,'otro'),{status:400});
});

test('Visor web Floyd R1-R6 permite leer Múltiplos sin habilitar escritura',async()=>{
 const {readFileSync}=await import('node:fs');
 const src=readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8');
 assert.match(src,/if\(book!=='valoracion'&&book!=='historicos'&&book!=='multiplos'\)return Promise.reject/);
 assert.match(src,/s\.writable=book==='valoracion'&&s\.writable!==false/);
});

// ---- Libro único (floyd-libro-unico-v1) ----
import { FLOYD_UNICO_CONTRACT, isFloydUnico } from '../lib/model-sheet.js';
const unico = {perfil_valoracion:'Floyd',contratoLibros:FLOYD_UNICO_CONTRACT,libros:{unico:u('u'),analisis:'https://docs.google.com/document/d/'+'D'.repeat(30)+'/edit'},hojaGoogle:u('u')};
test('Libro único: los tres tipos de libro son el mismo archivo y se reconoce como Floyd R1–R6',()=>{
  assert.equal(FLOYD_UNICO_CONTRACT,'floyd-libro-unico-v1');
  assert.equal(isFloydUnico(unico),true); assert.equal(isFloydR1R6(unico),true);
  for(const b of ['valoracion','historicos','multiplos']) assert.ok(sourceBook(unico,b).id.startsWith('u'),b);
  assert.equal(sourceBook(unico,'historicos').id,sourceBook(unico,'multiplos').id);
});
test('Libro único: sin libros.unico usa hojaGoogle y, si no hay ninguno, rechaza con 409',()=>{
  assert.ok(sourceBook({...unico,libros:{}},'valoracion').id.startsWith('u'));
  assert.throws(()=>sourceBook({...unico,libros:{},hojaGoogle:undefined},'historicos'),{status:409,message:/libro único/});
  assert.throws(()=>sourceBook(unico,'otro'),{status:400});
});
test('Los contratos de seis libros y el legado no cambian',()=>{
  assert.equal(isFloydUnico(nuevo),false); assert.equal(isFloydUnico(legado),false);
  assert.ok(sourceBook(nuevo,'valoracion').id.startsWith('b')); assert.ok(sourceBook(legado,'valoracion').id.startsWith('v'));
});
test('Cliente web y expediente reconocen el contrato del libro único',async()=>{
 const {readFileSync}=await import('node:fs');
 for(const f of ['docs/model-sync.js','docs/expediente.js','docs/jmr-mos-summary.js'])
   assert.match(readFileSync(new URL('../'+f,import.meta.url),'utf8'),/floyd-libro-unico-v1/,f);
 assert.match(readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8'),/unico\?\(L\.unico\|\|rec\.hojaGoogle\)|\(L\.unico\|\|rec\.hojaGoogle\)/);
});
