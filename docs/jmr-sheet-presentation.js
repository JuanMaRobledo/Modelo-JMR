/* Presentación sin escrituras: vista legible del mismo snapshot de Google Sheets. */
(function (global) {
  'use strict';
  var escapeHtml=function(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[ch];
  });};
  function column(number){
    var out='';while(number>0){number--;out=String.fromCharCode(65+number%26)+out;number=Math.floor(number/26);}return out;
  }
  function formatted(cell) {
    if(!cell || (cell.v==null&&cell.w==null))return '—';
    if(global.JmrDisplayNumber?.formatCell)return String(global.JmrDisplayNumber.formatCell(cell));
    return String(cell.w??cell.v??'—');
  }
  function presentation(sheet,cells,options){
    options=options||{};
    var maxRows=Number.isInteger(options.maxRows)?Math.min(2500,Math.max(1,options.maxRows)):180;
    var keys=Object.keys(cells||{}),present={};
    keys.forEach(function(key){var match=/^([A-Z]+)[1-9]\d*$/.exec(key);var cell=cells[key];if(match&&cell&&(cell.v!==null&&cell.v!==undefined&&cell.v!==''||cell.w))present[match[1]]=true;});
    function colIndex(letters){return letters.split('').reduce(function(n,ch){return n*26+ch.charCodeAt(0)-64;},0);}
    var columns=Object.keys(present).filter(function(col){return colIndex(col)>=2;})
      .sort(function(a,b){return colIndex(a)-colIndex(b);});
    var maxColumns=Number.isInteger(options.maxColumns)?Math.min(80,Math.max(1,options.maxColumns)):14;
    var omittedColumns=Math.max(0,columns.length-maxColumns);
    columns=columns.slice(0,maxColumns);
    function columnHeader(col){
      for(var row=1;row<=8;row++){
        var c=cells[col+row], value=String(c?.w??c?.v??'').trim();
        if(/^(?:(?:FY|AÑO)\s*)?(?:19|20)\d{2}[AE]?$|^(?:LTM|TTM)$/i.test(value))return value;
      }
      return col;
    }
    var rows=keys.map(function(key){var m=/^[A-Z]+([1-9]\d*)$/.exec(key);return m?Number(m[1]):0;})
      .filter(Boolean);
    var totalRows=rows.reduce(function(max,row){return Math.max(max,row);},0);
    var allGroups=[],current={heading:'Datos de la hoja',rows:[]},included=0,omitted=0;
    function append(){if(current.rows.length)allGroups.push(current);}
    for(var row=1;row<=totalRows;row++){
      var labelCell=cells['A'+row], rawLabel=labelCell?.v;
      var label=rawLabel==null?'':String(rawLabel).trim();
      var entries=columns.map(function(col){return cells[col+row];});
      var filled=entries.filter(function(c){return c&&c.v!==null&&c.v!==undefined&&c.v!=='';}).length;
      if(label && filled===0 && label.length>=4){
        append();current={heading:label,rows:[]};
        continue;
      }
      if(!filled && !label)continue;
      if(included>=maxRows){omitted++;continue;}
      var values=entries.map(function(c){return c?formatted(c):'—';});
      current.rows.push({row:row,label:label||'Fila '+row,values:values});
      included++;
    }
    append();
    if(!allGroups.length)return '<p class="jmr-reader-empty">No hay filas con valores legibles en esta pestaña. La cuadrícula original continúa disponible.</p>';
    var th=columns.map(function(col){return '<th scope="col">'+escapeHtml(columnHeader(col))+'</th>';}).join('');
    var blocks=allGroups.map(function(group,index){
      var tr=group.rows.map(function(r){
        return '<tr><th scope="row"><span>'+escapeHtml(r.label)+'</span><small>Fila '+r.row+'</small></th>'+
          r.values.map(function(v){return '<td>'+escapeHtml(v)+'</td>';}).join('')+'</tr>';
      }).join('');
      return '<section class="jmr-reader-group" aria-label="'+escapeHtml(group.heading)+'">'+
        '<h3>'+escapeHtml(group.heading)+'</h3><div class="jmr-reader-table-scroll">'+
        '<table><thead><tr><th scope="col">Concepto</th>'+th+'</tr></thead><tbody>'+tr+'</tbody></table></div></section>';
    }).join('');
    return '<header class="jmr-reader-head"><div><span class="eyebrow">PRESENTACIÓN · SOLO LECTURA</span>'+
      '<h2>'+escapeHtml(sheet)+'</h2><p>Datos originales del libro, sin fórmulas recalculadas ni modificaciones. '+
      'Columnas '+escapeHtml(columns.join(' · ')||'sin columnas')+'.</p></div><div class="jmr-reader-kpi">'+
      '<strong>'+included+'</strong><span>filas de lectura</span></div></header>'+
      ((omitted||omittedColumns)?'<p class="jmr-reader-notice">Vista de lectura parcial: '+omitted+
        ' filas adicionales y '+omittedColumns+' columnas adicionales. Usa «Mostrar más filas y columnas» o «Cuadrícula completa» para acceder al resto sin modificar datos.</p>':'')+
      '<div class="jmr-reader-groups">'+blocks+'</div>';
  }
  global.JmrSheetPresentation={render:presentation,column:column};
})(typeof window!=='undefined'?window:globalThis);
