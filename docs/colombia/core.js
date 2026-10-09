// Colombia-only data contract. No imports from the US loaders or assumption engine.
export const SCHEMA = "jmr-colombia-dossier-v1";
export const FIELDS = {
  TotalRevenue: ["Ingresos", "income"],
  OperatingIncome: ["EBIT", "income"],
  GrossProfit: ["Utilidad bruta", "income"],
  NetIncome: ["Utilidad neta", "income"],
  NetIncomeCommonStockholders: ["Utilidad atribuible a comunes", "income"],
  PretaxIncome: ["Utilidad antes de impuestos", "income"],
  TaxProvision: ["Impuestos", "income"],
  InterestExpense: ["Gasto de intereses", "income"],
  EBITDA: ["EBITDA", "income"],
  TotalAssets: ["Activos", "balance"],
  TotalLiabilitiesNetMinorityInterest: ["Pasivos", "balance"],
  StockholdersEquity: ["Patrimonio de accionistas", "balance"],
  MinorityInterest: ["Minoritarios", "balance"],
  TotalDebt: ["Deuda", "balance"],
  CashAndCashEquivalents: ["Caja y equivalentes", "balance"],
  CashCashEquivalentsAndShortTermInvestments: [
    "Caja e inversiones cortas",
    "balance",
  ],
  OrdinarySharesNumber: ["Acciones reportadas (verificar clases)", "shares"],
  DilutedAverageShares: ["Acciones diluidas promedio", "shares"],
  OperatingCashFlow: ["Flujo operativo", "cashflow"],
  CapitalExpenditure: ["Capex", "cashflow"],
  DepreciationAndAmortization: ["Depreciación y amortización", "cashflow"],
  ChangeInWorkingCapital: [
    "Cambio de capital de trabajo (signo del proveedor)",
    "cashflow",
  ],
  CashDividendsPaid: ["Dividendos pagados", "cashflow"],
  NetIssuancePaymentsOfDebt: ["Endeudamiento neto", "cashflow"],
};
export function normalizeTicker(input) {
  const ticker = String(input || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9-]{1,20}\.CL$/.test(ticker))
    throw new Error(
      "Usa la acción local con sufijo .CL (ej. ECOPETROL.CL). Los ADR y tickers de EE. UU. tienen otro proceso.",
    );
  return ticker;
}
const number = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
export function analysisDateAt(iso) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function parseFinancials(payload, ticker, retrievedAt) {
  const observations = [],
    seen = new Map();
  const blocks = payload?.timeseries?.result || [];
  if (payload?.timeseries?.error)
    throw new Error(
      "Proveedor sin estados financieros: " +
        payload.timeseries.error.description,
    );
  for (const block of blocks) {
    const symbols = block.meta?.symbol || [];
    if (!symbols.length || symbols.some((s) => s.toUpperCase() !== ticker))
      throw new Error(
        "Los estados financieros pertenecen a otro instrumento o no identifican al emisor.",
      );
    for (const frequency of ["annual", "quarterly"])
      for (const field of Object.keys(FIELDS)) {
        for (const row of block[frequency + field] || []) {
          const value = number(row.reportedValue?.raw);
          if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(row.asOfDate || ""))
            continue;
          if (row.asOfDate > retrievedAt.slice(0, 10))
            throw new Error(
              "El proveedor devolvió un período financiero futuro.",
            );
          const unit =
            FIELDS[field][1] === "shares" ? "shares" : row.currencyCode || null;
          const observation = {
            field,
            fiscalDate: row.asOfDate,
            frequency,
            value,
            unit,
            currency: FIELDS[field][1] === "shares" ? null : unit,
            source: "Yahoo Finance",
            retrievedAt,
            publishedAt: null,
            verification: "pending-primary",
            basis:
              "provider-reported; consolidation and period duration pending verification",
          };
          const key = [frequency, field, row.asOfDate, unit].join("|");
          if (seen.has(key)) {
            if (seen.get(key) !== value)
              throw new Error(
                "Observaciones incompatibles para el mismo período y campo.",
              );
            continue;
          }
          seen.set(key, value);
          observations.push(observation);
        }
      }
  }
  return observations.sort(
    (a, b) =>
      a.fiscalDate.localeCompare(b.fiscalDate) ||
      a.field.localeCompare(b.field),
  );
}
export function parseQuote(payload, ticker, retrievedAt) {
  const chart = payload?.chart?.result?.[0];
  if (!chart)
    throw new Error(
      payload?.chart?.error?.description || "No se encontró cotización local.",
    );
  const meta = chart.meta || {};
  if (
    String(meta.symbol || "").toUpperCase() !== ticker ||
    meta.currency !== "COP" ||
    meta.exchangeName !== "BVC"
  )
    throw new Error(
      "Identidad de mercado incompatible: se requiere el ticker local BVC en COP.",
    );
  if (meta.instrumentType && meta.instrumentType !== "EQUITY")
    throw new Error("El instrumento no es una acción.");
  const price = number(meta.regularMarketPrice);
  const timestamp = number(meta.regularMarketTime);
  if (!(price > 0) || !timestamp)
    throw new Error("Cotización sin precio o fecha de negociación.");
  const quotedAt = new Date(timestamp * 1000).toISOString();
  if (Date.parse(quotedAt) > Date.parse(retrievedAt) + 60000)
    throw new Error("Fecha de negociación futura.");
  const q = chart.indicators?.quote?.[0] || {},
    adj = chart.indicators?.adjclose?.[0]?.adjclose || [];
  const history = (chart.timestamp || []).flatMap((t, i) => {
    const close = number(q.close?.[i]);
    if (!(close > 0)) return [];
    const at = new Date(t * 1000).toISOString();
    if (at > retrievedAt) return [];
    return [
      {
        at,
        timestampRole: "session-bar-start",
        sessionDate: analysisDateAt(at),
        close,
        adjustedClose: number(adj[i]),
        volume: number(q.volume?.[i]),
      },
    ];
  });
  return {
    price,
    currency: "COP",
    quotedAt,
    retrievedAt,
    source: "Yahoo Finance",
    kind: "last-available-trade",
    ageDays: Math.max(
      0,
      Math.floor((Date.parse(retrievedAt) - Date.parse(quotedAt)) / 86400000),
    ),
    history,
    historyInterval: "1d",
    splits: chart.events?.splits || {},
  };
}
export function annualTable(observations) {
  const annual = observations.filter((o) => o.frequency === "annual");
  return [...new Set(annual.map((o) => o.fiscalDate))].sort().map((date) => {
    const row = { date };
    for (const field of Object.keys(FIELDS)) {
      const candidates = annual.filter(
        (o) => o.fiscalDate === date && o.field === field,
      );
      row[field] = candidates.length === 1 ? candidates[0] : null;
    }
    return row;
  });
}
export function buildDossier({
  ticker,
  instrument,
  annualPayload,
  chartPayload,
  retrievedAt,
  runId,
  errors = [],
}) {
  ticker = normalizeTicker(ticker);
  const quote = parseQuote(chartPayload, ticker, retrievedAt);
  const observations = parseFinancials(
    annualPayload || {},
    ticker,
    retrievedAt,
  );
  const table = annualTable(observations);
  const coverage = Object.fromEntries(
    Object.keys(FIELDS).map((f) => [
      f,
      observations.filter((o) => o.frequency === "annual" && o.field === f)
        .length,
    ]),
  );
  const annualYears = coverage.TotalRevenue;
  const currencies = [
    ...new Set(observations.filter((o) => o.currency).map((o) => o.currency)),
  ];
  const warnings = [
    "Datos automáticos del proveedor: pendientes de conciliación con estados oficiales y notas. No equivalen a una valoración auditada.",
    `Historia de ingresos: ${annualYears} ejercicios. Las ausencias se conservan como pendientes; no se rellenan con cero.`,
    "LTM pendiente: verificar duración y publicación de períodos antes de combinar trimestres. Los balances nunca se suman.",
    "Acciones y capitalización del proveedor no validan derechos de cada clase ni factores ADR. No se calculan múltiplos con esas cifras sin conciliación.",
    "Sin WACC, Ke, ROIC terminal, crecimiento, probabilidades ni múltiplos objetivo prellenados. Deben sustentarse en este expediente.",
  ];
  if (quote.ageDays > 3)
    warnings.push(
      `La última negociación es de hace ${quote.ageDays} días; no es precio de hoy.`,
    );
  if (currencies.some((c) => c !== "COP"))
    warnings.push(
      "Estados en moneda distinta de COP: elegir moneda de valoración y conciliar conversiones antes de calcular.",
    );
  warnings.push(...errors);
  const model = instrument?.model || "unknown";
  const dossier = {
    schema: SCHEMA,
    workflow: "colombia-v1",
    runId,
    market: "CO",
    ticker,
    company:
      chartPayload?.chart?.result?.[0]?.meta?.longName ||
      instrument?.name ||
      ticker,
    analysisDate: analysisDateAt(retrievedAt),
    retrievedAt,
    instrument: {
      ticker,
      exchange: "BVC",
      quoteCurrency: "COP",
      securityClass: "pending-verification",
      economicRightsVerified: false,
      model,
      website: instrument?.website || null,
    },
    quote,
    observations,
    coverage: {
      annualYears,
      fields: coverage,
      reportingCurrencies: currencies,
      ltmAvailable: false,
    },
    diagnostics: table.map((row) => {
      const rev = row.TotalRevenue,
        ebit = row.OperatingIncome;
      return {
        date: row.date,
        ebitMargin:
          rev && ebit && rev.unit && rev.unit === ebit.unit && rev.value > 0
            ? ebit.value / rev.value
            : null,
      };
    }),
    audit: {
      isolation: "ok",
      primaryReconciled: false,
      valuationReady: false,
      modelApproved: false,
      checks: { identity: true, currency: true, noInheritedAssumptions: true },
      warnings,
    },
    assumptions: {
      valuationCurrency: null,
      riskfreeRate: null,
      equityRiskPremium: null,
      countryRiskExposure: null,
      beta: null,
      costOfEquity: null,
      costOfDebt: null,
      wacc: null,
      terminalGrowth: null,
      terminalRoic: null,
      terminalRoe: null,
    },
    scenarios: ["Base", "Conservadora", "Optimista", "Disrupción"].map(
      (name) => ({ name, probability: null, inputs: {}, value: null }),
    ),
    reports: { research: null, valuation: null },
    sources: [
      {
        role: "price",
        url: `https://finance.yahoo.com/quote/${ticker}/`,
        retrievedAt,
      },
      {
        role: "financials-provider",
        url: `https://finance.yahoo.com/quote/${ticker}/financials/`,
        retrievedAt,
      },
      {
        role: "regulatory-discovery",
        url: "https://www.superfinanciera.gov.co/SIMEV2/",
        retrievedAt,
      },
      ...(instrument?.website
        ? [{ role: "issuer-discovery", url: instrument.website, retrievedAt }]
        : []),
    ],
    publication: { authorized: false, publishedAt: null },
  };
  validateDossier(dossier);
  return dossier;
}
export function validateDossier(d) {
  if (
    !d ||
    d.schema !== SCHEMA ||
    d.workflow !== "colombia-v1" ||
    d.market !== "CO"
  )
    throw new Error("Archivo ajeno al flujo Colombia.");
  const ticker = normalizeTicker(d.ticker);
  if (
    d.instrument?.ticker !== ticker ||
    d.instrument?.exchange !== "BVC" ||
    d.instrument?.quoteCurrency !== "COP"
  )
    throw new Error(
      "La identidad del expediente y del instrumento no coinciden.",
    );
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(d.runId || ""))
    throw new Error("Falta un ID independiente de ejecución.");
  if (
    !Array.isArray(d.observations) ||
    !d.quote ||
    d.quote.currency !== "COP" ||
    !d.retrievedAt
  )
    throw new Error("Contrato de datos incompleto.");
  if (
    d.analysisDate !== analysisDateAt(d.retrievedAt) ||
    !d.coverage ||
    !d.audit ||
    !d.reports ||
    !Array.isArray(d.sources) ||
    !d.assumptions ||
    !Array.isArray(d.scenarios)
  )
    throw new Error("Expediente incompleto o fechas incompatibles.");
  if (
    ![
      "operating",
      "commodity",
      "infrastructure",
      "financial",
      "holding",
      "unknown",
    ].includes(d.instrument.model)
  )
    throw new Error("Tipo de modelo no reconocido.");
  for (const o of d.observations) {
    if (
      !Object.hasOwn(FIELDS, o.field) ||
      !["annual", "quarterly"].includes(o.frequency) ||
      number(o.value) === null ||
      !/^\d{4}-\d{2}-\d{2}$/.test(o.fiscalDate || "") ||
      o.fiscalDate > d.retrievedAt.slice(0, 10)
    )
      throw new Error("Observación financiera inválida.");
  }
  return d;
}
export function csvFor(d) {
  validateDossier(d);
  const rows = [
    [
      "ticker",
      "period",
      "frequency",
      "field",
      "value",
      "unit",
      "source",
      "verification",
    ],
  ];
  d.observations.forEach((o) =>
    rows.push([
      d.ticker,
      o.fiscalDate,
      o.frequency,
      o.field,
      o.value,
      o.unit,
      o.source,
      o.verification,
    ]),
  );
  return rows
    .map((row) =>
      row
        .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
        .join(","),
    )
    .join("\r\n");
}
