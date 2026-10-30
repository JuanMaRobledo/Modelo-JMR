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

test('ficha central contiene siete pestañas, estados e indicadores con origen único',()=>{
  const html=get('docs/expediente.html'),js=get('docs/expediente.js');
  const sections=['analisis','valoracion','financieros','indicadores','modelo','sensibilidades','revision'];
  for(const view of sections)assert.match(html,new RegExp('data-view="'+view+'"'));
  assert.equal((html.match(/data-view="/g)||[]).length,7);
  for(const id of ['sheetSubtabs','inlinePanel','viewFrame','reviewPanel','auditReviewNotes'])assert.match(html,new RegExp('id="'+id+'"'));
  new Script(js);
  for(const name of ['Income Statement','Balance Sheet','Cash Flow Statement','Trailing Valuation',
    'Eficiencia de capital','Salud Financiera','Input sheet','Valuation output','Cost of capital worksheet'])
    assert.ok(js.includes(name),name);
  for(const page of ['visor.html','analisis-lectura.html','editor-hoja.html','auditoria-integral.html'])
    assert.ok(js.includes(page),page);
  assert.match(js,/const initialView=.*:'analisis'/);
  assert.match(js,/function sensitivityHtml\(rec\)/);
  assert.match(js,/centroConciliado===true/);
  assert.match(js,/renderSheetSubtabs\(view\)/);
  assert.match(js,/if\(state\.frameMode==='workbook'/);
  assert.doesNotMatch(js,/window\.open\(/,'no abrir ventanas automáticamente');
  assert.doesNotMatch(html,/id="sensitivityModes"/,'sin barra secundaria duplicada');
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

test('el HTML de la ficha no contiene accesos principales obsoletos', () => {
  const html=get('docs/expediente.html');
  const nav=html.match(/<nav class="appnav"[^>]*>[\s\S]*?<\/nav>/)?.[0]||'';
  assert.match(nav,/>Empresas y análisis<\/a>/);
  assert.doesNotMatch(nav,/Expedientes JMR|>Análisis fundamental<\/a>/);
  assert.equal((nav.match(/<a /g)||[]).length,1,'fallback mínimo; el menú definitivo lo crea mercado.js');
});

test('navegación general y biblioteca permiten abrir el expediente', () => {
  const nav=get('docs/mercado.js');
  const research=get('docs/research.js');
  const visor=get('docs/visor.html');
  new Script(nav);new Script(research);
  assert.match(nav,/Bitácora de terceros/);
  assert.match(nav,/Empresas y análisis/);
  assert.doesNotMatch(nav,/Expedientes JMR/);
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
  for(const k of ['valoracion','analisis','financieros','indicadores','modelo','revision','supuestos','auditoria','sensibilidades']) assert.ok(keys.has(k),k);
  for(const m of js.matchAll(/\bp\.(\w+)\.href/g)) assert.ok(keys.has(m[1]),'p.'+m[1]+' no existe');
});
test('menú principal: las vistas por empresa salen de la ficha, no del menú',()=>{
  const nav=get('docs/mercado.js');
  assert.match(nav,/Empresas y análisis/);
  assert.match(nav,/jmr-tools-menu/);
  assert.doesNotMatch(nav,/Expedientes JMR/);
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
  assert.doesNotMatch(js,/window\.open\(/);
  assert.match(js,/if\(!event\.target\.closest\('button,a'\)\)open\.click\(\)/);
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

test('subpestañas y revisor quedan dentro de la ficha y preservan una sola revisión',()=>{
  const js=get('docs/expediente.js'),html=get('docs/expediente.html'),editor=get('docs/editor-hoja.js');
  for(const tab of ['financieros','indicadores','modelo'])assert.match(js,new RegExp(tab+':\\['));
  assert.match(js,/jmr-select-source-sheet/);
  assert.match(js,/jmr-sheet-selected/);
  assert.match(editor,/event.origin!==global.location.origin/);
  assert.match(editor,/event.source!==global.parent/);
  assert.match(editor,/if\(drafts.size\)/);
  assert.match(js,/view==='revision'/);
  assert.match(html,/data-view="revision"/);
  assert.match(js,/state\.valuationRecord=rec/);
  assert.match(js,/p\.analysisPath\?'/);
  assert.doesNotMatch(js,/window\.open/);
});

test('valoración relativa aparece en todas las fichas y separa FY+3 del valor presente',()=>{
  const html=get('docs/expediente.html'),js=get('docs/expediente.js');
  assert.match(html,/id="valuationModes"/);
  assert.match(html,/id="valuationSummary"/);
  assert.match(html,/data-valuation="multiplos"/);
  assert.match(html,/src="jmr-multiples-panel\.js\?v=/);
  assert.match(js,/JmrMultiplesPanel\.summary\(rec\)/);
  assert.match(js,/JmrMultiplesPanel\.render\(state\.valuationRecord\)/);
  assert.match(js,/metodo','multiplos'/);
  assert.doesNotMatch(js,/window\.open\(/);
  const sandbox={window:{}};
  const code=get('docs/jmr-multiples-panel.js');
  new Script(code).runInNewContext(sandbox);
  const api=sandbox.window.JmrMultiplesPanel;
  assert.ok(api && typeof api.render==='function');
  const adobe={
    ticker:'ADBE',revisionId:'ADBE-20261028-A3',currency:'USD',valorPrincipal:432.2929874,
    metodos:[
      {nombre:'DCF Damodaran',peso:.6,base:587.3},
      {nombre:'EV/EBITDA',peso:.1142857143,conservador:289.25,base:344.72,optimista:386,valorPresenteBase:256.5},
      {nombre:'EV/FCFF',peso:.1714285714,base:208.8,valorPresenteBase:152.93},
      {nombre:'P/E',peso:.0571428571,base:355.58,valorPresenteBase:263.97},
      {nombre:'P/FCFE',peso:.0571428571,base:214.33,valorPresenteBase:157.4},
      {nombre:'P/OCF',peso:0,base:217.32,valorPresenteBase:159.59},
      {nombre:'P/S (P/V)',peso:0,base:314.36},
      {nombre:'P/BV',peso:0,base:816.37}
    ],
    descuentoMultiples:{dcfHoy:{base:432.2929874},multiplesHoy:{conservador:176.7,base:199.02,optimista:215.45},
      ponderadoHoy:{base:338.98}}
  };
  assert.equal(api.aggregates(adobe).multiplesBase,199.02);
  const ar=api.rows(adobe);
  assert.equal(ar.length,7);
  assert.equal(ar.find(r=>r.nombre==='EV/EBITDA').base,344.72);
  assert.equal(ar.find(r=>r.nombre==='EV/EBITDA').vp,256.5);
  assert.equal(ar.find(r=>r.nombre==='P/BV').peso,0,'P/BV secundario, no se elimina');
  const screen=api.render(adobe);
  for(const value of ['199,02','432,29','338,98','EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/S','P/BV'])
    assert.ok(screen.includes(value),'debe mostrar '+value);
  assert.ok(screen.includes('Valor presente Base'),'sin etiquetar precios proyectados como valor presente');
  const mixed={ticker:'META',metodos:[{nombre:'EV/EBITDA',base:989.29,peso:0}],
    descuentoMultiples:{metodos:[{nombre:'EV/EBITDA',base:{consolidado:726.70}}]}};
  const m=api.rows(mixed).find(r=>r.nombre==='EV/EBITDA');
  assert.equal(m.base,989.29,'no sobrescribir FY+3 con valor presente');
  assert.equal(m.vp,726.70,'leer descuento desde el detalle');
  const pending={ticker:'UBER',metodos:[{nombre:'EV/EBITDA',peso:0,base:null}],
    descuentoMultiples:{multiplesHoy:{base:null}},sensibilidadMultiples:{controles:[
      {metodo:'EV/EBITDA',estado:'N/D',motivo:'anclas pendientes'}]}};
  const text=api.render(pending);
  assert.ok(text.includes('Pendiente'));
  assert.ok(text.includes('N/D'));
  assert.ok(!text.includes('US$0,00'));
});


test('DUOL: VP de múltiplos visible y conciliado sin tratarlo como FY+3 ni inventar NVO/INTU',()=>{
  const sandbox={window:{}};
  new Script(get('docs/jmr-multiples-panel.js')).runInNewContext(sandbox);
  const api=sandbox.window.JmrMultiplesPanel;
  const duol={ticker:'DUOL',revisionId:'DUOL-20261029-A1',valorPrincipal:136.6764524,
    valorPresentePonderado:{conservador:75,base:105.9,optimista:145.63},
    metodos:[
      {nombre:'DCF FCFF',peso:.6,conservador:92.51,base:136.6764524,optimista:196.95,valorPresente:true},
      {nombre:'EV/EBITDA',peso:.10,conservador:76.47,base:97.08,optimista:121.39,valorPresente:true},
      {nombre:'EV/FCFF',peso:.15,conservador:63.01,base:76.54,optimista:81.39,valorPresente:true},
      {nombre:'P/E',peso:.05,conservador:16.28,base:23.14,optimista:33.44,valorPresente:true,estado:'PROVISIONAL_SIN_APROBACION_ECONOMICA'},
      {nombre:'P/FCFE',peso:.05,conservador:15.45,base:14.69,optimista:12.22,valorPresente:true},
      {nombre:'P/OCF',peso:.05,conservador:16.11,base:16.31,optimista:16.64,valorPresente:true},
      {nombre:'P/V',peso:0,base:null,valorPresente:true},
      {nombre:'P/BV',peso:0,base:null,valorPresente:true}
    ]};
  const agg=api.aggregates(duol);
  assert.equal(agg.fuenteRelativa,'vp_conciliado');
  assert.equal(Math.round(agg.multiplesBase*100)/100,59.74);
  assert.equal(agg.ponderadoBase,105.9);
  const row=api.rows(duol).find(r=>r.nombre==='EV/EBITDA');
  assert.equal(row.base,97.08);
  assert.equal(row.vp,97.08,'el precio de la fuente ya estaba descontado');
  assert.match(row.periodo,/valor presente/i);
  const html=api.render(duol);
  for(const expected of ['59,74','105,90','97,08','Provisional','a valor presente','P/BV'])
    assert.ok(html.includes(expected),'DUOL debe mostrar '+expected);
  assert.doesNotMatch(html,/generalmente FY\+3/);
  const notReconciled={...duol,valorPresentePonderado:{...duol.valorPresentePonderado,base:99}};
  assert.equal(api.aggregates(notReconciled).multiplesBase,null,
    'si no reconcilia, no publicar precio relativo derivado');
  for(const ticker of ['NVO','INTU']){
    const pending={ticker,valorPrincipal:70,valorPresentePonderado:{base:null},
      metodos:[{nombre:'DCF Damodaran',peso:1,base:70},
        {nombre:'EV/EBITDA',estado:'PENDIENTE_MULTIPLOS_NATIVOS',peso:null,valorHoy:null}]};
    assert.equal(api.aggregates(pending).multiplesBase,null);
    assert.match(api.render(pending),/Pendiente/);
    assert.doesNotMatch(api.render(pending),/US\$0,00/);
  }
});

test('control del Modelo A excluye versiones anteriores, señala incompletas y nunca mezcla una revisión nueva',()=>{
  const js=get('docs/expediente.js');
  const extractor=js.match(/function fromCatalog\([\s\S]*?\n(?=function status)/)?.[0]||'';
  assert.match(extractor,/function controlModeloA/);
  const active=['valoraciones/META-20261025-R5.json','valoraciones/ADBE-20261028-A3.json'];
  const state={catalog:{valoraciones:active,controlModeloA:{empresas:{
    META:{rutaValoracion:active[0],metodo:'ANTERIOR',estado:'EXCLUIDA_HASTA_REHACER_A'},
    ADBE:{rutaValoracion:active[1],metodo:'A-1.2',estado:'INCOMPLETA_EN_REVISION',multiplos:'PRINCIPALES_REGISTRADOS_PENDIENTE_AUDITORIA'}
  }}}};
  const gate=new Function('state',extractor+';return controlModeloA;')(state);
  assert.equal(gate('META').visible,false);
  assert.equal(gate('ADBE').visible,true);
  assert.equal(gate('ADBE').estado,'INCOMPLETA_EN_REVISION');
  state.catalog.valoraciones[1]='valoraciones/ADBE-20261031-A4.json';
  assert.equal(gate('ADBE').visible,false,'Una revisión nueva no hereda la clasificación de otra.');
  assert.match(js,/filter\(t=>controlModeloA\(t\)\.visible\)/);
  assert.match(js,/MODELO A INCOMPLETO/);
});
