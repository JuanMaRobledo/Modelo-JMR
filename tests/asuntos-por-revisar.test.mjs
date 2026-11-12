import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const js = readFileSync(new URL('../docs/expediente.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../docs/expediente.html', import.meta.url), 'utf8');

// Las funciones de la pestaña son puras: se extraen del archivo del navegador y se ejecutan sin DOM.
function load() {
  const start = js.indexOf('function asuntosList(rec)');
  const end = js.indexOf('function sensitivityHtml(rec)');
  assert.ok(start > 0 && end > start, 'funciones de la pestaña presentes');
  const badge = { hidden: true, textContent: '', classList: { toggle(c, on) { badge.crit = on; } } };
  const ctx = { el: (id) => (id === 'asuntosBadge' ? badge : null) };
  vm.createContext(ctx);
  vm.runInContext(js.slice(start, end) + '\nthis.asuntosHtml=asuntosHtml;this.updateAsuntosBadge=updateAsuntosBadge;this.asuntosList=asuntosList;', ctx);
  return { ...ctx, badge };
}

test('la ficha tiene la pestaña «Asuntos por revisar» con contador', () => {
  assert.match(html, /data-view="asuntos"[^>]*>Asuntos por revisar/);
  assert.match(html, /id="asuntosBadge"/);
  assert.ok(js.includes("'asuntos'"));
  assert.match(js, /isAsuntos/);
});

test('muestra los asuntos estructurados ordenados por severidad y con el cerrado al final', () => {
  const { asuntosHtml } = load();
  const out = asuntosHtml({ asuntosPorRevisar: [
    { id: 'P-07', asunto: 'Inventarios N/D', severidad: 'MENOR', estado: 'CERRADO' },
    { id: 'P-02', asunto: 'Pesos de múltiplos', severidad: 'MATERIAL', impacto: 'Secundario', accion: 'Justificar', estado: 'ABIERTO' },
    { id: 'P-01', asunto: 'Emisión de noviembre', severidad: 'CRÍTICO', estado: 'ABIERTO' },
  ] });
  assert.match(out, /2 asuntos por revisar/);
  assert.match(out, /1 crítico/);
  assert.ok(out.indexOf('P-01') < out.indexOf('P-02') && out.indexOf('P-02') < out.indexOf('P-07'));
  assert.match(out, /class="cerrado"/);
});

test('una revisión antigua con solo salvedades de texto las muestra sin inventar severidad', () => {
  const { asuntosHtml, asuntosList } = load();
  const rec = { salvedades: ['Auditoría económica pendiente', 'Dato X no disponible'] };
  assert.equal(asuntosList(rec).length, 2);
  const out = asuntosHtml(rec);
  assert.match(out, /Auditoría económica pendiente/);
  assert.match(out, /solo declara salvedades de texto/);
  assert.doesNotMatch(out, /Severidad/);
});

test('sin registro y sin salvedades no afirma que no haya pendientes de auditoría', () => {
  const { asuntosHtml } = load();
  assert.match(asuntosHtml({}), /no registra asuntos por revisar/);
  assert.match(asuntosHtml({}), /no sustituye la auditoría económica independiente/);
  assert.match(asuntosHtml(null), /Cargando/);
});

test('escapa HTML de los textos del registro', () => {
  const { asuntosHtml } = load();
  const out = asuntosHtml({ asuntosPorRevisar: [{ id: 'X', asunto: '<img src=x onerror=alert(1)>', severidad: 'MENOR', estado: 'ABIERTO' }] });
  assert.doesNotMatch(out, /<img/);
  assert.match(out, /&lt;img/);
});

test('el contador cuenta solo abiertos y marca críticos', () => {
  const { updateAsuntosBadge, badge } = load();
  updateAsuntosBadge({ asuntosPorRevisar: [
    { id: 'A', asunto: 'a', severidad: 'MENOR', estado: 'ABIERTO' },
    { id: 'B', asunto: 'b', severidad: 'MATERIAL', estado: 'CERRADO' },
    { id: 'C', asunto: 'c', severidad: 'CRÍTICO', estado: 'ABIERTO' },
  ] });
  assert.equal(badge.hidden, false);
  assert.equal(badge.textContent, '2');
  assert.equal(badge.crit, true);
  updateAsuntosBadge(null);
  assert.equal(badge.hidden, true);
});
