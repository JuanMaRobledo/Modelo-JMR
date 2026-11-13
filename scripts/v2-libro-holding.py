"""Libro financiero JMR V2.0 · holdings y conglomerados (suma de partes, SOTP).

No hay un libro original de Damodaran que inyectar: illGE.xlsx está atado a los siete segmentos de GE. El módulo se construye con FÓRMULAS PROPIAS
(hoja «JMR Negocios») que replican por negocio la fórmula de illGE (verificada en JS contra el original), hasta 8 negocios/participaciones:
  · «JMR Estados» / «JMR Indicadores»   consolidados (las mismas hojas del libro operativo)
  · «JMR Negocios»                      un negocio por fila: ingresos, capital, participación económica, método (fórmula | valor externo), valor atribuible
  · «JMR Escenarios»                    supuestos comunes y por negocio × escenario (un solo motor)
  · «JMR Fuentes»                       trazabilidad de cifras consolidadas y de los ingresos de cada negocio
Reglas: negocios no operativos solo con valor externo de su propio motor; sin descuento de holding salvo justificación escrita (≥ 40 caracteres).

Uso:
  python3 -I scripts/v2-libro-holding.py build    <salida.xlsx> [--datos semilla.json] [--escenario Base]
  python3 -I scripts/v2-libro-holding.py exportar <libro.xlsx> <meta.json> <dir_trabajo> <salida_expediente.json>
"""
import sys, os, re, json, zipfile, subprocess, hashlib, importlib.util, argparse, io

_spec = importlib.util.spec_from_file_location('libro_operativo', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v2-libro-operativo.py'))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)
Sheet, ref, YC, R, E, add_styles = L.Sheet, L.ref, L.YC, L.R, L.E, L.add_styles
S, N_ = "'JMR Escenarios'", "'JMR Negocios'"
NSEG = 8; R0 = 6                           # filas 6..13 de «JMR Negocios»
SEG_BASE = 20                              # bloque de cada negocio en «JMR Escenarios»: 5 filas desde la 20
COMUN = dict(riskFree=8, taxRate=9, corporateExpenses=10, eliminaciones=11, options=12, mos=13, descuento=14, justDescuento=15)
VAL = 'C62'

def esqueleto():
    import openpyxl
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Leeme'; ws['A1'] = 'JMR V2.0 · libro de holding (suma de partes). Ver hojas «JMR …».'
    ws['A1'].number_format = '0.0%'; from openpyxl.styles import Font, PatternFill; ws['A1'].font = Font(bold=True); ws['A1'].fill = PatternFill('solid', fgColor='E6EBF0')
    b = io.BytesIO(); wb.save(b); return b.getvalue()

def build_esc(base, datos, escenario):
    sh = Sheet(base); sh.widths = {1: 66, 2: 12, 3: 14, 4: 14, 5: 14, 6: 14, 7: 54}
    sh.put('A1', 'JMR V2.0 · Escenarios con un solo motor (suma de partes)', st='head'); sh.put('A2', 'Mismos negocios y mismo motor en los tres escenarios. El costo de capital es común salvo justificación económica.', st='note')
    sh.put('A3', 'Escenario activo', st='head'); sh.put('C3', escenario, st='in_text'); sh.put('A4', 'Índice del escenario activo'); sh.put('C4', f='MATCH(C3,D6:F6,0)', st='ctrl')
    for col, t in zip('ABCDEFG', ['Supuesto', 'Destino', 'Activo', 'Conservador', 'Base', 'Optimista', 'Justificación económica (obligatoria)']): sh.put(ref(col, 6), t, st='head')
    A = (datos or {}).get('assumptions', {}); b = A.get('base', {}); f = (datos or {}).get('financials', {})
    sh.put('A7', 'SUPUESTOS COMUNES', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 7), None, st='head')
    d = b.get('holdingDiscount') or {}
    for key, lab, v, stl in [('riskFree', 'Tasa libre de riesgo (perpetuidad)', b.get('riskFree'), 'in_pct'), ('taxRate', 'Tasa de impuestos sobre NOPAT', b.get('taxRate'), 'in_pct'),
                             ('corporateExpenses', 'Gastos corporativos a asignar a los negocios', f.get('corporateExpenses'), 'in_num'), ('eliminaciones', 'Eliminaciones intragrupo de ingresos (negativo)', f.get('eliminaciones'), 'in_num'),
                             ('options', 'Valor de las opciones sobre acciones', f.get('options', 0.0) if datos else None, 'in_num'), ('mos', 'Margen de seguridad (MOS)', b.get('mos', 0.35) if datos else 0.35, 'in_pct'),
                             ('descuento', 'Descuento de holding (0 = ninguno; máx. 30 %)', d.get('porcentaje', 0.0) if datos else 0.0, 'in_pct'), ('justDescuento', 'Justificación económica del descuento (≥ 40 caracteres)', d.get('justificacion'), 'in_text')]:
        r = COMUN[key]; sh.put(ref('A', r), lab); sh.put(ref('C', r), v, st=stl)
    sh.put('A17', 'SUPUESTOS POR NEGOCIO × ESCENARIO (el identificador y los datos fijos están en «JMR Negocios»)', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 17), None, st='head')
    segs = (datos or {}).get('segmentos', [])
    for i in range(NSEG):
        r0 = SEG_BASE + 5 * i; sg = segs[i] if i < len(segs) else {}
        sh.put(ref('A', r0), f='IF(%s!A%d="","(negocio %d sin usar)",%s!A%d&" · "&%s!B%d)' % (N_, R0 + i, i + 1, N_, R0 + i, N_, R0 + i), st='ctrl')
        for k, (lab, key, stl) in enumerate([('Margen operativo antes de gastos corporativos', 'margin', 'in_pct'), ('Crecimiento esperado a 5 años', 'growth5', 'in_pct'),
                                             ('Costo de capital del negocio', 'costOfCapital', 'in_pct'), ('Valor externo (de su propio motor)', 'valor', 'in_num')]):
            r = r0 + 1 + k; sh.put(ref('A', r), '   ' + lab); sh.put(ref('C', r), f='INDEX(D%d:F%d,$C$4)' % (r, r), st='calc_pct' if stl == 'in_pct' else 'calc_num')
            for col, n in zip('DEF', ['conservador', 'base', 'optimista']):
                e = (sg.get('escenarios', {}) or {}).get(n, {}) if sg else {}
                v = (e.get('valorExterno', {}) or {}).get('valor') if key == 'valor' else e.get(key)
                sh.put(ref(col, r), v if datos else None, st=stl)
    sh.put('A61', 'RESULTADO DEL ESCENARIO ACTIVO', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 61), None, st='head')
    sh.put('A62', 'Valor atribuible por acción'); sh.put('C62', f="%s!C27" % N_, st='calc_num')
    sh.put('A63', 'Precio con MOS (solo escenario Base: valor base × (1 − MOS))'); sh.put('C63', f='IF(C3="Base",IF(ISNUMBER(C62),C62*(1-C13),"N/D"),"solo con escenario Base")', st='calc_num')
    sh.put('A65', 'VALORES GUARDADOS DE LOS TRES ESCENARIOS (instantánea)', st='head')
    for col in 'BCDEFG': sh.put(ref(col, 65), None, st='head')
    for col, t in zip('DEF', ['Conservador', 'Base', 'Optimista']): sh.put(ref(col, 66), t, st='head')
    sh.put('A67', 'Valor por acción (guardado)')
    for col in 'DEF': sh.put(ref(col, 67), None, st='in_num')
    sh.put('A68', 'Estado de la instantánea')
    for col in 'DEF': sh.put(ref(col, 68), f='IF(%s67="","SIN GUARDAR",IF($C$3=%s66,IF(AND(ISNUMBER($C$62),ABS(%s67-$C$62)<=0.0001*MAX(ABS($C$62),1)),"VIGENTE","DESACTUALIZADO"),"cambiar de escenario para verificar"))' % (col, col, col), st='ctrl')
    sh.validations.append('<dataValidation type="list" allowBlank="0" showErrorMessage="1" sqref="C3"><formula1>"Conservador,Base,Optimista"</formula1></dataValidation>')
    return sh

def build_negocios(base, datos):
    sh = Sheet(base); sh.widths = {1: 12, 2: 24, 3: 13, 4: 10, 5: 12, 6: 12, 7: 10, 8: 10, 9: 10, 10: 26, 11: 12, 12: 12, **{i: 12 for i in range(13, 27)}}
    sh.put('A1', 'JMR V2.0 · Negocios y participaciones (suma de partes)', st='head')
    sh.put('A2', 'Azul = dato. Operativa → fórmula de dos etapas (réplica de illGE). Banco/aseguradora/otro → solo valor externo de su propio motor, con referencia a su expediente.', st='note')
    heads = ['Id', 'Nombre', 'Perfil', 'Método', 'Ingresos', 'Capital inv.', 'Particip.', 'Clave G&A', 'Tipo valor ext.', 'Fuente del valor ext.', 'Motor origen', 'Expediente ref.',
             'Margen', 'Crec. 5a', 'Costo cap.', 'Valor ext.', 'Share G&A', 'EBIT antes G&A', 'EBIT', 'NOPAT', 'ROIC', 'Estado', 'Valor negocio', 'Atribuible', 'Aporta a EV', 'Aporta a equity']
    for k, t in enumerate(heads): sh.put(ref(chr(ord('A') + k) if k < 26 else 'A' + chr(ord('A') + k - 26), 5), t, st='head')
    segs = (datos or {}).get('segmentos', [])
    for i in range(NSEG):
        r = R0 + i; sg = segs[i] if i < len(segs) else {}; r0 = SEG_BASE + 5 * i; vx = sg.get('valorExterno') or {}
        for col, key, stl in [('A', 'id', 'in_text'), ('B', 'nombre', 'in_text'), ('C', 'perfil', 'in_text'), ('E', 'revenue', 'in_num'), ('F', 'capital', 'in_num'), ('G', 'ownership', 'in_pct'), ('H', 'share', 'in_pct')]:
            sh.put(ref(col, r), sg.get(key) if (datos and sg) else None, st=stl)
        for col, key in [('I', 'tipoValor'), ('J', 'fuente'), ('K', 'motorOrigen'), ('L', 'refExpediente')]: sh.put(ref(col, r), vx.get(key) if (datos and sg) else None, st='in_text')
        sh.put(ref('D', r), f='IF(A%d="","",IF(C%d="operativa","Fórmula","Externo"))' % (r, r), st='ctrl')
        for col, rr, stl in [('M', r0 + 1, 'calc_pct'), ('N', r0 + 2, 'calc_pct'), ('O', r0 + 3, 'calc_pct'), ('P', r0 + 4, 'calc_num')]: sh.put(ref(col, r), f="%s!C%d" % (S, rr), st=stl)
        rf, tx, ga = "%s!$C$%d" % (S, COMUN['riskFree']), "%s!$C$%d" % (S, COMUN['taxRate']), "%s!$C$%d" % (S, COMUN['corporateExpenses'])
        sh.put(ref('Q', r), f='IF(H%d<>"",H%d,IF(D%d="Fórmula",E%d/SUMIF($D$%d:$D$%d,"Fórmula",$E$%d:$E$%d),0))' % (r, r, r, r, R0, R0 + NSEG - 1, R0, R0 + NSEG - 1), st='calc_pct')
        sh.put(ref('R', r), f='IF(D%d="Fórmula",E%d*M%d,"")' % (r, r, r), st='calc_num'); sh.put(ref('S', r), f='IF(D%d="Fórmula",R%d-%s*Q%d,"")' % (r, r, ga, r), st='calc_num')
        sh.put(ref('T', r), f='IF(D%d="Fórmula",S%d*(1-%s),"")' % (r, r, tx), st='calc_num'); sh.put(ref('U', r), f='IF(D%d="Fórmula",IFERROR(T%d/F%d,""),"")' % (r, r, r), st='calc_pct')
        sh.put(ref('V', r), f='IF(A%d="","",IF(D%d="Externo","EXTERNO",IF(OR(T%d<=0,U%d<=0,O%d<=N%d,O%d<=%s),"SIN SENTIDO","OK")))' % (r, r, r, r, r, r, r, rf), st='ctrl')
        val = '(T{r}*(1+N{r})*(1-N{r}/U{r})*(1-((1+N{r})/(1+O{r}))^5)/(O{r}-N{r})+((T{r}*(1+N{r})^5*(1+{rf})*(1-{rf}/O{r}))/(O{r}-{rf}))/(1+O{r})^5)'.format(r=r, rf=rf)
        sh.put(ref('W', r), f='IF(A%d="","",IF(D%d="Externo",P%d,IF(V%d="OK",%s,"N/D")))' % (r, r, r, r, val), st='calc_num')
        sh.put(ref('X', r), f='IF(ISNUMBER(W%d),W%d*G%d,"")' % (r, r, r), st='calc_num')
        sh.put(ref('Y', r), f='IF(AND(ISNUMBER(X%d),OR(D%d="Fórmula",I%d="ev")),X%d,0)' % (r, r, r, r), st='calc_num'); sh.put(ref('Z', r), f='IF(AND(ISNUMBER(X%d),D%d="Externo",I%d="equity"),X%d,0)' % (r, r, r, r), st='calc_num')
    e = lambda k, c='L': "%s!%s%d" % (E, c, R[k]); g = lambda k: "%s!$C$%d" % (S, COMUN[k]); r1, r2 = R0, R0 + NSEG - 1
    rows = [(15, 'SUMA DE PARTES', None, None), (16, 'Valor de los negocios a EV (atribuible)', 'SUM(Y%d:Y%d)' % (r1, r2), 'calc_num'), (17, 'Valor atribuible de negocios valorados por equity (externos)', 'SUM(Z%d:Z%d)' % (r1, r2), 'calc_num'),
            (18, '− Deuda (financiera + arrendamientos)', '%s+%s' % (e('deuda'), e('arrend')), 'calc_num'), (19, '− Minoritarios restados', e('minoritarios'), 'calc_num'), (20, '+ Caja', e('caja'), 'calc_num'),
            (21, '− Opciones sobre acciones', g('options'), 'calc_num'), (22, 'Valor del patrimonio', 'C16+C17-C18-C19+C20', 'calc_num'), (23, 'Valor del patrimonio común (− opciones)', 'C22-C21', 'calc_num'),
            (24, 'Descuento de holding aplicado (solo con justificación)', 'IF(AND(%s>0,LEN(%s)>=40),%s,0)' % (g('descuento'), g('justDescuento'), g('descuento')), 'calc_pct'),
            (25, 'Patrimonio atribuible tras descuento', 'IF(C23>0,C23*(1-C24),C23)', 'calc_num'), (26, 'Acciones en circulación', e('acciones'), 'calc_num'),
            (27, 'Valor atribuible por acción', 'IF(C28<>"OK","N/D",C25/C26)', 'calc_num'),
            (28, 'Control', 'IF(COUNTIF(V%d:V%d,"SIN SENTIDO")>0,"NEGOCIO SIN SENTIDO ECONÓMICO",IF(AND(%s>0,LEN(%s)<40),"DESCUENTO SIN JUSTIFICACIÓN",IF(COUNTA(A%d:A%d)<2,"MENOS DE DOS NEGOCIOS","OK")))' % (r1, r2, g('descuento'), g('justDescuento'), r1, r2), 'ctrl')]
    for r, lab, f, stl in rows:
        sh.put(ref('A', r), lab, st='head' if f is None else 'label')
        if f is None:
            for col in 'BC': sh.put(ref(col, r), None, st='head')
        else: sh.put(ref('C', r), f=f, st=stl)
    sh.put('A30', 'Control de claves de asignación de gastos corporativos (suman 100 % si se informan para todos los negocios por fórmula)')
    sh.put('C30', f='IF(COUNT(H%d:H%d)=0,"no aplica",IF(ABS(SUMIF(D%d:D%d,"Fórmula",H%d:H%d)-1)<0.001,"OK","REVISAR"))' % (r1, r2, r1, r2, r1, r2), st='ctrl')
    sh.put('A31', 'Conciliación de ingresos: negocios + eliminaciones vs. consolidado (±1 %)')
    sh.put('C31', f='IF(COUNT(E%d:E%d)<COUNTA(A%d:A%d),"INCOMPLETO",IF(ABS(SUM(E%d:E%d)+%s-%s)<=0.01*ABS(%s),"OK","REVISAR"))' % (r1, r2, r1, r2, r1, r2, g('eliminaciones'), e('ingresos'), e('ingresos')), st='ctrl')
    return sh

def build_fuentes(base, datos):
    sh = Sheet(base); sh.widths = {1: 40, 2: 34, 3: 10, 4: 16, 5: 9, 6: 20, 7: 16, 8: 16, 9: 18, 10: 12, 11: 30}
    sh.put('A1', 'JMR V2.0 · Trazabilidad de cifras materiales', st='head'); sh.put('A2', 'Cifras consolidadas y los ingresos de cada negocio. El control compara contra «JMR Estados», «JMR Escenarios» y «JMR Negocios».', st='note')
    for col, t in zip('ABCDEFGHIJK', ['Campo destino', 'Documento', 'Período', 'Página / nota', 'Moneda', 'Unidades', 'Valor reportado', 'Ajuste normalización', 'Valor en el libro', 'Control', 'Celda destino']): sh.put(ref(col, 3), t, st='head')
    h = datos['history'][-1] if datos else {}; fin_ = (datos or {}).get('financials', {})
    filas = [('financials.shares', E + '!L%d' % R['acciones'], h.get('shares')), ('financials.cash', E + '!L%d' % R['caja'], h.get('cash')), ('financials.minority', E + '!L%d' % R['minoritarios'], h.get('minority')),
             ('financials.debt', '%s!L%d+%s!L%d' % (E, R['deuda'], E, R['arrend']), h.get('debt')), ('financials.corporateExpenses', "%s!$C$%d" % (S, COMUN['corporateExpenses']), fin_.get('corporateExpenses'))]
    segs = (datos or {}).get('segmentos', [])
    for k, (campo, f, v) in enumerate(filas):
        r = 4 + k; sh.put(ref('A', r), campo); sh.put(ref('I', r), f=f, st='calc_num'); sh.put(ref('G', r), v if datos else None, st='in_num'); sh.put(ref('K', r), f.replace('+', ' + '), st='note')
    for i in range(NSEG):
        r = 9 + i; sh.put(ref('A', r), f='IF(%s!A%d="","","segmentos."&%s!A%d&".revenue")' % (N_, R0 + i, N_, R0 + i), st='label')
        sh.put(ref('I', r), f='IF(%s!A%d="","",%s!E%d)' % (N_, R0 + i, N_, R0 + i), st='calc_num'); sh.put(ref('G', r), segs[i].get('revenue') if (datos and i < len(segs)) else None, st='in_num')
        sh.put(ref('K', r), f='IF(%s!A%d="","","\'JMR Negocios\'!E%d")' % (N_, R0 + i, R0 + i), st='note')
    for r in range(4, 17):
        for col, val, stl in [('B', 'Informe anual (prueba)' if datos else None, 'in_text'), ('C', 2025 if datos else None, 'in_int'), ('D', 'p. 150' if datos else None, 'in_text'),
                              ('E', (datos or {}).get('currency') if datos else None, 'in_text'), ('F', 'millones' if datos else None, 'in_text'), ('H', 0.0 if datos else None, 'in_num')]:
            sh.put(ref(col, r), val if (datos and (r < 9 or r - 9 < len(segs))) else None, st=stl)
        sh.put(ref('J', r), f='IF($A%d="","",IF(OR(B%d="",C%d="",D%d="",E%d="",F%d="",G%d=""),"INCOMPLETO",IF(ABS(G%d+H%d-I%d)<=0.0001*MAX(ABS(I%d),1),"OK","REVISAR")))' % ((r,) * 11), st='ctrl')
    sh.put('A18', 'Resumen de trazabilidad'); sh.put('J18', f='IF(COUNTIF(J4:J16,"REVISAR")>0,"REVISAR",IF(COUNTIF(J4:J16,"INCOMPLETO")>0,"INCOMPLETO","OK"))', st='ctrl')
    return sh

def build(out, datos=None, escenario='Base'):
    z = zipfile.ZipFile(io.BytesIO(esqueleto())); parts = {n: z.read(n) for n in z.namelist()}; order = z.namelist()
    sx, base = add_styles(parts['xl/styles.xml'].decode('utf8')); parts['xl/styles.xml'] = sx.encode('utf8')
    sheets = [('JMR Estados', L.build_estados(base, datos)), ('JMR Indicadores', L.build_ind(base)), ('JMR Negocios', build_negocios(base, datos)), ('JMR Escenarios', build_esc(base, datos, escenario)), ('JMR Fuentes', build_fuentes(base, datos))]
    wb = parts['xl/workbook.xml'].decode('utf8'); rels = parts['xl/_rels/workbook.xml.rels'].decode('utf8'); ct = parts['[Content_Types].xml'].decode('utf8')
    sid = max(int(x) for x in re.findall(r'sheetId="(\d+)"', wb)); rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', rels)); n = max(int(x) for x in re.findall(r'xl/worksheets/sheet(\d+)\.xml', ' '.join(order))) + 1
    for name, sh in sheets:
        sid += 1; rid += 1; fn = 'xl/worksheets/sheet%d.xml' % n; parts[fn] = sh.xml().encode('utf8'); order.append(fn)
        wb = wb.replace('</sheets>', '<sheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="%s" sheetId="%d" r:id="rId%d"/></sheets>' % (name, sid, rid), 1)
        rels = rels.replace('</Relationships>', '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/></Relationships>' % (rid, n), 1)
        ct = ct.replace('</Types>', '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" PartName="/%s"/></Types>' % fn, 1); n += 1
    wb = re.sub(r'<calcPr[^>]*/>', '<calcPr fullCalcOnLoad="1"/>', wb, count=1) if '<calcPr' in wb else wb.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>', 1)
    parts['xl/workbook.xml'] = wb.encode('utf8'); parts['xl/_rels/workbook.xml.rels'] = rels.encode('utf8'); parts['[Content_Types].xml'] = ct.encode('utf8')
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
    b = datos['Base']; es, sc, ng, fu = b['JMR Estados'], b['JMR Escenarios'], b['JMR Negocios'], b['JMR Fuentes']
    num = lambda v: v if isinstance(v, (int, float)) else None
    hist = []
    for c in range(3, 13):
        y = es.cell(3, c).value
        if not isinstance(y, (int, float)): continue
        h = {'year': int(y)}
        for k, key in dict(revenue='ingresos', cogs='cogs', ebit='ebit', interestExpense='interes', pretaxIncome='uai', taxExpense='impuestos', netIncome='neta', operatingCF='cfo', capex='capex', da='da',
                           changeNWC='dwc', cash='caja', currentAssets='ac', currentLiabilities='pc', inventory='inventarios', assets='activos', liabilities='pasivos', debt='deuda', leases='arrend',
                           equity='patrimonio', minority='minoritarios', nonoperatingAssets='noop', shares='acciones').items(): h[k] = num(es.cell(R[key], c).value)
        hist.append(h)
    if hist: hist[-1]['sharePrice'] = num(es.cell(R['precio'], 3).value)
    cv = lambda k: sc.cell(COMUN[k], 3).value
    segmentos = []
    for i in range(NSEG):
        r = R0 + i; sid = ng.cell(r, 1).value
        if not sid: continue
        ext = ng.cell(r, 4).value == 'Externo'; r0 = SEG_BASE + 5 * i
        s = {'id': sid, 'nombre': ng.cell(r, 2).value, 'perfil': ng.cell(r, 3).value, 'revenue': num(ng.cell(r, 5).value), 'ownership': num(ng.cell(r, 7).value)}
        if num(ng.cell(r, 6).value) is not None: s['capital'] = num(ng.cell(r, 6).value)
        if num(ng.cell(r, 8).value) is not None: s['share'] = num(ng.cell(r, 8).value)
        esc = {}
        for n, col in [('conservador', 4), ('base', 5), ('optimista', 6)]:
            if ext:
                esc[n] = {'valorExterno': {'valor': num(sc.cell(r0 + 4, col).value), 'tipoValor': ng.cell(r, 9).value, 'fuente': ng.cell(r, 10).value, 'fecha': str(es.cell(R['fecha'], 3).value)[:10],
                                          'motorOrigen': ng.cell(r, 11).value, 'refExpediente': ng.cell(r, 12).value}}
            else: esc[n] = {'margin': num(sc.cell(r0 + 1, col).value), 'growth5': num(sc.cell(r0 + 2, col).value), 'costOfCapital': num(sc.cell(r0 + 3, col).value)}
        s['escenarios'] = esc
        if ext: s['valorExterno'] = esc['base']['valorExterno']
        segmentos.append(s)
    disc = num(cv('descuento')) or 0.0
    hd = {'porcentaje': disc, 'justificacion': cv('justDescuento')} if disc > 0 else None
    asum = {n: {'riskFree': num(cv('riskFree')), 'taxRate': num(cv('taxRate')), 'mos': num(cv('mos')), **({'holdingDiscount': hd} if hd else {})} for n in ['conservador', 'base', 'optimista']}
    prov = [{'destino': fu.cell(r, 1).value, 'documento': fu.cell(r, 2).value, 'periodo': fu.cell(r, 3).value, 'pagina': fu.cell(r, 4).value, 'moneda': fu.cell(r, 5).value, 'unidades': fu.cell(r, 6).value,
             'valorReportado': num(fu.cell(r, 7).value), 'ajuste': num(fu.cell(r, 8).value) or 0.0, 'celdaDestino': fu.cell(r, 11).value} for r in range(4, 17) if fu.cell(r, 1).value]
    exp = {'schemaVersion': 'jmr-v2-0.2', 'ticker': meta['ticker'], 'company': meta.get('company') or meta['ticker'], 'profile': 'holding', 'currency': prov[0]['moneda'], 'units': es['B2'].value,
           'asOf': str(es.cell(R['fecha'], 3).value)[:10], 'estado': meta.get('estado', 'EN_PROCESO'),
           'financials': {'corporateExpenses': num(cv('corporateExpenses')), 'debt': num(ng['C18'].value), 'minority': num(ng['C19'].value), 'cash': num(ng['C20'].value), 'options': num(cv('options')) or 0.0,
                          'shares': num(ng['C26'].value), 'sharePrice': hist[-1].get('sharePrice'), 'eliminaciones': num(cv('eliminaciones')) or 0.0},
           'history': hist, 'segmentos': segmentos, 'assumptions': asum, 'provenance': prov,
           'libro': {'id': meta.get('libroId', os.path.basename(libro)), 'sha256': sha, 'motor': 'sotp-jmr', 'valores': {n.lower(): datos[n]['JMR Escenarios'][VAL].value for n in datos}},
           'controlesLibro': {'estados': es['C56'].value, 'fuentes': fu['J18'].value, 'negocios': ng['C28'].value, 'ingresos': ng['C31'].value, 'claves': ng['C30'].value}}
    for k in ['analysis', 'sources', 'justificaciones', 'auditoria', 'condiciones']:
        if k in meta: exp[k] = meta[k]
    with open(salida, 'w') as fh: json.dump(exp, fh, indent=1, default=str, ensure_ascii=False)
    return exp

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'build':
        p = argparse.ArgumentParser(); p.add_argument('cmd'); p.add_argument('out'); p.add_argument('--datos'); p.add_argument('--escenario', default='Base'); x = p.parse_args(a)
        d = None
        if x.datos:
            with open(x.datos) as fh: d = json.load(fh)
        build(x.out, d, x.escenario); print('libro escrito:', x.out)
    elif a and a[0] == 'exportar':
        _, libro, meta, work, salida = a; e = exportar(libro, meta, work, salida); print('expediente escrito:', salida, {k: (round(v, 4) if isinstance(v, (int, float)) else v) for k, v in e['libro']['valores'].items()})
