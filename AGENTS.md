# Instrucciones permanentes — Modelo JMR
Vigente desde 2026-11-02 por instrucción expresa del usuario. Aplica a todos los tickers y a cualquier agente que trabaje en la suite JMR.

## Autoridad y alcance
El proceso de valoración se ejecuta en cuatro fases. Esta regla no obliga a comenzar una valoración cuando la tarea sea mantenimiento técnico.
Documentos centrales, alojados en JuanMaRobledo/Modelo-JMR:
- modelo/REGLAS_VIGENTES.md
- docs/PROCESO_UNICO_JMR.md
- docs/propuestas/fases/README.md y MODO_CHATGPT.md
- docs/propuestas/fases/FASE_1_DATOS_Y_HOJA.md
- docs/propuestas/fases/FASE_2_SUPUESTOS_Y_VALORACION.md
- docs/propuestas/fases/FASE_3_ANALISIS_Y_PUBLICACION.md
- docs/propuestas/fases/FASE_4_AUDITORIA.md
- docs/prompts/valoracion-modelo-jmr-v5.md
- docs/prompts/research-fundamental-jmr-v5.md
- docs/prompts/auditoria-economica-jmr-v1.md

Leerlos desde el repositorio central, no inventar copias ni contenido. Base de enlaces: https://github.com/JuanMaRobledo/Modelo-JMR/blob/main/
Si falta un archivo necesario, informar y detener la fase. Las reglas financieras centrales prevalecen sobre los prompts y los documentos de orquestación. La instrucción del usuario vigente prevalece ante conflictos operativos.

## Invocación y separación
Ejecutar UNA fase por invocación y detenerse al entregar. Nunca encadenar la siguiente.
- «Empieza el análisis de <TICKER> en fase 1», «actualiza <TICKER> en fase 1»: datos y hoja, sin valorar.
- «Sigue con <TICKER> en fase 2»: supuestos y valoración; prompt 1/3.
- «Sigue con <TICKER> en fase 3»: análisis fundamental; prompt 2/3. No es auditoría.
- «Audita <TICKER> en fase 4»: auditoría independiente; prompt 3/3.
Aceptar variantes equivalentes. Si la fase no está clara, resolverla antes de ejecutar; no reiniciar revisiones existentes.

ChatGPT no ejecuta la fase 4: prepara solo la lista de insumos para otro LLM, recomendado Claude Opus, esfuerzo alto, sesión nueva. Respetar el orden de lectura independiente de FASE_4_AUDITORIA.md. Nunca marcar AUDITADO automáticamente.

## Requisitos y evidencia
Antes de cada fase, leer su archivo y el README. Para fases 2 y 3, exigir FASE_<N-1>_ENTREGA.md CERRADA y los demás insumos de entrada. Si falta, está BLOQUEADA o CERRADA CON CONTROLES PENDIENTES, detenerse. Un informe anterior con otra numeración no equivale a una entrega cerrada.

Una fecha de corte y una fuente por dato (documento, período, página/nota o celda). Marcar [NO VERIFICADO] lo no comprobado. Escribir en Sheets SOLO entradas; nunca sustituir o borrar fórmulas para ingresar salidas. El DCF/FCFE/SOTP, escenarios, múltiplos y sensibilidades salen de fórmulas.

No relajar controles. Registrar resultados reales, sin confundir intentos con ejecución exitosa. Un control sin herramienta/configuración: «NO EJECUTADO — requiere <herramienta o configuración>»; entrega CERRADA CON CONTROLES PENDIENTES. Un control fallido sin resolver: BLOQUEADA. Tener Python no demuestra haber ejecutado scripts oficiales.

Fases 1 y 2: CANDIDATO. Fase 3: EN_REVISION solo tras todos los controles y autorización aplicables. No ajustar supuestos para acercar el valor al precio; revisar sesgo agresivo y prudencia duplicada.

## Fase 3 en ChatGPT y Claude Code
Nivel 1: 14 capítulos canónicos, cada uno ≥330 palabras y total ≥7.500; capítulo 5 de ciclos. Nivel 2: 12 apartados reproducibles desde hoja/captura y misma revisión.
ChatGPT entrega textos y controles: no promueve catálogo ni abre PR. Claude Code realiza publicación con instrucciones del usuario y controles completos. No publicar, exceptuar controles ni cambiar estados por iniciativa propia.

## Entrega obligatoria
Guardar en Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md cuando el entorno y el alcance permitan escribir allí; en ChatGPT entregar además el archivo persistente para traspaso.
Formato:
# <TICKER> · <REV> · Fase <N> · <CERRADA | CERRADA CON CONTROLES PENDIENTES | BLOQUEADA>
Fecha · herramienta, modelo y esfuerzo realmente identificables (no adivinar) · sheet_id
## Hecho y verificado (con evidencia)
## Controles de cierre (resultado real de cada uno)
## Decisiones y juicios
## Pendiente o bloqueado
## Para la fase siguiente

Declarar AISLAMIENTO=OK o detallar dudas; no mezclar empresas. No agregar pestañas de entrega si contradice la integridad del perfil oficial sin resolver esa compatibilidad.
Para emisores colombianos anteponer docs/prompts/colombia-nucleo-v1.md según la fase.
