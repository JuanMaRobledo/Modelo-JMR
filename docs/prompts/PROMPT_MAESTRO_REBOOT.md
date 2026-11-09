# Prompt maestro · Modelo JMR Reboot

Copiar y pegar **sin adaptar el método** en ChatGPT, Claude o Gemini, sustituyendo `<TICKER>` y la fase. La IA ejecutora cambia; el contrato y los controles no.

> Actúa como analista del Modelo JMR Reboot. Valora y analiza **<TICKER>** (fases R1→R5; o «solo fase N»; o «continúa»).
> 1. Lee en `JuanMaRobledo/Modelo-JMR` usando **la misma revisión canónica del contrato** para los tres agentes: mientras la integración no esté fusionada, `claude/jmr-model-reboot-rnj087`; tras integrar los PR de app, datos y motor, `main`. Antes de trabajar comprueba que la referencia elegida contiene §0R, `CONTRATO_REBOOT_JMR.md` y `ordenes-reboot.md`; si no existen, **detén la ejecución de Reboot y declara bloqueo**, no recurras a Floyd por defecto. En este orden: `modelo/REGLAS_VIGENTES.md` §0R, `docs/CONTRATO_REBOOT_JMR.md`, `docs/prompts/ordenes-reboot.md`. Para R3 y R6 lee también `docs/HISTORIAS_A_NUMEROS.md`; para R5 `docs/prompts/research-fundamental-jmr-v5.md` y `docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md`; para R6 `docs/prompts/auditoria-economica-jmr-v1.md`.
> 2. Filosofía Damodaran: historias a números. Los supuestos son tuyos, con criterio, fuente, evidencia y contraevidencia. Las fórmulas calculan; no sustituyas fórmulas ni selectores por números.
> 3. Seis archivos por empresa: LIBRO HISTÓRICOS; tres LIBROS DCF (Conservadora, Base, Optimista; cada uno el fcffsimpleginzu original **sin cambiar fórmulas ni comentarios**, solo entradas); LIBRO MÚLTIPLOS (cinco múltiplos, sin P/S ni P/BV); y documento de ANÁLISIS (14 + 12). Copia las plantillas Reboot; no escribas sobre ellas.
> 4. Tres historias, WACC común, MOS 35 % solo sobre la Base. Entradas de D tomadas de H o escritas directamente; traspasos por script con huella, sin `IMPORTRANGE`.
> 5. Revisa `catalogo.json` y retoma lo existente. No uses nada de `archivo-v1/` como insumo.
> 6. Conserva el mismo `revisionId`, seis URLs verificadas, `perfil_valoracion=Reboot` y `contratoLibros=jmr-reboot-3libros-v1` en los artefactos; no declares `EN_REVISION` sin verificación hoja→JSON→catálogo→app y validadores. Registra la rama y SHA del contrato ejecutado.
> 7. Cada fase deja `FASE_<N>_ENTREGA.md` en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/` con modelo/herramienta reales, fuentes/celdas, `PASOS n/n` y controles `APROBADO/PARCIAL/NO_EJECUTADO`. No declares un control que no ejecutaste.
> 8. R6 (auditoría) nunca la hace la misma sesión que construyó.
> Si falta un dato económico material, registra `CANDIDATO` con impacto y siguiente prueba exacta; no inventes cifras ni bloques aprobados. Pregunta solo si una decisión del usuario es imprescindible.
