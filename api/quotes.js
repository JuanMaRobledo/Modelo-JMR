// Cotizaciones para el Screener (docs/screener.html): con ellas la página
// recalcula market cap, múltiplos, FCF yield y PEG cada vez que se abre, sin
// esperar a la corrida diaria completa (.github/workflows/screener.yml).
//
// Yahoo Finance no permite pedidos desde el navegador (CORS), por eso pasa
// por acá. El endpoint "spark" acepta hasta 20 símbolos por pedido: 500
// tickers son 25 pedidos, que se hacen de a 5 en paralelo. El proxy.js del
// sitio ya exige sesión antes de llegar a esta función.

const SPARK = "https://query1.finance.yahoo.com/v8/finance/spark";
const CHUNK = 20;
const PARALLEL = 5;
const MAX_SYMBOLS = 1500;
const TTL_MS = 5 * 60 * 1000;

// Caché en memoria de la instancia: varias visitas seguidas no vuelven a
// pedirle a Yahoo los mismos precios durante 5 minutos.
const cache = new Map();

async function fetchChunk(symbols) {
  const url = `${SPARK}?symbols=${encodeURIComponent(symbols.join(","))}&range=1d&interval=1d`;
  // Con un User-Agent de navegador completo Yahoo responde 429 desde varias
  // IPs de nube; el genérico "Mozilla/5.0" pasa (mismo criterio que el
  // screener en JMR-valuation).
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (res.ok) {
      const data = await res.json();
      const out = {};
      for (const [symbol, row] of Object.entries(data || {})) {
        const closes = (row && row.close) || [];
        // El último cierre y el último timestamp pertenecen a la misma barra.
        // fulldayPrice puede ser intradía con fecha del cierre anterior.
        const price = closes[closes.length - 1];
        const timestamps = row && row.timestamp;
        const lastTimestamp = Array.isArray(timestamps) && timestamps.length
          ? timestamps[timestamps.length - 1] : null;
        if (typeof price === "number" && isFinite(price) && price > 0 &&
            typeof lastTimestamp === "number" && isFinite(lastTimestamp)) {
          out[symbol] = { price, date: new Date(lastTimestamp * 1000).toISOString().slice(0, 10) };
        }
      }
      return out;
    }
    if (res.status !== 429 && res.status < 500) return {};
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  return {};
}

export default async function handler(req, res) {
  const symbols = [...new Set(String(req.query.symbols || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9.\-^=]{1,15}$/.test(s)))].slice(0, MAX_SYMBOLS);
  if (!symbols.length) {
    res.status(400).json({ error: 'Falta "symbols" (tickers separados por coma).' });
    return;
  }

  const now = Date.now();
  const prices = {};
  const priceDates = {};
  const missing = [];
  for (const s of symbols) {
    const hit = cache.get(s);
    if (hit && now - hit.at < TTL_MS) {
      prices[s] = hit.price;
      priceDates[s] = hit.date;
    }
    else missing.push(s);
  }

  const chunks = [];
  for (let i = 0; i < missing.length; i += CHUNK) chunks.push(missing.slice(i, i + CHUNK));
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const results = await Promise.all(chunks.slice(i, i + PARALLEL).map((c) => fetchChunk(c).catch(() => ({}))));
    for (const found of results) {
      for (const [s, quote] of Object.entries(found)) {
        prices[s] = quote.price;
        priceDates[s] = quote.date;
        cache.set(s, { ...quote, at: now });
      }
    }
  }

  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ checkedAt: new Date(now).toISOString(), source: "Yahoo Finance", prices, priceDates });
}
