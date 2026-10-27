import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {canEditCell,validateChanges} from '../lib/model-sheet.js';

const formatter=fs.readFileSync(new URL('../docs/jmr-number-format.js',import.meta.url),'utf8');
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
  vm.runInNewContext(formatter,context);
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
  assert.equal(editor.formatNumber({w:'12.123456%',raw:{numberValue:.12123456}},.12123456).value,12.12);
  assert.equal(context.JmrDisplayNumber.format('123.456789'),'123,46');
  assert.equal(context.JmrDisplayNumber.format('18.234567%'),'18,23%');
  assert.equal(context.JmrDisplayNumber.formatCell({w:'4,987654×',v:4.987654}),'4,99×');
  assert.equal(context.JmrDisplayNumber.editValue(.1234567,100),12.35);

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
  assert.match(html,/<title>Hojas del modelo/);
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

test('cuatro accesos abren hojas reales sin crear datos ni hojas ficticias',()=>{
  const context={};context.globalThis=context;vm.runInNewContext(formatter,context);vm.runInNewContext(source,context);
  const {findMainSheet,mainKind}=context.JmrSheetEditor;
  const names=['Income Statement','Input sheet','Valuation output','Descuento de múltiplos','Financial Multiples','P/E','P/S'];
  assert.equal(findMainSheet('input',names),'Input sheet');
  assert.equal(findMainSheet('valuation',names),'Valuation output');
  assert.equal(findMainSheet('multiples',names),'Descuento de múltiplos');
  assert.equal(findMainSheet('financial',names),'Financial Multiples');
  assert.equal(findMainSheet('financial',['Input sheet','Financials Multiples']),'Financials Multiples');
  assert.equal(mainKind('Financials Multiples'),'financial');
  assert.equal(mainKind('P/E'),'multiples');
  assert.equal(mainKind('Financial Multiples'),'financial');
  assert.equal(findMainSheet('financial',['Input sheet','Valuation output']),'');
  assert.equal(findMainSheet('multiples',['Input sheet','Valuation output','P/E']),'P/E');
  for(const name of ['input','valuation','multiples','financial'])assert.match(html,new RegExp('data-sheet-kind="'+name+'"'));
});

test('la vista íntegra permite consultar fórmulas sin crear un cálculo paralelo',()=>{
  for(const id of ['cellInspector','inspectorFormula','inspectorValue','modelSheetTabs','toggleFullSheet','rangeToolbar'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(source,/MAX_FULL_CELLS\s*=\s*30000/);
  assert.match(source,/var all=fullSheet&&canFull/);
  assert.match(source,/var endRow=all\?max.row:/);
  assert.match(source,/var endCol=all\?max.col:/);
  assert.match(source,/c\?\.formula\|\|'—/);
  assert.match(source,/fullSheet=false;table\(\)/);
  assert.match(source,/method:'PATCH'/);
  assert.match(source,/isEditable\(selected,address,c,!!snapshot.writable\)/);
});

test('los siete múltiplos se verifican contra fórmulas reales de Sheets, no solo precios guardados',()=>{
  const context={};context.globalThis=context;vm.runInNewContext(formatter,context);vm.runInNewContext(source,context);
  const check=context.JmrSheetEditor.multiplesFormulaAudit;
  const sheet={'Descuento de múltiplos':{},PV:{},PBV:{}};
  ['J20','J21','J22','J23','J24'].forEach((address,i)=>sheet['Descuento de múltiplos'][address]={v:i+10,formula:'=B'+(i+20)});
  sheet.PV.E42={v:35,formula:'=A42*B42'};
  sheet.PBV.E42={v:40,formula:'=A42*B42'};
  assert.equal(check(sheet).filter(x=>x.hasFormula&&x.hasValue).length,7);
  sheet.PBV.E42={v:40,formula:null};
  assert.equal(check(sheet).filter(x=>x.hasFormula&&x.hasValue).length,6);
  assert.equal(check(sheet).find(x=>x.method==='P/BV').hasFormula,false);
});
