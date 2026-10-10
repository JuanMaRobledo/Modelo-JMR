// Fuente compartida de expedientes colombianos para valoración y análisis fundamental.
// No importa ni usa bibliotecas de valoraciones estadounidenses.
import { validateDossier } from "./core.js";
const ROOT = "https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/colombia/expedientes/";
const STORE = "jmr-colombia-dossiers-v1";
export function localDossiers() {
  try {
    const records = JSON.parse(localStorage.getItem(STORE) || "[]");
    return (Array.isArray(records) ? records : []).filter(d => {
      try { validateDossier(d); return true; } catch { return false; }
    });
  } catch { return []; }
}
async function fromGitHub() {
  const r = await fetch(ROOT, {cache:"no-store", headers:{Accept:"application/vnd.github+json"}});
  if (!r.ok) throw new Error("Sin acceso a expedientes publicados (HTTP "+r.status+")");
  const entries = await r.json();
  const paths = (Array.isArray(entries) ? entries : []).filter(e => e.type === "file" && e.name.endsWith(".json"));
  const result = [];
  for(let i=0; i<paths.length; i+=8) {
    const chunk = await Promise.all(paths.slice(i,i+8).map(async entry => {
      try {
        const v = await fetch(ROOT + encodeURIComponent(entry.name), {cache:"no-store"});
        if(!v.ok) return null;
        const resource = await v.json();
        const bytes = Uint8Array.from(atob((resource.content || "").replace(/\s/g,"")), x => x.charCodeAt(0));
        return validateDossier(JSON.parse(new TextDecoder().decode(bytes)));
      } catch { return null; }
    }));
    result.push(...chunk.filter(Boolean));
  }
  return result;
}
const revision = d => String(d.publication?.revisedAt || d.updatedAt || d.publication?.publishedAt || d.retrievedAt || "");
export async function loadColombiaDossiers() {
  const local = localDossiers();
  let remote = [], warning = "";
  try { remote = await fromGitHub(); } catch(e) { warning = e.message; }
  const merged = new Map();
  // La revisión remota más reciente prevalece frente a datos locales antiguos.
  [...local,...remote].sort((a,b) => revision(b).localeCompare(revision(a)))
    .forEach(d => { if(!merged.has(d.ticker)) merged.set(d.ticker,d); });
  return {dossiers:[...merged.values()].sort((a,b) => a.ticker.localeCompare(b.ticker)), warning};
}
export function valuationNumbers(d) {
  const s = d?.valuationSummary || {};
  const o = s.valuationOutput || {};
  const holding = d?.instrument?.model === "holding";
  const isSura = d?.ticker === "GRUPOSURA.CL" || d?.ticker === "PFGRUPSURA.CL";
  const marketSotp = typeof o.marketSotpPrimaryCOP === "number" ? o.marketSotpPrimaryCOP : typeof o.sotpCheck?.hybridNAVBaseCOP === "number" ? o.sotpCheck.hybridNAVBaseCOP : s.base;
  const book = typeof o.bookValueProformaCOP === "number" ? o.bookValueProformaCOP : null;
  return {
    holding,
    primary: holding ? (typeof s.primaryValueCOP === 'number' ? s.primaryValueCOP : (book !== null ? book : marketSotp)) : (typeof o.dcfBaseCOP === "number" ? o.dcfBaseCOP : s.dcfPrimaryIntrinsicPerShareCOP),
    primaryLabel: isSura ? "Base 60/40 · SOTP económico + múltiplos" : holding ? (/SOTP_(MULTIPLES|ECONOMIC_SECTOR_PEER)_BLEND/.test(s.primaryValueMethod || "") ? 'Valor Base SOTP + múltiplos' : 'Valor contable NIIF pro forma') : "Valor intrínseco DCF",
    marketSotp: holding ? marketSotp : null,
    book,
    base: typeof o.dcfBaseCOP === "number" ? o.dcfBaseCOP : s.dcfPrimaryIntrinsicPerShareCOP,
    expected: typeof o.dcfExpectedCOP === "number" ? o.dcfExpectedCOP : s.dcfPrimaryExpectedCOP,
    price: typeof o.priceCOP === "number" ? o.priceCOP : s.marketPrice,
    sheet: o.sheetUrl || s.sheetUrl || s.cleanMasterSheetUrl || "",
    asOf: o.synchronizedAt || d?.publication?.revisedAt || d?.updatedAt || null,
    note: o.status || s.scopeLabel || "Valoración con supuestos de analista",
    source: o.primarySheet === "Valuation output" ? "Valuation output" : "Expediente de valoración",
  };
}
