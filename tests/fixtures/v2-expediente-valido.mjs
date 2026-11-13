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
