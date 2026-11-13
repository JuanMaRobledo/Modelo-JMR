import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
// Libro de alto crecimiento (scripts/v2-libro-alto.py): higrowth con hojas JMR inyectadas; expediente EXPORTADO del libro recalculado con LibreOffice.
const load = () => structuredClone(JSON.parse(fs.readFileSync(new URL('./fixtures/jmr-v2-expediente-alto-exportado.json', import.meta.url), 'utf8')));
const motor = crearMotor(cargarMotor());
const AUD = { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' };
test('libro alto crecimiento (higrowth): el expediente exportado concilia con el motor en los tres escenarios', () => {
  const m = load(), c = motor.calculateAll(m);
  assert.equal(m.profile, 'alto-crecimiento'); assert.equal(m.libro.motor, 'higrowth'); assert.match(m.libro.sha256, /^[0-9a-f]{64}$/);
  for (const n of ['conservador', 'base', 'optimista']) assert.ok(Math.abs(c.scenarios[n].perShare - m.libro.valores[n]) <= 1e-6 * Math.abs(m.libro.valores[n]), `${n}: ${c.scenarios[n].perShare} vs ${m.libro.valores[n]}`);
  assert.ok(m.libro.valores.conservador < m.libro.valores.base && m.libro.valores.base < m.libro.valores.optimista);
});
test('libro alto crecimiento: EBIT negativo con NOL; la deuda de mercado sale del libro (valor reportado + ajuste)', () => {
  const m = load(); assert.ok(m.financials.ebit0 < 0 && m.financials.nol > 0);
  const d = m.provenance.find(p => p.destino === 'financials.marketDebt'), libroDeuda = m.financials.marketDebt;
  assert.ok(Math.abs(d.valorReportado + d.ajuste - libroDeuda) < 1e-6); assert.ok(d.ajuste !== 0, 'el ajuste a valor de mercado queda documentado');
  const b = motor.calculateAll(m).scenarios.base; assert.ok(b.years[0].taxes === 0 && b.years[0].nol >= m.financials.nol);
});
test('libro alto crecimiento: solo falta la auditoría independiente; con ella llega a PUBLICADO', () => {
  const m = load(), r = evaluarExpediente(m, motor);
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso').map(c => c.id), ['P02'], JSON.stringify(r.controles));
  assert.equal(r.permitido, 'EN_REVISION'); assert.equal(m.controlesLibro.estados, 'OK'); assert.equal(m.controlesLibro.fuentes, 'OK');
  m.auditoria = AUD; m.estado = 'PUBLICADO'; const fin = evaluarExpediente(m, motor);
  assert.equal(fin.permitido, 'PUBLICADO'); assert.equal(fin.publicable, true);
});
test('libro alto crecimiento: alterar un supuesto sin recalcular el libro se detecta (P07)', () => {
  const m = load(); m.assumptions.base.stableMargin += 0.03;
  assert.ok(evaluarExpediente(m, motor).controles.some(c => c.id === 'P07'));
});
