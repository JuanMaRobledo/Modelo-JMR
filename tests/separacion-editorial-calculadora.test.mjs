import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';

const research=readFileSync(new URL('../docs/research.js',import.meta.url),'utf8');
const researchPage=readFileSync(new URL('../docs/research.html',import.meta.url),'utf8');
const calculator=readFileSync(new URL('../docs/calculadora.html',import.meta.url),'utf8');
const modelSync=readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8');

test('scripts de análisis y simulación válidos',()=>{
  new Function(research);new Function(modelSync);
  for(const [,script] of calculator.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
    if(script.trim())new Function(script);
  }
});

test('los dos niveles viven en Análisis Fundamental, sin perder tablas ni sensibilidad',()=>{
  const render=research.split('function renderPreview()')[1].split('// Edición directa del análisis')[0];
  assert.match(render,/NIVEL 1 · ANÁLISIS FUNDAMENTAL/);
  assert.match(render,/NIVEL 2 · VALORACIÓN, ESTADOS FINANCIEROS Y SENSIBILIDADES/);
  assert.match(render,/buildLinkedValuationHtml\(state\.linkedValuation\)/);
  assert.match(render,/state\.calculationHtml/);
  assert.match(render,/Operaciones, fórmulas y conciliaciones del expediente/);
  assert.match(render,/Estados financieros, ratios, escenarios y matrices de sensibilidad/);
  assert.match(render,/JmrReportSheets\.mount\(appendix,state\.linkedValuation\)/);
  assert.match(researchPage,/jmr-report-sheets\.js/);
  assert.match(researchPage,/jmr-report-sheets\.css/);
});

test('las tablas voluminosas son desplegables y se montan únicamente al abrirse',()=>{
  const render=research.split('function renderPreview()')[1].split('// Edición directa del análisis')[0];
  assert.match(render,/jmr-financial-appendix/);
  assert.match(render,/appendix\.open/);
  assert.match(render,/appendix\.addEventListener\('toggle',mountQuantitative\)/);
});

test('la Calculadora DCF solo simula, sin montar un editor de la hoja',()=>{
  assert.match(calculator,/Simular sensibilidad \(no guarda\)/);
  assert.match(calculator,/id="restoreSimulation"/);
  assert.match(calculator,/baselineSnapshot=snapshot/);
  assert.match(calculator,/calcularModeloJMR\(inp\)/);
  assert.doesNotMatch(calculator,/JmrModelSync\.mount\(/);
  assert.doesNotMatch(calculator,/JmrReportSheets\.mount\(/);
  assert.doesNotMatch(calculator,/data-sync-cell/);
  assert.match(calculator,/ningún cambio se guarda/);
});

test('limpieza no destructiva: Nivel 1 conserva razonamiento y tablas cualitativas',()=>{
  const start=research.indexOf('function articleForReading(html, ticker)');
  const end=research.indexOf('function navigableAnalysis(',start);
  assert.ok(start>0&&end>start);
  class DOMParser{
    parseFromString(markup){return parseHTML('<html><body>'+markup+'</body></html>').document;}
  }
  const f=runInNewContext(research.slice(start,end)+'\narticleForReading',{
    DOMParser,safeHtml:s=>s,
    normalizeText:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  });
  const html='<!--jmr-cierre-start--><section><h2>Valoración vigente</h2><table><tr><td>1</td></tr></table></section><!--jmr-cierre-end-->'+
    '<h2>1. Resumen ejecutivo</h2><p>Ventaja competitiva y tesis alcista documentada.</p>'+
    '<p><a href="#calculo-nke-2">Ver cálculo</a></p>'+
    '<table><tr><th>Riesgo</th><th>Evidencia</th></tr><tr><td>Innovación</td><td>Competidores fuertes</td></tr></table>'+
    '<table><tr><th>Dato</th><th>FY</th></tr><tr><td>1</td><td>20</td></tr><tr><td>2</td><td>30</td></tr></table>';
  const result=f(html,'NKE');
  assert.match(result,/Resumen ejecutivo/);
  assert.match(result,/Ventaja competitiva y tesis alcista/);
  assert.match(result,/Competidores fuertes/);
  assert.doesNotMatch(result,/Valoración vigente|Ver cálculo|<td>30<\/td>/i);
});
