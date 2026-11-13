import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';

import { cargarMotor } from '../scripts/v2-motor.mjs';
import { demo, valido } from './fixtures/v2-expediente-valido.mjs';
const engine = cargarMotor();

const ids = r => r.controles.map(c => c.id);
const check = (mut) => { const m = valido(); mut(m); return evaluarExpediente(m, engine); };

test('expediente coherente y auditado puede ser PUBLICADO', () => {
  const r = evaluarExpediente(valido(), engine);
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso'), []);
  assert.equal(r.permitido, 'PUBLICADO'); assert.equal(r.publicable, true);
});
test('el ejemplo ficticio nunca es publicable', () => {
  const r = evaluarExpediente({ ...demo, estado: 'PUBLICADO' }, engine);
  assert.equal(r.publicable, false); assert.ok(r.violacion); assert.ok(ids(r).includes('P01'));
});
test('sin auditoría independiente: EN_REVISION y PUBLICADO declarado es violación', () => {
  const r = check(m => { delete m.auditoria; });
  assert.equal(r.permitido, 'EN_REVISION'); assert.match(r.violacion, /solo permiten EN_REVISION/); assert.equal(r.publicable, false);
});
test('autocertificación de la IA se rechaza', () => {
  assert.ok(ids(check(m => { m.auditoria.aprobadaPor = 'Claude'; })).includes('P03'));
});
test('históricos con año faltante o duplicado → EN_PROCESO', () => {
  assert.ok(ids(check(m => { m.history.splice(4, 1); })).includes('D04'));
  assert.ok(ids(check(m => { m.history[3].year = m.history[2].year; })).includes('D03'));
  assert.equal(check(m => { m.history.splice(4, 1); }).permitido, 'EN_PROCESO');
});
test('balance y resultados descuadrados se detectan', () => {
  assert.ok(ids(check(m => { m.history[2].assets *= 1.05; })).includes('D06'));
  assert.ok(ids(check(m => { m.history[2].netIncome += 50; })).includes('D08'));
});
test('base de valoración distinta del último histórico o sin trazabilidad', () => {
  assert.ok(ids(check(m => { m.financials.cash += 10; })).includes('D10'));
  assert.ok(ids(check(m => { m.provenance = m.provenance.filter(p => p.destino !== 'financials.debt'); })).includes('D11'));
  assert.ok(ids(check(m => { m.provenance[0].ajuste = 5; })).includes('D12'));
});
test('faltan moneda/unidades o históricos mínimos → BLOQUEADO', () => {
  assert.equal(check(m => { delete m.currency; }).permitido, 'BLOQUEADO');
  assert.equal(check(m => { m.history = m.history.slice(-2); }).permitido, 'BLOQUEADO');
  assert.match(check(m => { delete m.currency; }).violacion, /bloqueos/);
});
test('perfil financiero/holding no pasa por el motor FCFF', () => {
  const r = check(m => { m.profile = 'banco'; });
  assert.equal(r.permitido, 'BLOQUEADO'); assert.ok(ids(r).includes('V01'));
});
test('MOS distinto de 35 %, WACC divergente sin justificar y orden de escenarios', () => {
  assert.ok(ids(check(m => { m.assumptions.base.mos = 0.3; })).includes('V05'));
  assert.ok(ids(check(m => { m.assumptions.optimista.waccInitial = 0.09; })).includes('V07'));
  assert.ok(!ids(check(m => { m.assumptions.optimista.waccInitial = 0.09; m.justificaciones = { wacc: 'Menor riesgo país por contratos' }; })).includes('V07'));
  assert.ok(ids(check(m => { m.assumptions.conservador.growth2to5 = 0.2; })).includes('V08'));
});
test('ROIC terminal desmesurado y crecimiento ≥ WACC se marcan', () => {
  assert.ok(ids(check(m => { m.assumptions.base.roicTerminal = 0.4; })).includes('V10'));
  const r = check(m => { m.assumptions.base.gTerminal = 0.096; }); // g > WACC terminal: el motor se niega a valorar
  assert.equal(r.permitido, 'BLOQUEADO'); assert.ok(ids(r).includes('V02'));
});
test('estado declarado desconocido se rechaza; BLOQUEADO declarado es válido', () => {
  assert.match(check(m => { m.estado = 'LISTO'; }).violacion, /no reconocido/);
  assert.equal(check(m => { m.estado = 'BLOQUEADO'; }).violacion, null);
});
