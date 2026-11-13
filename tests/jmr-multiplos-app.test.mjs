import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { construirCatalogo } from '../scripts/multiplos-catalogo.mjs';
import { vistaEmpresa } from '../docs/multiplos/vista.mjs';

const fx = () => JSON.parse(fs.readFileSync(new URL('./fixtures/multiplos-sintetico.json', import.meta.url), 'utf8'));
const dirCon = (...exps) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'jmrm-cat-')); fs.mkdirSync(path.join(d, 'empresas'));
  for (const [nombre, e] of exps) fs.writeFileSync(path.join(d, 'empresas', nombre), JSON.stringify(e));
  return d;
};

test('el catálogo oficial está al día y no contiene ficticios', () => {
  const { catalogo, errores } = construirCatalogo(new URL('../docs/multiplos', import.meta.url).pathname);
  assert.deepEqual(errores, []);
  assert.equal(catalogo.schemaVersion, 'jmr-multiplos-catalogo-1');
  const guardado = JSON.parse(fs.readFileSync(new URL('../docs/multiplos/catalogo.json', import.meta.url), 'utf8'));
  assert.deepEqual(guardado, catalogo);
});

test('un expediente ficticio, con ticker distinto o duplicado no entra al catálogo', () => {
  assert.match(construirCatalogo(dirCon(['DEMO.json', fx()])).errores.join(), /ficticio/);
  const real = { ...fx(), fictional: undefined };
  assert.match(construirCatalogo(dirCon(['OTRO.json', real])).errores.join(), /no coincide/);
  assert.match(construirCatalogo(dirCon(['demo.json', real])).errores.join(), /inválido/);
});

test('un expediente real entra con valor, estado permitido y visibilidad independiente de la aprobación', () => {
  const real = { ...fx(), fictional: undefined };
  const { catalogo, errores } = construirCatalogo(dirCon(['DEMO.json', real]));
  assert.deepEqual(errores, []);
  const e = catalogo.empresas[0];
  assert.equal(e.estado, 'EN_REVISION'); assert.equal(e.visibilidadApp, 'PUBLICADA_PARA_REVISION');
  assert.ok(e.valorBase > 0 && e.precioMOS > 0 && Math.abs(e.precioMOS / e.valorBase - 0.65) < 1e-9);
  assert.equal(e.aprobacionUsuario, null);
  const sinSol = { ...real }; delete sinSol.solicitudExpresa;
  const b = construirCatalogo(dirCon(['DEMO.json', sinSol])).catalogo.empresas[0];
  assert.equal(b.estado, 'BLOQUEADO'); assert.equal(b.valorBase, null); assert.equal(b.visibilidadApp, 'BLOQUEADA');
});

test('la vista muestra valores, escenarios, referencias, sensibilidad y avisos; no inventa nada si está bloqueada', () => {
  const html = vistaEmpresa(fx());
  for (const t of ['Valor ponderado', 'Precio con MOS 35 %', 'Sensibilidad 5×5', 'Referencia de múltiplos', 'sin DCF', 'Conservador', 'Optimista']) assert.ok(html.includes(t), t);
  const b = fx(); delete b.solicitudExpresa;
  const hb = vistaEmpresa(b);
  assert.ok(hb.includes('bloqueado') && !hb.includes('Valor ponderado'));
});

test('la vista escapa el texto externo (sin inyección HTML)', () => {
  const e = fx(); e.company = '<img src=x onerror=alert(1)>'; e.analysis = { resumen: '<script>alert(1)</script>' }; e.comparables[0].ticker = '"><i id=pwn>';
  const html = vistaEmpresa(e);
  assert.ok(!html.includes('<img src=x') && !html.includes('<script>alert') && !html.includes('<i id=pwn>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('la página existe, enlaza V2 y Floyd, carga el módulo propio y declara la regla de solicitud expresa', () => {
  const html = fs.readFileSync(new URL('../docs/jmr-multiplos.html', import.meta.url), 'utf8');
  assert.match(html, /<title>JMR múltiplos/);
  assert.match(html, /href="jmr-v2\.html"/); assert.match(html, /type="module" src="multiplos\/app\.mjs"/);
  assert.match(html, /solo a solicitud expresa|solicitud expresa/);
  assert.ok(!/JMR_DCF|calculateAll/.test(html));
});
