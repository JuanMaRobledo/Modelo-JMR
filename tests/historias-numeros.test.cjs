const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = { window: {}, Intl };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../docs/valuation-board.js'), 'utf8'), ctx);
const board = ctx.window.JmrValueBoard;
const historia = (nombre, juicio) => ({
  nombre, titulo: 'Título ' + nombre, tipo: 'Alto crecimiento', estado: 'COMPLETA', historia: 'Historia <b>' + nombre + '</b>',
  palancas: [{ palanca: 'crecimiento', etiqueta: 'Crecimiento de ingresos', anio1: 0.149, anios2a5: 0.141, anios6a10: 0.071, terminal: 0.04, vinculo: 'Sigue a los DAU' },
             { palanca: 'ventasCapital', etiqueta: 'Ventas / capital', anio1: 1.9, anios2a5: 1.9, anios6a10: 2.3, terminal: 0.69, vinculo: 'Negocio digital' }],
  pruebas: [{ prueba: 'plausibleMargen', indicador: 'Margen operativo del año 10', senal: 'REVISAR' }],
  juicios: { posible: { juicio: 'Con reserva', porque: 'TAM N/D' }, plausible: { juicio: 'Sí' }, probable: { juicio } },
  disparadores: [{ tipo: 'Ruptura', senal: 'Suscriptores ≤ 5 %', umbral: '≤ 5 %', efecto: 'Pasa a Conservadora' }] });
const bloque = (completas) => ({ estado: 'INFORMATIVO', industria: 'Software (Internet)', tam: { valor: null }, completas,
  historias: { base: historia('Base', 'Sí'), conservador: historia('Conservadora', 'Con reserva'),
               optimista: historia('Optimista', 'Con reserva'), disrupcion: historia('Disrupción', 'No') } });

test('sin bloque no muestra nada', () => {
  assert.equal(board.historiasHtml({}), '');
});

test('sin historias completas avisa que se escriben en la próxima revisión', () => {
  const html = board.historiasHtml({ historiasNumeros: bloque(0) });
  assert.match(html, /próxima revisión/);
  assert.doesNotMatch(html, /jvb-hn-card/);
});

test('con historias completas muestra las cuatro, sus 3P, vínculos y disparadores, escapando el texto', () => {
  const html = board.historiasHtml({ historiasNumeros: bloque(4) });
  assert.equal((html.match(/jvb-hn-card/g) || []).length, 4);
  assert.match(html, /¿Probable\? Sí/);
  assert.match(html, /¿Probable\? No/);
  assert.match(html, /Sigue a los DAU/);
  assert.match(html, /Ruptura:/);
  assert.match(html, /Tamaño del mercado: N\/D/);
  assert.match(html, /Historia &lt;b&gt;Base/);
  assert.match(html, /1,90/);
});
