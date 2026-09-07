(function () {
  'use strict';

  var GH_OWNER = 'JuanMaRobledo';
  var GH_REPO = 'Modelo-JMR-datos';
  var GH_API = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/';

  function el(id) { return document.getElementById(id); }
  // getGhToken/ghHeaders/b64Decode viven en gh_oauth.js (cargado antes que
  // este archivo) — se reusan acá tal cual para que esta página, el Visor,
  // Mi Bitácora y Research compartan una sola implementación en vez de
  // copias que puedan desincronizarse. Esta página solo lee (Bitácora +
  // Visor + Research), nunca guarda nada, así que no necesita ningún token
  // — pero si el usuario ya conectó GitHub en otra pestaña, se manda igual
  // (mismo origen, misma clave de localStorage) por si algún día hiciera falta.
  var getGhToken = GhOAuth.getGhToken;
  var ghHeaders = GhOAuth.ghHeaders;
  var b64Decode = GhOAuth.b64DecodeUnicode;
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function normalizeText(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function fmtMoney(v) {
    if (v === undefined || v === null || typeof v !== 'number' || isNaN(v)) return '—';
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function logoUrlForTicker(t) { return 'https://images.financialmodelingprep.com/symbol/' + encodeURIComponent(t) + '.png'; }
  function htmlToPlainText(html) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // ---------------------------------------------------------------------
  // Dos bitácoras distintas, mantenidas como fuentes separadas (nunca
  // mezcladas en una sola lista): la externa (55 casos de un tercero,
  // hardcodeados en un `var DATA = [...]` dentro del propio index.html —
  // JSON válido embebido como literal JS, sin archivo fetcheable aparte;
  // se extrae con fetch + regex en vez de duplicar la lista a mano o tocar
  // index.html, que ya funciona — ver HANDOFF_PORTAFOLIO.md, opción A) y
  // la propia (mi-bitacora.html, guardada en bitacora/hipotesis.json). Un
  // mismo ticker puede tener caso en ambas — se muestran las dos, nunca se
  // descarta una a favor de la otra.
  // ---------------------------------------------------------------------
  function fetchBitacoraExterna() {
    return fetch('index.html').then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (text) {
      var m = text.match(/var DATA = (\[[\s\S]*?\]);/);
      if (!m) throw new Error('No se encontró la lista de casos en index.html');
      return JSON.parse(m[1]);
    }).catch(function (err) { console.error('Bitácora externa:', err); return []; });
  }
  function fetchBitacoraPropia() {
    return fetch(GH_API + 'bitacora/hipotesis.json', { headers: ghHeaders() }).then(function (res) {
      if (res.status === 404) return [];
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || !data.content) return [];
      return JSON.parse(b64Decode(data.content.replace(/\n/g, '')));
    }).catch(function (err) { console.error('Mi Bitácora:', err); return []; });
  }

  // ---------------------------------------------------------------------
  // Fuentes 2 y 3: Visor (valoraciones/) y Research (analisis/) — mismo
  // patrón de listar + abrir cada archivo que ya usan visor.html y
  // research.js.
  // ---------------------------------------------------------------------
  function loadJsonFolder(folder) {
    return fetch(GH_API + folder, { headers: ghHeaders() }).then(function (res) {
      if (res.status === 404) return [];
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (list) {
      var files = (Array.isArray(list) ? list : []).filter(function (f) { return /\.json$/i.test(f.name); });
      return Promise.all(files.map(function (f) {
        return fetch(f.url || (GH_API + f.path), { headers: ghHeaders() }).then(function (r) { return r.json(); }).then(function (data) {
          return JSON.parse(b64Decode(data.content.replace(/\n/g, '')));
        }).catch(function (err) { console.error('Archivo ' + f.path + ':', err); return null; });
      }));
    }).then(function (records) { return records.filter(Boolean); }).catch(function (err) { console.error('Carpeta ' + folder + ':', err); return []; });
  }

  function canonicalTicker(t) {
    if (!t) return null;
    var first = String(t).split('/')[0].trim().toUpperCase();
    return first || null;
  }

  function buildPortfolio(bitacoraExterna, bitacoraPropia, visorRecords, researchRecords) {
    var map = {};
    function ensure(t, displayTicker) {
      if (!map[t]) map[t] = { ticker: t, displayTicker: displayTicker || t, empresa: '', bitacoraExterna: null, bitacoraPropia: null, visor: null, research: null };
      return map[t];
    }
    bitacoraExterna.forEach(function (d) {
      var t = canonicalTicker(d.ticker);
      if (!t) return;
      var entry = ensure(t, d.ticker);
      if (!entry.empresa && d.empresa) entry.empresa = d.empresa;
      if (!entry.bitacoraExterna || String(d.fecha || '') > String(entry.bitacoraExterna.fecha || '')) entry.bitacoraExterna = d;
    });
    bitacoraPropia.forEach(function (d) {
      var t = canonicalTicker(d.ticker);
      if (!t) return;
      var entry = ensure(t, d.ticker);
      if (!entry.empresa && d.empresa) entry.empresa = d.empresa;
      if (!entry.bitacoraPropia || String(d.fecha || '') > String(entry.bitacoraPropia.fecha || '')) entry.bitacoraPropia = d;
    });
    visorRecords.forEach(function (r) {
      var t = canonicalTicker(r.ticker);
      if (!t) return;
      var entry = ensure(t, r.ticker);
      if (!entry.empresa && r.nombreActivo) entry.empresa = r.nombreActivo;
      if (!entry.visor || String(r.fecha || '') > String(entry.visor.fecha || '')) entry.visor = r;
    });
    researchRecords.forEach(function (r) {
      var t = canonicalTicker(r.ticker);
      if (!t) return;
      var entry = ensure(t, r.ticker);
      if (!entry.empresa && r.company) entry.empresa = r.company;
      if (!entry.research || String(r.updatedAt || r.date || '') > String(entry.research.updatedAt || entry.research.date || '')) entry.research = r;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.ticker.localeCompare(b.ticker); });
  }

  var searchCache = {};
  function entrySearchText(entry) {
    if (searchCache[entry.ticker]) return searchCache[entry.ticker];
    var parts = [entry.ticker, entry.displayTicker, entry.empresa];
    [entry.bitacoraExterna, entry.bitacoraPropia].forEach(function (d) {
      if (d) parts.push(d.empresa, d.moat, d.riesgos, d.conclusion, d.cat);
    });
    if (entry.research) parts.push(entry.research.title, entry.research.company, htmlToPlainText(entry.research.html));
    var text = normalizeText(parts.join(' '));
    searchCache[entry.ticker] = text;
    return text;
  }

  // Extracto de "Resumen ejecutivo" — mismo criterio que recordExcerpt() en
  // research.js, portado acá para no depender de cargar ese script entero.
  function excerptFromHtml(html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var headings = Array.prototype.slice.call(doc.body.querySelectorAll('h1,h2,h3,h4'));
    var target = headings.find(function (h) { return normalizeText(h.textContent).indexOf('resumen ejecutivo') === 0; });
    var text = '';
    if (target) {
      var node = target.nextElementSibling;
      while (node && !/^H[1-4]$/.test(node.tagName)) { text += ' ' + node.textContent; node = node.nextElementSibling; }
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) { var p = doc.body.querySelector('p,li'); text = p ? p.textContent.replace(/\s+/g, ' ').trim() : ''; }
    if (text.length > 220) text = text.slice(0, 220).replace(/\s+\S*$/, '') + '…';
    return text;
  }

  // Franjas de zonas de valor + líneas de objetivo — copia exacta de
  // buildZonesChart() en visor.html (mismo diseño visual en toda la app).
  function buildZonesChart(precioActual, zonas, objetivoPonderado) {
    if (!zonas) return '<div class="chart-empty">Sin datos suficientes.</div>';
    var rows = [
      { label: 'Precio con MOS', z: zonas.conMOS },
      { label: 'Valoración histórica', z: zonas.historica },
      { label: 'Deep Value', z: zonas.deepValue },
      { label: 'Value', z: zonas.value }
    ].filter(function (r) { return r.z && typeof r.z.min === 'number' && typeof r.z.max === 'number' && isFinite(r.z.min) && isFinite(r.z.max); });
    if (!rows.length) return '<div class="chart-empty">Sin datos suficientes.</div>';

    var targets = [];
    if (objetivoPonderado) {
      if (typeof objetivoPonderado.conservador === 'number' && isFinite(objetivoPonderado.conservador)) targets.push({ value: objetivoPonderado.conservador, label: 'Conservador', cls: 'chart-ref-cons' });
      if (typeof objetivoPonderado.base === 'number' && isFinite(objetivoPonderado.base)) targets.push({ value: objetivoPonderado.base, label: 'Base', cls: 'chart-ref-base' });
      if (typeof objetivoPonderado.optimista === 'number' && isFinite(objetivoPonderado.optimista)) targets.push({ value: objetivoPonderado.optimista, label: 'Optimista', cls: 'chart-ref-opt' });
    }

    var W = 320, rowH = 36, padTop = 16, padBottom = 6, padLeft = 108, padRight = 12;
    var H = padTop + padBottom + rows.length * rowH;
    var allVals = rows.reduce(function (a, r) { return a.concat([r.z.min, r.z.max]); }, []).concat(targets.map(function (r) { return r.value; }));
    if (typeof precioActual === 'number' && isFinite(precioActual)) allVals.push(precioActual);
    var maxV = Math.max.apply(null, allVals) * 1.08;
    var minV = Math.min(0, Math.min.apply(null, allVals) * 0.95);
    var plotW = W - padLeft - padRight;
    function x(v) { return padLeft + plotW * ((v - minV) / (maxV - minV)); }
    var bars = rows.map(function (r, i) {
      var rowCenter = padTop + i * rowH + rowH / 2;
      var barY = rowCenter + 7;
      var x1 = x(r.z.min), x2 = x(r.z.max);
      return '<g><text x="' + (padLeft - 12) + '" y="' + (barY + 4) + '" text-anchor="end" class="chart-lbl">' + r.label + '</text>' +
        '<rect x="' + x1 + '" y="' + (barY - 7) + '" width="' + Math.max(x2 - x1, 2) + '" height="14" rx="5" class="chart-zone-bar"><title>' + r.label + ': ' + fmtMoney(r.z.min) + ' – ' + fmtMoney(r.z.max) + '</title></rect>' +
        '<text x="' + ((x1 + x2) / 2) + '" y="' + (rowCenter - 9) + '" text-anchor="middle" class="chart-zone-val">' + fmtMoney(r.z.min) + '–' + fmtMoney(r.z.max) + '</text></g>';
    }).join('');
    var marker = '';
    if (typeof precioActual === 'number' && isFinite(precioActual)) {
      var mx = x(precioActual);
      marker = '<line x1="' + mx + '" y1="' + (padTop - 4) + '" x2="' + mx + '" y2="' + H + '" class="chart-ref"><title>Actual: ' + fmtMoney(precioActual) + '</title></line>' +
        '<text x="' + mx + '" y="' + (padTop - 8) + '" text-anchor="middle" class="chart-ref-lbl">Actual ' + fmtMoney(precioActual) + '</text>';
    }
    var targetLines = targets.map(function (r) {
      var rx = x(r.value);
      return '<line x1="' + rx + '" y1="' + (padTop - 4) + '" x2="' + rx + '" y2="' + H + '" class="' + r.cls + '"><title>' + r.label + ': ' + fmtMoney(r.value) + '</title></line>';
    }).join('');
    var legend = targets.length ? ('<div class="chart-legend">' + targets.map(function (r) {
      return '<span class="chart-legend-item"><span class="chart-legend-swatch ' + r.cls + '-sw"></span>' + r.label + ' ' + fmtMoney(r.value) + '</span>';
    }).join('') + '</div>') : '';
    return legend + '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart-svg" role="img" aria-label="Zonas de valor vs. precio actual y objetivos">' + bars + targetLines + marker + '</svg>';
  }

  function bitacoraCaseHtml(d) {
    var catCls = normalizeText(d.cat) === 'especulativa' ? 'spec' : 'std';
    return '' +
      '<div class="port-kv-row"><span class="chip ' + catCls + '">' + escapeHtml(d.cat || '—') + '</span><span class="port-fecha">' + escapeHtml(d.fecha || '') + '</span></div>' +
      '<div class="port-kv"><span class="k">Precio de entrada</span><span class="v">' + escapeHtml(d.precio || '—') + '</span></div>' +
      '<div class="port-kv"><span class="k">Zonas de valor</span><span class="v mono">V ' + escapeHtml(d.zV || '—') + ' · DV ' + escapeHtml(d.zD || '—') + ' · VH ' + escapeHtml(d.zH || '—') + '</span></div>' +
      '<div class="port-kv"><span class="k">Escenarios objetivo</span><span class="v mono">Neg ' + escapeHtml(d.oNeg || '—') + ' · Base ' + escapeHtml(d.oBase || '—') + ' · Opt ' + escapeHtml(d.oOpt || '—') + '</span></div>' +
      '<div class="port-kv"><span class="k">CAGR objetivo</span><span class="v mono">' + escapeHtml(d.cagr || '—') + '</span></div>' +
      (d.moat ? '<p class="port-text"><b>Moat:</b> ' + escapeHtml(d.moat) + '</p>' : '') +
      (d.riesgos ? '<p class="port-text"><b>Riesgos:</b> ' + escapeHtml(d.riesgos) + '</p>' : '') +
      (d.conclusion ? '<p class="port-text"><b>Conclusión:</b> ' + escapeHtml(d.conclusion) + '</p>' : '');
  }

  // Un mismo ticker puede tener caso en la Bitácora externa y en Mi
  // Bitácora a la vez — se muestran ambas, cada una con su propia
  // etiqueta, en vez de descartar una a favor de la otra.
  function bitacoraBlockHtml(entry) {
    if (!entry.bitacoraExterna && !entry.bitacoraPropia) {
      return '<div class="port-empty">Sin caso registrado en ninguna bitácora.</div>';
    }
    var out = '';
    if (entry.bitacoraPropia) {
      out += '<div class="port-source-lbl">Modelo JMR Bitácora</div>' + bitacoraCaseHtml(entry.bitacoraPropia);
    }
    if (entry.bitacoraExterna) {
      if (out) out += '<hr class="port-divider">';
      out += '<div class="port-source-lbl">Bitácora externa</div>' + bitacoraCaseHtml(entry.bitacoraExterna);
    }
    return out;
  }

  function visorBlockHtml(entry) {
    var r = entry.visor;
    if (!r) return '<div class="port-empty">Sin valoración guardada en el Visor. <a href="visor.html">Crear una →</a></div>';
    var precio = typeof r.precio === 'number' ? r.precio : null;
    return '' +
      '<div class="port-kv-row"><span class="port-fecha">Analizado el ' + escapeHtml(r.fecha || '—') + '</span></div>' +
      '<div class="port-kv"><span class="k">Precio al día del análisis</span><span class="v mono">' + fmtMoney(precio) + '</span></div>' +
      (r.objetivoPonderado ? '<div class="port-kv"><span class="k">Objetivo ponderado</span><span class="v mono">Cons ' + fmtMoney(r.objetivoPonderado.conservador) + ' · Base ' + fmtMoney(r.objetivoPonderado.base) + ' · Opt ' + fmtMoney(r.objetivoPonderado.optimista) + '</span></div>' : '') +
      '<div class="chart-card">' + buildZonesChart(precio, r.zonas, r.objetivoPonderado) + '</div>';
  }

  function researchBlockHtml(entry) {
    var r = entry.research;
    if (!r) return '<div class="port-empty">Sin análisis fundamental guardado. <a href="research.html">Crear uno →</a></div>';
    var excerpt = excerptFromHtml(r.html);
    return '' +
      '<div class="port-kv-row"><span class="port-fecha">' + escapeHtml(r.title || 'Tesis fundamental') + '</span></div>' +
      (excerpt ? '<p class="port-text">' + escapeHtml(excerpt) + '</p>' : '') +
      '<p><a class="port-link" href="research.html?ticker=' + encodeURIComponent(entry.ticker) + '">Ver análisis completo →</a></p>';
  }

  function cardHtml(entry) {
    var logo = (entry.research && entry.research.logo) || logoUrlForTicker(entry.ticker);
    return '' +
      '<article class="port-card">' +
      '  <div class="port-head">' +
      '    <img class="port-logo" src="' + escapeHtml(logo) + '" alt="" onerror="this.hidden=true" loading="lazy">' +
      '    <div><h2>' + escapeHtml(entry.displayTicker) + '</h2><div class="port-empresa">' + escapeHtml(entry.empresa || 'Empresa sin nombre registrado') + '</div></div>' +
      '  </div>' +
      '  <div class="port-grid">' +
      '    <div class="port-block"><h4>Bitácora</h4>' + bitacoraBlockHtml(entry) + '</div>' +
      '    <div class="port-block"><h4>Modelo JMR</h4>' + visorBlockHtml(entry) + '</div>' +
      '    <div class="port-block"><h4>Análisis Fundamental</h4>' + researchBlockHtml(entry) + '</div>' +
      '  </div>' +
      '</article>';
  }

  var ALL = [];
  function render() {
    var q = normalizeText(el('portSearch').value);
    var list = q ? ALL.filter(function (e) { return entrySearchText(e).indexOf(q) >= 0; }) : ALL;
    var holder = el('portList');
    if (!list.length) {
      holder.innerHTML = '<div class="port-empty-state">' + (ALL.length ? 'Ningún ticker coincide con la búsqueda.' : 'No se pudo cargar ninguna fuente de datos todavía.') + '</div>';
    } else {
      holder.innerHTML = list.map(cardHtml).join('');
    }
    el('portStatus').textContent = list.length + ' de ' + ALL.length + ' tickers · combina Mi Bitácora, la Bitácora externa, el Visor y Análisis Fundamental por ticker';
  }

  function boot() {
    el('portSearch').addEventListener('input', render);
    el('portStatus').textContent = 'Cargando ambas bitácoras, Visor y Análisis Fundamental…';
    Promise.all([fetchBitacoraExterna(), fetchBitacoraPropia(), loadJsonFolder('valoraciones'), loadJsonFolder('analisis')]).then(function (r) {
      ALL = buildPortfolio(r[0], r[1], r[2], r[3]);
      render();
    }).catch(function (err) {
      console.error(err);
      el('portStatus').textContent = 'Error al combinar las fuentes: ' + err.message;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
