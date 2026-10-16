/* JMR · Vistas homogéneas de hojas y sensibilidades.
   Presentación únicamente: nunca rellena con ceros hojas inexistentes ni recalcula el DCF. */
(function(global){
  'use strict';
  var GROUPS = [
    {id:'financieros',title:'Estados financieros',desc:'Resultados, balance, flujos de caja y cifras por acción.',names:[
      'Income Statement','Balance Sheet','Cash Flow Statement','Trailing 12 month Worskheet','Por acción','Dividendos']},
    {id:'valoracion',title:'Modelo DCF y costo de capital',desc:'Supuestos y cálculos originales de la hoja; DCF Base como referencia principal.',names:[
      'Resumen de Valoración','Input sheet','Valuation output','Cost of capital worksheet',
      'Escenarios e historias','Option value','Duración ventaja · FCFF','Crecimiento implícito',
      'Anexo Work 15-oct-2026','Sensibilidad','Sensitivity Analysis','Auditoría económica PYPL','Control Damodaran']},
    {id:'eficiencia',title:'Rentabilidad y eficiencia',desc:'Evolución de márgenes, capital y desempeño operativo.',names:[
      'Márgenes','Eficiencia de capital','Salud Financiera','Crecimiento y Márgenes','Estadísticas','Diagnostics','Cualitativo','Tesis de Inversión y Supuestos']},
    {id:'multiplos',title:'Múltiplos y otras tablas',desc:'Valoraciones secundarias, normalización histórica y métricas prospectivas.',names:[
      'Descuento de múltiplos','Múltiplos históricos','Múltiplos y mercado FY+3',
      'Financials Multiples','Trailing Valuation','Forward Valuation',
      'EVEBITDA','EVFCFF','PE','PFCFE','POCF']}
  ];
  var NAME_ALIASES = {
    'Income Statement':'Estado de resultados','Balance Sheet':'Balance general',
    'Cash Flow Statement':'Estado de flujos de efectivo',
    'Trailing 12 month Worskheet':'Doce meses móviles (LTM)',
    'Valuation output':'DCF · cálculo por escenarios','Resumen de Valoración':'Resumen de valoración',
    'Input sheet':'Supuestos y datos de entrada','Cost of capital worksheet':'Costo de capital · WACC',
    'Option value':'Opciones y dilución','Crecimiento implícito':'DCF inverso',
    'Anexo Work 15-oct-2026':'Sensibilidades','Financials Multiples':'Métricas de múltiplos',
    'EVEBITDA':'EV/EBITDA','EVFCFF':'EV/FCFF','PE':'P/E','PFCFE':'P/FCFE','POCF':'P/OCF',
    'Auditoría económica PYPL':'Auditoría económica','Duración ventaja · FCFF':'Duración de ventaja competitiva',
    'Tesis de Inversión y Supuestos':'Tesis y justificación'
  };
  function norm(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function sheets(record){
    var h=record&&record.hojas||{};
    var index={};
    Object.keys(h).forEach(function(g){
      if(h[g] && typeof h[g]==='object') Object.keys(h[g]).forEach(function(k){
        if(typeof h[g][k]==='string' && h[g][k].indexOf('<table')>=0)
          index[norm(k)]={name:k,html:h[g][k]};
      });
    });
    return index;
  }
  function get(index,name){
    var direct=index[norm(name)]; if(direct)return direct;
    // Distinguir anexo o matriz por texto normalizado sin usar nombres particulares de cada empresa.
    if(norm(name)==='sensibilidad'||norm(name)==='sensibilidades'){
      var match=Object.keys(index).find(function(k){return /(?:sensibilid|anexowork|sensitivity)/.test(k);});
      return match?index[match]:null;
    }
    return null;
  }
  function groupNames(groupKey,available){
    var g=GROUPS.find(function(z){return z.id===groupKey;});
    if(!g)return available?Object.keys(available):[];
    var names=g.names.slice(), known={};
    names.forEach(function(k){known[norm(k)]=true;});
    if(available)Object.keys(available).forEach(function(k){
      if(known[norm(k)])return;
      if(/(?:anexowork|sensitivity|sensibilidad)/.test(norm(k))&&groupKey==='valoracion' ||
         groupKey==='financieros' && /(?:income|balance|cashflow|ltm)/.test(norm(k)) ||
         groupKey==='eficiencia' && /(?:margen|eficiencia|salud|roic|ratios)/.test(norm(k)) ||
         groupKey==='multiplos' && /(?:multipl|forward|trailing|evebit|evfcf)/.test(norm(k))){
        names.push(k); known[norm(k)]=true;
      }
    });
    return names;
  }
  function readRows(html){
    var doc=new DOMParser().parseFromString(html||'','text/html'), table=doc.querySelector('table');
    if(!table)return [];
    return Array.prototype.map.call(table.querySelectorAll('tr'),function(tr){
      return {row:Number(tr.getAttribute('data-row'))||0,
        cells:Array.prototype.map.call(tr.querySelectorAll('td,th'),function(td){return td.textContent.trim();})};
    });
  }
  function num(s){
    var v=String(s||'').replace(/[$€%\s]/g,'');
    if(!/^-?[\d.,]+$/.test(v))return null;
    if(v.indexOf(',')>=0&&v.indexOf('.')>=0)v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',', '.'):v.replace(/,/g,'');
    else if(v.indexOf(',')>=0)v=v.replace(',', '.');
    var n=Number(v);return isFinite(n)?n:null;
  }
  function matrixTable(title,header,rows,base,idx){
    var count=rows.length,mid=Math.floor(count/2),numbers=[];
    rows.forEach(function(r){r.cells.slice(1,count+1).forEach(function(v){var x=num(v);if(x!==null)numbers.push(x);});});
    var low=Math.min.apply(null,numbers),high=Math.max.apply(null,numbers);
    var thead='<thead><tr><th scope="col">'+esc(header.cells[0]||'')+'</th>'+
      header.cells.slice(1,count+1).map(function(c){return '<th scope="col">'+esc(c)+'</th>';}).join('')+'</tr></thead>';
    var content=rows.map(function(r,ri){
      return '<tr><th scope="row">'+esc(r.cells[0])+'</th>'+r.cells.slice(1,count+1).map(function(v,ci){
        var value=num(v),center=ri===mid&&ci===mid,level=value===null||high===low?'mid':(value<(low+(high-low)*.42)?'low':value>(low+(high-low)*.58)?'high':'mid');
        var matchesBase=center&&typeof base==='number'&&Math.abs(value-base)<=Math.max(.02,base*.00035);
        return '<td class="jmr-heat-'+level+(center?' jmr-matrix-base':'')+'">'+esc(v)+(center?'<span class="jmr-base-tag">'+(matchesBase?'Base':'Centro')+'</span>':'')+'</td>';
      }).join('')+'</tr>';
    }).join('');
    return '<article class="jmr-matrix-card"><div class="jmr-matrix-heading"><span class="jmr-matrix-index">0'+idx+'</span><h4>'+esc(title)+'</h4></div>'+
      '<div class="jmr-sheet-scroll"><table class="jmr-table jmr-matrix"><caption>'+esc(title)+' · sensibilidad de valor/acción ('+count+' × '+count+')</caption>'+thead+'<tbody>'+content+'</tbody></table></div></article>';
  }
  function sensitivity(record){
    var index=sheets(record);
    var sens=get(index,'Sensibilidades');
    if(!sens)return '<p class="jmr-sheet-note">Esta valoración no contiene una matriz de sensibilidad publicada. Consulta la hoja fuente; no se generan cifras aproximadas.</p>';
    var rows=readRows(sens.html),blocks=[],base=record?.valorEsperado?.dcfBase ??
      record?.descuentoMultiples?.dcfHoy?.base;
    for(var i=0;i<rows.length-4;i++){
      var r=rows[i],title=r.cells.filter(Boolean).join(' ').trim();
      if(!/[\u00d7]|sensibilidad|sensitivity/i.test(title)||r.cells.filter(Boolean).length>2)continue;
      var header=rows[i+1],length=0,body=null;
      for(var n of [5,3]){
        var candidate=rows.slice(i+2,i+2+n);
        if(header && header.cells.length>=n+1 && candidate.length===n &&
           candidate.every(function(z){return z.cells.length>=n+1&&z.cells.slice(1,n+1).every(function(v){return num(v)!==null;});})){
           length=n;body=candidate;break;
        }
      }
      if(!length)continue;
      blocks.push(matrixTable(title,header,body,base,blocks.length+1));
      i+=length+1;
    }
    if(blocks.length){
      // No presentar una instantánea histórica como DCF Base si sus cifras
      // no concilian con la valoración principal publicada.
      var different=blocks.filter(function(b){return b.indexOf('>Centro</span>')>=0;}).length;
      var warning=different?'<p class="jmr-sheet-note jmr-sheet-warning"><strong>Atención:</strong> '+
        different+' matriz(es) no tienen el centro conciliado con el DCF Base vigente. Son referencias históricas o escenarios condicionados; requieren revisión antes de usarlas para decidir.</p>':'';
      return warning+'<div class="jmr-matrix-grid">'+blocks.join('')+'</div>';
    }
    return '<div class="jmr-sheet-note">Matriz histórica conservada tal cual se publicó; no se interpreta como matriz estándar 5 × 5.</div>'+
      safeTable(sens.html,160);
  }
  function safeTable(html,maxRows){
    var rows=readRows(html).filter(function(r){return r.cells.some(Boolean);}).slice(0,maxRows||180);
    if(!rows.length)return '<p class="jmr-sheet-note">Esta pestaña no contiene una tabla visible.</p>';
    var maxCols=Math.min(18,Math.max.apply(null,rows.map(function(r){return r.cells.length;})));
    var out='<div class="jmr-sheet-scroll"><table class="jmr-table"><tbody>';
    rows.forEach(function(r,i){
      var first=i===0;out+='<tr>';
      r.cells.slice(0,maxCols).forEach(function(v,j){
        var tag=first?'th':j===0?'th':'td',cl=j>0&&num(v)!==null?' class="jmr-cell-number"':'';
        out+='<'+tag+cl+(tag==='th'?' scope="'+(first?'col':'row')+'"':'')+'>'+esc(v)+'</'+tag+'>';
      });out+='</tr>';
    });
    return out+'</tbody></table></div>';
  }
  function renderGallery(record){
    var index=sheets(record),used={},body='';
    GROUPS.forEach(function(group){
      var contents=[],missing=[];
      group.names.forEach(function(name){
        var source=get(index,name),id=norm(name);
        if(source&&!used[norm(source.name)]){
          used[norm(source.name)]=true;
          contents.push({name:source.name,html:source.html});
        }else if(!source)missing.push(NAME_ALIASES[name]||name);
      });
      // Conservar las pestañas especiales de otras empresas sin alterar el orden del catálogo.
      Object.keys(index).forEach(function(key){
        if(used[key])return;
        var x=index[key],classify=/financier|income|balance|cashflow|ltm/i.test(x.name)?'financieros':
          /margen|eficiencia|roic|salud|diagnos|estadist|dividend|cualitativo|tesis/i.test(x.name)?'eficiencia':
          /multipl|ev\/|evebit|evfcf|p\/|trailing|forward/i.test(x.name)?'multiplos':'valoracion';
        if(group.id===classify){used[key]=true;contents.push(x);}
      });
      var panels=contents.map(function(tab,i){return '<details class="jmr-sheet-panel"><summary><span>'+esc(NAME_ALIASES[tab.name]||tab.name)+'</span><span class="jmr-sheet-action">Ver tabla</span></summary><div class="jmr-sheet-body" data-jmr-sheet="'+esc(tab.name)+'"></div></details>';}).join('');
      var absent=missing.length?'<p class="jmr-sheet-missing">Sin datos publicados: '+esc(missing.join(' · '))+'. No se sustituyen con datos de otras empresas.</p>':'';
      body+='<section class="jmr-sheet-section"><div class="jmr-sheet-group-heading"><h3>'+esc(group.title)+'</h3><p>'+esc(group.desc)+'</p></div>'+panels+absent+'</section>';
    });
    return body;
  }
  function mount(root,record){
    if(!root||!record)return;
    var destination=root.querySelector('[data-jmr-extended-sheets]');
    if(!destination)return;
    var index=sheets(record);
    var has=Object.keys(index).length>0;
    destination.innerHTML='<section class="jmr-report-sheets" aria-label="Hojas y anexos de valoración">'+
      '<div class="jmr-sheets-head"><span class="jmr-overline">ANEXOS DE VALORACIÓN</span><h2>Matrices de sensibilidad</h2>'+
      '<p>Impacto en el DCF Base al modificar dos hipótesis. La celda central identifica el escenario Base; el color refleja valores relativos, no recomendaciones de compra.</p></div>'+
      sensitivity(record)+'<div class="jmr-sheets-head"><span class="jmr-overline">CONSULTA DE SOPORTE</span><h2>Estados, eficiencia y cálculos completos</h2>'+
      '<p>Las mismas categorías del Visor, con tablas por empresa y acceso a su hoja original. Los faltantes se identifican expresamente.</p></div>'+
      (has?renderGallery(record):'<p class="jmr-sheet-note">No se publicaron hojas adicionales para esta valoración. Es necesario exportarlas desde su plantilla IA.</p>')+
      (record.hojaGoogle&&/^https:\/\/docs\.google\.com\/spreadsheets\/d\//.test(record.hojaGoogle)?
        '<p class="jmr-sheet-source"><a target="_blank" rel="noopener noreferrer" href="'+esc(record.hojaGoogle)+'">Abrir hoja de cálculo original ↗</a></p>':'')+'</section>';
    destination.querySelectorAll('.jmr-sheet-panel').forEach(function(panel){
      panel.addEventListener('toggle',function(){
        if(!panel.open)return;
        var holder=panel.querySelector('[data-jmr-sheet]');
        if(holder.dataset.jmrFilled)return;
        var found=get(index,holder.getAttribute('data-jmr-sheet'));
        holder.innerHTML=found?safeTable(found.html,190):'<p class="jmr-sheet-note">No se publicó esta tabla.</p>';
        holder.dataset.jmrFilled='1';
      });
    });
  }
  global.JmrReportSheets={groups:GROUPS,groupNames:groupNames,renderSensitivity:sensitivity,safeTable:safeTable,mount:mount};
})(typeof window!=='undefined'?window:globalThis);
