import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../docs/expediente.js',import.meta.url),'utf8');
const start=src.indexOf('function nativeMultiplesHtml(rec){');
const end=src.indexOf('function sensitivityHtml(rec){',start);
assert.ok(start>=0&&end>start,'Falta lector de matrices nativas');
const native=new Function(src.slice(start,end)+'; return nativeMultiplesHtml;')();
const mk=()=>{
 const names=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
 return {ticker:'SHAK',revisionId:'SHAK-R2',sheet_id:'sheet',
  descuentoMultiples:{metodos:names.map(n=>({nombre:n,peso:n==='EV/FCFF'||n==='P/FCFE'?0:0.1}))},
  sensibilidadMultiples:{
   contrato:'base-native-five-priority-v1',revisionId:'SHAK-R2',
   sourceSheetId:'sheet',resultadosSha256:'a'.repeat(64),
   estadoPublicacion:'INTEGRADO_EN_REVISION',controlesTecnicosAprobados:true,certificado:false,
   matrices:names.map((n,i)=>({
    metodo:n,escenario:'base',estado:i===1||i===3?'N/A':'OK',
    estadoFuente:i===1||i===3?'N/D':undefined,
    motivo:i===1||i===3?'Flujos negativos FY+3, método sin peso':'',
    fundamentalFY3:[1,2,3,4,5],multiploElegido:[1,2,3,4,5],
    centro:i===1||i===3?null:10,vp3Original:10,
    matriz:i===1||i===3?null:Array.from({length:5},()=>Array(5).fill(10))
   }))
  }
 };
};
test('muestra cinco matrices nativas Base, dos N/A con causa y sin escenarios inventados',()=>{
 const html=native(mk());
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,5);
 assert.match(html,/Base integradas técnicamente en EN_REVISION/);
 assert.match(html,/N\/A · fuente N\/D · peso 0 %/);
 assert.doesNotMatch(html,/Conservador · siete métodos|Optimista · siete métodos/);
});
test('oculta la revisión equivocada, candidato no integrado y grilla adulterada',()=>{
 const wrong=mk();wrong.sensibilidadMultiples.revisionId='OTRA';
 assert.match(native(wrong),/revisión, hoja o fotografía no coincide/);
 assert.doesNotMatch(native(wrong),/jmr-native-matrix-table/);
 const pending=mk();pending.sensibilidadMultiples.estadoPublicacion='CANDIDATO_NO_PUBLICADO';
 assert.match(native(pending),/sin validación técnica/);
 assert.doesNotMatch(native(pending),/jmr-native-matrix-table/);
 const altered=mk();altered.sensibilidadMultiples.matrices[0].matriz[2][2]=999;
 const html=native(altered);
 assert.match(html,/Matriz ocultada: centro FY\+3/);
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,4);
});
test('no convierte N/A no respaldado ni N/D a cero',()=>{
 const rec=mk();
 rec.descuentoMultiples.metodos.find(x=>x.nombre==='EV/FCFF').peso=0.2;
 const html=native(rec);
 assert.match(html,/N\/A sin causa y ponderación conciliadas/);
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,5);
 assert.doesNotMatch(html,/>0,00<\/td>/);
});
test('es invocado desde el panel de sensibilidades y conserva el render DCF previo',()=>{
 assert.match(src,/const native=nativeMultiplesHtml\(rec\);/);
 assert.match(src,/if\(native\)\{parts\.push\(native\);\}/);
 assert.match(src,/function normalizeDcfMatrices\(s\)/);
});

const mkFloyd=()=>{
 const rec=mk();
 rec.ticker='UBER';
 rec.perfil_valoracion='Floyd';
 rec.sensibilidadMultiples.matrices=rec.sensibilidadMultiples.matrices.slice(0,5).map(m=>({
  ...m,estado:'OK',centro:10,vp3Original:10,
  fundamentalFY3:[100,200,300,400,500],multiploElegido:[1,2,3,4,5],
  matriz:Array.from({length:5},()=>Array(5).fill(10))
 }));
 for(const method of rec.descuentoMultiples.metodos)method.base={vp:[8,9,10]};
 return rec;
};
test('Floyd muestra cinco matrices Base con múltiplos en las filas',()=>{
 const rec=mkFloyd();
 const html=native(rec);
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,5);
 assert.match(html,/Filas: múltiplo elegido · Columnas: fundamental FY\+3/);
 assert.match(html,/<th scope="col">100,00<\/th>/);
 assert.match(html,/<th scope="row">1,00×<\/th>/);
 assert.match(native(mk()),/Filas: fundamental FY\+3 · Columnas: múltiplo elegido/);
 rec.sensibilidadMultiples.matrices.pop();
 assert.match(native(rec),/Sensibilidades Base Floyd incompletas/);
});
test('Floyd comprueba el centro contra el valor presente del método',()=>{
 const rec=mkFloyd();
 rec.descuentoMultiples.metodos[0].base.vp[2]=20;
 const html=native(rec);
 assert.match(html,/Matriz ocultada: centro FY\+3/);
 assert.equal((html.match(/class="jmr-native-matrix-table"/g)||[]).length,4);
});

test('expediente Floyd separa estados y valoración y conserva la navegación de siete secciones',()=>{
 assert.match(src,/sourceBookForView=view=>view==='financieros'\|\|view==='indicadores'/);
 assert.match(src,/libro=historicos/);
 assert.match(src,/workbookBook===book/);
 assert.match(src,/rec\?\.libros\?\.historicos/);
});
