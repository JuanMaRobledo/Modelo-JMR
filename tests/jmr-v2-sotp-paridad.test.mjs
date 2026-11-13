import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluarSOTP, valorNegocio } from '../docs/v2/motores/sotp.mjs';
// Paridad vs recálculo (LibreOffice) de copias de illGE.xlsx (Damodaran, SOTP de GE). Generador: scripts/v2-sotp-reference.py
const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/jmr-v2-sotp-cases.json', import.meta.url), 'utf8'));
const close = (a, b, w) => assert.ok(Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 2e-6), `${w}: motor ${a} vs original ${b}`);
for (const [name, c] of Object.entries(cases)) test(`paridad illGE (SOTP) · ${name}`, () => {
  const g = c.global;
  const r = evaluarSOTP({ modoReplicacion: true, riskFree: g.rf, taxRate: g.tax, corporateExpenses: g.ga, debt: g.debt + g.debtCap, minority: g.minority, cash: g.cash, options: g.options, shares: g.shares,
    segmentos: c.segmentos.map(s => ({ id: s.row, nombre: `fila ${s.row}`, revenue: s.rev, margin: s.margin, capital: s.cap, costOfCapital: s.k, growth5: s.g, share: s.share / c.shareTotal })) });
  assert.equal(r.status, 'REVISAR', `${r.status} ${r.issues}`); // la réplica nunca es CANDIDATO si el original evalúa negocios sin sentido económico
  r.segmentos.forEach((d, k) => { const o = c.segmentos[k]; close(d.ebitBeforeCorporate, o.D, `EBIT antes de G&A ${o.row}`); close(d.ebit, o.E, `EBIT ${o.row}`);
    close(d.nopat, o.F, `NOPAT ${o.row}`); close(d.roic, o.H, `ROIC ${o.row}`); close(d.value, o.J, `valor ${o.row}`); });
  const x = c.expected;
  close(r.sumaNegocios, x.sumaNegocios, 'suma de negocios'); close(r.equity, x.equity, 'equity'); close(r.equityComun, x.equityComun, 'equity común'); close(r.perShare, x.porAccion, 'valor por acción');
});
test('el motor se niega a replicar resultados sin sentido económico', () => {
  assert.equal(valorNegocio({ nopat: -10, growth: .03, roic: .1, k: .08, rf: .03 }).status, 'INCOMPLETO');
  assert.equal(valorNegocio({ nopat: 10, growth: .09, roic: .1, k: .08, rf: .03 }).status, 'INCOMPLETO');
  assert.equal(valorNegocio({ nopat: 10, growth: .03, roic: .1, k: .02, rf: .03 }).status, 'INCOMPLETO');
});
test('sin modo de replicación, el flujo normal rechaza los negocios del libro original que carecen de sentido económico', () => {
  const c = cases.ge_base, g = c.global;
  const r = evaluarSOTP({ riskFree: g.rf, taxRate: g.tax, corporateExpenses: g.ga, debt: g.debt, minority: g.minority, cash: g.cash, options: g.options, shares: g.shares,
    segmentos: c.segmentos.map(s => ({ id: s.row, nombre: `fila ${s.row}`, revenue: s.rev, margin: s.margin, capital: s.cap, costOfCapital: s.k, growth5: s.g, share: s.share / c.shareTotal })) });
  assert.equal(r.status, 'INCOMPLETO'); assert.match(r.issues.join(' '), /NOPAT normalizado no positivo/);
});
