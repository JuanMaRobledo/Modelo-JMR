/* Editor de libro JMR: consulta de todas las pestañas, escritura segura de datos fuente. */
(function(global){
  'use strict';
  function byId(id){return document.getElementById(id);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function colNumber(letters){var n=0;for(var c of letters)n=n*26+c.charCodeAt(0)-64;return n;}
  function colName(n){var out='';while(n){n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}return out;}
  function coordinates(a){var m=/^([A-Z]+)([1-9]\d*)$/.exec(a);return m?{col:colNumber(m[1]),row:+m[2]}:null;}
  function isEditable(sheet,address,cell,writable){
    if(!writable||!cell||cell.formula||typeof (cell.raw||{}).numberValue!=='number')return false;
    if(sheet==='Input sheet')return /^(B[1-9]\d{0,2}|D1)$/.test(address);
    if(['Income Statement','Balance Sheet','Cash Flow Statement'].includes(sheet)){
      var c=coordinates(address);return !!c&&c.col>=2&&c.col<=702&&c.row>=2&&c.row<=9999;
    }
    return false;
  }
  function normalizedNumber(cell){return typeof cell.raw?.numberValue==='number'?cell.raw.numberValue:cell.v;}
  function formatNumber(cell,value){
    var percent=/%\s*$/.test(String(cell.w||''));
    return {percent:percent,scale:percent?100:1,value:JmrDisplayNumber.editValue(value,percent?100:1)};
  }
  var snapshot=null,ticker='',selected='',firstRow=1,firstCol=1,pageRows=30,pageCols=9;
  var drafts=new Map(),busy=false,loader=0,dimensions={};
  function setStatus(msg,type){var n=byId('status');n.textContent=msg;n.dataset.kind=type||'neutral';}
  function setMode(){
    var n=byId('editState');
    if(!snapshot){n.textContent='Sin modelo';n.dataset.mode='neutral';return;}
    n.textContent=snapshot.writable?'Conexión de edición disponible':'Solo lectura';
    n.dataset.mode=snapshot.writable?'writable':'readonly';
  }
  function bounds(sheet){
    if(dimensions[sheet])return dimensions[sheet];
    var maxRow=1,maxCol=1;
    Object.keys(snapshot?.sheets?.[sheet]||{}).forEach(function(address){
      var c=coordinates(address);if(c){maxRow=Math.max(maxRow,c.row);maxCol=Math.max(maxCol,c.col);}
    });
    dimensions[sheet]={row:maxRow,col:maxCol};
    return dimensions[sheet];
  }
  function table(){
    var host=byId('sheetTable');host.innerHTML='';
    if(!snapshot||!selected)return;
    var source=snapshot.sheets[selected]||{},max=bounds(selected);
    firstRow=Math.min(Math.max(1,firstRow),max.row);
    firstCol=Math.min(Math.max(1,firstCol),max.col);
    byId('startRow').value=firstRow;
    byId('startCol').value=colName(firstCol);
    byId('rangeLabel').textContent='Filas '+firstRow+'–'+Math.min(max.row,firstRow+pageRows-1)+
      ' · columnas '+colName(firstCol)+'–'+colName(Math.min(max.col,firstCol+pageCols-1))+
      ' · '+Object.keys(source).length+' celdas cargadas';
    var display='<table class="workbook-table"><thead><tr><th scope="col" class="row-label">Fila</th>';
    for(var col=firstCol;col<=Math.min(max.col,firstCol+pageCols-1);col++)
      display+='<th scope="col">'+colName(col)+'</th>';
    display+='</tr></thead><tbody>';
    for(var row=firstRow;row<=Math.min(max.row,firstRow+pageRows-1);row++){
      display+='<tr><th scope="row" class="row-label">'+row+'</th>';
      for(var ci=firstCol;ci<=Math.min(max.col,firstCol+pageCols-1);ci++){
        var address=colName(ci)+row,c=source[address],id=selected+'!'+address,d=drafts.get(id);
        if(!c){display+='<td class="empty-cell" aria-label="'+address+' vacía"></td>';continue;}
        var edit=isEditable(selected,address,c,!!snapshot.writable),n=normalizedNumber(c);
        if(edit){
          var fmt=formatNumber(c,d?d.value:n);
          display+='<td class="editable-cell'+(d?' dirty':'')+'" title="'+esc(address)+' · dato editable">'+
            '<label class="cell-label" for="cell-'+esc(address)+'">'+esc(address)+'</label>'+
            '<input id="cell-'+esc(address)+'" aria-label="'+esc(selected+' '+address)+'" type="number" step="0.01" '+
            'data-address="'+esc(address)+'" data-scale="'+fmt.scale+'" data-initial-display="'+
            esc(formatNumber(c,n).value)+'" value="'+esc(fmt.value)+'" '+(busy?'disabled':'')+'>'+
            (fmt.percent?'<span class="cell-unit">%</span>':'')+'</td>';
        }else{
          var label=JmrDisplayNumber.formatCell(c);
          display+='<td class="'+(c.formula?'formula-cell':'readonly-cell')+'" title="'+esc(address+(c.formula?' · fórmula protegida: '+c.formula:' · solo lectura'))+'">'+
            '<div class="cell-display">'+esc(label)+'</div>'+(c.formula?'<small>ƒx</small>':'')+'</td>';
        }
      }
      display+='</tr>';
    }
    display+='</tbody></table>';
    host.innerHTML=display;
    byId('prevRows').disabled=firstRow<=1;
    byId('nextRows').disabled=firstRow+pageRows>max.row;
    byId('prevCols').disabled=firstCol<=1;
    byId('nextCols').disabled=firstCol+pageCols>max.col;
  }
  function pending(){
    var n=byId('pendingChanges'),save=byId('saveChanges'),discard=byId('discardChanges');
    n.textContent=drafts.size?drafts.size+' cambio(s) pendiente(s)':'No hay cambios pendientes';
    save.disabled=!drafts.size||busy||!snapshot?.writable;
    discard.disabled=!drafts.size||busy;
    var html=[];
    drafts.forEach(function(d){
      html.push('<li><strong>'+esc(d.sheet)+'!'+esc(d.cell)+'</strong> · '+
        esc(JmrDisplayNumber.format(formatNumber(snapshot.sheets[d.sheet][d.cell],d.previous).value)+(formatNumber(snapshot.sheets[d.sheet][d.cell],d.previous).percent?'%':''))+' → <strong>'+esc(JmrDisplayNumber.format(formatNumber(snapshot.sheets[d.sheet][d.cell],d.value).value)+(formatNumber(snapshot.sheets[d.sheet][d.cell],d.value).percent?'%':''))+'</strong></li>');
    });
    byId('pendingList').innerHTML=html.join('');
  }
  function selectSheet(name){
    selected=name;firstRow=1;firstCol=1;
    byId('sheetName').textContent=name;
    byId('sheetPicker').value=name;
    table();
  }
  function openSnapshot(result){
    snapshot=result;dimensions={};drafts.clear();
    var list=Object.keys(result.sheets||{});
    if(!list.length)throw new Error('La hoja no contiene pestañas legibles.');
    var chosen=list.includes('Input sheet')?'Input sheet':list[0];
    byId('sheetPicker').innerHTML=list.map(function(name){
      return '<option value="'+esc(name)+'">'+esc(name)+'</option>';
    }).join('');
    byId('workbook').hidden=false;
    byId('companyName').textContent=(result.record?.company||result.record?.empresa||ticker)+
      ' · '+ticker+' · '+list.length+' pestañas';
    byId('sourceDate').textContent='Lectura: '+new Date(result.fetchedAt||Date.now()).toLocaleString('es-CO');
    var url=result.record?.hojaGoogle||'';
    byId('nativeSheet').hidden=!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(url);
    if(!byId('nativeSheet').hidden)byId('nativeSheet').href=url;
    byId('researchLink').href='research.html?ticker='+encodeURIComponent(ticker);
    byId('calcLink').href='calculadora.html?ticker='+encodeURIComponent(ticker);
    setMode();selectSheet(chosen);pending();
    if(result.writable)setStatus('Libro importado. Edita las celdas permitidas y confirma “Guardar cambios en Google Sheets”.','ok');
    else setStatus('Libro importado en solo lectura. Para editar en esta pestaña se necesita la conexión de escritura del servidor. Puedes abrir la hoja original.','warn');
  }
  async function load(){
    if(busy)return;
    var key;try{key=JmrModelSync.ticker(byId('ticker').value);}catch(e){setStatus(e.message,'error');return;}
    if(drafts.size&&!global.confirm('Tienes cambios sin guardar. ¿Descartarlos y cargar otra vez?'))return;
    ticker=key;busy=true;byId('load').disabled=true;
    setStatus('Importando libro vigente de '+ticker+'…','neutral');
    var request=++loader;
    try{
      var result=await JmrModelSync.load(key);
      if(request!==loader)return;
      openSnapshot(result);
    }catch(e){setStatus('No se pudo importar '+ticker+': '+e.message,'error');}
    finally{busy=false;byId('load').disabled=false;pending();}
  }
  function change(event){
    var input=event.target;
    if(!input.matches('input[data-address]')||busy||!snapshot?.writable)return;
    var address=input.dataset.address,cell=snapshot.sheets[selected]?.[address];
    if(!isEditable(selected,address,cell,!!snapshot.writable))return;
    var rawInput=input.value.trim(),value=Number(rawInput)/Number(input.dataset.scale||1);
    if(!rawInput||!/^-?\d+(?:\.\d{0,2})?$/.test(rawInput)||!Number.isFinite(value)||Math.abs(value)>1e15){
      setStatus('Escribe como máximo dos decimales en '+selected+'!'+address+'. La precisión fuente no se altera hasta guardar.','error');
      table();return;
    }
    var id=selected+'!'+address,previous=cell.raw.numberValue;
    if(rawInput===input.dataset.initialDisplay||Object.is(value,previous))drafts.delete(id);
    else drafts.set(id,{sheet:selected,cell:address,previous,value});
    pending();table();
    if(drafts.size)setStatus('Cambios preparados, todavía NO guardados en Google Sheets.','warn');
  }
  async function save(){
    if(!snapshot?.writable||busy||!drafts.size)return;
    if(drafts.size>50){setStatus('Máximo 50 cambios por guardado. Descarta o reduce el lote.','error');return;}
    var changes=Array.from(drafts.values()),confirmed=global.confirm('¿Guardar '+changes.length+' cambio(s) directamente en la hoja oficial de '+ticker+'? Se conservarán las fórmulas.');
    if(!confirmed)return;
    busy=true;pending();byId('load').disabled=true;
    setStatus('Guardando cambios directamente en Google Sheets…','neutral');
    try{
      var res=await fetch('/api/model?ticker='+encodeURIComponent(ticker),{
        method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({revision:snapshot.revision,changes})
      });
      var data=await res.json().catch(function(){return {};});
      if(!res.ok)throw new Error(data.error||'No se confirmó la escritura (HTTP '+res.status+').');
      if(!data.sheets||!data.revision)throw new Error('No se recibió la hoja actualizada; vuelve a leer antes de continuar.');
      var failed=changes.filter(function(c){return data.sheets[c.sheet]?.[c.cell]?.raw?.numberValue!==c.value;});
      if(failed.length)throw new Error('Google devolvió valores diferentes en '+failed.length+' celdas. Reimporta y verifica la hoja.');
      data.record=data.record||snapshot.record;
      openSnapshot({...data,writable:true});
      global.dispatchEvent(new CustomEvent('jmr-model-updated',{detail:{ticker}}));
      setStatus('Guardados y verificados '+changes.length+' cambio(s) en Google Sheets. El análisis publicado requiere revisión y republicación independiente.','ok');
    }catch(e){
      setStatus(e.message+' Los cambios en pantalla NO se consideran guardados. Reimporta y verifica antes de reintentar.','error');
      if(/cambió|409|conflict/i.test(e.message))byId('conflict').hidden=false;
    }finally{
      busy=false;byId('load').disabled=false;pending();table();
    }
  }
  function discard(){
    if(drafts.size&&!global.confirm('¿Descartar los cambios preparados sin guardarlos?'))return;
    drafts.clear();pending();table();setStatus('Cambios locales descartados; la hoja oficial sigue sin modificarse.','neutral');
  }
  function bind(){
    byId('lookup').addEventListener('submit',function(e){e.preventDefault();load();});
    byId('sheetPicker').addEventListener('change',function(){selectSheet(this.value);});
    byId('sheetTable').addEventListener('change',change);
    byId('prevRows').addEventListener('click',function(){firstRow=Math.max(1,firstRow-pageRows);table();});
    byId('nextRows').addEventListener('click',function(){firstRow+=pageRows;table();});
    byId('prevCols').addEventListener('click',function(){firstCol=Math.max(1,firstCol-pageCols);table();});
    byId('nextCols').addEventListener('click',function(){firstCol+=pageCols;table();});
    byId('gotoRange').addEventListener('submit',function(e){
      e.preventDefault();
      var row=Number(byId('startRow').value),col=colNumber(byId('startCol').value.trim().toUpperCase());
      if(!Number.isSafeInteger(row)||row<1||!Number.isSafeInteger(col)||col<1){setStatus('Rango inválido.','error');return;}
      firstRow=row;firstCol=col;table();
    });
    byId('saveChanges').addEventListener('click',save);
    byId('discardChanges').addEventListener('click',discard);
    global.addEventListener('beforeunload',function(e){if(drafts.size){e.preventDefault();e.returnValue='';}});
    var fromUrl=new URLSearchParams(global.location.search).get('ticker');
    if(fromUrl){byId('ticker').value=fromUrl;load();}
  }
  global.JmrSheetEditor={isEditable,coordinates,colName,formatNumber};
  if(typeof document!=='undefined'&&byId('lookup'))bind();
})(typeof window!=='undefined'?window:globalThis);
