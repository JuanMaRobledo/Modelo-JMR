// Autocompletado de la Calculadora Modelo JMR desde datos públicos.
// Fuente primaria: SEC EDGAR (XBRL Company Facts API) — solo empresas que
// reportan ante la SEC de EE.UU. Precio: mejor esfuerzo desde Stooq (sin
// clave), usado únicamente para derivar los 5 múltiplos base; si falla,
// esos campos quedan intactos para completarse a mano.
//
// Todo corre en el navegador del usuario — no pasa por ningún servidor propio.
// Nada se auto-completa a ciegas: cada campo llenado queda marcado (verde =
// dato reportado por la SEC, dorado = calculado a partir de esos datos) y
// se puede editar libremente; escribir en el campo quita la marca.

var SecEdgar = (function () {
  var CIK_CACHE_KEY = "jmr-sec-tickers-v1";
  var CIK_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
  var M = 1e6; // el formulario trabaja en millones

  function fetchWithTimeout(url, ms, asJSON) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 10000);
    return fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " — " + url);
        return asJSON === false ? res.text() : res.json();
      })
      .finally(function () { clearTimeout(timer); });
  }

  function loadTickerMap() {
    try {
      var cached = JSON.parse(localStorage.getItem(CIK_CACHE_KEY) || "null");
      if (cached && cached.ts && Date.now() - cached.ts < CIK_CACHE_TTL_MS && cached.map) {
        return Promise.resolve(cached.map);
      }
    } catch (e) {}
    return fetchWithTimeout("https://www.sec.gov/files/company_tickers.json", 15000).then(function (data) {
      var map = {};
      Object.keys(data).forEach(function (k) {
        var row = data[k];
        if (row && row.ticker) map[row.ticker.toUpperCase()] = { cik: String(row.cik_str), name: row.title };
      });
      try { localStorage.setItem(CIK_CACHE_KEY, JSON.stringify({ ts: Date.now(), map: map })); } catch (e) {}
      return map;
    });
  }

  function pad10(cik) { return ("0000000000" + cik).slice(-10); }

  function clampPct(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Devuelve {tag, unit, series} con series = hechos anuales (10-K/10-K-A),
  // más recientes primero, deduplicados por fecha de cierre de periodo.
  function seriesFor(facts, taxonomy, tags) {
    for (var i = 0; i < tags.length; i++) {
      var concept = facts[taxonomy] && facts[taxonomy][tags[i]];
      if (!concept || !concept.units) continue;
      var unitKeys = Object.keys(concept.units);
      for (var u = 0; u < unitKeys.length; u++) {
        var raw = concept.units[unitKeys[u]].filter(function (f) {
          if (!f.end || (f.form !== "10-K" && f.form !== "10-K/A")) return false;
          if (f.start) {
            var days = (new Date(f.end) - new Date(f.start)) / 86400000;
            if (days < 300 || days > 400) return false; // solo periodos ~anuales
          }
          return true;
        });
        if (!raw.length) continue;
        raw.sort(function (a, b) { return a.end < b.end ? 1 : a.end > b.end ? -1 : 0; });
        var seen = {}, series = [];
        raw.forEach(function (f) { if (!seen[f.end]) { seen[f.end] = true; series.push(f); } });
        return { tag: tags[i], unit: unitKeys[u], series: series };
      }
    }
    return null;
  }
  function v0(s) { return s && s.series[0] ? s.series[0].val : null; }
  function v1(s) { return s && s.series[1] ? s.series[1].val : null; }
  function endOf(s, i) { return s && s.series[i] ? s.series[i].end : null; }

  function deriveFields(facts) {
    var out = { values: {}, auto: [], derived: [], missing: [], meta: {} };

    var pick = function (tax, tags) { return seriesFor(facts, tax, tags); };

    var revS = pick("us-gaap", ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet", "SalesRevenueGoodsNet"]);
    var ebitS = pick("us-gaap", ["OperatingIncomeLoss"]);
    var pretaxS = pick("us-gaap", ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"]);
    var taxExpS = pick("us-gaap", ["IncomeTaxExpenseBenefit"]);
    var niS = pick("us-gaap", ["NetIncomeLoss", "ProfitLoss"]);
    var sharesS = pick("dei", ["EntityCommonStockSharesOutstanding"]);
    var cashS = pick("us-gaap", ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"]);
    var ltDebtNC = pick("us-gaap", ["LongTermDebtNoncurrent"]);
    var ltDebtC = pick("us-gaap", ["LongTermDebtCurrent"]);
    var stBorrow = pick("us-gaap", ["ShortTermBorrowings", "DebtCurrent"]);
    var minorityS = pick("us-gaap", ["MinorityInterest"]);
    var daS = pick("us-gaap", ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet", "DepreciationAndAmortization"]);
    var capexS = pick("us-gaap", ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsForCapitalImprovements"]);
    var ocfS = pick("us-gaap", ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"]);
    var epsDilS = pick("us-gaap", ["EarningsPerShareDiluted"]);
    var divS = pick("us-gaap", ["CommonStockDividendsPerShareDeclared", "CommonStockDividendsPerShareCashPaid"]);

    var revenue0 = v0(revS), revenue1 = v1(revS);
    var ebit0 = v0(ebitS);
    var pretax0 = v0(pretaxS);
    var taxExp0 = v0(taxExpS);
    var ni0 = v0(niS);
    var shares0 = v0(sharesS), shares1 = v1(sharesS);
    var cash0 = v0(cashS);
    var debt0 = (v0(ltDebtNC) || 0) + (v0(ltDebtC) || 0) + (v0(stBorrow) || 0);
    var debt1 = (v1(ltDebtNC) || 0) + (v1(ltDebtC) || 0) + (v1(stBorrow) || 0);
    var hasDebtData = !!(v0(ltDebtNC) || v0(ltDebtC) || v0(stBorrow));
    var minority0 = v0(minorityS);
    var da0 = v0(daS);
    var capex0 = v0(capexS);
    var ocf0 = v0(ocfS);
    var epsDil0 = v0(epsDilS);
    var div0 = v0(divS);

    function set(field, val, bucket) { out.values[field] = val; out[bucket].push(field); }
    function miss(field) { out.missing.push(field); }

    if (revenue0) set("revenue0", revenue0 / M, "auto"); else miss("revenue0");
    if (ebit0 != null) set("ebit0", ebit0 / M, "auto"); else miss("ebit0");
    if (shares0) set("shares0", shares0 / M, "auto"); else miss("shares0");
    if (cash0 != null) set("cash", cash0 / M, "auto"); else miss("cash");
    if (hasDebtData) set("debt", debt0 / M, "auto"); else miss("debt");
    if (minority0 != null) set("minorityInterests", minority0 / M, "auto");

    if (pretax0 != null && taxExp0 != null && pretax0 !== 0) {
      set("taxEffective", clampPct((taxExp0 / pretax0) * 100, 0, 45), "derived");
    } else miss("taxEffective");

    if (da0 != null && revenue0) set("daPctRevenue", (da0 / revenue0) * 100, "derived"); else miss("daPctRevenue");
    if (capex0 != null && revenue0) set("capexPctRevenue", -(Math.abs(capex0) / revenue0) * 100, "derived"); else miss("capexPctRevenue");

    var interestOther0 = (pretax0 != null && ebit0 != null) ? pretax0 - ebit0 : null;
    if (interestOther0 != null && ebit0) set("interestOtherPctEBIT", (interestOther0 / ebit0) * 100, "derived");
    else miss("interestOtherPctEBIT");

    // ΔNWC no se puede aislar de forma fiable entre miles de convenciones de
    // signo distintas en XBRL, así que se deriva con la misma identidad que
    // usa el motor para el OCF (ocf = netIncome + D&A − nwc), que solo
    // necesita 3 cifras robustas y casi universales (NI, D&A, OCF). Esto
    // mezcla el capital de trabajo real con otras partidas no monetarias del
    // flujo operativo — es una aproximación, documentada en la página.
    if (ni0 != null && da0 != null && ocf0 != null && revenue0 && revenue1) {
      var nwc0 = ni0 + da0 - ocf0;
      var deltaRev = revenue0 - revenue1;
      if (deltaRev) set("nwcPctDeltaRevenue", (nwc0 / deltaRev) * 100, "derived"); else miss("nwcPctDeltaRevenue");
    } else miss("nwcPctDeltaRevenue");

    if (hasDebtData && debt1 != null && revenue0) {
      set("netBorrowingPctRevenue", ((debt0 - debt1) / revenue0) * 100, "derived");
    } else miss("netBorrowingPctRevenue");

    if (shares0 && shares1) set("buybackRate", (shares0 / shares1 - 1) * 100, "derived"); else miss("buybackRate");
    if (div0 != null) set("dividendPerShare", div0, "auto"); else miss("dividendPerShare");

    // Sugerencia histórica para el escenario Base — es una estimación a
    // partir de lo reportado, no un dato ni una proyección; el usuario debe
    // ajustarla a su propia tesis. Conservador/Optimista quedan siempre
    // manuales porque son enteramente criterio del inversionista.
    if (revenue0 && revenue1 > 0) set("growthBase", clampPct((revenue0 / revenue1 - 1) * 100, -60, 80), "derived");
    if (ebit0 != null && revenue0) set("marginBase", (ebit0 / revenue0) * 100, "derived");

    out.meta.fiscalYearEnd = endOf(revS, 0) || endOf(ebitS, 0) || null;
    out.raw = { revenue0: revenue0, ebit0: ebit0, ni0: ni0, da0: da0, capex0: capex0, ocf0: ocf0, epsDil0: epsDil0, shares0: shares0, cash0: cash0, debt0: hasDebtData ? debt0 : null, taxEffectivePct: out.values.taxEffective != null ? out.values.taxEffective : null };
    return out;
  }

  function computeMultiplesBase(raw, price) {
    var out = {};
    if (!price || !raw.shares0 || !raw.revenue0) return out;
    var sharesM = raw.shares0 / M;
    var marketCap = price * sharesM;
    var debtM = (raw.debt0 || 0) / M;
    var cashM = (raw.cash0 || 0) / M;
    var ev = marketCap + debtM - cashM;
    var taxFrac = raw.taxEffectivePct != null ? raw.taxEffectivePct / 100 : 0.21;

    if (raw.ebit0 != null && raw.da0 != null) {
      var ebitdaM = (raw.ebit0 + raw.da0) / M;
      if (ebitdaM > 0) out.evEbitdaBase = ev / ebitdaM;
    }
    var capexM = raw.capex0 != null ? -(Math.abs(raw.capex0)) / M : null;
    var nwcM = raw.ni0 != null && raw.da0 != null && raw.ocf0 != null ? (raw.ni0 + raw.da0 - raw.ocf0) / M : null;
    if (raw.ebit0 != null && capexM != null && nwcM != null) {
      var fcffM = (raw.ebit0 / M) * (1 - taxFrac) + raw.da0 / M + capexM - nwcM;
      if (fcffM > 0) out.evFcffBase = ev / fcffM;
    }
    if (raw.epsDil0) out.peBase = price / raw.epsDil0;
    if (raw.ni0 != null && capexM != null && nwcM != null && sharesM) {
      var fcfeM = raw.ni0 / M + raw.da0 / M + capexM - nwcM;
      if (fcfeM > 0) out.pfcfeBase = price / (fcfeM / sharesM);
    }
    if (raw.ocf0 != null && sharesM) {
      var ocfPerShare = raw.ocf0 / M / sharesM;
      if (ocfPerShare > 0) out.pocfBase = price / ocfPerShare;
    }
    return out;
  }

  function fetchPrice(ticker) {
    var sym = ticker.indexOf(".") >= 0 ? ticker.toLowerCase() : ticker.toLowerCase() + ".us";
    return fetchWithTimeout("https://stooq.com/q/l/?s=" + encodeURIComponent(sym) + "&f=sd2t2ohlcv&h&e=csv", 8000, false)
      .then(function (text) {
        var lines = text.trim().split("\n");
        if (lines.length < 2) return null;
        var cols = lines[1].split(",");
        var close = parseFloat(cols[6]);
        return isFinite(close) && close > 0 ? close : null;
      })
      .catch(function () { return null; });
  }

  function buscar(ticker) {
    var t = (ticker || "").trim().toUpperCase();
    if (!t) return Promise.reject(new Error("Ingresa un ticker."));

    // Si el usuario escribe directamente el CIK numérico (ej. desde
    // https://www.sec.gov/cgi-bin/browse-edgar buscado a mano), nos saltamos
    // por completo la búsqueda ticker→CIK en www.sec.gov — útil si ese paso
    // falla en tu navegador (algunos navegadores bloquean ese archivo por
    // CORS aunque data.sec.gov sí lo permita).
    var lookupPromise = /^\d{1,10}$/.test(t)
      ? Promise.resolve({ cik: t, name: null })
      : loadTickerMap().catch(function (err) {
          var e = new Error((err && err.message) || "error de red");
          e.stage = "tickers (www.sec.gov/files/company_tickers.json)";
          throw e;
        }).then(function (map) { return map[t] || null; });

    return lookupPromise.then(function (hit) {
      if (!hit) {
        return { ok: false, notFoundInSec: true, ticker: t };
      }
      var cik10 = pad10(hit.cik);
      return fetchWithTimeout("https://data.sec.gov/api/xbrl/companyfacts/CIK" + cik10 + ".json", 15000).catch(function (err) {
        var e = new Error((err && err.message) || "error de red");
        e.stage = "companyfacts (data.sec.gov)";
        throw e;
      }).then(function (companyFacts) {
        var d = deriveFields(companyFacts.facts || {});
        return fetchPrice(t).then(function (price) {
          if (price) {
            var mult = computeMultiplesBase(d.raw, price);
            Object.keys(mult).forEach(function (k) { d.values[k] = mult[k]; d.derived.push(k); });
            d.values.precioActual = price;
            d.auto.push("precioActual");
          } else {
            ["precioActual", "evEbitdaBase", "evFcffBase", "peBase", "pfcfeBase", "pocfBase"].forEach(function (f) { d.missing.push(f); });
          }
          return {
            ok: true,
            ticker: t,
            companyName: hit.name || companyFacts.entityName || null,
            cik: cik10,
            fiscalYearEnd: d.meta.fiscalYearEnd,
            values: d.values,
            auto: d.auto,
            derived: d.derived,
            missing: d.missing,
            priceOk: !!price
          };
        });
      });
    });
  }

  return { buscar: buscar };
})();
