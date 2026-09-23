"""Populate the Modelo JMR workbook (LULU template) with Afya Ltd (AFYA) data.

All financial figures in R$ millions (IFRS). Sources:
  FY2017-2020: Form 20-F 2020 (selected data + consolidated statements)
  FY2021-2022: Form 20-F 2022 / 2023 (cash-flow restated lines from 20-F 2023)
  FY2023-2025: 4Q25 earnings release (6-K 12-Mar-2026) + 20-F 2025; FY2023 BS from XBRL (20-F 2023)
  LTM 2Q26  : FY2025 + 1H26 - 1H25 (6-K 13-Aug-2026 interim financial statements)
  Prices    : Nasdaq close (IBKR / Yahoo), converted at BCB PTAX (venda) of the same date.
"""
import sys
from xlsxpatch import Workbook

SRC, OUT = sys.argv[1], sys.argv[2]
wb = Workbook(SRC)
S = wb.set

YEARS = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]  # 2017..2025, LTM
HEAD = ["Dec '17", "Dec '18", "Dec '19", "Dec '20", "Dec '21", "Dec '22", "Dec '23", "Dec '24", "Dec '25", "LTM Jun '26"]


def row(sheet, r, vals, cols=YEARS):
    for c, v in zip(cols, vals):
        S(sheet, f"{c}{r}", v)


def clear_cols(sheet, rows, cols):
    for r in rows:
        for c in cols:
            S(sheet, f"{c}{r}", None)


NA = None
# ---------------------------------------------------------------- Income statement
IS = "Income Statement"
rev = [216.0, 333.9, 750.6, 1201.2, 1719.4, 2329.1, 2875.9, 3304.3, 3697.3, 3826.3]
cogs = [124.1, 168.1, 308.9, 434.7, 652.3, 859.6, 1109.8, 1215.6, 1313.9, 1376.6]
gp = [round(a - b, 1) for a, b in zip(rev, cogs)]
# SG&A incl. allowance for expected credit losses (2023+ presented separately; up to 2022 inside G&A)
sga = [45.4, 70.0, 239.1, 402.9, 622.6, 798.2, 1014.7, 1069.3, 1170.2, 1207.9]
da = [4.0, 9.1, 73.2, 108.7, 154.2, 206.2, 289.5, 333.3, 373.3, 370.5]
ebit = [49.3, 96.4, 205.3, 363.3, 440.9, 664.1, 767.1, 1012.1, 1213.1, 1246.8]
fin_inc = [5.2, 10.4, 51.7, 62.3, 64.6, 102.0, 110.6, 111.3, 194.9, 204.8]
fin_exp = [3.6, 8.2, 72.4, 98.3, 243.8, 349.9, 457.6, 458.7, 561.0, 574.4]
assoc = [0.0, 0.0, 2.4, 7.7, 11.8, 12.2, 9.5, 11.7, 13.9, 15.4]
ebt = [51.0, 98.7, 186.9, 335.1, 273.5, 428.4, 429.6, 676.4, 860.9, 892.6]
tax = [2.5, 4.0, 14.2, 27.1, 31.2, 35.7, 24.2, 27.5, 92.5, 94.7]
ni = [48.5, 94.7, 172.8, 308.0, 242.3, 392.8, 405.4, 648.9, 768.4, 797.9]
ni_p = [45.4, 86.4, 153.9, 292.1, 223.3, 373.6, 386.3, 631.5, 752.5, 782.3]
eps_b = [1.41, 1.84, 2.03, 3.15, 2.39, 4.14, 4.30, 7.01, 8.32, 8.73]
eps_d = [1.41, 1.81, 2.02, 3.12, 2.37, 4.12, 4.27, 6.93, 8.24, 8.66]
sh_b = [32.19, 46.94, 75.97, 92.68, 93.29, 90.34, 89.83, 90.12, 90.48, 89.61]
sh_d = [32.19, 47.78, 76.19, 93.64, 94.10, 90.66, 90.54, 91.15, 91.27, 90.33]
# period-end shares outstanding (issued - treasury); 2017-18 pre-IPO -> weighted average
sh_out = [32.19, 46.94, 89.744, 93.147, 92.068, 89.937, 89.949, 90.267, 89.868, 88.478]

S(IS, "A1", "='Input sheet'!A1")
S(IS, "A2", "Income Statement (R$ millones, IFRS)")
S(IS, "B2", "n.d.")
row(IS, 2, HEAD)
S(IS, "M2", None)
growth = [None] + [round(rev[i] / rev[i - 1] - 1, 4) for i in range(1, 9)] + [round(rev[9] / 3546.0 - 1, 4)]
# LTM growth vs LTM Jun-25 (FY24 + 1H25 - 1H24) = 3,304.3 + 1,855.8 - 1,570.9? -> use reported YoY of LTM base
row(IS, 3, rev)
row(IS, 4, growth)
row(IS, 5, cogs)
row(IS, 6, gp)
row(IS, 7, [round(g / r, 4) for g, r in zip(gp, rev)])
row(IS, 8, sga)
row(IS, 9, da)
row(IS, 10, [0.0] * 10)
row(IS, 11, [round(g - s - d - e, 1) for g, s, d, e in zip(gp, sga, da, ebit)])
row(IS, 12, ebit)
row(IS, 13, [round(e / r, 4) for e, r in zip(ebit, rev)])
row(IS, 14, fin_inc)
row(IS, 15, fin_exp)
row(IS, 16, [round(a - b, 1) for a, b in zip(fin_inc, fin_exp)])
row(IS, 17, assoc)
row(IS, 18, [round(a - b + c, 1) for a, b, c in zip(fin_inc, fin_exp, assoc)])
row(IS, 19, ebt)
row(IS, 20, tax)
row(IS, 21, ni)
row(IS, 22, ni_p)
row(IS, 23, eps_b)
row(IS, 24, eps_d)
row(IS, 25, sh_b)
row(IS, 26, sh_d)
row(IS, 27, sh_out)
ebitda = [round(e + d, 1) for e, d in zip(ebit, da)]
row(IS, 28, ebitda)
row(IS, 29, [round(t / b, 4) for t, b in zip(tax, ebt)])
row(IS, 30, [round(e / r, 4) for e, r in zip(ebitda, rev)])
clear_cols(IS, range(3, 31), ["B", "M"])
S(IS, "M2", "Guía 2026 (punto medio)")
S(IS, "M3", 4025.0)
S(IS, "M28", 1750.0)
S(IS, "A31", "Notas: FY2017-18 = predecesor pre-IPO (IPO jul-2019). SG&A incluye pérdidas crediticias esperadas. "
               "EBITDA = EBIT + D&A (IFRS 16, no es el EBITDA ajustado de la compañía: R$1.680 M en FY2025). "
               "Interest Expense = gastos financieros totales (incluye intereses de arrendamientos y de cuentas por pagar a vendedores). "
               "LTM = FY2025 + 1S26 - 1S25. Columna M: guía 2026 de la compañía (ingresos R$3.950-4.100 M; EBITDA ajustado R$1.700-1.800 M).")

# ---------------------------------------------------------------- Balance sheet
BS = "Balance Sheet"
cash = [25.5, 62.3, 943.2, 1045.0, 748.6, 1093.1, 553.0, 911.0, 1125.4, 1006.5]
ar = [28.5, 58.4, 125.4, 302.3, 378.4, 452.8, 546.4, 595.9, 717.4, 819.7]
tca = [60.5, 133.5, 1111.8, 1405.5, 1206.9, 1637.6, 1203.5, 1589.8, 1942.2, 1950.2]
ppe = [32.5, 65.8, 139.3, 260.4, 419.8, 542.1, 608.7, 658.5, 711.5, 701.6]
intang_tot = [4.7, 682.5, 1312.3, 2573.0, 3900.9, 4041.5, 4796.0, 5532.8, 5588.0, 5575.8]
goodwill = [None, None, None, None, None, 1257.0, 1334.7, 1526.7, 1526.7, 1526.7]
assoc_bs = [0.0, 0.0, 45.6, 51.4, 48.4, 53.9, 51.8, 54.4, 46.5, 55.0]
ta = [103.6, 918.4, 2912.5, 4793.1, 6447.4, 7199.6, 7584.5, 8829.5, 9357.9, 9326.6]
ap = [6.7, 8.1, 17.6, 35.7, 59.1, 71.5, 108.2, 128.1, 123.6, 146.0]
# short-term debt = loans (current) + payable to selling shareholders (current) + notes payable (current)
std = [1.2, 26.8 + 88.9, 53.6 + 131.9, 107.2 + 188.4 + 10.5, 128.7 + 239.8 + 14.5, 145.2 + 261.7 + 62.2,
       179.3 + 354.0, 363.6 + 185.3, 60.7 + 110.6, 126.4 + 55.8]
lease_c = [0.0, 0.0, 22.7, 62.0, 25.0, 32.5, 36.9, 45.6, 55.8, 57.6]
adv = [8.3, 13.7, 36.9, 63.8, 114.6, 133.1, 153.5, 161.0, 158.0, 104.3]
tcl = [51.9, 182.3, 333.2, 589.4, 766.5, 905.8, 1058.6, 1140.2, 884.0, 885.9]
ltd = [2.7, 51.0 + 88.9, 6.8 + 168.4, 510.3 + 329.8 + 65.7, 1246.2 + 440.0 + 58.2, 1737.7 + 267.0,
       1621.5 + 212.9, 1831.6 + 345.5, 1993.6 + 330.0, 1921.5 + 296.8]
lease_nc = [0.0, 0.0, 261.8, 385.7, 689.1, 737.1, 837.7, 932.8, 1010.0, 1012.7]
tncl = [4.9, 145.7, 465.5, 1369.9, 2680.9, 3043.8, 2882.9, 3378.8, 3582.7, 3511.9]
tl = [56.9, 328.1, 798.7, 1959.3, 3447.4, 3949.6, 3941.5, 4519.0, 4466.7, 4397.8]
apic = [2.9, 440.0, 1931.3, 2323.5, 2375.3, 2375.3, 2365.2, 2344.5, 2320.4, 2295.6]
eq_p = [46.7, 502.0, 2065.1, 2782.2, 2948.1, 3198.8, 3601.5, 4270.0, 4851.8, 4888.6]
eq_t = [46.7, 590.4, 2113.7, 2833.8, 3000.0, 3250.1, 3643.0, 4310.6, 4891.2, 4928.8]

S(BS, "A2", "Assets (R$ millones)")
S(BS, "B2", "n.d.")
row(BS, 2, HEAD)
row(BS, 3, cash)
row(BS, 4, [0.0] * 10)
row(BS, 5, cash)
row(BS, 6, ar)
row(BS, 8, ar)
row(BS, 9, [round(t - c - a, 1) for t, c, a in zip(tca, cash, ar)])
row(BS, 10, tca)
row(BS, 11, ppe)
row(BS, 12, [round(t - (g or 0), 1) for t, g in zip(intang_tot, goodwill)])
row(BS, 13, [g if g is not None else 0.0 for g in goodwill])
row(BS, 14, assoc_bs)
row(BS, 15, [round(a - t - p - i - s, 1) for a, t, p, i, s in zip(ta, tca, ppe, intang_tot, assoc_bs)])
row(BS, 16, ta)
row(BS, 18, ap)
row(BS, 20, [round(x, 1) for x in std])
row(BS, 21, lease_c)
row(BS, 22, adv)
row(BS, 23, [round(t - a - s - l - d, 1) for t, a, s, l, d in zip(tcl, ap, std, lease_c, adv)])
row(BS, 24, tcl)
row(BS, 25, [round(x, 1) for x in ltd])
row(BS, 26, lease_nc)
row(BS, 27, [round(t - l - n, 1) for t, l, n in zip(tncl, ltd, lease_nc)])
row(BS, 28, tncl)
row(BS, 29, tl)
row(BS, 31, apic)
row(BS, 32, [0.0] * 10)
row(BS, 33, [round(p - a, 1) for p, a in zip(eq_p, apic)])
row(BS, 34, eq_p)
row(BS, 35, eq_t)
row(BS, 36, ta)
for r in (7, 19):
    for c in YEARS + ["B", "M"]:
        S(BS, f"{c}{r}", None)
clear_cols(BS, range(3, 37), ["B", "M"])
S(BS, "M17", None)
S(BS, "M30", None)
S(BS, "A38", "Notas: Short-Term/Long-Term Debt incluyen préstamos y financiamiento + cuentas por pagar a accionistas vendedores "
               "(deuda por adquisiciones) + notes payable, igual que la definición de deuda neta de la compañía. Leases = pasivo IFRS 16. "
               "Goodwill separado desde 2022 (nota de intangibles); antes está dentro de Net Intangible Assets. "
               "Long-Term Investments = inversión en asociada (UEPC). Other Long-Term Assets incluye derechos de uso (ROU). "
               "Retained Earnings incluye acciones en tesorería y reserva de pagos en acciones. Total Shareholders' Equity incluye minoritarios.")

# ---------------------------------------------------------------- Cash flow
CF = "Cash Flow Statement"
cfo = [39.9, 80.3, 299.2, 371.5, 630.9, 843.9, 1043.6, 1432.7, 1531.6, 1557.8]
sbc = [0.0, 2.2, 18.1, 32.6, 43.4, 31.3, 31.5, 32.4, 15.3, 22.0]
d_ar = [-9.8, -28.2, -35.6, -164.3, -79.7, -129.2, -131.3, -97.4, -177.6, -204.5]
d_ap = [-2.4, -1.5, 3.0, 4.5, 14.5, 10.0, 24.5, 18.1, -4.5, 11.7]
d_adv = [-1.6, 2.1, 19.3, -2.0, 36.0, 8.4, -17.9, 6.3, -3.0, -4.5]
capex = [21.1, 21.7, 121.7, 137.6, 276.8, 297.0, 245.4, 392.6, 364.0, 298.9]
acq = [0.0, 221.3, 241.6, 914.0, 1005.0, 277.6, 836.0, 627.6, 144.1, 144.3]
cfi = [-22.1, -262.4, -354.1, -1042.8, -1274.1, -591.5, -1143.1, -1091.6, -507.1, -435.6]
debt_in = [0.0, 75.0, 7.4, 605.0, 809.5, 496.9, 5.3, 491.6, 1494.9, 1494.9]
debt_out = [-1.1, -6.5, -75.1, -155.1, -107.8, -1.8, -112.6, -128.7, -1624.9, -1628.6]
eq_in = [0.0, 156.3, 1080.7, 374.9, 33.3, 0.0, 9.8, 9.4, 25.7, 11.4]   # capital increases/IPO net of costs + option exercises
buyb = [0.0, 0.0, 0.0, 0.0, -213.7, -152.3, -12.4, 0.0, -77.0, -210.0]
div_p = [-2.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -129.6, -307.4]      # dividends to Afya shareholders
cff = [-4.1, 218.8, 921.4, 756.4, 364.7, 92.9, -439.9, 24.0, -808.3, -1212.8]
leases = [0.0, 0.0, 39.8, 55.5, 87.8, 113.5, 135.4, 152.8, 170.9, 179.5]  # principal + interest
int_paid = [0.0, 0.0, 0.0, 0.0, 62.4, 140.2, 247.4, 256.1, 323.8, 377.7]  # loans/sellers, financing + investing
netchg = [13.7, 36.8, 880.9, 101.8, -296.5, 344.5, -540.1, 358.0, 214.4, -92.6]

S(CF, "A2", "Operating Activities (R$ millones)")
S(CF, "B2", "n.d.")
row(CF, 2, HEAD)
row(CF, 3, ni)
row(CF, 4, da)
row(CF, 5, sbc)
row(CF, 6, [round(c - n - d - s - a - p - v, 1) for c, n, d, s, a, p, v in zip(cfo, ni, da, sbc, d_ar, d_ap, d_adv)])
row(CF, 7, d_ar)
row(CF, 8, d_ap)
row(CF, 11, d_adv)
row(CF, 13, cfo)
row(CF, 15, [-x for x in capex])
row(CF, 19, [-x for x in acq])
row(CF, 21, [round(i + c + a, 1) for i, c, a in zip(cfi, capex, acq)])
row(CF, 22, cfi)
row(CF, 26, debt_in)
row(CF, 27, debt_out)
row(CF, 28, [round(a + b, 1) for a, b in zip(debt_in, debt_out)])
row(CF, 29, eq_in)
row(CF, 30, buyb)
row(CF, 31, [round(a + b, 1) for a, b in zip(eq_in, buyb)])
row(CF, 32, div_p)
row(CF, 33, [round(t - (a + b) - (c + d) - e, 1) for t, a, b, c, d, e in zip(cff, debt_in, debt_out, eq_in, buyb, div_p)])
row(CF, 34, cff)
fcf = [round(c - x - l - i, 1) for c, x, l, i in zip(cfo, capex, leases, int_paid)]
row(CF, 36, fcf)
row(CF, 37, [round(e * (1 - t / b), 1) for e, t, b in zip(ebit, tax, ebt)])
row(CF, 38, fcf)
row(CF, 39, [round(c - x - l, 1) for c, x, l in zip(cfo, capex, leases)])
row(CF, 40, netchg)
for r in (9, 10, 12, 16, 17, 18, 20, 24, 25):
    for c in YEARS:
        S(CF, f"{c}{r}", 0.0)
clear_cols(CF, range(3, 41), ["B", "M"])
for r in (14, 23, 35):
    S(CF, f"M{r}", None)
S(CF, "A35", "Free Cash Flow (definición del modelo AFYA)")
S(CF, "A36", "Free Cash Flow = FCO - capex - arrendamientos - intereses pagados")
S(CF, "A38", "Levered Free Cash Flow (= fila 36)")
S(CF, "A39", "FCF antes de intereses financieros (FCO - capex - arrendamientos)")
S(CF, "A42", "Notas: AFYA clasifica intereses pagados (préstamos, vendedores y arrendamientos) en actividades de financiación/inversión, "
               "por eso el FCO reportado (fila 13) excluye ~R$500 M/año de intereses y pagos de arrendamiento. La fila 36 los descuenta para que "
               "P/FCF y FCF yield sean comparables con emisores US GAAP. 2017-2020: intereses pagados no separados en el estado de flujos (n.d.). "
               "Capex = propiedades y equipo + intangibles (incluye licencias de plazas compradas). Dividendos: solo a accionistas de Afya "
               "(los de minoritarios van en Other Financing). LTM = FY2025 + 1S26 - 1S25.")

# ---------------------------------------------------------------- Trailing valuation: year-end prices in R$
TV = "Trailing Valuation"
# Nasdaq close (US$) x BCB PTAX venda same date
px = ["n.d.", "n.d.", round(27.12 * 4.0307, 2), round(25.30 * 5.1967, 2), round(15.71 * 5.5805, 2),
      round(15.62 * 5.2177, 2), round(21.93 * 4.8413, 2), round(15.88 * 6.1923, 2), round(15.41 * 5.5024, 2),
      round(13.49 * 5.1161, 2)]
S(TV, "B2", "n.d.")
row(TV, 2, HEAD)
S(TV, "B3", "n.d.")
row(TV, 3, px)
S(TV, "A3", "Stock Price (R$ = cierre Nasdaq US$ x PTAX)")
S(TV, "A27", "Precios: cierre Nasdaq del último día hábil del año (US$27,12; 25,30; 15,71; 15,62; 21,93; 15,88; 15,41) y 22-sep-2026 (US$13,49), "
               "convertidos con PTAX venta del BCB (4,0307; 5,1967; 5,5805; 5,2177; 4,8413; 6,1923; 5,5024; 5,1161). 2017-18: sin cotización (pre-IPO).")

# ---------------------------------------------------------------- Forward valuation: no verified consensus
FV = "Forward Valuation"
S(FV, "A2", "Forward Valuation")
for r in range(3, 14):
    for c in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"]:
        S(FV, f"{c}{r}", None)
S(FV, "A15", "No poblado: el libro de LULU traía múltiplos forward de un proveedor de consenso. Para AFYA no se dispuso de un consenso "
               "verificable a la fecha de corte; ninguna fórmula del modelo lee esta hoja.")

# ---------------------------------------------------------------- Dividends (DPS paid in each calendar year, R$)
DV = "Dividendos"
for c, h in zip(["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
                ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "Próximo (proxy)"]):
    S(DV, f"{c}2", h)
dps = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.348923, 3.446838]
for c, v in zip(["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"], dps):
    S(DV, f"{c}4", v)
S(DV, "J3", round(1.348923 / 84.79, 4))
S(DV, "K3", round(3.446838 / 69.02, 4))
S(DV, "J5", 0.20)
S(DV, "K5", 0.40)
S(DV, "A7", "DPS en R$ por el año en que se pagó: R$1,348923 (pagado 4-abr-2025, 20% de la utilidad 2024) y R$3,446838 (pagado 6-abr-2026, "
              "40% de la utilidad 2025). La columna K usa el último dividendo declarado como proxy del próximo; no es una guía de la compañía.")

# ---------------------------------------------------------------- Input sheet
IN = "Input sheet"
S(IN, "A1", "Afya Limited (NASDAQ:AFYA)")
S(IN, "D1", '=IFERROR(__xludf.DUMMYFUNCTION("GOOGLEFINANCE(REGEXEXTRACT(A1,""\\(.*?:(.*?)\\)""),""price"")*GOOGLEFINANCE(""CURRENCY:USDBRL"")"),69.02)')
S(IN, "C1", "Precio (R$)")
S(IN, "B4", 46288)          # 2026-09-23 as Excel serial
S(IN, "B5", "Afya Limited")
S(IN, "B8", "Brazil")
S(IN, "B9", "Education")
S(IN, "B10", "Education")
S(IN, "B17", "No")
S(IN, "B18", "No")
S(IN, "B20", "='Balance Sheet'!L14")
S(IN, "B21", "='Balance Sheet'!L35-'Balance Sheet'!L34")
S(IN, "C21", "='Balance Sheet'!K35-'Balance Sheet'!K34")
S(IN, "B24", 0.15)
S(IN, "B25", 0.20)
S(IN, "B27", 0.07)
S(IN, "B28", 0.315)
S(IN, "B29", 0.065)
S(IN, "B30", 0.32)
S(IN, "B31", 5)
S(IN, "B32", 2.5)
S(IN, "B33", 2.5)
S(IN, "B35", 0.1212)
S(IN, "B38", "No")
S(IN, "B39", 0)
S(IN, "B40", 0)
S(IN, "B41", 0)
S(IN, "B42", 0)
S(IN, "B46", "No")
S(IN, "B49", "No")
S(IN, "B52", "No")
S(IN, "B57", "No")
S(IN, "B60", "No")
S(IN, "B62", "No")
S(IN, "B63", 0)
S(IN, "B65", "No")
S(IN, "B68", "Yes")
S(IN, "B69", 0.06)
S(IN, "B71", "No")
S(IN, "E23", "Modelo en reales (R$): estados IFRS de AFYA en R$ y precio Nasdaq convertido a R$ con USDBRL. Tasa libre de riesgo en R$ = "
              "Tesouro Prefixado ~10 años (14,25%, 18-sep-2026) menos spread de default de Brasil (2,13%, Damodaran ene-2026) = 12,12%.")

# ---------------------------------------------------------------- Cost of capital
CC = "Cost of capital worksheet"
S(CC, "B12", "Detailed")
S(CC, "B22", "Single Business(Global)")
S(CC, "B26", "Operating countries")
S(CC, "B27", 0.0747)
for r in (6, 7, 8, 9):
    S(CC, f"H{r}", None)
S(CC, "H9", "='Input sheet'!B12")
S(CC, "H23", 0)
S(CC, "H29", 0)
S(CC, "H31", 0)
S(CC, "H37", 0)
S(CC, "B33", 3.7)
S(CC, "B34", "Direct Input")
S(CC, "B35", 0.151)
S(CC, "B13", 0.17)

# ---------------------------------------------------------------- Scenario inputs (Valuation output hard-coded cells)
VO = "Valuation output"
S(VO, "C45", 0.28)     # conservative target margin
S(VO, "C47", 0.34)     # optimistic target margin
for c, v in zip(["C", "D", "E", "F", "G"], [0.05, 0.035, 0.035, 0.035, 0.035]):
    S(VO, f"{c}55", v)
S(VO, "C57", 0.30)
for c, v in zip(["C", "D", "E", "F", "G"], [0.09, 0.085, 0.085, 0.085, 0.085]):
    S(VO, f"{c}106", v)
S(VO, "C108", 0.325)

# ---------------------------------------------------------------- Weighting
RV = "Resumen de Valoración"
S(RV, "G3", "Madura")
S(RV, "G4", 0.3)

wb.save(OUT)
print("patched cells:", len(wb.log))
