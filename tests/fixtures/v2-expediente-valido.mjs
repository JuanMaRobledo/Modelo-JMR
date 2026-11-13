// Expediente SINTÉTICO coherente derivado del ejemplo del motor; solo para ejercitar controles y catálogo.
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('../../docs/jmr-v2.html', import.meta.url), 'utf8');
export const demo = vm.runInNewContext('(' + html.match(/const JMR_DEMO=(\{.*\});/)[1] + ')', {});
export function valido(ticker = 'TEST') {
  const m = structuredClone(demo);
  delete m.fictional; m.status = undefined; m.estado = 'PUBLICADO'; m.ticker = ticker; m.company = `Empresa de prueba ${ticker}`;
  const prov = k => ({ destino: `financials.${k}`, documento: 'Informe anual (prueba)', periodo: 2025, pagina: 80, moneda: 'USD', unidades: 'millones', valorReportado: m.financials[k], ajuste: 0 });
  m.provenance = ['revenue', 'debt', 'cash', 'minority', 'nonoperatingAssets', 'shares'].map(prov);
  m.history.forEach(x => { x.liabilities = +(x.assets - x.equity).toFixed(3); });
  m.sources = [{ documento: 'Informe anual (prueba)', url: null }];
  const t = 'Texto de análisis con evidencia suficiente para superar el mínimo exigido por el control.';
  m.analysis = Object.fromEntries(['business', 'moat', 'story', 'risks', 'conclusion'].map(k => [k, t]));
  m.libro = { id: 'LIBRO-PRUEBA', sha256: 'a'.repeat(64) };
  m.auditoria = { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' };
  return m;
}

/** Expediente SINTÉTICO de banco o aseguradora, coherente con sus controles. Solo para pruebas. */
export function validoFinanciero(profile = 'banco', ticker = 'BNK', metodo = 'ddm') {
  const años = Array.from({ length: 10 }, (_, k) => 2016 + k);
  let eq = 8000;
  const history = años.map(y => {
    const prev = eq, netIncome = +(prev * 0.115).toFixed(2), dividends = +(netIncome * 0.4).toFixed(2);
    eq = +(prev + netIncome - dividends).toFixed(2);
    const assets = +(eq * 11).toFixed(2);
    return { year: y, netIncome, dividends, equity: eq, assets, liabilities: +(assets - eq).toFixed(2), shares: 1000 };
  });
  const u = history.at(-1), p = history.at(-2);
  const financials = { netIncome: u.netIncome, bookEquity: u.equity, bookEquityPrior: p.equity, dividends: u.dividends, shares: 1000, sharePrice: 14 };
  const base = { beta: 1.0, riskFree: 0.04, erp: 0.05, years: 10, growthFromFundamentals: true, changeHighGrowth: true, retentionHighGrowth: 0.6,
    changeStable: true, roeStable: 0.10, fade: true, mos: 0.35, stableGrowth: 0.03, changeStableBeta: false };
  const asum = r => ({ ...base, roeHighGrowth: r });
  const m = {
    schemaVersion: 'jmr-v2-0.2', ticker, company: `Entidad de prueba ${ticker}`, profile, metodo, currency: 'USD', units: 'millones, excepto valor/acción',
    asOf: '2026-11-13', estado: 'PUBLICADO', financials, history,
    assumptions: { conservador: asum(0.10), base: asum(0.115), optimista: asum(0.13) },
    regulatorio: profile === 'banco' ? { cet1: 0.131, cet1Minimo: 0.105, fecha: '2025-12-31', fuente: 'Pilar 3 (prueba)' }
      : { solvencyRatio: 1.85, solvencyMinimo: 1.0, fecha: '2025-12-31', fuente: 'Informe de solvencia (prueba)' },
    justificaciones: { metodo: 'Política de reparto estable y observable durante diez años: el DDM refleja la capacidad distribuible.' },
    provenance: CAMPOS.map(k => ({ destino: `financials.${k}`, documento: 'Informe anual (prueba)', periodo: 2025, pagina: 120, moneda: 'USD', unidades: 'millones', valorReportado: financials[k], ajuste: 0 })),
    sources: [{ documento: 'Informe anual (prueba)', url: null }], libro: { id: 'LIBRO-PRUEBA', sha256: 'b'.repeat(64) },
    auditoria: { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' },
  };
  const t = 'Texto de análisis con evidencia suficiente para superar el mínimo exigido por el control.';
  m.analysis = Object.fromEntries(['business', 'moat', 'story', 'risks', 'conclusion'].map(k => [k, t]));
  if (metodo === 'exceso') for (const n of Object.keys(m.assumptions)) m.assumptions[n].retentionHighGrowth = 0.6;
  return m;
}
const CAMPOS = ['netIncome', 'bookEquity', 'bookEquityPrior', 'dividends', 'shares'];

/** Expediente SINTÉTICO de holding: dos negocios industriales y una participación bancaria con valor externo. Solo para pruebas. */
export function validoHolding(ticker = 'HLD') {
  const años = Array.from({ length: 10 }, (_, k) => 2016 + k);
  const history = años.map((y, k) => { const f = 1 + 0.04 * (k - 9), equity = +(9000 * f).toFixed(1), assets = +(equity * 2.2).toFixed(1);
    return { year: y, revenue: +(10000 * f).toFixed(1), equity, assets, liabilities: +(assets - equity).toFixed(1), cash: 1500, minority: 500, shares: 1000 }; });
  history.at(-1).revenue = 10000;
  const financials = { corporateExpenses: 300, debt: 4000, minority: 500, cash: 1500, options: 0, shares: 1000, sharePrice: 12, eliminaciones: -200 };
  const ext = (v, f) => ({ valor: v, tipoValor: 'equity', fuente: f, fecha: '2026-11-13', motorOrigen: 'ddm', refExpediente: 'BNK' });
  const esc = (margin, g, k) => ({ margin, growth5: g, costOfCapital: k });
  const m = {
    schemaVersion: 'jmr-v2-0.2', ticker, company: `Holding de prueba ${ticker}`, profile: 'holding', currency: 'USD', units: 'millones, excepto valor/acción',
    asOf: '2026-11-13', estado: 'PUBLICADO', financials, history,
    segmentos: [
      { id: 'IND_A', nombre: 'Industrial A', perfil: 'operativa', revenue: 6000, capital: 5000, ownership: 1,
        escenarios: { conservador: esc(0.15, 0.035, 0.08), base: esc(0.18, 0.05, 0.08), optimista: esc(0.20, 0.06, 0.08) } },
      { id: 'IND_B', nombre: 'Industrial B', perfil: 'operativa', revenue: 3000, capital: 2500, ownership: 0.8,
        escenarios: { conservador: esc(0.12, 0.03, 0.085), base: esc(0.14, 0.04, 0.085), optimista: esc(0.16, 0.05, 0.085) } },
      { id: 'BNK_C', nombre: 'Banco C', perfil: 'banco', revenue: 1200, ownership: 0.6, valorExterno: ext(4000, 'Expediente BNK, escenario base'),
        escenarios: { conservador: { valorExterno: ext(3400, 'Expediente BNK, conservador') }, base: { valorExterno: ext(4000, 'Expediente BNK, base') }, optimista: { valorExterno: ext(4600, 'Expediente BNK, optimista') } } },
    ],
    assumptions: Object.fromEntries(['conservador', 'base', 'optimista'].map(n => [n, { riskFree: 0.04, taxRate: 0.25, mos: 0.35 }])),
    justificaciones: { minoritarios: 'Los minoritarios restados son acciones preferentes de la matriz, ajenas a las participaciones parciales ya ponderadas por segmento.' },
    provenance: [...['shares', 'cash', 'minority', 'debt', 'corporateExpenses'].map(k => ({ destino: `financials.${k}`, valorReportado: financials[k] })),
      ...[['IND_A', 6000], ['IND_B', 3000], ['BNK_C', 1200]].map(([id, v]) => ({ destino: `segmentos.${id}.revenue`, valorReportado: v }))]
      .map(p => ({ documento: 'Informe anual (prueba)', periodo: 2025, pagina: 150, moneda: 'USD', unidades: 'millones', ajuste: 0, ...p })),
    sources: [{ documento: 'Informe anual (prueba)', url: null }], libro: { id: 'LIBRO-PRUEBA', sha256: 'c'.repeat(64) },
    auditoria: { aprobadaPor: 'Auditor independiente', fecha: '2026-11-13', evidencia: 'acta-prueba' },
  };
  const t = 'Texto de análisis con evidencia suficiente para superar el mínimo exigido por el control.';
  m.analysis = Object.fromEntries(['business', 'moat', 'story', 'risks', 'conclusion'].map(k => [k, t]));
  return m;
}
