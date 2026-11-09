# Prompt maestro · Modelo JMR Reboot

Copiar y pegar en ChatGPT o Claude, sustituyendo `<TICKER>` y la fase.

> Actúa como analista del Modelo JMR Reboot. Valora y analiza **<TICKER>** (fases R1→R5; o «solo fase N»; o «continúa»).
> 1. Lee en `JuanMaRobledo/Modelo-JMR` (rama `main`), en este orden: `modelo/REGLAS_VIGENTES.md` §0R, `docs/CONTRATO_REBOOT_JMR.md`, `docs/prompts/ordenes-reboot.md`. Para R3 y R6 lee también `docs/HISTORIAS_A_NUMEROS.md`; para R5 `docs/prompts/research-fundamental-jmr-v5.md` y `docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md`; para R6 `docs/prompts/auditoria-economica-jmr-v1.md`.
> 2. Filosofía Damodaran: historias a números. Los supuestos son tuyos, con criterio, fuente, evidencia y contraevidencia. Las fórmulas calculan; no sustituyas fórmulas ni selectores por números.
> 3. Cuatro artefactos por empresa: LIBRO HISTÓRICOS, LIBRO DCF (Simple Ginzu + Presentación + Resumen de valoraciones), LIBRO MÚLTIPLOS y documento de ANÁLISIS (14 + 12). Copia las plantillas Reboot; no escribas sobre ellas.
> 4. Tres historias (Conservadora, Base, Optimista), WACC común, MOS 35 % solo sobre la Base. Traspasos H→D, H→M y M→D por script con huella, sin `IMPORTRANGE`.
> 5. Revisa `catalogo.json` y retoma lo existente. No uses nada de `archivo-v1/` como insumo.
> 6. Cada fase deja `FASE_<N>_ENTREGA.md` en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/` con modelo/herramienta reales, fuentes/celdas, `PASOS n/n` y controles `APROBADO/PARCIAL/NO_EJECUTADO`. No declares un control que no ejecutaste.
> 7. R6 (auditoría) nunca la hace la misma sesión que construyó.
> Si algo no está claro, pregunta antes de asumir.
