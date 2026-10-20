/* Enlace contextual a auditorías narrativas, separado del motor de valoración.
   Publica el botón SOLO si existe el Markdown de ese ticker en el repositorio de datos. */
(function (global) {
  'use strict';
  var API = 'https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/auditorias/narrativas?ref=main';
  var cachePromise = null;
  var TICKER_PATTERN = /^[A-Z][A-Z0-9.]{0,11}$/;
  function normalize(ticker) { return String(ticker || '').trim().toUpperCase(); }

  function inventory() {
    if (!cachePromise) {
      cachePromise = fetch(API, {cache: 'no-store', headers: {'Accept': 'application/vnd.github+json'}})
        .then(function (response) {
          if (!response.ok) throw new Error('Inventario no disponible (HTTP ' + response.status + ')');
          return response.json();
        })
        .then(function (items) {
          if (!Array.isArray(items)) throw new Error('Inventario inválido');
          return items.filter(function (file) {
            return file && file.type === 'file' && /^[A-Z][A-Z0-9.]{0,11}\.md$/.test(file.name);
          }).map(function (file) { return file.name.slice(0, -3); });
        })
        .catch(function (error) {
          cachePromise = null; // Si falla la red, permitir reintentar.
          throw error;
        });
    }
    return cachePromise;
  }

  function mount(container, ticker) {
    if (!container) return;
    var key = normalize(ticker);
    container.setAttribute('data-audit-ticker', key);
    container.textContent = '';
    if (!TICKER_PATTERN.test(key)) return;

    var link = document.createElement('a');
    link.className = 'jmr-audit-context-link';
    link.textContent = 'Ver auditoría de supuestos ↗';
    link.href = 'auditorias.html?ticker=' + encodeURIComponent(key);
    link.hidden = true;

    var note = document.createElement('span');
    note.className = 'jmr-audit-context-note';
    note.textContent = 'Comprobando auditoría de ' + key + '…';
    container.appendChild(link);
    container.appendChild(note);

    inventory().then(function (tickers) {
      if (container.getAttribute('data-audit-ticker') !== key) return;
      var available = tickers.indexOf(key) !== -1;
      link.hidden = !available;
      note.textContent = available ? 'Documento narrativo editable · No modifica la valoración' :
        'Auditoría narrativa pendiente para ' + key;
    }).catch(function () {
      if (container.getAttribute('data-audit-ticker') !== key) return;
      // El destino valida también el ticker: nunca redirigir a PYPL por defecto.
      link.hidden = false;
      link.textContent = 'Consultar auditoría de ' + key + ' ↗';
      note.textContent = 'No se pudo comprobar si el informe está disponible.';
    });
  }
  global.JmrAuditLinks = {mount: mount, normalize: normalize};
})(window);
