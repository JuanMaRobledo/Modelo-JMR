import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';
// Expediente REAL de ORCL (Oracle Corporation): datos de los Forms 10-K FY2017–FY2026, exportado del libro. Fija las cifras para que un cambio sea deliberado.
const m = () => structuredClone(JSON.parse(fs.readFileSync(new URL('../docs/v2/empresas/ORCL.json', import.meta.url), 'utf8')));
const motor = crearMotor(cargarMotor());
const close = (a, b, w, t = 1e-6) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${w}: ${a} vs ${b}`);
test('ORCL: diez ejercicios consecutivos FY2017–FY2026 con balance y resultados cuadrados', () => {
  const e = m(), h = e.history;
  assert.deepEqual(h.map(x => x.year), [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  for (const x of h) {
    close(x.assets, x.liabilities + x.equity, `balance ${x.year}`, 1e-9);                                  // activos = pasivos + patrimonio total
    close(x.netIncome, x.pretaxIncome - x.taxExpense, `neta ${x.year}`, 1e-9);                              // utilidad neta = UAI − impuestos
    close(x.pretaxIncome, x.ebit - x.interestExpense + x.nonOperatingIncome, `UAI ${x.year}`, 1e-9);        // UAI = EBIT − intereses + no operativos
  }
});
test('ORCL: cifras clave del FY2026 tal como figuran en el 10-K (páginas 66, 67 y 70 del PDF)', () => {
  const u = m().history.at(-1);
  assert.deepEqual([u.revenue, u.ebit, u.interestExpense, u.nonOperatingIncome, u.taxExpense, u.netIncome], [67357, 20606, 4599, 3547, 2467, 17087]);
  assert.deepEqual([u.operatingCF, u.capex, u.assets, u.currentLiabilities], [31977, 55663, 261759, 41764]);
  assert.equal(u.debt, 7199 + 122342); assert.equal(u.cash, 31289 + 605); assert.equal(u.minority, 548 + 4954); assert.equal(u.shares, 2914);
  assert.equal(u.equity, 42508 + 548);
});
test('ORCL: el valor del libro concilia con el motor; escenarios ordenados; MOS 35 % sobre el base', () => {
  const e = m(), c = motor.calculateAll(e);
  for (const n of ['conservador', 'base', 'optimista']) close(c.scenarios[n].perShare, e.libro.valores[n], `valor ${n}`);
  close(e.libro.valores.base, 55.656, 'valor base fijado', 1e-4);
  assert.ok(e.libro.valores.conservador < e.libro.valores.base && e.libro.valores.base < e.libro.valores.optimista);
  close(c.scenarios.base.mosPrice, e.libro.valores.base * 0.65, 'precio con MOS');
  assert.match(e.libro.sha256, /^[0-9a-f]{64}$/); assert.equal(e.controlesLibro.estados, 'OK'); assert.equal(e.controlesLibro.fuentes, 'OK');
});
test('ORCL: WACC y supuestos comunes iguales en los tres escenarios; ROIC terminal sin retorno excedente material', () => {
  const a = m().assumptions;
  for (const k of ['waccInitial', 'waccTerminal', 'gTerminal', 'marginalTax']) assert.equal(new Set(Object.values(a).map(x => x[k])).size, 1, k);
  assert.ok(a.base.waccInitial > 0.10 && a.base.waccInitial < 0.11 && a.base.roicTerminal < a.base.waccTerminal + 0.01);
});
test('ORCL: trazabilidad con documento, período, página y ajuste documentado (preferente Serie D)', () => {
  const p = m().provenance, min = p.find(x => x.destino === 'financials.minority');
  assert.equal(p.length, 6); assert.ok(p.every(x => /10-K/.test(x.documento) || /Sin cifra/.test(x.documento)));
  assert.equal(min.valorReportado, 548); assert.equal(min.ajuste, 4954);
});
test('ORCL: en revisión; el único control pendiente es la auditoría independiente (que no certifica la IA)', () => {
  const e = m(), r = evaluarExpediente(e, motor);
  assert.deepEqual(r.controles.filter(c => c.gravedad !== 'aviso').map(c => c.id), ['P02']);
  assert.equal(e.estado, 'EN_REVISION'); assert.equal(r.permitido, 'EN_REVISION'); assert.equal(r.publicable, false); assert.equal(e.auditoria, undefined);
});
