# JMR Colombia · Reglas independientes v1

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

Fecha de protocolo: 9 de octubre de 2026.

## Identidad y aislamiento
El único emisor objetivo es el del expediente jmr-colombia-dossier-v1 adjunto. Fija market=CO, ticker local .CL, emisor legal, clase, derechos, fecha, moneda y run_id antes de investigar. Si el instrumento no está identificado, resuelve esa identidad antes de valorar. Que el precio esté en COP no obliga a que los estados o el modelo estén en COP.

Este proceso es independiente del de Estados Unidos. No ejecutes el pipeline SEC/US ni reutilices run_pfgruposura.py, scripts de otra empresa, valoraciones ya llenas, research, supuestos o referencias específicas de otro emisor como semilla. Los comparables se declaran y quedan separados; sus números no sustituyen los del objetivo.

Parte de una copia NUEVA de la plantilla maestra de la rama correspondiente: empresa operativa, patrimonio financiero o holding. Registra procedencia, versión e ID. La maestra no recibe datos; no copies una hoja ya valorada. Si no existe plantilla apropiada o no puedes leerla, informa el bloqueo sin fingir que la industrial sirve para todo. Conserva las fórmulas canónicas de esa rama; cualquier reparación queda documentada.

## Datos automáticos y evidencia primaria
El expediente devuelve cotización local y estados estructurados de Yahoo Finance. Esa descarga no implica conciliación oficial ni garantiza diez años o LTM. No presentes los datos del agregador como si fueran obtenidos directamente del emisor. Las fechas retrievedAt, quotedAt y fiscalDate son distintas; publishedAt=null significa que falta verificar cuándo fue pública la cifra. Una fecha fiscal anterior al corte no demuestra que el reporte estuviera disponible al corte.

Prioriza estados auditados y notas, informes intermedios, relaciones con inversionistas, RNVE/SIMEV e información relevante. Usa Superintendencia Financiera, Banco de la República, DANE y reguladores sectoriales para contexto cuando corresponda. Consulta documentos exactos y enlázalos junto a cada afirmación material. La SEC puede corroborar un ADR de ESTE emisor con autorización de uso como fuente auxiliar; no es el importador principal del flujo local.

Busca diez años y LTM; si hay cuatro años del proveedor, indica cuatro y busca lo faltante en fuentes oficiales. Ausente no es cero. Distingue consolidado/separado, reportado/normalizado, continuado/discontinuado, moneda y escala. Conserva números originales y explica cada ajuste en una tabla con valor antes/después, fuente y período. Para balances usa el saldo más reciente. Reconstruye LTM solo con períodos comparables, duración conocida y fechas de publicación verificadas; no sumes acumulados que se solapan.

Bajo NIIF 16, revisa deuda y flujos de arrendamientos sin añadir un segundo conversor US GAAP sobre importes ya capitalizados. Revisa adquisiciones, participaciones, minoritarios, obligaciones de cierre, caja restringida y operaciones vinculadas según materialidad. No uses acciones promedio como acciones actuales sin justificarlo. No calcules capitalización de múltiples clases multiplicando toda la base de acciones por una sola cotización.

## Elegir modelo antes de estimar
- Operativa no financiera: DCF FCFF al WACC; justificar crecimiento, margen, reinversión, ROIC y puente a patrimonio.
- Materias primas: ciclo normalizado, reservas, reposición y cierre; no perpetuidad sobre reservas que se agotan.
- Infraestructura/concesión: activos, regulación y vida contractual; perpetuidad solo si los derechos continúan de forma justificada.
- Banco/financiera/aseguradora: valor del patrimonio mediante FCFE adaptado a capital y solvencia, exceso de retornos o dividendos sostenibles. Utilizar Ke y ROE; depósitos no son deuda industrial a restar del valor.
- Holding: suma de partes, costos y deuda/caja de matriz, porcentajes atribuibles y participaciones cruzadas. Valorar operaciones/participadas intrínsecamente cuando haya datos; si usas precios de mercado, rotular ese alcance. Evitar doble conteo de flujos, dividendos, deuda o caja.

La elección automática del catálogo es preliminar. El analista debe revisar el negocio actual, restructuraciones y clase. Model_approved=false impide afirmar que la elección fue validada.

## Moneda, riesgo y terminal
Flujos y tasas tienen la misma moneda y base real/nominal. No heredes Treasury, WACC, primas, impuestos ni crecimiento USD de las acciones estadounidenses. Una tasa TES no es libre de riesgo automáticamente: separar el componente soberano o construir una referencia monetaria equivalente coherente con inflación esperada. El precio actual no fija las tasas del análisis retrospectivo.

Documenta tasa libre de riesgo, beta bottom-up, prima de mercado maduro, exposición efectiva a países, Ke, Kd, pesos de financiación, impuestos y WACC. Si se incorpora prima país dentro de una prima total, no sumarla otra vez. Moneda de cotización y domicilio no bastan para determinar exposición país. Las hipótesis macro comunes se versionan por moneda y corte, sin heredarse de una empresa.

Para operativas, crecimiento estable = reinversión × ROIC; NOPAT del año siguiente y reinversión terminal deben ser coherentes, con WACC terminal > g. Justifica convergencia de márgenes, capital y ROIC. Usa ROIC cercano al costo de capital cuando no haya evidencia de ventaja duradera, sin convertirlo en una regla rígida para todo negocio. Para financieras relaciona g, ROE y retención compatible con capital regulatorio, con Ke > g.

## Historias, precio relativo y publicación
Mantén Base, Conservadora, Optimista y Disrupción — deterioro fundamental. Las probabilidades son juicio sustentado, no frecuencias conocidas, y deben sumar 100%. El valor Base aparece primero y con mayor destaque; el esperado es complementario. En financieras/holdings usa la denominación correcta de valor intrínseco, sin llamar DCF industrial a otro método.

Los múltiplos son una opinión independiente: tres anclas (historia depurada, peers ajustados y múltiplo justificado). No inferirlos del DCF ni moverlos para que coincidan con él. Si no aplica una métrica, documenta la exclusión y sus pesos efectivos. Históricos necesitan fechas, denominadores y corporativos comparables.

Presenta métodos individuales, ponderado de múltiplos solos y combinado secundario en DOS tablas: al presente y a tres años. Declara pesos, horizon­te y dividendos; no inventes valores para completar filas. Usa Ke para descontar precios del patrimonio y dividendos, y un puente coherente al usar múltiplos de empresa. No sumes distribuciones dos veces. La lectura histórica normalizada, si existe, queda separada y no altera DCF ni ponderaciones.

Precio del análisis y último precio consultado son campos separados. Identifica fecha/hora, COP y clase; una última transacción antigua no es precio de hoy. Revisa volumen, flotante, diferencial y días sin negociación cuando haya datos. No aplicar descuentos arbitrarios por Colombia o iliquidez. La equivalencia USD usa TRM identificada, sin confundirse con tipo de cambio ejecutable.

Entrega archivos independientes con metadatos al inicio entre líneas ---:
market: CO
ticker: ticker local exacto
analysis_date: fecha exacta del expediente
run_id: ID exacto del expediente
company: emisor objetivo
currency: moneda del informe

Los entregables quedan en el expediente Colombia del ticker. NO publicar, subir a la app ni escribir en bibliotecas de EEUU automáticamente. Completa y revisa el resultado, muestra qué se subiría y pregunta si el usuario autoriza publicarlo. Si no hay datos críticos, entrega lo verificable e informa el bloqueo; no declares auditoría completa.


---

# JMR Colombia · Research fundamental v1

Utiliza las reglas JMR Colombia de este mismo archivo y el expediente adjunto. Elabora una investigación profunda, independiente y específica del emisor. El research y la valoración son fases separadas: fuera de la sección 12 no calcules valor intrínseco ni precio objetivo. En la sección 12 reproduce e interpreta resultados de la valoración propia ya calculada y auditada; si no existe, explica las hipótesis pendientes sin inventar una valoración.

## Método editorial y profundidad
Escribe párrafos conectados que expliquen observación, mecanismo económico e implicación para el accionista. Antes de cada tabla explica qué pregunta responde; después interpreta los hallazgos materiales. Separa naturalmente lo reportado por la compañía, tus cálculos, estimaciones y juicios; no etiquetes cada párrafo con Hecho/Opinión. No atribuyas a la gerencia supuestos tuyos.

Verifica toda afirmación material con una fuente cercana, enlace directo y fecha de publicación. Una fuente secundaria no reemplaza un estado oficial disponible. No uses información posterior al corte. Especifica cada límite de evidencia y no lo rellenes con narrativa genérica.

Conserva todos los 18 títulos numerados que siguen, en orden. En 2, 4, 5, 6 y 8 desarrolla al menos tres párrafos sustantivos cuando exista evidencia; en 3 y 7, al menos dos. En cada estado financiero desarrolla al menos dos. Si falta evidencia, conserva el apartado y documenta qué falta; no inventes contenido. Incluye índice enlazado, tablas legibles y amplitud acorde con el negocio.

## 1. Resumen ejecutivo
Dos párrafos antes de las viñetas: negocio y tensión económica central. Resume ventajas, incertidumbres y señales que cambiarían la tesis. Si existe valoración revisada, menciona Base primero, esperado después y múltiplos separados, con método y moneda.

## 2. Modelo de negocio
Clientes, problema resuelto, productos, ingreso y costo, precios/volumen, cadena de valor, financiación y economía unitaria pertinente. No convertir todo emisor en software.

## 3. Segmentos y geografía
Tabla por segmento con ingresos, beneficios y crecimiento disponibles; interpretar concentración, eliminaciones, moneda, activos y exposición operativa por país. No asignar riesgo solo por domicilio.

## 4. Industria y crecimiento
Tamaño observable, penetración, estructura, regulación y tasas base pertinentes. Diferenciar crecimiento real y nominal y crecimiento orgánico/adquirido.
### Las 5 fuerzas de Porter
Tabla con exactamente las cinco fuerzas y evidencia a favor/en contra; interpreta cuáles gobiernan los retornos.

## 5. Calidad del negocio
### Análisis financiero histórico
Resultados, balance y flujo de caja, con período realmente disponible, moneda y unidades. Presenta ingresos, EBIT, resultado atribuible, reinversión, caja, deuda y retornos pertinentes. Para bancos añade margen de interés, calidad de cartera, provisiones y capital; para aseguradoras reservas y solvencia; no fuerces FCFF industrial.
### Evaluación cualitativa de la calidad
Conversión económica a caja, recurrencia y resiliencia, sin confundir margen alto con ventaja duradera.
### Auditoría de cifras y supuestos del Modelo JMR
Tabla dato/input, valor, celda o documento, origen, actividad en modelo, soporte, contraevidencia, estado y prioridad. Estados: conciliado, diferencia explicada, incongruencia confirmada, requiere aclaración, no verificable y no aplicable. No certificar lo no leído.

## 6. Ventaja competitiva
Mecanismos concretos, evidencia de retornos persistentes, duración, erosión y vínculo con ROIC o ROE terminal. Distinguir retorno histórico contable y retorno futuro.

## 7. Competencia
Competidores declarados, sustitutos y alternativas del cliente. Tabla comparable con métricas y períodos congruentes, sin usar sus estados como datos del objetivo.

## 8. Gestión y asignación de capital
### Equipo, gobierno e incentivos
Controlador, derechos por clase, gobierno, incentivos, vinculadas, transparencia y trato al minoritario.
### Asignación de capital
Inversión, compras/ventas, deuda, recompra y dividendos; valorar resultado por acción y restricciones de distribución.

## 9. Catalizadores
Tabla con evento, mecanismo, plazo, evidencia y señales de fracaso; no llamar catalizador a una opinión sin evento.

## 10. Riesgos
Tabla con exposición, probabilidad razonada, impacto, mitigación y señales. Incluir país, regulación, deuda y divisas solo según materialidad; evitar doble conteo en los supuestos.
### Escenarios cualitativos de largo plazo
Base, Conservadora, Optimista y Disrupción con mecanismos observables.
### FODA de síntesis
Fortalezas/debilidades y oportunidades/amenazas específicas.

## 11. Bulls say / Bears say
Argumentos favorables y contrarios fuertes, con evidencia y lo que los invalidaría.
### Conclusión cualitativa
Juicio proporcionado y límites.
### Síntesis final
Integrar calidad, ventaja, incertidumbre central, cuatro historias y señales observables.

## 12. Valor con criterio Damodaran
### La historia en un párrafo
Qué se compra y cómo genera valor.
### Visión externa: tasas base
Comparaciones económicas con muestra pertinente, tamaño y madurez; no trasladar tasas base de otro sector/mercado sin justificar.
### Piezas del valor
Explicar crecimiento, margen/ROE, reinversión/capital requerido, tasas y terminal, o valor de participadas y matriz.
### Historias cuantificadas y valor esperado
Base primero, cuatro historias, supuestos, probabilidades y resultados provenientes de la valoración separada. Si faltan resultados, marcar pendientes. Mostrar sensibilidad y explicar coherencia, no solo cifras.
### Pre-mortem
Cómo puede fallar la tesis y qué señalaría deterioro fundamental.
### Indicadores y actualización de probabilidades
Señales, umbrales sustentados y frecuencia de revisión.
### El precio al final
Fecha, clase, cotización, comparación con valor Base y esperado; ambos horizontes de múltiplos en tablas, sin confundir margen de seguridad con potencial. DCF inverso solo si fue calculado correctamente.
### Registro de decisión
Historia, incertidumbre, señales que cambiarían juicio y revisión. La decisión de cartera pertenece al usuario.

## 13. Filosofías de inversión
### Warren Buffett
Calidad, ventaja y retorno sobre reinversión.
### Charlie Munger
Incentivos, sesgos e inversión del problema.
### Peter Lynch
Negocio, crecimiento y precio relativo razonable.
### Howard Marks
Ciclo, riesgo, deuda y negociación.
### Joel Greenblatt
Rentabilidad y precio, con ajustes sectoriales.
Para cada filosofía: párrafo distinto, veredicto proporcionado, evidencias, objeción y pregunta pendiente. No inventar qué haría una persona con esta acción.

## 14. Noticias y eventos recientes
Revisar comunicaciones oficiales e información relevante entre el último reporte y el corte; priorizar los últimos 90 días. Fecha del evento distinta de fecha de publicación, efecto en historia y fuente.

## 15. Qué vigilar
Tabla con variable, razón, señal favorable/adversa y próxima fuente. Vincular con supuestos de escenarios.

## 16. Preguntas abiertas
Cuestiones materiales sin resolver y cómo obtener evidencia.

## 17. Fuentes
### Fuentes primarias
Documentos consultados con enlaces y fechas.
### Fuentes secundarias y sectoriales
Separadas por utilidad; ninguna fuente no consultada.

## 18. Control de calidad final
Tabla Sí/No con identidad, aislamiento, moneda, períodos, fuente primaria, derechos, fuentes de tasas, modelo pertinente, terminal, reinversión, puente, dos horizontes, pesos y coherencia narrativa. Sí solo si verificado. Comprobar exactamente los 18 títulos, Porter de cinco filas y Síntesis final.

Entrega [TICKER]_Research_Fundamental_JMR_Colombia_[FECHA].md con metadatos e índice. Antes de publicar pregunta al usuario.
