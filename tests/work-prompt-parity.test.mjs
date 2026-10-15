import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const names = ['valoracion-modelo-jmr-v4.md', 'research-fundamental-jmr-v5.md', 'colombia-valuation-v1.md', 'colombia-research-v1.md'];
const start = '<!-- JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->';
const end = '<!-- /JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->';
test('los cuatro prompts comparten el contrato cuantitativo vigente', () => {
  const blocks = names.map(name => {
    const text = readFileSync(new URL('../docs/prompts/' + name, import.meta.url), 'utf8');
    assert.equal(text.split(start).length, 2, name);
    assert.ok(text.indexOf(end) > text.indexOf(start), name);
    const block = text.slice(text.indexOf(start), text.indexOf(end) + end.length);
    for (const rule of ['g_t_inverso = g_t_Base + delta', 'CAGR geométrico', '0,001', 'WACC terminal × crecimiento perpetuo', 'ROIC marginal terminal × crecimiento perpetuo', 'margen EBIT objetivo', 'FCFE/Ke', 'bitácora', 'PDF']) {
      assert.ok(block.includes(rule), name + ': ' + rule);
    }
    return block;
  });
  blocks.forEach(block => assert.equal(block, blocks[0]));
});
