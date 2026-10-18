// Explorador de pesos para valoraciones guardadas. No modifica el registro.
(function(root){
  'use strict';
  var SCENARIOS = ['conservador', 'base', 'optimista'];
  var NAMES = ['EV/EBITDA', 'EV/FCFF', 'P/E', 'P/FCFE', 'P/OCF', 'P/V', 'P/BV'];
  function finite(x){ return typeof x === 'number' && isFinite(x); }
  function byName(rows, name){ return (rows || []).find(function(x){ return x.nombre === name; }); }
  function validMethod(record, name){
    var selected = byName(record.seleccionMultiples && record.seleccionMultiples.metodos, name);
    var present = byName(record.descuentoMultiples && record.descuentoMultiples.metodos, name);
    var future = byName(record.metodos, name);
    if(!selected || selected.control !== 'OK' || /No elegible/i.test(selected.rol || '')) return false;
    if(!present || !future) return false;
    return SCENARIOS.every(function(s){
      var p = present[s];
      return p && finite(p.consolidado) && Array.isArray(p.vp) && finite(p.vp[2]) &&
        Array.isArray(p.fy) && finite(p.fy[2]) && finite(future[s]);
    });
  }
  function candidates(record){
    return NAMES.map(function(name){
      var m = byName(record.seleccionMultiples && record.seleccionMultiples.metodos, name) || {};
      return {name:name, eligible:validMethod(record,name), reason:m.criterio || m.estado || '',
        suggested:Math.max(0, Number(m.pesoValido) || 0),
        previous:Math.max(0, Number(m.pesoVigente) || 0)};
    });
  }
  function calculate(record, choices){
    var available = candidates(record);
    var selected = available.filter(function(m){ return m.eligible && finite(choices[m.name]) && choices[m.name] > 0; });
    var total = selected.reduce(function(sum,m){ return sum + choices[m.name]; },0);
    var dcfPresent = record.descuentoMultiples && record.descuentoMultiples.dcfHoy;
    var dcfFuture = byName(record.metodos,'DCF capitalizado FY+3') || (record.metodos || []).find(function(x){return /DCF/i.test(x.nombre || '');});
    var dcfShare = Number(record.descuentoMultiples && record.descuentoMultiples.pesoDcf);
    if(!finite(dcfShare) || dcfShare < 0 || dcfShare > 1) dcfShare = Number(dcfFuture && dcfFuture.peso);
    if(!finite(dcfShare) || dcfShare < 0 || dcfShare > 1) dcfShare = 1;
    if(!selected.length) dcfShare = 1;
    var out = {weights:{dcf:dcfShare},selected:selected.map(function(m){return m.name;}),
      scenarios:{},status:selected.length ? 'SIMULACIÓN · validar comparables y anclas' : 'Solo DCF: ningún múltiplo elegible seleccionado'};
    selected.forEach(function(m){out.weights[m.name] = (1-dcfShare)*choices[m.name]/total;});
    SCENARIOS.forEach(function(s){
      var dNow = dcfPresent && dcfPresent[s], dFY = dcfFuture && dcfFuture[s];
      var soloHoy = 0, soloFY = 0, soloVP3 = 0;
      selected.forEach(function(m){
        var p=byName(record.descuentoMultiples.metodos,m.name)[s];
        var f=byName(record.metodos,m.name);
        var w=choices[m.name]/total;
        soloHoy += w*p.consolidado;
        soloVP3 += w*p.vp[2];
        soloFY += w*f[s];
      });
      out.scenarios[s] = {
        dcfHoy:finite(dNow)?dNow:null, dcfFY3:finite(dFY)?dFY:null,
        multiplesHoy:selected.length?soloHoy:null,
        multiplesVP3:selected.length?soloVP3:null,
        multiplesFY3:selected.length?soloFY:null,
        combinadoHoy:selected.length && finite(dNow)?dcfShare*dNow+(1-dcfShare)*soloHoy:null,
        combinadoFY3:selected.length && finite(dFY)?dcfShare*dFY+(1-dcfShare)*soloFY:null
      };
    });
    var base=out.scenarios.base;
    if(selected.length && finite(base.dcfHoy) && base.dcfHoy>0 && finite(base.multiplesVP3)){
      out.baseGap=base.multiplesVP3/base.dcfHoy-1;
      if(Math.abs(out.baseGap)>0.30) out.status+=' · Brecha Base superior a 30%: explicar crecimiento, margen, riesgo y comparables antes de adoptar la mezcla';
    }
    return out;
  }
  function suggestedChoices(record){
    var list=candidates(record), out={};
    list.forEach(function(m){out[m.name]=m.eligible?m.suggested:0;});
    return out;
  }
  var api={candidates:candidates,suggestedChoices:suggestedChoices,calculate:calculate};
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  root.JmrWeightSelector=api;
})(typeof window !== 'undefined'?window:globalThis);
