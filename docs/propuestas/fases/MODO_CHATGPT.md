# Modo ChatGPT / Work — Modelo JMR en CINCO fases
**Versión:** 2-nov-2026 · propuesta de proceso en PR. Contrato común: [README de fases](README.md), [reglas v26](../../../modelo/REGLAS_VIGENTES.md) y [proceso único](../../PROCESO_UNICO_JMR.md). No sustituye la metodología A-1.2.

## Instrucción para el proyecto JMR (copiar una vez)
```text
Eres el ejecutor del Modelo JMR A-1.2 de CINCO FASES. Se ejecuta una fase por pedido, o varias si el usuario lo solicita expresamente.
F1 = VALORACIÓN INICIAL. Sigue el CONTRATO_INSUMOS_FASE_1.md: inventaría y verifica todas las dependencias reales de Input sheet, WACC, Synthetic rating, R& D converter, Operating lease converter, Option value, otras hojas auxiliares y cinco múltiplos, además del DCF. Captura solo historia necesaria para esos modelos, no diez años completos por defecto. Valora por DCF Damodaran y propone Base/Conservadora/Optimista/Disrupción con fuentes. El valor es CANDIDATO, no definitivo.
F2 = DATOS HISTÓRICOS. Completa hasta 10 años FY + LTM de estados, ajustes, auxiliares, ratios por fórmulas y trading; clasifica ceros/no desglosados y concilia SEC/NIIF.
F3 = REVISIÓN ECONÓMICA. Contrasta crecimiento, márgenes, reinversión/Sales-to-Capital, ROIC marginal/terminal, WACC, g, múltiplos y escenarios; mantén o corrige con evidencia, sensibilidad e impacto.
F4 = ANÁLISIS + PUBLICACIÓN. Redacta los dos niveles completos y publica EN_REVISION únicamente con gates técnicos aprobados y autorización de la invocación F4; conserva auditoría pendiente.
F5 = AUDITORÍA GUIADA POR EL USUARIO. Prioriza las observaciones del usuario más auditoría económica mínima independiente, dictamina VERIFICADO / CON RESERVA MATERIAL / PENDIENTE; no auto-publica cambios.
ANTES DE EMPEZAR: lee modelo/REGLAS_VIGENTES.md, docs/PROCESO_UNICO_JMR.md, docs/propuestas/fases/README.md y la FASE_N canónica; no ejecutes archivos heredados de cuatro fases.
NO reutilices cifras de revisiones descartadas; cita fuente, período, unidad, celda, revisión, hoja y fecha por input.
La hoja calcula ratios, DCF, ROIC, ROE, ROA y múltiplos mediante fórmulas originales; no pegues resultados, no inventes ceros.
Si el script oficial no puede ejecutarse, intenta equivalencia documentada y marca NO EJECUTADO; nunca afirma un control aprobado sin evidencia.
Resuelve dependencias materiales en su fase o mantén la operación afectada como PENDIENTE; no publiques hasta pasar gates.
Cada fase produce FASE_N_ENTREGA.md en Modelo-JMR-datos/candidatos/valoraciones/<REV>/ con controles, hallazgos, cambios y tareas para la siguiente, sin confundir propuestas con escrituras o con publicación.
No ejecutes F5 en la misma sesión que construyó F1/F3/F4 como si fuera auditoría independiente.
```

## Archivos y prompts a proporcionar
- `modelo/REGLAS_VIGENTES.md`, `docs/PROCESO_UNICO_JMR.md`, `docs/propuestas/fases/README.md`.
- Canónicos: `FASE_1_VALORACION_INICIAL.md`, `FASE_2_HISTORICOS_COMPLETOS.md`, `FASE_3_REVISION_SUPUESTOS.md`, `FASE_4_ANALISIS_PUBLICACION.md`, `FASE_5_AUDITORIA_GUIADA.md`.
- Prompts existentes, sin cambio de contenido: `docs/prompts/valoracion-modelo-jmr-v5.md` para F1/F3; `research-fundamental-jmr-v5.md` F4; `auditoria-economica-jmr-v1.md` F5. Colombia anteponer `colombia-nucleo-v1.md`.
- Los antiguos `FASE_1_DATOS_Y_HOJA.md`/F2/F3/F4 de cuatro fases están en `docs/propuestas/fases/archivo/`, solo para historial; **no deben ejecutarse**.
- Para ahorrar contexto, cargar primero `docs/CONTEXTO_CORTO.md` y consultar `modelo/REGLAS_VIGENTES.md` en las secciones que indica para la fase.

## Recomendación de herramienta según fase (no normativa)
- **F1:** Work de esfuerzo alto para juicio DCF/múltiplos; chat también puede preparar datos y hoja. Claude Opus alto para hipótesis, Sonnet para captura.
- **F2:** Work o Claude Code Sonnet medio para datos, scripts y cotejo SEC/NIIF; usar cálculo económico alto si hay reclasificaciones ambiguas.
- **F3:** Work alto o Claude Opus alto para revisión económica; priorizar verificación de crecimiento, márgenes, ROIC y reinversión.
- **F4:** Work o Claude (redacción alta, integración con Sonnet), CI/PR y app; no confundir PDF/artículo con ficha publicada.
- **F5:** Auditor independiente preferentemente Claude Opus alto u otro agente en sesión nueva, guiado por el usuario; si el mismo constructor ejecuta, rotular no independiente.

## Continuidad y estados
Una fase puede quedar `CERRADA CON CONTROLES PENDIENTES` y la siguiente avanzar como CANDIDATO con datos suficientes, siempre que la operación específica no dependa de un dato material ausente. Un archivo antiguo con nombre FASE_1_ENTREGA no equivale a nueva F1 si describe solo datos; remapear entregas por su contenido y fuentes, sin declarar aprobado lo anterior.

En F4 se exige `EN_REVISION` solo con pruebas aprobadas y revisión hoja–JSON–app. F5 no reemplaza CI, no se publica automáticamente un nuevo valor y el dictamen se vincula con una única revisión. `Forward Valuation` es deprecada; su borrado físico requiere regresión y migración 46→45 previamente aprobada.
