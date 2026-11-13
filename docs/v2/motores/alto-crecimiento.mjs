// JMR V2.0 · motor de empresas de alto crecimiento (pérdidas operativas, márgenes en transición, crecimiento extraordinario).
// Réplica analítica verificada por matriz de paridad contra higrowth.xls y revgrowth.xls (Damodaran).
// Configuración soportada de higrowth: sin arrendamientos, I+D ni otros gastos a capitalizar; sin opciones calculadas dentro del motor
// (se recibe su valor ya calculado); capex por sales-to-capital (opción 3: FCFF = NOPAT − ΔIngresos/S2C; depreciación y capital de trabajo se cancelan).
// Lo no replicado se rechaza de forma explícita; no se aproxima en silencio. Preferir Simple Ginsu cuando sea suficiente.
const fin = x => typeof x === 'number' && Number.isFinite(x);
const AÑOS = 10;

/** revgrowth.xls · enfoque de participación de mercado. */
export function crecimientoPorParticipacion({ revenue0, marketSize, marketGrowth, share5, share10 }) {
  if (![revenue0, marketSize, marketGrowth, share5, share10].every(fin) || revenue0 <= 0 || marketSize <= 0) return { status: 'INCOMPLETO', issues: ['Faltan ingresos, tamaño de mercado, crecimiento o participaciones (positivos).'] };
  if (!(share5 > 0 && share10 > 0 && share5 <= 1 && share10 <= 1)) return { status: 'INCOMPLETO', issues: ['Las participaciones de mercado deben estar en (0, 1].'] };
  const rev5 = marketSize * (1 + marketGrowth) ** 5 * share5, rev10 = marketSize * (1 + marketGrowth) ** 10 * share10;
  return { status: 'OK', revenue5: rev5, revenue10: rev10, growth1to5: (rev5 / revenue0) ** (1 / 5) - 1, growth6to10: (rev10 / rev5) ** (1 / 5) - 1, growth1to10: (rev10 / revenue0) ** (1 / 10) - 1 };
}

export function evaluarAltoCrecimiento(i) {
  const noSoportado = ['arrendamientos', 'capitalizarID', 'otrosGastosCapitalizables'].filter(k => i[k]);
  if (noSoportado.length) return { status: 'INCOMPLETO', issues: [`Ajustes no replicados en este motor (${noSoportado.join(', ')}): usar el libro Damodaran original o el motor Simple Ginsu documentado.`] };
  if (i.metodoCapex !== undefined && i.metodoCapex !== 3) return { status: 'INCOMPLETO', issues: ['Solo se replica el capex por sales-to-capital (opción 3).'] };
  const req = ['ebit0', 'revenue0', 'nol', 'taxRate', 'beta', 'costOfDebt', 'marketDebt', 'shares', 'price', 'cash', 'nonOperatingAssets', 'riskFree', 'erp',
    'stableGrowth', 'stableMargin', 'stableDebtRatio', 'stableBeta', 'stableCostOfDebt', 'stableRoc', 'speed', 'salesToCapital'];
  const faltan = req.filter(k => !fin(i[k]));
  const growth = Array.isArray(i.growth) && i.growth.length === AÑOS ? i.growth : fin(i.cagr) ? Array(AÑOS).fill(i.cagr) : null;
  if (faltan.length || !growth || !growth.every(fin)) return { status: 'INCOMPLETO', issues: [...faltan.map(k => `Falta dato: ${k}`), ...(growth && growth.every(fin) ? [] : ['Faltan crecimientos (10 valores anuales o cagr).'])] };
  const issues = [];
  if (!(i.revenue0 > 0 && i.shares > 0 && i.price > 0)) issues.push('Ingresos, acciones y precio deben ser positivos.');
  if (!(i.salesToCapital > 0 && i.stableRoc > 0)) issues.push('Sales-to-capital y ROC estable deben ser positivos.');
  if (!(i.speed >= 0)) issues.push('La velocidad de convergencia no puede ser negativa.');
  if (!(i.stableDebtRatio >= 0 && i.stableDebtRatio < 1)) issues.push('Razón de deuda estable fuera de [0, 1).');
  if (!(i.taxRate >= 0 && i.taxRate < 1)) issues.push('Tasa marginal fuera de [0, 1).');
  if (growth.some(g => g <= -1)) issues.push('Crecimiento anual ≤ −100 %.');
  if (i.nol < 0) issues.push('NOL no puede ser negativo.');
  if (issues.length) return { status: 'INCOMPLETO', issues };
  const T = i.taxRate, c = i.speed, ke = b => i.riskFree + b * i.erp;
  const dr0 = i.marketDebt / (i.marketDebt + i.shares * i.price);
  const years = []; let rev = i.revenue0, m = i.ebit0 / i.revenue0, nol = i.nol, cum = 1, ktRate;
  for (let t = 1; t <= AÑOS; t++) {
    const g = growth[t - 1], prev = rev;
    rev *= 1 + g; m = (m * c + i.stableMargin) / (1 + c);              // convergencia geométrica al margen estable
    const ebit = m * rev, tax = ebit < 0 ? 0 : nol > ebit ? 0 : (ebit - nol) * T;
    const nolEnd = ebit < nol ? nol - ebit : 0, nopat = ebit - tax;
    const reinvestment = (rev - prev) / i.salesToCapital, fcff = nopat - reinvestment;
    const interp = (a, b) => t <= 5 ? a : a + (b - a) / (AÑOS - t + 1);   // original: deuda y costo de deuda, 1/5, 1/4 … 1/1 desde el año 6
    const dr = interp(dr0, i.stableDebtRatio), kd = interp(i.costOfDebt, i.stableCostOfDebt);
    const beta = t <= 5 ? i.beta : i.beta + ((i.stableBeta - i.beta) / 5) * (t - 5);
    const effTax = ebit > 0 ? tax / ebit : 0;                           // ebit = 0 daría #DIV/0! en el original; aquí 0
    const wacc = ke(beta) * (1 - dr) + kd * (1 - effTax) * dr;
    cum *= 1 + wacc;
    years.push({ year: t, growth: g, revenue: rev, margin: m, ebit, taxes: tax, taxRate: effTax, nopat, reinvestment, fcff, nol: nolEnd, debtRatio: dr, beta, costOfDebt: kd, wacc, discountFactor: cum, pvFcff: fcff / cum });
    nol = nolEnd;
  }
  const revT = rev * (1 + i.stableGrowth), ebitT = i.stableMargin * revT, nopatT = ebitT - ebitT * T;
  const fcffT = nopatT * (1 - i.stableGrowth / i.stableRoc);
  const waccT = ke(i.stableBeta) * (1 - i.stableDebtRatio) + i.stableCostOfDebt * (1 - T) * i.stableDebtRatio;
  if (!(waccT > i.stableGrowth)) return { status: 'INCOMPLETO', issues: ['El costo de capital terminal debe superar el crecimiento estable.'] };
  const nolT = ebitT < nol ? nol - ebitT : 0;
  const terminalValue = fcffT / (waccT - i.stableGrowth) + (nolT > 0 ? nolT * T : 0);   // original: el NOL residual se suma al valor terminal
  const sumPV = years.reduce((s, y) => s + y.pvFcff, 0), pvTerminal = terminalValue / cum;
  const operatingAssets = sumPV + pvTerminal, firm = operatingAssets + i.cash + i.nonOperatingAssets, equity = firm - i.marketDebt;
  const options = (i.optionsValue ?? 0) * (1 - T), equityCommon = equity - options, perShare = equityCommon / i.shares;
  const warnings = [];
  if (!(nopatT > 0)) warnings.push('NOPAT terminal no positivo: la perpetuidad no es sostenible.');
  if (terminalValue < 0) warnings.push('Valor terminal negativo.');
  if (i.stableRoc > waccT + 0.10) warnings.push('ROC estable supera el costo de capital terminal en más de 10 pp: justificar ventaja competitiva permanente.');
  if (i.stableGrowth > i.riskFree) warnings.push('Crecimiento estable superior a la tasa libre de riesgo.');
  if (nolT > 0) warnings.push('NOL residual al final del año 10: se suma su ahorro fiscal al valor terminal como en el original; revisar su vigencia.');
  if (!(perShare > 0)) warnings.push('Valor por acción no positivo.');
  return { status: warnings.length ? 'REVISAR' : 'CANDIDATO', issues: [], warnings, years, sumPV, terminal: { revenue: revT, ebit: ebitT, nopat: nopatT, fcff: fcffT, wacc: waccT, nol: nolT },
    terminalValue, pvTerminal, ev: operatingAssets, operatingAssets, firm, equity, options, equityCommon, perShare, waccInitial: years[0].wacc, waccTerminal: waccT, terminalDiscountFactor: cum };
}

// ───────── Tres escenarios y sensibilidad ─────────
export const SCENARIOS = ['conservador', 'base', 'optimista'];
const entradas = (model, n, aj = {}) => {
  const f = model.financials || {}, a = model.assumptions?.[n] || {};
  return { ebit0: f.ebit0, revenue0: f.revenue0, nol: f.nol, taxRate: f.taxRate, marketDebt: f.marketDebt, shares: f.shares, price: f.sharePrice, cash: f.cash,
    nonOperatingAssets: f.nonOperatingAssets, optionsValue: f.optionsValue ?? 0, ...a, stableMargin: (a.stableMargin ?? NaN) + (aj.margin || 0), salesToCapital: (a.salesToCapital ?? NaN) * (aj.s2c || 1) };
};
export function calculateAll(model) {
  const meta = { ticker: model?.ticker || '', company: model?.company || '', units: model?.units || '', currency: model?.currency || '' };
  if (!model?.financials || !model.assumptions) return { status: 'INCOMPLETO', issues: ['Faltan datos o supuestos.'], scenarios: {}, meta };
  const scenarios = {};
  for (const n of SCENARIOS) {
    const a = model.assumptions[n];
    if (!a) { scenarios[n] = { status: 'INCOMPLETO', issues: [`Faltan supuestos del escenario ${n}.`] }; continue; }
    if (!fin(a.mos) || a.mos < 0 || a.mos >= 1) { scenarios[n] = { status: 'INCOMPLETO', issues: ['Margen de seguridad fuera de rango.'] }; continue; }
    const r = evaluarAltoCrecimiento(entradas(model, n));
    scenarios[n] = r.perShare === undefined ? r : { ...r, mosPrice: r.perShare * (1 - a.mos) };
  }
  return { status: Object.values(scenarios).every(s => s.status === 'CANDIDATO') ? 'CANDIDATO' : 'INCOMPLETO', scenarios, meta, metodo: 'higrowth' };
}
/** Margen operativo estable (filas) × sales-to-capital (columnas), recalculando el motor completo. */
export function sensibilidad(model, nombre = 'base', size = 5) {
  if (!model?.assumptions?.[nombre]) return { status: 'INCOMPLETO', issues: ['Sin supuestos.'] };
  const base = evaluarAltoCrecimiento(entradas(model, nombre));
  if (!['CANDIDATO', 'REVISAR'].includes(base.status)) return { status: base.status, issues: base.issues };
  const c = Math.floor(size / 2), pp = x => `${x > 0 ? '+' : ''}${(x * 100).toFixed(1).replace('.', ',')} pp`, mult = x => `×${x.toFixed(2).replace('.', ',')}`;
  const dm = Array.from({ length: size }, (_, i) => (i - c) * 0.02), ms = Array.from({ length: size }, (_, j) => 1 + (j - c) * 0.2), rows = [];
  for (let i = 0; i < size; i++) rows.push({ etiqueta: pp(dm[i]), cells: ms.map(s => { const r = evaluarAltoCrecimiento(entradas(model, nombre, { margin: dm[i], s2c: s })); return ['CANDIDATO', 'REVISAR'].includes(r.status) ? r.perShare : null; }) });
  return { status: 'CANDIDATO', growths: ms, etiquetasColumna: ms.map(mult), rows, centerValue: rows[c].cells[c], ejes: 'Δ margen operativo estable (filas) × sales-to-capital (columnas)' };
}
