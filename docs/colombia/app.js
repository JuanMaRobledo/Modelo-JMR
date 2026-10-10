import { CATALOG, MODELS } from "./catalog.js";
import {
  SCHEMA,
  FIELDS,
  normalizeTicker,
  validateDossier,
  annualTable,
  csvFor,
} from "./core.js";
const $ = (id) => document.getElementById(id),
  KEY = "jmr-colombia-dossiers-v1";
const GH =
  "https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/colombia/expedientes/";
let dossier = null,
  generation = 0,
  busy = false;
function status(id, text, bad = false) {
  $(id).textContent = text;
  $(id).className = "status " + (bad ? "bad" : "ok");
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function filename(suffix) {
  return `${dossier.ticker}-${dossier.analysisDate}-${dossier.runId.slice(0, 8)}-${suffix}`;
}
function activate(tab) {
  if (["data", "research", "valuation", "library", "prompts"].includes(tab) && location.hash !== "#" + tab) {
    history.replaceState(null, "", location.pathname + location.search + "#" + tab);
  }
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
    b.setAttribute("aria-selected", String(b.dataset.tab === tab));
  });
  document
    .querySelectorAll("[data-panel]")
    .forEach((p) => (p.hidden = p.dataset.panel !== tab));
}
document
  .querySelectorAll("[data-tab]")
  .forEach((b) => (b.onclick = () => activate(b.dataset.tab)));
window.addEventListener("hashchange", () => {
  const tab = location.hash.slice(1);
  if (["data", "research", "valuation", "library", "prompts"].includes(tab)) activate(tab);
});
for (const i of CATALOG) {
  const o = new Option(i.name, i.ticker);
  $("instrumentSelect").add(o);
}
for (const [key, label] of Object.entries(MODELS))
  $("modelSelect").add(new Option(label, key));
$("modelSelect").value = "unknown";
function clear() {
  generation++;
  dossier = null;
  busy = false;
  $("fetchBtn").disabled = false;
  $("modelApproved").checked = false;
  $("promptPreview").textContent = "";
  $("researchPreview").textContent = "";
  $("valuationPreview").textContent = "";
  for (const id of [
    "fetchStatus",
    "researchStatus",
    "valuationStatus",
    "saveStatus",
  ])
    status(id, "");
  render();
}
$("newBtn").onclick = () => {
  clear();
  $("tickerInput").value = "";
  $("instrumentSelect").value = "";
  $("modelSelect").value = "unknown";
  activate("data");
};
$("instrumentSelect").onchange = () => {
  clear();
  const i = CATALOG.find((i) => i.ticker === $("instrumentSelect").value);
  $("tickerInput").value = i?.ticker || "";
  $("modelSelect").value = i?.model || "unknown";
};
$("tickerInput").addEventListener("input", () => {
  clear();
  const i = CATALOG.find(
    (i) => i.ticker === $("tickerInput").value.trim().toUpperCase(),
  );
  $("instrumentSelect").value = i?.ticker || "";
  $("modelSelect").value = i?.model || "unknown";
});
$("modelSelect").onchange = () => {
  if (dossier) {
    dossier.instrument.model = $("modelSelect").value;
    dossier.audit.modelApproved = false;
    dossier.reports = { research: null, valuation: null };
    $("modelApproved").checked = false;
    render();
  }
};
$("modelApproved").onchange = () => {
  if (dossier) dossier.audit.modelApproved = $("modelApproved").checked;
};
$("fetchBtn").onclick = async () => {
  if (busy) return;
  let ticker;
  try {
    ticker = normalizeTicker($("tickerInput").value);
  } catch (e) {
    status("fetchStatus", e.message, true);
    return;
  }
  clear();
  const request = ++generation;
  busy = true;
  $("fetchBtn").disabled = true;
  status("fetchStatus", "Consultando cotización e históricos financieros…");
  try {
    const r = await fetch(
      "/api/colombia?ticker=" + encodeURIComponent(ticker),
      { cache: "no-store" },
    );
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "No se pudo consultar");
    if (request !== generation) return;
    if (d.ticker !== ticker)
      throw new Error("La respuesta pertenece a otra acción; se descartó.");
    dossier = validateDossier(d);
    dossier.instrument.model = $("modelSelect").value;
    render();
    activate("data");
    status(
      "fetchStatus",
      `Datos obtenidos. ${dossier.coverage.annualYears} ejercicios de ingresos; conciliación oficial pendiente.`,
    );
  } catch (e) {
    if (request === generation) status("fetchStatus", e.message, true);
  } finally {
    if (request === generation) {
      busy = false;
      $("fetchBtn").disabled = false;
    }
  }
};
$("tickerInput").onkeydown = (e) => {
  if (e.key === "Enter") $("fetchBtn").click();
};
const fmt = (v, unit = "COP") =>
  v == null
    ? "Pendiente"
    : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(v) +
      (unit ? " " + unit : "");
function renderReport(id, content) {
  const root = $(id);
  root.replaceChildren();
  if (!content) return;
  const body = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  if (!window.marked || !window.DOMPurify) { root.textContent = body; return; }
  root.innerHTML = DOMPurify.sanitize(marked.parse(body, { gfm: true }), { FORBID_TAGS: ["style", "form", "input"] });
  const anchors = new Map();
  root.querySelectorAll("[id]").forEach(node => { const old = node.id; node.id = `${id}-${old}`; anchors.set(old, node.id); });
  root.querySelectorAll('a[href^="#"]').forEach(a => { const target = anchors.get(a.getAttribute("href").slice(1)); if (target) a.setAttribute("href", "#" + target); });
  const toc = document.createElement("nav");
  toc.className = "report-toc";
  toc.setAttribute("aria-label", "Índice del informe");
  const title = document.createElement("strong"); title.textContent = "Contenido"; toc.append(title);
  root.querySelectorAll("h2,h3").forEach((heading, i) => {
    const oldId = heading.id;
    heading.id = `${id}-section-${i}`;
    if (oldId) root.querySelectorAll("a").forEach(a => { if (a.getAttribute("href") === "#" + oldId) a.href = "#" + heading.id; });
    const a = document.createElement("a"); a.href = "#" + heading.id; a.textContent = heading.textContent; toc.append(a);
  });
  if (toc.children.length > 1) root.prepend(toc);
  root.querySelectorAll("table").forEach(table => { const wrap = document.createElement("div"); wrap.className = "table-wrap"; table.replaceWith(wrap); wrap.append(table); });
}

function renderValuationStats() {
  const analysisViewer = $("openColombiaFundamental");
  if (analysisViewer) analysisViewer.href = dossier ? "fundamental-colombia.html?ticker=" + encodeURIComponent(dossier.ticker) : "fundamental-colombia.html";
  const viewer = $("openColombiaVisor");
  if (viewer) viewer.href = dossier ? "visor-colombia.html?ticker=" + encodeURIComponent(dossier.ticker) : "visor-colombia.html";
  const root = $("valuationStats");
  root.replaceChildren();
  root.classList.add("col-value-board");
  const v = dossier?.valuationSummary;
  if (!v) return;
  const isHolding = dossier?.instrument?.model === "holding";
  const sotpMarket = typeof v.valuationOutput?.marketSotpPrimaryCOP === "number" ? v.valuationOutput.marketSotpPrimaryCOP : v.valuationOutput?.sotpCheck?.hybridNAVBaseCOP;
  const bookPure = v.valuationOutput?.bookValueProformaCOP;
  const isPrimaryFCFF = v.dcfPrimaryMethod === "FCFF";
  const status = isHolding && typeof bookPure === "number" ? "VALOR CONTABLE NIIF PRINCIPAL · SOTP y FCFF complementarios" : isPrimaryFCFF ? (typeof v.dcfPrimaryIntrinsicPerShareCOP === "number" ? "FCFF por negocios · estimación no certificada" : "FCFF operativo calculado · equity por PF pendiente") : (v.baseIsIntrinsic === false ? "SOTP híbrida estimada · NO DCF certificado" : (dossier.audit?.valuationReady ? "Modelo revisado · alcance limitado" : "Valoración incompleta o condicionada"));
  const priceDate = v.priceDate || dossier.analysisDate;
  const numeric = x => typeof x === "number" && Number.isFinite(x);
  const cop = x => numeric(x) ? new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0
  }).format(x) : "Pendiente";
  const el = (tag, cls, value) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined) n.textContent = value;
    return n;
  };
  const box = (label, number, annotation, extraClass = "") => {
    const b = el("div", "col-value-kpi " + extraClass);
    b.append(el("small", "", label), el("strong", "", cop(number)),
      el("small", "col-value-note", annotation));
    return b;
  };
  const heading = el("div", "col-value-heading");
  heading.append(el("div", "col-value-eyebrow", "MODELO JMR · COLOMBIA"),
    el("h3", "", dossier.company + " · " + dossier.ticker),
    el("span", "col-value-badge", status));
  root.append(heading);

  // En holdings el valor contable NIIF es la referencia principal; NAV mercado y DCF FCFF se muestran como complementarios.
  // Los múltiplos no calculables se indican N/D.
  const priceVsDcf = numeric(v.marketPrice) && numeric(v.dcfPrimaryIntrinsicPerShareCOP) && v.dcfPrimaryIntrinsicPerShareCOP > 0
    ? v.marketPrice / v.dcfPrimaryIntrinsicPerShareCOP : null;
  if (isPrimaryFCFF) {
    const ratio = el("p", "col-value-note",
      "Precio / DCF FCFF Base: " + (numeric(priceVsDcf) ? priceVsDcf.toFixed(2).replace(".", ",") + "×" : "N/D") +
      " · valor intrínseco DCF de hoy: " + cop(v.dcfPrimaryIntrinsicPerShareCOP) +
      " · fecha de precio: " + priceDate + ". El precio no es un múltiplo de valoración independiente.");
    root.append(ratio);
  }
  const hero = el("div", "col-value-hero");
  if (isHolding && numeric(bookPure)) {
    hero.append(
      box("Valor contable NIIF pro forma · PRINCIPAL", bookPure, "Patrimonio separado pro forma y acciones económicas; no es precio de liquidación.", "featured"),
      box("SOTP mercado / NIIF · comparador", sotpMarket, "Valor de mercado de cotizadas y contable de privadas; distinto de libro puro."),
      box("SOTP DCF FCFF Base · secundario", v.dcfPrimaryIntrinsicPerShareCOP, "FCFF por negocio con WACC y puente patrimonial; supuestos no certificados")
    );
    hero.append(box("Múltiplos ponderados · secundarios", v.multiplesWeightedToday, "P/B, yield y otros métodos disponibles por separado"));
    const choose = el("a", "col-value-note", "Seleccionar métodos y rebalancear pesos en el visor de Colombia →");
    choose.href = "visor-colombia.html?ticker=" + encodeURIComponent(dossier.ticker) + "#resumen";
    choose.style.display = "block";choose.style.marginTop = "10px";root.append(choose);
  } else if (isPrimaryFCFF) {
    const primary = v.dcfFcffIntrinsicScenarios?.[0];
    hero.append(
      box("FCFF Base por PF · ESTIMACIÓN", v.dcfPrimaryIntrinsicPerShareCOP, numeric(v.dcfPrimaryIntrinsicPerShareCOP) ? "FCFF 10 años descontado al WACC y puente de empresa a equity. NO CERTIFICADO." : "FCFF por PF pendiente, NO equivale a cero.", "featured"),
      box("Cementos · EV FCFF (COP millones)", primary?.enterpriseValueCementosCOPm, "Valor de empresa operativa, NO precio de acción"),
      box("Celsia · EV FCFF (COP millones)", primary?.enterpriseValueCelsiaCOPm, "EV de perímetro INCOMPLETO Yield/Growth; no equivale a patrimonio")
    );
  } else if (numeric(v.dcfLookthroughBase)) {
    hero.append(
      box("DCF por negocios · Base estimativa", v.dcfLookthroughBase,
        "Flujos futuros descontados por negocio, con NIIF Pactia y NAV 2035 Odinsa. NO certificado.", "featured"),
      box("DCF dividendos holding · Base", v.dcfDividendsBase,
        "Diez años de dividendos + terminal; depende de políticas futuras"),
      box("SOTP arbitraje · Base bursátil", v.base,
        "Comparador NAV basado en cotizaciones y activos contables. No DCF.")
    );
  } else {
    hero.append(
      box(v.baseIsIntrinsic === false ? "SOTP Base · estimación condicionada" : "Valor intrínseco Base · principal", v.base,
        v.base == null ? "No hay DCF/SOTP certificado" : (v.scopeLabel || "Modelo fundamental condicionado"), "featured"),
      box("Cotización del análisis", v.marketPrice, "Sesión " + priceDate),
      box("Valor esperado · escenarios", v.expected, "Secundario; no reemplaza el Base")
    );
  }
  root.append(hero);

  if (!isPrimaryFCFF && Array.isArray(v.dcfLookthroughScenarios) && v.dcfLookthroughScenarios.length) {
    const heading = el("div", "col-value-section-title");
    heading.append(el("h3", "", "Cuatro historias · DCF por negocios"),
      el("p", "", "Valores por acción derivados de flujos y valores terminales explícitos; la prima de voto de la PF y varios flujos privados siguen sin certificación."));
    root.append(heading);
    const cards = el("div", "col-value-method-grid");
    for (const scenario of v.dcfLookthroughScenarios) {
      const item = el("article", "col-value-method-card");
      item.append(el("h4", "", scenario.name),
        el("small", "", "Peso narrativo: " + (100 * scenario.p).toFixed(0) + "%"),
        el("strong", "col-value-method-number", cop(scenario.value)),
        el("p", "col-value-note", "Futuros FCFE y supuestos analíticos; valor calculado, no garantizado."));
      cards.append(item);
    }
    root.append(cards);
    const weighted = el("div", "col-value-banner");
    weighted.append(el("strong", "", "Valor esperado de escenarios DCF: " + cop(v.dcfLookthroughExpected)),
      el("p", "col-value-note", "La probabilidad de las historias es subjetiva. Se mantiene el DCF Base como referencia principal."));
    root.append(weighted);
  }
  if (!isPrimaryFCFF && Array.isArray(v.dcfDividendScenarios) && v.dcfDividendScenarios.length) {
    const heading = el("div", "col-value-section-title");
    heading.append(el("h3", "", "DCF por dividendos de la acción · 10 años"),
      el("p", "", "Dividendos 2027–2036 y terminal, separados del DCF por negocios. El plan corporativo de dividendos futuros no equivale a pagos aprobados."));
    root.append(heading);
    const cards = el("div", "col-value-method-grid");
    for (const story of v.dcfDividendScenarios) {
      const item = el("article", "col-value-method-card");
      item.append(el("h4", "", story.name), el("strong", "col-value-method-number", cop(story.value)),
        el("p", "col-value-note", "Escenario del flujo efectivo pagado a accionistas."));
      cards.append(item);
    }
    root.append(cards);
  }

  if (isPrimaryFCFF && Array.isArray(v.dcfFcffIntrinsicScenarios)) {
    const header = el("div", "col-value-section-title");
    header.append(el("h3", "", "Escenarios DCF FCFF por WACC"),
      el("p", "", "Cada negocio proyecta NOPAT menos reinversión neta; su FCFF descontado a WACC pasa de EV a equity. Valoración de analista con incertidumbre material, no certificado."));
    root.append(header);
    const cases = el("div", "col-value-method-grid");
    for (const sc of v.dcfFcffIntrinsicScenarios) {
      const item = el("article", "col-value-method-card");
      item.append(el("h4", "", sc.name),
        el("small", "", "Probabilidad subjetiva: " + ((sc.weight || 0) * 100).toFixed(0) + "%"),
        el("strong", "col-value-method-number", cop(sc.intrinsicPerPreferredShareCOP)),
        el("p", "col-value-note", "FCFF por negocio, valor económico condicional. Piso de patrimonio cero en escenarios extremos."));
      cases.append(item);
    }
    root.append(cases);
    const exp = el("div", "col-value-banner");
    exp.append(el("strong", "", "Valor esperado FCFF: " + cop(v.dcfPrimaryExpectedCOP)),
      el("p", "col-value-note", "Promedio por historias 50/25/20/5, no reemplaza el Base. Precio PF analizado: COP 16.500 del 9-oct-2026 (Grupo Aval)."));
    root.append(exp);
  }
  if (isPrimaryFCFF && v.fcffPrimaryValuationAudit) {
    const m = v.fcffPrimaryValuationAudit.majorSensitivity;
    const item = el("div", "col-value-banner");
    item.append(el("strong", "", "Prueba crítica: FCFF propio vs valor empresarial divulgado"),
      el("p", "col-value-note", "Cementos: EV FCFF COP 3,89 billones frente a EV Latam gerencial ~8,37. Celsia: EV FCFF central 6,72 frente a EV Gx+Tx/Dx gerencial 16,11. Son perímetros y métodos distintos; reemplazar ambos EV sin recalcular FCFF daría " + cop(m?.issuerEVSwapCounterfactualCOP) + " por PF, una prueba ilustrativa, NO un DCF ni nuestro precio objetivo."));
    root.append(item);
  }
  if (isPrimaryFCFF && v.externalValueAudit) {
    const audit = v.externalValueAudit;
    const heading = el("div", "col-value-section-title");
    heading.append(el("h3", "", "Contraste: valor declarado y consenso PF"),
      el("p", "", "Son referencias de SOTP y analistas; NINGUNA constituye nuestro valor intrínseco FCFF."));
    root.append(heading);
    const cases = [
      ["Emisor · SOTP feb2026", audit.managementFebruary2026?.perShareCOP, "Mercado de participadas más libros; no DCF."],
      ["Investing · PF objetivo 12 meses", audit.preferredAnalystTargets?.[0]?.targetCOP, "Un analista, no auditoría de FCFF."],
      ["Fintel · PF objetivo 12 meses", audit.preferredAnalystTargets?.[1]?.targetCOP, "Referencia del 2 octubre 2026, rango 18.180–25.095."],
      ["SOTP JMR octubre · PRINCIPAL para holdings", v.base, "NAV de mercado/NIIF; NO DCF FCFF."]
    ];
    const cards = el("div", "col-value-method-grid");
    for (const [label, amount, note] of cases) {
      const item = el("article", "col-value-method-card");
      item.append(el("h4", "", label), el("strong", "col-value-method-number", cop(amount)),
        el("p", "col-value-note", note));
      cards.append(item);
    }
    root.append(cards);
    const note = el("div", "col-value-banner");
    note.append(el("strong", "", "Conciliación SOTP del emisor vs JMR"),
      el("p", "col-value-note", "Emisor: patrimonio COP 14,90 billones en febrero; JMR: COP 12,83 billones en octubre. Diferencia 2,07 billones por fechas/perímetros y valoraciones de Cementos, Celsia, Odinsa, deuda neta y gastos holding. No sumarla al FCFF como activo imaginario."));
    root.append(note);
  }
  if (Array.isArray(v.sotpScenarios) && v.sotpScenarios.length) {
    const storyTitle = el("div", "col-value-section-title");
    storyTitle.append(el("h3", "", "Cuatro escenarios · SOTP híbrida"),
      el("p", "", "COMPARADOR bursátil SOTP, no DCF. Probabilidades subjetivas; se muestra en segundo plano tras la valoración de flujos."));
    root.append(storyTitle);
    const storyGrid = el("div", "col-value-method-grid");
    for (const scenario of v.sotpScenarios) {
      const item = el("article", "col-value-method-card");
      item.append(el("h4", "", scenario.name || "Escenario"),
        el("small", "", "Probabilidad: " + (100 * (scenario.p || 0)).toFixed(0) + "%"),
        el("strong", "col-value-method-number", cop(scenario.value)),
        el("p", "col-value-note", numeric(scenario.upside)
          ? "Frente a cotización de análisis: " + (scenario.upside * 100).toFixed(1).replace(".", ",") + "%"
          : "Consultar informe"));
      storyGrid.append(item);
    }
    root.append(storyGrid);
  }
  if (v.baseIsIntrinsic === false) {
    const caution = el("div", "col-value-banner");
    caution.append(el("strong", "", "Alcance y confiabilidad"),
      el("p", "col-value-note",
        isPrimaryFCFF
          ? "El FCFF descontado al WACC es el único DCF principal: precio Base estimativo COP 9.779 en cuatro escenarios, FCFF por negocios y puente patrimonial. NO certificado: supuestos materiales en Celsia Growth, Odinsa, Pactia, NDU, caja Summit y minoritarios. FCFE13.708 y DDM12.518 sólo antecedentes."
          : numeric(v.dcfLookthroughBase)
          ? "Existen dos DCF numéricos adicionales. El look-through tiene hipótesis fuertes de FCFE Celsia, NAV 2035 Odinsa y capex estadounidense; Pactia sigue por NIIF. Son DCF prospectivos estimativos, no un dictamen certificado de valor intrínseco. No sumar valor de mercado y flujo del mismo activo."
          : "SOTP Base combinando precios de participadas listadas, libros y NIIF privados. No es DCF completo por negocio. Faltan FCFE de concesiones, minoritarios a valor razonable y datos de activos no operativos para certificar valor intrínseco."));
    root.append(caution);
  }


  const conclusion = el("div", "col-value-banner");
  const conclusionText = v.conclusion || (
    !numeric(v.base)
      ? "No hay una conclusión intrínseca por acción: falta cerrar la suma de partes y sus puentes patrimoniales. El NAV de mercado es solo una referencia; los múltiplos pendientes no permiten una conclusión relativa ni un ponderado."
      : !dossier.audit?.valuationReady
        ? "El Base de " + cop(v.base) + " es una estimación condicionada. " +
          (numeric(v.marketPrice) ? "Está " + (v.base < v.marketPrice ? "por debajo" : "por encima") + " del precio del análisis de " + cop(v.marketPrice) + ". " : "") +
          "Falta validar capital regulatorio, capacidad distribuible y supuestos. Los múltiplos numéricos disponibles son referencias condicionadas; los ponderados no resuelven estas limitaciones."
        : "Consultar la conclusión del informe y las limitaciones del perímetro revisado."
  );
  conclusion.append(el("strong", "", "Conclusión y alcance"),
    el("p", "col-value-note", conclusionText));
  if (v.horizonNote) conclusion.append(el("p", "col-value-note", v.horizonNote));
  root.append(conclusion);

  if (numeric(v.navProportionalEconomic)) {
    const nav = el("div", "col-value-banner");
    nav.append(el("strong", "", "NAV económico proporcional (no DCF): " + cop(v.navProportionalEconomic)),
      el("p", "col-value-note",
        "Valor patrimonial indicativo de las participaciones al precio de mercado, repartido proporcionalmente entre las acciones económicas. No atribuye una prima al voto, no constituye valor intrínseco y no permite calcular margen de seguridad."));
    root.append(nav);
  }
  if (numeric(v.navReference)) {
    const nav = el("div", "col-value-banner");
    nav.append(el("strong", "", "NAV PF usando la brecha bursátil (no DCF): " + cop(v.navReference)),
      el("p", "col-value-note",
        "Referencia de reparto condicionada a precios ordinaria/preferencial. Es circular si se usa como valor intrínseco y no representa una penalización fundamental demostrada."));
    root.append(nav);
  }

  const methods = Array.isArray(v.multiplesMethods) ? v.multiplesMethods : [];
  // Tabla JMR Colombia: el mismo orden visual DCF → múltiplos individuales →
  // ponderación relativa → ponderación DCF/múltiplos. Nunca sustituir DCF por SOTP.
  if (isPrimaryFCFF) {
    const title = el("div", "col-value-section-title");
    title.append(el("h3", "", "Resumen de valoración · Modelo JMR Colombia"),
      el("p", "", "COP por acción preferencial. DCF FCFF Base es el valor intrínseco principal; los relativos son secundarios. N/D indica que no hay un denominador homologado."));
    root.append(title);
    const wrap = el("div", "table-wrap");
    const table = el("table", "colombia-jmr-table");
    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    ["Método", "Base hoy", "Conservadora", "Optimista", "Peso", "Condición"].forEach(label => header.append(el("th", "", label)));
    thead.append(header);
    const tbody = document.createElement("tbody");
    const byName = name => (v.dcfFcffIntrinsicScenarios || []).find(s => s.name?.toLowerCase().includes(name));
    const dcfBase = v.dcfPrimaryIntrinsicPerShareCOP;
    const dcfCon = byName("conserv")?.intrinsicPerPreferredShareCOP;
    const dcfOpt = byName("optim")?.intrinsicPerPreferredShareCOP;
    const toWeight = w => numeric(w) ? (100 * w).toFixed(0) + "%" : "—";
    const append = (name, base, con, opt, weight, note, main = false) => {
      const tr = document.createElement("tr");
      if (main) tr.className = "colombia-jmr-main";
      [name, cop(base), cop(con), cop(opt), toWeight(weight), note].forEach(value => tr.append(el("td", "", value)));
      tbody.append(tr);
    };
    append("DCF FCFF · valor intrínseco", dcfBase, dcfCon, dcfOpt, 0.6, "Principal · 10 años y puente patrimonial", true);
    const anchors = m => Array.isArray(m.anchors) && m.anchors.length === 3 ? m.anchors : [];
    for (const m of methods) {
      const a = anchors(m);
      append(m.name || "Múltiplo", m.today, a[0], a[2],
        numeric(m.weight) ? 0.4 * m.weight : 0,
        m.today == null ? "N/D · sin comparables homogéneos" : (m.status || "Valor relativo"));
    }
    const valid = methods.filter(m => numeric(m.today) && numeric(m.weight));
    const relative = valid.reduce((total, m) => total + m.today * m.weight, 0);
    const rw = valid.reduce((total, m) => total + m.weight, 0);
    append("Ponderado de múltiplos", rw > 0 ? relative / rw : null, null, null, rw > 0 ? 0.4 : null,
      rw > 0 ? "Solo métodos con datos y ponderación publicados" : "N/D");
    append("DCF 60% + múltiplos 40%", rw > 0 && numeric(dcfBase) ? 0.6 * dcfBase + 0.4 * relative / rw : null,
      null, null, 1, "Combinado secundario; NO sustituye el DCF", true);
    append("SOTP / NAV bursátil", v.base, null, null, null, "Comparador externo al DCF y al ponderado JMR");
    table.append(thead, tbody);
    wrap.append(table);
    root.append(wrap);
  }
  const sectionTitle = el("div", "col-value-section-title");
  sectionTitle.append(el("h3", "", "Múltiplos · cada método por separado"),
    el("p", "", "Precio relativo independiente del valor intrínseco. Sin evidencia, el resultado permanece pendiente."));
  root.append(sectionTitle);

  const storageKey = "jmr-colombia-horizonte-v2";
  let horizon = "today";
  try { horizon = localStorage.getItem(storageKey) || "today"; } catch (_) {}
  if (!["today","year3","year3PV"].includes(horizon)) horizon = "today";
  const switcher = el("div", "col-value-switch");
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Horizonte de múltiplos");
  [
    ["today", "Hoy · VP"],
    ["year3", "Objetivo a 3 años"],
    ["year3PV", "Año 3 descontado"]
  ].forEach(([key, text]) => {
    const button = el("button", "btn" + (horizon === key ? " active" : ""), text);
    button.type = "button";
    button.setAttribute("aria-pressed", String(horizon === key));
    button.onclick = () => {
      try { localStorage.setItem(storageKey, key); } catch (_) {}
      renderValuationStats();
    };
    switcher.append(button);
  });
  root.append(switcher);

  const cards = el("div", "col-value-method-grid");
  methods.forEach((m, index) => {
    const item = el("article", "col-value-method-card");
    const top = el("div", "col-value-method-top");
    top.append(el("span", "col-value-method-index", String(index + 1).padStart(2, "0")),
      el("h4", "", m.name || "Método sin nombre"));
    item.append(top, el("strong", "col-value-method-number", cop(m[horizon])));
    const meta = el("div", "col-value-method-meta");
    const weight = numeric(m.weight) ? (m.weight * 100).toFixed(0) + "%" : "Sin ponderar";
    meta.append(el("span", "", "Peso relativo: " + weight),
      el("span", "", m.status || "No certificado"));
    item.append(meta);
    const horizons = el("dl", "col-value-horizon-row");
    [["VP hoy",m.today],["FY+3",m.year3],["FY+3 a VP",m.year3PV]].forEach(([lbl,val]) => {
      const group = el("div", "");
      group.append(el("dt", "", lbl), el("dd", "", cop(val)));
      horizons.append(group);
    });
    item.append(horizons);
    cards.append(item);
  });
  if (methods.length) root.append(cards);
  else root.append(el("p", "col-value-empty", "No se han publicado anclas individuales verificadas."));

  const pTitle = el("div", "col-value-section-title");
  pTitle.append(el("h3", "", "Ponderaciones · secundarias"),
    el("p", "", "El ponderado relativo no debe mezclarse con el DCF sin mostrar ambos resultados y sus pesos."));
  root.append(pTitle);
  const weighted = el("div", "col-value-weighted");
  const one = {today:v.multiplesWeightedToday,year3:v.multiplesWeightedYear3,year3PV:v.multiplesWeightedYear3PV};
  const two = {today:v.combinedWeightedToday,year3:v.combinedWeightedYear3,year3PV:v.combinedWeightedYear3PV};
  weighted.append(box("Múltiplos · ponderado independiente",one[horizon],v.multiplesStatus || "Sin ponderado verificable"),
    box(v.valuationOutput ? (horizon === "year3PV" ? "VP precio FY+3 exdiv · DCF60% y múltiplos40%" : "DCF FCFF 60% + múltiplos 40% (secundario)") : "SOTP + múltiplos histórico (no DCF)",two[horizon],v.combinedStatus || "Ponderación no certificada"));
  root.append(weighted);

  const details = Array.isArray(v.dcfComponents) ? v.dcfComponents : [];
  if (details.length) {
    const title = el("div", "col-value-section-title");
    title.append(
      el("h3", "", "Negocios y fondos · suma de partes"),
      el("p", "", "Distingue EV por DCF, inversiones a valor razonable NIIF y costos de matriz. Ninguno es por sí mismo el precio de la preferencial.")
    );
    root.append(title);
    const components = el("div", "col-value-method-grid");
    for (const comp of details) {
      const article = el("article", "col-value-method-card");
      const value = numeric(comp.metricValue) ? comp.metricValue : comp.enterpriseValue;
      article.append(
        el("h4", "", comp.name),
        el("small", "", comp.metricLabel || "Valor empresa · EV FCFF Base · COP millones"),
        el("strong", "col-value-method-number", numeric(value)
          ? new Intl.NumberFormat("es-CO", {maximumFractionDigits: 0}).format(value) + " M"
          : "Pendiente"),
        el("p", "col-value-note", comp.status || "Por verificar")
      );
      const scenarios = comp.scenarios;
      if (scenarios && typeof scenarios === "object") {
        const grid = el("dl", "col-value-horizon-row");
        grid.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
        for (const [label, key] of [
          ["Base", "Base"], ["Conservadora", "Conservadora"],
          ["Optimista", "Optimista"], ["Disrupción", "Disrupcion"]
        ]) {
          const value = scenarios[key];
          const item = el("div", "");
          item.append(el("dt", "", label), el("dd", "", numeric(value)
            ? new Intl.NumberFormat("es-CO", {maximumFractionDigits: 0}).format(value) + " M"
            : "Pendiente"));
          grid.append(item);
        }
        article.append(grid);
      }
      components.append(article);
    }
    root.append(components);
  }

  const rateAudit = v.dcfRateAudit;
  if (Array.isArray(rateAudit?.company) && rateAudit.company.length) {
    const header = el("div", "col-value-section-title");
    header.append(
      el("h3", "", "Costo de capital · DCF corregido"),
      el("p", "", "WACC nominal COP sintético construido con Ke, Kd y financiación; supuestos del analista, no tasas certificadas.")
    );
    root.append(header);
    const rateCards = el("div", "col-value-method-grid");
    for (const record of rateAudit.company) {
      const item = el("article", "col-value-method-card");
      const percent = x => numeric(x) ? (x * 100).toFixed(2).replace(".", ",") + "%" : "Pendiente";
      item.append(
        el("h4", "", record.business || "Negocio"),
        el("small", "", "WACC sintético aplicado a los cuatro escenarios"),
        el("strong", "col-value-method-number", percent(record.wacc)),
        el("p", "col-value-note",
          "Ke " + percent(record.ke) + " · Kd " + percent(record.kd) +
          " · Deuda / valor " + percent(record.debtOverMarketCapital) +
          (numeric(record.tesAlternativeWacc) ? " · WACC alternativo TES " + percent(record.tesAlternativeWacc) : "") +
          ". Tabla Damodaran enero 2026; Rf sintética, beta, prima país por exposición y D/V sujetos a validación final.")
      );
      rateCards.append(item);
    }
    root.append(rateCards);
  }
  const bridge = v.dcfBridgeAudit;
  const equityBridge = bridge?.celsia?.equityBeforeNonOperatingAndNciFairValue || bridge?.celsia?.equityBeforeOtherAssetsAndFairValueNci;
  if (equityBridge) {
    const audit = el("div", "col-value-banner");
    const mechanical = equityBridge.Base;
    const formatted = numeric(mechanical)
      ? new Intl.NumberFormat("es-CO", {maximumFractionDigits: 0}).format(mechanical)
      : "Pendiente";
    audit.append(
      el("strong", "", "Control del puente patrimonial de Celsia"),
      el("p", "col-value-note",
        "EV DCF Base menos deuda neta y minoritarios contables: " + formatted +
        " COP millones. Es un puente INCOMPLETO, no una valoración de cero ni del título PF. " +
        "Requiere inversiones fuera del FCFF, minoritarios a valor razonable y conciliación del capital invertido.")
    );
    root.append(audit);
  }

  const auditFive = v.auditFiveFronts;
  if (auditFive) {
    const fiveHeading = el("div", "col-value-section-title");
    fiveHeading.append(
      el("h3", "", "Auditoría de cinco frentes · fuentes y conciliaciones"),
      el("p", "", "Certificación limitada de la suma de partes tipo NAV/arbitraje, no de un DCF intrínseco independiente de todos los negocios.")
    );
    root.append(fiveHeading);
    const fiveCards = el("div", "col-value-method-grid");
    const tests = [
      ["Celsia · diferencia de perímetro", auditFive.celsia?.scopeGapCOPbillions, "COP miles de millones · EV mercado menos DCF parcial; se mantiene equity bursátil para NAV"],
      ["Cementos · caja neta contable", auditFive.cementos?.netCashCOPbillions, "COP miles de millones · incluida en capitalización bursátil, no sumarla nuevamente"],
      ["Odinsa · valor libro 2T2026", auditFive.odinsa?.bookStakeJun2026COPbillions, "COP miles de millones · NAV gerencia dic2025 de 2,4 a 3,0 billones como sensibilidad independiente"],
      ["Urbano · libro / avalúo", auditFive.urban?.bookTotalCOPbillions, "COP miles de millones · concilia con 2.100,0 publicados por el emisor"],
      ["WACC Cementos / Celsia", auditFive.capitalCost?.WACC_Cementos, "Fracción · Cementos, Celsia " + (numeric(auditFive.capitalCost?.WACC_Celsia) ? (auditFive.capitalCost.WACC_Celsia * 100).toFixed(2).replace(".", ",") + "%" : "pendiente") + ". ERP/CRP Damodaran enero 2026"]
    ];
    for (const [name, metric, note] of tests) {
      const item = el("article", "col-value-method-card");
      item.append(
        el("h4", "", name),
        el("strong", "col-value-method-number", numeric(metric)
          ? (name.startsWith("WACC") ? (metric * 100).toFixed(2).replace(".", ",") + "%" : new Intl.NumberFormat("es-CO", {maximumFractionDigits: 1}).format(metric))
          : "Pendiente"),
        el("p", "col-value-note", note)
      );
      fiveCards.append(item);
    }
    root.append(fiveCards);
  }

  if (v.sheetUrl && /^https:\/\//.test(v.sheetUrl)) {
    const a = el("a", "btn col-value-sheet-link", "Abrir hoja y fórmulas de valoración");
    a.href = v.sheetUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
    root.append(a);
  }
}

$("printBtn").onclick = () => window.print();
function render() {
  ["jsonBtn", "csvBtn", "xlsxBtn"].forEach((id) => ($(id).disabled = !dossier));
  $("companyHeading").textContent = dossier
    ? `${dossier.company} · ${dossier.ticker}`
    : "Elige una acción para comenzar";
  for (const id of ["stats", "financialTable", "warnings", "sourceLinks"])
    $(id).replaceChildren();
  $("coverageNote").textContent = "";
  renderValuationStats();
  if (!dossier) {
    $("modelNote").textContent =
      "Selecciona el negocio y obtén sus datos antes de preparar la valoración.";
    return;
  }
  $("modelSelect").value = dossier.instrument.model;
  $("modelApproved").checked = !!dossier.audit.modelApproved;
  const price = dossier.quote;
  const cells = [
    [
      "Última cotización",
      fmt(price.price),
      price.sessionDate || (price.quotedAt ? new Date(price.quotedAt).toLocaleString("es-CO", {
        timeZone: "America/Bogota",
      }) : "Fecha/hora pendiente"),
    ],
    [
      "Historia de ingresos",
      `${dossier.coverage.annualYears} ejercicios`,
      "La cobertura depende del proveedor",
    ],
    [
      "Moneda de estados",
      dossier.coverage.reportingCurrencies.join(" / ") || "Pendiente",
      "Importes en unidades originales",
    ],
    ["Estado", dossier.audit.valuationReady ? "Revisión completada" : "Datos obtenidos", dossier.valuationSummary?.scopeLabel || "Conciliación y valoración pendientes"],
  ];
  for (const [label, value, note] of cells) {
    const box = document.createElement("div");
    box.className = "stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    const sub = document.createElement("small");
    sub.textContent = note;
    box.append(small, strong, sub);
    $("stats").append(box);
  }
  $("coverageNote").textContent =
    `Consultado: ${new Date(dossier.updatedAt || dossier.retrievedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}. La tabla presenta moneda y acciones en millones, respetando la escala original. FY es cierre anual. ${dossier.coverage.ltmAvailable ? "La cobertura UDM consta en el expediente." : "UDM homogéneo no disponible; no confundir semestres anualizados con UDM."}`;
  const table = document.createElement("table"),
    head = document.createElement("tr"),
    annual = annualTable(dossier.observations);
  head.append(document.createElement("th"));
  head.firstChild.textContent = "Concepto";
  annual.forEach((row) => {
    const th = document.createElement("th");
    th.textContent = row.date;
    head.append(th);
  });
  const thead = document.createElement("thead");
  thead.append(head);
  table.append(thead);
  const tbody = document.createElement("tbody");
  for (const [field, [label]] of Object.entries(FIELDS)) {
    const tr = document.createElement("tr"),
      td = document.createElement("td");
    td.textContent = label;
    tr.append(td);
    annual.forEach((row) => {
      const cell = document.createElement("td"),
        o = row[field];
      cell.textContent = o
        ? fmt(
            o.value / (o.unit?.includes("millones") ? 1 : 1e6),
            o.unit === "shares" ? "acciones" : o.unit || "moneda pendiente",
          )
        : "Pendiente";
      tr.append(cell);
    });
    tbody.append(tr);
  }
  table.append(tbody);
  $("financialTable").append(table);
  (dossier.audit.warnings || []).forEach((w) => {
    const li = document.createElement("li");
    li.textContent = w;
    $("warnings").append(li);
  });
  for (const s of dossier.sources) {
    if (!/^https:\/\//.test(s.url)) continue;
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent =
      {
        price: "Precio e historia",
        "financials-provider": "Estados del proveedor",
        "regulatory-discovery": "SIMEV · fuentes oficiales",
        "issuer-discovery": "Sitio del emisor",
      }[s.role] || s.role;
    $("sourceLinks").append(a);
  }
  $("modelNote").textContent =
    `Modelo: ${MODELS[dossier.instrument.model] || MODELS.unknown}. ${dossier.instrument.model === "financial" ? "Revisar ROE, capital regulatorio y costo de patrimonio. El FCFF industrial no aplica." : dossier.instrument.model === "holding" ? "Valorar participaciones y matriz; evitar doble conteo de deuda, dividendos y flujos consolidados." : "Revisar reinversión, moneda y ROIC terminal antes de calcular."}`;
  renderReport("researchPreview", dossier.reports?.research?.content);
  renderReport("valuationPreview", dossier.reports?.valuation?.content);
}
$("jsonBtn").onclick = () => {
  if (dossier)
    download(
      filename("expediente.json"),
      JSON.stringify(dossier, null, 2),
      "application/json",
    );
};
$("csvBtn").onclick = () => {
  if (dossier)
    download(
      filename("datos.csv"),
      "\uFEFF" + csvFor(dossier),
      "text/csv;charset=utf-8",
    );
};
let xlsxLoading;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading)
    xlsxLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => {
        xlsxLoading = null;
        reject(
          new Error(
            "No se pudo cargar la exportación Excel. Puedes descargar CSV o JSON.",
          ),
        );
      };
      document.head.append(s);
    });
  return xlsxLoading;
}
$("xlsxBtn").onclick = async () => {
  if (!dossier) return;
  const snapshot = structuredClone(dossier);
  try {
    const XLSX = await loadXLSX(),
      wb = XLSX.utils.book_new();
    const sheets = {
      Identidad: [
        ["schema", snapshot.schema],
        ["market", "CO"],
        ["ticker", snapshot.ticker],
        ["company", snapshot.company],
        ["analysis_date", snapshot.analysisDate],
        ["run_id", snapshot.runId],
        ["model", snapshot.instrument.model],
        ["quote_currency", "COP"],
        ["security_class", snapshot.instrument.securityClass || "pending-verification"],
        ["valuation_ready", snapshot.audit.valuationReady],
      ],
      Cotizacion: [
        ["price", "currency", "quoted_at", "retrieved_at", "type"],
        [
          snapshot.quote.price,
          "COP",
          snapshot.quote.quotedAt,
          snapshot.retrievedAt,
          snapshot.quote.kind,
        ],
      ],
      Precios: [
        [
          "session_date",
          "session_bar_start",
          "close_COP",
          "adjusted_close_COP",
          "volume",
        ],
        ...snapshot.quote.history.map((p) => [
          p.sessionDate || p.at.slice(0, 10),
          p.at,
          p.close,
          p.adjustedClose,
          p.volume,
        ]),
      ],
      Observaciones: [
        ["field", "date", "frequency", "value", "unit", "verification"],
        ...snapshot.observations.map((o) => [
          o.field,
          o.fiscalDate,
          o.frequency,
          o.value,
          o.unit,
          o.verification,
        ]),
      ],
      Supuestos: [
        ["input", "value", "source"],
        ...Object.keys(snapshot.assumptions).map((k) => [
          k,
          typeof snapshot.assumptions[k] === "object" ? JSON.stringify(snapshot.assumptions[k]) : snapshot.assumptions[k],
          snapshot.audit.valuationReady ? "Ver informe y hoja enlazada" : "Pendiente: no heredado",
        ]),
      ],
      Historias: [
        ["name", "probability", "value"],
        ...snapshot.scenarios.map((s) => [s.name, s.probability ?? null, s.value ?? null]),
      ],
      Fuentes: [
        ["role", "url", "retrieved_at"],
        ...snapshot.sources.map((s) => [s.role, s.url, s.retrievedAt]),
      ],
      Controles: [
        ["check", "status"],
        ...Object.entries(snapshot.audit.checks || {}),
        ...snapshot.audit.warnings.map((w) => [w, "Limitación / supuesto"]),
      ],
    };
    for (const [group, title] of [
      ["income", "Resultados FY"],
      ["balance", "Balance FY"],
      ["cashflow", "Flujo FY"],
    ]) {
      const fields = Object.keys(FIELDS).filter((f) => FIELDS[f][1] === group),
        table = annualTable(snapshot.observations);
      sheets[title] = [
        ["fiscal_date", ...fields.flatMap((f) => [f, f + "_currency"])],
        ...table.map((row) => [
          row.date,
          ...fields.flatMap((f) => [
            row[f]?.value ?? null,
            row[f]?.unit ?? null,
          ]),
        ]),
      ];
    }
    for (const [name, rows] of Object.entries(sheets))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
    XLSX.writeFile(
      wb,
      `${snapshot.ticker}-${snapshot.analysisDate}-Datos-Colombia.xlsx`,
    );
    status(
      "fetchStatus",
      "Excel de datos descargado. No contiene una valoración calculada.",
    );
  } catch (e) {
    status("fetchStatus", e.message, true);
  }
};
function storage() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal() {
  if (!dossier) throw new Error("Primero abre un expediente.");
  validateDossier(dossier);
  const records = storage().filter((d) => d.runId !== dossier.runId);
  records.push(structuredClone(dossier));
  localStorage.setItem(KEY, JSON.stringify(records));
  renderLibrary();
}
$("saveLocalBtn").onclick = () => {
  try {
    saveLocal();
    status("saveStatus", "Expediente guardado en este navegador.");
  } catch (e) {
    status("saveStatus", e.message, true);
  }
};
function open(d) {
  clear();
  dossier = validateDossier(structuredClone(d));
  $("tickerInput").value = dossier.ticker;
  $("instrumentSelect").value = CATALOG.some((i) => i.ticker === dossier.ticker)
    ? dossier.ticker
    : "";
  render();
  const requested = location.hash.slice(1);
  activate(["research", "valuation"].includes(requested) ? requested : (dossier.reports?.valuation ? "valuation" : "data"));
}
function renderLibrary() {
  const root = $("library");
  root.replaceChildren();
  for (const d of storage().sort((a, b) =>
    b.retrievedAt.localeCompare(a.retrievedAt),
  )) {
    try {
      validateDossier(d);
    } catch {
      continue;
    }
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h3");
    h.textContent = d.company;
    const p = document.createElement("p");
    p.textContent = `${d.ticker} · ${d.analysisDate} · ${d.runId.slice(0, 8)}`;
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Abrir expediente";
    b.onclick = () => open(d);
    const value = document.createElement("strong");
    value.textContent = d.valuationSummary?.dcfPrimaryMethod === "FCFF" && typeof d.valuationSummary?.dcfPrimaryIntrinsicPerShareCOP === "number" ? "FCFF Base estimativa · " + fmt(d.valuationSummary.dcfPrimaryIntrinsicPerShareCOP) + " (no certificada)" : d.valuationSummary?.base != null ? "NAV de mercado · " + fmt(d.valuationSummary.base) : d.valuationSummary?.navReference != null ? "NAV provisional · " + fmt(d.valuationSummary.navReference) : "Valoración pendiente";
    const research = document.createElement("button"); research.className = "btn"; research.textContent = "Análisis fundamental";
    research.onclick = () => { location.href = "fundamental-colombia.html?ticker=" + encodeURIComponent(d.ticker); };
    b.textContent = d.reports?.valuation ? "Ver en visor JMR" : "Abrir expediente";
    if (d.reports?.valuation) b.onclick = () => { location.href = "visor-colombia.html?ticker=" + encodeURIComponent(d.ticker); };
    const snippets = document.createElement("div");
    snippets.className = "col-library-snapshot";
    const cur = d.valuationSummary || {};
    const vals = [
      ["Múltiplos ponderados", cur.multiplesWeightedToday],
      [cur.valuationOutput ? "DCF 60% + relativos 40%" : "Combinado relativo", cur.combinedWeightedToday]
    ];
    for (const [label, amount] of vals) {
      const item = document.createElement("div"); item.className = "col-library-snapshot-item";
      const cap = document.createElement("small"); cap.textContent = label;
      const amt = document.createElement("strong"); amt.textContent = typeof amount === "number" && Number.isFinite(amount) ? fmt(amount) : "Pendiente";
      item.append(cap, amt); snippets.append(item);
    }
    const info = document.createElement("small"); info.className = "col-library-scope";
    info.textContent = cur.scopeLabel || "Sin valoración certificada";
    card.append(h, p, value, snippets, info, b, research);
    root.append(card);
  }
}
$("importDossier").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 12e6) throw new Error("El expediente excede 12 MB.");
    open(JSON.parse(await file.text()));
    status("fetchStatus", "Expediente Colombia abierto.");
  } catch (e) {
    status("fetchStatus", e.message, true);
  } finally {
    $("importDossier").value = "";
  }
};
for (const kind of ["research", "valuation"])
  $(kind + "File").onchange = async (event) => {
    try {
      if (!dossier) throw new Error("Primero abre un expediente.");
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 3e6) throw new Error("El informe excede 3 MB.");
      const content = await file.text(),
        meta = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (!meta)
        throw new Error("Faltan metadatos de identidad al inicio del informe.");
      const read = (key) => {
        const m = meta[1].match(
          new RegExp("^" + key + ":\\s*[\"']?([^\\n\"']+)[\"']?\\s*$", "m"),
        );
        return m?.[1].trim();
      };
      if (
        read("market") !== "CO" ||
        read("ticker") !== dossier.ticker ||
        read("analysis_date") !== dossier.analysisDate ||
        read("run_id") !== dossier.runId
      )
        throw new Error(
          "Mercado, ticker, fecha o ID de ejecución no coinciden con este expediente.",
        );
      dossier.reports[kind] = {
        name: file.name,
        content,
        importedAt: new Date().toISOString(),
      };
      render();
      status(
        kind + "Status",
        "Informe incorporado al expediente. La importación no certifica sus cálculos.",
      );
    } catch (e) {
      status(kind + "Status", e.message, true);
    } finally {
      $(kind + "File").value = "";
    }
  };
async function prompt(kind) {
  const response = await fetch(`prompts/colombia-${kind}-v1.md`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo cargar el prompt Colombia.");
  let text = await response.text();
  if (dossier) {
    const identity = {
      market: "CO",
      ticker: dossier.ticker,
      company: dossier.company,
      analysis_date: dossier.analysisDate,
      run_id: dossier.runId,
      model: dossier.instrument.model,
      model_approved: !!dossier.audit.modelApproved,
      financials_reconciled: !!dossier.audit.primaryReconciled,
    };
    text +=
      "\n\n## Identidad de esta ejecución\n" +
      JSON.stringify(identity, null, 2) +
      "\nAdjunto requerido: el expediente JSON de esta ejecución. No sustituyas sus ausencias por datos de otra empresa.\n";
  }
  $("promptPreview").textContent = text;
  download(
    `JMR-Colombia-${kind}-v1${dossier ? "-" + dossier.ticker : ""}.md`,
    text,
    "text/markdown",
  );
}
document
  .querySelectorAll("[data-prompt]")
  .forEach(
    (b) =>
      (b.onclick = () =>
        prompt(b.dataset.prompt).catch((e) =>
          status("fetchStatus", e.message, true),
        )),
  );
$("connectBtn").onclick = () => window.GhOAuth.startLogin();
$("syncBtn").onclick = async () => {
  try {
    const response = await fetch(GH, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (response.status === 404) {
      status("saveStatus", "Aún no hay expedientes publicados de Colombia.");
      return;
    }
    if (!response.ok)
      throw new Error("No se pudo sincronizar: HTTP " + response.status);
    const entries = await response.json();
    const records = storage();
    for (const entry of entries) {
      if (entry.type !== "file" || !entry.name.endsWith(".json")) continue;
      const r = await fetch(GH + encodeURIComponent(entry.name), {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error("Expediente no disponible: " + entry.name);
      const file = await r.json();
      const d = validateDossier(
        JSON.parse(GhOAuth.b64DecodeUnicode(file.content.replace(/\s/g, ""))),
      );
      const idx = records.findIndex((x) => x.runId === d.runId);
      if (idx < 0) {
        records.push(d);
      } else {
        // Only replace an already-cached dossier when the published revision
        // is genuinely newer. Preserve unpublished local work otherwise.
        const remoteRevision = d.publication?.revisedAt || "";
        const localRevision =
          records[idx].publication?.revisedAt ||
          records[idx].publication?.publishedAt || "";
        if (remoteRevision && remoteRevision > localRevision) {
          records[idx] = d;
          if (dossier?.runId === d.runId) {
            dossier = structuredClone(d);
            render();
          }
        }
      }
    }
    localStorage.setItem(KEY, JSON.stringify(records));
    renderLibrary();
    if (!dossier) {
      const ticker = new URLSearchParams(location.search).get("ticker");
      const selected = records.filter(d => !ticker || d.ticker === ticker).sort((a,b) => (b.updatedAt || b.retrievedAt).localeCompare(a.updatedAt || a.retrievedAt))[0];
      if (ticker && selected) open(selected);
    }
    status("saveStatus", "Valoraciones Colombia sincronizadas.");
  } catch (e) {
    status("saveStatus", e.message, true);
  }
};
$("publishBtn").onclick = () => {
  if (!dossier) {
    status("saveStatus", "Primero abre un expediente.", true);
    return;
  }
  $("publishSummary").textContent =
    `${dossier.company} (${dossier.ticker}) · ${dossier.analysisDate}. Incluye datos y ${Object.values(dossier.reports).filter(Boolean).length} informes. Se conserva como expediente pendiente de auditoría.`;
  $("publishDialog").showModal();
};
$("cancelPublish").onclick = () => $("publishDialog").close();
$("confirmPublish").onclick = async () => {
  const button = $("confirmPublish");
  button.disabled = true;
  try {
    if (!GhOAuth.getGhToken())
      throw new Error("Conecta GitHub antes de publicar.");
    validateDossier(dossier);
    const snapshot = structuredClone(dossier);
    snapshot.publication = {
      authorized: true,
      publishedAt: new Date().toISOString(),
    };
    const name = `${snapshot.ticker}-${snapshot.runId}.json`,
      url = GH + encodeURIComponent(name);
    const current = await fetch(url, {
      headers: GhOAuth.ghHeaders(),
      cache: "no-store",
    });
    let sha;
    if (current.ok) sha = (await current.json()).sha;
    else if (current.status !== 404)
      throw new Error("No se pudo comprobar la versión remota.");
    const body = {
      message: `Colombia: expediente ${snapshot.ticker}`,
      content: GhOAuth.b64EncodeUnicode(JSON.stringify(snapshot, null, 2)),
      ...(sha ? { sha } : {}),
    };
    const r = await fetch(url, {
      method: "PUT",
      headers: { ...GhOAuth.ghHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("Publicación rechazada: HTTP " + r.status);
    dossier = snapshot;
    saveLocal();
    $("publishDialog").close();
    status("saveStatus", "Expediente publicado en Colombia.");
  } catch (e) {
    status("saveStatus", e.message, true);
    $("publishDialog").close();
  } finally {
    button.disabled = false;
  }
};
let theme = localStorage.getItem("bitacora-theme") || "system";
function applyTheme() {
  if (theme === "system")
    document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = theme;
  $("themeBtn").textContent =
    "Tema: " +
    ({ system: "sistema", dark: "oscuro", light: "claro" }[theme] || theme);
}
applyTheme();
$("themeBtn").onclick = () => {
  theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  localStorage.setItem("bitacora-theme", theme);
  applyTheme();
};
render();
renderLibrary();
activate(["data", "research", "valuation", "library", "prompts"].includes(location.hash.slice(1))
  ? location.hash.slice(1) : "library");
// Mostrar expedientes Colombia ya publicados al abrir, sin importación manual.
// Reutiliza la sincronización existente; conserva expedientes locales ajenos.
$("syncBtn").click();
document
  .querySelector("nav.appnav a.active")
  .scrollIntoView({ inline: "center", block: "nearest" });
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("sw.js").catch(() => {});
