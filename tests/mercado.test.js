import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../docs/mercado.js', import.meta.url), 'utf8');
function app(url) {
  const location = new URL(url), nodes = {};
  const node = () => ({innerHTML:'', textContent:'', setAttribute(){}, after(n){nodes[n.id]=n;}});
  const nav = node(), heading = node();
  const document = {querySelector(s){return s === 'h1' ? heading : nav;}, getElementById(id){return nodes[id];}, createElement:node, head:{appendChild(){}}, addEventListener(_,fn){this.ready=fn;}};
  const window = {}, history = {replaceState(_,__,value){history.url=value;}};
  vm.runInNewContext(source,{window,location,document,history,URL,URLSearchParams});
  document.ready();
  return {window,nav,heading,history,nodes};
}
test('Colombia recognizes legacy tickers, metadata and dossiers; ADRs remain international', () => {
  const {window:w}=app('https://jmr.test/visor.html');
  for (const r of [{currency:'cop'},{ticker:'PFGRUPSURA'},{ticker:'PFGRUPOARG.CL'},{market:'CO'},{market:'BVC'},{ticker:'PFDAVIGRP.CL'},{remotePath:'colombia/expedientes/old.json'}]) assert.equal(w.jmrEsCOP(r),true);
  for (const r of [{ticker:'AAPL'},{ticker:'EC'},{ticker:'CIB'},{ticker:'MSFT',currency:'USD'},{ticker:'SQM',market:'Chile'}]) assert.equal(w.jmrEsCOP(r),false);
});
test('libraries form disjoint complete market partitions', () => {
 const records=[{ticker:'PFGRUPSURA'},{ticker:'AAPL'},{currency:'COP'},{market:'CO'},{ticker:'MSFT'}];
 const a=app('https://jmr.test/research.html').window, b=app('https://jmr.test/research.html?mercado=colombia').window;
 assert.equal(records.filter(a.jmrDelMercado).length,2); assert.equal(records.filter(b.jmrDelMercado).length,3);
 for(const r of records) assert.notEqual(a.jmrDelMercado(r),b.jmrDelMercado(r));
});
test('menú central concentra empresas, cartera, herramientas e histórico, sin duplicar páginas',()=>{
 const a=app('https://jmr.test/research.html?mercado=colombia&ticker=PFGRUPSURA');
 const nav=a.nav.innerHTML;
 assert.match(nav,/Empresas y análisis/);
 assert.match(nav,/Cartera/);
 assert.match(nav,/Herramientas/);
 assert.match(nav,/Histórico/);
 assert.match(nav,/Bitácora de terceros/);
 assert.match(nav,/jmr-tools-menu/);
 assert.doesNotMatch(nav,/Expedientes JMR|Valoraciones internacionales|Valoraciones Colombia/);
 assert.doesNotMatch(nav,/ticker=/);
});

test('opening legacy direct record selects its market and preserves deep link',()=>{
 const a=app('https://jmr.test/visor.html?path=valoraciones%2FSURA.json#saved');
 a.window.jmrAjustarMercado({ticker:'PFGRUPSURA'});
 assert.equal(a.window.JMR_MERCADO,'colombia');
 assert.match(a.history.url,/path=valoraciones%2FSURA.json&mercado=colombia#saved/);
 assert.match(a.heading.textContent,/Colombia/);
 a.window.jmrAjustarMercado({ticker:'AAPL'});
 assert.equal(a.window.JMR_MERCADO,'internacional'); assert.doesNotMatch(a.history.url,/mercado=/);
});
test('Colombia conserva clasificación y evita crear una segunda barra global',()=>{
 const a=app('https://jmr.test/colombia.html');
 assert.equal(a.window.JMR_MERCADO,'colombia');
 assert.match(a.nav.innerHTML,/Empresas y análisis/);
 assert.doesNotMatch(a.nav.innerHTML,/Valoraciones Colombia/);
});

test('herramientas conservan enlaces independientes sin añadir otro menú de empresa',()=>{
 for(const page of ['portafolio.html','mi-bitacora.html','calculadora.html']) {
   const a=app('https://jmr.test/'+page+'?mercado=colombia');
   assert.match(a.heading.textContent,/Colombia/);
   assert.match(a.nav.innerHTML,new RegExp('href="'+page.replace('.','\\.')+'\\?mercado=colombia"'));
   assert.match(a.nav.innerHTML,/jmr-tools-links/);
   assert.doesNotMatch(a.nav.innerHTML,/Expedientes JMR/);
 }
});

test('joined portfolio and derived journal records retain Colombian metadata',()=>{
 const w=app('https://jmr.test/portafolio.html?mercado=colombia').window;
 for(const r of [{ticker:'NEW',visor:{currency:'COP'}},{ticker:'NEW',valoracionActual:{market:'BVC'}},{ticker:'NEW',research:{market:'CO'}}]) assert.equal(w.jmrDelMercado(r),true);
 assert.equal(w.jmrMercadoHref('research.html?ticker=NEW',{ticker:'NEW',currency:'COP'}),'research.html?ticker=NEW&mercado=colombia');
 assert.equal(w.jmrMercadoHref('research.html?ticker=EC',{ticker:'EC',currency:'USD'}),'research.html?ticker=EC');
});

test('catálogo único filtra los dos mercados, no abre otra portada de valoraciones',()=>{
 const a=app('https://jmr.test/expediente.html?seccion=analisis&mercado=internacional');
 const b=app('https://jmr.test/expediente.html?seccion=analisis&mercado=colombia');
 assert.match(a.nav.innerHTML,/Empresas y análisis/);
 assert.match(b.nav.innerHTML,/Empresas y análisis/);
 assert.match(a.heading.textContent,/Internacionales/);
 assert.match(b.heading.textContent,/Colombia/);
 assert.doesNotMatch(a.nav.innerHTML,/Valoraciones internacionales/);
});
