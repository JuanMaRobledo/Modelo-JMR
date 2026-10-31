/* JMR · Vistas homogéneas de hojas y sensibilidades.
   Presentación únicamente: nunca rellena con ceros hojas inexistentes ni recalcula el DCF. */
(function(global){
  'use strict';
  var GROUPS = [
    {id:'financieros',title:'Estados financieros',desc:'Resultados, balance, flujos de caja y cifras por acción.',names:[
      'Income Statement','Balance Sheet','Cash Flow Statement','Trailing 12 month Worskheet','Por acción','Dividendos']},
    {id:'valoracion',title:'Modelo DCF y costo de capital',desc:'Supuestos y cálculos originales de la hoja; DCF Base como referencia principal.',names:[
      'Resumen de Valoración','Input sheet','Valuation output','Cost of capital worksheet',
      'Escenarios e historias','Option value','Duración ventaja · FCFF','Crecimiento implícito','Sensibilidad DCF','Sensibilidad DCF e inverso',
      'Anexo Work 15-oct-2026','Sensibilidad','Sensitivity Analysis','Auditoría económica PYPL','Control Damodaran']},
    {id:'eficiencia',title:'Rentabilidad y eficiencia',desc:'Evolución de márgenes, capital y desempeño operativo.',names:[
      'Márgenes','Eficiencia de capital','Salud Financiera','Crecimiento y Márgenes','Estadísticas','Diagnostics','Cualitativo','Tesis de Inversión y Supuestos']},
    {id:'multiplos',title:'Múltiplos y otras tablas',desc:'Valoraciones secundarias, normalización histórica y métricas prospectivas.',names:[
      'Descuento de múltiplos','Múltiplos históricos','Múltiplos y mercado FY+3',
      'Financials Multiples','Trailing Valuation','Forward Valuation',
      'EVEBITDA','EVFCFF','PE','PFCFE','POCF','PV','PBV','Control historias y múltiplos','Sensibilidad por múltiplo','Sensibilidad múltiplos META']}
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
    'Sensibilidad por múltiplo':'Sensibilidad por método · Base',
    'Sensibilidad múltiplos META':'META R4 · siete métodos · Base · dos anclas'
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
    var v=String(s==null?'':s).replace(/(?:US\$|USD|COP|€|\$|%|×|\s|\u00a0)/gi,'').replace(/[−–]/g,'-');
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
  // Matrices económicas precalculadas durante la valoración, no en el visor.
  // Nunca generar cifras en la página ni mezclar revisiones distintas.
  function extendedDcfSensitivity(record){
    var dataset=record&&record.sensibilidadDCF, mats=dataset&&dataset.matrices;
    if(!Array.isArray(mats)||!mats.length)return '';
    var official=record?.valorEsperado?.dcfBase??record?.descuentoMultiples?.dcfHoy?.base;
    if(typeof official!=='number'||!isFinite(official) || !isFinite(dataset.dcfBaseOfficial) ||
       Math.abs(dataset.dcfBaseOfficial-official)>Math.max(.05,Math.abs(official)*.0001) ||
       record.ticker&&dataset.ticker!==record.ticker ||
       record.revision&&dataset.revision!==record.revision){
      return '<p class="jmr-sheet-note jmr-sheet-warning">Las matrices DCF adicionales se ocultaron: la revisión o el centro no concilian con el valor intrínseco vigente.</p>';
    }
    function axis(v,unit){
      if(typeof v!=='number'||!isFinite(v))return 'N/D';
      if(unit==='percent')return (100*v).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
      if(unit==='changepp')return (v>=0?'+':'')+(100*v).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+' pp';
      if(unit==='times')return v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+'×';
      return v.toLocaleString('es-CO',{maximumFractionDigits:2});
    }
    var cards=mats.map(function(m,idx){
      if(!m.validated||!m.rows||!m.cols||!Array.isArray(m.values)||m.values.length!==5||
         !Array.isArray(m.rows.values)||m.rows.values.length!==5||
         !Array.isArray(m.cols.values)||m.cols.values.length!==5||
         m.values.some(function(r){return !Array.isArray(r)||r.length!==5||r.some(function(v){return typeof v!=='number'||!isFinite(v);});})||
         typeof m.values[2][2]!=='number'||Math.abs(m.values[2][2]-official)>Math.max(.05,Math.abs(official)*.0001))return '';
      var header={cells:[m.rows.label+' / '+m.cols.label].concat(m.cols.values.map(function(v){return axis(v,m.cols.unit);} ))};
      var rows=m.values.map(function(values,i){return {cells:[axis(m.rows.values[i],m.rows.unit)].concat(values.map(function(v){return v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});}))};});
      return matrixTable(m.title,header,rows,official,idx+4);
    }).filter(Boolean);
    return cards.length?'<p class="jmr-sheet-note"><strong>Adicionales:</strong> '+cards.length+' matrices recalculadas con el motor DCF completo, desde el snapshot conciliado de esta revisión. '+esc(dataset.note||'')+'</p><div class="jmr-matrix-grid">'+cards.join('')+'</div>':'';
  }
  function sensitivity(record){
    var index=sheets(record);
    var sens=get(index,'Sensibilidad DCF') || get(index,'Sensibilidad DCF e inverso') || get(index,'Sensibilidades');
    // La matriz relativa nunca reemplaza las sensibilidades del DCF.
    if(sens && /multipl|economica/i.test(sens.name) && !/dcf/i.test(sens.name)) sens=null;
    if(!sens)return extendedDcfSensitivity(record)||'<p class="jmr-sheet-note">Esta valoración no contiene una matriz de sensibilidad publicada. Consulta la hoja fuente; no se generan cifras aproximadas.</p>';
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
      blocks.push({title:title,header:header,body:body});
      i+=length+1;
    }
    if(blocks.length){
      // Reordenar por impacto económico sin mover fuentes ni alterar cálculos.
      // Precedencia: denominador Gordon (WACC-g), ROIC de madurez y reinversión;
      // luego crecimiento/márgenes y prueba mecánica de TV.
      function priority(t){
        var s=norm(t);
        if(s.includes('wacc')&&(s.includes('crecimientoperpetuo')||s.includes('waccterminalg')))return 0;
        if(s.includes('roic')&&(s.includes('crecimientoperpetuo')||s.includes('crecimientoterminal')))return 1;
        if(s.includes('roic')&&s.includes('wacc'))return 2;
        if(s.includes('crecimiento')&&s.includes('margenebit'))return 3;
        if(s.includes('salestocapital')&&s.includes('margenebit'))return 4;
        if(s.includes('escaladelvalorterminal'))return 5;
        if(s.includes('waccinicial')&&s.includes('crecimiento'))return 6;
        if(s.includes('impuesto')&&s.includes('salestocapital'))return 7;
        return 99;
      }
      blocks.sort(function(a,b){return priority(a.title)-priority(b.title);});
      var rendered=blocks.map(function(m,i){return matrixTable(m.title,m.header,m.body,base,i+1);});
      var different=typeof base==='number'&&isFinite(base)?rendered.filter(function(b){return b.indexOf('>Centro</span>')>=0;}).length:0;
      var warning=different?'<p class="jmr-sheet-note jmr-sheet-warning"><strong>Atención:</strong> '+
        different+' matriz(es) no tienen el centro conciliado con el DCF Base vigente. Requieren revisión antes de usarlas para decidir.</p>':'';
      var term=rows.find(function(r){return norm(r.cells[0]).indexOf('pesovpterminalvpoperativo')===0;});
      var share=term&&term.cells.length>1?num(term.cells[1]):null;
      var exposure=share!==null&&share>=0&&share<=100?'<p class="jmr-sheet-note"><strong>Dependencia del valor terminal:</strong> '+(share<=1?share*100:share).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+'% del valor presente operativo (NO del precio por acción). El crecimiento estable exige reinversión g/ROIC; no extrapolar retornos extraordinarios a perpetuidad.</p>':'';
      var coverage='<p class="jmr-sheet-note"><strong>Prioridad:</strong> WACC terminal × g, ROIC terminal × g y ROIC × WACC terminal; después, desempeño operativo y reinversión. <strong>'+rendered.length+' matrices Base</strong> con precios por acción; los extremos son pruebas, no probabilidades.</p>';
      var stress='<p class="jmr-sheet-note">La matriz de escala del valor terminal (+/−10% y +/−20%) es una prueba de estrés mecánica, distinta de cambiar el crecimiento g. Nunca se incorpora como múltiplo de salida.</p>';
      var add=blocks.length>=7?'':extendedDcfSensitivity(record);
      return warning+coverage+exposure+stress+'<div class="jmr-matrix-grid">'+rendered.join('')+'</div>'+add;
    }
    return '<div class="jmr-sheet-note">Matriz histórica conservada tal cual se publicó; no se interpreta como matriz estándar 5 × 5.</div>'+
      safeTable(sens.html,160);
  }

  /* META R4: 7 métodos × 2 anclas (JMR/observado) × 2 familias
     (tradicional/económica). Solo Base; N/D permanece explícito. */
  function multiplesR4(record,source){
    var rows=readRows(source.html),groups={},meth=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
    var anchors=['JMR','Observado'],families=['Tradicional','Económica'];
    var current=0;
    for(var i=0;i<rows.length-7;i++){
      var t=(rows[i].cells[0]||'').trim();
      if(!meth.some(function(m){return t.indexOf(m+' · ')===0;}))continue;
      if(!/ · (JMR|Observado) · (Tradicional|Económica)$/.test(t))continue;
      var head=rows[i+1],body=rows.slice(i+2,i+7),ctl=rows[i+7];
      var valid=head&&head.cells.length>=6&&body.length===5&&
        body.every(function(r){return r.cells.length>=6&&r.cells.slice(1,6).every(function(v){return num(v)!==null;});});
      var center=valid?num(body[2].cells[3]):null,reported=ctl?num(ctl.cells[1]):null;
      if(!valid||center===null||reported===null||Math.abs(center-reported)>.06){
        groups[t]='<article class="jmr-matrix-card"><h4>'+esc(t)+'</h4><p class="jmr-sheet-note jmr-sheet-warning">N/D — no existe múltiplo de mercado homogéneo, hay denominador no válido o el centro de esta matriz no concilia. El método JMR permanece independiente.</p></article>';
        continue;
      }
      groups[t]=matrixTable(t,head,body,reported,++current);
    }
    var sections=meth.map(function(method,idx){
      var cards=anchors.flatMap(function(a){return families.map(function(f){
        var title=method+' · '+a+' · '+f;
        return groups[title]||'<article class="jmr-matrix-card"><h4>'+esc(title)+'</h4><p class="jmr-sheet-note jmr-sheet-warning">N/D — esta combinación no existe en la copia R4. Requiere completar la hoja; no se reemplaza con ceros.</p></article>';
      });}).join('');
      return '<details class="jmr-sheet-panel"'+(idx===0?' open':'')+'><summary>'+esc(method)+' · Base · cuatro matrices</summary><div class="jmr-matrix-grid">'+cards+'</div></details>';
    }).join('');
    return '<p class="jmr-sheet-note"><strong>META R4:</strong> siete métodos, dos anclas y dos familias. 28 matrices de <strong>valor presente por acción de Base</strong>, desde la hoja oficial; la familia económica aquí modifica el fundamental FY+3, no es el múltiplo justificado de madurez. Cada centro corresponde al propio método, no al DCF.</p>'+sections;
  }

  /* Las matrices relativas usan el centro VP3 del propio múltiplo, no el DCF Base.
     Los 21 bloques mantienen 7 métodos × 3 escenarios y se presentan en
     tres desplegables para evitar tablas kilométricas. */
  // Compatibilidad de transición: usar matrices nativas Base de la misma
  // revisión cuando el publicador entregue JSON estructurado sin tabla HTML.
  // Nunca reconstruye cifras, mezcla revisiones ni considera N/D un cero.
  function nativeMultiplesSensitivity(record){
    var s=record&&record.sensibilidadMultiples;
    if(!s||s.contrato!=='base-native-five-priority-v1'||!Array.isArray(s.matrices))return '';
    var matches=s.revisionId&&s.revisionId===record.revisionId&&
      s.sourceSheetId&&s.sourceSheetId===record.sheet_id&&
      /^[0-9a-f]{64}$/.test(String(s.resultadosSha256||''));
    if(!matches)return '<p class="jmr-sheet-note jmr-sheet-warning">Las matrices no se muestran: la revisión, hoja o fotografía no coincide con la valoración activa.</p>';
    var methods=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
    var by={};
    s.matrices.forEach(function(m){if(m&&methods.indexOf(m.metodo)!==-1&&m.escenario==='base')by[m.metodo]=m;});
    if(methods.some(function(name){return !by[name];}))
      return '<p class="jmr-sheet-note jmr-sheet-warning">Inventario incompleto de matrices Base; consulta la hoja oficial.</p>';
    var details=methods.map(function(name,i){
      var m=by[name];
      var pending='<article class="jmr-matrix-card"><h4>'+esc(name)+'</h4>'+
        '<p class="jmr-sheet-note jmr-sheet-warning">N/D — falta validar o no es interpretable la matriz de este múltiplo. '+esc(m.motivo||'')+'</p></article>';
      if(m.estado!=='OK')return pending;
      var values=m.matriz,x=m.fundamentalFY3,y=m.multiploElegido,original=m.vp3Original;
      var good=Array.isArray(values)&&values.length===5&&
        values.every(function(row){return Array.isArray(row)&&row.length===5&&
          row.every(function(v){return typeof v==='number'&&isFinite(v);});})&&
        Array.isArray(x)&&x.length===5&&x.every(function(v){return typeof v==='number'&&isFinite(v);})&&
        Array.isArray(y)&&y.length===5&&y.every(function(v){return typeof v==='number'&&isFinite(v);})&&
        typeof original==='number'&&isFinite(original)&&
        Math.abs(values[2][2]-original)<=Math.max(1e-6,Math.abs(original)*1e-8)&&
        Math.abs(m.centro-original)<=Math.max(1e-6,Math.abs(original)*1e-8);
      var discounted=(record.descuentoMultiples&&record.descuentoMultiples.metodos||[]).find(function(z){return z.nombre===name;});
      var vp3=discounted&&discounted.base&&discounted.base.vp&&discounted.base.vp[2];
      if(typeof vp3==='number'&&isFinite(vp3))good=good&&Math.abs(vp3-original)<=Math.max(1e-6,Math.abs(original)*1e-8);
      if(!good)return '<article class="jmr-matrix-card"><h4>'+esc(name)+'</h4>'+
        '<p class="jmr-sheet-note jmr-sheet-warning">Matriz ocultada: centro FY+3 o ejes no concilian con la revisión oficial.</p></article>';
      var header={cells:['Múltiplo / fundamental FY+3'].concat(x)};
      var rows=values.map(function(row,j){return {cells:[y[j]].concat(row)};});
      return matrixTable(name+' · múltiplo × fundamental FY+3 · Base',header,rows,original,i+1);
    }).join('');
    var note=s.estadoPublicacion==='CANDIDATO_NO_PUBLICADO'?
      'Borrador técnico NO publicado. Las matrices requieren conciliación y revisión antes de ser oficiales.':
      'Matrices nativas de la hoja; revisión y centro FY+3 comprobados. No constituye auditoría económica.';
    return '<p class="jmr-sheet-note">'+esc(note)+'</p><details class="jmr-sheet-panel" open>'+
      '<summary>Base · siete métodos (cinco prioritarios, dos complementarios)</summary>'+
      '<div class="jmr-matrix-grid">'+details+'</div></details>';
  }
  function multiplesSensitivity(record){
    var all=sheets(record),newSource=all[norm('Sensibilidad múltiplos META')];
    if(record&&String(record.ticker||'').toUpperCase()==='META'){
      if(!newSource)return '<p class="jmr-sheet-note jmr-sheet-warning">META R4: no se importó la pestaña «Sensibilidad múltiplos META». No se sustituye por la matriz de una revisión anterior.</p>';
      return multiplesR4(record,newSource);
    }
    var source=get(all,'Sensibilidad por múltiplo');
    if(!source){
      var nativeResult=nativeMultiplesSensitivity(record);
      return nativeResult||'<p class="jmr-sheet-note">Las matrices por múltiplo aún no se han sincronizado en este análisis. Consulta la hoja fuente.</p>';
    }
    var rows=readRows(source.html),lookup={};
    rows.forEach(function(r){if(r.row)lookup[r.row]=r;});
    var methods=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF','P/V','P/BV'];
    // Unica sensibilidad de valoracion relativa: Base; las otras historias siguen en la valoracion.
    var scenarios=['Base'];
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
        var first=6+(7+mi)*10,head=lookup[first+2],body=[];
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
    // Los multiples justificados tambien presentan solo sensibilidad Base.
    return ['base'].map(function(scenario){
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
      var panels=contents.filter(function(tab){return !(/sensibilidad/i.test(tab.name)&&/múltiplo|multipl|7 metodos x historias/i.test(tab.name));}).map(function(tab,i){return '<details class="jmr-sheet-panel"><summary><span>'+esc(NAME_ALIASES[tab.name]||tab.name)+'</span><span class="jmr-sheet-action">Ver tabla</span></summary><div class="jmr-sheet-body" data-jmr-sheet="'+esc(tab.name)+'"></div></details>';}).join('');
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
      '<div class="jmr-sheets-head"><span class="jmr-overline">ANEXOS DE VALORACIÓN</span><h2>DCF Base · sensibilidades principales</h2>'+
      '<p>Impacto sobre el valor por acción al modificar dos supuestos del DCF completo. Se muestran solo matrices de la hoja fuente cuyo centro puede comprobarse; en móvil se desplazan horizontalmente.</p></div>'+
      sensitivity(record)+'<div class="jmr-sheets-head"><span class="jmr-overline">VALORACIÓN RELATIVA</span><h2>Múltiplos · sensibilidad Base únicamente</h2><p>Conservador y Optimista se conservan como valoraciones, sin matrices de sensibilidad. Eje vertical: múltiplo real (×). Eje horizontal: fundamental FY+3 en unidades de la hoja (±20%). Las cifras son valores presentes por acción; cada centro concilia contra su propio método y no contra el DCF. Disrupción se analiza por separado.</p></div>'+multiplesSensitivity(record)+
      '<div class="jmr-sheets-head"><span class="jmr-overline">MÚLTIPLO ECONÓMICAMENTE JUSTIFICADO</span><h2>Múltiplos justificados · sensibilidad Base</h2><p>Grillas de crecimiento sostenible, ROIC, ROE, margen, Ke, WACC o conversión de caja según el método. Cada celda es un <strong>múltiplo justificado (×)</strong>, NO un valor por acción. El centro no se fuerza a coincidir con el múltiplo elegido ni con el DCF. Solo se presenta Base.</p></div>'+
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
        var sheetName=holder.getAttribute('data-jmr-sheet');
        var isStaleQual=found && sheetName==='Cualitativo' &&
          /Adquisición de Topaz Labs|Acuerdo Comercial con Disney/.test(found.html);
        // La pestaña cruda tiene rótulos específicos de otra empresa presentes
        // en la maestra antigua. No presentar como análisis de este emisor.
        if(isStaleQual){
          holder.innerHTML='<p class="jmr-sheet-note">La tabla Cualitativo procede de una plantilla heredada con rótulos de otra empresa. No es información verificada del emisor. Consulte el análisis fundamental de esta revisión o abra la hoja original para revisar sus celdas. No se modificaron datos financieros.</p>';
        }else if(!found){
          holder.innerHTML='<p class="jmr-sheet-note">No se publicó esta tabla.</p>';
        }else if(/Sensibilidad (?:por múltiplo|múltiplos META)/.test(sheetName)){
          holder.innerHTML=multiplesSensitivity(record);
        }else{
          holder.innerHTML=safeTable(found.html,190);
        }
        holder.dataset.jmrFilled='1';
        JmrDisplayNumber.formatTable(holder);
      });
    });
  }
  global.JmrReportSheets={groups:GROUPS,groupNames:groupNames,renderSensitivity:sensitivity,renderMultiplesSensitivity:multiplesSensitivity,renderEconomicSensitivity:economicSensitivity,safeTable:safeTable,mount:mount};
})(typeof window!=='undefined'?window:globalThis);

