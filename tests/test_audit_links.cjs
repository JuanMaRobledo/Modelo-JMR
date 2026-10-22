const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'../docs');
const js=fs.readFileSync(path.join(root,'jmr-audit-links.js'),'utf8');
new vm.Script(js,{filename:'jmr-audit-links.js'});
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this._text='';this.href='';}
 set textContent(s){this._text=String(s);this.children=[];}
 get textContent(){return this._text;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 getAttribute(k){return this.attrs[k]||null;}
 appendChild(child){this.children.push(child);return child;}
}
const win={};
const document={createElement:(tag)=>new Element(tag)};
vm.runInNewContext(js,{window:win,document,encodeURIComponent,Error});
const lib=win.JmrAuditLinks,slot=new Element();
assert.equal(lib.normalize(' nflx '),'NFLX');
lib.mount(slot,'nflx');
assert.equal(slot.children.length,2,'Link y descripción contextual');
assert.equal(slot.children[0].href,'auditoria-integral.html?ticker=NFLX','Ruta integral correcta');
assert.match(slot.children[0].textContent,/auditoría integral/i);
assert.match(slot.children[1].textContent,/DCF/);
assert.match(slot.children[1].textContent,/Múltiplos/);
assert.equal(slot.getAttribute('data-audit-ticker'),'NFLX');
lib.mount(slot,'SHAK');
assert.equal(slot.children[0].href,'auditoria-integral.html?ticker=SHAK','Sin auditoría publicada aún, la vista muestra pendientes');
assert.equal(slot.getAttribute('data-audit-ticker'),'SHAK','No reutilizar ticker anterior');
lib.mount(slot,'Modelo JMR');
assert.equal(slot.children.length,0,'Ticker inválido oculta el botón');
const v=fs.readFileSync(path.join(root,'visor.html'),'utf8');
const r=fs.readFileSync(path.join(root,'research.js'),'utf8');
const rh=fs.readFileSync(path.join(root,'research.html'),'utf8');
assert.equal((v.match(/JmrAuditLinks\.mount\(/g)||[]).length,2,'Visor enlaza al importar y al abrir un guardado');
assert.ok(v.includes('id="jmrAuditValuation"'));
assert.ok(r.includes("JmrAuditLinks.mount(el('jmrAuditResearch'), state.ticker)"));
assert.ok(rh.includes('id="jmrAuditResearch"'));
const full=fs.readFileSync(path.join(root,'auditoria-integral.html'),'utf8');
assert.ok(full.includes('id="tecnico"')&&full.includes('id="economico"')&&full.includes('id="multiplos"'),'La vista debe contener los tres módulos');
assert.ok(full.includes('disrupcionSeparada')&&full.includes('active.reduce'),'El promedio conserva la disrupción como estrés excluido');
assert.ok(full.includes('no sustituyen'),'No se debe presentar la conciliación de JSON como auditoría completa de Sheets');
const inline=[...full.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(Boolean);
assert.ok(inline.length>0);
for(const source of inline)new vm.Script(source,{filename:'auditoria-integral-inline.js'});
console.log('OK: vínculos integrales por empresa, sintaxis y separación de tres controles');
