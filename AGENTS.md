# Instrucciones permanentes — Modelo JMR · contrato multiagente
**Versión 9-nov-2026 · mismo texto oficial en Modelo-JMR, Modelo-JMR-datos y JMR-valuation.**

## Perfil vigente: Reboot (9-nov-2026)
Toda valoración nueva sigue **Modelo JMR Reboot**, igual para ChatGPT, Claude y cualquier ejecutor. Antes de empezar lee, en `JuanMaRobledo/Modelo-JMR` (rama `main`): `modelo/REGLAS_VIGENTES.md` §0R, `docs/CONTRATO_REBOOT_JMR.md` y `docs/prompts/ordenes-reboot.md` (prompt reutilizable: `docs/prompts/PROMPT_MAESTRO_REBOOT.md`). Son seis archivos por empresa —LIBRO HISTÓRICOS, tres LIBROS DCF (Conservadora, Base, Optimista; fcffsimpleginzu original sin cambiar fórmulas ni comentarios), LIBRO MÚLTIPLOS (cinco múltiplos, sin P/S ni P/BV) y documento de ANÁLISIS— y seis fases R1–R6. Filosofía Damodaran: historias a números, supuestos por criterio de la IA con fuentes. Lo anterior al 9-nov-2026 está en `Modelo-JMR-datos/archivo-v1/` y no es insumo. Una revisión Reboot no se declara publicada mientras app y validadores no reconozcan `jmr-reboot-3libros-v1`.

## Floyd (heredado)
Lo que sigue describe Floyd F1–F5 y **solo** se aplica para continuar UBER y CMG hasta reconfigurarlos; CELH está en reconfiguración. Si contradice el perfil Reboot, prevalece Reboot.

## Instrucción obligatoria para ChatGPT, Claude y cualquier ejecutor
**Una valoración JMR Floyd sigue exactamente el mismo proceso F1–F5 independientemente de la IA.** Antes de empezar, lee en este orden desde `JuanMaRobledo/Modelo-JMR` (rama oficial `main`):
1. `modelo/REGLAS_VIGENTES.md` §0 (autoridad económica, reglas compartidas, materialidad y publicación).
2. `docs/CONTRATO_EJECUCION_FLOYD.md` (**contrato universal de agentes, entregas, dos libros, gates y continuidad**).
3. `docs/prompts/ordenes-floyd.md` (órdenes F1–F5) y `docs/CONTEXTO_CORTO.md` para resumen; si el resumen A-1.2 contradice Floyd, prevalece §0 y las órdenes Floyd.
4. `docs/HISTORIAS_A_NUMEROS.md` para F3/F5; `docs/prompts/research-fundamental-jmr-v5.md` y `docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md` para F4; `docs/prompts/auditoria-economica-jmr-v1.md` para F5. Colombia, anteponer `docs/prompts/colombia-nucleo-v1.md` si aplica.

La plantilla y los cálculos del motor de Damodaran permanecen intactos. El agente carga datos primarios y supuestos con fuentes; Google Sheets calcula el DCF, múltiplos, ratios y sensibilidades. Nunca sustituir fórmulas ni selectores con números. Una revisión de otra empresa o un archivo antiguo no es insumo del expediente.

## Perfil y flujo
- Floyd es oficial para nuevas empresas operativas cubiertas por Simple Ginzu FCFF. Financiales y holdings sin motor Floyd equivalente requieren el flujo compatible FCFE/SOTP, no un FCFF industrial inventado.
- **F1:** corte, identidad y copia de Maestra Floyd. **F2:** Históricos separados (H1) y traslado unidireccional a Valoración (H2), sin `IMPORTRANGE`. **F3:** tres historias (Conservadora, Base, Optimista), WACC común, DCF e inverso, múltiplos, matrices y MOS35 % **solo sobre Base**. **F4:** análisis Nivel 1 (14 capítulos), Nivel 2 (12 apartados), integración y publicación preliminar `EN_REVISION` solo tras controles aprobados. **F5:** auditoría económica posterior y **sesión/agente independiente**.
- «Valora y analiza <TICKER>» implica F1–F4 en orden, retomando lo que ya existe, sin interrumpir innecesariamente por trámites de fase. «Fase N» ejecuta únicamente la fase pedida; «continúa» reanuda el primer control pendiente. F5 no se autocertifica jamás.
- No ejecutar el plan anterior A-1.2 de «cuatro fases» ni exigir cuatro historias a Floyd. Los documentos y scripts legados son históricos o verifican su propio archivo sin activarlo.
- El catálogo público incluye solo revisiones Floyd aprobadas para `EN_REVISION`; las demás permanecen en `archivoFloyd`, sin borrar sus archivos ni modificarlos. Una ficha tiene siete pestañas, y **tres fuentes explícitas**: Históricos Sheets, Valoración Sheets y documento de análisis. No hay excepciones por ticker.

## Contrato de traspaso y evidencia
Cada fase entrega `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` con ticker, fecha, corte, revisión, IDs de **ambos libros** y análisis, modelo/herramienta/esfuerzo reales, fuente/celda de cada material, `PASOS n/n`, `AISLAMIENTO=OK` solo verificado, controles `APROBADO/PARCIAL/NO_EJECUTADO`, commits/PR, faltantes e instrucciones para continuar.
Registrar las mismas parejas `valoraciones/<REV>.json` + `analisis/<TICKER>-research-<REV>.json`, con misma revisión, `perfil_valoracion=Floyd`, `contratoLibros=floyd-h1-h2-separados-v1`, `libros.historicos`, `libros.valoracion`, `libros.analisis`. El código y la app usan **ese contrato**, no el nombre de la IA.
Si un paso no puede ejecutarse por permisos/herramientas, distinguir NO_EJECUTADO de aprobado, dejar evidencia y avanzar lo no dependiente como CANDIDATO. No fabricar resultados ni afirmar publicación por solo haber creado un PR. La auditoría F5 usa el expediente de la misma revisión, en sesión independiente.

## Autoridad
Ante discrepancias: instrucción vigente del usuario para la tarea → `modelo/REGLAS_VIGENTES.md` para método/economía → `docs/CONTRATO_EJECUCION_FLOYD.md` y `docs/prompts/ordenes-floyd.md` para Floyd → prompts maestros correspondientes → herramientas, habilidades y guías antiguas. Las tres copias de este archivo deben mantenerse idénticas al modificarlo.
