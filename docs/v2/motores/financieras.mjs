// JMR V2.0 · motores de equity para bancos y aseguradoras.
// Réplica analítica, verificada por matriz de paridad contra los originales de Damodaran:
//   evaluarDDM            ← divginzu.xlsx   (Dividend Discount Ginsu, 0–15 años; aquí 1–15)
//   evaluarExcesoRetorno  ← eqexret.xls     (Equity Excess Return, 1–10 años)
// Se conservan a propósito las particularidades de los originales (documentadas abajo).
// NO sustituye el criterio sectorial: capital regulatorio, riesgo de crédito y solvencia se
// documentan en el expediente (docs/procesos-sectoriales). Estos motores solo valoran el equity.
const fin = x => typeof x === 'number' && Number.isFinite(x);

/** Interpolación de la segunda mitad usada por ambos originales:
 *  primera mitad = valor de alto crecimiento; luego lineal hasta el valor estable en el último año. */
const desvanece = (hg, st, t, n, activo) => !activo || t < n / 2 ? hg : st + ((hg - st) / (n / 2)) * (n - t);

export function evaluarDDM(i) {
  const req = ['netIncome', 'bookEquityPrior', 'dividends', 'shares', 'beta', 'riskFree', 'erp', 'years'];
  const faltan = req.filter(k => !fin(i[k]));
  if (faltan.length) return { status: 'INCOMPLETO', issues: faltan.map(k => `Falta dato: ${k}`) };
  const n = i.years, issues = [];
  if (!(Number.isInteger(n) && n >= 1 && n <= 15)) issues.push('Años de alto crecimiento: entero entre 1 y 15 (el original con 0 años divide dos veces por acciones).');
  if (i.netIncome <= 0) issues.push('Utilidad neta no positiva: el DDM por fundamentos no es aplicable; usar normalización documentada.');
  if (i.bookEquityPrior <= 0 || i.shares <= 0) issues.push('Patrimonio previo y acciones deben ser positivos.');
  if (issues.length) return { status: 'INCOMPLETO', issues };
  const roeF = i.netIncome / i.bookEquityPrior, retF = 1 - i.dividends / i.netIncome;
  const cambiaHG = !!i.changeHighGrowth, roeHG = cambiaHG ? i.roeHighGrowth : roeF, retHG = cambiaHG ? (i.retentionHighGrowth ?? retF) : retF;
  const gHG = i.growthFromFundamentals === false ? i.growthManual : roeHG * retHG;
  const payoutHG = 1 - retHG, keHG = i.riskFree + i.beta * i.erp;
  const roeBase = cambiaHG ? i.roeHighGrowth : roeF;                       // B25/B29 del original
  const roeStable = i.changeStable ? i.roeStable : roeHG;                  // D21
  const gStable = i.overrideStableGrowth ? i.stableGrowth : i.riskFree;    // D22
  const roeParaPayout = i.changeStable ? i.roeStable : roeBase;            // B41
  const payoutFund = 1 - gStable / roeParaPayout;
  const payoutStable = i.overrideStablePayout ? i.stablePayout : payoutFund; // D23
  const keStable = i.riskFree + (i.changeStableBeta ? i.stableBeta : i.beta) * i.erp; // D24
  if (![gHG, payoutHG, payoutStable, gStable].every(fin)) return { status: 'INCOMPLETO', issues: ['Supuestos de crecimiento o payout no numéricos.'] };
  if (!(keStable > gStable)) return { status: 'INCOMPLETO', issues: ['Costo del patrimonio estable debe superar el crecimiento estable.'] };
  const fade = i.fade !== false, rows = []; let earn = i.netIncome, cum = 1;
  for (let t = 1; t <= n; t++) {
    const g = desvanece(gHG, gStable, t, n, fade);
    if (t > 1) earn *= 1 + g;                     // Original: el año 1 usa la utilidad base sin crecimiento (C14 = D5)
    const payout = desvanece(payoutHG, payoutStable, t, n, fade), ke = desvanece(keHG, keStable, t, n, fade);
    cum *= 1 + ke;
    const dividend = earn * payout;
    rows.push({ year: t, growth: g, earnings: earn, payout, costOfEquity: ke, dividend, cumulative: cum, pv: dividend / cum });
  }
  // Original: valor terminal sobre MAX(utilidades) y MAX(factor acumulado) (coincide con el último año salvo caída de utilidades).
  const maxEarn = Math.max(...rows.map(r => r.earnings)), maxCum = Math.max(...rows.map(r => r.cumulative));
  const terminalValue = maxEarn * (1 + gStable) * payoutStable / (keStable - gStable);
  const pvDividends = rows.reduce((s, r) => s + r.pv, 0), pvTerminal = terminalValue / maxCum;
  const equity = pvDividends + pvTerminal, perShare = equity / i.shares;
  const warnings = [];
  if (payoutStable < 0 || payoutStable > 1) warnings.push('Payout estable fuera de [0, 1]: revisar ROE estable frente al crecimiento.');
  if (roeStable < keStable) warnings.push('ROE estable menor que el costo del patrimonio: la perpetuidad destruye valor (coherente solo si está justificado).');
  if (gStable > i.riskFree) warnings.push('Crecimiento estable superior a la tasa libre de riesgo.');
  if (!(perShare > 0)) warnings.push('Valor por acción no positivo.');
  return { status: warnings.length ? 'REVISAR' : 'CANDIDATO', issues: [], warnings, years: rows, costOfEquity: keHG, growthHighGrowth: gHG,
    payoutHighGrowth: payoutHG, growthStable: gStable, payoutStable, costOfEquityStable: keStable, terminalValue, pvDividends, pvTerminal, equity, perShare };
}

export function evaluarExcesoRetorno(i) {
  const req = ['bookEquity', 'shares', 'beta', 'riskFree', 'erp', 'years', 'roeHighGrowth', 'retentionHighGrowth', 'stableGrowth'];
  const faltan = req.filter(k => !fin(i[k]));
  if (faltan.length) return { status: 'INCOMPLETO', issues: faltan.map(k => `Falta dato: ${k}`) };
  const n = i.years, issues = [];
  if (!(Number.isInteger(n) && n >= 1 && n <= 10)) issues.push('Años de alto crecimiento: entero entre 1 y 10 (límite del original).');
  if (i.bookEquity <= 0 || i.shares <= 0) issues.push('Patrimonio contable y acciones deben ser positivos.');
  if (issues.length) return { status: 'INCOMPLETO', issues };
  const roeHG = i.roeHighGrowth, retHG = i.retentionHighGrowth, g = i.stableGrowth, ke = i.riskFree + i.beta * i.erp;
  const roeStable = i.changeStable === false ? roeHG : i.roeStable;
  const keStable = i.changeStableBeta === false ? ke : i.riskFree + i.stableBeta * (i.stableErp ?? i.erp);
  const payoutStable = i.overrideStablePayout ? i.stablePayout : 1 - g / (i.changeStable === false ? roeHG : i.roeStable);
  if (![roeStable, keStable, payoutStable].every(fin)) return { status: 'INCOMPLETO', issues: ['Supuestos estables no numéricos.'] };
  if (!(keStable > g)) return { status: 'INCOMPLETO', issues: ['Costo del patrimonio estable debe superar el crecimiento estable.'] };
  const fade = i.fade !== false, rows = []; let bv = i.bookEquity, cum = 1;
  for (let t = 1; t <= n; t++) {
    const roe = desvanece(roeHG, roeStable, t, n, fade), k = desvanece(ke, keStable, t, n, fade), payout = desvanece(1 - retHG, payoutStable, t, n, fade);
    const ni = bv * roe, cost = bv * k, excess = ni - cost; cum *= 1 + k;
    rows.push({ year: t, beginningBook: bv, roe, costOfEquity: k, netIncome: ni, equityCost: cost, excess, payout, cumulative: cum });
    bv += ni - ni * payout;                       // retención: BV_{t+1} = BV_t + NI − dividendos
  }
  const bvTerminal = Math.max(...rows.map(r => r.beginningBook)) * (1 + g);   // Original: MAX(BV inicial) × (1+g)
  const excessTerminal = bvTerminal * roeStable - bvTerminal * keStable;
  const terminalValue = excessTerminal / (keStable - g);
  rows.forEach(r => { r.pv = (r.excess + (r.year === n ? terminalValue : 0)) / r.cumulative; });
  const pvExcess = rows.reduce((s, r) => s + r.pv, 0), equity = i.bookEquity + pvExcess, perShare = equity / i.shares;
  const warnings = [];
  if (roeStable < keStable) warnings.push('ROE estable menor que el costo del patrimonio: exceso de retorno terminal negativo.');
  if (g > i.riskFree) warnings.push('Crecimiento estable superior a la tasa libre de riesgo.');
  if (!(perShare > 0)) warnings.push('Valor por acción no positivo.');
  return { status: warnings.length ? 'REVISAR' : 'CANDIDATO', issues: [], warnings, years: rows, costOfEquity: ke, costOfEquityStable: keStable,
    roeStable, payoutStable, terminalValue, pvExcess, equity, perShare };
}

// ───────── Tres escenarios para bancos y aseguradoras (mismo motor, distintos supuestos) ─────────
export const SCENARIOS = ['conservador', 'base', 'optimista'];
export const METODOS = ['ddm', 'exceso'];
const entradas = (metodo, f, a) => metodo === 'ddm'
  ? { netIncome: f.netIncome, bookEquityPrior: f.bookEquityPrior, dividends: f.dividends, shares: f.shares, ...a }
  : { bookEquity: f.bookEquity, shares: f.shares, ...a };
const evaluar = (metodo, f, a) => metodo === 'ddm' ? evaluarDDM(entradas(metodo, f, a)) : evaluarExcesoRetorno(entradas(metodo, f, a));

export function calculateAll(model) {
  const meta = { ticker: model?.ticker || '', company: model?.company || '', units: model?.units || '', currency: model?.currency || '' };
  if (!model?.financials || !model.assumptions) return { status: 'INCOMPLETO', issues: ['Faltan datos o supuestos.'], scenarios: {}, meta };
  if (!METODOS.includes(model.metodo)) return { status: 'INCOMPLETO', issues: [`Método «${model.metodo}» no reconocido (ddm | exceso).`], scenarios: {}, meta };
  const scenarios = {};
  for (const n of SCENARIOS) {
    const a = model.assumptions[n];
    if (!a) { scenarios[n] = { status: 'INCOMPLETO', issues: [`Faltan supuestos del escenario ${n}.`] }; continue; }
    const r = evaluar(model.metodo, model.financials, a);
    if (!fin(a.mos) || a.mos < 0 || a.mos >= 1) scenarios[n] = { status: 'INCOMPLETO', issues: ['Margen de seguridad fuera de rango.'] };
    else scenarios[n] = r.perShare === undefined ? r : { ...r, mosPrice: r.perShare * (1 - a.mos) };
  }
  const ok = Object.values(scenarios).every(s => s.status === 'CANDIDATO');
  return { status: ok ? 'CANDIDATO' : 'INCOMPLETO', scenarios, meta, metodo: model.metodo };
}

/** Sensibilidad reproducible del escenario: prima de riesgo (Ke) × crecimiento estable, recalculando el motor completo. */
export function sensibilidad(model, nombre = 'base', size = 5) {
  const a = model?.assumptions?.[nombre];
  if (!a || !METODOS.includes(model.metodo)) return { status: 'INCOMPLETO', issues: ['Sin supuestos.'] };
  const c = Math.floor(size / 2), g0 = model.metodo === 'ddm' ? (a.overrideStableGrowth ? a.stableGrowth : a.riskFree) : a.stableGrowth;
  const base = evaluar(model.metodo, model.financials, a);
  if (!['CANDIDATO', 'REVISAR'].includes(base.status)) return { status: base.status, issues: base.issues };
  const growths = Array.from({ length: size }, (_, j) => g0 + (j - c) * 0.005), rows = [];
  for (let i = 0; i < size; i++) {
    const erp = a.erp + (i - c) * 0.005, cells = growths.map(g => {
      const r = evaluar(model.metodo, model.financials, { ...a, erp, stableGrowth: g, overrideStableGrowth: true });
      return ['CANDIDATO', 'REVISAR'].includes(r.status) ? r.perShare : null;
    });
    rows.push({ costOfEquity: base.costOfEquity + (i - c) * 0.005 * a.beta, erp, cells });
  }
  return { status: 'CANDIDATO', growths, rows, centerValue: rows[c].cells[c] };
}
