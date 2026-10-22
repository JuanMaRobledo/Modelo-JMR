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
  assert.ok(body.includes('auditoria-integral.html'), file+' debe enlazar la auditoría integral');
}
const prompt=fs.readFileSync(path.join(root,'prompts','auditoria-economica-jmr-v1.md'),'utf8');
const headings=[...prompt.matchAll(/^## ([0-9]+)[.] (.+)$/gm)];
assert.equal(headings.length,18,'Debe haber exactamente 18 secciones fijas');
headings.forEach((match,i)=>assert.equal(Number(match[1]),i+1,'La numeración de las secciones debe ser consecutiva'));
assert.ok(prompt.includes('### 10 reglas obligatorias'));
assert.ok(prompt.includes('histórico') || prompt.includes('Histórico'));
assert.ok(prompt.includes('No modifiques'));
assert.ok(html.includes('id="integralLink"'), 'El editor debe regresar a la auditoría integral del ticker');
assert.ok(html.includes('loadMasterPrompt()'),'La app debe cargar el prompt maestro');
assert.ok(html.includes('id="copyMasterPromptBtn"'),'Debe ser posible copiar el prompt');
assert.ok(html.includes('readonly spellcheck="false"'),'La copia maestra debe ser de solo lectura');
assert.ok(html.includes('prompts/auditoria-economica-jmr-v1.md'),'No debe duplicar el prompt en la app');
console.log('OK: lector/editor, sintaxis JavaScript, conservación y enlaces de navegación');
