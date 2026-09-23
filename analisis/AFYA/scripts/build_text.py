"""Second pass: exit multiples, reference sheets and narrative text for AFYA."""
import sys
from xlsxpatch import Workbook

SRC, OUT = sys.argv[1], sys.argv[2]
wb = Workbook(SRC)
S = wb.set

# ------------------------------------------------ exit multiples (J8/J19/J30 = conservador/base/optimista)
# Rule: conservador = 0,9x múltiplo actual; base = múltiplo actual (precio 22-sep-2026 sobre métricas FY2025 del modelo);
#       optimista = múltiplo al cierre de FY2025 (31-dic-2025) sobre las mismas métricas.
mult = {"EVEBITDA": (4.9, 5.4, 6.3), "EVFCFF": (7.2, 8.0, 9.4), "PE": (7.2, 8.0, 9.9),
        "PFCFE": (8.9, 9.8, 12.3), "POCF": (4.9, 5.5, 6.8)}
for sh, (c, b, o) in mult.items():
    S(sh, "J8", c)
    S(sh, "J19", b)
    S(sh, "J30", o)

SM = "Supuestos de los Múltiplos"
S(SM, "B5", "Conservador (0,9x actual)")
S(SM, "C5", "Base (múltiplo actual)")
S(SM, "D5", "Optimista (múltiplo cierre FY2025)")
S(SM, "A3", "Múltiplos de salida FY+3 fijados manualmente (celdas J8/J19/J30 de cada hoja). Regla AFYA: base = múltiplo actual "
             "(precio R$69,02 del 22-sep-2026 sobre métricas FY2025 con las definiciones del propio modelo), conservador = 0,9x la base, "
             "optimista = múltiplo al cierre del 31-dic-2025. Las columnas F-M son solo referencia y no alimentan el resultado.")
S(SM, "A12", "Advertencia: EV/EBITDA y EV/FCFF convierten valor empresa en 'precio' dividiendo por acciones sin restar deuda neta "
              "(R$2.464 M con IFRS 16 al 30-jun-2026, ~R$27,9 por acción). Para AFYA esto sobrestima esos dos métodos.")

# ------------------------------------------------ Sector: only AFYA populated
SE = "Sector"
S(SE, "A2", "Afya Limited")
S(SE, "B2", "AFYA")
S(SE, "C2", "='Trailing Valuation'!L5")
S(SE, "D2", "='Income Statement'!L7")
S(SE, "E2", None)
S(SE, "F2", "='Trailing Valuation'!L13")
S(SE, "G2", "='Trailing Valuation'!L24")
S(SE, "H2", "='Trailing Valuation'!L16")
S(SE, "I2", "='Trailing Valuation'!L21")
S(SE, "J2", "='Trailing Valuation'!L15")
S(SE, "K2", "='Income Statement'!L13")
S(SE, "L2", "=('Income Statement'!K3/'Income Statement'!H3)^(1/3)-1")
S(SE, "M2", "=('Income Statement'!K3/'Income Statement'!F3)^(1/5)-1")
S(SE, "N2", None)
peers = [("Yduqs Participações", "YDUQ3"), ("Cogna Educação", "COGN3"), ("Cruzeiro do Sul Educacional", "CSED3"),
         ("Ser Educacional", "SEER3"), ("Ânima Holding", "ANIM3")]
for i, (n, t) in enumerate(peers, start=3):
    S(SE, f"A{i}", n)
    S(SE, f"B{i}", t)
    for c in "CDEFGHIJKLMN":
        S(SE, f"{c}{i}", None)
S(SE, "A9", "Pares brasileños listados (B3) sin métricas: no se verificaron sus estados y cotizaciones a la fecha de corte. "
            "Mientras estén vacíos, promedios y medianas de 'Industria' reflejan solo a AFYA y no deben leerse como referencia sectorial.")

# ------------------------------------------------ Estadísticas: replace hard-coded LULU values
ES = "Estadísticas"
S(ES, "A1", "=UPPER('Input sheet'!A1)&\" | ESTADÍSTICAS Y MÉTRICAS FINANCIERAS (R$ MILLONES)\"")
S(ES, "B8", "9.395 empleados al 31-dic-2025 (20-F 2025)")
S(ES, "B14", "='Income Statement'!L19/'Income Statement'!L3")
S(ES, "H4", "=('Income Statement'!K3/'Income Statement'!H3)^(1/3)-1")
S(ES, "H5", "=('Income Statement'!K3/'Income Statement'!F3)^(1/5)-1")
S(ES, "G6", "Crec. Ingresos 8 Años 2017-2025 (Rev 8Yr)")
S(ES, "H6", "=('Income Statement'!K3/'Income Statement'!C3)^(1/8)-1")
S(ES, "H7", "=('Income Statement'!K24/'Income Statement'!H24)^(1/3)-1")
S(ES, "H8", "=('Income Statement'!K24/'Income Statement'!F24)^(1/5)-1")
S(ES, "H9", "n.d. (historia desde 2017)")
S(ES, "H10", "=('Cash Flow Statement'!K36/'Cash Flow Statement'!F36)^(1/5)-1")
S(ES, "H11", "=('Income Statement'!K27/'Income Statement'!F27)^(1/5)-1")
S(ES, "H12", "=('Financials Multiples'!F43/'Financials Multiples'!D43)^(1/2)-1")
S(ES, "H13", "=('Financials Multiples'!F57/'Financials Multiples'!D57)^(1/2)-1")
S(ES, "H14", "=('Financials Multiples'!F72/'Financials Multiples'!D72)^(1/2)-1")
S(ES, "H15", "n.d. (sin consenso verificado)")
S(ES, "H18", "=Dividendos!K3")
S(ES, "H19", "=Dividendos!K5")
S(ES, "H20", "=Dividendos!K4")
for r in (21, 22, 23, 24):
    S(ES, f"H{r}", "n.d. (primer dividendo pagado en 2025)")

# ------------------------------------------------ Supuestos recomendados
SR = "Supuestos Recomendados"
S(SR, "A3", "Supuestos del escenario base AFYA (R$ nominales). Base: guía 2026 y crecimiento por ticket e inflación; "
             "conservador y optimista se fijan en 'Valuation output' (C55:G55, C57, C45 y C106:G106, C108, C47).")
rec = [
    (6, 0.07, "Próximos 12 meses sobre LTM jun-2026 (R$3.826 M). Guía 2026: R$3.950-4.100 M (+6,8% a +10,9% sobre 2025); 1S26 creció 7,0%.",
     "=MIN('Income Statement'!G4:K4)", "=MAX('Income Statement'!G4:K4)", "='Input sheet'!M26", "='Input sheet'!K26"),
    (7, 0.315, "Guía de EBITDA ajustado 2026 (R$1.700-1.800 M) implica margen ~43-44% vs 45,4% en 2025 por el ciclo de inversión; "
               "margen EBIT IFRS equivalente ~31-32% vs 32,6% LTM.",
     "=MIN('Income Statement'!G13:K13)", "=MAX('Income Statement'!G13:K13)", "='Input sheet'!M27", "='Input sheet'!K27"),
    (8, 0.065, "Ticket de medicina +3,9% (1S26) más alumnos de salud +18% y maduración residual de plazas; "
               "sin nuevas adquisiciones ni plazas adicionales de Mais Médicos.",
     "=MIN('Income Statement'!G4:K4)", "=MAX('Income Statement'!G4:K4)", "='Input sheet'!M26", "='Input sheet'!K26"),
    (9, 0.32, "Recuperación parcial hacia el 32,8% de 2025 cuando madure el ciclo de inversión en educación continua y soluciones médicas.",
     "=MIN('Income Statement'!G13:K13)", "=MAX('Income Statement'!G13:K13)", "='Input sheet'!M27", "='Input sheet'!K27"),
    (10, 5, "Cinco años: el ciclo de inversión anunciado para 2026 es operativo, no estructural.", None, None, None, None),
    (11, 2.5, "Crecimiento mayormente por precio y ocupación de plazas ya autorizadas; capex 2026 R$340-380 M (~9% de ingresos) "
              "y capital invertido dominado por goodwill y licencias.", None, None, "='Input sheet'!M28", "='Input sheet'!K28"),
    (12, 2.5, "Sin cambio en años 6-10; la reinversión terminal la fija la regla ROIC = costo de capital del motor.", None, None, None, None),
]
for r, c, d, e, f, g, h in rec:
    S(SR, f"C{r}", c)
    S(SR, f"D{r}", d)
    S(SR, f"E{r}", e)
    S(SR, f"F{r}", f)
    S(SR, f"G{r}", g)
    S(SR, f"H{r}", h)

# ------------------------------------------------ Stories to Numbers
ST = "Stories to Numbers"
S(ST, "A3", "¿Máquina de caja regulada que madura o plataforma médica que todavía reinvierte con retorno?")
S(ST, "A4", "Afya es el mayor grupo de educación médica de Brasil por plazas (3.785 autorizadas; 26.421 alumnos de medicina a jun-2026). "
            "Cobra matrículas mensuales con ticket neto de ~R$9.443 y convierte ~88% del EBITDA ajustado en caja operativa. "
            "La historia de valoración depende de tres cosas: que el ticket siga al menos a la inflación, que ENAMED no recorte plazas "
            "de forma permanente y que el ciclo de inversión en educación continua y soluciones para médicos recupere margen.")
S(ST, "G10", "Año 1 = guía 2026; años 2-5 = ticket ~inflación + alumnos de salud; terminal 6% nominal en R$ (≈ inflación implícita, sin crecimiento real).")
S(ST, "G11", "Margen EBIT IFRS 32,6% LTM; 31,5% año 1 por ciclo de inversión; objetivo 32%.")
S(ST, "G12", "Tasa efectiva 15% (piso Pilar Dos) convergiendo a 20% marginal: PROUNI reduce impuestos, pero no es permanente.")
S(ST, "G13", "2,5x: crecimiento con plazas ya autorizadas y capex de ~9% de ingresos.")
S(ST, "G14", "ROIC incremental alto; ROIC total bajo por goodwill y licencias adquiridas.")
S(ST, "G15", "WACC en R$ con tasa libre de riesgo local (12,12%) y ERP Brasil 7,47%.")

# ------------------------------------------------ Tesis de Inversión y Supuestos (rewrite)
TE = "Tesis de Inversión y Supuestos"
for r in range(1, 42):
    for c in "ABCDEFGH":
        S(TE, f"{c}{r}", None)
T = {
    "A1": "AFYA LIMITED (AFYA) — Tesis de Inversión: De la Historia a los Números",
    "A2": "Metodología Damodaran (NYU Stern) | Modelo en R$ | Precio: R$69,02 = US$13,49 (cierre Nasdaq 22-sep-2026) x PTAX 5,1161 | WACC inicial 17,25% (R$)",
    "A4": "1. LA HISTORIA",
    "A5": "Afya forma médicos en 37 unidades de pregrado operativas en Brasil (3.785 plazas de medicina autorizadas) y los acompaña después con cursos de preparación "
          "para residencia, posgrado y software clínico. El negocio de pregrado es regulado, de oferta limitada y con alta visibilidad de ingresos; "
          "2026 es un año de inversión en productos digitales y la regulación (ENAMED) introdujo por primera vez recortes de plazas.",
    "A7": "Caso alcista (Bull)", "B7": "Caso bajista (Bear)",
    "A8": "Oferta regulada y escasa: 3.785 plazas autorizadas; ticket neto de medicina +3,9% en 1S26 y 26.421 alumnos (+2,7%).",
    "B8": "ENAMED: 12 cursos de Afya bajo supervisión del MEC y 6 con recorte cautelar de 25% de plazas (mar-2026) hasta el próximo ciclo.",
    "A9": "Caja: FCO LTM R$1.558 M; en 1S26 devolvió R$447,9 M (106% del FCFE) vía dividendos y recompras; deuda neta sin IFRS 16 = 0,8x EBITDA.",
    "B9": "Tasas en Brasil: CDI ~14,7%; la deuda (R$2.400 M) cuesta 15,1% y el costo de capital en R$ supera 17%.",
    "A10": "Controlador de largo plazo (Bertelsmann, 84% del voto) y la guía se cumplió o superó siete años seguidos desde 2S19.",
    "B10": "Margen EBITDA ajustado -190 pb en 1S26 por el ciclo de inversión; soluciones médicas crecen 1,5% y usuarios activos -7,9%.",
    "A11": "Múltiplo bajo: P/E LTM ~8,0x y EV/EBITDA ~5,3x con IFRS 16 al 22-sep-2026.",
    "B11": "Gobierno: Bertelsmann negocia con Yduqs (ago-2026) una posible combinación; los términos para el minoritario de AFYA no se conocen.",
    "A13": "2. DE LA HISTORIA A LOS NÚMEROS — LOS TRES ESCENARIOS",
    "A14": "Supuesto", "B14": "Conservador", "C14": "Base", "D14": "Optimista", "E14": "Justificación (dato real)",
    "A15": "Crecimiento Ingresos — Año 1", "B15": 0.05, "C15": 0.07, "D15": 0.09,
    "E15": "Guía 2026 R$3.950-4.100 M; 1S26 +7,0%. Conservador: parte baja de la guía y recortes ENAMED; optimista: punto medio de la guía.",
    "A16": "Crecimiento Ingresos — Años 2-5", "B16": 0.035, "C16": 0.065, "D16": 0.085,
    "E16": "Base: ticket ~ inflación + alumnos de salud. Conservador: recortes ENAMED prolongados y ticket bajo inflación. Optimista: nuevas plazas y digital.",
    "A17": "Margen Operativo — Año 1", "B17": 0.30, "C17": 0.315, "D17": 0.325,
    "E17": "Margen EBIT IFRS 32,6% LTM y 32,8% en 2025; la guía 2026 implica ~150 pb menos de margen por el ciclo de inversión.",
    "A18": "Margen Objetivo (convergencia)", "B18": 0.28, "C18": 0.32, "D18": 0.34,
    "E18": "Rango histórico 2021-2025: 25,6%-32,8%. Conservador vuelve a ~2023; optimista supera 2025 con apalancamiento operativo.",
    "A19": "Años de convergencia de margen", "B19": 5, "C19": 5, "D19": 5,
    "E19": "Un solo parámetro para los tres escenarios en el motor (Input sheet B31).",
    "A20": "Sales-to-Capital (años 1-5 / 6-10)", "B20": "2,5x / 2,5x", "C20": "2,5x / 2,5x", "D20": "2,5x / 2,5x",
    "E20": "Un solo parámetro para los tres escenarios; crecimiento con plazas ya autorizadas y capex ~9% de ingresos.",
    "A21": "Costo de Capital (WACC)", "B21": "='Cost of capital worksheet'!B14", "C21": "='Cost of capital worksheet'!B14", "D21": "='Cost of capital worksheet'!B14",
    "E21": "Rf R$ 12,12% (Tesouro Prefixado ~10 años 14,25% - spread Brasil 2,13%); beta desapalancada Educación global 0,74; ERP Brasil 7,47%; Kd 15,1% (106% CDI).",
    "A23": "3. RESULTADO DEL DCF POR ESCENARIO (R$ por acción)",
    "A24": "Escenario", "B24": "Valor DCF / acción (R$)", "C24": "Precio objetivo ponderado (R$)", "D24": "DCF vs precio actual",
    "A25": "Conservador", "B25": "='Valuation output'!B86", "C25": "='Resumen de Valoración'!C12", "D25": "=B25/'Input sheet'!$D$1-1",
    "A26": "Base", "B26": "='Valuation output'!B35", "C26": "='Resumen de Valoración'!D12", "D26": "=B26/'Input sheet'!$D$1-1",
    "A27": "Optimista", "B27": "='Valuation output'!B137", "C27": "='Resumen de Valoración'!E12", "D27": "=B27/'Input sheet'!$D$1-1",
    "A28": "Ponderación categoría 'Madura': DCF 40%, EV/EBITDA 20%, EV/FCFF 10%, P/E 20%, P/FCFE 5%, P/OCF 5%. Valores en R$; dividir por USDBRL para US$.",
    "A30": "4. AJUSTES METODOLÓGICOS APLICADOS PARA AFYA",
    "A31": "#", "B31": "Ajuste", "C31": "Razón",
    "A32": 1, "B32": "Modelo en R$: estados IFRS en R$ y precio = GOOGLEFINANCE(AFYA) x USDBRL.", "C32": "Evita mezclar precio en US$ con estados en R$ en múltiplos y DCF.",
    "A33": 2, "B33": "Tasa libre de riesgo local en R$ (12,12%) y crecimiento terminal 6% nominal.", "C33": "Coherencia de moneda: g <= Rf; 6% ≈ inflación implícita (Prefixado 14,25% vs IPCA+ 7,55%).",
    "A34": 3, "B34": "Deuda = préstamos + cuentas por pagar a vendedores + arrendamientos IFRS 16 (R$3.471 M).", "C34": "Misma definición de deuda neta que usa la compañía, más IFRS 16 por coherencia con EBIT.",
    "A35": 4, "B35": "FCF histórico después de intereses y arrendamientos.", "C35": "AFYA clasifica intereses en financiación; sin el ajuste el P/FCF sale artificialmente bajo.",
    "A36": 5, "B36": "Impuestos: 15% efectivo, 20% marginal.", "C36": "Tasa efectiva 10,6% LTM por PROUNI; el Pilar Dos fija un piso de 15%; el 20% refleja riesgo de erosión del beneficio.",
    "A37": 6, "B37": "Minoritarios (R$40 M, libro) y asociada UEPC (R$55 M) incluidos; opciones excluidas (dilución ~0,56 M acciones).", "C37": "Datos del balance al 30-jun-2026.",
    "A39": "5. LECTURA",
    "A40": "Los resultados son del Modelo JMR con supuestos propuestos en esta sesión; ver el informe de research para la auditoría de datos, "
           "la advertencia sobre los métodos EV (no restan deuda neta) y la sensibilidad a la tasa libre de riesgo en R$.",
    "A41": "Fuentes: 20-F 2019-2025; 6-K 4T25 (12-mar-2026), 1T26 (7-may-2026), 2T26 (13-ago-2026), 24-ago-2026 (Yduqs), 18-sep-2026; "
           "BCB PTAX; Tesouro Direto (18-sep-2026); U.S. Treasury (22-sep-2026); Damodaran (ene-2026); MEC/ENAMED.",
}
for k, v in T.items():
    S(TE, k, v)

# ------------------------------------------------ Cualitativo (rewrite)
CU = "Cualitativo"
for r in range(1, 60):
    for c in "ABCDEFG":
        S(CU, f"{c}{r}", None)
Q = {
    "A1": "AFYA — Análisis Cualitativo y Puente a la Valoración",
    "A2": "Fecha: 23-sep-2026 | Precio: US$13,49 (22-sep-2026) = R$69,02 | WACC inicial: 17,25% (R$)",
    "A4": "1. NEGOCIO Y VENTAJA COMPETITIVA",
    "A5": "Nombre de la Empresa", "B5": "Afya Limited (Cayman; operaciones 100% en Brasil)",
    "A6": "Director Ejecutivo (CEO)", "B6": "Virgilio Gibbon (CEO); Luis André Blanco (CFO)",
    "A7": "Sector Industrial", "B7": "Educación médica y soluciones para la práctica médica (Education)",
    "A8": "Sitio Web Oficial", "B8": "ir.afya.com.br",
    "A9": "Pregrado (medicina y salud)", "B9": "R$1.762 M en 1S26 (89% de ingresos); 26.421 alumnos de medicina; ticket neto R$9.443/mes.",
    "A10": "Educación continua", "B10": "R$143,9 M en 1S26 (+4,6%); 56.237 alumnos; mezcla hacia cursos cortos de menor ticket.",
    "A11": "Soluciones para la práctica médica", "B11": "R$85,3 M en 1S26 (+1,5%); pagadores activos de gestión clínica +20,4%, decisión clínica -5,9%.",
    "A12": "Visión General de la Empresa",
    "B12": "Mayor grupo de educación médica de Brasil por plazas (3.785 autorizadas al 18-sep-2026). El valor económico viene de plazas "
           "autorizadas por el MEC, que son escasas, con demanda muy superior a la oferta y ticket alto; el ecosistema digital busca retener "
           "al médico después de graduarse.",
    "A13": "Moat principal", "B13": "Licencias/plazas de medicina (activo regulado escaso) y escala nacional con proceso de admisión unificado.",
    "A14": "Amenaza principal", "B14": "Regulación de calidad (ENAMED) que ya recortó plazas en 6 cursos y posibles cambios en PROUNI/FIES.",
    "A16": "2. RIESGOS Y SEÑALES",
    "A17": "ENAMED 2026", "B17": "Resultado del segundo ciclo decide si los recortes cautelares se levantan, se mantienen o se agravan.",
    "A18": "Combinación con Yduqs", "B18": "Conversaciones preliminares (24-ago-2026); estructura y precio para minoritarios desconocidos.",
    "A19": "Tasas y deuda", "B19": "Deuda R$2.400 M a ~106% del CDI; covenant deuda neta/EBITDA ajustado <= 3,0x (hoy ~0,8x).",
    "A20": "Ciclo de inversión 2026", "B20": "Margen EBITDA ajustado -190 pb en 1S26; hay que ver retorno en educación continua y software.",
    "A21": "3. SUPUESTOS Y RESULTADOS",
    "A22": "Escenario", "B22": "Conservador", "C22": "Base", "D22": "Optimista",
    "A23": "Crecimiento año 1 / años 2-5", "B23": "5,0% / 3,5%", "C23": "7,0% / 6,5%", "D23": "9,0% / 8,5%",
    "A24": "Margen EBIT año 1 / objetivo", "B24": "30,0% / 28,0%", "C24": "31,5% / 32,0%", "D24": "32,5% / 34,0%",
    "A25": "Valor DCF por acción (R$)", "B25": "='Valuation output'!B86", "C25": "='Valuation output'!B35", "D25": "='Valuation output'!B137",
    "A26": "Precio objetivo ponderado (R$)", "B26": "='Resumen de Valoración'!C12", "C26": "='Resumen de Valoración'!D12", "D26": "='Resumen de Valoración'!E12",
    "A27": "WACC", "B27": "='Cost of capital worksheet'!B14", "C27": "='Cost of capital worksheet'!B14", "D27": "='Cost of capital worksheet'!B14",
    "A32": "4. DICTAMEN",
    "A33": "Ver informe de research: el libro entrega resultados del Modelo JMR; la lectura de calidad, riesgos y la auditoría de supuestos está en el informe.",
    "A34": "ACONTECIMIENTOS Y NOTICIAS RECIENTES (90 días previos al 23-sep-2026)",
    "A35": "Fuentes: 6-K de Afya en SEC EDGAR; MEC; prensa brasileña (ver informe).",
    "A37": "1. RESUMEN DE TITULARES",
    "A38": "Fecha / Tema", "D38": "Detalle Corto",
    "A39": "22-jun-2026 — Junta anual", "D39": "Aprobación de estados financieros 2025.",
    "A40": "29-jul-2026 — Comité de auditoría", "D40": "Marcelo Ken Suhara asume la presidencia tras el fallecimiento de João Paulo Seibel de Faria.",
    "A41": "13-ago-2026 — Resultados 2T26", "D41": "Ingresos +5,7%, EBITDA ajustado +1,4%, utilidad +14,0%; guía 2026 reafirmada; R$447,9 M devueltos en 1S26.",
    "A42": "24-ago-2026 — Yduqs", "D42": "Conversaciones preliminares para una posible combinación de negocios; sin acuerdo vinculante.",
    "A43": "18-sep-2026 — Plazas", "D43": "MEC autoriza 17 plazas adicionales en Cruzeiro do Sul (total 3.785).",
}
for k, v in Q.items():
    S(CU, k, v)

# alternative (inactive) cost-of-capital blocks: fill so they do not show #DIV/0!
S("Cost of capital worksheet", "H26", "='Input sheet'!B12")
S("Cost of capital worksheet", "G37", "Education")
S("Cost of capital worksheet", "H37", "='Input sheet'!B12")
S(SE, "E1", "Forward P/E (modelo base, FY+1)")
S(SE, "E2", "='Input sheet'!D1/'Financials Multiples'!E72")
S(SE, "N1", "Revenue 8Y CAGR (2017-2025)")
S(SE, "N2", "=('Income Statement'!K3/'Income Statement'!C3)^(1/8)-1")
HEAD = ["n.d.", "Dec '17", "Dec '18", "Dec '19", "Dec '20", "Dec '21", "Dec '22", "Dec '23", "Dec '24", "Dec '25", "LTM Jun '26"]
for sh in ["Márgenes", "Eficiencia de capital", "Salud Financiera", "Por acción"]:
    for c, h in zip("BCDEFGHIJKL", HEAD):
        S(sh, f"{c}2", h)
wb.save(OUT)
print("patched", len(wb.log))
