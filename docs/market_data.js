// Autocompletado de la Calculadora Modelo JMR desde Financial Modeling Prep
// (financialmodelingprep.com) — una API financiera pensada para consumirse
// directamente desde el navegador (a diferencia de SEC EDGAR, que bloquea
// las peticiones cross-origin). Requiere una API key gratuita propia,
// guardada solo en tu navegador (localStorage) — nunca se envía a ningún
// servidor propio, ni la key ni tus datos del formulario.
//
// Nada se auto-completa a ciegas: cada campo llenado queda marcado (verde =
// dato reportado, dorado = calculado a partir de esos datos) y se puede
// editar libremente; escribir en el campo quita la marca.

var MarketData = (function () {
  var API_KEY_STORAGE = "jmr-fmp-apikey";
  var BASE = "https://financialmodelingprep.com/stable/";
  var M = 1e6; // el formulario trabaja en millones

  function getApiKey() {
    try { return (localStorage.getItem(API_KEY_STORAGE) || "").trim(); } catch (e) { return ""; }
  }
  function setApiKey(key) {
    try { localStorage.setItem(API_KEY_STORAGE, (key || "").trim()); } catch (e) {}
  }

  function clampPct(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function fetchJSON(path, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 12000);
    return fetch(BASE + path, { signal: ctrl.signal })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) throw new Error("API key inválida o rechazada (HTTP " + res.status + ")");
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && !Array.isArray(data) && data["Error Message"]) throw new Error(data["Error Message"]);
        return data;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function avgOf(arr) {
    var v = arr.filter(function (x) { return x != null && isFinite(x); });
    if (!v.length) return null;
    return v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  }
  function windowAvg(arr, n) { return avgOf(arr.slice(0, n)); }
  function pickField(obj, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var v = obj[candidates[i]];
      if (v != null && isFinite(v)) return v;
    }
    return null;
  }

  // Promedios históricos de crecimiento de ingresos y margen EBIT — se
  // calculan con los mismos campos ya verificados de income-statement
  // (revenue, operatingIncome), sin depender de ningún endpoint nuevo.
  function historicalGrowthMargin(income) {
    var growths = [];
    for (var i = 0; i < income.length - 1; i++) {
      var r0 = income[i] && income[i].revenue, r1 = income[i + 1] && income[i + 1].revenue;
      if (r0 != null && r1 > 0) growths.push((r0 / r1 - 1) * 100);
    }
    var margins = income
      .map(function (y) { return y.operatingIncome != null && y.revenue ? (y.operatingIncome / y.revenue) * 100 : null; })
      .filter(function (x) { return x != null; });
    return {
      growth: { y3: windowAvg(growths, 3), y5: windowAvg(growths, 5), y10: windowAvg(growths, 10) },
      margin: { y3: windowAvg(margins, 3), y5: windowAvg(margins, 5), y10: windowAvg(margins, 10) }
    };
  }

  // Promedios históricos de los 5 múltiplos — intenta leerlos ya calculados
  // del endpoint "key-metrics" (varios nombres de campo candidatos, por si
  // el nombre exacto cambia). Si el endpoint no trae nada usable, se
  // devuelve null y esa sección simplemente no se muestra — no es un dato
  // garantizado como el resto de la calculadora.
  function historicalMultiples(keyMetrics) {
    if (!keyMetrics || !keyMetrics.length) return null;
    var series = { evEbitda: [], evFcff: [], pe: [], pfcfe: [], pocf: [] };
    keyMetrics.forEach(function (y) {
      series.evEbitda.push(pickField(y, ["evToEBITDA", "evToEbitda", "enterpriseValueOverEBITDA", "evEbitda"]));
      series.evFcff.push(pickField(y, ["evToFreeCashFlow", "evToFCF", "enterpriseValueOverFreeCashFlow", "evToOperatingCashFlow"]));
      series.pe.push(pickField(y, ["peRatio", "priceToEarningsRatio", "priceEarningsRatio"]));
      series.pfcfe.push(pickField(y, ["priceToFreeCashFlowRatio", "pfcfRatio", "priceToFreeCashFlowsRatio"]));
      series.pocf.push(pickField(y, ["priceToOperatingCashFlowRatio", "pocfratio", "priceCashFlowRatio", "priceToOperatingCashFlowsRatio"]));
    });
    var hasAny = Object.keys(series).some(function (k) { return series[k].some(function (v) { return v != null; }); });
    if (!hasAny) return null;
    var out = {};
    Object.keys(series).forEach(function (k) {
      out[k] = { y3: windowAvg(series[k], 3), y5: windowAvg(series[k], 5), y10: windowAvg(series[k], 10) };
    });
    return out;
  }

  function set(out, field, val, bucket) {
    if (val !== undefined && val !== null && isFinite(val)) {
      out.values[field] = val;
      out[bucket].push(field);
    } else {
      out.missing.push(field);
    }
  }

  function deriveFields(profile, income, balance, cashflow) {
    var out = { values: {}, auto: [], derived: [], missing: [] };
    var inc0 = income[0] || null, inc1 = income[1] || null;
    var bal0 = balance[0] || null, bal1 = balance[1] || null;
    var cf0 = cashflow[0] || null;

    var revenue0 = inc0 && inc0.revenue, revenue1 = inc1 && inc1.revenue;
    var ebit0 = inc0 && inc0.operatingIncome;
    var pretax0 = inc0 && inc0.incomeBeforeTax;
    var taxExp0 = inc0 && inc0.incomeTaxExpense;
    var ni0 = inc0 && inc0.netIncome;
    var epsDil0 = inc0 && inc0.epsDiluted;
    var shares0 = inc0 && inc0.weightedAverageShsOutDil;
    var shares1 = inc1 && inc1.weightedAverageShsOutDil;
    var ebitda0 = inc0 && inc0.ebitda;

    var cash0 = bal0 && bal0.cashAndCashEquivalents;
    var debt0 = bal0 && bal0.totalDebt;
    var debt1 = bal1 && bal1.totalDebt;
    var minority0 = bal0 && bal0.minorityInterest;

    var da0 = cf0 && cf0.depreciationAndAmortization;
    var capex0 = cf0 && cf0.investmentsInPropertyPlantAndEquipment; // FMP ya lo reporta negativo
    var ocf0 = cf0 && cf0.netCashProvidedByOperatingActivities;
    var divPaid0 = cf0 && cf0.netDividendsPaid; // total $, negativo
    var changeInWC0 = cf0 && cf0.changeInWorkingCapital; // negativo = capital de trabajo aumentó (usa caja)

    var price = profile && profile.price;

    set(out, "revenue0", revenue0 != null ? revenue0 / M : null, "auto");
    set(out, "ebit0", ebit0 != null ? ebit0 / M : null, "auto");
    set(out, "shares0", shares0 != null ? shares0 / M : null, "auto");
    set(out, "cash", cash0 != null ? cash0 / M : null, "auto");
    set(out, "debt", debt0 != null ? debt0 / M : null, "auto");
    if (minority0 != null) set(out, "minorityInterests", minority0 / M, "auto");
    set(out, "precioActual", price, "auto");

    if (pretax0 != null && taxExp0 != null && pretax0 !== 0) {
      set(out, "taxEffective", clampPct((taxExp0 / pretax0) * 100, 0, 45), "derived");
    } else out.missing.push("taxEffective");

    if (da0 != null && revenue0) set(out, "daPctRevenue", (da0 / revenue0) * 100, "derived");
    else out.missing.push("daPctRevenue");

    if (capex0 != null && revenue0) set(out, "capexPctRevenue", (capex0 / revenue0) * 100, "derived");
    else out.missing.push("capexPctRevenue");

    var interestOther0 = pretax0 != null && ebit0 != null ? pretax0 - ebit0 : null;
    if (interestOther0 != null && ebit0) set(out, "interestOtherPctEBIT", (interestOther0 / ebit0) * 100, "derived");
    else out.missing.push("interestOtherPctEBIT");

    // ΔNWC: FMP reporta "changeInWorkingCapital" ya aislado de otros ajustes
    // no monetarios (stock comp, impuesto diferido, etc.) — verificado que
    // NI + D&A + stockBasedCompensation + deferredIncomeTax +
    // changeInWorkingCapital + otherNonCashItems = OCF, exacto. Negativo =
    // el capital de trabajo aumentó (usa caja); el motor espera "nwc"
    // positivo en ese caso (se resta de FCFF/OCF), así que se invierte el
    // signo. Si no está disponible, se cae a la identidad del propio motor
    // (ocf = NI + D&A − nwc), menos precisa pero sin depender de ese campo.
    var nwc0 = changeInWC0 != null ? -changeInWC0
      : (ni0 != null && da0 != null && ocf0 != null ? ni0 + da0 - ocf0 : null);
    if (nwc0 != null && revenue0 && revenue1) {
      var deltaRev = revenue0 - revenue1;
      if (deltaRev) set(out, "nwcPctDeltaRevenue", (nwc0 / deltaRev) * 100, "derived");
      else out.missing.push("nwcPctDeltaRevenue");
    } else out.missing.push("nwcPctDeltaRevenue");

    if (debt0 != null && debt1 != null && revenue0) {
      set(out, "netBorrowingPctRevenue", ((debt0 - debt1) / revenue0) * 100, "derived");
    } else out.missing.push("netBorrowingPctRevenue");

    if (shares0 && shares1) set(out, "buybackRate", (shares0 / shares1 - 1) * 100, "derived");
    else out.missing.push("buybackRate");

    if (divPaid0 != null && shares0) set(out, "dividendPerShare", Math.abs(divPaid0) / shares0, "derived");
    else out.missing.push("dividendPerShare");

    // Sugerencia histórica para el escenario Base — estimación a partir de
    // lo reportado, no un dato ni una proyección; ajústala a tu tesis.
    if (revenue0 && revenue1 > 0) set(out, "growthBase", clampPct((revenue0 / revenue1 - 1) * 100, -60, 80), "derived");
    if (ebit0 != null && revenue0) set(out, "marginBase", (ebit0 / revenue0) * 100, "derived");

    // Múltiplos base — con precio real de la API, sin depender de una
    // segunda fuente para el precio.
    if (price && shares0) {
      var sharesM = shares0 / M;
      var marketCap = price * sharesM;
      var debtM = (debt0 || 0) / M, cashM = (cash0 || 0) / M;
      var ev = marketCap + debtM - cashM;
      var capexM = capex0 != null ? capex0 / M : null;
      var nwcM = nwc0 != null ? nwc0 / M : null;
      var taxFrac = pretax0 && taxExp0 != null ? taxExp0 / pretax0 : null;

      if (ebitda0) { var ebitdaM = ebitda0 / M; if (ebitdaM > 0) set(out, "evEbitdaBase", ev / ebitdaM, "derived"); }
      else out.missing.push("evEbitdaBase");

      if (ebit0 != null && capexM != null && nwcM != null && taxFrac != null) {
        var fcffM = (ebit0 / M) * (1 - taxFrac) + (da0 || 0) / M + capexM - nwcM;
        if (fcffM > 0) set(out, "evFcffBase", ev / fcffM, "derived"); else out.missing.push("evFcffBase");
      } else out.missing.push("evFcffBase");

      if (epsDil0) set(out, "peBase", price / epsDil0, "derived");
      else out.missing.push("peBase");

      if (ni0 != null && capexM != null && nwcM != null) {
        var fcfeM = ni0 / M + (da0 || 0) / M + capexM - nwcM;
        if (fcfeM > 0) set(out, "pfcfeBase", price / (fcfeM / sharesM), "derived"); else out.missing.push("pfcfeBase");
      } else out.missing.push("pfcfeBase");

      if (ocf0 != null) {
        var ocfPerShare = ocf0 / M / sharesM;
        if (ocfPerShare > 0) set(out, "pocfBase", price / ocfPerShare, "derived"); else out.missing.push("pocfBase");
      } else out.missing.push("pocfBase");
    } else {
      ["evEbitdaBase", "evFcffBase", "peBase", "pfcfeBase", "pocfBase"].forEach(function (f) { out.missing.push(f); });
    }

    return out;
  }

  function buscar(ticker) {
    var t = (ticker || "").trim().toUpperCase();
    if (!t) return Promise.reject(new Error("Ingresa un ticker."));
    var key = getApiKey();
    if (!key) {
      var e = new Error("Falta la API key de Financial Modeling Prep.");
      e.noApiKey = true;
      return Promise.reject(e);
    }
    var sym = "symbol=" + encodeURIComponent(t);
    var qs = "apikey=" + encodeURIComponent(key);

    return Promise.allSettled([
      fetchJSON("profile?" + sym + "&" + qs),
      fetchJSON("income-statement?" + sym + "&period=annual&limit=10&" + qs),
      fetchJSON("balance-sheet-statement?" + sym + "&period=annual&limit=2&" + qs),
      fetchJSON("cash-flow-statement?" + sym + "&period=annual&limit=2&" + qs),
      fetchJSON("key-metrics?" + sym + "&period=annual&limit=10&" + qs)
    ]).then(function (results) {
      var val = function (r) { return r.status === "fulfilled" ? r.value : null; };
      var failedStages = [];
      var stageNames = ["profile", "income-statement", "balance-sheet-statement", "cash-flow-statement", "key-metrics"];
      results.forEach(function (r, i) { if (r.status === "rejected") failedStages.push(stageNames[i] + ": " + (r.reason && r.reason.message)); });

      var profileArr = val(results[0]);
      var profile = profileArr && profileArr[0];
      var income = val(results[1]) || [];
      var balance = val(results[2]) || [];
      var cashflow = val(results[3]) || [];
      var keyMetrics = val(results[4]) || [];

      if ((!profile || !Object.keys(profile).length) && !income.length) {
        if (failedStages.length === 5) {
          throw new Error(failedStages[0]);
        }
        return { ok: false, notFound: true, ticker: t };
      }

      var d = deriveFields(profile, income, balance, cashflow);
      var gm = historicalGrowthMargin(income);
      return {
        ok: true,
        ticker: t,
        companyName: (profile && profile.companyName) || t,
        fiscalYearEnd: (income[0] && income[0].date) || null,
        values: d.values,
        auto: d.auto,
        derived: d.derived,
        missing: d.missing,
        partial: failedStages.length > 0 ? failedStages : null,
        historical: { growth: gm.growth, margin: gm.margin, multiples: historicalMultiples(keyMetrics) }
      };
    });
  }

  return { buscar: buscar, getApiKey: getApiKey, setApiKey: setApiKey };
})();
