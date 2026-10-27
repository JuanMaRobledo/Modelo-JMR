import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const get = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('index redirige al análisis, sin borrar la bitácora de terceros', () => {
  assert.match(get('docs/index.html'), /location\.replace\("research\.html"/);
  const third = get('docs/bitacora-terceros.html');
  assert.match(third, /Bitácora de terceros/);
  assert.match(third, /55 hipótesis de inversión/);
  assert.match(third, /var DATA = \[\{/);
});

test('expediente muestra cinco secciones y protege estados', () => {
  const html = get('docs/expediente.html');
  for (const view of ['valoracion','analisis','supuestos','auditoria','sensibilidades']) {
    assert.match(html, new RegExp('data-view="'+view+'"'));
  }
  const js=get('docs/expediente.js');
  new Script(js);
  for(const page of ['visor.html','research.html','editor-hoja.html','auditoria-integral.html','auditoria-multiplos.html']) {
    assert.ok(js.includes(page), 'Falta '+page);
  }
  assert.match(js,/cat[aá]logo oficial|catálogo oficial/);
  assert.match(js,/NO republica|no se presenta como validada/i);
});

test('navegación general y biblioteca permiten abrir el expediente', () => {
  const nav=get('docs/mercado.js');
  const research=get('docs/research.js');
  const visor=get('docs/visor.html');
  new Script(nav);new Script(research);
  assert.match(nav,/Bitácora de terceros/);
  assert.match(nav,/Expedientes JMR/);
  assert.match(research,/openCatalogResearch/);
  assert.match(visor,/expediente\.html\?ticker=/);
});

test('servicio offline incluye nuevas páginas', () => {
  const sw=get('docs/sw.js');new Script(sw);
  for (const f of ['index.html','bitacora-terceros.html','expediente.html','expediente.js']) assert.ok(sw.includes('"'+f+'"'));
});
