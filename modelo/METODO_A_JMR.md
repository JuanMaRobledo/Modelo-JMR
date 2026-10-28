# MÉTODO A — Calibración fundamental basada en evidencia

**Identificador:** `A` · **Versión:** `A-1.1` · **Fecha:** 28-oct-2026 · **Estado:** especificación normativa para nuevas valoraciones; todavía sin validación prospectiva.

> Este es un método JMR alternativo de **estimación y justificación de supuestos**. Utiliza exactamente el mismo motor de valoración que el Método B (DCF/FCFE/SOTP según compañía, siete múltiplos, escenarios, MOS y control técnico). No modifica fórmulas de Google Sheets, selectores, fuentes contables ni las reglas operativas de publicación. Sus reglas particulares prevalecen sobre las recomendaciones de calibración del Método B; los controles comunes de `modelo/REGLAS_VIGENTES.md` prevalecen en cálculos, materialidad, seguridad y publicación.

## A.1 Propósito y principios

1. La Base debe representar la historia económica central más probable sustentada por datos, **no una hipótesis prudente**. La prudencia se expresa separadamente en el MOS, no con sucesivos recortes del crecimiento o del ROIC.
2. Las proyecciones nacen de **drivers observables** (mercado, volumen, precio, mezcla, clientes, unidades, adquisiciones, capital y costos) y se contrastan con **tasas base externas** de empresas comparables en tamaño, negocio, etapa, geografía y ciclo.
3. Los supuestos se estiman **conjuntamente**: crecimiento, margen EBIT, reinversión/Sales-to-Capital, ROIC/RONIC, impuesto y WACC deben contar una misma historia. Un supuesto no se elige para producir un precio objetivo.
4. Los históricos se normalizan: hechos no recurrentes, adquisiciones, cambios contables, I+D capitalizable, arrendamientos, SBC/dilución y cambios de perímetro. Cada ajuste exige conciliación con los estados primarios.
5. Se distinguen rigurosamente `[Dato]`, `[Cálculo]` y `[Juicio]`, y cada juicio registra soporte y argumentos en contra. **Nunca completar N/D con cero** ni presentar un promedio sectorial como predicción de una empresa.
6. La IA elige supuestos y fuentes; las fórmulas oficiales producen el valor. No se alteran fórmulas para optimizar el resultado ni se modifican los 46 tabs de la plantilla.

## A.2 Evidencia y universo de referencia

Para cada empresa recopilar, en lo disponible: 5–10 años anuales, LTM/último trimestre, información por segmento/geografía, fuentes primarias SEC/SFC/emisor, valoraciones ajustadas por cambios de moneda, guía y contratos fechados, sector de Damodaran, comparables verificables, histórico del precio solo para DCF inverso.

**Construcción de clases de referencia (outside view):** documentar criterios de inclusión, tamaño de muestra, intervalo temporal, tamaños iniciales, etapa de vida, comparabilidad del modelo, criterios de exclusión y sesgo de supervivencia. Incluir no solo supervivientes cuando haya datos. Reportar mediana, percentiles 10/25/75/90 y dispersión, o indicar que la distribución no se puede estimar. No inventar cuantiles ni reutilizar la distribución de un sector distinto.

**Inside view:** construir predicción verificable desde drivers del negocio. Comparar con outside view y explicar desviaciones. Si las clases no son homogéneas, usar varias cohortes como sensibilidad, no forzar una media. No hay ponderaciones fijas entre histórico, pares, tasa base y previsión: deben justificarse por pertinencia y calidad. Un ajuste bayesiano o shrinkage estadístico solo puede anunciarse cuando se estimen explícitamente la distribución previa, la evidencia y el mecanismo de actualización; de otro modo es juicio contrastado, no una calibración estadística certificada.

## A.3 Ingresos

| Horizonte | Estimación obligatoria | Controles |
|---|---|---|
| Año 1 | Segmentar ingresos = volumen × precio × mezcla (o usuarios × frecuencia × ticket, tiendas × ventas por tienda, unidades × ASP, etc.). Separar orgánico, FX y adquisiciones. | Conciliar con LTM, guía a fecha de corte, capacidad y estacionalidad. |
| Años 2–5 | Combinar mercado alcanzable, crecimiento del mercado, cuota, introducción de productos y capacidad de ejecución; hacer explícita la monetización. | CAGR contra percentiles de clase de referencia; tamaño final vs mercado y rivales. |
| Años 6–10 o horizonte real del DCF | Modelar saturación, madurez, convergencia, restricciones físicas y competencia. | No extrapolar indefinidamente; comprobar mercado final y share plausible. |
| Perpetuidad | Mantener la regla monetaria y techo vigente de la casa: 4% nominal USD por defecto sujeto a tasa libre; excepciones por moneda y sector documentadas. | WACC > g; crecimiento terminal financiable y reinversión sostenible. |

Si faltan desgloses, emplear un puente top-down con mercado/cartera de pedidos y declarar menor confianza; no fabricar segmentación.

## A.4 Márgenes, impuestos y unidad económica

- **EBIT año 0:** partir de LTM reportado y conciliar ajustes recurrentes/no recurrentes, SBC, arrendamientos e I+D cuando apliquen. No usar EBITDA como EBIT. Evitar que capitalización de I+D sea contabilizada a la vez como ahorro operativo y crecimiento gratis.
- **Margen objetivo:** estimar mix, pricing power, costos variables/fijos, escala, competencia y madurez. Anclar contra el mismo negocio, unidades y tratamiento contable. Justificar cómo se llega al margen, cuándo y por qué se sostiene.
- **Trayectoria:** año 1, transición y margen final deben reflejar decisiones de negocio verificables; no interpolar mecánicamente si la fuente indica un escalón concreto. En la plantilla mantener la fórmula oficial de convergencia: si la hipótesis no cabe en su estructura, reportar limitación y proponer cambio separado al motor, nunca sustituir fórmula.
- **Impuestos:** efectivos inicialmente cuando sean representativos y marginales a perpetuidad; conciliar NOL, pérdidas y jurisdicciones según las reglas compartidas.

## A.5 Reinversión, eficiencia del capital y ROIC

- Distinguir `Sales-to-Capital` **promedio** = Ventas / Capital invertido de la relación **incremental** usada para proyectar: `ΔIngresos / Reinversión asociada`, con desfases y adquisiciones explícitos. No convertir el cociente histórico en una regla universal.
- Reconstruir reinversión económica: capex neto, cambios de capital de trabajo no monetario, adquisiciones y ajustes coherentes con I+D y arrendamientos; mantener definiciones consistentes entre denominadores y numeradores. Documentar preinversión, capacidad ociosa y desfases de monetización.
- `ROIC = NOPAT / Capital invertido` y `ROIC ≈ margen EBIT después de impuestos × (Ventas / Capital invertido)` son **chequeos de consistencia** para definiciones homogéneas. No inferir automáticamente ROIC incremental multiplicando margen por Sales-to-Capital marginal.
- Estimar separadamente rentabilidad sobre capital existente y **RONIC** de inversión nueva cuando existan datos. Si capital invertido es negativo o casi nulo, no utilizar ratios distorsionados como calibradores.
- La proyección debe explicar dónde se reinvierte cada incremento material y cómo produce crecimiento; comprobar que mayores ingresos exigen inversión o capacidad ociosa demostrada.


### A.5.1 Regla operativa obligatoria de calibración de reinversión (A-1.1)

La hoja `Supuestos Recomendados`, dentro de las 46 pestañas existentes, contiene un panel **diagnóstico** (sin valores empresariales en las plantillas en blanco). Para cada revisión A nueva, el analista debe registrar y comprobar lo siguiente antes de cerrar los supuestos:

1. **Periodo y contabilidad comparables.** Calcular por separado `Ventas/Capital invertido` (cociente promedio meramente descriptivo) y `ΔIngresos/Reinversión asociada` o `ΔIngresos/ΔCapital invertido ajustado` (ratio marginal). Normalizar I+D, adquisiciones, arrendamientos, caja operativa y financiamiento, con los **mismos periodos y perímetros**; no aceptar una variación LTM contra doce meses no comparables. Divisiones por cero, capital negativo, cambios contables y cifras ausentes → N/D documentado, no cero.
2. **Desfase explícito.** Identificar si la inversión del año n financia ventas de n o n+1. Probar los lags 0 y 1 **en copias de cálculo separadas**, manteniendo el resto de los supuestos, y comparar el valor presente de **todos** los flujos, incluido el terminal. El delta de reinversión del primer año es una señal y **NO** el cambio total en valoración; no elegir un lag porque aumente el precio.
3. **Reinversión económica trazable.** Reconciliar `capex − D&A + ΔNWC no monetario + adquisiciones + inversión I+D capitalizada y otros ajustes necesarios` con reinversión prevista. El mecanismo debe explicar capacidad instalada, capex de mantenimiento/expansión, crecimiento en ingresos y adquisiciones. Un `FCFF < 0` o `reinv/NOPAT > 100%` es admisible en empresas en expansión: **requiere explicación y pruebas, no una corrección automática**.
4. **ROIC/RONIC y terminal.** Mostrar ROIC actual, ROIC año 10, ROIC terminal y la diferencia; distinguir retorno sobre capital existente de marginal, y comprobar `reinversión estable = NOPAT × g/ROIC_terminal`, `g < WACC` y, cuando corresponda, `g < ROIC`. Una caída brusca en el año terminal puede ser un juicio válido, pero debe constar su causa y su impacto; no elevarlo sin evidencia competitiva.
5. **Negocios híbridos que financian clientes o préstamos.** Antes de usar FCFF consolidado, identificar Commerce/Operaciones y Fintech/Crédito; separar ingresos, EBIT/provisiones, cartera de crédito, capital propio exigido, financiamiento fintech, fondos y caja restringida. Para actividades financieras puras usar FCFE/Ke y capital regulatorio/patrimonial cuando la información lo permita; para híbridas decidir un puente de segmentos económicamente consistente o SOTP. **No aplicar automáticamente FCFE bancario a toda fintech ni restar como deuda industrial la financiación crediticia y los fondos de clientes sin conciliar la contrapartida.** Evitar doble conteo al recomponer equity y WACC.
6. **Discrepancias y relevancia.** Si el histórico marginal, el ratio implícito, el desfase o el puente financiero no se pueden justificar, registrar N/D y rango de impacto, señalando `POR_REVISAR_REINVERSION`. Aplicar los umbrales comunes de materialidad sobre escenarios alternativos completos y simultáneamente consistentes, **sin** sobrescribir una valoración ya publicada. Un dato insuficiente o una clasificación ambigua no autoriza retocar el DCF para subir su precio.

**Flujo de corrección de legados:** identificar primero las empresas potencialmente afectadas, priorizar híbridas y casos con diferencias materiales; preservar `revision_id`, supuestos y valores originales; crear un nuevo expediente con nuevo corte y método explícito; mantenerlo `EN_REVISION` hasta la revisión visual; realizar auditoría económica independiente solamente después de que el usuario la solicite. Las plantillas no contienen pestañas de auditoría.

**Documentos primarios:** Damodaran, *Looking Forward: Estimating Growth* (§Sales to Capital and ROIC), https://people.stern.nyu.edu/adamodar/pdfiles/papers/growth.pdf ; Damodaran, *Valuation Today* (§3 Sales to Invested Capital), https://pages.stern.nyu.edu/~adamodar/pdfiles/execs/val2day2023.pdf ; para híbridos usar también la conciliación de crédito/fondeo del emisor y la distinción FCFF/FCFE en https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/bankvaluedriver.htm .

## A.6 Persistencia competitiva y valor terminal

- Estimar la duración del spread `ROIC − WACC` a partir de churn/retención, efectos de red, regulación, propiedad intelectual, márgenes de competidores, ventajas de costo, escala, amenaza de sustitución y evidencia contraria.
- Construir una trayectoria de convergencia **no arbitraria**: sin ventaja → competencia/WACC; ventaja moderada → nivel sectorial o punto intermedio justificable; ventaja durable → spread sostenible con evidencia. Conservar el horizonte real del motor; nunca afirmar 20 años usando un DCF de 10 años sin motor congruente.
- Verificar `WACC_terminal > g_terminal` y `ROIC_terminal > g_terminal` cuando haya reinversión positiva. Reintegrar reinversión terminal `g / ROIC` de forma consistente con el mecanismo del motor; usar sensibilidad si el valor terminal domina la valoración.
- Para entidades financieras el análogo es ROE sostenible, crecimiento del patrimonio y exigencia de capital; para holdings, SOTP por participadas, costos de holding y descuento justificable sin doble conteo.

## A.7 WACC/Ke y riesgo

Se mantienen las reglas JMR vigentes: Rf, ERP y CRP del corte compatible; beta bottom-up y apalancamiento; Ke/Kd según moneda; deuda y preferentes a valor de mercado; método Detailed en `Cost of capital worksheet` para operativas; FCFE/Ke para financieras; SOTP con tasas por activo para holdings. Evitar castigar el mismo riesgo simultáneamente en flujos, WACC y probabilidad. No cambiar WACC para acercar DCF al precio observado.

## A.8 Historias, probabilidades y múltiplos

- **Cuatro historias completas:** Base, Conservadora, Optimista y Disrupción. Cada historia se formula modificando **drivers económicos**, no aplicando porcentajes simétricos arbitrarios a todas las salidas.
- Disrupción debe describir causalmente el deterioro: cuota/mercado, margen, capacidad de reinversión, dilución o fracaso, sin duplicar riesgos. Se informa aparte del promedio ordinario de Conservadora/Base/Optimista.
- Para comparabilidad inicial se mantienen previas por ciclo vital, ajustes de 5 puntos porcentuales basados en disparadores y límites del §3 de reglas comunes. Las tasas base empíricas pueden justificar un ajuste sujeto a ese mecanismo; no sustituir probabilidades automáticamente.
- **Siete múltiplos obligatorios** EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF, P/S, P/BV: calcular con fórmulas oficiales aunque su peso sea cero, y justificar múltiples de salida con ciclo, fundamentales y tasas según §5. La evidencia de A mejora **inputs**, no inventa un motor nuevo.

## A.9 Control de coherencia: puerta de aceptación A

Antes de cargar en la copia de Google Sheets producir una **ficha de calibración por cada entrada material**, con campos:

1. `variable`, `unidad`, `periodo`, `celda_objetivo` y `metodo=A`, `version=A-1.0`;
2. `[Dato]`: histórico/LTM normalizado, ajuste, fuente primaria, URL/página, fecha de publicación y fecha de corte;
3. `[Referencia]`: pares/cohorte/sector, criterios, N, distribución disponible, tratamiento contable y fecha;
4. `[Juicio]`: valor propuesto, mecanismo causal, intervalo razonable, justificación a favor y evidencia que lo contradice;
5. `consistencia`: efecto sobre EBIT, crecimiento final, reinversión, ROIC/RONIC, riesgo, flujo y terminal; discrepancias;
6. `confianza`: alta/media/baja con motivo; incertidumbre material o N/D; señal que refutaría y seguimiento.

**Controles obligatorios:** a) ingresos proyectados congruentes con tamaño y TAM; b) margen consistente con competencia y escala; c) inversión suficiente para crecimiento o capacidad libre demostrada; d) EBIT, ROIC y Sales-to-Capital contablemente comparables; e) no doble contabilización de riesgos, opciones, leases, NOL y preferentes; f) monedas/fechas/unidades correctas; g) sensibilidad DCF Base conciliada con hoja; h) precio usado **solo después** para DCF inverso.

Cuando no se pueda sostener un valor material, no inventarlo: documentar N/D, investigar más o conservar estado PENDIENTE si la incertidumbre no puede acotarse según materialidad común.

## A.10 Seguimiento y recalibración

Guardar **fuera de la plantilla y fuera de la auditoría**, por ticker/revisión y fecha: vector de supuestos pronosticados, intervalos, probabilidades, cohortes utilizadas y resultados futuros realizados; no actualizar retroactivamente la foto inicial. Comparar horizontes 1/3/5 años; errores por nivel, sesgo, sector y etapa, cobertura de rangos, calibración de probabilidades cuando haya muestra suficiente. No optimizar el método con información posterior al corte ni asumir que acercarse al precio de mercado prueba precisión. Cualquier ajuste de reglas requiere backtesting **fuera de muestra**, análisis de estabilidad y nueva versión A.

## A.11 Integración y comparación con B

- Las valoraciones existentes sin etiqueta mantienen método **B (legado)**; no se recalculan.
- En una valoración **nueva** consignar `metodo_valoracion: A`, `version_metodo: A-1.1`, `fecha_corte`, `revision_id`, `sheet_id` en el expediente/JSON. Si se comparan A y B para una empresa, dos revisiones o ejecuciones **aisladas**, con mismos datos y fecha de corte y copia de plantilla por método; no mezclar inputs A y B en una sola ficha vigente.
- Misma estructura oficial de 46 pestañas. La ficha A se registra en `Origen de los Supuestos` o evidencia externa del expediente, **no** añadiendo pestañas a la plantilla. Auditoría posterior, si la solicita el usuario, en un Google Sheets separado, sin cambiar los valores originales.
- El estado `EN_REVISIÓN` exige controles técnicos vigentes; la nueva metodología **no está estadísticamente validada** hasta contar con seguimiento real suficiente.

## A.12 Fuentes metodológicas

- Damodaran, NYU Stern, *Damodaran on Valuation*, datasets y modelos: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/dam2ed.htm
- Damodaran, notas sobre ratios incrementales de Sales-to-Capital: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/eqUGemail.html
- McKinsey, *How are companies valued?* (18-feb-2026): https://www.mckinsey.com/featured-insights/mckinsey-explainers/how-are-companies-valued
- Mauboussin y Callahan, *Measuring the Moat* (15-oct-2024): https://www.morganstanley.com/im/publication/insights/articles/article_measuringthemoat.pdf
- Mauboussin y Callahan, *Bayes and Base Rates 2.0* (13-may-2026): https://www.morganstanley.com/im/publication/insights/articles/article_bayesandbaserates2_ltr.pdf
- CFA Institute, *Company Analysis: Forecasting* (currículo 2026): https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/company-analysis-forecasting
- CFA Institute, *Introduction to Financial Statement Modeling* (currículo 2026): https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/introduction-to-financial-statement-modeling

**Nota:** esas fuentes respaldan los principios; los formatos de ficha, umbrales y reglas operativas particulares son **decisiones JMR**, no normas atribuidas a los autores.
