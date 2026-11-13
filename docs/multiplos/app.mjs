// JMR múltiplos · lógica de la página (DOM). Los números salen siempre de motor.mjs.
import { vistaEmpresa, esc, moneda } from './vista.mjs';

const $ = id => document.getElementById(id);
const cache = new Map();

async function json(ruta) {
  const r = await fetch(ruta, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  return r.json();
}

function lista(empresas, vista) {
  const filtro = empresas.filter(e => (vista === 'aprobadas') === !!e.aprobacionUsuario);
  $('catalogo').innerHTML = filtro.length ? filtro.map(e => `
    <button class="card" data-ticker="${esc(e.ticker)}"><strong>${esc(e.ticker)}</strong><span>${esc(e.company)}</span>
      <small>${esc(e.estado.replace('_', ' '))} · base ${moneda(e.valorBase, e.currency)}</small></button>`).join('')
    : `<div class="empty"><h3>${vista === 'aprobadas' ? 'Sin valoraciones aprobadas por ti' : 'Aún no hay valoraciones por múltiplos'}</h3>
       <p>JMR múltiplos es un complemento de V2 y <strong>solo se elabora cuando lo solicitas expresamente</strong>. Pide, por ejemplo: «haz el análisis por múltiplos de ORCL».</p></div>`;
}

async function abrir(ticker, catalogo) {
  const item = catalogo.empresas.find(e => e.ticker === ticker);
  if (!item) return;
  $('detalle').innerHTML = '<p>Cargando…</p>';
  try {
    if (!cache.has(ticker)) cache.set(ticker, await json(`multiplos/${item.archivo}`));
    $('detalle').innerHTML = vistaEmpresa(cache.get(ticker));
    history.replaceState(null, '', `?ticker=${encodeURIComponent(ticker)}`);
  } catch (e) { $('detalle').innerHTML = `<p class="aviso">No se pudo cargar el expediente: ${esc(e.message)}</p>`; }
}

async function iniciar() {
  let catalogo;
  try { catalogo = await json('multiplos/catalogo.json'); } catch { catalogo = { empresas: [] }; }
  let vista = 'pendientes';
  const pintar = () => {
    lista(catalogo.empresas, vista);
    document.querySelectorAll('[data-vista]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
  };
  document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => { vista = b.dataset.vista; pintar(); }));
  $('catalogo').addEventListener('click', ev => { const b = ev.target.closest('[data-ticker]'); if (b) abrir(b.dataset.ticker, catalogo); });
  pintar();
  const t = new URLSearchParams(location.search).get('ticker');
  if (t) abrir(t.toUpperCase(), catalogo);
}
iniciar();
