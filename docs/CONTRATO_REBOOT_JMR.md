# Contrato único · Modelo JMR Floyd R1–R6 (desarrollado como Reboot)

**Versión 1.0 · 9-nov-2026 · aplica idénticamente a ChatGPT, Claude y cualquier agente.** Sustituye a Floyd para toda valoración nueva. Floyd (`CONTRATO_EJECUCION_FLOYD.md`) solo rige mientras se mantienen UBER y CMG hasta reconfigurarlos, y CELH queda en reconfiguración. Todo lo anterior al 9-nov-2026 está en `Modelo-JMR-datos/archivo-v1/` y **no es insumo** de ninguna revisión nueva.

## Filosofía
Método Damodaran: **historias → números**. Cada supuesto material nace de una historia sobre el negocio (mercado, ventaja competitiva, reinversión, riesgo), se justifica con evidencia y contraevidencia, y se traduce a una celda de entrada. Los supuestos los elige la IA con criterio propio y fuentes; las fórmulas calculan. Nunca se sustituye una fórmula por un número.

## Los artefactos por empresa (seis archivos)
| Artefacto | Qué contiene | Quién escribe |
|---|---|---|
| **LIBRO HISTÓRICOS** (H) | Formato original de Income Statement, Balance Sheet, Cash Flow Statement, Trailing Valuation, Dividendos, Márgenes, Eficiencia de capital, Salud Financiera y Por acción (diez FY + LTM), más Entradas históricas auxiliares, `Fuentes y clasificación` y `Guía y empresa`. Solo los tres estados y las auxiliares son entradas; **todo lo demás se calcula por fórmulas** del libro. | IA (datos primarios) |
| **LIBRO DCF Base / Conservadora / Optimista** (D-B, D-C, D-O) | Tres copias del **fcffsimpleginzu original de Damodaran, sin cambiar fórmulas, comentarios ni disposición**. Cada libro es una historia, 100 % viva. La IA escribe solo celdas de entrada de `Input sheet`, ya sea con valores tomados de H o directamente. D-B suma `Presentación` y `Resumen de valoraciones`, hojas nuevas que no alteran el motor. | IA solo en entradas |
| **LIBRO MÚLTIPLOS** (M) | Sistema de múltiplos JMR de la versión anterior (Atlas): EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF, `Financials Multiples`, `Descuento de múltiplos` y sensibilidad por múltiplo. **Sin P/S ni P/BV.** Se alimenta de los mismos supuestos de la Base de DCF y de los estados de H. | IA solo en entradas |
| **ANÁLISIS** (A) | Un Google Doc: Nivel 1 (14 capítulos) + Nivel 2 (12 apartados), con cifras de H, D y M de la misma revisión. | IA |

Las plantillas maestras oficiales de Floyd R1–R6 viven en `Drive → Modelo JMR → Plantillas Modelo JMR Floyd (R1–R6)` (carpeta `1fFlAbKsdMKfjPB_nPcc6Y-9hQ7tQj14t`). Se **copian** por revisión a `Modelo JMR/Análisis/<TICKER>`; nunca se escribe sobre una plantilla.

| Plantilla | ID | Estado 9-nov-2026 |
|---|---|---|
| 01 LIBRO HISTÓRICOS | `1DWY01fy7Zikb-MTY8ycoCTAVEncqKdjJefQEPWh6n08` | **Lista.** Hojas originales sin referencias externas ni errores. Único cambio: el encabezado A1/D1 de cada hoja apunta a `Guía y empresa` en vez de `Input sheet`. |
| 02 LIBRO DCF (fcffsimpleginzu original) | `1nh7V0GW-ZWZMRdIbGW_fGtlcAb5qQd6uuNXEUKQ8iOA` | **Motor listo y verificado** contra `fcffsimpleginzu.xlsx` (17 hojas, 1 297 fórmulas, 76 comentarios, 0 diferencias reales). Se copia tal cual para Conservadora y Optimista. |
| 02b LIBRO DCF BASE | `1w51-vAGJS2_2CHuGv24124wiQixB8a9D62Pt3NWloxE` | **Lista.** Es la 02 más dos hojas nuevas al inicio: `Presentación` (solo fórmulas, sin imágenes) y `Resumen de valoraciones` (entradas amarillas cargadas por script con huella desde D-C, D-O y M; precio, DCF Base, MOS 35 %, esperado, cinco múltiplos con pesos y siete controles de conciliación). Las 17 hojas del motor se re-verificaron sin cambios. Se copia para la historia Base. |
| 03 LIBRO MÚLTIPLOS | `1J1wpGYvTpMozhCy3YSM-IO3BbXM7B5c0lZtRj6dyZWU` | **Lista.** Versión anterior (Atlas) con cinco múltiplos, sin P/S ni P/BV: 16 hojas, mismas fórmulas que el respaldo (0 errores, 0 referencias rotas). Cambios: hoja nueva `Entradas desde DCF` (reemplaza las referencias a DCF x y CoC x), `Supuestos y control` sin Disrupción, costo de deuda en modo MANUAL y compuerta B60 reducida, `Puente EEFF` sin conversores de I+D/arrendamientos/normalizador. Los estados de M se cargan desde H por etiqueta (la fila «Other Operating Expenses» solo existe en H). Corregido un error heredado: `POCF!B56` comparaba la sensibilidad central con la fila de la Optimista. |
| 04 ANÁLISIS | `13TJsT-I5bieP-tgvYYo6N_QG5O-seUHUxYC7KzGEF6A` (Floyd, provisional) | Pendiente de adaptar. |

## Flujo de datos (sin `IMPORTRANGE`)
`H → D-B/D-C/D-O`: entradas del `Input sheet` desde H (FY, LTM, deuda, caja, acciones…) o escritas directamente. `H → M`: estados de los que `Financials Multiples` proyecta. `D-B → M`: supuestos de la Base (crecimiento, márgenes, tasa, costo de capital, acciones). `M, D-C, D-O → D-B`: resultados finales hacia `Resumen de valoraciones`. Cada traspaso es una carga por script con huella SHA-256 y control posterior. Los libros D no se modifican entre sí; las tres historias comparten WACC y se concilian en el resumen.

## Seis fases · orden invariable
| Fase | Operación | Salida |
|---|---|---|
| **R1 · Corte e identidad** | Ticker, clase, moneda, escala, último FY, LTM, cotización fechada; idoneidad FCFF (financieras/holdings → excepción FCFE/SOTP); tasa libre y ERP vigentes; copiar las plantillas Floyd R1–R6 (H, tres D, M, A). | CANDIDATO, URLs de los seis archivos |
| **R2 · Históricos** | Llenar H con fuentes primarias, clasificar partidas, conciliar balance, EBIT, caja y LTM; ratios por fórmulas. | CANDIDATO, H conciliado |
| **R3 · Historias y DCF** | Tres historias con probabilidades, WACC común y fracaso solo en Conservadora; una copia del fcffsimpleginzu original por historia; entradas desde H o directas; **MOS 35 % solo sobre Base**. DCF inverso y sensibilidades 5×5 por corridas del motor original. | CANDIDATO, tres D calculados |
| **R4 · Múltiplos y resumen** | Cargar H→M y los supuestos de D-B→M; múltiplos de salida y pesos justificados (cinco múltiplos, sin P/S ni P/BV); `Presentación` y `Resumen de valoraciones` en D-B con los resultados de M, D-C y D-O. | CANDIDATO, M y Resumen |
| **R5 · Análisis y publicación** | Escribir A (14 + 12); JSON de valoración y de análisis; validadores; publicar `EN_REVISION` solo con controles aprobados. | `EN_REVISION` o CANDIDATO |
| **R6 · Auditoría independiente** | Otra sesión/agente recalcula tesis, supuestos, fuentes y materialidad. No se autocertifica. | `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE` |

«Valora y analiza X» = R1→R5 en orden, retomando lo existente. «Fase N» = solo esa fase. «Continúa» = primer control realmente pendiente. R6 siempre es otra sesión.

## Contrato de datos
`Modelo-JMR-datos/valoraciones/<REV>.json` y `analisis/<TICKER>-research-<REV>.json` (misma revisión):
```json
{
  "ticker": "<TICKER>", "revisionId": "<REV>",
  "perfil_valoracion": "Floyd", "contratoLibros": "jmr-reboot-3libros-v1",
  "libros": {
    "historicos": "https://docs.google.com/spreadsheets/d/<ID_H>/edit",
    "dcf": {
      "base": "https://docs.google.com/spreadsheets/d/<ID_DB>/edit",
      "conservadora": "https://docs.google.com/spreadsheets/d/<ID_DC>/edit",
      "optimista": "https://docs.google.com/spreadsheets/d/<ID_DO>/edit"
    },
    "multiplos": "https://docs.google.com/spreadsheets/d/<ID_M>/edit",
    "analisis": "https://docs.google.com/document/d/<ID_A>/edit"
  },
  "estado": "EN_REVISION"
}
```
Los seis IDs son distintos; `hojaGoogle` y `sheet_id` apuntan al **LIBRO DCF Base**. Una ficha tiene siete pestañas y lee: estados y ratios históricos de H, valoración y sensibilidad de D, múltiplos de M y análisis de A. Sin un libro no se sustituye silenciosamente por otro.

**Compuerta de integración:** la app debe identificar esta arquitectura por `contratoLibros=jmr-reboot-3libros-v1`, y admitir el alias `perfil_valoracion=Floyd (o alias histórico Reboot)` de las revisiones ya creadas. El viejo Floyd usa `floyd-h1-h2-separados-v1`. La integración en ramas candidatas/preview no equivale a publicación: se exige CI, JSON↔catálogo↔app y pruebas económicas para cambiar CANDIDATO a EN_REVISION.

## Criterio propio y decisiones de método (todos los agentes)
Los supuestos y el **tratamiento contable-económico de cada partida** los decide el agente con criterio propio, respaldado por fuente primaria; no se hereda una decisión anterior si el documento fuente la contradice. Si una instrucción o decisión previa (del usuario, de otra fase o de otro agente) lleva a un error económico (p. ej. doble cuenta, partida que no es deuda ni caja, flujo distorsionado), el agente **la corrige y lo declara**, no la ejecuta a ciegas. Ejemplo canónico: MELI-REBOOT-3T26-R1, donde el fondeo del crédito no se resta como deuda porque el EBIT ya descuenta su costo (10-Q 3T-2026).
Cada decisión de este tipo debe dejar, en la entrega de la fase y en `salvedades` del JSON: (1) **qué cambió** frente a lo acordado o a la plantilla; (2) **por qué**, con la fuente primaria (documento, nota, página); (3) **cuánto mueve el valor**, en cifras (con y sin el cambio, por acción); (4) **que la audita R6**. Aplica igual a ChatGPT, Claude y Gemini. No se oculta ni se aplica en silencio, y no cambia fórmulas del motor, ni el MOS de 35 % sobre la Base, ni las reglas de publicación. Si el cambio contradice una decisión explícita del usuario y el efecto es material, se informa al usuario en la misma respuesta.

## Entregas y continuidad
Cada fase escribe `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` (R1–R6) con: ticker, revisión, corte, fecha, agente/modelo/esfuerzo reales, IDs de los seis archivos, fuente/celda de cada material, `PASOS n/n`, `AISLAMIENTO=OK` solo verificado, controles `APROBADO/PARCIAL/NO_EJECUTADO`, commits/PR, faltantes y siguiente paso exacto. El sucesor lee catálogo, expediente y entregas antes de editar; no recrea libros.

## Puerta de publicación
1. **Hojas:** H, los tres D y M distintos, con fuente y corte rastreables; fórmulas y huella del motor intactas.
2. **Economía:** tres historias que suman 100 %, Conservadora ≤ Base ≤ Optimista, MOS = 0,65 × DCF Base, esperado y múltiplos separados, N/A y N/D justificados.
3. **Análisis:** Nivel 1 y 2 de esa revisión y con las cifras de los libros, sin resúmenes genéricos.
4. **Integración:** hoja ↔ JSON ↔ catálogo ↔ app, `validar_catalogo` y pruebas oficiales. CI verde no prueba R6.
5. Si falla un control material, avanzar lo independiente como CANDIDATO y no publicar. Las revisiones anteriores se archivan, no se borran.

## Honestidad
No declarar controles no ejecutados. La diferencia entre herramientas disponibles (GitHub, Drive, SEC) es capacidad del entorno, no del método: registrar `NO_EJECUTADO` y la alternativa probada.
