# Reglas vigentes del Modelo JMR

**Versión 16 · 28-oct-2026.** Este documento es la única fuente de las reglas de método. Si un prompt
(`docs/prompts/*.md`), `METODOLOGIA.md`, una habilidad o un comentario de código dice otra cosa, prevalece este
documento. Una regla nueva no se agrega como «regla del día X» en un prompt: se cambia aquí, se sube la versión y se
anota en el registro de cambios del final.

**Doble método:** desde esta versión las valoraciones seleccionan `Método A` o `Método B` por revisión. La selección normativa y precedencia se describen en [`METODOS_VALORACION.md`](METODOS_VALORACION.md), con reglas particulares en [`METODO_A_JMR.md`](METODO_A_JMR.md) y copia íntegra del método anterior en [`METODO_B_JMR.md`](METODO_B_JMR.md). El presente documento mantiene las reglas **compartidas** de cálculo, plantilla y publicación. Sin selección explícita, la compatibilidad histórica sigue siendo B, nunca A por defecto.

## 1. Valor principal y margen de seguridad

- **Empresas operativas (internacionales y colombianas):** valor principal = DCF Base (FCFF; FCFE en financieras).
- **Holdings (Grupo Argos, Grupo Sura y sus preferenciales):** valor principal = SOTP Base.
- **Precio con MOS = valor principal × (1 − MOS)**, MOS = 35%. Nunca sobre el esperado ni sobre el ponderado de
  métodos. En el registro: `baseMOS = "dcfBase"` o `"sotpBase"`. Un holding sin SOTP no tiene precio con MOS.
- Código: `JMR-valuation/scripts/normalize_saved_mos.py`, `consistencia_migracion.py` (M2), `docs/valuation-board.js`
  y `docs/visor.html`.

## 2. Historias y promedio

- **Calibración honesta:** la Base es el desenlace más probable (la mediana), no el prudente; la prudencia vive solo
  en el MOS. Conservadora y Optimista exigen la misma evidencia. Cada riesgo va en un solo lugar (flujos, tasa o
  probabilidad). Nada se ajusta para acercarse al precio.

- Cuatro historias: Base, Conservadora, Optimista y Disrupción, cada una con DCF completo.
- El promedio y el rango ordinarios usan **solo Conservadora, Base y Optimista** (pesos renormalizados). Disrupción
  se presenta aparte («¿Qué pasaría si todo fallara?») y conserva su probabilidad como dato. *(Decisión del usuario
  del 21-oct-2026: se mantiene así.)*

## 3. Probabilidades

- **Previa por etapa del ciclo de vida** (Damodaran), en `JMR-valuation/reference/probabilidades_prior.json`
  (Base / Conservadora / Optimista / Disrupción):

  | Etapa | Previa |
  |---|---|
  | Madura estable | 50 / 20 / 20 / 10 |
  | Crecimiento maduro | 45 / 22,5 / 22,5 / 10 |
  | Crecimiento alto | 40 / 22,5 / 22,5 / 15 |
  | Declive | 40 / 25 / 15 / 20 |
  | Holding | 45 / 22,5 / 22,5 / 10 |

  Conservadora y Optimista son simétricas salvo en declive: sin evidencia, el promedio no cae bajo la Base por
  construcción.

- **Ajustes:** de 5 pp, cada uno atado a un indicador de la ficha que cruzó su umbral escrito, con evidencia y fecha
  (`ajustes_prob`). Máximo 15 pp de desvío por historia frente a la previa. Sin cruce de umbral, no se mueven.
- Control: `scripts/probabilidades.py` (0 fallos). Calibración: `scripts/foto_supuestos.py` (§7).

## 4. Costo de capital y valor terminal

- Tasa libre y prima madura de **la misma fecha** (corte mensual de Damodaran).
- Prima por país = prima madura del corte + prima de riesgo país de la tabla anual de Damodaran (ERP total de la
  tabla − su prima madura, 4,23% en enero de 2026). Nunca el ERP total de enero con la prima madura de otro mes.
- **Crecimiento terminal = 4,0% nominal USD** (inflación esperada ~2,3% + crecimiento real ~1,7%), con techo en la
  tasa libre (`g_terminal` del corte; `aplicar_corte.py` escribe B68/B69). Colombia en COP y las financieras FCFE
  conservan su g propio y documentado.
- Costo de capital terminal: beta 1 (tasa libre + prima madura); Brasil conserva parte de la prima país.
- ROIC terminal: sin ventaja = costo de capital; ventaja durable = promedio de la industria; ventaja que se desvanece
  = punto medio (`reference/moat_2026-09-30.json`).
- Impuesto: efectivo al principio, marginal a perpetuidad (AFYA 34% desde el 4-oct-2026).

### 4A. WACC: una fuente y método económico

- Para empresas operativas, el **WACC oficial se calcula en `Cost of capital worksheet`**, nunca se escribe manualmente en `Input sheet`. El camino normal es **`B12 = Detailed`**, porque permite estimar cada componente. Elegir **`B22 = Multibusiness(US/Global)`** solo cuando existan líneas de negocio económicamente distintas, con ventas y betas bottom-up trazables; si la firma es esencialmente un único negocio, usar **`Single Business(US/Global)`**. Para riesgo país, **`B26 = Operating regions/countries`** si las ventas por exposición están verificadas; `Will Input` únicamente cuando esa prima ponderada ya se haya calculado con las mismas fuentes y fecha y se deje la conciliación. Nunca interpretar `Detailed`, `Multibusiness` y `Operating regions` como tres alternativas excluyentes: los dos últimos son submétodos del primero. La distribución/histograma es comprobación externa, no WACC principal sin justificación económica.
- Obtener Rf y ERP del mismo corte y moneda, beta desapalancada y reapalancada, Ke, Kd antes de impuestos de deuda/rating, tasa marginal y pesos de **mercado** para patrimonio, deuda y preferentes. Arrendamientos únicamente incrementales entran como deuda. Verificar `Cost of capital worksheet!B14 = E63 = Input sheet!B36`, suma de pesos = 100 % y registro del método, supuestos y fuentes. En financieras el método primario es FCFE/Ke; en holdings SOTP, usando tasas congruentes para cada negocio, no WACC consolidado mecánico.
- Capitalizar **I+D recurrente** cuando corresponda con `R& D converter`: vida útil explícita, gastos históricos, activo creado, amortización y EBIT ajustado; sumar activo a capital invertido y revisar reinversión/Sales-to-Capital. No mezclar margen GAAP con margen ajustado. Si se descarta, fundamentar por qué el gasto no representa inversión separable o por qué el efecto cuantificado es inmaterial.
- Revisar **arrendamientos** con `Operating lease converter`: obligaciones fuera de balance → VP, deuda, EBIT, capital y reinversión; los pasivos ya reconocidos por ASC 842/NIIF 16 se reconcilian con el balance y **nunca se capitalizan/restan por segunda vez**. `B18=No` puede ser correcto si significa 'sin conversión adicional', no que no existan arrendamientos.
- Revisar **`Option value`** cuando haya opciones/warrants: cantidad, precio de ejercicio, vida remanente, volatilidad y dividendos, valoración reproducible, valor total y resta **una sola vez** del patrimonio. Conciliar acciones básicas vs. diluidas actuales y el gasto por SBC; no usar simultáneamente acciones diluidas que ya incorporan ese derecho y volver a restarlo. La etiqueta 'dilution adjusted' de la plantilla NO acredita por sí sola dilución económica: verificar la fórmula efectiva, no el título. Otras RSU/SBC se evalúan por el método económicamente apropiado y sin doble conteo.

### 4B. Materialidad de hallazgos y límites

- Un hallazgo solo bloquea si cambia sustancialmente el valor Base o la decisión, invalida una fórmula/puente, afecta integridad crítica del dato o **no permite acotar** una incertidumbre potencialmente material. No confundir una falta documental secundaria con un error matemático.
- Para cada limitación comparar **valor Base oficial** con el valor alternativo o el peor caso razonable, manteniendo los demás supuestos: `impacto_individual_% = 100 × |V_alternativo − V_base| / |V_base|`. Documentar fuente, método y rango probado. Para resultados adversos conjuntos, usar un límite acumulado conservador; no sumar porcentajes con signos opuestos para cancelar riesgos. Si no hay base positiva o no se puede calcular/acotar, evaluar estructura y marcar pendiente.
- **Salvedad NO bloqueante:** impacto máximo individual **<2 %** y total conservador **<3 %** del valor principal, sin cruzar la decisión/MOS y sin defecto crítico de identidades, fórmulas, unidades, moneda, fechas, deuda, acciones, tasas, escenarios o doble conteo. Los umbrales son política operativa JMR, no criterio estadístico ni aval a inventar ceros.
- **Revisión material:** impacto igual o mayor a 2 % individual o 3 % acumulado, cruce de decisión, o efecto plausible sin límite verificable: no declarar completamente verificado; recalcular o corregir. Una incertidumbre cuantificada y material puede figurar como «VERIFICADO CON RESERVA MATERIAL», nunca como validado sin reserva. Un error estructural o de fuente crítica es **PENDIENTE**, aunque la estimación puntual dé impacto pequeño.
- Estados por empresa y versión: **VERIFICADO**, **VERIFICADO CON RESERVA MATERIAL** o **PENDIENTE**. Las salvedades inmateriales son hallazgos *dentro* de VERIFICADO (no un estado eterno). Cada auditoría registra ID, causa, evidencia, `V_base`, alternativa, impacto individual y acumulado, decisión, si bloquea, motivo, responsable y prueba ejecutada/no ejecutada. No se marca «NO APLICA» algo que aplica, ni «VALIDADO» un candado cuyos requisitos técnicos sigan fallando. El dictamen distingue certificación aritmética, fuentes y juicio económico.

## 5. Múltiplos de salida

- Por ciclo: el múltiplo del escenario es el que la empresa tuvo cuando sus fundamentales se parecían a los del
  escenario en FY+3 (`scripts/multiples_by_cycle.py`).
- **Ajuste por tasas:** cada múltiplo histórico × (k del cierre − g) / (k del corte − g), con k = Treasury +
  prima implícita del cierre (`reference/costo_capital_historico.json`); factor entre 0,6 y 1,4.
- **Topes:** Conservador ≤ múltiplo actual; **ningún escenario por encima del múltiplo justificado por sus
  fundamentales (ancla C)**. Sin descuentos generales adicionales: los factores de Toro (0,78× / 0,92×) quedan solo
  como diagnóstico. Comparables solo comprueban.
- Optimista más de 25% sobre el actual: solo con `justificacion_salto` en `<T>_ciclo.json`.

### 5A. Cálculo obligatorio con las fórmulas de la plantilla

- Calcular siempre los siete métodos: EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF, P/S (P/Ventas; pestaña `PV`) y P/BV (Precio/Valor en Libros; pestaña `PBV`). Un peso cero o la exclusión del ponderado no autoriza a omitir su cálculo.
- Usar las fórmulas existentes de `Financials Multiples`, de las pestañas de cada método y de `Descuento de múltiplos`. Los cinco métodos originales conservan su mecánica; no reconstruirlos por empresa ni reemplazar resultados o fórmulas por cifras escritas por la IA.
- El trabajo del analista consiste en escoger y justificar los supuestos en las celdas de entrada de `Financials Multiples`, los múltiplos de salida por historia (actualmente `J8/J19/J30`) y la selección/ponderación de métodos. Las métricas proyectadas, precios, dividendos y valores presentes los calculan las fórmulas. Conservar las conexiones y selectores de la plantilla.
- Las versiones Maestra, IA y Manual deben incluir P/S y P/BV con la misma cadena de cálculo de los originales: históricos → supuestos/métrica proyectada por historia → múltiplo de salida → precio por acción FY+1/FY+2/FY+3 → dividendos → descuento al presente → ponderación. No crear un cálculo paralelo ni tomar precios objetivo de terceros como resultado del modelo.
- P/S = capitalización bursátil / ventas = precio por acción / ventas por acción; precio objetivo = múltiplo de salida P/S × ventas proyectadas / acciones compatibles. P/BV = capitalización bursátil / patrimonio común = precio por acción / valor libro común por acción; precio objetivo = múltiplo de salida P/BV × patrimonio común proyectado / acciones compatibles. P/BV exige conciliar patrimonio inicial + utilidad atribuible al común − dividendos + emisiones − recompras ± otros movimientos de patrimonio; los ajustes se documentan, y un cero precargado no demuestra ausencia de movimientos. Estos dos métodos son de equity: no restar de nuevo la deuda neta.
- Aplicar a los siete métodos las reglas de selección del §5 y la justificación económica propia del negocio. El cálculo no obliga a asignar peso positivo: documentar la selección y los pesos.
- **Ponderación por tipo de empresa:** El analista/IA elegirá y justificará el peso de cada múltiplo según el tipo de empresa y su modelo de negocio: rentabilidad y madurez, intensidad de capital, ciclicidad, apalancamiento, relevancia del patrimonio contable y calidad/comparabilidad de las métricas. No aplicar pesos iguales ni una distribución universal por defecto, ni copiar pesos de otra compañía. Documentar por método el porcentaje, la razón económica y cualquier exclusión con peso cero; normalizar al 100 % dentro del bloque de múltiplos seleccionados, distinguiéndolo del peso global de ese bloque frente al método principal. El usuario podrá modificar los pesos. Calcular siempre los siete métodos aunque alguno tenga peso cero.
- Si un método es económicamente inaplicable, mostrar N/A con causa; si falta un dato, mostrar N/D con dato pendiente, fuente consultada y efecto. Nunca dejar un método sin evaluar, usar cero para fingir que está calculado, ni completar denominadores no interpretables. Buscar los datos necesarios; el cierre de hallazgos usa la materialidad del §4B, sin ocultar pendientes.
- Antes de entregar, comprobar integridad de fórmulas contra la versión de plantilla, las siete salidas o sus excepciones justificadas, puentes EV/equity, unidades y acciones, dividendos sin duplicar y descuento por fecha. Hoja, valoración y análisis deben usar la misma revisión. La auditoría registra estos controles también para métodos con peso cero.

**Anexos de apoyo (no son prompts; las reglas siguen aquí):** [`docs/prompts/precision-financiera-2026-10-09.md`](../docs/prompts/precision-financiera-2026-10-09.md) (evidencia, corte, tasas, UDM y publicación) y [`docs/prompts/contrato-historias-multiplos-20261017.md`](../docs/prompts/contrato-historias-multiplos-20261017.md) (fórmulas y ejes de las matrices de múltiplos de la Base).

### 5B. Derechos de preferentes y utilidad común (PREF-01, 28-oct-2026)

P/E y EPS deben usar utilidad atribuible al accionista común. Financials Multiples conserva la utilidad consolidada y añade un puente separado: utilidad común = utilidad consolidada − dividendos preferentes devengados − asignación participante no monetaria. P/FCFE usa el flujo antes de derechos preferentes menos los pagos efectivos a preferentes. P/BV conserva el puente patrimonial: restar las distribuciones de caja pertinentes y registrar otros movimientos de equity; no restar otra vez una asignación de beneficios sin salida de caja. Conciliar devengo, pago y pasivos de dividendos en la documentación del caso.

En ausencia demostrada de preferentes, los tres puentes conservan los valores previos. Si existen preferentes y faltan entradas o evidencia, bloquear el resultado afectado; no sustituir datos ausentes por cero. El mantenimiento de fórmulas se registra en la plantilla oficial con respaldo y regresión antes de incorporarlo a copias nuevas; no habilita cambios libres de fórmulas durante una valoración. FCFF y OCF conservan sus definiciones operativas.

El valor contable, el nominal/redención, el valor de mercado y las acciones de conversión son conceptos distintos. Las preferentes convertibles exigen conciliación de reclamación y dilución sin doble conteo; su coste esperado no se presume igual al cupón dividido por su precio. PREF-01 no certifica automáticamente esa valoración ni el WACC de un caso concreto.

**PREF-02:** `Cost of capital worksheet!B97` distingue `Yield simple` (preferente perpetua simple) de `Retorno esperado híbrido`. En este último caso, D63 usa el retorno esperado B98, con fuente B99; si falta, bloquea el WACC. El puente opcional B104:B109 pondera a mercado el retorno del componente financiero y el de conversión; para una opción, K_opción = Rf + (Ke − Rf) × (S·delta / valor_opción). Los dividendos efectivos B51 permanecen separados. En ausencia de preferentes D63=0. El método y los límites contractuales se documentan por emisor; las plantillas permanecen sin parámetros de empresas. Mantenimiento autorizado de preferentes, con respaldo y regresión; no obliga a recalcular otras empresas durante el reinicio de CELH.

## 6. Controles de publicación

`bash scripts/controles_todas.sh` sin fallas antes de publicar o fusionar:

1. probabilidades = previa + ajustes;
2. razonabilidad de supuestos (`controles_supuestos.py`):
   - S1: márgenes frente al sector y Optimista ≤ Base + 10 pp;
   - S2: ROIC terminal frente a la referencia sin ventaja durable;
   - S3: orden de las historias;
   - S4: salto del múltiplo del Optimista;
   - S5: g ≤ tasa libre;
   - S6: probabilidades;
3. consistencia hoja = app = motor;
4. integridad de la hoja;
5. estados completos.

Una alerta de supuestos se cierra con evidencia en `justificacion_supuestos`, nunca relajando el control.

## 7. Seguimiento del acierto

Al cerrar cada corte: `scripts/foto_supuestos.py foto`. Con cada resultado anual, el dato real se agrega a
`reference/fotos/realizados.json`, y `foto_supuestos.py comparar` mide qué historia acertó. Con suficientes
observaciones, las frecuencias por etapa recalibran las previas del §3 (nueva versión de este documento).

## 8. Proceso eficiente (lo mínimo que se exige y cuándo algo está listo)

- **Un comando:** `bash scripts/valorar.sh <T> [hoja] [pares] [industria]`. Avanza por fases, salta lo hecho y se
  detiene solo en el paso de juicio (la ficha de historias, generada con el prompt v5).
- **Entregable mínimo obligatorio:**
  - DCF de las cuatro historias;
  - **sensibilidad DCF Base prioritaria:** como mínimo WACC terminal × crecimiento perpetuo, ROIC terminal × crecimiento perpetuo y crecimiento explícito × margen EBIT, todas 5 × 5 con **precio por acción en cada celda**, y centro exactamente conciliado al DCF Base. Cuando hay motor congruente de la misma revisión, ampliar a ROIC terminal × WACC terminal, Sales-to-Capital × margen EBIT, WACC inicial × crecimiento explícito, tasa marginal × reinversión y WACC terminal × escala mecánica del valor terminal (80–120%). Nunca reutilizar motor FCFF de 10 años en NFLX si su DCF principal utiliza transición ROIC de 20 años; generar precios únicamente con el horizonte real de cada empresa. No inventar celdas no verificadas. El crecimiento perpetuo exige reinversión sostenible g/ROIC; WACC > g y ROIC > g. Distinguir escala mecánica del TV de una variación de g o un múltiplo de salida; publicar la contribución del VP terminal al VP operativo, y el DCF inverso;
  - cálculo con fórmulas de los siete múltiplos y salidas por historia, incluso con peso cero, o excepción N/A/N/D justificada según §5A (sin matrices obligatorias);
  - entradas **materiales/aplicables** completas y los 18 candados de cálculo listos (`inputs_completos.py`, `candados.py`); faltantes secundarios solo si su impacto es acotado y quedan anotados según §4B. Ningún hallazgo menor debe bloquear por defecto una valoración, pero un candado real de fórmula o coherencia nunca se evade inventando datos.

  - **Sensibilidad de múltiplos solo en historia Base.** No crear ni mostrar matrices Conservadora, Optimista o Disrupción, pero conservar todas las valoraciones, supuestos y precios por escenario, incluidos los siete métodos aunque tengan peso cero. Dar prioridad visual al DCF sobre cualquier múltiplo.

  Las matrices de múltiplos, dos anclas y familias económicas son opcionales y no bloquean. El cálculo de los siete métodos se rige por §5A y no es opcional.
- **Estados:**
  - **VERIFICADO** = controles estructurales/financieros aprobados y solo salvedades no bloqueantes con prueba de materialidad (§4B);
  - **VERIFICADO CON RESERVA MATERIAL** = límites cuantificados con impacto material; requiere resolverlos antes de tratar el valor como definitivo sin reserva;
  - **PENDIENTE** = control estructural/material fallido o incertidumbre material sin cuantificar.

  Las salvedades son notas, no un estado. No existe «conciliado con salvedades» indefinido.
- **Una auditoría por cierre definitivo.** La publicación preliminar EN_REVISIÓN conserva los controles técnicos completos, pero no anticipa el dictamen económico. Este se emite después de la revisión visual y de las observaciones del usuario. No se re-audita sin un hecho nuevo (resultados, 8-K material, cambio de regla).
  Una actualización trimestral solo toca lo que cambió (modo C de `actualizar-cartera`).
- **Una regla, un lugar:** un cambio de método se hace aquí, sube la versión y se aplica a todas las empresas en una
  sola pasada; nunca empresa por empresa ni como «contrato del día» en un prompt.


### 8A. Flujo híbrido: revisión visual antes de auditoría independiente (27-oct-2026)

1. **Valoración y análisis juntos:** elaborar las cuatro historias, siete múltiplos, matrices y artículo completo de 18 secciones y dos niveles, siempre asociados a una revisión identificada.
2. **Controles técnicos antes de publicar:** ejecutar §6, integridad de la hoja, conservación de fórmulas y selectores, origen de entradas, alertas de supuestos y conciliación hoja↔JSON↔app. No omitir candados materiales para obtener una publicación preliminar.
3. **Publicación preliminar EN_REVISIÓN:** solo con autorización y controles aprobados. La ficha mostrará claramente que la auditoría económica independiente está pendiente; no se podrá etiquetar VERIFICADO por el mero éxito de los controles técnicos.
4. **Observaciones del usuario:** en el expediente de la compañía se pueden registrar puntos para auditar. El borrador local se sincroniza solo mediante la acción explícita de guardarlo en GitHub, en `Modelo-JMR-datos/auditorias/solicitudes/<TICKER>/<REVISION_ID>.json`. El usuario escoge EN_REVISION, LISTO o REHACER; LISTO equivale a listo para auditoría, no a dictamen aprobado. REHACER no actualiza automáticamente los cálculos. El repositorio es público: se advierte antes de publicar. Vincular ticker, revisión y fecha, nunca transferir notas silenciosamente de otra revisión.
5. **Auditoría económica diferida:** cuando se pida «Audita <TICKER>», identificar la revisión vigente en el catálogo y consultar primero los puntos de auditoría de esa revisión, si existen. Además, examinar siempre la razonabilidad de crecimiento, márgenes, ROIC, reinversión, WACC/Ke, terminal, DCF/FCFE/SOTP, múltiplos, riesgos y materialidad. Solo entonces emitir VERIFICADO, VERIFICADO CON RESERVA MATERIAL o PENDIENTE.
6. **Cierre y cambios:** dictamen, hoja y artículo de la misma revisión. Una corrección autorizada debe repetir los controles afectados. Conservar solicitudes y auditorías de revisiones anteriores como histórico.

El cambio afecta la secuencia y los estados, no el método financiero, fórmulas o candados técnicos.

## 9. Análisis fundamental siempre completo

**Regla permanente (23-oct-2026):** cada entrega de análisis fundamental debe desarrollar toda la información pertinente para comprender el negocio, evaluar su calidad y riesgo y juzgar la valoración. La eficiencia del §8 reduce trabajo repetido, no el alcance del artículo. Un resultado cuantitativo VALIDADO no demuestra que el análisis esté completo.

- Mantener exactamente las 18 secciones y las subsecciones del prompt 2. Un título, un párrafo genérico, una tabla sin interpretación o un enlace al nivel 2 no cumplen una sección. Conservar los mínimos de profundidad ya establecidos, sin rellenar con repeticiones para alcanzar extensión.
- La cobertura se adapta al emisor: modelo de negocio, unidades económicas, segmentos y geografía, clientes/proveedores y concentraciones; sector, tamaño y límites de mercado, ciclo, cinco fuerzas, rivales y sustitutos; ventaja competitiva, duración y evidencia contraria; dirección, gobierno, incentivos y asignación de capital.
- Interpretar la historia financiera de hasta diez años y LTM, o máximo disponible: crecimiento y sus motores; márgenes y apalancamiento operativo; beneficios reportados/normalizados; caja y conversión; balance, deuda, vencimientos, liquidez, compromisos y contingencias; capital de trabajo, CAPEX, adquisiciones, ROIC/ROCE/ROE, reinversión y Sales-to-Capital según pertinencia. Incluir calidad contable, partidas no recurrentes, SBC, dilución, recompras y dividendos cuando sean materiales.
- Explicar los supuestos de crecimiento, margen EBIT, impuestos, reinversión, ROIC, Sales-to-Capital, WACC/Ke, g y ROIC terminal: historia y evidencia → mecanismo económico → supuesto oficial → efecto sobre el valor → señales que lo refutarían. Si una variable no aplica, explicar el equivalente sectorial; bancos y holdings tienen sus módulos FCFE/capital regulatorio o SOTP/participaciones/doble conteo.
- Desarrollar catalizadores con horizonte y confirmación, riesgos con mecanismos y mitigantes verificables, tesis alcista y bajista, cinco filosofías de inversión, novedades materiales, indicadores con umbrales y preguntas realmente no resueltas. La disrupción se presenta aparte; distinguir hechos, guía, hipótesis y proyecciones sin convertir esa distinción en etiquetas repetidas en la prosa.
- Interpretar el valor base, los tres escenarios ordinarios, disrupción, promedio ordinario, MOS, métodos y múltiplos elegibles, sensibilidad e inverso aplicable usando la misma revisión oficial. No crear cifras nuevas para completar el texto. Los siete cálculos se rigen por §5A; esta regla editorial no añade matrices opcionales del §8.

**Dos niveles, ambos con contenido:** nivel 1 conserva el artículo completo y las cifras necesarias para entender sus argumentos; empieza con el recuadro visible «Valor intrínseco base:», método y fecha. Nivel 2 contiene estados, ratios, entradas, cálculos y matrices detalladas. Llevar una tabla extensa al nivel 2 no elimina su interpretación económica del nivel 1.

**Actualizar sin recortar:** partir de la última versión completa identificada del artículo, actualizar las secciones afectadas, preservar las restantes y revisar su vigencia y referencias cruzadas. Una nota de cambios, resumen de auditoría o informe de avance se guarda como tal; nunca reemplaza al artículo completo. Si la versión previa es incompleta, recuperar su contenido pertinente y completar las omisiones. Si falta espacio o tiempo, guardar el avance y continuar desde el punto documentado; no presentar una versión abreviada como final.

**Evidencia y límites:** investigar los vacíos materiales con las fuentes accesibles. Si la evidencia no existe o el acceso impide obtenerla, conservar el apartado y explicar qué falta, qué se consultó y qué consecuencia tiene. No inventar datos, citas, pares, catalizadores ni preguntas para llenar una cuota. Diferenciar «desarrollado y sustentado», «no aplicable con razón», «limitado por evidencia identificada» y «pendiente de trabajo». Solo los dos primeros acreditan cobertura resuelta; las limitaciones quedan explícitas y los pendientes no permiten llamar completo al artículo.

**Control de entrega:** dentro de la sección 18 existente, registrar por apartado/subapartado la ubicación del desarrollo, evidencia, estado de cobertura y faltante concreto. La comprobación es semántica, no solo un conteo de títulos o palabras. El prompt 3 verifica este control dentro de sus secciones existentes de coherencia, hallazgos y dictamen. Esta revisión editorial no sustituye la auditoría financiera ni cambia sus controles. No declarar que artículos previos fueron ampliados sin haberlos editado y comprobado.

## 10. Una valoración vigente por empresa y archivo de revisiones

- Al pedir una **valoración nueva**, crearla en una copia limpia de la plantilla vigente y archivar las valoraciones anteriores de esa misma empresa, con sus análisis, auditorías, exportaciones y revisiones sustituidas. Conservar una sola valoración de trabajo vigente por empresa; sus cuatro historias no son cuatro expedientes distintos.
- Usar la carpeta de Drive [Valoraciones antiguas](https://drive.google.com/drive/folders/10ZCGoZ4hKVqtg6ekcyYHsm8IHPZOBVLq). Los expedientes retirados el 24-oct-2026 están en [Revisiones sustituidas](https://drive.google.com/drive/folders/1M2sWqAR60HBIBx0JbRn057kawpD9ZsZG). Archivar conserva los archivos e identificadores; no borrar el historial.
- El archivo histórico queda **excluido de las entradas automáticas, selección de valoración vigente, importación a la app y recuperación de supuestos**. Un título antiguo que diga «vigente», «final» o «publicada» no acredita vigencia. Resolver siempre por empresa, revisión e identificador de la hoja actual.
- No copiar supuestos, resultados, dictámenes ni narrativa de otra revisión como si pertenecieran al expediente nuevo. Los documentos financieros primarios pueden reutilizarse únicamente tras verificar fuente, fecha, período y pertinencia; no confundir un estado histórico con una valoración anterior.
- En EN_REVISIÓN, valoración y análisis activos deben ser de la misma revisión y el dictamen económico se marca pendiente. En el cierre auditado, las tres piezas deben compartir revisión. Nunca reutilizar auditorías archivadas como dictamen vigente. La nueva revisión conserva su estado real y archivar la previa no equivale a validar ni publicar la nueva.
- Mantener un registro de movimientos y comprobar origen, destino y hoja conservada. Una actualización ordinaria conserva la identidad del expediente y su historial de versiones; una valoración nueva sustituye la anterior en el catálogo activo.

Hojas de trabajo conservadas tras el archivo del 24-oct-2026 (identidad documental; no certifica publicación ni validación):

| Empresa | Revisión de trabajo | ID de la hoja |
|---|---|---|
| NKE | R4 · 23-oct-2026 | `1wWS0qNCWvSrYCI53kk7H1zBshn-RJWjeKFu10sHCNWw` |
| NFLX | v7 · 23-oct-2026 | `18JpUSeyJ9i7MOqHJ3-yB3Kz4BuwTXIwlIwoJvdlbfnE` |
| META | R4 · 23-oct-2026 | `1Ap5ylZGNdW_qyEIH5dVy22jTfHSy1TNB5bFsiW1IXsg` |
| NVDA | R1 · 23-oct-2026 | `1hvlfGunORzgup0OyxyW0QRBcosZ_xooLI-gMH1kixpE` |

## 11. Hojas unificadas y reparto del trabajo entre la IA y las fórmulas

**Reparto.** Lo que la IA aporta es (1) conseguir los **datos crudos** con su fuente primaria y (2) **estimar los supuestos** y explicar por qué. Todo cálculo lo hacen las fórmulas de la hoja. La IA no escribe resultados sobre celdas con fórmula, no «calibra» una salida y no reconstruye un cálculo fuera de la hoja.

**Formato único.** Cada nueva valoración parte de una copia de la plantilla maestra vigente (registro en `JMR-valuation/reference/plantillas.json`), compartida por IA y Manual. Desde 28-oct-2026 el formato oficial contiene 46 pestañas de valoración, datos y supuestos. Las copias históricas de 61 pestañas conservan su versión:
- las mismas 46 pestañas del perfil vigente, en el mismo orden y con las mismas dimensiones; no se añaden, quitan, renombran ni reordenan en una valoración individual. Los soportes propios de una empresa (conciliaciones SEC, registros de revisión y auditorías) van a expedientes independientes y no agregan pestañas a la valoración;
- todas las fórmulas de la plantilla intactas: una fórmula sustituida por un número, o editada, es un hallazgo bloqueante;
- **todos los selectores** (validaciones de datos: `B12`, `B22`, `B26`, selectores de método, de historia y de ponderación) con su validación original. Cambiar una opción es elegir de la lista; un selector reemplazado por un valor o eliminado es un hallazgo bloqueante.

**Datos crudos.** Se diligencian todos los datos de entrada aplicables, cada uno con fuente (nota de la celda o pestaña `Origen de los Supuestos`: documento, URL, período, página o nota, fecha de consulta). La materialidad del §4B decide qué faltante secundario no bloquea; nunca se inventa un cero.

**Auditoría independiente.** Una vez publicada la valoración y el análisis como EN_REVISIÓN, el usuario hace la revisión visual. La auditoría económica se inicia solo cuando la solicita y se documenta en un **Google Sheets independiente por ticker y revisión**, vinculado al expediente. No se añaden pestañas de auditoría a la valoración ni se modifican sus resultados.

**Control.** Las valoraciones nuevas deben compararse con el perfil oficial de 46 pestañas; los expedientes históricos de 61 pestañas conservan su perfil original. Antes de confiar en el resultado UNIFICADA de `scripts/unificacion_hojas.py`, se debe adaptar el validador a los dos perfiles y validar referencias, fórmulas y selectores. No declarar la regresión integral superada hasta ejecutar ese control.

**Entregables.** El análisis fundamental siempre completo (§9). La auditoría explica el porqué de cada supuesto estimado y la fuente de **todos** los datos de entrada, con un inventario que cubra todas las celdas de entrada (prompt de auditoría v1.3).

## 12. Dos métodos de estimación de supuestos (28-oct-2026)

- **Método A:** nueva calibración por drivers operativos, clases de referencia de crecimiento y rentabilidad, margen y reinversión consistentes, persistencia del ROIC y seguimiento prospectivo. Se especifica en [`METODO_A_JMR.md`](METODO_A_JMR.md). No constituye una metodología de cálculo distinta: las fórmulas, siete múltiplos, cuatro historias, MOS, condiciones de publicación y plantillas son las mismas.
- **Método B:** el procedimiento JMR anterior, preservado sin cambios de fondo como instantánea completa v15 en [`METODO_B_JMR.md`](METODO_B_JMR.md). Estudios anteriores sin etiqueta se interpretan B sin reescribir sus cifras.
- Para nuevas valoraciones registrar método/version/fecha/revisión/hoja en el expediente conforme a [`METODOS_VALORACION.md`](METODOS_VALORACION.md). Prohibido mezclar supuestos A y B en una sola revisión. Las comparaciones se hacen con copias aisladas y mismo corte. No introducir un selector en la plantilla ni pestañas de auditoría.
- **Prioridad normativa:** estos controles comunes (integridad, contabilidad, fórmulas, autoría, fuente, materiales y publicación) rigen ambos métodos. Las diferencias de **calibración** entre A y B siguen el método expresamente elegido; el archivo B no se reescribe por cambios futuros sin registrar revisión.
- La existencia de estos documentos no certifica integración del selector a la app ni validación predictiva de A. Las pruebas automáticas y el seguimiento se documentarán antes de proclamar su calibración superior.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 16 | 28-oct-2026 | Coexisten dos métodos de calibración: A (drivers/tasas base/ROIC) y B (instantánea íntegra de las reglas v15); cálculo, plantilla y auditoría permanecen compartidos. No hay recálculo de empresas ni cambio de motor. |
| 15 | 28-oct-2026 | Plantillas oficiales reducidas de 61 a 46 pestañas; las auditorías se mantienen en Google Sheets independientes después de revisión visual. Se preservaron respaldos. Validación automática de perfil pendiente. |
| 14 | 28-oct-2026 | PREF-02: coste esperado de híbridos, cupón separado y control de faltantes; respaldos y regresión. |
| 13 | 28-oct-2026 | §5B: puentes separados de utilidad común, FCFE y patrimonio para preferentes; mantenimiento autorizado, respaldos y regresión. Sin recalcular otras empresas ni certificar WACC de híbridos. |
| 12 | 27-oct-2026 | §8A: proceso híbrido, controles técnicos antes de la publicación preliminar, observaciones por revisión y auditoría posterior. Sin cambios financieros. |
| 11 | 26-oct-2026 | §11 nuevo: hojas unificadas (formato de la maestra, fórmulas y selectores intactos, sin pestañas añadidas), reparto IA (datos crudos y supuestos) y fórmulas (cálculo); control `unificacion_hojas.py`. Auditoría v1.3: porqué de cada supuesto y fuente de todos los datos de entrada. Sin cambios en valores de empresas. |
| 10 | 26-oct-2026 | Conciliación de prompts: el contrato de historias y múltiplos pasa a matrices solo en la Base; el MOS de METODOLOGIA y de los prompts de Colombia se aplica sobre el DCF/SOTP Base; los anexos de precisión y de múltiplos se enlazan desde §6. Sin cambios en fórmulas ni en valores de empresas. |
| 9 | 24-oct-2026 | §10: una sola valoración vigente por empresa; las nuevas valoraciones archivan las anteriores con sus documentos asociados; archivo excluido de selección e importación automática. Se identifican las cuatro hojas actuales sin certificar su validación ni publicación. |
| 8 | 23-oct-2026 | §5A: el analista/IA elige y justifica el peso de cada múltiplo según el tipo de empresa y su modelo de negocio; sin pesos universales ni omisión de cálculos por peso cero. |
| 7 | 23-oct-2026 | §5A y §8: cálculo obligatorio de siete múltiplos con fórmulas existentes; P/S y P/BV en Maestra/IA/Manual; juicio limitado a entradas, múltiplos de salida y pesos; controles también con peso cero. Sin recálculo ni publicación de empresas. |
| 6 | 23-oct-2026 | §§4A–4B, 8: capitalización de I+D, leases, opciones, cálculo WACC Detailed con beta multi-negocio y ERP geográfico, límites de materialidad y estados de verificación. No se modifican valores de empresas. |\n| 5 | 23-oct-2026 | §9: análisis fundamental completo como regla permanente; cobertura sustantiva de las 18 secciones, adaptación sectorial, dos niveles, preservación del artículo al actualizar y verificación editorial en auditoría. Sin cambios en fórmulas, ponderaciones ni mínimos cuantitativos del §8. |
| 4 | 21-oct-2026 | Revisión del historial (38 valoraciones que nunca salieron de «conciliado con salvedades»): previas simétricas (antes la Conservadora pesaba más en todas las etapas), control de márgenes sin alertar lo ya demostrado (umbral 2,5× sector), §8 proceso eficiente (un comando, mínimo obligatorio, estado VALIDADO, una auditoría por publicación). |
| 3 | 21-oct-2026 | Prompts de análisis fundamental (v5 corregido) y auditoría (v1.2) alineados y válidos para cualquier modelo: el análisis copia las cifras de la valoración oficial (no recalcula), MOS solo sobre la Base (el texto anterior decía «sobre el esperado»), promedio de tres historias, probabilidades por previa + indicadores; la auditoría busca sesgo en ambas direcciones (agresividad y prudencia duplicada) y verifica g, ajuste por tasas y ancla C. |
| 2 | 21-oct-2026 | Prompt de valoración v5 (`docs/prompts/valoracion-modelo-jmr-v5.md`): autocontenido y válido para cualquier modelo de lenguaje, un solo método de múltiplos (el v4 mezclaba λ, ciclo y Toro), etiquetas [Dato]/[Cálculo]/[Juicio] y ficha JSON de salida. Calibración honesta (§2). Topes de Toro retirados (doble prudencia). |
| 1 | 21-oct-2026 | Consolida las reglas dispersas en los prompts (17, 18 y 21-oct). MOS sobre DCF Base o SOTP Base (antes había código que lo calculaba sobre el esperado). Probabilidades por previa + indicadores. g terminal 4% (antes = tasa libre, 5,29%). Prima por país en la fecha del corte. Ajuste por tasas y tope del ancla C en los múltiplos por ciclo. Controles de razonabilidad y foto de supuestos. |
