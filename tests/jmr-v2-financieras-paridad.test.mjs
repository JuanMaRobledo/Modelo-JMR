import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluarDDM, evaluarExcesoRetorno } from '../docs/v2/motores/financieras.mjs';
// Paridad vs recálculo (LibreOffice) de copias de divginzu.xlsx y eqexret de Damodaran.
// Generador: scripts/v2-financieras-reference.py
const load = f => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8'));
const close = (a, b, w) => assert.ok(Math.abs(a - b) <= Math.max(1e-7, Math.abs(b) * 2e-6), `${w}: motor ${a} vs original ${b}`);
const yes = v => String(v).toLowerCase() === 'yes';
for (const [name, c] of Object.entries(load('jmr-v2-ddm-cases.json'))) test(`paridad divginzu (DDM) · ${name}`, () => {
  const i = c.inputs, d = c.derived;
  const r = evaluarDDM({ netIncome: i.B9, bookEquityPrior: i.C8, dividends: i.B10, shares: 2908.3, beta: i.B15, riskFree: i.B16, erp: i.B17,
    years: i.B20, growthFromFundamentals: yes(i.B22), growthManual: i.B23, changeHighGrowth: yes(i.B27), roeHighGrowth: i.B29, retentionHighGrowth: i.B30,
    changeStable: yes(i.B31), roeStable: i.B33, fade: yes(i.B34), overrideStableGrowth: yes(i.B38), stableGrowth: i.B39,
    overrideStablePayout: yes(i.B42), stablePayout: i.B43, changeStableBeta: yes(i.B45), stableBeta: i.B46 });
  assert.ok(['CANDIDATO', 'REVISAR'].includes(r.status), `${r.status} ${r.issues}`);
  close(r.costOfEquity, d.D3, 'Ke'); close(r.growthHighGrowth, d.D7, 'g HG'); close(r.payoutHighGrowth, d.D8, 'payout HG');
  close(r.growthStable, d.D22, 'g estable'); close(r.payoutStable, d.D23, 'payout estable'); close(r.costOfEquityStable, d.D24, 'Ke estable');
  const x = c.expected;
  r.years.forEach((y, k) => { close(y.earnings, x.earnings[k], `utilidad a${k + 1}`); close(y.dividend, x.dividendos[k], `dividendo a${k + 1}`); close(y.costOfEquity, x.ke[k], `Ke a${k + 1}`); });
  close(r.terminalValue, d.D25, 'valor terminal'); close(r.pvDividends, x.pvDividendos, 'PV dividendos'); close(r.pvTerminal, x.pvTerminal, 'PV terminal');
  close(r.equity, x.equity, 'equity'); close(r.perShare, x.perShare, 'valor por acción');
});
for (const [name, c] of Object.entries(load('jmr-v2-excess-return-cases.json'))) test(`paridad eqexret (exceso de retorno) · ${name}`, () => {
  const i = c.inputs, d = c.derived;
  const r = evaluarExcesoRetorno({ bookEquity: i.B3, shares: i.B6, beta: i.B10, riskFree: i.B11, erp: i.B12, years: i.B15,
    roeHighGrowth: d.B2, retentionHighGrowth: d.B3, stableGrowth: i.B31, changeStable: yes(i.B24), roeStable: i.B26, fade: yes(i.B28),
    overrideStablePayout: yes(i.B34), stablePayout: i.B35, changeStableBeta: yes(i.B37), stableBeta: i.B38, stableErp: i.B39 });
  assert.ok(['CANDIDATO', 'REVISAR'].includes(r.status), `${r.status} ${r.issues}`);
  close(r.costOfEquity, d.B5, 'Ke'); close(r.costOfEquityStable, d.L16, 'Ke estable'); close(r.payoutStable, d.L21, 'payout estable');
  const x = c.expected;
  r.years.forEach((y, k) => { close(y.beginningBook, x.bv[k], `BV a${k + 1}`); close(y.netIncome, x.ni[k], `NI a${k + 1}`); close(y.excess, x.exceso[k], `exceso a${k + 1}`); });
  close(r.pvExcess, x.pvExceso, 'PV exceso'); close(r.equity, x.equity, 'equity'); close(r.perShare, x.perShare, 'valor por acción');
});
test('los motores financieros exigen datos y rechazan rangos no replicados', () => {
  assert.equal(evaluarDDM({}).status, 'INCOMPLETO');
  assert.equal(evaluarDDM({ netIncome: 100, bookEquityPrior: 900, dividends: 40, shares: 10, beta: 1, riskFree: .04, erp: .05, years: 0 }).status, 'INCOMPLETO');
  assert.equal(evaluarExcesoRetorno({ bookEquity: 100, shares: 10, beta: 1, riskFree: .04, erp: .05, years: 11, roeHighGrowth: .2, retentionHighGrowth: .5, stableGrowth: .03, roeStable: .12, stableBeta: 1 }).status, 'INCOMPLETO');
});
