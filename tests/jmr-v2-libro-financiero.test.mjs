import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
// Libros de bancos/aseguradoras (scripts/v2-libro-financiero.py): divginzu (DDM) y eqexret (exceso de retorno) con hojas JMR inyectadas.
// Los expedientes se EXPORTAN del libro recalculado con LibreOffice; aquí se verifica que concilian con el motor y pasan los controles.
const load = f => structuredClone(JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')));
const motor = crearMotor(cargarMotor());
const AUD = { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' };
const casos = [['banco', 'jmr-v2-expediente-banco-exportado.json', 'ddm', 'divginzu'], ['aseguradora', 'jmr-v2-expediente-aseguradora-exportado.json', 'exceso', 'eqexret']];
for (const [perfil, f, metodo, original] of casos) {
  test(`libro ${perfil} (${original}): el expediente exportado concilia con el motor en los tres escenarios`, () => {
    const m = load(f), c = motor.calculateAll(m);
    assert.equal(m.profile, perfil); assert.equal(m.metodo, metodo); assert.equal(m.libro.motor, original); assert.match(m.libro.sha256, /^[0-9a-f]{64}$/);
    for (const n of ['conservador', 'base', 'optimista']) assert.ok(Math.abs(c.scenarios[n].perShare - m.libro.valores[n]) <= 1e-6 * Math.abs(m.libro.valores[n]), `${n}: ${c.scenarios[n].perShare} vs ${m.libro.valores[n]}`);
    assert.ok(m.libro.valores.conservador < m.libro.valores.base && m.libro.valores.base < m.libro.valores.optimista);
  });
  test(`libro ${perfil}: solo falta la auditoría independiente; con ella llega a PUBLICADO`, () => {
    const m = load(f), r = evaluarExpediente(m, motor);
    assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso').map(c => c.id), ['P02'], JSON.stringify(r.controles));
    assert.equal(r.permitido, 'EN_REVISION'); assert.equal(m.controlesLibro.estados, 'OK'); assert.equal(m.controlesLibro.fuentes, 'OK');
    m.auditoria = AUD; m.estado = 'PUBLICADO';
    const fin = evaluarExpediente(m, motor); assert.equal(fin.permitido, 'PUBLICADO'); assert.equal(fin.publicable, true);
  });
  test(`libro ${perfil}: los datos regulatorios viajan del libro al expediente`, () => {
    const g = load(f).regulatorio; assert.ok(g.fecha && g.fuente);
    if (perfil === 'banco') assert.ok(g.cet1 > g.cet1Minimo); else assert.ok(g.solvencyRatio > g.solvencyMinimo);
  });
  test(`libro ${perfil}: alterar un supuesto sin recalcular el libro se detecta (P07)`, () => {
    const m = load(f); m.assumptions.base.roeHighGrowth += 0.02;
    assert.ok(evaluarExpediente(m, motor).controles.some(c => c.id === 'P07'));
  });
}
test('libro financiero: el método DDM y el de exceso dan valores distintos para entidades distintas (no se mezclan motores)', () => {
  assert.notEqual(load(casos[0][1]).libro.valores.base, load(casos[1][1]).libro.valores.base);
  assert.equal(motor.calculateAll(load(casos[0][1])).metodo, 'ddm');
});
