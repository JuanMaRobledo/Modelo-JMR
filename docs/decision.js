// Decisión de inversión (30-sep-2026): Comprar / Mantener / Vender.
//
// La toma el usuario, no el análisis (criterio Damodaran: el documento termina
// en un registro de decisión). Se guarda dentro del propio registro — el JSON
// del análisis en Modelo-JMR-datos/analisis/ o el caso en
// bitacora/hipotesis.json — con fecha, precio de ese momento, nota e historial.
// Lo usan Análisis Fundamental (research.js) y Mi Bitácora.
(function (global) {
  var OPTIONS = [
    { v: '', label: 'Sin decidir' },
    { v: 'comprar', label: 'Comprar' },
    { v: 'mantener', label: 'Mantener' },
    { v: 'vender', label: 'Vender' }
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function label(v) { var o = OPTIONS.filter(function (x) { return x.v === v; })[0]; return o ? o.label : 'Sin decidir'; }
  function fmtDate(iso) { if (!iso) return ''; var d = new Date(iso); return isNaN(d) ? String(iso) : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtPrice(p) { return (typeof p === 'number' && isFinite(p)) ? 'US$' + p.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; }

  // Nueva decisión a partir de la anterior: la anterior pasa al historial.
  function build(prev, valor, nota, precio) {
    var hist = (prev && prev.historial) ? prev.historial.slice() : [];
    if (prev && (prev.valor || prev.nota)) hist.unshift({ valor: prev.valor, nota: prev.nota || '', fecha: prev.fecha, precio: prev.precio });
    return { valor: valor || '', nota: String(nota || '').trim(), fecha: new Date().toISOString(),
             precio: (typeof precio === 'number' && isFinite(precio)) ? precio : null, historial: hist.slice(0, 20) };
  }

  function badge(dec) {
    if (!dec || !dec.valor) return '';
    return '<span class="jmr-dec-badge ' + esc(dec.valor) + '" title="Decisión del ' + esc(fmtDate(dec.fecha)) + '">' + esc(label(dec.valor)) + '</span>';
  }

  // Control completo: selector, nota, guardar e historial.
  function widget(dec, key) {
    dec = dec || {};
    var opts = OPTIONS.map(function (o) { return '<option value="' + o.v + '"' + (o.v === (dec.valor || '') ? ' selected' : '') + '>' + o.label + '</option>'; }).join('');
    var last = dec.fecha ? 'Última: <b>' + esc(label(dec.valor)) + '</b> · ' + esc(fmtDate(dec.fecha)) + (dec.precio != null ? ' · precio ' + esc(fmtPrice(dec.precio)) : '') : 'Todavía no registraste una decisión.';
    var hist = (dec.historial || []).length ? '<details class="jmr-dec-hist"><summary>Historial (' + dec.historial.length + ')</summary><ul>' + dec.historial.map(function (h) {
      return '<li><b>' + esc(label(h.valor)) + '</b> · ' + esc(fmtDate(h.fecha)) + (h.precio != null ? ' · ' + esc(fmtPrice(h.precio)) : '') + (h.nota ? ' — ' + esc(h.nota) : '') + '</li>';
    }).join('') + '</ul></details>' : '';
    return '<div class="jmr-dec" data-dec-key="' + esc(key) + '">' +
      '<div class="jmr-dec-row"><label>Mi decisión <select class="jmr-dec-sel">' + opts + '</select></label>' +
      '<input class="jmr-dec-note" type="text" maxlength="280" placeholder="Por qué (opcional): historia, valor, confianza…" value="' + esc(dec.nota || '') + '">' +
      '<button type="button" class="jmr-dec-save">Guardar decisión</button></div>' +
      '<p class="jmr-dec-meta">' + last + '</p><p class="jmr-dec-status" aria-live="polite"></p>' + hist + '</div>';
  }
  function read(root) {
    return { valor: root.querySelector('.jmr-dec-sel').value, nota: root.querySelector('.jmr-dec-note').value };
  }
  function setStatus(root, text, ok) {
    var el = root.querySelector('.jmr-dec-status');
    if (el) { el.textContent = text; el.className = 'jmr-dec-status' + (ok === true ? ' ok' : ok === false ? ' bad' : ''); }
  }

  // Actualiza solo el campo decision de un análisis guardado en GitHub (lee
  // el archivo vigente para no pisar otros cambios).
  function saveToResearchFile(ghApi, path, decision) {
    var G = global.GhOAuth;
    if (!G || !G.getGhToken()) return Promise.reject(new Error('Conecta GitHub para guardar la decisión.'));
    var headers = G.ghHeaders(G.getGhToken());
    return fetch(ghApi + path, { headers: headers }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      var rec = JSON.parse(G.b64DecodeUnicode(data.content.replace(/\n/g, '')));
      rec.decision = decision;
      var body = { message: 'Decisión ' + (rec.ticker || '') + ': ' + label(decision.valor), content: G.b64EncodeUnicode(JSON.stringify(rec, null, 2)), sha: data.sha };
      return fetch(ghApi + path, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (e) { throw new Error((e && e.message) || ('HTTP ' + res.status)); });
      return res.json();
    });
  }

  // Estilos del control (con los tokens de color de la app).
  if (global.document && !document.getElementById('jmr-dec-css')) {
    var st = document.createElement('style'); st.id = 'jmr-dec-css';
    st.textContent = '.jmr-dec{border:1px solid var(--border-soft);border-radius:12px;padding:12px 14px;background:var(--surface-2);margin:12px 0}' +
      '.jmr-dec-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
      '.jmr-dec-row label{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)}' +
      '.jmr-dec-sel,.jmr-dec-note{font:500 14px inherit;padding:7px 9px;border:1px solid var(--border-soft);border-radius:8px;background:var(--surface,#fff);color:inherit}' +
      '.jmr-dec-sel{text-transform:none;letter-spacing:0;font-weight:700}' +
      '.jmr-dec-note{flex:1 1 220px;min-width:0}' +
      '.jmr-dec-save{font:600 13px inherit;padding:8px 12px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}' +
      '.jmr-dec-save:disabled{opacity:.6;cursor:default}' +
      '.jmr-dec-meta{font-size:12px;color:var(--ink-faint);margin:8px 0 0}' +
      '.jmr-dec-status{font-size:12px;margin:4px 0 0;min-height:0}.jmr-dec-status.ok{color:var(--positive)}.jmr-dec-status.bad{color:var(--negative)}' +
      '.jmr-dec-hist{font-size:12px;color:var(--ink-soft);margin-top:6px}.jmr-dec-hist ul{margin:6px 0 0;padding-left:18px}' +
      '.jmr-dec-badge{display:inline-block;font:700 11px/1.6 inherit;padding:1px 9px;border-radius:999px;margin-left:6px;vertical-align:middle;text-transform:uppercase;letter-spacing:.04em}' +
      '.jmr-dec-badge.comprar{background:color-mix(in oklab,var(--positive) 18%,transparent);color:var(--positive)}' +
      '.jmr-dec-badge.vender{background:color-mix(in oklab,var(--negative) 18%,transparent);color:var(--negative)}' +
      '.jmr-dec-badge.mantener{background:color-mix(in oklab,var(--accent) 16%,transparent);color:var(--accent)}' +
      '@media print{.jmr-dec{display:none}}';
    document.head.appendChild(st);
  }

  global.JmrDecision = { OPTIONS: OPTIONS, label: label, build: build, badge: badge, widget: widget, read: read, setStatus: setStatus,
                         saveToResearchFile: saveToResearchFile, fmtDate: fmtDate };
})(window);
