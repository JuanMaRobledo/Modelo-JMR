const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'../docs');
const js=fs.readFileSync(path.join(root,'jmr-audit-links.js'),'utf8');
new vm.Script(js,{filename:'jmr-audit-links.js'});
class Element {
 constructor(tag='div') {this.tag=tag;this.children=[];this.attrs={};this.hidden=false;this._text='';this.href='';}
 set textContent(s) {this._text=String(s);this.children=[];}
 get textContent() {return this._text;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]||null;}
 appendChild(child){this.children.push(child);return child;}
}
function make(fetcher) {
 const win={};const document={createElement:(tag)=>new Element(tag)};
 vm.runInNewContext(js,{window:win,fetch:fetcher,document,encodeURIComponent,Error});
 return win.JmrAuditLinks;
}
const tickers=[{name:'PYPL.md',type:'file'},{name:'OLD.txt',type:'file'},{name:'MSFT.md',type:'dir'}];
const fakeFetch=async()=>({ok:true,json:async()=>tickers});
function flush(){return new Promise(resolve=>setImmediate(resolve));}
(async()=>{
  const lib=make(fakeFetch),slot=new Element();
  lib.mount(slot,'pypl');
  assert.equal(slot.children[0].hidden,true,'Mientras carga debe ocultarse el botón');
  await flush();await flush();
  assert.equal(slot.children[0].hidden,false,'PYPL tiene auditoría y debe mostrar botón');
  assert.equal(slot.children[0].href,'auditorias.html?ticker=PYPL','Enlace al ticker real');
  assert.match(slot.children[1].textContent,/No modifica la valoración/);
  lib.mount(slot,'SHAK');await flush();await flush();
  assert.equal(slot.children[0].hidden,true,'Sin informe no debe haber un link engañoso');
  assert.match(slot.children[1].textContent,/pendiente para SHAK/);
  lib.mount(slot,'PYPL');lib.mount(slot,'NKE');await flush();await flush();
  assert.equal(slot.getAttribute('data-audit-ticker'),'NKE');
  assert.equal(slot.children[0].hidden,true,'No deben aplicarse respuestas de ticker anterior');
  lib.mount(slot,'Modelo JMR');assert.equal(slot.children.length,0,'Ticker inválido oculta el botón');
  const retry=make(async()=>({ok:false,status:429})),slot2=new Element();
  retry.mount(slot2,'PYPL');await flush();await flush();
  assert.equal(slot2.children[0].hidden,false,'Ante caída remota, ofrecer el enlace al ticker correcto');
  assert.equal(slot2.children[0].href,'auditorias.html?ticker=PYPL');
  assert.match(slot2.children[1].textContent,/No se pudo comprobar/);
  const v=fs.readFileSync(path.join(root,'visor.html'),'utf8');
  const r=fs.readFileSync(path.join(root,'research.js'),'utf8');
  const rh=fs.readFileSync(path.join(root,'research.html'),'utf8');
  assert.equal((v.match(/JmrAuditLinks\.mount\(/g)||[]).length,2,'La valoración debe actualizarse al importar y al abrir un guardado');
  assert.ok(v.includes('id="jmrAuditValuation"'));
  assert.ok(r.includes("JmrAuditLinks.mount(el('jmrAuditResearch'), state.ticker)"));
  assert.ok(rh.includes('id="jmrAuditResearch"'));
  console.log('OK: vínculos contextuales, estados de auditoría, carrera de ticker y modo sin conexión');
})().catch(e=>{console.error(e);process.exit(1);});
