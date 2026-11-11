# BORRADOR · Contrato Floyd R1–R6 con libro único (`floyd-libro-unico-v1`)

**Estado: BORRADOR para revisión. No sustituye aún a `CONTRATO_REBOOT_JMR.md`.** Se activa solo cuando la plantilla «libro único» esté validada y los PR de app, motor y datos aprobados. Mientras tanto rige `jmr-reboot-3libros-v1`.

## 1 · Artefactos (dos por revisión)
| Artefacto | Contenido | Quién escribe |
|---|---|---|
| **LIBRO ÚNICO** | 83 pestañas: Presentación · Guía del libro · Resumen de valoraciones · Sensibilidades DCF; **Históricos (H)** 12 pestañas; **Motor Base** 17 (fcffsimpleginzu, nombres originales); **Motor Conservadora** 17 (`… · C`); **Motor Optimista** 17 (`… · O`); **Múltiplos (M)** 16 (`M · …` en las 5 que chocan con H) | IA solo en entradas (ver §3) |
| **ANÁLISIS** | Google Doc: Nivel 1 (14 capítulos) + Nivel 2 (12 apartados) | IA |
Plantilla oficial: `Plantillas Modelo JMR Floyd (R1–R6)` → «PLANTILLA · JMR Floyd · LIBRO ÚNICO» (candidata validada: `1T1Cs2HGlVSe5_5OwqGGQvsN1k1KJaweXZEUM3HGttKk`; se publica al aprobar este contrato). Requiere cálculo iterativo activado (100 iteraciones, 1e‑6) y sin IMPORTRANGE. Se **copia** por revisión; nunca se escribe sobre ella.

## 2 · Flujo de datos (todo por fórmulas entre pestañas; sin scripts ni IMPORTRANGE)
H → `Input sheet` de los tres motores —**todas** las cifras de la empresa— (ingresos, EBIT, intereses, patrimonio total, deuda, caja, precio, I+D, **tasa efectiva, acciones, minoritarios, activos no operativos, opciones**) · H → estados de M (por etiqueta) · motores → `Entradas desde DCF` de M · motores y M → `Resumen` → `Presentación`. Un cambio en H se propaga solo; no existen vínculos «obsoletos» entre archivos.

## 3 · Reparto del trabajo de la IA (sin cambios de fondo)
1. **Históricos:** tres estados (10 FY + LTM), auxiliares y el bloque «Datos del emisor para la valoración» de `Entradas históricas auxiliares` (filas 34–39: minoritarios redimibles, acciones por RSU/PSU, activos no operativos, opciones). Cada cifra con fuente en `Fuentes y clasificación`.
2. **Supuestos:** solo celdas de entrada del `Input sheet` de cada motor que **no** provienen de H (crecimiento, márgenes, ventas/capital, ROIC terminal y sus selectores), multiplicadores y pesos de M, probabilidades.
3. **Análisis:** el Doc A.
Todo lo demás lo calculan las fórmulas.

## 4 · Protección
No editar fórmulas, selectores, validaciones ni comentarios del motor. **Las pestañas `· C` y `· O` son duplicados del Base con el nombre de hoja reapuntado; la lógica es idéntica y se regenera con `scripts/floyd_libro_unico/construir.py`, nunca a mano.** Las filas de M cableadas a H y las celdas del `Input sheet` con fórmula hacia H no se sobrescriben con números.
Sensibilidades 5×5 y DCF inverso: corridas del motor sobre una **copia** del libro; sus valores son estáticos y la hoja marca «Matriz OBSOLETA» si cambia cualquier supuesto.

## 5 · Datos (JSON)
```json
{ "ticker": "<T>", "revisionId": "<REV>", "perfil_valoracion": "Floyd", "contratoLibros": "floyd-libro-unico-v1",
  "libros": { "unico": "https://docs.google.com/spreadsheets/d/<ID>/edit", "analisis": "https://docs.google.com/document/d/<ID_A>/edit" },
  "hojaGoogle": "<misma URL que libros.unico>", "sheet_id": "<ID>", "estado": "EN_REVISION" }
```
La app identifica la arquitectura por `contratoLibros`; `libros.unico` (o `hojaGoogle`) sirve para los tres tipos de libro (históricos, valoración, múltiplos). `contratoLibros="jmr-reboot-3libros-v1"` sigue leyéndose para las revisiones heredadas.

## 6 · Fases
R1 copiar la plantilla única y el Doc A, registrar los dos IDs · R2 llenar H (incluido el bloque del emisor) y conciliar · R3 supuestos de las tres historias en sus `Input sheet`; sensibilidades y DCF inverso por corridas del motor en copia · R4 multiplicadores/pesos de M; `Resumen` y `Presentación` ya están conciliados por fórmula · R5 análisis, JSON, catálogo, validadores, app · R6 auditoría independiente.
**Puerta de publicación:** igual que el contrato vigente, con «dos URL válidas y distintas», verificación de que ninguna celda cableada fue sobrescrita y `verificar.py` (equivalencia con la plantilla) sin diferencias en motores.

## 7 · Migración de revisiones existentes
UBER, CMG, MELI, MSFT y AAPL **no se migran automáticamente**: siguen en `jmr-reboot-3libros-v1`. UBER y CMG tienen prototipos de libro único verificados (0 diferencias en motores, M y H); su adopción es una decisión por revisión. MELI (SOTP/fintech) queda fuera de las reglas por etiqueta actuales.
