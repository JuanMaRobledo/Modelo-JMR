import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';

const get = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
function summary(){
  const window={};
  runInNewContext(get('docs/jmr-mos-summary.js'),{window});
  return window.JmrMosSummary;
}
test('MOS fijo 35% sobre DCF Base, no valor esperado ni múltiplos',()=>{
  const f=summary();
  const rec={ticker:'GOOG',moneda:'USD',valorPrincipal:800,
    descuentoMultiples:{dcfHoy:{base:287.20493379569}},
    valorEsperado:{valor:350,historias:[{id:'A',valor:287.20493379569}]},
    objetivoPonderado:{base:400}};
  const o=f.calculate(rec,283.49);
  assert.equal(o.mos,0.35);
  assert.ok(Math.abs(o.base-287.20493379569)<1e-10);
  assert.ok(Math.abs(o.precioMOS-186.6832069672)<1e-6);
  assert.ok(Math.abs(o.ratioIntrinsic-283.49/o.base)<1e-10);
  assert.ok(Math.abs(o.ratioMOS-283.49/o.precioMOS)<1e-10);
  assert.ok(o.gapMOS>0,'el precio de mercado supera el precio con MOS');
});
test('MOS de holdings requiere SOTP Base; no inventa ratios sin precio',()=>{
  const f=summary();
  assert.equal(f.calculate({valoracionHolding:{},valorPrincipal:800},300),null);
  const rec={valoracionHolding:{nav:{base:10000}},valorPrincipal:800};
  const o=f.calculate(rec,null);
  assert.equal(o.basis,'SOTP Base');
  assert.equal(o.precioMOS,6500);
  assert.equal(o.ratioIntrinsic,null);
  assert.equal(o.ratioMOS,null);
  assert.equal(f.calculate({descuentoMultiples:{dcfHoy:{base:0}}},500),null);
});
test('cabeceras de expediente, artículo y visor usan el mismo cálculo y fuente de precio identificada',()=>{
  const js=get('docs/jmr-mos-summary.js');
  const dossier=get('docs/expediente.html');
  const dossierJs=get('docs/expediente.js');
  const reader=get('docs/analisis-lectura.html');
  const visor=get('docs/visor.html');
  new Script(js);
  new Script(dossierJs);
  for(const page of [dossier,reader,visor]){
    assert.match(page,/jmr-mos-summary\.js/);
    assert.match(page,/jmr-mos-summary\.css/);
  }
  assert.match(dossier,/id="mosSummary"/);
  assert.match(reader,/id="jmrMosAnalysis"/);
  assert.match(visor,/id="jmrMosVisor"/);
  assert.match(dossierJs,/loadMosSummary\(t,p,mosRequest\)/);
  assert.match(dossierJs,/\/api\/quotes\?symbols=/);
  assert.match(reader,/refreshCurrentQuote\(ticker,base,price,currency,v\)/);
  assert.match(visor,/renderMosHeader\(\)/);
  assert.match(js,/Precio guardado con la valoración; puede estar desactualizado/);
});
