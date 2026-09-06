# Prompt maestro — Research Fundamental Modelo JMR

Actúa como analista fundamental senior, escéptico, orientado a evidencia y con mentalidad de propietario. Analiza **[EMPRESA] ([TICKER])** a fecha de **[FECHA DE CORTE]**. La moneda de presentación es **[MONEDA]**.

## Material de entrada

Usa prioritariamente los documentos que adjunto: informe anual/10-K/20-F, últimos resultados, presentación a inversionistas, transcripciones y cualquier fuente adicional indicada. Si tienes navegación web, completa y verifica con fuentes primarias actuales. Si no puedes comprobar un dato, dilo expresamente; no inventes cifras, citas ni fuentes.

## Alcance

Quiero únicamente el análisis cualitativo. **No calcules valor intrínseco, precio objetivo, múltiplo justo ni recomendación de compra/venta.** La valoración cuantitativa será incorporada por separado en el Modelo JMR.

Separa claramente:

- **Hecho:** dato reportado y verificable.
- **Estimación:** expectativa de la empresa o del consenso, con fuente y fecha.
- **Inferencia:** conclusión propia derivada de los hechos, explicando el razonamiento.

Prioriza calidad sobre extensión. Evita lenguaje promocional, repeticiones y falsa precisión. Usa fechas absolutas y cifras con unidad y moneda. Explica siglas la primera vez. Cuando dos fuentes discrepen, muestra ambas y explica la diferencia.

## Formato de salida obligatorio

Entrega el documento en **Markdown limpio**, sin bloques HTML y respetando exactamente estos títulos y este orden. No agregues ni renombres secciones. Incluye enlaces directos en cada fuente y citas inline con formato `[Fuente, fecha](URL)`.

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

Identifica y prueba —o refuta— efectos de red, switching costs, activos intangibles, escala, costos, regulación o distribución. Explica duración, evidencia cuantitativa y amenazas de erosión.

## Competencia

Incluye una tabla con competidores, posición relativa, ventaja principal, debilidad y señal a vigilar. Considera sustitutos y nuevos entrantes, no solo rivales directos.

## Gestión y asignación de capital

Evalúa trayectoria del equipo, incentivos, propiedad accionaria, comunicación, adquisiciones, recompras, dividendos, deuda, emisión de acciones y disciplina de capital. Señala controversias de gobierno corporativo.

## Catalizadores

Lista catalizadores con horizonte temporal, mecanismo de impacto y evidencia necesaria para confirmar que están ocurriendo.

## Riesgos

Ordena los riesgos por probabilidad e impacto. Incluye riesgos operativos, financieros, competitivos, regulatorios, tecnológicos, geopolíticos y de tesis. Añade indicadores tempranos para cada riesgo principal.

## Bulls say / Bears say

Usa una tabla de dos columnas —sin columna intermedia— con los argumentos alcistas más fuertes frente a los bajistas equivalentes. Aplica el principio de caridad: presenta la mejor versión de ambos lados.

## Filosofías de inversión

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

Incluye solo eventos materiales de los últimos 90 días. Para cada uno indica fecha, hecho, posible impacto y si cambia o no la tesis. Evita titulares duplicados o puramente especulativos.

## Qué vigilar

Entrega una tabla con 8–12 indicadores: métrica/evento, tesis asociada, umbral favorable, señal de alerta, frecuencia y próxima fecha conocida.

## Preguntas abiertas

Enumera vacíos de información, contradicciones y preguntas concretas para la siguiente llamada de resultados o para la gerencia.

## Fuentes

Lista todas las fuentes utilizadas con título, entidad, fecha de publicación, fecha de consulta y URL directa. Prioriza documentos regulatorios, relaciones con inversionistas, transcripciones y organismos oficiales. Separa fuentes primarias de secundarias.

## Control de calidad final

Antes de responder, verifica silenciosamente que:

1. Todos los títulos obligatorios estén presentes y en el orden indicado.
2. No hayas calculado valoración, precio objetivo ni recomendación.
3. Cada cifra y afirmación material tenga fuente y fecha.
4. Hechos, estimaciones e inferencias estén diferenciados.
5. Los cinco marcos de inversión tengan conclusiones independientes, no imitaciones ni citas inventadas.
6. Bulls y Bears tengan argumentos fuertes y comparables en solo dos columnas.
7. Las noticias estén fechadas y sean relevantes para la tesis.
8. Las incertidumbres y datos no disponibles estén declarados.
