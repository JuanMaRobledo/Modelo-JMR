import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
// Libro de holding (scripts/v2-libro-holding.py): suma de partes con FÓRMULAS PROPIAS de Excel (no existe libro original que inyectar);
// el expediente se EXPORTA del libro recalculado con LibreOffice y se contrasta con el motor JS (implementación independiente).
const load = () => structuredClone(JSON.parse(fs.readFileSync(new URL('./fixtures/jmr-v2-expediente-holding-exportado.json', import.meta.url), 'utf8')));
const motor = crearMotor(cargarMotor());
const AUD = { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' };
test('libro holding: las fórmulas de Excel y el motor JS (independientes) dan el mismo valor en los tres escenarios', () => {
  const m = load(), c = motor.calculateAll(m);
  assert.equal(m.profile, 'holding'); assert.equal(m.libro.motor, 'sotp-jmr'); assert.match(m.libro.sha256, /^[0-9a-f]{64}$/);
  for (const n of ['conservador', 'base', 'optimista']) assert.ok(Math.abs(c.scenarios[n].perShare - m.libro.valores[n]) <= 1e-6 * Math.abs(m.libro.valores[n]), `${n}: ${c.scenarios[n].perShare} vs ${m.libro.valores[n]}`);
  assert.ok(m.libro.valores.conservador < m.libro.valores.base && m.libro.valores.base < m.libro.valores.optimista);
});
test('libro holding: participaciones económicas, negocio financiero con valor externo y reconciliación de ingresos', () => {
  const m = load(), b = motor.calculateAll(m).scenarios.base;
  const ind = b.segmentos.find(s => s.id === 'IND_B'), bnk = b.segmentos.find(s => s.id === 'BNK_C');
  assert.ok(Math.abs(ind.attributable - ind.value * 0.8) < 1e-6); assert.equal(bnk.metodo, 'externo'); assert.equal(m.segmentos.find(s => s.id === 'BNK_C').valorExterno.refExpediente, 'BNK');
  assert.deepEqual([m.controlesLibro.negocios, m.controlesLibro.ingresos, m.controlesLibro.estados, m.controlesLibro.fuentes], ['OK', 'OK', 'OK', 'OK']);
});
test('libro holding: solo falta la auditoría independiente; con ella llega a PUBLICADO', () => {
  const m = load(), r = evaluarExpediente(m, motor);
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso').map(c => c.id), ['P02'], JSON.stringify(r.controles));
  assert.equal(r.permitido, 'EN_REVISION'); m.auditoria = AUD; m.estado = 'PUBLICADO';
  const fin = evaluarExpediente(m, motor); assert.equal(fin.permitido, 'PUBLICADO'); assert.equal(fin.publicable, true);
});
test('libro holding: alterar un negocio sin recalcular el libro se detecta (P07)', () => {
  const m = load(); m.segmentos[0].escenarios.base.margin += 0.03;
  assert.ok(evaluarExpediente(m, motor).controles.some(c => c.id === 'P07'));
});
