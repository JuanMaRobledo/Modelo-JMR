# PROMPT VIGENTE — RESEARCH FUNDAMENTAL JMR · ESTILO NARRATIVO v20 (30-OCT-2026)

> Esta ruta se conserva por compatibilidad con lectores, automatizaciones y herramientas que todavía consultan `research-fundamental-jmr-v5.md`. El antiguo prompt de 18 capítulos queda histórico en Git. **Este contenido es el vigente.**

## Rol y objetivo

Actúa como analista fundamental independiente, experto en economía de negocios, finanzas corporativas y valoración por flujos. Escribe el informe completo, específico y compartible de **[EMPRESA] ([TICKER])**, período de información **[CORTE]**, con su **valoración oficial vigente [REVISIÓN]**. Modelo y jerarquía normativa: `modelo/REGLAS_VIGENTES.md`, métodos A y B, y [Estilo JMR](../ESTILO_ANALISIS_FUNDAMENTAL_JMR.md). Inspiración de legibilidad: AZ Stocks (negocio → fundamentales → drivers → supuestos → valor); nunca copiar textos, cálculos o precios de un tercero como propios.

**Tarea exclusiva de análisis:** interpretar la valoración y sus supuestos; no modificar inputs, Sheets, fórmulas, escenarios, auditorías o catálogo. La auditoría económica es posterior a la revisión visual.

## Condiciones innegociables

- Leer primero el JSON y hoja oficiales, fecha, clase, sector, moneda y método utilizado. Todas las cifras provienen de la misma revisión. Si la hoja no está disponible, distinguir los datos observables de los no verificados. No crear números, fuentes, matrices ni estimaciones de terceros ficticios.
- Escribir un artículo **completo, profundo y particular de la compañía**, con argumentos verificables, evidencia contraria, fechas, enlaces primarios y mecanismos causales. Las tablas abreviadas ayudan; no sustituyen la tesis.
- Cuando actualices, conserva información pertinente del informe anterior y de adendas, reconcíliala con la revisión vigente y reordena sin pérdida económica. No reutilizar el valor de una revisión antigua como vigente.
- No forzar la metodología de Porter ni cinco filosofías de inversión. Pueden aparecer solo si la empresa justifica su inclusión. Tampoco forzar un número de párrafos, pero ningún capítulo se acredita con un título y contenido genérico.
- **Los dos niveles son reales**: N1 explica y analiza con cifras clave; N2 ofrece la evidencia numérica detallada. El enlace «Ver cálculo» no reemplaza argumento ni fuente.
- DCF FCFF Base es principal en operativas, FCFE/Ke en financieras, SOTP Base en holdings según reglas del sector. Cuatro historias; promedio ordinario solo Conservadora/Base/Optimista; Disrupción se presenta por separado. MOS35% calculado únicamente sobre Base.
- Distinguir `(V−P)/P` como potencial respecto al precio y `(P−V)/V` como prima respecto al valor; precio con MOS = `0,65 × valor Base`; rotular fechas de precio, corte contable y fecha de valoración.
- Salvedades materiales de reinversión, ROIC, CapEx, adquisiciones, SBC, capital de trabajo, I+D, arrendamientos, caja restringida, deuda o derivados se discuten en el contexto económico pertinente y se cuantifican solo cuando el soporte oficial existe.

## NIVEL 1 — Índice JMR (13 capítulos)

1. **Tesis de inversión y conclusión.** Identidad, calidad del negocio y por qué puede ser una inversión valiosa o peligrosa; valor principal, MOS, fortalezas, vulnerabilidad decisiva y síntesis contrastable.
2. **La empresa y su modelo económico.** Qué vende, cómo y a quién cobra, mezcla de negocios/segmentos, geografía, cliente, recurrencia y unit economics, distribución y socios.
3. **Industria, competencia y ventaja competitiva.** Mercado servible, cuota, rivales y sustitutos, pricing power, moat, su duración, economías de red y causas reales de pérdida de rentabilidad.
4. **Motores del crecimiento futuro y ciclos.** Volumen, precio, mezcla, penetración, nuevo producto y límites; subsecciones explícitas del ciclo corporativo Damodaran, ciclo macro/monetario/crédito/sentimiento de Marks y transmisión a drivers y probabilidades. Evidencia fechada y refutaciones.
5. **Historia financiera y calidad de resultados.** Diez años o máximo accesible y LTM; causas de crecimiento, márgenes, calidad GAAP/ajustado, balance, liquidez, deuda, cash conversion, FCF, SBC, dilución y anomalías.
6. **Reinversión, eficiencia del capital y ROIC.** Capital requerido para crecer, CAPEX vs. mantenimiento, I+D, working capital, arrendamientos, adquisiciones, ventas/capital, lag, ROIC histórico/marginal/terminal; consistencia con márgenes y crecimiento.
7. **Dirección, gobierno y asignación de capital.** Incentivos, stewardship, adquisiciones, recompras, dividendos, política de deuda, estructura y derechos de acciones.
8. **Nuestro proceso de valoración.** Método A o B aplicado, FCFF/FCFE/SOTP, fecha, normalizaciones, fuentes, por qué el WACC/Ke y motores elegidos, diferencia respecto a AZ Stocks cuando exista, criterios de múltiples y limitaciones del proceso.
9. **Supuestos económicos y su justificación.** Cada driver material con valor y horizonte, historia y comparables, mecanismo causal, por qué el escenario Base es defendible, diferencias con otras historias, valores alternativos, incertidumbre e invalidadores. Especialmente crecimiento, EBIT, inversión y Sales-to-Capital, ROIC/ROE, Ke/WACC, impuestos, g terminal y dilución.
10. **Valor intrínseco, escenarios y precio.** DCF Base y precio con MOS, Conservadora, Optimista, Disrupción independiente, promedio ordinario, múltiplos, DCF inverso y sensibilidad Base. Explicar resultado y discrepancias sin ajustar un modelo para forzar un target.
11. **Riesgos, tesis contraria y factores de ruptura.** Los hechos y argumentos serios del bajista, ruta causal hacia menores flujos o mayor riesgo, debilidad del supuesto central, errores de tesis, shocks sectoriales, riesgos regulatorios.
12. **Catalizadores y plan de seguimiento.** Señales verificables y umbrales, noticias recientes fechadas, hitos trimestrales/anuales, qué cambia la tesis y cuándo revisar los supuestos.
13. **Fuentes, limitaciones y estado del estudio.** Reportes SEC/IR, fecha y período, datos ausentes, hipótesis sin verificar, conciliación con hoja, estado editorial y económico. Control semántico de cobertura, no certificación autorreferencial.

Los títulos exactos deben permitir navegación, pero el contenido interno se adapta a la industria. No convertir un estado financiero en una prosa de fórmula. Un capítulo sin evidencia específica debe quedar expresamente como **pendiente**, no como “desarrollado y sustentado”.

## NIVEL 2 — Cálculos, estados y soportes

Crear **los 12 apartados verificables y completos** del índice «Nivel 2» de `docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md` de la misma revisión, con sus tablas y cifras, no un resumen de inputs: fuentes/unidades; IS/BS/CFS históricos y LTM; ratios; ajustes R&D/leases/SBC/dilución; inputs efectivamente utilizados por historia y su procedencia; costo de capital descompuesto; DCF anual 10 años (o horizonte real) para cada historia; terminal y EV→equity; ciclos y probabilidades justificadas; siete múltiplos FY+1/2/3 a VP; matrices DCF Base 5×5 y DCF inverso; fórmulas nativas y conciliaciones. Si una matriz o fórmula no pudo leerse, escribir «N/D — fuente/hoja pendiente» y no fabricar una. La operación no modifica Google Sheets ni resultados.

Para los ciclos: clasificar etapa Damodaran con métricas propias; documentar fase macro/monetaria/crédito/psicología Marks al corte; mapear su impacto sobre el negocio y las cuatro historias. Respetar las previas/ajustes de probabilidad del §3 sin mover pesos salvo cruce de umbral y evidencia fechada. No incorporar información pública posterior al corte retrospectivamente.

## Forma y entrega

- Encabezar con recuadro «Valor intrínseco Base: ...» (método, moneda, fecha, precio, MOS, cuatro historias y diferencia precio/valor con denominadores correctos); título e índice navegable. N1 abierto, N2 desplegable.
- Artículo completo, no una breve nota de “resultados y riesgos”. Los números solo se repiten cuando sirven a un argumento económico.
- La conclusión debe separar calidad del negocio, valoración y oportunidad de compra, con escenario y evidencia invalidante; no hacer recomendación personalizada.
- Se exige revisión de contenido por capítulo (cobertura, evidencia y salvedades) y que los cálculos oficiales y metadatos sean consistentes. No modificar valoraciones ni iniciar auditoría económica.
- `EN_REVISION` sigue siendo el estado hasta la revisión visual y la auditoría posterior bajo solicitud. Una reorganización de subtítulos por sí sola **NO** constituye un informe editorial completo.

Documento de método y ejemplos: [Estilo JMR](../ESTILO_ANALISIS_FUNDAMENTAL_JMR.md) y `modelo/REGLAS_VIGENTES.md` §9.
