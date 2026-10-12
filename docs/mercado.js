/* Mercado de la vista (13-oct-2026): las páginas de valoración y de análisis fundamental sirven dos mercados con el MISMO diseño.
   ?mercado=colombia muestra solo las valoraciones y análisis en pesos (currency 'COP', acciones de la BVC); sin el parámetro, solo los
   demás (acciones internacionales). */
(function () {
  var col = /[?&]mercado=colombia\b/.test(location.search);
  window.JMR_MERCADO = col ? 'colombia' : 'internacional';
  window.jmrEsCOP = function (r) { return !!r && r.currency === 'COP'; };
  window.jmrDelMercado = function (r) { return window.jmrEsCOP(r) === col; };
  window.jmrMercadoQS = function (sep) { return col ? (sep || '&') + 'mercado=colombia' : ''; };
  document.addEventListener('DOMContentLoaded', function () {
    if (!col) return;
    var nav = document.querySelector('nav.appnav');
    if (nav) {
      nav.querySelectorAll('a').forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      var page = /research/.test(location.pathname) ? 'research.html' : 'visor.html';
      var t = nav.querySelector('a[href="' + page + '?mercado=colombia"]');
      if (t) { t.classList.add('active'); t.setAttribute('aria-current', 'page'); }
    }
    document.title += ' · Colombia';
    var h = document.querySelector('h1');
    if (h) h.textContent += ' · Colombia';
  });
})();
