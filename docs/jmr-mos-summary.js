/* Resumen de valor y precio con MOS: regla oficial JMR 35% sobre DCF Base o SOTP Base. */
(function (root) {
  'use strict';
  var MOS = 0.35;
  function number(v) {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
    var n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function basis(rec) {
    if (!rec || typeof rec !== 'object') return null;
    var holding = rec.valoracionHolding;
    if (holding) {
      var sotp = number(holding.nav && holding.nav.base);
      return sotp === null ? null : {value:sotp, label:'SOTP Base'};
    }
    var dcfs = rec.descuentoMultiples && rec.descuentoMultiples.dcfHoy;
    var b = number(dcfs && dcfs.base);
    if (b === null && rec.valorEsperado && Array.isArray(rec.valorEsperado.historias)) {
      var story = rec.valorEsperado.historias.find(function (h) { return h && h.id === 'A'; });
      b = number(story && story.valor);
    }
    if (b === null) b = number(rec.valorPrincipal);
    return b === null ? null : {value:b, label:/FCFE/i.test(String(rec.metodoPrincipal || ''))?'DCF FCFE Base':'DCF Base'};
  }
  function calculate(rec, price) {
    var b = basis(rec), p = number(price);
    if (!b) return null;
    var buy = b.value * (1 - MOS);
    return {base:b.value, precioMOS:buy, mos:MOS, basis:b.label, price:p,
      ratioIntrinsic:p === null ? null : p / b.value,
      gapIntrinsic:p === null ? null : p / b.value - 1,
      ratioMOS:p === null ? null : p / buy,
      gapMOS:p === null ? null : p / buy - 1,
      // Las diferencias inversas NO son intercambiables: la variación potencial
      // toma como denominador el precio pagado HOY, no el valor estimado.
      upsideToIntrinsic:p === null ? null : b.value / p - 1,
      moveToBuy:p === null ? null : buy / p - 1};
  }
  function currency(rec) {
    return /^(COP)$/i.test(String((rec && (rec.currency || rec.moneda)) || 'USD')) ? 'COP' : 'USD';
  }
  function money(n, c) {
    return n === null ? '—' : (c === 'COP' ? 'COP ' : 'US$ ') +
      n.toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function percent(n, signed) {
    if (n === null) return '—';
    var prefix = signed ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
    return prefix + (Math.abs(signed ? n : n) * 100).toLocaleString('es-CO',
      {minimumFractionDigits:1, maximumFractionDigits:1}) + '%';
  }
  function set(root, key, value) {
    var el = root.querySelector('[data-mos="' + key + '"]');
    if (el) el.textContent = value;
    return el;
  }
  function detailTone(diff) {
    if (diff === null) return 'neutral';
    return diff > 0 ? 'premium' : diff < 0 ? 'discount' : 'neutral';
  }
  function relation(reference, premium, label) {
    if (premium === null) return 'No hay cotización comparable.';
    if (Math.abs(premium) < 0.00005) return 'El mercado coincide con el ' + label + '.';
    return 'El mercado cotiza ' + percent(Math.abs(premium), false) +
      (premium > 0 ? ' por encima ' : ' por debajo ') + 'del ' + label + '.';
  }
  function scenarios(rec, unit) {
    var ve = rec && rec.valorEsperado, stories = ve && ve.historias;
    if (!Array.isArray(stories) || !stories.length) return '';
    var names = {B:'Conservador', A:'Base', D:'Optimista', C:'Disrupción'};
    var ordered = ['B','A','D','C'].map(function(id){
      return stories.find(function(s){return s && s.id === id;});
    }).filter(Boolean);
    if (!ordered.length) return '';
    var rows = ordered.map(function(s){
      var active = number(s.valor), prior = number(s.referenciaHistoricaR4);
      var historic = active === null && prior !== null;
      var value = active !== null ? active : prior;
      var status = historic ? 'Referencia R4 · sin recalcular en R5' :
        (value !== null ? 'DCF de la revisión activa' : 'Pendiente de cálculo');
      var suffix = s.id === 'C' ? ' · fuera del promedio' : '';
      return '<div class="jmr-mos-story'+(s.id === 'A' ? ' is-base' : '')+'">' +
        '<span>'+names[s.id]+suffix+'</span><strong>'+money(value,unit)+'</strong>' +
        '<small>'+status+'</small></div>';
    }).join('');
    var includesHistoric=ordered.some(function(s){return number(s.valor)===null && number(s.referenciaHistoricaR4)!==null;});
    return '<div class="jmr-mos-scenarios"><div class="jmr-mos-scenarios-head">' +
      '<strong>Escenarios de valoración</strong><span>'+ (includesHistoric ?
        'Referencias de revisiones diferentes; no son comparables ni promediables todavía' :
        'DCF por escenario · Disrupción por separado') +'</span></div>' +
      '<div class="jmr-mos-story-grid">'+rows+'</div></div>';
  }
  function render(container, rec, market) {
    if (!container) return null;
    var calc = calculate(rec, market && market.price);
    if (!calc) { container.hidden = true; container.replaceChildren(); return null; }
    var unit = currency(rec);
    container.innerHTML =
      '<div class="jmr-mos-heading"><strong>Valor intrínseco y precio de compra</strong><span>MOS del 35% aplicado solo al '+calc.basis+'</span></div>' +
      '<div class="jmr-mos-grid">' +
      '<div class="jmr-mos-metric"><span data-mos="price-label">Precio de referencia del estudio</span><strong data-mos="price"></strong></div>' +
      '<div class="jmr-mos-metric"><span>Valor intrínseco · Base</span><strong data-mos="intrinsic"></strong></div>' +
      '<div class="jmr-mos-metric jmr-mos-target"><span>Precio de compra con MOS 35%</span><strong data-mos="target"></strong></div>' +
      '</div>' +
      '<div class="jmr-mos-comparisons">' +
      '<div class="jmr-mos-comparison"><span>Potencial desde el precio de mercado al valor intrínseco</span>' +
      '<strong data-mos="upside"></strong><small data-mos="intrinsic-explanation"></small></div>' +
      '<div class="jmr-mos-comparison"><span>Variación necesaria para alcanzar el precio de compra con MOS</span>' +
      '<strong data-mos="move-to-buy"></strong><small data-mos="mos-explanation"></small></div>' +
      '</div>' + scenarios(rec,unit) + '<p class="jmr-mos-source" data-mos="source"></p>';
    container.hidden = false;
    set(container, 'intrinsic', money(calc.base, unit));
    set(container, 'target', money(calc.precioMOS, unit));
    set(container, 'price', money(calc.price, unit));
    set(container, 'upside', percent(calc.upsideToIntrinsic, true));
    set(container, 'move-to-buy', percent(calc.moveToBuy, true));
    set(container, 'intrinsic-explanation', relation(calc.base, calc.gapIntrinsic, 'valor intrínseco'));
    set(container, 'mos-explanation', relation(calc.precioMOS, calc.gapMOS, 'precio de compra con MOS'));
    set(container, 'price-label', market && market.latest ?
      'Última cotización disponible' : 'Precio de referencia del estudio');
    var source = market && market.latest ?
      'Cotización: ' + String(market.source || 'servicio de mercado') + (market.asOf ? ' · ' + String(market.asOf) : '') + '. Puede estar retrasada.' :
      (calc.price === null ? 'No existe precio de mercado verificable; ratios no disponibles.' :
      'Precio guardado con la valoración; puede estar desactualizado.' +
      (rec.precioReferenciaFecha ? ' Corte: '+String(rec.precioReferenciaFecha)+'.' : ''));
    set(container, 'source', source);
    ['upside','move-to-buy'].forEach(function(key){
      var el = container.querySelector('[data-mos="' + key + '"]');
      if (el) el.dataset.tone = calc[key === 'upside' ? 'upsideToIntrinsic' : 'moveToBuy'] === null ?
        'neutral' : (key === 'upside' ? detailTone(-calc.gapIntrinsic) : detailTone(-calc.gapMOS));
    });
    return calc;
  }
  root.JmrMosSummary = {MOS:MOS, basis:basis, calculate:calculate, render:render};
})(typeof window !== 'undefined' ? window : globalThis);
