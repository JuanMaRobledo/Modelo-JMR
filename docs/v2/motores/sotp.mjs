// JMR V2.0 · Suma de partes (SOTP) para holdings y conglomerados.
// Fórmula por negocio: réplica verificada por matriz de paridad contra illGE.xlsx (Damodaran, GE):
//   NOPAT = (ingresos × margen − gastos corporativos asignados) × (1 − t);  ROIC = NOPAT / capital invertido
//   valor = NOPAT(1+g)(1−g/ROIC)(1−((1+g)/(1+k))^5)/(k−g) + [NOPAT(1+g)^5(1+rf)(1−rf/k)/(k−rf)]/(1+k)^5
//   (5 años a crecimiento g y reinversión g/ROIC; luego perpetuidad a la tasa libre con ROIC = k).
// Después: − deuda − minoritarios + caja − opciones, entre acciones. Ampliaciones de JMR (no están en el original):
//   participación económica por negocio, valores externos (negocios financieros valorados con su propio motor,
//   sin forzarles la fórmula industrial) y descuento de holding SOLO con justificación escrita.
const fin = x => typeof x === 'number' && Number.isFinite(x);

/** Valor de un negocio por la fórmula del original. Devuelve {status, ...}; no replica resultados sin sentido económico. */
export function valorNegocio({ nopat, growth, roic, k, rf }, { replicar = false } = {}) {
  if (![nopat, growth, roic, k, rf].every(fin)) return { status: 'INCOMPLETO', issues: ['Entradas no numéricas.'] };
  // replicar=true: solo para verificar la fórmula contra el libro original, que evalúa negocios con g ≥ k o NOPAT ≤ 0
  // (resultados sin sentido económico). Nunca se usa en valoraciones: el estado resultante es siempre REVISAR.
  const sinSentido = [];
  if (nopat <= 0) sinSentido.push('NOPAT normalizado no positivo');
  if (!(roic > 0)) sinSentido.push('ROIC no positivo');
  if (!(k > growth)) sinSentido.push('crecimiento a cinco años ≥ costo de capital');
  if (!(k > rf)) sinSentido.push('costo de capital ≤ tasa libre de riesgo');
  if (replicar && k !== growth && k !== rf && roic !== 0) {
    const explicito = nopat * (1 + growth) * (1 - growth / roic) * (1 - ((1 + growth) / (1 + k)) ** 5) / (k - growth);
    const terminal = (nopat * (1 + growth) ** 5 * (1 + rf) * (1 - rf / k) / (k - rf)) / (1 + k) ** 5;
    return { status: 'OK', value: explicito + terminal, explicito, terminal, sinSentido };
  }
  if (nopat <= 0) return { status: 'INCOMPLETO', issues: ['NOPAT normalizado no positivo: la fórmula cerrada no aplica; valorar el negocio con el motor FCFF por separado.'] };
  if (roic <= 0) return { status: 'INCOMPLETO', issues: ['ROIC no positivo.'] };
  if (!(k > growth)) return { status: 'INCOMPLETO', issues: ['Costo de capital debe superar el crecimiento a cinco años.'] };
  if (!(k > rf)) return { status: 'INCOMPLETO', issues: ['Costo de capital debe superar la tasa libre de riesgo (perpetuidad).'] };
  const explicito = nopat * (1 + growth) * (1 - growth / roic) * (1 - ((1 + growth) / (1 + k)) ** 5) / (k - growth);
  const terminal = (nopat * (1 + growth) ** 5 * (1 + rf) * (1 - rf / k) / (k - rf)) / (1 + k) ** 5;
  return { status: 'OK', value: explicito + terminal, explicito, terminal };
}

export function evaluarSOTP(i) {
  const req = ['riskFree', 'corporateExpenses', 'debt', 'minority', 'cash', 'options', 'shares'];
  const faltan = req.filter(k => !fin(i[k]));
  const taxRate = i.taxRate ?? 0.25;
  if (faltan.length) return { status: 'INCOMPLETO', issues: faltan.map(k => `Falta dato: ${k}`) };
  if (!Array.isArray(i.segmentos) || i.segmentos.length < 2) return { status: 'INCOMPLETO', issues: ['Un holding requiere al menos dos negocios o participaciones.'] };
  if (!(i.shares > 0) || !(taxRate >= 0 && taxRate < 1)) return { status: 'INCOMPLETO', issues: ['Acciones o tasa de impuestos inválidas.'] };
  const cerrados = i.segmentos.filter(s => !s.valorExterno);
  const totalRev = cerrados.reduce((s, x) => s + (fin(x.revenue) ? x.revenue : 0), 0);
  const issues = [], warnings = [], notas = [], detalle = [];
  let sumaEV = 0, sumaEquityExterno = 0;
  for (const s of i.segmentos) {
    const own = s.ownership ?? 1;
    if (!(own > 0 && own <= 1)) { issues.push(`${s.nombre || s.id}: participación económica fuera de (0, 1].`); continue; }
    if (s.valorExterno) {
      const v = s.valorExterno;
      if (!fin(v.valor) || !['ev', 'equity'].includes(v.tipoValor) || !v.fuente) { issues.push(`${s.nombre || s.id}: el valor externo requiere valor, tipoValor (ev|equity) y fuente.`); continue; }
      const atribuible = v.valor * own;
      if (v.tipoValor === 'ev') sumaEV += atribuible; else sumaEquityExterno += atribuible;
      detalle.push({ id: s.id, nombre: s.nombre, metodo: 'externo', revenue: s.revenue ?? null, tipoValor: v.tipoValor, ownership: own, value: v.valor, attributable: atribuible });
      continue;
    }
    if (![s.revenue, s.margin, s.capital, s.costOfCapital, s.growth5].every(fin) || !(s.capital > 0)) { issues.push(`${s.nombre || s.id}: faltan ingresos, margen, capital invertido, costo de capital o crecimiento.`); continue; }
    const share = fin(s.share) ? s.share : (totalRev > 0 ? s.revenue / totalRev : 0);
    const ebitAntes = s.revenue * s.margin, ebit = ebitAntes - i.corporateExpenses * share, nopat = ebit * (1 - taxRate), roic = nopat / s.capital;
    const r = valorNegocio({ nopat, growth: s.growth5, roic, k: s.costOfCapital, rf: i.riskFree }, { replicar: !!i.modoReplicacion });
    if (r.status !== 'OK') { issues.push(`${s.nombre || s.id}: ${r.issues.join(' ')}`); continue; }
    if (r.sinSentido?.length) warnings.push(`${s.nombre || s.id}: valor replicado del original sin sentido económico (${r.sinSentido.join('; ')}).`);
    if (roic > 0.5) warnings.push(`${s.nombre || s.id}: ROIC normalizado ${(roic * 100).toFixed(0)} % inusualmente alto; revisar capital invertido.`);
    sumaEV += r.value * own;
    detalle.push({ id: s.id, nombre: s.nombre, metodo: 'sotp-damodaran', revenue: s.revenue, ownership: own, share, ebitBeforeCorporate: ebitAntes, ebit, nopat, roic, costOfCapital: s.costOfCapital, growth5: s.growth5,
      value: r.value, explicit: r.explicito, terminal: r.terminal, attributable: r.value * own });
  }
  if (issues.length) return { status: 'INCOMPLETO', issues };
  const equity = sumaEV + sumaEquityExterno - i.debt - i.minority + i.cash, equityComun = equity - i.options;
  let descuento = 0;
  const d = i.holdingDiscount;
  if (d && d.porcentaje) {
    if (!(d.porcentaje > 0 && d.porcentaje < 0.5)) return { status: 'INCOMPLETO', issues: ['Descuento de holding fuera de (0 %, 50 %).'] };
    if (String(d.justificacion || '').trim().length < 40) return { status: 'INCOMPLETO', issues: ['Un descuento de holding exige justificación económica explícita (estructura, caja atrapada, costos de control); no se aplican descuentos arbitrarios.'] };
    descuento = d.porcentaje;
  }
  const equityFinal = equityComun > 0 ? equityComun * (1 - descuento) : equityComun, perShare = equityFinal / i.shares;
  if (i.segmentos.some(s => (s.ownership ?? 1) < 1) && i.minority > 0) notas.push('Hay participaciones parciales y minoritarios restados: confirmar que no se descuentan dos veces el mismo interés.');
  if (i.segmentos.some(s => s.valorExterno) && i.corporateExpenses > 0) notas.push('Los gastos corporativos se asignan solo a negocios valorados por fórmula; confirmar que los valores externos no los omiten ni duplican.');
  if (equityComun <= 0) warnings.push('Patrimonio no positivo tras deudas y minoritarios.');
  return { status: warnings.length ? 'REVISAR' : 'CANDIDATO', issues: [], warnings, notas, segmentos: detalle, sumaNegocios: sumaEV + sumaEquityExterno, sumaEV, sumaEquityExterno,
    debt: i.debt, minority: i.minority, cash: i.cash, equity, options: i.options, equityComun, holdingDiscount: descuento, equityFinal, perShare };
}

// ───────── Tres escenarios y sensibilidad ─────────
export const SCENARIOS = ['conservador', 'base', 'optimista'];
export function entradas(model, nombre, ajuste = {}) {
  const f = model.financials || {}, a = model.assumptions?.[nombre] || {};
  const segmentos = (model.segmentos || []).map(s => {
    const e = s.escenarios?.[nombre] || {};
    return { ...s, ...e, costOfCapital: (e.costOfCapital ?? s.costOfCapital) + (ajuste.k || 0), growth5: (e.growth5 ?? s.growth5) + (ajuste.g || 0) };
  }).map(s => s.valorExterno ? { ...s, valorExterno: s.escenarios?.[nombre]?.valorExterno ?? s.valorExterno } : s);
  return { riskFree: a.riskFree, taxRate: a.taxRate, holdingDiscount: a.holdingDiscount, corporateExpenses: f.corporateExpenses, debt: f.debt, minority: f.minority,
    cash: f.cash, options: f.options ?? 0, shares: f.shares, segmentos };
}
export function calculateAll(model) {
  const meta = { ticker: model?.ticker || '', company: model?.company || '', units: model?.units || '', currency: model?.currency || '' };
  if (!model?.financials || !model.assumptions || !Array.isArray(model.segmentos)) return { status: 'INCOMPLETO', issues: ['Faltan datos, supuestos o negocios.'], scenarios: {}, meta };
  const scenarios = {};
  for (const n of SCENARIOS) {
    const a = model.assumptions[n];
    if (!a) { scenarios[n] = { status: 'INCOMPLETO', issues: [`Faltan supuestos del escenario ${n}.`] }; continue; }
    if (!fin(a.mos) || a.mos < 0 || a.mos >= 1) { scenarios[n] = { status: 'INCOMPLETO', issues: ['Margen de seguridad fuera de rango.'] }; continue; }
    const r = evaluarSOTP(entradas(model, n));
    scenarios[n] = r.perShare === undefined ? r : { ...r, mosPrice: r.perShare * (1 - a.mos) };
  }
  return { status: Object.values(scenarios).every(s => s.status === 'CANDIDATO') ? 'CANDIDATO' : 'INCOMPLETO', scenarios, meta, metodo: 'sotp' };
}
/** Sensibilidad del escenario base: desplazamiento del costo de capital de todos los negocios × desplazamiento de su crecimiento a 5 años. */
export function sensibilidad(model, nombre = 'base', size = 5) {
  if (!model?.assumptions?.[nombre]) return { status: 'INCOMPLETO', issues: ['Sin supuestos.'] };
  const base = evaluarSOTP(entradas(model, nombre));
  if (!['CANDIDATO', 'REVISAR'].includes(base.status)) return { status: base.status, issues: base.issues };
  const c = Math.floor(size / 2), pp = x => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1).replace('.', ',')} pp`;
  const dg = Array.from({ length: size }, (_, j) => (j - c) * 0.01), rows = [];
  for (let i = 0; i < size; i++) {
    const dk = (i - c) * 0.005;
    rows.push({ etiqueta: pp(dk), cells: dg.map(g => { const r = evaluarSOTP(entradas(model, nombre, { k: dk, g })); return ['CANDIDATO', 'REVISAR'].includes(r.status) ? r.perShare : null; }) });
  }
  return { status: 'CANDIDATO', growths: dg, etiquetasColumna: dg.map(pp), rows, centerValue: rows[c].cells[c], ejes: 'Δ costo de capital (filas) × Δ crecimiento a 5 años (columnas)' };
}
