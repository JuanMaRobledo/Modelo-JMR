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
  "Software":              {dcf:0.55, evEbitda:0.25, evFcff:0.05, pe:0.05, pfcfe:0.05, pocf:0.05},
  "Hyper-Crecimiento / Pre-Rentable": {dcf:0.80, evEbitda:0.00, evFcff:0.10, pe:0.00, pfcfe:0.05, pocf:0.05},
  "Biotech/Farma":         {dcf:0.55, evEbitda:0.05, evFcff:0.20, pe:0.05, pfcfe:0.10, pocf:0.05}
};

// Trayectorias año a año como en 'Valuation output' (plantilla Ginzu de Damodaran).
// Crecimiento: año 1 (Input B27), años 2-5 (B29) y convergencia lineal a la perpetuidad en 6-10.
// anios (opcional): crecimiento de cada uno de los años 1-5 (p. ej. el de una historia por segmentos).
function growthPath(growthY2to5, terminalGrowth, growthY1, anios){
  var g = new Array(11);
  g[1] = (typeof growthY1 === 'number' && isFinite(growthY1)) ? growthY1 : growthY2to5;
  for(var n=2;n<=5;n++) g[n]=growthY2to5;
  if(anios && anios.length === 5) for(var n=1;n<=5;n++) g[n]=anios[n-1];
  var step=(g[5]-terminalGrowth)/5;
  for(var n=6;n<=10;n++) g[n]=g[n-1]-step;
  return g; // g[1..10]; terminal = terminalGrowth
}
// Margen: año 1 (Input B28) y convergencia lineal al objetivo en el año de convergencia (B31).
function marginPath(marginY1, marginTarget, convergenceYear){
  var c = (convergenceYear > 0) ? convergenceYear : 5;
  var m = new Array(11);
  m[1]=marginY1;
  for(var n=2;n<=10;n++) m[n] = n > c ? marginTarget : marginTarget-((marginTarget-marginY1)/c)*(c-n);
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
function num(v, dflt){ return (typeof v === 'number' && isFinite(v)) ? v : dflt; }

// Supuestos de un escenario: crecimiento del año 1, de los años 2-5, margen del año 1 y margen objetivo.
// Sin growthY1*/marginY1* (Calculadora manual) el año 1 usa el crecimiento 2-5 y el margen actual.
function escenarioDe(inp, s){
  var k = {cons:'Cons', base:'Base', opt:'Opt'}[s];
  return {growth: inp['growth'+k], margin: inp.dcfFinanciero ? inp.dcfFinanciero['roe'+k] : inp['margin'+k],
          growthY1: inp['growthY1'+k], marginY1: num(inp['marginY1'+k], inp.ebit0/inp.revenue0)};
}

// Motor DCF completo (10 años + terminal) para un escenario, igual a 'Valuation output'.
function runDCFDetalle(inp, growthY2to5, marginTarget, growthY1, marginY1){
  if(inp.dcfFinanciero) return runFCFEDetalle(inp, growthY2to5, marginTarget, growthY1);
  var terminalGrowth = num(inp.terminalGrowth, inp.riskFreeRate);
  var waccTerminal = num(inp.terminalWacc, inp.riskFreeRate + inp.matureMarketERP);
  var g = growthPath(growthY2to5, terminalGrowth, growthY1, inp.crecimientoAnios);
  var m = marginPath(num(marginY1, inp.ebit0 / inp.revenue0), marginTarget, inp.convergenceYear);
  var tax = taxPath(inp.taxEffective, inp.taxMarginal);
  var wacc = waccPath(inp.wacc, waccTerminal);
  var s2c = function(n){ return n <= 5 ? inp.salesToCapital : num(inp.salesToCapital2, inp.salesToCapital); };

  var rev = new Array(12); rev[0]=inp.revenue0;
  for(var n=1;n<=10;n++) rev[n]=rev[n-1]*(1+g[n]);
  var revTerminal = rev[10]*(1+terminalGrowth);
  rev[11] = revTerminal;

  var ebit = new Array(11), ebit1t = new Array(11), nol = new Array(11);
  nol[0] = num(inp.nol0, 0);
  for(var n=1;n<=10;n++){
    ebit[n]=rev[n]*m[n];
    // Pérdidas acumuladas (NOL): protegen la utilidad de impuestos hasta agotarse.
    ebit1t[n] = ebit[n] > 0 ? (ebit[n] < nol[n-1] ? ebit[n] : ebit[n]-(ebit[n]-nol[n-1])*tax[n]) : ebit[n];
    nol[n] = ebit[n] < 0 ? nol[n-1]-ebit[n] : (nol[n-1] > ebit[n] ? nol[n-1]-ebit[n] : 0);
  }
  var ebitTerminal = revTerminal*m[10];
  var ebit1tTerminal = ebitTerminal*(1-inp.taxMarginal);

  // Reinversión: por defecto el crecimiento del año siguiente (rezago de 1 año, Input B57 = No);
  // con rezago 0 financia el crecimiento del mismo año.
  var lag0 = inp.reinvestLag === 0;
  var reinvest = new Array(11);
  for(var n=1;n<=10;n++) reinvest[n] = (lag0 ? rev[n]-rev[n-1] : rev[n+1]-rev[n])/s2c(n);
  // Retorno sobre el capital después del año 10: por defecto igual al costo de capital (sin retornos
  // excedentes); inp.roicTerminal lo fija si la empresa tiene ventajas duraderas (criterio Damodaran).
  var roicTerminal = (inp.roicTerminal > 0) ? inp.roicTerminal : waccTerminal;
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
  // Input B54: "B" = valor en libros del capital; "V" = valor estimado.
  var proceedsIfFail = (inp.failureBookCapital != null ? inp.failureBookCapital : sumPV)*recovery;
  var valueOpAssets = sumPV*(1-probFail)+proceedsIfFail*probFail;

  var equityValue = valueOpAssets - inp.debt - (inp.minorityInterests||0) + inp.cash + (inp.nonOperatingAssets||0) - (inp.optionsValue||0);
  return {valuePerShare: equityValue/inp.shares0, growth: g, margin: m, revenue: rev, ebit: ebit, ebit1t: ebit1t,
          reinvestment: reinvest, fcff: fcff, wacc: wacc, terminalValue: terminalValue, sumPV: sumPV,
          valueOpAssets: valueOpAssets, equityValue: equityValue};
}
// Financieras: el flujo distribuible pertenece al accionista. Los depósitos y
// la liquidez operativa no se restan/suman como deuda y caja de una industrial.
// Reinversión patrimonial sostenible = utilidad × crecimiento / ROE.
function runFCFEDetalle(inp, growthY2to5, roeTarget, growthY1){
  var f=inp.dcfFinanciero, ke=inp.costoPatrimonio;
  if(typeof f.baseWacc==='number') ke+=(inp.wacc-f.baseWacc)/num(f.equityWeight,1);
  var kt=f.terminalKe, gt=f.terminalGrowth;
  if(!(ke>0 && kt>gt && f.netIncome0>0 && inp.shares0>0 && roeTarget>0))
    throw new Error('Insumos inválidos para DCF FCFE financiero');
  var g=growthPath(growthY2to5,gt,growthY1,inp.crecimientoAnios);
  var rate=waccPath(ke,kt), ni=[f.netIncome0], roe=[], fcfe=[], reinv=[], disc=[], pv=0;
  for(var y=1;y<=10;y++){
    ni[y]=ni[y-1]*(1+g[y]);
    roe[y]=y<=5?roeTarget:roeTarget+(kt-roeTarget)*(y-5)/5;
    reinv[y]=ni[y]*Math.max(0,g[y])/roe[y];
    fcfe[y]=ni[y]-reinv[y];
    disc[y]=(y===1?1:disc[y-1])/(1+rate[y]);pv+=fcfe[y]*disc[y];
  }
  var terminalNI=ni[10]*(1+gt), terminalFCFE=terminalNI*(1-gt/kt);
  var terminalValue=terminalFCFE/(kt-gt), equity=pv+terminalValue*disc[10];
  return {valuePerShare:equity/inp.shares0,growth:g,netIncome:ni,roe:roe,
    reinvestment:reinv,fcfe:fcfe,wacc:rate,terminalValue:terminalValue,
    sumPV:equity,valueOpAssets:null,equityValue:equity,method:'DCF FCFE financiero'};
}
function runDCF(inp, growthY2to5, marginTarget, growthY1, marginY1){
  return runDCFDetalle(inp, growthY2to5, marginTarget, growthY1, marginY1).valuePerShare;
}

// Trayectorias de crecimiento, margen e impuestos de los tres escenarios (las mismas del DCF).
function calcularTrayectorias(inp){
  var out = {};
  ['cons', 'base', 'opt'].forEach(function(s){
    var e = escenarioDe(inp, s);
    out[s] = {growth: growthPath(e.growth, num(inp.terminalGrowth, inp.riskFreeRate), e.growthY1),
              margin: marginPath(e.marginY1, e.margin, inp.convergenceYear), tax: taxPath(inp.taxEffective, inp.taxMarginal)};
  });
  return out;
}

// Proyecta FCFF/EBITDA/NetIncome/OCF/FCFE/EPS a FY+1..+3 para un escenario, igual a 'Financials Multiples'.
// esc (opcional) = parámetros del bloque del escenario en la hoja (inp.porEscenario[s]): cada bloque de
// 'Financials Multiples' tiene su propia base de ingresos, razones históricas y ajustes de margen
// (p. ej. sin la capitalización de I+D); gAdj/mAdj/tAdj son la diferencia con la trayectoria del DCF.
function projectFinancials(inp, growthY2to5, marginTarget, growthY1, marginY1, esc, reinvDcf){
  if(esc){ var o = {}; Object.keys(inp).forEach(function(k){ o[k] = inp[k]; });
           Object.keys(esc).forEach(function(k){ if(esc[k] != null) o[k] = esc[k]; }); inp = o; }
  var adj = function(a, n){ return (a && typeof a[n-1] === 'number' && isFinite(a[n-1])) ? a[n-1] : 0; };
  var g = growthPath(growthY2to5, num(inp.terminalGrowth, inp.riskFreeRate), growthY1);
  var m = marginPath(num(marginY1, inp.ebit0/inp.revenue0), marginTarget, inp.convergenceYear);
  var tax = taxPath(inp.taxEffective, inp.taxMarginal);
  for(var k=1;k<=3;k++){ g[k] += adj(inp.gAdj, k); m[k] += adj(inp.mAdj, k); tax[k] += adj(inp.tAdj, k); }
  // D&A: la hoja usa el promedio móvil de las 3 razones D&A/ingresos anteriores.
  var daRatios = (inp.daRatiosHist && inp.daRatiosHist.length === 3) ? inp.daRatiosHist.slice() : null;
  var divGrowth = num(inp.dividendGrowth, 0);

  var rev=[num(inp.revenueFY0, inp.revenue0)], ebit=[null], da=[null], capex=[null], nwc=[null], fcff=[null],
      ebitda=[null], interestOther=[null], ebt=[null], netIncome=[null], ocf=[null],
      netBorrow=[null], fcfe=[null], shares=[num(inp.sharesMultiplos, inp.shares0)], eps=[null], dps=[null];
  for(var n=1;n<=3;n++){
    rev[n]=rev[n-1]*(1+g[n]);
    ebit[n]=rev[n]*m[n];
    if(daRatios){
      var r = (daRatios[daRatios.length-1]+daRatios[daRatios.length-2]+daRatios[daRatios.length-3])/3;
      da[n]=r*rev[n]; daRatios.push(r);
    } else da[n]=inp.daPctRevenue*rev[n];
    capex[n]=inp.capexPctRevenue*rev[n];
    nwc[n] = (inp.nwcModo === 'reinversionDCF' && reinvDcf) ? da[n]+capex[n]+reinvDcf[n] : inp.nwcPctDeltaRevenue*(rev[n]-rev[n-1]);
    fcff[n]=ebit[n]*(1-tax[n])+da[n]+capex[n]-nwc[n];
    ebitda[n]=ebit[n]+da[n];
    interestOther[n]=inp.interestOtherPctEBIT*ebit[n];
    ebt[n]=ebit[n]+interestOther[n];
    netIncome[n]=ebt[n]*(1-tax[n]);
    ocf[n]=netIncome[n]+da[n]-nwc[n];
    // Endeudamiento neto: la hoja lo liga al cambio de ingresos (deuda / ingresos LTM × Δ ingresos).
    netBorrow[n] = (typeof inp.netBorrowingPctDeltaRevenue === 'number') ? inp.netBorrowingPctDeltaRevenue*(rev[n]-rev[n-1])
                                                                         : inp.netBorrowingPctRevenue*rev[n];
    fcfe[n]=netIncome[n]+da[n]+capex[n]-nwc[n]+netBorrow[n];
    // shares[0] (input) ya representa las acciones circulantes actuales = año FY+1;
    // la recompra/dilución solo aplica a partir de FY+2 (n-1 exponente, no n).
    shares[n]=shares[0]*Math.pow(1+inp.buybackRate, n-1);
    eps[n]=netIncome[n]/shares[n];
    dps[n]=(inp.dividendPerShare||0)*Math.pow(1+divGrowth, n-1);
  }
  return {rev:rev, fcff:fcff, ebitda:ebitda, netIncome:netIncome, ocf:ocf, fcfe:fcfe, shares:shares, eps:eps, dps:dps};
}

function impliedPrice(multiploBase, metricFY3, sharesFY3, mult){
  return (multiploBase*mult)*(metricFY3/sharesFY3);
}
// Precio implícito de un múltiplo en FY+n como en las pestañas de la hoja: los múltiplos de
// empresa (EV/EBITDA, EV/FCFF) restan la deuda neta y dividen por MAX(acciones FY+1, FY+n).
function precioMultiplo(inp, name, M, f, n){
  var ev = (name === 'evEbitda' || name === 'evFcff') && typeof inp.deudaNetaMultiplos === 'number';
  if(ev) return (M*f[METRICAS[name]][n] - inp.deudaNetaMultiplos)/Math.max(f.shares[1], f.shares[n]);
  return M*(f[METRICAS[name]][n]/f.shares[n]);
}
var METRICAS = {evEbitda:'ebitda', evFcff:'fcff', pe:'netIncome', pfcfe:'fcfe', pocf:'ocf'};

// Múltiplos a valor presente (29-sep-2026): el precio de cada múltiplo al
// cierre del año n (n = 1, 2, 3) más los dividendos acumulados hasta ese año
// (sumados nominalmente) se trae a hoy con el costo del patrimonio:
//   VP_n = (Precio_n + Dividendos_1..n) / (1 + Ke)^n
// Se consolida por método con el promedio simple de los 3 horizontes
// ("promedio", por defecto) o solo con el de 3 años ("solo3").
function valorPresenteMultiplo(precioMasDividendos, ke, n){
  return precioMasDividendos/Math.pow(1+ke, n);
}
function consolidarHorizontes(vp, criterio){
  if(criterio === 'solo3') return vp[2];
  return (vp[0]+vp[1]+vp[2])/3;
}

// Cálculo completo. inp = objeto con todos los inputs (ver docs/calculadora.html).
function calcularModeloJMR(inp){
  var scenarios = ["cons","base","opt"];
  var esc = {};
  scenarios.forEach(function(s){ esc[s] = escenarioDe(inp, s); });

  var dcf = {}, dcfDet = {};
  scenarios.forEach(function(s){
    dcfDet[s] = runDCFDetalle(inp, esc[s].growth, esc[s].margin, esc[s].growthY1, esc[s].marginY1);
    dcf[s] = dcfDet[s].valuePerShare;
  });

  var fin = {};
  scenarios.forEach(function(s){
    var k={cons:'Cons',base:'Base',opt:'Opt'}[s];
    var mi=inp.dcfFinanciero?inp['margin'+k]:esc[s].margin;
    var oldInp=inp;
    if(inp.dcfFinanciero){oldInp=Object.assign({},inp,{dcfFinanciero:null});}
    var reinv=inp.dcfFinanciero?runDCFDetalle(oldInp,esc[s].growth,mi,esc[s].growthY1,esc[s].marginY1).reinvestment:dcfDet[s].reinvestment;
    fin[s] = projectFinancials(inp, esc[s].growth, mi, esc[s].growthY1, esc[s].marginY1,
                               inp.porEscenario && inp.porEscenario[s], reinv);
  });

  // Múltiplo de salida por escenario: los de la hoja (J8/J19/J30) si vienen en inp.multiplos;
  // si no, el Base × 0,9 / 1,1.
  var multMap = {cons:0.9, base:1.0, opt:1.1};
  var baseMult = {evEbitda: inp.evEbitdaBase, evFcff: inp.evFcffBase, pe: inp.peBase, pfcfe: inp.pfcfeBase, pocf: inp.pocfBase};
  var methods = {};
  Object.keys(baseMult).forEach(function(name){
    methods[name] = {};
    var hoja = inp.multiplos && inp.multiplos[name];
    scenarios.forEach(function(s){
      methods[name][s] = (hoja && typeof hoja[s] === 'number' && isFinite(hoja[s])) ? hoja[s]
                       : (s === 'base' && hoja && typeof hoja.base === 'number' ? hoja.base : baseMult[name]*multMap[s]);
    });
  });
  var cumDiv = function(f, n){ var t = 0; for(var k=1;k<=n;k++) t += f.dps[k]; return t; };

  // Tabla FY+3: el DCF (valor de hoy) se lleva a FY+3 con el costo del
  // patrimonio, igual que 'Resumen de Valoración'!C6:E6 de la hoja, para
  // sumarlo en la misma fecha que los múltiplos a FY+3.
  var ke = (typeof inp.costoPatrimonio === 'number' && isFinite(inp.costoPatrimonio)) ? inp.costoPatrimonio : inp.wacc;
  var precios = {dcf: {}};
  scenarios.forEach(function(s){ precios.dcf[s] = dcf[s]*Math.pow(1+ke, 3); });

  Object.keys(methods).forEach(function(name){
    precios[name] = {};
    scenarios.forEach(function(s){
      precios[name][s] = precioMultiplo(inp, name, methods[name][s], fin[s], 3) + cumDiv(fin[s], 3);
    });
  });

  // Pesos: los de 'Resumen de Valoración' (inp.pesos) o la tabla por tipo de empresa.
  var pesosVP = inp.pesos || JMR_WEIGHTS[inp.tipoEmpresa];

  // Valor presente: 5 métodos × 3 horizontes por escenario, consolidado por
  // método y ponderado con el DCF (que ya está en valor de hoy).
  var criterio = inp.criterioConsolidacion === 'solo3' ? 'solo3' : 'promedio';
  var pesoMultiplos = 0;
  Object.keys(methods).forEach(function(name){ pesoMultiplos += pesosVP[name]; });
  var vpMetodos = {}, vpMultiplos = {}, vpPonderado = {}, chequeo = {};
  Object.keys(methods).forEach(function(name){
    vpMetodos[name] = {};
    scenarios.forEach(function(s){
      var f = fin[s], nominal = [], vp = [];
      for(var n=1;n<=3;n++){
        var total = precioMultiplo(inp, name, methods[name][s], f, n) + cumDiv(f, n);
        nominal.push(total);
        vp.push(valorPresenteMultiplo(total, ke, n));
      }
      vpMetodos[name][s] = {nominal: nominal, vp: vp, consolidado: consolidarHorizontes(vp, criterio)};
    });
  });
  scenarios.forEach(function(s){
    var cons = 0, nominal3 = 0, vp3 = 0;
    Object.keys(methods).forEach(function(name){
      var w = pesoMultiplos ? pesosVP[name]/pesoMultiplos : 0;
      cons += w*vpMetodos[name][s].consolidado;
      nominal3 += w*vpMetodos[name][s].nominal[2];
      vp3 += w*vpMetodos[name][s].vp[2];
    });
    vpMultiplos[s] = cons;
    vpPonderado[s] = dcf[s]*pesosVP.dcf + cons*pesoMultiplos;
    chequeo[s] = {multiplosFY3SinDescontar: nominal3, multiplosVP3: vp3, ok: nominal3 <= 0 || vp3 < nominal3};
  });
  var valorPresente = {
    tasaDescuento: ke, criterio: criterio, pesoDcf: pesosVP.dcf, pesoMultiplos: pesoMultiplos,
    dcf: dcf, metodos: vpMetodos, multiplos: vpMultiplos, ponderado: vpPonderado, chequeo: chequeo
  };

  var pesos = pesosVP;
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
  // El MOS se aplica a una cifra presente. Si no hay historias cuantificadas,
  // se explicita el DCF Base como referencia; nunca se usa el ponderado FY+3.
  var baseMOS = typeof inp.valorEsperado === 'number' && isFinite(inp.valorEsperado) ? inp.valorEsperado : dcf.base;
  var precioConMOS = {base:baseMOS*(1-inp.mos),cons:baseMOS*(1-inp.mos),
    valor:baseMOS*(1-inp.mos),baseValor:baseMOS,
    criterio:typeof inp.valorEsperado === 'number' ? 'valorEsperado' : 'dcfBase'};

  return {precios: precios, pesos: pesos, precioObjetivo: precioObjetivo, cagr: cagr, zonas: zonas, precioConMOS: precioConMOS,
          valorPresente: valorPresente, financials:fin};
}

// Crecimiento implícito (30-sep-2026, criterio Damodaran).
//
// 1) DCF inverso: qué crecimiento anual de ingresos en los años 1-5 (luego
//    converge a la perpetuidad, igual que el DCF) justifica el precio de hoy,
//    con el resto de supuestos del escenario sin cambiar. Se calibra contra el
//    DCF completo sin reescalarlo; gRef sirve para elegir la raíz más próxima
//    si aparecen varias soluciones. Devuelve null si
//    ningún crecimiento entre −20% y 80% alcanza el precio.
function crecimientoImplicitoDCF(inp, margenObjetivo, gRef, dcfHoja, precio){
  if(!(dcfHoja > 0) || !(precio > 0)) return null;
  var local = Object.assign({},inp);
  var margin = inp.dcfFinanciero ? inp.dcfFinanciero.roeBase : margenObjetivo;
  var f = function(g){local.crecimientoAnios=[g,g,g,g,g];return runDCF(local,g,margin,g,inp.marginY1Base)-precio;};
  var best = null, prevG = -0.20, prevF = f(prevG);
  for(var g = -0.195; g <= 0.80001; g += 0.005){
    var fg = f(g);
    if((prevF <= 0 && fg >= 0) || (prevF >= 0 && fg <= 0)){
      var lo = prevG, hi = g, flo = prevF;
      for(var i = 0; i < 60; i++){
        var mid = (lo+hi)/2, fm = f(mid);
        if((flo <= 0 && fm <= 0) || (flo >= 0 && fm >= 0)){ lo = mid; flo = fm; } else { hi = mid; }
      }
      var root = (lo+hi)/2;
      if(best === null || Math.abs(root-gRef) < Math.abs(best-gRef)) best = root;
    }
    prevG = g; prevF = fg;
  }
  return best;
}

// 2) Crecimiento perpetuo que implica un múltiplo de salida en FY+3 con los
//    supuestos del escenario (las mismas fórmulas del múltiplo justificado,
//    despejadas para g):
//    EV/FCFF = (1+g)/(WACC−g)      →  g = (M·WACC − 1)/(M + 1)
//    P/FCFE  = (1+g)/(Ke−g)        →  g = (M·Ke − 1)/(M + 1)
//    P/E     = (1 − g/ROE)(1+g)/(Ke−g)  →  raíz de −g²/ROE + (1 − 1/ROE + M)·g + (1 − M·Ke) = 0
//    EV/EBITDA y P/OCF se pasan a EV/FCFF y P/FCFE con FCFF/EBITDA y FCFE/OCF de FY+3.
//    p = {ke, wacc, roe, fcffEbitda, fcfeOcf}
function crecimientoImplicitoMultiplo(metodo, M, p){
  if(!(M > 0) || !p) return null;
  var gordon = function(mult, r){ return (r > 0) ? (mult*r - 1)/(mult + 1) : null; };
  if(metodo === 'EV/FCFF') return gordon(M, p.wacc);
  if(metodo === 'P/FCFE') return gordon(M, p.ke);
  if(metodo === 'EV/EBITDA') return p.fcffEbitda > 0 ? gordon(M/p.fcffEbitda, p.wacc) : null;
  if(metodo === 'P/OCF') return p.fcfeOcf > 0 ? gordon(M/p.fcfeOcf, p.ke) : null;
  if(metodo === 'P/E'){
    var R = p.roe, ke = p.ke;
    if(!(R > 0) || !(ke > 0)) return null;
    var a = -1/R, b = 1 - 1/R + M, c = 1 - M*ke, disc = b*b - 4*a*c;
    if(disc < 0) return null;
    var r1 = (-b + Math.sqrt(disc))/(2*a), r2 = (-b - Math.sqrt(disc))/(2*a);
    var ok = [r1, r2].filter(function(g){ return g > -0.5 && g < ke; });
    return ok.length ? Math.max.apply(null, ok) : null;
  }
  return null;
}

// Insumos del motor leídos de la hoja de Google del Modelo JMR (30-sep-2026). celda(hoja, 'B12') devuelve
// el valor ya calculado de la celda (número o texto). Con estos insumos calcularModeloJMR reproduce
// 'Valuation output' (DCF), 'Financials Multiples' y las pestañas de cada múltiplo.
function insumosDesdeHoja(celda){
  var IS = 'Input sheet', VO = 'Valuation output', FM = 'Financials Multiples', RV = 'Resumen de Valoración';
  var n = function(h, a){ var v = celda(h, a); if(typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) v = Number(v); return (typeof v === 'number' && isFinite(v)) ? v : null; };
  var si = function(h, a){ var v = String(celda(h, a) == null ? '' : celda(h, a)).trim().toLowerCase(); return v === 'yes' || v === 'sí' || v === 'si'; };
  var z = function(v){ return v == null ? 0 : v; };
  var rf = n(IS, 'B35'), tw = n(VO, 'M14');
  var e4 = n(FM, 'E4'), d4 = n(FM, 'D4'), dRev = (e4 != null && d4 != null) ? e4 - d4 : null;
  var inp = {
    precioActual: n(IS, 'D1') || n(IS, 'B23'),
    tipoEmpresa: celda(RV, 'G3'),
    mos: n(RV, 'G4'),
    revenue0: n(VO, 'B5'), ebit0: n(VO, 'B7'),
    taxEffective: n(VO, 'C8') != null ? n(VO, 'C8') : n(VO, 'B8'), taxMarginal: n(VO, 'M8'),
    shares0: n(VO, 'B34'), cash: n(VO, 'B29'), debt: n(VO, 'B27'),
    nonOperatingAssets: z(n(VO, 'B30')), minorityInterests: z(n(VO, 'B28')),
    optionsValue: z(n(VO, 'B32')), nol0: z(n(VO, 'B12')),
    probFailure: z(n(VO, 'B24')), recoveryPct: z(n(IS, 'B55')),
    failureBookCapital: String(celda(IS, 'B54') || '').trim().toUpperCase() === 'B' ? z(n(IS, 'B15')) + z(n(IS, 'B16')) : null,
    wacc: n(VO, 'C14'), terminalWacc: tw, riskFreeRate: rf, matureMarketERP: (tw != null && rf != null) ? tw - rf : null,
    terminalGrowth: n(VO, 'M4'),
    roicTerminal: si(IS, 'B49') ? z(n(IS, 'B50')) : 0,
    convergenceYear: n(IS, 'B31'),
    salesToCapital: n(VO, 'C40'), salesToCapital2: n(VO, 'H40'),
    reinvestLag: si(IS, 'B57') ? n(IS, 'B58') : 1,
    costoPatrimonio: n('Cost of capital worksheet', 'B63'),
    growthY1Cons: n(VO, 'C55'), growthCons: n(VO, 'D55'), marginY1Cons: n(VO, 'C57'), marginCons: n(VO, 'C45'),
    growthY1Base: n(VO, 'C4'),  growthBase: n(VO, 'D4'),  marginY1Base: n(VO, 'C6'),  marginBase: n(VO, 'C46'),
    growthY1Opt: n(VO, 'C106'), growthOpt: n(VO, 'D106'), marginY1Opt: n(VO, 'C108'), marginOpt: n(VO, 'C47'),
    // Múltiplos ('Financials Multiples', bloque Conservador; las razones históricas son las mismas en los tres).
    revenueFY0: d4,
    interestOtherPctEBIT: z(n(FM, 'E11')),
    daRatiosHist: [n(FM, 'B20') / n(FM, 'B4'), n(FM, 'C20') / n(FM, 'C4'), n(FM, 'D20') / n(FM, 'D4')],
    daPctRevenue: e4 ? z(n(FM, 'E20')) / e4 : 0,
    capexPctRevenue: e4 ? z(n(FM, 'E21')) / e4 : 0,
    nwcPctDeltaRevenue: dRev ? z(n(FM, 'E22')) / dRev : 0,
    netBorrowingPctDeltaRevenue: dRev ? z(n(FM, 'E28')) / dRev : 0,
    sharesMultiplos: n(FM, 'E31'),
    buybackRate: (n(FM, 'E31') && n(FM, 'F31') != null) ? n(FM, 'F31') / n(FM, 'E31') - 1 : 0,
    dividendPerShare: z(n(FM, 'E35')), dividendGrowth: z(n(FM, 'E36')),
    deudaNetaMultiplos: z(n(IS, 'B16')) - z(n(IS, 'B19')) - z(n(IS, 'B20')) + z(n(IS, 'B21')),
    multiplos: {}
  };
  if(celda('DCF FCFE financiero','A1')==='DCF FCFE financiero'){
    inp.dcfFinanciero={netIncome0:n('DCF FCFE financiero','B3'),roeCons:n('DCF FCFE financiero','C5'),
      roeBase:n('DCF FCFE financiero','D5'),roeOpt:n('DCF FCFE financiero','E5'),
      terminalKe:n('DCF FCFE financiero','B4'),terminalGrowth:n('DCF FCFE financiero','B5'),
      baseWacc:n('DCF FCFE financiero','B8'),equityWeight:n('DCF FCFE financiero','B9')};
  }
  if(!inp.daRatiosHist.every(function(x){ return typeof x === 'number' && isFinite(x); })) inp.daRatiosHist = null;
  // Cada escenario tiene su bloque en 'Financials Multiples' (filas 4, 43 y 83) con sus propias razones.
  // Las proyecciones relativas existentes usan márgenes EBIT. El ROE del
  // DCF financiero no debe alterar los ajustes leídos de esos bloques.
  var tmp = calcularTrayectorias(inp.dcfFinanciero ? Object.assign({},inp,{dcfFinanciero:null}) : inp);
  inp.porEscenario = {};
  [['cons', 0], ['base', 39], ['opt', 79]].forEach(function(b){
    var r = function(row){ return row + b[1]; };
    var c = function(col, row){ return n(FM, col + r(row)); };
    var E4 = c('E', 4), D4 = c('D', 4), dR = (E4 != null && D4 != null) ? E4 - D4 : null, g1 = c('E', 5);
    var da = [c('B', 20) / c('B', 4), c('C', 20) / c('C', 4), c('D', 20) / c('D', 4)];
    var t = tmp[b[0]];
    // Variante de algunas hojas: ΔCapital de trabajo = D&A + CapEx + reinversión del DCF (el FCFF de los
    // múltiplos queda igual a EBIT(1−t) − reinversión del DCF).
    var reinvRow = {cons: 61, base: 10, opt: 112}[b[0]], e22 = c('E', 22), e20 = c('E', 20), e21 = c('E', 21), vr = n(VO, 'C' + reinvRow);
    var nwcDcf = e22 != null && e20 != null && e21 != null && vr != null && Math.abs(e22 - (e20 + e21 + vr)) <= 1e-6 * Math.max(1, Math.abs(e22));
    inp.porEscenario[b[0]] = {
      nwcModo: nwcDcf ? 'reinversionDCF' : null,
      revenueFY0: (E4 != null && g1 != null && 1 + g1 !== 0) ? E4 / (1 + g1) : null,
      gAdj: ['E', 'F', 'G'].map(function(col, k){ var v = c(col, 5); return v == null ? 0 : v - t.growth[k+1]; }),
      mAdj: ['E', 'F', 'G'].map(function(col, k){ var v = c(col, 8); return v == null ? 0 : v - t.margin[k+1]; }),
      tAdj: ['E', 'F', 'G'].map(function(col, k){ var v = c(col, 14); return v == null ? 0 : v - t.tax[k+1]; }),
      interestOtherPctEBIT: c('E', 11),
      daRatiosHist: da.every(function(x){ return typeof x === 'number' && isFinite(x); }) ? da : null,
      capexPctRevenue: E4 ? z(c('E', 21)) / E4 : null,
      nwcPctDeltaRevenue: dR ? z(c('E', 22)) / dR : null,
      netBorrowingPctDeltaRevenue: dR ? z(c('E', 28)) / dR : null,
      sharesMultiplos: c('E', 31),
      buybackRate: (c('E', 31) && c('F', 31) != null) ? c('F', 31) / c('E', 31) - 1 : null,
      dividendPerShare: c('E', 35), dividendGrowth: c('E', 36)
    };
  });
  [['evEbitda', 'EVEBITDA'], ['evFcff', 'EVFCFF'], ['pe', 'PE'], ['pfcfe', 'PFCFE'], ['pocf', 'POCF']].forEach(function(p){
    inp.multiplos[p[0]] = {cons: n(p[1], 'F8'), base: n(p[1], 'F19'), opt: n(p[1], 'F30')};
    inp[p[0] + 'Base'] = inp.multiplos[p[0]].base;
  });
  var w = [n(RV, 'B6'), n(RV, 'B7'), n(RV, 'B8'), n(RV, 'B9'), n(RV, 'B10'), n(RV, 'B11')];
  if(w.every(function(x){ return x != null; })) inp.pesos = {dcf: w[0], evEbitda: w[1], evFcff: w[2], pe: w[3], pfcfe: w[4], pocf: w[5]};
  return inp;
}

if(typeof module !== 'undefined') module.exports = {calcularModeloJMR: calcularModeloJMR, JMR_WEIGHTS: JMR_WEIGHTS,
  valorPresenteMultiplo: valorPresenteMultiplo, consolidarHorizontes: consolidarHorizontes,
  crecimientoImplicitoDCF: crecimientoImplicitoDCF, crecimientoImplicitoMultiplo: crecimientoImplicitoMultiplo, runDCF: runDCF,
  runDCFDetalle: runDCFDetalle, insumosDesdeHoja: insumosDesdeHoja};
