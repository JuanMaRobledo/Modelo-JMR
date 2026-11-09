import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceBook } from '../lib/model-sheet.js';

const id = 'A'.repeat(30);
const u = (x) => `https://docs.google.com/spreadsheets/d/${x}${id}/edit`;
const rec = { perfil_valoracion: 'Reboot', libros: { historicos: u('h'), dcf: { base: u('b'), conservadora: u('c'), optimista: u('o') }, multiplos: u('m') } };

test('Reboot: valoración apunta al DCF Base, históricos y múltiplos a sus libros', () => {
  assert.ok(String(sourceBook(rec, 'valoracion').id || sourceBook(rec, 'valoracion')).includes('b'));
  assert.ok(String(sourceBook(rec, 'historicos').id || sourceBook(rec, 'historicos')).includes('h'));
  assert.ok(String(sourceBook(rec, 'multiplos').id || sourceBook(rec, 'multiplos')).includes('m'));
});

test('libro desconocido se rechaza', () => {
  assert.throws(() => sourceBook(rec, 'otro'), { status: 400 });
});
