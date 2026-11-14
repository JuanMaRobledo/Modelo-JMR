/* Shared market classification and navigation; no financial records are moved. */
(function () {
  var params = new URLSearchParams(location.search);
  var col = params.get('mercado') === 'colombia' || /(?:^|\/)colombia\.html$/.test(location.pathname);
  var bvc = /^(?:ECOPETROL|CELSIA|ISA|GEB|GRUPOSURA|PFGRUPSURA|GRUPOARGOS|GRUPOARG|PFGRUPOARG|CEMARGOS|PFCEMARGOS|PFDAVVNDA|PFDAVIGRP|DAVIGRP|MINEROS|BVC|BCOLOMBIA|PFBCOLOM|CIBEST|PFCIBEST|TERPEL)(?:\.CL)?$/;
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
    var floyd = 'https://modelo-jmr.vercel.app/';
    var v2 = 'https://modelo-jmr-v2.vercel.app/';
    var inV2 = location.origin === new URL(v2).origin;
    var toolsActive = ['calculadora.html','screener.html','az-stocks.html','damodaran.html','portafolio.html','mi-bitacora.html','historicos.html','bitacora-terceros.html'].includes(page);
    nav.innerHTML =
      '<div class="jmr-main-links">'+
      link(v2+'jmr-v2.html','JMR V2',inV2 && page!=='prompts.html')+
      link(floyd+'expediente.html?seccion=analisis','Empresas y análisis',!inV2 && (page==='expediente.html'||page==='analisis-lectura.html'))+
      link('https://cartera-two-eta.vercel.app/cartera','Cartera',false)+
      link(v2+'prompts.html','Prompts',inV2 && page==='prompts.html')+
      '<details class="jmr-tools-menu"><summary'+(toolsActive?' class="active"':'')+'>Herramientas</summary><div class="jmr-tools-links">'+
      link(floyd+'calculadora.html'+qs,'Calculadora DCF',page==='calculadora.html')+
      link(floyd+'screener.html','Screener',page==='screener.html')+
      link(floyd+'az-stocks.html','AZ Stocks',page==='az-stocks.html')+
      link(floyd+'damodaran.html','Damodaran',page==='damodaran.html')+
      link(floyd+'portafolio.html'+qs,'Portafolio JMR',page==='portafolio.html')+
      link(floyd+'mi-bitacora.html'+qs,'Mi bitácora',page==='mi-bitacora.html')+
      link(floyd+'historicos.html','Histórico',page==='historicos.html')+
      link(floyd+'bitacora-terceros.html','Bitácora de terceros',page==='bitacora-terceros.html')+
      '</div></details></div>';
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
    style.textContent = "nav.appnav{overflow:visible!important;max-width:100%;display:block}.jmr-main-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.jmr-main-links>a,.jmr-main-links summary{min-height:44px;display:flex;align-items:center;padding:8px 10px;border-radius:8px}.jmr-tools-menu{position:relative}.jmr-tools-menu summary{cursor:pointer;border:1px solid var(--border);font-size:.88rem;font-weight:700}.jmr-tools-links{position:absolute;left:0;top:100%;z-index:200;min-width:210px;display:grid;padding:8px;background:var(--surface,#fff);border:1px solid var(--border);border-radius:10px}.jmr-tools-links a{min-height:44px;display:flex;align-items:center;white-space:normal}.jmr-main-links a[aria-current=page],.jmr-tools-menu[open] summary{background:var(--accent-soft,var(--s2,#e7f5f2));color:var(--accent,var(--teal,#0a746d))}@media(max-width:700px){.jmr-main-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.jmr-main-links>a{white-space:normal}.jmr-tools-menu{grid-column:1/-1}.jmr-tools-links{position:static;min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:4px}}@media print{nav.appnav{display:none!important}}";
    document.head.appendChild(style); render();
  });
})();
