import { randomUUID } from "node:crypto";
import { CATALOG } from "../docs/colombia/catalog.js";
import {
  FIELDS,
  normalizeTicker,
  buildDossier,
} from "../docs/colombia/core.js";

// Only Yahoo's fixed hosts and validated local symbols; no generic URL proxy.
async function getJSON(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Proveedor: HTTP ${response.status}`);
  return response.json();
}
export async function obtainColombia(
  ticker,
  fetchJSON = getJSON,
  now = new Date(),
) {
  ticker = normalizeTicker(ticker);
  const types = Object.keys(FIELDS)
    .flatMap((f) => ["annual" + f, "quarterly" + f])
    .join(",");
  const params = new URLSearchParams({
    type: types,
    period1: "1420070400",
    period2: String(Math.floor(now.getTime() / 1000)),
  });
  const sym = encodeURIComponent(ticker);
  const results = await Promise.allSettled([
    fetchJSON(
      `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=10y&interval=1d&events=splits`,
    ),
    fetchJSON(
      `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${sym}?${params}`,
    ),
  ]);
  if (results[0].status !== "fulfilled") throw results[0].reason;
  return buildDossier({
    ticker,
    instrument: CATALOG.find((i) => i.ticker === ticker),
    chartPayload: results[0].value,
    annualPayload: results[1].status === "fulfilled" ? results[1].value : {},
    errors:
      results[1].status === "fulfilled"
        ? []
        : ["Estados no disponibles: " + results[1].reason.message],
    retrievedAt: now.toISOString(),
    runId: randomUUID(),
  });
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Solo consulta GET." });
  let ticker;
  try {
    ticker = normalizeTicker(req.query.ticker);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  try {
    return res.status(200).json(await obtainColombia(ticker));
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
