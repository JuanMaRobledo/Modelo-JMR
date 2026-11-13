import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
import { validoAlto } from './fixtures/v2-expediente-valido.mjs';

const fcff = cargarMotor(), motor = crearMotor(fcff);
const ids = r => r.controles.map(c => c.id);
const check = mut => { const m = validoAlto(); mut?.(m); return evaluarExpediente(m, motor); };

test('empresa de alto crecimiento con pérdidas, coherente y auditada, puede ser PUBLICADO', () => {
  const r = check();
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso'), []);
  assert.equal(r.permitido, 'PUBLICADO'); assert.equal(r.publicable, true);
});
test('tres escenarios con el mismo motor, ordenados, MOS sobre el base, EBIT negativo con NOL consumido', () => {
  const c = motor.calculateAll(validoAlto()), { conservador: a, base: b, optimista: o } = c.scenarios;
  assert.equal(c.status, 'CANDIDATO'); assert.ok(a.perShare < b.perShare && b.perShare < o.perShare);
  assert.ok(Math.abs(b.mosPrice - b.perShare * 0.65) < 1e-9);
  assert.ok(b.years[0].ebit < 0 && b.years[0].taxes === 0 && b.years[0].nol > 400, 'las pérdidas aumentan el NOL y no pagan impuestos');
  assert.ok(b.years[9].margin > b.years[0].margin, 'el margen converge hacia el estable');
});
test('exige condición declarada y justificación de por qué Simple Ginsu no basta', () => {
  assert.ok(ids(check(m => { delete m.condicionesAltoCrecimiento; })).includes('A01'));
  assert.ok(ids(check(m => { m.condicionesAltoCrecimiento = ['porque-si']; })).includes('A01'));
  const r = check(m => { delete m.justificaciones.altoCrecimiento; });
  assert.ok(ids(r).includes('A02')); assert.equal(r.permitido, 'EN_PROCESO');
});
test('el margen estable necesita respaldo histórico', () => {
  assert.ok(ids(check(m => { m.assumptions.optimista.stableMargin = 0.40; })).includes('A04'));
  const sinHistoriaPositiva = check(m => { m.history.forEach(x => { x.ebit = -Math.abs(x.ebit) - 1; }); });
  assert.ok(ids(sinHistoriaPositiva).includes('A04'));
  assert.ok(!ids(check(m => { m.history.forEach(x => { x.ebit = -Math.abs(x.ebit) - 1; }); m.justificaciones.margenEstable = 'Margen de comparables maduros del sector, con estructura de costos equivalente a escala.'; })).includes('A04'));
});
test('costo de capital divergente entre escenarios sin justificación, crecimiento no ordenado', () => {
  assert.ok(ids(check(m => { m.assumptions.optimista.beta = 1.1; })).includes('V07'));
  assert.ok(!ids(check(m => { m.assumptions.optimista.beta = 1.1; m.justificaciones.tasas = 'Mayor escala reduce el riesgo del negocio en el escenario optimista.'; })).includes('V07'));
  assert.ok(ids(check(m => { m.assumptions.conservador.growth = m.assumptions.optimista.growth.map(g => g + 0.1); })).includes('V08'));
});
test('datos base inconsistentes con el histórico, trazabilidad y faltantes', () => {
  assert.ok(ids(check(m => { m.financials.ebit0 = -20; })).includes('D10'));
  assert.ok(ids(check(m => { m.provenance = m.provenance.filter(p => p.destino !== 'financials.nol'); })).includes('D11'));
  assert.equal(check(m => { delete m.financials.nol; }).permitido, 'BLOQUEADO');
});
test('supuestos que el motor no replica o inconsistentes bloquean, sin falsa precisión', () => {
  assert.equal(check(m => { m.assumptions.base.stableGrowth = 0.2; }).permitido, 'BLOQUEADO');
  assert.equal(check(m => { m.assumptions.base.growth = [0.3, 0.2]; }).permitido, 'BLOQUEADO');
  assert.equal(check(m => { m.assumptions.base.arrendamientos = true; }).permitido, 'BLOQUEADO');
});
test('los ingresos del año 10 deben ser compatibles con tamaño de mercado × participación', () => {
  const con = (size) => check(m => { m.mercado = { marketSize: size, marketGrowth: 0.04, share5: 0.01, share10: 0.05 }; });
  assert.ok(ids(con(20000)).includes('A05'));
  assert.ok(!ids(con(2000000)).includes('A05'));
});
test('sensibilidad margen × sales-to-capital: centro igual al base y monótona', () => {
  const m = validoAlto(), s = motor.sensibilidad(m), base = motor.calculateAll(m).scenarios.base.perShare;
  assert.ok(Math.abs(s.centerValue - base) < 1e-9);
  assert.ok(s.rows.every((r, i) => i === 0 || r.cells[2] > s.rows[i - 1].cells[2]), 'más margen estable → más valor');
  assert.ok(s.rows[2].cells.every((v, j) => j === 0 || v > s.rows[2].cells[j - 1]), 'más sales-to-capital (menos reinversión) → más valor');
});
test('con solo el motor FCFF un perfil de alto crecimiento sigue bloqueado', () => assert.ok(ids(evaluarExpediente(validoAlto(), fcff)).includes('V01')));
