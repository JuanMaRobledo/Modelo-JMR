import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// El research fundamental (2/3) es narrativo desde v19 (PR #141): usa los resultados de la valoración y no
// recalcula (REGLAS_VIGENTES, tres prompts), por eso no lleva el bloque; se comprueba aparte abajo.
const names = ['valoracion-modelo-jmr-v5.md', 'colombia-valuation-v1.md', 'colombia-research-v1.md'];
const start = '<!-- JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->';
const end = '<!-- /JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->';
test('los prompts de cálculo comparten el contrato cuantitativo vigente', () => {
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

test('el research fundamental no duplica el contrato cuantitativo', () => {
  const text = readFileSync(new URL('../docs/prompts/research-fundamental-jmr-v5.md', import.meta.url), 'utf8');
  assert.equal(text.includes(start), false);
});
