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