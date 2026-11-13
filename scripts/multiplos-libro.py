#!/usr/bin/env python3
"""JMR múltiplos · plantilla de libro de cálculo (sin DCF).

  build  <salida.xlsx>                 plantilla en blanco (solo celdas de entrada vacías; todo lo demás son fórmulas)
  llenar <expediente.json> <salida>    copia de la plantilla rellenada con un expediente (entradas únicamente)
  verify <expediente.json>             llena, recalcula con LibreOffice y vuelca los resultados en JSON

Reglas: la IA o el usuario solo escriben celdas azules (Estados, Comparables, Escenarios, Valoración!D); las salidas son fórmulas.
Las definiciones coinciden con docs/multiplos/motor.mjs; tests/jmr-multiplos-libro.test.mjs exige la conciliación (±0,5 %).
"""
import json, os, shutil, subprocess, sys, tempfile
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

METODOS = ['EV/EBITDA', 'EV/FCFF', 'EV/Ventas', 'P/E', 'P/FCFE', 'P/OCF', 'P/BV']
TIPO = {'EV/EBITDA': 'EV', 'EV/FCFF': 'EV', 'EV/Ventas': 'EV', 'P/E': 'EQ', 'P/FCFE': 'EQ', 'P/OCF': 'EQ', 'P/BV': 'EQ'}
CLAVE = {'EV/EBITDA': 'evEbitda', 'EV/FCFF': 'evFcff', 'EV/Ventas': 'evVentas', 'P/E': 'pe', 'P/FCFE': 'pFcfe', 'P/OCF': 'pOcf', 'P/BV': 'pBv'}
PERFILES = {
    'operativa': ['EV/EBITDA', 'EV/FCFF', 'P/E', 'P/FCFE', 'P/OCF'],
    'alto-crecimiento': ['EV/Ventas', 'EV/EBITDA', 'EV/FCFF', 'P/OCF', 'P/E'],
    'banco': ['P/E', 'P/BV'], 'aseguradora': ['P/E', 'P/BV'], 'holding': ['P/BV', 'P/E'],
}
ESC = ['conservador', 'base', 'optimista']
NA = 10  # ejercicios admitidos
# fila de Estados por campo
CAMPOS = ['year', 'revenue', 'cogs', 'ebit', 'interestExpense', 'pretaxIncome', 'taxExpense', 'netIncome', 'operatingCF', 'capex', 'da',
          'changeNWC', 'cash', 'debt', 'equity', 'minority', 'nonoperatingAssets', 'shares', 'sharePrice', 'assets']
ETIQ = {'year': 'Ejercicio', 'revenue': 'Ingresos', 'cogs': 'Costo de ventas', 'ebit': 'EBIT (resultado operativo)', 'interestExpense': 'Gasto por intereses',
        'pretaxIncome': 'Resultado antes de impuestos', 'taxExpense': 'Impuesto de renta', 'netIncome': 'Utilidad neta (accionistas)',
        'operatingCF': 'Flujo de caja operativo', 'capex': 'Capex', 'da': 'Depreciación y amortización',
        'changeNWC': 'Variación del capital de trabajo (+ = inversión)', 'cash': 'Caja e inversiones corrientes', 'debt': 'Deuda financiera',
        'equity': 'Patrimonio común', 'minority': 'Participaciones minoritarias', 'nonoperatingAssets': 'Activos no operativos', 'shares': 'Acciones (millones)',
        'sharePrice': 'Precio de cierre del ejercicio', 'assets': 'Activos totales'}
FE = {c: 4 + i for i, c in enumerate(CAMPOS)}            # Estados: year en fila 4
MERC = ['fecha', 'sharePrice', 'shares', 'debt', 'cash', 'minority', 'nonOperatingAssets', 'optionsValue', 'preferred']
MERC_ETIQ = ['Fecha de corte del precio', 'Precio actual', 'Acciones diluidas (millones)', 'Deuda financiera', 'Caja e inversiones', 'Participaciones minoritarias',
             'Activos no operativos', 'Valor de opciones (reclamo)', 'Acciones preferentes']
FM = {c: 27 + i for i, c in enumerate(MERC)}              # bloque de mercado
FID = {'ticker': 38, 'company': 39, 'profile': 40, 'currency': 41, 'units': 42, 'asOf': 43}
COLS = [L(2 + i) for i in range(NA)]                      # B..K

AZUL = Font(color='1F4FBF'); NEG = Font(bold=True); BLANCO = Font(bold=True, color='FFFFFF')
TITULO = PatternFill('solid', fgColor='173850'); SUAVE = PatternFill('solid', fgColor='E8F0F2'); ENTRADA = PatternFill('solid', fgColor='FFF9E5')
BORDE = Border(bottom=Side(style='thin', color='BBBBBB'))


def cab(ws, fila, textos, col0=1):
    for i, t in enumerate(textos):
        c = ws.cell(fila, col0 + i, t); c.font = BLANCO; c.fill = TITULO; c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)


def entrada(c):
    c.font = AZUL; c.fill = ENTRADA


def est(campo, col): return f"Estados!{col}{FE[campo]}"
def mk(campo): return f"Estados!$B${FM[campo]}"


def construir():
    wb = Workbook()
    # ------------------------------------------------------------------ Guía
    g = wb.active; g.title = 'Guía'
    filas = [
        ('JMR múltiplos · plantilla de valoración por múltiplos (sin DCF)', NEG),
        ('Complemento a la valoración principal V2. Se elabora SOLO cuando el propietario lo solicita expresamente y se registra en la aplicación JMR múltiplos.', None),
        ('', None),
        ('Colores: texto azul sobre fondo crema = entrada (única zona editable). Todo lo demás son fórmulas; no se sobrescriben.', None),
        ('Flujo: Estados (históricos y mercado) → Indicadores → Comparables → Referencias → Escenarios (pesos, múltiplos, justificaciones) → Valoración.', None),
        ('Múltiplos sugeridos: conservador = percentil 25, base = mediana, optimista = percentil 75 de [múltiplos propios históricos + comparables] (mín. 3 observaciones).', None),
        ('Un múltiplo manual exige justificación. Métrica negativa o equity ≤ 0 → N/M y el peso se redistribuye entre los métodos aplicables.', None),
        ('Valor ponderado válido si el peso aplicable es ≥ 80 % del total y hay ≥ 2 métodos. No se promedia con el DCF de V2: la referencia V2 es informativa.', None),
        ('MOS 35 % sobre el escenario Base, igual que V2. Estado final lo decide el motor/expediente; el libro no certifica ni audita.', None),
        ('Celdas N/D: dato faltante que debe investigarse. N/M: múltiplo sin significado económico. No usar 0 por omisión.', None),
    ]
    for i, (t, f) in enumerate(filas, 1):
        c = g.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical='top')
        if f: c.font = Font(bold=True, size=13)
    g.column_dimensions['A'].width = 130
    # ------------------------------------------------------------------ Perfiles
    p = wb.create_sheet('Perfiles')
    cab(p, 1, ['Perfil', 'Métodos admitidos (separados por |)'])
    for i, (k, v) in enumerate(PERFILES.items(), 2):
        p.cell(i, 1, k); p.cell(i, 2, '|' + '|'.join(v) + '|')
    p.column_dimensions['A'].width = 20; p.column_dimensions['B'].width = 60
    # ------------------------------------------------------------------ Estados
    e = wb.create_sheet('Estados')
    e['A1'] = 'Estados financieros históricos (entradas) y datos de mercado'; e['A1'].font = Font(bold=True, size=13)
    e['A2'] = 'Un ejercicio por columna, en orden cronológico; unidades uniformes. Dejar vacío lo que no exista (no usar 0).'
    cab(e, 3, ['Concepto'] + [f'Ej. {i + 1}' for i in range(NA)])
    for campo in CAMPOS:
        r = FE[campo]; e.cell(r, 1, ETIQ[campo])
        for col in COLS: entrada(e[f'{col}{r}'])
    e['A25'] = 'Mercado actual (para el puente de valor y los múltiplos actuales)'; e['A25'].font = NEG
    for campo, et in zip(MERC, MERC_ETIQ):
        e.cell(FM[campo], 1, et); entrada(e.cell(FM[campo], 2))
    e['A36'] = 'Identidad'; e['A36'].font = NEG
    for k, et in zip(FID, ['Ticker', 'Empresa', 'Perfil económico', 'Moneda', 'Unidades', 'Fecha de corte']):
        e.cell(FID[k], 1, et); entrada(e.cell(FID[k], 2))
    dv = DataValidation(type='list', formula1='"' + ','.join(PERFILES) + '"', allow_blank=True); e.add_data_validation(dv); dv.add(e.cell(FID['profile'], 2))
    e.column_dimensions['A'].width = 52
    for col in COLS: e.column_dimensions[col].width = 13
    e.freeze_panes = 'B4'
    # ------------------------------------------------------------------ Indicadores
    n = wb.create_sheet('Indicadores')
    n['A1'] = 'Indicadores y múltiplos propios por ejercicio (todo fórmulas)'; n['A1'].font = Font(bold=True, size=13)
    cab(n, 3, ['Concepto'] + [f'Ej. {i + 1}' for i in range(NA)])
    filas_n = ['Ejercicio', 'EBITDA', 'Tasa efectiva', 'NOPAT', 'Reinversión (capex − D&A + ΔNWC)', 'FCFF', 'Δ deuda', 'FCFE', 'Capitalización de mercado', 'EV histórico']
    for i, t in enumerate(filas_n): n.cell(4 + i, 1, t)       # filas 4..13
    RN = {'year': 4, 'ebitda': 5, 'tax': 6, 'nopat': 7, 'reinv': 8, 'fcff': 9, 'ddeuda': 10, 'fcfe': 11, 'cap': 12, 'ev': 13}
    n.cell(15, 1, 'Múltiplos propios (N/M = vacío)').font = NEG
    RM = {m: 16 + i for i, m in enumerate(METODOS)}           # 16..22
    for m in METODOS: n.cell(RM[m], 1, m)
    n.cell(24, 1, 'Márgenes, retornos y salud').font = NEG
    RI = {k: 25 + i for i, k in enumerate(['crec', 'mbruto', 'mebitda', 'mebit', 'mneto', 'mfcff', 'roe', 'roic', 'dnebitda', 'cobint'])}
    for k, t in zip(RI, ['Crecimiento de ingresos', 'Margen bruto', 'Margen EBITDA', 'Margen EBIT', 'Margen neto', 'Margen FCFF', 'ROE', 'ROIC', 'Deuda neta / EBITDA', 'Cobertura de intereses']):
        n.cell(RI[k], 1, t)
    isn = lambda *a: 'AND(' + ','.join(f'ISNUMBER({x})' for x in a) + ')'
    for i, col in enumerate(COLS):
        prev = COLS[i - 1] if i else None
        E = lambda c: est(c, col)
        F = {}
        F[RN['year']] = f'=IF({E("year")}="","",{E("year")})'
        F[RN['ebitda']] = f'=IF({isn(E("ebit"), E("da"))},{E("ebit")}+{E("da")},"")'
        F[RN['tax']] = f'=IF({isn(E("taxExpense"), E("pretaxIncome"))},IF({E("pretaxIncome")}<>0,{E("taxExpense")}/{E("pretaxIncome")},""),"")'
        F[RN['nopat']] = f'=IF(ISNUMBER({E("ebit")}),IF(AND({E("ebit")}>0,ISNUMBER({col}{RN["tax"]})),{E("ebit")}*(1-{col}{RN["tax"]}),{E("ebit")}),"")'
        F[RN['reinv']] = f'=IF({isn(E("capex"), E("da"), E("changeNWC"))},{E("capex")}-{E("da")}+{E("changeNWC")},"")'
        F[RN['fcff']] = f'=IF({isn(col + str(RN["nopat"]), col + str(RN["reinv"]))},{col}{RN["nopat"]}-{col}{RN["reinv"]},"")'
        F[RN['ddeuda']] = '=""' if not prev else f'=IF({isn(E("debt"), est("debt", prev))},{E("debt")}-{est("debt", prev)},"")'
        F[RN['fcfe']] = f'=IF({isn(E("netIncome"), col + str(RN["reinv"]), col + str(RN["ddeuda"]))},{E("netIncome")}-{col}{RN["reinv"]}+{col}{RN["ddeuda"]},"")'
        F[RN['cap']] = f'=IF({isn(E("sharePrice"), E("shares"))},{E("sharePrice")}*{E("shares")},"")'
        F[RN['ev']] = (f'=IF({isn(col + str(RN["cap"]), E("debt"), E("cash"))},{col}{RN["cap"]}+{E("debt")}-{E("cash")}+N({E("minority")})-N({E("nonoperatingAssets")}),"")')
        cap, ev = f'{col}{RN["cap"]}', f'{col}{RN["ev"]}'
        den = {'EV/EBITDA': f'{col}{RN["ebitda"]}', 'EV/FCFF': f'{col}{RN["fcff"]}', 'EV/Ventas': E('revenue'), 'P/E': E('netIncome'),
               'P/FCFE': f'{col}{RN["fcfe"]}', 'P/OCF': E('operatingCF'), 'P/BV': E('equity')}
        for m in METODOS:
            num = ev if TIPO[m] == 'EV' else cap
            F[RM[m]] = f'=IF({isn(num, den[m])},IF(AND({num}>0,{den[m]}>0),{num}/{den[m]},""),"")'
        F[RI['crec']] = '=""' if not prev else f'=IF({isn(E("revenue"), est("revenue", prev))},IF({est("revenue", prev)}<>0,({E("revenue")}-{est("revenue", prev)})/{est("revenue", prev)},""),"")'
        F[RI['mbruto']] = f'=IF({isn(E("cogs"), E("revenue"))},IF({E("revenue")}<>0,({E("revenue")}-{E("cogs")})/{E("revenue")},""),"")'
        for k, num in [('mebitda', f'{col}{RN["ebitda"]}'), ('mebit', E('ebit')), ('mneto', E('netIncome')), ('mfcff', f'{col}{RN["fcff"]}')]:
            F[RI[k]] = f'=IF({isn(num, E("revenue"))},IF({E("revenue")}<>0,{num}/{E("revenue")},""),"")'
        F[RI['roe']] = f'=IF({isn(E("netIncome"), E("equity"))},IF({E("equity")}<>0,{E("netIncome")}/{E("equity")},""),"")'
        inv = f'({E("debt")}+{E("equity")}-{E("cash")})'
        F[RI['roic']] = f'=IF({isn(col + str(RN["nopat"]), E("debt"), E("equity"), E("cash"))},IF({inv}<>0,{col}{RN["nopat"]}/{inv},""),"")'
        F[RI['dnebitda']] = f'=IF({isn(E("debt"), E("cash"), col + str(RN["ebitda"]))},IF({col}{RN["ebitda"]}<>0,({E("debt")}-{E("cash")})/{col}{RN["ebitda"]},""),"")'
        F[RI['cobint']] = f'=IF({isn(E("ebit"), E("interestExpense"))},IF({E("interestExpense")}<>0,{E("ebit")}/{E("interestExpense")},""),"")'
        for r, f in F.items(): n[f'{col}{r}'] = f
        for r in list(RM.values()): n[f'{col}{r}'].number_format = '0.00"×"'
        for r in RI.values(): n[f'{col}{r}'].number_format = '0.0%'
        for k in ('dnebitda', 'cobint'): n[f'{col}{RI[k]}'].number_format = '0.00"×"'
        for r in range(5, 14):
            if r != RN['tax']: n[f'{col}{r}'].number_format = '#,##0.0'
        n[f'{col}{RN["tax"]}'].number_format = '0.0%'
    n.column_dimensions['A'].width = 40; n.freeze_panes = 'B4'
    for col in COLS: n.column_dimensions[col].width = 12
    # ------------------------------------------------------------------ Comparables
    c = wb.create_sheet('Comparables')
    c['A1'] = 'Comparables (entradas): múltiplos de pares con fuente y fecha. Solo valores positivos entran a la referencia.'; c['A1'].font = Font(bold=True, size=13)
    cab(c, 3, ['Ticker', 'Fuente', 'Fecha'] + METODOS)
    NP = 12
    for i in range(NP):
        for j in range(3 + len(METODOS)): entrada(c.cell(4 + i, 1 + j))
    c.column_dimensions['A'].width = 12; c.column_dimensions['B'].width = 36; c.column_dimensions['C'].width = 14
    # ------------------------------------------------------------------ Referencias
    rf = wb.create_sheet('Referencias')
    rf['A1'] = 'Conjunto de referencia por método = múltiplos propios históricos + comparables'; rf['A1'].font = Font(bold=True, size=13)
    cab(rf, 3, ['Origen'] + METODOS)
    for i, col in enumerate(COLS):
        rf.cell(4 + i, 1, f'Propio · ejercicio {i + 1}')
        for j, m in enumerate(METODOS):
            rf.cell(4 + i, 2 + j, f'=Indicadores!{col}{RM[m]}').number_format = '0.00"×"'
    for i in range(NP):
        rf.cell(4 + NA + i, 1, f'Comparable {i + 1}')
        for j, m in enumerate(METODOS):
            cc = f'Comparables!{L(4 + j)}{4 + i}'
            rf.cell(4 + NA + i, 2 + j, f'=IF(AND(ISNUMBER({cc}),{cc}>0),{cc},"")').number_format = '0.00"×"'
    r0, r1 = 4, 3 + NA + NP
    ST = {'n': r1 + 3, 'min': r1 + 4, 'p25': r1 + 5, 'p50': r1 + 6, 'p75': r1 + 7, 'max': r1 + 8, 'sug': {}}
    rf.cell(r1 + 2, 1, 'Estadísticos').font = NEG
    for k, t in [('n', 'Observaciones'), ('min', 'Mínimo'), ('p25', 'Percentil 25'), ('p50', 'Mediana'), ('p75', 'Percentil 75'), ('max', 'Máximo')]:
        rf.cell(ST[k], 1, t)
    for j, m in enumerate(METODOS):
        col = L(2 + j); rng = f'{col}{r0}:{col}{r1}'
        rf[f'{col}{ST["n"]}'] = f'=COUNT({rng})'
        rf[f'{col}{ST["min"]}'] = f'=IF({col}{ST["n"]}>=1,MIN({rng}),"")'
        rf[f'{col}{ST["max"]}'] = f'=IF({col}{ST["n"]}>=1,MAX({rng}),"")'
        for k, q in [('p25', 0.25), ('p50', 0.5), ('p75', 0.75)]:
            rf[f'{col}{ST[k]}'] = f'=IF({col}{ST["n"]}>=1,PERCENTILE({rng},{q}),"")'
        for k in ('min', 'p25', 'p50', 'p75', 'max'): rf[f'{col}{ST[k]}'].number_format = '0.00"×"'
    rf.column_dimensions['A'].width = 26
    for j in range(len(METODOS)): rf.column_dimensions[L(2 + j)].width = 13
    # ------------------------------------------------------------------ Escenarios
    s = wb.create_sheet('Escenarios')
    s['A1'] = 'Escenarios: pesos, crecimiento de la métrica y múltiplos (manual opcional con justificación)'; s['A1'].font = Font(bold=True, size=13)
    s['A3'] = 'Crecimiento de la métrica base'; s['A3'].font = NEG
    for j, sc in enumerate(ESC):
        s.cell(3, 2 + j, sc.capitalize()).font = NEG; entrada(s.cell(4, 2 + j))
    s['A4'] = 'Ajuste sobre la métrica del último ejercicio (0 % por defecto; exige evidencia)'
    cab(s, 6, ['Método', 'Peso', 'Manual cons.', 'Manual base', 'Manual opt.', 'Sugerido cons. (P25)', 'Sugerido base (mediana)', 'Sugerido opt. (P75)',
               'Usado cons.', 'Usado base', 'Usado opt.', 'Justif. cons.', 'Justif. base', 'Justif. opt.', 'Admitido por perfil'])
    SE = {m: 7 + i for i, m in enumerate(METODOS)}
    for m in METODOS:
        r = SE[m]; j = METODOS.index(m); rcol = L(2 + j)
        s.cell(r, 1, m)
        for cc in [2, 3, 4, 5, 12, 13, 14]: entrada(s.cell(r, cc))
        s.cell(r, 2).number_format = '0%'
        for k, key in enumerate(['p25', 'p50', 'p75']):
            s.cell(r, 6 + k, f'=IF(Referencias!{rcol}${ST["n"]}>=3,Referencias!{rcol}${ST[key]},"")').number_format = '0.00"×"'
            man, sug = L(3 + k) + str(r), L(6 + k) + str(r)
            s.cell(r, 9 + k, f'=IF(AND(ISNUMBER({man}),{man}>0),{man},IF(ISNUMBER({sug}),{sug},""))').number_format = '0.00"×"'
        s.cell(r, 15, f'=IF(N(B{r})>0,IF(ISNUMBER(SEARCH("|"&A{r}&"|",IFERROR(VLOOKUP(Estados!$B${FID["profile"]},Perfiles!$A$2:$B$6,2,FALSE),""))),"OK","NO ADMITIDO"),"")')
    s.cell(15, 1, 'Suma de pesos'); s.cell(15, 2, f'=SUM(B{SE[METODOS[0]]}:B{SE[METODOS[-1]]})').number_format = '0%'
    s.cell(16, 1, 'Justificación de los pesos'); entrada(s.cell(16, 2)); s.merge_cells('B16:H16')
    s.column_dimensions['A'].width = 36
    for cc in range(2, 16): s.column_dimensions[L(cc)].width = 15
    # ------------------------------------------------------------------ Valoración
    v = wb.create_sheet('Valoración')
    v['A1'] = 'Valoración por múltiplos (sin DCF) · valor por acción'; v['A1'].font = Font(bold=True, size=13)
    v['A3'] = 'Puente EV → equity (caja + no operativos − deuda − minoritarias − preferentes − opciones)'
    v['B3'] = f'=N({mk("cash")})+N({mk("nonOperatingAssets")})-N({mk("debt")})-N({mk("minority")})-N({mk("preferred")})-N({mk("optionsValue")})'
    v['A4'] = 'Ejercicio base'; v['B4'] = f'=MAX(Estados!B{FE["year"]}:K{FE["year"]})'
    v['A5'] = 'Posición del ejercicio base'; v['B5'] = f'=MATCH(B4,Estados!B{FE["year"]}:K{FE["year"]},0)'
    v['A6'] = 'Capitalización actual'; v['B6'] = f'=IF({isn(mk("sharePrice"), mk("shares"))},{mk("sharePrice")}*{mk("shares")},"")'
    cab(v, 8, ['Método', 'Tipo', 'Métrica FY base', 'Métrica LTM (opcional)', 'Métrica usada', 'Peso', 'Métrica cons.', 'Métrica base', 'Métrica opt.',
               'Valor/acción cons.', 'Valor/acción base', 'Valor/acción opt.', 'Peso aplic. cons.', 'Peso aplic. base', 'Peso aplic. opt.', 'Múltiplo actual'])
    VR = {m: 9 + i for i, m in enumerate(METODOS)}
    FILA_MET = {'EV/EBITDA': RN['ebitda'], 'EV/FCFF': RN['fcff'], 'EV/Ventas': None, 'P/E': None, 'P/FCFE': RN['fcfe'], 'P/OCF': None, 'P/BV': None}
    EST_MET = {'EV/Ventas': 'revenue', 'P/E': 'netIncome', 'P/OCF': 'operatingCF', 'P/BV': 'equity'}
    for m in METODOS:
        r = VR[m]; v.cell(r, 1, m); v.cell(r, 2, TIPO[m])
        if FILA_MET[m]: v.cell(r, 3, f'=INDEX(Indicadores!$B${FILA_MET[m]}:$K${FILA_MET[m]},$B$5)')
        else: v.cell(r, 3, f'=INDEX(Estados!$B${FE[EST_MET[m]]}:$K${FE[EST_MET[m]]},$B$5)')
        entrada(v.cell(r, 4))
        v.cell(r, 5, f'=IF(ISNUMBER(D{r}),D{r},IF(ISNUMBER(C{r}),C{r},""))')
        v.cell(r, 6, f'=Escenarios!B{SE[m]}')
        for k in range(3):
            gcell = f'Escenarios!${L(2 + k)}$4'
            v.cell(r, 7 + k, f'=IF(ISNUMBER(E{r}),E{r}*(1+N({gcell})),"")')
            u = f'Escenarios!{L(9 + k)}{SE[m]}'; met = f'{L(7 + k)}{r}'
            eq = f'({u}*{met}+IF($B{r}="EV",$B$3,0))'
            v.cell(r, 10 + k, f'=IF({isn(u, met)},IF(AND({met}>0,N({mk("shares")})>0),IF({eq}/{mk("shares")}>0,{eq}/{mk("shares")},""),""),"")').number_format = '0.00'
            v.cell(r, 13 + k, f'=IF(AND(ISNUMBER({L(10 + k)}{r}),N(F{r})>0),F{r},0)').number_format = '0%'
        v.cell(r, 16, f'=IF(AND(ISNUMBER(C{r}),N(C{r})>0,ISNUMBER($B$6)),IF(IF(B{r}="EV",$B$6-$B$3,$B$6)>0,IF(B{r}="EV",$B$6-$B$3,$B$6)/C{r},""),"")').number_format = '0.00"×"'
        v.cell(r, 6).number_format = '0%'
        for cc in (3, 4, 5, 7, 8, 9): v.cell(r, cc).number_format = '#,##0.0'
    a, b = VR[METODOS[0]], VR[METODOS[-1]]
    v.cell(17, 1, 'Resultado').font = NEG
    cab(v, 18, ['Concepto', 'Conservador', 'Base', 'Optimista'])
    nombres = ['Cobertura (peso aplicable / peso total)', 'Métodos aplicables', 'Valor ponderado por acción', 'Precio con MOS 35 % (sobre Base)', 'Precio actual', 'Brecha valor base vs precio',
               'Referencia V2 (valor base DCF, informativa)', 'Referencia V2 / valor múltiplos − 1 (no se promedian)']
    for i, t in enumerate(nombres): v.cell(19 + i, 1, t)
    for k in range(3):
        pc, vc = L(13 + k), L(10 + k); col = L(2 + k)
        v[f'{col}19'] = f'=IF(SUM($F${a}:$F${b})>0,SUM({pc}{a}:{pc}{b})/SUMIF($F${a}:$F${b},">0"),0)'
        v[f'{col}20'] = f'=COUNTIF({pc}{a}:{pc}{b},">0")'
        v[f'{col}21'] = f'=IF(AND({col}19>=0.8-0.000000000001,{col}20>=2),SUMPRODUCT({vc}{a}:{vc}{b},{pc}{a}:{pc}{b})/SUM({pc}{a}:{pc}{b}),"N/D")'
        v[f'{col}19'].number_format = '0%'; v[f'{col}21'].number_format = '0.00'
    v['C22'] = '=IF(ISNUMBER(C21),C21*(1-0.35),"N/D")'; v['C22'].number_format = '0.00'
    v['C23'] = f'={mk("sharePrice")}'; v['C23'].number_format = '0.00'
    v['C24'] = '=IF(AND(ISNUMBER(C21),ISNUMBER(C23)),IF(C23>0,C21/C23-1,"N/D"),"N/D")'; v['C24'].number_format = '0.0%'
    entrada(v['C25']); v['C25'].number_format = '0.00'
    v['C26'] = '=IF(AND(ISNUMBER(C25),ISNUMBER(C21)),IF(C21<>0,C25/C21-1,"N/D"),"N/D")'; v['C26'].number_format = '0.0%'
    v.column_dimensions['A'].width = 52
    for cc in range(2, 17): v.column_dimensions[L(cc)].width = 14
    v.freeze_panes = 'B9'
    # ------------------------------------------------------------------ Fuentes
    f = wb.create_sheet('Fuentes')
    cab(f, 1, ['Dato', 'Fuente primaria', 'Período', 'Página / nota', 'Unidades', 'Cifra reportada', 'Ajuste y razón'])
    for i in range(2, 40):
        for j in range(1, 8): entrada(f.cell(i, j))
    for col, w in zip('ABCDEFG', [30, 44, 14, 16, 12, 16, 50]): f.column_dimensions[col].width = w
    wb.move_sheet('Perfiles', offset=len(wb.sheetnames))
    return wb


def llenar(wb, exp):
    e, c, s, v = wb['Estados'], wb['Comparables'], wb['Escenarios'], wb['Valoración']
    hs = sorted(exp['history'], key=lambda h: h['year'])
    if len(hs) > NA: hs = hs[-NA:]
    for i, h in enumerate(hs):
        for campo in CAMPOS:
            val = h.get(campo)
            if campo == 'nonoperatingAssets' and val is None: val = h.get('nonOperatingAssets')
            if isinstance(val, (int, float)): e[f'{COLS[i]}{FE[campo]}'] = val
    for campo in MERC:
        if exp.get('market', {}).get(campo) is not None: e.cell(FM[campo], 2, exp['market'][campo])
    for k, key in [('ticker', 'ticker'), ('company', 'company'), ('profile', 'profile'), ('currency', 'currency'), ('units', 'units'), ('asOf', 'asOf')]:
        if exp.get(key) is not None: e.cell(FID[k], 2, exp[key])
    for i, p in enumerate(exp.get('comparables', [])[:12]):
        c.cell(4 + i, 1, p.get('ticker')); c.cell(4 + i, 2, p.get('fuente')); c.cell(4 + i, 3, p.get('fecha'))
        for j, m in enumerate(METODOS):
            if isinstance(p.get(CLAVE[m]), (int, float)): c.cell(4 + i, 4 + j, p[CLAVE[m]])
    for m, w in exp.get('pesos', {}).items(): s.cell(SE_ROW(m), 2, w)
    s['B16'] = exp.get('justificacionPesos')
    for k, sc in enumerate(ESC):
        cfg = exp.get('escenarios', {}).get(sc, {})
        if isinstance(cfg.get('crecimientoMetrica'), (int, float)): s.cell(4, 2 + k, cfg['crecimientoMetrica'])
        for m, val in cfg.get('multiplos', {}).items(): s.cell(SE_ROW(m), 3 + k, val)
        for m, t in cfg.get('justificacion', {}).items(): s.cell(SE_ROW(m), 12 + k, t)
    for m, val in (exp.get('ltm') or {}).get('metricas', {}).items():
        mm = {'ebitda': 'EV/EBITDA', 'fcff': 'EV/FCFF', 'ventas': 'EV/Ventas', 'utilidad': 'P/E', 'fcfe': 'P/FCFE', 'ocf': 'P/OCF', 'patrimonio': 'P/BV'}.get(m)
        if mm and isinstance(val, (int, float)): v.cell(9 + METODOS.index(mm), 4, val)
    ref = (exp.get('v2Ref') or {}).get('valorBase')
    if isinstance(ref, (int, float)): v['C25'] = ref


def SE_ROW(m): return 7 + METODOS.index(m)


def recalcular(origen):
    tmp = tempfile.mkdtemp(prefix='jmrmult-')
    try:
        subprocess.run(['soffice', '--headless', '--calc', '--convert-to', 'xlsx', '--outdir', tmp, origen], check=True, capture_output=True, timeout=180)
        return load_workbook(os.path.join(tmp, os.path.basename(origen)), data_only=True)
    finally:
        pass


def leer(wbv):
    v, rf = wbv['Valoración'], wbv['Referencias']
    num = lambda x: x if isinstance(x, (int, float)) else None
    out = {'ponderado': {}, 'cobertura': {}, 'metodos': {}, 'referencias': {}, 'actuales': {}}
    for k, sc in enumerate(ESC):
        out['ponderado'][sc] = num(v.cell(21, 2 + k).value); out['cobertura'][sc] = num(v.cell(19, 2 + k).value)
    for m in METODOS:
        r = 9 + METODOS.index(m)
        out['metodos'][m] = {sc: num(v.cell(r, 10 + k).value) for k, sc in enumerate(ESC)}
        out['actuales'][m] = num(v.cell(r, 16).value)
        j = METODOS.index(m); col = 2 + j; base = 4 + NA + 12 + 2
        out['referencias'][m] = {key: num(rf.cell(base + i, col).value) for i, key in enumerate(['n', 'min', 'p25', 'p50', 'p75', 'max'])}
    out['mos'] = num(v['C22'].value); out['brecha'] = num(v['C24'].value)
    return out


def main(argv):
    if len(argv) < 2: print(__doc__); return 2
    cmd = argv[1]
    if cmd == 'build':
        wb = construir(); os.makedirs(os.path.dirname(os.path.abspath(argv[2])), exist_ok=True); wb.save(argv[2]); print('plantilla escrita', argv[2]); return 0
    if cmd in ('llenar', 'verify'):
        exp = json.load(open(argv[2])); wb = construir(); llenar(wb, exp)
        destino = argv[3] if cmd == 'llenar' else os.path.join(tempfile.mkdtemp(prefix='jmrmult-'), 'libro.xlsx')
        wb.save(destino)
        if cmd == 'llenar': print('libro escrito', destino); return 0
        print(json.dumps(leer(recalcular(destino)))); return 0
    print(__doc__); return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
