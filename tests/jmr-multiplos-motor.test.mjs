import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calcular, evaluar, percentil, valorPorAccion, puenteEV, referencias, multiplosHistoricos, metricasAnio, PERFILES, METODOS } from '../docs/multiplos/motor.mjs';

const fx = () => JSON.parse(fs.readFileSync(new URL('./fixtures/multiplos-sintetico.json', import.meta.url), 'utf8'));
const plantilla = () => JSON.parse(fs.readFileSync(new URL('../docs/multiplos/plantilla/PLANTILLA_EXPEDIENTE.json', import.meta.url), 'utf8'));

test('percentil inclusivo, igual que PERCENTILE de Excel', () => {
  assert.equal(percentil([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(percentil([10, 20, 30, 40, 50], 0.25), 20);
  assert.equal(percentil([5], 0.75), 5);
  assert.equal(percentil([], 0.5), null);
  assert.equal(percentil([null, NaN, 3], 0.5), 3);
});

test('puente EV → equity y valor por acción', () => {
  const mk = { shares: 100, debt: 560, cash: 350, minority: 20, nonOperatingAssets: 10, optionsValue: 5, preferred: 0 };
  assert.equal(puenteEV(mk), 350 + 10 - 560 - 20 - 0 - 5);
  assert.equal(valorPorAccion('EV/EBITDA', 10, 100, mk), (1000 - 225) / 100);
  assert.equal(valorPorAccion('P/E', 10, 100, mk), 10); // los múltiplos de equity no usan el puente
  assert.equal(valorPorAccion('EV/EBITDA', 10, -5, mk), null, 'métrica negativa → N/M');
  assert.equal(valorPorAccion('EV/EBITDA', 1, 100, mk), null, 'equity ≤ 0 → N/M');
});

test('definiciones de flujo alineadas con JMR_IND de V2', () => {
  const h = fx().history, m = metricasAnio(h[1], h[0]);
  const x = h[1], tax = x.taxExpense / x.pretaxIncome, nopat = x.ebit * (1 - tax), reinv = x.capex - x.da + x.changeNWC;
  assert.ok(Math.abs(m.fcff - (nopat - reinv)) < 1e-9);
  assert.ok(Math.abs(m.fcfe - (x.netIncome - reinv + (x.debt - h[0].debt))) < 1e-9);
  assert.equal(m.ebitda, x.ebit + x.da);
});

test('el motor no depende de DCF ni de motores V2/Floyd', () => {
  const src = fs.readFileSync(new URL('../docs/multiplos/motor.mjs', import.meta.url), 'utf8');
  assert.ok(!/^\s*import\s/m.test(src), 'sin imports');
  assert.ok(!/calculateAll|JMR_DCF|despacho|wacc|terminal/i.test(src.replace(/\/\/.*$/gm, '')));
});

test('fixture: tres escenarios ordenados, cobertura total, MOS 35 % sobre Base', () => {
  const e = fx(), r = calcular(e), [c, b, o] = ['conservador', 'base', 'optimista'].map(s => r.escenarios[s].ponderado);
  assert.ok(c > 0 && c < b && b < o);
  assert.equal(r.escenarios.base.cobertura, 1);
  assert.ok(Math.abs(r.mos.precioMOS - b * 0.65) < 1e-9);
  assert.ok(Math.abs(r.brecha - (b / e.market.sharePrice - 1)) < 1e-12);
  assert.equal(r.escenarios.optimista.porMetodo['P/E'].origen, 'manual');
  assert.equal(r.escenarios.base.porMetodo['P/E'].origen, 'referencia');
  const ev = evaluar(e);
  assert.equal(ev.permitido, 'EN_REVISION');
  assert.equal(ev.resumen.bloqueos + ev.resumen.errores, 0);
});

test('el múltiplo base es la mediana de propios + comparables', () => {
  const e = fx(), r = referencias(e);
  const prop = multiplosHistoricos(e.history).map(h => h['EV/EBITDA']).filter(v => v > 0);
  const pares = e.comparables.map(p => p.evEbitda);
  assert.equal(r['EV/EBITDA'].n, prop.length + pares.length);
  assert.ok(Math.abs(r['EV/EBITDA'].p50 - percentil([...prop, ...pares], 0.5)) < 1e-12);
  assert.ok(Math.abs(calcular(e).escenarios.base.porMetodo['EV/EBITDA'].multiplo - r['EV/EBITDA'].p50) < 1e-12);
});

test('N/M: un método con métrica negativa redistribuye el peso; con poca cobertura no hay valor', () => {
  const e = fx(); e.history[e.history.length - 1].netIncome = -50; // P/E (25 %) y P/FCFE (15 %, usa la utilidad) → N/M
  let r = calcular(e);
  assert.equal(r.escenarios.base.porMetodo['P/E'].valorPorAccion, null);
  assert.equal(r.escenarios.base.porMetodo['P/FCFE'].valorPorAccion, null);
  assert.ok(Math.abs(r.escenarios.base.cobertura - 0.6) < 1e-12);
  assert.equal(r.escenarios.base.ponderado, null, '60 % < 80 % de cobertura mínima');
  assert.ok(evaluar(e).controles.some(c => c.id === 'M08'));
  assert.equal(evaluar(e).permitido, 'BLOQUEADO');
  e.pesos = { 'EV/EBITDA': 0.45, 'EV/FCFF': 0.3, 'P/E': 0.05, 'P/FCFE': 0.1, 'P/OCF': 0.1 };
  r = calcular(e);
  assert.ok(r.escenarios.base.cobertura >= 0.8 && r.escenarios.base.ponderado > 0);
});

test('controles de bloqueo: sin solicitud expresa, perfil, mercado, pesos y métodos fuera de perfil', () => {
  let e = fx(); delete e.solicitudExpresa;
  assert.ok(evaluar(e).controles.some(c => c.id === 'M01' && c.nivel === 'bloqueo'));
  assert.equal(evaluar(e).permitido, 'BLOQUEADO');
  e = fx(); e.profile = 'banco';
  assert.ok(evaluar(e).controles.some(c => c.id === 'M05'), 'EV/EBITDA no admitido para un banco');
  e = fx(); e.pesos['P/E'] = 0.5;
  assert.ok(evaluar(e).controles.some(c => c.id === 'M05'), 'pesos que no suman 100 %');
  e = fx(); e.market.shares = 0;
  assert.ok(evaluar(e).controles.some(c => c.id === 'M04'));
  e = fx(); e.profile = 'inexistente';
  assert.ok(evaluar(e).controles.some(c => c.id === 'M02'));
});

test('controles de error: múltiplo manual sin justificación, desorden de escenarios, comparables sin fuente, libro desconciliado', () => {
  let e = fx(); delete e.escenarios.optimista.justificacion['P/E'];
  assert.ok(evaluar(e).controles.some(c => c.id === 'M07'));
  assert.equal(evaluar(e).permitido, 'EN_PROCESO');
  e = fx(); e.escenarios.conservador.multiplos['P/E'] = 40; e.escenarios.conservador.justificacion['P/E'] = 'Prueba de desorden de escenarios sintética.';
  assert.ok(evaluar(e).controles.some(c => c.id === 'M09'));
  e = fx(); delete e.comparables[0].fuente;
  assert.ok(evaluar(e).controles.some(c => c.id === 'M12'));
  e = fx(); const r = calcular(e);
  e.libro = { valores: { conservador: r.escenarios.conservador.ponderado, base: r.escenarios.base.ponderado * 1.02, optimista: r.escenarios.optimista.ponderado } };
  assert.ok(evaluar(e).controles.some(c => c.id === 'M13' && c.nivel === 'error'));
  e.libro.valores.base = r.escenarios.base.ponderado * 1.004;
  assert.ok(!evaluar(e).controles.some(c => c.id === 'M13' && c.nivel === 'error'));
});

test('sin referencia suficiente y sin múltiplo manual el método queda sin valor y se avisa', () => {
  const e = fx(); e.comparables = []; e.history = e.history.slice(-3);
  const ev = evaluar(e);
  assert.ok(ev.controles.some(c => c.id === 'M06'));
  assert.ok(ev.controles.some(c => c.id === 'M11'));
});

test('la plantilla en blanco queda bloqueada, nunca con valores', () => {
  const p = plantilla(), ev = evaluar(p);
  assert.equal(ev.permitido, 'BLOQUEADO');
  assert.ok(['M01', 'M03', 'M04'].every(id => ev.controles.some(c => c.id === id)));
  assert.equal(calcular(p).escenarios.base.ponderado, null);
});

test('perfiles del contrato JSON = perfiles del motor', () => {
  const c = JSON.parse(fs.readFileSync(new URL('../docs/multiplos/metodologia/contrato-multiplos.json', import.meta.url), 'utf8'));
  assert.deepEqual(c.metodosPorPerfil, PERFILES);
  for (const lista of Object.values(PERFILES)) for (const m of lista) assert.ok(METODOS[m]);
  assert.equal(c.usaDCF, false);
  assert.equal(c.promediaConDCF, false);
  assert.equal(c.ejecucion.soloConSolicitudExpresa, true);
});
