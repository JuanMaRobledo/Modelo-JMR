"""Libro financiero JMR V2.0 · alto crecimiento (higrowth.xls de Damodaran).

Inyecta «JMR Estados» e «JMR Indicadores» (las mismas del libro operativo), «JMR Escenarios» y «JMR Fuentes» en el higrowth original
(convertido a .xlsx desde el .xls). Configuración soportada: capex por sales-to-capital, sin arrendamientos, I+D, otros gastos capitalizables
ni opciones calculadas internamente (ver docs/v2/README.md).

Uso:
  python3 -I scripts/v2-libro-alto.py build    <higrowth.xlsx> <salida.xlsx> [--datos semilla.json] [--escenario Base]
  python3 -I scripts/v2-libro-alto.py exportar <libro.xlsx> <meta.json> <dir_trabajo> <salida_expediente.json>
"""
import sys, os, re, json, zipfile, subprocess, hashlib, importlib.util, argparse

_spec = importlib.util.spec_from_file_location('libro_operativo', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v2-libro-operativo.py'))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)
Sheet, ref, YC, R, E, add_styles, set_cell, strip_cached = L.Sheet, L.ref, L.YC, L.R, L.E, L.add_styles, L.set_cell, L.strip_cached
IN, DCF, RGN = 'Input Sheet(assumtion)', 'DCFValuation', 'Revenue Growth Numbers'
S = "'JMR Escenarios'"
ESC = [(7, 'Margen operativo estable (Input C39)', 'stableMargin', 'in_pct'), (8, 'Sales to Capital (Input E35)', 'salesToCapital', 'in_num')] + \
      [(9 + k, 'Crecimiento de ingresos · año %d' % (k + 1), 'g%d' % (k + 1), 'in_pct') for k in range(10)]
COM = [(21, 'Tasa libre de riesgo (Input D55)', 'riskFree', 'in_pct'), (22, 'Prima de riesgo del mercado (Input D56)', 'erp', 'in_pct'), (23, 'Beta desapalancada (se reapalanca con la deuda de mercado)', 'betaU', 'in_num'),
       (24, 'Costo de la deuda actual (Input B26)', 'costOfDebt', 'in_pct'), (25, 'Tasa marginal de impuestos (Input B17)', 'taxRate', 'in_pct'), (26, 'Crecimiento estable (Input C38)', 'stableGrowth', 'in_pct'),
       (27, 'Razón deuda/capital estable (Input C40)', 'stableDebtRatio', 'in_pct'), (28, 'Beta estable (Input C41)', 'stableBeta', 'in_num'), (29, 'Costo de la deuda estable (Input C42)', 'stableCostOfDebt', 'in_pct'),
       (30, 'ROC estable (Input C43)', 'stableRoc', 'in_pct'), (31, 'Velocidad de convergencia del margen (Input D39)', 'speed', 'in_num'), (32, 'Margen de seguridad (MOS)', 'mos', 'in_pct')]
VALOR = 'C35'

def build_esc(base, datos, escenario):
    sh = Sheet(base); sh.widths = {1: 64, 2: 12, 3: 13, 4: 14, 5: 14, 6: 14, 7: 60}
    sh.put('A1', 'JMR V2.0 · Escenarios con un solo motor (alto crecimiento · higrowth)', st='head'); sh.put('A2', 'Solo cuando Simple Ginsu no basta (pérdidas operativas, margen en transición, crecimiento extraordinario). Costo de capital común salvo justificación.', st='note')
    sh.put('A3', 'Escenario activo', st='head'); sh.put('C3', escenario, st='in_text'); sh.put('A4', 'Índice del escenario activo'); sh.put('C4', f='MATCH(C3,D6:F6,0)', st='ctrl')
    for col, t in zip('ABCDEFG', ['Supuesto', 'Destino', 'Activo', 'Conservador', 'Base', 'Optimista', 'Justificación económica (obligatoria)']): sh.put(ref(col, 6), t, st='head')
    A = (datos or {}).get('assumptions', {})
    def val(n, key):
        a = A.get(n, {})
        if key.startswith('g') and key[1:].isdigit(): return a.get('growth', [None] * 10)[int(key[1:]) - 1] if datos else None
        return a.get(key) if datos else None
    for r, label, key, stl in ESC:
        sh.put(ref('A', r), label); sh.put(ref('B', r), 'Input', st='note'); sh.put(ref('C', r), f='INDEX(D%d:F%d,$C$4)' % (r, r), st='calc_pct' if stl == 'in_pct' else 'calc_num')
        for col, n in zip('DEF', ['conservador', 'base', 'optimista']): sh.put(ref(col, r), val(n, key), st=stl)
    sh.put('A20', 'SUPUESTOS COMUNES A LOS TRES ESCENARIOS', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 20), None, st='head')
    for r, label, key, stl in COM:
        sh.put(ref('A', r), label); sh.put(ref('B', r), 'Input', st='note'); b = A.get('base', {})
        v = (b.get(key) if datos else (0.35 if key == 'mos' else None))
        sh.put(ref('C', r), v, st=stl)
    sh.put('A34', 'RESULTADO DEL ESCENARIO ACTIVO', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 34), None, st='head')
    sh.put('A35', 'Valor intrínseco por acción'); sh.put('C35', f="%s!D45" % DCF, st='calc_num')
    sh.put('A36', 'Precio con MOS (solo escenario Base: valor base × (1 − MOS))'); sh.put('C36', f='IF(C3="Base",C35*(1-C32),"solo con escenario Base")', st='calc_num')
    sh.put('A38', 'VALORES GUARDADOS DE LOS TRES ESCENARIOS (instantánea)', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 38), None, st='head')
    for col, t in zip('DEF', ['Conservador', 'Base', 'Optimista']): sh.put(ref(col, 39), t, st='head')
    sh.put('A40', 'Valor intrínseco por acción (guardado)')
    for col in 'DEF': sh.put(ref(col, 40), None, st='in_num')
    sh.put('A41', 'Estado de la instantánea')
    for col in 'DEF': sh.put(ref(col, 41), f='IF(%s40="","SIN GUARDAR",IF($C$3=%s39,IF(ABS(%s40-$C$35)<=0.0001*MAX(ABS($C$35),1),"VIGENTE","DESACTUALIZADO"),"cambiar de escenario para verificar"))' % (col, col, col), st='ctrl')
    sh.validations.append('<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C3"><formula1>"Conservador,Base,Optimista"</formula1></dataValidation>')
    return sh

FUENTES = [('financials.revenue0', 'ingresos', "%s!B8" % ("'" + IN + "'")), ('financials.ebit0', 'ebit', None), ('financials.nol', 'nol', None), ('financials.cash', 'caja', None),
           ('financials.nonOperatingAssets', 'noop', None), ('financials.marketDebt', 'deuda', "'%s'!B27" % IN), ('financials.shares', 'acciones', None)]
def build_fuentes(base, datos):
    sh = Sheet(base); sh.widths = {1: 34, 2: 36, 3: 10, 4: 16, 5: 9, 6: 20, 7: 16, 8: 18, 9: 18, 10: 11, 11: 30}
    sh.put('A1', 'JMR V2.0 · Trazabilidad de cifras materiales', st='head'); sh.put('A2', 'La deuda se reporta a valor en libros; el ajuste lleva a valor de mercado como en higrowth (Input B27). El control compara contra el libro.', st='note')
    for col, t in zip('ABCDEFGHIJK', ['Campo destino', 'Documento', 'Período', 'Página / nota', 'Moneda', 'Unidades', 'Valor reportado', 'Ajuste normalización', 'Valor en el libro', 'Control', 'Celda destino']): sh.put(ref(col, 3), t, st='head')
    mp = {'ingresos': 'revenue', 'ebit': 'ebit', 'nol': None, 'caja': 'cash', 'noop': 'nonoperatingAssets', 'deuda': 'debt', 'acciones': 'shares'}
    libro = {'ingresos': "'%s'!B8" % IN, 'ebit': "'%s'!B4" % IN, 'nol': "'%s'!B16" % IN, 'caja': "'%s'!B13" % IN, 'noop': "'%s'!B14" % IN, 'deuda': "'%s'!B27" % IN, 'acciones': "'%s'!D46" % IN}
    for k, (campo, a, _) in enumerate(FUENTES):
        r = 4 + k; sh.put(ref('A', r), campo); v = datos['history'][-1].get(mp[a] or 'nol', 0.0) if datos else None
        for col, val, stl in [('B', 'Informe anual (prueba)' if datos else None, 'in_text'), ('C', 2025 if datos else None, 'in_int'), ('D', 'p. 90' if datos else None, 'in_text'),
                              ('E', (datos or {}).get('currency') if datos else None, 'in_text'), ('F', 'millones' if datos else None, 'in_text'), ('G', v, 'in_num')]: sh.put(ref(col, r), val, st=stl)
        if a == 'deuda': sh.put(ref('H', r), f='IF(G%d="","",%s-G%d)' % (r, libro[a], r), st='calc_num')      # valor de mercado − valor en libros (ajuste documentado)
        else: sh.put(ref('H', r), 0.0 if datos else None, st='in_num')
        sh.put(ref('I', r), f=libro[a], st='calc_num')
        sh.put(ref('J', r), f='IF(G%d="","",IF(ABS(G%d+H%d-I%d)<=0.0001*MAX(ABS(I%d),1),"OK","REVISAR"))' % (r, r, r, r, r), st='ctrl'); sh.put(ref('K', r), libro[a], st='note')
    sh.put('A12', 'Resumen de trazabilidad'); sh.put('J12', f='IF(COUNTBLANK(B4:H10)>0,"INCOMPLETO",IF(COUNTIF(J4:J10,"REVISAR")=0,"OK","REVISAR"))', st='ctrl')
    return sh

def links():
    est = lambda k, c='L': "%s!%s%d" % (E, c, R[k]); sc = lambda r: "%s!$C$%d" % (S, r)
    inp = {'B4': est('ebit'), 'B5': est('interes'), 'B6': est('capex'), 'B7': est('da'), 'B8': est('ingresos'), 'B10': '0', 'C10': '0', 'B11': est('deuda'), 'C11': est('deuda', 'K'),
           'B12': est('patrimonio'), 'C12': est('patrimonio', 'K'), 'B13': est('caja'), 'B14': est('noop'), 'B16': est('nol'), 'B17': sc(25),
           'B25': "%s*(1+1*(B27/(D46*D47)))" % sc(23), 'B26': sc(24), 'C38': sc(26), 'C39': sc(7), 'C40': sc(27), 'C41': sc(28), 'C42': sc(29), 'C43': sc(30), 'D39': sc(31), 'E35': sc(8),
           'D46': est('acciones'), 'D47': "%s!$C$%d" % (E, R['precio']), 'D55': sc(21), 'D56': sc(22)}
    vals = {'D20': 'No', 'D21': 'No', 'D22': 'No', 'D48': 'No', 'E30': 'Yes', 'E32': 'No', 'E34': '3'}
    rgn = {'B%d' % (3 + k): sc(9 + k) for k in range(10)}
    return inp, vals, rgn

def sheet_path(parts, nombre):
    wb = parts['xl/workbook.xml'].decode('utf8'); rid = re.search(r'<sheet [^>]*name="%s"[^>]*r:id="(rId\d+)"' % re.escape(nombre), wb).group(1)
    for rel in re.findall(r'<Relationship [^>]*/>', parts['xl/_rels/workbook.xml.rels'].decode('utf8')):
        if 'Id="%s"' % rid in rel: return 'xl/' + re.search(r'Target="([^"]+)"', rel).group(1)
    raise SystemExit('No se encontró la hoja %s' % nombre)

def build(src, out, datos=None, escenario='Base'):
    z = zipfile.ZipFile(src); parts = {n: z.read(n) for n in z.namelist()}; order = z.namelist()
    sx, base = add_styles(parts['xl/styles.xml'].decode('utf8')); parts['xl/styles.xml'] = sx.encode('utf8')
    sheets = [('JMR Estados', L.build_estados(base, datos)), ('JMR Indicadores', L.build_ind(base)), ('JMR Escenarios', build_esc(base, datos, escenario)), ('JMR Fuentes', build_fuentes(base, datos))]
    wb = parts['xl/workbook.xml'].decode('utf8'); rels = parts['xl/_rels/workbook.xml.rels'].decode('utf8'); ct = parts['[Content_Types].xml'].decode('utf8')
    sid = max(int(x) for x in re.findall(r'sheetId="(\d+)"', wb)); rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', rels)); n = max(int(x) for x in re.findall(r'xl/worksheets/sheet(\d+)\.xml', ' '.join(order))) + 1
    for name, sh in sheets:
        sid += 1; rid += 1; fn = 'xl/worksheets/sheet%d.xml' % n; parts[fn] = sh.xml().encode('utf8'); order.append(fn)
        wb = wb.replace('</sheets>', '<sheet state="visible" name="%s" sheetId="%d" r:id="rId%d"/></sheets>' % (name, sid, rid), 1)
        rels = rels.replace('</Relationships>', '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/></Relationships>' % (rid, n), 1)
        ct = ct.replace('</Types>', '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/%s"/></Types>' % fn, 1); n += 1
    wb = re.sub(r'<calcPr[^>]*/>', '<calcPr fullCalcOnLoad="1"/>', wb, count=1) if '<calcPr' in wb else wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>', 1)
    parts['xl/workbook.xml'] = wb.encode('utf8'); parts['xl/_rels/workbook.xml.rels'] = rels.encode('utf8'); parts['[Content_Types].xml'] = ct.encode('utf8')
    inp, vals, rgn = links(); p_in, p_rg = sheet_path(parts, IN), sheet_path(parts, RGN); s_in, s_rg = parts[p_in].decode('utf8'), parts[p_rg].decode('utf8')
    for cell, f in inp.items(): s_in, _ = set_cell(s_in, cell, formula=f)
    for cell, v in vals.items(): s_in, _ = set_cell(s_in, cell, inline=v) if not v.isdigit() else set_cell(s_in, cell, value=v)
    for cell, f in rgn.items(): s_rg, _ = set_cell(s_rg, cell, formula=f)
    for tag, x in (('Input', s_in), ('Revenue Growth Numbers', s_rg)):
        masters = set(re.findall(r'<f t="shared" ref="[^"]+" si="(\d+)"', x)) | set(re.findall(r'<f t="shared" si="(\d+)" ref="[^"]+"', x))
        huerf = [si for si in set(re.findall(r'<f t="shared" si="(\d+)"\s*/>', x)) if si not in masters]
        if huerf: raise SystemExit('Fórmulas compartidas huérfanas en %s (si=%s)' % (tag, huerf))
    for nme in list(parts):
        if re.match(r'xl/worksheets/sheet\d+\.xml$', nme): parts[nme] = strip_cached(s_in if nme == p_in else s_rg if nme == p_rg else parts[nme].decode('utf8')).encode('utf8')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as o:
        for nme in order: o.writestr(nme, parts[nme])

def exportar(libro, meta_path, work, salida):
    import openpyxl, warnings; warnings.filterwarnings('ignore')
    os.makedirs(work, exist_ok=True)
    with open(meta_path) as fh: meta = json.load(fh)
    with open(libro, 'rb') as fh: sha = hashlib.sha256(fh.read()).hexdigest()
    datos = {}
    for esc in ['Conservador', 'Base', 'Optimista']:
        wb = openpyxl.load_workbook(libro); wb['JMR Escenarios']['C3'] = esc; tmp = os.path.join(work, esc + '.xlsx'); wb.save(tmp)
        subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx:Calc MS Excel 2007 XML', '--outdir', os.path.join(work, 'o_' + esc), tmp], check=True, capture_output=True, timeout=300)
        datos[esc] = openpyxl.load_workbook(os.path.join(work, 'o_' + esc, esc + '.xlsx'), data_only=True)
    b = datos['Base']; i, es, sc, fu = b[IN], b['JMR Estados'], b['JMR Escenarios'], b['JMR Fuentes']
    num = lambda v: v if isinstance(v, (int, float)) else None
    hist = []
    for c in range(3, 13):
        y = es.cell(3, c).value
        if not isinstance(y, (int, float)): continue
        h = {'year': int(y)}
        for k, key in dict(revenue='ingresos', cogs='cogs', ebit='ebit', interestExpense='interes', pretaxIncome='uai', taxExpense='impuestos', netIncome='neta', operatingCF='cfo', capex='capex', da='da',
                           changeNWC='dwc', cash='caja', currentAssets='ac', currentLiabilities='pc', inventory='inventarios', assets='activos', liabilities='pasivos', debt='deuda', equity='patrimonio',
                           minority='minoritarios', nonoperatingAssets='noop', shares='acciones', nol='nol').items(): h[k] = num(es.cell(R[key], c).value)
        hist.append(h)
    if hist: hist[-1]['sharePrice'] = num(es.cell(R['precio'], 3).value)
    cc = lambda r: num(sc.cell(r, 3).value)
    comun = {k: cc(r) for r, _, k, _ in COM}
    comun.update(beta=num(i['B25'].value), costOfDebt=num(i['B26'].value))
    comun.pop('betaU', None)
    asum = {}
    for n, col in [('conservador', 4), ('base', 5), ('optimista', 6)]:
        asum[n] = {**comun, 'stableMargin': num(sc.cell(7, col).value), 'salesToCapital': num(sc.cell(8, col).value), 'growth': [num(sc.cell(9 + k, col).value) for k in range(10)]}
    prov = [{'destino': fu.cell(r, 1).value, 'documento': fu.cell(r, 2).value, 'periodo': fu.cell(r, 3).value, 'pagina': fu.cell(r, 4).value, 'moneda': fu.cell(r, 5).value, 'unidades': fu.cell(r, 6).value,
             'valorReportado': num(fu.cell(r, 7).value), 'ajuste': num(fu.cell(r, 8).value) or 0.0, 'celdaDestino': fu.cell(r, 11).value} for r in range(4, 11)]
    exp = {'schemaVersion': 'jmr-v2-0.2', 'ticker': meta['ticker'], 'company': meta.get('company') or meta['ticker'], 'profile': 'alto-crecimiento', 'currency': prov[0]['moneda'], 'units': es['B2'].value,
           'asOf': str(es.cell(R['fecha'], 3).value)[:10], 'estado': meta.get('estado', 'EN_PROCESO'),
           'financials': {'revenue0': num(i['B8'].value), 'ebit0': num(i['B4'].value), 'nol': num(i['B16'].value) or 0.0, 'taxRate': num(i['B17'].value), 'marketDebt': num(i['B27'].value), 'shares': num(i['D46'].value),
                          'sharePrice': num(i['D47'].value), 'cash': num(i['B13'].value), 'nonOperatingAssets': num(i['B14'].value), 'optionsValue': 0.0},
           'history': hist, 'assumptions': asum, 'provenance': prov,
           'libro': {'id': meta.get('libroId', os.path.basename(libro)), 'sha256': sha, 'motor': 'higrowth', 'valores': {n.lower(): datos[n]['JMR Escenarios'][VALOR].value for n in datos}},
           'controlesLibro': {'estados': es['C56'].value, 'fuentes': fu['J12'].value}}
    for k in ['analysis', 'sources', 'justificaciones', 'auditoria', 'condiciones', 'condicionesAltoCrecimiento', 'mercado']:
        if k in meta: exp[k] = meta[k]
    with open(salida, 'w') as fh: json.dump(exp, fh, indent=1, default=str, ensure_ascii=False)
    return exp

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'build':
        p = argparse.ArgumentParser(); p.add_argument('cmd'); p.add_argument('src'); p.add_argument('out'); p.add_argument('--datos'); p.add_argument('--escenario', default='Base'); x = p.parse_args(a)
        d = None
        if x.datos:
            with open(x.datos) as fh: d = json.load(fh)
        build(x.src, x.out, d, x.escenario); print('libro escrito:', x.out)
    elif a and a[0] == 'exportar':
        _, libro, meta, work, salida = a; e = exportar(libro, meta, work, salida); print('expediente escrito:', salida, {k: round(v, 4) for k, v in e['libro']['valores'].items()})
