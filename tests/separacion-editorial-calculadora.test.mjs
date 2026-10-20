import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';

const research=readFileSync(new URL('../docs/research.js',import.meta.url),'utf8');
const calculator=readFileSync(new URL('../docs/calculadora.html',import.meta.url),'utf8');
const modelSync=readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8');

test('los scripts siguen siendo JavaScript válido',()=>{
  new Function(research);
  new Function(modelSync);
  const inline=[...calculator.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
  inline.forEach(code=>new Function(code));
});

test('el artículo no monta hojas ni reproduce cálculo técnico',()=>{
  const render=research.split('function renderPreview()')[1].split('// Edición directa del análisis')[0];
  assert.doesNotMatch(render,/JmrReportSheets\.mount\(/);
  assert.doesNotMatch(render,/calculationView\.body/);
  assert.match(render,/articleForReading\(baseHtml,state\.ticker\)/);
  assert.match(render,/calculatorLink\(state\.ticker\)/);
});

test('la calculadora ofrece anexos a demanda tras cargar un ticker',()=>{
  assert.match(calculator,/id="showWorkbookDetails"/);
  assert.match(calculator,/id="calcWorkbookDetails" hidden/);
  assert.match(calculator,/JmrReportSheets\.mount\(panel,canonicalForSheets\)/);
  assert.match(calculator,/if\(initialTicker\)[\s\S]*?runLookup\(\)/);
  assert.match(modelSync,/host\.innerHTML='<details><summary>Datos de la hoja/);
});

test('limpieza no destructiva: se ocultan cifras duplicadas, se conserva la tesis',()=>{
  const start=research.indexOf('function articleForReading(html, ticker)');
  const end=research.indexOf('function navigableAnalysis(',start);
  assert.ok(start>0 && end>start);
  class DOMParser {
    parseFromString(markup){return parseHTML('<html><body>'+markup+'</body></html>').document;}
  }
  const f=runInNewContext(research.slice(start,end)+'\narticleForReading',{
    DOMParser,safeHtml:s=>s,
    normalizeText:s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  });
  const html='<!--jmr-cierre-start--><section><h2>Valoración vigente</h2><table><tr><td>1</td></tr></table></section><!--jmr-cierre-end-->'+
    '<h2>1. Resumen ejecutivo</h2><p>Ventaja competitiva contrastada.</p>'+
    '<p><a href="#calculo-nke-2">Ver cálculo</a></p>'+
    '<table><tr><th>Dato</th><th>FY</th></tr><tr><td>1</td><td>20</td></tr><tr><td>2</td><td>30</td></tr></table>';
  const result=f(html,'NKE');
  assert.match(result,/Resumen ejecutivo/);
  assert.match(result,/Ventaja competitiva contrastada/);
  assert.doesNotMatch(result,/Valoración vigente|Ver cálculo|<table/i);
});
