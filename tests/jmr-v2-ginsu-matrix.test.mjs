import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Matriz de paridad: motor del navegador vs. recálculo del workbook original Simple Ginsu
// (casos generados con scripts/v2-ginsu-reference.py sobre copias del original).
const html = fs.readFileSync(new URL('../docs/jmr-v2.html', import.meta.url), 'utf8');
const s = html.indexOf('const JMR_DCF=(()=>{'), e = html.indexOf('const JMR_IND=(()=>{');
const engine = vm.runInNewContext(html.slice(s, e) + '\nJMR_DCF;', {});
const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/jmr-v2-ginsu-cases.json', import.meta.url), 'utf8'));
const close = (a, b, what) => assert.ok(Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 2e-6), `${what}: motor ${a} vs Ginsu ${b}`);
for (const [name, c] of Object.entries(cases)) {
  test(`paridad Ginsu · ${name}`, () => {
    const i = c.inputs, d = c.derived;
    const financials = { revenue: i.B11, cash: i.B18, debt: i.B15, minority: i.B20, nonoperatingAssets: i.B19,
      optionsValue: 0, shares: i.B21, effectiveTaxRate: i.B23, nol: d.nolInicial };
    const a = { growth1: i.B26, growth2to5: i.B28, margin1: i.B27, marginTarget: i.B29, marginConvergenceYear: i.B30,
      salesToCapital1to5: i.B31, salesToCapital6to10: i.B32, waccInitial: i.B35, waccTerminal: d.waccTerminal,
      roicTerminal: d.roicTerminal, gTerminal: d.gTerminal, marginalTax: i.B24, mos: .35,
      failureProbability: d.pFalla, recoveryRate: i.B54 };
    const v = engine.calculateAll({ financials, assumptions: { conservador: a, base: a, optimista: a }, profile: 'operativa' }).scenarios.base;
    assert.ok(['CANDIDATO', 'REVISAR'].includes(v.status), `estado ${v.status} ${v.issues}`);
    const x = c.expected;
    x.reinv.forEach((r, k) => close(v.years[k].reinvestment, r, `reinversión a${k + 1}`));
    x.nopat.forEach((r, k) => close(v.years[k].nopat, r, `NOPAT a${k + 1}`));
    x.taxRate.forEach((r, k) => close(v.years[k].taxRate, r, `tasa a${k + 1}`));
    close(v.sumPV, x.sumPV, 'suma PV'); close(v.terminalValue, x.terminalValue, 'valor terminal');
    close(v.equity, x.equity, 'patrimonio'); close(v.perShare, x.perShare, 'valor por acción');
  });
}
