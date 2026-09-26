# Metodología de valoración

Este proceso se reconstruyó a partir del análisis de 55 casos de estudio reales (2022-2026),
buscando patrones repetidos en cómo se analizó cada empresa. No es una fórmula matemática única:
es un **checklist de 8 pasos** que combina múltiplos relativos con calidad de negocio.

---

## Paso 1 — Entender el negocio

- ¿Qué vende la empresa y en qué segmentos se divide? (% de ingresos por segmento)
- ¿Por qué cayó el precio recientemente? Distinguir entre:
  - **Caída coyuntural** (miedo de mercado, mal trimestre puntual, sector fuera de moda) → más
    interesante para comprar.
  - **Caída estructural** (pérdida real de competitividad, deterioro permanente del negocio) →
    exige mucho más margen de seguridad o descartar.

## Paso 2 — Moat (ventajas competitivas)

Evaluar cualitativamente cuáles de estas fuentes de moat tiene la empresa, y qué tan fuertes son:

| Fuente de moat | Preguntas guía |
|---|---|
| Costos de cambio (*switching costs*) | ¿Es costoso o incómodo para el cliente irse a la competencia? |
| Marca / poder de precio | ¿Puede subir precios sin perder clientes? |
| Escala / distribución | ¿Su tamaño le da ventajas de costo o alcance que otros no pueden igualar? |
| Efecto red | ¿El producto mejora mientras más gente lo usa? |
| Datos / contexto propietario | ¿Tiene información o contexto que un competidor nuevo no podría replicar rápido? |
| Costo de reemplazo de activos | ¿Sus plantas/infraestructura son carísimas o lentas de replicar? (ej. fabs de semiconductores) |

Un negocio sin ninguna de estas (ej. commodities, servicios fácilmente replicables) requiere
múltiplos más bajos y menor convicción de posición.

## Paso 3 — Salud financiera (checklist cuantitativo)

Revisar, en orden de importancia:

1. **Deuda neta / EBITDA** — umbral usado consistentemente:
   - `< 1x` → muy sano
   - `1x - 2x` → aceptable
   - `2x - 3x` → límite, exige cautela
   - `> 3x` → señal de alerta (red flag), reducir tamaño de posición o descartar
2. **Caja operativa y FCF** — ¿es positiva, estable o creciente? Una caja operativa
   **negativa o en deterioro** (ej. por capital de trabajo) es una señal de alarma seria, incluso
   si las utilidades reportadas se ven bien.
3. **Márgenes** (bruto, operativo, neto) y su tendencia — expansión sostenida = fortaleza del
   moat; compresión = posible pérdida de ventaja competitiva.
4. **ROE vs. ROIC** — comparar ambos. Un ROE alto "inflado" por apalancamiento o recompras con
   deuda, sin un ROIC igualmente alto, es una señal de alerta (no de fortaleza real).
   Comparar también el **ROIC actual vs. el promedio de 5 años** para saber si es sostenible.
5. **Uso del capital** — recompras, dividendos, adquisiciones son positivos si se financian con
   caja propia y generan valor; son una señal negativa si se financian con deuda creciente para
   sostener el precio de la acción (ej. recompras apalancadas).

## Paso 4 — Elegir el múltiplo correcto según el tipo de negocio

No se usa siempre el mismo múltiplo. Elegir según la naturaleza del negocio:

| Situación de la empresa | Múltiplo principal | Múltiplo de apoyo |
|---|---|---|
| Utilidades estables, poca deuda | **P/E** (actual y proyectado 2-4 años) | FCF yield |
| Deuda relevante en la estructura | **EV/EBITDA** | P/E |
| Sin utilidades estables o en fase de alto crecimiento | **P/S** (ventas) | P/GP (utilidad bruta) |
| Bancos, fintech, aseguradoras | **P/VL** (precio/valor en libros) | ROE |
| Cualquier caso (múltiplo "favorito" transversal) | **FCF yield** (FCF / valor de mercado) | — |

**Regla central:** el múltiplo actual se compara siempre contra el **promedio histórico propio**
de la empresa (ventana de 5 a 15 años, ajustando o excluyendo distorsiones como pandemia,
cargos no recurrentes o pérdidas puntuales), y en segundo lugar contra comparables directos del
sector. Rara vez se juzga "barato" en términos absolutos — casi siempre es "barato/caro
**relativo a su propia historia**".

Frases guía típicas del análisis:
- *"No es una ganga, pero es la valoración más baja en su historia."*
- *"Está cara, pero en línea con lo que merece por su calidad."*
- *"Barata vs. su historia, justa/cara en términos absolutos."*

Negocios de altísima calidad (moat fuerte, crecimiento consistente) rara vez cotizan baratos en
términos absolutos — ahí el criterio de compra es el **descuento relativo** a su propia historia,
no un múltiplo bajo per se. Negocios más cíclicos o de tipo commodity sí deben exigir múltiplos
bajos en términos absolutos.

## Paso 5 — Proyectar y calcular 3 escenarios de precio objetivo

1. Proyectar EPS o FCF por acción a 2-4 años (usar guías de la empresa, consenso de analistas, o
   una estimación propia conservadora si el consenso parece optimista).
2. Aplicar tres múltiplos distintos a esa proyección para obtener tres precios objetivo:
   - **Negativo/pesimista** — múltiplo bajo (cerca del mínimo histórico o de un escenario
     adverso).
   - **Base** — múltiplo cercano al promedio histórico ajustado.
   - **Optimista** — múltiplo alto (si se cumplen los mejores supuestos de crecimiento).
3. Calcular el **CAGR** de cada escenario desde el precio actual hasta el precio objetivo, y
   sumarle el **dividend yield** si aplica, para obtener el retorno anualizado total esperado.

### Anexo al Paso 5 — Regla automática para los múltiplos de salida

La Calculadora (`Modelo_Valoracion.xlsx`) puede fijar los 3 múltiplos de salida por ti, en vez de
que los estimes a ojo cada vez. Esta regla se obtuvo analizando cuantitativamente 15-18 de los 55
casos de estudio que tenían datos completos: para cada uno se calculó el **múltiplo implícito**
de cada escenario (precio objetivo ÷ EPS/FCF proyectado) y se comparó contra el múltiplo actual y
el promedio histórico del propio caso.

**Resultado:**

| Escenario | Regla | Rango observado |
|---|---|---|
| Negativo | ≈ **1.00×** el múltiplo actual | 0.70x - 1.30x |
| Base | ≈ **0.78×** el múltiplo promedio histórico | 0.56x - 1.01x |
| Optimista | ≈ **0.92×** el múltiplo promedio histórico | 0.65x - 1.23x |

En Excel: `Negativo = Múltiplo_actual`, `Base = 0.78 × Múltiplo_promedio_histórico`,
`Optimista = 0.92 × Múltiplo_promedio_histórico`.

**Nivel de confianza: medio.** No es una fórmula que el autor haya aplicado mecánicamente — él
mismo describe el proceso como juicio caso por caso ("le doy castigo", "soy ácido", "un múltiplo
decente sería..."). Lo que arroja el análisis es el **promedio de ese juicio**, con evidencia
textual directa que lo respalda (ej. en TEP el autor fija su múltiplo "razonable" en 18x contra un
promedio de 23x → 0.78, exactamente la media encontrada; en Nagarro dice explícitamente que evitó
irse "a la valoración promedio... porque de hacerlo, la valoración me daría por encima" del
optimista que sí usó).

**Matices importantes:**
- El escenario **Negativo se ancla al múltiplo actual, no al mínimo histórico de crisis** — la
  lectura es "el mercado no vuelve a pagar más de lo que paga hoy", no "vamos a una crisis".
- Los casos etiquetados **"Especulativa"** (AMD, NVO, DUOL, SE, CELH, UAA, NU, DLO, JD, entre
  otros) muestran razones sistemáticamente más bajas que el promedio — el "castigo" al múltiplo es
  mayor cuando hay menos convicción o experticia sobre el negocio.
- Cuando el autor se desvió al alza de esta regla (ej. EPAM en 2023, apostando a una
  reaceleración de crecimiento que no se cumplió), el resultado fue peor que en los casos donde
  se mantuvo conservador — una señal de que desviarse de la regla es un indicador de riesgo, no
  la norma.

Por eso la Calculadora deja una columna de **"ajuste manual" (%)** junto a cada múltiplo
automático: en 0% aplica la regla pura; puedes moverla (ej. -10% a -20% en hipótesis
especulativas, o al alza si tienes convicción de que el negocio merece re-ratear por encima de su
propia historia) sin perder el punto de partida objetivo.

## Paso 6 — Definir las 3 "zonas de valor"

A partir de los múltiplos históricos mínimos y el precio actual, definir tres rangos de precio
para escalonar compras (no todo de una vez):

- **VALUE** — nivel donde ya hay margen de seguridad razonable; primera entrada.
- **DEEP VALUE** — nivel más exigente, generalmente cerca de mínimos de varios años; refuerzo de
  posición.
- **VALORACIÓN HISTÓRICA** (u "Oportunidad Histórica") — el múltiplo mínimo absoluto visto en la
  historia de la acción (excluyendo crisis extremas tipo 2008-09 si no son comparables); entrada
  máxima de convicción, poco frecuente.

## Paso 7 — Factores cualitativos adicionales

- **Skin in the game**: ¿fundadores, familia fundadora o directivos tienen una participación
  accionaria relevante y/o están comprando (no vendiendo)? Se pondera como un factor positivo
  fuerte; su ausencia (insiders sin acciones o vendiendo) es una señal negativa.
- **Riesgos específicos**: regulatorios, geopolíticos (país, aranceles), competitivos
  (sustitución tecnológica, nuevos entrantes), de concentración de clientes.
- **Categoría de riesgo de la hipótesis**: clasificar explícitamente la posición como
  **Estándar** (negocio de calidad, moat claro, deuda controlada) o **Especulativa/Alto riesgo**
  (sector fuera de la experticia propia, sin utilidades consistentes, alta volatilidad, riesgo
  país extremo). El tamaño de la posición debe ser menor en el segundo grupo.

## Paso 8 — Gestión de la posición

- **Escalonar entradas**: comprar por tramos en las tres zonas de valor definidas en el Paso 6,
  no de una sola vez.
- **Tomar ganancias parciales ("peluquear")**: cuando el precio alcanza el escenario base u
  optimista, cerrar una parte de la posición (típicamente 20%-50%) y dejar correr el resto.
- **Reactivar la hipótesis**: si el precio vuelve a caer a niveles de las zonas de valor
  originales, se puede retomar la posición cerrada parcialmente, revalidando primero que la
  tesis de negocio siga intacta.
- **Actualizar periódicamente**: revisar la hipótesis cuando hay resultados trimestrales
  relevantes o el precio se mueve significativamente, y recalcular múltiplos/escenarios con la
  información nueva.

---

## Checklist rápido (resumen de una página)

1. [ ] Negocio y segmentos entendidos; razón de la caída identificada (coyuntural vs. estructural)
2. [ ] Moat evaluado (¿cuáles de las 6 fuentes aplican y qué tan fuertes son?)
3. [ ] Deuda neta/EBITDA calculada y clasificada (verde/amarillo/rojo)
4. [ ] Caja operativa y FCF revisados (¿positivos y estables?)
5. [ ] Márgenes y su tendencia (¿expansión o compresión?)
6. [ ] ROE vs. ROIC comparados (actual y promedio 5 años)
7. [ ] Múltiplo principal elegido según el tipo de negocio
8. [ ] Múltiplo actual comparado contra promedio histórico propio (y comparables de sector)
9. [ ] EPS/FCF proyectado a 2-4 años
10. [ ] 3 escenarios de precio objetivo + CAGR calculados
11. [ ] 3 zonas de valor definidas (Value / Deep Value / Valoración Histórica)
12. [ ] Skin in the game revisado
13. [ ] Riesgos específicos listados
14. [ ] Categoría de riesgo asignada (Estándar / Especulativa) y tamaño de posición decidido

Usa `Modelo_Valoracion.xlsx` (pestaña **Calculadora**) para aplicar este checklist con fórmulas
automáticas.

---

## Anexo — Modelo en Google Sheets (DCF Damodaran + 5 múltiplos): de dónde salen los supuestos

La plantilla maestra de Google Sheets (`Modelo_JMR_Plantilla_Maestra`, que llena el pipeline de
`JuanMaRobledo/JMR-valuation`) lleva el Paso 5 a un modelo completo. Cada copia trae una hoja
**«Origen de los Supuestos»** que muestra, con fórmulas vivas, el valor de cada supuesto por
escenario, la fórmula real de la celda y las anclas históricas y de industria para contrastarlo.
Este anexo resume las reglas.

### Cómo se arma el precio objetivo

- **Seis métodos**: DCF de Damodaran y cinco múltiplos (EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF).
  El precio objetivo es su promedio ponderado. Los pesos dependen de la categoría de empresa
  elegida en `Resumen de Valoración!G3` (tabla `I5:U11`). Por ejemplo, «Madura» da DCF 40%,
  EV/EBITDA 20%, P/E 20%, EV/FCFF 10%, P/FCFE 5% y P/OCF 5%; «Software» da 60% al DCF, y
  «Financiera» da 0% a los múltiplos EV.
- **Horizonte común de 3 años.** Cada múltiplo da el precio al cierre del año fiscal FY+3 más
  los dividendos cobrados en el camino. El DCF da el valor intrínseco *hoy*, así que se lleva
  a 3 años con el costo del equity: `valor × (1 + Ke)³`. Así el «CAGR a 3 años» y las zonas de
  compra comparan magnitudes del mismo momento.
- **Tres escenarios.** El **Base** lo fija el analista (`Input sheet` B27–B33) con la guía de la
  empresa, el consenso y la historia, y lo justifica en la hoja «Tesis de Inversión y
  Supuestos». **Conservador** y **Optimista** salen de reglas sobre el Base en
  `Valuation output` (C45, C47, C55, C106). Cada valoración puede ajustar esas reglas, y la hoja
  «Origen de los Supuestos» muestra la regla vigente.

### Crecimiento de ingresos

| Tramo | Base | Conservador (regla de la plantilla) | Optimista (regla de la plantilla) |
|---|---|---|---|
| Año 1 | Analista (`Input` B27): guía de la empresa y consenso del próximo año fiscal | mín(Año 1; Años 2-5) − 1,5 pp | máx(Año 1; Años 2-5) + 1 pp |
| Años 2-5 | Analista (`Input` B29): consenso a 2-3 años y CAGR histórico | igual al Año 1 conservador | igual al Año 1 optimista |
| Años 6-10 | Convergen en línea recta a la tasa de perpetuidad | ídem | ídem |
| Perpetuidad | Tasa libre de riesgo (`Input` B35), salvo override en B65–B69 | ídem | ídem |

Anclas para validar el Base: crecimiento del último año fiscal y CAGR de 3, 5 y 9 años
(«Crecimiento y Márgenes»), mediana de los peers de la hoja «Sector» y promedio de la industria
de Damodaran (`Input` J26).

### Margen operativo (EBIT)

| Tramo | Base | Conservador | Optimista |
|---|---|---|---|
| Año 0 | EBIT base ÷ ingresos (con I+D y arriendos capitalizados si aplica) | ídem | ídem |
| Año 1 | Analista (`Input` B28) | igual | igual |
| Objetivo | Analista (`Input` B30): guía de largo plazo, margen histórico y comparables maduros | el margen no mejora (se queda en el Año 0) | objetivo Base + 5 pp |
| Convergencia | Lineal desde el Año 1 hasta el objetivo en el año `Input` B31 | ídem | ídem |

La reinversión sale del **sales-to-capital** (`Input` B32/B33: Δ ingresos ÷ Δ capital
invertido, calculado de abajo hacia arriba con la historia de la empresa). Como chequeo, el ROIC
implícito del año 10 no debería superar por mucho al actual ni al de la industria.

### Costo de capital

Tasa libre de riesgo (bono a 10 años en la moneda de la valoración) + beta (desapalancada de la
industria de Damodaran o de comparables, reapalancada con la deuda/equity de mercado) × prima de
riesgo de mercado de Damodaran (según el país), ponderado con el costo de la deuda después de
impuestos (rating real o sintético). Entre los años 6 y 10 el WACC converge al terminal:
tasa libre de riesgo + ERP maduro.

### Múltiplos objetivo (salida al cierre FY+3)

- **Base = el menor múltiplo positivo que pagó el mercado por la empresa en sus últimos 4
  cierres fiscales** (celda J19 de cada hoja de múltiplo). Si no hay ninguno positivo, se usa la
  mediana de 5 años. Se usa el mínimo, no el promedio, por disciplina de margen de seguridad: si
  la tesis funciona aun al múltiplo más bajo reciente, el retorno viene del negocio y no de una
  re-valoración.
- **Conservador = Base × 0,9** y **Optimista = Base × 1,1**. Un número escrito en J8/J19/J30
  reemplaza el cálculo automático, y queda marcado en «Supuestos de los Múltiplos».
- **Precio** = múltiplo × métrica proyectada al cierre FY+3 del mismo escenario
  («Financials Multiples», que usa el crecimiento y el margen de ese escenario del DCF) ÷
  acciones proyectadas. En EV/EBITDA y EV/FCFF se resta la deuda neta (deuda + arriendos − caja
  − activos no operativos + minoritarios). Se suman los dividendos por acción de FY+1 a FY+3
  (DPS de los últimos 12 meses × (1 + g); g es el CAGR de 5 años del DPS, acotado entre 0% y 15%).
- La hoja «Origen de los Supuestos» pone al lado la mediana de 5 y 10 años, el múltiplo actual y
  la mediana de los peers. Si el Base queda muy por encima de esas referencias, el precio
  objetivo depende de una re-valoración y hay que justificarlo en la Tesis.

> Relación con la Calculadora de Excel: la regla de la Calculadora (Base ≈ 0,78× el promedio
> histórico) viene del juicio promedio en los 55 casos. La regla del modelo de Sheets (mínimo
> positivo de los últimos 4 cierres) es una variante mecánica y, en general, igual o más exigente.
> Conviene mirar ambas: si difieren mucho, la historia reciente de múltiplos está distorsionada
> (una burbuja o un derrumbe) y el analista debe fijar el múltiplo a mano.

### Auditoría de la plantilla (26-sep-2026)

Se corrigieron en la plantilla maestra y en todas sus copias de valoración (script
`JMR-valuation/scripts/audit_fix_model.py`; respaldo de cada fórmula anterior en
`JMR-valuation/reference/backups/auditoria_2026-09-26/`). El script solo reescribe una celda si
todavía tiene la fórmula original de la plantilla, así que los ajustes hechos a mano en una
valoración se respetan.

| # | Error | Efecto | Corrección |
|---|---|---|---|
| A1 | EV/EBITDA y EV/FCFF convertían el EV objetivo en precio sin restar la deuda neta | Sobrevaloraba a las empresas endeudadas y subvaloraba a las que tienen caja neta | (EV − deuda − arriendos + caja + activos no operativos − minoritarios) ÷ acciones |
| A2 | La hoja «Dividendos» estaba vacía y se leía corrida una columna; el DPS proyectado *sumaba* la tasa de crecimiento; el «dividendo acumulado» tomaba un solo año | Los múltiplos ignoraban los dividendos (NKE: ~US$5 por acción en 3 años) | DPS vivo desde el Cash Flow; DPS × (1 + g); suma de FY+1 a FY+3 |
| A3 | El Resumen mezclaba el DCF (valor hoy) con los múltiplos (precio en 3 años) | El DCF quedaba subponderado en el precio objetivo y en el CAGR | DCF × (1 + Ke)³ |
| A4 | CAGR con exponentes equivocados (2 intervalos ÷ 3 años, 4 ÷ 5, 9 ÷ 10) | Distorsionaba el crecimiento histórico (lo subestimaba si crecía, lo suavizaba si caía) | Exponentes 1/3, 1/5, 1/9 sobre el año correcto |
| A5 | «Margen EBITDA» histórico promediaba la fila del margen EBIT | Ancla de margen equivocada | Fila 30 (EBITDA) |
| A6 | Estadísticas de industria con rangos inconsistentes que incluían a la propia empresa y excluían peers | Medianas de industria sesgadas | Solo peers (filas 3–11 de «Sector»), con mínimo 3 datos |
| A7 | Múltiplo Base = MIN de 4 años aunque alguno fuera negativo | Precios objetivo negativos o absurdos cuando un año tuvo FCFE negativo | Mínimo de los múltiplos positivos |
| A8 | «Forward Valuation» M:N traía valores de PYPL pegados | Dato ajeno visible en todas las valoraciones | Se borran |
| A9 | Rótulos «NTM» en múltiplos trailing; «LTM» que era el último año fiscal | Lectura equivocada | Rótulos corregidos |
| A10 | El múltiplo del año FY-3 (columna B de cada hoja de múltiplos) salía de «Trailing Valuation» con OTRA definición que los años C-E (EV/FCF apalancado vs. FCFF; OCF reportado vs. NI+D&A-ΔNWC; precio/EPS diluido vs. NI consolidado) | El múltiplo Base (mínimo de la fila) podía mezclar dos definiciones distintas | La columna B usa la misma definición que C-E |
| A11 | El endeudamiento neto del FCFE se proyectaba como el % promedio de las ventas de los últimos 3 años, perpetuamente | Distorsionaba el FCFE y el precio por P/FCFE (NKE: −US$933/año) | La deuda crece con las ventas, manteniendo la razón deuda/ventas LTM constante |
| A12 | La mediana del cambio de acciones incluía un año LTM parcial; el precio de EV/EBITDA y EV/FCFF dividía por las acciones proyectadas (menos por recompras) pero restaba la deuda neta de HOY, sin descontar la caja que paga esas recompras | Doble conteo de la recompra en el precio objetivo | Mediana sin el año parcial; precio dividido por MAX(acciones de hoy; proyectadas) |
| A13 | Los escenarios Conservador y Optimista convergían el margen desde el margen Año 1 del escenario BASE ($C$6), no desde el suyo propio | Cambiar el margen Año 1 de un escenario solo afectaba al año 1 | Cada escenario converge desde su propio margen Año 1 |
| A14 | «Income Statement» fila 30 (margen EBITDA) daba #DIV/0! en empresas con menos de 10 años de historia | Se propagaba a «Crecimiento y Márgenes» | IFERROR |
| A15 | «Resumen»: B2 «Fecha del análisis» era `=HOY()` (cambia cada día); etiquetas de MOS y Potencial usaban precios distintos sin aclararlo | Confusión entre precio del análisis y precio en vivo | B2 = fecha de valoración fija; etiquetas aclaradas |
| A16 | «Valuation output»: la columna «Growth» de la tabla de escenarios mostraba la tasa libre de riesgo, el promedio de industria y el CAGR 3Y en vez del crecimiento real de cada escenario; tablas de referencia sin usar (filas 95-102, 146-153) | Lectura equivocada | Muestra el crecimiento real (Año 1); tablas marcadas como referencia |
| A17 | «Stories to Numbers» F13 («Sales to capital» terminal) calculaba g/ROIC (tasa de reinversión), no ventas/capital | Etiqueta y cifra no correspondían | ROIC ÷ (margen × (1 − tasa de impuestos)) |
| A18 | «Input sheet» C20 (año anterior) sumaba Other LT Assets y B20 (LTM) no | Comparación LTM vs. año anterior inconsistente | Misma definición en ambas |

Las hojas de texto (Tesis, Cualitativo, Supuestos Recomendados, Supuestos de los Múltiplos,
Stories to Numbers) quedaron con un formato uniforme: tipografía, bandas de sección, texto
ajustado y alto de fila calculado para que ningún párrafo quede cortado. Los resultados por
escenario que estaban tipeados en la Tesis pasaron a fórmulas vivas.

### Contaminación entre empresas por copiar una valoración ya llena (26-sep-2026)

Varias valoraciones se armaron duplicando en Drive la hoja de OTRA empresa ya llena, en vez de
partir de la plantilla maestra en blanco. Los estados financieros y los supuestos se corrigen al
correr el refresh, pero **las hojas de texto no se regeneran solas** y se detectaron casos reales
con contenido de la empresa anterior sin corregir:

- **PYPL**: `Cualitativo` con CAGRs de Adobe, `Stories to Numbers` con contenido de Amazon (ya
  corregido antes de esta auditoría; lo documenta la propia hoja de PYPL en su bitácora).
- **ADBE, DUOL, UBER** y, por separado, **LULU, MSFT, PLTR**: en `Estadísticas`, el bloque de
  crecimiento histórico (`G4:H15`) quedó copiado y pegado entre las tres empresas de cada grupo
  (mismos números en compañías sin relación).
- **MSFT**: `Cualitativo` con el perfil completo de Palantir (CEO, plataformas, métricas).
- **PLTR** (su propia hoja): `Cualitativo` con párrafos de Apple mezclados con los propios, y el
  CEO equivocado.
- **LULU**: `Cualitativo` con el encabezado (título, fecha, precio, WACC) de Palantir; el cuerpo
  sí era propio.

**Regla obligatoria de acá en adelante: ninguna empresa nueva empieza duplicando la hoja de otra
empresa.** Se usa `JMR-valuation/scripts/reset_from_master.py`, que copia la plantilla maestra
auditada hoja por hoja (fórmulas, no solo valores) y respalda el contenido anterior por si la
hoja destino no era en realidad nueva:

```
# Hoja que ya existe (por ejemplo, duplicada de otra empresa por error) — la reinicia:
PYTHONPATH=.:scripts python scripts/reset_from_master.py --sheet-id ID [--dry-run]

# Hoja que todavia no existe — crea una copia limpia de la plantilla en Drive:
PYTHONPATH=.:scripts python scripts/reset_from_master.py --new "Modelo JMR - TICKER" [--dry-run]
```

`--new` casi seguro falla (la cuenta de servicio tiene cuota de Drive 0, no puede ser dueña de
archivos nuevos): en ese caso, una persona hace "Archivo > Hacer una copia" de la plantilla
maestra a mano en Drive y la comparte con la cuenta de servicio; esa copia ya sale limpia y no
necesita `--sheet-id` después. `reset_from_master.py` generaliza el paso `step_reset` que se
escribió primero solo para AFYA (`run_afya.py`), para que cualquier empresa nueva lo use sin
tener que escribir un script a medida.

Además, después de correr el contenido de una empresa nueva conviene un chequeo rápido de
`Cualitativo`, `Stories to Numbers`, `Supuestos Recomendados` y `Supuestos de los Múltiplos`
buscando el nombre de otra empresa o su CEO (así se encontraron los casos de arriba), sobre todo
si la hoja se armó a mano en vez de con un script reproducible.
