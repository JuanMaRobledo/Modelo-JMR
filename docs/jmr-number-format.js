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
    else if(dots===1){
      var groups=raw.split('.');
      decimal=groups[1].length===3&&groups[0].length>=3?null:'.';
    }
    else if(commas===1){
      var groupsComma=raw.split(',');
      decimal=groupsComma[1].length===3&&groupsComma[0].length>=3?null:',';
    }
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
    var n=typeof cell.raw?.numberValue==='number'?cell.raw.numberValue:
      (typeof cell.v==='number'?cell.v:null);
    if(n!==null){
      var txt=String(original==null?'':original);
      if(/%\s*$/.test(txt))return format(n*100)+'%';
      if(/[×x]\s*$/.test(txt))return format(n)+'×';
      var currency=/^\s*(US\$|COP\$|[$€£])/.exec(txt);
      if(currency)return currency[1]+' '+format(n);
      if(Number.isInteger(n)&&n>=1900&&n<=2100&&/^\d{4}$/.test(txt))return txt;
      return format(n);
    }
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
