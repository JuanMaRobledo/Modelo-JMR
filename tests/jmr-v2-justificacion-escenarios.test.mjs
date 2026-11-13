import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { cargarMotor } from '../scripts/v2-motor.mjs';

const read=p=>fs.readFileSync(new URL('../'+p, import.meta.url),'utf8');
const m=JSON.parse(read('docs/v2/empresas/EPAM.json'));

test('EPAM documenta tres escenarios con hipótesis, contraevidencia y justificaciones',()=>{
 const keys=['tesis','crecimiento','margenes','reinversion','roic','descuento','terminal','contraevidencia','evidencia'];
 for(const escenario of ['conservador','base','optimista']){
   const x=m.justificaciones?.escenarios?.[escenario];
   assert.ok(x,escenario);
   for(const field of keys)assert.ok(typeof x[field]==='string'&&x[field].length>80,escenario+' '+field);
 }
});

test('las explicaciones no modifican los escenarios numéricos del DCF',()=>{
 const v=crearMotor(cargarMotor()).calculateAll(m);
 assert.ok(Math.abs(v.scenarios.base.perShare-210.69113563005644)<1e-7);
 assert.ok(Math.abs(v.scenarios.base.mosPrice-v.scenarios.base.perShare*0.65)<1e-7);
});
test('la pestaña muestra las razones por escenario y advierte lo que falta',()=>{
 const html=read('docs/jmr-v2.html');
 assert.match(html,/id="scenarioReasons"/);
 assert.match(html,/Estado de la evidencia/);
 assert.match(html,/Justificación específica pendiente de documentar/);
 assert.match(html,/Justificaciones transversales y limitaciones/);
});
