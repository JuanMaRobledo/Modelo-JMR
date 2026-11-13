import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
import { validoHolding, conValores } from './fixtures/v2-expediente-valido.mjs';
import { evaluarSOTP, entradas } from '../docs/v2/motores/sotp.mjs';

const fcff = cargarMotor(), motor = crearMotor(fcff);
const ids = r => r.controles.map(c => c.id);
const check = mut => { const m = validoHolding(); mut?.(m); return evaluarExpediente(m, motor); };

test('holding coherente (2 industriales + banco con valor externo) puede ser PUBLICADO', () => {
  const r = check();
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso'), []);
  assert.equal(r.permitido, 'PUBLICADO'); assert.equal(r.publicable, true);
});
test('tres escenarios con el mismo motor, ordenados, con MOS sobre el base y participaciones aplicadas', () => {
  const m = validoHolding(), c = motor.calculateAll(m), { conservador: a, base: b, optimista: o } = c.scenarios;
  assert.equal(c.status, 'CANDIDATO'); assert.ok(a.perShare < b.perShare && b.perShare < o.perShare);
  assert.ok(Math.abs(b.mosPrice - b.perShare * 0.65) < 1e-9);
  const ind = b.segmentos.find(s => s.id === 'IND_B'), bnk = b.segmentos.find(s => s.id === 'BNK_C');
  assert.ok(Math.abs(ind.attributable - ind.value * 0.8) < 1e-9); assert.ok(Math.abs(bnk.attributable - 4000 * 0.6) < 1e-9);
  // el banco aporta equity: no se le resta deuda ni se le aplica la fórmula industrial
  assert.equal(b.sumaEquityExterno, 2400); assert.ok(Math.abs(b.equity - (b.sumaEV + 2400 - 4000 - 500 + 1500)) < 1e-9);
});
test('un negocio financiero no puede valorarse con la fórmula industrial', () => {
  const r = check(m => { delete m.segmentos[2].valorExterno; delete m.segmentos[2].escenarios; });
  assert.equal(r.permitido, 'BLOQUEADO'); assert.ok(ids(r).includes('H02'));
});
test('negocios sin perfil, duplicados o menos de dos → BLOQUEADO', () => {
  assert.ok(ids(check(m => { m.segmentos[0].perfil = 'raro'; })).includes('H01'));
  assert.ok(ids(check(m => { m.segmentos[1].id = 'IND_A'; })).includes('H01'));
  assert.equal(check(m => { m.segmentos = m.segmentos.slice(0, 1); }).permitido, 'BLOQUEADO');
});
test('los ingresos por negocio deben conciliar con el consolidado (doble contabilización)', () => {
  assert.ok(ids(check(m => { m.segmentos[0].revenue = 8000; m.provenance[5].valorReportado = 8000; })).includes('H04'));
  assert.ok(ids(check(m => { delete m.financials.eliminaciones; })).includes('H04'));
});
test('participaciones parciales con minoritarios exigen justificación; sin ella es error', () => {
  const r = check(m => { delete m.justificaciones.minoritarios; });
  assert.ok(ids(r).includes('H08')); assert.equal(r.permitido, 'EN_PROCESO');
});
test('el descuento de holding solo con justificación explícita y razonable', () => {
  const sin = check(m => { for (const n of Object.keys(m.assumptions)) m.assumptions[n].holdingDiscount = { porcentaje: 0.15 }; });
  assert.equal(sin.permitido, 'BLOQUEADO'); // el motor se niega a aplicarlo sin justificación
  const j = 'Caja atrapada en jurisdicciones con retención sobre dividendos y costos de control de la matriz.';
  const con = check(m => { for (const n of Object.keys(m.assumptions)) m.assumptions[n].holdingDiscount = { porcentaje: 0.15, justificacion: j }; conValores(m); });
  assert.equal(con.permitido, 'PUBLICADO');
  const base = motor.calculateAll(validoHolding()).scenarios.base.perShare, desc = motor.calculateAll(con ? (() => { const m = validoHolding(); for (const n of Object.keys(m.assumptions)) m.assumptions[n].holdingDiscount = { porcentaje: 0.15, justificacion: j }; return m; })() : null).scenarios.base.perShare;
  assert.ok(Math.abs(desc - base * 0.85) < 1e-9);
  assert.ok(ids(check(m => { for (const n of Object.keys(m.assumptions)) m.assumptions[n].holdingDiscount = { porcentaje: 0.4, justificacion: j }; })).includes('H07'));
});
test('valor externo exige fuente y referencia al expediente del negocio financiero', () => {
  assert.ok(ids(check(m => { delete m.segmentos[2].valorExterno.refExpediente; })).includes('H11'));
  assert.ok(ids(check(m => { delete m.segmentos[2].valorExterno.motorOrigen; })).includes('H06'));
  assert.ok(ids(check(m => { m.segmentos[2].valorExterno.fuente = ''; })).includes('H06'));
  assert.equal(check(m => { for (const n of ['conservador', 'base', 'optimista']) m.segmentos[2].escenarios[n].valorExterno.fuente = ''; }).permitido, 'BLOQUEADO');
});
test('costo de capital divergente entre escenarios sin justificación y datos base inconsistentes', () => {
  assert.ok(ids(check(m => { m.segmentos[0].escenarios.optimista.costOfCapital = 0.07; })).includes('V08'));
  assert.ok(ids(check(m => { m.financials.cash += 100; })).includes('D10'));
  assert.ok(ids(check(m => { m.provenance = m.provenance.filter(p => p.destino !== 'segmentos.IND_A.revenue'); })).includes('D11'));
});
test('negocio con NOPAT negativo o crecimiento ≥ costo de capital impide valorar (sin falsa precisión)', () => {
  assert.equal(check(m => { m.segmentos[0].escenarios.base.margin = 0.01; }).permitido, 'BLOQUEADO');
  assert.equal(check(m => { m.segmentos[0].escenarios.base.growth5 = 0.09; }).permitido, 'BLOQUEADO');
});
test('sensibilidad: centro igual al valor base y monótona en costo de capital y crecimiento', () => {
  const m = validoHolding(), s = motor.sensibilidad(m), base = motor.calculateAll(m).scenarios.base.perShare;
  assert.ok(Math.abs(s.centerValue - base) < 1e-9);
  assert.ok(s.rows.every((r, i) => i === 0 || r.cells[2] < s.rows[i - 1].cells[2]), 'más costo de capital → menos valor');
  assert.ok(s.rows[2].cells.every((v, j) => j === 0 || v > s.rows[2].cells[j - 1]), 'más crecimiento → más valor');
});
test('con solo el motor FCFF un holding sigue bloqueado', () => assert.ok(ids(evaluarExpediente(validoHolding(), fcff)).includes('V01')));
