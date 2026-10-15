import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  buildDossier,
  normalizeTicker,
  parseFinancials,
  parseQuote,
  validateDossier,
  csvFor,
  analysisDateAt,
} from "../docs/colombia/core.js";
import { obtainColombia } from "../api/colombia.js";
const at = "2026-10-09T11:00:00.000Z",
  ticker = "ECOPETROL.CL";
function chart(symbol = ticker, currency = "COP", exchangeName = "BVC") {
  return {
    chart: {
      result: [
        {
          meta: {
            symbol,
            currency,
            exchangeName,
            instrumentType: "EQUITY",
            regularMarketPrice: 2720,
            regularMarketTime: Date.parse("2026-10-08T20:00:00Z") / 1000,
          },
          timestamp: [],
          indicators: { quote: [{}] },
        },
      ],
    },
  };
}
function block(
  field,
  value,
  date = "2025-12-31",
  currencyCode = "COP",
  symbol = ticker,
) {
  return {
    meta: { symbol: [symbol] },
    ["annual" + field]: [
      { asOfDate: date, currencyCode, reportedValue: { raw: value } },
    ],
  };
}
const financials = () => ({
  timeseries: {
    result: [
      block("TotalRevenue", 100),
      block("OperatingIncome", 20),
      block("TotalRevenue", 90, "2024-12-31"),
    ],
  },
});
function dossier(annualPayload = financials()) {
  return buildDossier({
    ticker,
    annualPayload,
    chartPayload: chart(),
    retrievedAt: at,
    runId: "test-run-12345",
  });
}
test("US/ADR symbols cannot enter Colombia", () => {
  for (const t of ["EC", "AAPL", "../../EC.CL", "ECOPETROL.CL?x=1"])
    assert.throws(() => normalizeTicker(t));
  assert.equal(normalizeTicker(" ecopetrol.cl "), ticker);
});
test("provider identity, COP and exchange are enforced independently", () => {
  assert.throws(() => parseQuote(chart("EC"), ticker, at));
  assert.throws(() => parseQuote(chart(ticker, "USD"), ticker, at));
  assert.throws(() => parseQuote(chart(ticker, "COP", "NYQ"), ticker, at));
  assert.throws(() =>
    parseFinancials(
      {
        timeseries: {
          result: [
            block("TotalRevenue", 100, undefined, undefined, "CELSIA.CL"),
          ],
        },
      },
      ticker,
      at,
    ),
  );
});
test("missing data stays absent; finite real zero is retained; no financial defaults", () => {
  const d = dossier();
  assert.equal(d.coverage.annualYears, 2);
  assert.equal(d.coverage.fields.TotalDebt, 0);
  assert.equal(d.assumptions.wacc, null);
  assert.equal(d.scenarios[0].probability, null);
  assert.equal(d.audit.valuationReady, false);
  assert.equal(d.coverage.ltmAvailable, false);
  assert.equal(
    parseFinancials(
      { timeseries: { result: [block("TotalDebt", 0)] } },
      ticker,
      at,
    )[0].value,
    0,
  );
});
test("only compatible currencies produce descriptive ratios", () => {
  assert.equal(dossier().diagnostics.at(-1).ebitMargin, 0.2);
  const f = financials();
  f.timeseries.result[1] = block("OperatingIncome", 20, "2025-12-31", "USD");
  assert.equal(dossier(f).diagnostics.at(-1).ebitMargin, null);
});
test("conflicting duplicate, future period and future trade are rejected", () => {
  const f = financials();
  f.timeseries.result.push(block("TotalRevenue", 200));
  assert.throws(() => dossier(f));
  assert.throws(() =>
    dossier({
      timeseries: { result: [block("TotalRevenue", 1, "2027-12-31")] },
    }),
  );
  const c = chart();
  c.chart.result[0].meta.regularMarketTime = Date.parse("2027-01-01") / 1000;
  assert.throws(() => parseQuote(c, ticker, at));
});
test("retrieval time is not quote time and no price-scaled class valuation is fabricated", () => {
  const d = dossier();
  assert.equal(d.quote.quotedAt, "2026-10-08T20:00:00.000Z");
  assert.equal(d.quote.retrievedAt, at);
  assert.equal(d.instrument.economicRightsVerified, false);
  assert.equal(d.quote.marketCap, undefined);
});
test("imports require the Colombia contract and same identity", () => {
  assert.throws(() => validateDossier({ ticker: "AAPL" }));
  const d = dossier();
  d.instrument.ticker = "CELSIA.CL";
  assert.throws(() => validateDossier(d));
  assert.match(csvFor(dossier()), /ECOPETROL.CL/);
});
test("each automatic execution has a fresh run id, no US or filled-company data", async () => {
  const mock = async (url) =>
    url.includes("/chart/") ? chart() : financials();
  const a = await obtainColombia(ticker, mock, new Date(at)),
    b = await obtainColombia(ticker, mock, new Date(at));
  assert.notEqual(a.runId, b.runId);
  assert.deepEqual(a.assumptions, b.assumptions);
  assert.equal(a.reports.research, null);
});
test("financial provider outage preserves quote and exposes incomplete coverage", async () => {
  const mock = async (url) => {
    if (url.includes("/chart/")) return chart();
    throw new Error("outage");
  };
  const d = await obtainColombia(ticker, mock, new Date(at));
  assert.equal(d.quote.price, 2720);
  assert.equal(d.coverage.annualYears, 0);
  assert.ok(d.audit.warnings.some((x) => x.includes("outage")));
});
test("US browser adapter cannot fetch Colombian data and retains other tickers", async () => {
  let calls = 0;
  const ctx = {
    localStorage: { getItem: () => null },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: () => {
      calls++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ price: 100 }]),
      });
    },
  };
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(new URL("../docs/market_data.js", import.meta.url), "utf8"),
    ctx,
  );
  await assert.rejects(
    ctx.MarketData.fetchPrice(ticker),
    /Acciones colombianas/,
  );
  await assert.rejects(ctx.MarketData.buscar(ticker), /Acciones colombianas/);
  assert.equal(calls, 0);
  assert.equal(await ctx.MarketData.fetchPrice("AAPL"), 100);
});
test("no source cache can serve stale API values as current", () => {
  const sw = fs.readFileSync(new URL("../docs/sw.js", import.meta.url), "utf8");
  assert.match(sw, /pathname.startsWith\("\/api\/"\)/);
});

test("analysis date uses Bogota rather than the UTC date", () => {
  assert.equal(analysisDateAt("2026-10-10T02:00:00Z"), "2026-10-09");
});
