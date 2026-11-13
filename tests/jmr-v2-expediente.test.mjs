import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';

import { cargarMotor } from '../scripts/v2-motor.mjs';
import { demo, valido, conValores } from './fixtures/v2-expediente-valido.mjs';
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

test('P07: el valor del libro oficial debe conciliar con el motor (±0,5 %) en los tres escenarios', () => {
  const sin = check(m => { delete m.libro.valores; });
  assert.ok(ids(sin).includes('P07')); assert.equal(sin.permitido, 'EN_PROCESO'); assert.equal(sin.publicable, false);
  assert.ok(ids(check(m => { m.libro.valores.base *= 1.02; })).includes('P07'));
  assert.ok(ids(check(m => { m.libro.valores.optimista = null; })).includes('P07'));
  assert.ok(!ids(check(m => { m.libro.valores.base *= 1.004; })).includes('P07'));
  const stale = check(m => { m.assumptions.base.growth1 = 0.12; }); // cambió un supuesto sin volver a calcular el libro
  assert.ok(ids(stale).includes('P07'));
  assert.ok(!ids(check(m => { m.assumptions.base.growth1 = 0.12; conValores(m); })).includes('P07'));
});
test('P06: la huella del libro debe ser un sha256 hexadecimal', () => {
  assert.ok(ids(check(m => { m.libro.sha256 = 'abc'; })).includes('P06'));
  assert.ok(ids(check(m => { m.libro.sha256 = 'Z'.repeat(64); })).includes('P06'));
});
test('V10: el ROIC terminal alto se levanta solo con justificación escrita', () => {
  const alto = m => { m.assumptions.base.roicTerminal = 0.4; conValores(m); };
  assert.ok(ids(check(alto)).includes('V10'));
  assert.ok(!ids(check(m => { alto(m); m.justificaciones = { roicTerminal: 'Ventaja competitiva duradera por escala, marca y contratos de largo plazo con renovación.' }; })).includes('V10'));
  assert.ok(ids(check(m => { alto(m); m.justificaciones = { roicTerminal: 'porque sí' }; })).includes('V10'));
});
test('D07: la utilidad antes de impuestos admite ingresos/gastos no operativos entre EBIT y UAI', () => {
  const sin = check(m => { const h = m.history.at(-1); h.pretaxIncome = h.ebit - h.interestExpense + 500; h.netIncome = h.pretaxIncome - h.taxExpense; });
  assert.ok(ids(sin).includes('D07'), 'una partida no operativa no declarada descuadra');
  const con = check(m => { const h = m.history.at(-1); h.nonOperatingIncome = 500; h.pretaxIncome = h.ebit - h.interestExpense + 500; h.netIncome = h.pretaxIncome - h.taxExpense; });
  assert.ok(!ids(con).includes('D07'));
  assert.ok(ids(check(m => { const h = m.history.at(-1); h.nonOperatingIncome = 500; })).includes('D07'), 'declararla sin que concilie sigue siendo error');
});
