import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function renderer(){
  const window={};
  runInNewContext(file('docs/jmr-analysis-depth.js'),{window});
  return window.JmrAnalysisDepth;
}
test('los 22 emisores activos tienen contexto económico específico y ampliación sustantiva',()=>{
  const d=renderer();
  const tickers='META NVDA XP DUOL SHAK UBER MELI CELH ADBE BSX CMG NFLX GOOGL MSFT NKE PYPL EPAM ZTS ONON NU NVO INTU'.split(' ');
  assert.deepEqual(Object.keys(d.profiles).sort(),tickers.slice().sort());
  for(const ticker of tickers){
    const input={ticker,valorPrincipal:120,precio:100,precioMOS:78,revisionId:ticker+'-TEST',
      valorEsperado:{historias:[{id:'A',valor:120},{id:'B',valor:70},{id:'D',valor:170},{id:'C',valor:25}]},
      revisionSupuestos:{roicTerminal:0.22,waccInicial:0.10,gTerminal:0.035},
      salvedades:['Revisión de supuestos pendiente.']};
    const html=d.render({ticker},input);
    const wordCount=html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().split(' ').length;
    assert.ok(wordCount>=1450,ticker+': insuficiente desarrollo '+wordCount+' palabras');
    for(const label of ['Crecimiento','Márgenes','Reinversión','Rentabilidad','Costo de capital',
                         'Escenarios','Salvedades'])
      assert.ok(html.toLowerCase().includes(label.toLowerCase()),ticker+': falta '+label);
    assert.match(html,/no equivale a auditoría económica independiente/i);
  }
});
test('R5 GOOGL no mezcla los escenarios históricos con el actual',()=>{
  const d=renderer();
  const r=d.render({ticker:'GOOGL'},{
    ticker:'GOOGL',revisionId:'GOOGL-20261029-R5',valorPrincipal:287.20493379569007,
    precioAnalisis:324.89,precioMOS:186.68320696719854,valorEsperado:{historias:[
      {id:'A',valor:287.20493379569007},
      {id:'B',valor:null,referenciaHistoricaR4:218.95909260326206},
      {id:'C',valor:null,referenciaHistoricaR4:125.92905008869238},
      {id:'D',valor:null,referenciaHistoricaR4:475.95535696106674}
    ]},
    revisionSupuestos:{roicTerminal:.21,waccInicial:.10025,gTerminal:.04}
  });
  assert.match(r,/histórico R4 pendiente de homologación/i);
  assert.match(r,/no corresponde publicar un ponderado de revisiones heterogéneas/i);
  assert.match(r,/287,20/);
  assert.match(r,/186,68/);
});
test('el lector inserta la ampliación después del artículo original, sin alterar el DCF',()=>{
  const h=file('docs/analisis-lectura.html');
  assert.match(h,/src="jmr-analysis-depth\.js"/);
  assert.match(h,/JmrAnalysisDepth\.render\(record,currentValuation\)/);
  assert.match(h,/el\('article'\)\.append\(insert\)/);
  assert.match(h,/renderContent\(el\('article'\),article\)/);
  assert.match(h,/return v;/);
});
test('no convierte cifras DKK de NVO en dólares estadounidenses',()=>{
  const d=renderer();
  const h=d.render({ticker:'NVO'},{ticker:'NVO',valorPrincipal:63.43,precio:38.29,
    revisionSupuestos:{ltmCFO_DKKm:10000},salvedades:[]});
  assert.doesNotMatch(h,/US\$10\.000,00/);
});
