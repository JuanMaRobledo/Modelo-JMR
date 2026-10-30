# Proceso único JMR — contrato de ejecución independiente de la IA

**Objetivo:** usar la misma valoración, análisis y auditoría en ChatGPT (chat o Work), Claude Code, Gemini o herramientas equivalentes. **No es un método financiero nuevo**, ni sustituye las reglas vigentes ni los tres prompts.

## Selección previa del método

Para cada revisión nueva consignar expresamente `Método A` (calibración por drivers y base rates) o `Método B` (JMR tradicional). Documento selector: [`modelo/METODOS_VALORACION.md`](../modelo/METODOS_VALORACION.md). A y B comparten el motor y los controles. Las revisiones antiguas sin etiqueta se leen como B sin modificarlas. **El selector de la app y el ejecutor no están adaptados todavía:** esta elección es normativa/documental hasta su integración técnica y regresión.

## Una instrucción para cualquier herramienta

> Valora y analiza **<TICKER>** con **Método <A|B>**, según el selector normativo `modelo/METODOS_VALORACION.md`, siguiendo el proceso oficial JMR. Lee `modelo/REGLAS_VIGENTES.md` y los prompts vigentes. Utiliza la hoja oficial de la empresa o una copia nueva limpia de la plantilla. Conserva fórmulas, justifica entradas y completa los controles técnicos. Tras autorización, entrega valoración y análisis en un expediente preliminar **EN_REVISIÓN**. Cuando solicite auditoría, lee primero mis observaciones de esa revisión y realiza la auditoría económica independiente.

Esa instrucción funciona **solo si el entorno tiene acceso a los repositorios, datos, hojas y herramientas necesarias**. El nombre «JMR» por sí solo no permite a una IA externa conocer el proceso. Si falta conexión, autorización o capacidad de ejecutar un control, se reporta como tal; nunca se afirma que se ejecutó.

## Fuentes en orden de autoridad

1. **Contrato común y método elegido:** [`modelo/REGLAS_VIGENTES.md`](../modelo/REGLAS_VIGENTES.md) rige cálculos, estructura y publicación; [`modelo/METODOS_VALORACION.md`](../modelo/METODOS_VALORACION.md) define la selección y vincula Método A o Método B para estimar supuestos. Un prompt no prevalece sobre esos documentos.
2. **Tres tareas separadas:** [Valoración](prompts/valoracion-modelo-jmr-v5.md), [Análisis fundamental](prompts/research-fundamental-jmr-v5.md) y [Auditoría económica](prompts/auditoria-economica-jmr-v1.md). Remiten a las reglas vigentes y no las sobreescriben.
3. **Plantillas, cálculos y controles:** repositorio `JuanMaRobledo/JMR-valuation`, `reference/plantillas.json` y scripts del motor; las fórmulas de Google Sheets calculan los resultados.
4. **Datos, estudio y revisiones:** `JuanMaRobledo/Modelo-JMR-datos`, `catalogo.json`, `valoraciones/`, `analisis/`, `auditorias/` y expediente por empresa en la aplicación. Un archivo existente fuera del catálogo no significa por sí solo que esté validado.

## Secuencia obligatoria, sin trabajo duplicado

1. **Resolver identidad y método:** ticker, **A o B y su versión**, corte de información, moneda, revisión, `sheet_id`, ruta de valoración y rutas de análisis/auditoría. Consultar el registro vigente; no elegir versiones por antigüedad de un título.
2. **Elegir operación:** **recuperar** (reunir última hoja/revisión, sin recalcular por defecto); **actualizar** (solo nueva evidencia/entradas y sus impactos); o **valorar desde cero** (copia nueva de plantilla, nunca reutilización silenciosa). No mezclar las tres sin documentar la razón.
3. **Valoración:** aplicar las reglas de calibración A o B **sin mezclar supuestos** y registrar `metodo_valoracion`/`version_metodo` en el expediente; evidencia primaria, hasta 10 años + LTM donde esté disponible, supuestos con fuentes, cuatro historias, DCF/FCFE/SOTP según negocio, cinco múltiplos prioritarios evaluados y los aplicables calculados (P/S y P/BV solo opcionales), sensibilidades e inverso exigibles. La IA obtiene datos crudos y estima supuestos; **la hoja realiza los cálculos**. No alterar fórmulas, pestañas, selectores ni escribir precios objetivos sobre resultados calculados.
4. **Análisis fundamental:** desarrollar los 14 capítulos narrativos (con ciclos en capítulo independiente) del Estilo JMR y el Nivel 2 cuantitativo definidos en las reglas, usando cifras de **esa valoración**, sin recalcularlas ni sustituir el artículo completo por una nota breve.
5. **Revisión del usuario:** tras controles técnicos aprobados y autorización, publicar valoración + análisis como EN_REVISIÓN. Guardar opcionalmente las observaciones de la ficha en GitHub por ticker y revisión, sin modificarlas mientras el usuario escribe.
6. **Auditoría posterior:** cuando el usuario diga «Audita <TICKER>», resolver primero el archivo activo desde `catalogo.json`, leer `auditorias/solicitudes/<TICKER>/<REVISION_ID>.json` si existe, y comprobar esos puntos más los mínimos independientes de crecimiento, márgenes, ROIC, reinversión, WACC/Ke, valor terminal, DCF, múltiplos y materialidad. Dictaminar VERIFICADO, VERIFICADO CON RESERVA MATERIAL o PENDIENTE.
7. **Puerta técnica:** para una valoración nueva usar, desde `JMR-valuation`, `bash scripts/valorar.sh <TICKER> <ID_COPIA_NUEVA> "<PARES>" "<INDUSTRIA>"`. Sin el quinto argumento el script prepara y controla, **no publica**. Cuando corresponda, comprobar `bash scripts/controles_todas.sh <TICKER>` y la integridad/unificación de hoja según las reglas. Los controles que requieran credenciales o ejecución externa no pueden sustituirse por apreciaciones de la IA.
8. **Publicación:** tras autorización y controles, confirmar la escritura en la hoja y el par valoración + análisis alineados como EN_REVISIÓN en el catálogo y la app; una vez solicitada y efectuada la auditoría, adjuntar la tercera pieza de esa misma revisión. Archivar versiones anteriores sin borrar su historial.

## Tres estados distintos, nunca confundidos

- **Cambios preparados:** propuestas de entradas, todavía no guardadas en Google Sheets.
- **Cambios en hoja confirmados:** `PATCH /api/model` autorizado, cotejo de valores de retorno, recálculo propio de Google Sheets. **No equivale a estudio publicado**.
- **Expediente preliminar EN_REVISIÓN:** valoración y análisis de la misma revisión, visibles tras controles y autorización, sin dictamen económico independiente.
- **Expediente auditado:** las tres piezas pertenecen a la misma revisión; el dictamen es VERIFICADO, VERIFICADO CON RESERVA MATERIAL o PENDIENTE.

En la aplicación, `editor-hoja.html?ticker=<T>` modifica celdas permitidas si hay sesión y permisos; `visor.html` / «Recalcular» realiza hipótesis locales, sin editar la hoja. `expediente.html?ticker=<T>` reúne Valoración, Análisis fundamental, Supuestos, Auditoría y Sensibilidades usando las páginas oficiales existentes.

## Salida y entrega entre agentes

Cada IA debe dejar el mismo resumen estructurado: **ticker, operación, corte, revisión, `sheet_id`, enlaces de las tres piezas, estado de los controles, faltantes materiales, qué se modificó y estado de publicación (NO PUBLICADO/EN_REVISIÓN/AUDITADO)**. No reiniciar un trabajo ya completado; retomar desde el primer paso realmente pendiente y distinguir hecho verificado de intención.

**Esta guía no cambia el método, las ponderaciones, los resultados ni las fórmulas.** Cualquier cambio metodológico se hace únicamente en `REGLAS_VIGENTES.md`, con revisión y pruebas.
