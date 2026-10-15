import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function board() {
  const window = {}, document = {addEventListener(){},createElement(){return {};},head:{appendChild(){}}};
  vm.runInNewContext(fs.readFileSync(new URL('../docs/valuation-board.js',import.meta.url),'utf8'),{window,document});
  return window.JmrValueBoard;
}
const holding={estado:'PRELIMINAR',nav:{base:18674.20595,conservador:15127.57409,optimista:22220.83782,disrupcion:11359.43992},valorContable:14732.59503,ponderado:null,
  metodos:[{nombre:'SOTP híbrido',peso:0.6,estado:'REFERENCIAL',valor:18674.20595},{nombre:'Múltiplos por negocio',peso:0.4,estado:'PENDIENTE',valor:null}],pendientes:['Cotizaciones al corte']};
test('holding uses NAV and pending methods without a DCF label or invented probabilities',()=>{
  const b=board(),data=b.fromRecord({currency:'COP',precio:16360,valoracionHolding:holding}),html=b.html(data);
  assert.equal(b.hasData(data),true);assert.match(html,/SOTP Base · NAV referencial/);assert.match(html,/COP 18\.674/);
  assert.match(html,/PRELIMINAR/);assert.match(html,/Múltiplos por negocio/);assert.match(html,/PENDIENTE/);
  assert.doesNotMatch(html,/DCF base hoy|Valor intrínseco principal|Promedio de DCF × probabilidad/);assert.equal(b.veBox(data),'');
});
test('industrial records retain their existing DCF rendering',()=>{
  const b=board(),data=b.fromRecord({currency:'USD',precio:40,descuentoMultiples:{dcfHoy:{base:50,conservador:40,optimista:60}}});
  assert.equal(b.hasData(data),true);assert.match(b.html(data),/DCF/);assert.doesNotMatch(b.html(data),/SOTP Base/);
});
test('holding notes are escaped',()=>{
  const b=board(),html=b.html(b.fromRecord({currency:'COP',valoracionHolding:{...holding,nota:'<script>bad</script>'}}));
  assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
});
