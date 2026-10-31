import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const display=read('docs/jmr-number-format.js'),present=read('docs/jmr-sheet-presentation.js'),editor=read('docs/editor-hoja.js');
const view=read('docs/editor-hoja.html'),styles=read('docs/editor-hoja.css'),api=read('lib/model-sheet.js');
function context(){const v={};v.globalThis=v;vm.runInNewContext(display,v);vm.runInNewContext(present,v);vm.runInNewContext(editor,v);return v;}
const cell=(value,format)=>({v:value,w:format??String(value),raw:{stringValue:String(value)},formula:null});
test('visor financiero muestra datos nativos por secciones sin convertirlos a entradas',()=>{
 const v=context();
 const input={
  A1:cell('Estado de resultados'),A2:cell('Ingresos'),B2:cell(1200,'1.200,00'),C2:cell(1250,'1.250,00'),
  A3:cell('Costos'),B3:cell(-450,'-450,00'),C3:cell(-475,'-475,00'),
  A5:cell('Flujos operativos'),A6:cell('Flujo de caja'),B6:cell(350,'350,00'),
  A7:cell('<img src=x onerror=alert(1)>'),B7:cell(12,'12,00')
 };
 const html=v.JmrSheetPresentation.render('Income Statement',input);
 assert.match(html,/PRESENTACIÓN · SOLO LECTURA/);
 assert.match(html,/Estado de resultados/);
 assert.match(html,/Flujos operativos/);
 assert.match(html,/1.200,00/);
 assert.match(html,/-475,00/);
 assert.match(html,/&lt;img src=x/);
 assert.doesNotMatch(html,/<img src=x|<input|contenteditable|Guardar cambios/);
 assert.match(html,/Fila 6/);
});
test('presentación extensa indica límite pero el editor ofrece la cuadrícula original',()=>{
 const v=context(),rows={};
 for(let i=1;i<=240;i++){rows['A'+i]=cell('Concepto '+i);rows['B'+i]=cell(i);}
 const html=v.JmrSheetPresentation.render('Income Statement',rows,{maxRows:10});
 assert.match(html,/10 filas adicionales|filas adicionales/);
 assert.match(html,/Cuadrícula completa/);
 assert.equal((html.match(/<tr>/g)||[]).length,11);
 assert.match(view,/id="toggleSourceGrid"/);
 assert.match(view,/id="sourceGridPanel"/);
 assert.match(styles,/jmr-view-only:not\(.jmr-show-grid\) #sourceGridPanel/);
});
test('edición en Drive abre pestaña solo con sheetId verificado, sin construir gid falso',()=>{
 const v=context(),url='https://docs.google.com/spreadsheets/d/abcDef_123/edit?usp=sharing';
 const link=v.JmrSheetEditor.nativeSheetUrl;
 assert.equal(link(url,'Balance Sheet',{'Balance Sheet':12345}), 'https://docs.google.com/spreadsheets/d/abcDef_123/edit#gid=12345');
 assert.equal(link(url,'Income Statement',{'Income Statement':0}), 'https://docs.google.com/spreadsheets/d/abcDef_123/edit#gid=0');
 assert.equal(link(url,'Ingresos',{'Balance Sheet':12345}), 'https://docs.google.com/spreadsheets/d/abcDef_123/edit');
 assert.equal(link(url,'Ingresos',{'Ingresos':'1'}), 'https://docs.google.com/spreadsheets/d/abcDef_123/edit');
 assert.equal(link('https://evil.com/spreadsheets/d/abc','Balance Sheet',{'Balance Sheet':5}), '');
 assert.equal(link('javascript:alert(1)','Balance Sheet',{'Balance Sheet':5}), '');
 assert.match(api,/properties\(title,sheetId\)/);
 assert.match(api,/sheetGids/);
});
test('modo visor impide PATCH pero edición conserva guardado con confirmación y conflictos',()=>{
 assert.match(editor,/const forceViewer=.*get\('modo'\)==='visor'/);
 assert.match(editor,/!forceViewer&&isEditable/);
 assert.match(editor,/if\(forceViewer\|\|!snapshot\?\.writable\|\|busy\|\|!drafts.size\)return/);
 assert.match(editor,/method:'PATCH'/);
 assert.match(editor,/global.confirm\('¿Guardar/);
 assert.match(editor,/if\(data\.sheets\[c\.sheet\]/);
 assert.match(view,/id="nativeSheet"/);
 assert.match(view,/id="saveChanges"/);
 assert.match(view,/jmr-sheet-presentation.js/);
});
