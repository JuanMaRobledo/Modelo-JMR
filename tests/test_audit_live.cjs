'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

/**
 * Contrato vivo de la ficha NFLX que figura en el catálogo oficial, NO en una
 * ruta histórica retirada. Consulta solo la revisión activa de Modelo-JMR-datos.
 *
 * Este test de coherencia estructural NO certifica los múltiplos ni el DCF:
 * aquellos tienen controles específicos de fórmula, hoja y revisión editorial.
 */
(async function main(){
  const ref=process.env.JMR_DATA_REF||'main';
  const base='https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
  async function read(path){
    const url=base+path+'?ref='+encodeURIComponent(ref);
    const response=await fetch(url,{headers:{
      'Accept':'application/vnd.github+json',
      'User-Agent':'Modelo-JMR-active-catalog-audit'
    }});
    if(!response.ok)throw Error('Expediente no disponible: '+path+' HTTP '+response.status);
    const json=await response.json();
    return Buffer.from(json.content.replace(/\s/g,''),'base64').toString('utf8');
  }
  const catalog=JSON.parse(await read('catalogo.json'));
  const valuationPaths=catalog.valoraciones.filter(x=>/\/NFLX(?:-|\.)/.test(x));
  const researchPaths=catalog.analisis.filter(x=>/\/NFLX(?:-|\.)/.test(x));
  assert.equal(valuationPaths.length,1,'una sola valoración activa de NFLX');
  assert.equal(researchPaths.length,1,'un solo análisis activo de NFLX');
  const valPath=valuationPaths[0],analysisPath=researchPaths[0];
  const [raw,researchRaw]=await Promise.all([read(valPath),read(analysisPath)]);
  const v=JSON.parse(raw),a=JSON.parse(researchRaw);
  assert.equal(v.ticker,'NFLX');
  assert.equal(a.ticker,'NFLX');
  assert.equal(a.revisionId,v.revisionId,'análisis y DCF comparten revisión');
  assert.equal(a.linkedValuation?.sourcePath,valPath,'enlace al registro oficial');
  assert.equal(a.linkedValuation?.revisionId,v.revisionId,'revisión financiera consistente');
  assert.ok(v.hojaGoogle||v.sheet_id,'enlace a la hoja oficial');
  const approx=(actual,expected,label,tol=.001)=>{
    assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),label+': N/D');
    assert.ok(Math.abs(actual-expected)<=tol,label+': '+actual+' ≠ '+expected);
  };
  assert.ok(Number.isFinite(v.valorPrincipal)&&v.valorPrincipal>0,'DCF principal numérico');
  assert.equal(v.baseMOS,'dcfBase','MOS Base, no ponderado');
  approx(v.precioMOS,v.valorPrincipal*(1-v.mos),'MOS de la revisión oficial',.002);
  assert.equal(v.valorEsperado?.tipoPromedio,'3_historias_sin_disrupcion');
  assert.equal(v.valorEsperado?.disrupcionSeparada,true);
  const stories=v.valorEsperado?.historias;
  assert.ok(Array.isArray(stories));
  assert.deepEqual(stories.map(s=>s.id).sort(),['A','B','C','D']);
  approx(stories.reduce((sum,x)=>sum+x.probabilidad,0),1,'cuatro probabilidades',1e-9);
  const ordinary=stories.filter(x=>x.id!=='C');
  const p=ordinary.reduce((sum,x)=>sum+x.probabilidad,0);
  const ordinaryPrice=ordinary.reduce((sum,x)=>sum+x.valor*x.probabilidad,0)/p;
  approx(v.valorEsperado.valor,ordinaryPrice,'promedio sin Disrupción',.002);
  approx(v.valorPrincipal,stories.find(x=>x.id==='A').valor,'DCF principal Base',.002);

  // Un múltiplo con peso 0 puede quedar N/D; no fabricamos un resultado.
  const methodNames=new Set((v.metodos||[]).map(m=>m.nombre));
  for(const name of ['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF'])
    assert.ok(methodNames.has(name),'evaluar método prioritario '+name);
  const rel=v.descuentoMultiples||{};
  approx(rel.pesoDcf+rel.pesoMultiplos,1,'peso DCF + múltiplos',.0001);
  for(const [scenario,storyId] of [['conservador','B'],['base','A'],['optimista','D']]){
    const relative=rel.multiplesHoy?.[scenario];
    const combined=rel.ponderadoHoy?.[scenario];
    if(!Number.isFinite(relative)||!Number.isFinite(combined)){
      assert.ok(v.estado==='EN_REVISION'||v.publicationStatus==='EN_REVISION',
        'faltantes deben permanecer EN_REVISION');
      continue;
    }
    const price=stories.find(x=>x.id===storyId).valor;
    approx(combined,rel.pesoDcf*price+rel.pesoMultiplos*relative,
      'DCF + múltiplos '+scenario,.03);
  }

  assert.ok(a.calculationHtml?.length>1000,'Nivel 2 disponible y no vacío');
  const article=a.articleHtml||a.html||'';
  const chapters=[...article.matchAll(/<h2[^>]*>\s*(\d{1,2})\./g)].map(m=>Number(m[1]));
  const legacy13=chapters.length===13&&chapters.every((n,i)=>n===i+1);
  const current14=chapters.length===14&&chapters.every((n,i)=>n===i+1);
  assert.ok(legacy13||current14,'índice original de 13 o vigente de 14 capítulos, sin inventar encabezados');
  if(legacy13){
    assert.ok(a.estado==='EN_REVISION'||a.status==='EN_REVISION'||a.publicationStatus==='EN_REVISION',
      '13 capítulos = solo legado EN_REVISION, no COMPLETA');
    console.warn('PENDIENTE_EDITORIAL NFLX: 13 capítulos heredados, requiere migración sustantiva a 14.');
  }else{
    assert.match(article,/Ciclos de la empresa, del mercado y de la macroeconomía|Ciclos empresariales, macroeconómicos y de mercado/i);
  }

  const auditPath='auditorias/narrativas/NFLX.md';
  if(catalog.auditorias.includes(auditPath)){
    const audit=await read(auditPath);
    assert.equal((audit.match(/^## \d+\./gm)||[]).length,18,
      'auditoría tiene 18 secciones independientes del análisis');
    const deep=fs.readFileSync('docs/jmr-audit-deep.js','utf8');
    const sandbox={window:{}};
    vm.runInNewContext(deep,sandbox);
    const result=sandbox.window.JmrDeepAudit.analyze(v,audit);
    assert.equal(result.sectionCount,18,'lector reconoce 18 secciones de auditoría');
    // Una auditoría guardada puede corresponder a otra revisión; no certificar
    // la revisión actual por simple existencia del informe.
    if(!audit.includes(v.revisionId))
      console.warn('PENDIENTE_AUDITORIA NFLX: auditoría narrativa sin revisión vigente '+v.revisionId);
  }
  console.log('OK catálogo activo NFLX: '+v.revisionId+
    ', DCF Base='+v.valorPrincipal.toFixed(2)+
    ', MOS='+v.precioMOS.toFixed(2)+
    ', Nivel 1='+chapters.length+
    ', Nivel 2 presente; conciliación económica integral sigue pendiente.');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
