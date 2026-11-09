# Contrato único · Modelo JMR Reboot

**Versión 1.0 · 9-nov-2026 · aplica idénticamente a ChatGPT, Claude y cualquier agente.** Sustituye a Floyd para toda valoración nueva. Floyd (`CONTRATO_EJECUCION_FLOYD.md`) solo rige mientras se mantienen UBER y CMG hasta reconfigurarlos, y CELH queda en reconfiguración. Todo lo anterior al 9-nov-2026 está en `Modelo-JMR-datos/archivo-v1/` y **no es insumo** de ninguna revisión nueva.

## Filosofía
Método Damodaran: **historias → números**. Cada supuesto material nace de una historia sobre el negocio (mercado, ventaja competitiva, reinversión, riesgo), se justifica con evidencia y contraevidencia, y se traduce a una celda de entrada. Los supuestos los elige la IA con criterio propio y fuentes; las fórmulas calculan. Nunca se sustituye una fórmula por un número.

## Los cuatro artefactos por empresa
| Artefacto | Qué contiene | Quién escribe |
|---|---|---|
| **LIBRO HISTÓRICOS** (H) | Estados financieros, salud financiera, eficiencia, márgenes, dividendos y por acción, hasta diez FY + LTM, con el **formato ya establecido** (no se rediseña) y fuente por partida. | IA (datos primarios) + fórmulas de ratios |
| **LIBRO DCF** (D) | Damodaran **Simple Ginzu FCFF** íntegro, hoja `Presentación` primera, hoja **`Resumen de valoraciones`**, tres historias, DCF inverso y sensibilidades 5×5. | IA solo en celdas de entrada |
| **LIBRO MÚLTIPLOS** (M) | Sistema de múltiplos original JMR: EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF (núcleo) y P/S, P/BV (opcionales), descuento de múltiplos y sensibilidad por múltiplo. | IA solo en celdas de entrada |
| **ANÁLISIS** (A) | Un Google Doc: Nivel 1 (14 capítulos) + Nivel 2 (12 apartados), con cifras de D, M y H de la misma revisión. | IA |

Las plantillas maestras viven en `Drive → Modelo JMR → Plantillas Reboot` (tres libros y un documento). Se **copian** por revisión a `Modelo JMR/Análisis/<TICKER>`; nunca se escribe sobre una plantilla. Hasta que existan las plantillas Reboot (etapa 2 del plan), una revisión no puede pasar de CANDIDATO.

## Flujo de datos (unidireccional, sin ciclos)
`H → D`: snapshot FY-2/FY-1/FY/LTM. `H → M`: snapshot de las series que usan los múltiplos. `M → D`: valores finales por método hacia la hoja `Resumen de valoraciones`. Cada traspaso es una carga por script con huella SHA-256 de origen y destino y control de integridad posterior; **sin `IMPORTRANGE`** salvo decisión escrita del usuario. D nunca escribe en H ni en M. Las historias son comunes: los supuestos de M deben ser coherentes con la Base de D y la diferencia se concilia y se explica en R4.

## Seis fases · orden invariable
| Fase | Operación | Salida |
|---|---|---|
| **R1 · Corte e identidad** | Ticker, clase, moneda, escala, último FY, LTM, cotización fechada; idoneidad FCFF (financieras/holdings → excepción FCFE/SOTP); tasa libre y ERP vigentes; copiar las plantillas Reboot. | CANDIDATO, URLs de los cuatro artefactos |
| **R2 · Históricos** | Llenar H con fuentes primarias, clasificar partidas, conciliar balance, EBIT, caja y LTM; ratios por fórmulas. | CANDIDATO, H conciliado |
| **R3 · Historias y DCF** | Tres historias (Conservadora, Base, Optimista) con probabilidades, WACC común, fracaso solo en Conservadora; cargar snapshot H→D; DCF, DCF inverso, sensibilidades; **MOS 35 % solo sobre Base**. | CANDIDATO, D calculado |
| **R4 · Múltiplos y resumen** | Cargar H→M; supuestos y múltiplos de salida por historia; pesos justificados por tipo de empresa; traspaso M→D y hoja `Resumen de valoraciones`; conciliar contra la Base. | CANDIDATO, M y Resumen |
| **R5 · Análisis y publicación** | Escribir A (14 + 12); JSON de valoración y de análisis; validadores; publicar `EN_REVISION` solo con controles aprobados. | `EN_REVISION` o CANDIDATO |
| **R6 · Auditoría independiente** | Otra sesión/agente recalcula tesis, supuestos, fuentes y materialidad. No se autocertifica. | `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE` |

«Valora y analiza X» = R1→R5 en orden, retomando lo existente. «Fase N» = solo esa fase. «Continúa» = primer control realmente pendiente. R6 siempre es otra sesión.

## Contrato de datos
`Modelo-JMR-datos/valoraciones/<REV>.json` y `analisis/<TICKER>-research-<REV>.json` (misma revisión):
```json
{
  "ticker": "<TICKER>", "revisionId": "<REV>",
  "perfil_valoracion": "Reboot", "contratoLibros": "jmr-reboot-3libros-v1",
  "libros": {
    "historicos": "https://docs.google.com/spreadsheets/d/<ID_H>/edit",
    "dcf": "https://docs.google.com/spreadsheets/d/<ID_D>/edit",
    "multiplos": "https://docs.google.com/spreadsheets/d/<ID_M>/edit",
    "analisis": "https://docs.google.com/document/d/<ID_A>/edit"
  },
  "estado": "EN_REVISION"
}
```
Los cuatro IDs son distintos; `hojaGoogle` y `sheet_id` apuntan al **LIBRO DCF**. Una ficha tiene siete pestañas y lee: estados y ratios históricos de H, valoración y sensibilidad de D, múltiplos de M y análisis de A. Sin un libro no se sustituye silenciosamente por otro.

**Integración pendiente de código:** la app, `lib/model-sheet.js` y los validadores aún conocen `floyd-h1-h2-separados-v1`. Hasta ajustarlos (etapa 3), una revisión Reboot no puede declararse publicada en la app; se deja como CANDIDATO con ese bloqueo registrado.

## Entregas y continuidad
Cada fase escribe `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` (R1–R6) con: ticker, revisión, corte, fecha, agente/modelo/esfuerzo reales, IDs de los cuatro artefactos, fuente/celda de cada material, `PASOS n/n`, `AISLAMIENTO=OK` solo verificado, controles `APROBADO/PARCIAL/NO_EJECUTADO`, commits/PR, faltantes y siguiente paso exacto. El sucesor lee catálogo, expediente y entregas antes de editar; no recrea libros.

## Puerta de publicación
1. **Hojas:** H, D y M distintos, con fuente y corte rastreables; fórmulas y huella del motor intactas.
2. **Economía:** tres historias que suman 100 %, Conservadora ≤ Base ≤ Optimista, MOS = 0,65 × DCF Base, esperado y múltiplos separados, N/A y N/D justificados.
3. **Análisis:** Nivel 1 y 2 de esa revisión y con las cifras de los libros, sin resúmenes genéricos.
4. **Integración:** hoja ↔ JSON ↔ catálogo ↔ app, `validar_catalogo` y pruebas oficiales. CI verde no prueba R6.
5. Si falla un control material, avanzar lo independiente como CANDIDATO y no publicar. Las revisiones anteriores se archivan, no se borran.

## Honestidad
No declarar controles no ejecutados. La diferencia entre herramientas disponibles (GitHub, Drive, SEC) es capacidad del entorno, no del método: registrar `NO_EJECUTADO` y la alternativa probada.
