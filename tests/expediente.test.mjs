import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const get = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('index redirige al análisis, sin borrar la bitácora de terceros', () => {
  assert.match(get('docs/index.html'), /location\.replace\("research\.html"/);
  const third = get('docs/bitacora-terceros.html');
  assert.match(third, /Bitácora de terceros/);
  assert.match(third, /55 hipótesis de inversión/);
  assert.match(third, /var DATA = \[\{/);
});

test('expediente muestra cinco secciones y protege estados', () => {
  const html = get('docs/expediente.html');
  for (const view of ['valoracion','analisis','supuestos','auditoria','sensibilidades']) {
    assert.match(html, new RegExp('data-view="'+view+'"'));
  }
  const js=get('docs/expediente.js');
  new Script(js);
  for(const page of ['visor.html','research.html','editor-hoja.html','auditoria-integral.html','auditoria-multiplos.html']) {
    assert.ok(js.includes(page), 'Falta '+page);
  }
  assert.match(js,/cat[aá]logo oficial|catálogo oficial/);
  assert.match(js,/NO republica|no se presenta como validada/i);
  assert.match(js,/auditorias\.html\?ticker=/);
  assert.match(js,/auditoria-multiplos\.html\?ticker=/);
  assert.match(html,/data-sensitivity="sensibilidades"/);
  assert.match(html,/data-sensitivity="sensibilidadMultiples"/);
  assert.match(html,/data-audit="auditoriaIntegral"/);
});

test('resuelve auditoría narrativa .md exacta, no la confunde con JSON',()=>{
  const js=get('docs/expediente.js');
  const source=js.match(/function fromCatalog\([\s\S]*?\n(?=function status)/)?.[0];
  assert.ok(source,'extractor fromCatalog ausente');
  const fn=new Function(source+'; return fromCatalog;')();
  assert.equal(fn(['auditorias/narrativas/NFLX.md'],'NFLX'),'auditorias/narrativas/NFLX.md');
  assert.equal(fn(['valoraciones/NFLX-1792548021734.json'],'NFLX'),'valoraciones/NFLX-1792548021734.json');
  assert.equal(fn(['auditorias/narrativas/NNFLX.md'],'NFLX'),'');
  assert.equal(fn([], 'NFLX'),'');
});

test('navegación general y biblioteca permiten abrir el expediente', () => {
  const nav=get('docs/mercado.js');
  const research=get('docs/research.js');
  const visor=get('docs/visor.html');
  new Script(nav);new Script(research);
  assert.match(nav,/Bitácora de terceros/);
  assert.match(nav,/Expedientes JMR/);
  assert.match(research,/openCatalogResearch/);
  assert.match(visor,/expediente\.html\?ticker=/);
});

test('servicio offline incluye nuevas páginas', () => {
  const sw=get('docs/sw.js');new Script(sw);
  for (const f of ['index.html','bitacora-terceros.html','expediente.html','expediente.js']) assert.ok(sw.includes('"'+f+'"'));
});

test('Research deja visible una ficha por empresa y conserva copias en memoria',()=>{
  const js=get('docs/research.js');
  const source=js.match(/  var officialAnalysisPaths = null;[\s\S]*?(?=  function setLocalLibrary\(list\) \{)/)?.[0];
  assert.ok(source,'selector de revisión activa');
  const records=[
    {id:'viejo',ticker:'DUOL',date:'2026-09-01',remotePath:'analisis/DUOL-viejo.json'},
    {id:'nuevo',ticker:'DUOL',date:'2026-10-26',remotePath:'analisis/DUOL-nuevo.json'},
    {id:'oficial',ticker:'DUOL',date:'2026-10-15',remotePath:'analisis/DUOL-oficial.json'},
    {id:'otro',ticker:'CELH',date:'2026-10-10',remotePath:'analisis/CELH.json'}
  ];
  const api=new Function('getLocalLibrary','jmrDelMercado',source+
    ';return {list:activeResearchList,setOfficial:function(paths){officialAnalysisPaths=new Set(paths)}};')(
    ()=>records.slice(),()=>true);
  assert.equal(api.list().length,2);
  assert.equal(api.list().find(x=>x.ticker==='DUOL').id,'nuevo');
  api.setOfficial(['analisis/DUOL-oficial.json']);
  assert.equal(api.list().find(x=>x.ticker==='DUOL').id,'oficial');
  assert.equal(records.length,4,'no borrar los registros históricos');
});

test('las rutas a un expediente desde vistas incrustadas suben al nivel superior',()=>{
  assert.match(get('docs/expediente.js'),/setAttribute\('target','_top'\)/);
});
test('auditorías usan menú compartido',()=>{
  for(const f of ['auditorias.html','auditoria-integral.html','auditoria-multiplos.html','historicos.html']){
    assert.match(get('docs/'+f),/src="mercado.js"/);
    assert.match(get('docs/'+f),/class="appnav"/);
    assert.match(get('docs/'+f),/jmr-theme.css/);
  }
});
