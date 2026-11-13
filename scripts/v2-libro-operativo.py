"""Libro financiero JMR V2.0 · perfil operativo.

Construye el libro a partir del fcffsimpleginzu.xlsx ORIGINAL de Damodaran inyectando tres hojas nuevas en el paquete
(sin reescribir el resto: se conservan cuadros de texto, imagen, comentarios y desplegables del original):
  · «JMR Estados»     históricos de 10 años (reportado = azul; calculado = negro) + controles de cuadre
  · «JMR Indicadores» márgenes, eficiencia, salud financiera y múltiplos, todo con fórmulas sobre «JMR Estados»
  · «JMR Escenarios»  conservador / base / optimista con UN solo motor (Simple Ginsu): el selector alimenta «Input sheet»
Cambios en «Input sheet»: solo las celdas listadas en INPUT_LINKS pasan a ser fórmulas (antes eran valores digitados).

Uso:
  python3 -I scripts/v2-libro-operativo.py exportar <libro.xlsx> <meta.json> <dir_trabajo> <salida_expediente.json>
  python3 -I scripts/v2-libro-operativo.py build  <ginzu.xlsx> <salida.xlsx> [--datos semilla.json] [--escenario Base]
  python3 -I scripts/v2-libro-operativo.py verify <ginzu.xlsx> <semilla.json> <dir_trabajo> <salida_casos.json>
`--datos` carga una semilla (solo para pruebas con datos SINTÉTICOS); sin ella el libro sale en blanco para una empresa nueva.
"""
import sys, os, re, io, json, zipfile, subprocess, argparse
from xml.sax.saxutils import escape

E, I, S = "'JMR Estados'", "'JMR Indicadores'", "'JMR Escenarios'"
YC = [chr(c) for c in range(ord('C'), ord('L') + 1)]            # C..L = 10 ejercicios, el más reciente en L
R = dict(ingresos=6, cogs=7, bruta=8, opex=9, da=10, ebitda=11, ebit=12, interes=13, uai=14, impuestos=15, neta=16,
         caja=19, ac=20, inventarios=21, activos=22, pc=23, deuda=24, arrend=25, pasivos=26, patrimonio=27, minoritarios=28, noop=29, capinv=30,
         cfo=33, capex=34, dwc=35, adq=36, fin=37, divrec=38, acciones=41, sbc=42, id=43, nol=44, precio=47, fecha=48)

# ───────────── estilos (se AÑADEN al final de styles.xml; los existentes no se tocan) ─────────────
ST = dict(head=0, label=1, in_num=2, calc_num=3, calc_pct=4, calc_mult=5, in_pct=6, note=7, in_text=8, in_int=9, ctrl=10)
def add_styles(xml):
    cnt = lambda tag: int(re.search(r'<%s count="(\d+)"' % tag, xml).group(1))
    nf, nfonts, nfills, nxf = cnt('numFmts'), cnt('fonts'), cnt('fills'), cnt('cellXfs')
    fmts = {300: '#,##0.0;[Red]\\-#,##0.0', 301: '0.0%;[Red]\\-0.0%', 302: '0.00"×"'}
    xml = re.sub(r'<numFmts count="\d+">', '<numFmts count="%d">' % (nf + len(fmts)), xml, count=1)
    xml = xml.replace('</numFmts>', ''.join('<numFmt numFmtId="%d" formatCode="%s"/>' % (k, escape(v, {'"': '&quot;'})) for k, v in fmts.items()) + '</numFmts>', 1)
    fonts = ['<font><b/><sz val="10"/><color rgb="FF142C43"/><name val="Arial"/></font>', '<font><sz val="10"/><color rgb="FF0000FF"/><name val="Arial"/></font>',
             '<font><i/><sz val="9"/><color rgb="FF526679"/><name val="Arial"/></font>', '<font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/></font>']
    xml = re.sub(r'<fonts count="\d+"', '<fonts count="%d"' % (nfonts + len(fonts)), xml, count=1)
    xml = xml.replace('</fonts>', ''.join(fonts) + '</fonts>', 1)
    xml = re.sub(r'<fills count="\d+">', '<fills count="%d">' % (nfills + 1), xml, count=1)
    xml = xml.replace('</fills>', '<fill><patternFill patternType="solid"><fgColor rgb="FFE6EBF0"/><bgColor indexed="64"/></patternFill></fill></fills>', 1)
    fb, fi, fn, fc, fl = nfonts, nfonts + 1, nfonts + 2, nfonts + 3, nfills
    xf = lambda num, font, fill=0: '<xf numFmtId="%d" fontId="%d" fillId="%d" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>' % (num, font, fill)
    new = [xf(0, fb, fl), xf(0, fc), xf(300, fi), xf(300, fc), xf(301, fc), xf(302, fc), xf(301, fi), xf(0, fn), xf(0, fi), xf(1, fi), xf(0, fb)]
    xml = re.sub(r'<cellXfs count="\d+">', '<cellXfs count="%d">' % (nxf + len(new)), xml, count=1)
    xml = xml.replace('</cellXfs>', ''.join(new) + '</cellXfs>', 1)
    return xml, nxf
# ───────────── helpers de hoja ─────────────
def ref(col, row): return '%s%d' % (col, row)
class Sheet:
    def __init__(self, base): self.cells, self.base, self.validations, self.widths = {}, base, [], {}
    def put(self, r, v=None, f=None, st='label'):
        s = self.base + ST[st]; m = re.match(r'([A-Z]+)(\d+)', r); self.cells[(int(m.group(2)), m.group(1))] = (v, f, s)
    def xml(self):
        rows = {}
        for (rn, cl), (v, f, s) in self.cells.items():
            if f is not None: c = '<c r="%s%d" s="%d"><f>%s</f></c>' % (cl, rn, s, escape(f))
            elif v is None: c = '<c r="%s%d" s="%d"/>' % (cl, rn, s)
            elif isinstance(v, str): c = '<c r="%s%d" s="%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (cl, rn, s, escape(v))
            else: c = '<c r="%s%d" s="%d"><v>%s</v></c>' % (cl, rn, s, repr(float(v)) if isinstance(v, float) else v)
            rows.setdefault(rn, []).append((cl, c))
        key = lambda cl: (len(cl), cl)
        body = ''.join('<row r="%d">%s</row>' % (rn, ''.join(c for _, c in sorted(cs, key=lambda x: key(x[0])))) for rn, cs in sorted(rows.items()))
        cols = ''.join('<col min="%d" max="%d" width="%s" customWidth="1"/>' % (i, i, w) for i, w in sorted(self.widths.items()))
        dv = ('<dataValidations count="%d">%s</dataValidations>' % (len(self.validations), ''.join(self.validations))) if self.validations else ''
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                '<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane xSplit="2" ySplit="3" topLeftCell="C4" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>'
                '<cols>%s</cols><sheetData>%s</sheetData>%s</worksheet>' % (cols, body, dv))

# ───────────── «JMR Estados» ─────────────
ROWS_IN = [  # (clave, etiqueta, estilo)
 ('ingresos', 'Ingresos', 'in_num'), ('cogs', 'Costo de ventas', 'in_num'), ('opex', 'Gastos operativos (incluye D&A; no incluye costo de ventas)', 'in_num'),
 ('da', 'Depreciación y amortización', 'in_num'), ('ebit', 'EBIT reportado', 'in_num'), ('interes', 'Gastos por intereses', 'in_num'),
 ('uai', 'Utilidad antes de impuestos', 'in_num'), ('impuestos', 'Impuestos', 'in_num'), ('neta', 'Utilidad neta', 'in_num'),
 ('caja', 'Caja y equivalentes', 'in_num'), ('ac', 'Activos corrientes', 'in_num'), ('inventarios', 'Inventarios', 'in_num'), ('activos', 'Activos totales', 'in_num'),
 ('pc', 'Pasivos corrientes', 'in_num'), ('deuda', 'Deuda financiera', 'in_num'), ('arrend', 'Arrendamientos (deuda por arrendamiento)', 'in_num'),
 ('pasivos', 'Pasivos totales', 'in_num'), ('patrimonio', 'Patrimonio total (incluye minoritarias)', 'in_num'), ('minoritarios', '  de las cuales: participaciones minoritarias', 'in_num'),
 ('noop', 'Activos no operativos', 'in_num'),
 ('cfo', 'Flujo operativo', 'in_num'), ('capex', 'CAPEX (positivo = inversión)', 'in_num'), ('dwc', 'Cambio en capital de trabajo (positivo = inversión)', 'in_num'),
 ('adq', 'Adquisiciones', 'in_num'), ('fin', 'Flujo de financiación', 'in_num'), ('divrec', 'Dividendos y recompras', 'in_num'),
 ('acciones', 'Acciones en circulación (diluidas, millones)', 'in_num'), ('sbc', 'Compensación basada en acciones', 'in_num'), ('id', 'Investigación y desarrollo', 'in_num'),
 ('nol', 'Pérdidas fiscales acumuladas (NOL)', 'in_num')]
CALC = {  # fórmulas por columna c
 'bruta': ('Utilidad bruta', lambda c: '%s%d-%s%d' % (c, R['ingresos'], c, R['cogs']), 'calc_num'),
 'ebitda': ('EBITDA', lambda c: '%s%d+%s%d' % (c, R['ebit'], c, R['da']), 'calc_num'),
 'capinv': ('Capital invertido (deuda + patrimonio − caja)', lambda c: '%s%d+%s%d-%s%d' % (c, R['deuda'], c, R['patrimonio'], c, R['caja']), 'calc_num')}
HEADS = {5: 'ESTADO DE RESULTADOS', 18: 'BALANCE GENERAL', 32: 'FLUJOS DE EFECTIVO', 40: 'DATOS ADICIONALES', 46: 'DATOS DE MERCADO', 50: 'CONTROLES DE CUADRE (OK / REVISAR)'}
def build_estados(base, datos):
    sh = Sheet(base); sh.widths = {1: 60, 2: 11, **{i: 12 for i in range(3, 13)}, 13: 46}
    sh.put('A1', 'JMR V2.0 · Estados financieros históricos', st='head'); sh.put('A2', 'Azul = dato reportado (con fuente en columna M) · Negro = fórmula · Moneda y unidades: ver B2', st='note')
    sh.put('B2', (datos or {}).get('units', 'millones'), st='in_text')
    sh.put('A3', 'Concepto', st='head'); sh.put('B3', 'Tipo', st='head')
    hist = {h['year']: h for h in (datos or {}).get('history', [])}; years = sorted(hist)[-10:]
    for k, c in enumerate(YC):
        sh.put(ref(c, 3), years[k] if len(years) == 10 else None, st='in_int')
    sh.put('M3', 'Fuente (documento · página/nota)', st='head')
    for r, t in HEADS.items():
        for col in ['A', 'B'] + YC + ['M']: sh.put(ref(col, r), t if col == 'A' else None, st='head')
    def valor(key, h):
        m = dict(ingresos='revenue', cogs='cogs', opex=None, da='da', ebit='ebit', interes='interestExpense', uai='pretaxIncome', impuestos='taxExpense', neta='netIncome',
                 caja='cash', ac='currentAssets', inventarios='inventory', activos='assets', pc='currentLiabilities', deuda='debt', arrend=None, pasivos='liabilities',
                 patrimonio='equity', minoritarios='minority', noop='nonoperatingAssets', cfo='operatingCF', capex='capex', dwc='changeNWC', adq=None, fin=None, divrec=None,
                 acciones='shares', sbc=None, id=None, nol=None)[key]
        if key == 'opex': return h['revenue'] - h['cogs'] - h['ebit']
        if key in ('arrend', 'adq', 'fin', 'divrec', 'sbc', 'id', 'nol'): return 0.0
        return h[m]
    for key, label, stl in ROWS_IN:
        r = R[key]; sh.put(ref('A', r), label); sh.put(ref('B', r), 'Reportado', st='note')
        for k, c in enumerate(YC):
            y = sh.cells.get((3, c), (None,))[0]
            sh.put(ref(c, r), valor(key, hist[y]) if (datos and y in hist) else None, st=stl)
    for key, (label, fn, stl) in CALC.items():
        r = R[key]; sh.put(ref('A', r), label); sh.put(ref('B', r), 'Calculado', st='note')
        for c in YC: sh.put(ref(c, r), f=fn(c), st=stl)
    sh.put(ref('A', R['precio']), 'Precio actual de la acción'); sh.put(ref('C', R['precio']), (datos or {}).get('financials', {}).get('sharePrice') if datos else None, st='in_num')
    sh.put(ref('A', R['fecha']), 'Fecha de valoración'); sh.put(ref('C', R['fecha']), (datos or {}).get('asOf') if datos else None, st='in_text')
    ctr = [(51, 'Balance: activos = pasivos + patrimonio (±0,5 %)', lambda c: 'IF(%s%d="","",IF(ABS(%s%d-%s%d-%s%d)<=0.005*ABS(%s%d),"OK","REVISAR"))' % (c, R['activos'], c, R['activos'], c, R['pasivos'], c, R['patrimonio'], c, R['activos'])),
           (52, 'Resultados: EBIT = utilidad bruta − gastos operativos (±0,5 %)', lambda c: 'IF(%s%d="","",IF(ABS(%s%d-(%s%d-%s%d))<=0.005*MAX(ABS(%s%d),1),"OK","REVISAR"))' % (c, R['ebit'], c, R['ebit'], c, R['bruta'], c, R['opex'], c, R['ebit'])),
           (53, 'Resultados: UAI = EBIT − intereses (±0,5 %)', lambda c: 'IF(%s%d="","",IF(ABS(%s%d-(%s%d-%s%d))<=0.005*MAX(ABS(%s%d),1),"OK","REVISAR"))' % (c, R['uai'], c, R['uai'], c, R['ebit'], c, R['interes'], c, R['uai'])),
           (54, 'Resultados: utilidad neta = UAI − impuestos (±0,5 %)', lambda c: 'IF(%s%d="","",IF(ABS(%s%d-(%s%d-%s%d))<=0.005*MAX(ABS(%s%d),1),"OK","REVISAR"))' % (c, R['neta'], c, R['neta'], c, R['uai'], c, R['impuestos'], c, R['neta']))]
    for r, label, fn in ctr:
        sh.put(ref('A', r), label)
        for c in YC: sh.put(ref(c, r), f=fn(c), st='ctrl')
    sh.put('A55', 'Ejercicios consecutivos y sin duplicados'); sh.put('C55', f='IF(AND(COUNT(C3:L3)=10,SUMPRODUCT(--(D3:L3-C3:K3=1))=9),"OK","REVISAR")', st='ctrl')
    sh.put('A56', 'Resumen de controles'); sh.put('C56', f='IF(COUNTIF(C51:L55,"REVISAR")=0,"OK","REVISAR")', st='ctrl')
    return sh
# ───────────── «JMR Fuentes» (trazabilidad por campo material) ─────────────
FUENTES = [('financials.revenue', 'ingresos', None), ('financials.debt', 'deuda', 'arrend'), ('financials.cash', 'caja', None),
           ('financials.minority', 'minoritarios', None), ('financials.nonOperatingAssets', 'noop', None), ('financials.shares', 'acciones', None)]
def build_fuentes(base, datos):
    sh = Sheet(base); sh.widths = {1: 34, 2: 36, 3: 10, 4: 16, 5: 9, 6: 20, 7: 16, 8: 16, 9: 18, 10: 11, 11: 30}
    sh.put('A1', 'JMR V2.0 · Trazabilidad de cifras materiales', st='head'); sh.put('A2', 'Documento, período, página/nota, moneda, unidades, valor reportado y ajuste. El control compara contra «JMR Estados».', st='note')
    for col, t in zip('ABCDEFGHIJK', ['Campo destino', 'Documento', 'Período', 'Página / nota', 'Moneda', 'Unidades', 'Valor reportado', 'Ajuste normalización', 'Valor en el libro', 'Control', 'Celda destino']): sh.put(ref(col, 3), t, st='head')
    for k, (campo, a, b) in enumerate(FUENTES):
        r = 4 + k; sh.put(ref('A', r), campo)
        f = "%s!L%d" % (E, R[a]) + (("+%s!L%d" % (E, R[b])) if b else '')
        fin_ = (datos or {}).get('financials', {}); v = None
        if datos:
            h = (datos['history'][-1]); m = {'ingresos': 'revenue', 'deuda': 'debt', 'caja': 'cash', 'minoritarios': 'minority', 'noop': 'nonoperatingAssets', 'acciones': 'shares'}[a]; v = h[m]
        for col, val, stl in [('B', 'Informe anual (prueba)' if datos else None, 'in_text'), ('C', 2025 if datos else None, 'in_int'), ('D', 'p. 80' if datos else None, 'in_text'),
                              ('E', (datos or {}).get('currency') if datos else None, 'in_text'), ('F', 'millones' if datos else None, 'in_text'), ('G', v, 'in_num'), ('H', 0.0 if datos else None, 'in_num')]:
            sh.put(ref(col, r), val, st=stl)
        sh.put(ref('I', r), f=f, st='calc_num')
        sh.put(ref('J', r), f='IF(G%d="","",IF(ABS(G%d+H%d-I%d)<=0.0001*MAX(ABS(I%d),1),"OK","REVISAR"))' % (r, r, r, r, r), st='ctrl')
        sh.put(ref('K', r), "'JMR Estados'!L%d" % R[a], st='note')
    sh.put('A11', 'Resumen de trazabilidad'); sh.put('J11', f='IF(COUNTBLANK(B4:H9)>0,"INCOMPLETO",IF(COUNTIF(J4:J9,"REVISAR")=0,"OK","REVISAR"))', st='ctrl')
    return sh
# ───────────── «JMR Indicadores» ─────────────
def build_ind(base):
    sh = Sheet(base); sh.widths = {1: 50, 2: 11, **{i: 11 for i in range(3, 13)}}
    sh.put('A1', 'JMR V2.0 · Indicadores financieros (todo con fórmulas sobre «JMR Estados»)', st='head'); sh.put('A2', 'No se digita nada en esta hoja. N/D = dato insuficiente.', st='note')
    sh.put('A3', 'Indicador', st='head'); sh.put('B3', 'Unidad', st='head')
    for c in YC: sh.put(ref(c, 3), f='%s!%s3' % (E, c), st='head')
    e = lambda c, k: '%s!%s%d' % (E, c, R[k])
    def row(r, label, unit, fn, stl, cols=YC):
        sh.put(ref('A', r), label); sh.put(ref('B', r), unit, st='note')
        for c in cols: sh.put(ref(c, r), f='IFERROR(%s,"N/D")' % fn(c), st=stl)
    prev = lambda c: chr(ord(c) - 1)
    for r, t in {5: 'BASE DE CÁLCULO', 13: 'MÁRGENES', 21: 'EFICIENCIA', 31: 'SALUD FINANCIERA', 40: 'MÚLTIPLOS (último ejercicio y precio actual)'}.items():
        for col in ['A', 'B'] + YC: sh.put(ref(col, r), t if col == 'A' else None, st='head')
    row(6, 'Tasa efectiva de impuestos (impuestos / UAI)', '%', lambda c: '%s/%s' % (e(c, 'impuestos'), e(c, 'uai')), 'calc_pct')
    row(7, 'NOPAT (EBIT × (1 − tasa efectiva); EBIT si es ≤ 0)', 'mon.', lambda c: 'IF(%s>0,IF(ISNUMBER(%s6),%s*(1-%s6),%s),%s)' % (e(c, 'ebit'), c, e(c, 'ebit'), c, e(c, 'ebit'), e(c, 'ebit')), 'calc_num')
    row(8, 'Reinversión (CAPEX − D&A + Δ capital de trabajo)', 'mon.', lambda c: '%s-%s+%s' % (e(c, 'capex'), e(c, 'da'), e(c, 'dwc')), 'calc_num')
    row(9, 'FCFF (NOPAT − reinversión)', 'mon.', lambda c: '%s7-%s8' % (c, c), 'calc_num')
    row(10, 'Flujo de caja libre (flujo operativo − CAPEX)', 'mon.', lambda c: '%s-%s' % (e(c, 'cfo'), e(c, 'capex')), 'calc_num')
    row(11, 'Capital invertido (deuda + patrimonio − caja)', 'mon.', lambda c: e(c, 'capinv'), 'calc_num')
    row(14, 'Crecimiento de ingresos', '%', lambda c: '%s/%s-1' % (e(c, 'ingresos'), e(prev(c), 'ingresos')), 'calc_pct', YC[1:])
    row(15, 'Margen bruto', '%', lambda c: '%s/%s' % (e(c, 'bruta'), e(c, 'ingresos')), 'calc_pct')
    row(16, 'Margen EBITDA', '%', lambda c: '%s/%s' % (e(c, 'ebitda'), e(c, 'ingresos')), 'calc_pct')
    row(17, 'Margen operativo', '%', lambda c: '%s/%s' % (e(c, 'ebit'), e(c, 'ingresos')), 'calc_pct')
    row(18, 'Margen neto', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'ingresos')), 'calc_pct')
    row(19, 'Margen de FCFF', '%', lambda c: '%s9/%s' % (c, e(c, 'ingresos')), 'calc_pct')
    row(22, 'ROIC (NOPAT / capital invertido)', '%', lambda c: '%s7/%s11' % (c, c), 'calc_pct')
    row(23, 'ROE (utilidad neta / patrimonio)', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'patrimonio')), 'calc_pct')
    row(24, 'ROA (utilidad neta / activos)', '%', lambda c: '%s/%s' % (e(c, 'neta'), e(c, 'activos')), 'calc_pct')
    row(25, 'Rotación de activos (ingresos / activos)', '×', lambda c: '%s/%s' % (e(c, 'ingresos'), e(c, 'activos')), 'calc_mult')
    row(26, 'Sales to Capital (ingresos / capital invertido)', '×', lambda c: '%s/%s11' % (e(c, 'ingresos'), c), 'calc_mult')
    row(27, 'Tasa de reinversión (reinversión / NOPAT)', '%', lambda c: '%s8/%s7' % (c, c), 'calc_pct')
    row(28, 'Conversión de caja (flujo operativo / utilidad neta)', '×', lambda c: '%s/%s' % (e(c, 'cfo'), e(c, 'neta')), 'calc_mult')
    row(29, 'Reinversión por unidad de ingreso incremental', '×', lambda c: '%s8/(%s-%s)' % (c, e(c, 'ingresos'), e(prev(c), 'ingresos')), 'calc_mult', YC[1:])
    row(32, 'Liquidez corriente (activos / pasivos corrientes)', '×', lambda c: '%s/%s' % (e(c, 'ac'), e(c, 'pc')), 'calc_mult')
    row(33, 'Prueba ácida ((activos corrientes − inventarios) / pasivos corrientes)', '×', lambda c: '(%s-%s)/%s' % (e(c, 'ac'), e(c, 'inventarios'), e(c, 'pc')), 'calc_mult')
    row(34, 'Deuda neta (deuda + arrendamientos − caja)', 'mon.', lambda c: '%s+%s-%s' % (e(c, 'deuda'), e(c, 'arrend'), e(c, 'caja')), 'calc_num')
    row(35, 'Deuda neta / EBITDA', '×', lambda c: '(%s-%s)/%s' % (e(c, 'deuda'), e(c, 'caja'), e(c, 'ebitda')), 'calc_mult')
    row(36, 'Apalancamiento (deuda / patrimonio)', '×', lambda c: '%s/%s' % (e(c, 'deuda'), e(c, 'patrimonio')), 'calc_mult')
    row(37, 'Cobertura de intereses (EBIT / intereses)', '×', lambda c: '%s/%s' % (e(c, 'ebit'), e(c, 'interes')), 'calc_mult')
    row(38, 'Calidad del balance (pasivos / activos)', '%', lambda c: '%s/%s' % (e(c, 'pasivos'), e(c, 'activos')), 'calc_pct')
    p, L = '%s!$C$%d' % (E, R['precio']), 'L'
    one = lambda r, label, unit, f, stl: (sh.put(ref('A', r), label), sh.put(ref('B', r), unit, st='note'), sh.put(ref('L', r), f='IFERROR(%s,"N/D")' % f, st=stl))
    one(41, 'Capitalización bursátil (precio × acciones)', 'mon.', '%s*%s' % (p, e(L, 'acciones')), 'calc_num')
    one(42, 'Valor empresarial (capitalización + deuda + arrendamientos − caja + minoritarias)', 'mon.', 'L41+%s+%s-%s+%s' % (e(L, 'deuda'), e(L, 'arrend'), e(L, 'caja'), e(L, 'minoritarios')), 'calc_num')
    one(43, 'EV / EBITDA', '×', 'L42/%s' % e(L, 'ebitda'), 'calc_mult'); one(44, 'EV / EBIT', '×', 'L42/%s' % e(L, 'ebit'), 'calc_mult')
    one(45, 'EV / FCFF', '×', 'L42/L9', 'calc_mult'); one(46, 'P / E', '×', 'L41/%s' % e(L, 'neta'), 'calc_mult')
    one(47, 'P / FCF', '×', 'L41/L10', 'calc_mult'); one(48, 'P / BV', '×', 'L41/%s' % e(L, 'patrimonio'), 'calc_mult')
    sh.put('A49', 'Los múltiplos son diagnóstico y comparación: no se promedian con el valor intrínseco DCF.', st='note')
    return sh
# ───────────── «JMR Escenarios» ─────────────
ESC = [(7, 'Crecimiento de ingresos · año 1', 'growth1', 'in_pct', 26), (8, 'Margen operativo · año 1', 'margin1', 'in_pct', 27),
       (9, 'Crecimiento compuesto · años 2–5', 'growth2to5', 'in_pct', 28), (10, 'Margen operativo objetivo', 'marginTarget', 'in_pct', 29),
       (11, 'Año de convergencia del margen (1–10)', 'marginConvergenceYear', 'in_int', 30), (12, 'Sales to Capital · años 1–5', 'salesToCapital1to5', 'in_num', 31),
       (13, 'Sales to Capital · años 6–10', 'salesToCapital6to10', 'in_num', 32), (14, 'ROIC terminal', 'roicTerminal', 'in_pct', 49)]
COMUN = [(17, 'Tasa libre de riesgo (= crecimiento terminal)', 'riskFree', 34), (18, 'Tasa marginal de impuestos', 'marginalTax', 24), (19, 'Margen de seguridad (MOS)', 'mos', None)]
def build_esc(base, datos, escenario):
    sh = Sheet(base); sh.widths = {1: 74, 2: 9, 3: 13, 4: 14, 5: 14, 6: 14, 7: 60}
    sh.put('A1', 'JMR V2.0 · Escenarios con un solo motor (Simple Ginsu)', st='head'); sh.put('A2', 'El WACC es común por defecto (hoja «Cost of capital worksheet»). Un escenario solo lo cambia con justificación económica documentada.', st='note')
    sh.put('A3', 'Escenario activo', st='head'); sh.put('C3', escenario, st='in_text')
    sh.put('A4', 'Índice del escenario activo'); sh.put('C4', f='MATCH(C3,D6:F6,0)', st='ctrl')
    for col, t in zip('ABCDEFG', ['Supuesto', 'Fila', 'Activo', 'Conservador', 'Base', 'Optimista', 'Justificación económica (obligatoria)']): sh.put(ref(col, 6), t, st='head')
    for r, label, key, stl, inp in ESC:
        sh.put(ref('A', r), label); sh.put(ref('B', r), 'Input B%d' % inp, st='note')
        sh.put(ref('C', r), f='INDEX(D%d:F%d,$C$4)' % (r, r), st=stl.replace('in_', 'calc_') if stl != 'in_int' else 'calc_num')
        for col, n in zip('DEF', ['conservador', 'base', 'optimista']):
            sh.put(ref(col, r), ((datos or {}).get('assumptions', {}).get(n, {}).get(key)) if datos else None, st=stl)
    for r, label, key, inp in COMUN:
        sh.put(ref('A', r), label); sh.put(ref('B', r), ('Input B%d' % inp) if inp else 'Regla', st='note')
        base_a = (datos or {}).get('assumptions', {}).get('base', {})
        sh.put(ref('C', r), (base_a.get(key, base_a.get('gTerminal') if key == 'riskFree' else None)) if datos else (0.35 if key == 'mos' else None), st='in_pct')   # Ginsu: crecimiento terminal = tasa libre
    sh.put('A16', 'SUPUESTOS COMUNES A LOS TRES ESCENARIOS', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 16), None, st='head')
    sh.put('A22', 'RESULTADO DEL ESCENARIO ACTIVO', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 22), None, st='head')
    sh.put('A23', 'Valor intrínseco por acción'); sh.put('C23', f="'Valuation output'!B33", st='calc_num')
    sh.put('A24', 'Precio con MOS (solo sobre el escenario Base: valor base × (1 − MOS))'); sh.put('C24', f='IF(C3="Base",C23*(1-C19),"solo con escenario Base")', st='calc_num')
    sh.put('A26', 'VALORES GUARDADOS DE LOS TRES ESCENARIOS (instantánea; pegar valores al terminar cada escenario)', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 26), None, st='head')
    for col, t in zip('DEF', ['Conservador', 'Base', 'Optimista']): sh.put(ref(col, 27), t, st='head')
    sh.put('A28', 'Valor intrínseco por acción (guardado)')
    for col in 'DEF': sh.put(ref(col, 28), None, st='in_num')
    sh.put('A29', 'Precio con MOS (base guardado × (1 − MOS))'); sh.put('E29', f='IF(E28="","",E28*(1-C19))', st='calc_num')
    sh.put('A30', 'Estado de la instantánea')
    for col in 'DEF': sh.put(ref(col, 30), f='IF(%s28="","SIN GUARDAR",IF($C$3=%s27,IF(ABS(%s28-$C$23)<=0.0001*MAX(ABS($C$23),1),"VIGENTE","DESACTUALIZADO"),"cambiar de escenario para verificar"))' % (col, col, col), st='ctrl')
    sh.validations.append('<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C3"><formula1>"Conservador,Base,Optimista"</formula1></dataValidation>')
    return sh
# ───────────── enlaces en «Input sheet» (celdas que dejan de ser digitadas) ─────────────
def input_links():
    L = {}
    est = lambda k, col: "%s!%s%d" % (E, col, R[k])
    for cell, key in [('B11', 'ingresos'), ('B12', 'ebit'), ('B13', 'interes'), ('B15', None), ('B18', 'caja'), ('B19', 'noop'), ('B20', 'minoritarios'), ('B21', 'acciones')]:
        if cell == 'B15': L['B15'] = "%s+%s" % (est('deuda', 'L'), est('arrend', 'L')); L['C15'] = "%s+%s" % (est('deuda', 'K'), est('arrend', 'K')); continue
        L[cell] = est(key, 'K' if False else 'L')
        if cell not in ('B21',): L['C' + cell[1:]] = est(key, 'K')
    L['B14'] = "%s-%s" % (est('patrimonio', 'L'), est('minoritarios', 'L')); L['C14'] = "%s-%s" % (est('patrimonio', 'K'), est('minoritarios', 'K'))
    L['B22'] = "%s!$C$%d" % (E, R['precio'])
    L['B23'] = "IFERROR(MAX(0,MIN(1,%s/%s)),0)" % (est('impuestos', 'L'), est('uai', 'L'))
    for r, label, key, stl, inp in ESC:
        if inp != 49: L['B%d' % inp] = "%s!$C$%d" % (S, r)
    L['B49'] = "%s!$C$14" % S; L['B24'] = "%s!$C$18" % S; L['B34'] = "%s!$C$17" % S
    return L
VALUES = {'D11': '1', 'B48': 'Yes', 'B17': 'No', 'B16': 'No'}      # D11: ejercicios completos; B48: ROIC terminal = supuesto del escenario; B16/B17: I+D y arrendamientos ya reflejados en los estados
def set_cell(xml, cellref, formula=None, value=None, inline=None):
    m = re.search(r'<c r="%s"(?P<a>[^>]*?)(/>|>(?P<b>.*?)</c>)' % cellref, xml, re.S)
    if not m: raise SystemExit('Celda %s no encontrada en Input sheet' % cellref)
    attrs = re.sub(r'\s+t="[^"]*"', '', m.group('a'))
    if formula is not None: new = '<c r="%s"%s><f>%s</f></c>' % (cellref, attrs, escape(formula))
    elif inline is not None: new = '<c r="%s"%s t="inlineStr"><is><t>%s</t></is></c>' % (cellref, attrs, escape(inline))
    else: new = '<c r="%s"%s><v>%s</v></c>' % (cellref, attrs, value)
    return xml[:m.start()] + new + xml[m.end():], m.group(0)
def strip_cached(xml):   # fuerza el recálculo completo en cualquier aplicación (fórmulas sin valor en caché)
    xml = re.sub(r'(<c r="[A-Z]+\d+"[^>]*?)\s+t="(?:str|e|b|n)"([^>]*>\s*<f)', r'\1\2', xml)
    return re.sub(r'(<f[^>]*?/>|<f[^>]*>.*?</f>)<v>[^<]*</v>', r'\1', xml, flags=re.S)

def build(src, out, datos=None, escenario='Base'):
    z = zipfile.ZipFile(src); parts = {n: z.read(n) for n in z.namelist()}; order = z.namelist()
    sx = parts['xl/styles.xml'].decode('utf8'); sx, base = add_styles(sx); parts['xl/styles.xml'] = sx.encode('utf8')
    sheets = [('JMR Estados', build_estados(base, datos)), ('JMR Indicadores', build_ind(base)), ('JMR Escenarios', build_esc(base, datos, escenario)), ('JMR Fuentes', build_fuentes(base, datos))]
    wb = parts['xl/workbook.xml'].decode('utf8'); rels = parts['xl/_rels/workbook.xml.rels'].decode('utf8'); ct = parts['[Content_Types].xml'].decode('utf8')
    sid = max(int(x) for x in re.findall(r'sheetId="(\d+)"', wb)); rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', rels)); n = 18
    for name, sh in sheets:
        sid += 1; rid += 1; fn = 'xl/worksheets/sheet%d.xml' % n; parts[fn] = sh.xml().encode('utf8'); order.append(fn)
        wb = wb.replace('</sheets>', '<sheet state="visible" name="%s" sheetId="%d" r:id="rId%d"/></sheets>' % (name, sid, rid), 1)
        rels = rels.replace('</Relationships>', '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/></Relationships>' % (rid, n), 1)
        ct = ct.replace('</Types>', '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/%s"/></Types>' % fn, 1); n += 1
    wb = wb.replace('<calcPr/>', '<calcPr fullCalcOnLoad="1"/>', 1)
    s1 = parts['xl/worksheets/sheet1.xml'].decode('utf8'); links = input_links(); done = set()
    for cell, f in links.items():
        old = re.search(r'<c r="%s"[^>]*>.*?</c>' % cell, s1, re.S)
        if old and 't="shared"' in old.group(0):
            pass   # un hijo reemplazado sale del grupo; la comprobación de huérfanos posterior cubre el caso de una maestra reemplazada
        s1, _ = set_cell(s1, cell, formula=f); done.add(cell)
    for cell, v in VALUES.items(): s1, _ = set_cell(s1, cell, inline=v) if not v.replace('.', '').isdigit() else set_cell(s1, cell, value=v)
    masters = set(re.findall(r'<f t="shared" ref="[^"]+" si="(\d+)"', s1)) | set(re.findall(r'<f t="shared" si="(\d+)" ref="[^"]+"', s1))
    huerfanos = [si for si in set(re.findall(r'<f t="shared" si="(\d+)"\s*/>', s1)) if si not in masters]
    if huerfanos: raise SystemExit('Fórmulas compartidas huérfanas tras los reemplazos (si=%s): ampliar INPUT_LINKS' % huerfanos)
    if datos:
        s1, _ = set_cell(s1, 'B4', inline=datos.get('company', ''))
    for nme in list(parts):
        if re.match(r'xl/worksheets/sheet\d+\.xml$', nme): parts[nme] = strip_cached(parts[nme].decode('utf8') if nme != 'xl/worksheets/sheet1.xml' else s1).encode('utf8')
    parts['xl/workbook.xml'] = wb.encode('utf8'); parts['xl/_rels/workbook.xml.rels'] = rels.encode('utf8'); parts['[Content_Types].xml'] = ct.encode('utf8')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as o:
        for nme in order: o.writestr(nme, parts[nme])
    return links

def exportar(libro, meta_path, work, salida):
    """Genera el expediente JSON a partir del libro YA diligenciado: recalcula con LibreOffice los tres escenarios y lee los resultados.
    No inventa auditoría, análisis ni fuentes: esos campos solo se copian de meta.json (los redacta el proceso humano/IA y la auditoría la hace un tercero)."""
    import hashlib, openpyxl, warnings; warnings.filterwarnings('ignore')
    os.makedirs(work, exist_ok=True); meta = json.load(open(meta_path)); datos = {}
    sha = hashlib.sha256(open(libro, 'rb').read()).hexdigest()
    for esc in ['Conservador', 'Base', 'Optimista']:
        wb = openpyxl.load_workbook(libro); wb['JMR Escenarios']['C3'] = esc; tmp = os.path.join(work, esc + '.xlsx'); wb.save(tmp)
        subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx:Calc MS Excel 2007 XML', '--outdir', os.path.join(work, 'o_' + esc), tmp], check=True, capture_output=True, timeout=300)
        datos[esc] = openpyxl.load_workbook(os.path.join(work, 'o_' + esc, esc + '.xlsx'), data_only=True)
    b = datos['Base']; i, o, es, sc, fu = b['Input sheet'], b['Valuation output'], b['JMR Estados'], b['JMR Escenarios'], b['JMR Fuentes']
    num = lambda v: v if isinstance(v, (int, float)) else None
    claves = dict(revenue='ingresos', cogs='cogs', ebit='ebit', interestExpense='interes', pretaxIncome='uai', taxExpense='impuestos', netIncome='neta', operatingCF='cfo', capex='capex',
                  da='da', changeNWC='dwc', cash='caja', currentAssets='ac', currentLiabilities='pc', inventory='inventarios', assets='activos', liabilities='pasivos', debt='deuda',
                  equity='patrimonio', minority='minoritarios', nonoperatingAssets='noop', shares='acciones', leases='arrend', acquisitions='adq', financingCF='fin', dividendsBuybacks='divrec', sbc='sbc', rd='id', nol='nol')
    history = []
    for c in range(3, 13):
        y = es.cell(3, c).value
        if not isinstance(y, (int, float)): continue
        h = {'year': int(y)}
        for k, key in claves.items(): h[k] = num(es.cell(R[key], c).value)
        history.append(h)
    if history: history[-1]['sharePrice'] = num(es.cell(R['precio'], 3).value)
    keys = [(7, 'growth1'), (8, 'margin1'), (9, 'growth2to5'), (10, 'marginTarget'), (11, 'marginConvergenceYear'), (12, 'salesToCapital1to5'), (13, 'salesToCapital6to10'), (14, 'roicTerminal')]
    mos, tax = num(sc['C19'].value), num(sc['C18'].value)
    comun = dict(waccInitial=i['B35'].value, waccTerminal=o['M12'].value, gTerminal=o['M2'].value, marginalTax=tax, mos=mos, failureProbability=o['B22'].value or 0, recoveryRate=i['B54'].value)
    assumptions = {n: {**{k: num(sc.cell(r, col).value) for r, k in keys}, **comun} for n, col in [('conservador', 4), ('base', 5), ('optimista', 6)]}
    prov = [{'destino': fu.cell(r, 1).value, 'documento': fu.cell(r, 2).value, 'periodo': fu.cell(r, 3).value, 'pagina': fu.cell(r, 4).value, 'moneda': fu.cell(r, 5).value,
             'unidades': fu.cell(r, 6).value, 'valorReportado': num(fu.cell(r, 7).value), 'ajuste': num(fu.cell(r, 8).value) or 0.0, 'celdaDestino': fu.cell(r, 11).value} for r in range(4, 10)]
    exp = {'schemaVersion': 'jmr-v2-0.2', 'ticker': meta['ticker'], 'company': meta.get('company') or i['B4'].value, 'profile': 'operativa', 'currency': prov[0]['moneda'],
           'units': es['B2'].value, 'asOf': str(es.cell(R['fecha'], 3).value)[:10], 'estado': meta.get('estado', 'EN_PROCESO'),
           'financials': {'revenue': num(i['B11'].value), 'debt': num(i['B15'].value), 'cash': num(i['B18'].value), 'minority': num(i['B20'].value), 'nonOperatingAssets': num(i['B19'].value),
                          'nonoperatingAssets': num(i['B19'].value), 'optionsValue': num(o['B30'].value) or 0.0, 'shares': num(i['B21'].value), 'sharePrice': num(i['B22'].value),
                          'effectiveTaxRate': num(i['B23'].value), 'nol': num(o['B10'].value) or 0.0},
           'history': history, 'assumptions': assumptions, 'provenance': [{**p_, 'destino': p_['destino'].replace('nonOperatingAssets', 'nonoperatingAssets')} for p_ in prov],
           'libro': {'id': meta.get('libroId', os.path.basename(libro)), 'sha256': sha, 'motor': 'fcffsimpleginzu', 'valores': {n.lower(): datos[n]['Valuation output']['B33'].value for n in datos}},
           'controlesLibro': {'estados': es['C56'].value, 'fuentes': fu['J11'].value}}
    for k in ['analysis', 'sources', 'justificaciones', 'auditoria', 'condiciones']:
        if k in meta: exp[k] = meta[k]
    json.dump(exp, open(salida, 'w'), indent=1, default=str, ensure_ascii=False); return exp

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'build':
        p = argparse.ArgumentParser(); p.add_argument('cmd'); p.add_argument('src'); p.add_argument('out'); p.add_argument('--datos'); p.add_argument('--escenario', default='Base'); x = p.parse_args(a)
        build(x.src, x.out, json.load(open(x.datos)) if x.datos else None, x.escenario); print('libro escrito:', x.out)
    elif a and a[0] == 'exportar':
        _, libro, meta, work, salida = a; e = exportar(libro, meta, work, salida); print('expediente escrito:', salida, {k: round(v, 4) for k, v in e['libro']['valores'].items()})
    elif a and a[0] == 'verify':
        import openpyxl, warnings; warnings.filterwarnings('ignore')
        _, src, semilla, work, salida = a; os.makedirs(work, exist_ok=True); datos = json.load(open(semilla)); res = {}
        for esc in ['Conservador', 'Base', 'Optimista']:
            p = os.path.join(work, esc + '.xlsx'); build(src, p, datos, esc)
            subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx:Calc MS Excel 2007 XML', '--outdir', os.path.join(work, 'o_' + esc), p], check=True, capture_output=True, timeout=300)
            wb = openpyxl.load_workbook(os.path.join(work, 'o_' + esc, esc + '.xlsx'), data_only=True)
            i, o, es, ind, sc = wb['Input sheet'], wb['Valuation output'], wb['JMR Estados'], wb['JMR Indicadores'], wb['JMR Escenarios']
            res[esc] = {'input': {k: i[k].value for k in ['B11', 'C11', 'B12', 'B13', 'B14', 'B15', 'B18', 'B19', 'B20', 'B21', 'B22', 'B23', 'B24', 'B26', 'B27', 'B28', 'B29', 'B30', 'B31', 'B32', 'B34', 'B35', 'B48', 'B49']},
                        'out': {k: o[k].value for k in ['M12', 'M2', 'M40', 'B18', 'B20', 'B29', 'B31', 'B33']},
                        'indicadores': {str(r): [ind.cell(r, c).value for c in range(3, 13)] for r in list(range(6, 12)) + list(range(14, 20)) + list(range(22, 30)) + list(range(32, 39)) + list(range(41, 49))},
                        'controles': {str(r): [es.cell(r, c).value for c in range(3, 13)] for r in range(51, 57)}, 'escenario': sc['C3'].value, 'indice': sc['C4'].value,
                        'resumen': {k: sc[k].value for k in ['C7', 'C8', 'C14', 'C23', 'C24']}}
        json.dump(res, open(salida, 'w'), indent=1, default=str); print({k: round(v['out']['B33'], 6) for k, v in res.items()})
