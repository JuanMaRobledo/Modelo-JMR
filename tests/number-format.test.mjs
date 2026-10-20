import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync(new URL('../docs/jmr-number-format.js',import.meta.url),'utf8');
const research=fs.readFileSync(new URL('../docs/research.js',import.meta.url),'utf8');
const editor=fs.readFileSync(new URL('../docs/editor-hoja.js',import.meta.url),'utf8');
const reports=fs.readFileSync(new URL('../docs/jmr-report-sheets.js',import.meta.url),'utf8');
const context={};context.globalThis=context;vm.runInNewContext(js,context);
const fmt=context.JmrDisplayNumber;

test('máximo dos decimales en precios, tasas, múltiplos y grandes cantidades',()=>{
  assert.equal(fmt.format('35.151234'),'35,15');
  assert.equal(fmt.format('1.234567'),'1,23');
  assert.equal(fmt.format('12.345678%'),'12,35%');
  assert.equal(fmt.format('4.879876×'),'4,88×');
  assert.equal(fmt.format('US$ 1234.56789'),'US$ 1.234,57');
  assert.equal(fmt.formatCell({v:1234.56789,raw:{numberValue:1234.56789},w:'1,234.56789'}),'1.234,57');
  assert.equal(fmt.formatCell({v:.1234567,raw:{numberValue:.1234567},w:'12.34567%'}),'12,35%');
});
test('no se alteran fechas, fórmulas, tickers ni valores originales',()=>{
  assert.equal(fmt.format('2026'),'2026');
  assert.equal(fmt.format('1/10/2026'),'1/10/2026');
  assert.equal(fmt.format('NKE'),'NKE');
  assert.equal(fmt.format('=SUM(A1:B3)'),'=SUM(A1:B3)');
  const old={v:.1234567,raw:{numberValue:.1234567},w:'12.34567%'};
  fmt.formatCell(old);
  assert.equal(old.raw.numberValue,.1234567);
});
test('el editor nunca redondea silenciosamente ni guarda automáticamente',()=>{
  assert.match(editor,/data-initial-display/);
  assert.match(editor,/rawInput===input\.dataset\.initialDisplay/);
  assert.match(editor,/step="0\.01"/);
  assert.match(editor,/method:'PATCH'/);
  assert.match(editor,/global\.confirm\('¿Guardar/);
  assert.match(editor,/Guardar cambios en Google Sheets/);
  assert.doesNotMatch(research,/JmrModelSync\.mount\(/);
  assert.match(research,/JmrModelSync\.load\(key\)/);
});
test('vista de anexos redondea datos visibles sin modificar la hoja',()=>{
  assert.match(reports,/JmrDisplayNumber\.format\(v\)/);
  assert.match(reports,/JmrDisplayNumber\.formatTable\(destination\)/);
  assert.match(reports,/JmrDisplayNumber\.formatTable\(holder\)/);
});
