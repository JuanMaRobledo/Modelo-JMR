"""Casos de paridad contra higrowth.xls (convertido a xlsx) y revgrowth de Damodaran.
Uso: python3 -I scripts/v2-altocrecimiento-reference.py <higrowth.xlsx> <revgrowth.xlsx> <dir_trabajo> <salida_dir>
Configuración soportada: sin arrendamientos, I+D ni otros gastos a capitalizar, sin opciones, capex por sales-to-capital (opción 3).
Sobrescribe con constantes las entradas de COPIAS, recalcula con LibreOffice y exporta insumos + resultados."""
import sys, os, json, copy, subprocess, openpyxl, warnings
warnings.filterwarnings('ignore')
hi, rv, work, out = sys.argv[1:5]
os.makedirs(work, exist_ok=True); os.makedirs(out, exist_ok=True)
IN, DCF, RGN = 'Input Sheet(assumtion)', 'DCFValuation', 'Revenue Growth Numbers'

def recalc(wb, d):
    os.makedirs(d, exist_ok=True); p = os.path.join(d, 'in.xlsx'); wb.save(p)
    subprocess.run(['soffice','--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',os.path.join(d,'o'),p], check=True, capture_output=True, timeout=240)
    return openpyxl.load_workbook(os.path.join(d,'o','in.xlsx'), data_only=True)

# línea base: configuración soportada, con valores numéricos (las fórmulas de beta y deuda de mercado se fijan)
wb0 = openpyxl.load_workbook(hi)
w = wb0[IN]
for c, v in {'D20':'No','D21':'No','D22':'No','D48':'No','E34':3}.items(): w[c] = v
b0 = recalc(wb0, os.path.join(work,'base0'))
i0 = b0[IN]
BASE = dict(ebit0=i0['B4'].value, revenue0=i0['B8'].value, nol=i0['B16'].value, tax=i0['B17'].value, beta=i0['B25'].value, kd=i0['B26'].value,
            marketDebt=i0['B27'].value, shares=i0['D46'].value, price=i0['D47'].value, cash=i0['B13'].value, nonop=i0['B14'].value,
            rf=i0['D55'].value, erp=i0['D56'].value, gS=i0['C38'].value, mS=i0['C39'].value, drS=i0['C40'].value, betaS=i0['C41'].value,
            kdS=i0['C42'].value, rocS=i0['C43'].value, speed=i0['D39'].value, s2c=i0['E35'].value, anual=True, cagr=i0['E31'].value,
            growth=[b0[RGN][f'B{r}'].value for r in range(3, 13)])
print('base: valor por acción original (config soportada):', b0[DCF]['D45'].value)

def caso(nombre, **ed):
    p = copy.deepcopy(BASE); p.update(ed)
    wb = openpyxl.load_workbook(hi); w, g = wb[IN], wb[RGN]
    for c, v in {'D20':'No','D21':'No','D22':'No','D48':'No','E34':3,'E32':'No','E33':1.4077}.items(): w[c] = v
    m = {'B4':p['ebit0'],'B8':p['revenue0'],'B16':p['nol'],'B17':p['tax'],'B25':p['beta'],'B26':p['kd'],'B27':p['marketDebt'],'D46':p['shares'],'D47':p['price'],
         'B13':p['cash'],'B14':p['nonop'],'D55':p['rf'],'D56':p['erp'],'C38':p['gS'],'C39':p['mS'],'C40':p['drS'],'C41':p['betaS'],'C42':p['kdS'],'C43':p['rocS'],
         'D39':p['speed'],'E35':p['s2c'],'E30':'Yes' if p['anual'] else 'No','E31':p['cagr']}
    for c, v in m.items(): w[c] = v
    for k, v in enumerate(p['growth']): g[f'B{3+k}'] = v
    if p.get('opciones'):                                   # opciones: el valor (Black-Scholes) lo calcula la hoja Options; el motor lo recibe ya calculado
        for c, v in {'D48':'Yes','D49':p['opciones']['n'],'D50':p['opciones']['strike'],'D51':9,'D52':.6}.items(): w[c] = v
    r = recalc(wb, os.path.join(work, nombre)); d, i = r[DCF], r[IN]
    if p.get('opciones'): p['optionsValue'] = r['Options']['D27'].value
    cols = range(3, 13)
    row = lambda n: [d.cell(n, c).value for c in cols]
    return {'params': p, 'expected': {'revenue': row(3), 'margin': row(4), 'ebit': row(5), 'tax': row(6), 'nopat': row(7), 'fcff': row(11), 'nol': row(12),
        'taxRate': row(16), 'debtRatio': row(17), 'beta': row(18), 'kd': row(20), 'wacc': row(22), 'cum': row(31), 'pv': row(32),
        'terminalRevenue': d['M3'].value, 'terminalEbit': d['M5'].value, 'terminalFcff': d['M11'].value, 'terminalWacc': d['M22'].value, 'terminalNol': d['M12'].value,
        'terminalValue': d['M13'].value, 'pvFcff': d['D36'].value, 'pvTerminal': d['D37'].value, 'operatingAssets': d['D38'].value, 'firm': d['D40'].value,
        'equity': d['D42'].value, 'perShare': d['D45'].value}}
C = {
 'base_perdidas_ingresos_anuales': {},
 'cagr_constante': dict(anual=False, cagr=.25),
 'ebit_positivo_sin_nol': dict(ebit0=150.0, nol=0.0),
 'convergencia_lenta': dict(speed=3.0),
 'convergencia_rapida': dict(speed=.5),
 'estable_alterno': dict(gS=.025, mS=.22, drS=.2, betaS=1.0, kdS=.06, rocS=.12),
 'sales_to_capital_bajo': dict(s2c=1.5),
 'sales_to_capital_alto': dict(s2c=5.0),
 'impuesto_y_tasas': dict(tax=.25, rf=.045, erp=.055, kd=.07),
 'nol_consumido_antes_del_terminal': dict(nol=9000.0, mS=.30),
 'nol_residual_terminal': dict(nol=60000.0, mS=.30),
 'con_opciones': dict(opciones=dict(n=1.5, strike=100.0)),
 'sin_deuda': dict(marketDebt=0.0, kdS=.05, drS=0.0),
}
res = {n: caso(n, **e) for n, e in C.items()}
json.dump(res, open(os.path.join(out,'higrowth-cases.json'),'w'), indent=1, default=str)
for n, v in res.items(): print('HI', n, round(v['expected']['perShare'], 4))

# revgrowth (participación de mercado)
RV = {'base': {}, 'mercado_mayor': {'B3': 250000, 'B4': .05}, 'participacion_decreciente': {'B5': .02, 'B6': .015, 'B2': 90}}
resr = {}
for n, e in RV.items():
    wb = openpyxl.load_workbook(rv); ws = wb['Market Share approach']
    for k, v in e.items(): ws[k] = v
    r = recalc(wb, os.path.join(work, 'rv_' + n))['Market Share approach']
    resr[n] = {'inputs': {k: r[k].value for k in ['B2','B3','B4','B5','B6']}, 'expected': {k: r[k].value for k in ['B9','B10','B11','B12','B13']}}
json.dump(resr, open(os.path.join(out,'revgrowth-cases.json'),'w'), indent=1, default=str)
print('RV', {n: round(v['expected']['B13'], 5) for n, v in resr.items()})
