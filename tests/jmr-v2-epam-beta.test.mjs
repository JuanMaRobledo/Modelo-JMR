import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cargarMotor } from '../scripts/v2-motor.mjs';
import { evaluarExpediente, controlesDatos } from '../docs/v2/expediente-v2.mjs';
import { construirCatalogo } from '../scripts/v2-catalogo.mjs';

const m=JSON.parse(fs.readFileSync(new URL('../docs/v2/empresas/EPAM.json',import.meta.url),'utf8'));
const motor=cargarMotor();
const cerca=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`Esperado ${b}, encontrado ${a}`);

test('EPAM V2: 10 ejercicios FY completos más LTM declarado, sin inventar 2018 balance',()=>{
 assert.deepEqual(m.history.map(x=>x.year),[2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]);
 assert.match(m.history.at(-1).periodo,/LTM/);assert.equal(m.asOf,'2026-09-30');
 assert.equal(m.history.find(x=>x.year===2018).assets,undefined);
 assert.equal(m.financials.revenue,m.history.at(-1).revenue);
 assert.equal(m.financials.shares,m.history.at(-1).shares);
 assert.equal(m.financials.debt,25); assert.equal(m.financials.cash,965.173);
 assert.equal(m.fictional,false); assert.equal(m.estado,'EN_PROCESO');
});
test('EPAM V2: conciliación de impuestos y EBIT + partidas no operativas',()=>{
 const x=m.history.at(-1);
 cerca(x.ebit+x.totalNonOperatingIncome,x.pretaxIncome);
 cerca(x.pretaxIncome-x.taxExpense,x.netIncome);
 assert.equal(controlesDatos(m).filter(c=>['D06','D07','D08','D10','D11','D12'].includes(c.id)).length,0);
});
test('EPAM V2: valoración preliminar, escenarios ordenados y MOS base 35%',()=>{
 const v=motor.calculateAll(m);
 assert.equal(v.status,'CANDIDATO');
 const s=v.scenarios;
 cerca(s.conservador.perShare,130.20192178621173);
 cerca(s.base.perShare,210.69113563005644);
 cerca(s.optimista.perShare,316.6594357198547);
 cerca(s.base.mosPrice,s.base.perShare*0.65);
 assert.ok(s.conservador.perShare<s.base.perShare&&s.base.perShare<s.optimista.perShare);
});
test('EPAM V2: estados conservadores y catálogo generado coinciden',()=>{
 const ev=evaluarExpediente(m,motor);
 assert.equal(ev.permitido,'EN_REVISION');assert.equal(ev.declarado,'EN_PROCESO');assert.equal(ev.violacion,null);
 assert.deepEqual(ev.resumen,{bloqueos:0,errores:2,avisos:0});
 const {catalogo,errores}=construirCatalogo(new URL('../docs/v2',import.meta.url).pathname);
 assert.deepEqual(errores,[]);
 assert.equal(catalogo.empresas.find(x=>x.ticker==='EPAM')?.valorBase,motor.calculateAll(m).scenarios.base.perShare);
 const registrado=JSON.parse(fs.readFileSync(new URL('../docs/v2/catalogo.json',import.meta.url),'utf8'));
 assert.deepEqual(registrado,catalogo);
});
