# PROMPT MAESTRO 1/3 — VALORACIÓN JMR · v5 · 21-OCT-2026

**Alcance exclusivo:** valorar UNA empresa (una clase de acción, una fecha de corte) con criterio Damodaran. Este
prompt no crea el análisis fundamental ni la auditoría. Debe dar el mismo resultado con cualquier modelo de lenguaje:
todo lo necesario está escrito aquí y las herramientas son opcionales. Reglas de la casa con versión:
`modelo/REGLAS_VIGENTES.md` (si algo difiere, prevalece ese documento).

**Prohibiciones:** no crear el artículo fundamental; no realizar la auditoría independiente; no publicar ni sustituir la valoración oficial sin autorización expresa del usuario y controles en verde.

---

## 0. Cómo trabajar (para cualquier modelo)

1. **Herramientas.** Si tienes acceso a internet, hojas de cálculo o código, úsalos para obtener y comprobar datos.
   Si no tienes, pide al usuario los datos de la lista del paso 1 y no sigas con un dato faltante: márcalo
   **N/D** y explica qué supuesto queda sin anclar. Nunca rellenes un hueco con memoria o con un número «típico».
2. **Tres etiquetas para cada cifra.** Cada cifra es una de tres cosas:
   - **[Dato]**: reportado, con fuente, fecha y enlace;
   - **[Cálculo]**: fórmula escrita y reproducible;
   - **[Juicio]**: supuesto del analista, con la evidencia a favor y en contra.
3. **Corte.** No uses información posterior a la fecha de corte, salvo como «hecho posterior» rotulado.
4. **Aislamiento.** Trabaja sobre una copia nueva por ticker y clase de la plantilla maestra vacía (la vigente está en `JMR-valuation/reference/plantillas.json`). La plantilla nunca se edita ni se llena: si no puedes copiarla, detente y pídele al usuario la copia; nunca escribas en la maestra ni sobre la valoración de otra empresa o una versión anterior. No copies cifras,
   historias, probabilidades ni textos de otra empresa; los comparables entran solo como comparables declarados.
5. **Aritmética.** Muestra las fórmulas y verifica cada resultado clave dos veces (por ejemplo, el puente de valor
   operativo a valor por acción). Si un control no cuadra, dilo; no lo redondees para que cuadre.
6. **Salida.** Entrega los bloques del paso 9 en el orden indicado. Al final, la ficha JSON del paso 9.10, que es la
   que leen los scripts del modelo.

## 1. Datos de entrada

| Dato | Detalle | Fuente preferida |
|---|---|---|
| Estados financieros | 5-10 años y el LTM: ingresos por segmento, EBIT, impuestos, D&A, capex, capital de trabajo, deuda, caja, arrendamientos, acciones diluidas, opciones, minoritarios | 10-K/10-Q/20-F (SEC) o el informe del emisor |
| Hechos recientes | TODOS los 8-K/6-K y comunicados entre el último informe y el corte: guía, compras, reestructuraciones, litigios | SEC EDGAR / emisor |
| Mercado al corte | Precio de cierre, Treasury 10 años y prima madura de Damodaran **del mismo corte**, g terminal del corte | `reference/corte_vigente.json` o FRED + Damodaran |
| Sector | Beta desapalancada, margen operativo, ROIC, ventas/capital (tabla de EE.UU. si la mayoría de las ventas está en Norteamérica; global si no) | Datos de Damodaran (enero) |
| Comparables | 5-10 pares del mismo modelo de negocio, con múltiplos de la misma definición y fecha | Proveedor de datos con fecha |
| Riesgo país | Prima de riesgo país de la tabla anual de Damodaran, ponderada por ventas por región | Damodaran `ctryprem` |

## 2. Historia antes que números (sin mirar el precio)

1. Escribe en un párrafo qué será la empresa en 5-10 años: de dónde sale el crecimiento, qué margen es sostenible y
   por qué, cuánto hay que reinvertir y qué riesgo tiene. Pásalo por el filtro posible / plausible / probable.
2. **Visión externa:** compara el crecimiento propuesto con las tasas base de su tamaño (Mauboussin & Callahan,
   *The Base Rate Book*). Alejarse de la tasa base exige evidencia específica escrita.
3. Descompón el crecimiento: segmento o región, orgánico frente a comprado (las compras son reinversión, no
   crecimiento gratis), precio/volumen/mezcla, demanda frente a inventario.
4. Margen objetivo: anclado en un comparable maduro del mismo negocio, con margen normalizado (sin cargos únicos)
   en la misma base de la hoja (I+D y arrendamientos capitalizados si la hoja los capitaliza).

## 2B. Ajustes contables de Damodaran e Input completo (obligatorio)

**Toda entrada relevante para el cálculo se diligencia y verifica.** Las limitaciones documentales secundarias no bloquean por estar incompletas si una prueba independiente demuestra que cumplen `modelo/REGLAS_VIGENTES.md` §4B (impacto individual <2 %, agregado <3 % y sin alterar decisión, identidades ni fórmulas). Nunca se presume que un dato desconocido vale cero. Las celdas que activan cálculo y los candados genuinos se completan sin excepciones. Si un concepto no aplica, va «No»
o 0 con una nota que diga por qué (por ejemplo «sin preferentes, 10-Q jun-2026»). Nunca se deja vacía una entrada esencial ni se
pone un número sin fuente; las omisiones estrictamente documentales se rigen por el límite cuantitativo del §4B. Lista mínima de la Input sheet: ingresos y EBIT LTM y del último 10-K; gasto por intereses;
patrimonio y deuda contable; caja; participaciones cruzadas y minoritarios; acciones diluidas; precio; tasa efectiva y
marginal; I+D (B17), arrendamientos (B18), opciones (B38-B42), preferentes (B76), NOL (B62), fracaso (B52) y cada
pregunta de anulación (B46-B71) con su respuesta. En «Cost of capital worksheet»: método de beta, prima por regiones
con las ventas de cada región, rating o spread, vencimiento, convertibles y preferentes. En «Option value»: precio,
ejercicio, plazo, volatilidad y dividendo. En «Financials Multiples», para cada historia: ΔNWC/ventas, otros
netos/EBIT y cambio de acciones FY+1 a FY+4, calculados con la historia de la empresa (3 años; la recompra reduce
acciones). El control `inputs_completos.py` debe dar 0 entradas esenciales vacías o una salvedad individual cuantificada y admitida por §4B; los 18 candados de cálculo (`candados.py`) deben
estar en LISTO/VALIDADO/CONCILIADO/NO APLICA: mientras uno falle, el WACC, las proyecciones o los múltiplos quedan en
blanco.

**Base de los márgenes:** los márgenes de las historias se escriben en base reportada (GAAP). Si la hoja capitaliza
I+D o arrendamientos, la ficha lleva `iyd` y `arrendamientos` con `margen_pp` y `capital_ventas` para llevarlos a la base
ajustada; sin eso, la valoración queda subestimada.

Ajustes que se hacen siempre que apliquen (criterio Damodaran):
- **I+D:** se capitaliza cuando la empresa gasta en I+D o en tecnología y desarrollo de forma recurrente. Damodaran
  lo trata como gasto de capital. La vida amortizable se elige por sector: 2-3 años en software y tecnología de
  consumo, 5 en industria, 10 en farmacéuticas. El EBIT se ajusta (+ I+D del año − amortización del activo de I+D) y
  el capital invertido suma el activo. Si no aplica (I+D inmaterial o inexistente), «No» con la razón.
- **Arrendamientos operativos:** se convierten en deuda con el conversor: VP de los compromisos al costo de la deuda
  antes de impuestos, y EBIT + gasto de arrendamiento − depreciación del activo. Bajo NIIF 16 ya están en la deuda.
  Lo ya registrado como deuda no se resta dos veces.
- **Opciones de empleados:** se valoran con Black-Scholes ajustado por dilución y se restan del patrimonio como una
  reclamación. Se usan las acciones básicas, sin diluir otra vez, y la compensación en acciones se trata como gasto
  en el EBIT.
- **Otros (cuando apliquen):** participaciones cruzadas a valor de mercado, minoritarios, NOL, probabilidad de
  fracaso, preferentes y convertibles. Un caso especial no se ignora: si no aplica, se marca «NO APLICA».

**Prueba de tres conversiones antes de cerrar:** (1) `R& D converter`: ¿I+D/tecnología representa inversión plurianual? Comprobar vida, historial, activo, amortización, EBIT e inversión; si `Input sheet!B17=No` y el conversor arroja un activo, explicar explícitamente por qué NO se incorpora (y medir sensibilidad si podría ser material). (2) `Operating lease converter`: reconciliar deuda reconocida vs. obligaciones incrementales, `Input sheet!B18`, `B78:B81`, EBIT y WACC sin duplicación ASC 842/NIIF 16. (3) `Option value`: conciliar stock options/RSU, plazo, ejercicio, volatilidad, valor total, gasto SBC y denominador básico/diluido; no confiar solo en el rótulo 'dilution adjusted'. Registrar el efecto de cada ajuste en el valor Base y los supuestos comparables.

## 3. Costo de capital

- **WACC oficial**: `Cost of capital worksheet!B12=Detailed` salvo excepción económica expresamente justificada. Para un negocio: `B22=Single Business(US/Global)`; para varios negocios materiales: `B22=Multibusiness(US/Global)` con mezcla y beta por segmento. `B26=Operating regions/countries` cuando haya ventas regionales confiables, o `Will Input` con ERP geográfico previamente calculado y documentado. El histograma/distribución es control externo. Verifica `B14=E63=Input sheet!B36`, pesos de mercado al 100 %, Kd, Ke y fecha/moneda coherentes. No son tres enfoques mutuamente excluyentes: segmentación y geografía se combinan dentro de Detailed.
- **Ke** = tasa libre + beta × prima. La beta es la bottom-up: beta desapalancada del sector, reapalancada con la D/E
  de mercado. La beta de regresión solo sirve como referencia.
- **Prima** = prima madura del corte + prima de riesgo país ponderada por ventas. Nunca uses el ERP total de una
  tabla de otra fecha.
- **Kd**: rating real o sintético más spread; WACC con pesos de mercado (arrendamientos incluidos como deuda).
- Los riesgos propios diversificables (cliente, regulación, moda) no van en la tasa: van en las historias. Ponerlos
  en las dos partes cuenta el riesgo dos veces.
- **Terminal:**
  - costo de capital terminal = tasa libre + prima madura (beta 1); en emergentes se conserva parte de la prima país;
  - **crecimiento terminal = g del corte (4% nominal USD), nunca mayor que la tasa libre**;
  - **ROIC terminal**: sin ventaja defendible = costo de capital; ventaja durable = promedio de la industria; ventaja
    que se desvanece = punto medio entre los dos;
  - reinversión terminal = g / ROIC;
  - impuesto: el efectivo al inicio y el marginal a perpetuidad.

## 4. Cuatro historias, cada una con un DCF completo

**A · Base, B · Conservadora, C · Disrupción, D · Optimista.** Cada una tiene un mecanismo económico, evidencia a
favor y en contra, y un DCF anual a 10 años más la perpetuidad: ingresos por segmento, margen, impuestos,
reinversión (ventas/capital), ROIC, FCFF y valor terminal.

**Calibración honesta (ni optimista ni conservadora por sistema):**
- **La Base es el desenlace más probable (la mediana), no el prudente.** La prudencia ya está en el margen de
  seguridad. Si la Base lleva recortes «por si acaso», el MOS recorta sobre lo ya recortado: no lo hagas.
- **Conservadora y Optimista tienen la misma exigencia de evidencia.** Ninguna es un ±x% alrededor de la Base: cada
  una es una historia con su propio mecanismo.
- **Disrupción** es un deterioro estructural (no presupone quiebra ni IA). Por defecto se estabiliza: g terminal = el
  crecimiento de su año 5, con piso de 0%, y ROIC terminal = costo de capital.
- **Un riesgo, un lugar:** cada riesgo va en los flujos, en la tasa o en la probabilidad, solo en uno de ellos.
- **No ajustes nada para acercarte al precio.** El precio entra recién en el paso 8.
- **Coherencia de la reinversión:** el rendimiento del capital nuevo (margen × (1 − t) × ventas/capital) debe ser
  coherente con el ROIC histórico de la empresa. Si queda más del doble del ROIC terminal, explica la convergencia:
  ventaja que se mantiene en los años 1-10 y regla de ventaja en la perpetuidad, o ajusta el ventas/capital de los
  años 6-10.
- Orden esperado: Conservadora ≤ Base ≤ Optimista en valor. Si una variable no sigue ese orden, explica el
  mecanismo en vez de forzarla.

**Probabilidades:**
- Se parte de la previa por etapa del ciclo de vida (Base / Conservadora / Optimista / Disrupción):

  | Etapa | Previa |
  |---|---|
  | Madura estable | 50 / 20 / 20 / 10 |
  | Crecimiento maduro | 45 / 22,5 / 22,5 / 10 |
  | Crecimiento alto | 40 / 22,5 / 22,5 / 15 |
  | Declive | 40 / 25 / 15 / 20 |

  Conservadora y Optimista son simétricas (salvo en declive): sin evidencia, el promedio no debe quedar bajo la Base
  por construcción.

- Define 6-8 indicadores observables, cada uno con su valor actual y el umbral que favorece a cada historia.
- Cada indicador que ya cruzó su umbral mueve 5 pp de una historia a otra, con evidencia y fecha. Máximo 15 pp por
  historia. Sin cruce de umbral, se usa la previa.
- Añade un pre-mortem: si dentro de 3 años la tesis falló, cuáles fueron las causas (al menos cuatro).

**Valores que se informan:**
- **Valor principal = DCF Base** (FCFF a WACC; FCFE a Ke en financieras; SOTP Base en holdings).
- **Promedio de tres historias** = Σ pᵢVᵢ / Σ pᵢ, solo con Conservadora, Base y Optimista. Rotúlalo «condicionado
  a que no ocurra la disrupción»; no es el valor esperado de los cuatro desenlaces.
- **Disrupción va aparte**, en el recuadro «¿Qué pasaría si todo fallara?», con su valor y su probabilidad.
- **El margen de seguridad se aplica SOLO al DCF/FCFE/SOTP Base principal:** precio con MOS = Base × (1 − 35%).
  Nunca sobre el promedio ni sobre el ponderado de métodos.

**Puente al valor por acción (FCFF):**
- EBIT = ingresos × margen;
- NOPAT = EBIT × (1 − t);
- FCFF = NOPAT − reinversión;
- valor terminal = FCFF₁₁ / (WACC terminal − g);
- patrimonio = valor operativo + caja + activos no operativos − deuda − arrendamientos − minoritarios − otras
  reclamaciones (opciones una sola vez);
- valor por acción = patrimonio / acciones diluidas.

Muestra un ejemplo con las cifras sustituidas.

## 5. Múltiplos (precio relativo, secundarios)

Los múltiplos son una segunda opinión: **nunca se derivan del DCF ni se mueven para parecerse a él.** Métodos:
EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF, P/S (P/V) y P/BV. Calcular los siete; P/S y P/BV mantienen peso 0 salvo justificación. Un método con métrica FY+3
negativa o casi nula no aplica (N/D). En financieras no aplican los métodos de EV.

**Contrato de cálculo obligatorio:** aplicar `modelo/REGLAS_VIGENTES.md`, §5A. Usar siempre las fórmulas existentes de `Financials Multiples`, de cada método y del descuento; conservar la mecánica de los cinco originales y la extensión P/S (`PV`) y P/BV (`PBV`) en Maestra/IA/Manual. Elegir y justificar únicamente los supuestos de entrada, múltiplos de salida (`J8/J19/J30`) y pesos; nunca escribir precios calculados sobre fórmulas. P/S usa ventas por acción; P/BV usa patrimonio común proyectado por acción, conciliando sus movimientos. Mostrar los siete resultados a FY+1/FY+2/FY+3 y sus valores presentes aunque el peso sea cero, o N/A/N/D con motivo, dato faltante e impacto documentados. Un peso cero no permite omitir el cálculo.

Para cada método y cada historia (Conservador, Base, Optimista), el múltiplo de salida en FY+3 se fija así:
1. **Historia propia por ciclo:** mediana de los cierres en que la empresa creció a ±2 pp de lo que el escenario
   espera en FY+3. Si no hay ninguno, el cierre más cercano. Si el escenario crece menos que todos los cierres, el
   mínimo observado. Antes, excluye y lista los atípicos: métrica ≤ 0, más de 2,5× o menos de 0,4× la mediana,
   partidas no recurrentes, precios sin ajustar por splits.
2. **Ajuste por tasas:** cada múltiplo histórico se multiplica por (k del cierre − g) / (k del corte − g), con
   k = Treasury + prima implícita de Damodaran al cierre de ese año. El factor queda entre 0,6 y 1,4.
3. **Topes:**
   - el Conservador no supera el múltiplo actual (LTM);
   - ningún escenario supera el **múltiplo justificado por sus propios fundamentales** (ancla C):
     - EV/FCFF = (1+g)/(WACC−g);
     - P/FCFE = (1+g)/(Ke−g);
     - P/E = (1 − g/ROE)(1+g)/(Ke−g);
     - EV/EBITDA y P/OCF se obtienen de esos con su conversión FY+3;
     - si g > Ke − 1 pp, C no se calcula.
   - No apliques descuentos generales adicionales (por ejemplo «× 0,8 por prudencia»): el ajuste por tasas y el
     ancla C ya hacen ese trabajo.
4. **Comprobación con comparables:** la mediana de pares ajustada por diferencias de crecimiento, margen, ROIC y
   riesgo, cada ajuste en % con su motivo. Si el múltiplo elegido se aparta más de 25% de los pares, explícalo.
5. Un Optimista más de 25% por encima del múltiplo actual exige evidencia de una mejora de fundamentales escrita.

El valor relativo de cada método se calcula a FY+3 y se trae a hoy: VPₙ = precio FY+n / (1+Ke)ⁿ + dividendos
descontados. Muestra hoy y FY+3 por separado; el ponderado DCF + múltiplos es lectura secundaria, con pesos por
tipo de empresa, y **nunca se rotula como valor intrínseco**.

## 6. Sensibilidad (solo sobre la Base; lo mínimo obligatorio)

Obligatorio: las tres sensibilidades del DCF Base y el DCF inverso (contrato de abajo). Las matrices de múltiplos son
opcionales y nunca bloquean la entrega.


- **DCF Base:**
  - matriz WACC ± 1 pp × g terminal ± 0,5 pp;
  - crecimiento ± 2 pp;
  - margen ± 3 pp;
  - beta de regresión frente a bottom-up;
  - peso del valor terminal en el valor operativo.
- **Múltiplos Base:** matriz múltiplo de salida (en veces, ejes reales) × fundamental FY+3 (en sus unidades). La
  celda central reproduce el valor relativo Base del método.

<!-- JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->
## Contrato cuantitativo vigente del prompt Work (15-oct-2026)

Este contrato precisa el DCF inverso y la sensibilidad; prevalece sobre instrucciones numéricas anteriores incompatibles y conserva las 18 secciones del artículo, los 14 apartados de valoración y la jerarquía sectorial.

- **DCF inverso del Base:** resolver un único delta común aditivo a las cinco tasas anuales originales de ingresos: `g_t_inverso = g_t_Base + delta`, años 1–5. Conservar la forma de la trayectoria; informar delta en puntos porcentuales y CAGR geométrico Base e implícito por separado. Recalcular los diez años, la convergencia de los años 6–10 hacia el g terminal fijo, la reinversión, los descuentos y la perpetuidad en cada iteración. Mantener los demás supuestos Base; no sustituir la trayectoria por crecimiento constante ni calibrar el valor multiplicándolo por motor/hoja. Reproducir primero el Base de la hoja dentro de 0,001 por acción (o una tolerancia relativa documentada más estricta), después reconstruir el precio fijo del análisis con la misma tolerancia. Registrar precio y fecha de mercado separados de la fecha del cálculo, variable, intervalo, raíces, selección y error. Ausencia de raíz se registra como «No calculable» con rango y motivo; nunca inventar ni conservar un resultado de otro conjunto de supuestos.
- **Tres sensibilidades, exclusivamente del DCF Base:** (A) WACC terminal × crecimiento perpetuo, recalculando la transición de tasas y todos los descuentos afectados; (B) ROIC marginal terminal × crecimiento perpetuo, recalculando reinversión y eficiencia de capital; (C) delta de crecimiento de ingresos años 1–5 × margen EBIT objetivo, recalculando los flujos completos. El centro de cada matriz debe igualar el mismo DCF Base dentro de 0,001 por acción; validar WACC > g y mostrar estados inválidos explícitos. No añadir sensibilidad a múltiplos. Explicar resultados en Nivel 1 y publicar matrices, operaciones y controles en Nivel 2 y en la hoja.
- **Ramas sectoriales:** en financieras usar FCFE/Ke y una incógnita económica identificada (por ejemplo crecimiento patrimonial/ROE), con retención y capital regulatorio coherentes; no llamarla crecimiento de ingresos ni ejecutar el FCFF genérico. En holdings adaptar el inverso y las sensibilidades al método primario y perímetro material vigentes; un SOTP incompleto no se resuelve calibrando un DCF consolidado.
- **Publicación verificable:** el mismo precio fechado, escenario, datos, supuestos, resultado completo y controles deben llegar a la hoja, registro de valoración, artículo enlazado, visor y bitácora. Un error de cálculo o discrepancia bloquea publicación. Una importación compacta de Excel no puede sustituir la procedencia completa. Verificar también la tarjeta del PDF. Distinguir guardado, integrado, desplegado y visible; actualizar prompts no demuestra que las valoraciones previas hayan sido recalculadas o republicadas.

<!-- /JMR-WORK-BASE-INVERSE-SENSITIVITY-20261015 -->

## 7. Controles antes de entregar

Responde Sí/No a cada punto y marca Sí solo si lo verificaste:
0. Input completo (`inputs_completos.py` = 0 vacías); I+D, arrendamientos y opciones tratados según §2B; candados de la hoja en VALIDADO/LISTO.
1. Ingresos de los segmentos = total; CAGR con el número real de intervalos; la caja, la deuda y las acciones son
   las del último informe.
2. g terminal ≤ tasa libre y g < costo de capital terminal; peso del valor terminal informado.
3. El ROIC terminal sigue la regla de ventaja; ningún ROIC excedente perpetuo sin ventaja durable.
4. Márgenes: ninguno supera 2,5× el del sector sin ventaja durable escrita ni margen ya demostrado por la empresa; el Optimista no supera al de la Base en
   más de 10 pp sin evidencia.
5. Probabilidades = previa + ajustes documentados, y suman 100%.
6. Múltiplos: siete métodos evaluados/calculados con las fórmulas de la plantilla, incluidos los de peso cero; excepciones N/A/N/D justificadas; P/S y P/BV conectados a Financials Multiples y descuento. Ninguno sobre su ancla C, ninguno calibrado al DCF, atípicos listados.
7. MOS calculado sobre la Base principal.
8. Ninguna cifra sin etiqueta [Dato]/[Cálculo]/[Juicio]; ningún N/D tapado con un número.
9. Aislamiento: ningún ticker, cifra o texto de otra empresa, salvo comparables declarados. Escribe AISLAMIENTO = OK
   o explica.

Un control fallido se corrige o se declara en el informe. No se declara «auditado» lo que no se verificó.

## 8. El precio, al final

Solo ahora:
- precio del corte y diferencia con el DCF Base, el promedio y la Disrupción;
- **DCF inverso** (§6): qué crecimiento descuenta el precio y qué historia lo hace realidad;
- crecimiento implícito de cada múltiplo Base;
- la pregunta «¿qué sabe el mercado que yo no?», respondida con evidencia.

Si el precio contradice tu Base, no cambies la Base: explica la diferencia o identifica qué evidencia te falta.

## 9. Entregables (en este orden)

1. **Resumen:**
   - DCF Base hoy (valor principal);
   - promedio condicionado de tres historias y rango;
   - Disrupción aparte;
   - precio con MOS sobre la Base;
   - múltiplos como precio relativo, en una línea aparte.
2. **Historia y visión externa** (§2).
3. **Datos y conciliación**, con enlaces y fechas.
4. **Costo de capital** (§3), con beta de regresión y bottom-up.
5. **Historias** (§4): tabla con supuestos, valores y probabilidades; indicadores y pre-mortem.
6. **Múltiplos** (§5): una fila por método con historia, ajuste por tasas, ancla C, pares, elección y motivo.
7. **Sensibilidad y DCF inverso** (§6).
8. **Controles** (§7) y el precio (§8).
9. **Fuentes**: primarias y secundarias, con fecha y enlace.
10. **Ficha JSON para el modelo** (`reference/damodaran/<T>.json`):

```json
{
 "ticker": "<T>", "fecha_corte": "AAAA-MM-DD", "industria_damodaran": "<industria>",
 "segmentos": {"<segmento>": <ingresos LTM>},
 "margen_ltm": 0.00, "margen_max_hist": 0.00,
 "iyd": {"vida": 3, "margen_pp": 0.00, "capital_ventas": 0.00},
 "arrendamientos": {"margen_pp": 0.00, "capital_ventas": 0.00},
 "historias": [
  {"id": "A", "nombre": "Base · <frase>", "prob": 0.45, "margen": 0.00, "s2c": 0.0,
   "crec": {"<segmento>": [g1, g2, g3, g4, g5]}, "roic_terminal": 0.00},
  {"id": "B", "nombre": "Conservadora · <frase>", "...": "..."},
  {"id": "C", "nombre": "Disrupción · <frase>", "terminal": "estabilizacion", "roic_terminal": "costo_capital", "...": "..."},
  {"id": "D", "nombre": "Optimista · <frase>", "...": "..."}
 ],
 "indicadores": [["<indicador>", "<valor actual y fuente>", "<umbral que favorece Base/Optimista>", "<umbral que favorece Conservadora/Disrupción>"]],
 "ajustes_prob": [{"indicador": "<igual que en indicadores>", "de": "Base", "a": "Conservadora", "pp": 0.05, "evidencia": "<fuente>", "fecha": "AAAA-MM-DD"}],
 "justificacion_supuestos": {"S1": "<solo si un control de supuestos alerta y hay evidencia>"},
 "premortem": ["<causa 1>", "<causa 2>", "<causa 3>", "<causa 4>"],
 "fuentes": [["<descripción>", "<enlace>", "AAAA-MM-DD"]]
}
```

La decisión de comprar, mantener o vender la toma el usuario; tú das el valor, el rango, la confianza y qué te haría
cambiar de opinión.

---

### Anexo opcional: ejecución con el repositorio JMR-valuation

Solo si tienes acceso al repositorio (cualquier modelo o persona puede correrlo; el flujo completo está en
`docs/PROCESO.md`):
- atajo: `bash scripts/valorar.sh <T> [hoja] ["pares"] ["industria"]` (todo en orden; se detiene solo en el juicio);
- `completar_entradas.py`, `inputs_completos.py` y `candados.py` (entradas y candados de la hoja);
- `datos_mercado.py` y `aplicar_corte.py` (corte);
- `refresh_native_model.py` y `estados_completos.py` (estados);
- `probabilidades.py --apply` (probabilidades);
- `multiples_by_cycle.py` (múltiplos);
- `regenerar_una.sh` (hoja, motor y app);
- `controles_todas.sh` (controles);
- `foto_supuestos.py foto` (foto del corte).

La versión anterior de este prompt (v4, dependiente de una hoja y unas herramientas concretas y con reglas de
múltiplos superpuestas) está en `docs/prompts/archivo/`.
