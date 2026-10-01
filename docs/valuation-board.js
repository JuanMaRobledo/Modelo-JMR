// Tablero de valoración (30-sep-2026) — Visor, Mi Bitácora y Análisis Fundamental.
//
// Criterio Damodaran: el valor intrínseco es el DCF y va primero y destacado.
// Los múltiplos (precio relativo) y el ponderado DCF + múltiplos se pueden ver
// juntos, por método o apagar, y en dos horizontes: hoy (valor presente) y al
// cierre FY+3. La elección se recuerda en este navegador y se aplica a todos
// los tableros de la página.
//
// Uso: JmrValueBoard.html(JmrValueBoard.fromRecord(rec, {precio: 12.3}), {hero: true})
// Los botones funcionan solos (un listener delegado en document).
(function (global) {
  var PREF_KEY = 'jmr-tablero-valor-v1';
  var DEF = { h: 'hoy', mult: 1, met: 1, pond: 1 };
  var K = ['base', 'conservador', 'optimista'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }
  function money(v) { v = num(v); return v == null ? '—' : 'US$' + v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function n2(v) { v = num(v); return v == null ? '—' : v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pct(v, d) { v = num(v); return v == null ? '—' : (v * 100).toFixed(d == null ? 0 : d) + '%'; }
  function trio(t) { if (!t) return null; var o = { conservador: num(t.conservador), base: num(t.base), optimista: num(t.optimista) }; return o.base == null ? null : o; }
  function vsPrecio(v, p) {
    v = num(v); p = num(p);
    if (v == null || p == null || !p) return '<span class="jvb-chip na">—</span>';
    var d = v / p - 1;
    return '<span class="jvb-chip ' + (d >= 0 ? 'pos' : 'neg') + '">' + (d >= 0 ? '+' : '−') + Math.abs(d * 100).toFixed(0) + '%</span>';
  }
  function prefs() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) {}
    return { h: p.h === 'fy3' ? 'fy3' : 'hoy', mult: p.mult === 0 ? 0 : 1, met: p.met === 0 ? 0 : 1, pond: p.pond === 0 ? 0 : 1 };
  }
  function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} }

  // Normaliza las piezas de una valoración (misma forma que guarda el Visor).
  //   dm: descuentoMultiples · vp: valorPresentePonderado · metodosFY3: metodos
  //   objetivoFY3: objetivoPonderado
  function fromParts(o) {
    var dm = o.dm || {}, fy3 = o.metodosFY3 || [];
    var dcfFy3 = null, byName = {}, wSum = 0, wAcc = { conservador: 0, base: 0, optimista: 0 }, pesoDcf = num(dm.pesoDcf), pesoMult = num(dm.pesoMultiplos);
    var pdcf = 0, pmult = 0;
    fy3.forEach(function (m) {
      var name = String(m.nombre || ''), w = Number(m.peso) || 0;
      if (/^DCF/i.test(name)) { dcfFy3 = trio(m); pdcf += w; return; }
      pmult += w;
      byName[name.toUpperCase()] = m;
      if (num(m.base) == null) return;
      wSum += w; K.forEach(function (k) { wAcc[k] += w * (Number(m[k]) || 0); });
    });
    if (pesoDcf == null && fy3.length) { pesoDcf = pdcf; pesoMult = pmult; }
    var multFy3 = wSum ? { conservador: wAcc.conservador / wSum, base: wAcc.base / wSum, optimista: wAcc.optimista / wSum } : null;
    var metodos = (dm.metodos || []).map(function (m) {
      var hoy = { conservador: m.conservador && m.conservador.consolidado, base: m.base && m.base.consolidado, optimista: m.optimista && m.optimista.consolidado };
      var f = byName[String(m.nombre || '').toUpperCase()];
      return { nombre: m.nombre, peso: num(m.peso) != null ? m.peso : (f ? f.peso : null), hoy: trio(hoy), fy3: f ? trio(f) : null };
    });
    if (!metodos.length) fy3.forEach(function (m) {
      if (/^DCF/i.test(String(m.nombre || ''))) return;
      metodos.push({ nombre: m.nombre, peso: m.peso, hoy: null, fy3: trio(m) });
    });
    return {
      precio: num(o.precio), precioLbl: o.precioLbl || 'Precio de referencia', mos: num(o.mos), ke: num(dm.costoPatrimonio),
      dcf: { hoy: trio(dm.dcfHoy), fy3: dcfFy3, peso: pesoDcf },
      mult: { hoy: trio(dm.multiplesHoy), fy3: multFy3, peso: pesoMult },
      metodos: metodos,
      pond: { hoy: trio(dm.ponderadoHoy || o.vp), fy3: trio(o.objetivoFY3) },
      ve: veFrom(o.ve),
      hoja: o.hoja || ''
    };
  }
  // Valor esperado de las historias (sección «Valor con criterio Damodaran»): promedio de 3-4 historias, cada una un
  // DCF completo, ponderado por la probabilidad que asigna el analista.
  function veFrom(v) {
    if (!v || num(v.valor) == null) return null;
    var h = (v.historias || []).filter(function (x) { return num(x.valor) != null && num(x.probabilidad) != null; });
    return { valor: v.valor, fecha: v.fecha || '', historias: h, escenariosUnificados: v.escenariosUnificados === true, historiaCentralId: v.historiaCentralId || 'A' };
  }
  function appliedMultiples(rec) {
    var out = {}, sheets = ((rec.hojas || {}).valoracion || {});
    Object.keys(sheets).forEach(function (name) {
      var rows = String(sheets[name]).match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
      var targets = rows.map(function (row) {
        return (row.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(function (cell) { return cell.replace(/<[^>]*>/g, '').trim(); });
      }).filter(function (cells) { return /^Múltiplo (EV\/|P\/)/i.test(cells[0] || ''); });
      if (targets.length !== 3) return;
      var method = targets[0][0].replace(/^Múltiplo /, '').split(' ')[0].toUpperCase();
      var t = {};
      ['conservador', 'base', 'optimista'].forEach(function (key, i) {
        var values = targets[i].slice(5, 8).map(function (x) { return /^\d[\d.,]*x$/i.test(x) ? Number(x.replace(/x$/i, '').replace(/\./g, '').replace(',', '.')) : null; });
        if (values.length === 3 && values.every(function (v) { return num(v) != null; })) t[key] = values;
      });
      out[method] = t;
    });
    return out;
  }
  function fromRecord(rec, extra) {
    rec = rec || {}; extra = extra || {};
    var result = fromParts({ dm: rec.descuentoMultiples, vp: rec.valorPresentePonderado, metodosFY3: rec.metodos, objetivoFY3: rec.objetivoPonderado,
      precio: extra.precio != null ? extra.precio : rec.precio, precioLbl: extra.precioLbl, mos: extra.mos != null ? extra.mos : rec.mos, hoja: rec.hojaGoogle,
      ve: rec.valorEsperado });
    var applied = appliedMultiples(rec);
    result.metodos.forEach(function (m) { m.aplicados = applied[String(m.nombre).toUpperCase()] || null; });
    return result;
  }
  // Bloque del valor esperado, junto al DCF. d = resultado de fromParts/fromRecord.
  function unified(d) { return !!(d && d.ve && d.ve.escenariosUnificados && d.ve.historias.length); }
  function centralStory(d) { return d.ve.historias.find(function(h) { return h.id === d.ve.historiaCentralId; }) || {}; }
  function storyName(h) {
    var label = { A: 'Base', B: 'Conservadora', C: 'Disrupción · Deterioro de los fundamentales', D: 'Optimista' }[h.id];
    var title = String(h.nombre || '').replace(/^[A-D]\s*·\s*/, '').replace(/^Tesis de disrupción\s*·\s*Deterioro de los fundamentales:?\s*/i, '');
    if (label && title.indexOf(label + ' · ') === 0) return title;
    return label ? label + (title && title !== label ? ' · ' + title : '') : title;
  }
  // Present base and expected separately; never infer missing story probabilities.
  function primaryValues(d) {
    var base = unified(d) ? num(centralStory(d).valor) : num(d.dcf.hoy && d.dcf.hoy.base);
    return { base: base, esperado: d.ve ? num(d.ve.valor) : null };
  }
  function primaryHtml(d) {
    var v = primaryValues(d);
    function tile(label, value, detail, main) {
      return '<div class="jvb-primary-card' + (main ? ' principal' : ' complementary') + '"><span class="jvb-kicker">' + label + '</span><div class="jvb-big"><span class="v">' + money(value) + '</span>' + vsPrecio(value, d.precio) + '</div><span class="vl">' + detail + '</span></div>';
    }
    return '<div class="jvb-primary">' + tile('DCF base hoy', v.base, unified(d) ? 'Valor intrínseco principal · tesis base' : 'Valor intrínseco principal · caso base', true) + tile('DCF esperado hoy · complemento', v.esperado, v.esperado == null ? 'Sin historias valoradas disponibles' : 'Promedio de DCF × probabilidad') + '</div>';
  }
  function storiesTable(d) {
    return '<div class="jvb-tw"><table class="jvb-vetab"><thead><tr><th>Escenario / historia</th><th>Prob.</th><th>Crec. 5 años</th><th>Margen</th><th>DCF hoy</th><th>vs. precio</th></tr></thead><tbody>' + d.ve.historias.map(function(h) {
      return '<tr><td class="hn"><b>' + esc(storyName(h)) + '</b>' + (h.id === d.ve.historiaCentralId ? '<small>Historia central</small>' : '') + '<small>ROIC terminal: ' + (h.roicTerminal === 'costo_capital' ? 'costo de capital' : pct(h.roicTerminal, 1)) + '</small>' + (typeof h.terminalGrowth === 'number' ? '<small>Crecimiento terminal: ' + pct(h.terminalGrowth, 2) + '</small>' : '') + '</td><td class="n">' + pct(h.probabilidad) + '</td><td class="n">' + pct(h.crecimiento, 1) + '</td><td class="n">' + pct(h.margen) + '</td><td class="n">' + n2(h.valor) + '</td><td class="n">' + vsPrecio(h.valor, d.precio) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function unifiedHtml(d) {
    var h = centralStory(d), values = d.ve.historias.map(function(x) { return x.valor; });
    return '<div class="jvb-ve">' + primaryHtml(d) + '<div class="jvb-scen"><span>Rango <b>' + money(Math.min.apply(null, values)) + ' – ' + money(Math.max.apply(null, values)) + '</b></span>' + (d.mos != null ? '<span>MOS ' + pct(d.mos) + ' <b>' + money(d.ve.valor * (1-d.mos)) + '</b></span>' : '') + '</div>'  + storiesTable(d) + '<p class="jvb-venote">Cada historia se valora con un DCF completo. El valor esperado suma DCF × probabilidad; las probabilidades son juicio del analista. El MOS se aplica al esperado. El rango muestra desenlaces, no un intervalo de confianza.</p><details class="jvb-vedet"><summary>Referencia técnica de la hoja anterior</summary><p class="jvb-venote">Antiguo caso Base ' + money(d.dcf.hoy && d.dcf.hoy.base) + '. Se conserva para calibrar el motor y los supuestos auxiliares de múltiplos; no representa la tesis Base.</p></details></div>';
  }
  function veHtml(d) {
    var ve = d && d.ve;
    if (!ve) return '';
    if (unified(d)) return unifiedHtml(d);
    var dcf = d.dcf && d.dcf.hoy ? d.dcf.hoy.base : null;
    var letras = ve.historias.map(function (h) { return storyName(h).split(' · ')[0]; });
    var bar = ve.historias.map(function (h, i) {
      var cls = (num(d.precio) != null && h.valor < d.precio) ? 'lo' : 'hi';
      return '<span class="' + cls + '" style="flex:' + (h.probabilidad * 100).toFixed(1) + '" title="' + esc(storyName(h)) + ': ' + pct(h.probabilidad) + ' · ' + money(h.valor) + '">' +
        esc(letras[i]) + ' ' + pct(h.probabilidad) + '</span>';
    }).join('');
    var rows = ve.historias.map(function (h) {
      var nom = storyName(h), i = nom.indexOf(' · ');
      return '<tr><td class="hn"><b>' + esc(i > 0 ? nom.slice(0, i) : nom) + '</b>' + (i > 0 ? ' ' + esc(nom.slice(i + 3)) : '') +
        (h.roicTerminal === 'costo_capital' ? '<small>ROIC después del año 10 = costo de capital</small>' : '') + '</td>' +
        '<td class="n">' + pct(h.probabilidad) + '</td><td class="n">' + n2(h.valor) + '</td><td class="n">' + vsPrecio(h.valor, d.precio) + '</td></tr>';
    }).join('');
    var mos = d.mos != null ? '<span class="jvb-vemos">Precio con MOS (' + pct(d.mos) + ') sobre el valor esperado <b>' + money(ve.valor * (1 - d.mos)) + '</b>' + vsPrecio(ve.valor * (1 - d.mos), d.precio) + '</span>' : '';
    var vsDcf = dcf ? '<span>Frente al DCF Base <b>' + (ve.valor >= dcf ? '+' : '−') + Math.abs((ve.valor / dcf - 1) * 100).toFixed(0) + '%</b></span>' : '';
    return '<div class="jvb-ve">' +
      '<div class="jvb-vebar" aria-hidden="true">' + bar + '</div>' +
      '<details class="jvb-vedet"><summary>Ver historias</summary><table class="jvb-vetab"><thead><tr><th>Historia</th><th>Prob.</th><th>US$/acción</th><th>vs. precio</th></tr></thead><tbody>' +
      rows + '</tbody></table></details>' +
      '<div class="jvb-meta">' + vsDcf + mos + '</div>' +
      '<p class="jvb-venote">El DCF base y el valor esperado son lecturas distintas; el valor esperado promedia todas las historias (cada una un DCF completo) según la probabilidad que les asigna el análisis. El margen de seguridad se aplica sobre el valor esperado' +
      (ve.fecha ? ' (análisis del ' + esc(ve.fecha) + ')' : '') + '. Las probabilidades son juicio del analista.</p></div>';
  }
  function hasData(d) { return !!(d && (d.dcf.hoy || d.dcf.fy3)); }

  // Filas del tablero para un horizonte.
  function rowsFor(d, h) {
    var r = [];
    if (!unified(d)) r.push({ g: 'dcf', cls: 'dcf', label: h === 'hoy' ? 'DCF · valor intrínseco hoy' : 'DCF llevado a FY+3', sub: h === 'hoy' ? 'flujos de caja descontados' : '× (1 + Ke)³', peso: d.dcf.peso, t: d.dcf[h] });
    d.metodos.forEach(function (m) { r.push({ g: 'met', cls: 'met', label: m.nombre, peso: m.peso, t: m[h], aplicados: m.aplicados }); });
    r.push({ g: 'mult', cls: 'mult', label: 'Múltiplos consolidados', sub: h === 'hoy' ? 'promedio de 1, 2 y 3 años, traído a hoy' : 'precio FY+3 + dividendos', peso: d.mult.peso, t: d.mult[h] });
    r.push({ g: 'pond', cls: 'pond', label: unified(d) ? 'Mezcla auxiliar de la hoja anterior' : 'Ponderado DCF + múltiplos', sub: unified(d) ? 'no utiliza los DCF de las cuatro historias' : 'pesos del tipo de empresa', peso: (num(d.dcf.peso) != null && num(d.mult.peso) != null) ? d.dcf.peso + d.mult.peso : null, t: d.pond[h] });
    return r.filter(function (x) { return x.t; });
  }

  function tableHtml(d, h) {
    var rows = rowsFor(d, h), group = null, out = '';
    var heads = { dcf: ['Valor intrínseco', 'DCF de Damodaran — el valor que manda'], mult: ['Secundario', 'Múltiplos · precio relativo'], met: null, pond: ['Secundario', 'Ponderado · mezcla opcional'] };
    rows.forEach(function (x) {
      var g = x.g === 'met' ? 'mult' : x.g;
      if (g !== group) {
        group = g;
        var hd = heads[g];
        out += '<tr class="jvb-grp g-' + g + '"><td colspan="6"><span class="jvb-tag ' + (g === 'dcf' ? 'main' : '') + '">' + hd[0] + '</span>' + esc(hd[1]) + '</td></tr>';
      }
      out += '<tr class="jvb-row ' + x.cls + '" data-g="' + x.g + '"><td class="lbl"><span class="nm">' + esc(x.label) + '</span>' +
        (x.sub ? '<span class="sb">' + esc(x.sub) + '</span>' : '') + '<span class="pw">peso ' + pct(x.peso) + '</span></td>' +
        '<td class="n w">' + pct(x.peso) + '</td>' +
        K.map(function (k) { return '<td class="n' + (k === 'base' ? ' b' : '') + '">' + n2(x.t[k]) + (x.g === 'met' ? '<span class="jvb-applied">' + (x.aplicados && x.aplicados[k] ? 'Múltiplo FY+1–3: ' + (x.aplicados[k].every(function(v) { return v === x.aplicados[k][0]; }) ? n2(x.aplicados[k][0]) + '×' : x.aplicados[k].map(function(v,i) { return 'FY+' + (i+1) + ': ' + n2(v) + '×'; }).join(' · ')) : 'Múltiplo aplicado: no disponible') + '</span>' : '') + (k === 'base' ? '<span class="vsm">' + vsPrecio(x.t.base, d.precio) + '</span>' : '') + '</td>'; }).join('') +
        '<td class="n vs">' + vsPrecio(x.t.base, d.precio) + '</td></tr>';
    });
    return '<div class="jvb-tw"><table class="jvb-table"><thead><tr><th>Método <small>US$ por acción</small></th><th class="n w">Peso</th><th class="n b">Base</th><th class="n">Conservadora</th><th class="n">Optimista</th><th class="n vs">Base vs. precio</th></tr></thead><tbody>' + out + '</tbody></table></div>';
  }

  // Rango Conservador–Optimista de cada fila frente al precio («football field»).
  function rangeHtml(d, h) {
    var rows = rowsFor(d, h);
    if (!rows.length) return '';
    var vals = [];
    rows.forEach(function (x) { K.forEach(function (k) { if (num(x.t[k]) != null) vals.push(x.t[k]); }); });
    if (d.precio != null) vals.push(d.precio);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.1 || 1;
    lo = Math.max(0, lo - pad); hi = hi + pad;
    var x = function (v) { return ((v - lo) / (hi - lo) * 100).toFixed(2) + '%'; };
    var pos = d.precio != null ? x(d.precio) : null;
    var body = rows.map(function (r) {
      var a = num(r.t.conservador), b = num(r.t.optimista), m = num(r.t.base);
      var mn = Math.min(a == null ? m : a, b == null ? m : b), mx = Math.max(a == null ? m : a, b == null ? m : b);
      return '<div class="jvb-rr ' + r.cls + '" data-g="' + r.g + '"><span class="rl">' + esc(r.label) + '</span><span class="rt">' +
        '<span class="rb" style="left:' + x(mn) + ';width:calc(' + x(mx) + ' - ' + x(mn) + ')" title="' + esc(r.label) + ': ' + money(mn) + ' – ' + money(mx) + '"></span>' +
        '<span class="rd" style="left:' + x(m) + '" title="Base ' + money(m) + '"></span>' +
        (pos ? '<span class="rp" style="left:' + pos + '"></span>' : '') + '</span><span class="rv">' + money(m) + '</span></div>';
    }).join('');
    var axis = pos ? '<div class="jvb-rr axis"><span class="rl"></span><span class="rt"><span class="rpl" style="left:' + pos + '">' + esc(d.precioLbl) + ' ' + money(d.precio) + '</span></span><span class="rv"></span></div>' : '';
    return '<div class="jvb-range"><p class="jvb-h4">Rango de cada lectura frente al precio <small>barra = conservador a optimista · punto = base</small></p>' + axis + body + '</div>';
  }

  function heroHtml(d) {
    if (unified(d)) return '<div class="jvb-main">' + unifiedHtml(d) + '</div>';
    var t = d.dcf.hoy || d.dcf.fy3, hoy = !!d.dcf.hoy;
    if (!t) return '';
    // Con valor esperado, el MOS se aplica sobre él (bloque de abajo); sin historias, sobre el DCF.
    var mos = d.mos != null && d.dcf.hoy && !d.ve ? '<span>Precio con MOS (' + pct(d.mos) + ') sobre el DCF <b>' + money(d.dcf.hoy.base * (1 - d.mos)) + '</b></span>' : '';
    var fy3 = d.dcf.fy3 && hoy ? '<span>DCF llevado a FY+3 <b>' + money(d.dcf.fy3.base) + '</b></span>' : '';
    var side = [['Múltiplos hoy', 'precio relativo', d.mult.hoy], ['Ponderado hoy', 'DCF + múltiplos', d.pond.hoy]].filter(function (s) { return s[2]; }).map(function (s) {
      return '<div class="jvb-mini"><span class="k">' + s[0] + ' <em>' + s[1] + '</em></span><b>' + money(s[2].base) + '</b>' + vsPrecio(s[2].base, d.precio) + '</div>';
    }).join('');
    return '<div class="jvb-hero"><div class="jvb-main">' + (hoy ? primaryHtml(d) : '<span class="jvb-kicker">DCF llevado a FY+3</span><div class="jvb-big"><span class="v">' + money(t.base) + '</span></div>') +
      '<div class="jvb-scen"><span>Conservador <b>' + money(t.conservador) + '</b></span><span>Base <b>' + money(t.base) + '</b></span><span>Optimista <b>' + money(t.optimista) + '</b></span></div>' +
      ((mos || fy3) ? '<div class="jvb-meta">' + mos + fy3 + '</div>' : '') + (d.ve && hoy ? veHtml(d) : '') + '</div>' +
      (side ? '<div class="jvb-side"><span class="jvb-sidet">Lecturas secundarias</span>' + side + '</div>' : '') + '</div>';
  }

  function html(d, opts) {
    opts = opts || {};
    if (!hasData(d)) return '';
    var p = prefs(), both = !!(d.dcf.hoy && d.dcf.fy3);
    if (!both) p.h = d.dcf.hoy ? 'hoy' : 'fy3';
    var seg = function (attr, val, label, on) { return '<button type="button" data-jvb-' + attr + '="' + val + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + label + '</button>'; };
    var bar = '<div class="jvb-bar">' +
      (both ? '<div class="jvb-seg" role="group" aria-label="Horizonte">' + seg('h', 'hoy', 'Hoy', p.h === 'hoy') + seg('h', 'fy3', 'Al cierre FY+3', p.h === 'fy3') + '</div>' : '') +
      '<div class="jvb-seg jvb-toggles" role="group" aria-label="Lecturas secundarias"><span class="jvb-segl">Mostrar</span>' +
      seg('t', 'mult', 'Múltiplos juntos', p.mult) + seg('t', 'met', 'Por método', p.met) + seg('t', 'pond', 'Ponderado', p.pond) + '</div></div>';
    var note = (unified(d) ? 'Los casos Conservador/Base/Optimista de los múltiplos son supuestos auxiliares de precio relativo; los cuatro escenarios DCF activos son Base, Conservadora, Disrupción y Optimista. ' : '') + 'US$ por acción. ' + (d.ke != null ? 'Costo del patrimonio (Ke) ' + pct(d.ke, 1) + '. ' : '') +
      'Hoy: el DCF ya está a valor presente; cada múltiplo es el precio a FY+1, FY+2 y FY+3 más dividendos, traído a hoy con Ke y promediado. ' +
      'FY+3: el DCF de hoy × (1 + Ke)³ y los múltiplos al cierre FY+3 con dividendos. El ponderado es opcional: sirve de contraste, no reemplaza al DCF.';
    return '<section class="jvb" data-h="' + p.h + '" data-mult="' + p.mult + '" data-met="' + p.met + '" data-pond="' + p.pond + '">' +
      (opts.hero === false ? (unified(d) ? unifiedHtml(d) : '') : heroHtml(d)) + bar +
      '<div class="jvb-hz" data-hz="hoy">' + (d.dcf.hoy ? tableHtml(d, 'hoy') + rangeHtml(d, 'hoy') : '') + '</div>' +
      '<div class="jvb-hz" data-hz="fy3">' + (d.dcf.fy3 ? tableHtml(d, 'fy3') + rangeHtml(d, 'fy3') : '') + '</div>' +
      '<p class="jvb-note">' + esc(note) + (d.hoja && opts.hoja !== false ? ' <a href="' + esc(d.hoja) + '" target="_blank" rel="noopener noreferrer">Abrir hoja con fórmulas →</a>' : '') + '</p></section>';
  }

  function apply(p) {
    document.querySelectorAll('.jvb').forEach(function (s) {
      var hasFy3 = !!s.querySelector('.jvb-hz[data-hz="fy3"] table'), hasHoy = !!s.querySelector('.jvb-hz[data-hz="hoy"] table');
      s.dataset.h = (p.h === 'fy3' && hasFy3) || !hasHoy ? 'fy3' : 'hoy';
      ['mult', 'met', 'pond'].forEach(function (k) { s.dataset[k] = String(p[k]); });
      s.querySelectorAll('[data-jvb-h]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.jvbH === s.dataset.h)); });
      s.querySelectorAll('[data-jvb-t]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!p[b.dataset.jvbT])); });
    });
  }
  if (global.document) document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-jvb-h],[data-jvb-t]');
    if (!b || !b.closest('.jvb')) return;
    e.preventDefault();
    var p = prefs();
    if (b.dataset.jvbH) p.h = b.dataset.jvbH;
    else p[b.dataset.jvbT] = p[b.dataset.jvbT] ? 0 : 1;
    savePrefs(p); apply(p);
  });

  if (global.document && !document.getElementById('jvb-css')) {
    var st = document.createElement('style'); st.id = 'jvb-css';
    st.textContent = [
      '.jvb{--jvb-dcf:var(--accent);--jvb-mult:color-mix(in oklab,var(--ink-soft,#5b6474) 70%,var(--surface,#fff));--jvb-met:color-mix(in oklab,var(--ink-soft,#5b6474) 38%,var(--surface,#fff));--jvb-pond:color-mix(in oklab,#b7791f 75%,var(--surface,#fff));margin:0 0 18px;font-variant-numeric:tabular-nums}',
      '.jvb *{box-sizing:border-box}',
      '.jvb p{text-align:left}',
      '.jvb .jvb-table{display:table;table-layout:auto;max-width:none;margin:0;overflow:visible}',
      '.jvb .jvb-table th,.jvb .jvb-table td{border:0;white-space:nowrap;overflow-wrap:normal;vertical-align:middle;line-height:1.35}',
      '.jvb .jvb-table th *,.jvb .jvb-table td *{white-space:nowrap}',
      '.jvb .jvb-table td.lbl,.jvb .jvb-table td.lbl *,.jvb .jvb-grp td,.jvb .jvb-grp td *{white-space:normal}',
      '.jvb .jvb-table td *,.jvb .jvb-table th *{overflow-wrap:normal;word-break:normal;hyphens:manual;max-width:none}',
      '.jvb .jvb-table td,.jvb .jvb-table th{font-size:13px}.jvb .jvb-table thead th{font-size:10.5px}',
      '.jvb-primary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px}.jvb-primary-card{border:1.5px solid var(--jvb-dcf,var(--accent,#806332));background:var(--surface,#fffaf0);border-radius:12px;padding:16px;min-width:0}.jvb-primary-card .vl{font-size:12px;color:var(--ink-soft)}@media(max-width:520px){.jvb-primary{grid-template-columns:1fr}}',
      '.jvb-primary{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}.jvb-primary-card.principal{background:var(--accent-soft,#f1e9dc);border-width:2px}.jvb-primary-card.complementary{border-color:var(--border-soft,#ddd)}.jvb-primary-card.complementary .v{font-size:24px}.jvb-applied{display:block;font-size:10px;font-weight:400;color:var(--ink-soft);margin-top:5px}@media(max-width:520px){.jvb-primary{grid-template-columns:1fr}}',
      '.jvb-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;margin-bottom:12px}',
      '.jvb-main{border:1.5px solid var(--jvb-dcf);background:var(--accent-soft,rgba(79,70,229,.06));border-radius:14px;padding:16px 18px;min-width:0}',
      '.jvb-kicker{display:block;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--accent-ink,var(--accent))}',
      '.jvb-big{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px 10px;margin:6px 0 10px}',
      '.jvb-big .v{font:700 34px/1.05 "IBM Plex Mono",ui-monospace,monospace;color:var(--ink)}',
      '.jvb-big .vl{font-size:12px;color:var(--ink-soft)}',
      '.jvb-scen{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--ink-soft)}',
      '.jvb-scen b{font-family:"IBM Plex Mono",ui-monospace,monospace;color:var(--ink);font-weight:600}',
      '.jvb-meta{display:flex;flex-wrap:wrap;gap:4px 18px;margin-top:10px;padding-top:10px;border-top:1px dashed color-mix(in oklab,var(--jvb-dcf) 35%,transparent);font-size:12px;color:var(--ink-soft)}',
      '.jvb-meta b{font-family:"IBM Plex Mono",ui-monospace,monospace;color:var(--ink)}',
      '.jvb-side{border:1px solid var(--border-soft);background:var(--surface);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.jvb-sidet{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-faint)}',
      '.jvb-mini{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--surface-2)}',
      '.jvb-mini .k{font-size:12.5px;color:var(--ink);font-weight:600}.jvb-mini .k em{display:block;font-style:normal;font-weight:400;font-size:11px;color:var(--ink-faint)}',
      '.jvb-mini b{font:600 15px "IBM Plex Mono",ui-monospace,monospace;color:var(--ink-soft)}',
      '.jvb-chip{display:inline-block;padding:2px 8px;border-radius:999px;font:700 11.5px/1.5 "IBM Plex Mono",ui-monospace,monospace;white-space:nowrap}',
      '.jvb-chip.pos{background:var(--positive-soft,rgba(16,185,129,.12));color:var(--positive)}.jvb-chip.neg{background:var(--negative-soft,rgba(239,68,68,.12));color:var(--negative)}.jvb-chip.na{background:var(--surface-2);color:var(--ink-faint)}',
      '.jvb-bar{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 12px;margin:6px 0 10px}',
      '.jvb-seg{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;padding:3px;border:1px solid var(--border-soft);border-radius:10px;background:var(--surface-2)}',
      '.jvb-segl{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);padding:0 6px}',
      '.jvb-seg button{font:600 12.5px "Public Sans",system-ui,sans-serif;border:0;border-radius:7px;padding:6px 11px;background:transparent;color:var(--ink-soft);cursor:pointer}',
      '.jvb-seg button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08),0 0 0 1px var(--border-soft)}',
      '.jvb-toggles button[aria-pressed="true"]::before{content:"✓ ";color:var(--accent)}',
      '.jvb-seg button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}',
      '.jvb-hz{display:none}.jvb[data-h="hoy"] .jvb-hz[data-hz="hoy"],.jvb[data-h="fy3"] .jvb-hz[data-hz="fy3"]{display:block}',
      '.jvb[data-mult="0"] [data-g="mult"],.jvb[data-met="0"] [data-g="met"],.jvb[data-pond="0"] [data-g="pond"],.jvb[data-pond="0"] .jvb-grp.g-pond{display:none}',
      '.jvb[data-mult="0"][data-met="0"] .jvb-grp.g-mult{display:none}',
      '.jvb-tw{border:1px solid var(--border-soft);border-radius:14px;overflow:auto;background:var(--surface);box-shadow:var(--shadow,0 1px 2px rgba(0,0,0,.04))}',
      '.jvb .jvb-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13px;min-width:0}',
      '.jvb .jvb-table thead th{position:sticky;top:0;background:var(--surface-2);color:var(--ink-faint);font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-align:left;padding:10px 14px;border-bottom:1px solid var(--border-soft);white-space:nowrap}',
      '.jvb .jvb-table th.n,.jvb .jvb-table td.n{text-align:right}',
      '.jvb .jvb-table td{padding:10px 14px;border-bottom:1px solid color-mix(in oklab,var(--border-soft) 70%,transparent);vertical-align:middle}',
      '.jvb .jvb-table td.n{font-family:"IBM Plex Mono",ui-monospace,monospace;white-space:nowrap;color:var(--ink-soft)}',
      '.jvb .jvb-table td.n.b{color:var(--ink);font-weight:600}',
      '.jvb .jvb-table tbody tr:last-child td{border-bottom:0}',
      '.jvb .jvb-grp td{background:transparent;padding:14px 14px 6px;font-size:12px;font-weight:700;color:var(--ink);border-bottom:0}',
      '.jvb-tag{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:6px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;background:var(--surface-2);color:var(--ink-faint);border:1px solid var(--border-soft)}',
      '.jvb-tag.main{background:var(--jvb-dcf);color:#fff;border-color:transparent}',
      '.jvb .jvb-row td.lbl{position:relative;padding-left:20px}',
      '.jvb .jvb-row td.lbl::before{content:"";position:absolute;left:8px;top:10px;bottom:10px;width:4px;border-radius:4px;background:var(--jvb-met)}',
      '.jvb .jvb-row.dcf td.lbl::before{background:var(--jvb-dcf)}.jvb-row.mult td.lbl::before{background:var(--jvb-mult)}.jvb-row.pond td.lbl::before{background:var(--jvb-pond)}',
      '.jvb .jvb-row .nm{display:block;font-weight:600;color:var(--ink)}.jvb-row .sb{display:block;font-size:11px;color:var(--ink-faint);margin-top:1px}.jvb-row .pw{display:none;font-size:11px;color:var(--ink-faint)}',
      '.jvb .jvb-row.dcf td{background:var(--accent-soft,rgba(79,70,229,.06))}.jvb-row.dcf .nm{font-size:14px}.jvb-row.dcf td.n.b{color:var(--accent-ink,var(--accent));font-size:15px;font-weight:700}',
      '.jvb .jvb-row.met .nm{font-weight:500;color:var(--ink-soft);padding-left:12px}',
      '.jvb .jvb-row.met td.n.b{color:var(--ink-soft);font-weight:500}',
      '.jvb .jvb-table thead th small{font-weight:400;text-transform:none;letter-spacing:0;margin-left:4px}',
      '.jvb .jvb-table .vsm{display:none}',
      '.jvb .jvb-row:hover td{background:color-mix(in oklab,var(--surface-2) 70%,transparent)}.jvb-row.dcf:hover td{background:var(--accent-soft)}',
      '.jvb-range{margin:14px 0 0;border:1px solid var(--border-soft);border-radius:14px;padding:12px 14px 10px;background:var(--surface)}',
      '.jvb-h4{margin:0 0 8px;font-size:12px;font-weight:700;color:var(--ink)}.jvb-h4 small{font-weight:400;color:var(--ink-faint);margin-left:6px}',
      '.jvb-rr{display:grid;grid-template-columns:minmax(90px,170px) minmax(0,1fr) 88px;align-items:center;gap:10px;min-height:24px}',
      '.jvb-rr .rl{font-size:12px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jvb-rr.dcf .rl{color:var(--ink);font-weight:700}',
      '.jvb-rr .rt{position:relative;height:22px}',
      '.jvb-rr .rt::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--border-soft)}',
      '.jvb-rr .rb{position:absolute;top:6px;height:10px;border-radius:6px;background:var(--jvb-met);min-width:3px}',
      '.jvb-rr.dcf .rb{background:var(--jvb-dcf);top:4px;height:14px}.jvb-rr.mult .rb{background:var(--jvb-mult)}.jvb-rr.pond .rb{background:var(--jvb-pond)}',
      '.jvb-rr .rd{position:absolute;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--surface);border:2px solid var(--ink)}',
      '.jvb-rr .rp{position:absolute;top:-3px;bottom:-3px;width:0;border-left:2px dashed var(--negative)}',
      '.jvb-rr .rv{font:600 12px "IBM Plex Mono",ui-monospace,monospace;text-align:right;color:var(--ink-soft)}.jvb-rr.dcf .rv{color:var(--ink)}',
      '.jvb-rr.axis .rt{height:18px}.jvb-rr.axis .rt::before{display:none}',
      '.jvb-rr .rpl{position:absolute;top:0;transform:translateX(-50%);font:700 11px "IBM Plex Mono",ui-monospace,monospace;color:var(--negative);white-space:nowrap}',
      '.jvb-note{font-size:11.5px;line-height:1.5;color:var(--ink-faint);margin:10px 2px 0}',
      '.jvb-vebox{--jvb-dcf:var(--accent);font-variant-numeric:tabular-nums;margin-top:12px}',
      '.jvb-ve{margin-top:14px;padding-top:14px;border-top:1.5px solid color-mix(in oklab,var(--jvb-dcf) 30%,transparent)}',
      '.jvb-vebox .jvb-ve{margin-top:0;padding:14px 16px;border:1px solid var(--border-soft);border-radius:14px;background:var(--surface)}',
      '.jvb-vebar{display:flex;gap:2px;height:22px;border-radius:7px;overflow:hidden;margin:2px 0 8px}',
      '.jvb-vebar span{display:flex;align-items:center;justify-content:center;min-width:0;overflow:hidden;white-space:nowrap;font:700 10.5px "IBM Plex Mono",ui-monospace,monospace}',
      '.jvb-vebar .hi{background:var(--positive-soft,rgba(16,185,129,.16));color:var(--positive)}.jvb-vebar .lo{background:var(--negative-soft,rgba(239,68,68,.14));color:var(--negative)}',
      '.jvb-vedet summary{cursor:pointer;font-size:12.5px;font-weight:600;color:var(--accent-ink,var(--accent))}',
      '.jvb-vetab{min-width:560px;width:100%;border-collapse:collapse;margin-top:8px;font-size:12.5px}',
      '.jvb-vetab th{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);text-align:right;padding:5px 6px;border-bottom:1px solid var(--border-soft)}.jvb-vetab th:first-child{text-align:left}',
      '.jvb-vetab td{padding:6px;border-bottom:1px solid var(--border-soft);vertical-align:top}.jvb-vetab td.n{text-align:right;white-space:nowrap;font-family:"IBM Plex Mono",ui-monospace,monospace}',
      '.jvb-vetab td.hn{color:var(--ink-soft);line-height:1.35}.jvb-vetab td.hn b{color:var(--ink)}.jvb-vetab td.hn small{display:block;font-size:10.5px;color:var(--ink-faint)}',
      '.jvb-venote{font-size:11px;line-height:1.45;color:var(--ink-faint);margin:8px 0 0}',
      '.jvb-vemos{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:600;color:var(--ink)}',
      '@media (max-width:760px){.jvb-hero{grid-template-columns:1fr}.jvb-big .v{font-size:28px}}',
      '@media (max-width:560px){.jvb .jvb-table td{font-size:12px}.jvb .jvb-table th,.jvb .jvb-table td{padding:8px 6px}.jvb .jvb-table td.n{font-size:11.5px}.jvb .jvb-grp td{font-size:11.5px}.jvb .jvb-row td.lbl{padding-left:15px}.jvb .jvb-row.met .nm{padding-left:4px}.jvb .jvb-row td.lbl::before{left:5px}',
      '.jvb .jvb-table .w,.jvb .jvb-table .vs{display:none}.jvb .jvb-table .vsm{display:block;margin-top:3px}.jvb .jvb-table .vsm .jvb-chip{font-size:10.5px;padding:1px 6px}.jvb .jvb-table thead th small{display:none}.jvb .jvb-row .pw{display:block}.jvb .jvb-row .sb{display:none}.jvb .jvb-table thead th{font-size:9.5px;letter-spacing:.03em}',
      '.jvb-vebar span{font-size:9px;letter-spacing:-.02em}.jvb-vetab{font-size:12px}.jvb-rr{grid-template-columns:78px minmax(0,1fr) 70px;gap:6px}.jvb-rr .rl{font-size:11px}.jvb-seg button{padding:6px 8px;font-size:12px}.jvb-rr .rpl{font-size:10px}}',
      '@media (max-width:420px){.jvb .jvb-table th,.jvb .jvb-table td{padding:7px 4px}.jvb .jvb-table td.n{font-size:11px}.jvb .jvb-row td.lbl{padding-left:12px}.jvb .jvb-row td.lbl::before{left:3px}.jvb .jvb-row .nm{font-size:12px}.jvb .jvb-row.dcf .nm{font-size:12.5px}.jvb .jvb-row.dcf td.n.b{font-size:13px}.jvb .jvb-table thead th{font-size:9px}}',
      '@media print{.jvb-bar{display:none}.jvb-hz{display:block!important}.jvb-hz[data-hz="fy3"]{margin-top:10px}.jvb-tw,.jvb-range{box-shadow:none}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  global.JmrValueBoard = { fromParts: fromParts, fromRecord: fromRecord, html: html, hasData: hasData, veHtml: veHtml,
    primaryValues: primaryValues, primaryHtml: primaryHtml, veBox: function (d) { var h = unified(d) ? unifiedHtml(d) : primaryHtml(d) + veHtml(d); return h ? '<div class="jvb-vebox">' + h + '</div>' : ''; },
    apply: function () { apply(prefs()); } };
})(window);

