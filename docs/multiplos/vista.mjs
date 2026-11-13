// JMR múltiplos · vista del expediente como HTML (función pura: testeable sin DOM). Todo texto externo se escapa.
import { calcular, evaluar, indicadores, multiplosHistoricos, METODOS, ESCENARIOS, FACTORES, FORMATO as F } from './motor.mjs';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fin = x => typeof x === 'number' && Number.isFinite(x);
const NOMBRE = { conservador: 'Conservador', base: 'Base', optimista: 'Optimista' };

export function moneda(v, cur) { return fin(v) ? `${esc(cur || '')} ${v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim() : 'N/D'; }

export function vistaEmpresa(exp) {
  const ev = evaluar(exp);
  const cur = exp.currency || '';
  if (ev.permitido === 'BLOQUEADO') {
    return `<section class="panel"><h2>${esc(exp.company || exp.ticker)} · bloqueado</h2>
      <p>No se muestra un valor numérico sin sustento. Pendientes:</p>${controles(ev)}</section>`;
  }
  const r = calcular(exp), base = r.escenarios.base.ponderado, precio = exp.market.sharePrice;
  const kpis = [
    ['Precio de mercado', moneda(precio, cur), esc(exp.market.fecha || '')],
    ['Valor por múltiplos · Base', moneda(base, cur), 'ponderado por método'],
    ['Precio con MOS 35 %', moneda(r.mos.precioMOS, cur), 'sobre el Base'],
    ['Brecha Base vs precio', fin(r.brecha) ? F.porcentaje(r.brecha) : 'N/D', r.brecha > 0 ? 'por encima del precio' : 'por debajo del precio'],
  ];
  if (fin(exp.v2Ref?.valorBase)) kpis.push(['Referencia V2 (DCF Base)', moneda(exp.v2Ref.valorBase, cur), 'informativa · no se promedia']);
  return `
  <header class="company-head"><div><span class="state" data-estado="${esc(ev.permitido)}">${esc(ev.permitido.replace('_', ' '))}</span>
    <h2>${esc(exp.company)} <small>${esc(exp.ticker)}</small></h2>
    <p>Perfil ${esc(exp.profile)} · corte ${esc(exp.asOf || exp.market.fecha)} · ${esc(exp.units || '')}</p></div></header>
  <p class="aviso">Valoración relativa <strong>sin DCF</strong>, complemento de V2. Cifras provisionales, para lectura y revisión; no es una aprobación ni una recomendación.
    Solicitud expresa: ${esc(exp.solicitudExpresa?.fecha)} — «${esc(exp.solicitudExpresa?.texto)}».</p>
  <div class="kpis">${kpis.map(([t, v, s]) => `<div class="kpi"><span>${esc(t)}</span><strong>${v}</strong><small>${s}</small></div>`).join('')}</div>
  ${panelEscenarios(exp, r, cur)}${panelCampo(exp, r)}${panelReferencias(exp, r)}${panelIndicadores(exp)}${panelSensibilidad(exp, r, cur)}
  <section class="panel"><h3>Controles</h3>${controles(ev)}</section>
  ${analisis(exp)}`;
}

function controles(ev) {
  if (!ev.controles.length) return '<p>Sin observaciones.</p>';
  return `<ul class="ctl">${ev.controles.map(c => `<li data-nivel="${esc(c.nivel)}"><b>${esc(c.id)}</b> · ${esc(c.nivel)} — ${esc(c.mensaje)}</li>`).join('')}</ul>`;
}

function panelEscenarios(exp, r, cur) {
  const filas = Object.keys(exp.pesos).filter(m => METODOS[m]).map(m => {
    const tds = ESCENARIOS.map(s => { const c = r.escenarios[s].porMetodo[m]; return `<td>${F.veces(c.multiplo)}<br><small>${c.origen === 'manual' ? 'manual' : c.origen ? 'referencia' : 'sin ref.'}</small></td><td>${moneda(c.valorPorAccion, cur)}</td>`; }).join('');
    return `<tr><th scope="row">${esc(m)}<br><small>${esc(METODOS[m].metrica)}</small></th><td>${(exp.pesos[m] * 100).toFixed(0)} %</td>${tds}</tr>`;
  }).join('');
  const tot = ESCENARIOS.map(s => `<td colspan="2"><strong>${moneda(r.escenarios[s].ponderado, cur)}</strong><br><small>cobertura ${(r.escenarios[s].cobertura * 100).toFixed(0)} % · ${r.escenarios[s].nMetodos} métodos</small></td>`).join('');
  return `<section class="panel"><h3>Valor por escenario y método</h3><div class="table-scroll"><table>
    <thead><tr><th>Método</th><th>Peso</th>${ESCENARIOS.map(s => `<th colspan="2">${NOMBRE[s]}<br><small>múltiplo · valor/acción</small></th>`).join('')}</tr></thead>
    <tbody>${filas}<tr class="total"><th scope="row">Valor ponderado</th><td>100 %</td>${tot}</tr></tbody></table></div>
    <p class="nota">${esc(exp.justificacionPesos)}</p></section>`;
}

function panelCampo(exp, r) {
  const ms = Object.keys(exp.pesos).filter(m => METODOS[m]);
  const vals = ms.flatMap(m => ESCENARIOS.map(s => r.escenarios[s].porMetodo[m].valorPorAccion)).filter(fin);
  if (!vals.length) return '';
  const precio = exp.market.sharePrice;
  const lo = Math.min(...vals, precio) * 0.95, hi = Math.max(...vals, precio) * 1.05, pos = v => ((v - lo) / (hi - lo) * 100).toFixed(2);
  const barras = ms.map(m => {
    const [c, b, o] = ESCENARIOS.map(s => r.escenarios[s].porMetodo[m].valorPorAccion);
    if (![c, b, o].every(fin)) return `<div class="ff-row"><span>${esc(m)}</span><em>N/M</em></div>`;
    const a = Math.min(c, o), z = Math.max(c, o);
    return `<div class="ff-row"><span>${esc(m)}</span><div class="ff-track"><i class="ff-bar" style="left:${pos(a)}%;width:${(pos(z) - pos(a)).toFixed(2)}%"></i><i class="ff-base" style="left:${pos(b)}%"></i></div></div>`;
  }).join('');
  return `<section class="panel"><h3>Rango por método (conservador – optimista; marca = base)</h3><div class="ff">${barras}<div class="ff-row"><span>Precio</span><div class="ff-track"><i class="ff-price" style="left:${pos(precio)}%"></i></div></div></div>
    <p class="nota">Eje: ${lo.toFixed(2)} a ${hi.toFixed(2)} por acción.</p></section>`;
}

function panelReferencias(exp, r) {
  const ms = Object.keys(exp.pesos).filter(m => METODOS[m]);
  const filas = ms.map(m => { const x = r.referencias[m]; return `<tr><th scope="row">${esc(m)}</th><td>${x.nPropios} + ${x.nPares}</td><td>${F.veces(x.min)}</td><td>${F.veces(x.p25)}</td><td>${F.veces(x.p50)}</td><td>${F.veces(x.p75)}</td><td>${F.veces(x.max)}</td><td>${F.veces(r.actuales[m])}</td></tr>`; }).join('');
  const pares = (exp.comparables || []).map(p => `<li>${esc(p.ticker)} — ${esc(p.fuente)} (${esc(p.fecha)})</li>`).join('');
  return `<section class="panel"><h3>Referencia de múltiplos (propios + comparables)</h3><div class="table-scroll"><table>
    <thead><tr><th>Método</th><th>Obs. propias + pares</th><th>Mín.</th><th>P25</th><th>Mediana</th><th>P75</th><th>Máx.</th><th>Actual</th></tr></thead><tbody>${filas}</tbody></table></div>
    ${pares ? `<details><summary>Comparables</summary><ul>${pares}</ul></details>` : ''}</section>`;
}

function panelIndicadores(exp) {
  const ind = indicadores(exp.history), hm = multiplosHistoricos(exp.history);
  const pct = v => F.porcentaje(v), x = F.veces;
  const filas = [['Crecimiento de ingresos', 'crecimiento', pct], ['Margen bruto', 'margenBruto', pct], ['Margen EBITDA', 'margenEbitda', pct], ['Margen EBIT', 'margenEbit', pct],
    ['Margen neto', 'margenNeto', pct], ['Margen FCFF', 'margenFcff', pct], ['ROE', 'roe', pct], ['ROIC', 'roic', pct], ['Deuda neta / EBITDA', 'deudaNetaEbitda', x]]
    .map(([t, k, f]) => `<tr><th scope="row">${t}</th>${ind.map(i => `<td>${f(i[k])}</td>`).join('')}</tr>`).join('');
  const ms = Object.keys(exp.pesos).filter(m => METODOS[m]);
  const mult = ms.map(m => `<tr><th scope="row">${esc(m)}</th>${hm.map(h => `<td>${x(h[m])}</td>`).join('')}</tr>`).join('');
  const head = `<tr><th></th>${ind.map(i => `<th>${esc(i.year)}</th>`).join('')}</tr>`;
  return `<section class="panel"><h3>Márgenes y retornos que respaldan la selección</h3><div class="table-scroll"><table class="num"><thead>${head}</thead><tbody>${filas}</tbody></table></div>
    <h3>Múltiplos propios por ejercicio</h3><div class="table-scroll"><table class="num"><thead>${head}</thead><tbody>${mult}</tbody></table></div></section>`;
}

function panelSensibilidad(exp, r, cur) {
  const bloques = Object.keys(r.sensibilidad).map(m => {
    const t = r.sensibilidad[m]; if (!t) return '';
    const cab = FACTORES.map(f => `<th>${(f * 100).toFixed(0)} %</th>`).join('');
    const body = t.map((fila, i) => `<tr><th scope="row">${(FACTORES[i] * 100).toFixed(0)} %</th>${fila.map((v, j) => `<td${i === 2 && j === 2 ? ' class="centro"' : ''}>${fin(v) ? v.toFixed(2) : 'N/M'}</td>`).join('')}</tr>`).join('');
    return `<details><summary>${esc(m)}</summary><div class="table-scroll"><table class="num"><thead><tr><th>Métrica ↓ / Múltiplo →</th>${cab}</tr></thead><tbody>${body}</tbody></table></div></details>`;
  }).join('');
  return `<section class="panel"><h3>Sensibilidad 5×5 (escenario Base, valor por acción en ${esc(cur)})</h3>${bloques}</section>`;
}

function analisis(exp) {
  const a = exp.analysis || {};
  const bloques = [['resumen', 'Resumen'], ['calidad', 'Calidad del negocio frente a la referencia'], ['riesgos', 'Riesgos de la lectura por múltiplos'], ['conclusion', 'Conclusión']]
    .filter(([k]) => a[k]).map(([k, t]) => `<h4>${t}</h4><p>${esc(a[k])}</p>`).join('');
  const pend = (exp.asuntosPorRevisar || []).map(x => `<li>${esc(typeof x === 'string' ? x : x.asunto)}</li>`).join('');
  return `<section class="panel"><h3>Análisis</h3>${bloques || '<p>Sin análisis redactado.</p>'}${pend ? `<h4>Asuntos por revisar</h4><ul>${pend}</ul>` : ''}</section>`;
}
