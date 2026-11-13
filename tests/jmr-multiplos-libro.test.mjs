import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { calcular } from '../docs/multiplos/motor.mjs';

const script = new URL('../scripts/multiplos-libro.py', import.meta.url).pathname;
const fixture = new URL('./fixtures/multiplos-sintetico.json', import.meta.url).pathname;
const hay = spawnSync('soffice', ['--version']).status === 0 && spawnSync('python3', ['-c', 'import openpyxl']).status === 0;
const opts = { skip: hay ? false : 'requiere LibreOffice y openpyxl' };

function libro(exp) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jmrm-')), 'e.json');
  fs.writeFileSync(f, JSON.stringify(exp));
  const r = spawnSync('python3', [script, 'verify', f], { encoding: 'utf8', timeout: 240000 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
const cerca = (a, b, tol = 0.005) => Math.abs(a / b - 1) <= tol;

test('el libro recalculado concilia con el motor (±0,5 %) en los tres escenarios y cada método', opts, () => {
  const exp = JSON.parse(fs.readFileSync(fixture, 'utf8')), r = calcular(exp), l = libro(exp);
  for (const s of ['conservador', 'base', 'optimista']) {
    assert.ok(cerca(l.ponderado[s], r.escenarios[s].ponderado), `${s}: ${l.ponderado[s]} vs ${r.escenarios[s].ponderado}`);
    for (const [m, c] of Object.entries(r.escenarios[s].porMetodo)) assert.ok(cerca(l.metodos[m][s], c.valorPorAccion), `${m} ${s}`);
  }
  for (const [m, x] of Object.entries(r.referencias)) { assert.equal(l.referencias[m].n, x.n); assert.ok(cerca(l.referencias[m].p50, x.p50), m); }
  for (const [m, x] of Object.entries(r.actuales)) if (x !== null) assert.ok(cerca(l.actuales[m], x), `actual ${m}`);
  assert.ok(cerca(l.mos, r.mos.precioMOS));
});

test('una mutación del motor (cambiar un peso solo en el libro) rompe la conciliación', opts, () => {
  const exp = JSON.parse(fs.readFileSync(fixture, 'utf8')), r = calcular(exp);
  const mut = structuredClone(exp); mut.pesos = { 'EV/EBITDA': 0.1, 'EV/FCFF': 0.1, 'P/E': 0.5, 'P/FCFE': 0.15, 'P/OCF': 0.15 };
  const l = libro(mut);
  assert.ok(!cerca(l.ponderado.optimista, r.escenarios.optimista.ponderado), 'el libro mutado debe diferir');
  assert.ok(cerca(l.ponderado.optimista, calcular(mut).escenarios.optimista.ponderado), 'pero concilia con el motor mutado');
});

test('con un método N/M el libro redistribuye pesos igual que el motor', opts, () => {
  const exp = JSON.parse(fs.readFileSync(fixture, 'utf8'));
  exp.history[exp.history.length - 1].netIncome = -50;
  exp.pesos = { 'EV/EBITDA': 0.45, 'EV/FCFF': 0.3, 'P/E': 0.05, 'P/FCFE': 0.1, 'P/OCF': 0.1 };
  const r = calcular(exp), l = libro(exp);
  assert.ok(cerca(l.ponderado.base, r.escenarios.base.ponderado));
  assert.equal(l.metodos['P/E'].base, null);
});

test('la plantilla en blanco: solo entradas editables, el resto son fórmulas', opts, () => {
  const py = `
import sys; sys.path.insert(0,'${path.dirname(script)}')
import importlib.util
sp=importlib.util.spec_from_file_location('ml','${script}'); m=importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
wb=m.construir(); malas=[]
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if c.value is None: continue
            if isinstance(c.value,str) and c.value.startswith('='): continue
            if ws.title in ('Guía','Perfiles'): continue
            if c.font and c.font.color and c.font.color.rgb and str(c.font.color.rgb).endswith('1F4FBF'): continue
            if isinstance(c.value,str) and c.fill and c.fill.fgColor and str(c.fill.fgColor.rgb).endswith('173850'): continue
            if c.column==1 or (ws.title=='Escenarios' and c.row==3) : continue
            if ws.title=='Valoración' and c.column==2 and c.value in ('EV','EQ'): continue
            malas.append((ws.title,c.coordinate,c.value))
print(len(malas), malas[:5])
`;
  const r = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^0 /, r.stdout);
});
