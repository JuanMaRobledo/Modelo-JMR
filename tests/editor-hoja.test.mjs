import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {canEditCell,validateChanges} from '../lib/model-sheet.js';

const source=fs.readFileSync(new URL('../docs/editor-hoja.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../docs/editor-hoja.html',import.meta.url),'utf8');
const sample=n=>({v:n,w:String(n),raw:{numberValue:n},formula:null});
const formula={v:90,w:'90',raw:{formulaValue:'=10*9'},formula:'=10*9'};
const sheets={
  'Input sheet':{B26:sample(.12),A26:{v:'Crecimiento',raw:{stringValue:'Crecimiento'},formula:null}},
  'Income Statement':{B2:sample(100),C2:sample(105),D2:formula,A2:{v:'Ventas',raw:{stringValue:'Ventas'}}},
  'Balance Sheet':{B2:sample(99)},
  'Cash Flow Statement':{B2:sample(77)},
  'Valuation output':{B2:sample(233)}
};
test('editor nuevo expone utilidades y se inicia sin hacer escrituras',()=>{
  const context={};context.globalThis=context;
  vm.runInNewContext(source,context);
  const editor=context.JmrSheetEditor;
  assert.ok(editor);
  assert.equal(editor.coordinates('AC20').col,29);
  assert.equal(editor.colName(29),'AC');
  assert.equal(editor.isEditable('Input sheet','B26',sample(.12),true),true);
  assert.equal(editor.isEditable('Income Statement','B2',sample(100),true),true);
  assert.equal(editor.isEditable('Balance Sheet','B2',sample(100),true),true);
  assert.equal(editor.isEditable('Cash Flow Statement','B2',sample(100),true),true);
  assert.equal(editor.isEditable('Valuation output','B2',sample(100),true),false);
  assert.equal(editor.isEditable('Income Statement','D2',formula,true),false);
  assert.equal(editor.isEditable('Income Statement','A2',sample(10),true),false);
  assert.equal(editor.isEditable('Input sheet','B26',sample(.12),false),false);
  assert.equal(editor.formatNumber({w:'12.0%',raw:{numberValue:.12}},.12).value,12);
});
test('API guarda entradas y fuentes originales, sin editar fórmulas o resultados',()=>{
  const changes=[
    {sheet:'Input sheet',cell:'B26',previous:.12,value:.13},
    {sheet:'Income Statement',cell:'B2',previous:100,value:110},
    {sheet:'Cash Flow Statement',cell:'B2',previous:77,value:80}
  ];
  assert.deepEqual(validateChanges(sheets,changes),[
    {range:"'Input sheet'!B26",values:[[.13]]},
    {range:"'Income Statement'!B2",values:[[110]]},
    {range:"'Cash Flow Statement'!B2",values:[[80]]}
  ]);
  for(const bad of [
    {sheet:'Valuation output',cell:'B2',previous:233,value:240},
    {sheet:'Income Statement',cell:'D2',previous:90,value:100},
    {sheet:'Income Statement',cell:'A2',previous:'Ventas',value:50},
    {sheet:'Income Statement',cell:'B2',previous:1,value:110},
    {sheet:'Input sheet',cell:'B26',previous:.12,value:Infinity},
    {sheet:'Input sheet',cell:'B26',previous:.12,value:'=1+1'}
  ])assert.throws(()=>validateChanges(sheets,[bad]));
  assert.throws(()=>validateChanges(sheets,[changes[0],changes[0]]));
});
test('pestaña visible, todas las hojas disponibles, guardado explícito',()=>{
  assert.match(html,/<title>Editor de hoja/);
  assert.match(html,/id="sheetPicker"/);
  assert.match(html,/id="sheetTable"/);
  assert.match(html,/id="saveChanges"/);
  assert.match(html,/id="pendingList"/);
  assert.match(html,/id="nativeSheet"/);
  assert.match(source,/JmrModelSync\.load\(key\)/);
  assert.match(source,/method:'PATCH'/);
  assert.match(source,/snapshot\.revision,changes/);
  assert.match(source,/global\.confirm\('¿Guardar/);
  assert.doesNotMatch(source,/google(?:-|_)service(?:-|_)account/i);
});
