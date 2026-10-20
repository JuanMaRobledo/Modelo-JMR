/* Presentación JMR: máximo dos decimales, sin redondear cálculos ni celdas fuente. */
(function(global){
  'use strict';
  function number(value){return typeof value==='number'&&Number.isFinite(value)?value:null;}
  function parseNumeric(input){
    if(typeof input==='number')return Number.isFinite(input)?{n:input,prefix:'',suffix:''}:null;
    var source=String(input==null?'':input).trim();
    // Fechas, fórmulas, años, identificadores y textos no son valores decimales.
    if(!source||/^[12]\d{3}$/.test(source)||/[=/]/.test(source)||/\d\s*[-–]\s*\d/.test(source))return null;
    var m=source.match(/^([+\-]?\s*(?:US\$|COP\$|USD\s*|COP\s*|[$€£])?\s*)?([\d.,\s\u00a0]+)(\s*(?:%|×|x|bps)?)$/i);
    if(!m)return null;
    var raw=m[2].replace(/[\s\u00a0]/g,'');
    if(!raw||!/[\d]/.test(raw))return null;
    var dots=(raw.match(/\./g)||[]).length,commas=(raw.match(/,/g)||[]).length,decimal;
    if(dots&&commas){decimal=raw.lastIndexOf('.')>raw.lastIndexOf(',')?'.':',';}
    else if(dots>1){decimal=/\.\d{1,2}$/.test(raw)?'.':null;}
    else if(commas>1){decimal=/,\d{1,2}$/.test(raw)?',':null;}
    else if(dots===1){decimal=/\.\d{3}$/.test(raw)?null:'.';}
    else if(commas===1){decimal=/,\d{3}$/.test(raw)?null:',';}
    var normalized=decimal?
      raw.replace(new RegExp('\\'+(decimal==='.'?',':'.'),'g'),'').replace(decimal,'.'):
      raw.replace(/[,.]/g,'');
    var n=Number(normalized);
    if(!Number.isFinite(n))return null;
    var prefix=m[1]||'',suffix=m[3]||'';
    return {n:n*(/^\s*-/.test(prefix)?-1:1),prefix:prefix.replace(/^[+\-]\s*/,'').trim(),suffix:suffix.trim()};
  }
  function format(value){
    var p=parseNumeric(value);
    if(!p)return value==null?'':String(value);
    var rounded=p.n.toLocaleString('es-CO',{maximumFractionDigits:2});
    if(p.prefix)return p.prefix+' '+rounded+(p.suffix||'');
    return rounded+(p.suffix||'');
  }
  function formatCell(cell){
    if(!cell)return '';
    var original=cell.w!=null&&cell.w!==''?cell.w:cell.v;
    return format(original);
  }
  function editValue(value,scale){
    var n=number(Number(value)*Number(scale||1));
    if(n===null)return '';
    return Math.round((n+Number.EPSILON)*100)/100;
  }
  function formatTable(root){
    if(!root||typeof root.querySelectorAll!=='function')return;
    root.querySelectorAll('table td,table th').forEach(function(cell){
      // Solo nodos numéricos de texto; conservar enlaces, leyendas, etiquetas
      // mixtas, años, fórmulas y la precisión original en el registro.
      cell.childNodes.forEach(function(node){
        if(node.nodeType!==3)return;
        var old=node.nodeValue.trim();
        if(!old)return;
        var next=format(old);
        if(next!==old)node.nodeValue=node.nodeValue.replace(old,next);
      });
    });
  }
  global.JmrDisplayNumber={parseNumeric:parseNumeric,format:format,formatCell:formatCell,editValue:editValue,formatTable:formatTable};
})(typeof window!=='undefined'?window:globalThis);
