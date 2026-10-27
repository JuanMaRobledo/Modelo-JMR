const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = { window: {}, Intl };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/valuation-board.js'), 'utf8'), ctx);
const board = ctx.window.JmrValueBoard;
const names = ['EV/EBITDA', 'EV/FCFF', 'P/E', 'P/FCFE', 'P/OCF', 'P/V', 'P/BV'];
function record() {
  return {
    ticker: 'META', revisionId: 'r4', hojaGoogle: 'https://docs.google.com/spreadsheets/d/source/edit',
    descuentoMultiples: { dcfHoy: { base: 100, conservador: 80, optimista: 120 },
      metodos: names.map(nombre => ({ nombre, peso: 0 })) },
    multiplesRelativosInformativos: { revisionId: 'r4', sourceSheetId: 'source',
      methods: names.map((nombre, i) => ({ nombre, base: 10+i, conservador: 5+i, optimista: 15+i, pesoRelativo: i === 0 ? 1 : 0 })) }
  };
}
test('shows all seven saved results even when their official weight is zero', () => {
  const r = record(), d = board.fromRecord(r), html = board.html(d);
  assert.equal(d.multiplesCoverage.calculated, 7);
  assert.equal(d.metodos.length, 7);
  assert.equal(d.metodos[0].hoy.base, 10);
  assert.equal(d.metodos[0].peso, 0);
  assert.equal(d.metodos[0].pesoRelativo, 1);
  assert.equal(d.dcf.hoy.base, 100);
  assert.match(html, /Múltiplos calculados: 7\/7/);
  assert.equal((html.match(/class="jvb-row met"/g) || []).length, 7);
});
test('refuses secondary results from another revision or source sheet', () => {
  for (const field of ['revisionId', 'sourceSheetId']) {
    const r = record(); r.multiplesRelativosInformativos[field] = 'other';
    const d = board.fromRecord(r), html = board.html(d);
    assert.equal(d.multiplesCoverage.calculated, 0);
    assert.equal(d.metodos[0].hoy, null);
    assert.match(html, /N\/D · pendiente de cálculo/);
    assert.doesNotMatch(html, /left:NaN|width:calc\(NaN/);
  }
});
test('missing and partial methods remain visible and do not count as complete', () => {
  const r = record(); r.ticker = 'NKE';
  delete r.multiplesRelativosInformativos;
  r.descuentoMultiples.metodos = [{ nombre: 'P/E', peso: 0, base: { consolidado: 50 } }];
  const d = board.fromRecord(r), html = board.html(d);
  assert.equal(d.metodos.length, 7);
  assert.equal(d.metodos[0].hoy.base, 50);
  assert.equal(d.multiplesCoverage.calculated, 0);
  assert.match(html, /Múltiplos calculados: 0\/7/);
  assert.equal((html.match(/class="jvb-row met"/g) || []).length, 7);
});
test('negative cash-flow prices are preserved and P/S aliases do not duplicate P/V', () => {
  const r = record(); r.multiplesRelativosInformativos.methods[5].nombre = 'P/S (P/V)';
  r.multiplesRelativosInformativos.methods[3].base = -10;
  const d = board.fromRecord(r);
  assert.equal(d.metodos.length, 7);
  assert.equal(d.metodos[3].hoy.base, -10);
  assert.equal(d.multiplesCoverage.calculated, 7);
});

test('ONON y otras operativas recuperadas muestran 7/7 y no solo META/NKE/NFLX', () => {
  const r = record();
  r.ticker = 'ONON';
  r.tipo = 'Crecimiento';
  r.metodos = names.map(nombre => ({ nombre, peso: 0 }));
  const d = board.fromRecord(r);
  assert.equal(d.multiplesCoverage.calculated, 7);
  assert.deepEqual(Array.from(d.multiplesCoverage.pending), []);
  assert.match(board.html(d), /Múltiplos calculados: 7\/7/);
});

test('un emisor informa métodos no calculados aunque tengan fórmula y peso cero', () => {
  const r = record();
  r.ticker = 'TEST';
  r.tipo = 'Crecimiento';
  r.metodos = names.map(nombre => ({ nombre, peso: 0 }));
  r.multiplesRelativosInformativos.methods =
    r.multiplesRelativosInformativos.methods.filter(x => !['EV/FCFF', 'P/FCFE'].includes(x.nombre));
  const d = board.fromRecord(r);
  assert.equal(d.multiplesCoverage.calculated, 5);
  assert.deepEqual(Array.from(d.multiplesCoverage.pending), ['EV/FCFF', 'P/FCFE']);
  assert.match(board.html(d), /Múltiplos calculados: 5\/7/);
});

test('no exige los siete industriales a un modelo FCFE financiero ni a un holding SOTP', () => {
  const financial = record();
  financial.ticker = 'XP';
  financial.tipo = 'Financiera: plataforma de inversión; FCFE/Ke';
  financial.metodos = names.map(nombre => ({ nombre, peso: 0 }));
  assert.equal(board.fromRecord(financial).multiplesCoverage, undefined);
  const holding = record();
  holding.ticker = 'GRUPOARGOS';
  holding.tipo = 'Holding';
  holding.valoracionHolding = { estado: 'PRELIMINAR', nav: { base: 18000 } };
  holding.metodos = names.map(nombre => ({ nombre, peso: 0 }));
  assert.equal(board.fromRecord(holding).multiplesCoverage, undefined);
});
