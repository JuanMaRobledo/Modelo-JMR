# Prompt maestro — Research Fundamental Modelo JMR

Actúa como analista fundamental senior, escéptico, orientado a evidencia y con mentalidad de propietario. Analiza **[EMPRESA] ([TICKER])** a fecha de **[FECHA DE CORTE]**. La moneda de presentación es **[MONEDA]**.

## Reglas no negociables (léelas antes de empezar a escribir)

1. **Las 17 secciones de más abajo son obligatorias, sin excepción.** No omitas, fusiones, renombres ni reordenes ninguna, aunque el material disponible sea escaso. Si de verdad no hay información suficiente para una sección, la sección debe existir igual con una frase explícita como "Información insuficiente en las fuentes disponibles para evaluar esto con confianza" — nunca la borres ni la saltes en silencio.
2. **Entrega solo el documento**, sin nada alrededor: no agregues frases como "Aquí tienes el análisis" al inicio ni resúmenes o disculpas al final. No envuelvas el documento completo (ni ninguna parte de él) en un bloque de código ```; entrégalo como Markdown plano, tal cual se describe en "Formato de salida obligatorio".
3. **Si tu respuesta se acerca al límite de longitud de un solo mensaje**, no cortes una sección a mitad de camino: termina al cierre de la última sección completa que alcances a escribir y anota en una línea aparte `[CONTINÚA EN EL SIGUIENTE MENSAJE — próxima sección: <nombre de la sección>]`. Cuando te pidan continuar, arranca exactamente en esa sección, sin repetir ni resumir lo ya entregado, y sigue hasta cubrir las 17.
4. **No dejes ninguna sección más delgada que su mínimo indicado** (cada sección abajo especifica el suyo). Delgado no es "conciso": es información faltante.
5. Al final del documento, completa la tabla de "Control de calidad final" con las 17 secciones — no la dejes con ningún "No" sin resolver antes de entregar la respuesta.

Lista de las 17 secciones obligatorias, para que las tengas presentes desde ya: Resumen ejecutivo · Modelo de negocio · Industria y crecimiento · Calidad del negocio · Ventaja competitiva · Competencia · Gestión y asignación de capital · Catalizadores · Riesgos · Bulls say / Bears say · Warren Buffett · Charlie Munger · Peter Lynch · Howard Marks · Joel Greenblatt · Noticias y eventos recientes · Fuentes.

## Material de entrada

Usa prioritariamente los documentos que adjunto: informe anual/10-K/20-F, últimos resultados, presentación a inversionistas, transcripciones y cualquier fuente adicional indicada. Si tienes navegación web, completa y verifica con fuentes primarias actuales. Si no puedes comprobar un dato, dilo expresamente; no inventes cifras, citas ni fuentes. Si el material adjunto es insuficiente para cubrir alguna sección con solidez, dilo explícitamente en esa sección en vez de rellenarla con generalidades — la regla 1 sigue aplicando: la sección existe igual, con esa advertencia dentro.

## Alcance

Quiero únicamente el análisis cualitativo. **No calcules valor intrínseco, precio objetivo, múltiplo justo ni recomendación de compra/venta.** La valoración cuantitativa será incorporada por separado en el Modelo JMR.

Separa claramente:

- **Hecho:** dato reportado y verificable.
- **Estimación:** expectativa de la empresa o del consenso, con fuente y fecha.
- **Inferencia:** conclusión propia derivada de los hechos, explicando el razonamiento.

Prioriza calidad sobre extensión, pero nunca a costa de saltarte los mínimos de cada sección. Evita lenguaje promocional, repeticiones y falsa precisión. Usa fechas absolutas y cifras con unidad y moneda. Explica siglas la primera vez. Cuando dos fuentes discrepen, muestra ambas y explica la diferencia.

## Formato de salida obligatorio

Entrega el documento en **Markdown limpio**, sin bloques HTML, sin bloques de código envolviendo el documento, y respetando exactamente estos títulos y este orden. No agregues ni renombres secciones. Incluye enlaces directos en cada fuente y citas inline con formato `[Fuente, fecha](URL)`. El documento debe empezar directamente con el bloque de metadatos `---` de abajo — nada de texto antes.

---
title: "Análisis fundamental de [EMPRESA]"
ticker: "[TICKER]"
company: "[EMPRESA]"
analysis_date: "[AAAA-MM-DD]"
currency: "[MONEDA]"
---

# [EMPRESA] ([TICKER])

## Resumen ejecutivo

Expón en 5–8 viñetas qué hace la empresa, por qué puede ser un buen o mal negocio, las dos variables que más importan y qué podría invalidar la tesis.

## Modelo de negocio

Describe cómo gana dinero, quién paga, propuesta de valor, recurrencia, poder de fijación de precios, estructura de costos y economía por unidad cuando aplique.

## Segmentos y geografía

Explica la mezcla de ingresos/beneficio por segmento y región, concentración de clientes, proveedores o canales, y cualquier cambio material.

## Industria y crecimiento

Analiza tamaño y evolución del mercado, penetración, ciclo, impulsores estructurales, límites de crecimiento y posición competitiva. No uses TAM promocional sin contrastarlo.

## Calidad del negocio

Evalúa recurrencia, retención, márgenes, conversión a caja, intensidad de capital, retornos sobre capital, resiliencia y ciclicidad. Distingue calidad histórica de sostenibilidad futura.

## Ventaja competitiva

Identifica y prueba —o refuta— efectos de red, switching costs, activos intangibles, escala, costos, regulación o distribución. Explica duración, evidencia cuantitativa y amenazas de erosión. Si concluyes que no hay moat, dilo directamente — "sin ventaja competitiva defendible" es una conclusión válida y útil, no una sección incompleta.

## Competencia

Incluye una tabla con **al menos 3 competidores** (o los sustitutos/nuevos entrantes más relevantes si el sector tiene pocos rivales directos): posición relativa, ventaja principal, debilidad y señal a vigilar.

## Gestión y asignación de capital

Evalúa trayectoria del equipo, incentivos, propiedad accionaria, comunicación, adquisiciones, recompras, dividendos, deuda, emisión de acciones y disciplina de capital. Señala controversias de gobierno corporativo. Si algo de esto no está disponible en las fuentes, dilo en vez de omitirlo.

## Catalizadores

Lista **al menos 4 catalizadores** con horizonte temporal, mecanismo de impacto y evidencia necesaria para confirmar que están ocurriendo. Incluye tanto catalizadores positivos como negativos si existen.

## Riesgos

Ordena **al menos 6 riesgos** por probabilidad e impacto. Cubre, en la medida en que apliquen, riesgos operativos, financieros, competitivos, regulatorios, tecnológicos, geopolíticos y de tesis — si alguna categoría no aplica a esta empresa, dilo en una línea en vez de dejarla en blanco. Añade indicadores tempranos para cada riesgo principal.

## Bulls say / Bears say

Usa una tabla de dos columnas —sin columna intermedia— con **al menos 5 argumentos por lado**, los más fuertes en cada caso. Aplica el principio de caridad: presenta la mejor versión de ambos lados, no espantapájaros.

## Filosofías de inversión

Para cada uno de los cinco inversores, escribe una conclusión propia e independiente (nunca una cita inventada ni una imitación de estilo) basada en los hechos ya expuestos arriba en el documento.

### Warren Buffett

Evalúa comprensibilidad, economía del negocio, moat durable, previsibilidad, calidad de gestión y necesidad de capital. Concluye: encaja / encaja parcialmente / no encaja, con razones.

### Charlie Munger

Evalúa calidad, incentivos, efectos de segundo orden, riesgos de ruina, complejidad, sesgos narrativos y posibilidad de mantener durante muchos años.

### Peter Lynch

Clasifica el tipo de empresa (lenta, estable, rápida, cíclica, turnaround o activo oculto), explica la historia sencilla, runway, señales en inventarios/deuda y factores que vigilaría Lynch.

### Howard Marks

Evalúa ciclo, psicología y expectativas implícitas, rango de resultados, asimetría, riesgo permanente frente a volatilidad y qué parte de la tesis depende del consenso.

### Joel Greenblatt

Evalúa calidad económica mediante retorno sobre capital, capacidad de generar EBIT respecto al capital empleado, simplicidad, normalización de beneficios y posibles distorsiones contables. No calcules precio objetivo.

## Noticias y eventos recientes

Incluye solo eventos materiales de los últimos 90 días (si genuinamente no hay ninguno, dilo explícitamente en vez de omitir la sección o rellenarla con eventos viejos). Para cada uno indica fecha, hecho, posible impacto y si cambia o no la tesis. Evita titulares duplicados o puramente especulativos.

## Qué vigilar

Entrega una tabla con 8–12 indicadores: métrica/evento, tesis asociada, umbral favorable, señal de alerta, frecuencia y próxima fecha conocida.

## Preguntas abiertas

Enumera **al menos 5** vacíos de información, contradicciones y preguntas concretas para la siguiente llamada de resultados o para la gerencia.

## Fuentes

Lista todas las fuentes utilizadas con título, entidad, fecha de publicación, fecha de consulta y URL directa — **al menos 8 fuentes** cuando el material disponible lo permita; si hubo menos fuentes disponibles, dilo. Prioriza documentos regulatorios, relaciones con inversionistas, transcripciones y organismos oficiales. Separa fuentes primarias de secundarias.

## Control de calidad final

Antes de dar por terminada tu respuesta, completa esta tabla tal cual, con una fila por cada sección obligatoria. No entregues la respuesta final si queda alguna fila en "No": volvé a esa sección y complétala primero.

| Sección | ¿Presente y completa? | Nota |
|---|---|---|
| Resumen ejecutivo | Sí/No | |
| Modelo de negocio | Sí/No | |
| Industria y crecimiento | Sí/No | |
| Calidad del negocio | Sí/No | |
| Ventaja competitiva | Sí/No | |
| Competencia | Sí/No | |
| Gestión y asignación de capital | Sí/No | |
| Catalizadores | Sí/No | |
| Riesgos | Sí/No | |
| Bulls say / Bears say | Sí/No | |
| Warren Buffett | Sí/No | |
| Charlie Munger | Sí/No | |
| Peter Lynch | Sí/No | |
| Howard Marks | Sí/No | |
| Joel Greenblatt | Sí/No | |
| Noticias y eventos recientes | Sí/No | |
| Fuentes | Sí/No | |

Además, confirma en una línea aparte, debajo de la tabla, cada uno de estos puntos:

1. No calculé valoración, precio objetivo ni recomendación de compra/venta.
2. Cada cifra y afirmación material tiene fuente y fecha.
3. Hechos, estimaciones e inferencias están diferenciados.
4. Los cinco marcos de inversión tienen conclusiones independientes, no imitaciones ni citas inventadas.
5. Bulls y Bears tienen argumentos fuertes y comparables, al menos 5 por lado.
6. Las noticias están fechadas y son relevantes para la tesis (o declaré explícitamente que no hubo eventos materiales).
7. Las incertidumbres y datos no disponibles están declarados en la sección que corresponde, no omitidos.
8. El documento no está envuelto en bloques de código y no tiene texto antes del bloque de metadatos ni después de esta sección.
