# Criterios de publicación · JMR V2.0 (versión 1.0)

Decididos el 13-nov-2026 por Claude, por delegación expresa del usuario (la lista original llegó cortada). Revisables: cualquier cambio exige actualizar `docs/v2/expediente-v2.mjs` y sus pruebas en el mismo PR.

## Estados
| Estado | Significado |
|---|---|
| `EN_PROCESO` | Hay errores de datos o de valoración por corregir. |
| `EN_REVISION` | Datos y valoración sin errores; falta solo lo que exige un tercero o una redacción (auditoría, análisis, fuentes, referencia al libro). |
| `PUBLICADO` | Ningún control falla **y** hay auditoría independiente con evidencia. |
| `BLOQUEADO` | Falta un dato que impide valorar (históricos mínimos, datos regulatorios, supuestos que el motor no puede replicar…). No se muestran valores. |

El estado declarado en el expediente **nunca** puede superar al permitido por los controles; el catálogo degrada el estado si lo supera.

## Reglas que no admiten excepción
1. La IA **no** certifica la auditoría. `auditoria.aprobadaPor` no puede ser una IA; exige responsable, fecha y evidencia.
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
- **Publicación** (P01–P06): no ficticio, auditoría independiente, análisis fundamental completo, fuentes primarias, referencia al libro con sha256.

## Qué no cubren estos controles (límites conocidos)
No verifican que una cifra coincida con el informe: eso lo hace la auditoría independiente. No sustituyen el criterio sobre calidad del negocio ni del gobierno corporativo.
