import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler from '../api/quotes.js';

test('cotizaciones: cierre y fecha provienen de la misma barra; caché conserva fecha', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({
    DATEOK: { close: [10], fulldayPrice: 12, timestamp: [Date.parse('2026-10-09T20:00:00Z') / 1000] },
    BADLENGTH: { close: [10, 11], timestamp: [1791576000] },
    NODATE: { close: [10] },
    BADDATE: { close: [10], timestamp: [1e30] },
  }) }; };
  try {
    let out;
    const res = { setHeader() {}, status(code) { assert.equal(code, 200); return this; }, json(value) { out = value; } };
    await handler({ query: { symbols: 'DATEOK,BADLENGTH,NODATE,BADDATE' } }, res);
    assert.deepEqual(out.prices, { DATEOK: 10 });
    assert.deepEqual(out.priceDates, { DATEOK: '2026-10-09' });
    await handler({ query: { symbols: 'DATEOK' } }, res);
    assert.equal(calls, 1);
    assert.equal(out.priceDates.DATEOK, '2026-10-09');
  } finally { globalThis.fetch = original; }
});
