"""Libro financiero JMR V2.0 · bancos y aseguradoras.

Misma técnica que el libro operativo (importa su maquinaria): se inyectan hojas en el paquete del libro ORIGINAL de Damodaran y solo se
reemplazan por fórmulas las celdas de entrada que antes se digitaban.
  método «ddm»    → divginzu.xlsx (Dividend Discount Ginsu)        · hoja de entradas «Inputs»
  método «exceso» → eqexret (convertido a .xlsx desde el .xls)      · hoja de entradas «Inputs»
Hojas nuevas: «JMR Estados», «JMR Indicadores», «JMR Escenarios», «JMR Fuentes» (todas específicas de entidades financieras).

Uso:
  python3 -I scripts/v2-libro-financiero.py build    <original.xlsx> <salida.xlsx> <ddm|exceso> [--datos semilla.json] [--escenario Base]
  python3 -I scripts/v2-libro-financiero.py exportar <libro.xlsx> <ddm|exceso> <meta.json> <dir_trabajo> <salida_expediente.json>
`--datos` carga una semilla SINTÉTICA para pruebas; sin ella el libro sale en blanco.
"""
import sys, os, re, json, zipfile, subprocess, hashlib, importlib.util, argparse
from xml.sax.saxutils import escape

_spec = importlib.util.spec_from_file_location('libro_operativo', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v2-libro-operativo.py'))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)
Sheet, ref, YC, add_styles, set_cell, strip_cached = L.Sheet, L.ref, L.YC, L.add_styles, L.set_cell, L.strip_cached
E, I, S, F = "'JMR Estados'", "'JMR Indicadores'", "'JMR Escenarios'", "'JMR Fuentes'"
R = dict(ingresos=6, uai=7, impuestos=8, neta=9, dividendos=10, recompras=11, activos=14, pasivos=15, patrimonio=16, minoritarios=17, cartera=18, depositos=19, provisiones=20,
         acciones=23, precio=24, fecha=25, cet1=28, cet1min=29, solv=30, solvmin=31, regfecha=32, regfuente=33)
HEADS = {5: 'ESTADO DE RESULTADOS', 13: 'BALANCE GENERAL', 22: 'DATOS DE MERCADO', 27: 'DATOS REGULATORIOS (último ejercicio)', 35: 'CONTROLES DE CUADRE (OK / REVISAR)'}
INP = [('ingresos', 'Ingresos totales (margen financiero + comisiones / primas)', None), ('uai', 'Utilidad antes de impuestos', 'pretaxIncome'), ('impuestos', 'Impuestos', 'taxExpense'),
       ('neta', 'Utilidad neta atribuible al común', 'netIncome'), ('dividendos', 'Dividendos pagados al común', 'dividends'), ('recompras', 'Recompras de acciones', None),
       ('activos', 'Activos totales', 'assets'), ('pasivos', 'Pasivos totales', 'liabilities'), ('patrimonio', 'Patrimonio atribuible al común', 'equity'),
       ('minoritarias', None, None), ('cartera', 'Cartera de crédito / inversiones (bruta)', None), ('depositos', 'Depósitos / reservas técnicas', None),
       ('provisiones', 'Provisiones por pérdidas crediticias / siniestros', None), ('acciones', 'Acciones en circulación (millones)', 'shares')]
LABEL = {'minoritarios': 'Participaciones minoritarias y preferentes (fuera del patrimonio común)'}
KEY = {'minoritarias': 'minoritarios'}

def build_estados(base, datos):
    sh = Sheet(base); sh.widths = {1: 66, 2: 11, **{i: 12 for i in range(3, 13)}, 13: 46}
    sh.put('A1', 'JMR V2.0 · Estados financieros históricos · entidad financiera', st='head'); sh.put('A2', 'Azul = reportado (fuente en «JMR Fuentes») · Negro = fórmula · Unidades:', st='note')
    sh.put('B2', (datos or {}).get('units', 'millones'), st='in_text'); sh.put('A3', 'Concepto', st='head'); sh.put('B3', 'Tipo', st='head')
    hist = {h['year']: h for h in (datos or {}).get('history', [])}; years = sorted(hist)[-10:]
    for k, c in enumerate(YC): sh.put(ref(c, 3), years[k] if len(years) == 10 else None, st='in_int')
    sh.put('M3', 'Nota', st='head')
    for r, t in HEADS.items():
        for col in ['A', 'B'] + YC + ['M']: sh.put(ref(col, r), t if col == 'A' else None, st='head')
    for key, label, jk in INP:
        k2 = KEY.get(key, key); r = R[k2]; sh.put(ref('A', r), label or LABEL[k2]); sh.put(ref('B', r), 'Reportado', st='note')
        for c in YC:
            y = sh.cells.get((3, c), (None,))[0]
            v = (hist[y].get(jk) if jk else (hist[y].get('minority') if k2 == 'minoritarios' else None)) if (datos and y in hist) else None   # lo que la semilla no trae queda en blanco, no en cero
            sh.put(ref(c, r), v, st='in_num')
    sh.put(ref('A', R['precio']), 'Precio actual de la acción'); sh.put(ref('C', R['precio']), (datos or {}).get('financials', {}).get('sharePrice') if datos else None, st='in_num')
    sh.put(ref('A', R['fecha']), 'Fecha de valoración'); sh.put(ref('C', R['fecha']), (datos or {}).get('asOf') if datos else None, st='in_text')
    reg = (datos or {}).get('regulatorio', {}) if datos else {}
    for key, label, v in [('cet1', 'CET1 (bancos) · razón', reg.get('cet1')), ('cet1min', 'CET1 mínimo exigido (incluye colchones aplicables)', reg.get('cet1Minimo')),
                          ('solv', 'Razón de solvencia (aseguradoras)', reg.get('solvencyRatio')), ('solvmin', 'Solvencia mínima exigida', reg.get('solvencyMinimo')),
                          ('regfecha', 'Fecha del dato regulatorio', reg.get('fecha')), ('regfuente', 'Fuente del dato regulatorio (documento, página)', reg.get('fuente'))]:
        sh.put(ref('A', R[key]), label); sh.put(ref('C', R[key]), v, st='in_text' if key in ('regfecha', 'regfuente') else 'in_pct' if key.startswith('cet') else 'in_num')
    c3 = lambda c, k: '%s%d' % (c, R[k])
    ctr = [(36, 'Balance: activos = pasivos + patrimonio común + minoritarias y preferentes (±0,5 %)', lambda c: 'IF(%s="","",IF(ABS(%s-%s-%s-%s)<=0.005*ABS(%s),"OK","REVISAR"))' % (c3(c, 'activos'), c3(c, 'activos'), c3(c, 'pasivos'), c3(c, 'patrimonio'), c3(c, 'minoritarios'), c3(c, 'activos'))),
           (37, 'Resultados: utilidad neta ≤ UAI − impuestos + minoritarios (revisar si difiere más de 5 %)', lambda c: 'IF(OR(%s="",%s=""),"",IF(%s<=(%s-%s)*1.05+0.0001,"OK","REVISAR"))' % (c3(c, 'neta'), c3(c, 'uai'), c3(c, 'neta'), c3(c, 'uai'), c3(c, 'impuestos')))]
    for r, label, fn in ctr:
        sh.put(ref('A', r), label)
        for c in YC: sh.put(ref(c, r), f=fn(c), st='ctrl')
    sh.put('A38', 'Ejercicios consecutivos y sin duplicados'); sh.put('C38', f='IF(AND(COUNT(C3:L3)=10,SUMPRODUCT(--(D3:L3-C3:K3=1))=9),"OK","REVISAR")', st='ctrl')
    sh.put('A39', 'Datos regulatorios completos (CET1 + mínimo, o solvencia + mínimo; con fecha y fuente)')
    sh.put('C39', f='IF(AND(OR(AND(ISNUMBER(C%d),ISNUMBER(C%d)),AND(ISNUMBER(C%d),ISNUMBER(C%d))),C%d<>"",C%d<>""),"OK","INCOMPLETO")' % (R['cet1'], R['cet1min'], R['solv'], R['solvmin'], R['regfecha'], R['regfuente']), st='ctrl')
    sh.put('A40', 'Capital sobre el mínimo regulatorio'); sh.put('C40', f='IF(C39<>"OK","",IF(OR(AND(ISNUMBER(C%d),C%d<C%d),AND(ISNUMBER(C%d),C%d<C%d)),"REVISAR","OK"))' % (R['cet1'], R['cet1'], R['cet1min'], R['solv'], R['solv'], R['solvmin']), st='ctrl')
    sh.put('A41', 'Resumen de controles'); sh.put('C41', f='IF(AND(COUNTIF(C36:L38,"REVISAR")=0,C39="OK",C40="OK"),"OK","REVISAR")', st='ctrl')
    return sh

def build_ind(base):
    sh = Sheet(base); sh.widths = {1: 52, 2: 11, **{i: 11 for i in range(3, 13)}}
    sh.put('A1', 'JMR V2.0 · Indicadores · entidad financiera (todo con fórmulas sobre «JMR Estados»)', st='head'); sh.put('A2', 'No se digita nada aquí. No se aplican indicadores industriales (EBITDA, FCFF, capital de trabajo).', st='note')
    sh.put('A3', 'Indicador', st='head'); sh.put('B3', 'Unidad', st='head')
    for c in YC: sh.put(ref(c, 3), f='%s!%s3' % (E, c), st='head')
    e = lambda c, k: '%s!%s%d' % (E, c, R[k]); prev = lambda c: chr(ord(c) - 1)
    for r, t in {5: 'CRECIMIENTO Y RETORNOS', 13: 'DISTRIBUCIÓN Y CAPITAL', 19: 'RIESGO Y EFICIENCIA', 24: 'MÚLTIPLOS (último ejercicio y precio actual)'}.items():
        for col in ['A', 'B'] + YC: sh.put(ref(col, r), t if col == 'A' else None, st='head')
    def row(r, label, unit, fn, stl, cols=YC):
        sh.put(ref('A', r), label); sh.put(ref('B', r), unit, st='note')
        for c in cols: sh.put(ref(c, r), f='IFERROR(%s,"N/D")' % fn(c), st=stl)
    row(6, 'Crecimiento de la utilidad neta', '%', lambda c: 'IF(%s>0,%s/%s-1,"N/D")' % (e(prev(c), 'neta'), e(c, 'neta'), e(prev(c), 'neta')), 'calc_pct', YC[1:])
    row(7, 'ROE (utilidad neta / patrimonio común)', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'patrimonio')), 'calc_pct')
    row(8, 'ROA (utilidad neta / activos)', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'activos')), 'calc_pct')
    row(9, 'Margen neto (utilidad neta / ingresos totales)', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'ingresos')), 'calc_pct')
    row(10, 'Tasa efectiva de impuestos', '%', lambda c: '%s/%s' % (e(c, 'impuestos'), e(c, 'uai')), 'calc_pct')
    row(14, 'Payout (dividendos / utilidad neta)', '%', lambda c: '%s/%s' % (e(c, 'dividendos'), e(c, 'neta')), 'calc_pct')
    row(15, 'Retorno total al accionista (dividendos + recompras) / utilidad neta', '%', lambda c: '(%s+%s)/%s' % (e(c, 'dividendos'), e(c, 'recompras'), e(c, 'neta')), 'calc_pct')
    row(16, 'Patrimonio común / activos', '%', lambda c: '%s/%s' % (e(c, 'patrimonio'), e(c, 'activos')), 'calc_pct')
    row(17, 'Crecimiento sostenible (ROE × (1 − payout))', '%', lambda c: '%s7*(1-%s14)' % (c, c), 'calc_pct')
    row(20, 'Pasivos / activos', '%', lambda c: '%s/%s' % (e(c, 'pasivos'), e(c, 'activos')), 'calc_pct')
    row(21, 'Cartera / depósitos (o inversiones / reservas)', '×', lambda c: '%s/%s' % (e(c, 'cartera'), e(c, 'depositos')), 'calc_mult')
    row(22, 'Provisiones / cartera', '%', lambda c: '%s/%s' % (e(c, 'provisiones'), e(c, 'cartera')), 'calc_pct')
    p = '%s!$C$%d' % (E, R['precio']); one = lambda r, label, unit, f, stl: (sh.put(ref('A', r), label), sh.put(ref('B', r), unit, st='note'), sh.put(ref('L', r), f='IFERROR(%s,"N/D")' % f, st=stl))
    one(25, 'Capitalización bursátil (precio × acciones)', 'mon.', '%s*%s' % (p, e('L', 'acciones')), 'calc_num'); one(26, 'P / E', '×', 'L25/%s' % e('L', 'neta'), 'calc_mult')
    one(27, 'P / BV', '×', 'L25/%s' % e('L', 'patrimonio'), 'calc_mult'); one(28, 'Rentabilidad por dividendo', '%', '%s/L25' % e('L', 'dividendos'), 'calc_pct')
    one(29, 'Margen de capital sobre el mínimo regulatorio (CET1 o solvencia)', '×', 'IF(ISNUMBER(%s!C%d),%s!C%d-%s!C%d,%s!C%d-%s!C%d)' % (E, R['cet1'], E, R['cet1'], E, R['cet1min'], E, R['solv'], E, R['solvmin']), 'calc_pct')
    sh.put('A30', 'Los múltiplos son diagnóstico: no se promedian con el valor intrínseco.', st='note')
    return sh

def esc_spec(metodo):
    """(fila, etiqueta, clave JS, estilo): supuestos por escenario; comunes en filas 17+."""
    esc = [(7, 'ROE de alto crecimiento', 'roeHighGrowth', 'in_pct'), (8, 'Retención en alto crecimiento (1 − payout)', 'retentionHighGrowth', 'in_pct'), (9, 'ROE en la etapa estable', 'roeStable', 'in_pct')]
    com = [(17, 'Beta del patrimonio', 'beta', 'in_num'), (18, 'Tasa libre de riesgo', 'riskFree', 'in_pct'), (19, 'Prima de riesgo del mercado (ERP)', 'erp', 'in_pct'),
           (20, 'Años de alto crecimiento', 'years', 'in_int'), (21, 'Crecimiento estable (vacío = tasa libre de riesgo)', 'stableGrowth', 'in_pct'),
           (22, 'Desvanecer los supuestos en la segunda mitad (Sí/No)', 'fade', 'in_text'), (23, 'Beta estable (vacío = igual a la beta)', 'stableBeta', 'in_num'), (24, 'Margen de seguridad (MOS)', 'mos', 'in_pct')]
    return esc, com
def build_esc(base, datos, escenario, metodo):
    sh = Sheet(base); sh.widths = {1: 66, 2: 16, 3: 13, 4: 14, 5: 14, 6: 14, 7: 60}; esc, com = esc_spec(metodo)
    sh.put('A1', 'JMR V2.0 · Escenarios con un solo motor (%s)' % ('Dividend Discount Ginsu' if metodo == 'ddm' else 'Equity Excess Return'), st='head')
    sh.put('A2', 'El costo del patrimonio es común por defecto. Un escenario solo lo cambia con justificación económica documentada.', st='note')
    sh.put('A3', 'Escenario activo', st='head'); sh.put('C3', escenario, st='in_text'); sh.put('A4', 'Índice del escenario activo'); sh.put('C4', f='MATCH(C3,D6:F6,0)', st='ctrl')
    for col, t in zip('ABCDEFG', ['Supuesto', 'Destino', 'Activo', 'Conservador', 'Base', 'Optimista', 'Justificación económica (obligatoria)']): sh.put(ref(col, 6), t, st='head')
    A = (datos or {}).get('assumptions', {})
    for r, label, key, stl in esc:
        sh.put(ref('A', r), label); sh.put(ref('B', r), 'Inputs', st='note'); sh.put(ref('C', r), f='INDEX(D%d:F%d,$C$4)' % (r, r), st='calc_pct')
        for col, n in zip('DEF', ['conservador', 'base', 'optimista']): sh.put(ref(col, r), A.get(n, {}).get(key) if datos else None, st=stl)
    sh.put('A16', 'SUPUESTOS COMUNES A LOS TRES ESCENARIOS', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 16), None, st='head')
    for r, label, key, stl in com:
        sh.put(ref('A', r), label); sh.put(ref('B', r), 'Inputs', st='note')
        v = None
        if datos:
            b = A.get('base', {}); v = b.get(key)
            if key == 'fade': v = 'Sí' if b.get('fade', True) else 'No'
            if key == 'stableGrowth' and metodo == 'ddm' and not b.get('overrideStableGrowth'): v = None
        elif key == 'mos': v = 0.35
        sh.put(ref('C', r), v, st=stl)
    sh.put('A26', 'RESULTADO DEL ESCENARIO ACTIVO', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 26), None, st='head')
    out = "'Valuation Output'!E31" if metodo == 'ddm' else "'Excess Return Valuation'!B29"
    sh.put('A27', 'Valor intrínseco por acción'); sh.put('C27', f=out, st='calc_num')
    sh.put('A28', 'Precio con MOS (solo escenario Base: valor base × (1 − MOS))'); sh.put('C28', f='IF(C3="Base",C27*(1-C24),"solo con escenario Base")', st='calc_num')
    sh.put('A30', 'VALORES GUARDADOS DE LOS TRES ESCENARIOS (instantánea)', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 30), None, st='head')
    for col, t in zip('DEF', ['Conservador', 'Base', 'Optimista']): sh.put(ref(col, 31), t, st='head')
    sh.put('A32', 'Valor intrínseco por acción (guardado)')
    for col in 'DEF': sh.put(ref(col, 32), None, st='in_num')
    sh.put('A33', 'Estado de la instantánea')
    for col in 'DEF': sh.put(ref(col, 33), f='IF(%s32="","SIN GUARDAR",IF($C$3=%s31,IF(ABS(%s32-$C$27)<=0.0001*MAX(ABS($C$27),1),"VIGENTE","DESACTUALIZADO"),"cambiar de escenario para verificar"))' % (col, col, col), st='ctrl')
    sh.validations.append('<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C3"><formula1>"Conservador,Base,Optimista"</formula1></dataValidation>')
    sh.validations.append('<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C22"><formula1>"Sí,No"</formula1></dataValidation>')
    return sh

FUENTES = [('financials.netIncome', 'neta'), ('financials.bookEquity', 'patrimonio'), ('financials.dividends', 'dividendos'), ('financials.shares', 'acciones')]
def build_fuentes(base, datos):
    sh = Sheet(base); sh.widths = {1: 34, 2: 36, 3: 10, 4: 16, 5: 9, 6: 20, 7: 16, 8: 16, 9: 18, 10: 11, 11: 30}
    sh.put('A1', 'JMR V2.0 · Trazabilidad de cifras materiales', st='head'); sh.put('A2', 'Documento, período, página/nota, moneda, unidades, valor reportado y ajuste. El control compara contra «JMR Estados».', st='note')
    for col, t in zip('ABCDEFGHIJK', ['Campo destino', 'Documento', 'Período', 'Página / nota', 'Moneda', 'Unidades', 'Valor reportado', 'Ajuste normalización', 'Valor en el libro', 'Control', 'Celda destino']): sh.put(ref(col, 3), t, st='head')
    for k, (campo, a) in enumerate(FUENTES):
        r = 4 + k; sh.put(ref('A', r), campo); m = {'neta': 'netIncome', 'patrimonio': 'equity', 'dividendos': 'dividends', 'acciones': 'shares'}[a]
        v = datos['history'][-1][m] if datos else None
        for col, val, stl in [('B', 'Informe anual (prueba)' if datos else None, 'in_text'), ('C', 2025 if datos else None, 'in_int'), ('D', 'p. 120' if datos else None, 'in_text'),
                              ('E', (datos or {}).get('currency') if datos else None, 'in_text'), ('F', 'millones' if datos else None, 'in_text'), ('G', v, 'in_num'), ('H', 0.0 if datos else None, 'in_num')]: sh.put(ref(col, r), val, st=stl)
        sh.put(ref('I', r), f="%s!L%d" % (E, R[a]), st='calc_num')
        sh.put(ref('J', r), f='IF(G%d="","",IF(ABS(G%d+H%d-I%d)<=0.0001*MAX(ABS(I%d),1),"OK","REVISAR"))' % (r, r, r, r, r), st='ctrl'); sh.put(ref('K', r), "'JMR Estados'!L%d" % R[a], st='note')
    sh.put('A9', 'Resumen de trazabilidad'); sh.put('J9', f='IF(COUNTBLANK(B4:H7)>0,"INCOMPLETO",IF(COUNTIF(J4:J7,"REVISAR")=0,"OK","REVISAR"))', st='ctrl')
    return sh

def links(metodo):
    est = lambda k, c='L': "%s!%s%d" % (E, c, R[k]); sc = lambda r: "%s!$C$%d" % (S, r); sp = lambda r: "%s!$C$%d" % (S, r)
    if metodo == 'ddm':
        return ({'B8': est('patrimonio'), 'C8': est('patrimonio', 'K'), 'B9': est('neta'), 'B10': est('dividendos'), 'B11': est('acciones'), 'B12': "%s!$C$%d" % (E, R['precio']),
                 'B15': sc(17), 'B16': sc(18), 'B17': sc(19), 'B20': sc(20), 'B29': sc(7), 'B30': sc(8), 'B33': sc(9),
                 'B34': 'IF(%s="No","No","Yes")' % sc(22), 'B38': 'IF(%s="","No","Yes")' % sc(21), 'B39': 'IF(%s="",0,%s)' % (sc(21), sc(21)),
                 'B45': 'IF(%s="","No","Yes")' % sc(23), 'B46': 'IF(%s="",0,%s)' % (sc(23), sc(23))},
                {'B22': 'Yes', 'B27': 'Yes', 'B31': 'Yes', 'B42': 'No'}, "Valuation Output", 'E31')
    return ({'B2': est('neta'), 'B3': est('patrimonio'), 'C3': est('patrimonio', 'K'), 'B4': "%s/%s" % (est('neta'), est('acciones')), 'B5': "%s/%s" % (est('dividendos'), est('acciones')), 'B6': est('acciones'),
             'B10': sc(17), 'B11': sc(18), 'B12': sc(19), 'B15': sc(20), 'B22': sc(7), 'B23': sc(8), 'B26': sc(9), 'B28': 'IF(%s="No","No","Yes")' % sc(22),
             'B31': 'IF(%s="",%s,%s)' % (sc(21), sc(18), sc(21)), 'B37': 'IF(%s="","No","Yes")' % sc(23), 'B38': 'IF(%s="",0,%s)' % (sc(23), sc(23))},
            {'B7': 'No', 'B20': 'Yes', 'B24': 'Yes', 'B34': 'No'}, "Excess Return Valuation", 'B29')

def sheet_path(parts, nombre):
    wb = parts['xl/workbook.xml'].decode('utf8'); rid = re.search(r'<sheet [^>]*name="%s"[^>]*r:id="(rId\d+)"' % re.escape(nombre), wb).group(1)
    for rel in re.findall(r'<Relationship [^>]*/>', parts['xl/_rels/workbook.xml.rels'].decode('utf8')):
        if 'Id="%s"' % rid in rel: return 'xl/' + re.search(r'Target="([^"]+)"', rel).group(1)
    raise SystemExit('No se encontró la hoja %s' % nombre)

def build(src, out, metodo, datos=None, escenario='Base'):
    z = zipfile.ZipFile(src); parts = {n: z.read(n) for n in z.namelist()}; order = z.namelist()
    sx, base = add_styles(parts['xl/styles.xml'].decode('utf8')); parts['xl/styles.xml'] = sx.encode('utf8')
    sheets = [('JMR Estados', build_estados(base, datos)), ('JMR Indicadores', build_ind(base)), ('JMR Escenarios', build_esc(base, datos, escenario, metodo)), ('JMR Fuentes', build_fuentes(base, datos))]
    wb = parts['xl/workbook.xml'].decode('utf8'); rels = parts['xl/_rels/workbook.xml.rels'].decode('utf8'); ct = parts['[Content_Types].xml'].decode('utf8')
    sid = max(int(x) for x in re.findall(r'sheetId="(\d+)"', wb)); rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', rels)); n = max(int(x) for x in re.findall(r'xl/worksheets/sheet(\d+)\.xml', ' '.join(order))) + 1
    for name, sh in sheets:
        sid += 1; rid += 1; fn = 'xl/worksheets/sheet%d.xml' % n; parts[fn] = sh.xml().encode('utf8'); order.append(fn)
        wb = wb.replace('</sheets>', '<sheet state="visible" name="%s" sheetId="%d" r:id="rId%d"/></sheets>' % (name, sid, rid), 1)
        rels = rels.replace('</Relationships>', '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/></Relationships>' % (rid, n), 1)
        ct = ct.replace('</Types>', '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/%s"/></Types>' % fn, 1); n += 1
    wb = re.sub(r'<calcPr[^>]*/>', '<calcPr fullCalcOnLoad="1"/>', wb, count=1) if '<calcPr' in wb else wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>', 1)
    parts['xl/workbook.xml'] = wb.encode('utf8'); parts['xl/_rels/workbook.xml.rels'] = rels.encode('utf8'); parts['[Content_Types].xml'] = ct.encode('utf8')
    L_, V_, _, _ = links(metodo); pth = sheet_path(parts, 'Inputs'); s1 = parts[pth].decode('utf8')
    for cell, f in L_.items(): s1, _ = set_cell(s1, cell, formula=f)
    for cell, v in V_.items(): s1, _ = set_cell(s1, cell, inline=v)
    masters = set(re.findall(r'<f t="shared" ref="[^"]+" si="(\d+)"', s1)) | set(re.findall(r'<f t="shared" si="(\d+)" ref="[^"]+"', s1))
    huerf = [si for si in set(re.findall(r'<f t="shared" si="(\d+)"\s*/>', s1)) if si not in masters]
    if huerf: raise SystemExit('Fórmulas compartidas huérfanas (si=%s): ampliar los enlaces' % huerf)
    if datos and metodo == 'ddm': s1, _ = set_cell(s1, 'B3', inline=datos.get('company', ''))   # en eqexret B3 es el patrimonio
    for nme in list(parts):
        if re.match(r'xl/worksheets/sheet\d+\.xml$', nme): parts[nme] = strip_cached((s1 if nme == pth else parts[nme].decode('utf8'))).encode('utf8')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as o:
        for nme in order: o.writestr(nme, parts[nme])

def exportar(libro, metodo, meta_path, work, salida):
    import openpyxl, warnings; warnings.filterwarnings('ignore')
    os.makedirs(work, exist_ok=True); meta = json.load(open(meta_path)); sha = hashlib.sha256(open(libro, 'rb').read()).hexdigest(); datos = {}
    for esc in ['Conservador', 'Base', 'Optimista']:
        wb = openpyxl.load_workbook(libro); wb['JMR Escenarios']['C3'] = esc; tmp = os.path.join(work, esc + '.xlsx'); wb.save(tmp)
        subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx:Calc MS Excel 2007 XML', '--outdir', os.path.join(work, 'o_' + esc), tmp], check=True, capture_output=True, timeout=300)
        datos[esc] = openpyxl.load_workbook(os.path.join(work, 'o_' + esc, esc + '.xlsx'), data_only=True)
    b = datos['Base']; es, sc, fu = b['JMR Estados'], b['JMR Escenarios'], b['JMR Fuentes']
    num = lambda v: v if isinstance(v, (int, float)) else None
    hist = []
    for c in range(3, 13):
        y = es.cell(3, c).value
        if not isinstance(y, (int, float)): continue
        h = {'year': int(y)}
        for k, key in dict(revenue='ingresos', pretaxIncome='uai', taxExpense='impuestos', netIncome='neta', dividends='dividendos', buybacks='recompras', assets='activos', liabilities='pasivos',
                           equity='patrimonio', minority='minoritarios', loans='cartera', deposits='depositos', provisions='provisiones', shares='acciones').items(): h[k] = num(es.cell(R[key], c).value)
        hist.append(h)
    if hist: hist[-1]['sharePrice'] = num(es.cell(R['precio'], 3).value)
    u, p = hist[-1], hist[-2]
    cc = lambda r: sc.cell(r, 3).value
    comun = dict(beta=num(cc(17)), riskFree=num(cc(18)), erp=num(cc(19)), years=int(cc(20)), mos=num(cc(24)), fade=cc(22) != 'No', changeStable=True)
    if num(cc(23)) is not None: comun.update(changeStableBeta=True, stableBeta=num(cc(23)))
    else: comun.update(changeStableBeta=False)
    g = num(cc(21))
    if metodo == 'ddm':
        comun.update(growthFromFundamentals=True, changeHighGrowth=True, overrideStablePayout=False, overrideStableGrowth=g is not None)
        if g is not None: comun['stableGrowth'] = g
    else: comun['stableGrowth'] = g if g is not None else comun['riskFree']; comun['overrideStablePayout'] = False
    asum = {n: {**comun, **{k: num(sc.cell(r, col).value) for r, k in [(7, 'roeHighGrowth'), (8, 'retentionHighGrowth'), (9, 'roeStable')]}} for n, col in [('conservador', 4), ('base', 5), ('optimista', 6)]}
    prov = [{'destino': fu.cell(r, 1).value, 'documento': fu.cell(r, 2).value, 'periodo': fu.cell(r, 3).value, 'pagina': fu.cell(r, 4).value, 'moneda': fu.cell(r, 5).value, 'unidades': fu.cell(r, 6).value,
             'valorReportado': num(fu.cell(r, 7).value), 'ajuste': num(fu.cell(r, 8).value) or 0.0, 'celdaDestino': fu.cell(r, 11).value} for r in range(4, 8)]
    prov.append({**prov[1], 'destino': 'financials.bookEquityPrior', 'periodo': (prov[1]['periodo'] - 1) if isinstance(prov[1]['periodo'], (int, float)) else prov[1]['periodo'], 'valorReportado': p['equity'], 'ajuste': 0.0, 'celdaDestino': "'JMR Estados'!K%d" % R['patrimonio']})
    reg = {}
    if num(es.cell(R['cet1'], 3).value) is not None: reg.update(cet1=num(es.cell(R['cet1'], 3).value), cet1Minimo=num(es.cell(R['cet1min'], 3).value))
    if num(es.cell(R['solv'], 3).value) is not None: reg.update(solvencyRatio=num(es.cell(R['solv'], 3).value), solvencyMinimo=num(es.cell(R['solvmin'], 3).value))
    reg.update(fecha=str(es.cell(R['regfecha'], 3).value)[:10], fuente=es.cell(R['regfuente'], 3).value)
    exp = {'schemaVersion': 'jmr-v2-0.2', 'ticker': meta['ticker'], 'company': meta.get('company') or meta['ticker'], 'profile': meta['profile'], 'metodo': metodo, 'currency': prov[0]['moneda'],
           'units': es['B2'].value, 'asOf': str(es.cell(R['fecha'], 3).value)[:10], 'estado': meta.get('estado', 'EN_PROCESO'),
           'financials': {'netIncome': u['netIncome'], 'bookEquity': u['equity'], 'bookEquityPrior': p['equity'], 'dividends': u['dividends'], 'shares': u['shares'], 'sharePrice': u.get('sharePrice')},
           'history': hist, 'assumptions': asum, 'regulatorio': reg, 'provenance': prov,
           'libro': {'id': meta.get('libroId', os.path.basename(libro)), 'sha256': sha, 'motor': 'divginzu' if metodo == 'ddm' else 'eqexret',
                     'valores': {n.lower(): datos[n]['JMR Escenarios']['C27'].value for n in datos}},
           'controlesLibro': {'estados': es['C41'].value, 'fuentes': fu['J9'].value}}
    for k in ['analysis', 'sources', 'justificaciones', 'auditoria', 'condiciones']:
        if k in meta: exp[k] = meta[k]
    json.dump(exp, open(salida, 'w'), indent=1, default=str, ensure_ascii=False); return exp

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'build':
        p = argparse.ArgumentParser(); p.add_argument('cmd'); p.add_argument('src'); p.add_argument('out'); p.add_argument('metodo', choices=['ddm', 'exceso']); p.add_argument('--datos'); p.add_argument('--escenario', default='Base'); x = p.parse_args(a)
        build(x.src, x.out, x.metodo, (json.load(open(x.datos)) if x.datos else None), x.escenario); print('libro escrito:', x.out)
    elif a and a[0] == 'exportar':
        _, libro, metodo, meta, work, salida = a; e = exportar(libro, metodo, meta, work, salida); print('expediente escrito:', salida, {k: round(v, 4) for k, v in e['libro']['valores'].items()})
