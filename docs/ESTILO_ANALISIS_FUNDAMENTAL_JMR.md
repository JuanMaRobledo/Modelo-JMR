# Estilo JMR — análisis fundamental en dos niveles
**Versión editorial 1.0 — 30 de octubre de 2026.**
Inspiración de legibilidad: el research de AZ Stocks (negocio → fundamentales → hipótesis → valoración). No reproducir sus textos ni convertir sus hipótesis en fuente propia. Autoridad: `modelo/REGLAS_VIGENTES.md` §9; los métodos A y B y los cálculos siguen intactos.

## Propósito
Un lector debe poder explicar, sin consultar una hoja de cálculo: **qué compra, cómo gana dinero el emisor, por qué puede o no crecer, cuánto capital requiere, qué retornos produce, qué supuestos hemos adoptado, cómo construimos el valor y qué tendría que cambiar para revisar la tesis.** La calidad de cada capítulo depende de su contenido, no de contar secciones o palabras.

## NIVEL 1 — Artículo de inversión, completo y narrativo

Portada: empresa, ticker, clase/ADR/moneda, revisión y fecha; tarjeta `Valor intrínseco Base`, cotización de referencia fechada, diferencia desde precio actual `(V−P)/P`, prima de cotización `(P−V)/V`, precio con MOS35% `0,65×V`; Base, Conservadora, Optimista, Disrupción separada y promedio ordinario solo de tres historias cuando todos los escenarios sean comparables. No mezclar revisiones. Conclusión sintética pero argumentada.

**Índice oficial de 13 capítulos con subtítulos adaptados al emisor:**

1. **Tesis de inversión y conclusión.** Qué empresa es, por qué puede valer más/menos, dos variables decisivas, reserva central, juicio de calidad y precio frente a valor. No es una recomendación automática.
2. **La empresa y su modelo económico.** Historia relevante, productos, clientes y segmentos, monetización (volumen/precio/mezcla), recurrencia, unit economics, exposición geográfica y dependencia de socios. Aterrizar lo que realmente factura y cobra.
3. **Industria, competencia y ventaja competitiva.** Mercado servible, rivales, sustitutos, dinámica competitiva, moat y duración, prueba de pricing power y amenazas concretas. **Las cinco fuerzas de Porter no son obligatorias ni forman parte del índice**; usar solo cuando aporte evidencia real.
4. **Motores del crecimiento futuro.** Drivers verificables, penetración, nuevos productos, guía, capacidad, catalizadores de ingresos, demanda y límites de crecimiento. Separar datos observados, guía corporativa y tesis del analista.
5. **Historia financiera y calidad de resultados.** Hasta 10 años y LTM cuando haya: crecimiento y márgenes, beneficios GAAP/ajustados, flujos, capital de trabajo, caja, deuda y vencimientos, SBC, dilución y anomalías. Explicar las causas, no solo presentar ratios.
6. **Reinversión, eficiencia del capital y ROIC.** CAPEX físico, I+D capitalizable, contenido/intangibles, M&A, leasing y capital de trabajo, Sales-to-Capital histórico y marginal, desfases, NOPAT, ROIC/ROE incremental y terminal. La pregunta es cuánto cuesta sostener el crecimiento.
7. **Dirección, gobierno y asignación de capital.** Incentivos, disciplina de inversión, fusiones, dividendos, recompras, manejo de caja, gobernanza y derechos de accionistas.
8. **Nuestro proceso de valoración.** Fuente y corte, FCFF/FCFE/SOTP sectorial, Método A/B y versión, ajustes contables, elección del WACC/Ke, evidencia contraria, criterios de selección de múltiplos y contraste de independencia de AZ Stocks cuando exista. No confundir contraste externo con valor principal.
9. **Supuestos económicos y su justificación.** Explicar valor, trayectoria y fundamento de crecimiento, margen, tasa fiscal, reinversión, Sales-to-Capital, lag, ROIC y retorno terminal, WACC/Ke, g, dilución y deuda; por qué esos y no alternativas plausibles; qué evidencia y rangos los cambiarían. Cada supuesto material debe tener causalidad, no solo cifras.
10. **Valor intrínseco, escenarios y precio.** Interpretar Base como valor principal, historias Conservadora/Optimista y Disrupción aparte, promedio ordinario, MOS, DCF inverso, sensibilidades del Base y valores relativos por múltiplos. Distinguir precio de mercado, valor presente por acción y objetivo FY+3.
11. **Riesgos, tesis contraria y factores de ruptura.** Bull/bear en discusión integrada, riesgos cuantificables, probabilidad y vías de transmisión a flujos/tasa, errores de tesis y sucesos que invalidarían el modelo. Evitar doble castigo de riesgos.
12. **Catalizadores y plan de seguimiento.** Eventos materiales con fecha, resultados a seguir, indicadores líderes, umbrales de revisión, noticias relevantes y periodicidad de actualización. No inventar hitos.
13. **Fuentes, limitaciones y estado del estudio.** Fuentes primarias fechadas, secundarias identificadas, períodos de cifras, información ausente/material, estatus editorial, revisión visual y auditoría económica distinta. No llamar auditado a EN_REVISION.

**Principios de redacción.** Texto específico por emisor, causal y refutable; tablas cortas si ayudan a leer, con interpretación. Subcapítulos adaptables. No forzar cinco filosofías, Porter, una cuota fija de viñetas ni redundancias. Conservar párrafos existentes probados, actualizar los obsoletos con fuente, y no rellenar capítulos con texto intercambiable. Si no hay evidencia suficiente, mostrar pendiente explícito y **no declarar análisis completo**.

## NIVEL 2 — Soporte cuantitativo

Índice propio y desplegable; incluir (según el sector y las fuentes disponibles): estados históricos (IS/BS/CFS), LTM, ratios y series, puente GAAP→económico, I+D/leases/SBC/opciones, ingresos por segmento, hojas Input y Cost of Capital, trayectoria explícita a 10 años, reinversión por año, ROIC y crecimiento terminal, flujos y EV→equity, acciones, Base/Conservador/Optimista/Disrupción, DCF inverso, matrices de sensibilidad **solo Base**, los siete métodos de múltiplos y sus matrices cuando existan, comparación con AZ Stocks de procedencia independiente, reconciliaciones, controles y links a hojas. Nunca inventar matrices no construidas ni tratar una calculadora local como oficial.

N1 explica los supuestos y conclusiones; N2 deja comprobar sus cifras. N1 no se reemplaza con enlaces `Ver cálculo`; los enlaces deben ir al soporte pertinente. La ficha pública/privada, la hoja y el JSON comparten revisión.

## Proceso de actualización
1. Identificar ficha y última hoja oficial del ticker. Respaldar la narrativa y separar lo vigente de lo histórico.
2. Mapear cada sección existente a un capítulo nuevo, revisar duplicados y contradicciones, y preservar fuentes/cifras; los anexos técnicos completos permanecen en N2.
3. Completar investigación específica por capítulo donde falte, con fuente y fecha; no aprobar completitud por nombre de título.
4. Controlar conservación de hechos, cifras y párrafos, coherencia de precio y escenarios, fuentes, estructura N1/N2 y estado EN_REVISION. Auditoría económica es una operación posterior.
5. Publicar solamente lo realmente comprobado: distinguir **estructura migrada**, **contenido editorial completo**, **despliegue READY** y **auditoría económica**.

**Alcance inicial:** informes con revisión actualizada, principalmente Método A-1.2; los legados no actualizados pueden seguir con índice anterior, claramente identificado. Conserva versiones en Git.
