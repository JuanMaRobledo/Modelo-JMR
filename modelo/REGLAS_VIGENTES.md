# Reglas vigentes del Modelo JMR

**Versión 5 · 23-oct-2026.** Este documento es la única fuente de las reglas de método. Si un prompt
(`docs/prompts/*.md`), `METODOLOGIA.md`, una habilidad o un comentario de código dice otra cosa, prevalece este
documento. Una regla nueva no se agrega como «regla del día X» en un prompt: se cambia aquí, se sube la versión y se
anota en el registro de cambios del final.

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

## 5. Múltiplos de salida

- Por ciclo: el múltiplo del escenario es el que la empresa tuvo cuando sus fundamentales se parecían a los del
  escenario en FY+3 (`scripts/multiples_by_cycle.py`).
- **Ajuste por tasas:** cada múltiplo histórico × (k del cierre − g) / (k del corte − g), con k = Treasury +
  prima implícita del cierre (`reference/costo_capital_historico.json`); factor entre 0,6 y 1,4.
- **Topes:** Conservador ≤ múltiplo actual; **ningún escenario por encima del múltiplo justificado por sus
  fundamentales (ancla C)**. Sin descuentos generales adicionales: los factores de Toro (0,78× / 0,92×) quedan solo
  como diagnóstico. Comparables solo comprueban.
- Optimista más de 25% sobre el actual: solo con `justificacion_salto` en `<T>_ciclo.json`.

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
  - las tres sensibilidades del DCF Base (WACC × g, ROIC × g, crecimiento × margen) y el DCF inverso;
  - múltiplos de salida de los métodos con peso > 0 (sin matrices obligatorias);
  - entradas completas y los 18 candados de la hoja listos (`inputs_completos.py`, `candados.py`).

  El resto (matrices de múltiplos, siete métodos, dos anclas, familias económicas) es opcional y no bloquea.
- **Estados:**
  - **VALIDADO** = `controles_todas.sh` sin fallas;
  - **CON HALLAZGOS** = falla algún control.

  Las salvedades son notas, no un estado. No existe «conciliado con salvedades» indefinido.
- **Una auditoría por publicación.** No se re-audita sin un hecho nuevo (resultados, 8-K material, cambio de regla).
  Una actualización trimestral solo toca lo que cambió (modo C de `actualizar-cartera`).
- **Una regla, un lugar:** un cambio de método se hace aquí, sube la versión y se aplica a todas las empresas en una
  sola pasada; nunca empresa por empresa ni como «contrato del día» en un prompt.


## 9. Análisis fundamental siempre completo

**Regla permanente (23-oct-2026):** cada entrega de análisis fundamental debe desarrollar toda la información pertinente para comprender el negocio, evaluar su calidad y riesgo y juzgar la valoración. La eficiencia del §8 reduce trabajo repetido, no el alcance del artículo. Un resultado cuantitativo VALIDADO no demuestra que el análisis esté completo.

- Mantener exactamente las 18 secciones y las subsecciones del prompt 2. Un título, un párrafo genérico, una tabla sin interpretación o un enlace al nivel 2 no cumplen una sección. Conservar los mínimos de profundidad ya establecidos, sin rellenar con repeticiones para alcanzar extensión.
- La cobertura se adapta al emisor: modelo de negocio, unidades económicas, segmentos y geografía, clientes/proveedores y concentraciones; sector, tamaño y límites de mercado, ciclo, cinco fuerzas, rivales y sustitutos; ventaja competitiva, duración y evidencia contraria; dirección, gobierno, incentivos y asignación de capital.
- Interpretar la historia financiera de hasta diez años y LTM, o máximo disponible: crecimiento y sus motores; márgenes y apalancamiento operativo; beneficios reportados/normalizados; caja y conversión; balance, deuda, vencimientos, liquidez, compromisos y contingencias; capital de trabajo, CAPEX, adquisiciones, ROIC/ROCE/ROE, reinversión y Sales-to-Capital según pertinencia. Incluir calidad contable, partidas no recurrentes, SBC, dilución, recompras y dividendos cuando sean materiales.
- Explicar los supuestos de crecimiento, margen EBIT, impuestos, reinversión, ROIC, Sales-to-Capital, WACC/Ke, g y ROIC terminal: historia y evidencia → mecanismo económico → supuesto oficial → efecto sobre el valor → señales que lo refutarían. Si una variable no aplica, explicar el equivalente sectorial; bancos y holdings tienen sus módulos FCFE/capital regulatorio o SOTP/participaciones/doble conteo.
- Desarrollar catalizadores con horizonte y confirmación, riesgos con mecanismos y mitigantes verificables, tesis alcista y bajista, cinco filosofías de inversión, novedades materiales, indicadores con umbrales y preguntas realmente no resueltas. La disrupción se presenta aparte; distinguir hechos, guía, hipótesis y proyecciones sin convertir esa distinción en etiquetas repetidas en la prosa.
- Interpretar el valor base, los tres escenarios ordinarios, disrupción, promedio ordinario, MOS, métodos y múltiplos elegibles, sensibilidad e inverso aplicable usando la misma revisión oficial. No crear cifras nuevas para completar el texto. No convertir todos los múltiplos o matrices opcionales del §8 en requisitos nuevos de cálculo por esta regla editorial.

**Dos niveles, ambos con contenido:** nivel 1 conserva el artículo completo y las cifras necesarias para entender sus argumentos; empieza con el recuadro visible «Valor intrínseco base:», método y fecha. Nivel 2 contiene estados, ratios, entradas, cálculos y matrices detalladas. Llevar una tabla extensa al nivel 2 no elimina su interpretación económica del nivel 1.

**Actualizar sin recortar:** partir de la última versión completa identificada del artículo, actualizar las secciones afectadas, preservar las restantes y revisar su vigencia y referencias cruzadas. Una nota de cambios, resumen de auditoría o informe de avance se guarda como tal; nunca reemplaza al artículo completo. Si la versión previa es incompleta, recuperar su contenido pertinente y completar las omisiones. Si falta espacio o tiempo, guardar el avance y continuar desde el punto documentado; no presentar una versión abreviada como final.

**Evidencia y límites:** investigar los vacíos materiales con las fuentes accesibles. Si la evidencia no existe o el acceso impide obtenerla, conservar el apartado y explicar qué falta, qué se consultó y qué consecuencia tiene. No inventar datos, citas, pares, catalizadores ni preguntas para llenar una cuota. Diferenciar «desarrollado y sustentado», «no aplicable con razón», «limitado por evidencia identificada» y «pendiente de trabajo». Solo los dos primeros acreditan cobertura resuelta; las limitaciones quedan explícitas y los pendientes no permiten llamar completo al artículo.

**Control de entrega:** dentro de la sección 18 existente, registrar por apartado/subapartado la ubicación del desarrollo, evidencia, estado de cobertura y faltante concreto. La comprobación es semántica, no solo un conteo de títulos o palabras. El prompt 3 verifica este control dentro de sus secciones existentes de coherencia, hallazgos y dictamen. Esta revisión editorial no sustituye la auditoría financiera ni cambia sus controles. No declarar que artículos previos fueron ampliados sin haberlos editado y comprobado.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 5 | 23-oct-2026 | §9: análisis fundamental completo como regla permanente; cobertura sustantiva de las 18 secciones, adaptación sectorial, dos niveles, preservación del artículo al actualizar y verificación editorial en auditoría. Sin cambios en fórmulas, ponderaciones ni mínimos cuantitativos del §8. |
| 4 | 21-oct-2026 | Revisión del historial (38 valoraciones que nunca salieron de «conciliado con salvedades»): previas simétricas (antes la Conservadora pesaba más en todas las etapas), control de márgenes sin alertar lo ya demostrado (umbral 2,5× sector), §8 proceso eficiente (un comando, mínimo obligatorio, estado VALIDADO, una auditoría por publicación). |
| 3 | 21-oct-2026 | Prompts de análisis fundamental (v5 corregido) y auditoría (v1.2) alineados y válidos para cualquier modelo: el análisis copia las cifras de la valoración oficial (no recalcula), MOS solo sobre la Base (el texto anterior decía «sobre el esperado»), promedio de tres historias, probabilidades por previa + indicadores; la auditoría busca sesgo en ambas direcciones (agresividad y prudencia duplicada) y verifica g, ajuste por tasas y ancla C. |
| 2 | 21-oct-2026 | Prompt de valoración v5 (`docs/prompts/valoracion-modelo-jmr-v5.md`): autocontenido y válido para cualquier modelo de lenguaje, un solo método de múltiplos (el v4 mezclaba λ, ciclo y Toro), etiquetas [Dato]/[Cálculo]/[Juicio] y ficha JSON de salida. Calibración honesta (§2). Topes de Toro retirados (doble prudencia). |
| 1 | 21-oct-2026 | Consolida las reglas dispersas en los prompts (17, 18 y 21-oct). MOS sobre DCF Base o SOTP Base (antes había código que lo calculaba sobre el esperado). Probabilidades por previa + indicadores. g terminal 4% (antes = tasa libre, 5,29%). Prima por país en la fecha del corte. Ajuste por tasas y tope del ancla C en los múltiplos por ciclo. Controles de razonabilidad y foto de supuestos. |
