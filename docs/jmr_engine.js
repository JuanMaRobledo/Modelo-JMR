// Motor de cálculo del Modelo JMR (DCF Damodaran + 5 múltiplos), reimplementado y
// validado celda-a-celda contra la plantilla real (caso ADBE, 26-ago-2026).

var JMR_WEIGHTS = {
  "Crecimiento":          {dcf:0.60, evEbitda:0.10, evFcff:0.15, pe:0.05, pfcfe:0.10, pocf:0.00},
  "Madura":                {dcf:0.40, evEbitda:0.20, evFcff:0.10, pe:0.20, pfcfe:0.05, pocf:0.05},
  "Genérico":              {dcf:0.50, evEbitda:0.10, evFcff:0.10, pe:0.10, pfcfe:0.10, pocf:0.10},
  "Defensiva":             {dcf:0.30, evEbitda:0.20, evFcff:0.10, pe:0.25, pfcfe:0.10, pocf:0.05},
  "Cíclica/Commodity":     {dcf:0.45, evEbitda:0.20, evFcff:0.15, pe:0.05, pfcfe:0.10, pocf:0.05},
  "Intensiva en Capital":  {dcf:0.20, evEbitda:0.40, evFcff:0.15, pe:0.05, pfcfe:0.05, pocf:0.15},
  "Financiera":            {dcf:0.35, evEbitda:0.00, evFcff:0.00, pe:0.35, pfcfe:0.20, pocf:0.10},
  "Infraestructura":       {dcf:0.40, evEbitda:0.15, evFcff:0.25, pe:0.10, pfcfe:0.05, pocf:0.05},
  "REIT/Inmobiliaria":     {dcf:0.25, evEbitda:0.30, evFcff:0.10, pe:0.05, pfcfe:0.20, pocf:0.10},
  "Software":              {dcf:0.55, evEbitda:0.25, evFcff:0.05, pe:0.05, pfcfe:0.05, pocf:0.05}
};

function growthPath(growthY1to5, terminalGrowth){
  var g = new Array(11);
  for(var n=1;n<=5;n++) g[n]=growthY1to5;
  var step=(g[5]-terminalGrowth)/5;
  for(var n=6;n<=10;n++) g[n]=g[n-1]-step;
  return g; // g[1..10]; terminal = terminalGrowth
}
function marginPath(marginY1, marginTarget){
  var m = new Array(11);
  m[1]=marginY1;
  for(var n=2;n<=5;n++) m[n]=marginTarget-((marginTarget-marginY1)/5)*(5-n);
  for(var n=6;n<=10;n++) m[n]=marginTarget;
  return m;
}
function taxPath(effective, marginal){
  var t = new Array(11);
  for(var n=1;n<=5;n++) t[n]=effective;
  var step=(marginal-effective)/5;
  for(var n=6;n<=10;n++) t[n]=t[n-1]+step;
  return t; // terminal = marginal
}
function waccPath(waccInitial, waccTerminal){
  var w = new Array(11);
  for(var n=1;n<=5;n++) w[n]=waccInitial;
  var step=(waccInitial-waccTerminal)/5;
  for(var n=6;n<=10;n++) w[n]=w[n-1]-step;
  return w; // terminal = waccTerminal
}

// Motor DCF completo (10 años + terminal) para un escenario.
function runDCF(inp, growthY1to5, marginTarget){
  var terminalGrowth = inp.riskFreeRate;
  var waccTerminal = inp.riskFreeRate + inp.matureMarketERP;
  var g = growthPath(growthY1to5, terminalGrowth);
  var marginY1 = inp.ebit0 / inp.revenue0;
  var m = marginPath(marginY1, marginTarget);
  var tax = taxPath(inp.taxEffective, inp.taxMarginal);
  var wacc = waccPath(inp.wacc, waccTerminal);

  var rev = new Array(11); rev[0]=inp.revenue0;
  for(var n=1;n<=10;n++) rev[n]=rev[n-1]*(1+g[n]);
  var revTerminal = rev[10]*(1+terminalGrowth);

  var ebit = new Array(11);
  for(var n=1;n<=10;n++) ebit[n]=rev[n]*m[n];
  var ebitTerminal = revTerminal*m[10];

  var ebit1t = new Array(11);
  for(var n=1;n<=10;n++) ebit1t[n]=ebit[n]*(1-tax[n]);
  var ebit1tTerminal = ebitTerminal*(1-tax[10]);

  var reinvest = new Array(11);
  for(var n=1;n<=9;n++) reinvest[n]=(rev[n+1]-rev[n])/inp.salesToCapital;
  reinvest[10]=(revTerminal-rev[10])/inp.salesToCapital;
  var roicTerminal = waccTerminal;
  var reinvestTerminal = ebit1tTerminal*terminalGrowth/roicTerminal;

  var fcff = new Array(11);
  for(var n=1;n<=10;n++) fcff[n]=ebit1t[n]-reinvest[n];
  var fcffTerminal = ebit1tTerminal-reinvestTerminal;

  var disc = new Array(11);
  disc[1]=1/(1+wacc[1]);
  for(var n=2;n<=10;n++) disc[n]=disc[n-1]*(1/(1+wacc[n]));

  var pvSum=0;
  for(var n=1;n<=10;n++) pvSum += fcff[n]*disc[n];

  var terminalValue = fcffTerminal/(waccTerminal-terminalGrowth);
  var pvTerminal = terminalValue*disc[10];
  var sumPV = pvTerminal+pvSum;

  var probFail = inp.probFailure||0;
  var recovery = inp.recoveryPct||0;
  var proceedsIfFail = sumPV*recovery;
  var valueOpAssets = sumPV*(1-probFail)+proceedsIfFail*probFail;

  var equityValue = valueOpAssets - inp.debt - (inp.minorityInterests||0) + inp.cash + (inp.nonOperatingAssets||0);
  var valuePerShare = equityValue/inp.shares0;

  return valuePerShare;
}

// Proyecta FCFF/EBITDA/NetIncome/OCF/FCFE/EPS a FY+1..+3 para un escenario (capa "Financials Multiples").
function projectFinancials(inp, growthY1to5, marginTarget){
  var g = growthPath(growthY1to5, inp.riskFreeRate);
  var marginY1 = inp.ebit0/inp.revenue0;
  var m = marginPath(marginY1, marginTarget);
  var tax = taxPath(inp.taxEffective, inp.taxMarginal);

  var rev=[inp.revenue0], ebit=[null], da=[null], capex=[null], nwc=[null], fcff=[null],
      ebitda=[null], interestOther=[null], ebt=[null], netIncome=[null], ocf=[null],
      netBorrow=[null], fcfe=[null], shares=[inp.shares0], eps=[null];
  for(var n=1;n<=3;n++){
    rev[n]=rev[n-1]*(1+g[n]);
    ebit[n]=rev[n]*m[n];
    da[n]=inp.daPctRevenue*rev[n];
    capex[n]=inp.capexPctRevenue*rev[n];
    nwc[n]=inp.nwcPctDeltaRevenue*(rev[n]-rev[n-1]);
    fcff[n]=ebit[n]*(1-tax[n])+da[n]+capex[n]-nwc[n];
    ebitda[n]=ebit[n]+da[n];
    interestOther[n]=inp.interestOtherPctEBIT*ebit[n];
    ebt[n]=ebit[n]+interestOther[n];
    netIncome[n]=ebt[n]*(1-tax[n]);
    ocf[n]=netIncome[n]+da[n]-nwc[n];
    netBorrow[n]=inp.netBorrowingPctRevenue*rev[n];
    fcfe[n]=netIncome[n]+da[n]+capex[n]-nwc[n]+netBorrow[n];
    // shares[0] (input) ya representa las acciones circulantes actuales = año FY+1;
    // la recompra/dilución solo aplica a partir de FY+2 (n-1 exponente, no n).
    shares[n]=shares[0]*Math.pow(1+inp.buybackRate, n-1);
    eps[n]=netIncome[n]/shares[n];
  }
  return {rev:rev, fcff:fcff, ebitda:ebitda, netIncome:netIncome, ocf:ocf, fcfe:fcfe, shares:shares, eps:eps};
}

function impliedPrice(multiploBase, metricFY3, sharesFY3, mult){
  return (multiploBase*mult)*(metricFY3/sharesFY3);
}

// Cálculo completo. inp = objeto con todos los inputs (ver docs/calculadora.html).
function calcularModeloJMR(inp){
  var scenarios = ["cons","base","opt"];
  var growthByScenario = {cons: inp.growthCons, base: inp.growthBase, opt: inp.growthOpt};
  var marginByScenario = {cons: inp.marginCons, base: inp.marginBase, opt: inp.marginOpt};

  var dcf = {};
  scenarios.forEach(function(s){
    dcf[s] = runDCF(inp, growthByScenario[s], marginByScenario[s]);
  });

  var fin = {};
  scenarios.forEach(function(s){
    fin[s] = projectFinancials(inp, growthByScenario[s], marginByScenario[s]);
  });

  var multMap = {cons:0.9, base:1.0, opt:1.1};
  var methods = {
    evEbitda: {baseMult: inp.evEbitdaBase, metric: "ebitda"},
    evFcff:   {baseMult: inp.evFcffBase,   metric: "fcff"},
    pe:       {baseMult: inp.peBase,       metric: "netIncome"},
    pfcfe:    {baseMult: inp.pfcfeBase,    metric: "fcfe"},
    pocf:     {baseMult: inp.pocfBase,     metric: "ocf"}
  };
  var cumDiv = inp.dividendPerShare*3;

  var precios = {dcf: {}};
  scenarios.forEach(function(s){ precios.dcf[s] = dcf[s]; });

  Object.keys(methods).forEach(function(name){
    precios[name] = {};
    scenarios.forEach(function(s){
      var f = fin[s];
      var implied = impliedPrice(methods[name].baseMult, f[methods[name].metric][3], f.shares[3], multMap[s]);
      precios[name][s] = implied + cumDiv;
    });
  });

  var pesos = JMR_WEIGHTS[inp.tipoEmpresa];
  var precioObjetivo = {};
  scenarios.forEach(function(s){
    var sum=0;
    Object.keys(pesos).forEach(function(m){ sum += pesos[m]*precios[m][s]; });
    precioObjetivo[s]=sum;
  });

  var cagr = {};
  scenarios.forEach(function(s){
    cagr[s] = Math.pow(precioObjetivo[s]/inp.precioActual, 1/3)-1;
  });

  function zona(maxPct, minPct){
    var max = precioObjetivo.base*maxPct, min = precioObjetivo.base*minPct;
    return {
      max: max, min: min,
      cagrMax: Math.pow(max/inp.precioActual,1/3)-1,
      cagrMin: Math.pow(min/inp.precioActual,1/3)-1
    };
  }
  var zonas = {
    value: zona(0.70,0.65),
    deepValue: zona(0.60,0.55),
    historica: zona(0.50,0.45)
  };
  var precioConMOS = {
    base: precioObjetivo.base*(1-inp.mos),
    cons: precioObjetivo.cons*(1-inp.mos)
  };

  return {precios: precios, pesos: pesos, precioObjetivo: precioObjetivo, cagr: cagr, zonas: zonas, precioConMOS: precioConMOS};
}

if(typeof module !== 'undefined') module.exports = {calcularModeloJMR: calcularModeloJMR, JMR_WEIGHTS: JMR_WEIGHTS};
