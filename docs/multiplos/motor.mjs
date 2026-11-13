// JMR múltiplos · motor de valoración por múltiplos (sin DCF).
// Módulo único para navegador y Node. No lee ni recalcula ningún DCF: el valor de V2/Floyd
// solo puede entrar como referencia informativa (`v2Ref`) y nunca se promedia con este resultado.
// Definiciones de EBITDA, FCFF y NOPAT = JMR_IND de jmr-v2.html (misma convención: changeNWC > 0 es inversión).

export const ESCENARIOS = ['conservador', 'base', 'optimista'];
export const PERCENTIL = { conservador: 0.25, base: 0.5, optimista: 0.75 };
export const FACTORES = [0.8, 0.9, 1, 1.1, 1.2];
export const MOS = 0.35;
export const COBERTURA_MINIMA = 0.8;
export const METODOS_MINIMOS = 2;

export const METODOS = {
  'EV/EBITDA': { tipo: 'EV', metrica: 'EBITDA', clave: 'evEbitda' },
  'EV/FCFF': { tipo: 'EV', metrica: 'FCFF', clave: 'evFcff' },
  'EV/Ventas': { tipo: 'EV', metrica: 'Ventas', clave: 'evVentas' },
  'P/E': { tipo: 'EQ', metrica: 'Utilidad neta', clave: 'pe' },
  'P/FCFE': { tipo: 'EQ', metrica: 'FCFE', clave: 'pFcfe' },
  'P/OCF': { tipo: 'EQ', metrica: 'Flujo operativo', clave: 'pOcf' },
  'P/BV': { tipo: 'EQ', metrica: 'Patrimonio', clave: 'pBv' },
};

// Métodos admitidos por perfil económico (mismos perfiles que V2). Bancos, aseguradoras y holdings no usan EV.
export const PERFILES = {
  operativa: ['EV/EBITDA', 'EV/FCFF', 'P/E', 'P/FCFE', 'P/OCF'],
  'alto-crecimiento': ['EV/Ventas', 'EV/EBITDA', 'EV/FCFF', 'P/OCF', 'P/E'],
  banco: ['P/E', 'P/BV'],
  aseguradora: ['P/E', 'P/BV'],
  holding: ['P/BV', 'P/E'],
};

export const CAMPOS_HISTORIA = ['year', 'revenue', 'cogs', 'ebit', 'interestExpense', 'pretaxIncome', 'taxExpense', 'netIncome',
  'operatingCF', 'capex', 'da', 'changeNWC', 'cash', 'debt', 'equity', 'minority', 'nonoperatingAssets', 'shares', 'sharePrice', 'assets'];

const fin = x => typeof x === 'number' && Number.isFinite(x);
const div = (a, b) => (fin(a) && fin(b) && b !== 0 ? a / b : null);
const nop = h => (fin(h?.nonoperatingAssets) ? h.nonoperatingAssets : fin(h?.nonOperatingAssets) ? h.nonOperatingAssets : 0);

export function percentil(valores, p) {
  const a = valores.filter(v => fin(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const pos = (a.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
}

export function ordenar(history) {
  return Array.isArray(history) ? [...history].sort((a, b) => Number(a.year) - Number(b.year)) : [];
}

/** Métricas de un ejercicio (h) con el ejercicio previo (prior) para el endeudamiento neto. */
export function metricasAnio(h, prior) {
  if (!h) return {};
  const tax = div(h.taxExpense, h.pretaxIncome);
  const nopat = fin(h.ebit) ? (h.ebit > 0 && fin(tax) ? h.ebit * (1 - tax) : h.ebit) : null;
  const reinv = fin(h.capex) && fin(h.da) && fin(h.changeNWC) ? h.capex - h.da + h.changeNWC : null;
  const fcff = fin(nopat) && fin(reinv) ? nopat - reinv : null;
  const deltaDeuda = prior && fin(h.debt) && fin(prior.debt) ? h.debt - prior.debt : null;
  const fcfe = fin(h.netIncome) && fin(reinv) && fin(deltaDeuda) ? h.netIncome - reinv + deltaDeuda : null;
  return {
    ebitda: fin(h.ebit) && fin(h.da) ? h.ebit + h.da : null,
    fcff, fcfe, ventas: fin(h.revenue) ? h.revenue : null, utilidad: fin(h.netIncome) ? h.netIncome : null,
    ocf: fin(h.operatingCF) ? h.operatingCF : null, patrimonio: fin(h.equity) ? h.equity : null,
  };
}
const METRICA_DE = { 'EV/EBITDA': 'ebitda', 'EV/FCFF': 'fcff', 'EV/Ventas': 'ventas', 'P/E': 'utilidad', 'P/FCFE': 'fcfe', 'P/OCF': 'ocf', 'P/BV': 'patrimonio' };

/** Margen, retorno y salud por ejercicio: contexto para justificar prima o descuento frente a la referencia. */
export function indicadores(history) {
  const hs = ordenar(history);
  return hs.map((h, i) => {
    const prior = i ? hs[i - 1] : null, m = metricasAnio(h, prior);
    const invertido = fin(h.debt) && fin(h.equity) && fin(h.cash) ? h.debt + h.equity - h.cash : null;
    const tax = div(h.taxExpense, h.pretaxIncome);
    const nopat = fin(h.ebit) ? (h.ebit > 0 && fin(tax) ? h.ebit * (1 - tax) : h.ebit) : null;
    return {
      year: h.year, crecimiento: prior ? div(fin(h.revenue) && fin(prior.revenue) ? h.revenue - prior.revenue : null, prior.revenue) : null,
      margenBruto: fin(h.cogs) && fin(h.revenue) ? div(h.revenue - h.cogs, h.revenue) : null,
      margenEbitda: div(m.ebitda, h.revenue), margenEbit: div(h.ebit, h.revenue), margenNeto: div(h.netIncome, h.revenue),
      margenFcff: div(m.fcff, h.revenue), roe: div(h.netIncome, h.equity), roic: div(nopat, invertido),
      deudaNetaEbitda: fin(h.debt) && fin(h.cash) ? div(h.debt - h.cash, m.ebitda) : null,
      coberturaIntereses: div(h.ebit, h.interestExpense),
    };
  });
}

function capitalizacion(precio, acciones) { return fin(precio) && fin(acciones) ? precio * acciones : null; }
export function evHistorico(h) {
  const cap = capitalizacion(h.sharePrice, h.shares);
  return cap !== null && fin(h.debt) && fin(h.cash) ? cap + h.debt - h.cash + (fin(h.minority) ? h.minority : 0) - nop(h) : null;
}

/** Múltiplo observado de cada ejercicio con el precio de cierre de ese ejercicio. Solo positivos (N/M en otro caso). */
export function multiplosHistoricos(history) {
  const hs = ordenar(history);
  return hs.map((h, i) => {
    const m = metricasAnio(h, i ? hs[i - 1] : null), ev = evHistorico(h), cap = capitalizacion(h.sharePrice, h.shares);
    const out = { year: h.year };
    for (const [nombre, def] of Object.entries(METODOS)) {
      const base = def.tipo === 'EV' ? ev : cap, den = m[METRICA_DE[nombre]];
      const v = fin(base) && fin(den) && den > 0 && base > 0 ? base / den : null;
      out[nombre] = v;
    }
    return out;
  });
}

export function puenteEV(mkt) {
  // Equity = EV − deuda − preferentes + caja − minoritarias + activos no operativos − opciones.
  const g = k => (fin(mkt?.[k]) ? mkt[k] : 0);
  return g('cash') + g('nonOperatingAssets') - g('debt') - g('minority') - g('preferred') - g('optionsValue');
}

export function valorPorAccion(metodo, multiplo, metrica, mkt) {
  const def = METODOS[metodo];
  if (!def || !fin(multiplo) || !fin(metrica) || metrica <= 0 || !(mkt?.shares > 0)) return null;
  const valorEmpresa = multiplo * metrica;
  const equity = def.tipo === 'EV' ? valorEmpresa + puenteEV(mkt) : valorEmpresa;
  const porAccion = equity / mkt.shares;
  return porAccion > 0 ? porAccion : null;
}

export function multiplosActuales(exp) {
  const hs = ordenar(exp.history), ult = hs[hs.length - 1], prior = hs[hs.length - 2];
  const m = metricasAnio(ult, prior), mk = exp.market || {};
  const cap = capitalizacion(mk.sharePrice, mk.shares);
  const ev = cap !== null ? cap - puenteEV(mk) : null;
  const out = {};
  for (const [nombre, def] of Object.entries(METODOS)) {
    const base = def.tipo === 'EV' ? ev : cap, den = m[METRICA_DE[nombre]];
    out[nombre] = fin(base) && fin(den) && den > 0 && base > 0 ? base / den : null;
  }
  return out;
}

/** Conjunto de referencia = múltiplos propios históricos + comparables. Estadísticos con interpolación inclusiva. */
export function referencias(exp) {
  const hist = multiplosHistoricos(exp.history), pares = Array.isArray(exp.comparables) ? exp.comparables : [];
  const out = {};
  for (const nombre of Object.keys(METODOS)) {
    const clave = METODOS[nombre].clave;
    const propios = hist.map(h => h[nombre]).filter(v => fin(v) && v > 0);
    const externos = pares.map(p => p?.[clave]).filter(v => fin(v) && v > 0);
    const todos = [...propios, ...externos];
    out[nombre] = {
      n: todos.length, nPropios: propios.length, nPares: externos.length,
      min: todos.length ? Math.min(...todos) : null, p25: percentil(todos, 0.25), p50: percentil(todos, 0.5),
      p75: percentil(todos, 0.75), max: todos.length ? Math.max(...todos) : null,
    };
  }
  return out;
}

function metricaBase(exp, metodo) {
  const hs = ordenar(exp.history), ult = hs[hs.length - 1], prior = hs[hs.length - 2];
  const base = { ...metricasAnio(ult, prior) };
  // LTM opcional: sobrescribe la métrica base cuando el usuario/IA documenta un corte trimestral.
  const l = exp.ltm && typeof exp.ltm === 'object' ? exp.ltm.metricas || {} : {};
  const k = METRICA_DE[metodo];
  return fin(l[k]) ? l[k] : base[k];
}

export function calcular(exp) {
  const refs = referencias(exp), mk = exp.market || {};
  const permitidos = PERFILES[exp.profile] || [];
  const pesos = exp.pesos || {};
  const metodos = Object.keys(pesos).filter(m => METODOS[m] && permitidos.includes(m));
  const escenarios = {};
  for (const s of ESCENARIOS) {
    const cfg = exp.escenarios?.[s] || {};
    const g = fin(cfg.crecimientoMetrica) ? cfg.crecimientoMetrica : 0;
    const porMetodo = {};
    let suma = 0, pesoTotal = 0, pesoAplicable = 0, aplicables = 0;
    for (const m of metodos) {
      const w = fin(pesos[m]) && pesos[m] > 0 ? pesos[m] : 0;
      pesoTotal += w;
      const sugerido = refs[m].n >= 3 ? refs[m][{ conservador: 'p25', base: 'p50', optimista: 'p75' }[s]] : null;
      const manual = cfg.multiplos?.[m];
      const usado = fin(manual) && manual > 0 ? manual : sugerido;
      const origen = fin(manual) && manual > 0 ? 'manual' : fin(sugerido) ? 'referencia' : null;
      const metricaBaseValor = metricaBase(exp, m);
      const metrica = fin(metricaBaseValor) ? metricaBaseValor * (1 + g) : null;
      const vpa = valorPorAccion(m, usado, metrica, mk);
      porMetodo[m] = { peso: w, multiplo: usado ?? null, sugerido, origen, metrica, valorPorAccion: vpa };
      if (vpa !== null && w > 0) { suma += vpa * w; pesoAplicable += w; aplicables++; }
    }
    const cobertura = pesoTotal > 0 ? pesoAplicable / pesoTotal : 0;
    const valido = cobertura >= COBERTURA_MINIMA - 1e-12 && aplicables >= METODOS_MINIMOS;
    escenarios[s] = { porMetodo, cobertura, nMetodos: aplicables, ponderado: valido ? suma / pesoAplicable : null };
  }
  const base = escenarios.base.ponderado;
  const precio = mk.sharePrice;
  return {
    referencias: refs, actuales: multiplosActuales(exp), escenarios,
    mos: { porcentaje: MOS, precioMOS: fin(base) ? base * (1 - MOS) : null },
    brecha: fin(base) && fin(precio) && precio > 0 ? base / precio - 1 : null,
    sensibilidad: Object.fromEntries(metodos.map(m => [m, sensibilidad(exp, m, escenarios.base.porMetodo[m])])),
  };
}

/** 5×5: factor del múltiplo (columnas) frente a factor de la métrica (filas), escenario Base, un método a la vez. */
export function sensibilidad(exp, metodo, celdaBase) {
  if (!celdaBase || !fin(celdaBase.multiplo) || !fin(celdaBase.metrica)) return null;
  return FACTORES.map(fm => FACTORES.map(fx => valorPorAccion(metodo, celdaBase.multiplo * fx, celdaBase.metrica * fm, exp.market)));
}

// ----------------------------------------------------------------------------------------------
// Controles. Bloqueo = no hay valor; error = el valor se muestra, pero el expediente no pasa a EN_REVISION.
const reqMkt = ['sharePrice', 'shares', 'debt', 'cash', 'minority'];
export function evaluar(exp) {
  const c = [];
  const add = (id, nivel, ok, msg) => { if (!ok) c.push({ id, nivel, mensaje: msg }); };
  const sol = exp.solicitudExpresa;
  add('M01', 'bloqueo', !!(sol && typeof sol.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sol.fecha) && typeof sol.texto === 'string' && sol.texto.trim().length >= 5),
    'Falta la solicitud expresa del propietario (fecha y texto). JMR múltiplos no se ejecuta por iniciativa de un LLM.');
  const permitidos = PERFILES[exp.profile];
  add('M02', 'bloqueo', !!permitidos, `Perfil «${exp.profile}» no válido.`);
  const hs = ordenar(exp.history);
  const completos = hs.filter(h => ['revenue', 'ebit', 'da', 'netIncome', 'operatingCF', 'capex', 'debt', 'cash', 'equity', 'shares', 'sharePrice'].every(k => fin(h[k])));
  add('M03', 'bloqueo', completos.length >= 3, `Se exigen al menos 3 ejercicios completos; hay ${completos.length}.`);
  const mk = exp.market || {};
  add('M04', 'bloqueo', reqMkt.every(k => fin(mk[k])) && mk.shares > 0 && mk.sharePrice > 0, 'Datos de mercado incompletos (precio, acciones, deuda, caja, minoritarias).');
  add('M04b', 'error', typeof mk.fecha === 'string' && mk.fecha.length >= 8, 'Falta la fecha de corte del precio de mercado.');
  const pesos = exp.pesos || {};
  const ms = Object.keys(pesos);
  const fuera = permitidos ? ms.filter(m => !permitidos.includes(m)) : ms;
  add('M05', 'bloqueo', ms.length >= METODOS_MINIMOS && !fuera.length && Math.abs(ms.reduce((a, m) => a + (fin(pesos[m]) ? pesos[m] : NaN), 0) - 1) < 1e-6,
    fuera.length ? `Métodos no admitidos para el perfil: ${fuera.join(', ')}.` : 'Los pesos deben ser ≥ 2 métodos y sumar 100 %.');
  add('M05b', 'error', typeof exp.justificacionPesos === 'string' && exp.justificacionPesos.trim().length >= 40, 'Los pesos exigen una justificación económica (≥ 40 caracteres).');
  const refs = referencias(exp), res = calcular(exp);
  for (const m of ms.filter(m => METODOS[m] && (permitidos || []).includes(m))) {
    const sinRef = refs[m].n < 3;
    for (const s of ESCENARIOS) {
      const cfg = exp.escenarios?.[s]?.multiplos?.[m];
      if (fin(cfg)) {
        const j = exp.escenarios?.[s]?.justificacion?.[m];
        add('M07', 'error', typeof j === 'string' && j.trim().length >= 20, `${m} · ${s}: múltiplo manual sin justificación.`);
      } else add('M06', 'error', !sinRef, `${m} · ${s}: referencia con menos de 3 observaciones y sin múltiplo manual.`);
    }
    const cs = ESCENARIOS.map(s => res.escenarios[s].porMetodo[m].multiplo);
    if (cs.every(fin)) add('M09', 'error', cs[0] <= cs[1] && cs[1] <= cs[2], `${m}: los múltiplos deben cumplir conservador ≤ base ≤ optimista.`);
    if (!fin(res.escenarios.base.porMetodo[m].valorPorAccion) && pesos[m] > 0)
      add('M10', 'aviso', false, `${m}: N/M en el escenario base (métrica no positiva o patrimonio resultante ≤ 0); su peso se redistribuye.`);
  }
  for (const s of ESCENARIOS) {
    const e = res.escenarios[s];
    add('M08', 'bloqueo', e.ponderado !== null, `Escenario ${s}: sin cobertura suficiente (${(e.cobertura * 100).toFixed(0)} % del peso, ${e.nMetodos} métodos; mínimo 80 % y 2).`);
  }
  const pares = Array.isArray(exp.comparables) ? exp.comparables : [];
  add('M11', 'aviso', pares.length >= 3, 'Menos de 3 comparables: la referencia es casi solo histórica propia.');
  add('M12', 'error', pares.every(p => p && p.ticker && typeof p.fuente === 'string' && p.fuente && typeof p.fecha === 'string' && p.fecha), 'Cada comparable exige ticker, fuente y fecha.');
  if (exp.libro?.valores) {
    const bases = res.escenarios;
    const desv = ESCENARIOS.filter(s => fin(exp.libro.valores[s]) && fin(bases[s].ponderado) && Math.abs(exp.libro.valores[s] / bases[s].ponderado - 1) > 0.005);
    add('M13', 'error', !desv.length, `El libro no concilia con el motor (±0,5 %) en: ${desv.join(', ')}.`);
  } else add('M13', 'aviso', false, 'Sin libro de cálculo conciliado (se publica con el motor del navegador).');
  const bloqueos = c.filter(x => x.nivel === 'bloqueo').length, errores = c.filter(x => x.nivel === 'error').length, avisos = c.filter(x => x.nivel === 'aviso').length;
  const permitido = bloqueos ? 'BLOQUEADO' : errores ? 'EN_PROCESO' : 'EN_REVISION';
  return { controles: c, resumen: { bloqueos, errores, avisos }, permitido };
}

export const FORMATO = { porcentaje: v => (fin(v) ? (v * 100).toFixed(1) + ' %' : 'N/D'), veces: v => (fin(v) ? v.toFixed(2) + '×' : 'N/D'), precio: v => (fin(v) ? v.toFixed(2) : 'N/D') };
