# Proceso oficial Modelo JMR · CINCO FASES

**Versión v2 · 2-nov-2026 · INTEGRADA A MAIN mediante PR #166 (CI aprobada).** Resumen operativo para cargar primero: [`docs/CONTEXTO_CORTO.md`](../../CONTEXTO_CORTO.md). Fuente normativa: `modelo/REGLAS_VIGENTES.md`; metodología A-1.2 por defecto. Este README es el **único orquestador** para ChatGPT, Work, Claude Code y otros agentes. La plantilla y el motor conservan las reglas financieras, el MOS, los cuatro escenarios y los controles de publicación.

**Cobertura F1 obligatoria:** además de Input sheet y los cinco múltiplos, consultar el [contrato universal de insumos y hojas auxiliares](CONTRATO_INSUMOS_FASE_1.md), incluidos WACC, capitalización de I+D, Option value, leases y validación de deuda/activos no operativos. F2 no releva la captura mínima necesaria para valorar en F1.

## Fases canónicas e invocaciones
| Fase | Pedido válido | Qué hace | Entrega / estado |
|---|---|---|---|
| **1 · Valoración inicial** | «Empieza Fase 1 de AMZN» | Solo insumos de `Input sheet`, costo de capital y múltiplos; DCF Damodaran A-1.2 y **propuesta** de historias Base/Conservadora/Optimista/Disrupción | [FASE_1_VALORACION_INICIAL.md](FASE_1_VALORACION_INICIAL.md), `FASE_1_ENTREGA.md` · CANDIDATO |
| **2 · Históricos completos** | «Continúa Fase 2 de AMZN» | Estados, notas, precios y ratios calculados hasta 10 FY + LTM o máximo disponible | [FASE_2_HISTORICOS_COMPLETOS.md](FASE_2_HISTORICOS_COMPLETOS.md), `FASE_2_ENTREGA.md` · CANDIDATO |
| **3 · Revisión de supuestos** | «Continúa Fase 3 de AMZN» | Validar/cambiar razonabilidad de crecimiento, márgenes, ROIC, S/C, reinversión, WACC, terminal y múltiplos | [FASE_3_REVISION_SUPUESTOS.md](FASE_3_REVISION_SUPUESTOS.md), `FASE_3_ENTREGA.md` · CANDIDATO_REVISADO |
| **4 · Análisis + publicación** | «Continúa Fase 4 de AMZN» | Nivel 1/2 completo, pruebas hoja–JSON–app, publicación **EN_REVISION** solo si gates pasan | [FASE_4_ANALISIS_PUBLICACION.md](FASE_4_ANALISIS_PUBLICACION.md), `FASE_4_ENTREGA.md` · EN_REVISION o CANDIDATO |
| **5 · Auditoría guiada** | «Audita AMZN en Fase 5» | Auditoría económica **guiada por las observaciones del usuario**, con comprobación independiente y dictamen | [FASE_5_AUDITORIA_GUIADA.md](FASE_5_AUDITORIA_GUIADA.md), `FASE_5_ENTREGA.md` · dictamen independiente |

**Prompts maestros no cambian de contenido:** 1/3 `valoracion-modelo-jmr-v5.md` se ejecuta en **F1** (y las partes pertinentes en revisión F3), 2/3 `research-fundamental-jmr-v5.md` en **F4** y 3/3 `auditoria-economica-jmr-v1.md` en **F5**. F2 es captura/validación de datos, F3 juicio sobre hipótesis, no se crean prompts maestros 4/3 y 5/3.

## Contratos permanentes
1. **Una revisión por emisor, una sola hoja vigente:** ticker/revisión/corte/`sheet_id` identificados. Archivar revisiones sustituidas; no mezclar R2/R3 con R4 u otros emisores.
2. **Valoración temprana, no definitiva:** F1 puede estimar DCF y múltiples **solo** desde sus insumos materiales verificados; los históricos completos no son precondición universal de esta propuesta. Una entrada crítica ausente produce N/D y suspende el precio afectado; un número no verificado no se pega por cumplir calendario. F1 produce *hipótesis*, F3 determina su validez después de F2.
3. **Origen de números:** fuente primaria SEC/NIIF + período, moneda, escala, nota/URL, celda. Definir `dato / agregado no desglosado / no aplica / pendiente`. `0` no sustituye dato desconocido; SG&A, I+D, D&A, leases, CAPEX, CFO, deuda y acciones necesitan cotejo positivo. Ninguna IA puede autoaprobar un cotejo omitido.
4. **La hoja calcula:** conservar fórmulas para ROIC, ROE, ROA, márgenes, crecimiento, indicadores, `Trailing Valuation`, DCF, múltiplos y matrices. La IA solo coloca entradas y supuestos verificados. No sustituir fórmulas con resultados manuales; versiones de fórmula no se editan por empresa.
5. **Cuatro historias y valor principal:** DCF FCFF Base (FCFE financiera, SOTP holdings), MOS 35% **sobre Base**, promedio ordinario sin Disrupción, terminal y tasas coherentes, sensibilidad 5×5 cuando aplicable, ancla por ciclo y cinco múltiplos prioritarios aplicables; P/S/P/BV opcionales.
6. **No impedir investigación por falta secundaria:** clasificar cada bloqueo material/estructural vs documental/cierre. Se permite proseguir como CANDIDATO si la fase siguiente puede trabajar con los insumos materiales verificables. Prohibido llamar VERIFIED a control NO EJECUTADO.
7. **Gates no se trasladan a F5:** F4 puede publicar como `EN_REVISION` **solo** con controles técnicos aprobados y sin errores materiales. La invocación F4 autoriza intentar promoción preliminar; no salta CI, conciliación, integridad ni permisos. F5 es auditoría económica posterior guiada por el usuario; no sustituye CI.
8. **Independencia de F5:** preferentemente otro LLM y sesión distinta de la construcción F1/F3/F4. Si no, declaración explícita «no independiente» y sin dictamen independiente.
9. **Colombia:** las mismas cinco fases, `colombia-nucleo-v1.md` antepuesto a los tres prompts cuando aplique; NIIF, COP, FCFE/SOTP según empresa.
10. **Una fase por petición salvo solicitud de varias:** dentro de la fase ejecutar todos sus pasos y resolver dependencias reversibles del mismo ticker. Dejar la entrega y detallar APROBADO / PARCIAL / NO EJECUTADO, herramienta/LLM/esfuerzo, commit/PR/hoja, razón, impacto y tareas exactas para la siguiente. No seguir auditoría por iniciativa del constructor.

## Retiro de Forward Valuation y perfil de plantilla
- **Hoja `Forward Valuation` se declara DEPRECADA** para revisiones nuevas. Su función prospectiva está cubierta por DCF, `Financials Multiples`, `Descuento de múltiplos` y escenarios.
- **Eliminarla físicamente exige migración y regresión verificables:** (a) probar todas las referencias de fórmula de todas las pestañas incluyendo rangos lejanos, nombres, validaciones, scripts/Google Sheets y app; (b) respaldo de plantillas Maestra/IA/Manual y prueba en copia; (c) actualizar `reference/plantillas.json`, validador de 46→45, UI/pruebas y documentación; (d) comparar DCF/múltiplos con los de la copia anterior; (e) recién entonces borrar la pestaña solo en **nuevas plantillas**. **NO borrarla de expedientes históricos ni de AMZN R4 por cambiar esta regla.**
- Hasta ejecutar y aprobar esos controles, las hojas oficiales existentes conservan sus **46 pestañas**. Que no se use la hoja no autoriza borrarla a ciegas. Una copia de 45 hojas no es oficial hasta registrar plantilla y pasar controles. La app puede ocultar el acceso rápido en futura migración; sin cambiar motor.

## Entrega reproducible de cada fase
```
# <TICKER> · <REV> · FASE_<N> · <CERRADA / CERRADA CON CONTROLES PENDIENTES / BLOQUEADA>
Fecha · método · corte · hoja sheet_id · LLM/esfuerzo · PR/commit
## Hecho y comprobado (celdas, documentos, comandos y salidas)
## Juicios o decisiones de la fase (valor anterior/nuevo y razones)
## Drivers Base anterior → nuevo (crecimiento 1-5, margen terminal, S/C 1-5/6-10, WACC/Ke, g terminal, ROIC/ROE terminal; ver Modelo-JMR-datos/registro/DRIVERS.md)
## Controles ejecutados (APROBADO/PARCIAL/NO EJECUTADO, razón)
## Bloqueos materiales vs pendientes secundarios
## Insumos exactos para la fase siguiente
```

## Compatibilidad e historial
Los archivos antiguos `FASE_1_DATOS_Y_HOJA.md`, `FASE_2_SUPUESTOS_Y_VALORACION.md`, `FASE_3_ANALISIS_Y_PUBLICACION.md`, `FASE_4_AUDITORIA.md` describen el **flujo de cuatro fases obsoleto** y se conservan solo como antecedentes, archivados en [`archivo/`](archivo/README.md) desde el 3-nov-2026. **No ejecutarlos** bajo el proceso nuevo. Las entregas de AMZN R4 generadas bajo fases anteriores se conservarán con el nombre original y se deben **remapear por evidencia**, no renombrar ni declarar completas por equiparación: antiguo F1 (datos parciales) → nuevo F1 y/o F2 según comprobantes; antiguo F2 valoración → nuevo F1; antiguo F3 análisis → nuevo F4; antiguo F4 auditoría → nuevo F5. Una revisión incompleta conserva estado CANDIDATO.

Ver [MODO_CHATGPT.md](MODO_CHATGPT.md) y habilidad `.claude/skills/fase-jmr/SKILL.md` actualizados para este contrato.
