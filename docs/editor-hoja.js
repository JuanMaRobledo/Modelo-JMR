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
  // La fuente sigue siendo exactamente el libro leído de Google Sheets.
  // Las cuatro vistas son accesos a hojas reales, sin generar datos nuevos.
  function normalizeName(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
  function findMainSheet(kind,names){
    var list=names||[], normalized=list.map(normalizeName);
    var preferred={
      input:['input sheet','input','inputs'],
      valuation:['valuation output','valuation outputs'],
      multiples:['descuento de multiplos','multiplos','multiples','ev/ebit','ev/ebitda','p/e','p/ventas','p/s','p/bv'],
      financial:['financials multiples','financial multiples','financial multiple','financial multiples worksheet']
    }[kind]||[];
    for(var p of preferred){var index=normalized.indexOf(p);if(index>=0)return list[index];}
    if(kind==='multiples')return list.find(function(n){return /^(ev\/|p\/|multip|descuento de m)/i.test(normalizeName(n));})||'';
    if(kind==='financial')return list.find(function(n){return /^financials? multiples?/i.test(normalizeName(n));})||'';
    return '';
  }
  function mainKind(name){
    var n=normalizeName(name);
    if(n==='input sheet'||n==='input'||n==='inputs')return 'input';
    if(n==='valuation output'||n==='valuation outputs')return 'valuation';
    if(/^financials? multiple/.test(n))return 'financial';
    if(n.startsWith('descuento de multip')||n==='multiples'||n==='multiplos'||/^(ev\/|p\/)/.test(n))return 'multiples';
    return '';
  }
  function sectionType(sheet,source,row,maxCol){
    var label=String(source['A'+row]?.v||'').trim();
    if(!label)return '';
    var nonempty=0;
    for(var i=2;i<=Math.min(maxCol,12);i++){var cell=source[colName(i)+row];if(cell&&cell.v!==null&&cell.v!==undefined&&cell.v!=='')nonempty++;}
    if(nonempty===0&&label.length>=4)return ' section-row';
    if(/^(valor intr[ií]nseco|estimated value|intrinsic value|price per share|valor por acci[oó]n|dcf base|valor empresa|equity value|total weighted)/i.test(label))return ' value-row';
    return '';
  }
  // Solo inspecciona fórmulas del propio Google Sheets, jamás calcula un
  // precio por múltiplos ni acepta un valor pegado como prueba de cálculo.
  function multiplesFormulaAudit(sheets){
    var checks=[
      ['EV/EBITDA','Descuento de múltiplos','J20'],
      ['EV/FCFF','Descuento de múltiplos','J21'],
      ['P/E','Descuento de múltiplos','J22'],
      ['P/FCFE','Descuento de múltiplos','J23'],
      ['P/OCF','Descuento de múltiplos','J24'],
      ['P/S (P/V)','PV','E42'],
      ['P/BV','PBV','E42']
    ];
    return checks.map(function(row){
      var cell=sheets?.[row[1]]?.[row[2]];
      return {method:row[0],sheet:row[1],cell:row[2],hasValue:typeof cell?.v==='number'&&Number.isFinite(cell.v),
        hasFormula:typeof cell?.formula==='string'&&cell.formula.startsWith('=')};
    });
  }
  function updateMultiplesStatus(){
    var host=byId('multiplesFormulaStatus');
    if(!host||!snapshot)return;
    var checks=multiplesFormulaAudit(snapshot.sheets),withFormula=checks.filter(x=>x.hasValue&&x.hasFormula);
    var unresolved=checks.filter(x=>!x.hasValue||!x.hasFormula);
    var notes=unresolved.map(x=>x.method+' ('+x.sheet+'!'+x.cell+')');
    host.textContent='Origen: Google Sheets · '+withFormula.length+'/7 resultados con celda numérica y fórmula visible. '+
       (notes.length?'Pendientes de evidencia: '+notes.join(', ')+'. ':'')+
       'Este control no sustituye comparar las fórmulas con la plantilla maestra.';
    host.dataset.coverage=withFormula.length===7?'complete':'incomplete';
  }
  var snapshot=null,ticker='',selected='',firstRow=1,firstCol=1,pageRows=30,pageCols=9,fullSheet=true;
  var drafts=new Map(),busy=false,loader=0,dimensions={};
  var MAX_FULL_CELLS=30000;
  function refreshShortcuts(){
    var names=Object.keys(snapshot?.sheets||{});
    document.querySelectorAll('#modelSheetTabs [data-sheet-kind]').forEach(function(button){
      var name=findMainSheet(button.dataset.sheetKind,names),active=!!name&&mainKind(selected)===button.dataset.sheetKind;
      button.disabled=!name;
      button.title=name?'Abrir '+name:'Esta pestaña no está en el libro importado';
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function inspect(address){
    var c=snapshot?.sheets?.[selected]?.[address];
    byId('inspectorAddress').textContent=c?selected+'!'+address:'Selecciona una celda';
    byId('inspectorValue').textContent=c?JmrDisplayNumber.formatCell(c):'Sin valor en esta celda';
    byId('inspectorFormula').textContent=c?.formula||'— (dato o texto, sin fórmula)';
  }
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
    var canFull=max.row*max.col<=MAX_FULL_CELLS;
    var all=fullSheet&&canFull;
    var startRow=all?1:firstRow,startCol=all?1:firstCol;
    var endRow=all?max.row:Math.min(max.row,firstRow+pageRows-1);
    var endCol=all?max.col:Math.min(max.col,firstCol+pageCols-1);
    byId('toggleFullSheet').disabled=!canFull;
    byId('toggleFullSheet').textContent=!canFull?'Hoja extensa · vista por bloques':all?'Ver por bloques':'Ver hoja completa';
    byId('toggleFullSheet').setAttribute('aria-pressed',String(all));
    byId('toggleFullSheet').title=canFull?'Cambiar modo de visualización':'La hoja es muy grande para mostrarla toda a la vez; todas sus celdas están accesibles por bloques.';
    byId('rangeToolbar').hidden=all;
    byId('rangeLabel').textContent=(all?'Hoja completa · ':(!canFull?'Hoja extensa, sin omitir celdas · ':'Vista por bloques · '))+
      'filas '+startRow+'–'+endRow+' de '+max.row+
      ' · columnas '+colName(startCol)+'–'+colName(endCol)+' de '+colName(max.col)+
      ' · '+Object.keys(source).length+' celdas con datos';
    var display='<table class="workbook-table"><thead><tr><th scope="col" class="row-label">Fila</th>';
    for(var col=startCol;col<=endCol;col++)
      display+='<th scope="col">'+colName(col)+'</th>';
    display+='</tr></thead><tbody>';
    for(var row=startRow;row<=endRow;row++){
      display+='<tr class="'+sectionType(selected,source,row,max.col)+'"><th scope="row" class="row-label">'+row+'</th>';
      for(var ci=startCol;ci<=endCol;ci++){
        var address=colName(ci)+row,c=source[address],id=selected+'!'+address,d=drafts.get(id);
        if(!c){display+='<td class="empty-cell'+(ci===startCol?' first-source-col':'')+'" data-cell="'+address+'" aria-label="'+address+' vacía"></td>';continue;}
        var edit=isEditable(selected,address,c,!!snapshot.writable),n=normalizedNumber(c);
        if(edit){
          var fmt=formatNumber(c,d?d.value:n);
          display+='<td class="editable-cell'+(d?' dirty':'')+(ci===startCol?' first-source-col':'')+'" data-cell="'+esc(address)+'" title="'+esc(address)+' · dato editable">'+
            '<label class="cell-label" for="cell-'+esc(address)+'">'+esc(address)+'</label>'+
            '<input id="cell-'+esc(address)+'" aria-label="'+esc(selected+' '+address)+'" type="number" step="0.01" '+
            'data-address="'+esc(address)+'" data-scale="'+fmt.scale+'" data-initial-display="'+
            esc(formatNumber(c,n).value)+'" value="'+esc(fmt.value)+'" '+(busy?'disabled':'')+'>'+
            (fmt.percent?'<span class="cell-unit">%</span>':'')+'</td>';
        }else{
          var label=JmrDisplayNumber.formatCell(c);
          display+='<td class="'+(c.formula?'formula-cell':'readonly-cell')+(ci===startCol?' first-source-col':'')+'" data-cell="'+esc(address)+'" title="'+esc(address+(c.formula?' · fórmula protegida: '+c.formula:' · solo lectura'))+'">'+
            '<div class="cell-display">'+esc(label)+'</div>'+(c.formula?'<small>ƒx</small>':'')+'</td>';
        }
      }
      display+='</tr>';
    }
    display+='</tbody></table>';
    host.innerHTML=display;
    byId('prevRows').disabled=all||firstRow<=1;
    byId('nextRows').disabled=all||firstRow+pageRows>max.row;
    byId('prevCols').disabled=all||firstCol<=1;
    byId('nextCols').disabled=all||firstCol+pageCols>max.col;
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
    if(!snapshot?.sheets?.[name])return;
    selected=name;firstRow=1;firstCol=1;fullSheet=true;
    byId('sheetName').textContent=name;
    byId('sheetPicker').value=name;
    refreshShortcuts();
    inspect(null);
    table();
  }
  function openSnapshot(result){
    snapshot=result;dimensions={};drafts.clear();
    var list=Object.keys(result.sheets||{});
    if(!list.length)throw new Error('La hoja no contiene pestañas legibles.');
    var querySheet=new URLSearchParams(global.location.search).get('sheet');
    var requested=list.find(function(n){return normalizeName(n)===normalizeName(querySheet);});
    var chosen=requested||findMainSheet('input',list)||list[0];
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
    setMode();selectSheet(chosen);pending();updateMultiplesStatus();
    if(result.catalogAvailable && !result.official)setStatus('Hoja recuperada fuera del catálogo oficial: solo lectura hasta conciliar esta versión. No se modificarán fórmulas ni resultados.','warn');
    else if(result.writable)setStatus('Libro oficial importado. Edita solo celdas permitidas y confirma “Guardar cambios en Google Sheets”.','ok');
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
    byId('modelSheetTabs').addEventListener('click',function(e){
      var btn=e.target.closest('button[data-sheet-kind]');
      if(!btn||btn.disabled||!snapshot)return;
      var name=findMainSheet(btn.dataset.sheetKind,Object.keys(snapshot.sheets));
      if(name)selectSheet(name);
    });
    byId('toggleFullSheet').addEventListener('click',function(){
      if(!snapshot||!selected)return;
      fullSheet=!fullSheet;firstRow=1;firstCol=1;table();
    });
    byId('sheetTable').addEventListener('click',function(e){
      var cell=e.target.closest('td[data-cell]');
      if(cell)inspect(cell.dataset.cell);
    });
    byId('sheetTable').addEventListener('change',change);
    byId('prevRows').addEventListener('click',function(){firstRow=Math.max(1,firstRow-pageRows);table();});
    byId('nextRows').addEventListener('click',function(){firstRow+=pageRows;table();});
    byId('prevCols').addEventListener('click',function(){firstCol=Math.max(1,firstCol-pageCols);table();});
    byId('nextCols').addEventListener('click',function(){firstCol+=pageCols;table();});
    byId('gotoRange').addEventListener('submit',function(e){
      e.preventDefault();
      var row=Number(byId('startRow').value),col=colNumber(byId('startCol').value.trim().toUpperCase());
      if(!Number.isSafeInteger(row)||row<1||!Number.isSafeInteger(col)||col<1){setStatus('Rango inválido.','error');return;}
      firstRow=row;firstCol=col;fullSheet=false;table();
    });
    byId('saveChanges').addEventListener('click',save);
    byId('discardChanges').addEventListener('click',discard);
    global.addEventListener('beforeunload',function(e){if(drafts.size){e.preventDefault();e.returnValue='';}});
    var fromUrl=new URLSearchParams(global.location.search).get('ticker');
    if(fromUrl){byId('ticker').value=fromUrl;load();}
  }
  global.JmrSheetEditor={isEditable,coordinates,colName,formatNumber,normalizeName,findMainSheet,mainKind,sectionType,multiplesFormulaAudit};
  if(typeof document!=='undefined'&&byId('lookup'))bind();
})(typeof window!=='undefined'?window:globalThis);
