/* Shared live source for calculator, report and workbook viewer. */
(function(global){
  'use strict';
  var repo='https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
  function ticker(value){var t=String(value||'').trim().toUpperCase();if(!/^[A-Z0-9._-]{1,24}$/.test(t))throw new Error('Ticker inválido.');return t;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function request(url,options){return fetch(url,Object.assign({cache:'no-store',signal:AbortSignal.timeout(25000)},options||{})).then(function(r){
    return r.json().catch(function(){return {};}).then(function(d){if(!r.ok){var e=new Error(d.error||'HTTP '+r.status);e.status=r.status;throw e;}return d;});
  });}
  function findCompany(key){
    return request(repo+'valoraciones?ref=main').then(function(files){
      var chosen=files.filter(function(f){return f.type==='file'&&f.name.replace(/-\d{10,}\.json$/i,'').replace(/\.json$/i,'').replace(/-\d{8}-[A-Za-z0-9]+$/i,'').toUpperCase()===key;})
        .sort(function(a,b){return b.name.localeCompare(a.name,'en',{numeric:true});})[0];
      if(!chosen){var e=new Error('No hay una valoración guardada para '+key+'.');e.status=404;throw e;}
      return request('https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR-datos/main/'+chosen.path).then(function(rec){
        if(ticker(rec.ticker)!==key)throw new Error('El ticker no coincide con la empresa del archivo.');
        return {record:rec,path:chosen.path};
      });
    });
  }
  function fromWorkbook(wb){
    var sheets={};
    wb.SheetNames.forEach(function(name){sheets[name]={};Object.keys(wb.Sheets[name]).forEach(function(a){
      if(a[0]==='!')return;var c=wb.Sheets[name][a];sheets[name][a]={v:c.v,w:c.w,formula:c.f||null};
    });});return sheets;
  }
  function load(key){
    key=ticker(key);
    return request('/api/model?ticker='+encodeURIComponent(key)).then(function(s){
      if(s.publicWorkbook){var bytes=Uint8Array.from(atob(s.publicWorkbook),function(c){return c.charCodeAt(0);});s.sheets=fromWorkbook(XLSX.read(bytes,{type:'array'}));delete s.publicWorkbook;}
      s.writable=!!s.revision;return s;}).catch(function(apiError){
      // GitHub Pages has no server API. Public native sheets remain a read-only alternative.
      return findCompany(key).then(function(found){
        var id=/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/.exec(found.record.hojaGoogle||'');
        if(!id)throw new Error('La valoración no tiene una hoja de Google vinculada.');
        return fetch('https://docs.google.com/spreadsheets/d/'+id[1]+'/export?format=xlsx', {cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(25000)})
          .then(function(r){if(!r.ok)throw new Error('No se pudo leer la hoja vigente.');return r.arrayBuffer();})
          .then(function(bytes){
            var wb=XLSX.read(bytes,{type:'array'});
            if(!wb.Sheets['Input sheet']||!wb.Sheets['Valuation output'])throw new Error('La respuesta no contiene el Modelo JMR.');
            return Object.assign(found,{sheets:fromWorkbook(wb),fetchedAt:new Date().toISOString(),writable:false,writeError:apiError.message});
          }).catch(function(){throw new Error(apiError.message+' No se pudo importar la hoja vigente; se conserva el informe publicado.');});
      });
    });
  }
  function workbook(snapshot){
    var wb={SheetNames:Object.keys(snapshot.sheets),Sheets:{}};
    wb.SheetNames.forEach(function(name){
      var ws={},maxR=0,maxC=0;
      Object.keys(snapshot.sheets[name]).forEach(function(a){var c=snapshot.sheets[name][a],p=XLSX.utils.decode_cell(a);
        maxR=Math.max(maxR,p.r);maxC=Math.max(maxC,p.c);
        ws[a]={v:c.v,t:typeof c.v==='number'?'n':typeof c.v==='boolean'?'b':'s',w:c.w};if(c.formula)ws[a].f=c.formula.replace(/^=/,'');
      });ws['!ref']=XLSX.utils.encode_range({r:0,c:0},{r:maxR,c:maxC});wb.Sheets[name]=ws;
    });return wb;
  }
  function cellVal(ws,a){return ws&&ws[a]?ws[a].v:null;}
  function readUnifiedStories(wb){
    var ws=wb && wb.Sheets && wb.Sheets['Escenarios e historias'];
    if(!ws || typeof cellVal(ws,'H10')!=='number') {
      var legacy=wb && wb.Sheets && wb.Sheets['Escenarios JMR NFLX'];
      if(!legacy || !String(cellVal(legacy,'A1')||'').match(/NFLX/)) return null;
      var histories=[5,6,7,8].map(function(row,i){
        var output=i===3 ? wb.Sheets['DCF Disrupción NFLX'] : wb.Sheets['Valuation output'];
        var offset=i===3 ? 0 : i*51, product=1;
        ['C','D','E','F','G'].forEach(function(col){product*=1+Number(cellVal(output,col+(4+offset)));});
        return {id:['A','B','D','C'][i],nombre:cellVal(legacy,'A'+row),valor:cellVal(legacy,'B'+row),
          probabilidad:null,crecimiento:Math.pow(product,.2)-1,margen:cellVal(legacy,'E'+row),
          salesToCapital:cellVal(legacy,'F'+row),salesToCapital2:cellVal(legacy,'G'+row),
          terminalGrowth:cellVal(legacy,'H'+row),roicTerminal:cellVal(legacy,'I'+row)};
      });
      if(histories.some(function(h){return typeof h.valor!=='number' || !isFinite(h.valor);})) return null;
      var vals=histories.filter(function(h){return h.id!=='C';}).map(function(h){return h.valor;});
      return {valor:vals.reduce(function(a,b){return a+b;},0)/3,tipoPromedio:'aritmetico',valorCentral:histories[0].valor,dcfBase:histories[0].valor,historias:histories,
        escenariosUnificados:true,historiaCentralId:'A',pesosAprobados:false,rango:{min:Math.min.apply(null,vals),max:Math.max.apply(null,vals)}};
    }
    var hs=[];
    for(var row=5;row<=8;row++) hs.push({id:String.fromCharCode(60+row),nombre:cellVal(ws,'A'+row),probabilidad:cellVal(ws,'B'+row),crecimiento:cellVal(ws,'C'+row),margen:cellVal(ws,'D'+row),salesToCapital:cellVal(ws,'E'+row),salesToCapital2:cellVal(ws,'F'+row),roicTerminal:cellVal(ws,'G'+row),terminalGrowth:cellVal(ws,'J'+row),valor:cellVal(ws,'H'+row)});
    var main=hs.filter(function(h){return ['A','B','D'].indexOf(h.id)>=0;}), w=main.reduce(function(a,h){return a+(typeof h.probabilidad==='number'?h.probabilidad:0);},0), weighted=main.every(function(h){return typeof h.probabilidad==='number'&&h.probabilidad>=0;})&&w>0;
    var average=main.every(function(h){return typeof h.valor==='number'&&isFinite(h.valor);})?main.reduce(function(a,h){return a+h.valor*(weighted?h.probabilidad/w:1/3);},0):null;
    return {valor:average,tipoPromedio:weighted?'ponderado':'aritmetico',valorCentral:cellVal(ws,'H11'),historias:hs,escenariosUnificados:true,historiaCentralId:'A',rango:{min:Math.min.apply(null,main.map(function(h){return h.valor;})),max:Math.max.apply(null,main.map(function(h){return h.valor;}))}};
  }
  var DM_SCEN = [['conservador', 11], ['base', 20], ['optimista', 29]];
  function readDescuentoMultiples(wb, res){
    var s = wb.Sheets['Descuento de múltiplos'];
    var trio = function(sheet, row){ return { conservador: cellVal(sheet,'C'+row), base: cellVal(sheet,'D'+row), optimista: cellVal(sheet,'E'+row) }; };
    var num = function(v){ return (typeof v === 'number' && isFinite(v)) ? v : null; };
    if(!s || String(cellVal(s,'A5') || '').indexOf('Tasa de descuento') !== 0){
      return { horizonteAnios: 3, costoPatrimonio: s ? cellVal(s,'D2') : null, dcfHoy: trio(res, 32), multiplesHoy: trio(res, 33) };
    }
    var metodos = [];
    for(var i = 0; i < 5; i++){
      var m = { nombre: cellVal(s,'A'+(11+i)), peso: num(cellVal(s,'B'+(11+i))), pesoMultiplos: num(cellVal(s,'C'+(11+i))) };
      DM_SCEN.forEach(function(sc){
        var r = sc[1] + i;
        m[sc[0]] = { fy: ['D','E','F'].map(function(c){ return num(cellVal(s,c+r)); }),
                     vp: ['G','H','I'].map(function(c){ return num(cellVal(s,c+r)); }),
                     consolidado: num(cellVal(s,'J'+r)), chequeo: cellVal(s,'K'+r) || null };
      });
      metodos.push(m);
    }
    // P/V and P/BV have their own native schedules; keep all seven methods on refresh.
    [['P/V','PV'],['P/BV','PBV']].forEach(function(pair){
      var extra=wb.Sheets[pair[1]],weight=pair[0]==='P/V'?num(cellVal(s,'B55')):0;
      weight=weight===null?0:weight;
      var total=num(cellVal(s,'B39'));
      var method={nombre:pair[0],peso:weight,pesoMultiplos:total>0?weight/total:0};
      DM_SCEN.forEach(function(sc,index){
        var r=12+index*11,discountRow=41+index;
        method[sc[0]]={fy:['F','G','H'].map(function(c){return num(cellVal(extra,c+r));}),
          vp:['B','C','D'].map(function(c){return num(cellVal(extra,c+discountRow));}),
          consolidado:num(cellVal(extra,'E'+discountRow)),chequeo:extra?'Fuente nativa':'N/D'};
      });
      metodos.push(method);
    });
    var consolidado = {};
    DM_SCEN.forEach(function(sc){
      var r = sc[1] + 5;
      consolidado[sc[0]] = { fy: ['D','E','F'].map(function(c){ return num(cellVal(s,c+r)); }),
                             vp: ['G','H','I'].map(function(c){ return num(cellVal(s,c+r)); }),
                             consolidado: num(cellVal(s,'J'+r)) };
    });
    return {
      version: 3, horizontes: [1, 2, 3], horizonteAnios: 3,
      costoPatrimonio: cellVal(s,'B5'), criterio: cellVal(s,'B6') || 'Promedio 1-3 años',
      formula: 'VP_n = Precio FY+n / (1 + Ke)^n + suma(Dividendo FY+t / (1 + Ke)^t), t = 1..n',
      dcfHoy: trio(s, 38), multiplesHoy: trio(s, 39), ponderadoHoy: trio(s, 40),
      pesoDcf: num(cellVal(s,'B38')), pesoMultiplos: num(cellVal(s,'B39')),
      metodos: metodos, consolidado: consolidado,
      chequeo: { multiplosFY3SinDescontar: trio(s, 47), multiplosVP3: trio(s, 48), resultado: trio(s, 49) }
    };
  }

  function record(snapshot){
    var rec=Object.assign({},snapshot.record), sheets=snapshot.sheets;
    if(rec.valoracionHolding)throw new Error('La sincronización DCF no modifica informes SOTP de holdings. Abre su hoja vigente.');
    ['multiplosImplicitosDCF','cotizacionMultiples','crecimientoImplicito','multiplesHistoricos'].forEach(function(k){rec[k]=null;});
    function v(s,a){return sheets[s]&&sheets[s][a]?sheets[s][a].v:null;}
    function trio(s,row,cols){var t={};['conservador','base','optimista'].forEach(function(k,i){t[k]=v(s,(cols||'CDE')[i]+row);});return t;}
    var rv='Resumen de Valoración';
    if(!sheets[rv])throw new Error('Falta el resumen de valoración de la hoja.');
    rec.metodos=[['DCF Damodaran',6],['EV/EBITDA',7],['EV/FCFF',8],['P/E',9],['P/FCFE',10],['P/OCF',11]].map(function(p){return Object.assign({nombre:p[0],peso:v(rv,'B'+p[1])},trio(rv,p[1]));});
    rec.objetivoPonderado=trio(rv,12);rec.valorPresentePonderado=trio(rv,34);rec.cagr=trio(rv,13);
    rec.mos=v(rv,'G4');rec.tipo=v(rv,'G3');rec.precio=v('Input sheet','D1');
    rec.precioReferenciaFuente='Hoja vigente de Google Sheets';rec.precioReferenciaConsultadoAt=snapshot.fetchedAt;
    // Read the native DCF scenario outputs; never infer the report from rounded HTML or a second engine.
    var wb=workbook(snapshot);
    rec.valorEsperado=readUnifiedStories(wb);
    if(rec.valorEsperado)rec.valorEsperado.dcfBase=rec.valorEsperado.valorCentral;
    rec.baseMOS='dcfBase';
    var base=rec.valorEsperado&&rec.valorEsperado.dcfBase;
    rec.precioMOS=typeof base==='number'&&typeof rec.mos==='number'?base*(1-rec.mos):v(rv,'D36');
    rec.precioMOSMax=rec.precioMOS;rec.precioMOSHoy={conservador:rec.precioMOS,base:rec.precioMOS,optimista:rec.precioMOS};
    rec.zonas={};[['value',16],['deepValue',17],['historica',18]].forEach(function(p){rec.zonas[p[0]]={min:v(rv,'C'+p[1]),max:v(rv,'B'+p[1])};});rec.zonas.conMOS={min:rec.precioMOS,max:rec.precioMOS};
    rec.hojas={financieros:{},valoracion:{},analisis:{}};
    wb.SheetNames.forEach(function(name){
      var group=/Statement|Trailing 12/.test(name)?'financieros':/Márgenes|Eficiencia|Diagnostics|Salud/.test(name)?'analisis':'valoracion';
      rec.hojas[group][name]=XLSX.utils.sheet_to_html(wb.Sheets[name],{header:'',footer:''});
    });
    // Native discount table uses the same schema as the viewer.
    rec.descuentoMultiples=readDescuentoMultiples(wb,wb.Sheets[rv]);
    rec.descuentoMultiples.metodos && rec.descuentoMultiples.metodos.filter(function(m){return m.nombre==='P/V'||m.nombre==='P/BV';}).forEach(function(m){
      rec.metodos.push({nombre:m.nombre,peso:m.peso,conservador:m.conservador.fy[2],base:m.base.fy[2],optimista:m.optimista.fy[2]});
    });
    rec.valorPrincipal=base;
    rec.sourcePath=snapshot.path;rec.liveModel={revision:snapshot.revision||null,fetchedAt:snapshot.fetchedAt};
    return rec;
  }
  function calculatorResult(rec){
    function t(x){x=x||{};return {cons:x.conservador,base:x.base,opt:x.optimista};}
    var dm=rec.descuentoMultiples||{},prices={},weights={},methods={},check={};
    var keys={'DCF Damodaran':'dcf','EV/EBITDA':'evEbitda','EV/FCFF':'evFcff','P/E':'pe','P/FCFE':'pfcfe','P/OCF':'pocf'};
    (rec.metodos||[]).forEach(function(m){var key=keys[m.nombre];if(key){prices[key]=t(m);weights[key]=m.peso;}});
    (dm.metodos||[]).forEach(function(m){var key=keys[m.nombre];if(key)methods[key]={cons:m.conservador,base:m.base,opt:m.optimista};});
    ['evEbitda','evFcff','pe','pfcfe','pocf'].forEach(function(k){if(!methods[k])methods[k]={cons:{},base:{},opt:{}};});
    ['cons','base','opt'].forEach(function(k,i){var name=['conservador','base','optimista'][i],fy=dm.chequeo&&dm.chequeo.multiplosFY3SinDescontar, vp=dm.chequeo&&dm.chequeo.multiplosVP3;
      check[k]={multiplosVP3:vp&&vp[name],multiplosFY3SinDescontar:fy&&fy[name],ok:typeof(vp&&vp[name])==='number'&&typeof(fy&&fy[name])==='number'&&vp[name]<=fy[name]};
    });
    return {precios:prices,pesos:weights,precioObjetivo:t(rec.objetivoPonderado),cagr:t(rec.cagr),zonas:rec.zonas,
      precioConMOS:{base:rec.precioMOS,valor:rec.precioMOS},
      valorPresente:{pesoDcf:dm.pesoDcf,pesoMultiplos:dm.pesoMultiplos,dcf:t(dm.dcfHoy),metodos:methods,multiplos:t(dm.multiplesHoy),ponderado:t(dm.ponderadoHoy||rec.valorPresentePonderado),chequeo:check,tasaDescuento:dm.costoPatrimonio,criterio:dm.criterio}};
  }
  function mount(host,key,onSnapshot,initial){
    var active=true,busy=false,failedDraft=false,snapshot=null,previousRevision=null,lastPayload=null;
    key=ticker(key);
    host.innerHTML='<details open><summary>Datos de la hoja · '+esc(key)+'</summary><p data-sync-status role="status">Cargando hoja vigente…</p><button type="button" data-sync-refresh>Actualizar ahora</button><div data-sync-fields></div></details>';
    function status(text){host.querySelector('[data-sync-status]').textContent=text;}
    function fields(s){
      var cells=s.sheets['Input sheet']||{},body=host.querySelector('[data-sync-fields]');
      if(!s.writable){body.innerHTML='<p>Lectura de la hoja vigente. Para editar desde el informe, abre la app con la conexión a Google Sheets configurada.</p>';return;}
      var rows=Object.keys(cells).filter(function(a){return /^(B[1-9]\d{0,2}|D1)$/.test(a)&&!cells[a].formula&&typeof(cells[a].raw||{}).numberValue==='number';});
      body.innerHTML='<p>Los cambios se guardan en la hoja al salir del campo. Las tasas que muestran % se escriben en porcentaje. Las fórmulas son de solo lectura.</p><div style="display:grid;gap:8px">'+rows.map(function(a){
        var c=cells[a],percent=/%\s*$/.test(c.w||''),label=(cells['A'+a.slice(1)]||{}).v||a;
        return '<label style="display:flex;gap:12px;justify-content:space-between;align-items:center">'+esc(label)+' · '+esc(a)+(percent?' (%)':'')+'<input style="width:150px" type="number" step="any" data-sync-cell="'+a+'" data-sync-scale="'+(percent?100:1)+'" value="'+(c.raw.numberValue*(percent?100:1))+'"></label>';
      }).join('')+'</div>';
    }
    function accept(s){if(!active)return;var payload=JSON.stringify(s.sheets),same=payload===lastPayload;lastPayload=payload;var changed=previousRevision&&s.revision&&previousRevision!==s.revision;previousRevision=s.revision;snapshot=s;if(!same){fields(s);onSnapshot(s,!!changed);}status('Hoja leída '+new Date(s.fetchedAt).toLocaleTimeString('es-CO')+(s.writable?' · cambios sincronizados con Google Sheets.':' · solo lectura.'));}
    function refresh(){if(!active||busy||failedDraft||host.contains(document.activeElement)&&document.activeElement.matches('input'))return;busy=true;load(key).then(accept).catch(function(e){if(active)status(e.message);}).finally(function(){busy=false;});}
    host.querySelector('[data-sync-refresh]').onclick=function(){failedDraft=false;refresh();};
    host.addEventListener('change',function(e){
      var input=e.target;if(!input.matches('[data-sync-cell]')||!snapshot||busy)return;
      var address=input.dataset.syncCell,old=snapshot.sheets['Input sheet'][address].raw.numberValue,value=input.valueAsNumber/Number(input.dataset.syncScale);
      if(!Number.isFinite(value)){status('Escribe un número válido.');return;}if(value===old)return;
      busy=true;host.querySelectorAll('input').forEach(function(n){n.disabled=true;});status('Guardando en la hoja…');
      request('/api/model?ticker='+encodeURIComponent(key),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:snapshot.revision,changes:[{sheet:'Input sheet',cell:address,previous:old,value:value}]})})
        .then(function(s){s.writable=true;accept(s);global.dispatchEvent(new CustomEvent('jmr-model-updated',{detail:{ticker:key}}));})
        .catch(function(err){failedDraft=true;status(err.message+' El cambio no se confirmó; actualiza la hoja antes de reintentar.');})
        .finally(function(){busy=false;if(active)host.querySelectorAll('input').forEach(function(n){n.disabled=false;});});
    });
    function focus(){refresh();}function update(e){if(e.detail.ticker===key)refresh();}
    global.addEventListener('focus',focus);global.addEventListener('jmr-model-updated',update);
    var timer=setInterval(function(){if(!document.hidden)refresh();},30000);if(initial)accept(initial);else refresh();
    return {dispose:function(){active=false;clearInterval(timer);global.removeEventListener('focus',focus);global.removeEventListener('jmr-model-updated',update);}};
  }
  global.JmrModelSync={load:load,findCompany:findCompany,workbook:workbook,record:record,calculatorResult:calculatorResult,mount:mount,ticker:ticker};
})(typeof window!=='undefined'?window:globalThis);
