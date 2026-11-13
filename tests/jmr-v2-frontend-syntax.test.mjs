import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const file=new URL('../docs/jmr-v2.html',import.meta.url);
const html=fs.readFileSync(file,'utf8');
const m=html.match(/<script type="module">([\s\S]*?)<\/script>/);
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;

test('la aplicación JMR V2 conserva sintaxis JavaScript válida (módulo inline)',()=>{
 assert.ok(m,'No se encontró el módulo principal');
 assert.doesNotThrow(()=>new AsyncFunction(m[1]));
});

test('editor modular y módulo de auditoría pasan node --check',()=>{
 for(const filename of ['editor-analisis.mjs','auditoria-usuario.mjs']){
  const filePath=new URL('../docs/v2/'+filename,import.meta.url).pathname;
  const r=spawnSync(process.execPath,['--check',filePath],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
 }
});
