import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluarAltoCrecimiento, crecimientoPorParticipacion } from '../docs/v2/motores/alto-crecimiento.mjs';
// Paridad vs recálculo (LibreOffice) de copias de higrowth.xls y revgrowth.xls de Damodaran.
// Generador: scripts/v2-altocrecimiento-reference.py (configuración soportada: sin leases/I+D/opciones, capex por sales-to-capital).
const load = f => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8'));
const close = (a, b, w) => assert.ok(Math.abs(a - b) <= Math.max(1e-7, Math.abs(b) * 2e-6), `${w}: motor ${a} vs original ${b}`);
const entrada = p => ({ ebit0: p.ebit0, revenue0: p.revenue0, nol: p.nol, taxRate: p.tax, beta: p.beta, costOfDebt: p.kd, marketDebt: p.marketDebt, shares: p.shares, price: p.price,
  cash: p.cash, nonOperatingAssets: p.nonop, riskFree: p.rf, erp: p.erp, stableGrowth: p.gS, stableMargin: p.mS, stableDebtRatio: p.drS, stableBeta: p.betaS,
  stableCostOfDebt: p.kdS, stableRoc: p.rocS, speed: p.speed, salesToCapital: p.s2c, optionsValue: p.optionsValue ?? 0, ...(p.anual ? { growth: p.growth } : { cagr: p.cagr }) });
for (const [name, c] of Object.entries(load('jmr-v2-higrowth-cases.json'))) test(`paridad higrowth · ${name}`, () => {
  const r = evaluarAltoCrecimiento(entrada(c.params)), x = c.expected;
  assert.ok(['CANDIDATO', 'REVISAR'].includes(r.status), `${r.status} ${r.issues}`);
  const por = (k, f) => r.years.forEach((y, t) => close(f(y), x[k][t], `${k} año ${t + 1}`));
  por('revenue', y => y.revenue); por('margin', y => y.margin); por('ebit', y => y.ebit); por('tax', y => y.taxes); por('nopat', y => y.nopat);
  por('fcff', y => y.fcff); por('nol', y => y.nol); por('taxRate', y => y.taxRate); por('debtRatio', y => y.debtRatio); por('beta', y => y.beta);
  por('kd', y => y.costOfDebt); por('wacc', y => y.wacc); por('cum', y => y.discountFactor); por('pv', y => y.pvFcff);
  close(r.terminal.revenue, x.terminalRevenue, 'ingresos terminales'); close(r.terminal.ebit, x.terminalEbit, 'EBIT terminal'); close(r.terminal.fcff, x.terminalFcff, 'FCFF terminal');
  close(r.terminal.wacc, x.terminalWacc, 'WACC terminal'); close(r.terminal.nol, x.terminalNol, 'NOL terminal'); close(r.terminalValue, x.terminalValue, 'valor terminal');
  close(r.sumPV, x.pvFcff, 'PV FCFF'); close(r.pvTerminal, x.pvTerminal, 'PV terminal'); close(r.operatingAssets, x.operatingAssets, 'activos operativos');
  close(r.firm, x.firm, 'valor de la firma'); close(r.equity, x.equity, 'equity'); close(r.perShare, x.perShare, 'valor por acción');
});
for (const [name, c] of Object.entries(load('jmr-v2-revgrowth-cases.json'))) test(`paridad revgrowth (participación de mercado) · ${name}`, () => {
  const i = c.inputs, r = crecimientoPorParticipacion({ revenue0: i.B2, marketSize: i.B3, marketGrowth: i.B4, share5: i.B5, share10: i.B6 }), x = c.expected;
  close(r.revenue5, x.B9, 'ingresos año 5'); close(r.growth1to5, x.B10, 'crecimiento 1-5'); close(r.revenue10, x.B11, 'ingresos año 10');
  close(r.growth6to10, x.B12, 'crecimiento 6-10'); close(r.growth1to10, x.B13, 'crecimiento 1-10');
});
test('lo que no se replica se rechaza explícitamente', () => {
  const base = entrada(load('jmr-v2-higrowth-cases.json').base_perdidas_ingresos_anuales.params);
  for (const k of ['arrendamientos', 'capitalizarID', 'otrosGastosCapitalizables']) assert.match(evaluarAltoCrecimiento({ ...base, [k]: true }).issues[0], /no replicados/);
  assert.match(evaluarAltoCrecimiento({ ...base, metodoCapex: 1 }).issues[0], /sales-to-capital/);
  assert.equal(evaluarAltoCrecimiento({ ...base, stableGrowth: 0.2 }).status, 'INCOMPLETO');
  assert.equal(evaluarAltoCrecimiento({ ...base, growth: [0.1] }).status, 'INCOMPLETO');
  assert.equal(crecimientoPorParticipacion({ revenue0: 100, marketSize: 1000, marketGrowth: .03, share5: 1.2, share10: .5 }).status, 'INCOMPLETO');
});
