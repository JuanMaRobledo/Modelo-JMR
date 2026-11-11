# Plan de adopción del libro único (Floyd R1–R6)

| # | Paso | Dónde | Estado |
|---|---|---|---|
| 1 | Prototipos verificados (UBER, CMG) y `Input sheet` alimentado desde H | `JMR-valuation/scripts/floyd_libro_unico`, `Modelo-JMR-datos/mantenimiento/.../etapa2b` | hecho |
| 2 | Plantilla candidata «libro único» + validación con datos de UBER (`1T1Cs2HG…`); `Input sheet` 100 % desde H | Drive `02 Pruebas y desarrollo` | **hecho**: DCF y 5 múltiplos × 3 escenarios idénticos a UBER; ver `Modelo-JMR-datos/mantenimiento/.../etapa2b/PLANTILLA_UNICA.md` |
| 3 | Cambio de la app (contrato `floyd-libro-unico-v1`; `libros.unico` para los tres tipos de libro) | `lib/model-sheet.js`, `docs/model-sync.js`, `docs/expediente.js`, `docs/jmr-mos-summary.js` + 4 pruebas | **hecho en la rama** (214/214); sin QA visual (acceso con contraseña) |
| 4 | Contrato, órdenes, prompt maestro, `AGENTS.md`/`CLAUDE.md` (idénticos en los tres repos), habilidades `fase-jmr`/`analisis-nuevo`, `REGLAS_VIGENTES §0R.0` (v39) | `docs/CONTRATO_FLOYD_LIBRO_UNICO.md` | **hecho en la rama** (215/215 pruebas); vigente al fusionar |
| 5 | Validadores (`validar_catalogo.cjs`, `validar_entregas_floyd.py`) con el nuevo contrato: dos URL en lugar de seis | `Modelo-JMR-datos/scripts` | pendiente |
| 6 | Plantilla `04 LIBRO ÚNICO` publicada en `Plantillas Modelo JMR Floyd (R1–R6)`; 01, 02b y 03 archivadas en `90 Archivo histórico/Plantillas Reboot (seis libros)` (ID y enlaces intactos; la 02 queda como fuente del constructor) | Drive | **hecho (11-nov-2026)** |
| 7 | QA con sesión de solo lectura: ficha de UBER y CMG en libro único (siete pestañas, móvil) | app desplegada | **bloqueado por acceso** |
| 8 | Decidir migración por revisión (UBER, CMG primero) y generar su JSON `floyd-libro-unico-v1` | `valoraciones/`, `analisis/`, `catalogo.json` | pendiente |

**Compatibilidad:** el cambio de la app es aditivo; los contratos `jmr-reboot-3libros-v1` y `floyd-h1-h2-separados-v1` no se alteran (pruebas de regresión incluidas). **Alternativa transitoria sin tocar la app:** registrar la misma URL en `libros.historicos`, `libros.dcf.*` y `libros.multiplos` con el contrato actual; no recomendada (rompe «seis URL distintas»).
**Reversión:** el libro único no modifica los libros de producción; revertir es no migrar la revisión.
