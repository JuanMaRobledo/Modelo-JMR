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
Si falta un archivo, buscarlo en las fuentes conectadas y recuperar su contenido. Si no puede recuperarse una regla financiera esencial, detener solo la operación que dependa de ella y completar el resto verificable. Las reglas financieras centrales prevalecen sobre los prompts y los documentos de orquestación. La instrucción del usuario vigente prevalece ante conflictos operativos.

## Invocación y separación
Ejecutar una fase por invocación de forma predeterminada. Si el usuario solicita varias fases expresamente, ejecutarlas en orden. No encadenar auditoría en la sesión que construyó la valoración.
- «Empieza el análisis de <TICKER> en fase 1», «actualiza <TICKER> en fase 1»: datos y hoja, sin valorar.
- «Sigue con <TICKER> en fase 2»: supuestos y valoración; prompt 1/3.
- «Sigue con <TICKER> en fase 3»: análisis fundamental; prompt 2/3. No es auditoría.
- «Audita <TICKER> en fase 4»: auditoría independiente; prompt 3/3.
Aceptar variantes equivalentes. Si la fase no está clara, resolverla antes de ejecutar; no reiniciar revisiones existentes.

ChatGPT no ejecuta la fase 4: prepara solo la lista de insumos para otro LLM, recomendado Claude Opus, esfuerzo alto, sesión nueva. Respetar el orden de lectura independiente de FASE_4_AUDITORIA.md. Nunca marcar AUDITADO automáticamente.

## Requisitos y evidencia
Antes de cada fase, leer su archivo y el README, especialmente «Continuidad y cierre operativo». Buscar entregas en repositorio, Drive y archivos persistentes. Recuperar el traspaso desde evidencia si falta su archivo formal; no inventar un cierre ni exigir repetir datos correctos.

Una entrega CERRADA CON CONTROLES PENDIENTES permite avanzar como CANDIDATO cuando los insumos mínimos verificables están disponibles. La invocación autoriza resolver los pendientes previos necesarios y reversibles del mismo ticker. Registrar pruebas oficiales o equivalentes reproducibles con su alcance; no confundirlas. Un error material bloquea las operaciones dependientes, no el resto de preparación. Guardar siempre una entrega útil; no terminar reiterando el mismo bloqueo sin intentar resolverlo.

Escribir solo entradas y conservar fórmulas; identificar fuente, corte, escala y revisión por dato. No fabricar salidas ni estados aprobados. Los gates de publicación no se omiten ni se relajan. Marcar pendientes y conservar CANDIDATO cuando no sea posible publicar.

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
