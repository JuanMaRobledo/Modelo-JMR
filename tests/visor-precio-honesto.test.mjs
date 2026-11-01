import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../docs/visor.html', import.meta.url), 'utf8');

test('el visor no rotula como «En vivo» una cotización consultada', () => {
  assert.equal(/['"]En vivo/.test(html), false);
  assert.equal(html.includes("'en vivo (Financial Modeling Prep)'"), false);
});

test('el estado de auditorías retirado no se pide en cada ficha', () => {
  assert.equal(html.includes("estado-valoraciones-2026-10-18.json'"), false);
  assert.ok(html.includes('if(!AUDIT_STATUS_URL){ auditState = null; return Promise.resolve(null); }'));
});

test('quoteSessionNote distingue sesión abierta y último cierre', () => {
  const start = html.indexOf('  function quoteSessionNote(');
  const end = html.indexOf('  function fetchLiveQuote(){');
  const ctx = {};
  vm.runInNewContext(html.slice(start, end) + ';this.f=quoteSessionNote;', ctx);
  // Domingo 1-nov-2026 12:24 en Nueva York: mercado cerrado.
  assert.match(ctx.f('FMP', new Date('2026-11-01T17:24:00Z')), /^Último cierre disponible/);
  // Lunes 2-nov-2026 11:00 en Nueva York (16:00 UTC): sesión regular.
  assert.match(ctx.f('FMP', new Date('2026-11-02T16:00:00Z')), /^Cotización intradía/);
  // Lunes 2-nov-2026 17:00 en Nueva York: después del cierre.
  assert.match(ctx.f('FMP', new Date('2026-11-02T22:00:00Z')), /^Último cierre disponible/);
  assert.match(ctx.f('FMP', new Date('2026-11-02T16:00:00Z')), /puede estar retrasada$/);
});
