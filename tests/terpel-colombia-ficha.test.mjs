import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const marketSource=readFileSync(new URL('../docs/mercado.js',import.meta.url),'utf8');
const dossierSource=readFileSync(new URL('../docs/expediente.js',import.meta.url),'utf8');

test('TERPEL se clasifica como valor colombiano por ticker BVC, sin cambiar el extranjero',()=>{
  const line=marketSource.split('\n').find(x=>x.includes('var bvc = '));
  assert.ok(line,'No se halló clasificador BVC compartido');
  const literal=line.slice(line.indexOf('var bvc = ')+10).trim().replace(/;$/,'');
  const bvc=Function('return '+literal)();
  assert.equal(bvc.test('TERPEL'),true);
  assert.equal(bvc.test('TERPEL.CL'),true);
  assert.equal(bvc.test('MSFT'),false);
});

test('la ficha única presenta centros de sensibilidades en COP para TERPEL, sin US$ fijo',()=>{
  const start=dossierSource.indexOf('function sensitivityHtml(rec){');
  const end=dossierSource.indexOf('function sourceUrl(){',start);
  assert.ok(start>=0&&end>start);
  const normaliza=()=>[{nombre:'WACC × g',centroConciliado:true,valores:Array.from({length:5},()=>Array(5).fill(100)),ejeFilas:[0.02,0.03,0.04,0.05,0.06],ejeColumnas:[0.08,0.09,0.1,0.11,0.12]}];
  const sensibilidad=new Function('normalizeDcfMatrices','nativeMultiplesHtml',dossierSource.slice(start,end)+';return sensitivityHtml;')(normaliza,()=> '');
  const cop=sensibilidad({ticker:'TERPEL',moneda:'COP',valorPrincipal:100,sensibilidadDCF:{}});
  assert.match(cop,/Centro Base: COP \$100,00/);
  assert.doesNotMatch(cop,/Centro Base: US\$/);
  const usd=sensibilidad({ticker:'MSFT',moneda:'USD',valorPrincipal:100,sensibilidadDCF:{}});
  assert.match(usd,/Centro Base: US\$100,00/);
});
