#!/usr/bin/env node
// Genera docs/v2/catalogo.json a partir de docs/v2/empresas/*.json (catálogo propio de V2.0, sin Floyd).
// El catálogo es un índice derivado: no recalcula nada por su cuenta, usa el mismo motor y los mismos controles.
// Uso: node scripts/v2-catalogo.mjs [--dir docs/v2] [--check]
import fs from 'node:fs';
import path from 'node:path';
import { cargarMotor } from './v2-motor.mjs';
import { crearMotor } from '../docs/v2/motores/despacho.mjs';
import { evaluarExpediente } from '../docs/v2/expediente-v2.mjs';

export function construirCatalogo(dir, motor = crearMotor(cargarMotor())) {
  const carpeta = path.join(dir, 'empresas');
  const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter(f => f.endsWith('.json')).sort() : [];
  const empresas = [], errores = [], vistos = new Set();
  for (const f of archivos) {
    const ticker = f.replace(/\.json$/, '');
    let m;
    try { m = JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8')); } catch (e) { errores.push(`${f}: JSON inválido`); continue; }
    if (!/^[A-Z0-9.-]{1,18}$/.test(ticker)) { errores.push(`${f}: ticker de archivo inválido`); continue; }
    if (m.ticker !== ticker) { errores.push(`${f}: el ticker interno (${m.ticker}) no coincide con el archivo`); continue; }
    if (m.fictional) { errores.push(`${f}: un expediente ficticio no puede entrar al catálogo`); continue; }
    if (vistos.has(ticker)) { errores.push(`${f}: ticker duplicado`); continue; }
    vistos.add(ticker);
    const ev = evaluarExpediente(m, motor);
    const base = ev.permitido === 'BLOQUEADO' ? null : motor.calculateAll(m).scenarios?.base;
    empresas.push({
      ticker, company: m.company || ticker, perfil: m.profile, asOf: m.asOf || null, currency: m.currency || null,
      precio: m.financials?.sharePrice ?? null,
      valorBase: base?.perShare ?? null, precioMOS: base?.mosPrice ?? null,
      estado: ev.violacion ? (ev.permitido) : ev.declarado, estadoPermitido: ev.permitido, estadoDeclarado: ev.declarado,
      controles: ev.resumen, archivo: `empresas/${f}`,
    });
  }
  return { catalogo: { schemaVersion: 'jmr-v2-catalogo-1', empresas }, errores };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--dir');
  const dir = path.resolve(i > 0 ? process.argv[i + 1] : new URL('../docs/v2', import.meta.url).pathname);
  const { catalogo, errores } = construirCatalogo(dir);
  if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
  const texto = JSON.stringify(catalogo, null, 1) + '\n', destino = path.join(dir, 'catalogo.json');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(destino) || fs.readFileSync(destino, 'utf8') !== texto) { console.error('catalogo.json desactualizado: ejecutar node scripts/v2-catalogo.mjs'); process.exit(1); }
    console.log(`catálogo al día (${catalogo.empresas.length} empresas)`);
  } else { fs.writeFileSync(destino, texto); console.log(`catálogo escrito (${catalogo.empresas.length} empresas)`); }
}
