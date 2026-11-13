# JMR V2.0 · estado de los motores

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
- Pendiente: libro de cálculo con fórmulas como fuente, informes reales, despliegue en Vercel y QA con autenticación.
