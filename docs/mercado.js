/* Shared market classification and navigation; no financial records are moved. */
(function () {
  var params = new URLSearchParams(location.search);
  var col = params.get('mercado') === 'colombia' || /(?:^|\/)colombia\.html$/.test(location.pathname);
  var bvc = /^(?:ECOPETROL|CELSIA|ISA|GEB|GRUPOSURA|PFGRUPSURA|GRUPOARGOS|GRUPOARG|PFGRUPOARG|CEMARGOS|PFCEMARGOS|PFDAVVNDA|PFDAVIGRP|DAVIGRP|MINEROS|BVC|BCOLOMBIA|PFBCOLOM|CIBEST|PFCIBEST)(?:\.CL)?$/;
  window.jmrEsCOP = function (r) {
    if (!r) return false;
    var nested = r.visor || r.valoracionActual || r.research || r.linkedValuation || r.bitacoraPropia;
    var ticker = String(r.ticker || r.instrument && r.instrument.ticker || '').trim().toUpperCase();
    var market = String(r.market || r.mercado || r.exchange || r.instrument && r.instrument.exchange || '').toUpperCase();
    return String(r.currency || r.instrument && r.instrument.currency || '').toUpperCase() === 'COP' || /^(CO|COL|COLOMBIA|BVC)$/.test(market) || bvc.test(ticker) || /(?:^|\/)colombia\//.test(r.remotePath || r.sourcePath || '') || !!(nested && nested !== r && window.jmrEsCOP(nested));
  };
  window.jmrDelMercado = function (r) { return window.jmrEsCOP(r) === col; };
  window.jmrMercadoQS = function (sep) { return col ? (sep || '&') + 'mercado=colombia' : ''; };
  window.jmrMercadoHref = function (page, record) {
    var colombian = record ? window.jmrEsCOP(record) : col;
    return page + (colombian ? (page.indexOf('?') >= 0 ? '&' : '?') + 'mercado=colombia' : '');
  };
  window.JMR_MERCADO = col ? 'colombia' : 'internacional';
  function link(href, label, active, cls) {
    return '<a href="' + href + '"' + (cls ? ' class="' + cls + '"' : active ? ' class="active"' : '') + (active ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }
  function render() {
    var nav = document.querySelector('nav.appnav');
    if (!nav) return;
    var page = location.pathname.split('/').pop() || 'index.html';
    var research = page === 'research.html';
    var marketPage = research || (page==='expediente.html' && !!params.get('mercado')) || ['visor.html', 'colombia.html', 'portafolio.html', 'mi-bitacora.html', 'calculadora.html'].indexOf(page) >= 0;
    var qs = col ? '?mercado=colombia' : '';
    var valuationDossier = page==='expediente.html'&&params.get('seccion')==='valoracion';
    var activeInternational = (page==='visor.html' && !col)||(valuationDossier&&!col);
    var activeColombia = (page==='visor.html' && col)||page==='colombia.html'||(valuationDossier&&col);
    nav.setAttribute('aria-label', 'Navegación principal JMR');
    // Cada enlace lleva a una ruta canónica estable, nunca al documento de origen
    // bajo otra etiqueta. Hojas, auditorías y sensibilidades de una empresa se abren desde su ficha. La navegación contextual se limita a la segunda fila.
    nav.innerHTML =
      link('expediente.html?seccion=analisis', 'Empresas y análisis', page==='expediente.html' || page==='analisis-lectura.html') +
      link('https://cartera-two-eta.vercel.app/', 'Cartera', false, 'jmr-home') +
      '<details class="jmr-tools-menu"><summary>Herramientas</summary><div class="jmr-tools-links">'+
      link('calculadora.html'+qs,'Calculadora DCF',page==='calculadora.html')+
      link('screener.html','Screener',page==='screener.html')+
      link('az-stocks.html','AZ Stocks',page==='az-stocks.html')+
      link('damodaran.html','Damodaran',page==='damodaran.html')+
      link('portafolio.html'+qs,'Portafolio JMR',page==='portafolio.html')+
      link('mi-bitacora.html'+qs,'Mi bitácora',page==='mi-bitacora.html')+
      '</div></details>' +
      link('historicos.html', 'Histórico', page==='historicos.html') +
      link('bitacora-terceros.html', 'Bitácora de terceros', page==='bitacora-terceros.html');
    // El filtro por mercado y las siete secciones viven en la ficha de empresa.
    // Ninguna vista técnica crea una segunda barra de navegación global.
    var sub = document.getElementById('jmr-market-nav');
    if (sub) {sub.hidden=true;sub.innerHTML='';}
    if (marketPage && page !== 'colombia.html') {
      var title = research ? 'Análisis fundamental' : page === 'expediente.html' ? 'Fichas · Modelo JMR' : page === 'visor.html' ? 'Valoraciones · Modelo JMR' : page === 'portafolio.html' ? 'Portafolio' : page === 'mi-bitacora.html' ? 'Mi bitácora' : 'Calculadora DCF';
      var h = document.querySelector('h1'); if (h) h.textContent = title + ' · ' + (col ? 'Colombia' : 'Internacionales');
      document.title = title + ' · ' + (col ? 'Colombia' : 'Internacionales');
    }
  }
  window.jmrAjustarMercado = function (r) {
    var next = window.jmrEsCOP(r);
    if (next === col) return;
    col = next; window.JMR_MERCADO = col ? 'colombia' : 'internacional';
    var url = new URL(location.href);
    if (col) url.searchParams.set('mercado', 'colombia'); else url.searchParams.delete('mercado');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    render();
    if (typeof CustomEvent === 'function') document.dispatchEvent(new CustomEvent('jmr-market-change'));
  };
  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent = 'nav.appnav{box-sizing:border-box;max-width:100%;overflow-x:auto}@media(min-width:900px){nav.appnav{flex-wrap:wrap}}.jmr-market-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 auto;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--surface)}.jmr-market-nav[hidden]{display:none}.jmr-market-nav>span{font-size:12px;font-weight:700;color:var(--ink-faint);margin-right:12px}.jmr-market-nav a{color:var(--ink-soft);text-decoration:none;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600}.jmr-market-nav a:hover,.jmr-market-nav a.active{background:var(--accent-soft);color:var(--accent)}@media(max-width:600px){.jmr-market-nav{padding:10px 16px;gap:4px}.jmr-market-nav>span{width:100%}.jmr-market-nav a{padding:8px}}@media print{.jmr-market-nav{display:none!important}}body.pdf-mode .jmr-market-nav{display:none!important}';
    style.textContent += '.jmr-tools-menu{position:relative;align-self:center;flex:none}.jmr-tools-menu summary{cursor:pointer;list-style:none;padding:8px 11px;border:1px solid var(--border);border-radius:8px;color:var(--ink);font-size:13px;font-weight:700}.jmr-tools-menu summary::-webkit-details-marker{display:none}.jmr-tools-menu[open] summary{background:var(--accent-soft);color:var(--accent)}.jmr-tools-links{position:absolute;top:100%;left:0;z-index:200;display:grid;gap:2px;min-width:200px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px;box-shadow:var(--shadow)}.jmr-tools-links a{padding:9px 11px!important;white-space:nowrap}.jmr-tools-links a:hover{background:var(--surface-2)}@media(max-width:650px){.jmr-tools-links{left:auto;right:0}}';
    document.head.appendChild(style); render();
  });
})();
