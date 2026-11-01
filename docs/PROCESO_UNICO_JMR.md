# Proceso único JMR — contrato de ejecución independiente de la IA

**Objetivo:** usar la misma valoración, análisis y auditoría en ChatGPT (chat o Work), Claude Code, Gemini o herramientas equivalentes. **No es un método financiero nuevo**, ni sustituye las reglas vigentes ni los tres prompts.

## Selección previa del método

Para cada revisión nueva consignar expresamente `Método A` / `A-1.2` (calibración por drivers y base rates), salvo elección expresa de `Método B` (JMR tradicional) por el usuario. Documento selector: [`modelo/METODOS_VALORACION.md`](../modelo/METODOS_VALORACION.md). A y B comparten el motor y los controles. Las revisiones antiguas sin etiqueta se leen como B sin modificarlas. **El selector de la app y el ejecutor no están adaptados todavía:** esta elección es normativa/documental hasta su integración técnica y regresión.

## Una instrucción para cualquier herramienta

> Valora y analiza **<TICKER>** con **Método <A|B>**, según el selector normativo `modelo/METODOS_VALORACION.md`, siguiendo el proceso oficial JMR. Lee `modelo/REGLAS_VIGENTES.md` y los prompts vigentes. Utiliza la hoja oficial de la empresa o una copia nueva limpia de la plantilla. Conserva fórmulas, justifica entradas y completa los controles técnicos. Tras autorización, entrega valoración y análisis en un expediente preliminar **EN_REVISIÓN**. Cuando solicite auditoría, lee primero mis observaciones de esa revisión y realiza la auditoría económica independiente.

Esa instrucción funciona **solo si el entorno tiene acceso a los repositorios, datos, hojas y herramientas necesarias**. El nombre «JMR» por sí solo no permite a una IA externa conocer el proceso. Si falta conexión, autorización o capacidad de ejecutar un control, se reporta como tal; nunca se afirma que se ejecutó.

## Inventario operativo de prompts (30-oct-2026)

**Solo tres prompts maestros activos, todos bajo `modelo/REGLAS_VIGENTES.md`:**
- **1/3 Valoración:** `docs/prompts/valoracion-modelo-jmr-v5.md`. Estima y alimenta la hoja original: DCF/FCFE/SOTP según sector, cuatro historias, múltiplos prioritarios y matrices de sensibilidad DCF y de múltiplos Base; no escribe investigación ni auditoría.
- **2/3 Análisis fundamental:** `docs/prompts/research-fundamental-jmr-v5.md`. Nivel 1 de **14 capítulos**, el 5 dedicado a ciclo empresarial (Damodaran), ciclo macro y monetario y ciclo de mercado/crédito (Marks); Nivel 2 con **12 apartados reproducibles**; usa solamente resultados de la misma revisión financiera, no los recalcula.
- **3/3 Auditoría económica:** `docs/prompts/auditoria-economica-jmr-v1.md`. Examen independiente posterior, con **18 secciones propias**, sin sobrescribir hoja o artículo.

**Legado y limpieza:** `docs/prompts/archivo/`, `docs/prompts/recuperado-*` y `docs/prompts/colombia-research-v1.md` quedan para consulta histórica; no invocarlos como prompts vigentes. No eliminar enlaces de compatibilidad, fuentes, revisiones ni fórmulas sin inventario de usos y prueba de regresión. La app muestra los múltiplos publicados desde `Financials Multiples`, `Descuento de múltiplos` y `Sensibilidad por múltiplo` de la **misma hoja de cada empresa**; sin controles conciliados mostrar N/D (no cero ni objetivo fabricado). P/S y P/BV son opcionales. Para validar publicación distinguir hoja existente, cálculos presentes, reconciliación a JSON y visualización: son cuatro etapas distintas.

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

## Contrato de ejecución A-1.2 y publicación por etapas — 31-oct-2026

**Este capítulo concreta el flujo único ya vigente; no cambia fórmulas, umbrales ni prioridades de `modelo/REGLAS_VIGENTES.md`.** Ante discrepancias prevalecen las reglas vigentes y los controles que se ejecuten de verdad.

### A. Identificar y preparar (una sola vez por revisión)
1. Resolver ticker, clase de acción, revisión vigente en `Modelo-JMR-datos/catalogo.json`, hoja y última auditoría asociada. No tomar un candidato por versión activa; archivar **solo al promover** una nueva versión y conservar intacta la anterior.
2. Seleccionar A / A-1.2 salvo decisión expresa B; distinguir `recuperar`, `actualizar` y `desde cero`. Registrar fecha de corte contable, fecha y fuente de cotización, moneda/FX, ajustes de dilución y rutas de evidencia.
3. Trabajar en copia limpia cuando se solicite nueva valoración, creada en `AAA Finanzas / Análisis / <TICKER>/` (carpeta por ticker, id de Análisis `1IVpgm89jA4BmYVc3HKSCQ1iec4fpYE25`; nunca en plantillas, raíz de Análisis ni archivo); no escribir valores calculados en celdas de salida, no sustituir una hoja oficial por una simulación externa y no mezclar supuestos de distintas revisiones.
4. Hacer un mapa de fuentes primarias, drivers y clases de referencia: crecimiento, margen, impuesto, I+D/arrendamientos, capital, Sales-to-Capital **incremental**, reinversión, ROIC/RONIC, WACC o Ke, terminal y puente a patrimonio. Documentar dato/cálculo/juicio y contradicciones materiales.

### B. Calcular, contrastar y revisar en la hoja
5. Ejecutar el modelo principal por sector: FCFF/DCF en operativas, FCFE/Ke en financieras, SOTP en holdings. Cuatro historias completas: Conservadora, Base, Optimista y Disrupción. Mostrar Base como ancla, MOS35 = Base×0,65, promedio ordinario ponderado de las tres primeras, Disrupción aparte, precio de referencia y diferencia de cada precio.
6. DCF inverso y sensibilidades nativas del método principal (riesgo/descuento, crecimiento, margen, reinversión/Sales-to-Capital y ROIC terminal conforme corresponda) con ejes, centros, unidades y fechas rastreables. El análisis AZ Stocks es contraste separado, **nunca sustituto del modelo principal ni mezcla de ponderaciones**.
7. Evaluar cinco múltiplos prioritarios de la casa: EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF; calcular solo los económicamente aplicables. P/S y P/BV son complementarios opcionales, excepto que una financiera puede requerir P/BV por razón económica explicada. Para financieras, priorizar P/E, P/FCFE y P/BV y no fingir EBITDA industrial.
8. Para cada múltiplo, verificar serie histórica y/o pares de misma definición, ancla **independiente del precio actual y de otros métodos**, proyección denominador, descuento FY+3→valor presente, pesos y matriz Base nativa 5×5 de la **misma hoja y revisión**. Anclas heredadas, sintéticas, ligadas al precio observado o a otra metodología son `PENDIENTE_ANCLA`, con `peso=0` hasta justificación: **nunca certificarlas ni usarlas para suplir otra matriz**. Datos ausentes: `N/D`, no cero; `N/A` solo con motivación económica y denominador comprobado.
9. Conciliar hoja → captura fuente con fórmula/celda/fecha → JSON → análisis → app, incluyendo escala, FX, identificador de revisión y hash o rastro del origen. Comprobar controles existentes mediante CI; no alterar gates para lograr un verde artificial. Si una hoja no tiene DCF nativo o presenta discrepancia material, el valor externo puede conservarse **únicamente como candidato**, no valor vigente oficial.

### C. Escribir, publicar y auditar sin duplicidad
10. Nivel 1: **14 capítulos canónicos completos** del Estilo JMR, con apartados extensos según negocio, incluidos ciclos empresarial, macro, monetario y crédito/mercado, ventajas, riesgos y tesis falsable. **No** confundir los 18 apartados de auditoría con el índice del research. Nivel 2: 12 apartados, tablas históricas, supuestos y fuentes, fórmulas efectivamente usadas, proyecciones por año, puente de equity, escenarios, DCF inverso, sensibilidad DCF **y de cada múltiplo aplicable**, conciliaciones y salvedades. Se usan los números de **la misma valoración**, sin recalcularlos en el artículo.
11. Estados de avance: `CANDIDATO` (investigación/cálculo provisional, nunca en catálogo), `EN_REVISION` (expediente válido, controles técnico-financieros y editoriales aprobados, salvedades abiertas y **sin auditoría económica exigible**), `AUDITADO` solo tras revisión independiente. Una valoración `EN_REVISION` **no equivale** a exactitud económica certificada. El archivo histórico permanece accesible.
12. Promover solo cuando haya un valor calculado y conciliado de hoja oficial, link único de revisión entre valoración, análisis y hoja, pruebas estructurales/financieras/editoriales verdes y comprobación funcional. Validar ficha única, resumen Base/MOS/precio, cuatro historias, estados, tablas, cinco prioridades de múltiplos con N/D explícito, matrices, enlaces y modos visor/edición mediante autenticación real. `Vercel READY` no demuestra esta prueba visual.
13. Después de revisión visual del usuario, ejecutar **por separado** el prompt 3/3 de auditoría económica. Si falla una prueba: dejar PR en borrador, conservar el último catálogo correcto, anotar evidencia, clasificación del fallo y cambio mínimo; nunca publicar a medias.

### D. Entregable invariable por empresa
`Identidad y corte | Versión A-1.2 | Estado (candidato/EN_REVISION/auditado) | Hoja oficial | Valor Base y MOS35 | Cuatro escenarios y promedio ordinario | Precio observado con fecha | Cinco múltiplos: aplicabilidad/anclas/VP/pesos/5×5 | Nivel 1 y Nivel 2 | Gates y QA | Salvedades y siguiente acción`.

**Orden de operaciones:** no esperar a la certificación económica para comenzar **otra** valoración; sí esperar al cierre de gates técnicos de **esa revisión** para convertirla en activa. Conservadora no sustituye MOS y no se ajusta el precio objetivo para coincidir con cotización.
