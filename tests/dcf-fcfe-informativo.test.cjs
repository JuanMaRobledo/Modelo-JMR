const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = { window: {}, Intl };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/valuation-board.js'), 'utf8'), ctx);
const board = ctx.window.JmrValueBoard;
const bloque = () => ({
  estado: 'INFORMATIVO', alimentaValorPrincipal: false, sinMOS: true,
  supuestos: { ke: 0.1059, kd: 0.0569, pesoDeuda: 0.0159, pesoPatrimonio: 0.9841, pesoFcfeEnPonderado: 0.5 },
  historias: {
    conservador: { probabilidad: 0.25, dcfFCFF: 92.89, dcfFCFE: 93.17, diferencia: 0.003, ponderadoFcffFcfe: 93.03 },
    base: { probabilidad: 0.4, dcfFCFF: 139.11, dcfFCFE: 138.63, diferencia: -0.0035, ponderadoFcffFcfe: 138.87 },
    optimista: { probabilidad: 0.25, dcfFCFF: 195.82, dcfFCFE: 194.34, diferencia: -0.0075, ponderadoFcffFcfe: 195.08 } },
  promedio: { dcfFCFF: 142.02, dcfFCFE: 141.48, diferencia: -0.0039, ponderadoFcffFcfe: 141.75 } });

test('el DCF por FCFE se muestra como informativo, sin MOS y sin tocar el valor principal', () => {
  const html = board.fcfeHtml({ currency: 'USD', dcfFCFE: bloque() });
  assert.match(html, /Informativo · no es el valor principal/);
  assert.match(html, /DCF por FCFE/);
  assert.match(html, /no lleva margen de seguridad/);
  assert.match(html, /no entra en el valor principal/);
  for (const n of ['Conservadora', 'Base', 'Optimista', 'Promedio ponderado']) assert.ok(html.includes(n), n);
  assert.match(html, /138,63/);
});
test('sin dcfFCFE o con estado distinto de INFORMATIVO no pinta nada', () => {
  assert.equal(board.fcfeHtml({}), '');
  assert.equal(board.fcfeHtml({ dcfFCFE: Object.assign(bloque(), { estado: 'PRINCIPAL' }) }), '');
  assert.equal(board.fcfeHtml(null), '');
});
test('el visor y el análisis incluyen el bloque tras el tablero', () => {
  assert.match(fs.readFileSync(path.join(__dirname, '../docs/visor.html'), 'utf8'), /JmrValueBoard\.fcfeHtml\(r\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '../docs/research.js'), 'utf8'), /JmrValueBoard\.fcfeHtml\(lv\)/);
});
