// Datos y página de enlaces a Damodaran: las claves que lee docs/damodaran.html existen y los enlaces son https.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const mult = JSON.parse(fs.readFileSync(path.join(dir, 'damodaran/multiplos.json'), 'utf8'));
const vals = JSON.parse(fs.readFileSync(path.join(dir, 'damodaran/valoraciones.json'), 'utf8')).valoraciones;
const html = fs.readFileSync(path.join(dir, 'damodaran.html'), 'utf8');

test('multiplos: ambas regiones con las claves que usa la página', () => {
  const claves = ['pe_agregado_rentables', 'pe_forward', 'ev_ebitda', 'ev_ventas', 'pbv',
    'crec_esperado_5a', 'peg', 'margen_operativo', 'margen_neto', 'roe', 'roic', 'pct_perdidas', 'n'];
  for (const region of ['us', 'global']) {
    const ind = mult.regiones[region]['Software (System & Application)'];
    assert.ok(ind, `${region}: falta Software`);
    for (const k of claves) assert.ok(k in ind, `${region}: falta ${k}`);
    assert.ok(Object.keys(mult.regiones[region]).length > 80);
  }
  assert.match(mult.fecha, /^\d{4}-\d{2}-\d{2}$/);
});

test('multiplos: cada empresa de la cartera apunta a una industria que existe', () => {
  const nombres = Object.keys(mult.cartera);
  assert.ok(nombres.length >= 25);
  for (const tk of nombres) assert.ok(mult.regiones.us[mult.cartera[tk]], `${tk}: industria inexistente`);
});

test('valoraciones: https, tipos conocidos y hojas de stern.nyu.edu', () => {
  assert.ok(vals.length >= 30);
  for (const v of vals) {
    assert.match(v.url, /^https:\/\/aswathdamodaran\.blogspot\.com\//);
    assert.ok(['empresa', 'ipo', 'sector', 'mercado'].includes(v.tipo), v.titulo);
    assert.match(v.fecha, /^\d{4}-\d{2}-\d{2}$/);
    for (const h of v.hojas) assert.match(h.url, /^https:\/\/[a-z.]*stern\.nyu\.edu\/~adamodar\/.+\.xlsx?$/);
  }
  const fechas = vals.map(v => v.fecha);
  assert.deepEqual(fechas, [...fechas].sort().reverse());
});

test('página: enlazada en la navegación de todas las pantallas y en el caché offline', () => {
  for (const f of ['index.html', 'visor.html', 'research.html', 'screener.html', 'calculadora.html', 'portafolio.html', 'mi-bitacora.html', 'colombia.html']) {
    assert.match(fs.readFileSync(path.join(dir, f), 'utf8'), /<a href="damodaran\.html">Damodaran<\/a>/, f);
  }
  const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
  for (const f of ['damodaran.html', 'damodaran/multiplos.json', 'damodaran/valoraciones.json']) assert.ok(sw.includes(`"${f}"`), f);
  assert.match(html, /rel="noopener noreferrer"/);
});
