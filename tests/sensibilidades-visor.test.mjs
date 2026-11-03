import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../docs/expediente.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../docs/expediente.html',import.meta.url),'utf8');
const norm=new Function(src.match(/function normalizeDcfMatrices\(s\)\{[\s\S]*?\n\}/)[0]+';return normalizeDcfMatrices;')();
const grid=c=>Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>c+(i-2)*10+(j-2)));
const ax=[.08,.09,.1,.11,.12];

test('lee el diccionario {rows,columns,values} de las revisiones A-1.2 con ejes con nombre',()=>{
  const m=norm({matrices:{waccVsTerminalGrowth:{rows:ax,columns:ax,values:grid(100)},
    waccVsTerminalROIC:{rows:ax,columns:ax,values:grid(100)},crecimientoVsMargen:{rows:ax,columns:ax,values:grid(100)}}});
  assert.equal(m.length,3);
  assert.deepEqual(m.map(x=>x.etiquetaFilas),['WACC','ROIC terminal','Crecimiento ventas (CAGR 1-5)']);
  assert.equal(m[0].valores[2][2],100);
  assert.equal(m[0].centroConciliado,null,'sin bandera declarada no se presume conciliado');
});

test('lee listas {title,rows,columns,values} con etiquetas propias y hereda la conciliación declarada',()=>{
  const m=norm({centroConciliado:true,matrices:[{title:'Ke × g terminal',rowsLabel:'Ke',columnsLabel:'g',rows:ax,columns:ax,values:grid(14)},
    {title:'ROE terminal × g',rows:ax,columns:ax,values:grid(14)}]});
  assert.equal(m.length,2);
  assert.equal(m[0].etiquetaFilas,'Ke');assert.equal(m[1].etiquetaFilas,'ROE terminal');assert.equal(m[1].etiquetaColumnas,'g');
  assert.ok(m.every(x=>x.centroConciliado===true));
  assert.equal(norm({centroConciliado:true,matrices:[{centroConciliado:false,title:'A × B',rows:ax,columns:ax,values:grid(1)}]})[0].centroConciliado,false);
});

test('colorea frente al valor intrínseco o al precio, sin alterar cifras',()=>{
  assert.match(src,/function paintSensitivity\(root,ref\)/);
  assert.match(src,/data-sens-ref="intrinsic"/);
  assert.match(src,/data-sens-ref="price"/);
  assert.match(src,/td\.classList\.add\(d>0\?'sens-up':'sens-down'\)/);
  assert.match(src,/m\.centroConciliado===true && rows\.length===5/,'la puerta de conciliación declarada se mantiene');
  assert.match(html,/td\.sens-up[^{]*\{background:color-mix\(in srgb,var\(--positive/);
  assert.match(html,/td\.sens-down[^{]*\{background:color-mix\(in srgb,var\(--negative/);
});
