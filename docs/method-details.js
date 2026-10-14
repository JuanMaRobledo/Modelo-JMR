// Presentation only; source records and financial calculations stay intact.
(function (global) {
  var secondary = /\b(?:EV\s*\/\s*(?:EBITDA|FCFF)|P\s*\/\s*(?:E|FCFE|OCF))\b|m[uú]ltiplos|ponderad|\bSOTP\b|valor contable|valoracion relativa|valoración relativa|metodos alternativos|métodos alternativos/i;
  function disclosure(doc, label) {
    var d = doc.createElement('details'), s = doc.createElement('summary');
    d.className = 'jmr-method-details'; s.textContent = label; d.appendChild(s); return d;
  }
  function fold(root) {
    if (!root) return;
    Array.from(root.querySelectorAll('h2,h3,h4')).forEach(function (h) {
      if (h.closest('.jvb,.jmr-method-details') || !secondary.test(h.textContent) || /\bDCF\b|flujo.*descontad/i.test(h.textContent)) return;
      var level = Number(h.tagName.slice(1)), next = h.nextSibling;
      var d = disclosure(h.ownerDocument, 'Ver ' + h.textContent.trim());
      h.parentNode.insertBefore(d, h); d.appendChild(h);
      while (next) {
        if (next.nodeType === 1 && /^H[1-6]$/.test(next.tagName) && Number(next.tagName.slice(1)) <= level) break;
        var after = next.nextSibling; d.appendChild(next); next = after;
      }
    });
    Array.from(root.querySelectorAll('table')).forEach(function (table) {
      if (table.closest('.jvb,.jmr-method-details')) return;
      var rows = Array.from(table.querySelectorAll('tr')).filter(function (r) { return r.querySelector('td'); });
      var others = rows.filter(function (r) { return secondary.test(r.cells[0]?.textContent || '') && !/^\s*DCF(?!.*(?:m[uú]ltiplos|ponderad))/i.test(r.cells[0]?.textContent || ''); });
      if (!others.length) return;
      var d = disclosure(table.ownerDocument, 'Ver otros métodos de valoración');
      table.parentNode.insertBefore(d, table.nextSibling);
      if (others.length === rows.length) { d.appendChild(table); return; }
      var copy = table.cloneNode(false); copy.removeAttribute('id');
      if (table.tHead) copy.appendChild(table.tHead.cloneNode(true));
      var body = table.ownerDocument.createElement('tbody'); copy.appendChild(body);
      others.forEach(function (r) { body.appendChild(r); }); d.appendChild(copy);
      copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    });
  }
  if (global.document) document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute('href').slice(1));
    for (var p = target && target.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
  });
  global.JmrMethodDetails = { fold: fold };
})(typeof window !== 'undefined' ? window : globalThis);
