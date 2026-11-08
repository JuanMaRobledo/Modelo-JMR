import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const fixture=JSON.parse(read('tests/fixtures/pags-bank-review.json'));
const src=read('docs/expediente.js');
const start=src.indexOf('function nativeMultiplesHtml(rec){');
const end=src.indexOf('function sensitivityHtml(rec){',start);
const native=new Function(src.slice(start,end)+';return nativeMultiplesHtml;')();
const page=read('docs/analisis-lectura.html');
const scenarios=new Function(page.slice(page.indexOf('function officialNumber(x){'),page.indexOf('function labelMethod(v){'))+';return scenarioValues;')();
const fresh=()=>structuredClone(fixture);
test('PAGS: tres contrastes bancarios reales, ejes y reservas sin modificar datos',()=>{
 const before=JSON.stringify(fixture),html=native(fixture);
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,3);
 assert.match(html,/peso 0 %/);assert.match(html,/anclas no certificadas/);
 assert.match(html,/Filas: múltiplo elegido · Columnas: fundamental FY\+3/);
 assert.match(html,/Múltiplo ↓ · FY\+3 →/);
 assert.match(html,/>2.067,07<\/th>/);
 assert.match(html,/>4,00×<\/th>/);
 assert.match(html,/7,19 por acción/);
 assert.equal(JSON.stringify(fixture),before);
});
test('rechaza otra revisión, hoja, hash, candidato, peso y ancla no provisional',()=>{
 const changes=[
  r=>r.sensibilidadMultiples.revisionId='OTRA',
  r=>r.sensibilidadMultiples.sourceSheetId='OTRA',
  r=>r.sensibilidadMultiples.resultadosSha256='',
  r=>r.sensibilidadMultiples.estadoPublicacion='CANDIDATO',
  r=>r.sensibilidadMultiples.controlesTecnicosAprobados=false,
  r=>r.sensibilidadMultiples.pesoEnDCFPrincipal=.1,
  r=>r.sensibilidadMultiples.matrices[0].peso=.1,
  r=>r.sensibilidadMultiples.matrices[0].anclaCertificada=true,
  r=>r.sensibilidadMultiples.certificado=true,
  r=>r.sensibilidadMultiples.matrices.reverse()
 ];
 for(const change of changes){const r=fresh();change(r);assert.doesNotMatch(native(r),/class="jmr-native-matrix-table"/);}
 const r=fresh();r.sensibilidadMultiples.matrices[0].matriz[2][2]=999;
 assert.equal((native(r).match(/class="jmr-native-matrix-table"/g)||[]).length,2);
});
test('PAGS: cuatro historias por nombre y promedio disponible, sin recalcular valores',()=>{
 const s=scenarios(fixture);
 assert.equal(s.conservador,9.125797966913115);
 assert.equal(s.base,12.880006211613892);
 assert.equal(s.optimista,16.87002900109944);
 assert.equal(s.disrupcion,7.939647028477495);
 assert.equal(s.incomplete,false);assert.equal(s.historical,false);
 assert.equal(fixture.valorEsperado.valor,12.938959847810086);
});
test('ids explícitos prevalecen; nombres con tilde; ausente no equivale a cero',()=>{
 const r=fresh();
 r.valorEsperado.historias.find(h=>h.nombre==='Disrupcion').nombre='Disrupción';
 r.valorEsperado.historias.push({id:'B',nombre:'Conservador',valor:8});
 assert.equal(scenarios(r).conservador,8);assert.equal(scenarios(r).disrupcion,7.939647028477495);
 r.valorEsperado.historias=r.valorEsperado.historias.filter(h=>h.nombre!=='Optimista');
 assert.equal(scenarios(r).optimista,null);assert.equal(scenarios(r).incomplete,true);
});

test('Floyd: C es Optimista y falta de C bloquea promedio ordinario, sin afectar PAGS',()=>{
  const r=fresh();
  r.perfil_valoracion='Floyd';
  r.valorEsperado.historias=[
    {id:'B',nombre:'Conservadora',valor:48.64133538841416},
    {id:'A',nombre:'Base',valor:100.19381867706664},
    {id:'C',nombre:'Optimista',valor:145.08587655923017}
  ];
  const s=scenarios(r);
  assert.equal(s.conservador,48.64133538841416);
  assert.equal(s.base,100.19381867706664);
  assert.equal(s.optimista,145.08587655923017);
  assert.equal(s.disrupcion,null);
  assert.equal(s.incomplete,false);
  r.valorEsperado.historias.pop();
  assert.equal(scenarios(r).incomplete,true);
});
