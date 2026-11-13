# EPAM · Revisión de valoración, supuestos y escenarios · 13-nov-2026
**Método:** JMR V2.0 operativa, FCFF a 10 años. **Estado:** revisión preliminar, no certificación ni auditoría económica completa. **Corte de financieros:** LTM a 30-sep-2026; **precio de referencia del JSON:** US$163,83 (NO cotización en vivo).

## 1. Qué se comprobó realmente
- Modelo V2 calculado con los parámetros existentes y sin editar históricos ni motor: Conservador **US$130,2019218**, Base **US$210,6911356**, Optimista **US$316,6594357**. MOS35% del Base **US$136,9492382**.
- Serie LTM: ingresos 5.457,056 (FY2025) + 4.241,258 (9M2026) − 4.049,508 (9M2025) = **US$5.648,806 millones**. EBIT 520,003 + 444,918 − 370,749 = **US$594,172 millones**. Fuente primaria reciente: [resultados EPAM 3T2026](https://investors.epam.com/news/news-details/2026/EPAM-Reports-Results-for-Third-Quarter-2026/default.aspx) y [exhibición SEC](https://www.sec.gov/Archives/edgar/data/1352010/000135201026000048/exhibit99_q3x2026.htm).
- FY2025 margen EBIT GAAP 9,53%; LTM 10,52%; 3T2026 12,3% GAAP y 16,7% no-GAAP. La guía FY2026 es 10,7–10,9% GAAP. La guía FY2026 NO es automáticamente una estimación de los 12 meses futuros desde septiembre 2026.

## 2. Escenarios actuales (NO MODIFICADOS)
| Driver | Conservador | Base | Optimista |
|---|---:|---:|---:|
| Crecimiento año 1 | 3,5% | 6,5% | 9,5% |
| Crecimiento anual años 2–5 | 4,124% | 7,624% | 10,747% |
| Margen EBIT objetivo | 10,0% | 12,5% | 14,5% |
| Sales-to-Capital años 1–5 | 1,8× | 2,2× | 2,6× |
| Sales-to-Capital años 6–10 | 1,6× | 2,0× | 2,3× |
| ROIC terminal | 9,5% | 13,5% | 16,5% |
| g terminal | 2,5% | 3,5% | 4,0% |
| WACC inicial / terminal | 8,63/8,13% | 8,63/8,13% | 8,63/8,13% |
| Valor por acción | US$130,20 | US$210,69 | US$316,66 |

Las tres historias son coherentes en dirección: mayor crecimiento, margen, S/C y ROIC incrementan el valor; sin embargo, su anclaje económico sigue siendo preliminar. En particular, el crecimiento orgánico observado 3T2026 fue 2,5% y la guía de ingresos 2026 de 3,5–3,7% nominal. El Base exige una recuperación que debe ser justificada con capacidad y demanda; el Optimista implica aún más.

## 3. Dependencia terminal y sensibilidad del Base
- Peso del valor terminal en EV: **59,84% conservador; 69,55% Base; 74,37% optimista.**
- WACC inicial y terminal +1 punto: **US$174,13** por acción; ambos -1 punto: **US$267,56**.
- Margen EBIT objetivo Base 11% en vez de 12,5%: **US$186,29**.
- ROIC terminal Base 10% en vez de 13,5%: **US$194,26**.
- g terminal Base 3% en vez de 3,5%: **US$201,94**.
- Año 1 4%, años 2–5 6%, EBIT objetivo 11,5%, g terminal 3%, resto igual al Base: **US$173,84** como **ejemplo alternativo NO aprobado**, no nueva valoración oficial.

## 4. Cuestiones económicas no cerradas
1. **WACC:** 8,63% → 8,13% heredado de Floyd. Recalcular Rf, ERP/CRP, beta, estructura de capital, deuda, costo del patrimonio y fiscalidad en V2 con fechas y fuentes compatibles.
2. **Reinversión/Sales-to-Capital y ROIC:** normalizar adquisiciones, I+D, leases, capital de trabajo, inversión intangible y desfase antes de adoptar S/C 2,2× o ROIC terminal 13,5%/16,5%.
3. **Acciones:** reconciliar 53,175 M del modelo LTM, promedio diluido 52,630 M de 9M2026, recompras anunciadas y RSU/SBC. Evitar doble conteo de valor de opciones.
4. **Documentos históricos:** V2 dispone de 10-K FY2020–FY2025; FY2016–2019 proceden de H1 Floyd y no están cotejados individualmente en la carpeta V2. Usar los reportes disponibles, sin exigir diez archivos anuales si no están.
5. **Hoja de cálculo:** la carpeta V2 registra una copia de plantilla sin cargar. No afirmar que el valor derivado del JSON fue conciliado contra el libro operativo `fcffsimpleginzu` hasta cargar históricos, justificar escenarios y verificar cálculo.
6. **Cálculos por múltiplos:** no hay ancla homogénea de precios, capitalización, EV y denominadores para una validación completa.

## 5. Resultado operativo para la app
El expediente puede permanecer **visible en el visor «Pendientes de mi auditoría» con estado EN_PROCESO**, mostrando explícitamente estos asuntos y el análisis fundamental de 14 capítulos. Publicación para revisión ≠ auditoría personal. Nunca sustituir cifras oficiales del libro con resultados de sensibilidad exploratorios. Si se decide ajustar Base, crear una revisión económica nueva del libro y documentar comparación antes de alterar el JSON publicado.
