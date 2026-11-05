# Criterios de valoración — de Damodaran a las decisiones del Modelo JMR

**Versión 0.1 · 2026-11-05.** Este texto es un **manual de aplicación**, no un extracto textual del autor. Separar siempre **principio Damodaran** (D), **traducción operativa JMR** (J) e **hipótesis de empresa** (H). No convertir una sensibilidad en una norma general.

**Fuente de autoridad:** [índice de materiales](FUENTES_Y_VIDEOS.md), [HISTORIAS_A_NUMEROS](../HISTORIAS_A_NUMEROS.md), [REGLAS_VIGENTES](../../modelo/REGLAS_VIGENTES.md).

## 0. Integridad del modelo (obligatorio)

**No modificar nunca las fórmulas, notas y comentarios ORIGINALES de Damodaran.** Las hojas oficiales se copian por revisión y ticker. Los datos nuevos se incorporan por celdas de entrada; las derivaciones, escenarios especiales y controles van en auxiliares JMR independientes. Se audita la integridad con una comparación respecto al original del profesor (versión, estructura, fórmulas y notas). Los adaptadores/puentes JMR no pueden presentarse como fórmulas de Damodaran. **No afirmar «inmutabilidad demostrada» hasta ejecutar la comparación integral**, incluso si las 730 celdas inspeccionadas en un ensayo no cambiaron.

## 1. Historia y ciclo de vida

**D:** La valoración requiere una historia económica comprobable; un relato sin dinero no prueba valor y una hoja sin historia no justifica estimaciones. El ciclo de vida empresarial cambia crecimiento, financiación y reinversión. Referencias D-NN-00, D-NN-06, D-NN-14.

**J:** Para cada historia, escribir **ANTES** del precio qué negocio gana clientes, cómo monetiza, por qué mantendría márgenes y cuánto reinvertirá; indicar posición en ciclo. Pruebas 3P: **posible** (matemáticas/TAM), **plausible** (precedentes/competencia) y **probable** (tesis central).

**Falsadores:** cambio competitivo, sustitución de producto, aceleración/desaceleración de demanda, dificultad de adquirir clientes, pérdida de poder de precios. **No hay puntuación numérica obligatoria** de moat sin indicadores.

## 2. Crecimiento de ingresos — motores físicos

**D:** Crecimiento operativo nace de actividad, productividad, reinversión y eficiencia; no de copiar tasas históricas de forma mecánica. Fuentes D-VAL-08, D-GROW-01, D-NN-06.

**J:** Desglosar ingresos por unidades relevantes (MAU/DAU como actividad, pagadores, ARPU/booking, anuncios, DET, IAP) sin confundir **pagadores al cierre** con suscriptores promedio, **bookings** con ingresos GAAP ni **DAU** con usuarios únicos de pago. Conciliar mix de segmentos con curva de ingresos total a cada año. Si el FCFF original usa CAGR años2–5 fijo, el puente narrativo debe permitir que el raw aporte los parámetros y que la asignación sea **explícitamente técnica**; no declarar que cada categoría conserva el crecimiento RAW anual tras normalización.

**Identidades económicas de apoyo:** Ingresos por suscripción ≈ base pagadora media × rendimiento por usuario; crecimiento del flujo de suscripción depende de precios/mezcla/retención, conversiones y amortización de contratos. Uso «≈» porque duración y reconocimiento alteran la identidad contable.

**Falsadores:** menos usuarios activos, caída de conversión de pago, sustitución de Max, costes variables de IA crecientes, publicidad que no monetiza DAU. **Calibrar** los supuestos con guías y métricas comparables; no elegir el CAGR por proximidad al precio de bolsa.

## 3. Margen EBIT — comparable y económico

**D:** Proyectar márgenes después de ajustar contabilidad cuando sea material; crecimiento de ingresos no implica margen garantizado. D-VAL-07, D-GROW-01, D-TOOLS-RD y D-TOOLS-LEASE (webcasts indexados).

**J:** Confrontar EBIT GAAP y EBIT ajustado por I+D y arrendamientos **de forma simétrica**, sin tomar EBITDA ajustado como EBIT ni sumar SBC como si fuese gratis. En negocios IA intensivos, documentar si el costo incremental de IA está en COGS, I+D o SG&A. Justificar el margen de madurez mediante estructura de gastos y comparables del ciclo apropiado. Si se capitaliza I+D, ajustar inversión/amortización/capital simultáneamente.

**Falsadores:** variación de margen bruto, mayores costes de contenido/IA, cambios de pricing, tasas de SBC a ingresos.

## 4. Reinversión y Sales-to-Capital (S/C)

**D:** El valor del crecimiento depende de cuánto se reinvierte y de la rentabilidad del capital adicional. Fórmula FCFF: NOPAT − reinversión; con crecimiento estable, tasa reinversión = g/ROIC. D-GROW-01, D-TERM-01, D-VAL-07.

**J:** En años explícitos, **reinversión incremental orientativa** = Δventas/Sales-to-Capital, sujeta al tratamiento de working capital, I+D, leases, inversiones compradas y rezagos. S/C 1–5 puede diferir del S/C 6–10 si se defiende capacidad o capital marginal; comparar con sectores ajustados por R&D/leasing. Revisar la inversión física y económica antes de elevar S/C «porque es software».

**Falsadores:** incrementos de I+D, contenido, infraestructura, comisiones, instalaciones, capex, diferencia entre inversiones nuevas y amortización.

## 5. ROIC medio, ROIC marginal y ventaja competitiva

**D:** ROIC histórico del capital existente y retorno de **nuevas inversiones** son conceptos diferentes. El crecimiento crea valor si la reinversión logra un retorno superior al costo de capital. La competencia erosiona los retornos extraordinarios; no presupone desaparición instantánea. D-TOOLS-ROIC (webcast indexado), D-GROW-01, D-TERM-02 y D-ROIC-26.

**J:** Calcular por separado:

- ROIC sobre capital **medio/previo ajustado** = NOPAT ajustado / capital invertido relevante, con tratamiento consistente del denominador y los arrendamientos. El balance puede esconder pasivos y activos ROU en otras líneas.
- ROIC marginal **indicado por proyecciones** = ΔNOPAT / inversión precedente, con alertas si variaciones de margen hacen que esta cifra no sea atribuible solo a capital nuevo.
- **ROIC de perpetuidad** = supuesto del rendimiento marginal de las inversiones necesarias para g, no necesariamente el ROIC medio año10. Justificar el período de erosión de exceso de retornos, y la opción de aproximar ventaja que se extingue a 5–10 años **solo como sensibilidad**.

**Falsadores:** coste de cambio reducido, falta de poder de precio, menor retención, paridad de producto con IA generalista, costos marginales crecientes; en sentido contrario, marca, hábitos y costos unitarios bajos persistentes.

**Antierror:** (margen EBIT después de impuesto) × Sales-to-Capital ofrece una **aproximación** de ROIC marginal en equilibrio, NO una tasa observada ni identidad rigurosa si hay amortización, capital histórico, cambio de margen, inversiones previas o diferencias temporales. No confundir caída del ROIC marginal terminal con «destrucción» de la rentabilidad del capital existente.

## 6. Valor terminal: crecimiento y retorno consistente

**D:** En estabilidad el flujo disponible depende de NOPAT y reinversión: FCFF_terminal = NOPAT_terminal × [1 − g/ROIC_terminal]; terminal value = FCFF_terminal/(WACC_terminal − g). Si ROIC_terminal = WACC_terminal, mayor crecimiento estable deja de crear valor. Damodaran admite en casos sustentados **excesos de rentabilidad modestos** en estabilidad; no son automáticos. D-TERM-01, D-TERM-02 y D-VAL-09.

**J:** Comprobar **WACC_terminal > g** y g coherente con riesgo libre nominal/currency; que beta, estructura deuda y márgenes converjan a empresa madura. Mostrar el efecto sobre FCFF del primer año terminal y VP del terminal. Si el último año explícito mostraba 30% de ROIC marginal implícito y la perpetuidad fija 10%, explicar que el ROIC del capital nuevo converge; opcionalmente presentar un puente de erosión finita con años extra, **sin modificar las fórmulas originales**.

**Falsadores:** g > tasa libre nominal compatible, transición sin explicación, reinversión negativa perpetua sin soporte, múltiplo de salida mezclado dentro del DCF.

## 7. Arrendamientos — deuda, activos ROU y FCFF

**D:** La conversión tradicional de operating leases a deuda exige ajustar simultáneamente deuda, EBIT, depreciación, capital invertido y costo de capital. Los estándares posteriores a 2019 reconocen lease liabilities en balance; rehacer conversión sobre los mismos contratos **duplica** pasivos. Fuentes D-DEF-01 y D-TOOLS-LEASE (contenido del webcast **no verificado**, solo índice).

**J:** Elegir y documentar **una** representación internamente coherente:

- **Tratamiento operativo:** alquiler en EBIT, no reclasificar de nuevo a deuda financiera; advertir que el ROIC, WACC y el EV calculados son bases «sin reclasificación», y no confundir con haber capitalizado correctamente para comparables sectoriales.
- **Tratamiento como financiación (recast)**: reconocer pasivos ASC842 actuales (corriente + no corriente) como deuda económica, incorporar ROU/activos del contrato en capital invertido, retirar del EBIT la porción financiera equivalente y contabilizar depreciación, comparar el ajuste con notas de leases, actualizar WACC y deuda restada a EV, evitando restar dos veces gasto/deuda. Reconciliar también cierres y amortizaciones; recast en **auxiliar JMR**, no en fórmulas originales.

**Cuatro estados ante falta de dato:** (a) cero reportado; (b) contenido en otra línea con conciliación; (c) no aplicable; (d) PENDIENTE. Nunca sustituir corriente no desglosada por cero. El «Operating lease converter» de ejercicio anterior no es nueva deuda de cierre; no restarlo además de obligaciones ASC842 ya registradas.

**Falsadores/control:** comprobar activo ROU + pasivo no corriente + porción corriente en 10-Q, calendario de vencimientos y gasto lease; si falta detalle para EBIT, informar impacto acotado, no certificar un ROIC ajustado.

## 8. WACC, ERP y riesgo país

**D:** Exposición país depende de **operaciones y fuentes de ingresos**, no de sede. Para multinacionales ponderar por exposición de actividad con cuidado y no doble contar riesgos en flujos y tasas. D-CRP-01, D-VAL-04.

**J:** Registrar la pareja tasa libre/ERP con mismo corte y moneda; beta bottom-up y deuda; estimar exposición por país/región si hay datos. Si solo existe «fuera de EE. UU.», guardar rango y **proxy** como no validada, no escoger arbitariamente +1,8 pp porque el resto del mundo sea homogéneo. Documentar el camino del WACC al terminal (si riesgo exterior permanece, explicar desaparición de prima). Competencia IA en ventas/margen ≠ prima país.

**Falsadores:** exposición emergente distinta del mix imaginado, tipo de cambio, cambio de country risk, incoherencias entre fecha RF y ERP, tarifas y coste de la deuda.

## 9. Impuestos, NOL, opciones, SBC y valor del equity

**D:** FCFF requiere impuestos económicamente normalizados; NOL y diferidos afectan cash taxes pero no sustituyen tasa marginal perpetua. Del EV se restan reclamaciones financieras y se suman activos no operativos, antes de distribuir acciones. D-VAL-07 y D-VAL-ALL, y webcast opciones.

**J:** Separar tasa efectiva histórica de marginal; no perpetuar liberación extraordinaria de reserva de impuestos. SBC es compensación económica; opciones/RSU se reconocen de forma **no duplicada** por número de acciones y valor de reclamos según tipo. Caja e inversiones no operativas se suman solo si no contribuyen ya al FCFF.

## 10. Escenarios, incertidumbre y publicación

**D:** Historia debe sobrevivir prueba de posible, plausible, probable y cambios de información (capítulos 6–10). Un valor con confianza aparente no elimina incertidumbre.

**J:** Construir Conservadora, Base y Optimista con **mecanismos independientes**, más Disrupción aparte según JMR vigente. Cada escenario define para 1–5, 6–10 y terminal: crecimiento, margen, reinversión/S/C, ROIC, WACC/país, eventos que lo falsarían. El **promedio** no reemplaza la historia central. Extraer y reconciliar los DCF/matrices, multiples, FCFE y fuentes en el expediente.

**Gates de publicación adicionales al control matemático:**
1. ¿Todas las celdas del original Damodaran y sus comentarios coinciden contra una base verificada? Si no: PENDIENTE.
2. ¿Las fechas, unidades, deuda lease, I+D, NOL, capital invertido, opciones y acciones cuadran contra 10-Q/10-K? Si no: EN_REVISION bloqueada/candidato.
3. ¿Historias independientes y tres bloques no Base están calculados con el mismo contrato metodológico? Si no: PENDIENTE.
4. ¿Hay justificación y sensibilidad para ROIC marginal terminal, S/C y margen? Si no: REVISAR.
5. ¿Se ejecutaron CI, controles JSON, auditoría económica y revisión visual app con evidencia? Si no: no afirmar publicación certificada.

## Uso obligatorio de fuentes

Cada afirmación en ficha debe marcar [D] cuando describe una regla del profesor, [P] cuando cita un dato primario e [H] cuando es interpretación/hipótesis JMR. Registrar fuente URL, corte y qué la invalidaría. Las clases en video identificadas pero no transcritas solo dan **índice temático**, no se cita una frase o minuto inexistente. La biblioteca sirve al criterio del analista; **no agrega primas de riesgo ni descuentos automáticos**.
