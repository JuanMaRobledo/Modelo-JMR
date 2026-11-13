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

- Pendiente: libro para los otros tres perfiles, informes reales, despliegue en Vercel y QA con autenticación.
