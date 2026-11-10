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
