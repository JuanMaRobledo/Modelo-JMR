(function () {
  'use strict';

  var LOCAL_KEY = 'jmr-research-library-v1';
  var PROMPT_KEY = 'jmr-research-prompt-v1';
  var GH_TOKEN_KEY = 'jmr-gh-datastore-token';
  var GH_REPO_API = 'https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/';
  var GH_API = GH_REPO_API + 'contents/';
  var REQUIRED = [
    'Resumen ejecutivo', 'Modelo de negocio', 'Industria y crecimiento',
    'Calidad del negocio', 'Ventaja competitiva', 'Competencia',
    'Gestión y asignación de capital', 'Catalizadores', 'Riesgos',
    'Bulls say / Bears say', 'Warren Buffett', 'Charlie Munger',
    'Peter Lynch', 'Howard Marks', 'Joel Greenblatt',
    'Noticias y eventos recientes', 'Fuentes'
  ];
  var state = freshState();

  function freshState() {
    return { id: '', title: '', ticker: '', company: '', date: new Date().toISOString().slice(0, 10), logo: '', price: null, priceFetchedAt: '', html: '', sourceName: '', valuationHtml: '', linkedValuation: null, news: '', remotePath: '', remoteSha: '' };
  }
  function el(id) { return document.getElementById(id); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function safeHtml(html) {
    if (typeof DOMPurify === 'undefined') return escapeHtml(html);
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','p','br','strong','b','em','i','ul','ol','li','blockquote','table','thead','tbody','tr','th','td','a','img','hr','code','pre'],
      ALLOWED_ATTR: ['href','src','alt','title','colspan','rowspan','target','rel']
    });
  }
  function normalizeText(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function setStatus(id, text, kind) {
    var node = el(id); if (!node) return;
    node.textContent = text || '';
    node.className = 'status' + (kind ? ' ' + kind : '');
  }
  function switchTab(name) {
    document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.dataset.panel === name); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });

  var savedTheme = 'system';
  try { savedTheme = localStorage.getItem('bitacora-theme') || 'system'; } catch (e) {}
  function applyTheme() {
    if (savedTheme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', savedTheme);
    el('themeToggle').textContent = 'Tema: ' + ({system:'sistema',light:'claro',dark:'oscuro'}[savedTheme]);
  }
  el('themeToggle').addEventListener('click', function () {
    savedTheme = savedTheme === 'system' ? 'light' : savedTheme === 'light' ? 'dark' : 'system';
    try { localStorage.setItem('bitacora-theme', savedTheme); } catch (e) {}
    applyTheme();
  });
  applyTheme();

  function parseFrontMatter(md) {
    var meta = {};
    var match = String(md || '').match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) return { meta: meta, body: md };
    match[1].split(/\r?\n/).forEach(function (line) {
      var m = line.match(/^([A-Za-z_][\w-]*):\s*["']?(.*?)["']?\s*$/);
      if (m) meta[m[1].toLowerCase()] = m[2];
    });
    return { meta: meta, body: md.slice(match[0].length) };
  }
  function applyMetadata(meta) {
    if (!meta) return;
    if (meta.ticker) el('tickerInput').value = meta.ticker;
    if (meta.company) el('companyInput').value = meta.company;
    if (meta.title) el('titleInput').value = meta.title;
    if (meta.analysis_date && /^\d{4}-\d{2}-\d{2}$/.test(meta.analysis_date)) el('dateInput').value = meta.analysis_date;
    syncFields();
  }
  function textToHtml(text) {
    var known = REQUIRED.concat(['Segmentos y geografía','Filosofías de inversión','Qué vigilar','Preguntas abiertas','Control de calidad final']);
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    var out = [], para = [];
    function flush() { if (para.length) { out.push('<p>' + escapeHtml(para.join(' ')) + '</p>'); para = []; } }
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flush(); return; }
      var normalized = normalizeText(line.replace(/[:.]$/, ''));
      var heading = known.find(function (x) { return normalizeText(x) === normalized; });
      if (heading) { flush(); out.push('<h2>' + escapeHtml(heading) + '</h2>'); }
      else if (/^[•\-*]\s+/.test(line)) { flush(); out.push('<p>• ' + escapeHtml(line.replace(/^[•\-*]\s+/, '')) + '</p>'); }
      else para.push(line);
    });
    flush();
    return out.join('');
  }
  function extractPdf(file) {
    if (typeof pdfjsLib === 'undefined') return Promise.reject(new Error('No se pudo cargar el lector de PDF.'));
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return file.arrayBuffer().then(function (buf) { return pdfjsLib.getDocument({data:buf}).promise; }).then(function (pdf) {
      var jobs = [];
      for (var i = 1; i <= pdf.numPages; i++) jobs.push(pdf.getPage(i).then(function (page) { return page.getTextContent(); }).then(function (tc) { return tc.items.map(function (x) { return x.str; }).join(' '); }));
      return Promise.all(jobs).then(function (pages) { return textToHtml(pages.join('\n\n')); });
    });
  }
  function extractAnalysis(file) {
    var name = (file.name || '').toLowerCase();
    if (/\.md$|\.markdown$/.test(name)) return file.text().then(function (md) {
      var parsed = parseFrontMatter(md); applyMetadata(parsed.meta);
      if (typeof marked === 'undefined') throw new Error('No se pudo cargar el conversor de Markdown.');
      return marked.parse(parsed.body, { gfm: true, breaks: false });
    });
    if (/\.html?$/.test(name)) return file.text().then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script,style,iframe,object,embed,form,button,input').forEach(function (n) { n.remove(); });
      return doc.body.innerHTML;
    });
    if (/\.docx$/.test(name)) {
      if (typeof mammoth === 'undefined') return Promise.reject(new Error('No se pudo cargar el lector de Word.'));
      return file.arrayBuffer().then(function (buf) { return mammoth.convertToHtml({arrayBuffer:buf}); }).then(function (r) { return r.value; });
    }
    if (/\.pdf$/.test(name)) return extractPdf(file);
    return Promise.reject(new Error('Formato no compatible. Usa Markdown, HTML, Word (.docx) o PDF.'));
  }

  function checkQuality() {
    var holder = el('qualityChips'); holder.innerHTML = '';
    if (!state.html) return;
    var doc = new DOMParser().parseFromString(state.html, 'text/html');
    var headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4')).map(function (h) { return normalizeText(h.textContent); });
    var missing = 0;
    REQUIRED.forEach(function (name) {
      var ok = headings.some(function (h) { var n = normalizeText(name); return h === n || h.indexOf(n) >= 0; });
      var chip = document.createElement('span'); chip.textContent = (ok ? '✓ ' : 'Falta: ') + name; chip.className = ok ? 'ok' : ''; holder.appendChild(chip);
      if (!ok) missing++;
    });
    setStatus('analysisStatus', missing ? 'Documento convertido. Faltan ' + missing + ' secciones del formato maestro; puedes corregirlo en el LLM y volver a subirlo.' : 'Documento completo y compatible con el formato maestro.', missing ? 'bad' : 'ok');
  }

  function parseNews(text) {
    return String(text || '').split(/\r?\n/).map(function (line) {
      var p = line.split('|').map(function (x) { return x.trim(); });
      return { title:p[0] || '', url:p[1] || '', date:p[2] || '', impact:(p[3]||'').toLowerCase() };
    }).filter(function (x) { return x.title; });
  }
  function renderNews() {
    var news = parseNews(state.news);
    if (!news.length) return '';
    return '<section><h2>Noticias añadidas</h2><div class="news-list">' + news.map(function (n) {
      var title = escapeHtml(n.title), date = n.date ? '<span class="news-date">' + escapeHtml(n.date) + '</span>' : '';
      var link = /^https?:\/\//i.test(n.url) ? '<a href="' + escapeHtml(n.url) + '" target="_blank" rel="noopener noreferrer">' + title + '</a>' : '<strong>' + title + '</strong>';
      var impact = ['alta','media','baja'].indexOf(n.impact) !== -1 ? '<span class="impact-badge impact-' + n.impact + '">' + n.impact + '</span>' : '';
      return '<div class="news-item">' + link + date + impact + '</div>';
    }).join('') + '</div></section>';
  }
  // El precio/fecha/zonas/escenarios ya guardados en el Visor para el mismo
  // ticker (ver linkVisorValuation) — reutiliza los mismos campos que
  // guarda saveValoracion() en visor.html, así que no depende de re-tipear
  // nada ni de mantener sincronizada una tabla subida a mano aparte.
  function buildLinkedValuationHtml(lv) {
    function money(v) { return v == null || !isFinite(v) ? '—' : '$' + Number(v).toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:2}); }
    function kv(label, value) { return '<div class="linked-kv"><span>' + escapeHtml(label) + '</span><strong>' + value + '</strong></div>'; }
    function zoneKv(label, z) { return z ? kv(label, money(z.min) + ' – ' + money(z.max)) : ''; }
    var op = lv.objetivoPonderado || {}, z = lv.zonas || {};
    return '<section class="valuation-block linked-valuation"><span class="linked-tag">✓ Vinculado con el Visor · ' + escapeHtml(lv.sourcePath || '') + '</span><h2>Valoración cuantitativa (Visor)</h2><div class="linked-grid">' +
      kv('Precio', money(lv.precio)) +
      kv('Fecha del análisis', escapeHtml(lv.fecha || '—')) +
      kv('Objetivo conservador', money(op.conservador)) +
      kv('Objetivo base', money(op.base)) +
      kv('Objetivo optimista', money(op.optimista)) +
      zoneKv('Zona Value', z.value) + zoneKv('Zona Deep Value', z.deepValue) + zoneKv('Zona histórica', z.historica) +
      '</div></section>';
  }
  function renderPreview() {
    el('previewCompany').textContent = state.company || state.title || 'Nuevo análisis';
    el('previewTicker').textContent = state.ticker || '—';
    el('previewPrice').textContent = state.price != null ? new Intl.NumberFormat('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(state.price) : '—';
    el('previewPriceNote').textContent = state.priceFetchedAt ? new Date(state.priceFetchedAt).toLocaleDateString('es-CO') : '';
    var logo = el('previewLogo');
    if (state.logo) { logo.src = state.logo; logo.alt = 'Logo de ' + (state.company || state.ticker); logo.hidden = false; }
    else { logo.hidden = true; logo.removeAttribute('src'); }
    var body = el('previewBody');
    if (!state.html && !state.valuationHtml && !state.linkedValuation && !state.news) { body.innerHTML = '<div class="preview-empty">Sube un documento para ver aquí la versión normalizada.</div>'; return; }
    var title = state.title ? '<h1>' + escapeHtml(state.title) + '</h1>' : '';
    var linked = state.linkedValuation ? buildLinkedValuationHtml(state.linkedValuation) : '';
    var val = state.valuationHtml ? '<section class="valuation-block"><h2>Valoración cuantitativa (tabla subida)</h2>' + state.valuationHtml + '</section>' : '';
    body.innerHTML = '<div class="research-document">' + title + safeHtml(state.html) + linked + val + renderNews() + '</div>';
  }
  function syncFields() {
    state.ticker = el('tickerInput').value.trim().toUpperCase();
    state.company = el('companyInput').value.trim();
    state.title = el('titleInput').value.trim();
    state.date = el('dateInput').value;
    state.news = el('newsInput').value;
    renderPreview();
  }
  ['tickerInput','companyInput','titleInput','dateInput','newsInput'].forEach(function (id) { el(id).addEventListener('input', syncFields); });
  el('dateInput').value = state.date;

  el('quoteBtn').addEventListener('click', function () {
    syncFields();
    if (!state.ticker) { setStatus('quoteStatus','Ingresa un ticker.','bad'); return; }
    if (typeof MarketData === 'undefined') { setStatus('quoteStatus','No se pudo cargar el servicio de precios.','bad'); return; }
    var btn = el('quoteBtn'); btn.disabled = true; setStatus('quoteStatus','Consultando precio y empresa…');
    MarketData.fetchQuote(state.ticker).then(function (q) {
      if (!q) throw new Error('No se encontró el ticker.');
      state.price = q.price; state.priceFetchedAt = new Date().toISOString();
      if (q.companyName && !el('companyInput').value.trim()) el('companyInput').value = q.companyName;
      if (q.image && !state.logo) state.logo = q.image;
      syncFields(); setStatus('quoteStatus','Precio y datos actualizados.','ok');
    }).catch(function (err) { setStatus('quoteStatus','No fue posible consultar FMP: ' + err.message,'bad'); }).finally(function () { btn.disabled = false; });
  });

  // Compresión de imágenes antes de guardarlas: reescala a un máximo de
  // píxeles y reencoda a JPEG vía canvas, sin ninguna librería. Se aplica
  // tanto al logo subido a mano como a cualquier imagen embebida como
  // data: URI dentro del documento convertido (mammoth.js, por ejemplo,
  // embebe así las imágenes de un .docx) — así un análisis con varias
  // capturas pegadas no se acerca a los límites prácticos de tamaño de
  // localStorage o de un archivo individual en GitHub.
  function compressImageDataUrl(dataUrl, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', quality || 0.82)); } catch (e) { resolve(dataUrl); }
      };
      img.onerror = function () { reject(new Error('No se pudo procesar la imagen.')); };
      img.src = dataUrl;
    });
  }
  function compressEmbeddedImages(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var imgs = Array.prototype.filter.call(doc.querySelectorAll('img'), function (img) { return /^data:image\//i.test(img.getAttribute('src') || ''); });
    if (!imgs.length) return Promise.resolve(html);
    return Promise.all(imgs.map(function (img) {
      return compressImageDataUrl(img.getAttribute('src'), 900, 0.82).then(function (compressed) { img.setAttribute('src', compressed); }).catch(function () {});
    })).then(function () { return doc.body.innerHTML; });
  }

  el('logoInput').addEventListener('change', function () {
    var file = this.files && this.files[0]; if (!file) return;
    if (file.size > 15000000) { setStatus('quoteStatus','El archivo de logo es demasiado pesado (máx. 15 MB antes de comprimir).','bad'); this.value=''; return; }
    var reader = new FileReader();
    reader.onload = function () {
      compressImageDataUrl(reader.result, 240, 0.85).then(function (compressed) {
        state.logo = compressed; renderPreview();
        setStatus('quoteStatus','Logo propio cargado y comprimido (~' + Math.round(compressed.length / 1024) + ' KB).','ok');
      }).catch(function (err) { setStatus('quoteStatus', err.message, 'bad'); });
    };
    reader.readAsDataURL(file);
  });

  function handleAnalysisFile(file) {
    if (!file) return;
    setStatus('analysisStatus','Convirtiendo ' + file.name + '…');
    extractAnalysis(file).then(function (html) {
      return compressEmbeddedImages(html);
    }).then(function (html) {
      state.html = safeHtml(html); state.sourceName = file.name; checkQuality(); syncFields();
      if (/\.pdf$/i.test(file.name)) setStatus('analysisStatus','PDF convertido a texto. Revisa títulos, tablas y orden: PDF es el formato menos fiable para reutilizar.','bad');
    }).catch(function (err) { setStatus('analysisStatus','No pude leer el archivo: ' + err.message,'bad'); });
  }
  el('analysisFile').addEventListener('change', function () { handleAnalysisFile(this.files && this.files[0]); });

  function sheetToTable(ws) {
    var rows = XLSX.utils.sheet_to_json(ws, {header:1,raw:false,defval:''}).filter(function (r) { return r.some(function (v) { return String(v).trim(); }); });
    if (!rows.length) throw new Error('La hoja elegida está vacía.');
    rows = rows.slice(0, 80).map(function (r) { return r.slice(0, 14); });
    var html = '<table class="valuation-table"><tbody>';
    rows.forEach(function (row, ri) { html += '<tr>' + row.map(function (v) { var tag = ri === 0 ? 'th' : 'td'; return '<' + tag + '>' + escapeHtml(v) + '</' + tag + '>'; }).join('') + '</tr>'; });
    return html + '</tbody></table>';
  }
  function handleValuationFile(file) {
    if (!file) return;
    if (typeof XLSX === 'undefined') { setStatus('valuationStatus','No se pudo cargar el lector de hojas de cálculo.','bad'); return; }
    setStatus('valuationStatus','Leyendo ' + file.name + '…');
    file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, {type:'array'});
      var preferred = wb.SheetNames.find(function (n) { return normalizeText(n) === 'resumen de valoracion'; }) || wb.SheetNames[0];
      state.valuationHtml = sheetToTable(wb.Sheets[preferred]); renderPreview();
      setStatus('valuationStatus','Tabla incorporada desde “' + preferred + '” (máximo 80 filas y 14 columnas).','ok');
    }).catch(function (err) { setStatus('valuationStatus','No pude leer la valoración: ' + err.message,'bad'); });
  }
  el('valuationFile').addEventListener('change', function () { handleValuationFile(this.files && this.files[0]); });

  // Vincular con el Visor: en vez de re-subir a mano la tabla de valoración,
  // busca en "valoraciones/" (mismo repo/token que "Valoraciones guardadas"
  // del Visor) el guardado más reciente para este ticker y trae sus números
  // ya calculados (precio, zonas, escenarios) — queda vinculado por ruta,
  // no copiado a ciegas: "sourcePath" muestra siempre de dónde salió.
  function tickerFromValoracionName(name) {
    var base = name.replace(/\.json$/i, '');
    var m = base.match(/^(.+)-(\d{10,})$/);
    return m ? m[1] : base;
  }
  function listValoraciones() {
    return fetch(GH_API + 'valoraciones', { headers: ghHeaders() }).then(function (res) {
      if (res.status === 404) return [];
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (list) { return (Array.isArray(list) ? list : []).filter(function (f) { return /\.json$/i.test(f.name); }); });
  }
  function fetchJsonFile(path) {
    return fetch(GH_API + path, { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) { return JSON.parse(b64Decode(data.content.replace(/\n/g, ''))); });
  }
  function linkVisorValuation() {
    syncFields();
    if (!state.ticker) { setStatus('linkVisorStatus','Ingresa un ticker primero.','bad'); return; }
    var btn = el('linkVisorBtn'); btn.disabled = true; setStatus('linkVisorStatus','Buscando valoraciones de ' + state.ticker + ' en el Visor…');
    listValoraciones().then(function (files) {
      var matches = files.filter(function (f) { return tickerFromValoracionName(f.name) === state.ticker; });
      if (!matches.length) throw new Error('No encontré ninguna valoración guardada para ' + state.ticker + ' en el Visor — guárdala ahí primero, o sube la tabla a mano abajo.');
      matches.sort(function (a, b) { return b.name.localeCompare(a.name); }); // el timestamp del nombre ordena de más reciente a más vieja
      return fetchJsonFile(matches[0].path).then(function (rec) { return { rec: rec, path: matches[0].path, count: matches.length }; });
    }).then(function (found) {
      var rec = found.rec;
      state.linkedValuation = { precio: rec.precio, fecha: rec.fecha, zonas: rec.zonas, objetivoPonderado: rec.objetivoPonderado, cagr: rec.cagr, sourcePath: found.path };
      renderPreview();
      setStatus('linkVisorStatus','Vinculado con "' + found.path + '"' + (found.count > 1 ? ' (la más reciente de ' + found.count + ' guardadas para este ticker)' : '') + '.','ok');
    }).catch(function (err) { setStatus('linkVisorStatus', err.message, 'bad'); }).finally(function () { btn.disabled = false; });
  }
  el('linkVisorBtn').addEventListener('click', linkVisorValuation);

  // Chequeo silencioso de vínculo desactualizado: al abrir un análisis que
  // ya tiene una valoración vinculada, compara contra el guardado más
  // reciente del Visor para el mismo ticker. No lo actualiza solo (podría
  // pisar algo a propósito) — solo avisa, con el mismo botón de siempre
  // para refrescarlo si el usuario quiere.
  function checkLinkedValuationFreshness() {
    if (!state.linkedValuation || !state.ticker) return;
    listValoraciones().then(function (files) {
      var matches = files.filter(function (f) { return tickerFromValoracionName(f.name) === state.ticker; });
      if (!matches.length) return;
      matches.sort(function (a, b) { return b.name.localeCompare(a.name); });
      var latestPath = matches[0].path;
      if (latestPath !== state.linkedValuation.sourcePath) {
        setStatus('linkVisorStatus', '⚠ Hay una valoración más reciente en el Visor ("' + latestPath + '") — este análisis sigue vinculado con "' + state.linkedValuation.sourcePath + '". Pulsa "Vincular con Visor" para actualizarlo.', 'bad');
      }
    }).catch(function () {});
  }

  // Noticias automáticas: usa la misma API key de FMP del resto de la app.
  // No clasifica el impacto por sí sola (eso queda a criterio del usuario,
  // agregando "| Alta/Media/Baja" a la línea) — solo trae titulares nuevos
  // sin duplicar los que ya estén en el textarea.
  function fetchAutoNews() {
    syncFields();
    if (!state.ticker) { setStatus('newsStatus','Ingresa un ticker primero.','bad'); return; }
    if (typeof MarketData === 'undefined' || !MarketData.getApiKey()) { setStatus('newsStatus','Configura tu API key de FMP (en el Visor o la Calculadora) primero.','bad'); return; }
    var btn = el('fetchNewsBtn'); btn.disabled = true; setStatus('newsStatus','Buscando noticias de ' + state.ticker + '…');
    var key = MarketData.getApiKey();
    fetch('https://financialmodelingprep.com/stable/news/stock?symbols=' + encodeURIComponent(state.ticker) + '&limit=10&apikey=' + encodeURIComponent(key)).then(function (res) {
      if (res.status === 401 || res.status === 403) throw new Error('Tu plan de FMP no incluye noticias, o la API key no es válida.');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!Array.isArray(data) || !data.length) { setStatus('newsStatus','FMP no devolvió noticias recientes para ' + state.ticker + '.'); return; }
      var existingUrls = {};
      parseNews(state.news).forEach(function (n) { if (n.url) existingUrls[n.url] = true; });
      var added = 0;
      var lines = data.map(function (n) {
        var url = n.url || n.link || '';
        if (url && existingUrls[url]) return null;
        added++;
        return (n.title || '').replace(/\|/g, '/') + ' | ' + url + ' | ' + (n.publishedDate || n.date || '').slice(0, 10);
      }).filter(Boolean);
      if (!lines.length) { setStatus('newsStatus','No hay noticias nuevas — ya estaban todas cargadas.'); return; }
      var textarea = el('newsInput');
      textarea.value = (textarea.value.trim() ? textarea.value.trim() + '\n' : '') + lines.join('\n');
      syncFields();
      setStatus('newsStatus', added + ' noticia(s) nueva(s) agregadas. Revisa y marca el impacto (Alta/Media/Baja) a mano si querés.','ok');
    }).catch(function (err) { setStatus('newsStatus', err.message, 'bad'); }).finally(function () { btn.disabled = false; });
  }
  el('fetchNewsBtn').addEventListener('click', fetchAutoNews);

  [['analysisDrop',handleAnalysisFile],['valuationDrop',handleValuationFile]].forEach(function (pair) {
    var zone = el(pair[0]);
    ['dragenter','dragover'].forEach(function (ev) { zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.add('drag');}); });
    ['dragleave','drop'].forEach(function (ev) { zone.addEventListener(ev,function(e){e.preventDefault();zone.classList.remove('drag');}); });
    zone.addEventListener('drop',function(e){ pair[1](e.dataTransfer.files && e.dataTransfer.files[0]); });
  });

  function getLocalLibrary() { try { var x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); return Array.isArray(x)?x:[]; } catch(e){return [];} }
  function setLocalLibrary(list) { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); }
  function makeId() { return 'research-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }
  function cleanRecord(r) { var copy=Object.assign({},r); delete copy.remoteSha; return copy; }
  function upsertLocal(record) {
    var list=getLocalLibrary(), idx=list.findIndex(function(x){return x.id===record.id;});
    if(idx>=0) list[idx]=record; else list.unshift(record);
    setLocalLibrary(list); return list;
  }
  function getGhToken() { try{return(localStorage.getItem(GH_TOKEN_KEY)||'').trim();}catch(e){return '';} }
  function setGhToken(t) { try{localStorage.setItem(GH_TOKEN_KEY,(t||'').trim());}catch(e){} }
  // Modelo-JMR-datos es un repo público: leer (listar/abrir análisis) no
  // requiere token — solo se manda Authorization si hay uno guardado.
  // Guardar/borrar sí lo exigen (remoteSave/remoteDelete ya lo chequean
  // antes de intentar la llamada).
  function ghHeaders() { var h = {'Accept':'application/vnd.github+json'}; var t = getGhToken(); if (t) h['Authorization'] = 'token ' + t; return h; }
  function b64Encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64Decode(str) { return decodeURIComponent(escape(atob(str))); }
  function remoteSave(record) {
    if(!getGhToken()) return Promise.resolve(null);
    var safe=(record.ticker||'empresa').replace(/[^A-Za-z0-9._-]/g,'_');
    var path=record.remotePath||('analisis/'+safe+'-'+record.id+'.json');
    var body={message:'Guardar research '+safe,content:b64Encode(JSON.stringify(cleanRecord(record),null,2))};
    if(record.remoteSha) body.sha=record.remoteSha;
    return fetch(GH_API+path,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify(body)}).then(function(res){if(!res.ok)return res.json().then(function(e){throw new Error(e.message||('HTTP '+res.status));});return res.json();}).then(function(data){record.remotePath=data.content.path;record.remoteSha=data.content.sha;return record;});
  }
  function remoteDelete(record) {
    // Si nunca se guardó en GitHub no hay nada remoto que borrar. Pero si
    // SÍ hay una copia remota (remotePath) y falta el token, hay que
    // rechazar en vez de resolver en silencio — antes esto dejaba
    // "borrar" localmente un registro que seguía intacto en GitHub, y
    // volvía a aparecer solo con la sincronización automática del
    // siguiente reload, dando la sensación de que borrar no funcionaba.
    if(!record.remotePath) return Promise.resolve();
    if(!getGhToken()) return Promise.reject(new Error('Conecta tu GitHub arriba para poder borrar también la copia guardada en el repositorio.'));
    if(!record.remoteSha) return Promise.resolve();
    // Si el archivo ya no existe en GitHub (404) no es un error — significa
    // que ya está borrado (p. ej. remotePath/remoteSha quedó desactualizado
    // por algún cambio hecho fuera de la app). Sin este chequeo, un
    // registro así queda imposible de borrar para siempre: cada intento
    // reintenta la misma llamada que siempre va a fallar con 404.
    return fetch(GH_API+record.remotePath,{method:'DELETE',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify({message:'Borrar research '+(record.ticker||record.id),sha:record.remoteSha})}).then(function(res){if(!res.ok && res.status!==404)throw new Error('HTTP '+res.status);});
  }
  function syncRemote() {
    return fetch(GH_API+'analisis',{headers:ghHeaders()}).then(function(res){if(res.status===404)return[];if(!res.ok)throw new Error('HTTP '+res.status);return res.json();}).then(function(files){
      var jsons=(Array.isArray(files)?files:[]).filter(function(f){return /\.json$/i.test(f.name);});
      return Promise.all(jsons.map(function(f){return fetch(f.url,{headers:ghHeaders()}).then(function(r){return r.json();}).then(function(data){var rec=JSON.parse(b64Decode(data.content.replace(/\n/g,'')));rec.remotePath=f.path;rec.remoteSha=f.sha;return rec;});}));
    }).then(function(remote){
      var map={}; getLocalLibrary().concat(remote).forEach(function(r){var old=map[r.id];if(!old||String(r.updatedAt||'')>String(old.updatedAt||''))map[r.id]=r;});
      var list=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date));});setLocalLibrary(list);renderLibrary();return list.length;
    });
  }

  // Un análisis guardado sin GitHub conectado en ese momento (o guardado
  // antes de conectar el token por primera vez) queda SOLO en este
  // navegador — remoteSave() ya lo avisa en el status, pero si el usuario
  // conecta el token más tarde y nunca vuelve a apretar "Guardar" en cada
  // uno, esos análisis nunca llegan a GitHub y por lo tanto nunca
  // aparecen en Mi Bitácora, Portafolio ni en otro navegador. Al conectar
  // (o ya estando conectado al cargar la página) se suben en cadena
  // (uno por vez, no en paralelo, para no chocar con la API de GitHub)
  // todos los que todavía no tengan remotePath.
  function pushLocalOnlyToRemote() {
    if (!getGhToken()) return Promise.resolve();
    var pending = getLocalLibrary().filter(function (r) { return r.ticker && !r.remotePath; });
    if (!pending.length) return Promise.resolve();
    setStatus('libraryStatus', 'Subiendo ' + pending.length + ' análisis pendiente(s) a GitHub…');
    var ok = 0, errors = [];
    return pending.reduce(function (chain, rec) {
      return chain.then(function () {
        return remoteSave(rec).then(function (saved) {
          if (saved) { upsertLocal(saved); ok++; }
        }).catch(function (err) {
          console.warn('No se pudo subir ' + (rec.ticker || rec.id) + ' a GitHub:', err);
          errors.push((rec.ticker || rec.id) + ': ' + err.message);
        });
      });
    }, Promise.resolve()).then(function () {
      renderLibrary();
      // No mostrar "subido" si en realidad falló — antes esto decía éxito
      // aunque remoteSave hubiera fallado para todos (p. ej. token vencido
      // o sin permiso de escritura), dejando al usuario sin ninguna pista
      // de que en realidad nada llegó a GitHub.
      if (errors.length) {
        setStatus('libraryStatus', ok + ' de ' + pending.length + ' subido(s) — falló: ' + errors.join('; '), 'bad');
      } else {
        setStatus('libraryStatus', pending.length + ' análisis subido(s) a GitHub.', 'ok');
      }
    });
  }

  // Banner de GitHub siempre visible (no solo dentro de "Guardar"), para
  // que quede claro desde cualquier pestaña si los análisis están
  // guardándose solo en este navegador (se pierden al limpiar datos o
  // cambiar de dispositivo) o también en el repo privado. Mismo token que
  // "Valoraciones guardadas" del Visor — conectarlo una vez acá también
  // lo deja conectado allá, y viceversa.
  function renderGhBanner() {
    var el2 = el('ghConnectBanner'); if (!el2) return;
    var token = getGhToken();
    if (token) {
      el2.innerHTML = '<div class="gh-banner ok"><span class="gh-msg">✓ GitHub conectado — ya podés guardar y borrar análisis (verlos ya funcionaba igual sin conectar nada).</span><button class="btn" id="ghBannerChange" type="button">Cambiar</button><button class="btn" id="ghBannerForget" type="button">Olvidar</button></div>';
      el('ghBannerChange').addEventListener('click', showGhBannerForm);
      el('ghBannerForget').addEventListener('click', function () { setGhToken(''); renderGhBanner(); renderLibrary(); });
    } else {
      showGhBannerForm();
    }
  }
  function showGhBannerForm() {
    var el2 = el('ghConnectBanner');
    // Mientras GhOAuth no esté configurado (falta el Client ID/Worker URL
    // tras crear la OAuth App), se cae de vuelta al campo de pegar un PAT
    // a mano, para no dejar el sitio sin forma de conectar en el medio de
    // la migración.
    if (typeof GhOAuth !== 'undefined' && GhOAuth.isConfigured()) {
      el2.innerHTML = '<div class="gh-banner warn"><span class="gh-msg">⚠ GitHub no conectado: podés VER la biblioteca igual (es de lectura libre), pero GUARDAR o BORRAR análisis necesita conectar tu cuenta.</span><button class="btn primary" id="ghBannerConnect" type="button">Conectar con GitHub</button></div>';
      el('ghBannerConnect').addEventListener('click', function () { GhOAuth.startLogin(); });
      return;
    }
    el2.innerHTML = '<div class="gh-banner warn"><span class="gh-msg">⚠ GitHub no conectado: podés VER la biblioteca igual (es de lectura libre), pero GUARDAR o BORRAR análisis necesita tu propio Personal Access Token. Conéctalo una vez.</span><input id="ghBannerToken" type="password" placeholder="Personal Access Token de GitHub — solo para guardar/borrar" autocomplete="off" spellcheck="false"><button class="btn primary" id="ghBannerConnect" type="button">Conectar</button></div>';
    var input = el('ghBannerToken');
    el('ghBannerConnect').addEventListener('click', function () {
      setGhToken(input.value);
      renderGhBanner();
      syncRemote().then(pushLocalOnlyToRemote).catch(function () {});
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') el('ghBannerConnect').click(); });
  }

  // Versiones históricas: cada "Guardar" hace un PUT al mismo path de
  // GitHub, así que git ya conserva cada versión anterior en su historial
  // de commits — no hace falta un sistema de versionado propio, solo
  // exponerlo. "Qué cambió" compara el texto de dos versiones con jsdiff.
  function fetchFileHistory(path) {
    return fetch(GH_REPO_API + 'commits?path=' + encodeURIComponent(path) + '&per_page=15', { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }
  function fetchFileAtCommit(path, sha) {
    return fetch(GH_API + path + '?ref=' + sha, { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) { return JSON.parse(b64Decode(data.content.replace(/\n/g, ''))); });
  }
  function htmlToPlainText(html) {
    var doc = new DOMParser().parseFromString(html || '', 'text/html');
    var blocks = doc.body.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,td,th');
    var lines = Array.prototype.map.call(blocks, function (n) { return n.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    return lines.length ? lines.join('\n') : (doc.body.textContent || '').trim();
  }
  function renderDiff(oldHtml, newHtml) {
    if (typeof Diff === 'undefined') return '<p class="status bad">No se pudo cargar el comparador de texto.</p>';
    var parts = Diff.diffLines(htmlToPlainText(oldHtml), htmlToPlainText(newHtml));
    if (!parts.some(function (p) { return p.added || p.removed; })) return '<p class="status">Sin cambios de contenido entre estas dos versiones.</p>';
    var html = parts.map(function (p) {
      var text = escapeHtml(p.value).replace(/\n/g, '<br>');
      if (p.added) return '<span class="diff-add">' + text + '</span>';
      if (p.removed) return '<span class="diff-del">' + text + '</span>';
      return '<span>' + text + '</span>';
    }).join('');
    return '<div class="diff-view">' + html + '</div>';
  }
  function refreshHistoryButton() { el('historyBtn').hidden = !state.remotePath || !getGhToken(); }
  function showHistoryPanel() {
    var panel = el('historyPanel');
    panel.hidden = false;
    panel.innerHTML = '<p class="status">Cargando historial…</p>';
    fetchFileHistory(state.remotePath).then(function (commits) {
      if (!commits.length) { panel.innerHTML = '<p class="status">No hay historial todavía — este es el único guardado.</p>'; return; }
      panel.innerHTML = '<h3>Historial de versiones</h3><div class="history-list">' + commits.map(function (c, i) {
        var date = new Date(c.commit.author.date).toLocaleString('es-CO');
        return '<div class="history-item" data-sha="' + c.sha + '"><span>' + escapeHtml(date) + (i === 0 ? ' · actual' : '') + '</span>' +
          (i === 0 ? '' : '<span class="h-actions"><button class="btn" data-hact="diff" type="button">Ver cambios</button><button class="btn" data-hact="restore" type="button">Restaurar</button></span>') +
          '</div>';
      }).join('') + '</div><div id="historyDiffOut"></div>';
      panel.querySelectorAll('[data-hact]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var sha = btn.closest('.history-item').dataset.sha, action = btn.dataset.hact;
          btn.disabled = true;
          fetchFileAtCommit(state.remotePath, sha).then(function (oldRecord) {
            if (action === 'diff') {
              el('historyDiffOut').innerHTML = renderDiff(oldRecord.html || '', state.html || '');
            } else if (action === 'restore') {
              if (!confirm('¿Restaurar esta versión anterior en el editor? Vas a perder los cambios sin guardar que tengas ahora.')) return;
              fillEditor(Object.assign({}, oldRecord, { remotePath: state.remotePath, remoteSha: state.remoteSha, id: state.id }));
              setStatus('saveStatus','Versión restaurada en el editor — todavía no guardada. Presiona "Guardar análisis" para confirmarla.','ok');
            }
          }).catch(function (err) { alert('Error: ' + err.message); }).finally(function () { btn.disabled = false; });
        });
      });
    }).catch(function (err) { panel.innerHTML = '<p class="status bad">No se pudo cargar el historial: ' + err.message + '</p>'; });
  }
  el('historyBtn').addEventListener('click', showHistoryPanel);

  function buildRecord() {
    syncFields();
    if(!state.ticker) throw new Error('Ingresa el ticker.');
    if(!state.company) throw new Error('Ingresa el nombre de la empresa.');
    if(!state.title) throw new Error('Ingresa el título del análisis.');
    if(!state.html) throw new Error('Sube el documento cualitativo.');
    if(!state.id) state.id=makeId();
    state.updatedAt=new Date().toISOString();
    return Object.assign({},state);
  }
  el('saveBtn').addEventListener('click',function(){
    var btn=this,record;
    try{record=buildRecord();}catch(err){setStatus('saveStatus',err.message,'bad');return;}
    btn.disabled=true;setStatus('saveStatus','Guardando…');
    try{upsertLocal(record);}catch(err){btn.disabled=false;setStatus('saveStatus','No cabe en el almacenamiento local. Exporta la biblioteca o reduce el documento.','bad');return;}
    remoteSave(record).then(function(saved){if(saved)upsertLocal(saved);state=Object.assign(state,saved||record);refreshHistoryButton();renderLibrary();setStatus('saveStatus',saved?'Guardado localmente y en tu repositorio de GitHub — a salvo aunque cambies de navegador.':'Guardado SOLO en este navegador — conecta GitHub arriba para que quede a salvo también en tu repositorio.',saved?'ok':'bad');}).catch(function(err){setStatus('saveStatus','Guardado localmente, pero GitHub falló: '+err.message,'bad');}).finally(function(){btn.disabled=false;});
  });

  function fillEditor(rec) {
    state=Object.assign(freshState(),rec);
    el('tickerInput').value=state.ticker||'';el('companyInput').value=state.company||'';el('titleInput').value=state.title||'';el('dateInput').value=state.date||'';el('newsInput').value=state.news||'';
    checkQuality();renderPreview();refreshHistoryButton();el('historyPanel').hidden=true;el('historyPanel').innerHTML='';
    ['quoteStatus','analysisStatus','valuationStatus','linkVisorStatus','newsStatus'].forEach(function(id){setStatus(id,'');});
    setStatus('saveStatus','Análisis cargado. Puedes editar sus datos o reemplazar los archivos.');switchTab('editor');
    checkLinkedValuationFreshness();
  }
  function resetEditor() {
    state=freshState();['tickerInput','companyInput','titleInput','newsInput'].forEach(function(id){el(id).value='';});el('dateInput').value=state.date;el('logoInput').value='';el('analysisFile').value='';el('valuationFile').value='';el('qualityChips').innerHTML='';
    ['quoteStatus','analysisStatus','valuationStatus','linkVisorStatus','newsStatus','saveStatus'].forEach(function(id){setStatus(id,'');});
    refreshHistoryButton();el('historyPanel').hidden=true;el('historyPanel').innerHTML='';renderPreview();
  }
  el('newBtn').addEventListener('click',resetEditor);
  el('printBtn').addEventListener('click',function(){window.print();});

  // Descarga de PDF como archivo (además de "Imprimir / PDF", que abre el
  // diálogo del navegador): útil cuando se quiere el archivo directo sin
  // pasar por "Guardar como" a mano. html2pdf.js (html2canvas + jsPDF por
  // debajo) es liviano y no requiere backend — si por algún motivo no
  // cargó desde el CDN, cae de vuelta a sugerir el botón de imprimir.
  function safeFileSlug(s) { return String(s || 'analisis').replace(/[^A-Za-z0-9._-]/g, '_'); }
  function downloadPdf(element, filename, btn, statusId) {
    if (typeof html2pdf === 'undefined') { if (statusId) setStatus(statusId, 'No se pudo cargar el generador de PDF — usa "Imprimir / PDF" en su lugar.', 'bad'); return; }
    if (btn) btn.disabled = true;
    if (statusId) setStatus(statusId, 'Generando PDF…');
    html2pdf().set({
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(element).save().then(function () {
      if (statusId) setStatus(statusId, 'PDF descargado.', 'ok');
    }).catch(function (err) {
      if (statusId) setStatus(statusId, 'No se pudo generar el PDF: ' + err.message, 'bad');
    }).finally(function () {
      if (btn) btn.disabled = false;
    });
  }
  el('downloadPdfBtn').addEventListener('click', function () {
    downloadPdf(el('previewBody'), safeFileSlug(state.ticker) + '-' + safeFileSlug(state.date || new Date().toISOString().slice(0, 10)) + '.pdf', this, 'saveStatus');
  });

  // Búsqueda de texto completo: además de ticker/empresa/título, busca
  // dentro del cuerpo del análisis (y las noticias). htmlToPlainText()
  // ya existía para el diff de versiones — se reutiliza acá. Se cachea
  // por id+updatedAt (no por el objeto en sí, porque getLocalLibrary()
  // vuelve a parsear el JSON en cada llamada y crea objetos nuevos cada
  // vez) para no re-parsear el HTML completo en cada tecla mientras se
  // escribe en el buscador.
  var searchTextCache = {};
  function recordSearchText(r) {
    var key = r.id + ':' + (r.updatedAt || r.date || '');
    if (searchTextCache[key] == null) {
      searchTextCache[key] = normalizeText([r.ticker, r.company, r.title, r.news].join(' ') + ' ' + htmlToPlainText(r.html || ''));
    }
    return searchTextCache[key];
  }
  // Extracto para las tarjetas de la biblioteca: el texto de "Resumen
  // ejecutivo" (siempre la primera sección del formato maestro), o el
  // primer párrafo del documento si por algún motivo esa sección no está.
  var excerptCache = {};
  function recordExcerpt(r) {
    var key = r.id + ':' + (r.updatedAt || r.date || '');
    if (excerptCache[key] != null) return excerptCache[key];
    var text = '';
    if (r.html) {
      var doc = new DOMParser().parseFromString(r.html, 'text/html');
      var headings = Array.prototype.slice.call(doc.body.querySelectorAll('h1,h2,h3,h4'));
      var target = headings.find(function (h) { return normalizeText(h.textContent).indexOf('resumen ejecutivo') === 0; });
      if (target) {
        var node = target.nextElementSibling;
        while (node && !/^H[1-4]$/.test(node.tagName)) { text += ' ' + node.textContent; node = node.nextElementSibling; }
      }
      text = text.replace(/\s+/g, ' ').trim();
      if (!text) { var p = doc.body.querySelector('p,li'); text = p ? p.textContent.replace(/\s+/g, ' ').trim() : ''; }
    }
    if (text.length > 160) text = text.slice(0, 160).replace(/\s+\S*$/, '') + '…';
    excerptCache[key] = text;
    return text;
  }
  function renderLibrary() {
    var q=normalizeText(el('librarySearch').value), list=getLocalLibrary().filter(function(r){return !q||recordSearchText(r).indexOf(q)>=0;});
    var holder=el('libraryCards');
    if(!list.length){holder.innerHTML='<div class="empty">Todavía no hay análisis guardados. Abre “Nuevo análisis” para crear el primero.</div>';setStatus('libraryStatus',getGhToken()?'GitHub conectado.':'Biblioteca local · GitHub no conectado.');return;}
    holder.innerHTML=list.map(function(r){
      var logo=r.logo?'<img class="mini-logo" src="'+escapeHtml(r.logo)+'" alt="">':'<span class="mini-logo mini-fallback">'+escapeHtml((r.ticker||'?').slice(0,2))+'</span>';
      var excerpt=recordExcerpt(r);
      return '<article class="analysis-card" data-id="'+escapeHtml(r.id)+'"><div class="card-head">'+logo+'<div class="card-title"><strong>'+escapeHtml(r.title||r.company)+'</strong><span class="ticker">'+escapeHtml(r.ticker||'—')+' · '+escapeHtml(r.company||'')+'</span></div></div>'+(excerpt?'<p class="card-excerpt">'+escapeHtml(excerpt)+'</p>':'')+'<div class="card-meta"><span>'+escapeHtml(r.date||'Sin fecha')+'</span><span>'+(r.remotePath?'GitHub + local':'Solo local')+'</span></div><div class="card-actions"><button class="btn" data-action="open" type="button">Abrir</button><button class="btn danger" data-action="delete" type="button">Borrar</button></div></article>';
    }).join('');
    setStatus('libraryStatus',list.length+' análisis · '+(getGhToken()?'GitHub disponible':'almacenamiento local'));
    populateCompareSelects();
  }
  el('librarySearch').addEventListener('input',renderLibrary);
  el('libraryCards').addEventListener('click',function(e){
    var btn=e.target.closest('button[data-action]');if(!btn)return;var card=btn.closest('[data-id]'),list=getLocalLibrary(),rec=list.find(function(r){return r.id===card.dataset.id;});if(!rec)return;
    if(btn.dataset.action==='open'){fillEditor(rec);return;}
    if(!confirm('¿Borrar el análisis de '+(rec.company||rec.ticker)+'? Esta acción no se puede deshacer.'))return;
    btn.disabled=true;remoteDelete(rec).then(function(){setLocalLibrary(list.filter(function(r){return r.id!==rec.id;}));renderLibrary();}).catch(function(err){btn.disabled=false;setStatus('libraryStatus','No se pudo borrar: '+err.message,'bad');});
  });
  el('syncBtn').addEventListener('click',function(){var btn=this;btn.disabled=true;setStatus('libraryStatus','Sincronizando…');syncRemote().then(function(n){setStatus('libraryStatus','Sincronización completa: '+n+' análisis.','ok');return pushLocalOnlyToRemote();}).catch(function(err){setStatus('libraryStatus',err.message,'bad');}).finally(function(){btn.disabled=false;});});
  el('exportLibraryBtn').addEventListener('click',function(){download('modelo-jmr-research-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(getLocalLibrary(),null,2),'application/json');});
  el('importLibraryInput').addEventListener('change',function(){var file=this.files&&this.files[0];if(!file)return;file.text().then(function(text){var incoming=JSON.parse(text);if(!Array.isArray(incoming))throw new Error('El respaldo no contiene una biblioteca válida.');var map={};getLocalLibrary().concat(incoming).forEach(function(r){if(r&&r.id)map[r.id]=r;});setLocalLibrary(Object.keys(map).map(function(k){return map[k];}));renderLibrary();setStatus('libraryStatus','Respaldo importado.','ok');}).catch(function(err){setStatus('libraryStatus','No se pudo importar: '+err.message,'bad');});this.value='';});

  // Comparar dos empresas/competidores lado a lado: reutiliza el mismo
  // renderer de documento (safeHtml + valuation-block) para cada columna,
  // a partir de dos análisis ya guardados en la biblioteca local.
  function populateCompareSelects() {
    var list = getLocalLibrary();
    ['compareA','compareB'].forEach(function (id) {
      var sel = el(id); if (!sel) return;
      var current = sel.value;
      sel.innerHTML = '<option value="">— elegir —</option>' + list.map(function (r) {
        return '<option value="' + escapeHtml(r.id) + '">' + escapeHtml((r.ticker ? r.ticker + ' · ' : '') + (r.company || r.title || 'Sin título')) + '</option>';
      }).join('');
      if (current && list.some(function (r) { return r.id === current; })) sel.value = current;
    });
  }
  function buildCompareColumnHtml(rec) {
    var logo = rec.logo ? '<img class="company-logo" src="' + escapeHtml(rec.logo) + '" alt="">' : '';
    var linked = rec.linkedValuation ? buildLinkedValuationHtml(rec.linkedValuation) : '';
    var val = rec.valuationHtml ? '<section class="valuation-block"><h2>Valoración cuantitativa</h2>' + rec.valuationHtml + '</section>' : '';
    var title = rec.title ? '<h1>' + escapeHtml(rec.title) + '</h1>' : '';
    return '<div class="compare-col"><div class="company-banner"><div class="identity">' + logo + '<div class="company-name"><h2>' + escapeHtml(rec.company || rec.title || rec.ticker || '—') + '</h2><div class="ticker">' + escapeHtml(rec.ticker || '—') + '</div></div></div></div>' +
      '<div class="preview-body"><div class="research-document">' + title + safeHtml(rec.html || '') + linked + val + '</div></div></div>';
  }
  el('compareBtn').addEventListener('click', function () {
    var list = getLocalLibrary();
    var a = list.find(function (r) { return r.id === el('compareA').value; });
    var b = list.find(function (r) { return r.id === el('compareB').value; });
    if (!a || !b) { setStatus('compareStatus','Elegí dos análisis guardados para comparar.','bad'); el('compareOutput').innerHTML = '<div class="compare-empty">Elegí dos empresas arriba para verlas lado a lado.</div>'; return; }
    el('compareOutput').innerHTML = buildCompareColumnHtml(a) + buildCompareColumnHtml(b);
    setStatus('compareStatus','Comparando "' + (a.ticker || a.title) + '" vs. "' + (b.ticker || b.title) + '".','ok');
  });
  el('comparePrintBtn').addEventListener('click', function () { window.print(); });
  el('compareDownloadBtn').addEventListener('click', function () {
    var a = getLocalLibrary().find(function (r) { return r.id === el('compareA').value; });
    var b = getLocalLibrary().find(function (r) { return r.id === el('compareB').value; });
    var name = safeFileSlug((a && a.ticker) || 'A') + '-vs-' + safeFileSlug((b && b.ticker) || 'B') + '.pdf';
    downloadPdf(el('compareOutput'), name, this, 'compareStatus');
  });

  function download(name,text,type){var blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  var defaultPrompt='';
  function loadPrompt(force) {
    fetch('prompts/analisis-fundamental-v1.md',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();}).then(function(text){defaultPrompt=text;var saved='';try{saved=localStorage.getItem(PROMPT_KEY)||'';}catch(e){}el('promptText').value=force||!saved?text:saved;}).catch(function(err){setStatus('promptStatus','No se pudo cargar el prompt: '+err.message,'bad');});
  }
  el('copyPromptBtn').addEventListener('click',function(){navigator.clipboard.writeText(el('promptText').value).then(function(){setStatus('promptStatus','Prompt copiado.','ok');}).catch(function(){el('promptText').select();document.execCommand('copy');setStatus('promptStatus','Prompt copiado.','ok');});});
  el('savePromptBtn').addEventListener('click',function(){try{localStorage.setItem(PROMPT_KEY,el('promptText').value);setStatus('promptStatus','Cambios guardados en este navegador.','ok');}catch(e){setStatus('promptStatus','No fue posible guardar el prompt.','bad');}});
  el('downloadPromptBtn').addEventListener('click',function(){download('prompt-analisis-fundamental-modelo-jmr.md',el('promptText').value,'text/markdown');});
  el('resetPromptBtn').addEventListener('click',function(){if(defaultPrompt){el('promptText').value=defaultPrompt;try{localStorage.removeItem(PROMPT_KEY);}catch(e){}setStatus('promptStatus','Prompt restaurado.','ok');}else loadPrompt(true);});

  // Enlace inverso desde "Valoraciones guardadas" del Visor: llega acá
  // como research.html?ticker=XXX — precarga la búsqueda con ese ticker
  // y se queda en la Biblioteca. Se reaplica después de sincronizar por
  // si el análisis todavía no estaba en este navegador (solo en GitHub).
  function applyDeepLinkFilter() {
    try {
      var ticker = new URLSearchParams(location.search).get('ticker');
      if (ticker) { el('librarySearch').value = ticker; switchTab('library'); renderLibrary(); }
    } catch (e) {}
  }

  renderGhBanner();
  el('compareOutput').innerHTML='<div class="compare-empty">Elegí dos empresas arriba para verlas lado a lado.</div>';
  renderLibrary();renderPreview();loadPrompt(false);
  applyDeepLinkFilter();
  // Modelo-JMR-datos es público: la sincronización inicial funciona
  // siempre, con o sin token conectado (el token solo hace falta para
  // guardar/borrar) — así la biblioteca nunca depende de acordarse de
  // apretar "Sincronizar GitHub" ni de conectar nada solo para mirar.
  syncRemote().then(function (n) { applyDeepLinkFilter(); return pushLocalOnlyToRemote(); }).catch(function () {});
  if ('serviceWorker' in navigator) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();
