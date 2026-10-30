# Estilo JMR — análisis fundamental en dos niveles
**Versión editorial 1.3 — 30 de octubre de 2026.**
Inspiración de legibilidad: el research de AZ Stocks (negocio → fundamentales → hipótesis → valoración). No reproducir sus textos ni convertir sus hipótesis en fuente propia. Autoridad: `modelo/REGLAS_VIGENTES.md` §9; los métodos A y B y los cálculos siguen intactos.

## Propósito
Un lector debe poder explicar, sin consultar una hoja de cálculo: **qué compra, cómo gana dinero el emisor, por qué puede o no crecer, cuánto capital requiere, qué retornos produce, qué supuestos hemos adoptado, cómo construimos el valor y qué tendría que cambiar para revisar la tesis.** La calidad de cada capítulo depende de su contenido, no de contar secciones o palabras.

## NIVEL 1 — Artículo de inversión, completo y narrativo

Portada: empresa, ticker, clase/ADR/moneda, revisión y fecha; tarjeta `Valor intrínseco Base`, cotización de referencia fechada, diferencia desde precio actual `(V−P)/P`, prima de cotización `(P−V)/V`, precio con MOS35% `0,65×V`; Base, Conservadora, Optimista, Disrupción separada y promedio ordinario solo de tres historias cuando todos los escenarios sean comparables. No mezclar revisiones. Conclusión sintética pero argumentada.

**Índice oficial de 13 capítulos con subtítulos adaptados al emisor:**

1. **Tesis de inversión y conclusión.** Qué empresa es, por qué puede valer más/menos, dos variables decisivas, reserva central, juicio de calidad y precio frente a valor. No es una recomendación automática.
2. **La empresa y su modelo económico.** Historia relevante, productos, clientes y segmentos, monetización (volumen/precio/mezcla), recurrencia, unit economics, exposición geográfica y dependencia de socios. Aterrizar lo que realmente factura y cobra.
3. **Industria, competencia y ventaja competitiva.** Mercado servible, rivales, sustitutos, dinámica competitiva, moat y duración, prueba de pricing power y amenazas concretas. **Las cinco fuerzas de Porter no son obligatorias ni forman parte del índice**; usar solo cuando aporte evidencia real.
4. **Motores del crecimiento futuro y ciclos económicos.** Drivers verificables, penetración, nuevos productos, guía, capacidad, catalizadores de ingresos, demanda y límites de crecimiento. Incluir subsecciones identificables «Ciclo de vida empresarial — Damodaran», «Ciclo macroeconómico, monetario y de crédito — Howard Marks» y «Mapa de transmisión a supuestos y probabilidades». Separar hechos observados, guía corporativa y tesis del analista.
5. **Historia financiera y calidad de resultados.** Hasta 10 años y LTM cuando haya: crecimiento y márgenes, beneficios GAAP/ajustados, flujos, capital de trabajo, caja, deuda y vencimientos, SBC, dilución y anomalías. Explicar las causas, no solo presentar ratios.
6. **Reinversión, eficiencia del capital y ROIC.** CAPEX físico, I+D capitalizable, contenido/intangibles, M&A, leasing y capital de trabajo, Sales-to-Capital histórico y marginal, desfases, NOPAT, ROIC/ROE incremental y terminal. La pregunta es cuánto cuesta sostener el crecimiento.
7. **Dirección, gobierno y asignación de capital.** Incentivos, disciplina de inversión, fusiones, dividendos, recompras, manejo de caja, gobernanza y derechos de accionistas.
8. **Nuestro proceso de valoración.** Fuente y corte, FCFF/FCFE/SOTP sectorial, Método A/B y versión, ajustes contables, elección del WACC/Ke, evidencia contraria, criterios de selección de múltiplos y contraste de independencia de AZ Stocks cuando exista. No confundir contraste externo con valor principal.
9. **Supuestos económicos y su justificación.** Explicar valor, trayectoria y fundamento de crecimiento, margen, tasa fiscal, reinversión, Sales-to-Capital, lag, ROIC y retorno terminal, WACC/Ke, g, dilución y deuda; por qué esos y no alternativas plausibles; qué evidencia y rangos los cambiarían. Cada supuesto material debe tener causalidad, no solo cifras.
10. **Valor intrínseco, escenarios y precio.** Interpretar Base como valor principal, historias Conservadora/Optimista y Disrupción aparte, promedio ordinario, MOS, DCF inverso, sensibilidades del Base y valores relativos por múltiplos. Distinguir precio de mercado, valor presente por acción y objetivo FY+3.
11. **Riesgos, tesis contraria y factores de ruptura.** Bull/bear en discusión integrada, riesgos cuantificables, probabilidad y vías de transmisión a flujos/tasa, errores de tesis y sucesos que invalidarían el modelo. Evitar doble castigo de riesgos.
12. **Catalizadores y plan de seguimiento.** Eventos materiales con fecha, resultados a seguir, indicadores líderes, umbrales de revisión, noticias relevantes y periodicidad de actualización. No inventar hitos.
13. **Fuentes, limitaciones y estado del estudio.** Fuentes primarias fechadas, secundarias identificadas, períodos de cifras, información ausente/material, estatus editorial, revisión visual y auditoría económica distinta. No llamar auditado a EN_REVISION.

## Lectura de los ciclos (obligatoria, específica y fechada)

**Damodaran — ciclo de vida corporativo:** clasificar y justificar la etapa (inicio, crecimiento joven, alto crecimiento, crecimiento maduro, madurez estable o declive). No basta con la antigüedad: documentar ventas, margen, flujos, inversión, ROIC, uso de caja, competencia y señales de transición. Vincular la etapa con la calidad del crecimiento, la reinversión marginal y el ROIC terminal. Libro base: *The Corporate Life Cycle: Business, Investment, and Management Implications* (2024), recursos del autor https://pages.stern.nyu.edu/adamodar/New_Home_Page/CLC.htm.

**Marks — mercado, macro, crédito y psicología:** registrar datos a fecha de corte: crecimiento y desaceleración/aceleración, inflación, trayectoria de tipos de interés (no confundir nivel con dirección), disponibilidad de crédito, inversión/consumo/empleo, emergentes/divisas y valoración/sentimiento. Diagnosticar la posición aproximada y posibles extremos, no afirmar una fase universal sin evidencia. Marco: *Mastering the Market Cycle: Getting the Odds on Your Side* (2018). Describir mecanismos sobre demanda, precios, financiación y valoraciones de **esa compañía**; escenarios alternativos e indicadores que refutarían el diagnóstico. Revisión posterior al corte no se incorpora retroactivamente sin etiquetarla.

**Probabilidades:** tomar las previas por etapa del §3 de REGLAS_VIGENTES. Los ajustes siguen siendo de 5 pp, con indicador, umbral, cruce y fecha, tope 15 pp por historia y suma 100 %. La matriz cualitativa «fase → driver → historia → señal» es válida aun cuando no haya prueba para variar probabilidades: indicar «sin ajuste, previa conservada». El ciclo es un contexto para el juicio y el seguimiento; no justifica subir/bajar el DCF mecánicamente.

**Principios de redacción.** Texto específico por emisor, causal y refutable; tablas cortas si ayudan a leer, con interpretación. Subcapítulos adaptables. No forzar cinco filosofías, Porter, una cuota fija de viñetas ni redundancias. Conservar párrafos existentes probados, actualizar los obsoletos con fuente, y no rellenar capítulos con texto intercambiable. Si no hay evidencia suficiente, mostrar pendiente explícito y **no declarar análisis completo**.

## NIVEL 2 — Soporte cuantitativo completo y reproducible

Índice propio y desplegable, **con tablas y fórmulas de la revisión**, no solo una tarjeta de parámetros. La existencia de un enlace a Google Sheets no reemplaza el anexo. Orden fijo, con adaptación sectorial:

1. **Identificación, fuentes y unidades:** ticker, clase, método/versión/revisión, moneda, corte contable y bursátil; fuentes primarias y celdas origen.
2. **Estados históricos y LTM:** Income Statement, Balance Sheet, Cash Flow Statement, datos 3/5/10 años, LTM, ingresos por segmento y por acción, reconcilación período/unidades.
3. **Ratios y economía del negocio:** crecimiento, márgenes, NOPAT, FCF, conversión de caja, deuda/caja, capital de trabajo, rotación, ROIC/ROE y Sales-to-Capital histórico y marginal.
4. **Puente contable a económico:** I+D capitalizado, arrendamientos incrementales, adquisiciones, opciones/SBC, preferentes, dilución, deuda, cash y doble conteo.
5. **Supuestos efectivos por historia:** tabla Base, Conservadora, Optimista, Disrupción con fuentes, fechas, trayectoria y referencias de celda. Si Input sheet tiene valores de referencia y la historia utiliza otra pestaña, aclarar la precedencia.
6. **Cost of capital descompuesto:** Rf, ERP/CRP, beta, Ke, Kd, impuesto, mezcla de capital y WACC inicial/terminal; hoja y fórmulas.
7. **Proyección explícita anual completa:** años 1–10 (o duración real del DCF) por historia; ventas, crecimiento, EBIT, margen, impuestos, NOPAT, reinversión, ROIC, capital, FCFF/FCFE, WACC, factores y VP.
8. **Valor terminal y puente hasta la acción:** FCFF terminal, g y g/ROIC, Ke/WACC terminal, TV, VP de flujos/TV, EV, deuda, caja, opciones, participaciones, acciones y Base por acción.
9. **Escenarios y ciclos:** previas y probabilidades finales, ajustes evidenciados, expectativas, cambios en drivers por ciclo, valores y promedio ordinario sin Disrupción. Si no hay ajuste medido, mostrar la previa intacta.
10. **Cinco múltiplos prioritarios y complementarios opcionales:** EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF deben evaluarse según relevancia y denominadores válidos; calcular las salidas aplicables FY+1/2/3, sus dividendos, descuento, peso y valor presente, con N/A o N/D fundamentado cuando proceda. P/S y P/BV se presentan **solo si aportan información fiable** o tienen peso en la revisión: su ausencia no vuelve incompleto el análisis. Los múltiplos son precio relativo secundario, no el valor intrínseco principal.
11. **Sensibilidades DCF y de múltiplos + inverso:** tres matrices DCF Base 5×5 mínimas (WACC×g, ROIC terminal×g, crecimiento explícito×margen), ampliaciones solo si están verificadas y centro concilia; matrices 5×5 de los **cinco métodos prioritarios aplicables y verificables**; P/S y P/BV **solo opcionalmente** si cuentan con fundamento y fuente confiable, con múltiplo real × fundamental FY+3 (unidades) y VP por acción como resultado, centro conciliado al VP3 **de ese método**. Añadir ancla observada LTM del múltiplo si existe fuente homogénea (comparativa, nunca sustituye ancla JMR). Mostrar N/D/N/A con causa cuando no pueda producirse matriz legítima. Sensibilidades de múltiplo económicamente justificado son secundarias y NO se confunden con valores por acción. DCF inverso con precio de referencia cuando esté calculado.
12. **Trazabilidad, reconciliaciones y límites:** fórmula algebraica más celda/fórmula nativa comprobada donde proceda, identidades, controles ejecutados/no ejecutados, advertencias de materialidad, fuente y enlaces.

Prohibido inventar valores, completar ausencias con cero, utilizar matrices de otra revisión o llamar auditado a EN_REVISION. Los informes de financieras usan FCFE/Ke y solvencia; holdings, SOTP. La auditoría económica es un archivo/proceso posterior.

N1 explica los supuestos y conclusiones; N2 deja comprobar sus cifras. N1 no se reemplaza con enlaces `Ver cálculo`; los enlaces deben ir al soporte pertinente. La ficha pública/privada, la hoja y el JSON comparten revisión.

## Proceso de actualización
1. Identificar ficha y última hoja oficial del ticker. Respaldar la narrativa y separar lo vigente de lo histórico.
2. Mapear cada sección existente a un capítulo nuevo, revisar duplicados y contradicciones, y preservar fuentes/cifras; los anexos técnicos completos permanecen en N2.
3. Completar investigación específica por capítulo donde falte, con fuente y fecha; no aprobar completitud por nombre de título.
4. Controlar conservación de hechos, cifras y párrafos, coherencia de precio y escenarios, fuentes, estructura N1/N2 y estado EN_REVISION. Auditoría económica es una operación posterior.
5. Publicar solamente lo realmente comprobado: distinguir **estructura migrada**, **contenido editorial completo**, **despliegue READY** y **auditoría económica**.

**Alcance inicial:** informes con revisión actualizada, principalmente Método A-1.2; los legados no actualizados pueden seguir con índice anterior, claramente identificado. Conserva versiones en Git.
