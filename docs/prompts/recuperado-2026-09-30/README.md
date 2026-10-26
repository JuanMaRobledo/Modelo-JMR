# Prompts recuperados: los del 30-sep-2026 (valoración v4 e investigación v5)

## Por qué esta versión
- 17 de los 38 análisis restaurados llevan `auditoriaPrompts: {valoracion: "v4", research: "v5"}` y la auditoría
  `auditoria-prompts-2026-09-30.json` de Modelo-JMR-datos cubre 22 empresas con esos prompts. Otros 20 no traen la marca; sus fechas
  (16-sep al 8-oct) caen antes de que se agregaran las capas de Colombia y holdings (9-oct en adelante) y de las 21 matrices (16-oct).
- Límite honesto: «v4/v5» es un nombre que cubrió varios estados del texto. Elegí el cierre del 30-sep (`0607cb0`, 49 KB y 65 KB)
  por ser el que respalda la marca de auditoría. Si prefieres el último estado antes de Colombia (8-oct), está en el historial:
  `git show 6376773:docs/prompts/valoracion-modelo-jmr-v4.md` y `...research-fundamental-jmr-v5.md` (80 KB y 96 KB).

## Archivos
| Archivo | Contenido |
|---|---|
| `valoracion-modelo-jmr-v4_30sep_BASE.md` | Adenda de sensibilidades solo Base + el prompt del 30-sep tal cual. Es el que se copia y se usa. |
| `research-fundamental-jmr-v5_30sep_BASE.md` | Ídem para el análisis fundamental. |
| `../archivo/epoca-2026-09-30/` | Los mismos prompts sin adenda, para comparar. |

## Sensibilidades
El prompt del 30-sep no pedía matrices de múltiplos y solo una tabla simple de DCF. La adenda agrega, tomándolo de
`REGLAS_VIGENTES` §8: tres matrices 5 × 5 del DCF Base con inverso, y una matriz por método de múltiplos solo en la Base; ninguna de
Conservadora, Optimista o Disrupción, pero con sus valores y precios calculados. El visor actual ya muestra solo Base
(`docs/jmr-report-sheets.js`). Los registros restaurados conservan sus 21 controles por empresa porque `auditar_integridad.cjs` los exige.

## Qué no cubre
No incluye las reglas del 21-oct (MOS 35 % sobre la Base, g terminal 4 %, previas simétricas, prima por país al corte). Con este prompt
hay que aplicarlas desde `modelo/REGLAS_VIGENTES.md`, que manda si hay diferencias. Ningún prompt vigente se modificó.
