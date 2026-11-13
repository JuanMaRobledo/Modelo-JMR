import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor, cargarIndicadores } from '../scripts/v2-motor.mjs';
// El libro (scripts/v2-libro-operativo.py) se recalcula con LibreOffice; aquí se contrasta lo que calculó contra el motor y los indicadores del navegador.
const load = f => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8'));
const casos = load('jmr-v2-libro-casos.json'), semilla = load('jmr-v2-libro-semilla.json');
const motor = cargarMotor(), IND = cargarIndicadores();
const close = (a, b, w) => assert.ok(Math.abs(a - b) <= Math.max(1e-7, Math.abs(b) * 2e-6), `${w}: JS ${a} vs libro ${b}`);

for (const [nombre, c] of Object.entries(casos)) test(`libro · escenario ${nombre}: el selector alimenta el mismo motor y coincide con el motor JS`, () => {
  const i = c.input, o = c.out;
  assert.equal(c.escenario, nombre);
  const a = { growth1: i.B26, growth2to5: i.B28, margin1: i.B27, marginTarget: i.B29, marginConvergenceYear: i.B30, salesToCapital1to5: i.B31, salesToCapital6to10: i.B32,
    waccInitial: i.B35, waccTerminal: o.M12, roicTerminal: o.M40, gTerminal: o.M2, marginalTax: i.B24, mos: .35, failureProbability: 0, recoveryRate: .5 };
  const f = { revenue: i.B11, cash: i.B18, debt: i.B15, minority: i.B20, nonoperatingAssets: i.B19, optionsValue: 0, shares: i.B21, effectiveTaxRate: i.B23, nol: 0 };
  const v = motor.calculateAll({ financials: f, assumptions: { conservador: a, base: a, optimista: a }, profile: 'operativa' }).scenarios.base;
  close(v.sumPV, o.B20, 'suma PV'); close(v.terminalValue, o.B18, 'valor terminal'); close(v.equity, o.B29, 'patrimonio'); close(v.perShare, o.B33, 'valor por acción');
  close(c.resumen.C23, o.B33, 'valor en «JMR Escenarios»');
});
test('libro · los tres escenarios están ordenados y el precio con MOS es solo del Base', () => {
  const v = n => casos[n].out.B33;
  assert.ok(v('Conservador') < v('Base') && v('Base') < v('Optimista'));
  close(casos.Base.resumen.C24, v('Base') * 0.65, 'precio con MOS (Base)');
  assert.equal(casos.Conservador.resumen.C24, 'solo con escenario Base');
  assert.deepEqual(['Conservador', 'Base', 'Optimista'].map(n => casos[n].indice), [1, 2, 3]);
});
test('libro · los supuestos comunes (WACC, impuestos, tasa libre) no cambian entre escenarios', () => {
  for (const k of ['B24', 'B34', 'B35', 'B21', 'B11', 'B12']) assert.equal(new Set(Object.values(casos).map(c => c.input[k])).size, 1, k);
});
test('libro · los controles de cuadre aprueban los históricos coherentes', () => {
  const b = casos.Base.controles;
  for (const r of ['51', '52', '53', '54']) assert.ok(b[r].every(x => x === 'OK'), `fila ${r}`);
  assert.equal(b['55'][0], 'OK'); assert.equal(b['56'][0], 'OK');
});
test('libro · los indicadores calculados con fórmulas coinciden con los del navegador (10 ejercicios)', () => {
  const ind = IND.indicatorsForHistory(semilla.history), w = casos.Base.indicadores;
  const pares = [['6', 'effectiveTax'], ['9', 'fcff'], ['10', 'fcf'], ['11', 'investedCapital'], ['14', 'growth'], ['15', 'grossMargin'], ['17', 'ebitMargin'], ['18', 'netMargin'],
    ['22', 'roic'], ['23', 'roe'], ['24', 'roa'], ['25', 'assetTurnover'], ['27', 'reinvestmentRate'], ['32', 'currentRatio'], ['33', 'quickRatio'],
    ['35', 'netDebtToEBITDA'], ['36', 'debtToEquity'], ['37', 'interestCoverage']];
  for (const [fila, k] of pares) w[fila].forEach((x, j) => { if (ind[j][k] === null) return assert.ok(x === null || x === 'N/D', `${k} año ${j}`); close(ind[j][k], x, `${k} año ${j}`); });
  w['16'].forEach((x, j) => close(ind[j].ebitda / semilla.history[j].revenue, x, `margen EBITDA año ${j}`));
  w['19'].forEach((x, j) => close(ind[j].fcff / semilla.history[j].revenue, x, `margen FCFF año ${j}`));
  const L = ind.length - 1;
  for (const [fila, k] of [['43', 'evToEBITDA'], ['45', 'evToFCFF'], ['46', 'pe'], ['47', 'pToFcf'], ['48', 'pb']]) close(ind[L][k], w[fila][9], `múltiplo ${k}`);
});
test('libro · cada entrada de «Input sheet» enlazada a «JMR Estados» trae el dato histórico correcto', () => {
  const h = semilla.history, u = h.at(-1), p = h.at(-2), i = casos.Base.input;
  const esperado = { B11: u.revenue, C11: p.revenue, B12: u.ebit, B13: u.interestExpense, B14: u.equity - u.minority, B15: u.debt, B18: u.cash, B19: u.nonoperatingAssets,
    B20: u.minority, B21: u.shares, B22: semilla.financials.sharePrice, B23: u.taxExpense / u.pretaxIncome };
  for (const [celda, v] of Object.entries(esperado)) close(i[celda], v, `Input ${celda}`);
});
