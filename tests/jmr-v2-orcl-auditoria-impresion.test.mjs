import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('docs/jmr-v2.html');
const editor=read('docs/v2/editor-analisis.mjs');
const audit=read('docs/v2/auditoria-notas.mjs');
const analysis=JSON.parse(read('docs/v2/analisis/ORCL.json'));
const model=JSON.parse(read('docs/v2/empresas/ORCL.json'));
test('Oracle: veinte capítulos con editor, fuentes y valor del DCF intacto',()=>{
 const text=Object.values(analysis.blocks).join(' ');
 for(let chapter=1;chapter<=20;chapter++)assert.match(text,new RegExp('<h3>'+chapter+'\\.'));
 assert.equal(analysis.ticker,'ORCL');
 assert.equal(model.libro.valores.base,55.6560059420807);
 assert.equal(model.libro.valores.conservador,5.06884037140071);
 assert.equal(model.libro.valores.optimista,143.714427565269);
 assert.match(model.documentLinks.workbook,/^https:\/\/docs\.google\.com\/spreadsheets\//);
 assert.match(model.documentLinks.annualReportsFolder,/^https:\/\/drive\.google\.com\/drive\/folders\//);
 assert.deepEqual(model.annualReportDocuments.map(x=>x.fy),[2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]);
 assert.ok(model.annualReportDocuments.every(x=>x.kind==='10-K'&&x.url.startsWith('https://drive.google.com/file/d/')));
 assert.equal(model.quarterlyReportDocuments[0].periodEnd,'2026-08-31');
 assert.match(html,/annualReportList/);
 assert.match(html,/analysisSourceLink/);
 assert.match(editor,/analysisToc/);
 assert.match(editor,/contentEditable/);
});
test('Todas las empresas: imprimir expediente completo en lugar de la pestaña activa',()=>{
 assert.match(html,/id="printFull"/);
 assert.match(html,/window\.print\(\)/);
 assert.match(html,/#appContent:not\(\[hidden\]\) \[data-v2-tab\]\[hidden\]\{display:block!important\}/);
 assert.match(html,/\.v2-editor-bar.*display:none!important/s);
 for(const t of ['incomeTable','balanceTable','cashflowTable'])assert.match(html,new RegExp('id="'+t+'"'));
});
test('Auditoría: notas locales y solicitud reproducible sin autoaprobación',()=>{
 assert.match(html,/id="auditNotesHost"/);
 assert.match(html,/montarCuadernoAuditoria\(model/);
 for(const s of ['localStorage.setItem','Exportar notas JSON','Importar notas','Preparar solicitud de nueva valoración','jmr-v2-solicitud-revaloracion-1','financials:model.financials','assumptions:model.assumptions','auditEntries:data.entries'])assert.ok(audit.includes(s),s);
 assert.doesNotMatch(audit,/fetch\(|auditoriaUsuario\s*=|APROBADA'/);
 assert.match(audit,/Adjunta este archivo a tu conversación/);
});
test('Sintaxis de componentes de auditoría y editor',()=>{
 for(const file of ['docs/v2/auditoria-notas.mjs','docs/v2/editor-analisis.mjs']){
  const r=spawnSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
 }
});
