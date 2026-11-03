# Instrucciones permanentes — Modelo JMR
Versión única 3-nov-2026 para Modelo-JMR, Modelo-JMR-datos y JMR-valuation (mismo texto en los tres). Proceso oficial: **cinco fases**. Las tareas de mantenimiento técnico no obligan a iniciar una valoración.

## Qué leer (base: https://github.com/JuanMaRobledo/Modelo-JMR/blob/main/)
1. `docs/CONTEXTO_CORTO.md` — resumen operativo de reglas no negociables por fase. Leer siempre.
2. `docs/propuestas/fases/README.md` (orquestador) y el archivo de la fase invocada:
   F1 `FASE_1_VALORACION_INICIAL.md` + `CONTRATO_INSUMOS_FASE_1.md` · F2 `FASE_2_HISTORICOS_COMPLETOS.md` · F3 `FASE_3_REVISION_SUPUESTOS.md` · F4 `FASE_4_ANALISIS_PUBLICACION.md` · F5 `FASE_5_AUDITORIA_GUIADA.md`.
3. Prompt maestro de la fase: F1/F3 `docs/prompts/valoracion-modelo-jmr-v5.md` · F4 `research-fundamental-jmr-v5.md` · F5 `auditoria-economica-jmr-v1.md`. Colombia: anteponer `colombia-nucleo-v1.md`.
4. `modelo/REGLAS_VIGENTES.md`: consultar las secciones que indica `CONTEXTO_CORTO.md` para la fase y ante cualquier duda. **Prevalece sobre todo lo demás**; la instrucción vigente del usuario prevalece en lo operativo.

No ejecutar los archivos del antiguo flujo de cuatro fases (`docs/propuestas/fases/archivo/`). Si falta un archivo, recuperarlo de las fuentes conectadas; no inventar contenido.

## Invocación
«Fase N de <TICKER>» (o variantes equivalentes): una fase por petición, varias solo si el usuario las pide, en orden. Si la fase no está clara, preguntar. F5 nunca en la sesión que construyó F1, F3 o F4; si no hay independencia, declararlo y no emitir dictamen independiente. Nunca marcar AUDITADO automáticamente.

## Ejecución y entrega
Cada fase se hace completa: todos los pasos y controles de su archivo. Un paso solo queda sin ejecutar si falta la herramienta tras intentar una comprobación equivalente, y se lista con su motivo; declarar `PASOS: n/n ejecutados`. Un dato material ausente bloquea solo lo que depende de él: el resto avanza como CANDIDATO. Nunca declarar APROBADO un control no ejecutado ni relajar gates.

Entrega en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md`, con el formato del README de fases, `AISLAMIENTO=OK` y herramienta, modelo y esfuerzo realmente identificables. Estados: F1–F2 CANDIDATO · F3 CANDIDATO_REVISADO · F4 EN_REVISION solo con gates aprobados · F5 dictamen VERIFICADO / CON RESERVA MATERIAL / PENDIENTE.
