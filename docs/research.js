(function () {
  'use strict';

  var LOCAL_KEY = 'jmr-research-library-v1';
  // Clave nueva: los cambios locales del antiguo prompt de 21 secciones
  // no deben ocultar la versión maestra v4 al actualizar la aplicación.
  var PROMPT_KEY = 'jmr-research-prompt-v5-integridad-20261001';
  var GH_REPO_API = 'https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/';
  var GH_API = GH_REPO_API + 'contents/';
  // Algunos logos del CDN de FMP desaparecen aunque la empresa siga
  // existiendo. Conservamos localmente los casos conocidos para que la
  // biblioteca no dependa de esas URLs externas.
  var LOCAL_LOGOS = {
    UBER: 'assets/logos/uber.svg',
    NKE: 'assets/logos/nike.svg'
  };
  var REQUIRED = [
    'Resumen ejecutivo', 'Modelo de negocio', 'Segmentos y geografía',
    'Industria y crecimiento', 'Calidad del negocio', 'Ventaja competitiva',
    'Competencia', 'Gestión y asignación de capital', 'Catalizadores',
    'Riesgos', 'Bulls say / Bears say', 'Valor con criterio Damodaran', 'Filosofías de inversión',
    'Noticias y eventos recientes', 'Qué vigilar', 'Preguntas abiertas',
    'Fuentes', 'Control de calidad final'
  ];
  var state = freshState();
  // Los registros v2 contienen artículo completo y cálculos separados.
  // Las piezas editoriales v1 se usan solo para registros todavía no migrados.
  var editorialArticles = Object.create(null);

  function freshState() {
    return { id: '', title: '', ticker: '', company: '', date: new Date().toISOString().slice(0, 10), logo: '', price: null, priceFetchedAt: '', html: '', sourceName: '', valuationHtml: '', linkedValuation: null, news: '', remotePath: '', remoteSha: '', decision: null };
  }
  function el(id) { return document.getElementById(id); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function logoForRecord(record) {
    var ticker = String(record && record.ticker || '').trim().toUpperCase();
    return LOCAL_LOGOS[ticker] || (record && record.logo) || '';
  }
  function wireLogoFallbacks(root) {
    if (!root) return;
    root.querySelectorAll('img.mini-logo[data-ticker]').forEach(function (img) {
      img.onerror = function () {
        var fallback = document.createElement('span');
        fallback.className = 'mini-logo mini-fallback';
        fallback.textContent = (img.getAttribute('data-ticker') || '?').slice(0, 2).toUpperCase();
        img.replaceWith(fallback);
      };
      if (img.complete && img.naturalWidth === 0) img.onerror();
    });
  }
  function safeHtml(html) {
    if (typeof DOMPurify === 'undefined') return escapeHtml(html);
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','p','br','strong','b','em','i','ul','ol','li','blockquote','table','thead','tbody','tr','th','td','a','img','hr','code','pre','details','summary'],
      ALLOWED_ATTR: ['href','src','alt','title','colspan','rowspan','target','rel','id','class']
    });
  }
  // El índice se construye al mostrar el documento: cubre los informes ya
  // guardados y los nuevos, sin alterar el texto original del análisis.
  // Vista editorial no destructiva: conserva los documentos y las cifras en GitHub,
  // pero deja los anexos numéricos para la Calculadora DCF.
  function calculatorLink(ticker) {
    var code=String(ticker||'').trim().toUpperCase();
    var target=/^[A-Z0-9._-]{1,24}$/.test(code)?'calculadora.html?ticker='+encodeURIComponent(code):'calculadora.html';
    return '<a class="jmr-open-calc" href="'+target+'">Abrir simulador de sensibilidad DCF ↗</a>';
  }
  function articleForReading(html, ticker) {
    var raw=String(html||'')
      .replace(/<!--jmr-cierre-start-->[\s\S]*?<!--jmr-cierre-end-->/gi,'');
    var doc=new DOMParser().parseFromString(safeHtml(raw),'text/html');
    // Ocultar copias de matrices financieras y anexos, jamás borrar del expediente.
    doc.body.querySelectorAll('pre').forEach(function(n){n.remove();});
    var code=String(ticker||'').trim().toUpperCase();
    var calc=/^[A-Z0-9._-]{1,24}$/.test(code)?'calculadora.html?ticker='+encodeURIComponent(code):'calculadora.html';
    doc.body.querySelectorAll('a[href^="#calculo-"],a[href^="#calculo_"]').forEach(function(n){
      var p=n.closest('p');
      if(p && p.textContent.trim().replace(/\s+/g,' ').toLowerCase()==='ver cálculo')p.remove();
      else {n.setAttribute('href',calc);n.textContent='Consultar cálculo en Calculadora DCF ↗';}
    });
    doc.body.querySelectorAll('details').forEach(function(n){
      var heading=n.querySelector('summary');
      var title=heading?normalizeText(heading.textContent):'';
      if(/calcul|sensibilidad|auditoria|historica|historico|revision|metodologia/.test(title) && (n.querySelector('table')||title.indexOf('histor')>=0||title.indexOf('revision')>=0))n.remove();
    });
    doc.body.querySelectorAll('table').forEach(function(n){
      var rows=n.querySelectorAll('tr'),cells=Array.from(n.querySelectorAll('td'));
      if(rows.length<3||cells.length<4)return;
      var numeric=cells.filter(function(c){
        var txt=c.textContent.trim();
        return /\d/.test(txt) && txt.split(/\s+/).length<16;
      }).length;
      if(numeric/cells.length>=0.35)n.remove();
    });
    return doc.body.innerHTML;
  }

  function navigableAnalysis(html, scope) {
    var doc = new DOMParser().parseFromString(safeHtml(html), 'text/html');
    var headings = Array.from(doc.body.querySelectorAll('h2,h3'));
    if (!headings.length) return { toc: '', body: doc.body.innerHTML };
    var used = {};
    var items = headings.map(function (heading, index) {
      var label = heading.textContent.trim();
      var slug = normalizeText(label).replace(/\s+/g, '-').slice(0, 70) || 'seccion-' + (index + 1);
      var base = 'indice-' + scope + '-' + slug;
      used[base] = (used[base] || 0) + 1;
      var id = base + (used[base] > 1 ? '-' + used[base] : '');
      heading.id = heading.id || id;
      id = heading.id;
      return '<li class="toc-' + heading.tagName.toLowerCase() + '"><a href="#' + escapeHtml(id) + '">' + escapeHtml(label) + '</a></li>';
    });
    return {
      toc: '<nav class="research-toc" aria-label="Tabla de contenidos"><h2>Tabla de contenidos</h2><ol>' + items.join('') + '</ol></nav>',
      body: doc.body.innerHTML
    };
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
    var known = REQUIRED.concat(['Las 5 fuerzas de Porter', 'Análisis financiero histórico',
      'Auditoría de cifras y supuestos del Modelo JMR', 'Escenarios cualitativos de largo plazo',
      'FODA de síntesis', 'Síntesis final']);
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    var out = [], para = [];
    function flush() { if (para.length) { out.push('<p>' + escapeHtml(para.join(' ')) + '</p>'); para = []; } }
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) { flush(); return; }
      var normalized = normalizeText(line.replace(/^\d+\.\s*/, '').replace(/[:.]$/, ''));
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
    if (state.articleHtml && state.calculationHtml) {
      var matches=Array.from(state.articleHtml.matchAll(/<h2\b[^>]*>\s*(\d+)\.\s*[^<]+<\/h2>/gi))
      var sections=new Set(matches.map(function(m){return Number(m[1]);}));
      var complete=Array.from({length:18},function(_,i){return i+1;}).every(function(i){return sections.has(i);});
      var c1=document.createElement('span');
      c1.textContent=(complete?'✓ ':'⚠ ')+
        'Nivel 1 · Análisis fundamental ('+sections.size+'/18 apartados)';
      c1.className=complete?'ok':'';
      holder.appendChild(c1);
      var c2=document.createElement('span');
      c2.textContent='✓ Nivel 2 · Valoración y cálculos';c2.className='ok';holder.appendChild(c2);
      setStatus('analysisStatus',complete
        ?'Dos niveles disponibles. Verifica fuentes e hipótesis económicas antes de considerar el informe auditado.'
        :'El expediente incluye dos niveles, pero el artículo no conserva los 18 apartados del prompt: requiere restauración editorial.',complete?'ok':'bad');
      return;
    }
    if (!state.html) return;
    var doc = new DOMParser().parseFromString(state.html, 'text/html');
    var headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4')).map(function (h) { return normalizeText(h.textContent); });
    var missing = 0;
    REQUIRED.forEach(function (name) {
      var ok = headings.some(function (h) { return h.replace(/^\d+\s+/, '') === normalizeText(name); });
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
  // Marca como .num las celdas numéricas de las tablas del análisis (montos,
  // porcentajes, múltiplos) para alinearlas a la derecha; si la mayoría de una
  // columna es numérica, también su encabezado.
  var NUM_CELL = /^[\s(]*[~≈≥≤<>]?\s*[-−+]?\s*(US\$|R\$|DKK|CHF|€|\$)?\s*[-−+]?\d[\d.,]*\s*(%|x|pp|pb|M|MM|mill\.?|millones)?\s*\)?(\s*\([^)]{0,24}\))?\s*$/i;
  function markNumericCells(root) {
    if (!root) return;
    if (typeof JmrMethodDetails !== 'undefined') JmrMethodDetails.fold(root);
    root.querySelectorAll('table:not(.jvb-table)').forEach(function (t) {
      var cols = {};
      t.querySelectorAll('tbody tr').forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (c, i) {
          var txt = c.textContent.trim(), isNum = txt.length > 0 && txt.length < 32 && NUM_CELL.test(txt);
          if (isNum) c.classList.add('num');
          cols[i] = cols[i] || { n: 0, t: 0 };
          if (txt && txt !== '—') { cols[i].t++; if (isNum) cols[i].n++; }
        });
      });
      var head = t.querySelector('thead tr');
      if (head) Array.prototype.forEach.call(head.children, function (th, i) { if (i > 0 && cols[i] && cols[i].t && cols[i].n / cols[i].t >= 0.6) th.classList.add('num'); });
    });
  }
  function buildLinkedValuationHtml(lv) {
    function money(v) { return v == null || !isFinite(v) ? '—' : '$' + Number(v).toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:2}); }
    function kv(label, value) { return '<div class="linked-kv"><span>' + escapeHtml(label) + '</span><strong>' + value + '</strong></div>'; }
    function zoneKv(label, z) { return z ? kv(label, money(z.min) + ' – ' + money(z.max)) : ''; }
    var z = lv.zonas || {};
    // Tablero compartido (valuation-board.js): el DCF es el valor intrínseco y
    // va primero; múltiplos juntos, por método y ponderado, hoy o FY+3.
    var board = typeof JmrValueBoard !== 'undefined' ? JmrValueBoard.fromRecord(lv, { precioLbl: 'Precio guardado' }) : null;
    var boardHtml = board && JmrValueBoard.hasData(board) ? JmrValueBoard.html(board, { hero: true, compactMethods: true }) : '';
    var visorLink = lv.sourcePath ? '<a class="linked-visor-link" href="visor.html?path=' + encodeURIComponent(lv.sourcePath) + (typeof jmrMercadoQS === 'function' ? jmrMercadoQS() : '') + '">Ver en el Visor →</a>' : '';
    var zoneBasis = lv.baseMOS === 'dcfBase' ? 'Zona Value (banda histórica; el MOS va sobre DCF Base)' : (lv.baseMOS === 'valorEsperado' ? 'Zona Value (sobre el DCF esperado)' : 'Zona Value (sobre el objetivo FY+3)');
    var zones = zoneKv(zoneBasis, z.value) + zoneKv('Zona Deep Value', z.deepValue) + zoneKv('Zona histórica', z.historica);
    return '<section class="valuation-block linked-valuation"><span class="linked-tag">✓ Vinculado con el Visor · ' + escapeHtml(lv.sourcePath || '') + '</span>' + visorLink + '<h2>Valoración cuantitativa (Visor)</h2>' +
      boardHtml + '<div class="linked-grid">' + kv('Fecha de valoración', escapeHtml(lv.fechaValoracion || lv.fecha || '—')) +
      kv('Precio al día del análisis', money(lv.precioAnalisis)) +
      kv('Fecha de consulta del precio guardado', escapeHtml(lv.precioReferenciaConsultadoAt || 'No registrada; no equivale a la fecha de valoración')) +
      zones + '</div></section>';
  }
  var editing = false;
  // Decisión del usuario (Comprar / Mantener / Vender) — decision.js. Se
  // guarda dentro del mismo registro del análisis (local y en GitHub).
  function renderDecision() {
    var box = el('decisionBox');
    if (!box || typeof JmrDecision === 'undefined') return;
    if (!state.ticker || !state.html) { box.innerHTML = ''; return; }
    box.innerHTML = JmrDecision.widget(state.decision, state.id || state.ticker);
    var root = box.querySelector('.jmr-dec');
    root.querySelector('.jmr-dec-save').addEventListener('click', function () {
      var btn = this, v = JmrDecision.read(root);
      state.decision = JmrDecision.build(state.decision, v.valor, v.nota, state.price);
      if (!state.id) state.id = makeId();
      state.updatedAt = new Date().toISOString();
      var record = Object.assign({}, state);
      btn.disabled = true; JmrDecision.setStatus(root, 'Guardando…');
      try { upsertLocal(record); } catch (err) { btn.disabled = false; JmrDecision.setStatus(root, 'No cabe en el almacenamiento local.', false); return; }
      remoteSave(record).then(function (saved) {
        if (saved) { upsertLocal(saved); state.remotePath = saved.remotePath; state.remoteSha = saved.remoteSha; }
        renderDecision(); renderLibrary();
        var r2 = el('decisionBox').querySelector('.jmr-dec');
        JmrDecision.setStatus(r2, saved ? 'Decisión guardada en tu repositorio de GitHub.' : 'Guardada solo en este navegador: conecta GitHub para que quede a salvo.', !!saved);
      }).catch(function (err) { JmrDecision.setStatus(root, 'Guardada localmente, pero GitHub falló: ' + err.message, false); btn.disabled = false; });
    });
  }


  function linkedMultiplesLevel2(lv) {
    if(!lv || typeof JmrValueBoard==='undefined' || !JmrValueBoard.fromRecord) return '';
    var d=JmrValueBoard.fromRecord(lv,{precioLbl:'Referencia guardada'}),
      i=d&&d.impliedMultiples,market=d&&d.marketComparison;
    if(!i || !i.metodos || !i.metodos.length)return '';
    var by=Object.create(null);
    (market&&market.metodos||[]).forEach(function(q){by[String(q.nombre||'').toUpperCase()]=q;});
    function f(v){return typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2})+'×':'N/D';}
    function pct(v){return typeof v==='number'&&Number.isFinite(v)?(v>0?'+':'')+(v*100).toLocaleString('es-CO',{minimumFractionDigits:1,maximumFractionDigits:1})+'%':'N/D';}
    var trs=i.metodos.map(function(m){
      var q=by[String(m.nombre||'').toUpperCase()]||{};
      return '<tr><td>'+escapeHtml(m.nombre)+'</td>'+['conservador','base','optimista'].map(function(k){
        var v=m[k],w=q.mercado_FY3_equivalente&&q.mercado_FY3_equivalente[k],delta=typeof v==='number'&&v>0&&typeof w==='number'?w/v-1:null;
        return '<td>'+f(v)+'</td><td>'+f(w)+'</td><td>'+pct(delta)+'</td>';
      }).join('')+'</tr>';
    }).join('');
    var note=market?'Referencia de mercado: '+escapeHtml(market.fechaCorte||'fecha no verificada')+
      '; precio '+escapeHtml(market.precioMercado)+'; debe verificarse que corresponda a la cotización vigente.':
      'Precio de mercado LTM y equivalentes FY+3: N/D hasta obtener información compatible.';
    return '<section class="jmr-dcf-multiples-annex"><h2>Múltiplos y cotización frente al DCF conservador, base y optimista · FY+3</h2>'+
      '<p>Cada historia usa su propio DCF y sus métricas FY+3. Mercado FY+3 = múltiplo equivalente al precio de referencia guardado, NO múltiplo LTM. Δ = múltiplo mercado FY+3 / múltiplo DCF FY+3 − 1.</p>'+
      '<table><thead><tr><th>Múltiplo</th>'+['Conservador','Base','Optimista'].map(function(k){return '<th>DCF '+k+'</th><th>Mercado FY+3 '+k+'</th><th>Δ '+k+'</th>';}).join('')+
      '</tr></thead><tbody>'+trs+'</tbody></table><p>'+note+'</p><p>No se modifica el DCF ni se asume que EV/FCF = EV/FCFF o P/FCF = P/FCFE. Los múltiplos LTM reales requieren fuente y fecha propias.</p></section>';
  }

  // Destacado del Nivel 1: usar exactamente el valor Base que presenta
  // el tablero oficial del Nivel 2, nunca el promedio ni los múltiplos.
  function intrinsicBaseCard(lv) {
    var value = null, currency = 'USD', method = 'DCF base hoy · por acción';
    if (lv && typeof JmrValueBoard !== 'undefined' &&
        typeof JmrValueBoard.fromRecord === 'function') {
      var board = JmrValueBoard.fromRecord(lv);
      currency = board.currency === 'COP' ? 'COP' : 'USD';
      if (board.holding) {
        // Las holdings se valoran por SOTP; no presentar su NAV como un DCF.
        value = board.holding.nav && board.holding.nav.base;
        method = 'SOTP base · por acción (holdings)';
      } else if (typeof JmrValueBoard.primaryValues === 'function') {
        value = JmrValueBoard.primaryValues(board).base;
      }
    }
    var valid = typeof value === 'number' && Number.isFinite(value);
    var amount = valid ? (currency === 'COP' ? 'COP ' : 'US$ ') +
      value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/D';
    var note = valid ? method + ' · valoración vinculada' :
      'Sin resultado Base verificable. Vincula una valoración del Visor para mostrarlo.';
    return '<div class="jmr-intrinsic-base-card" role="group" aria-label="Valor intrínseco base">' +
      '<span class="jmr-intrinsic-base-label">Valor intrínseco base:</span>' +
      '<strong class="jmr-intrinsic-base-value">' + escapeHtml(amount) + '</strong>' +
      '<span class="jmr-intrinsic-base-note">' + escapeHtml(note) + '</span></div>';
  }

  function renderPreview() {
    if(liveModelSession&&liveModelOwner!==state){liveModelSession.dispose();liveModelSession=null;liveModelOwner=null;}
    el('previewCompany').textContent=state.company||state.title||'Nuevo análisis';
    el('previewTicker').textContent=state.ticker||'—';
    JmrAuditLinks.mount(el('jmrAuditResearch'), state.ticker);
    el('previewPrice').textContent=state.price!=null?new Intl.NumberFormat('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(state.price):'—';
    el('previewPriceNote').textContent=state.priceFetchedAt?new Date(state.priceFetchedAt).toLocaleDateString('es-CO'):'';
    var logo=el('previewLogo'),logoSrc=logoForRecord(state);
    if(logoSrc){logo.src=logoSrc;logo.alt='Logo de '+(state.company||state.ticker);logo.hidden=false;}
    else {logo.hidden=true;logo.removeAttribute('src');}
    renderDecision();
    if(editing)return;
    var body=el('previewBody');
    el('editorToolbar').hidden=!(state.articleHtml||state.html||state.valuationHtml||state.linkedValuation||state.news);
    if(!state.articleHtml&&!state.html&&!state.valuationHtml&&!state.linkedValuation&&!state.news){
      body.innerHTML='<div class="preview-empty">Abre un análisis guardado para consultar tesis y valoración.</div>';
      renderEditorToolbar();return;
    }
    var ticker=String(state.ticker||'').trim().toUpperCase();
    var editorial=editorialArticles[ticker];
    var rawArticle=state.articleHtml||(editorial&&editorial.html)||state.html||'';
    var article=navigableAnalysis(articleForReading(rawArticle,ticker),'articulo');
    var auditLinks=/^[A-Z0-9._-]{1,24}$/.test(ticker)?'<p class="jmr-audit-links no-print"><strong>Auditorías de '+ticker+':</strong> <a href="auditorias.html?ticker='+encodeURIComponent(ticker)+'">Auditoría narrativa ↗</a> · <a href="auditoria-integral.html?ticker='+encodeURIComponent(ticker)+'">Auditoría integral ↗</a> · <a href="historicos.html?ticker='+encodeURIComponent(ticker)+'">Estado del estudio ↗</a></p>':'';
    var technical=state.calculationHtml?navigableAnalysis(state.calculationHtml,'calculos'):null;
    var linked=state.linkedValuation?buildLinkedValuationHtml(state.linkedValuation):'';
    var extra=state.valuationHtml?'<section class="valuation-block"><h3>Tablas vinculadas de valoración</h3>'+state.valuationHtml+'</section>':'';
    var detailsId='jmrTechnicalLevel';
    var editHref=/^[A-Z0-9._-]{1,24}$/.test(ticker)?'editor-hoja.html?ticker='+encodeURIComponent(ticker):'editor-hoja.html';
    var technicalIntroduction='<p class="jmr-tech-intro">Información cuantitativa de la valoración publicada: estados financieros, ratios, supuestos, flujos, sensibilidad y múltiplos. Es la referencia de la hoja, no una simulación hipotética.</p>'+
      '<p><a class="jmr-open-calc" href="'+editHref+'">Editar datos fuente en la hoja ↗</a> · La edición no modifica el artículo automáticamente.</p>';
    var level2='<details class="jmr-research-details" id="'+detailsId+'">'+
      '<summary>NIVEL 2 · VALORACIÓN, ESTADOS FINANCIEROS Y SENSIBILIDADES</summary>'+
      '<div class="jmr-technical-content">'+technicalIntroduction+
      (linked?'<section class="jmr-valuation-summary" aria-label="Tarjeta de valoración"><h2>Resultado de valoración</h2>'+linked+'</section>':'')+
      extra+
      '<details class="jmr-research-details jmr-calculation-appendix"><summary>Operaciones, fórmulas y conciliaciones del expediente</summary>'+
      (technical?technical.toc+technical.body:'<p>El expediente todavía no contiene un anexo de cálculos separado.</p>')+
      linkedMultiplesLevel2(state.linkedValuation)+'</details>'+
      '<details class="jmr-research-details jmr-financial-appendix"><summary>Estados financieros, ratios, escenarios y matrices de sensibilidad</summary>'+
      '<div data-jmr-extended-sheets></div></details>'+
      '</div></details>';
    var actions='<div class="jmr-research-navigation" role="navigation" aria-label="Navegación entre análisis y simulador">'+
      '<p>La tesis de inversión está en el Nivel 1. La valoración real y sus tablas están en el Nivel 2. La calculadora permite probar escenarios sin modificar el expediente.</p>'+
      calculatorLink(ticker)+'</div>';
    body.innerHTML='<div class="research-document jmr-reading-view">'+
      '<section class="jmr-editorial-article" id="jmrArticleLevel" aria-label="Nivel 1 · Análisis fundamental">'+
      intrinsicBaseCard(state.linkedValuation)+
      '<div class="jmr-editorial-label">NIVEL 1 · ANÁLISIS FUNDAMENTAL</div>'+
      actions+auditLinks+article.toc+'<div id="editableContent">'+article.body+'</div>'+renderNews()+
      '</section>'+level2+'</div>';
    markNumericCells(body);
    JmrDisplayNumber.formatTable(body);
    var detail=el(detailsId),appendix=detail&&detail.querySelector('.jmr-financial-appendix'),reportMounted=false;
    function mountQuantitative(){
      if(reportMounted||!appendix||!appendix.open)return;
      reportMounted=true;
      if(typeof JmrReportSheets!=='undefined'&&state.linkedValuation)JmrReportSheets.mount(appendix,state.linkedValuation);
    }
    if(appendix)appendix.addEventListener('toggle',mountQuantitative);
    renderEditorToolbar();
    body.onclick=function(event){window.JmrReportAnchors.navigate(event,body);};
  }

  // Edición directa del análisis (incluye imágenes) sin tener que volver
  // a subir el documento entero: "Editar contenido" vuelve editable el
  // bloque que vino del documento subido (#editableContent, ver
  // renderPreview) y muestra una barra con negrita/cursiva/insertar
  // imagen. "Aplicar cambios" comprime cualquier imagen nueva (mismo
  // pipeline que ya usa la subida de documentos) y vuelca el HTML
  // editado a state.html — recién ahí queda igual que si se hubiera
  // subido un documento nuevo; sigue haciendo falta "Guardar análisis"
  // para persistirlo. Mientras se edita, se ocultan los botones de
  // guardar/limpiar/etc. para no dejar aplicar un guardado a mitad de
  // una edición sin aplicar.
  function setEditing(on) {
    if (on) {
      // El editor recibe siempre el HTML íntegro; la limpieza solo afecta lectura.
      var complete=(state.articleHtml && state.calculationHtml)?state.articleHtml:state.html;
      var area=el('editableContent');
      if(area && complete)area.innerHTML=safeHtml(complete);
    }
    editing = on;
    el('editorActions').hidden = on;
    var content = el('editableContent');
    if (content) {
      content.contentEditable = on ? 'true' : 'false';
      if (on) {
        try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
        content.focus();
      }
    }
    renderEditorToolbar();
  }
  function applyContentEdits() {
    var content = el('editableContent');
    if (!content) { setEditing(false); return; }
    setStatus('analysisStatus', 'Aplicando cambios…');
    compressEmbeddedImages(content.innerHTML).then(function (compressed) {
      if (state.articleHtml && state.calculationHtml) state.articleHtml = safeHtml(compressed);
      else state.html = safeHtml(compressed);
      setEditing(false);
      renderPreview();
      checkQuality();
      setStatus('analysisStatus', 'Cambios aplicados en el editor — presiona "Guardar análisis" para guardarlos definitivamente.', 'ok');
    }).catch(function (err) {
      setStatus('analysisStatus', 'No se pudieron procesar las imágenes: ' + err.message, 'bad');
    });
  }
  function renderEditorToolbar() {
    var bar = el('editorToolbar');
    if (!bar || bar.hidden) return;
    if (!editing) {
      bar.innerHTML = '<button class="btn" id="editContentBtn" type="button">✎ Editar contenido</button><span class="help">Permite corregir texto y agregar o quitar imágenes sin volver a subir el documento.</span>';
      el('editContentBtn').addEventListener('click', function () { setEditing(true); });
      return;
    }
    bar.innerHTML = '<button class="btn" id="boldBtn" type="button" title="Negrita"><b>N</b></button>' +
      '<button class="btn" id="italicBtn" type="button" title="Cursiva"><i>C</i></button>' +
      '<button class="btn" id="insertImageBtn" type="button">Insertar imagen</button>' +
      '<input type="file" id="insertImageInput" accept="image/png,image/jpeg,image/webp,image/gif" hidden>' +
      '<button class="btn primary" id="applyEditBtn" type="button">Aplicar cambios</button>' +
      '<button class="btn" id="cancelEditBtn" type="button">Cancelar</button>' +
      '<span class="help">Seleccioná una imagen y presioná Supr/Backspace para quitarla.</span>';
    el('boldBtn').addEventListener('click', function () { document.execCommand('bold'); el('editableContent').focus(); });
    el('italicBtn').addEventListener('click', function () { document.execCommand('italic'); el('editableContent').focus(); });
    el('insertImageBtn').addEventListener('click', function () { el('insertImageInput').click(); });
    el('insertImageInput').addEventListener('change', function () {
      var file = this.files && this.files[0]; if (!file) return;
      var input = this;
      var reader = new FileReader();
      reader.onload = function () {
        var content = el('editableContent');
        content.focus();
        try { document.execCommand('insertImage', false, reader.result); }
        catch (e) { content.innerHTML += '<img src="' + reader.result + '">'; }
        input.value = '';
      };
      reader.readAsDataURL(file);
    });
    el('applyEditBtn').addEventListener('click', applyContentEdits);
    el('cancelEditBtn').addEventListener('click', function () { setEditing(false); renderPreview(); });
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
      editing = false; state.articleHtml = ''; state.calculationHtml = ''; state.analysisSchema = ''; state.html = safeHtml(html); state.sourceName = file.name; checkQuality(); syncFields();
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
    // Fuente única: registro vigente de Modelo-JMR-datos. Raw evita el
    // límite anónimo de GitHub API y no recopia 32 tablas en cada artículo.
    if(!/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(path))
      return Promise.reject(new Error('Ruta de valoración no válida'));
    var url='https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR-datos/main/'+
      path.split('/').map(encodeURIComponent).join('/');
    return fetch(url,{cache:'no-store'}).then(function(res){
      if(!res.ok)throw new Error('HTTP '+res.status);
      return res.json();
    }).catch(function(){
      return fetch(GH_API+path,{headers:ghHeaders(),cache:'no-store'}).then(function(res){
        if(!res.ok)throw new Error('HTTP '+res.status);
        return res.json();
      }).then(function(data){return JSON.parse(b64Decode(data.content.replace(/\n/g,'')));});
    });
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
      state.linkedValuation = { precio: rec.precio, fecha: rec.fecha, zonas: rec.zonas, objetivoPonderado: rec.objetivoPonderado, valorPresentePonderado: rec.valorPresentePonderado, descuentoMultiples: rec.descuentoMultiples, metodos: rec.metodos, hojas: rec.hojas, cagr: rec.cagr, mos: rec.mos, hojaGoogle: rec.hojaGoogle, valorEsperado: rec.valorEsperado, sensibilidadDCF: rec.sensibilidadDCF, revision: rec.revision, valoracionHolding: rec.valoracionHolding, currency: rec.currency, ticker: rec.ticker, precioReferenciaConsultadoAt: rec.precioReferenciaConsultadoAt, precioReferenciaFuente: rec.precioReferenciaFuente, multiplosImplicitosDCF: rec.multiplosImplicitosDCF, cotizacionMultiples: rec.cotizacionMultiples, sourcePath: found.path };
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
  var liveModelSession=null, liveModelOwner=null;
  // Sin formulario de edición aquí: la lectura es de solo consulta. El Editor de
  // hoja es una página separada con guardado confirmado, no al salir del campo.
  function startLiveModel(){
    if(typeof JmrModelSync==='undefined'||!state.ticker)return;
    if(liveModelSession&&liveModelOwner===state)return;
    if(liveModelSession)liveModelSession.dispose();
    var owner=state,key=String(state.ticker).toUpperCase(),active=true,busy=false;
    liveModelOwner=owner;
    function refresh(){
      if(!active||busy||state!==owner)return;
      busy=true;
      JmrModelSync.load(key).then(function(snapshot){
        if(!active||state!==owner)return;
        var rec=JmrModelSync.record(snapshot);
        if(!rec)return;
        var old=owner.linkedValuation||{};
        var changed=JSON.stringify(old.liveModel||null)!==JSON.stringify(rec.liveModel||null);
        owner.linkedValuation=rec;
        renderPreview();
        // No se modifica ninguna celda del libro, ni se república el informe.
        if(changed) setStatus('linkVisorStatus',
          'Valores actuales leídos de la hoja para '+key+'. Revisa el texto histórico antes de republicar.','ok');
      }).catch(function(err){
        if(active&&state===owner)setStatus('linkVisorStatus',
          'La lectura de la hoja no se completó ('+err.message+'). Se conservan los datos publicados.','bad');
      }).finally(function(){busy=false;});
    }
    function updated(e){if(e.detail&&e.detail.ticker===key)refresh();}
    window.addEventListener('jmr-model-updated',updated);
    liveModelSession={dispose:function(){active=false;window.removeEventListener('jmr-model-updated',updated);}};
    refresh();
  }
  function checkLinkedValuationFreshness() {
    startLiveModel();
    if(!state.ticker)return;
    var origin=state,ticker=String(state.ticker).toUpperCase();
    var linked=state.linkedValuation||{};
    var knownPath=linked.sourcePath||
      (state.linkedValuationAtResearch&&state.linkedValuationAtResearch.sourcePath)||
      (state.valuationSync&&state.valuationSync.sourcePath)||'';
    function accept(rec,path){
      // Protección contra respuestas tardías y archivos de otra empresa.
      if(state!==origin||!rec||String(rec.ticker||'').toUpperCase()!==ticker||state.linkedValuation&&state.linkedValuation.liveModel)return;
      state.linkedValuation=Object.assign({},state.linkedValuation||{},{
        sourcePath:path,ticker:rec.ticker,precio:rec.precio,precioAnalisis:rec.precioAnalisis,
        fecha:rec.fecha,fechaValoracion:rec.fecha,zonas:rec.zonas,
        objetivoPonderado:rec.objetivoPonderado,valorPresentePonderado:rec.valorPresentePonderado,
        descuentoMultiples:rec.descuentoMultiples,metodos:rec.metodos,
        hojas:rec.hojas,cagr:rec.cagr,mos:rec.mos,baseMOS:rec.baseMOS,
        precioMOS:rec.precioMOS,hojaGoogle:rec.hojaGoogle,
        valorEsperado:rec.valorEsperado,valoracionHolding:rec.valoracionHolding,
        currency:rec.currency,precioReferenciaConsultadoAt:rec.precioReferenciaConsultadoAt,
        precioReferenciaFuente:rec.precioReferenciaFuente,multiplosImplicitosDCF:rec.multiplosImplicitosDCF,
        cotizacionMultiples:rec.cotizacionMultiples,crecimientoImplicito:rec.crecimientoImplicito,
        reportMigration:rec.reportMigration,reportSchema:rec.reportSchema
      });
      if(!rec.hojas||!Object.keys(rec.hojas).length)
        setStatus('linkVisorStatus','Esta valoración no tiene anexos publicados; abre la hoja fuente para revisarlos.','bad');
      else setStatus('linkVisorStatus','Anexos y matrices sincronizados desde la valoración vigente de '+ticker+'.','ok');
      renderPreview();
    }
    function load(path){
      return fetchJsonFile(path).then(function(rec){accept(rec,path);}).catch(function(err){
        if(state===origin)setStatus('linkVisorStatus',
          'No se pudo sincronizar la valoración original: '+err.message+
          '. Se conservan los datos guardados sin sustituirlos.', 'bad');
      });
    }
    if(/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(knownPath)){
      load(knownPath);return;
    }
    // Para investigaciones antiguas sin sourcePath, resolver por ticker sin
    // reutilizar nunca un archivo de otra empresa.
    listValoraciones().then(function(files){
      var matches=files.filter(function(f){return tickerFromValoracionName(f.name).toUpperCase()===ticker;});
      if(!matches.length)return;
      matches.sort(function(a,b){return b.name.localeCompare(a.name);});
      return load(matches[0].path);
    }).catch(function(err){
      if(state===origin)setStatus('linkVisorStatus','No se encontró valoración vinculable: '+err.message,'bad');
    });
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

  // La biblioteca vive en memoria; localStorage es solo una copia. Los 22
  // análisis con sus informes superan los ~5 MB que permite Safari (iPhone)
  // por sitio: antes setItem lanzaba QuotaExceededError dentro de
  // syncRemote(), el error se tragaba y la página mostraba «Todavía no hay
  // análisis guardados» aunque GitHub los tuviera todos. Si no hay espacio,
  // en el navegador quedan solo los análisis que todavía no están en GitHub
  // (los demás se vuelven a bajar al abrir la página).
  var memLibrary = null;
  function getLocalLibrary() {
    if (memLibrary) return memLibrary.slice();
    try { var x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); return Array.isArray(x)?x:[]; } catch(e){return [];}
  }
  // El repositorio conserva todo el historial, pero la portada muestra una
  // sola ficha por ticker. La revisión de catalogo.json tiene prioridad.
  var officialAnalysisPaths = null;
  function preferResearchRecord(candidate, previous) {
    const a=!!(officialAnalysisPaths&&officialAnalysisPaths.has(candidate.remotePath));
    const b=!!(officialAnalysisPaths&&officialAnalysisPaths.has(previous.remotePath));
    if(a!==b)return a;
    const date=r=>Date.parse(r.updatedAt||r.date||'')||0;
    if(date(candidate)!==date(previous))return date(candidate)>date(previous);
    return String(candidate.id||'')>String(previous.id||'');
  }
  function activeResearchList() {
    var groups=Object.create(null);
    getLocalLibrary().filter(function(r){return typeof jmrDelMercado!=='function'||jmrDelMercado(r);}).forEach(function(r){
      var t=String(r.ticker||'').trim().toUpperCase();
      var key=/^[A-Z0-9._-]{1,24}$/.test(t)?t:'SIN_TICKER_'+String(r.id||'');
      if(!groups[key]||preferResearchRecord(r,groups[key]))groups[key]=r;
    });
    return Object.keys(groups).map(function(k){return groups[k];}).sort(function(a,b){
      return String(b.updatedAt||b.date||'').localeCompare(String(a.updatedAt||a.date||''));
    });
  }
  function loadOfficialAnalysisPaths(){
    return fetch('https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR-datos/main/catalogo.json',{cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
      .then(function(c){officialAnalysisPaths=new Set(Array.isArray(c.analisis)?c.analisis:[]);renderLibrary();})
      .catch(function(e){console.warn('Catálogo JMR no disponible: se usa última fecha sin declarar validación.',e.message);});
  }
  function setLocalLibrary(list) {
    memLibrary = list.slice();
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); }
    catch (e) {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.filter(function (r) { return !r.remotePath; }))); }
      catch (e2) { console.warn('No hay espacio en el navegador para la copia local de la biblioteca:', e2); }
    }
  }
  function makeId() { return 'research-' + Date.now() + '-' + Math.random().toString(36).slice(2,7); }
  function cleanRecord(r) { var copy=Object.assign({},r); delete copy.remoteSha; return copy; }
  function upsertLocal(record) {
    var list=getLocalLibrary(), idx=list.findIndex(function(x){return x.id===record.id;});
    if(idx>=0) list[idx]=record; else list.unshift(record);
    setLocalLibrary(list); return list;
  }
  // getGhToken/setGhToken/ghHeaders/b64Encode/b64Decode viven en
  // gh_oauth.js (cargado antes que este archivo) — se reusan acá tal cual
  // para que esta página, el Visor, Mi Bitácora y Portafolio compartan una
  // sola implementación en vez de copias que puedan desincronizarse.
  var getGhToken = GhOAuth.getGhToken;
  var setGhToken = GhOAuth.setGhToken;
  var ghHeaders = GhOAuth.ghHeaders;
  var b64Encode = GhOAuth.b64EncodeUnicode;
  var b64Decode = GhOAuth.b64DecodeUnicode;
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
    var failedPaths = {}, failures = [];
    return fetch(GH_API+'analisis',{headers:ghHeaders(),cache:'no-store'}).then(function(res){
      if(!res.ok)throw new Error('No se pudo cargar la biblioteca de GitHub (HTTP '+res.status+').');
      return res.json();
    }).then(function(files){
      if(!Array.isArray(files))throw new Error('GitHub devolvió una lista de análisis inválida.');
      var jsons=files.filter(function(f){return f.type==='file' && /\.json$/i.test(f.name);});
      // Sin token usamos download_url para no consumir una llamada de API
      // por informe. Con token pedimos el JSON original mediante el media
      // type raw: Contents no incluye content base64 en archivos >1 MB.
      var raw=!getGhToken();
      return Promise.all(jsons.map(function(f){
        var url=(raw&&f.download_url) ? f.download_url : f.url;
        url += (url.indexOf('?')===-1 ? '?' : '&')+'jmr_version='+encodeURIComponent(f.sha||'');
        var options={cache:'no-store'};
        if(!(raw&&f.download_url))options.headers=Object.assign({},ghHeaders(),{Accept:'application/vnd.github.raw+json'});
        return fetch(url,options).then(function(r){
          if(!r.ok)throw new Error('HTTP '+r.status);
          return r.json();
        }).then(function(rec){
          if(!rec || !rec.id || !rec.ticker)throw new Error('Informe inválido');
          rec.remotePath=f.path;rec.remoteSha=f.sha;return rec;
        }).catch(function(err){
          failedPaths[f.path]=true;failures.push(f.name+': '+err.message);return null;
        });
      }));
    }).then(function(remote){
      // Los borrados remotos no reviven. Solo conservamos la copia local
      // de un archivo aún presente que no se pudo descargar esta vez.
      var map={}; getLocalLibrary().filter(function(r){return !r.remotePath||failedPaths[r.remotePath];}).concat(remote.filter(Boolean)).forEach(function(r){var old=map[r.id];if(!old||String(r.updatedAt||'')>String(old.updatedAt||''))map[r.id]=r;});
      var list=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date));});
      setLocalLibrary(list);renderLibrary();
      if(failures.length)throw new Error(list.length+' análisis disponibles. No se pudieron actualizar '+failures.length+': '+failures.join('; ')+'. Pulsa Sincronizar para reintentar.');
      return list.length;
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
      syncRemote().then(pushLocalOnlyToRemote).catch(function (err) { setStatus('libraryStatus',err.message,'bad'); });
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
    return fetch(GH_API + path + '?ref=' + sha, { headers: Object.assign({}, ghHeaders(), { Accept: 'application/vnd.github.raw+json' }), cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
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
  function refreshHistoryButton() {
    el('historyBtn').hidden = !state.remotePath || !getGhToken();
    // El PDF real (api/pdf.js) necesita una URL reproducible — solo existe
    // una vez que el análisis ya se guardó en Modelo-JMR-datos (remotePath).
    el('downloadRealPdfBtn').hidden = !state.remotePath;
  }
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
    state.market = jmrEsCOP(state) || JMR_MERCADO === 'colombia' ? 'BVC' : 'international';
    if (state.market === 'BVC') state.currency = 'COP';
    state.updatedAt=new Date().toISOString();
    var saved=Object.assign({},state);
    if(saved.linkedValuation&&saved.linkedValuation.sourcePath){
      saved.linkedValuation=Object.assign({},saved.linkedValuation);
      delete saved.linkedValuation.hojas;
      // Volver a leer hojas al abrir evita copias obsoletas y registros >1 MB.
    }
    return saved;
  }
  el('saveBtn').addEventListener('click',function(){
    var btn=this,record;
    try{record=buildRecord();}catch(err){setStatus('saveStatus',err.message,'bad');return;}
    btn.disabled=true;setStatus('saveStatus','Guardando…');
    try{upsertLocal(record);}catch(err){btn.disabled=false;setStatus('saveStatus','No cabe en el almacenamiento local. Exporta la biblioteca o reduce el documento.','bad');return;}
    remoteSave(record).then(function(saved){if(saved)upsertLocal(saved);state=Object.assign(state,saved||record);refreshHistoryButton();renderLibrary();setStatus('saveStatus',saved?'Guardado localmente y en tu repositorio de GitHub — a salvo aunque cambies de navegador.':'Guardado SOLO en este navegador — conecta GitHub arriba para que quede a salvo también en tu repositorio.',saved?'ok':'bad');}).catch(function(err){setStatus('saveStatus','Guardado localmente, pero GitHub falló: '+err.message,'bad');}).finally(function(){btn.disabled=false;});
  });

  function fillEditor(rec) {
    jmrAjustarMercado(rec);
    editing=false;
    state=Object.assign(freshState(),rec);
    el('analysisSettings').open=false;
    el('tickerInput').value=state.ticker||'';el('companyInput').value=state.company||'';el('titleInput').value=state.title||'';el('dateInput').value=state.date||'';el('newsInput').value=state.news||'';
    checkQuality();renderPreview();refreshHistoryButton();el('historyPanel').hidden=true;el('historyPanel').innerHTML='';
    ['quoteStatus','analysisStatus','valuationStatus','linkVisorStatus','newsStatus'].forEach(function(id){setStatus(id,'');});
    setStatus('saveStatus','Análisis cargado. Puedes editar sus datos o reemplazar los archivos.');switchTab('editor');
    checkLinkedValuationFreshness();
  }
  function resetEditor() {
    editing=false;
    state=freshState();['tickerInput','companyInput','titleInput','newsInput'].forEach(function(id){el(id).value='';});el('dateInput').value=state.date;el('logoInput').value='';el('analysisFile').value='';el('valuationFile').value='';el('qualityChips').innerHTML='';
    el('analysisSettings').open=true;
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
  // html2canvas 1.x no entiende los colores modernos (oklab/oklch, color(…)):
  // Chrome y Safari los devuelven así en el estilo calculado de cualquier
  // regla con color-mix(), y el PDF abortaba con «unsupported color function
  // "oklab"». En la copia que se rasteriza se reemplazan por su rgba
  // equivalente, que el propio navegador calcula pintando un píxel.
  var MODERN_COLOR = /okl(?:ab|ch)\(|(?:^|[^a-z-])(?:lab|lch|color)\(/i;
  var COLOR_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color',
    'border-left-color', 'outline-color', 'text-decoration-color', 'fill', 'stroke', 'caret-color', 'column-rule-color'];
  function fixModernColors(doc) {
    var cv = doc.createElement('canvas'); cv.width = cv.height = 1;
    var ctx = cv.getContext('2d', { willReadFrequently: true }), cache = {};
    function toRgba(v) {
      if (cache[v]) return cache[v];
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillStyle = v; ctx.fillRect(0, 0, 1, 1);
      var d = ctx.getImageData(0, 0, 1, 1).data;
      return (cache[v] = 'rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',' + (d[3] / 255).toFixed(3) + ')');
    }
    var win = doc.defaultView, nodes = [doc.documentElement, doc.body].concat(Array.prototype.slice.call(doc.body.querySelectorAll('*')));
    nodes.forEach(function (n) {
      var cs = win.getComputedStyle(n);
      COLOR_PROPS.forEach(function (prop) { var v = cs.getPropertyValue(prop); if (v && MODERN_COLOR.test(v)) n.style.setProperty(prop, toRgba(v), 'important'); });
      ['box-shadow', 'text-shadow', 'background-image'].forEach(function (prop) {
        var v = cs.getPropertyValue(prop); if (v && MODERN_COLOR.test(v)) n.style.setProperty(prop, 'none', 'important');
      });
    });
  }
  // En pantalla las tablas anchas se desplazan de lado; en la hoja A4 no hay
  // desplazamiento, así que en la copia del PDF se ajustan al ancho de la
  // página (letra algo menor y celdas que parten líneas).
  var PDF_TABLE_CSS = 'table{display:table!important;width:100%!important;max-width:100%!important;table-layout:auto!important;' +
    'font-size:9px!important}th,td{white-space:normal!important;overflow-wrap:anywhere;word-break:normal;padding:3px 4px!important;' +
    'min-width:0!important}pre,code{white-space:pre-wrap!important;overflow-wrap:anywhere}' +
    '*{overflow:visible!important}';
  function pdfOnClone(doc) {
    var st = doc.createElement('style'); st.textContent = PDF_TABLE_CSS; doc.head.appendChild(st);
    fixModernColors(doc);
  }
  // Un informe completo mide ~40.000 px de alto: rasterizado de una sola vez
  // supera el tamaño máximo de un canvas (Chrome: 32.767 px de alto; Safari en
  // iPhone: ~16,7 millones de píxeles) y el PDF salía en blanco o fallaba.
  // Se rasteriza por tramos (cortando en los títulos de sección) y cada tramo
  // sigue en una página nueva del mismo PDF.
  var PDF_SCALE = 1.5, PDF_BLOCK_PX = 3500, PDF_PAGE_PX = Math.floor((210 - 2 * 10) * 96 / 25.4);  // medido en pantalla; en A4 el tramo crece ~1,5×
  function pxH(n) { return n.getBoundingClientRect().height || 0; }
  // Baja por los envoltorios de un solo hijo alto (p. ej. .preview-body >
  // .research-document) hasta el contenedor que tiene las secciones.
  function pdfDescend(node) {
    var path = [node];
    for (;;) {
      var kids = Array.prototype.slice.call(node.children);
      if (kids.length > 6) break;
      var H = pxH(node), bigs = kids.filter(function (k) { return pxH(k) > 0.6 * H; });
      if (bigs.length !== 1) return { path: path, cols: bigs.length > 1 ? bigs : null };
      node = bigs[0]; path.push(node);
    }
    return { path: path, cols: null };
  }
  // Copia superficial de la cadena de envoltorios con los nodos indicados al
  // fondo; los hermanos de cada envoltorio (encabezados, notas) van en el
  // primer tramo (los anteriores) y en el último (los posteriores).
  function pdfChain(path, nodes, first, last) {
    var top = null, parent = null;
    path.forEach(function (lvl, li) {
      var c = lvl.cloneNode(false);
      c.removeAttribute('id');
      if (li === 0) top = c;
      else {
        var sib = Array.prototype.slice.call(path[li - 1].children), at = sib.indexOf(lvl);
        if (first) sib.slice(0, at).forEach(function (x) { parent.appendChild(x.cloneNode(true)); });
        parent.appendChild(c);
        if (last) sib.slice(at + 1).forEach(function (x) { parent.appendChild(x.cloneNode(true)); });
      }
      parent = c;
    });
    nodes.forEach(function (n) { parent.appendChild(n.cloneNode(true)); });
    return top;
  }
  function pdfChunks(nodes, n) {  // reparte nodos en n trozos de altura parecida
    var tot = nodes.reduce(function (a, k) { return a + pxH(k); }, 0), out = [[]], acc = 0;
    nodes.forEach(function (k) {
      if (out[out.length - 1].length && acc >= tot / n * out.length && out.length < n) out.push([]);
      out[out.length - 1].push(k); acc += pxH(k);
    });
    while (out.length < n) out.push([]);
    return out;
  }
  function pdfBlocks(element) {
    var d = pdfDescend(element), blocks = [];
    var width = function (top) { top.style.width = PDF_PAGE_PX + 'px'; top.style.maxWidth = 'none'; return top; };
    if (!d.cols) {
      var node = d.path[d.path.length - 1], groups = [], cur = [], h = 0;
      Array.prototype.slice.call(node.children).forEach(function (k) {
        var kh = pxH(k);
        if (cur.length && (h + kh > PDF_BLOCK_PX || (/^H[12]$/.test(k.tagName) && h > PDF_BLOCK_PX / 3))) { groups.push(cur); cur = []; h = 0; }
        cur.push(k); h += kh;
      });
      if (cur.length) groups.push(cur);
      return groups.map(function (g, gi) { return width(pdfChain(d.path, g, gi === 0, gi === groups.length - 1)); });
    }
    // Comparador: dos columnas largas lado a lado. Se cortan por secciones
    // emparejadas (sección i de A junto a la sección i de B) para que cada
    // tramo quepa en un canvas y la comparación siga alineada.
    var cols = d.cols.map(function (col) {
      var cd = pdfDescend(col), cont = cd.path[cd.path.length - 1], secs = [[]];
      Array.prototype.slice.call(cont.children).forEach(function (k) {
        if (/^H2$/.test(k.tagName) && secs[secs.length - 1].length) secs.push([]);
        secs[secs.length - 1].push(k);
      });
      return { path: cd.path, secs: secs };
    });
    var nSec = Math.max.apply(null, cols.map(function (c) { return c.secs.length; })), units = [];
    for (var i = 0; i < nSec; i++) {
      var parts = cols.map(function (c) { return c.secs[i] || []; });
      var hmax = Math.max.apply(null, parts.map(function (p) { return p.reduce(function (a, k) { return a + pxH(k); }, 0); }));
      var n = Math.max(1, Math.ceil(hmax / PDF_BLOCK_PX));
      var split = parts.map(function (p) { return pdfChunks(p, n); });
      for (var j = 0; j < n; j++) units.push({ parts: split.map(function (sp) { return sp[j]; }), h: hmax / n });
    }
    var groups2 = [], cur2 = null;
    units.forEach(function (u) {
      if (cur2 && cur2.h + u.h <= PDF_BLOCK_PX) { cur2.parts = cur2.parts.map(function (p, ci) { return p.concat(u.parts[ci]); }); cur2.h += u.h; }
      else { cur2 = { parts: u.parts.slice(), h: u.h }; groups2.push(cur2); }
    });
    return groups2.map(function (g, gi) {
      var first = gi === 0, last = gi === groups2.length - 1;
      var colNodes = cols.map(function (c, ci) { return pdfChain(c.path, g.parts[ci], first, last); });
      return width(pdfChain(d.path, colNodes.map(function (n) { return { cloneNode: function () { return n; } }; }), first, last));
    });
  }
  // El margen inferior de cada tramo quedaba a veces solo en una página nueva
  // (páginas en blanco intercaladas): se recortan las filas blancas del final
  // del canvas antes de pasarlo al PDF. html2pdf llama esto con this = worker.
  function trimCanvasBottom() {
    var c = this.prop.canvas, ctx = c.getContext('2d'), w = c.width, y = c.height, step = 64;
    while (y > 0) {
      var y0 = Math.max(0, y - step), d = ctx.getImageData(0, y0, w, y - y0).data, ink = -1;
      for (var i = d.length - 4; i >= 0; i -= 4) { if (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245) { ink = Math.floor(i / 4 / w); break; } }
      if (ink >= 0) { y = y0 + ink + 1; break; }
      y = y0;
    }
    var keep = Math.min(c.height, y + Math.round(12 * PDF_SCALE));
    if (keep >= c.height || keep <= 0) return;
    var t = document.createElement('canvas'); t.width = w; t.height = keep;
    t.getContext('2d').drawImage(c, 0, 0);
    this.prop.canvas = t;
  }
  function downloadPdf(element, filename, btn, statusId) {
    if (typeof html2pdf === 'undefined') { if (statusId) setStatus(statusId, 'No se pudo cargar el generador de PDF — usa "Imprimir / PDF" en su lugar.', 'bad'); return; }
    if (btn) btn.disabled = true;
    if (statusId) setStatus(statusId, 'Generando PDF…');
    var opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: PDF_SCALE, useCORS: true, onclone: pdfOnClone },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    var blocks = pdfBlocks(element), n = blocks.length;
    var worker = html2pdf().set(opt).from(blocks[0]).toContainer().toCanvas().then(trimCanvasBottom).toPdf();
    blocks.slice(1).forEach(function (blk, i) {
      worker = worker.get('pdf').then(function (pdf) {
        if (statusId) setStatus(statusId, 'Generando PDF… ' + Math.round((i + 1) / n * 100) + '%');
        pdf.addPage();
      }).from(blk).toContainer().toCanvas().then(trimCanvasBottom).toPdf();
    });
    worker.save().then(function () {
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

  // PDF real (texto/vectores, no una captura de pantalla): abre esta misma
  // página con Chromium headless en el servidor (api/pdf.js) usando el
  // mismo deep link ?id= que la sincroniza con lo guardado en
  // Modelo-JMR-datos, así que solo está disponible una vez guardado ahí.
  el('downloadRealPdfBtn').addEventListener('click', function () {
    if (!state.remotePath || !state.id) return;
    var btn = this;
    btn.disabled = true;
    setStatus('realPdfStatus', 'Generando PDF…');
    fetch('/api/pdf?page=research&id=' + encodeURIComponent(state.id))
      .then(function (res) {
        if (!res.ok) return res.json().then(function (e) { throw new Error(e.error || ('HTTP ' + res.status)); });
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = safeFileSlug(state.ticker) + '-' + safeFileSlug(state.date || new Date().toISOString().slice(0, 10)) + '.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        setStatus('realPdfStatus', '');
      })
      .catch(function (err) { setStatus('realPdfStatus', 'No se pudo generar el PDF: ' + err.message, 'bad'); })
      .finally(function () { btn.disabled = false; });
  });

  // Substack no tiene forma de "subir un archivo" para un post individual
  // (su import de archivo es solo para migrar un newsletter entero desde
  // Medium/WordPress/Ghost) — lo que sí funciona es pegar contenido con
  // formato en su editor: al copiar HTML al portapapeles (no solo texto),
  // Substack conserva títulos, negrita, tablas y links. Se copia el mismo
  // documento ya renderizado en la vista previa (con el título y, si hay
  // empresa/ticker/fecha, una línea de contexto debajo), sin los controles
  // propios de esta app. Las imágenes quedan como <img src="data:...">
  // (mismas que usa el PDF): algunos editores de pegado no las traen —
  // si falta alguna al pegar, se reinserta a mano ahí mismo.
  function buildSubstackHtml() {
    var doc = el('previewBody').querySelector('.research-document');
    if (!doc) return null;
    var share = doc.cloneNode(true);
    if (state.articleHtml) share.querySelectorAll('details').forEach(function (node) { node.remove(); });
    var html = share.innerHTML;
    var meta = [state.company, state.ticker, state.date].filter(Boolean).join(' · ');
    if (meta) {
      var metaHtml = '<p><em>' + escapeHtml(meta) + '</em></p>';
      var h1 = html.match(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i);
      html = h1 ? html.slice(0, h1[0].length) + metaHtml + html.slice(h1[0].length) : metaHtml + html;
    }
    return html;
  }
  el('substackBtn').addEventListener('click', function () {
    var html = buildSubstackHtml();
    if (!html) { setStatus('saveStatus', 'No hay nada para copiar todavía — sube o escribe un análisis primero.', 'bad'); return; }
    var hasImg = /<img[^>]+src="data:/i.test(html);
    var imgNote = hasImg ? ' Las imágenes pegadas como datos pueden no llegar — si falta alguna, insértala de nuevo directamente en Substack.' : '';
    if (!(navigator.clipboard && window.ClipboardItem)) {
      setStatus('saveStatus', 'Este navegador no soporta copiar formato al portapapeles — selecciona el análisis a mano (arriba) y cópialo con Ctrl+C / Cmd+C.', 'bad');
      return;
    }
    navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([htmlToPlainText(html)], { type: 'text/plain' })
      })
    ]).then(function () {
      setStatus('saveStatus', 'Copiado — pégalo en el editor de Substack con Ctrl+V / Cmd+V.' + imgNote, 'ok');
    }).catch(function (err) {
      setStatus('saveStatus', 'No se pudo copiar automáticamente (' + err.message + ') — selecciona el análisis a mano y cópialo con Ctrl+C.', 'bad');
    });
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
    var q=normalizeText(el('librarySearch').value), list=activeResearchList().filter(function(r){return !q||recordSearchText(r).indexOf(q)>=0;});
    var holder=el('libraryCards');
    if(!list.length){populateCompareSelects();holder.innerHTML='<div class="empty">Todavía no hay análisis guardados. Abre “Nuevo análisis” para crear el primero.</div>';setStatus('libraryStatus',getGhToken()?'GitHub conectado.':'Biblioteca local · GitHub no conectado.');return;}
    holder.innerHTML=list.map(function(r){
      var logoSrc=logoForRecord(r);
      var logo=logoSrc?'<img class="mini-logo" src="'+escapeHtml(logoSrc)+'" data-ticker="'+escapeHtml(r.ticker||'?')+'" alt="Logo de '+escapeHtml(r.company||r.ticker||'empresa')+'">':'<span class="mini-logo mini-fallback">'+escapeHtml((r.ticker||'?').slice(0,2))+'</span>';
      var excerpt=recordExcerpt(r);
      // El publicador puede conservar la ruta en linkedValuationAtResearch
      // o valuationSync; no ocultar la navegación si falta sólo el alias.
      var visorPath = (r.linkedValuation && r.linkedValuation.sourcePath) ||
        (r.linkedValuationAtResearch && r.linkedValuationAtResearch.sourcePath) ||
        (r.valuationSync && r.valuationSync.sourcePath) || '';
      if(!/^valoraciones\/[A-Za-z0-9._-]+\.json$/.test(visorPath)) visorPath = '';
      var visorLink=visorPath?'<a class="btn" href="visor.html?path='+encodeURIComponent(visorPath)+(typeof jmrMercadoQS==='function'?jmrMercadoQS():'')+'">Ver en el Visor</a>':'';
      var dossierLink=/^[A-Za-z0-9._-]{1,24}$/.test(r.ticker||'')?'<a class="btn" href="expediente.html?ticker='+encodeURIComponent(r.ticker)+'">Expediente JMR</a>':'';
      return '<article class="analysis-card" data-id="'+escapeHtml(r.id)+'"><div class="card-head">'+logo+'<div class="card-title"><strong>'+escapeHtml(r.title||r.company)+(typeof JmrDecision!=='undefined'?JmrDecision.badge(r.decision):'')+'</strong><span class="ticker">'+escapeHtml(r.ticker||'—')+' · '+escapeHtml(r.company||'')+'</span></div></div>'+(excerpt?'<p class="card-excerpt">'+escapeHtml(excerpt)+'</p>':'')+'<div class="card-meta"><span>'+escapeHtml(r.date||'Sin fecha')+'</span><span>'+(officialAnalysisPaths?(officialAnalysisPaths.has(r.remotePath)?'Catálogo oficial':'Recuperado / fuera del catálogo'):'Estado pendiente de catálogo')+'</span></div><div class="card-actions"><button class="btn" data-action="open" type="button">Abrir</button>'+dossierLink+visorLink+'<button class="btn danger" data-action="delete" type="button">Borrar</button></div></article>';
    }).join('');
    wireLogoFallbacks(holder);
    setStatus('libraryStatus',list.length+' empresas visibles (una ficha por ticker) · '+(getGhToken()?'GitHub disponible':'almacenamiento local'));
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
  el('exportLibraryBtn').addEventListener('click',function(){download('modelo-jmr-research-'+JMR_MERCADO+'-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(getLocalLibrary().filter(jmrDelMercado),null,2),'application/json');});
  el('importLibraryInput').addEventListener('change',function(){var file=this.files&&this.files[0];if(!file)return;file.text().then(function(text){var incoming=JSON.parse(text);if(!Array.isArray(incoming))throw new Error('El respaldo no contiene una biblioteca válida.');var map={};getLocalLibrary().concat(incoming).forEach(function(r){if(r&&r.id)map[r.id]=r;});setLocalLibrary(Object.keys(map).map(function(k){return map[k];}));renderLibrary();setStatus('libraryStatus','Respaldo importado.','ok');}).catch(function(err){setStatus('libraryStatus','No se pudo importar: '+err.message,'bad');});this.value='';});

  // Comparar dos empresas/competidores lado a lado: reutiliza el mismo
  // renderer de documento (safeHtml + valuation-block) para cada columna,
  // a partir de dos análisis ya guardados en la biblioteca local.
  function populateCompareSelects() {
    var list = activeResearchList();
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
    var logoSrc = logoForRecord(rec);
    var logo = logoSrc ? '<img class="company-logo" src="' + escapeHtml(logoSrc) + '" alt="Logo de ' + escapeHtml(rec.company || rec.ticker || 'empresa') + '">' : '';
    var linked = rec.linkedValuation ? buildLinkedValuationHtml(rec.linkedValuation) : '';
    var val = rec.valuationHtml ? '<section class="valuation-block"><h2>Valoración cuantitativa</h2>' + rec.valuationHtml + '</section>' : '';
    var title = rec.title ? '<h1>' + escapeHtml(rec.title) + '</h1>' : '';
    var analysis = navigableAnalysis(articleForReading(rec.articleHtml || rec.html || '',rec.ticker), 'comparar-' + String(rec.id).replace(/[^a-zA-Z0-9_-]/g, '-'));
    // La comparación es narrativa; cada expediente conserva su propio Nivel 2 en la biblioteca.
    var output = '<div class="compare-col"><div class="company-banner"><div class="identity">' + logo + '<div class="company-name"><h2>' + escapeHtml(rec.company || rec.title || rec.ticker || '—') + '</h2><div class="ticker">' + escapeHtml(rec.ticker || '—') + '</div></div></div></div>' +
      '<div class="preview-body"><div class="research-document" id="jmrArticleLevel">' + title + calculatorLink(rec.ticker) + analysis.toc + analysis.body + '</div></div></div>';
    var holder = document.createElement('div'); holder.innerHTML = output;
    var anchors = {}, prefix = 'comparar-' + String(rec.id).replace(/[^a-zA-Z0-9_-]/g, '-') + '-';
    holder.querySelectorAll('[id]').forEach(function (node) { var old = node.id; node.id = prefix + old; anchors[old] = node.id; });
    holder.querySelectorAll('a[href^="#"]').forEach(function (a) { var target = anchors[a.getAttribute('href').slice(1)]; if (target) a.setAttribute('href', '#' + target); });
    return holder.innerHTML;
  }
  el('compareBtn').addEventListener('click', function () {
    var list = getLocalLibrary();
    var a = list.find(function (r) { return r.id === el('compareA').value; });
    var b = list.find(function (r) { return r.id === el('compareB').value; });
    if (!a || !b) { setStatus('compareStatus','Elegí dos análisis guardados para comparar.','bad'); el('compareOutput').innerHTML = '<div class="compare-empty">Elegí dos empresas arriba para verlas lado a lado.</div>'; return; }
    el('compareOutput').innerHTML = buildCompareColumnHtml(a) + buildCompareColumnHtml(b);
    markNumericCells(el('compareOutput'));
    setStatus('compareStatus','Comparando "' + (a.ticker || a.title) + '" vs. "' + (b.ticker || b.title) + '".','ok');
  });
  el('compareOutput').addEventListener('click', function (event) {
    window.JmrReportAnchors.navigate(event, el('compareOutput'));
  });
  el('comparePrintBtn').addEventListener('click', function () { window.print(); });
  el('compareDownloadBtn').addEventListener('click', function () {
    var a = getLocalLibrary().find(function (r) { return r.id === el('compareA').value; });
    var b = getLocalLibrary().find(function (r) { return r.id === el('compareB').value; });
    var name = safeFileSlug((a && a.ticker) || 'A') + '-vs-' + safeFileSlug((b && b.ticker) || 'B') + '.pdf';
    downloadPdf(el('compareOutput'), name, this, 'compareStatus');
  });

  function download(name,text,type){var blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  // Dos prompts maestros: el de Research fundamental (v4) y el de valoración
  // del Modelo JMR (v3, que reemplazó a la v2: múltiplos elegidos con anclas
  // documentadas e independientes del DCF). Cada uno guarda sus cambios aparte.
  var PROMPTS = {
    research: { file: 'prompts/research-fundamental-jmr-v5.md', key: PROMPT_KEY, download: 'JMR - PROMPT Research VIGENTE v5.md',
      title: 'Prompt maestro v5 · 18 secciones · historias y escenarios', btn: 'promptKindResearch',
      help: 'Úsalo en ChatGPT o Claude junto con la tabla del Modelo JMR. El esquema fijo hace que ambos produzcan documentos comparables.',
      note: 'Adjunta la tabla JMR y los informes disponibles. Revisión 30-sep-2026: cuatro historias como escenarios activos, supuestos y resultados trazables, DCF Base principal y esperado complementario; sección 12 con cálculo explicado y control de congruencia.' },
    valuation: { file: 'prompts/valoracion-modelo-jmr-v5.md', key: 'jmr-valuation-prompt-v5-20261021', download: 'JMR - PROMPT Valoracion VIGENTE v5.md',
      title: 'Prompt de valoración v5 · cualquier modelo de lenguaje', btn: 'promptKindValuation',
      help: 'Arma el Modelo JMR de punta a punta (SEC EDGAR, costo de capital, supuestos anclados, bugs conocidos, guardado en Drive) y elige los múltiplos con tres anclas documentadas: historia depurada, peers ajustados y múltiplo justificado.',
      note: 'DCF Base al presente primero. Siempre muestra métodos individuales, ponderado de múltiplos solos y ponderado DCF + múltiplos, tanto al presente como a 3 años sin descontar; pesos y dividendos explícitos. Fórmula única en todas las hojas (maestra + contrato): solo cambian datos enlazados y supuestos. Cuatro historias: Base, Conservadora, Disrupción y Optimista. Precio al final.' }
  };
  var promptKind = 'research', defaultPrompts = {};
  try { if (localStorage.getItem('jmr-prompt-kind') === 'valuation') promptKind = 'valuation'; } catch (e) {}
  var CO_PROMPTS = {
    research: { file: 'prompts/colombia-research-v1.md', key: 'jmr-colombia-research-prompt-v1', download: 'JMR-Colombia-Research.md', title: 'Prompt de análisis fundamental · Colombia', btn: 'promptKindResearch', help: 'Análisis de acciones colombianas con fuentes del emisor y contexto local.', note: 'Núcleo Colombia, unidades y moneda del expediente; misma estructura de análisis.' },
    valuation: { file: 'prompts/colombia-valuation-v1.md', key: 'jmr-colombia-valuation-prompt-v1', download: 'JMR-Colombia-Valoracion.md', title: 'Prompt de valoración · Colombia', btn: 'promptKindValuation', help: 'Valoración por sector: empresas operativas, entidades financieras y holdings.', note: 'Conserva COP, fecha de análisis, fuentes y conciliaciones del expediente Colombia.' }
  };
  function currentPrompt(){ return (JMR_MERCADO === 'colombia' ? CO_PROMPTS : PROMPTS)[promptKind]; }
  document.addEventListener('jmr-market-change', function(){defaultPrompts={};renderLibrary();populateCompareSelects();loadPrompt(false);});
  // Bloques obligatorios (2-oct-2026) que se agregan a un prompt guardado que no los tenga, en el orden del vigente.
  var REQUIRED_BLOCKS = ['JMR-DOS-NIVELES-ARTICULO-CALCULOS-20261014', 'JMR-HORIZONTES-OBLIGATORIOS-20261002', 'JMR-FORMULA-UNICA-20261002', 'JMR-DESDE-CERO-20261006'];
  function withRequiredHorizons(saved, current) {
    if (!saved) return saved;
    var prevEnd = null;
    REQUIRED_BLOCKS.forEach(function(id){
      var start = '<!-- ' + id + ' -->', end = '<!-- /' + id + ' -->';
      var sa = saved.indexOf(start), sb = saved.indexOf(end);
      if (sa !== -1 && sb > sa) {  // bloque ya presente: se reemplaza por la versión vigente
        var ca = current.indexOf(start), cb = current.indexOf(end);
        if (ca >= 0 && cb > ca) saved = saved.slice(0, sa) + current.slice(ca, cb + end.length) + saved.slice(sb + end.length);
      } else if (saved.indexOf(start) === -1) {
        var a = current.indexOf(start), b = current.indexOf(end);
        if (a >= 0 && b > a) {
          var block = current.slice(a, b + end.length);
          var at = prevEnd ? saved.indexOf(prevEnd) : -1;
          saved = at >= 0 ? saved.slice(0, at + prevEnd.length) + '\n\n' + block + saved.slice(at + prevEnd.length)
                          : block + '\n\n' + saved;
        }
      }
      prevEnd = end;
    });
    return saved;
  }
  function showPromptMeta(){
    var p = currentPrompt();
    el('promptTitle').textContent = p.title; el('promptHelp').textContent = p.help; el('promptNote').textContent = p.note;
    Object.keys(PROMPTS).forEach(function(k){ var b = el(PROMPTS[k].btn); b.classList.toggle('primary', k === promptKind); b.setAttribute('aria-pressed', String(k === promptKind)); });
  }
  function loadPrompt(force) {
    var kind = promptKind, market = JMR_MERCADO, p = currentPrompt();
    showPromptMeta();
    var files = market === 'colombia' ? ['prompts/colombia-nucleo-v1.md', p.file] : [p.file];
    Promise.all(files.map(function(file){return fetch(file,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();});})).then(function(parts){var text=parts.join('\n\n');if(kind!==promptKind||market!==JMR_MERCADO)return;defaultPrompts[kind]=text;var saved='';try{saved=localStorage.getItem(p.key)||'';var revised=withRequiredHorizons(saved,text);if(revised!==saved){saved=revised;localStorage.setItem(p.key,saved);}}catch(e){}el('promptText').value=force||!saved?text:saved;setStatus('promptStatus','','');}).catch(function(err){setStatus('promptStatus','No se pudo cargar el prompt: '+err.message,'bad');});
  }
  Object.keys(PROMPTS).forEach(function(k){ el(PROMPTS[k].btn).addEventListener('click', function(){ if (k === promptKind) return; promptKind = k; try { localStorage.setItem('jmr-prompt-kind', k); } catch (e) {} loadPrompt(false); }); });
  el('copyPromptBtn').addEventListener('click',function(){navigator.clipboard.writeText(el('promptText').value).then(function(){setStatus('promptStatus','Prompt copiado.','ok');}).catch(function(){el('promptText').select();document.execCommand('copy');setStatus('promptStatus','Prompt copiado.','ok');});});
  el('savePromptBtn').addEventListener('click',function(){try{localStorage.setItem(currentPrompt().key,el('promptText').value);setStatus('promptStatus','Cambios guardados en este navegador.','ok');}catch(e){setStatus('promptStatus','No fue posible guardar el prompt.','bad');}});
  el('downloadPromptBtn').addEventListener('click',function(){download(currentPrompt().download,el('promptText').value,'text/markdown');});
  el('resetPromptBtn').addEventListener('click',function(){var d=defaultPrompts[promptKind];if(d){el('promptText').value=d;try{localStorage.removeItem(currentPrompt().key);}catch(e){}setStatus('promptStatus','Prompt restaurado.','ok');}else loadPrompt(true);});

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

  // ?id=<state.id> abre directo la vista previa de ESE análisis (a
  // diferencia de ?ticker=, que solo filtra la Biblioteca) — lo usa
  // api/pdf.js para generar el PDF real con Chromium headless, y también
  // sirve como enlace directo compartible a un análisis puntual.
  var pdfMode = new URLSearchParams(location.search).get('pdfmode') === '1';
  var deepLinkId = new URLSearchParams(location.search).get('id');
  // La ficha JMR puede pedir un informe EXACTO del catálogo, nunca seleccionar
  // a ciegas una revisión anterior del mismo ticker.
  var deepLinkAnalysisPath = new URLSearchParams(location.search).get('analisis');
  function openCatalogResearch(){
    if(!deepLinkAnalysisPath || deepLinkId) return;
    if(!/^analisis\/[A-Za-z0-9._-]+\.json$/.test(deepLinkAnalysisPath)){
      setStatus('libraryStatus','Ruta de análisis inválida en el expediente.','bad');return;
    }
    var rec=getLocalLibrary().find(function(r){return r.remotePath===deepLinkAnalysisPath;});
    if(rec){fillEditor(rec);}
    else setStatus('libraryStatus','El análisis de la revisión indicada no está accesible. No se abrirá otra revisión en su lugar.','bad');
  }
  function applyDeepLinkId() {
    if (!deepLinkId) return false;
    var rec = getLocalLibrary().find(function (r) { return r.id === deepLinkId; });
    if (!rec) return false;
    fillEditor(rec);
    return true;
  }
  if (pdfMode) {
    document.body.classList.add('pdf-mode');
    var pdfDate = el('pdfHeaderDate');
    if (pdfDate) pdfDate.textContent = 'Generado el ' + new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Carga editorial independiente: nunca sustituye ni modifica registros de analisis/*.json.
  // Error de un lote no debe ocultar los demás ni impedir usar el análisis fundamental completo.
  var editorialPromise = Promise.all([1,2,3,4,5,6].map(function (n) {
    return fetch('editorial/articulos-' + n + '.json?v=20261014', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () { return null; });
  })).then(function (batches) {
    batches.forEach(function (batch) {
      if (!batch || batch.schema !== 'jmr-editorial-v1' || !batch.articulos) return;
      Object.keys(batch.articulos).forEach(function (ticker) {
        editorialArticles[ticker.toUpperCase()] = batch.articulos[ticker];
      });
    });
    renderLibrary();
    renderPreview();
    return Object.keys(editorialArticles).length;
  });

  // catalog-reset.js retira una sola vez las copias locales del catálogo anterior.

  loadOfficialAnalysisPaths();
  renderGhBanner();
  el('compareOutput').innerHTML='<div class="compare-empty">Elegí dos empresas arriba para verlas lado a lado.</div>';
  renderLibrary();renderPreview();loadPrompt(false);
  applyDeepLinkFilter();
  // Modelo-JMR-datos es público: la sincronización inicial funciona
  // siempre, con o sin token conectado (el token solo hace falta para
  // guardar/borrar) — así la biblioteca nunca depende de acordarse de
  // apretar "Sincronizar GitHub" ni de conectar nada solo para mirar.
  syncRemote().then(function (n) {
    applyDeepLinkFilter();
    if (deepLinkId) applyDeepLinkId();
    else openCatalogResearch();
    return pushLocalOnlyToRemote();
  }).catch(function (err) {
    applyDeepLinkFilter();
    if (deepLinkId) applyDeepLinkId();
    else openCatalogResearch();
    setStatus('libraryStatus',err.message,'bad');
  }).finally(function () {
    // Señal para api/pdf.js: se espera este flag en vez de un timeout fijo,
    // porque syncRemote() es asíncrono y termina después de que la red
    // queda "quieta". Si pdfmode pidió un id que no existe, igual hay que
    // liberar a Chromium en vez de dejarlo colgado.
    if (pdfMode) editorialPromise.finally(function () { window.__pdfReady = true; });
  });
  if ('serviceWorker' in navigator) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();
