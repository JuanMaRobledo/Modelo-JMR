// JMR · Comparación de múltiplos derivados de cada DCF vs precio de referencia.
// Crea UNA pestaña anexa sin alterar DCF, Inputs, selectores ni otras celdas.
// Precio guardado != cotización actual hasta obtener fuente verificable.
// Usage: buildJmrMultipleSheet(valoracion, uniqueSheetId) => Sheets API requests.
function buildJmrMultipleSheet(j, gid) {
  var imp=j.multiplosImplicitosDCF && j.multiplosImplicitosDCF.metodos || [];
  var mk=j.cotizacionMultiples || {}, ratio=mk.metodos||[];
  var ke=j.descuentoMultiples && j.descuentoMultiples.costoPatrimonio,price=mk.precioMercado;
  var dcf=(j.metodos||[]).find(function(x){return /^DCF\b/i.test(x.nombre||'');})||{};
  if(!imp.length || !(Number.isFinite(price)&&price>0&&Number.isFinite(ke)&&ke>-1))return null;
  var rows=Array.from({length:18},function(){return Array(17).fill(null);});
  rows[0][0]=(j.ticker||'Activo')+' · DCF por escenario vs múltiplos de mercado comparables (FY+3)';
  rows[1][0]='Precio de referencia (NO necesariamente hoy)';rows[1][1]=price;rows[1][2]='Fecha/corte: '+(mk.fechaCorte||'sin verificar');
  rows[2][0]='Ke del DCF';rows[2][1]=ke;
  rows[3][0]='Precio equivalente FY+3';rows[3][1]='=B2*(1+B3)^3';
  rows[4][0]='LTM N/D: solo mostrar ratios de una fuente fechada con idéntica definición. Esta instantánea utiliza la última cotización GUARDADA en el expediente.';
  rows[5]=['Método','Mercado LTM','DCF Conserv.','Precio ref. Conserv.','Δ Conserv.','DCF Base','Precio ref. Base','Δ Base','DCF Optim.','Precio ref. Optim.','Δ Optim.','Coef. Cons.','Coef. Base','Coef. Opt.','DCF FY+3 Cons.','DCF FY+3 Base','DCF FY+3 Opt.'];
  var keys=['conservador','base','optimista'],mF=['C','F','I'],qF=['D','G','J'],fac=['L','M','N'],target=['O','P','Q'],priceFY3=price*Math.pow(1+ke,3);
  for(var i=0;i<5;i++){
    var m=imp[i];if(!m)continue;
    var nr=i+7,ix=i+6,z=ratio.find(function(x){return x.nombre===m.nombre;})||{};
    rows[ix][0]=m.nombre;rows[ix][1]='N/D';
    keys.forEach(function(k,jj){
      var v=m[k],future=dcf[k],traded=z.mercado_FY3_equivalente&&z.mercado_FY3_equivalente[k];
      var coef=(Number.isFinite(v)&&Number.isFinite(future)&&Number.isFinite(traded)&&Math.abs(priceFY3-future)>0.000001)?(traded-v)/(priceFY3-future):null;
      if(Number.isFinite(v)&&v>0&&v<1000)rows[ix][[2,5,8][jj]]=v;
      if(Number.isFinite(coef)&&coef>0)rows[ix][11+jj]=coef;
      if(Number.isFinite(future))rows[ix][14+jj]=future;
      rows[ix][[3,6,9][jj]]='=IFERROR(IF(OR(NOT(ISNUMBER('+mF[jj]+nr+'));NOT(ISNUMBER('+fac[jj]+nr+')));"";'+mF[jj]+nr+'+($B$4-'+target[jj]+nr+')*'+fac[jj]+nr+');"")';
      rows[ix][[4,7,10][jj]]='=IFERROR('+qF[jj]+nr+'/'+mF[jj]+nr+'-1;"")';
    });
  }
  rows[12][0]='Múltiplo a precio ref. = múltiplo que justifica cada DCF + (precio de referencia FY+3 − DCF propio FY+3) × sensibilidad por acción y métrica.';
  rows[13][0]='NO cruzar LTM con FY+3 para afirmar sobrevaloración. EV/FCFF no es EV/FCF, ni P/FCFE es P/FCF. Déficit de fuentes = N/D.';
  rows[14][0]='INSTANTÁNEA: B2 actualiza el precio en esta tabla; los cambios futuros del DCF o del denominador exigen regenerar y validar el anexo.';
  rows[15][0]='Fuente precio: '+(mk.fuente||'registro guardado, sin verificación de cotización vigente');
  rows[16][0]='Ajustar para acciones diluidas, opciones, pasivos de leasing, caja y deuda; bancos/holdings requieren modelo particular.';
  function cell(v){return v==null?{}:{userEnteredValue:typeof v==='number'&&isFinite(v)?{numberValue:v}:typeof v==='string'&&v.startsWith('=')?{formulaValue:v}:{stringValue:String(v)}};}
  var req=[
    {addSheet:{properties:{sheetId:gid,title:'Múltiplos y mercado FY+3',gridProperties:{rowCount:50,columnCount:17,frozenRowCount:6,hideGridlines:true}}}},
    {updateCells:{range:{sheetId:gid,startRowIndex:0,endRowIndex:18,startColumnIndex:0,endColumnIndex:17},rows:rows.map(function(v){return {values:v.map(cell)};}),fields:'userEnteredValue'}},
    {repeatCell:{range:{sheetId:gid,startRowIndex:5,endRowIndex:6,startColumnIndex:0,endColumnIndex:11},cell:{userEnteredFormat:{backgroundColor:{red:.92,green:.93,blue:.96},textFormat:{bold:true},wrapStrategy:'WRAP'}},fields:'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)'}},
    {repeatCell:{range:{sheetId:gid,startRowIndex:6,endRowIndex:11,startColumnIndex:2,endColumnIndex:11},cell:{userEnteredFormat:{numberFormat:{type:'NUMBER',pattern:'0.00"x"'}}},fields:'userEnteredFormat.numberFormat'}},
    {repeatCell:{range:{sheetId:gid,startRowIndex:2,endRowIndex:3,startColumnIndex:1,endColumnIndex:2},cell:{userEnteredFormat:{numberFormat:{type:'PERCENT',pattern:'0.00%'}}},fields:'userEnteredFormat.numberFormat'}},
    {updateDimensionProperties:{range:{sheetId:gid,dimension:'COLUMNS',startIndex:0,endIndex:1},properties:{pixelSize:174},fields:'pixelSize'}},
    {updateDimensionProperties:{range:{sheetId:gid,dimension:'COLUMNS',startIndex:1,endIndex:11},properties:{pixelSize:132},fields:'pixelSize'}},
    {updateDimensionProperties:{range:{sheetId:gid,dimension:'COLUMNS',startIndex:11,endIndex:17},properties:{hiddenByUser:true},fields:'hiddenByUser'}},
    {updateDimensionProperties:{range:{sheetId:gid,dimension:'ROWS',startIndex:5,endIndex:6},properties:{pixelSize:56},fields:'pixelSize'}}
  ];
  [4,7,10].forEach(function(k){req.push({repeatCell:{range:{sheetId:gid,startRowIndex:6,endRowIndex:11,startColumnIndex:k,endColumnIndex:k+1},cell:{userEnteredFormat:{numberFormat:{type:'PERCENT',pattern:'0.0%'}}},fields:'userEnteredFormat.numberFormat'}});});
  return req;
}
