import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { construirCatalogo } from '../scripts/v2-catalogo.mjs';
import { demo, valido } from './fixtures/v2-expediente-valido.mjs';

const script = new URL('../scripts/v2-catalogo.mjs', import.meta.url).pathname;
function carpeta(expedientes) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'v2cat-')); fs.mkdirSync(path.join(d, 'empresas'));
  for (const [f, m] of Object.entries(expedientes)) fs.writeFileSync(path.join(d, 'empresas', f), typeof m === 'string' ? m : JSON.stringify(m));
  return d;
}
test('el catálogo real del repositorio está al día y no contiene fichas ficticias', () => {
  const r = spawnSync('node', [script, '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});
test('catálogo deriva valor base, MOS y estado del motor y de los controles', () => {
  const { catalogo, errores } = construirCatalogo(carpeta({ 'TEST.json': valido('TEST') }));
  assert.deepEqual(errores, []);
  const e = catalogo.empresas[0];
  assert.equal(e.estado, 'PUBLICADO'); assert.ok(e.valorBase > 0);
  assert.ok(Math.abs(e.precioMOS - e.valorBase * 0.65) < 1e-9);
  assert.equal(e.archivo, 'empresas/TEST.json');
});
test('una empresa sin auditoría permanece visible para revisión cuando no tiene bloqueos', () => {
  const m = valido('TEST'); delete m.auditoria;
  const item = construirCatalogo(carpeta({ 'TEST.json': m })).catalogo.empresas[0];
  assert.equal(item.estadoPermitido, 'EN_REVISION');
  assert.equal(item.visibilidadApp, 'PUBLICADA_PARA_REVISION');
});
test('un expediente con bloqueos conserva ficha explicativa sin mostrar valor intrínseco', () => {
  const m = valido('TEST'); m.profile = 'banco'; m.estado = 'BLOQUEADO';
  const item = construirCatalogo(carpeta({ 'TEST.json': m })).catalogo.empresas[0];
  assert.equal(item.visibilidadApp, 'BLOQUEADA');
  assert.equal(item.valorBase, null);
  assert.equal(item.precioMOS, null);
});
test('un estado declarado por encima de lo permitido se degrada en el catálogo', () => {
  const m = valido('TEST'); delete m.auditoria;
  const e = construirCatalogo(carpeta({ 'TEST.json': m })).catalogo.empresas[0];
  assert.equal(e.estadoDeclarado, 'PUBLICADO'); assert.equal(e.estadoPermitido, 'EN_REVISION'); assert.equal(e.estado, 'EN_REVISION');
});
test('expedientes bloqueados no exponen valores', () => {
  const m = valido('TEST'); m.profile = 'banco'; m.estado = 'BLOQUEADO';
  const e = construirCatalogo(carpeta({ 'TEST.json': m })).catalogo.empresas[0];
  assert.equal(e.estado, 'BLOQUEADO'); assert.equal(e.valorBase, null); assert.equal(e.precioMOS, null);
});
test('rechaza ficticios, ticker inconsistente, JSON inválido y nombres inseguros', () => {
  const { errores, catalogo } = construirCatalogo(carpeta({
    'DEMO.json': { ...demo, ticker: 'DEMO' }, 'AAA.json': valido('BBB'), 'MAL.json': '{no es json', 'a b.json': valido('A B') }));
  assert.equal(catalogo.empresas.length, 0);
  assert.equal(errores.length, 4);
  assert.match(errores.join('\n'), /ficticio/); assert.match(errores.join('\n'), /no coincide/); assert.match(errores.join('\n'), /JSON inválido/);
});
test('--check falla si el catálogo está desactualizado', () => {
  const d = carpeta({ 'TEST.json': valido('TEST') });
  execFileSync('node', [script, '--dir', d]);
  assert.equal(spawnSync('node', [script, '--dir', d, '--check']).status, 0);
  fs.writeFileSync(path.join(d, 'empresas', 'NEW.json'), JSON.stringify(valido('NEW')));
  assert.equal(spawnSync('node', [script, '--dir', d, '--check']).status, 1);
});
