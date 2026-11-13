# JMR V2.0 · estado de los motores

Documentos: `DECISIONES.md` · `metodologia/CRITERIOS_DE_PUBLICACION.md` · `metodologia/PROCEDIMIENTO_EXPEDIENTE.md` · `metodologia/FUENTES_DAMODARAN.md`

Un motor por perfil económico (`motores/despacho.mjs`); nunca se ejecutan todos sobre la misma empresa. Tres escenarios con el mismo motor; MOS 35 % sobre el escenario base.

| Perfil | Motor | Referencia (Damodaran) | Paridad verificada | No replicado / rechazado |
|---|---|---|---|---|
| `operativa` | FCFF Simple Ginsu (inline en `jmr-v2.html`) | `fcffsimpleginzu.xlsx` | 8 casos | I+D, arrendamientos, opciones (valor recibido), rezago de reinversión, efectivo atrapado, hoja de costo de capital |
| `banco`, `aseguradora` | `motores/financieras.mjs` · DDM / exceso de retorno | `divginzu.xlsx`, `eqexret.xls` | 9 + 11 casos | 0 años (el original divide dos veces por acciones), calculadora de prima de riesgo |
| `holding` | `motores/sotp.mjs` · suma de partes | `illGE.xlsx` | 9 casos (modo réplica) | negocios con NOPAT ≤ 0 o g ≥ k (el original los evalúa sin sentido económico) |
| `alto-crecimiento` | `motores/alto-crecimiento.mjs` | `higrowth.xls`, `revgrowth.xls` | 13 + 3 casos | arrendamientos, I+D, otros gastos, capex métodos 1 y 2, opciones calculadas internamente |

- Las matrices de paridad recalculan **copias** de los libros originales con LibreOffice (`scripts/v2-*-reference.py`); los originales quedan en `AAA Finanzas/MODELO JMR V2.0/PLANTILLAS`.
- Controles de datos, valoración y publicación: `expediente-v2.mjs`. El estado declarado nunca supera al permitido; sin auditoría independiente no hay `PUBLICADO`.
- Catálogo propio: `node scripts/v2-catalogo.mjs` (`--check` en CI). No lee ninguna ficha Floyd.
## Libro financiero (perfil operativo)
`scripts/v2-libro-operativo.py build` inyecta tres hojas en el `fcffsimpleginzu.xlsx` original, sin reescribirlo: **JMR Estados** (10 ejercicios, reportado en azul, controles de cuadre), **JMR Indicadores** (márgenes, eficiencia, salud y múltiplos, solo fórmulas) y **JMR Escenarios** (selector conservador/base/optimista sobre un único Simple Ginsu). Las entradas históricas de «Input sheet» pasan a ser fórmulas hacia «JMR Estados».
- Fidelidad medida: de 87 partes del original, 70 quedan idénticas (las 40 de dibujos, comentarios, imagen, tablas y cadenas compartidas); 12 hojas cambian solo en valores en caché (se fuerza el recálculo); `styles.xml` solo recibe estilos al final.
- Verificación (`verify`, LibreOffice + `tests/jmr-v2-libro.test.mjs`): los tres escenarios coinciden con el motor JS, los indicadores del libro coinciden con los del navegador en los 10 ejercicios, y un enlace roto en el constructor hace fallar las pruebas.
- Plantilla en blanco en Drive (`PLANTILLAS`). **No verificada abriéndola en Excel** (solo LibreOffice y openpyxl); las tres cifras de los escenarios se guardan como instantánea con control «VIGENTE/DESACTUALIZADO» porque un solo motor calcula un escenario a la vez.

## Libro financiero (bancos y aseguradoras)
`scripts/v2-libro-financiero.py` aplica la misma técnica a `divginzu.xlsx` (método `ddm`) y a `eqexret` (método `exceso`; el original `.xls` se convierte a `.xlsx` con LibreOffice, así que esa plantilla parte de una copia convertida). Hojas nuevas: Estados (resultados, balance con minoritarias y preferentes, datos regulatorios con controles), Indicadores (ROE, ROA, payout, capital, P/E, P/BV; sin indicadores industriales), Escenarios y Fuentes.
- `exportar` genera el expediente desde el libro recalculado. Los valores del libro coinciden con el motor JS en los tres escenarios (banco DDM 20,21 / 21,15 / 22,13; aseguradora exceso 18,65 / 20,20 / 21,83, datos sintéticos) y el expediente exportado solo queda pendiente de la auditoría independiente.
- Mutaciones del constructor detectadas; plantillas en blanco en `PLANTILLAS` (no abiertas en Excel).

## Circuito completo (operativas, bancos, aseguradoras)
libro diligenciado → `exportar` → `docs/v2/empresas/TICKER.json` → `scripts/v2-catalogo.mjs` → página. P07 exige que el valor del libro concilie con el motor (±0,5 %).

## Libros de alto crecimiento y holdings
- `scripts/v2-libro-alto.py`: inyecta las hojas JMR en `higrowth` (convertido de `.xls`). Los tres escenarios del libro coinciden con el motor JS (datos sintéticos con EBIT negativo y NOL). La deuda se reporta a valor en libros y el ajuste a valor de mercado queda documentado en «JMR Fuentes».
- `scripts/v2-libro-holding.py`: no hay libro original que inyectar (`illGE` está atado a los siete segmentos de GE), así que la suma de partes usa **fórmulas propias de Excel** («JMR Negocios», hasta 8 negocios): fórmula de dos etapas por negocio, participación económica, valores externos para negocios financieros, descuento solo con justificación. Es una implementación independiente del motor JS y ambas dan el mismo valor en los tres escenarios (con opciones y descuento incluidos).
- Las mutaciones de los tres constructores se detectan; se añadieron opciones y descuento a la semilla del holding porque una mutación sobre ellos no se detectaba.

## Estado de los cuatro perfiles
Los cuatro tienen motor con paridad, libro con fórmulas, exportación de expediente y control P07. Lo que sigue pendiente no es de ingeniería: informes reales en `ANALISIS`, auditoría independiente, abrir las plantillas en Excel, y despliegue/QA con autenticación.

## Primera valoración real: ORCL (Oracle Corporation)
`docs/v2/empresas/ORCL.json`, estado **EN_REVISION**: base US$ 55,66 · conservador 5,07 · optimista 143,71 frente a un precio de 127,11 (12-nov-2026). Datos de los Forms 10-K FY2017–FY2026 (la carpeta `ANALISIS/ORCL` de Drive trae también el libro y el análisis fundamental). Único control pendiente: la auditoría independiente. Límites principales: libro anual (el 10-Q de agosto de 2026 se calculó aparte, base US$ 61,61), arrendamientos operativos fuera de la deuda, activos no operativos en 0, calificación BBB supuesta por JMR. Detalle en el análisis y en `tests/jmr-v2-orcl.test.mjs`.
