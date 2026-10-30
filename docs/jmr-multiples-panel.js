/* Tabla de valoración relativa: lectura del JSON oficial sin reconstruir precios ni múltiplos. */
(function(global){
  'use strict';
  const CORE=['EV/EBITDA','EV/FCFF','P/E','P/FCFE','P/OCF'];
  function num(x){return typeof x==='number'&&Number.isFinite(x)?x:null;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function currency(v){const c=String(v?.currency||v?.moneda||'USD').toUpperCase();return c==='USD'?'US$':c==='COP'?'COP $':c+' ';}
  function money(x,unit){return num(x)===null?'N/D':unit+Number(x).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function pct(x){return num(x)===null?'N/D':(x*100).toLocaleString('es-CO',{maximumFractionDigits:2})+' %';}
  function norm(n){return String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();}
  function key(n){const k=norm(n);if(k==='evebitda')return 'EV/EBITDA';if(k==='evfcff')return 'EV/FCFF';if(k==='pe')return 'P/E';if(k==='pfcfe')return 'P/FCFE';if(k==='pocf')return 'P/OCF';if(['ps','pv','pspv'].includes(k))return 'P/S o P/V';if(k==='pbv')return 'P/BV';return '';}
  function projected(obj){return num(obj?.consolidado)??num(obj?.valor)??num(obj);}
  function rows(v){
    const dm=v?.descuentoMultiples||{},methods=Array.isArray(v?.metodos)?v.metodos:[],
      sources=Array.isArray(dm.metodos)?dm.metodos:[],result=new Map();
    function accept(entry,isDetail){
      const n=entry?.nombre||entry?.metodo||entry?.name||'',k=key(n);
      if(!k || /^dcf/i.test(n))return;
      const old=result.get(k)||{nombre:n||k,peso:null,conservador:null,base:null,optimista:null,vp:null,estado:'',motivo:''};
      if(!old.nombre||old.nombre===k)old.nombre=n;
      if(!isDetail){
        old.peso=num(entry.peso)??old.peso;
        old.conservador=projected(entry.conservador)??old.conservador;
        old.base=projected(entry.base)??old.base;
        old.optimista=projected(entry.optimista)??old.optimista;
        old.vp=num(entry.valorPresenteBase)??num(entry.valorPresente?.base)??old.vp;
      }else{
        old.peso=num(entry.peso)??old.peso;
        old.conservador=projected(entry.conservador)??old.conservador;
        old.base=projected(entry.base)??old.base;
        old.optimista=projected(entry.optimista)??old.optimista;
        old.vp=num(entry.base?.consolidado)??num(entry.valorPresenteBase)??old.vp;
      }
      old.estado=entry.estado||old.estado;
      old.motivo=entry.motivo||old.motivo;
      result.set(k,old);
    }
    methods.forEach(x=>accept(x,false));sources.forEach(x=>accept(x,true));
    const controlled=v?.sensibilidadMultiples?.controles;
    if(Array.isArray(controlled))controlled.forEach(x=>{
      const k=key(x.metodo);if(!k)return;
      const old=result.get(k)||{nombre:x.metodo||k,peso:null,conservador:null,base:null,optimista:null,vp:null,estado:'',motivo:''};
      old.estado=x.estado||old.estado;old.motivo=x.motivo||old.motivo;
      result.set(k,old);
    });
    return [...CORE,...[...result.keys()].filter(k=>!CORE.includes(k))].map(k=>result.get(k)||{
      nombre:k,peso:null,conservador:null,base:null,optimista:null,vp:null,estado:'N/D',motivo:'No consta un método conciliado en la revisión oficial.'
    });
  }
  function aggregates(v){
    const dm=v?.descuentoMultiples||{};
    const find=(obj,k)=>num(obj?.[k]);
    return {
      dcfBase:num(dm.dcfHoy?.base)??num(v?.valorPrincipal),
      multiplesConservador:find(dm.multiplesHoy,'conservador'),
      multiplesBase:find(dm.multiplesHoy,'base'),
      multiplesOptimista:find(dm.multiplesHoy,'optimista'),
      ponderadoBase:find(dm.ponderadoHoy,'base')??find(v?.valorPresentePonderado,'base'),
      pesoDcf:num(dm.pesoDcf),pesoMultiplos:num(dm.pesoMultiplos),
      criterio:String(dm.criterio||''),horizonte:num(dm.horizonteAnios)
    };
  }
  function summary(v){
    const a=aggregates(v),unit=currency(v);
    return '<div class="jmr-multiple-summary" aria-label="Comparación de valor intrínseco y múltiplos">'+
      '<div><span>Valor intrínseco DCF Base</span><strong>'+esc(money(a.dcfBase,unit))+'</strong></div>'+
      '<div><span>Precio relativo Base · múltiplos hoy</span><strong>'+esc(money(a.multiplesBase,unit))+'</strong></div>'+
      '<div><span>Combinación DCF + múltiplos · referencia</span><strong>'+esc(money(a.ponderadoBase,unit))+'</strong></div>'+
      '</div>';
  }
  function render(v){
    if(!v)return '<p class="status-note">Cargando valoración por múltiplos del catálogo oficial…</p>';
    const a=aggregates(v),unit=currency(v),rr=rows(v);
    const missing=!rr.some(r=>r.base!==null||r.vp!==null) && a.multiplesBase===null;
    const head='<h3>Valoración por múltiplos · '+esc(v.ticker||'empresa')+'</h3>'+
      '<p>Datos de la <strong>revisión oficial '+esc(v.revisionId||v.revision_id||'vigente')+'</strong>. El DCF es el valor intrínseco principal; la valoración por múltiplos es una referencia relativa independiente. No se mezclan precios proyectados y valores descontados a hoy.</p>';
    const intro=summary(v);
    const scenario='<h4>Precio relativo por múltiplos, descontado a hoy</h4>'+
      '<div class="jmr-multiple-summary jmr-multiple-scenarios">'+
      [['Conservador',a.multiplesConservador],['Base',a.multiplesBase],['Optimista',a.multiplesOptimista]]
        .map(([t,n])=>'<div><span>'+t+'</span><strong>'+esc(money(n,unit))+'</strong></div>').join('')+'</div>';
    const tr=rr.map(r=>{
      const status=r.estado==='N/D'||(r.base===null&&r.vp===null)?'Pendiente':
        r.peso===0?'Referencia · peso 0 %':'Dato disponible';
      return '<tr><th scope="row">'+esc(r.nombre)+'</th><td>'+esc(money(r.conservador,unit))+'</td><td>'+
        esc(money(r.base,unit))+'</td><td>'+esc(money(r.optimista,unit))+'</td><td>'+
        esc(money(r.vp,unit))+'</td><td>'+esc(pct(r.peso))+'</td><td>'+esc(status)+
        (r.motivo?'<small title="'+esc(r.motivo)+'"> · '+esc(r.motivo)+'</small>':'')+'</td></tr>';
    }).join('');
    return head+intro+(missing?'<p class="status-note">Los múltiplos de esta revisión están pendientes o no conciliados. Se muestran todos los métodos sin inventar importes.</p>':'')+
      scenario+'<h4>Métodos individuales y ponderaciones</h4>'+
      '<p class="jmr-multiple-note">Las tres columnas de escenarios reproducen los valores que el archivo registra para cada método (generalmente FY+3). Solo la columna «Valor presente Base» contiene el importe descontado individual, cuando consta explícitamente en la fuente. Un guion N/D no representa cero.</p>'+
      '<div class="sensitivity-table-scroll"><table class="jmr-multiple-table"><thead><tr><th>Método</th><th>Conservador · fuente</th><th>Base · fuente</th><th>Optimista · fuente</th><th>Valor presente Base</th><th>Peso en combinado</th><th>Estado</th></tr></thead><tbody>'+tr+'</tbody></table></div>'+
      '<p class="jmr-multiple-note">El precio relativo agregado Base es '+esc(money(a.multiplesBase,unit))+'. La combinación DCF + múltiplos '+(a.ponderadoBase===null?'no está disponible':('es '+esc(money(a.ponderadoBase,unit))))+
      '. '+esc(a.criterio)+(a.horizonte?' Horizonte declarado: '+a.horizonte+' años.':'')+
      ' Los datos históricos, supuestos, anclas y fórmulas originales pueden consultarse en Modelo y supuestos → Descuento de múltiplos.</p>';
  }
  global.JmrMultiplesPanel={rows,aggregates,summary,render};
})(typeof window!=='undefined'?window:globalThis);
