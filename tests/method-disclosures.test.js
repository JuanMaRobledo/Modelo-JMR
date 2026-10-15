import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

test('secondary disclosures retain DCF, all method values and anchor navigation',()=>{
 const {window}=parseHTML('<html><body><main><a href="#pe">P/E</a><h2>DCF</h2><p>Valor 150</p><table><thead><tr><th>Método</th><th>Valor</th></tr></thead><tbody><tr><td>DCF Base</td><td>150</td></tr><tr><td>EV/EBITDA</td><td>200</td></tr></tbody></table><h2>Múltiplos</h2><h3 id="pe">P/E</h3><p>Comparación 210</p><h2>Riesgos</h2><p>Competencia</p></main></body></html>');
 const document=window.document;
 // linkedom lacks the HTMLTableRowElement.cells convenience property.
 document.querySelectorAll('tr').forEach(r=>Object.defineProperty(r,'cells',{get:()=>[...r.children]}));
 vm.runInNewContext(fs.readFileSync(new URL('../docs/method-details.js',import.meta.url),'utf8'),{window,document});
 const root=document.querySelector('main');
 window.JmrMethodDetails.fold(root); window.JmrMethodDetails.fold(root);
 assert.equal(root.querySelectorAll('details').length,2);
 assert.equal([...root.querySelectorAll('details')].every(d=>!d.hasAttribute('open')),true);
 assert.equal([...root.querySelectorAll('td')].find(x=>x.textContent==='DCF Base').closest('details'),null);
 assert.ok([...root.querySelectorAll('td')].find(x=>x.textContent==='EV/EBITDA').closest('details'));
 assert.match(root.textContent,/Comparación 210/); assert.match(root.textContent,/Competencia/);
 root.querySelector('a').dispatchEvent(new window.Event('click',{bubbles:true}));
 assert.equal(document.getElementById('pe').closest('details').open,true);
});

test('analysis board hides secondary values by default without changing ordinary viewers',()=>{
 const window={},document={addEventListener(){},createElement(){return {};},head:{appendChild(){}}};
 vm.runInNewContext(fs.readFileSync(new URL('../docs/valuation-board.js',import.meta.url),'utf8'),{window,document});
 const b=window.JmrValueBoard;
 const data=b.fromRecord({currency:'USD',precio:40,descuentoMultiples:{dcfHoy:{base:50,conservador:40,optimista:60},multiplosHoy:{base:70,conservador:60,optimista:80},ponderadoHoy:{base:60,conservador:50,optimista:70}}});
 const compact=b.html(data,{compactMethods:true});
 assert.match(compact,/<details class="jvb-secondary"><summary>Ver otros métodos/);
 assert.doesNotMatch(compact,/<details class="jvb-secondary" open/);
 assert.doesNotMatch(compact,/<div class="jvb-side">/);
 assert.match(compact,/US\$50/);
 assert.doesNotMatch(b.html(data),/class="jvb-secondary"/);
});
