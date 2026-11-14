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
test('ORCL: corregir leases financieros una vez y marcar paridad Excel pendiente', () => {
  const e=m(), c=motor.calculateAll(e);
  assert.equal(e.financials.debt,129541);
  assert.equal(e.financials.financeLeaseLiabilities,7701);
  assert.equal(e.financials.operatingLeaseLiabilities,30190);
  assert.equal(e.history.at(-2).leases,2934);
  assert.equal(e.history.at(-1).leases,7701);
  const sin=structuredClone(e);
  delete sin.financials.financeLeaseLiabilities;
  const original=motor.calculateAll(sin);
  for(const n of ['conservador','base','optimista']){
    close(original.scenarios[n].perShare-c.scenarios[n].perShare,7701/2914,'lease una vez '+n);
    close(c.scenarios[n].perShare,e.libro.valores[n]-7701/2914,'valor tras leases '+n);
  }
  close(c.scenarios.base.mosPrice,c.scenarios.base.perShare*0.65,'MOS corregido');
  assert.equal(e.revisionContableV2.estado,'CORRECCION_CONTABLE_REALIZADA_PARIDAD_ECONOMICA_PENDIENTE');
  assert.equal(e.controlesLibro.paridadMotor,'PENDIENTE_RECALCULO_R2');
  assert.match(e.libro.sha256,/^[0-9a-f]{64}$/);
});
test('ORCL: WACC y supuestos comunes iguales en los tres escenarios; ROIC terminal sin retorno excedente material', () => {
  const a = m().assumptions;
  for (const k of ['waccInitial', 'waccTerminal', 'gTerminal', 'marginalTax']) assert.equal(new Set(Object.values(a).map(x => x[k])).size, 1, k);
  assert.ok(a.base.waccInitial > 0.10 && a.base.waccInitial < 0.11 && a.base.roicTerminal < a.base.waccTerminal + 0.01);
});
test('ORCL: trazabilidad con documento, período, página y ajuste documentado (preferente Serie D)', () => {
  const p = m().provenance, min = p.find(x => x.destino === 'financials.minority');
  assert.equal(p.length, 7); assert.ok(p.every(x => /10-K/.test(x.documento) || /Sin cifra/.test(x.documento)));
  assert.equal(min.valorReportado, 548); assert.equal(min.ajuste, 4954);
});
test('ORCL: P07 impide certificar la conciliación de libro R2 hasta recalcular el WACC', () => {
  const e=m(),r=evaluarExpediente(e,motor);
  const ids=r.controles.filter(c=>c.gravedad!=='aviso').map(c=>c.id);
  assert.ok(ids.includes('P07'),ids.join(','));
  assert.ok(ids.includes('P02'),ids.join(','));
  assert.equal(e.estado,'EN_PROCESO');
  assert.equal(r.permitido,'EN_PROCESO');
  assert.equal(r.publicable,false);
  assert.equal(r.violacion,null);
});
