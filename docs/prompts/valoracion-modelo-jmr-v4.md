# Prompt Maestro: Modelo de Valoración Damodaran para Cualquier Ticker (v4 · revisión historias 30-sep-2026)

<!-- JMR-PRECISION-20261009 -->
# Controles de precisión JMR · 9-oct-2026

Estas reglas prevalecen sobre ejemplos numéricos, atajos y afirmaciones incompatibles del prompt. Conservan el flujo, las 14 secciones de valoración y las 18 de research, las cuatro historias y la prioridad del valor intrínseco Base. No autorizan modificar otras valoraciones ni mezclar el flujo Colombia con el de EEUU.

## Evidencia y corte

Para cada entrada material registra emisor legal, clase/ISIN, consolidado o separado, moneda, escala, inicio y fin del período, duración, fecha de publicación, consulta, fuente directa y página/nota/celda. Fecha fiscal no equivale a publicación. Separa saldo de cierre, promedio, acumulado y trimestre aislado. Un semestre acumulado nunca se rotula trimestre ni UDM. UDM = anual anterior + acumulado actual − acumulado comparable solo si duración, perímetro y políticas son homogéneos; si hay integración o discontinuadas, concilia proforma o exclúyelo. Anualizar un semestre es una aproximación estacional explícita, no UDM.

Ausente permanece vacío/null, no cero. Conserva dato original, ajuste y derivado por separado. Verifica millones, miles de millones, acciones actuales y promedio ponderado antes de multiplicar/dividir. Los informes, JSON, tabla y exportación deben respetar la misma escala. No confundir precio preferencial × todas las acciones con capitalización observada multiclase; justifica la asignación económica por clase. Cierre, máximo, última operación y precio intradía son campos distintos. Si la nueva consulta falla, conserva referencia fechada y declara la consulta fallida; no renueves la hora de cotización ni la presentes como precio vivo.

## Tasas y exposición

Identifica convención y fecha de Rf, ERP, spread soberano, CRP, beta y ponderaciones. Usa el corte disponible sin incorporar información posterior; las series mensuales/anuales no adquieren falsamente la fecha diaria. No copies cifras históricas escritas en el prompt. Declara método de ERP implícita y cualquier ajuste soberano de la tasa base. Construye Ke = Rf + beta × ERP madura + lambda × CRP por exposición, o una alternativa equivalente explicada: no dupliques spread en Rf, ERP y CRP. No asignes riesgo país por moneda de cotización. Explica si ponderas ventas, activos o cartera y prueba la alternativa material. Beta sectorial es proxy documentada, no beta local empíricamente verificada. No añadir primas arbitrarias de liquidez ni elevar Ke de cada historia por el mismo deterioro ya incluido en los flujos. Explica cambios de riesgo y convergencia de tasas; con tasa variable descuenta usando el producto anual.

## Modelo y terminal

La fórmula industrial canónica corresponde a empresas operativas. Bancos usan FCFE compatible con capital, dividendos sostenibles o exceso de retornos al Ke; depósitos y deuda operativa no se restan otra vez. Concilia libro controlador + NCI − ajustes regulatorios netos con CET1. Evalúa CET1, Tier 1, capital total y apalancamiento; incorpora AT1/Tier 2, vencimientos, OCI, deducciones, capital aportado y propiedad/dilución. No sustituir ese puente por un porcentaje fijo de conversión sin respaldo. Retención y FCFE negativos deben revelar financiación, sin presentarlos como dividendos legales ni ocultarlos con cero. Separa VAN económico negativo, piso del título por responsabilidad limitada y liquidación, solo si esta tiene evidencia.

Comprueba continuidad FY10–FY11: todos los componentes de ingreso, gasto, impuestos, activos, RWA, capital, deducciones, NCI y distribuciones alcanzan el régimen descrito. g/ROIC o g/ROE no reemplaza una restricción regulatoria vinculante. No imponer un ROIC/ROE mínimo artificial para eliminar destrucción de valor: exige evidencia de ventaja para retorno superior al costo; puede quedar por debajo si el deterioro persiste. Valida Ke/WACC > g, identidad de flujos/retención, clean surplus con OCI y una extensión explícita del terminal cuando sea material. Sensibilidad de solo g terminal y sensibilidad económica con toda la convergencia son pruebas distintas y se rotulan.

## Anclas, eventos y publicación

Reconstruye ratios históricos con denominador atribuible, derechos, fecha, dilución y acciones corporativas. Documenta años y peers efectivamente verificados; no declares diez años si verificaste cinco. Excluye P/E con pérdidas y períodos no comparables; no promedies pérdidas como ratios baratos. Las anclas histórica, peer ajustado y fundamental se justifican por separado; ninguna se infiere del precio DCF. La ancla fundamental comparte supuestos y no representa evidencia independiente adicional. Informa múltiplos aplicados, pesos efectivos y tres lecturas: presente, FY+3 exdistribuciones y paquete FY+3 descontado al presente con cada distribución descontada en su año. No sumar distribuciones dos veces ni mezclar horizontes.

Distingue operación anunciada, autorizada, perfeccionada y consolidada. Ante una cesión/adquisición material con precio o perímetro efectivo desconocidos, entrega el valor del perímetro reportado y un puente incremental separado: PV de flujos después de capital − contraprestación − costos adicionales − financiación, con acciones/dilución coherentes. No tratar contraprestación desconocida como cero ni afirmar valor posoperación definitivo. La publicación autorizada puede mostrar ese alcance y su límite visible; no bloquees toda la entrega por un dato externo no divulgado.

Antes de publicar, relee resultados efectivos de la hoja, busca errores, reproduce independientemente cálculos materiales y concilia las cuatro historias, probabilidades, ambos horizontes, ponderados y precio congelado contra informes y JSON. Actualiza estados y advertencias obsoletos junto con cifras y enlaces. Revisión del modelo no equivale a auditoría contable ni certificación económica. Solicita autorización de publicación únicamente si no existe en la sesión; una autorización expresa vigente permite publicar sin preguntar otra vez. Comprueba la versión remota y la entrega/despliegue; no confundir commit enviado con app verificada.

<!-- /JMR-PRECISION-20261009 -->


<!-- JMR-AISLAMIENTO-EMPRESA-20261007 -->
## Aislamiento obligatorio por empresa · 7-oct-2026

Esta regla tiene prioridad sobre cualquier ejemplo, caso histórico o instrucción anterior del prompt.

**Principio:** cada valoración y cada research se ejecutan como un expediente nuevo y aislado. El único punto de partida permitido para una empresa nueva es una **copia nueva de la plantilla maestra vigente**. Nunca se usa como base la hoja, el informe, el JSON, los supuestos, los textos ni el script específico de otra empresa.

1. **Identidad cerrada.** Al iniciar fija TICKER_OBJETIVO, nombre legal, bolsa/moneda, SHEET_ID_OBJETIVO y fecha de corte. Desde ese momento, todo dato cuantitativo o cualitativo debe pertenecer explícitamente a esa identidad. Si una fuente, archivo o registro corresponde a otro ticker, se excluye del contexto de trabajo salvo que sea un comparable declarado.
2. **Copia limpia.** Para una empresa nueva: plantilla maestra inmutable → copia nueva → asignar ID nuevo → poblar únicamente esa copia. Está prohibido duplicar una valoración ya llena de otra empresa. La plantilla maestra nunca recibe datos de compañías.
3. **Cero herencia de contenido.** No reutilices cifras, márgenes, crecimiento, WACC/Ke, beta, primas regionales, ventas/capital, ROIC, deuda, caja, acciones, múltiplos, peers, probabilidades, historias, tesis, riesgos, catalizadores, textos o ajustes de otra empresa. Los valores comunes de mercado solo pueden venir del corte común vigente y deben identificarse como tales.
4. **Ejemplos no son datos.** Cualquier ticker o cifra nombrados en este prompt, en documentación, casos de estudio o scripts históricos son solo ejemplos metodológicos. Nunca se copian al expediente objetivo. Las excepciones de una empresa no se generalizan a otra.
5. **Estado efímero por ejecución.** Los artefactos intermedios de investigación y cálculo deben quedar bajo el ticker objetivo. No cargues automáticamente el último análisis, la última hoja abierta ni resultados de una ejecución previa como entrada de una nueva valoración.
6. **Comparables encapsulados.** Los peers solo pueden aportar las métricas expresamente usadas para comparables/benchmark. Sus datos no pueden sustituir datos operativos de la empresa objetivo ni contaminar sus historias.
7. **Validación anti-contaminación antes de escribir.** Comprueba que ticker, nombre, moneda, sheet ID y fecha coinciden en todas las salidas. Busca nombres/tickers ajenos en celdas de texto, notas, JSON y documentos. Todo ticker ajeno debe estar justificado como peer, fuente o ejemplo; de lo contrario, detén la publicación y corrígelo.
8. **Validación anti-contaminación al cerrar.** El informe, research, app y hoja deben poder reconstruirse usando únicamente: (a) la copia de la plantilla maestra del ticker objetivo, (b) fuentes primarias/secundarias de esa empresa, (c) datos comunes de mercado declarados y (d) comparables declarados. Si dependen de una valoración anterior de otra empresa, el cierre falla.
9. **Actualizaciones.** Si la empresa ya tiene una valoración y el usuario pide actualizarla, se puede trabajar sobre **su propia hoja** con respaldo; nunca sobre la de otra empresa. Si pide rehacerla desde cero, se vuelve a copiar la maestra y la valoración anterior queda solo como referencia externa, no como semilla.
10. **Regla de conflicto.** Ante cualquier contradicción entre velocidad/reutilización y aislamiento, prevalece el aislamiento. Es preferible dejar un dato como pendiente antes que heredarlo o inferirlo desde otra empresa.

**Control obligatorio de salida:** AISLAMIENTO = OK solo si no hay datos heredados de otra empresa, la hoja procede de la maestra vigente y todos los artefactos apuntan al mismo ticker/ID. Sin AISLAMIENTO = OK, no publicar.
<!-- /JMR-AISLAMIENTO-EMPRESA-20261007 -->

<!-- JMR-HORIZONTES-OBLIGATORIOS-20261002 -->
## Presentación obligatoria de ambos horizontes · 2-oct-2026

Esta instrucción se aplica **siempre**, a cualquier empresa y en ambos prompts, y prevalece sobre indicaciones anteriores que permitan omitir los ponderados o presentar solo uno de los horizontes. El **DCF Base al presente** aparece primero como valor intrínseco principal; el esperado por probabilidades sigue como complemento. Los múltiplos y los ponderados son lecturas secundarias.

Presenta **dos tablas completas**, con moneda, fecha de valoración, horizonte y escenarios claramente identificados (Base primero):

1. **Valor por acción descontado al presente:** cada método de múltiplos por separado; **ponderado de múltiplos solos al presente**; **ponderado DCF + múltiplos al presente**. Indica si el valor presente por método usa el promedio de los horizontes 1, 2 y 3 o solo el horizonte 3; muestra el criterio vigente sin cambiarlo silenciosamente.
2. **Valor por acción a 3 años sin descontar (FY+3):** cada método de múltiplos por separado; **ponderado de múltiplos solos a 3 años sin descontar**; **ponderado DCF + múltiplos a 3 años sin descontar**. Distingue precio objetivo exdividendo, dividendos acumulados y total, cuando la hoja incluya distribuciones.

El múltiplo aplicado (×) y el resultado por acción (moneda) son conceptos distintos: informa ambos y no llames «múltiplo» a un precio. No sustituyas las dos tablas por cifras separadas por barras ni por un único combinado. Si existen solo tres escenarios auxiliares de múltiplos, identifica ese alcance y no inventes Disrupción.

**Pesos y fórmulas:** conserva los pesos vigentes y documenta la categoría de empresa. Para los múltiplos solos, normaliza los pesos de los métodos aplicables al **100% entre los múltiplos**: peso_relativo_i = peso_i / suma(pesos_múltiplos_aplicables); ponderado_múltiplos_h = suma(peso_relativo_i × valor_i,h). Para el combinado usa los pesos originales: ponderado_combinado_h = peso_DCF × DCF_h + suma(peso_i × valor_i,h), con suma de pesos = 100%. No confundas este ponderado de métodos con las probabilidades de las cuatro historias DCF.

En el combinado presente usa **DCF al presente**. En el combinado FY+3, usa el DCF llevado al mismo horizonte con el Ke vigente y la convención de la hoja, debidamente explicada. Si se usa DCF_hoy × (1 + Ke)^3, rotúlalo **DCF capitalizado a FY+3 antes de distribuciones**: expresa riqueza capitalizada, no un nuevo DCF ni un precio exdividendo. No mezcles DCF presente con múltiplos futuros.

Descuenta cada dividendo en su año de pago: VP_n = Precio_FY+n / (1 + Ke)^n + suma(Dividendo_FY+t / (1 + Ke)^t), t = 1..n. No descontar todos los dividendos acumulados como si se pagaran en el año de salida. No los sumes otra vez a un resultado que ya los incluya.

**Control de cierre obligatorio:** ambas tablas contienen métodos individuales, ponderado de múltiplos solos y ponderado DCF + múltiplos; los pesos y resultados reproducen la hoja y coinciden entre informe, app y resumen final. Si un método no aplica, justifícalo y muestra sus pesos efectivos. Si falta una cifra o no existen pesos definidos, conserva la fila con «pendiente» y explica qué falta; no inventes valores ni pesos para completarla. Mostrar ambas lecturas no autoriza cambiar anclas, añadir valoración por promedios históricos ni alterar la política de MOS.
<!-- /JMR-HORIZONTES-OBLIGATORIOS-20261002 -->

<!-- JMR-FORMULA-UNICA-20261002 -->
## Fórmula única en todas las hojas · 2-oct-2026

Esta instrucción se aplica **siempre**, a cualquier empresa y en ambos prompts, y prevalece sobre indicaciones anteriores que permitan cambiar fórmulas de la hoja.

**Una sola fórmula.** Todas las hojas usan exactamente las fórmulas de la **plantilla maestra con el contrato de escenarios** (DCF, costo de capital, conversores, opciones, proyecciones de múltiplos, pestañas de cada múltiplo, valoración histórica y Resumen). Entre empresas solo cambian los **datos reportados** y los **supuestos**; entre historias solo cambian el crecimiento inicial y objetivo, el margen inicial y objetivo, la reinversión y el ROIC terminal (según el criterio de ventaja: sin ventaja o en erosión, ROIC terminal = costo de capital). No se reescriben fórmulas de la plantilla para una empresa: si una fórmula está mal, se corrige en la maestra y en todas las hojas.

**Contrato de escenarios en la hoja.** Cada escenario de múltiplos se proyecta con su historia: 'Financials Multiples' toma del bloque Damodaran de su escenario en 'Valuation output' las ventas, el crecimiento, el margen, la tasa de impuestos (1 − NOPAT/EBIT) y la reinversión (Conservador ← bloque Conservador, Base ← Base, Optimista ← Optimista). Las acciones de los múltiplos se mantienen constantes desde el año fiscal, sin recompras automáticas y sin referencias circulares. La deuda de los múltiplos EV sale de 'Valuation output' y se restan las preferentes ('Input sheet'!B76). Las zonas de compra del Resumen se miden contra el valor de hoy. El DCF a FY+3 del Resumen es el DCF de las historias × (1 + Ke)³ y la fila 38 de 'Descuento de múltiplos' es el DCF de las historias.

**Cuatro DCF con la estructura de Damodaran.** Las cuatro historias se calculan en 'Valuation output' con los mismos bloques de Damodaran (crecimiento, ventas, margen, EBIT, impuestos, pérdidas fiscales, reinversión, FCFF, costo de capital, valor terminal, probabilidad de quiebra, deuda, caja, opciones y valor por acción): Base (filas 2-42), Conservador (53-93), Optimista (104-144) y Disrupción (157-197). Cada bloque toma de su historia en 'Escenarios e historias' el crecimiento de los años 1-10 (suma de los segmentos), el crecimiento terminal (la Base usa el de la 'Input sheet'), el margen objetivo (C45:C48), ventas/capital y el ROIC terminal; lo común (ventas LTM, margen inicial, convergencia, impuestos, costo de capital, deuda, caja, opciones y acciones) sale de la 'Input sheet'. La pestaña de historias no calcula DCF: guarda los supuestos de cada historia, la suma de los segmentos y el resumen (valor de cada bloque, probabilidades y esperado). No se crea una 'Input sheet' por escenario. La Base de 'Valuation output' es el DCF Base; no existe un caso técnico distinto.

**Datos: enlace + ajuste visible.** Cada dato de la 'Input sheet' (ventas, EBIT, intereses, patrimonio, deuda, caja, activos no operativos, acciones) se enlaza al estado financiero de la hoja. Si hace falta un ajuste (cargos de una vez, saldo de un 10-Q posterior, RSU, valor nominal de la deuda, preferentes), se escribe en la fórmula como enlace + ajuste (por ejemplo `='Balance Sheet'!L5+449,7`) y se explica en una nota de la celda con su fuente. No se escriben números fijos donde la plantilla enlaza. La deuda (B16) incluye los arrendamientos del balance solo si no se usa el conversor (B18 = "No"); con el conversor, se excluyen para no contarlos dos veces.

**Supuestos que sí se escriben a mano**, con su justificación: margen inicial, convergencia y ventas/capital (B28, B31-B33; el crecimiento y el margen objetivo de cada escenario se escriben en su historia), tasa de impuestos proyectada (B24), costo de capital terminal (B47), ROIC terminal (B49-B50), activos no operativos cuando el analista decide excluirlos, parámetros de los escenarios técnicos en 'Valuation output', múltiplos objetivo (J8/J19/J30), el porcentaje de otros ingresos sobre EBIT proyectado ('Financials Multiples' E11/E50/E90; el promedio de tres años de la maestra falla cuando el EBIT histórico es casi nulo) y el precio fijado a la fecha de valoración.

**Tasas comunes a toda la cartera (Damodaran) · 6-oct-2026.** Todas las valoraciones en dólares a una misma fecha usan la misma tasa libre de riesgo y la misma prima de mercado, y las dos deben ser de la MISMA fecha. Tasa libre de riesgo (B35) = Treasury a 10 años del día de corte (30-sep-2026: 5,29%). Prima madura ('Country equity risk premiums'!B2) = la implícita de Damodaran calculada con esa misma tasa y con los precios de ese día (ERPOct26.xlsx, publicada el 1-oct-2026: 3,70%; no mezclar una tasa del 30-sep con una prima del 1-sep). Prima por país = madura + riesgo país de su tabla, ponderada por las ventas de cada región; con el Treasury sin ajustar, EE.UU. no lleva prima país. Costo de capital terminal: en mercados desarrollados aplica la tasa libre de riesgo más la prima madura cuando corresponda; en mercados emergentes conserva la prima país en perpetuidad cuando el riesgo soberano sea estructural. Los valores concretos deben provenir del corte vigente, nunca de ejemplos históricos. Los datos de mercado más recientes salen de scripts/datos_mercado.py (prima de Damodaran del último mes, Treasury del mismo día en FRED y cierres de Yahoo Finance → reference/corte_vigente.json) y se llevan a las hojas con scripts/aplicar_corte.py, que también recalcula el costo terminal y los ROIC terminales de punto medio. Una valoración nueva usa el corte vigente de la cartera; los hechos posteriores (8-K/6-K) se incorporan como eventos. El ROIC terminal nunca queda por debajo del costo de capital terminal.

**Ventas/capital (Damodaran, Investment Valuation cap. 11, p. 44-46).** Se elige dentro del rango de tres referencias: el de la empresa hoy, el marginal de uno y tres años y el promedio del sector, y se comprueba que el rendimiento sobre el capital nuevo (margen × (1 − t) × ventas/capital) sea creíble frente al ROIC actual y al del sector. El capital invertido es operativo: patrimonio + deuda − caja − inversiones financieras, SIN impuestos diferidos activos creados de una vez al liberar una reserva de valuación (los ajustes excepcionales se documentan fuera del prompt maestro y se aplican solo al ticker al que pertenecen) y CON el capital de trabajo (los prepagos y los ingresos diferidos financian crecimiento). No se topa el rendimiento contra un ROIC actual cargado de crédito mercantil.

**Fecha, precio y posición (6-oct-2026).** 'Input sheet'!B4 = fecha real del análisis (el corte); 'Input sheet'!D1 = cierre de ese día, fijo; B23 (precio de mercado del modelo: peso del patrimonio, opciones, precio/valor) = D1, nunca un GOOGLEFINANCE a la fecha de B4; 'Resumen de Valoración'!C25 = D1 y B3 = C25. La posición del usuario va aparte, en 'Resumen de Valoración'!A50:E60 («Mi posición en cartera»): acciones, costo promedio y primera compra de la hoja «Seguimiento de cartera» de Drive, precio de hoy en vivo y la ganancia potencial hasta el DCF Base, el esperado y el ponderado, desde el precio de hoy y desde el precio de compra (scripts/posicion_cartera.py). La app la muestra en «Tu posición».

**Los análisis salen de la hoja.** Toda cifra de los textos (tasa, beta, ventas/capital, valores de las historias) se lee de la hoja vigente (scripts/valores_hoja.py); un texto con una cifra escrita a mano que la hoja no usa es un error.

**Excepciones declaradas.** Las empresas financieras que requieran valoración por flujo al accionista pueden usar un bloque específico de múltiplos financieros. La clasificación debe justificarse para el ticker objetivo; ninguna excepción de una empresa anterior se hereda automáticamente. Cualquier otra excepción se documenta y se pide aprobación antes de aplicarla.

**Control.** Después de cualquier cambio de fórmulas, corre `scripts/audit_master_formulas.py` y `scripts/apply_canonical_formulas.py` (en seco: 0 celdas pendientes en cada hoja), `scripts/integridad_hojas.py` y el control de consistencia. Informa en el cierre: fórmula única verificada, datos enlazados (y cada ajuste con su nota) y supuestos escritos a mano.
<!-- /JMR-FORMULA-UNICA-20261002 -->

<!-- JMR-DESDE-CERO-20261006 -->
## Flujo desde cero, datos regulatorios y criterio Damodaran

Esta instrucción se aplica **siempre**, a cualquier empresa y en ambos prompts, y prevalece sobre indicaciones anteriores sobre plantillas, datos o scripts.

**Plantilla y archivo.** La única plantilla maestra es **«Modelo_JMR_Plantilla_Maestra»** ([hoja 19PRUFiYsNavUcN6WwHBVlp-VRMozp3rNSE2R1zt7N-g](https://docs.google.com/spreadsheets/d/19PRUFiYsNavUcN6WwHBVlp-VRMozp3rNSE2R1zt7N-g/edit)), la que cumple la fórmula única y el contrato de escenarios y contra la que comparan `audit_master_formulas.py` y `apply_canonical_formulas.py`. No uses copias históricas, reconstrucciones ni hojas almacenadas dentro de carpetas de empresas como plantilla. Para cada valoración nueva copiá la maestra con el conector de Drive (la cuenta de servicio no puede crear archivos) en AAA Finanzas › Análisis › <empresa>, buscando la carpeta por ticker y nombre, con el nombre «Modelo JMR - {TICKER} (desde cero AAAA-MM-DD)». Nunca sobrescribas la maestra, la hoja de otra empresa ni una copia anterior de la misma empresa: la anterior queda como referencia. Para actualizar una valoración existente, trabajá sobre su hoja con respaldo.

**Orden de scripts (JMR-valuation, `scripts/desde_cero.sh`).** `datos` → importador de la SEC, `nueva_empresa.py` (anclas, pestaña «Escenarios e historias» semilla y registro en la app), `auditar_estados_sec.py` + `aplicar_cambios_celdas.py` y `apply_lease_conversion.py` (con `--gasto=T:US$M` si el gasto de arrendamientos no está etiquetado). Después, el juicio del analista en `run_<t>_cero.py` y la ficha `<t>_cero_spec.py`. `historias` → `damodaran_stories.py`, `build_story_sheet.py`, `multiples_anchors.py`, decisión de múltiplos, `apply_multiples_v3.py`, `implied_growth.py`, `apply_canonical_formulas.py` en seco e `integridad_hojas.py`. `app` → `regenerar_cartera.sh`, `research_md_a_app.py` y `subir_drive.py`. No reemplaces un script del repositorio por un cálculo a mano: si un paso automático no cubre el caso, corregí el script o documentá la excepción.

**Datos de la SEC: controles obligatorios después del importador.** Corré siempre `auditar_estados_sec.py` y revisá además, contra el 10-K y el último 10-Q:
1. **D&A total**: la del estado de flujos de caja (DepreciationAndAmortization). Si conviven etiquetas de distinto alcance, identifica cuál representa la D&A total consolidada y usa esa; una D&A parcial deforma el EBITDA y el EV/EBITDA históricos. Al corregirla, compensá «Other Operating Expenses» y los flujos para no mover EBIT ni flujo operativo.
2. **Acciones y BPA**: algunas empresas pueden reportar escalas inconsistentes entre etiqueta y unidad; acciones en 0 o BPA en millones son error del importador.
3. **Partidas no etiquetadas**: SG&A o D&A en 0 entre años con dato se completan con el 10-K, con nota.
4. **Balance LTM** = último 10-Q (el importador puede repetir el cierre anual).
5. **Deuda**: los vencimientos corrientes que la empresa ya clasifica dentro del largo plazo (respaldados por una línea de crédito) no se suman otra vez; la deuda incluye el papel comercial.
6. **Arrendamientos**: en «Leases» solo los financieros (son deuda); los operativos van por el conversor (US GAAP) y no deben aparecer en la deuda histórica de unos años sí y otros no, porque rompen la comparabilidad de los múltiplos EV.
7. **Reexpresiones**: si la SEC muestra otra cifra para años viejos (reclasificaciones), informala; no la corrijas sin evidencia.
8. **Fuentes secundarias**: cualquier cifra de un agregador (resúmenes de llamadas, sitios de noticias) se verifica contra el comunicado o el 10-Q antes de usarla; si no coincide, gana la primaria y la secundaria solo sirve para citas cualitativas.

**Precio, fecha y tasas.** 'Input sheet'!D1 y B4 al cierre de la fecha de corte, 'Resumen de Valoración'!C25 al mismo precio (el importador lo congela con la fecha que trae la maestra), y verificá que 'Country equity risk premiums'!B2 sea la prima madura vigente: la maestra puede estar atrasada.

**Criterios de Damodaran aplicados (ver `reference/criterios_damodaran_2026-10-04.md`).**
- **Cargos que se repiten** tres años o más (reestructuración, litigios) son costo recurrente: no se suman al EBIT normalizado (*Investment Valuation*, cap. 9).
- **Arrendamientos operativos**: valor presente de los compromisos al costo de la deuda **antes de impuestos** del modelo, como en *Dealing with Operating Leases in Valuation*; si la tasa incremental de la empresa es muy distinta, mostrá el pasivo con ella como sensibilidad.
- **Beta bottom-up**: tabla **global** de Damodaran si más de la mitad de las ventas está fuera de EE.UU.; tabla de EE.UU. si la mayoría está en EE.UU.; la otra se informa como sensibilidad. El riesgo propio va en las historias, no en la tasa.
- **Prima por regiones**: ventas por región del 10-K; si solo hay segmentos sin países, repartí por locales, activos o ventas del sistema y declaralo como estimación.
- **Ventas/capital**: el rendimiento del capital nuevo (margen objetivo × (1 − t) × ventas/capital) debe ser creíble frente al ROIC actual con arrendamientos; en negocios con inmuebles propios (franquiciadores dueños de los locales) el ancla es el ROIC propio, no el ventas/capital de la industria. `damodaran_stories.py` avisa si el rendimiento supera el doble del ROIC terminal.
- **Cambios de mezcla** (refranquiciamiento, desinversiones, paso de venta propia a regalías): modelá las historias **por fuente de ingresos** (por ejemplo franquicias, restaurantes propios y otros) y explicá que los ingresos reportados pueden caer mientras crecen las ventas del sistema. Con ventas/capital, la caída de ingresos libera capital (reinversión negativa): solo es válido si el capital sale de verdad (lo que se cobra por los activos vendidos, menos capital de trabajo). `damodaran_stories.py` avisa cuando supera 10% del NOPAT; justificalo con lo cobrado o subí el ventas/capital propio de la historia en esos años (la reinversión es Δingresos ÷ ventas/capital: un ventas/capital mayor libera menos), y declaralo en el informe. La magnitud de la liberación de capital debe justificarse con evidencia específica de la empresa objetivo (proceeds por activos vendidos, reducción de capital de trabajo u otra evidencia primaria), nunca con parámetros heredados de otro caso.
- **Patrimonio contable negativo** (recompras financiadas con deuda): el ROE no es significativo y el múltiplo justificado del P/E no se calcula; usá capital invertido, no patrimonio, y explicá que no es insolvencia.
- **Peers**: excluí los que están en dificultades (comparables negativas sostenidas, ingresos en caída, múltiplos absurdos como un P/OCF de 3×) y los de otro modelo de negocio (operador frente a franquiciador), con el motivo.
- **DCF inverso**: el de `damodaran_stories.py` y el de `implied_growth.py` usan la trayectoria real de crecimiento de la hoja (desde hoy el segundo calibra con los años 1-5 de 'Valuation output'!C4:G4, no con el año 2). Si los dos difieren, informá ambos y explicá la causa.

**Informes.** El informe de valoración es el de 14 secciones del paso 11 (modelos: `data/CELH_Valoracion_Modelo_JMR_2026-10-05.md`, `data/MCD_Valoracion_Modelo_JMR_2026-10-06.md`); `valuation_report_v3.py` genera un anexo auxiliar, no el entregable. El research v5 integra en su sección 12 la salida de `damodaran_stories.py` (`data/<T>_Analisis_Damodaran_*.md`), la comprobación de ventaja y ROIC terminal y las dos tablas de horizontes, y se carga en la app con `research_md_a_app.py`.
<!-- /JMR-DESDE-CERO-20261006 -->



### Control de integridad · 1 de octubre de 2026

Esta sección prevalece sobre cualquier instrucción que permita cerrar una revisión sin verificar la hoja.

- **Un solo editor por hoja.** Nunca trabajes sobre una hoja que otra persona, chat o agente esté editando. Antes de escribir, revisa el historial de la hoja; si hay una edición reciente que no hiciste tú, detente y pregunta. Toda celda que cambies lleva respaldo del valor anterior y una nota con el motivo.
- **Una empresa por conversación.** Los análisis y las auditorías se hacen de a una empresa, con la hoja completa a la vista. Los cambios de criterio que afectan a todas (por ejemplo, el tratamiento de arrendamientos) se deciden en una sola sesión, se aplican igual en todas las hojas y se siguen de un escaneo de integridad de todas.
- **No reemplaces fórmulas por números** sin documentarlo. Una celda que debe seguir a otra (como 'Valuation output'!C46 = 'Input sheet'!B30) se enlaza; no se copia su valor.
- **Lista de cierre obligatoria.** Una revisión está completa solo si se verificó y se informa cada punto:
  1. Cuadre con la SEC (último 10-Q o 10-K): ventas y EBIT LTM, caja e inversiones, deuda, arrendamientos, acciones básicas y diluidas, preferentes, convertibles y minoritarios.
  2. Ninguna celda con error (#REF!, #VALUE!, #DIV/0!, #N/A, #NUM!) en las pestañas que usa la valoración.
  3. El motor del Modelo JMR reproduce el DCF de la hoja ('Valuation output'!B35) y la pestaña «Escenarios e historias» reproduce las cuatro historias y el esperado.
  4. Cada cifra de los textos sale del cálculo vigente o de una fuente citada con fecha. No escribas a mano un número que el modelo calcula.
  5. Estado declarado: verificado, corregido con salvedades o pendiente.
- **Escaneo de integridad.** Después de cualquier cambio masivo corre `python scripts/integridad_hojas.py` (JMR-valuation). Detecta errores, números fijos donde la plantilla tiene fórmulas, celdas desenlazadas, preferentes sin restar, diferencias entre la hoja y el último cálculo y ediciones humanas recientes.

### Presentación vigente · 1 de octubre de 2026

El **DCF Base** es el valor intrínseco principal y debe aparecer primero, con mayor destaque. Después presenta el **DCF esperado por probabilidades** como complemento y, por último, los múltiplos individuales, consolidados y ponderados como lecturas secundarias. Conserva el MOS sobre el esperado según la política vigente; la jerarquía visual no cambia esa fórmula.

Los nombres visibles son **Base, Conservadora, Disrupción y Optimista**, acompañados del título propio de cada historia. Usa **Disrupción · Deterioro de los fundamentales**. Las letras A/B/C/D solo son claves internas.

Integra en el análisis fundamental párrafos que expliquen, para cada supuesto material, la evidencia con fuente y fecha, el mecanismo económico, por qué elegiste esa cifra y no una alternativa, su sensibilidad y qué observación obligaría a cambiarla. Cubre crecimiento, margen, reinversión, ventas/capital, vida útil de I+D, costo de capital, crecimiento y ROIC terminales, dilución y múltiplos. Si falta soporte, declara la salvedad; no conviertas un valor heredado en un supuesto validado. Las tablas complementan esta explicación.

Presenta los múltiplos en tablas: una fila por método y una columna por escenario, Base primero. Distingue en cada celda **múltiplo aplicado (×)** y **precio relativo por acción (moneda)**, con horizonte y fecha explícitos. Deja el consolidado y el ponderado al final. No escribas series de cifras separadas por barras. Si los múltiplos solo tienen tres casos auxiliares, muestra esos tres y explica el alcance; no inventes un cuarto resultado de Disrupción. Comprueba que el Base, esperado, nombres y fórmulas coincidan entre el informe y la app.

> Reemplaza a la v3 (30-sep-2026). Conserva el proceso de punta a punta (SEC EDGAR, costo de capital, supuestos anclados, chequeo de bugs, múltiplos con tres anclas, múltiplos a valor presente, guardado en Drive) y adopta el **criterio de Damodaran** como eje:
>
> 1. **El valor intrínseco es el DCF.** El DCF de hoy es la cifra principal de la valoración.
> 2. **Los múltiplos son precio relativo y se tratan por aparte.** Se eligen con el protocolo de tres anclas (historia depurada, peers ajustados y múltiplo justificado), nunca derivados del DCF. Se pueden ponderar con el DCF en la app con los pesos de la categoría de empresa, pero esa mezcla es opcional y nunca reemplaza al DCF.
> 3. **Primero la historia, después los números y el precio al final.** Cada supuesto sale de una historia explícita (posible, plausible, probable), contrastada con tasas base; se cuantifican cuatro historias como únicos escenarios activos, con probabilidades y un valor esperado; el precio aparece recién al final (DCF inverso y crecimiento implícito) para no anclar el análisis.
> 4. **Decisión separada del análisis.** El documento termina con un registro de decisión; la decisión (comprar, mantener o vender) la toma el usuario en la app.
>
> Pensado para pegarse tal cual (reemplazando `{TICKER}`).

---

## Contexto que hay que tener antes de usar el prompt

- Repo `JMR-valuation` con `jmr_valuation/io/sec_edgar_loader.py`, `scripts/refresh_native_model.py` y `scripts/discount_multiples.py`.
- Una **plantilla maestra en blanco** en Google Sheets (formato Damodaran/Ginzu) con las correcciones estructurales aplicadas (ver el apéndice) y la hoja **«Descuento de múltiplos»** (múltiplos a valor presente en 1, 2 y 3 años). Si arrancás de una plantilla distinta, verificá primero que tenga ambas cosas; si le falta la hoja, corré `PYTHONPATH=.:scripts python scripts/discount_multiples.py --sheet-id <ID>`.
- Credenciales de service account con acceso de Editor a la plantilla (`GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT`).
- Conector de Google Drive de la cuenta del usuario para guardar los entregables en `AAA Finanzas › Análisis › <empresa>` (carpeta `Análisis`, ID `1IVpgm89jA4BmYVc3HKSCQ1iec4fpYE25`). La service account no tiene cuota de Drive: no puede crear archivos propios, solo editar los que ya existen.
- Acceso a `WebSearch` para la parte cualitativa (noticias recientes, guía de la empresa, comparables).

---

## El prompt

```
Quiero que armes un modelo de valoración DCF completo para {TICKER} usando la
plantilla Damodaran/Ginzu en Google Sheets [ID o nombre de la plantilla maestra].
Como la plantilla probablemente ya tiene datos de otra empresa, sobreescribila en
vez de duplicarla (a menos que haya cupo de Drive para copiar).

CONTRATO VIGENTE DE ESCENARIOS (revisión 30-sep-2026):
Las historias SON los escenarios activos, no una segunda valoración paralela.
Esta regla prevalece sobre instrucciones antiguas de tres escenarios técnicos.
Definí cuatro tesis adaptadas a la empresa, con identificadores estables:
A · Base; B · Conservadora; C · Disrupción; D · Optimista. El nombre completo de C es «Tesis de disrupción · Deterioro de los fundamentales».
Disrupción describe deterioro estructural del negocio; no presupone IA ni quiebra.
Base es la trayectoria central defendida con evidencia; no es el promedio de las
historias ni tiene que ser el punto medio del rango. Explicá por qué es central.
Los nombres descriptivos, hipótesis y probabilidades son propios de cada activo:
no copies cifras, probabilidades ni historias de ninguna empresa anterior.

Para cada tesis explicá: mecanismo económico, evidencia favorable y contraria,
qué debe ocurrir, señales de confirmación/invalidación y horizonte. Cuantificá un
DCF completo por año hasta el año 10 y su perpetuidad: ingresos por segmento y
agregados, crecimiento, margen operativo, impuestos, reinversión, retorno sobre
capital, flujos y valor terminal. Usá la misma fecha, moneda, perímetro y bases
contables. FCFF se descuenta a WACC; FCFE, cuando corresponda, a Ke. Mantené la
misma trayectoria de tasa entre historias; cambios de beta o tasa son sensibilidad
separada, salvo evidencia de un cambio de riesgo sistemático explícitamente
justificado. No cuentes el mismo riesgo en flujos, probabilidades y tasa.

Asigná probabilidades no negativas que sumen 100%, con fundamento y límites:
son juicio del analista, no frecuencias publicadas. Los desenlaces deben ser
suficientemente distintos para no solaparse y cubrir los futuros materiales.
DCF esperado hoy = suma(probabilidad de cada historia × su DCF por acción hoy).
Mostrá juntos y con igual destaque DCF base hoy (historia A) y DCF esperado hoy.
El margen de seguridad se aplica al esperado: precio MOS = esperado × (1 − MOS).
Si falta cuantificar una historia o justificar las probabilidades, indicá
«DCF esperado pendiente»; no sustituyas el esperado por el base ni por múltiplos.
Los múltiplos individuales, su consolidado y el ponderado con DCF son secundarios
y separados; la mezcla de métodos nunca se etiqueta como valor intrínseco.

En la hoja, creá o actualizá «Escenarios e historias» con los cuatro DCF por
fórmulas, probabilidades y resumen. Verificá igualdad con el motor y sincronizá
hoja, valoración guardada, análisis, visor, bitácora y portafolio cuando formen
parte del encargo. Los antiguos Conservador/Base/Optimista quedan identificados
como referencia técnica auxiliar; no son escenarios activos ni gobiernan el
base destacado o el esperado. No confundas el antiguo Base con la historia A.

Incluí «De dónde sale el cálculo»: registro de cada input (valor, unidad, período,
fuente y fecha, hoja/celda o campo, tipo de origen y justificación), trayectoria
anual de cada historia y puente numérico completo hasta el valor por acción.
Para FCFF: EBIT = ingresos × margen; NOPAT = EBIT × (1 − tasa fiscal efectiva
modelada); FCFF = NOPAT − reinversión neta; reinversión estable = NOPAT × g/ROIC;
VT = FCFF del año 11/(WACC terminal − g); valor operativo = suma de flujos y VT
descontados según la trayectoria de WACC; equity = valor operativo + caja y
activos no operativos separables − deuda − minoritarios y otras reclamaciones
aplicables; valor/acción = equity ajustado/acciones con dilución documentada.
Si usás opciones como reclamación separada, evitá duplicar su dilución. Para FCFE,
explicá beneficio, reinversión, deuda neta y capital regulatorio cuando aplique,
descontá a Ke y no restes nuevamente la deuda del valor patrimonial obtenido.
Mostrá un ejemplo sustituido con cifras y la suma ponderada de las cuatro tesis.


El crecimiento terminal se define para cada historia y no se hereda automáticamente del caso técnico. Una tesis de deterioro puede estabilizarse, seguir contrayéndose o liquidarse: justifica cuál de esas trayectorias representas, su reinversión y su ROIC. No introduzcas una recuperación por defecto. Un 0% nominal implica contracción real si hay inflación; no significa gasto bruto cero. Si no hay evidencia para otra trayectoria, la regla por defecto del Modelo JMR para C es estabilización: crecimiento terminal = crecimiento del año 5 de la historia, sin superar el terminal de la hoja y con piso de 0% nominal, años 6-10 interpolados linealmente hasta ese nivel y ROIC terminal = costo de capital. Puente al patrimonio con saldos del último trimestre: caja con valores negociables; inversiones no operativas aparte; deuda financiera y arrendamientos financieros; arrendamientos operativos como deuda (Damodaran): bajo US GAAP se capitalizan con el conversor (VP de compromisos a la deuda y al WACC; EBIT + gasto de arrendamiento − depreciación del activo; márgenes en base ajustada; ventas/capital con el capital arrendado); bajo NIIF 16 ya están en deuda y fuera del EBIT.

AUDITORÍA DE CONGRUENCIA OBLIGATORIA, ACTIVO POR ACTIVO:
- Conciliá datos históricos y LTM con fuentes primarias: períodos, moneda,
  escala, GAAP/ajustado, perímetro, adquisiciones, splits y acciones/ADR.
- Ingresos agregados = suma de segmentos sin duplicar partidas; el crecimiento
  del grupo sale de esos ingresos, no de promediar tasas sin ponderación. CAGR
  usa el número real de intervalos. Separá volumen/precio/mezcla y M&A/FX.
- Márgenes compatibles con ingresos, mezcla y costos; explicá cambios del año
  base al año 1, ajustes de I+D y convergencia sin saltos artificiales.
- Crecimiento exige reinversión compatible con capacidad, capex, capital de
  trabajo y adquisiciones. No dupliques reinversión si usás sales-to-capital.
- En cada historia justificá duración del moat y trayectoria de ROIC; si la
  ventaja se pierde, no mantengas retornos excedentes perpetuos por inercia.
  Un ROIC menor que WACC puede ser coherente en deterioro: no lo fuerces al alza.
  Verificá g < tasa terminal y explicá el peso del valor terminal en el total.
- Cada resultado explica qué supuestos lo causan, sensibilidad, límites y
  diferencias frente a otras historias. Ordená los valores esperados según la
  severidad de las tesis; si divergen, investigá y explicá el mecanismo, sin
  forzar que TODAS las variables sean menores/mayores en el mismo orden.
- Registrá antes/después de correcciones y estado: verificado, corregido con
  salvedades o pendiente. Fórmulas que reproducen la hoja no prueban por sí solas
  validez económica. No declares auditoría integral si quedan controles pendientes.

Reglas que aplican a todo el proceso:
- Toda cifra material lleva fuente y fecha (link directo a 10-K/10-Q/20-F/6-K,
  comunicado o proveedor de datos). No uses información posterior a la fecha de
  corte. No inventes consensos, múltiplos de peers, cifras ni links: si un dato no
  existe, decilo y explicá cómo afecta el supuesto.
- Separá siempre dato reportado, cálculo tuyo y juicio del analista.
- Guardá un backup de cualquier celda o fórmula antes de sobreescribirla. Todos
  los cambios deben ser reversibles.

Seguí este proceso, en este orden:

1. DATOS DUROS (automatizado, no toques manualmente lo que ya cubre el script)
   - Corré el pipeline de scripts/refresh_native_model.py para {TICKER}: trae datos
     reales de SEC EDGAR (XBRL) y llena Income Statement, Balance Sheet, Cash Flow
     Statement, encabezados de período, Trailing/Forward Valuation, Eficiencia de
     capital, Márgenes, Salud Financiera, Por acción y Sector.
   - Si es una empresa con menos de 10 años de historial o con estructura dual-class
     (acciones en circulación puede quedar stale), revisá que:
     a) los encabezados de período no muestren "Columna 2/3/4" (bug de Sheets Tables
        con celdas vacías — el padding debe ser "—", no "").
     b) las acciones en circulación no estén desactualizadas — si el tag puntual de
        XBRL dejó de reportarse, usar el fallback a diluted weighted-average shares
        (ya está en sec_edgar_loader.py, pero verificalo con el 10-Q/10-K más reciente).
   - Revisá splits, recompras netas, compensación en acciones, partidas no
     recurrentes y cambios de perímetro que distorsionen la historia o los
     múltiplos históricos de 'Trailing Valuation'.

2. COST OF CAPITAL
   - En "Cost of capital worksheet", verificá la industria (Input!B9/B10) contra la
     clasificación real de Damodaran, el approach de beta («Single Business(US)» si la mayoría de las ventas está en
     Norteamérica; «Single Business(Global)» si no), y el approach de costo de deuda: si la empresa no tiene
     deuda calificada real (interest expense ~0), usar "Direct Input" con un spread
     razonable en vez de dejar un rating heredado sin sentido.
   - BETA BOTTOM-UP (Damodaran): la beta de regresión de la acción es solo una
     referencia. Partí de la beta desapalancada del sector de Damodaran (tabla
     "Betas by Sector (US)", corregida por caja, fecha de la tabla), reapalancala
     con la D/E de mercado de la empresa. Sin primas por riesgos propios
     diversificables (concentración de clientes o de un distribuidor, una sola
     categoría, moda, regulación): van en las historias Conservadora y
     Disrupción, no en la tasa (contarlos en la tasa y en las historias los cuenta
     dos veces). La regresión solo se usa si el sector no describe el negocio
     cuando la clasificación sectorial no describa adecuadamente el modelo de negocio y se dice. Documentá beta de regresión, beta del sector, beta usada
     y el efecto en el DCF de usar una u otra.
   - Confirmá que el WACC resultante (celda de "Cost of capital based upon approach")
     sea coherente con el perfil de riesgo de la empresa. Anotá también el costo
     del patrimonio (Ke, 'Cost of capital worksheet'!B63): es la tasa con la que se
     descuentan los múltiplos a hoy.

3. INVESTIGACIÓN CUALITATIVA (WebSearch, no inventar)
   - Buscá: último earnings call / shareholder letter, guía oficial de la empresa
     (crecimiento, márgenes), consenso de analistas y revisiones de precio objetivo,
     noticias relevantes de los últimos 1-2 meses, eventos corporativos (M&A,
     directorio, litigios).
   - Leé TODOS los 8-K/6-K entre el último 10-Q/10-K y la fecha de corte (SEC
     EDGAR, submissions): un hecho material (p. ej. el ciberataque de BSX del
     25-ago-2026, la guía nueva de un 8-K de resultados) cambia los supuestos del
     año 1 aunque no esté en los estados financieros todavía.
   - Buscá también los múltiplos actuales de al menos 3 comparables del mismo
     modelo de negocio (con la fecha y la definición de cada múltiplo) y verificá
     que la hoja "Sector" tenga esos peers y no los de otra empresa.
   - Llená con esto: Cualitativo (empresa, segmentos, bull/bear case, y la sección
     "Acontecimientos y Noticias Recientes" — NO dejar el contenido de la empresa
     anterior si estás reescribiendo la plantilla), Estadísticas (empleados, deuda,
     ratios reales), Stories to Numbers (narrativa + link de cada supuesto a la
     historia).

3B. HISTORIA Y VISIÓN EXTERNA (criterio Damodaran; ANTES de fijar supuestos y SIN
    mirar la cotización ni los múltiplos de mercado)
   - Escribí la historia en un párrafo: qué es la empresa en 5-10 años, de dónde
     sale el crecimiento, qué margen es sostenible y por qué, cuánto hay que
     reinvertir y qué riesgo tiene. Pasala por el filtro posible / plausible /
     probable en una tabla con la evidencia de cada afirmación.
   - Visión externa: ubicá a la empresa en su tramo de tamaño de las tasas base de
     crecimiento de ventas a 5 años (Mauboussin & Callahan, The Base Rate Book,
     2016, Exhibit 4 — real, en dólares de 2015: sumá la inflación esperada para
     comparar con el DCF nominal; o "Bayes and Base Rates 2.0" si tenés la cifra
     nominal). Reportá la media, la mediana y qué fracción de empresas de ese
     tamaño logra el crecimiento que proponés. Te alejás de la tasa base solo con
     evidencia específica, y lo decís.
   - Descomponé el crecimiento en piezas verificables: por segmento, marca,
     producto o región; orgánico frente a comprado (las adquisiciones rompen la
     comparabilidad y no son crecimiento gratis); cuando exista, ventas al
     consumidor o sell-through frente a lo facturado (separa demanda de
     inventario); participación de mercado y crecimiento de la categoría.
   - Márgenes: separá GAAP de normalizado (cargos de una vez, integración,
     litigios, amortización de compras) y anclá el objetivo en un comparable
     maduro del mismo negocio, explicando la brecha de margen bruto y de escala.
   - Reinversión y retorno: orgánico (capex, capital de trabajo, sales-to-capital
     real) y comprado (precio pagado frente a ventas y NOPAT de lo comprado =
     retorno sobre lo pagado vs. costo de capital). El capital invertido debe
     incluir todo lo que financió el negocio (también preferentes o mezzanine).

4. SUPUESTOS DE CRECIMIENTO Y MARGEN (Input sheet B27-B33) — la parte que más se
   rompe si se hace a ojo. Para cada uno, ANCLAR a un dato real, nunca a un número
   redondo:
   - Crecimiento Año 1 (B27): entre el crecimiento trailing reciente y la guía
     oficial más reciente de la empresa (no la guía vieja).
   - Crecimiento Años 2-5 (B29): desacelera respecto al Año 1, informado por el
     tamaño del mercado total direccionable y la madurez de la categoría.
   - Margen Año 1 (B28): ¡OJO! compará este número contra el margen "Base year"
     que el modelo realmente usa como continuidad — en 'Valuation output'!B6, que
     puede estar AJUSTADO por capitalización de I+D (si Input!B17="Yes") y no
     coincide con el margen GAAP/LTM crudo del Income Statement. Si B28 queda muy
     por debajo de B6 sin ninguna razón real (ej. guía de compresión de márgenes
     de la empresa), estás introduciendo una caída artificial en el año 1.
   - Margen objetivo de largo plazo (B30): ancorar en comparables MADUROS del
     mismo modelo de negocio (no en el promedio de industria crudo de Damodaran si
     ese promedio está distorsionado por empresas no rentables — revisar la hoja
     "Industry Averages(US)" antes de usarlo a ciegas), y no en el nivel de una
     megacap de otro perfil de negocio.
   - Años de convergencia (B31): más cortos si la brecha actual es temporal, más
     largos (7-10) si la empresa está reinvirtiendo a propósito (la propia guía de
     la empresa suele decir esto explícitamente — ej. "el margen retrocede el año
     que viene porque vamos a gastar más en marketing").
   - Sales-to-capital (B32/B33): dentro del rango empresa hoy / marginal de 1 y 3
     años / sector (scripts/tabla_ventas_capital.py), con el capital invertido
     operativo descrito arriba (con capital de trabajo, sin impuestos diferidos de
     una liberación de reserva ni inversiones financieras). Chequeá que el
     rendimiento sobre el capital nuevo sea creíble y que el ROIC implícito del
     año 10 sea razonable.
   - ROIC después del año 10 (B49/B50), criterio Damodaran (30-sep-2026): el
     crecimiento solo crea valor si la empresa gana más que su costo de
     capital; en crecimiento estable la reinversión es g ÷ ROIC. La hoja
     supone por defecto ROIC = costo de capital (B49 = "No"). Damodaran
     advierte que los retornos excedentes persisten por largos períodos y que
     llevar el ROIC hacia el promedio de la industria da valores más
     razonables (Investment Valuation, cap. 12). Respondé tres preguntas con
     la evidencia de la sección 6 del análisis:
       1. ¿Gana HOY por encima de su costo de capital de forma sostenida (al
          menos los últimos 3 años, con plusvalía y arrendamientos cuando son
          materiales)?
       2. ¿Tiene una VENTAJA COMPETITIVA IDENTIFICABLE (barreras de entrada o
          ventajas diferenciales: costos de cambio, efectos de red, escala o
          costo, licencias o regulación, patentes, marca probada de 20 años o
          más que superó un ciclo o una crisis)? No cuenta la marca joven, la
          de moda sin trayectoria ni el producto fácil de sustituir.
       3. ¿La ventaja SE DESVANECE de forma visible hoy (ROIC en caída por
          competencia, pérdida de participación, precios a la baja)? El ROIC
          que cae por inversión (p. ej. el capex de IA) no cuenta.
     Resultado:
       * SIN VENTAJA DEFENDIBLE (falla 1 o 2): B49 = "No" (ROIC = costo de
         capital, el supuesto por defecto de Damodaran). El crecimiento
         posterior al año 10 no suma valor.
       * VENTAJA DURABLE (1 y 2 sí, 3 no): B50 = promedio de su industria
         (Damodaran, ROIC por industria), sin superar el ROIC actual ni bajar
         del costo de capital terminal (M14).
       * VENTAJA QUE SE DESVANECE (1 y 2 sí, 3 sí): B50 = punto medio entre el
         costo de capital terminal y el valor anterior (convención del modelo
         para "ser más conservador", como pide Damodaran cuando la ventaja se
         debilita).
     La PROBABILIDAD de perder la ventaja en el futuro no cambia este valor:
     va a las historias, donde las de erosión usan ROIC = costo de capital.
     Bajarlo también contaría el mismo riesgo dos veces.
     Si el promedio de la industria no es representativo (NA, o menor que el
     costo de capital porque agrega empresas con pérdidas, p. ej. Software
     (Internet)), usá la industria madura más cercana y decilo. MISMA DEFINICIÓN (Damodaran, I+D como
     gasto de capital): si el modelo capitaliza el I+D ('Input sheet'!B17 = Yes), llevá el ROIC de la
     industria a esa base antes de aplicar la regla: ROC × (margen después de impuestos ajustado por
     I+D ÷ margen sin ajustar) × capital ÷ (capital + activo de I+D), con la vida del I+D del modelo
     (activo ≈ I+D/ventas × 2,0 con 3 años; × 3,0 con 5 años), datos de Damodaran (margin, EVA, capex).
     Sin conversor de I+D se usa el ROIC publicado. En historias de continuidad no eleves el ROIC terminal por encima del
     actual sin evidencia; en deterioro puede quedar por debajo del costo de capital. Dejá nota en
     B50 con el veredicto de ventaja, sus fuentes, la evidencia, la amenaza y el cálculo, y
     reportá el DCF con y sin el ajuste. Registro: JMR-valuation
     reference/moat_<fecha>.json. Después revisá que los múltiplos de salida
     sigan contando la misma historia (paso 6.5, crecimiento implícito).
   - Cada supuesto de la hoja tiene que salir de la historia del paso 3B: los
     escenarios Conservador, Base y Optimista son historias, no porcentajes
     redondos alrededor del Base. Si el Base se aleja de la tasa base de su
     tamaño, la evidencia específica tiene que estar escrita.

5. VERIFICAR QUE EL DCF REALMENTE USE ESOS SUPUESTOS (checklist de bugs conocidos
   de esta plantilla — revisar ANTES de confiar en los outputs, no después):
   - 'Valuation output'!C46 (margen objetivo del caso Base) debe ser
     ='Input sheet'!B30. Si en cambio es "=C49" o similar, está usando el margen
     LTM fijo e IGNORANDO tu supuesto de B30 — arreglalo.
   - 'Valuation output'!C45 (margen objetivo del caso Conservador) NO debe ser un
     MIN() crudo de estadísticas históricas de 10 años (puede colapsar a negativo
     si la empresa tuvo pérdidas grandes en el pasado, aunque hoy sea rentable).
     Preferí anclarlo al margen actual (mismo basis ajustado que B6 — "la historia
     de mejora se estanca donde ya está") o al promedio de industria SI ese
     promedio queda por debajo del caso Base (verificalo, no asumas).
   - 'Valuation output'!C55 (crecimiento del caso Conservador) NO debe salir de un
     MIN() de crecimiento histórico crudo — para una empresa de alto crecimiento
     eso puede dar un número MÁS ALTO que el propio caso Base, lo cual es absurdo
     para un escenario "conservador". Anclalo a algo explícitamente más bajo que
     el Base: el extremo bajo de la guía oficial de la empresa, o la tasa libre de
     riesgo si preferís el extremo más severo.
   - 'Valuation output'!C47/C106 (margen y crecimiento del caso Optimista) deben
     quedar POR ENCIMA del Base en ambas dimensiones. Revisá la fórmula real
     detrás de cada uno — en esta plantilla, por default, suelen estar atados a
     un MAX() de estadísticas históricas o a una celda "LTM" que en realidad
     repite el crecimiento del último año fiscal completo (no una tasa realmente
     trailing-twelve-months) — chequeá contra un dato real y reciente (ej. la tasa
     de crecimiento de la métrica operativa clave: usuarios, GMV, etc.) en vez de
     confiar en la etiqueta "LTM" de la hoja.
   - En los tres casos técnicos auxiliares, revisá su orden y las referencias.
     Para las cuatro historias activas aplicá el contrato vigente: coherencia
     económica y explicación de cualquier orden contraintuitivo, sin forzar
     crecimiento y margen a moverse siempre en la misma dirección.

5B. HISTORIAS, PROBABILIDADES Y VALOR ESPERADO (criterio Damodaran)
   - Aplicá el contrato vigente: cuatro historias A/B/C/D que son los escenarios
     activos, con DCF anual completo, hoja «Escenarios e historias» y motor
     reconciliados. Calibrar contra la plantilla técnica no convierte su antiguo
     Base en la historia A. No mantengas dos familias de escenarios principales.
   - Asigná probabilidades justificadas (evidencia de hoy + tasas base) y calculá
     el valor esperado por acción. Mostrá también una tabla de sensibilidad
     crecimiento × margen del DCF Base.
   - Pre-mortem: si en 3 años la tesis falló, ¿por qué? (al menos cuatro causas),
     y la evidencia en contra de tu propia historia central.
   - Indicadores: 6-8 métricas observables con su valor actual y los umbrales que
     reforzarían cada historia, y una regla para mover las probabilidades cada
     trimestre (5-10 pp según la evidencia) sin cambiar el valor de cada historia
     salvo que cambie un supuesto.

6. MÚLTIPLOS OBJETIVO (PRECIO RELATIVO) — SELECCIÓN RAZONADA E INDEPENDIENTE DEL DCF
   (hojas EVEBITDA, EVFCFF, PE, PFCFE, POCF; celdas J8 = Conservador,
   J19 = Base, J30 = Optimista)

   El múltiplo de salida responde a: ¿cuánto pagaría razonablemente el mercado al
   cierre de FY+3 por cada unidad de métrica de esta empresa, dado lo que será en
   ese momento (crecimiento, rentabilidad, riesgo)? NO es una variable de ajuste.

   PROHIBIDO: derivar un múltiplo del valor del DCF (Valor de Equity del DCF /
   Utilidad Neta, EV del DCF / EBITDA, 'Valuation output'!B26/F20 o similares),
   o mover un múltiplo después de ver el DCF para que ambos valores se acerquen.
   Eso vacía la comparación intrínseco vs. relativo: los múltiplos tienen que ser
   una segunda opinión, no un eco del DCF. (Esto reemplaza el paso 6 de la v2.)

   6.1 Aplicabilidad de cada método: aplicable / aplicable con cautela / no aplicable.
       - La métrica proyectada de FY+1 a FY+3 ('Financials Multiples') tiene que
         ser positiva y representativa; si es negativa o casi cero, el método NO
         aplica.
       - Financieras: EV/EBITDA y EV/FCFF no aplican. Endeudamiento neto errático:
         P/FCFE con cautela. Cíclicas: métrica normalizada a mitad de ciclo. SBC
         material: advertir que P/OCF y los múltiplos de caja la ignoran.
       - Si un método no aplica, no le pongas un múltiplo arbitrario: dejalo
         documentado y resolvelo en la ponderación (paso 8).

   6.2 Tres anclas obligatorias por método (con definición, período y fuente):
       A. HISTORIA DEPURADA de la empresa ('Trailing Valuation': P/E fila 13,
          P/OCF 15, P/FCF 16 como referencia de P/FCFE, EV/EBITDA 21, EV/FCF 24
          como referencia de EV/FCFF; resumen en 'Supuestos de los Múltiplos').
          EV/FCF usa el flujo DESPUÉS de intereses: para compararlo con EV/FCFF
          multiplicalo por (FCF después de intereses ÷ FCFF) de 'Financials
          Multiples'. Si el último cierre trae partidas no operativas en
          'Interest / Other' (ganancias en inversiones, diferencia cambiaria),
          usá la mediana de los tres cierres o 1,0 y decilo. En los peers, EV/FCFF
          = EV ÷ (FCF + intereses × (1 − 21%)).
          Revisá que la historia esté ajustada por splits: cierres con múltiplos
          ~10-20 veces menores que los siguientes son precio sin ajustar, no
          historia; excluilos y decilo (y no los uses como tope del Optimista).
          Mediana de 5 y 10 años, percentiles 25 y 75, mínimo, máximo y LTM.
          Excluí y listá los atípicos: años con métrica negativa o ~0, múltiplos
          > 2,5× la mediana (burbuja) o < 0,4× (crisis puntual), salvo que sean el
          régimen actual. Excluí también los cierres distorsionados por partidas no
          recurrentes (ej. un beneficio tributario único que infla la utilidad) y
          citá la fuente. Si la empresa cambió de etapa (hipercrecimiento → madurez,
          o una re-valoración del sector), usá como A solo los cierres de la etapa
          actual más el LTM y declará desde qué año y por qué. Si no queda ningún
          cierre representativo, decilo: ese método se ancla en B y C.
       B. COMPARABLES ('Sector', filas 3-11: P/E en F, EV/FCF en G, P/FCF en H,
          EV/EBITDA en I, P/OCF en J; P/E forward en E). Mínimo 3 peers del mismo
          modelo de negocio, misma definición y fecha. Reportá mediana, rango y n.
          Ajustá la mediana EXPLÍCITAMENTE por diferencias de crecimiento a FY+3,
          margen, ROIC y riesgo — cada ajuste en % y con su motivo (ej. "−15%
          porque su crecimiento a FY+3 es la mitad del de los peers").
       C. MÚLTIPLO JUSTIFICADO POR FUNDAMENTALES (Damodaran), con los SUPUESTOS del
          escenario (no con su resultado), en FY+3:
            EV/FCFF   = (1 + g) / (WACC − g)
            P/FCFE    = (1 + g) / (Ke − g)
            P/E       = payout sostenible × (1 + g) / (Ke − g),
                        payout sostenible = 1 − g / ROE
            EV/EBITDA = EV/FCFF justificado × (FCFF / EBITDA de FY+3)
            P/OCF     = P/FCFE justificado × (FCFE / OCF de FY+3)
          g = punto medio entre el crecimiento promedio de los años 4-10 del
          escenario y el de perpetuidad (nunca mayor al de los años 4-10); WACC =
          promedio de los años 4-10; ROE = utilidad de FY+3 / patrimonio en libros
          LTM. g siempre al menos 1 pp por debajo de Ke y de WACC: si no, C no se
          calcula para ese escenario. Si Ke − g es chico y el resultado se dispara,
          decilo y dale menos peso a C.
          Si cambiás supuestos de crecimiento/margen/tasa, recalculá SOLO el ancla C.
          Hacelo en el mismo momento en que cambiás el DCF, no después
          (JMR-valuation: scripts/multiples_anchors.py --solo-justificado <anclas>),
          y volvé a aplicar 6.3: un C calculado con supuestos viejos contradice al
          DCF vigente sin que se note en la tabla.

   6.3 Regla para fijar los tres escenarios:
       - BASE (J19) = (1 − λ) × promedio(A, B) + λ × C_base.
         λ (entre 0 y 1) dice cuánto se acerca el Base al justificado: poco (0-0,25)
         si la empresa de FY+3 se parece a la de hoy o si C es inestable; más si la
         empresa de FY+3 va a ser claramente distinta. Declará λ y su motivo. Si A
         no tiene cierres representativos, usá B en lugar de promedio(A, B).
         Si la empresa crece mucho más hoy que en FY+3 (ej. 80% hoy, 40% en FY+3),
         el múltiplo de hoy no sirve para la métrica de FY+3: no lo uses como A.
         Si C no se puede calcular (g ≥ Ke o WACC − 1 pp), λ no aplica.
         Control: el Base tiene que quedar DENTRO del rango [mín(A,B,C);
         máx(A,B,C)]; si queda afuera es una excepción que justificás con
         evidencia concreta.
       - CONSERVADOR (J8) = Base × promedio de las dispersiones a la baja de cada
         ancla: P25/mediana de A, P25/mediana de los peers y C_conservador/C_base.
         Así el escenario Conservador sale de la misma lógica que el Base (menor
         crecimiento, múltiplos del cuartil bajo). NO uses "Base × 0,9" por inercia.
       - OPTIMISTA (J30) = Base × promedio de las dispersiones al alza: P75/mediana
         de A, P75/mediana de los peers y C_optimista/C_base. No superes el máximo
         de toda la historia depurada sin justificarlo.
       - Peers: excluí y justificá los que no son comparables en la etapa o en la
         métrica (en declive, en dificultades, con margen GAAP negativo o
         distorsionado por compensación en acciones) y los megacaps de otro perfil.
         El ajuste sobre la mediana de peers (en %) resume diferencias de
         crecimiento, margen, ROIC y riesgo, con cada componente explicado.
       - Siempre Conservador < Base < Optimista. Escribí los tres valores en
         J8/J19/J30 con 2 decimales (explícitos, sin depender de reglas
         automáticas de la plantilla).
       - Coherencia entre métodos: los cinco Base tienen que contar la misma
         historia (un EV/EBITDA alto con un P/E bajo solo se sostiene si lo
         explica la deuda o los impuestos). Explicá cualquier incoherencia.

   6.4 Chequeo de independencia (DESPUÉS de fijar los múltiplos): leé en
       'Descuento de múltiplos' los múltiplos consolidados hoy y comparalos con el
       DCF hoy.
       - No cambies ningún múltiplo para acercar uno al otro.
       - Diferencia > ±25%: explicá la causa (el mercado paga más/menos que los
         fundamentales, ciclo, supuestos agresivos del DCF) y cuál de los dos es
         más confiable para esta empresa y por qué.
       - Diferencia < ±5% en la mayoría de los métodos: confirmá expresamente que
         los múltiplos salieron de A, B y C y no del DCF.

   6.5 Chequeo de crecimiento implícito (criterio Damodaran), OBLIGATORIO:
       corré scripts/implied_growth.py {TICKER} (escribe la pestaña 'Crecimiento
       implícito' de la hoja, el JSON de reference/multiplos_v3 y el campo
       crecimientoImplicito de la valoración guardada).
       - Múltiplos: cada múltiplo Base se compara con el MÚLTIPLO QUE IMPLICA EL
         DCF en FY+3 (el que, con la misma métrica FY+3, deuda neta, acciones y
         dividendos de la hoja, da el DCF llevado a FY+3). Los dos pasan por la
         misma fórmula de crecimiento perpetuo (las de C despejadas para g), así
         que el sesgo de la fórmula —supone el ROE de FY+3 para siempre, mientras
         el DCF lleva el retorno al costo de capital después del año 10— se
         cancela. Alerta: diferencia > 2 pp en crecimiento implícito o > 25% en
         valor (con múltiplos altos el crecimiento de Gordon se acerca al costo
         de capital en los dos casos y deja de distinguir diferencias grandes).
       - DCF inverso: el crecimiento de ingresos de los años 1-5 que justifica el
         precio de hoy frente al del DCF.
       - Ante una alerta, decidí con evidencia cuál historia es la correcta y
         alineá los supuestos: si la evidencia sostiene más crecimiento, subilo en
         el DCF (y C sube solo); si no (historial de otra etapa, crecimiento
         comprado con adquisiciones, historial corto), acercá el múltiplo al
         justificado subiendo λ (0,5 o más) y dejá el histórico solo como tope del
         Optimista. Nunca muevas uno para que se parezca al otro sin esa decisión.
       - El crecimiento por adquisiciones no es gratis: separá orgánico de
         comprado y tratá las compras como reinversión.

   6.6 Documentación en la hoja:
       - 'Supuestos de los Múltiplos'!A3: síntesis de 3-5 líneas (regla usada,
         anclas principales, ajustes, excepciones). Aclará que J8/J19/J30 se
         fijaron con este protocolo aunque los rótulos de la fila 5 digan
         "x0,9" o "mín. positivo 4 cierres".
       - 'Supuestos de los Múltiplos'!A12: evaluación (diferencia con el DCF y
         método más confiable para esta empresa).
       - La tabla completa de origen va en la hoja de tesis (paso 10) y en el .md
         (paso 11).

7. MÚLTIPLOS A VALOR PRESENTE (hoja "Descuento de múltiplos", automática)
   - La hoja trae a hoy cada múltiplo en 1, 2 y 3 años:
     VP_n = Precio objetivo FY+n / (1 + Ke)^n
     + suma(Dividendo FY+t / (1 + Ke)^t), para t = 1..n,
     consolida cada método con el promedio de los tres horizontes (C6 = "Solo 3
     años" usa solo el de 3 años) y pondera: DCF hoy × peso DCF + múltiplos
     consolidados hoy × peso múltiplos.
   - No escribas en ella salvo C5 (Ke manual, solo con motivo documentado) o C6.
   - Verificá: Ke (B5) = el Ke del paso 2; el chequeo "VP a 3 años < FY+3 sin
     descontar" dice OK en los tres escenarios (filas 47-49 y columna K); y
     'Resumen de Valoración' C32:E34 muestra DCF hoy, múltiplos hoy y ponderado.
   - Si la hoja no existe, corré scripts/discount_multiples.py (ver Contexto).

8. PONDERACIÓN DE MÉTODOS · AMBOS HORIZONTES OBLIGATORIOS (Resumen de Valoración)
   - El valor intrínseco es el DCF. El ponderado DCF + múltiplos es una lectura
     secundaria que debe mostrarse por aparte en ambos horizontes; los pesos dependen del tipo de
     empresa (tabla I5:U11) y solo tiene sentido si los múltiplos pasaron el
     chequeo de crecimiento implícito (6.5).
   - Elegí el "Tipo de Empresa" (G3) por el CICLO DE VIDA de Damodaran y el
     SECTOR (reference/ciclo_de_vida/clasificacion_2026-10-05.json,
     scripts/ciclo_de_vida.py). Etapa con las cuatro variables de su cuadro
     (crecimiento de ventas, tendencia del margen, reinversión y flujo libre;
     SEC y la historia Base). Precio por etapa («Pricing across the Life
     Cycle»): crecimiento alto → ventas y márgenes; crecimiento maduro → P/E
     futuro y PEG; madura estable → P/E y EV/EBITDA; declive → libros. Sector
     («Choosing the right multiple»): financieras → P/BV (tipo Financiera);
     manufactura cíclica → P/E normalizado. Mapeo: «Crecimiento»/«Software» si
     las utilidades aún no llegan a su nivel estable (margen en expansión fuerte o
     recién positivo, o cíclico en el pico); «Madura» si son positivas y estables
     (crecimiento maduro, estable o declive con utilidades); «Biotech/Farma» si
     dependen de patentes que vencen o de un portafolio en desarrollo;
     «Hyper-Crecimiento/Pre-Rentable» con pérdidas. Dejá nota en G3 con la etapa,
     el sector y la evidencia.
   - Si ninguna encaja, o un método quedó "no aplica" en el paso 6.1 y la
     categoría le da peso, primero probá otra categoría que refleje mejor el
     historial. Solo si ninguna sirve, ajustá los pesos de la tabla compartida:
     afecta a TODAS las empresas de esa categoría (también las ya valoradas), así
     que registrá el cambio con antes/después en el log y avisá en el reporte
     final qué otras valoraciones usan esa categoría.
   - Regla general: más peso al DCF y a múltiplos de flujo de caja (FCFF/FCFE/OCF)
     cuando las utilidades/EBITDA son volátiles o negativas en el historial; más
     peso a P/E y EV/EBITDA cuando la empresa tiene utilidades estables y maduras.

9. BARRIDO DE ERRORES
   - Recorré TODAS las hojas del libro buscando celdas que empiecen con "#"
     (#DIV/0!, #REF!, #VALUE!, #N/A). Filtrá los falsos positivos (etiquetas de
     texto tipo "# Warrants issued=" o encabezados de tabla que literalmente
     dicen "#").
   - Los errores reales casi siempre vienen de: columnas de período vacías
     (CAGR dividiendo por blanco), falta de dividendos/opciones/deuda (fórmulas
     nativas que no contemplan el caso "sin dato"), o referencias circulares en
     "Option value" cuando no hay opciones de empleados (activar cálculo
     iterativo + IFERROR en la cadena).
   - Un puñado de errores en "Industry Averages(US)" (filas de industrias chicas
     con datos faltantes) son preexistentes del dataset de Damodaran y no
     dependen de la empresa que estés cargando — confirmalo comparando contra la
     plantilla en blanco antes de gastar tiempo en ellos.

10. HOJA RESUMEN "DE LA HISTORIA A LOS NÚMEROS"
   - Completá la hoja "Tesis de Inversión y Supuestos" (creala si no existe) con:
     a) La historia en 3-4 líneas: la tensión central del caso de inversión.
     b) Tabla bull case / bear case.
     c) Tabla que conecta cada supuesto (crecimiento, margen, años de
        convergencia, sales-to-capital, WACC, Ke) con su justificación y la fuente
        real de datos, para los tres escenarios.
     d) TABLA DE ORIGEN DE LOS MÚLTIPLOS, una fila por método: aplicabilidad;
        ancla A (mediana 5A/10A, P25-P75, LTM, atípicos excluidos); ancla B
        (mediana de peers, n, rango, ajuste en % y motivo); ancla C (fórmula, g,
        tasa, resultado); Conservador / Base / Optimista elegidos; regla y
        excepciones; celdas escritas.
     e) Tabla de resultado por escenario, separando HOY de FY+3:
        DCF Base hoy primero · métodos individuales y ponderado de múltiplos solos
        hoy y FY+3 · ponderado DCF + múltiplos hoy y FY+3 ·
        precio con MOS hoy (sobre el valor esperado de las historias si el
        análisis fundamental ya las tiene; si no, sobre el DCF) · precio objetivo FY+3 ponderado · precio actual y
        diferencia (valor hoy / precio − 1).
     f) Log breve de cualquier corrección estructural que hayas tenido que hacer
        (para que quede trazable qué se tocó y por qué).
     g) Conclusión de 3-4 líneas con la variable clave a monitorear y cuál de los
        dos enfoques (DCF o múltiplos) es más confiable para esta empresa.
     h) Historias con probabilidades y valor esperado (paso 5B).

11. GUARDADO EN LA CARPETA DE ANÁLISIS DE LA EMPRESA (obligatorio, sin pedir permiso)
   - La hoja del modelo queda donde está; no la muevas ni la dupliques.
   - Generá un resumen en Markdown llamado
     {TICKER}_Valoracion_Modelo_JMR_[AAAA-MM-DD].md con estas secciones, en este
     orden (el precio aparece recién en la sección 11):
       1. Resumen: valor intrínseco (DCF hoy) por escenario y valor esperado de
          las historias; en una línea aparte, los múltiplos como precio relativo.
          Sin precio de mercado.
       2. Historia y visión externa (paso 3B): historia, filtro posible /
          plausible / probable, tasas base, descomposición del crecimiento,
          márgenes normalizados, reinversión y retorno.
       3. Datos: link a la hoja, fecha de corte, conciliación de las cifras base.
       4. Supuestos del DCF por escenario (valor, celda, procedencia, evidencia a
          favor y en contra) y costo de capital (Rf, beta de regresión y beta
          bottom-up, ERP, Ke, Kd, pesos, WACC inicial y terminal).
       5. Historias, probabilidades y valor esperado (paso 5B): tabla de
          historias, sensibilidad crecimiento × margen, pre-mortem e indicadores.
       6. Múltiplos (precio relativo): la tabla de origen del paso 10.d y un
          párrafo por método; chequeo de independencia (6.4).
       7. Resultados: precio FY+3 por método y escenario; los 15 valores presente
          por escenario; consolidado por método; DCF Base hoy primero; ponderado de múltiplos
          solos hoy y FY+3; ponderado DCF + múltiplos hoy y FY+3; pesos
          efectivos, dividendos y convención de capitalización; MOS; chequeo VP3 < FY+3.
       8. DCF vs. múltiplos (lectura Damodaran: qué expectativas reflejan los
          múltiplos, qué supone el DCF, cuál es más confiable y por qué).
       9. Sensibilidad del DCF (±2 pp de crecimiento, ±3 pp de margen, ±1 pp de
          WACC, beta de regresión vs. bottom-up) y de los múltiplos (±20%).
      10. Log de cambios en la hoja y correcciones estructurales.
      11. El precio al final: precio actual; DCF inverso (crecimiento de los años
          1-5 que justifica el precio, con varios márgenes y betas); crecimiento
          implícito de cada múltiplo (6.5); qué historia necesita el precio y
          "¿qué sabe el mercado que yo no?".
      12. Registro de decisión: historia en una frase, probabilidades, valor
          esperado, rango, confianza, qué cambiaría la opinión y fecha de
          revisión. La decisión (comprar / mantener / vender) la registra el
          usuario en la app; no la tomes por él.
      13. Fuentes (primarias y secundarias, con fecha y link directo).
      14. Control de calidad (tabla Sí/No, marcando Sí solo si lo verificaste): lo
          de la v3 más: historia escrita antes de los números; tasas base del
          tamaño reportadas; orgánico vs. comprado separado; margen normalizado
          anclado en un maduro; beta bottom-up documentada; cuatro historias activas con
          probabilidades y valor esperado; pre-mortem e indicadores; el precio
          no aparece antes de la sección 11.
   - Guardalo en Google Drive en AAA Finanzas › Análisis › <empresa>. Buscá la
     subcarpeta por ticker y por nombre (por ticker o nombre de la empresa objetivo); usá la que ya
     tenga los análisis previos y creala con el ticker solo si no existe ninguna.
     Si ya hay un archivo con el mismo nombre, actualizalo en vez de duplicarlo.
   - Subilo como text/markdown sin convertir a Google Docs y a nombre de la cuenta
     del usuario: si solo tenés la service account, creá primero el archivo vacío
     con el conector de Drive y después cargá el contenido actualizándolo con la
     service account.
   - Verificá tamaño y MD5 contra el archivo local, devolvé el link y no muevas,
     renombres ni borres otros archivos de esa carpeta.
   - Si además se pidió el research fundamental, ese .md va en la misma carpeta
     (ver "JMR - PROMPT Research (VIGENTE v5).md" en la carpeta Prompts).

Reportame al final: el valor intrínseco (DCF hoy) por escenario y el valor esperado
de las historias; los múltiplos consolidados hoy como precio relativo y el ponderado
opcional; recién después, el precio actual y el DCF inverso; el precio objetivo FY+3
Base y el rango Conservador-Optimista; los cinco múltiplos Base con su ancla
principal; la diferencia DCF vs. múltiplos y su explicación; cualquier bug
estructural que hayas encontrado y corregido (con antes/después); cualquier cambio
a la tabla compartida de pesos; y el link al resumen guardado en la carpeta de
análisis.
```

---

## Qué cambió respecto de la v3

| Tema | v3 | v4 |
|---|---|---|
| Valor intrínseco | DCF hoy, múltiplos hoy y ponderado presentados juntos | El DCF es el valor intrínseco; los múltiplos son precio relativo por aparte; el ponderado es opcional (app) con pesos por tipo de empresa |
| Orden del análisis | Supuestos → resultados → comparación con el precio | Historia → visión externa → supuestos → historias con probabilidades → precio al final |
| Tasas base | No | Obligatorias por tramo de tamaño (Mauboussin) |
| Crecimiento | Un número agregado | Por segmento o marca; orgánico vs. comprado; sell-through vs. facturado |
| Beta | Regresión o la del libro | Bottom-up del sector (Damodaran), la de regresión como referencia |
| Escenarios | Conservador / Base / Optimista | Además cuatro historias activas con probabilidades y valor esperado, pre-mortem e indicadores |
| Decisión | No | Registro de decisión; comprar / mantener / vender lo elige el usuario en la app |

## Qué cambió respecto de la v2

| Paso | v2 | v3 |
|---|---|---|
| 6. Múltiplos (reglas universales: etapa actual, cierres no recurrentes, g del justificado, λ y Conservador/Optimista por dispersión) | Si el historial cruzaba de negativo a positivo, el múltiplo objetivo se calculaba como implícito del DCF (Equity DCF / Utilidad, EV DCF / EBITDA); si no, MIN de 4 años con ±10% | Tres anclas obligatorias (historia depurada, peers ajustados, múltiplo justificado por fundamentales); regla explícita para Base, Conservador y Optimista; prohibido derivar del DCF o ajustar después de verlo; chequeo de independencia; documentación en la hoja |
| 7. Valor presente | No existía | Hoja «Descuento de múltiplos»: VP a 1, 2 y 3 años, consolidado y ponderado con el DCF hoy; chequeo VP3 < FY+3 |
| 8. Ponderación | Ajustar la tabla compartida si la categoría no calza | Primero elegir otra categoría; si se cambia la tabla, registrarlo y avisar a qué valoraciones afecta |
| 10-11. Entregables | Valor DCF y precio objetivo ponderado | DCF hoy, múltiplos hoy y ponderado hoy por separado, tabla de origen de los múltiplos, sensibilidad y control de calidad |

Motivo: en la evaluación del 29-sep-2026, 100 de 110 múltiplos Base de las 22 valoraciones guardadas estaban escritos a mano en ~0,48× la mediana histórica de cada empresa, y en varias el valor de los múltiplos quedó casi igual al del DCF en múltiples casos, incluyendo algunos derivados explícitamente del DCF. Así, los múltiplos dejaban de funcionar como segunda opinión.

---

## Apéndice: bugs estructurales ya corregidos en la plantilla maestra (si arrancás de la plantilla ya corregida, no deberías volver a encontrarlos)

| # | Problema | Fix aplicado |
|---|---|---|
| 1 | Encabezados "Columna 2/3/4" en empresas con <10 años de historial | Padding con "—" en vez de celda vacía |
| 2 | Acciones en circulación desactualizadas en empresas dual-class / IPO reciente | Fallback a diluted weighted-average shares |
| 3 | CAGR9Y dividía por columna vacía → cascada de #DIV/0! por todo el árbol de escenarios | IFERROR en `Crecimiento y Márgenes!C7:C9` |
| 4 | P/E y EV/EBITDA rotos por historial de utilidades que cruza de negativo a positivo | v2: múltiplos implícitos del propio DCF. **v3: reemplazado** por la selección razonada del paso 6 (si la métrica proyectada es negativa, el método no aplica; si solo la historia es ruidosa, pesan más los peers y el múltiplo justificado) |
| 5 | Referencia circular en "Option value" (Black-Scholes con dilución) | Cálculo iterativo habilitado + IFERROR en la cadena |
| 6 | "TICKER" en blanco en varias hojas (`Input sheet!B1` vacío) | `Input sheet!B1` ahora referencia `Input sheet!A1` |
| 7 | Ponderación de métodos con preset genérico no calibrado al historial real | Rediseño de las 12 categorías + 2 nuevas (Hyper-Crecimiento/Pre-Rentable, Biotech/Farma) |
| 8 | `Valuation output!C46` (margen objetivo Base) desconectado de `Input!B30`, usaba LTM fijo | Reconectado a `Input sheet!B30` |
| 9 | `Valuation output!C45` (margen Conservador) podía colapsar a fuertemente negativo | Anclado al margen actual (mismo basis ajustado) |
| 10 | `Valuation output!C55` (crecimiento Conservador) podía superar al del Base | Anclado a un valor explícitamente inferior al Base |
| 11 | `Valuation output!C47`/`C106` (margen/crecimiento Optimista) podían quedar por debajo del Base, o usar un "LTM" mal etiquetado (en realidad el crecimiento del último año fiscal completo) | Recalibrados con fórmulas auto-ajustables por encima del Base |
| 12 | Margen Año 1 (`Input!B28`) comparado contra la base sin ajustar en vez de la base ajustada por I+D (`Valuation output!B6`) | Recalibrado contra el basis correcto |
| 13 | Proyección de capital de trabajo (NWC) basada en ΔNWC/ΔIngresos: explotaba cuando ΔIngresos ≈ 0 y referenciaba celdas vacías (H42/H82) | Reemplazada por intensidad de NWC (NWC / ingresos) aplicada a los ingresos proyectados (`scripts/model_steps.py::fix_nwc_projection`) |
| 14 | El Resumen mezclaba el DCF (valor hoy) con los múltiplos (precio FY+3) | Auditoría A3: DCF × (1+Ke)³ para el bloque FY+3; y hoja «Descuento de múltiplos» (29-sep-2026) con los múltiplos traídos a hoy en 1, 2 y 3 años, DCF hoy, múltiplos hoy y ponderado por separado |

**Regla de oro para cualquier ticker nuevo:** antes de confiar en cualquier output del DCF, verificá con datos reales (no con la fórmula "tal como está") la congruencia entre ingresos, crecimiento, márgenes, reinversión y ROIC de las cuatro historias activas. Si el valor no corresponde a la severidad de la tesis, investiga las referencias y explica el mecanismo económico; no fuerces el orden de todas las variables. **Y para los múltiplos:** si su valor hoy coincide casi exactamente con el DCF, sospechá que no son independientes y revisá de dónde salieron.


---

## JMR-MULTIPLOS-HISTORICOS-20261007 · Lectura histórica independiente

Cuando exista historia suficiente de múltiplos, añadir una capa separada de **Múltiplos históricos normalizados**.

Reglas obligatorias:
- No modifica el DCF, las cuatro historias, los múltiplos de salida vigentes ni sus ponderaciones.
- No entra automáticamente al precio objetivo ponderado ni al valor intrínseco.
- Usa únicamente la historia del ticker objetivo. No hereda series, múltiplos ni exclusiones de otra empresa.
- Para estadísticas históricas usar cierres fiscales positivos e interpretables; excluir denominadores negativos/casi cero y outliers documentados. LTM se muestra como referencia actual, pero no entra en la estadística histórica.
- Mostrar como mínimo: múltiplo actual, mínimo histórico válido, P25, mediana 5 años, promedio 5 años, mediana histórica depurada, descuento/prima actual frente a mediana y percentil actual.
- Si se traduce la historia a precio, aplicar cada ancla a la métrica Base de FY+3 y traer el precio a valor presente con Ke. Mostrar este resultado como **lectura de reversión a la media**, nunca como valor intrínseco.
- Frase de control obligatoria: **«Barato frente a su historia no equivale a infravalorado intrínsecamente.»**
- Si no hay al menos 3 cierres fiscales válidos para un método, mostrarlo como no interpretable y no consolidarlo.
- Los métodos declarados no aplicables en la valoración vigente no entran al consolidado histórico salvo justificación explícita.
- El bloque debe declarar afecta_dcf = false y afecta_ponderado = false.
