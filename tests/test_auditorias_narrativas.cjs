const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'docs');
const html = fs.readFileSync(path.join(root, 'auditorias.html'), 'utf8');
assert.ok(html.includes('auditorias/narrativas/'), 'Debe leer el directorio correcto');
assert.ok(html.includes("GhOAuth.b64EncodeUnicode(editor.value)"), 'Debe guardar texto Markdown Unicode');
assert.ok(html.includes("latest.sha!==loadedSha"), 'Debe proteger de cambios concurrentes');
assert.ok(html.includes("loadedText=editor.value"), 'Debe actualizar el texto después de guardar');
assert.ok(html.includes("saveChanges"), 'Debe disponer de editor guardable');
assert.ok(html.includes("DOMPurify.sanitize"), 'Debe sanear la vista Markdown');
assert.ok(html.includes('No se sobrescribió nada.'), 'Debe avisar de conflicto');
const inline = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
  .map(m => m[1]).filter(Boolean);
assert.ok(inline.length >= 1, 'Debe existir script de la interfaz');
for (const source of inline) new vm.Script(source, {filename: 'auditorias-inline.js'});
for (const file of ['index.html', 'visor.html', 'research.html', 'auditoria-multiplos.html']) {
  const body=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(body.includes('auditorias.html?ticker=PYPL'), file+' debe enlazar las auditorías');
}
console.log('OK: lector/editor, sintaxis JavaScript, conservación y enlaces de navegación');
