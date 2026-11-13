// JMR V2.0 · controles de datos y estado del expediente.
// Módulo puro (navegador y Node). NO calcula valoraciones: recibe el motor como parámetro
// y solo verifica datos, coherencia económica y reglas de publicación.
// Estados: EN_PROCESO < EN_REVISION < PUBLICADO; BLOQUEADO aparte.
// Gravedad: 'bloqueo' (falta un dato que impide valorar) · 'error' (corregir antes de revisión) ·
// 'aviso' (no impide publicar, queda visible).
export const ESTADOS = ['EN_PROCESO', 'EN_REVISION', 'PUBLICADO', 'BLOQUEADO'];
export const MOS_ESTANDAR = 0.35;
const num = x => typeof x === 'number' && Number.isFinite(x);
const rel = (a, b, tol) => Math.abs(a - b) <= Math.max(tol * Math.max(Math.abs(a), Math.abs(b)), 1e-9);
const FINANCIEROS = ['banco', 'aseguradora'];
const CAMPOS_OPERATIVA = ['revenue', 'debt', 'cash', 'minority', 'nonoperatingAssets', 'shares'];
const CAMPOS_FINANCIERA = ['netIncome', 'bookEquity', 'bookEquityPrior', 'dividends', 'shares'];
const CAMPOS_ALTO = ['revenue0', 'ebit0', 'nol', 'cash', 'nonOperatingAssets', 'marketDebt', 'shares'];
const CONDICIONES_ALTO = ['perdidas-operativas', 'margenes-negativos-transicion', 'crecimiento-extraordinario', 'reinversion-elevada', 'cambio-eficiencia-capital', 'mercado-participacion'];
const CAMPOS_HOLDING = ['shares', 'cash', 'minority', 'debt', 'corporateExpenses'];
const SECCIONES_ANALISIS = ['business', 'moat', 'story', 'risks', 'conclusion'];
const AUTORES_NO_VALIDOS = /^(claude|ia|ai|gpt|gemini|chatgpt|modelo|bot)\b/i;

export function controlesDatos(m) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'datos', gravedad, msg }); };
  const h = Array.isArray(m.history) ? m.history : [];
  add('D01', 'bloqueo', h.length >= 3, `Históricos insuficientes (${h.length}); mínimo 3 ejercicios para valorar.`);
  add('D02', 'aviso', h.length >= 10, `Solo ${h.length} de 10 ejercicios históricos; documentar por qué no hay más.`);
  const años = h.map(x => x.year);
  add('D03', 'error', años.every(Number.isInteger) && new Set(años).size === años.length, 'Años históricos duplicados o no enteros.');
  const ord = [...años].sort((a, b) => a - b);
  add('D04', 'error', ord.every((y, i) => i === 0 || y === ord[i - 1] + 1), 'Los ejercicios históricos no son consecutivos (faltan años).');
  add('D05', 'bloqueo', !!m.currency && !!m.units, 'Falta moneda o unidades del expediente.');
  for (const x of h) {
    if ([x.assets, x.liabilities, x.equity].every(num))
      add('D06', 'error', rel(x.assets, x.liabilities + x.equity, 0.005), `${x.year}: activos ≠ pasivos + patrimonio (tolerancia 0,5 %).`);
    // La utilidad antes de impuestos también incorpora partidas no operativas.
    // Si se dispone del total neto no operativo (incluido interés neto), usarlo
    // para no denunciar falsos descuadres en compañías con rendimientos financieros.
    if ([x.ebit, x.pretaxIncome].every(num) && (num(x.totalNonOperatingIncome) || num(x.interestExpense))) {
      const esperado = num(x.totalNonOperatingIncome) ? x.ebit + x.totalNonOperatingIncome : x.ebit - x.interestExpense;
      add('D07', 'error', rel(x.pretaxIncome, esperado, 0.005), `${x.year}: utilidad antes de impuestos no concilia con EBIT y partidas no operativas.`);
    }
    if ([x.pretaxIncome, x.taxExpense, x.netIncome].every(num))
      add('D08', 'error', rel(x.netIncome, x.pretaxIncome - x.taxExpense, 0.005), `${x.year}: utilidad neta ≠ utilidad antes de impuestos − impuestos.`);
    if (num(x.revenue) && num(x.cogs)) add('D09', 'error', x.cogs >= 0 && x.cogs <= x.revenue * 1.0001, `${x.year}: costo de ventas inválido.`);
  }
  const last = ord.length ? h.find(x => x.year === ord[ord.length - 1]) : null, f = m.financials || {};
  const financiero = FINANCIEROS.includes(m.profile), holding = m.profile === 'holding', alto = m.profile === 'alto-crecimiento', CAMPOS_MATERIALES = alto ? CAMPOS_ALTO : holding ? CAMPOS_HOLDING : financiero ? CAMPOS_FINANCIERA : CAMPOS_OPERATIVA;
  const prov = Array.isArray(m.provenance) ? m.provenance : [];
  if (last && alto) {
    for (const [k, v] of [['revenue0', last.revenue], ['ebit0', last.ebit], ['cash', last.cash], ['shares', last.shares]]) if (num(f[k]) && num(v)) add('D10', 'error', rel(f[k], v, 0.001), `Base de valoración (${k}=${f[k]}) no coincide con el último histórico (${v}).`);
    for (const k of CAMPOS_ALTO) add('D13', 'bloqueo', num(f[k]), `Falta dato financiero base: financials.${k}.`);
  }
  if (last && !financiero && !holding && !alto) for (const k of CAMPOS_OPERATIVA)
    if (num(f[k]) && num(last[k])) add('D10', 'error', rel(f[k], last[k], 0.001), `Base de valoración (${k}=${f[k]}) no coincide con el último histórico ${last.year} (${last[k]}).`);
  if (last && holding) {
    for (const k of ['shares', 'cash', 'minority']) if (num(f[k]) && num(last[k])) add('D10', 'error', rel(f[k], last[k], 0.001), `Base de valoración (${k}=${f[k]}) no coincide con el último histórico (${last[k]}).`);
    for (const k of CAMPOS_HOLDING) add('D13', 'bloqueo', num(f[k]), `Falta dato financiero base: financials.${k}.`);
    for (const sg of m.segmentos || []) {
      const p = prov.find(p => p.destino === `segmentos.${sg.id}.revenue`);
      add('D11', 'error', !!p && p.documento && p.periodo != null && (p.pagina != null || p.nota != null) && p.moneda && p.unidades && num(p.valorReportado) && rel(sg.revenue ?? p.valorReportado, p.valorReportado, 0.0001),
        `Falta trazabilidad completa de ingresos del negocio ${sg.id} (segmentos.${sg.id}.revenue) o no coincide con el valor reportado.`);
    }
  }
  if (last && financiero) {
    const prev = h.find(x => x.year === last.year - 1), par = [['netIncome', last.netIncome], ['bookEquity', last.equity], ['dividends', last.dividends], ['shares', last.shares], ['bookEquityPrior', prev?.equity]];
    for (const [k, v] of par) if (num(f[k]) && num(v)) add('D10', 'error', rel(f[k], v, 0.001), `Base de valoración (${k}=${f[k]}) no coincide con el histórico (${v}).`);
    for (const k of CAMPOS_FINANCIERA) add('D13', 'bloqueo', num(f[k]), `Falta dato financiero base: financials.${k}.`);
  }
  for (const k of CAMPOS_MATERIALES) {
    const p = prov.find(p => p.destino === `financials.${k}`);
    add('D11', 'error', !!p && p.documento && p.periodo != null && (p.pagina != null || p.nota != null) && p.moneda && p.unidades && num(p.valorReportado),
      `Falta trazabilidad completa (documento, período, página/nota, moneda, unidades, valor) para financials.${k}.`);
    if (p && num(p.valorReportado) && num(f[k]) && num(p.ajuste ?? 0))
      add('D12', 'error', rel(f[k], p.valorReportado + (p.ajuste ?? 0), 0.0001), `financials.${k} ≠ valor reportado + ajuste documentado.`);
  }
  return r;
}

export function controlesValoracion(m, engine) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'valoracion', gravedad, msg }); };
  const soporta = engine.soporta ? engine.soporta(m.profile) : m.profile === 'operativa';
  add('V01', 'bloqueo', soporta, `Perfil «${m.profile}»: sin motor implementado en este despliegue.`);
  if (!soporta) return r;
  const financiero = FINANCIEROS.includes(m.profile), holding = m.profile === 'holding', alto = m.profile === 'alto-crecimiento';
  if (alto) r.push(...controlesAlto(m));
  if (financiero) r.push(...controlesFinancieros(m));
  if (holding) r.push(...controlesHolding(m));
  if (r.some(x => x.gravedad === 'bloqueo')) return r;
  const calc = engine.calculateAll(m), s = calc.scenarios || {};
  for (const n of engine.SCENARIOS) add('V02', 'bloqueo', ['CANDIDATO', 'REVISAR'].includes(s[n]?.status),
    `Escenario ${n}: ${s[n]?.status || 'sin resultado'} ${(s[n]?.issues || []).join('; ')}`.trim());
  if (r.some(x => x.id === 'V02')) return r;
  for (const n of engine.SCENARIOS) for (const w of s[n].warnings || []) add('V03', 'error', false, `Escenario ${n}: ${w}`);
  add('V04', 'error', s.conservador.perShare <= s.base.perShare && s.base.perShare <= s.optimista.perShare, 'Los valores no respetan conservador ≤ base ≤ optimista.');
  const a = m.assumptions;
  add('V05', 'error', engine.SCENARIOS.every(n => a[n].mos === MOS_ESTANDAR), `El MOS debe ser ${MOS_ESTANDAR * 100} % en los tres escenarios.`);
  add('V06', 'error', rel(s.base.mosPrice, s.base.perShare * (1 - MOS_ESTANDAR), 1e-9), 'Precio con MOS ≠ valor base × 0,65.');
  if (alto) {
    const tasa = n => JSON.stringify(['beta', 'riskFree', 'erp', 'costOfDebt', 'stableGrowth', 'stableDebtRatio', 'stableBeta', 'stableCostOfDebt', 'stableRoc', 'speed'].map(k => a[n][k]));
    add('V07', 'error', engine.SCENARIOS.every(n => tasa(n) === tasa('base')) || !!(m.justificaciones && m.justificaciones.tasas), 'Costo de capital, convergencia o supuestos estables difieren entre escenarios sin justificación (justificaciones.tasas).');
    const medio = n => { const g = a[n].growth || [a[n].cagr]; return g.reduce((p, x) => p * (1 + x), 1) ** (1 / g.length) - 1; };
    add('V08', 'error', medio('conservador') <= medio('base') && medio('base') <= medio('optimista'), 'El crecimiento medio no está ordenado entre escenarios.');
    for (const n of engine.SCENARIOS) {
      add('V09', 'error', a[n].stableGrowth < s[n].waccTerminal, `${n}: crecimiento estable ≥ costo de capital terminal.`);
      const y = s[n].years; add('V11', 'error', y.every(x => x.growth <= 0 || x.reinvestment > 0), `${n}: crecimiento de ingresos sin reinversión.`);
    }
    const mk = m.mercado;
    if (mk) {
      const cap10 = mk.marketSize * (1 + mk.marketGrowth) ** 10 * mk.share10;
      add('A05', 'error', s.base.years[9].revenue <= cap10 * 1.25, `Ingresos del año 10 (${s.base.years[9].revenue.toFixed(0)}) superan en más de 25 % los implícitos por tamaño de mercado × participación (${cap10.toFixed(0)}).`);
    }
    return r;
  }
  if (holding) {
    const tasa = n => `${a[n].riskFree}|${a[n].taxRate ?? ''}`;
    add('V07', 'error', engine.SCENARIOS.every(n => tasa(n) === tasa('base')) || !!(m.justificaciones && m.justificaciones.tasas), 'Tasa libre de riesgo o impuestos difieren entre escenarios sin justificación (justificaciones.tasas).');
    const k = n => JSON.stringify(m.segmentos.map(sg => sg.escenarios?.[n]?.costOfCapital ?? sg.costOfCapital ?? null));
    add('V08', 'error', engine.SCENARIOS.every(n => k(n) === k('base')) || !!(m.justificaciones && m.justificaciones.costoCapital), 'El costo de capital de los negocios difiere entre escenarios sin justificación (justificaciones.costoCapital).');
    return r;
  }
  if (financiero) {
    const tasa = n => `${a[n].beta}|${a[n].riskFree}|${a[n].erp}|${a[n].stableBeta ?? ''}`;
    add('V07', 'error', engine.SCENARIOS.every(n => tasa(n) === tasa('base')) || !!(m.justificaciones && m.justificaciones.ke),
      'El costo del patrimonio difiere entre escenarios sin justificación económica (justificaciones.ke).');
    add('V08', 'error', a.conservador.roeHighGrowth <= a.base.roeHighGrowth && a.base.roeHighGrowth <= a.optimista.roeHighGrowth, 'ROE de alto crecimiento no ordenado entre escenarios.');
    for (const n of engine.SCENARIOS) {
      const g = m.metodo === 'ddm' ? (a[n].overrideStableGrowth ? a[n].stableGrowth : a[n].riskFree) : a[n].stableGrowth;
      add('V09', 'error', g < s[n].costOfEquityStable, `${n}: crecimiento estable ≥ costo del patrimonio estable.`);
    }
    return r;
  }
  const wacc = n => `${a[n].waccInitial}|${a[n].waccTerminal}`;
  add('V07', 'error', engine.SCENARIOS.every(n => wacc(n) === wacc('base')) || !!(m.justificaciones && m.justificaciones.wacc),
    'El WACC difiere entre escenarios sin justificación económica (justificaciones.wacc).');
  add('V08', 'error', a.conservador.growth2to5 <= a.base.growth2to5 && a.base.growth2to5 <= a.optimista.growth2to5, 'Crecimiento no ordenado entre escenarios.');
  for (const n of engine.SCENARIOS) {
    const y = s[n].years, y10 = y[9], roic = a[n].roicTerminal;
    add('V09', 'error', a[n].gTerminal < a[n].waccTerminal, `${n}: crecimiento terminal ≥ WACC terminal.`);
    add('V10', 'error', roic <= a[n].waccTerminal + 0.10, `${n}: ROIC terminal supera el WACC en más de 10 pp; justificar ventaja competitiva permanente.`);
    // Más crecimiento debe exigir reinversión: el crecimiento sin reinversión es incoherente.
    add('V11', 'error', y.slice(0, 9).every(x => x.growth <= 0 || x.reinvestment > 0 || x.ebit <= 0), `${n}: crecimiento positivo sin reinversión.`);
    add('V12', 'error', y10.revenue > 0, `${n}: ingresos no positivos al año 10.`);
  }
  return r;
}

/** Alto crecimiento: solo cuando Simple Ginsu no basta, con condición declarada, justificada y margen estable con respaldo. */
function controlesAlto(m) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'valoracion', gravedad, msg }); };
  const c = Array.isArray(m.condicionesAltoCrecimiento) ? m.condicionesAltoCrecimiento : [];
  add('A01', 'error', c.length > 0 && c.every(x => CONDICIONES_ALTO.includes(x)), `Declarar al menos una condición que justifique el motor de alto crecimiento (${CONDICIONES_ALTO.join(', ')}).`);
  add('A02', 'error', String(m.justificaciones?.altoCrecimiento || '').trim().length >= 40, 'Falta justificar por qué Simple Ginsu no es suficiente (justificaciones.altoCrecimiento); se prefiere Simple Ginsu cuando basta.');
  const margenes = (m.history || []).filter(x => num(x.ebit) && num(x.revenue) && x.revenue > 0).map(x => x.ebit / x.revenue), pos = margenes.filter(x => x > 0);
  for (const n of ['conservador', 'base', 'optimista']) {
    const ms = m.assumptions?.[n]?.stableMargin; if (!num(ms)) continue;
    const ok = pos.length ? ms <= Math.max(...pos) * 1.5 : String(m.justificaciones?.margenEstable || '').trim().length >= 40;
    add('A04', 'error', ok, `${n}: margen operativo estable (${(ms * 100).toFixed(1)} %) sin respaldo: supera en más de 50 % el mejor margen histórico${pos.length ? ` (${(Math.max(...pos) * 100).toFixed(1)} %)` : ' o no hay margen positivo y falta justificaciones.margenEstable'}.`);
  }
  return r;
}

/** Holdings: cada negocio con su perfil, participaciones, reconciliación de ingresos y sin doble contabilización. */
function controlesHolding(m) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'valoracion', gravedad, msg }); };
  const sg = Array.isArray(m.segmentos) ? m.segmentos : [];
  add('H01', 'bloqueo', sg.length >= 2 && sg.every(x => x.id && x.nombre && ['operativa', 'banco', 'aseguradora', 'otro'].includes(x.perfil)) && new Set(sg.map(x => x.id)).size === sg.length,
    'Cada negocio o participación requiere id único, nombre y perfil económico (operativa | banco | aseguradora | otro); mínimo dos.');
  add('H02', 'bloqueo', sg.every(x => x.perfil === 'operativa' || !!x.valorExterno), 'Un negocio no operativo (banco, aseguradora, otro) no se valora con la fórmula industrial: requiere valorExterno obtenido con su propio motor.');
  for (const x of sg.filter(x => x.valorExterno)) {
    add('H06', 'error', !!(x.valorExterno.fuente && x.valorExterno.fecha && x.valorExterno.motorOrigen), `${x.id}: el valor externo requiere fuente, fecha y motor de origen.`);
    if (x.perfil === 'banco' || x.perfil === 'aseguradora') add('H11', 'error', !!x.valorExterno.refExpediente, `${x.id}: el negocio financiero debe referenciar su propio expediente (refExpediente) para heredar sus controles regulatorios.`);
  }
  add('H12', 'aviso', !(sg.some(x => x.valorExterno) && (m.financials?.corporateExpenses || 0) > 0), 'Los gastos corporativos se asignan solo a negocios valorados por fórmula: verificar que los valores externos no los omiten ni duplican.');
  const rev = (m.history || []).slice().sort((a, b) => a.year - b.year).at(-1)?.revenue;
  if (num(rev) && sg.every(x => num(x.revenue))) {
    const suma = sg.reduce((s, x) => s + x.revenue, 0) + (num(m.financials?.eliminaciones) ? m.financials.eliminaciones : 0);
    add('H04', 'error', rel(suma, rev, 0.01), `Los ingresos por negocio (${suma}) no concilian con el consolidado (${rev}) ±1 %; declarar eliminaciones intragrupo en financials.eliminaciones.`);
  }
  const compartidos = sg.filter(x => num(x.share));
  if (compartidos.length === sg.filter(x => !x.valorExterno).length && compartidos.length) add('H05', 'error', Math.abs(compartidos.reduce((s, x) => s + x.share, 0) - 1) < 0.001, 'Las claves de asignación de gastos corporativos no suman 100 %.');
  if (sg.some(x => (x.ownership ?? 1) < 1) && (m.financials?.minority || 0) > 0)
    add('H08', 'error', String(m.justificaciones?.minoritarios || '').trim().length >= 40, 'Participaciones parciales y minoritarios restados a la vez: justificar que no se descuenta dos veces el mismo interés (justificaciones.minoritarios).');
  for (const n of ['conservador', 'base', 'optimista']) { const d = m.assumptions?.[n]?.holdingDiscount; if (d && d.porcentaje) add('H07', 'error', d.porcentaje <= 0.3 && String(d.justificacion || '').trim().length >= 40, `${n}: descuento de holding sin justificación económica o superior a 30 %.`); }
  return r;
}

/** Bancos y aseguradoras: método justificado, datos regulatorios y ROE con respaldo histórico. Sin datos regulatorios no hay valoración. */
function controlesFinancieros(m) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'valoracion', gravedad, msg }); };
  add('F01', 'bloqueo', ['ddm', 'exceso'].includes(m.metodo), 'Método de valoración no declarado (metodo: «ddm» o «exceso»).');
  add('F02', 'error', !!(m.justificaciones && String(m.justificaciones.metodo || '').trim().length >= 40),
    'Falta justificación de la elección del método (calidad de datos de reparto frente a retorno excedente).');
  const g = m.regulatorio || {}, banco = m.profile === 'banco';
  const [campo, minimo, nombre] = banco ? ['cet1', 'cet1Minimo', 'CET1'] : ['solvencyRatio', 'solvencyMinimo', 'ratio de solvencia'];
  add('F03', 'bloqueo', num(g[campo]) && num(g[minimo]) && !!g.fecha && !!g.fuente,
    `Faltan datos regulatorios indispensables (${nombre}, mínimo exigido, fecha y fuente): sin ellos no se genera valoración.`);
  if (num(g[campo]) && num(g[minimo])) add('F04', 'error', g[campo] >= g[minimo], `${nombre} (${g[campo]}) por debajo del mínimo exigido (${g[minimo]}): el reparto de dividendos del modelo no es sostenible.`);
  const roes = (m.history || []).filter(x => num(x.netIncome) && num(x.equity) && x.equity > 0).map(x => x.netIncome / x.equity);
  if (roes.length >= 3 && m.assumptions) for (const n of ['conservador', 'base', 'optimista']) {
    const a = m.assumptions[n]; if (!a || !num(a.roeHighGrowth)) continue;
    add('F05', 'error', a.roeHighGrowth <= Math.max(...roes) * 1.3, `${n}: ROE de alto crecimiento (${(a.roeHighGrowth * 100).toFixed(1)} %) supera en más de 30 % el máximo histórico (${(Math.max(...roes) * 100).toFixed(1)} %).`);
  }
  return r;
}

export function controlesPublicacion(m) {
  const r = [], add = (id, gravedad, ok, msg) => { if (!ok) r.push({ id, grupo: 'publicacion', gravedad, msg }); };
  add('P01', 'error', !m.fictional, 'Expediente ficticio: nunca publicable.');
  const au = m.auditoria || {};
  add('P02', 'error', !!(au.aprobadaPor && au.fecha && au.evidencia), 'Falta auditoría independiente con responsable, fecha y evidencia.');
  add('P03', 'error', !(au.aprobadaPor && AUTORES_NO_VALIDOS.test(String(au.aprobadaPor))), 'La auditoría no puede ser autocertificada por la IA que construyó el expediente.');
  const an = m.analysis || {};
  add('P04', 'error', SECCIONES_ANALISIS.every(k => typeof an[k] === 'string' && an[k].trim().length >= 40), 'Análisis fundamental incompleto (secciones vacías o triviales).');
  const src = Array.isArray(m.sources) ? m.sources : [];
  add('P05', 'error', src.length > 0 && src.every(s => s.documento || s.url), 'Fuentes primarias no documentadas.');
  add('P06', 'error', m.libro && m.libro.id && m.libro.sha256, 'Falta referencia al libro oficial (id y huella sha256): el JSON no es un motor independiente.');
  return r;
}

/** Devuelve el estado máximo permitido y los controles. El estado declarado nunca puede superarlo. */
export function evaluarExpediente(m, engine) {
  const controles = [...controlesDatos(m), ...controlesValoracion(m, engine), ...controlesPublicacion(m)];
  const n = g => controles.filter(c => c.gravedad === g).length;
  const permitido = n('bloqueo') ? 'BLOQUEADO' : n('error') ? (controles.some(c => c.grupo !== 'publicacion' && c.gravedad === 'error') ? 'EN_PROCESO' : 'EN_REVISION') : 'PUBLICADO';
  const declarado = m.estado || 'EN_PROCESO';
  const orden = { EN_PROCESO: 0, EN_REVISION: 1, PUBLICADO: 2 };
  const violacion = !ESTADOS.includes(declarado) ? `Estado «${declarado}» no reconocido.`
    : declarado === 'BLOQUEADO' ? null
    : permitido === 'BLOQUEADO' ? `Declarado ${declarado} pero hay bloqueos activos.`
    : orden[declarado] > orden[permitido] ? `Declarado ${declarado} pero los controles solo permiten ${permitido}.` : null;
  return { permitido, declarado, violacion, publicable: !violacion && declarado === 'PUBLICADO' && permitido === 'PUBLICADO',
    resumen: { bloqueos: n('bloqueo'), errores: n('error'), avisos: n('aviso') }, controles };
}
