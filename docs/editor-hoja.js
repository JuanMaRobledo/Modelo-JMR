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
  function findMainSheet(kind,names,company){
    var list=names||[], normalized=list.map(normalizeName);
    if(String(company||'').toUpperCase()==='XP'){
      var xp={input:'XP Datos financieros',valuation:'XP FCFE',multiples:'XP Múltiplos'};
      if(list.includes(xp[kind]))return xp[kind];
    }
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
  // Índice de las hojas nativas: navegación visual, sin duplicación de datos ni fórmulas.
  // Las hojas ocultas del archivo se ofrecen igualmente para consulta y trazabilidad.
  var WORKBOOK_GROUPS=[
    {id:'estados',title:'Estados financieros',description:'Resultados, balance, efectivo y cifras por acción',names:[
      'Income Statement','Balance Sheet','Cash Flow Statement','Trailing 12 month Worskheet','Por acción','Dividendos']},
    {id:'valor',title:'DCF y supuestos',description:'Valor intrínseco, hipótesis, costo de capital y escenarios',names:[
      'Resumen de Valoración','Input sheet','Valuation output','Escenarios e historias',
      'Tesis de Inversión y Supuestos','Origen de los Supuestos','Supuestos Recomendados',
      'Duración ventaja · FCFF','Cost of capital worksheet','Sensibilidad DCF',
      'Motor sensibilidad DCF','Crecimiento y Márgenes']},
    {id:'ratios',title:'Eficiencia, deuda y valoración histórica',description:'Evolución LTM, capital invertido, solvencia y márgenes',names:[
      'Trailing Valuation','Forward Valuation','Márgenes','Eficiencia de capital','Salud Financiera']},
    {id:'multiplos',title:'Múltiplos',description:'Métricas relativas y sus hojas de respaldo',names:[
      'Descuento de múltiplos','Múltiplos históricos','Financials Multiples',
      'Supuestos de los Múltiplos','Sensibilidad por múltiplo','Entradas históricas auxiliares',
      'EVEBITDA','EVFCFF','PE','PFCFE','POCF','PV','PBV']},
    {id:'apoyo',title:'Anexos y conversores',description:'Opciones, I+D, arrendamientos, sectores y datos auxiliares',names:[
      'Option value','Synthetic rating','R& D converter','Operating lease converter',
      'Sector','Failure Rate worksheet','Country equity risk premiums',
      'Industry Averages(US)','Industry Averages (Global)','Input Stat Distributioons']}
  ];
  function sheetGroups(names){
    var groups=WORKBOOK_GROUPS.map(function(g){return {id:g.id,title:g.title,description:g.description,names:[]};});
    var seen={};
    (names||[]).forEach(function(name){
      var key=normalizeName(name),index=WORKBOOK_GROUPS.findIndex(function(g){
        return g.names.some(function(x){return normalizeName(x)===key;});
      });
      if(seen[key])return;
      seen[key]=true;
      if(index<0){
        var other=groups.find(function(g){return g.id==='otros';});
        if(!other){other={id:'otros',title:'Otras hojas',description:'Otras pestañas originales del libro',names:[]};groups.push(other);}
        other.names.push(name);
      }else groups[index].names.push(name);
    });
    return groups.filter(function(g){return g.names.length>0;});
  }
  function mainKind(name){
    var n=normalizeName(name);
    if(n==='input sheet'||n==='input'||n==='inputs')return 'input';
    if(n==='valuation output'||n==='valuation outputs')return 'valuation';
    if(/^financials? multiple/.test(n))return 'financial';
    if(n==='xp datos financieros')return 'input';
    if(n==='xp fcfe')return 'valuation';
    if(n==='xp multiplos')return 'multiples';
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
  function multiplesFormulaAudit(sheets,company){
    var isFinancial=String(company||'').toUpperCase()==='XP'&&!!sheets?.['XP Múltiplos'];
    var checks=isFinancial?[
      ['P/E','XP Múltiplos','I6'],
      ['P/FCFE','XP Múltiplos','I15'],
      ['P/S (P/V)','XP Múltiplos','I9'],
      ['P/BV','XP Múltiplos','I12']
    ]:[
      ['EV/EBITDA','Descuento de múltiplos','J20'],
      ['EV/FCFF','Descuento de múltiplos','J21'],
      ['P/E','Descuento de múltiplos','J22'],
      ['P/FCFE','Descuento de múltiplos','J23'],
      ['P/OCF','Descuento de múltiplos','J24'],
      ['P/S (P/V)','PV','E42'],
      ['P/BV','PBV','E42']
    ];
    var result=checks.map(function(row){
      var cell=sheets?.[row[1]]?.[row[2]];
      return {method:row[0],sheet:row[1],cell:row[2],
        hasValue:typeof cell?.v==='number'&&Number.isFinite(cell.v),
        hasFormula:typeof cell?.formula==='string'&&cell.formula.startsWith('='),exempt:false};
    });
    if(isFinancial){
      var proof=String(sheets?.['XP Control']?.B16?.v||'').toLowerCase();
      var justified=proof.includes('4 calculados')&&proof.includes('3 n/a')&&proof.includes('financier');
      ['EV/EBITDA','EV/FCFF','P/OCF'].forEach(function(method){
        result.push({method:method,sheet:'XP Control',cell:'B16',
          hasValue:false,hasFormula:false,exempt:justified});
      });
    }
    return result;
  }
  function updateMultiplesStatus(){
    var host=byId('multiplesFormulaStatus');
    if(!host||!snapshot)return;
    var checks=multiplesFormulaAudit(snapshot.sheets,ticker);
    var calculated=checks.filter(x=>x.hasValue&&x.hasFormula).length;
    var accepted=checks.filter(x=>x.exempt).length;
    var unresolved=checks.filter(x=>!x.exempt&&(!x.hasValue||!x.hasFormula));
    var notes=unresolved.map(x=>x.method+' ('+x.sheet+'!'+x.cell+')');
    host.textContent='Fuente: fórmulas originales de Google Sheets · '+calculated+' calculados /7'+
       (accepted?' · '+accepted+' N/A financieros justificados':'')+'. '+
       (notes.length?'Sin resultado verificable: '+notes.join(', ')+'. ':'')+
       'La equivalencia de fórmulas con la plantilla se verifica por separado.';
    host.dataset.coverage=calculated+accepted===7?'complete':'incomplete';
  }
  var snapshot=null,ticker='',selected='',selectedGroup='',firstRow=1,firstCol=1,pageRows=30,pageCols=9,fullSheet=true;
  var drafts=new Map(),busy=false,loader=0,dimensions={};
  var MAX_FULL_CELLS=30000;
  function refreshShortcuts(){
    var names=Object.keys(snapshot?.sheets||{});
    document.querySelectorAll('#modelSheetTabs [data-sheet-kind]').forEach(function(button){
      var name=findMainSheet(button.dataset.sheetKind,names,ticker),active=!!name&&mainKind(selected)===button.dataset.sheetKind;
      button.disabled=!name;
      button.title=name?'Abrir '+name:'Esta pestaña no está en el libro importado';
      if(ticker==='XP' && name && /^XP /.test(name))button.textContent=name;
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
          display+='<td class="'+(c.formula?'formula-cell':'readonly-cell')+(typeof c.v==='number'?' numeric-cell':'')+(ci===startCol?' first-source-col':'')+'" data-cell="'+esc(address)+'" title="'+esc(address+(c.formula?' · fórmula protegida: '+c.formula:' · solo lectura'))+'">'+
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
  function renderWorkbookNavigation(){
    var groups=sheetGroups(Object.keys(snapshot?.sheets||{}));
    if(!groups.length)return;
    var active=groups.find(function(g){return g.id===selectedGroup;})||groups[0];
    selectedGroup=active.id;
    var cats=byId('sheetCategoryTabs'),items=byId('sheetQuickTabs'),count=byId('sheetGroupDescription');
    if(cats)cats.innerHTML=groups.map(function(g){
      return '<button type="button" data-sheet-group="'+esc(g.id)+'" aria-pressed="'+(g.id===active.id)+'"'+
        ' class="'+(g.id===active.id?'active':'')+'">'+esc(g.title)+
        ' <span class="sheet-group-count">'+g.names.length+'</span></button>';
    }).join('');
    if(count)count.textContent=active.description+' · '+active.names.length+' pestaña(s)';
    if(items)items.innerHTML=active.names.map(function(name){
      var chosen=name===selected;
      return '<button type="button" data-original-sheet="'+esc(name)+'" aria-pressed="'+chosen+'"'+
        ' class="'+(chosen?'active':'')+'">'+esc(name)+'</button>';
    }).join('');
    var single=byId('openSheetTab');
    if(single){
      single.href='editor-hoja.html?ticker='+encodeURIComponent(ticker)+'&sheet='+encodeURIComponent(selected);
      single.textContent='Abrir «'+selected+'» en nueva pestaña ↗';
    }
  }
  function selectSheet(name){
    if(!snapshot?.sheets?.[name])return;
    selected=name;firstRow=1;firstCol=1;fullSheet=true;
    var group=sheetGroups(Object.keys(snapshot.sheets)).find(function(g){return g.names.includes(name);});
    if(group)selectedGroup=group.id;
    renderWorkbookNavigation();
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
    byId('sheetPicker').innerHTML=sheetGroups(list).map(function(g){
      return '<optgroup label="'+esc(g.title)+'">'+g.names.map(function(name){
        return '<option value="'+esc(name)+'">'+esc(name)+'</option>';
      }).join('')+'</optgroup>';
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
    byId('sheetPicker').addEventListener('change',function(){
      selectSheet(this.value);
      if(global.parent&&global.parent!==global)
        global.parent.postMessage({type:'jmr-sheet-selected',ticker,sheet:selected},global.location.origin);
    });
    global.addEventListener('message',function(event){
      if(event.origin!==global.location.origin||event.source!==global.parent)return;
      var d=event.data||{};
      if(d.type!=='jmr-select-source-sheet'||d.ticker!==ticker||typeof d.sheet!=='string')return;
      if(!snapshot?.sheets?.[d.sheet])return;
      if(['financieros','indicadores','modelo'].includes(d.section))document.documentElement.dataset.embeddedSection=d.section;
      if(drafts.size){setStatus('Guarda o descarta tus cambios antes de cambiar de pestaña.','warn');return;}
      if(selected!==d.sheet)selectSheet(d.sheet);
    });
    byId('sheetCategoryTabs').addEventListener('click',function(e){
      var btn=e.target.closest('button[data-sheet-group]');
      if(!btn||!snapshot)return;
      selectedGroup=btn.dataset.sheetGroup;
      renderWorkbookNavigation();
    });
    byId('sheetQuickTabs').addEventListener('click',function(e){
      var btn=e.target.closest('button[data-original-sheet]');
      if(btn&&snapshot?.sheets?.[btn.dataset.originalSheet])selectSheet(btn.dataset.originalSheet);
    });
    byId('modelSheetTabs').addEventListener('click',function(e){
      var btn=e.target.closest('button[data-sheet-kind]');
      if(!btn||btn.disabled||!snapshot)return;
      var name=findMainSheet(btn.dataset.sheetKind,Object.keys(snapshot.sheets),ticker);
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
  global.JmrSheetEditor={isEditable,coordinates,colName,formatNumber,normalizeName,findMainSheet,mainKind,sectionType,multiplesFormulaAudit,sheetGroups};
  if(typeof document!=='undefined'&&byId('lookup'))bind();
})(typeof window!=='undefined'?window:globalThis);
