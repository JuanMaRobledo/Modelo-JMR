"""Casos de paridad contra los originales divginzu.xlsx y eqexret (convertido a xlsx) de Damodaran.
Uso: python3 -I scripts/v2-financieras-reference.py <divginzu.xlsx> <eqexret.xlsx> <dir_trabajo> <salida_dir>
Solo modifica COPIAS, recalcula con LibreOffice y exporta insumos + resultados. Herramienta de prueba."""
import sys, os, json, subprocess, openpyxl, warnings
warnings.filterwarnings('ignore')
ddm_src, er_src, work, out = sys.argv[1:5]
os.makedirs(work, exist_ok=True); os.makedirs(out, exist_ok=True)

def recalc(src, edits, sheet, d):
    os.makedirs(d, exist_ok=True)
    wb = openpyxl.load_workbook(src); ws = wb[sheet]
    for k, v in edits.items(): ws[k] = v
    p = os.path.join(d, 'in.xlsx'); wb.save(p)
    subprocess.run(['soffice','--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',os.path.join(d,'o'),p], check=True, capture_output=True, timeout=240)
    return openpyxl.load_workbook(os.path.join(d,'o','in.xlsx'), data_only=True)

num = lambda v: v if isinstance(v,(int,float)) else None
DDM = {
 'jpm_base': {}, 'sin_desvanecimiento': {'B34':'No'}, 'crecimiento_manual': {'B22':'No','B23':.08},
 'anos_5': {'B20':5}, 'anos_15_impar': {'B20':15}, 'un_ano': {'B20':1},
 'estable_sobrescrito': {'B31':'No','B38':'Yes','B39':.02,'B42':'Yes','B43':.6,'B45':'Yes','B46':.8},
 'fundamentos_sin_cambio_hg': {'B27':'No','B31':'No'},
 'crecimiento_negativo_max': {'B22':'No','B23':-.05,'B20':6},
}
res = {}
for n, e in DDM.items():
    e = {'B17': .0433, **e}
    r = recalc(ddm_src, e, 'Inputs', os.path.join(work,'ddm_'+n)); i, o = r['Inputs'], r['Valuation Output']
    cols = range(3, 18)
    res[n] = {
      'inputs': {k: i[k].value for k in ['B8','B9','B10','B11','B15','B16','B17','B20','B22','B23','B25','B26','B27','B29','B30','B31','B33','B34','B38','B39','B41','B42','B43','B45','B46','C8']},
      'derived': {k: num(o[k].value) for k in ['D3','D4','D7','D8','D21','D22','D23','D24','D25']},
      'expected': {'pvDividendos': o['E27'].value, 'pvTerminal': o['E28'].value, 'equity': o['E29'].value, 'perShare': o['E31'].value,
        'earnings': [num(o.cell(14,c).value) for c in cols], 'dividendos': [num(o.cell(16,c).value) for c in cols],
        'ke': [num(o.cell(17,c).value) for c in cols], 'payout': [num(o.cell(15,c).value) for c in cols], 'g': [num(o.cell(12,c).value) for c in cols]}}
json.dump(res, open(os.path.join(out,'ddm-cases.json'),'w'), indent=1, default=str)
print('DDM', {k: round(v['expected']['perShare'],4) for k,v in res.items()})

ER = {
 'base': {}, 'sin_cambio_hg': {'B20':'No'}, 'normalizado_promedio': {'B20':'No','B7':'Yes'},
 'normalizado_roe': {'B20':'No','B7':'Yes','Normalized Earnings!B2':2},
 'sin_desvanecimiento': {'B28':'No'}, 'beta_estable_igual': {'B37':'No'}, 'payout_manual': {'B34':'Yes','B35':.5},
 'patrimonio_decreciente_max': {'B23':-.15,'B15':6},
 'anos_5': {'B15':5}, 'anos_7_impar': {'B15':7}, 'estable_igual_hg': {'B24':'No'},
}
res = {}
for n, e in ER.items():
    ne = {}
    wb_edits = {k: v for k, v in e.items() if '!' not in k}
    r = None
    wb = openpyxl.load_workbook(er_src)
    for k, v in e.items():
        if '!' in k: sh, c = k.split('!'); wb[sh][c] = v
        else: wb['Inputs'][k] = v
    d = os.path.join(work,'er_'+n); os.makedirs(d, exist_ok=True); p = os.path.join(d,'in.xlsx'); wb.save(p)
    subprocess.run(['soffice','--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',os.path.join(d,'o'),p], check=True, capture_output=True, timeout=240)
    r = openpyxl.load_workbook(os.path.join(d,'o','in.xlsx'), data_only=True)
    i, o, ne_ = r['Inputs'], r['Excess Return Valuation'], r['Normalized Earnings']
    cols = range(2, 12)
    res[n] = {
      'inputs': {k: i[k].value for k in ['B2','B3','C3','B4','B5','B6','B7','B10','B11','B12','B15','B18','B19','B20','B22','B23','B24','B26','B28','B31','B33','B34','B35','B37','B38','B39']},
      'derived': {k: num(o[k].value) for k in ['B2','B3','B4','B5','L10','L15','L16','L19','L21']},
      'expected': {'bvInicial': o['B25'].value, 'pvExceso': o['B26'].value, 'equity': o['B27'].value, 'perShare': o['B29'].value,
        'bv': [num(o.cell(15,c).value) for c in cols], 'ni': [num(o.cell(8,c).value) for c in cols], 'exceso': [num(o.cell(10,c).value) for c in cols],
        'ke': [num(o.cell(16,c).value) for c in cols], 'payout': [num(o.cell(21,c).value) for c in cols]}}
json.dump(res, open(os.path.join(out,'excess-return-cases.json'),'w'), indent=1, default=str)
print('ER', {k: round(v['expected']['perShare'],4) for k,v in res.items()})
