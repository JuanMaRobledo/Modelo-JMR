"""Genera casos de paridad contra el workbook original fcffsimpleginzu.xlsx.
Uso: python3 -I scripts/v2-ginsu-reference.py <ginzu.xlsx> <dir_trabajo> <salida.json>
Modifica solo COPIAS del original (nunca el archivo de referencia), recalcula con LibreOffice
y exporta insumos + resultados del workbook. Es solo herramienta de prueba (no motor)."""
import sys, os, json, shutil, subprocess, openpyxl

src, work, out = sys.argv[1:4]
os.makedirs(work, exist_ok=True)
CASES = {
 'almarai_base': {},
 'crecimiento_variable': {'B26':.15,'B28':.10,'B27':.12,'B29':.18,'B30':5,'B31':1.5,'B32':2.0},
 'ebit_negativo_transicion': {'B26':.30,'B28':.25,'B27':-.10,'B29':.14,'B30':7,'B31':1.2,'B32':1.6},
 'nol': {'B26':.12,'B28':.10,'B27':.05,'B29':.15,'B30':4,'B31':1.4,'B32':1.8,'B61':'Yes','B62':900},
 'impuestos_efectivo_vs_marginal': {'B23':.30,'B24':.21,'B26':.08,'B28':.07,'B27':.15,'B29':.18,'B30':6,'B31':1.1,'B32':1.1},
 'convergencia_roic_terminal': {'B26':.10,'B28':.09,'B27':.12,'B29':.20,'B30':8,'B31':1.0,'B32':1.3,'B48':'Yes','B49':.14},
 'costo_capital_override_y_g_negativo': {'B26':.05,'B28':.04,'B27':.10,'B29':.10,'B30':3,'B31':2.0,'B32':2.0,'B45':'Yes','B46':.085,'B67':'Yes','B68':.01},
 'probabilidad_fracaso': {'B26':.20,'B28':.18,'B27':.02,'B29':.12,'B30':6,'B31':1.0,'B32':1.0,'B51':'Yes','B52':.15,'B53':'V','B54':.4},
}
res = {}
for name, edits in CASES.items():
    wb = openpyxl.load_workbook(src)
    ws = wb['Input sheet']
    ws['B35'] = .07055015741  # WACC inicial fijo: evita depender del worksheet circular de costo de capital
    for k, v in edits.items(): ws[k] = v
    d = os.path.join(work, name); os.makedirs(d, exist_ok=True)
    p = os.path.join(d, 'in.xlsx'); wb.save(p)
    subprocess.run(['soffice','--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',os.path.join(d,'o'),p],
                   check=True, capture_output=True, timeout=240)
    r = openpyxl.load_workbook(os.path.join(d,'o','in.xlsx'), data_only=True)
    i, o = r['Input sheet'], r['Valuation output']
    res[name] = {
      'inputs': {k: i[k].value for k in ['B11','B15','B18','B19','B20','B21','B23','B24','B26','B27','B28','B29','B30','B31','B32','B34','B35','B52','B54','B62']},
      'derived': {'waccTerminal': o['M12'].value, 'gTerminal': o['M2'].value, 'roicTerminal': o['M40'].value,
                  'nolInicial': o['B10'].value, 'pFalla': o['B22'].value, 'proceeds': o['B23'].value},
      'expected': {'perShare': o['B33'].value, 'terminalValue': o['B18'].value, 'sumPV': o['B20'].value, 'pvTerminal': o['B19'].value,
                   'equity': o['B29'].value, 'reinv': [o.cell(8,c).value for c in range(3,13)],
                   'nopat': [o.cell(7,c).value for c in range(3,13)], 'fcff': [o.cell(9,c).value for c in range(3,13)],
                   'taxRate': [o.cell(6,c).value for c in range(3,13)]},
    }
json.dump(res, open(out,'w'), indent=1, default=str)
print({k: v['expected']['perShare'] for k, v in res.items()})
