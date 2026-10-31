import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('las siete secciones comparten Visor y Edición', () => {
  const html = read('docs/expediente.html');
  const js = read('docs/expediente.js');
  assert.ok(html.includes('data-display-mode="visor"'));
  assert.ok(html.includes('data-display-mode="edicion"'));
  assert.ok(html.includes('id="openNativeSheet"'));
  assert.ok(js.includes("state.displayMode='visor'"));
  assert.ok(js.includes('updateNativeLink()'));
});

test('el modo Visor impide modificar entradas de Google Sheets', () => {
  const js = read('docs/editor-hoja.js');
  assert.ok(js.includes('!forceViewer&&isEditable('));
  assert.ok(js.includes('save.disabled=forceViewer||'));
  assert.ok(js.includes('if(forceViewer||!snapshot?.writable'));
  assert.ok(js.includes('hasPendingEdits:'));
});

test('el análisis oficial es editable y no abre una revisión antigua por ticker', () => {
  const app = read('docs/expediente.js');
  const research = read('docs/research.js');
  assert.ok(app.includes("research.html?ticker="));
  assert.ok(app.includes("encodeURIComponent(p.analysisPath)"));
  assert.ok(research.includes('rec.remotePath===deepLinkAnalysisPath'));
  assert.ok(app.includes("state.displayMode==='visor'"));
});

test('fuente Drive disponible y auditoría separada de edición', () => {
  const html = read('docs/expediente.html');
  const app = read('docs/expediente.js');
  assert.ok(html.includes('id="reviewReadOnly"'));
  assert.ok(app.includes('function syncReviewMode()'));
  assert.ok(app.includes("view==='sensibilidades'?'Sensibilidad DCF'"));
  assert.ok(app.includes("state.valuationRecord?.hojaGoogle"));
});
