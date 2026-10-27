# Proceso único JMR — contrato de ejecución independiente de la IA

**Objetivo:** usar la misma valoración, análisis y auditoría en ChatGPT (chat o Work), Claude Code, Gemini o herramientas equivalentes. **No es un método financiero nuevo**, ni sustituye las reglas vigentes ni los tres prompts.

## Una instrucción para cualquier herramienta

> Valora, analiza y audita **<TICKER>** siguiendo el proceso oficial JMR. Lee `Modelo-JMR/modelo/REGLAS_VIGENTES.md` y los tres prompts vigentes; trabaja sobre la **hoja oficial de esa empresa** o crea una copia nueva de la maestra cuando se trate de una valoración nueva. Conserva fórmulas y selectores, justifica todas las entradas, realiza los controles y entrega valoración, análisis fundamental completo y auditoría **de la misma revisión**. **No publiques** antes de disponer de autorización y de comprobar los controles.

Esa instrucción funciona **solo si el entorno tiene acceso a los repositorios, datos, hojas y herramientas necesarias**. El nombre «JMR» por sí solo no permite a una IA externa conocer el proceso. Si falta conexión, autorización o capacidad de ejecutar un control, se reporta como tal; nunca se afirma que se ejecutó.

## Fuentes en orden de autoridad

1. **Método oficial:** [`modelo/REGLAS_VIGENTES.md`](../modelo/REGLAS_VIGENTES.md). Es la única fuente de verdad para reglas financieras, supuestos, fórmulas, estados, escenarios y publicación.
2. **Tres tareas separadas:** [Valoración](prompts/valoracion-modelo-jmr-v5.md), [Análisis fundamental](prompts/research-fundamental-jmr-v5.md) y [Auditoría económica](prompts/auditoria-economica-jmr-v1.md). Remiten a las reglas vigentes y no las sobreescriben.
3. **Plantillas, cálculos y controles:** repositorio `JuanMaRobledo/JMR-valuation`, `reference/plantillas.json` y scripts del motor; las fórmulas de Google Sheets calculan los resultados.
4. **Datos, estudio y revisiones:** `JuanMaRobledo/Modelo-JMR-datos`, `catalogo.json`, `valoraciones/`, `analisis/`, `auditorias/` y expediente por empresa en la aplicación. Un archivo existente fuera del catálogo no significa por sí solo que esté validado.

## Secuencia obligatoria, sin trabajo duplicado

1. **Resolver identidad:** ticker, corte de información, moneda, revisión, `sheet_id`, ruta de valoración y rutas de análisis/auditoría. Consultar el registro vigente; no elegir versiones por antigüedad de un título.
2. **Elegir operación:** **recuperar** (reunir última hoja/revisión, sin recalcular por defecto); **actualizar** (solo nueva evidencia/entradas y sus impactos); o **valorar desde cero** (copia nueva de plantilla, nunca reutilización silenciosa). No mezclar las tres sin documentar la razón.
3. **Valoración:** evidencia primaria, hasta 10 años + LTM donde esté disponible, supuestos con fuentes, cuatro historias, DCF/FCFE/SOTP según negocio, siete múltiplos calculados, sensibilidades e inverso exigibles. La IA obtiene datos crudos y estima supuestos; **la hoja realiza los cálculos**. No alterar fórmulas, pestañas, selectores ni escribir precios objetivos sobre resultados calculados.
4. **Análisis fundamental:** desarrollar las 18 secciones y los dos niveles definidos en las reglas, usando cifras de **esa valoración**, sin recalcularlas ni sustituir el artículo completo por una nota breve.
5. **Auditoría:** revisar evidencia, entradas, supuestos, razonabilidad económica, fórmulas, materialidad y coherencia entre hoja, valor y artículo. Distinguir VERIFICADO, VERIFICADO CON RESERVA MATERIAL y PENDIENTE; reportar pruebas ejecutadas y no ejecutadas.
6. **Puerta técnica:** para una valoración nueva usar, desde `JMR-valuation`, `bash scripts/valorar.sh <TICKER> <ID_COPIA_NUEVA> "<PARES>" "<INDUSTRIA>"`. Sin el quinto argumento el script prepara y controla, **no publica**. Cuando corresponda, comprobar `bash scripts/controles_todas.sh <TICKER>` y la integridad/unificación de hoja según las reglas. Los controles que requieran credenciales o ejecución externa no pueden sustituirse por apreciaciones de la IA.
7. **Publicación:** tras autorización, usar los mecanismos oficiales, confirmar la escritura en la hoja y la actualización de las **tres piezas alineadas con la misma revisión** en el catálogo de datos y en la app. Verificar que la aplicación realmente lee la revisión prevista. Archivar las sustituidas sin borrar el historial.

## Tres estados distintos, nunca confundidos

- **Cambios preparados:** propuestas de entradas, todavía no guardadas en Google Sheets.
- **Cambios en hoja confirmados:** `PATCH /api/model` autorizado, cotejo de valores de retorno, recálculo propio de Google Sheets. **No equivale a estudio publicado**.
- **Estudio publicado:** valoración, análisis y auditoría vinculados a la revisión y disponibles en el catálogo/app después de controles. **No equivale a dictamen VERIFICADO** si la auditoría contiene reservas materiales o está pendiente.

En la aplicación, `editor-hoja.html?ticker=<T>` modifica celdas permitidas si hay sesión y permisos; `visor.html` / «Recalcular» realiza hipótesis locales, sin editar la hoja. `expediente.html?ticker=<T>` reúne Valoración, Análisis fundamental, Supuestos, Auditoría y Sensibilidades usando las páginas oficiales existentes.

## Salida y entrega entre agentes

Cada IA debe dejar el mismo resumen estructurado: **ticker, operación, corte, revisión, `sheet_id`, enlaces de las tres piezas, estado de los controles, faltantes materiales, qué se modificó y estado de publicación (NO PUBLICADO/PUBLICADO)**. No reiniciar un trabajo ya completado; retomar desde el primer paso realmente pendiente y distinguir hecho verificado de intención.

**Esta guía no cambia el método, las ponderaciones, los resultados ni las fórmulas.** Cualquier cambio metodológico se hace únicamente en `REGLAS_VIGENTES.md`, con revisión y pruebas.
