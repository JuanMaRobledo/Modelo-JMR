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
      gapMOS:p === null ? null : p / buy - 1};
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
  function render(container, rec, market) {
    if (!container) return null;
    var calc = calculate(rec, market && market.price);
    if (!calc) { container.hidden = true; container.replaceChildren(); return null; }
    var unit = currency(rec);
    container.innerHTML =
      '<div class="jmr-mos-heading"><strong>Valoración y precio de compra</strong><span>MOS fijo del 35% sobre '+calc.basis+'</span></div>' +
      '<div class="jmr-mos-grid">' +
      '<div class="jmr-mos-metric"><span>Valor intrínseco Base</span><strong data-mos="intrinsic"></strong></div>' +
      '<div class="jmr-mos-metric jmr-mos-target"><span>Precio de compra · MOS 35%</span><strong data-mos="target"></strong></div>' +
      '<div class="jmr-mos-metric"><span data-mos="price-label">Precio de referencia</span><strong data-mos="price"></strong></div>' +
      '<div class="jmr-mos-metric"><span>Precio / valor intrínseco</span><strong data-mos="ratioIntrinsic"></strong><small data-mos="gapIntrinsic"></small></div>' +
      '<div class="jmr-mos-metric"><span>Precio / precio con MOS</span><strong data-mos="ratioMOS"></strong><small data-mos="gapMOS"></small></div>' +
      '</div><p class="jmr-mos-source" data-mos="source"></p>';
    container.hidden = false;
    set(container, 'intrinsic', money(calc.base, unit));
    set(container, 'target', money(calc.precioMOS, unit));
    set(container, 'price', money(calc.price, unit));
    set(container, 'ratioIntrinsic', percent(calc.ratioIntrinsic, false));
    set(container, 'ratioMOS', percent(calc.ratioMOS, false));
    set(container, 'gapIntrinsic', calc.gapIntrinsic === null ? 'Sin comparación' :
      percent(calc.gapIntrinsic, true) + ' · prima/descuento frente al intrínseco');
    set(container, 'gapMOS', calc.gapMOS === null ? 'Sin comparación' :
      percent(calc.gapMOS, true) + ' · prima/descuento frente al precio con MOS');
    set(container, 'price-label', market && market.latest ? 'Última cotización disponible' : 'Precio de referencia del estudio');
    var source = market && market.latest ?
      'Cotización: ' + String(market.source || 'servicio de mercado') + (market.asOf ? ' · ' + String(market.asOf) : '') + '. Puede estar retrasada.' :
      (calc.price === null ? 'No existe precio de mercado verificable; ratios no disponibles.' :
      'Precio guardado con la valoración; puede estar desactualizado.');
    set(container, 'source', source);
    ['gapIntrinsic','gapMOS'].forEach(function (key) {
      var el = container.querySelector('[data-mos="' + key + '"]');
      if (el) el.dataset.tone = (calc[key] == null ? 'neutral' : calc[key] > 0 ? 'premium' : 'discount');
    });
    return calc;
  }
  root.JmrMosSummary = {MOS:MOS, basis:basis, calculate:calculate, render:render};
})(typeof window !== 'undefined' ? window : globalThis);
