import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
import { validoFinanciero } from './fixtures/v2-expediente-valido.mjs';

const fcff = cargarMotor(), motor = crearMotor(fcff);
const ids = r => r.controles.map(c => c.id);
const check = (perfil, mut, metodo = 'ddm') => { const m = validoFinanciero(perfil, 'BNK', metodo); mut?.(m); return evaluarExpediente(m, motor); };

test('banco (DDM) y aseguradora (exceso de retorno) coherentes pueden ser PUBLICADO', () => {
  for (const [perfil, metodo] of [['banco', 'ddm'], ['aseguradora', 'exceso'], ['banco', 'exceso'], ['aseguradora', 'ddm']]) {
    const r = check(perfil, m => { if (metodo === 'exceso') m.justificaciones.metodo = 'Reparto irregular por requerimientos de capital: se usa retorno excedente sobre patrimonio.'; }, metodo);
    assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso'), [], `${perfil}/${metodo}`);
    assert.equal(r.permitido, 'PUBLICADO'); assert.equal(r.publicable, true);
  }
});
test('el motor despacha por perfil: FCFF nunca se aplica a bancos y los tres escenarios usan el mismo motor', () => {
  const m = validoFinanciero('banco');
  const c = motor.calculateAll(m);
  assert.equal(c.status, 'CANDIDATO'); assert.equal(c.metodo, 'ddm');
  const { conservador: a, base: b, optimista: o } = c.scenarios;
  assert.ok(a.perShare < b.perShare && b.perShare < o.perShare);
  assert.ok(Math.abs(b.mosPrice - b.perShare * 0.65) < 1e-9);
  assert.equal(motor.calculateAll({ ...m, profile: 'holding' }).status, 'INCOMPLETO');
  assert.ok(ids(evaluarExpediente(m, fcff)).includes('V01'), 'con solo el motor FCFF un banco sigue bloqueado');
});
test('sin datos regulatorios indispensables no hay valoración (BLOQUEADO)', () => {
  for (const perfil of ['banco', 'aseguradora']) {
    const r = check(perfil, m => { delete m.regulatorio; });
    assert.equal(r.permitido, 'BLOQUEADO'); assert.ok(ids(r).includes('F03'));
  }
  assert.ok(ids(check('banco', m => { delete m.regulatorio.fuente; })).includes('F03'));
});
test('capital por debajo del mínimo regulatorio → EN_PROCESO', () => {
  const r = check('banco', m => { m.regulatorio.cet1 = 0.09; });
  assert.ok(ids(r).includes('F04')); assert.equal(r.permitido, 'EN_PROCESO');
  assert.ok(ids(check('aseguradora', m => { m.regulatorio.solvencyRatio = 0.9; })).includes('F04'));
});
test('método no declarado bloquea; sin justificación es error', () => {
  assert.equal(check('banco', m => { delete m.metodo; }).permitido, 'BLOQUEADO');
  assert.ok(ids(check('banco', m => { delete m.justificaciones.metodo; })).includes('F02'));
});
test('ROE proyectado sin respaldo histórico y costo del patrimonio divergente se marcan', () => {
  assert.ok(ids(check('banco', m => { m.assumptions.optimista.roeHighGrowth = 0.25; })).includes('F05'));
  assert.ok(ids(check('banco', m => { m.assumptions.optimista.beta = 0.8; })).includes('V07'));
  assert.ok(!ids(check('banco', m => { m.assumptions.optimista.beta = 0.8; m.justificaciones.ke = 'Menor beta por mix de negocios'; })).includes('V07'));
});
test('datos base inconsistentes con el histórico y trazabilidad faltante', () => {
  assert.ok(ids(check('banco', m => { m.financials.netIncome *= 1.2; })).includes('D10'));
  assert.ok(ids(check('banco', m => { m.provenance = m.provenance.filter(p => p.destino !== 'financials.dividends'); })).includes('D11'));
  assert.equal(check('banco', m => { delete m.financials.dividends; }).permitido, 'BLOQUEADO');
});
test('utilidad negativa impide el DDM (sin falsa precisión)', () => {
  const r = check('banco', m => { m.financials.netIncome = -50; m.history.at(-1).netIncome = -50; });
  assert.equal(r.permitido, 'BLOQUEADO'); assert.ok(ids(r).includes('V02'));
});
test('sensibilidad financiera: centro igual al valor base y monótona en crecimiento', () => {
  const m = validoFinanciero('banco'), s = motor.sensibilidad(m), base = motor.calculateAll(m).scenarios.base.perShare;
  assert.ok(Math.abs(s.centerValue - base) < 1e-9, `${s.centerValue} vs ${base}`);
  const centro = s.rows[2].cells; assert.ok(centro.every((v, j) => j === 0 || v > centro[j - 1]));
  assert.ok(s.rows.every((r, i) => i === 0 || r.cells[2] < s.rows[i - 1].cells[2]), 'más prima de riesgo → menos valor');
});
