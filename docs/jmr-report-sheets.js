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
      'EVEBITDA','EVFCFF','PE','PFCFE','POCF','PV','PBV','Control historias y múltiplos','Sensibilidad por múltiplo']}
  ];
  var NAME_ALIASES = {
    'Income Statement':'Estado de resultados','Balance Sheet':'Balance general',
    'Cash Flow Statement':'Estado de flujos de efectivo',
    'Trailing 12 month Worskheet':'Doce meses móviles (LTM)',
    'Valuation output':'DCF · cálculo por escenarios','Resumen de Valoración':'Resumen de valoración',
    'Input sheet':'Supuestos y datos de entrada','Cost of capital worksheet':'Costo de capital · WACC',
    'Option value':'Opciones y dilución','Crecimiento implícito':'DCF inverso',
    'Anexo Work 15-oct-2026':'Sensibilidades','Financials Multiples':'Métricas de múltiplos',
    'EVEBITDA':'EV/EBITDA','EVFCFF':'EV/FCFF','PE':'P/E','PFCFE':'P/FCFE','POCF':'P/OCF','PV':'P/V','PBV':'P/BV',
    'Auditoría económica PYPL':'Auditoría económica','Duración ventaja · FCFF':'Duración de ventaja competitiva',
    'Tesis de Inversión y Supuestos':'Tesis y justificación',
    'Sensibilidad por múltiplo':'Sensibilidad por método · tres historias'
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
      header.cells.slice(1,count+1).map(function(c){return '<th scope="col">'+esc(JmrDisplayNumber.format(c))+'</th>';}).join('')+'</tr></thead>';
    var content=rows.map(function(r,ri){
      return '<tr><th scope="row">'+esc(r.cells[0])+'</th>'+r.cells.slice(1,count+1).map(function(v,ci){
        var value=num(v),center=ri===mid&&ci===mid,level=value===null||high===low?'mid':(value<(low+(high-low)*.42)?'low':value>(low+(high-low)*.58)?'high':'mid');
        var matchesBase=center&&value!==null&&typeof base==='number'&&isFinite(base)&&Math.abs(value-base)<=Math.max(.02,Math.abs(base)*.00035);
        return '<td class="jmr-heat-'+level+(center?' jmr-matrix-base':'')+'">'+esc(JmrDisplayNumber.format(v))+(center?'<span class="jmr-base-tag">'+(matchesBase?'Base':'Centro')+'</span>':'')+'</td>';
      }).join('')+'</tr>';
    }).join('');
    return '<article class="jmr-matrix-card"><div class="jmr-matrix-heading"><span class="jmr-matrix-index">0'+idx+'</span><h4>'+esc(title)+'</h4></div>'+
      '<div class="jmr-matrix-axis"><span><strong>Filas:</strong> '+esc(title.split('×')[0].trim())+'</span><span><strong>Columnas:</strong> '+esc(title.split('×').slice(1).join('×').trim()||'Supuesto alternativo')+'</span></div>'+
      '<div class="jmr-sheet-scroll" role="region" tabindex="0" aria-label="Matriz '+esc(title)+'; desplazar horizontalmente en pantallas pequeñas"><table class="jmr-table jmr-matrix"><caption>'+esc(title)+' · valor por acción ('+count+' × '+count+')</caption>'+thead+'<tbody>'+content+'</tbody></table></div>'+
      '<p class="jmr-matrix-footnote">Centro = hipótesis de referencia. Los demás valores son pruebas de sensibilidad, no escenarios publicados.</p></article>';
  }
  function sensitivity(record){
    var index=sheets(record);
    var sens=get(index,'Sensibilidad DCF') || get(index,'Sensibilidad DCF e inverso') || get(index,'Sensibilidades');
    // La matriz relativa nunca reemplaza las sensibilidades del DCF.
    if(sens && norm(sens.name)===norm('Sensibilidad por múltiplo')) sens=null;
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
      var different=typeof base==='number'&&isFinite(base)?blocks.filter(function(b){return b.indexOf('>Centro</span>')>=0;}).length:0;
      var warning=different?'<p class="jmr-sheet-note jmr-sheet-warning"><strong>Atención:</strong> '+
        different+' matriz(es) no tienen el centro conciliado con el DCF Base vigente. Son referencias históricas o escenarios condicionados; requieren revisión antes de usarlas para decidir.</p>':'';
      var required=['WACC terminal × crecimiento perpetuo','ROIC terminal × crecimiento perpetuo','crecimiento × margen EBIT','Sales-to-Capital × margen EBIT','WACC inicial × crecimiento','ROIC terminal × reinversión'];
      var remaining=required.slice(Math.min(blocks.length,required.length));
      var coverage='<p class="jmr-sheet-note"><strong>Fuente:</strong> sensibilidad de la hoja oficial. '+blocks.length+' matrices recalculadas disponibles. Las nuevas matrices solamente se publican cuando su centro concilia con el DCF Base de la misma revisión.</p>';
      if(remaining.length)coverage+='<p class="jmr-sheet-note jmr-sheet-warning">Otras sensibilidades por añadir desde el motor DCF (sin interpolar precios): '+esc(remaining.join(' · '))+'.</p>';
      return warning+coverage+'<div class="jmr-matrix-grid">'+blocks.join('')+'</div>';
    }
    return '<div class="jmr-sheet-note">Matriz histórica conservada tal cual se publicó; no se interpreta como matriz estándar 5 × 5.</div>'+
      safeTable(sens.html,160);
  }

  /* Las matrices relativas usan el centro VP3 del propio múltiplo, no el DCF Base.
     Los 21 bloques mantienen 7 métodos × 3 escenarios y se presentan en
     tres desplegables para evitar tablas kilométricas. */
  function multiplesSensitivity(record){
    var source=get(sheets(record),'Sensibilidad por múltiplo');
    if(!source)return '<p class="jmr-sheet-note">Las matrices por múltiplo aún no se han sincronizado en este análisis. Consulta la hoja fuente.</p>';
    var rows=readRows(source.html),lookup={};
    rows.forEach(function(r){if(r.row)lookup[r.row]=r;});
    var methods=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
    var scenarios=['Conservador','Base','Optimista'];
    var selectionRows=Array.from({length:7},function(_,i){return lookup[223+i];}).filter(Boolean);
    var selection=selectionRows.length===7?'<details class="jmr-sheet-panel" open><summary>Múltiplos · ponderaciones vigentes y selección preliminar</summary>'+
      '<div class="jmr-sheet-scroll"><table class="jmr-table"><thead><tr><th>Método</th><th>Rol sugerido</th><th>Peso vigente (total)</th><th>Peso propuesto (sin aplicar)</th><th>Estado de auditoría</th><th>Razón económica</th></tr></thead><tbody>'+
      selectionRows.map(function(r){
        var c=r.cells,percent=function(x){var n=num(x);return n===null?'N/D':(n*100).toFixed(1)+'%';};
        return '<tr><th scope="row">'+esc(c[0])+'</th><td>'+esc(c[1])+'</td>'+
          '<td>'+percent(c[6])+'</td><td>'+percent(c[4])+'</td>'+
          '<td>'+esc(c[8])+'</td><td>'+esc(c[2])+'</td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<p class="jmr-sheet-note">El peso vigente es el registrado en la valoración; el peso propuesto es orientativo y no modifica el cálculo. Falta certificar comparables, fecha, beneficios sostenibles y ajustes sectoriales antes de adoptarlo.</p></details>':'';
    return selection+scenarios.map(function(scenario,si){
      var cards=methods.map(function(method,mi){
        var first=6+(si*7+mi)*10,head=lookup[first+2],body=[];
        for(var y=0;y<5;y++)if(lookup[first+3+y])body.push(lookup[first+3+y]);
        var ctl=lookup[first+8],status=ctl&&ctl.cells[8]||'N/D';
        if(status!=='OK'||!head||body.length!==5||
           !body.every(function(r){return r.cells.slice(1,6).every(function(c){return num(c)!==null;});})){
          return '<article class="jmr-matrix-card"><h4>'+esc(method)+'</h4>'+
            '<p class="jmr-sheet-note">N/D — denominador no interpretable, datos incompletos o conciliación pendiente. No se usa como valoración certificada.</p></article>';
        }
        var axes=typeof JmrMultiplesAxes!=='undefined'?JmrMultiplesAxes.labels(record,method,scenario.toLowerCase()):null;
        if(!axes)return '<article class="jmr-matrix-card"><h4>'+esc(method)+'</h4><p class="jmr-sheet-note">N/D — faltan múltiplo y/o fundamental FY+3 verificables en esta hoja. No se sustituyen con factores porcentuales.</p></article>';
        var realHead={cells:axes.header};
        var realRows=body.map(function(r,i){return {cells:[axes.rows[i]].concat(r.cells.slice(1))};});
        var base=num(ctl.cells[6]);
        return '<div class="jmr-sheet-note">'+esc(axes.caption)+'</div>'+matrixTable(method+' · '+scenario,realHead,realRows,base,si*7+mi+1);
      }).join('');
      return '<details class="jmr-sheet-panel"'+(si===1?' open':'')+'><summary>'+
        esc(scenario)+' · siete métodos</summary><div class="jmr-matrix-grid">'+cards+'</div></details>';
    }).join('');
  }
  /* Segunda familia de sensibilidades: múltiplo económicamente justificado,
     NO valor por acción. Un panel por historia y siete métodos independientes. */
  function economicSensitivity(record){
    if(typeof JmrEconomicMultiples==='undefined')return '<p class="jmr-sheet-note">No se cargó el motor de múltiplos justificados.</p>';
    return JmrEconomicMultiples.SCENARIOS.map(function(scenario){
      var methods=JmrEconomicMultiples.METHODS.map(function(method){
        var result=JmrEconomicMultiples.matrix(record,method,scenario);
        var center=result.center==null?'N/D':result.center.toLocaleString('es-CO',{maximumFractionDigits:2,minimumFractionDigits:2})+'×';
        return '<details class="jmr-sheet-panel"'+(scenario==='base'&&method==='EV/EBITDA'?' open':'')+'><summary>'+
          esc(method)+' · múltiplo justificado central '+esc(center)+'</summary>'+
          '<div class="jmr-matrix-card">'+JmrEconomicMultiples.render(record,method,scenario)+'</div></details>';
      }).join('');
      return '<details class="jmr-sheet-panel"'+(scenario==='base'?' open':'')+'><summary>'+
        esc(scenario.charAt(0).toUpperCase()+scenario.slice(1))+' · siete métodos justificados</summary>'+
        '<div class="jmr-matrix-grid">'+methods+'</div></details>';
    }).join('');
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
        out+='<'+tag+cl+(tag==='th'?' scope="'+(first?'col':'row')+'"':'')+'>'+esc(JmrDisplayNumber.format(v))+'</'+tag+'>';
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
      '<p>Impacto sobre el valor por acción al modificar dos supuestos del DCF completo. Se muestran solo matrices de la hoja fuente cuyo centro puede comprobarse; en móvil se desplazan horizontalmente.</p></div>'+
      sensitivity(record)+'<div class="jmr-sheets-head"><span class="jmr-overline">VALORACIÓN RELATIVA</span><h2>Sensibilidad por múltiplo</h2><p>Eje vertical: múltiplo real (×). Eje horizontal: fundamental FY+3 en unidades de la hoja (±20%). Las cifras son valores presentes por acción; cada centro concilia contra su propio método y no contra el DCF. Disrupción se analiza por separado.</p></div>'+multiplesSensitivity(record)+
      '<div class="jmr-sheets-head"><span class="jmr-overline">MÚLTIPLO ECONÓMICAMENTE JUSTIFICADO</span><h2>Sensibilidad económica independiente</h2><p>Grillas de crecimiento sostenible, ROIC, ROE, margen, Ke, WACC o conversión de caja según el método. Cada celda es un <strong>múltiplo justificado (×)</strong>, NO un valor por acción. El centro no se fuerza a coincidir con el múltiplo elegido ni con el DCF. No incluye Disrupción.</p></div>'+
      economicSensitivity(record)+'<div class="jmr-sheets-head"><span class="jmr-overline">CONSULTA DE SOPORTE</span><h2>Estados, eficiencia y cálculos completos</h2>'+
      '<p>Las mismas categorías del Visor, con tablas por empresa y acceso a su hoja original. Los faltantes se identifican expresamente.</p></div>'+
      (has?renderGallery(record):'<p class="jmr-sheet-note">No se publicaron hojas adicionales para esta valoración. Es necesario exportarlas desde su plantilla IA.</p>')+
      (record.hojaGoogle&&/^https:\/\/docs\.google\.com\/spreadsheets\/d\//.test(record.hojaGoogle)?
        '<p class="jmr-sheet-source"><a target="_blank" rel="noopener noreferrer" href="'+esc(record.hojaGoogle)+'">Abrir hoja de cálculo original ↗</a></p>':'')+'</section>';
    JmrDisplayNumber.formatTable(destination);
    destination.querySelectorAll('.jmr-sheet-panel').forEach(function(panel){
      panel.addEventListener('toggle',function(){
        if(!panel.open)return;
        var holder=panel.querySelector('[data-jmr-sheet]');
        if(!holder)return; // Los nuevos paneles de matrices económicas no son pestañas crudas.
        if(holder.dataset.jmrFilled)return;
        var found=get(index,holder.getAttribute('data-jmr-sheet'));
        holder.innerHTML=found?(holder.getAttribute('data-jmr-sheet')==='Sensibilidad por múltiplo'?multiplesSensitivity(record):safeTable(found.html,190)):'<p class="jmr-sheet-note">No se publicó esta tabla.</p>';
        holder.dataset.jmrFilled='1';
        JmrDisplayNumber.formatTable(holder);
      });
    });
  }
  global.JmrReportSheets={groups:GROUPS,groupNames:groupNames,renderSensitivity:sensitivity,renderMultiplesSensitivity:multiplesSensitivity,renderEconomicSensitivity:economicSensitivity,safeTable:safeTable,mount:mount};
})(typeof window!=='undefined'?window:globalThis);

