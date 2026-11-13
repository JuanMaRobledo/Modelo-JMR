import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../docs/jmr-v2.html',import.meta.url),'utf8');
const nav=readFileSync(new URL('../docs/mercado.js',import.meta.url),'utf8');
test('JMR V2 stays independent of Floyd datasets and points to one own page',()=>{
 assert.match(nav,/link\('jmr-v2\.html','JMR V2\.0'/);
 assert.match(html,/<title>Vista previa · Modelo JMR V2\.0/);
 assert.match(html,/const JMR_DEMO=/);
 assert.match(html,/SIMULACIÓN|SIMULACI[ÓO]N/);
 assert.match(html,/paridad con (?:el )?Ginsu original/i);
 assert.doesNotMatch(html,/Modelo-JMR-datos\/catalogo\.json/);
 assert.doesNotMatch(html,/\/api\/model[?']/);
});
test('JMR V2 loads standalone and shared navigation without external JS',()=>{
 assert.match(html,/<script src="mercado\.js" defer><\/script>/);
 assert.match(html,/<script type="module">/);
 assert.match(html,/const \{calculateAll, SCENARIOS, terminalSensitivity\}=JMR_DCF/);
 assert.match(html,/id="uploadFile"/);
 assert.match(html,/id="loadDemo"/);
});
