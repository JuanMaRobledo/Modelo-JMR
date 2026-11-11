# Contrato Floyd R1–R6 · libro único (`floyd-libro-unico-v1`)

**Versión 1.2 · 11-nov-2026 · VIGENTE para toda revisión nueva; aplica idénticamente a ChatGPT, Claude, Gemini y cualquier agente.** Decisión expresa del usuario (11-nov-2026). `CONTRATO_REBOOT_JMR.md` (`jmr-reboot-3libros-v1`) rige **solo** las revisiones heredadas ya creadas (UBER, CMG, MELI, MSFT, AAPL) hasta que se migren.

## 1 · Artefactos (dos por revisión)
| Artefacto | Contenido | Quién escribe |
|---|---|---|
| **LIBRO ÚNICO** | 83 pestañas: Presentación · Guía del libro · Resumen de valoraciones · Sensibilidades DCF; **Históricos (H)** 12 pestañas; **Motor Base** 17 (fcffsimpleginzu, nombres originales); **Motor Conservadora** 17 (`… · C`); **Motor Optimista** 17 (`… · O`); **Múltiplos (M)** 16 (`M · …` en las 5 que chocan con H) | IA solo en entradas (ver §3) |
| **ANÁLISIS** | Google Doc: Nivel 1 (14 capítulos) + Nivel 2 (12 apartados) | IA |
Plantilla oficial: `Plantillas Modelo JMR Floyd (R1–R6)` → «PLANTILLA · JMR Floyd · LIBRO ÚNICO» (**publicada**: ID `1T1Cs2HGlVSe5_5OwqGGQvsN1k1KJaweXZEUM3HGttKk`, en la carpeta `1fFlAbKsdMKfjPB_nPcc6Y-9hQ7tQj14t`; las plantillas 01, 02b y 03 están archivadas en `90 Archivo histórico`). Requiere cálculo iterativo activado (100 iteraciones, 1e‑6) y sin IMPORTRANGE. Se **copia** por revisión; nunca se escribe sobre ella.

## 2 · Flujo de datos (todo por fórmulas entre pestañas; sin scripts ni IMPORTRANGE)
H → `Input sheet` de los tres motores —**todas** las cifras de la empresa— (ingresos, EBIT, intereses, patrimonio total, deuda, caja, precio, I+D, **tasa efectiva, acciones, minoritarios, activos no operativos, opciones**) · H → estados de M (por etiqueta) · motores → `Entradas desde DCF` de M · motores y M → `Resumen` → `Presentación`. Un cambio en H se propaga solo; no existen vínculos «obsoletos» entre archivos.

## 3 · Reparto del trabajo de la IA (sin cambios de fondo)
1. **Históricos:** tres estados (10 FY + LTM), auxiliares y el bloque «Datos del emisor para la valoración» de `Entradas históricas auxiliares` (filas 34–39: minoritarios redimibles, acciones por RSU/PSU, activos no operativos, opciones). Cada cifra con fuente en `Fuentes y clasificación`.
2. **Supuestos:** solo celdas de entrada del `Input sheet` de cada motor que **no** provienen de H (crecimiento, márgenes, ventas/capital, ROIC terminal y sus selectores), multiplicadores y pesos de M, probabilidades.
3. **Análisis:** el Doc A.
Todo lo demás lo calculan las fórmulas.

**Reglas económicas (sin cambio):** historias → números, con evidencia y contraevidencia; tres historias (Conservadora, Base, Optimista) con probabilidades que suman 100 %, **costo de capital común** y fracaso solo en la Conservadora; **MOS 35 % solo sobre el DCF Base** (0,65 × DCF Base; umbral, no una cuarta valoración); cinco múltiplos secundarios (EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF; sin P/S ni P/BV); el DCF Base manda y los múltiplos nunca lo sustituyen.

## 4 · Protección
No editar fórmulas, selectores, validaciones ni comentarios del motor. **Las pestañas `· C` y `· O` son duplicados del Base con el nombre de hoja reapuntado; la lógica es idéntica y se regenera con `scripts/floyd_libro_unico/construir.py`, nunca a mano.** Las filas de M cableadas a H y las celdas del `Input sheet` con fórmula hacia H no se sobrescriben con números.
Sensibilidades 5×5 y DCF inverso: corridas del motor sobre una **copia** del libro; sus valores son estáticos y la hoja marca «Matriz OBSOLETA» si cambia cualquier supuesto.

## 5 · Datos (JSON)
```json
{ "ticker": "<T>", "revisionId": "<REV>", "perfil_valoracion": "Floyd", "contratoLibros": "floyd-libro-unico-v1",
  "libros": { "unico": "https://docs.google.com/spreadsheets/d/<ID>/edit", "analisis": "https://docs.google.com/document/d/<ID_A>/edit" },
  "hojaGoogle": "<misma URL que libros.unico>", "sheet_id": "<ID>", "estado": "EN_REVISION" }
```
La app identifica la arquitectura por `contratoLibros`; `libros.unico` (o `hojaGoogle`) sirve para los tres tipos de libro (históricos, valoración, múltiplos). `contratoLibros="jmr-reboot-3libros-v1"` sigue leyéndose para las revisiones heredadas.

## 6 · Fases
R1 copiar la plantilla única y el Doc A, registrar los dos IDs · R2 llenar H (incluido el bloque del emisor) y conciliar · R3 supuestos de las tres historias en sus `Input sheet`; sensibilidades y DCF inverso por corridas del motor en copia · R4 multiplicadores/pesos de M; `Resumen` y `Presentación` ya están conciliados por fórmula · R5 análisis, JSON, catálogo, validadores, app · R6 auditoría independiente.
**Puerta de publicación:** igual que el contrato vigente, con «dos URL válidas y distintas», verificación de que ninguna celda cableada fue sobrescrita y `verificar.py` (equivalencia con la plantilla) sin diferencias en motores.

## 7 · Honestidad y bloqueos
No declarar controles no ejecutados. Un defecto estructural del libro se documenta y bloquea lo afectado; requiere mantenimiento separado. Si el cálculo muestra «Circular dependency», verificar que el cálculo iterativo esté activado (100 iteraciones, 1e‑6).

## 8 · Migración de revisiones existentes
UBER, CMG, MELI, MSFT y AAPL **no se migran automáticamente**: siguen en `jmr-reboot-3libros-v1`. UBER y CMG tienen prototipos de libro único verificados (0 diferencias en motores, M y H); su adopción es una decisión por revisión. MELI (SOTP/fintech) queda fuera de las reglas por etiqueta actuales.

## 9 · Cobertura completa de indicadores e históricos (obligatoria)

Rige la regla **§0R.2** de `modelo/REGLAS_VIGENTES.md` (precedencia normativa). El libro único debe entregar, **por fórmulas y sin intervención de la IA en outputs**, todos los indicadores de `Márgenes`, `Eficiencia de capital`, `Salud Financiera`, `Dividendos`, `Por acción`, `Trailing Valuation` y las salidas correspondientes de múltiplos/DCF. La IA solo carga entradas históricas, precios por FY, saldos iniciales/LTM y supuestos documentados, nunca los resultados de esos paneles.

El extractor trabaja a partir de los **10-K/10-Q completos, notas y precios históricos**. Es obligatorio consultar el balance anterior al primer FY (por ejemplo, FY2016 en el 10-K FY2017) y el balance del **mismo trimestre del año previo** al LTM; registrar cierres de cotización del último día hábil bursátil del FY, sin dividend-adjusted close. Buscar información adicional ante partidas ausentes (inventarios, alquileres, pasivos minoritarios, preferentes, intangibles, deuda, recompras) hasta agotar fuentes oficiales razonables. Todo valor informado se registra en `Fuentes y clasificación`.

La plantilla **no debe contener celdas de salida sin fórmula**. Representar faltantes como `N/D` (debe investigarse), múltiplos sin significado como `N/M`, y partidas realmente no aplicables como `N/A` justificado; no usar 0 por omisión. Cada hoja de indicadores se recalcula sin tocar el motor original Damodaran. La hoja `Entradas históricas auxiliares` separa los saldos comparativos (26–32, 42–48), los datos del emisor (34–39), el puente contable descriptivo (53–61) y el efecto FX (62). Las comprobaciones B64:B67 vigilan `N/D`, `N/M` y R2; `CONCILIADO` requiere comprobar la caja con FX.

**Puerta:** si las dependencias materiales de indicadores/DCF/EV están sin verificar o hay errores en celdas, R2/R5 quedan sin aprobar. La plantilla maestra se modifica únicamente en mantenimiento autorizado con respaldo y pruebas, nunca durante una valoración individual. El precio de cierre y otros históricos son entradas IA autorizadas: exigir que sean automáticas por extracción **no** significa que la celda de entrada deba tener una fórmula de mercado externa.


## 10 · Contrato técnico de puente postcorte y conciliación M (Oracle piloto, 11-nov-2026)

**Mantenimiento aprobado sobre la maestra de 83 pestañas y probado en ORCL-FLOYD-FY26Q1FY27-R1; no modifica ningún motor Ginsu.** La sección `Puente EEFF!A81:G90` separa *cifras al último balance* (col. B), *cambios netos postcorte documentados* (col. C), *pro forma indicativo* (col. D), fuente (col. E) y estados (fila 90). Las variables son deuda económica, caja corporativa libre, acciones ordinarias puntuales y precio de mercado. Un aumento de deuda no equivale automáticamente a deuda neta; fondos brutos emitidos no equivalen a cambio de caja. El EV postcorte solo es numérico si se documenta el cambio de efectivo hasta la fecha del precio y los cambios de deuda/acciones; su presencia sigue siendo **INDICATIVA** y nunca habilita por sí sola el DCF o publicación. No alterar los saldos contables de agosto por emisiones de noviembre ni añadir RSU/PSU a las acciones emitidas.

**Clasificación de arrendamientos reconocidos:** `M · Balance Sheet` filas 21 y 26 leen respectivamente las obligaciones corrientes y no corrientes informadas en `Balance Sheet` 21 y 26; las filas 23 y 27 son residuos de pasivo corriente/no corriente excluidos los leases reclasificados. Así los totales de pasivos de M coinciden con H sin doble conteo, y `Puente EEFF!B16:C16` debe igualar `Entradas históricas auxiliares!L21/K21`. Cuando un emisor declare categorías contables distintas, documentar el mapeo y comprobar los subtotales antes de aprobarlo; nunca sumar un pasivo de leasing ya incluido en deuda ni volver a capitalizarlo con el convertidor.

**Múltiplos M:** `Supuestos y control!B60` conserva todos sus gates (no se fuerza `LISTA PARA CALCULAR`). Diagnóstico explicativo `G60:H73` identifica fuentes, mercado, capital de trabajo, 30 coeficientes por 3 historias, 24 entradas del DCF, coste deuda, R2, tipo/ponderación de empresa, matrices y hechos postcorte. `Resumen de valoraciones!C30:E30` realiza una segunda conciliación ponderada contra `Resumen de Valoración!C65:E65` usando únicamente múltiplos positivos, cobertura de pesos >=80 % y >=2 métodos. Los pesos requieren justificación económica y no deben inventarse para superar un control. `B41:B42` distingue falta de insumos de errores de ponderación. Ningún valor por múltiplos se da por certificado mientras B60 o la selección del tipo continúen pendientes.

**Sensibilidades:** `Sensibilidades DCF!B28:B29, B42` devuelven `N/D` si el centro 5×5 no existe, en vez de tratar un blanco como cero. `B32` exige 75 valores de tres matrices de 5×5 y centros coherentes con el DCF Base vivo antes de mostrar `CENTROS COHERENTES · AUDITORÍA PENDIENTE`; la portada lee ese control. Estas matrices solo se recalculan mediante corridas originales reproducibles en un entorno/copia de pruebas autorizado, jamás con números inventados. Si no existen corridas, mostrar `PENDIENTE · CORRIDAS R3`, no `REVISAR` engañoso.

**Excepciones materiales:** en ORCL permanecen ocho `N/D` en los cuatro indicadores dependientes de inventarios FY2026 y LTM; no son ocho fuentes diferentes. Dos parámetros críticos de M no están listos: ingreso LTM comparable del año previo (`Supuestos y control!B65` / `M · Income Statement!L4`), e ingresos por intereses (`M · Income Statement!L13`, desde H), además de mercado/industria `B53:B58`, coeficientes `B30:D39` y la selección `Resumen de Valoración!G3`. Ninguno debe convertirse en cero sin soporte. No relajar `B67` por inmateria presumida; una excepción requiere prueba documental y dictamen trazable conforme a §4B.

## 11 · Fuente única de escenarios y leasing financiero

**Mantenimiento verificado sobre plantilla maestra y piloto ORCL (11-nov-2026).** La sección `Supuestos y control!B30:D39` contiene fórmulas, no entradas duplicadas: compara los supuestos editables de cada `Input sheet` Ginsu (Base, « · C», « · O») con anclas del `Puente EEFF` y deriva los multiplicadores de crecimiento FY+1/FY2–5, márgenes, ventas/capital 1–5 y 6–10, crecimiento terminal, ROIC terminal y ajustes beta/ERP/deuda. **Los valores se modifican únicamente en los inputs económicos autorizados del escenario, acompañados de historia → números**, no pegando coeficientes por segunda vez. Los motores, selectores y comentarios originales Damodaran no cambian; los coeficientes automáticos y el control `B60` no equivalen a una auditoría económica.

El puente `Puente EEFF!B32` toma el ratio **marginal** histórico de `Input sheet!I28` si está numérico y positivo, salvo que el analista documente una normalización explícita en `D32`. No existe una mediana histórica válida en la antigua referencia «Eficiencia de capital!G34:K34». El ratio marginal de Oracle con enorme CAPEX FY2026–FY2027 no debe extrapolarse como S/C sostenible sin análisis de inversiones, ROIC y cronograma; la referencia industrial de Damodaran se conserva separada en `B33`.

**Finance leases reconocidos pero no segregados dentro de deuda del balance:** `Entradas históricas auxiliares` filas 68 (corriente), 69 (no corriente) y 19 (total adicional) son entradas históricas con fuente o fórmulas; no poner cero cuando se desconoce. En `M · Balance Sheet` fila 20 se reclasifica la porción corriente desde otros pasivos, y fila 25 la no corriente; filas 23/27 calculan los pasivos residuales para que el total de pasivos permanezca igual. La deuda económica en H/M/DCF debe coincidir sin doble conteo con los arrendamientos OPERATIVOS ya segregados en H21/H26. Piloto Oracle FY2026 US$7.701m y LTM US$9.185m finance leases adicionales. El DCF sigue como resultado PROVISIONAL mientras no se complete conciliación postcorte, preferentes y costo de capital.

**Materialidad fuera de balance:** las obligaciones futuras de arrendamiento que todavía no han comenzado no se agregan indiscriminadamente a deuda ni se ignoran del flujo futuro. En Oracle el 10-Q 31-ago-2026 reporta US$288.000m de compromisos de leasing futuros y US$34.150m de obligaciones de compra; registrar cronograma, activos que entrarán en servicio, contratos prepago por clientes, si hay provisión en CAPEX/FCFF y prueba de doble conteo antes de validar el escenario. Las preferentes convertibles Series D se valoran o convierten a acciones, nunca se restan como valor preferente y simultáneamente se añaden sus acciones en el mismo caso. Fuente primaria SEC 10-Q FY27 Q1: https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm.
