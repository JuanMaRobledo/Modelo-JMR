const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = { window: {}, Intl, console };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../docs/valuation-board.js'),'utf8'),ctx);
const board = ctx.window.JmrValueBoard;
function parts(baseMOS, unified=true) {
  return {mos:.35,baseMOS,precio:251.67,dm:{dcfHoy:{conservador:227.71,base:392.9600099404326,optimista:526.48}},
    ve:{valor:335.9454453067697,escenariosUnificados:unified,historiaCentralId:'A',historias:[
      {id:'A',nombre:'Base',valor:392.9600099404326,probabilidad:.45},
      {id:'B',nombre:'Conservador',valor:227.71,probabilidad:.3},
      {id:'C',nombre:'Disrupción',valor:118.28,probabilidad:.1},
      {id:'D',nombre:'Optimista',valor:526.48,probabilidad:.15}]}};
}
test('XLSX parts apply MOS to Base and explain the reference',()=>{
  const html=board.veHtml(board.fromParts(parts('dcfBase')));
  assert.match(html,/MOS 35% sobre DCF Base/);
  assert.match(html,/255,42/);
  assert.doesNotMatch(html,/218,36/);
});
test('saved records propagate baseMOS to the board',()=>{
  const p=parts('dcfBase');
  const d=board.fromRecord({mos:p.mos,baseMOS:p.baseMOS,precio:p.precio,descuentoMultiples:p.dm,valorEsperado:p.ve});
  assert.match(board.veHtml(d),/255,42/);
});
test('legacy expected-value records retain their explicit reference',()=>{
  const html=board.veHtml(board.fromParts(parts('valorEsperado')));
  assert.match(html,/218,36/);
  assert.match(html,/MOS 35% sobre promedio de escenarios DCF/);
});
test('non-unified stories honor the Base reference too',()=>{
  const html=board.veHtml(board.fromParts(parts('dcfBase',false)));
  assert.match(html,/sobre DCF Base/);
  assert.match(html,/255,42/);
});

test('summary MOS card honors Base as well as the shared board',()=>{
  const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/visor.html'),'utf8');
  const fn=source.slice(source.indexOf('  function renderMosDcf(){'),source.indexOf('  function renderHeadline(){'));
  const els={rPrecioMOS:{},rPrecioMOSLbl:{}};
  const p=parts('dcfBase');
  const c={currentResumen:{mos:p.mos,baseMOS:p.baseMOS,descuentoMultiples:p.dm,valorEsperado:{...p.ve,valorCentral:392.9600099404326}},document:{getElementById:id=>els[id]},fmtMoney:n=>n.toFixed(2)};
  vm.runInNewContext(fn+';renderMosDcf()',c);
  assert.equal(els.rPrecioMOS.textContent,'255.42');
  assert.equal(els.rPrecioMOSLbl.textContent,'Precio con MOS sobre DCF Base');
});
