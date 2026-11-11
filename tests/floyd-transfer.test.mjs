import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { validateManifest, planStage, verifyApplied, CONTRACT } from '../lib/floyd-transfer.js';

const ids=Object.fromEntries(['H','D-B','D-C','D-O','M'].map((b,i)=>[b,('book'+i).padEnd(30,'Z')]));
function manifest(){return {revisionId:'CELH-REBOOT-3T26-R1',contratoLibros:CONTRACT,books:{...ids},transfers:[
{stage:'H_TO_D',to:{book:'D-B',sheet:'Input sheet',cell:'B11'},terms:[{book:'H',sheet:'Income Statement',cell:'L3'}]},
{stage:'H_TO_D',to:{book:'D-B',sheet:'Input sheet',cell:'B14'},terms:[
 {book:'H',sheet:'Balance Sheet',cell:'L34'}, {book:'H',sheet:'Entradas históricas auxiliares',cell:'L5'}]}
]};}
function snapshots(){return {
H:{revision:'shaH',sheets:{'Income Statement':{L3:{v:3169.396,raw:{numberValue:3169.396}}},
'Balance Sheet':{L34:{v:1275.368,raw:{numberValue:1275.368}}},
'Entradas históricas auxiliares':{L5:{v:1759.975,raw:{numberValue:1759.975}}}}},
'D-B':{revision:'shaB',sheets:{'Input sheet':{B11:{v:3169.396,raw:{numberValue:3169.396}},B14:{v:3035.343,raw:{numberValue:3035.343}}}}}
};}
test('CELH: historicos a entrada B11 y patrimonio B14 sumado sin tocar formulas',()=>{
 const m=manifest(),p=planStage(m,snapshots(),'H_TO_D');
 assert.equal(p.updates.length,2);
 assert.deepEqual(p.updates.map(x=>x.value),[3169.396,3035.343]);
 assert.match(p.signature,/^[a-f0-9]{64}$/);
 assert.deepEqual(verifyApplied(p,snapshots()).success,true);
});
test('La huella cambia cuando cambia la fuente o el mapeo',()=>{
 const a=planStage(manifest(),snapshots(),'H_TO_D');
 const b=snapshots();b.H.sheets['Income Statement'].L3.v=3100;
 const c=planStage(manifest(),b,'H_TO_D');
 assert.notEqual(a.signature,c.signature);
});
test('Prohibido reescribir celda con formula del motor',()=>{
 const x=snapshots();x['D-B'].sheets['Input sheet'].B11={v:1,formula:'=A1',raw:{formulaValue:'=A1'}};
 assert.throws(()=>planStage(manifest(),x,'H_TO_D'),/PROTECCION/);
});
test('No permite transferir directamente resultados del motor ni a la plantilla',()=>{
 const m=manifest();m.transfers[0].to={book:'D-B',sheet:'Valuation output',cell:'B33'};
 assert.throws(()=>validateManifest(m),/destino no autorizado/);
});
test('Bloquea libros duplicados, factores no autorizados, repeticiones y etapas vacias',()=>{
 const m=manifest();m.books.M=m.books.H;assert.throws(()=>validateManifest(m),/duplicados/);
 const n=manifest();n.transfers[0].terms[0].factor=0.3;assert.throws(()=>validateManifest(n),/factor/);
 const d=manifest();d.transfers.push({...d.transfers[0]});assert.throws(()=>validateManifest(d),/duplicado/);
 assert.throws(()=>planStage(manifest(),snapshots(),'H_TO_M'),/etapa sin mapeos/);
});
test('Verifica lecturas posteriores y rechaza transferencia parcial',()=>{
 const p=planStage(manifest(),snapshots(),'H_TO_D');
 const b=snapshots();b['D-B'].sheets['Input sheet'].B14.v=99;
 assert.throws(()=>verifyApplied(p,b),/cambio no confirmado/);
});

test('Manifiesto real CELH usa sólo entradas autorizadas y nunca copia precio DCF pre-Pepsi',()=>{
 const raw=readFileSync(new URL('../docs/floyd-sync-manifests/CELH-REBOOT-3T26-R1.json',import.meta.url),'utf8');
 const m=JSON.parse(raw);
 assert.equal(validateManifest(m),true);
 assert.equal(m.transfers.length,650);
 assert.deepEqual([...new Set(m.transfers.map(t=>t.stage))],['H_TO_D','H_TO_M','D_TO_M','RESULTS_TO_DB']);
 assert.equal(m.transfers.some(t=>t.stage==='D_TO_M'&&t.to.cell.endsWith('5')),false);
 assert.equal(m.transfers.some(t=>t.stage==='RESULTS_TO_DB'&&['C5','E5','D5'].includes(t.to.cell)),false);
 assert.equal(m.transfers.some(t=>t.to.book==='H'),false);
});
