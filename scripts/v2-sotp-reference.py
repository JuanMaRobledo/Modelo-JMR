"""Casos de paridad contra illGE.xlsx (Damodaran, SOTP de General Electric).
Uso: python3 -I scripts/v2-sotp-reference.py <illGE.xlsx> <dir_trabajo> <salida.json>
Sobrescribe con constantes las entradas de COPIAS del libro, recalcula con LibreOffice y exporta insumos + resultados."""
import sys, os, json, subprocess, openpyxl, warnings, copy
warnings.filterwarnings('ignore')
src, work, out = sys.argv[1:4]
os.makedirs(work, exist_ok=True)
SOTP, BRK, MORE = 'SOTP Valuation', '2017 Breakdown', 'More Segment Breakdown (history'
ROWS = [5,6,7,8,9,10,11,13]                      # filas de SOTP: 7 negocios + capital
BRK_ROW = {5:2,6:3,7:4,8:5,9:6,10:7,11:8,13:9}   # fila equivalente en '2017 Breakdown' (ingresos para el reparto de G&A)

def recalc(wb, d):
    os.makedirs(d, exist_ok=True); p = os.path.join(d, 'in.xlsx'); wb.save(p)
    subprocess.run(['soffice','--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',os.path.join(d,'o'),p], check=True, capture_output=True, timeout=240)
    return openpyxl.load_workbook(os.path.join(d,'o','in.xlsx'), data_only=True)

base = recalc(openpyxl.load_workbook(src), os.path.join(work,'base'))
s, b = base[SOTP], base[BRK]
seg0 = {r: dict(rev=s[f'B{r}'].value, margin=s[f'C{r}'].value, k=s[f'G{r}'].value, g=s[f'I{r}'].value,
                share=b[f'B{BRK_ROW[r]}'].value, cap=100 * (b['G10'].value if r == 13 else b[f'G{BRK_ROW[r]}'].value)) for r in ROWS}   # la hoja guarda capital/100
glob0 = dict(rf=s['B2'].value, ga=b['D11'].value, tax=.25, debt=s['J15'].value, debtCap=s['J16'].value, minority=s['J17'].value, cash=s['J18'].value, options=s['J20'].value, shares=8680)
print('base valor por acción (original):', s['J22'].value)

def variante(nombre, seg_mut=None, glob_mut=None):
    seg, glob = copy.deepcopy(seg0), dict(glob0)
    if seg_mut: seg_mut(seg)
    if glob_mut: glob_mut(glob)
    wb = openpyxl.load_workbook(src); ws, wb_b = wb[SOTP], wb[BRK]
    ws['B2'] = glob['rf']; wb_b['D11'] = glob['ga']
    ws['J15'] = glob['debt']; ws['J16'] = glob['debtCap']; ws['J17'] = glob['minority']; ws['J18'] = glob['cash']; ws['J20'] = glob['options']
    ws['J22'] = f"=J21/{glob['shares']}"
    t = glob['tax']
    totalshare = sum(seg[r]['share'] for r in ROWS if r != 13) + seg[13]['share']
    for r in ROWS:
        d = seg[r]; ws[f'B{r}'] = d['rev']; ws[f'C{r}'] = d['margin']; ws[f'G{r}'] = d['k']; ws[f'I{r}'] = d['g']
        wb_b[f'B{BRK_ROW[r]}'] = d['share']
        if r == 13: wb_b['G10'] = d['cap'] / 100
        else: wb_b[f'G{BRK_ROW[r]}'] = d['cap'] / 100
        ws[f'F{r}'] = f'=E{r}*(1-{t})'
    r = recalc(wb, os.path.join(work, nombre)); so, bo = r[SOTP], r[BRK]
    return {'global': glob, 'shareTotal': bo['B10'].value,
            'segmentos': [dict(seg[x], row=x, D=so[f'D{x}'].value, E=so[f'E{x}'].value, F=so[f'F{x}'].value, H=so[f'H{x}'].value, J=so[f'J{x}'].value) for x in ROWS],
            'expected': {'sumaNegocios': so['J14'].value, 'equity': so['J19'].value, 'equityComun': so['J21'].value, 'porAccion': so['J22'].value}}

def escala(f, campo):
    def m(seg):
        for r in ROWS: seg[r][campo] *= f
    return m
V = {
 'ge_base': variante('ge_base'),
 'tasa_libre_alta': variante('rf', glob_mut=lambda g: g.update(rf=.045)),
 'sin_gastos_corporativos': variante('sga0', glob_mut=lambda g: g.update(ga=0)),
 'gastos_corporativos_altos': variante('sga1', glob_mut=lambda g: g.update(ga=9000)),
 'impuesto_30': variante('tax30', glob_mut=lambda g: g.update(tax=.30)),
 'crecimiento_mayor': variante('g1', seg_mut=lambda s: [s[r].update(g=min(s[r]['g'] + .02, s[r]['k'] - .015)) for r in ROWS]),
 'costo_capital_mayor': variante('k1', seg_mut=escala(1.15, 'k')),
 'margenes_menores': variante('m1', seg_mut=escala(.8, 'margin')),
 'caja_deuda_acciones': variante('bal', glob_mut=lambda g: g.update(cash=30000, debt=70000, debtCap=20000, minority=9000, options=500, shares=9100)),
}
json.dump(V, open(out, 'w'), indent=1, default=str)
for k, v in V.items(): print(k, round(v['expected']['porAccion'], 4), [round(x['H'], 3) for x in v['segmentos']][:3])

assert abs(V['ge_base']['expected']['porAccion'] - s['J22'].value) < 1e-9, 'la variante base no reproduce el libro original'
print('base reproducida exactamente')
