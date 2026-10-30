import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const get = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('index redirige al análisis, sin borrar la bitácora de terceros', () => {
  assert.match(get('docs/index.html'), /location\.replace\("expediente\.html\?seccion=analisis"/);
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

test('notas de auditoría se guardan por revisión y distinguen borrador de GitHub',()=>{
  const html=get('docs/expediente.html'),js=get('docs/expediente.js');
  assert.match(html,/id="auditReviewNotes"/);
  assert.match(html,/id="saveAuditRequest"/);
  assert.match(html,/repositorio <strong>público<\/strong>/);
  assert.match(html,/src="gh_oauth\.js"/);
  assert.match(js,/auditorias\/solicitudes\//);
  assert.match(js,/jmr-audit-request-v1/);
  assert.match(js,/loc\.revision/);
  assert.match(js,/GhOAuth\.getGhToken\(\)/);
  assert.match(js,/localStorage\.setItem\(key,value\)/);
  new Script(js);
});

test('solicitudes de auditoría usan la revisión exacta y no sustituyen una valoración archivada',()=>{
  const js=get('docs/expediente.js');
  const html=get('docs/expediente.html');
  assert.doesNotMatch(js,/mostRecent\?\.path/);
  assert.match(js,/const tickers=\[\.\.\.new Set\(\(state\.catalog\.valoraciones\|\|\[\]\)/);
  assert.match(js,/const path=inDirectory\?officialPath:''/);
  assert.match(js,/!p\.official/);
  for(const status of ['EN_REVISION','LISTO','REHACER'])assert.ok(js.includes(status));
  assert.match(html,/id="reviewPanel"/);
  assert.match(html,/id="auditReviewStatus"/);
  const m=js.match(/function reviewPath\(loc\)\{[\s\S]*?\n\}/);
  assert.ok(m);
  const fn=new Function(m[0]+';return reviewPath')();
  assert.equal(fn({ticker:'ADBE',revision:'ADBE-REC-20261027-R1'}),
    'auditorias/solicitudes/ADBE/ADBE-REC-20261027-R1.json');
  assert.equal(fn({ticker:'ADBE',revision:'ADBE-REC-20261027-R2'}),
    'auditorias/solicitudes/ADBE/ADBE-REC-20261027-R2.json');
  assert.match(js,/latest\.sha!==state\.reviewSha/);
  assert.match(js,/auditoriaSolicitada:false/);
  assert.match(js,/result\.content\?\.sha/);
  assert.match(js,/GhOAuth\.b64EncodeUnicode/);
  assert.match(js,/branch:'main'/);
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

test('expediente.js solo usa secciones definidas en pages() (evita excepciones antes de cargar el iframe)',()=>{
  const js=get('docs/expediente.js');
  const body=js.match(/function pages\(t\)\{[\s\S]*?return \{([\s\S]*?)\n  \};\n\}/)?.[1];
  assert.ok(body,'return de pages()');
  const keys=new Set([...body.matchAll(/^\s{4}(\w+):/gm)].map(m=>m[1]));
  for(const k of ['valoracion','analisis','supuestos','auditoria','auditoriaIntegral','sensibilidades','sensibilidadMultiples']) assert.ok(keys.has(k),k);
  for(const m of js.matchAll(/\bp\.(\w+)\.href/g)) assert.ok(keys.has(m[1]),'p.'+m[1]+' no existe');
});
test('menú principal: las vistas por empresa salen de la ficha, no del menú',()=>{
  const nav=get('docs/mercado.js');
  assert.match(nav,/Expedientes JMR/);
  for(const f of ['editor-hoja.html\', \'Hojas','auditorias.html\', \'Auditoría narrativa']) assert.ok(!nav.includes("link('"+f),f);
});
test('las páginas por empresa reconocen archivos de revisión TICKER-AAAAMMDD-Rn y no caen en otro ticker',()=>{
  const sources=[get('docs/auditoria-integral.html').match(/arr\[0\]\.filter\(function\(x\)\{return x\.type==="file"&&(\/.*?\/)\.test/)?.[1],
    get('docs/auditoria-multiplos.js').match(/listing\("valoraciones",(\/.*?\/)\)/)?.[1]];
  for(const src of sources){
    assert.ok(src,'regex de archivos de valoración');
    const re=eval(src);
    for(const n of ['NKE-20261025-R6.json','META-20261025-R5.json','XP-20261026-R2.json','NFLX-1792548021734.json','ADBE-1789572982820.json'])
      assert.ok(re.test(n),n+' debe reconocerse');
    assert.ok(!re.test('catalogo.json'));
  }
  for(const f of ['docs/visor.html','docs/research.js']){
    const m=get(f).match(/var m = base\.match\((\/\^\(\[A-Za-z0-9\.\]\+\)-.*?\/)\);/);
    assert.ok(m,f);const re=eval(m[1]);
    assert.equal('NKE-20261025-R6'.match(re)?.[1],'NKE');
    assert.equal('NFLX-1792548021734'.match(re)?.[1],'NFLX');
  }
});
test('menú y páginas restantes: el menú no desborda la página y colombia no falla sin enlace activo',()=>{
  assert.match(get('docs/mercado.js'),/nav\.appnav\{box-sizing:border-box;max-width:100%;overflow-x:auto\}/);
  assert.match(get('docs/colombia/app.js'),/\?\.scrollIntoView\(/);
  assert.match(get('docs/portafolio.html'),/\.port-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('catálogo muestra tarjetas clicables para las rutas oficiales y evita IDs duplicados',()=>{
  const html=get('docs/expediente.html'),js=get('docs/expediente.js');
  for(const x of ['catalogSection','catalogSearch','catalogCards','catalogEmpty'])assert.match(html,new RegExp('id="'+x+'"'));
  assert.match(js,/function renderCatalogCards\(\)/);
  assert.match(js,/catalog\.valoraciones/);
  assert.match(js,/open\.addEventListener\('click',\(\)=>\{openCompany\(t\)/);
  assert.match(js,/card\.addEventListener\('click',event=>/);
  assert.match(js,/if\(p\.analysisPath\)window\.open\(p\.analisis\.href/);
  assert.doesNotMatch(js,/CONTENTS\+'valoraciones\?ref=main'/,'la lista no depende de otra API');
  assert.doesNotMatch(js,/mostRecent\?\.path/);
  assert.match(js,/catalogMarket\(t\)/);
  assert.equal((html.match(/id="auditReviewNotes"/g)||[]).length,1);
  assert.equal((html.match(/id="saveAuditRequest"/g)||[]).length,1);
  assert.equal((html.match(/src="gh_oauth\.js"/g)||[]).length,1);
  assert.doesNotMatch(html,/id="auditNotesPanel"/);
  assert.match(js,/jmr-audit-draft-v1:/,'notas antiguas recuperables');
});

test('lector de análisis muestra cuatro escenarios, tres referencias R4 y Base R5',()=>{
  const reader=get('docs/analisis-lectura.html');
  const marker='<script>\n(async function()';
  const at=reader.indexOf(marker);
  assert.ok(at>=0,'script del lector no encontrado');
  const script=reader.slice(at+8,reader.indexOf('</script>',at));
  const start=script.indexOf('function officialNumber(x){');
  const end=script.indexOf('function labelMethod(v){',start);
  assert.ok(start>=0&&end>start,'helpers de escenarios ausentes');
  const values=new Function(script.slice(start,end)+';return scenarioValues;')();
  const v={
    valorPrincipal:287.20493379569007,
    valorEsperado:{valor:null,historias:[
      {id:'A',valor:287.20493379569007},
      {id:'B',valor:null,referenciaHistoricaR4:218.95909260326206},
      {id:'D',valor:null,referenciaHistoricaR4:475.95535696106674},
      {id:'C',valor:null,referenciaHistoricaR4:125.92905008869238}
    ]},
    descuentoMultiples:{dcfHoy:{base:287.20493379569007}}
  };
  const result=values(v);
  assert.equal(result.base,287.20493379569007);
  assert.equal(result.conservador,218.95909260326206);
  assert.equal(result.optimista,475.95535696106674);
  assert.equal(result.disrupcion,125.92905008869238);
  assert.equal(result.historical,true);
  assert.equal(result.incomplete,true);
  for(const key of ['conservador','optimista','disrupcion']){
    assert.ok(result.provenance[key].includes('Referencia R4'));
    assert.ok(result.provenance[key].includes('recalcular en R5'));
  }
  assert.ok(script.includes('expected=scenarios.incomplete?null:'));
  assert.ok(script.includes('Pendiente de recalcular'));
  assert.ok(script.includes('scenarios.provenance[key]'));
  const other=values({valorPrincipal:90,valorEsperado:{historias:[
    {id:'A',valor:90},{id:'B',valor:70},{id:'D',valor:110},{id:'C',valor:20}
  ]}});
  assert.equal(other.historical,false);
  assert.equal(other.incomplete,false);
  assert.equal(other.conservador,70);
  const onlyDisruptionMissing=values({valorPrincipal:90,valorEsperado:{historias:[
    {id:'A',valor:90},{id:'B',valor:70},{id:'D',valor:110}
  ]}});
  assert.equal(onlyDisruptionMissing.incomplete,false);
});
