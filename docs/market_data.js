// Autocompletado de la Calculadora Modelo JMR desde Alpha Vantage
// (alphavantage.co) — API financiera de larga trayectoria, pensada para
// consumirse directamente desde el navegador. Requiere una API key gratuita
// propia, guardada solo en tu navegador (localStorage) — nunca se envía a
// ningún servidor propio, ni la key ni tus datos del formulario.
//
// El plan gratuito de Alpha Vantage es limitado: 25 consultas/día, 5/minuto.
// Cada búsqueda de ticker usa 5 llamadas (OVERVIEW, INCOME_STATEMENT,
// BALANCE_SHEET, CASH_FLOW, GLOBAL_QUOTE) — unas 5 búsquedas al día.
//
// A diferencia de otros proveedores probados antes, Alpha Vantage no ofrece
// un endpoint con múltiplos históricos ya calculados; agregarlo por cuenta
// propia requeriría precios históricos día a día, inviable con ese límite
// diario. Por eso solo se muestra referencia histórica de crecimiento y
// margen EBIT (no cuesta llamadas extra, viene incluido en INCOME_STATEMENT).
//
// Nada se auto-completa a ciegas: cada campo llenado queda marcado (verde =
// dato reportado, dorado = calculado a partir de esos datos) y se puede
// editar libremente; escribir en el campo quita la marca.

var MarketData = (function () {
  var API_KEY_STORAGE = "jmr-av-apikey";
  var BASE = "https://www.alphavantage.co/query?";
  var M = 1e6; // el formulario trabaja en millones

  function getApiKey() {
    try { return (localStorage.getItem(API_KEY_STORAGE) || "").trim(); } catch (e) { return ""; }
  }
  function setApiKey(key) {
    try { localStorage.setItem(API_KEY_STORAGE, (key || "").trim()); } catch (e) {}
  }

  function clampPct(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Alpha Vantage reporta todo como texto, incluido "None" para datos
  // faltantes — esto normaliza a número o null.
  function num(v) {
    if (v == null || v === "None" || v === "") return null;
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }

  function fetchAV(params, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 15000);
    return fetch(BASE + params, { signal: ctrl.signal })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        // Alpha Vantage no usa códigos HTTP de error: responde 200 con un
        // campo de texto explicando el problema (key inválida, límite de
        // consultas alcanzado, endpoint premium, etc.)
        if (data && data["Error Message"]) throw new Error(data["Error Message"]);
        if (data && data["Note"]) throw new Error(data["Note"]);
        if (data && data["Information"]) throw new Error(data["Information"]);
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

  // Promedios históricos de crecimiento de ingresos y margen EBIT — vienen
  // gratis de los mismos annualReports de INCOME_STATEMENT, sin llamadas
  // adicionales.
  function historicalGrowthMargin(income) {
    var growths = [];
    for (var i = 0; i < income.length - 1; i++) {
      var r0 = num(income[i] && income[i].totalRevenue), r1 = num(income[i + 1] && income[i + 1].totalRevenue);
      if (r0 != null && r1 > 0) growths.push((r0 / r1 - 1) * 100);
    }
    var margins = income
      .map(function (y) {
        var op = num(y.operatingIncome), rev = num(y.totalRevenue);
        return op != null && rev ? (op / rev) * 100 : null;
      })
      .filter(function (x) { return x != null; });
    return {
      growth: { y3: windowAvg(growths, 3), y5: windowAvg(growths, 5), y10: windowAvg(growths, 10) },
      margin: { y3: windowAvg(margins, 3), y5: windowAvg(margins, 5), y10: windowAvg(margins, 10) }
    };
  }

  function set(out, field, val, bucket) {
    if (val !== undefined && val !== null && isFinite(val)) {
      out.values[field] = val;
      out[bucket].push(field);
    } else {
      out.missing.push(field);
    }
  }

  function deriveFields(overview, income, balance, cashflow, quote) {
    var out = { values: {}, auto: [], derived: [], missing: [] };
    var inc0 = income[0] || null, inc1 = income[1] || null;
    var bal0 = balance[0] || null, bal1 = balance[1] || null;
    var cf0 = cashflow[0] || null;

    var revenue0 = num(inc0 && inc0.totalRevenue), revenue1 = num(inc1 && inc1.totalRevenue);
    var ebit0 = num(inc0 && inc0.operatingIncome);
    var pretax0 = num(inc0 && inc0.incomeBeforeTax);
    var taxExp0 = num(inc0 && inc0.incomeTaxExpense);
    var ni0 = num(inc0 && inc0.netIncome);
    var ebitda0 = num(inc0 && inc0.ebitda);

    var cash0 = num(bal0 && bal0.cashAndCashEquivalentsAtCarryingValue);
    // Alpha Vantage no trae un solo campo "deuda total": se suma corto +
    // largo plazo, con "shortLongTermDebtTotal" como atajo si ya viene sumado.
    var debt0 = num(bal0 && bal0.shortLongTermDebtTotal);
    if (debt0 == null && bal0) {
      var st0 = num(bal0.shortTermDebt) != null ? num(bal0.shortTermDebt) : num(bal0.currentDebt);
      var lt0 = num(bal0.longTermDebt) != null ? num(bal0.longTermDebt) : num(bal0.longTermDebtNoncurrent);
      if (st0 != null || lt0 != null) debt0 = (st0 || 0) + (lt0 || 0);
    }
    var debt1 = num(bal1 && bal1.shortLongTermDebtTotal);
    if (debt1 == null && bal1) {
      var st1 = num(bal1.shortTermDebt) != null ? num(bal1.shortTermDebt) : num(bal1.currentDebt);
      var lt1 = num(bal1.longTermDebt) != null ? num(bal1.longTermDebt) : num(bal1.longTermDebtNoncurrent);
      if (st1 != null || lt1 != null) debt1 = (st1 || 0) + (lt1 || 0);
    }
    var shares0 = num(bal0 && bal0.commonStockSharesOutstanding);
    var shares1 = num(bal1 && bal1.commonStockSharesOutstanding);

    var da0 = num(cf0 && cf0.depreciationDepletionAndAmortization);
    if (da0 == null) da0 = num(inc0 && inc0.depreciationAndAmortization);
    var capex0raw = num(cf0 && cf0.capitalExpenditures);
    var capex0 = capex0raw != null ? -Math.abs(capex0raw) : null; // el motor lo espera negativo
    var ocf0 = num(cf0 && cf0.operatingCashflow);
    var divPaid0 = num(cf0 && cf0.dividendPayoutCommonStock);
    if (divPaid0 == null) divPaid0 = num(cf0 && cf0.dividendPayout);

    var price = null;
    var gq = quote && quote["Global Quote"];
    if (gq) price = num(gq["05. price"]) != null ? num(gq["05. price"]) : num(gq["price"]);

    set(out, "revenue0", revenue0 != null ? revenue0 / M : null, "auto");
    set(out, "ebit0", ebit0 != null ? ebit0 / M : null, "auto");
    set(out, "shares0", shares0 != null ? shares0 / M : null, "auto");
    set(out, "cash", cash0 != null ? cash0 / M : null, "auto");
    set(out, "debt", debt0 != null ? debt0 / M : null, "auto");
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

    // ΔNWC: Alpha Vantage no trae un campo único y confiable de cambio en
    // capital de trabajo, así que se deriva con la misma identidad que usa
    // el motor para el OCF (ocf = NI + D&A − nwc) — solo depende de NI/D&A/
    // OCF, sin ambigüedad de signo.
    var nwc0 = ni0 != null && da0 != null && ocf0 != null ? ni0 + da0 - ocf0 : null;
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

    // Múltiplos base — con precio real de GLOBAL_QUOTE.
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

      var epsDil0 = num(overview && overview.DilutedEPSTTM);
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
      var e = new Error("Falta la API key de Alpha Vantage.");
      e.noApiKey = true;
      return Promise.reject(e);
    }
    var sym = "symbol=" + encodeURIComponent(t);
    var qs = "apikey=" + encodeURIComponent(key);

    return Promise.allSettled([
      fetchAV("function=OVERVIEW&" + sym + "&" + qs),
      fetchAV("function=INCOME_STATEMENT&" + sym + "&" + qs),
      fetchAV("function=BALANCE_SHEET&" + sym + "&" + qs),
      fetchAV("function=CASH_FLOW&" + sym + "&" + qs),
      fetchAV("function=GLOBAL_QUOTE&" + sym + "&" + qs)
    ]).then(function (results) {
      var val = function (r) { return r.status === "fulfilled" ? r.value : null; };
      var failedStages = [];
      var stageNames = ["overview", "income-statement", "balance-sheet", "cash-flow", "quote"];
      results.forEach(function (r, i) { if (r.status === "rejected") failedStages.push(stageNames[i] + ": " + (r.reason && r.reason.message)); });

      var overview = val(results[0]);
      var income = (val(results[1]) && val(results[1]).annualReports) || [];
      var balance = (val(results[2]) && val(results[2]).annualReports) || [];
      var cashflow = (val(results[3]) && val(results[3]).annualReports) || [];
      var quote = val(results[4]);

      if ((!overview || !Object.keys(overview).length) && !income.length) {
        if (failedStages.length === 5) {
          throw new Error(failedStages[0]);
        }
        return { ok: false, notFound: true, ticker: t };
      }

      var d = deriveFields(overview, income, balance, cashflow, quote);
      var gm = historicalGrowthMargin(income);
      return {
        ok: true,
        ticker: t,
        companyName: (overview && overview.Name) || t,
        fiscalYearEnd: (income[0] && income[0].fiscalDateEnding) || null,
        values: d.values,
        auto: d.auto,
        derived: d.derived,
        missing: d.missing,
        partial: failedStages.length > 0 ? failedStages : null,
        noStatements: !income.length && !balance.length && !cashflow.length,
        historical: { growth: gm.growth, margin: gm.margin, multiples: null }
      };
    });
  }

  return { buscar: buscar, getApiKey: getApiKey, setApiKey: setApiKey };
})();
