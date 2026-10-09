# JMR Colombia · Reglas independientes v1
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

# JMR Colombia · Valoración independiente v1
Usa el expediente y las reglas Colombia de este archivo. No llames al pipeline de EEUU. El objetivo es calcular valor intrínseco propio del emisor, con datos conciliados, supuestos defendibles y un método apropiado.

## Flujo obligatorio
1. Fijar identidad del expediente y clase. Verificar derechos y operaciones societarias vigentes al corte.
2. Elegir y documentar rama del modelo. Partir de copia limpia de su maestra; si no existe, detener la parte de cálculo correspondiente e informar el bloqueo.
3. Conciliar historia y LTM con estados oficiales; leer notas e información relevante. Vincular datos con fuentes y mostrar ajustes; los campos vacíos no se convierten en cero.
4. Escribir historia y visión externa ANTES de mirar el precio: tasas base, tamaño, crecimiento por volumen/precio/mezcla, orgánico/comprado; margen normalizado y reinversión necesaria.
5. Estimar costo de capital en la moneda correcta y con exposición geográfica documentada. No usar el TES sin ajuste, ni impuestos o primas de otra empresa.
6. Desarrollar cuatro historias coherentes con crecimiento, margen/ROE, capital y tasas. Justificar probabilidades. Base es principal. En deterioro persistente considerar vida finita/liquidación cuando corresponda.
7. Calcular valor intrínseco. Operativa: FCFF = EBIT(1-t)+D&A-capex-ΔNWC, con ajustes coherentes. Terminal: reinversión=g/ROIC; FCFF del año siguiente y WACC>g. Financiera: FCFE/capital o exceso de retornos, con ROE, Ke y capital requerido. Holding: valor de participadas atribuible más caja/no operativos menos obligaciones de matriz y costos corporativos valorados; no duplicar deuda ni flujos.
8. Construir puente a patrimonio atribuible por clase: deuda, caja disponible, minoritarios, otras reclamaciones, autocartera y dilución. No usar marketCap de agregador sin conciliación.
9. Elegir múltiplos INDEPENDIENTES con historia depurada, peers comparables y fundamentos. Bancos: P/B, P/TBV y P/E cuando tengan sentido; no imponer EV/EBITDA o FCFF. Aplicar pesos vigentes pertinentes, sin inventar los faltantes. Cambiar pesos requiere dejar registro.
10. Mostrar múltiplos individuales y ponderados hoy y FY+3, junto a combinado secundario cuando haya pesos/cifras. Precio de patrimonio y dividendos se descuentan con Ke. No mezclar DCF presente y precios futuros.
11. Sensibilidad económica: crecimiento, margen/ROE, tasas, capital, terminal y supuestos específicos del negocio. Evitar escenarios que cambian tasas sin evidencia de cambio de riesgo.
12. Solo al final consultar/mostrar precio para comparación y valoración inversa, manteniendo el precio congelado del análisis separado del último consultado. El JSON de datos puede traer cotización, pero no debe anclar selección de supuestos.
13. Auditar fórmulas y correspondencia económica, independencia de múltiplos, período, fuentes, derechos y terminal. Mostrar alcance realmente verificado y pendientes.
14. Guardar entregables en el expediente Colombia, sin publicación automática; preguntar al usuario si autoriza subirlos a la app.

## Entregable de 14 secciones, en este orden
1. Resumen: valor intrínseco Base y otras historias, esperado complementario, múltiplos secundarios; sin precio de mercado.
2. Historia y visión externa: tesis, posible/plausible/probable, tasas base, crecimiento, rentabilidad y capital.
3. Datos: identidad, plantilla/ID, fuentes, períodos, moneda, conciliaciones y cobertura.
4. Supuestos y tasas: tabla con valores, celdas, origen, justificación, contraevidencia y dato pendiente. Desarrollo en párrafos de cada supuesto material.
5. Historias y probabilidades: cuatro historias, Base primero, resultados, mecanismo económico, pre-mortem e indicadores.
6. Múltiplos: tabla de tres anclas por método y explicación de independencia; métodos excluidos justificados.
7. Resultados: valor intrínseco y puente por clase; DOS tablas de métodos, ponderado de múltiplos y combinado, presente y FY+3. Pesos, Ke, dividendos y unidades.
8. Valor intrínseco frente a múltiplos: explicar diferencias y confianza relativa, sin forzar coincidencia.
9. Sensibilidad: tasas y terminal, crecimiento/rentabilidad, reinversión/capital, moneda y otros factores materiales.
10. Log de cambios: dato/fórmula antes/después, motivo y evidencia; no ocultar arreglos.
11. El precio al final: cotización del análisis y actual con fecha/clase, margen de seguridad, potencial y expectativas implícitas; restricciones de negociación.
12. Registro de decisión: incertidumbre, condiciones para cambiar opinión, fecha de revisión; sin decidir compras/ventas por el usuario.
13. Fuentes: documentos realmente leídos, con enlaces directos y fecha.
14. Control de calidad: Sí/No solo con verificación, AISLAMIENTO=OK, método, moneda, derechos, períodos, terminal y ambos horizontes.

Entrega [TICKER]_Valoracion_JMR_Colombia_[FECHA].md con metadatos e índice; workbook o hoja independiente de la rama adecuada y resultados reproducibles. No declares éxito de una escritura no verificada. No llames valor intrínseco a una SOTP que solo agrega precios de mercado, ni DCF industrial a una valoración bancaria.
