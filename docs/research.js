(function () {
  'use strict';

  var LOCAL_KEY = 'jmr-research-library-v1';
  var PROMPT_KEY = 'jmr-research-prompt-v1';
  var GH_TOKEN_KEY = 'jmr-gh-datastore-token';
  var GH_API = 'https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/';
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
    return { id: '', title: '', ticker: '', company: '', date: new Date().toISOString().slice(0, 10), logo: '', price: null, priceFetchedAt: '', html: '', sourceName: '', valuationHtml: '', news: '', remotePath: '', remoteSha: '' };
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
      return { title:p[0] || '', url:p[1] || '', date:p[2] || '' };
    }).filter(function (x) { return x.title; });
  }
  function renderNews() {
    var news = parseNews(state.news);
    if (!news.length) return '';
    return '<section><h2>Noticias añadidas</h2><div class="news-list">' + news.map(function (n) {
      var title = escapeHtml(n.title), date = n.date ? '<span class="news-date">' + escapeHtml(n.date) + '</span>' : '';
      var link = /^https?:\/\//i.test(n.url) ? '<a href="' + escapeHtml(n.url) + '" target="_blank" rel="noopener noreferrer">' + title + '</a>' : '<strong>' + title + '</strong>';
      return '<div class="news-item">' + link + date + '</div>';
    }).join('') + '</div></section>';
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
    if (!state.html && !state.valuationHtml && !state.news) { body.innerHTML = '<div class="preview-empty">Sube un documento para ver aquí la versión normalizada.</div>'; return; }
    var title = state.title ? '<h1>' + escapeHtml(state.title) + '</h1>' : '';
    var val = state.valuationHtml ? '<section class="valuation-block"><h2>Valoración cuantitativa JMR</h2>' + state.valuationHtml + '</section>' : '';
    body.innerHTML = '<div class="research-document">' + title + safeHtml(state.html) + val + renderNews() + '</div>';
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

  el('logoInput').addEventListener('change', function () {
    var file = this.files && this.files[0]; if (!file) return;
    if (file.size > 450000) { setStatus('quoteStatus','El logo debe pesar menos de 450 KB.','bad'); this.value=''; return; }
    var reader = new FileReader(); reader.onload = function () { state.logo = reader.result; renderPreview(); setStatus('quoteStatus','Logo propio cargado.','ok'); }; reader.readAsDataURL(file);
  });

  function handleAnalysisFile(file) {
    if (!file) return;
    setStatus('analysisStatus','Convirtiendo ' + file.name + '…');
    extractAnalysis(file).then(function (html) {
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
  function ghHeaders() { return {'Authorization':'token '+getGhToken(),'Accept':'application/vnd.github+json'}; }
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
    if(!getGhToken()||!record.remotePath||!record.remoteSha) return Promise.resolve();
    return fetch(GH_API+record.remotePath,{method:'DELETE',headers:Object.assign({'Content-Type':'application/json'},ghHeaders()),body:JSON.stringify({message:'Borrar research '+(record.ticker||record.id),sha:record.remoteSha})}).then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);});
  }
  function syncRemote() {
    if(!getGhToken()) return Promise.reject(new Error('Conecta GitHub primero desde “Valoraciones guardadas” en el Visor.'));
    return fetch(GH_API+'analisis',{headers:ghHeaders()}).then(function(res){if(res.status===404)return[];if(!res.ok)throw new Error('HTTP '+res.status);return res.json();}).then(function(files){
      var jsons=(Array.isArray(files)?files:[]).filter(function(f){return /\.json$/i.test(f.name);});
      return Promise.all(jsons.map(function(f){return fetch(f.url,{headers:ghHeaders()}).then(function(r){return r.json();}).then(function(data){var rec=JSON.parse(b64Decode(data.content.replace(/\n/g,'')));rec.remotePath=f.path;rec.remoteSha=f.sha;return rec;});}));
    }).then(function(remote){
      var map={}; getLocalLibrary().concat(remote).forEach(function(r){var old=map[r.id];if(!old||String(r.updatedAt||'')>String(old.updatedAt||''))map[r.id]=r;});
      var list=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date));});setLocalLibrary(list);renderLibrary();return list.length;
    });
  }

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
    remoteSave(record).then(function(saved){if(saved)upsertLocal(saved);renderLibrary();setStatus('saveStatus',saved?'Guardado localmente y en tu repositorio privado.':'Guardado en este navegador. Conecta GitHub desde el Visor para sincronizarlo.','ok');}).catch(function(err){setStatus('saveStatus','Guardado localmente, pero GitHub falló: '+err.message,'bad');}).finally(function(){btn.disabled=false;});
  });

  function fillEditor(rec) {
    state=Object.assign(freshState(),rec);
    el('tickerInput').value=state.ticker||'';el('companyInput').value=state.company||'';el('titleInput').value=state.title||'';el('dateInput').value=state.date||'';el('newsInput').value=state.news||'';
    checkQuality();renderPreview();setStatus('saveStatus','Análisis cargado. Puedes editar sus datos o reemplazar los archivos.');switchTab('editor');
  }
  function resetEditor() {
    state=freshState();['tickerInput','companyInput','titleInput','newsInput'].forEach(function(id){el(id).value='';});el('dateInput').value=state.date;el('logoInput').value='';el('analysisFile').value='';el('valuationFile').value='';el('qualityChips').innerHTML='';['quoteStatus','analysisStatus','valuationStatus','saveStatus'].forEach(function(id){setStatus(id,'');});renderPreview();
  }
  el('newBtn').addEventListener('click',resetEditor);
  el('printBtn').addEventListener('click',function(){window.print();});

  function renderLibrary() {
    var q=normalizeText(el('librarySearch').value), list=getLocalLibrary().filter(function(r){return !q||normalizeText([r.ticker,r.company,r.title].join(' ')).indexOf(q)>=0;});
    var holder=el('libraryCards');
    if(!list.length){holder.innerHTML='<div class="empty">Todavía no hay análisis guardados. Abre “Nuevo análisis” para crear el primero.</div>';setStatus('libraryStatus',getGhToken()?'GitHub conectado.':'Biblioteca local · GitHub no conectado.');return;}
    holder.innerHTML=list.map(function(r){
      var logo=r.logo?'<img class="mini-logo" src="'+escapeHtml(r.logo)+'" alt="">':'<span class="mini-logo mini-fallback">'+escapeHtml((r.ticker||'?').slice(0,2))+'</span>';
      return '<article class="analysis-card" data-id="'+escapeHtml(r.id)+'"><div class="card-head">'+logo+'<div class="card-title"><strong>'+escapeHtml(r.title||r.company)+'</strong><span class="ticker">'+escapeHtml(r.ticker||'—')+' · '+escapeHtml(r.company||'')+'</span></div></div><div class="card-meta"><span>'+escapeHtml(r.date||'Sin fecha')+'</span><span>'+(r.remotePath?'GitHub + local':'Solo local')+'</span></div><div class="card-actions"><button class="btn" data-action="open" type="button">Abrir</button><button class="btn danger" data-action="delete" type="button">Borrar</button></div></article>';
    }).join('');
    setStatus('libraryStatus',list.length+' análisis · '+(getGhToken()?'GitHub disponible':'almacenamiento local'));
  }
  el('librarySearch').addEventListener('input',renderLibrary);
  el('libraryCards').addEventListener('click',function(e){
    var btn=e.target.closest('button[data-action]');if(!btn)return;var card=btn.closest('[data-id]'),list=getLocalLibrary(),rec=list.find(function(r){return r.id===card.dataset.id;});if(!rec)return;
    if(btn.dataset.action==='open'){fillEditor(rec);return;}
    if(!confirm('¿Borrar el análisis de '+(rec.company||rec.ticker)+'? Esta acción no se puede deshacer.'))return;
    btn.disabled=true;remoteDelete(rec).then(function(){setLocalLibrary(list.filter(function(r){return r.id!==rec.id;}));renderLibrary();}).catch(function(err){btn.disabled=false;setStatus('libraryStatus','No se pudo borrar: '+err.message,'bad');});
  });
  el('syncBtn').addEventListener('click',function(){var btn=this;btn.disabled=true;setStatus('libraryStatus','Sincronizando…');syncRemote().then(function(n){setStatus('libraryStatus','Sincronización completa: '+n+' análisis.','ok');}).catch(function(err){setStatus('libraryStatus',err.message,'bad');}).finally(function(){btn.disabled=false;});});
  el('exportLibraryBtn').addEventListener('click',function(){download('modelo-jmr-research-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(getLocalLibrary(),null,2),'application/json');});
  el('importLibraryInput').addEventListener('change',function(){var file=this.files&&this.files[0];if(!file)return;file.text().then(function(text){var incoming=JSON.parse(text);if(!Array.isArray(incoming))throw new Error('El respaldo no contiene una biblioteca válida.');var map={};getLocalLibrary().concat(incoming).forEach(function(r){if(r&&r.id)map[r.id]=r;});setLocalLibrary(Object.keys(map).map(function(k){return map[k];}));renderLibrary();setStatus('libraryStatus','Respaldo importado.','ok');}).catch(function(err){setStatus('libraryStatus','No se pudo importar: '+err.message,'bad');});this.value='';});

  function download(name,text,type){var blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  var defaultPrompt='';
  function loadPrompt(force) {
    fetch('prompts/analisis-fundamental-v1.md',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();}).then(function(text){defaultPrompt=text;var saved='';try{saved=localStorage.getItem(PROMPT_KEY)||'';}catch(e){}el('promptText').value=force||!saved?text:saved;}).catch(function(err){setStatus('promptStatus','No se pudo cargar el prompt: '+err.message,'bad');});
  }
  el('copyPromptBtn').addEventListener('click',function(){navigator.clipboard.writeText(el('promptText').value).then(function(){setStatus('promptStatus','Prompt copiado.','ok');}).catch(function(){el('promptText').select();document.execCommand('copy');setStatus('promptStatus','Prompt copiado.','ok');});});
  el('savePromptBtn').addEventListener('click',function(){try{localStorage.setItem(PROMPT_KEY,el('promptText').value);setStatus('promptStatus','Cambios guardados en este navegador.','ok');}catch(e){setStatus('promptStatus','No fue posible guardar el prompt.','bad');}});
  el('downloadPromptBtn').addEventListener('click',function(){download('prompt-analisis-fundamental-modelo-jmr.md',el('promptText').value,'text/markdown');});
  el('resetPromptBtn').addEventListener('click',function(){if(defaultPrompt){el('promptText').value=defaultPrompt;try{localStorage.removeItem(PROMPT_KEY);}catch(e){}setStatus('promptStatus','Prompt restaurado.','ok');}else loadPrompt(true);});

  renderLibrary();renderPreview();loadPrompt(false);
  if ('serviceWorker' in navigator) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();
