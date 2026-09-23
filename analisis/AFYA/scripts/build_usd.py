"""Third pass: currency selector (USD/BRL) for the valuation summary. Engine stays in R$."""
import sys
from lxml import etree
from xlsxpatch import Workbook, N

SRC, OUT = sys.argv[1], sys.argv[2]
wb = Workbook(SRC)
S = wb.set
RV, IN, PR = "Resumen de Valoración", "Input sheet", "Presentación"
R = "'Resumen de Valoración'!"

# FX USDBRL: live in Google Sheets, fallback = PTAX venta 22-sep-2026
S(IN, "F1", "USDBRL")
S(IN, "G1", '=IFERROR(__xludf.DUMMYFUNCTION("GOOGLEFINANCE(""CURRENCY:USDBRL"")"),5.1161)')

# selector + factor (R$ -> moneda del resumen)
S(RV, "I2", "Moneda del resumen (USD/BRL)")
S(RV, "J2", "USD")
S(RV, "K2", "Tipo de cambio USDBRL")
S(RV, "L2", "='Input sheet'!G1")
S(RV, "M2", "Factor")
S(RV, "N2", '=IF(J2="USD",1/L2,1)')
S(RV, "I3", "El motor (DCF y múltiplos) calcula en R$; aquí se convierte todo al tipo de cambio de L2 (en vivo en Google Sheets). "
             "CAGR y MOS no cambian porque precio y objetivos usan el mismo tipo de cambio.")

S(RV, "A5", '="Método ("&IF($J$2="USD","US$","R$")&" por acción)"')
S(RV, "B3", "='Input sheet'!B23*$N$2")
src = {6: ("'Valuation output'!B86", "'Valuation output'!B35", "'Valuation output'!B137")}
for r, sh in [(7, "EVEBITDA"), (8, "EVFCFF"), (9, "PE"), (10, "PFCFE"), (11, "POCF")]:
    src[r] = (f"{sh}!$H$12", f"{sh}!$H$23", f"{sh}!$H$34")
for r, (c, d, e) in src.items():
    S(RV, f"C{r}", f"={c}*$N$2")
    S(RV, f"D{r}", f"={d}*$N$2")
    S(RV, f"E{r}", f"={e}*$N$2")
S(RV, "B24", "='Input sheet'!D1*$N$2")
S(RV, "C25", "='Input sheet'!D1*$N$2")
S(RV, "A21", '="RESUMEN RÁPIDO ("&IF($J$2="USD","US$","R$")&")"')

# Presentación: price card follows the summary currency
S(PR, "B7", f"={R}B24")
S(PR, "B9", f'="Cifras en "&IF({R}$J$2="USD","US$ (USDBRL "&TEXT({R}$L$2,"0.0000")&")","R$")&" por acción"')

# sheets that are labelled in R$ keep R$ regardless of the selector
for sh, cells in [("Tesis de Inversión y Supuestos", ["C25", "C26", "C27"]), ("Cualitativo", ["B26", "C26", "D26"]),
                  ("Estadísticas", ["E12"])]:
    col_map = {"C25": "C12", "C26": "D12", "C27": "E12", "B26": "C12", "D26": "E12", "E12": "D12"}
    for c in cells:
        tgt = col_map[c] if not (sh == "Cualitativo" and c == "C26") else "D12"
        S(sh, c, f"={R}{tgt}/{R}$N$2")

# dropdown USD/BRL on J2
p = wb.sheet_paths[RV]
root = wb._tree(RV)
dvs = root.find(N + "dataValidations")
if dvs is None:
    dvs = etree.Element(N + "dataValidations")
    # schema order: dataValidations goes after conditionalFormatting / before hyperlinks, printOptions, pageMargins...
    anchor = None
    for tag in ("hyperlinks", "printOptions", "pageMargins", "pageSetup", "headerFooter", "drawing", "legacyDrawing", "tableParts", "extLst"):
        anchor = root.find(N + tag)
        if anchor is not None:
            break
    if anchor is not None:
        anchor.addprevious(dvs)
    else:
        root.append(dvs)
dv = etree.SubElement(dvs, N + "dataValidation", type="list", allowBlank="1", showErrorMessage="1", sqref="J2")
f1 = etree.SubElement(dv, N + "formula1")
f1.text = '"USD,BRL"'
dvs.set("count", str(len(dvs)))

wb.save(OUT)
print("patched", len(wb.log))
