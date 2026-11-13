#!/usr/bin/env node
// Genera docs/multiplos/catalogo.json desde docs/multiplos/empresas/*.json (catálogo propio de JMR múltiplos; no lee V2 ni Floyd).
// Uso: node scripts/multiplos-catalogo.mjs [--dir docs/multiplos] [--check]
import fs from 'node:fs';
import path from 'node:path';
import { calcular, evaluar } from '../docs/multiplos/motor.mjs';

export function construirCatalogo(dir) {
  const carpeta = path.join(dir, 'empresas');
  const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter(f => f.endsWith('.json')).sort() : [];
  const empresas = [], errores = [], vistos = new Set();
  for (const f of archivos) {
    const ticker = f.replace(/\.json$/, '');
    let m;
    try { m = JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8')); } catch { errores.push(`${f}: JSON inválido`); continue; }
    if (!/^[A-Z0-9.-]{1,18}$/.test(ticker)) { errores.push(`${f}: ticker de archivo inválido`); continue; }
    if (m.ticker !== ticker) { errores.push(`${f}: el ticker interno (${m.ticker}) no coincide con el archivo`); continue; }
    if (m.fictional) { errores.push(`${f}: un expediente ficticio no puede entrar al catálogo`); continue; }
    if (vistos.has(ticker)) { errores.push(`${f}: ticker duplicado`); continue; }
    vistos.add(ticker);
    const ev = evaluar(m);
    const r = ev.permitido === 'BLOQUEADO' ? null : calcular(m);
    const aprobada = !!(m.aprobacionUsuario && m.aprobacionUsuario.aprobadaPor && m.aprobacionUsuario.fecha);
    empresas.push({
      ticker, company: m.company || ticker, perfil: m.profile, asOf: m.asOf || null, currency: m.currency || null,
      precio: m.market?.sharePrice ?? null,
      valorBase: r?.escenarios.base.ponderado ?? null, precioMOS: r?.mos.precioMOS ?? null, brecha: r?.brecha ?? null,
      v2Ref: typeof m.v2Ref?.valorBase === 'number' ? m.v2Ref.valorBase : null,
      estado: ev.permitido, estadoDeclarado: m.estado || null,
      visibilidadApp: ev.permitido === 'BLOQUEADO' ? 'BLOQUEADA' : 'PUBLICADA_PARA_REVISION',
      aprobacionUsuario: aprobada ? { fecha: m.aprobacionUsuario.fecha, aprobadaPor: m.aprobacionUsuario.aprobadaPor } : null,
      solicitudExpresa: m.solicitudExpresa?.fecha ?? null, controles: ev.resumen, archivo: `empresas/${f}`,
    });
  }
  return { catalogo: { schemaVersion: 'jmr-multiplos-catalogo-1', empresas }, errores };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--dir');
  const dir = path.resolve(i > 0 ? process.argv[i + 1] : new URL('../docs/multiplos', import.meta.url).pathname);
  const { catalogo, errores } = construirCatalogo(dir);
  if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
  const texto = JSON.stringify(catalogo, null, 1) + '\n', destino = path.join(dir, 'catalogo.json');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(destino) || fs.readFileSync(destino, 'utf8') !== texto) { console.error('catalogo.json desactualizado: ejecutar node scripts/multiplos-catalogo.mjs'); process.exit(1); }
    console.log(`catálogo al día (${catalogo.empresas.length} empresas)`);
  } else { fs.writeFileSync(destino, texto); console.log(`catálogo escrito (${catalogo.empresas.length} empresas)`); }
}
