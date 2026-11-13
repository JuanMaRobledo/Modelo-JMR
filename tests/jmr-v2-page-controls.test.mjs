import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../docs/jmr-v2.html', import.meta.url), 'utf8');
test('la página conecta el módulo de controles sin depender de él para cargar', () => {
  assert.match(html, /await import\('\.\/v2\/expediente-v2\.mjs'\)/);
  assert.match(html, /catch\(e\)\{console\.warn\('Controles de expediente no disponibles'/);
  assert.match(html, /id="controlsView"/);
  assert.ok(fs.existsSync(new URL('../docs/v2/expediente-v2.mjs', import.meta.url)));
});
test('la página despacha por perfil y no muestra valores con un bloqueo activo', () => {
  assert.match(html, /await import\('\.\/v2\/motores\/despacho\.mjs'\)/);
  assert.match(html, /bloqueado\?\{status:'INCOMPLETO',scenarios:\{\}\}:motor\.calculateAll\(model\)/);
  assert.match(html, /renderSensitivity\(model,bloqueado\)/);
  assert.ok(fs.existsSync(new URL('../docs/v2/motores/financieras.mjs', import.meta.url)));
});
test('las fuentes sin URL no generan enlaces y los indicadores sin datos no se muestran como filas vacías', () => {
  assert.match(html, /const safeUrl=u=>\{if\(typeof u!=='string'\|\|!u\.trim\(\)\)return null;/);
  assert.match(html, /function metricRow\([^)]*\)\{if\(!history\.some\(x=>finite\(x\[key\]\)\)\)return '';/);
  assert.match(html, /s\.label\|\|s\.documento/);
});
test('la página presenta el perfil de alto crecimiento con su propio motor y sensibilidad', () => {
  assert.match(html, /esAlto=m=>m\?\.profile==='alto-crecimiento'/);
  assert.match(html, /Δ margen \/ S2C/);
  assert.ok(fs.existsSync(new URL('../docs/v2/motores/alto-crecimiento.mjs', import.meta.url)));
});
