# Contrato editorial del análisis fundamental JMR — dos niveles

**Fecha: 29-oct-2026.** Esta especificación desarrolla `modelo/REGLAS_VIGENTES.md` §9 y el prompt
`docs/prompts/research-fundamental-jmr-v5.md`. No cambia fórmulas, historias, valores,
métodos A/B, plantillas, estados de publicación ni el calendario de auditoría.

## Intención y modelo de referencia

Restituir en **todos los estudios actuales y futuros** el análisis editorial largo originalmente pactado,
con la estructura del expediente META (18 capítulos canónicos), similar en profundidad de negocios y
tesis a AZ Stocks. Conservar los análisis recientes de inversión, reinversión, ROIC, margen, Sales-to-Capital,
IA, I+D, flujos, cotización y métodos AZ Stocks, pero distribuirlos dentro de la estructura original.
No sustituir capítulos por 18 títulos arbitrarios de ingeniería financiera.

## Nivel 1 — Artículo de análisis integral

Tarjeta inicial **«Valor intrínseco base:»** con método principal, moneda, fecha de corte,
precio de mercado fechado, comparación del precio con el valor y con el nivel de compra
con **MOS 35 %**, y las cuatro historias separando Disrupción del promedio ordinario.
Indicar el denominador de cada variación: potencial desde el precio actual
`(V−P)/P`, prima de mercado sobre valor `(P−V)/V`, y MOS `V×0,65`.
No mezclar valores de distintas revisiones, fuentes ni cortes.

Tras la tarjeta, **un índice navegable** y los siguientes 18 capítulos, exactamente en este orden
(numeración y nombres canónicos):

1. Resumen ejecutivo.
2. Modelo de negocio.
3. Segmentos y geografía.
4. Industria y crecimiento.
5. Calidad del negocio.
6. Ventaja competitiva.
7. Competencia.
8. Gestión y asignación de capital.
9. Catalizadores.
10. Riesgos.
11. Bulls say / Bears say.
12. Valor con criterio Damodaran.
13. Filosofías de inversión.
14. Noticias y eventos recientes.
15. Qué vigilar.
16. Preguntas abiertas.
17. Fuentes.
18. Control de calidad final.

Desarrollar subsecciones extensas y pertinentes dentro de estas 18 secciones. El índice presenta
los capítulos como entradas principales y sus subsecciones en un subíndice desplegable,
con anclas válidas; los complementos genuinamente posteriores se presentan como anexos no
numerados, no como reemplazos del índice principal.

**Ubicación de ampliaciones actuales:**
- Modelo de monetización, economía unitaria, métricas de plataformas y contratos: §§2–3.
- Mercado, competencia, Porter, cuota y moat: §§4, 6–7.
- Evolución histórica 3/5/10 años/LTM, margen GAAP y ajustado, balance, retorno y flujo libre: §5.
- Calidad del gobierno, adquisiciones, recompras, SBC, asignación de caja y eficiencia del CapEx: §8.
- Catalizadores y riesgos de IA, inversión, regulación, competencia, ruptura tecnológica: §§9–11.
- Crecimiento, margen, tasa fiscal, reinversión, capitalización de I+D, arrendamientos, S/C,
  ROIC actual/incremental/terminal, WACC/Ke, horizonte, disrupción, DCF inverso,
  múltiples, valoración AZ Stocks independiente y sensibilidad **interpretados económicamente**: §12.
- Cinco filosofías, noticias fechadas, indicadores y preguntas refutables: §§13–16.
- Bibliografía trazable: §17; verificación de cobertura y pendientes concretos: §18.

**Un artículo no está completo** por tener 18 números, por contar palabras ni por contener
una tabla financiera; exige hechos y fechas, mecanismo económico, razonamiento específico de
la empresa, evidencia contraria y límites identificados. Las tablas explicativas que aportan a
la tesis pueden permanecer en el artículo: no eliminarlas para simplificar la lectura.
El nivel 1 debe comprenderse sin abrir el nivel 2. Al lado de cada cifra material puede
existir un enlace «Ver cálculo», nunca como sustituto del razonamiento.

## Nivel 2 — Respaldo cuantitativo reproducible

Índice independiente, colapsable, ordenado por: procedencia y cortes; estados financieros;
ratios e históricos; parámetros de entrada y supuestos de los métodos A/B según revisión;
Costo de capital; cálculos DCF/FCFE/SOTP y puente EV→equity; escenarios y dilución;
DCF inverso; matrices de sensibilidad **solo del Base**; valoración por múltiplos con
comparación a los valores calculados y de mercado; conciliaciones, hojas, fórmulas,
fuentes y validaciones. Ninguna simulación de la calculadora reemplaza la valoración oficial.

Cada cálculo enlazable del Nivel 1 debe identificar su sección del Nivel 2 y la
misma revisión de la hoja/JSON. Hasta dos decimales visibles sin perder precisión de fórmulas.

## Operación de la app y migración editorial

- `research.html` y `expediente.html` exhiben la misma ficha por ticker; Nivel 1 abierto y
  completo y Nivel 2 dentro de un desplegable separado.
- La tabla de contenido se genera desde encabezados reales, con capítulos `h2` y
  subsecciones `h3`, evitando decenas de entradas en una lista plana.
- Si `articleHtml` y `calculationHtml` ya están separados, **no borrar del
  artículo** sus tablas económicas, argumentos ni anexos editoriales por un filtro
  automático de números.
- El control superficial de estructura exige los 18 **nombres exactos y en
  secuencia**. Una secuencia 1–18 con nombres distintos, como las estructuras
  temporales orientadas por cálculo, se marca «restauración editorial pendiente».
  Ni este control ni el éxito de pruebas técnicas certifican profundidad.
- Para actualizar expedientes existentes: preservar la última versión completa,
  reubicar y ampliar material de informes recientes sin perder citas ni cifras;
  conciliar contra la revisión actual, no cambiar la valoración; publicar como
  nueva revisión editorial únicamente tras verificar cobertura.
- No hacer auditoría económica por editar el formato. Proceso: valoración y
  análisis como EN_REVISION, auditoría visual del usuario, después auditoría
  económica independiente cuando se solicite.

**Referencia de contenido:** `Modelo-JMR-datos/analisis/META-research-20261025-r5.json`.
El informe META es patrón estructural, **no** fuente de cifras ni supuestos de otras empresas.
