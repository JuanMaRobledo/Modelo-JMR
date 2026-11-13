# Criterios de publicación · JMR V2.0 (versión 1.1)

Decisiones del usuario consolidadas el 13-nov-2026 en `CONTRATO_UNICO_LLM.md`. Cambios futuros requieren actualizar contrato, catálogo/validador cuando corresponda y pruebas.

## Publicación en la aplicación (independiente de auditoría)

Una empresa puede aparecer en la app como **PUBLICADA_PARA_REVISION** con valoración y análisis, aunque no tenga auditoría independiente o personal. Debe ser real, utilizar el motor correspondiente y no tener bloqueos materiales que invaliden el valor. El visor **«Pendientes de mi auditoría»** muestra los valores provisionales y sus salvedades. **«Auditadas y aprobadas por mí»** exige aprobación personal expresa de la revisión vigente. Ningún LLM puede concederla.

El campo `visibilidadApp` y el estado técnico `estado` se registran por separado. Una ficha bloqueada puede mostrar problemas, pero no cifras intrínsecas no sustentadas. El estado técnico `PUBLICADO` no demuestra aprobación personal.

## Estados técnicos
| Estado | Significado |
|---|---|
| `EN_PROCESO` | Hay errores de datos o de valoración por corregir. |
| `EN_REVISION` | Datos y valoración sin errores; falta solo lo que exige un tercero o una redacción (auditoría, análisis, fuentes, referencia al libro). |
| `PUBLICADO` | Ningún control falla **y** hay auditoría independiente con evidencia. No equivale a aprobación personal ni condiciona visibilidad preliminar. |
| `BLOQUEADO` | Falta un dato que impide valorar (históricos mínimos, datos regulatorios, supuestos que el motor no puede replicar…). No se muestran valores. |

El estado declarado en el expediente **nunca** puede superar al permitido por los controles; el catálogo degrada el estado si lo supera.

## Reglas que no admiten excepción
1. La IA **no** certifica la auditoría. `auditoria.aprobadaPor` no puede ser una IA; exige responsable, fecha y evidencia. Su ausencia no bloquea publicación para revisión.
2. Un expediente ficticio nunca es publicable.
3. El valor por acción del **libro oficial** (`libro.valores`) debe conciliar con el motor del expediente (±0,5 %) en los tres escenarios (P07). El JSON no es otro motor.
4. MOS 35 % sobre el escenario **base**; los tres valores intrínsecos permanecen visibles.
5. Los múltiplos son diagnóstico: no se promedian con el DCF.
6. Sin datos regulatorios (CET1/solvencia con mínimo, fecha y fuente) un banco o aseguradora queda `BLOQUEADO`.
7. Un negocio financiero dentro de un holding entra solo con valor externo de su propio motor y referencia a su expediente.
8. El descuento de holding exige justificación económica escrita y no supera el 30 %.
9. Simple Ginsu se prefiere; el motor de alto crecimiento exige condición declarada y justificación.

## Lista de controles
- **Datos** (D01–D13): ≥3 ejercicios (10 objetivo), años consecutivos y sin duplicados, moneda y unidades, balance y resultados cuadran (±0,5 %), base de valoración = último histórico, trazabilidad completa (documento, período, página/nota, moneda, unidades, valor reportado, ajuste) de cada cifra material.
- **Valoración** (V01–V12, P07, F01–F05, H01–H12, A01–A05): ver mensajes en `expediente-v2.mjs`. Coherencia entre escenarios, crecimiento terminal < tasa de descuento, ROIC terminal ≤ WACC + 10 pp salvo justificación, WACC común salvo justificación.
- **Certificación** (P01–P06): no ficticio, auditoría independiente, análisis fundamental completo, fuentes primarias, referencia al libro con sha256. P02 limita la certificación, pero no la visibilidad preliminar.

## Qué no cubren estos controles (límites conocidos)
No verifican que una cifra coincida con el informe: eso lo hace la auditoría independiente. No sustituyen el criterio sobre calidad del negocio ni del gobierno corporativo.
