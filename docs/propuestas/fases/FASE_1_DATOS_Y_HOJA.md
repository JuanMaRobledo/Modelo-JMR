# Fase 1 · Datos y hoja

**Invocación:** «Empieza el análisis de <TICKER> en fase 1». **Estado de salida:** `CANDIDATO`. **No** estima supuestos, **no** valora, **no** escribe análisis.

**Modelo recomendado (no normativo; ver [README](README.md)):** Claude Sonnet medio · ChatGPT (chat). Declarar en la entrega el modelo y esfuerzo realmente usados.

## Objetivo
Dejar una copia limpia de la plantilla vigente con estados completos, corte de mercado coherente y un inventario de insumos donde cada cifra tenga fuente.


**Emisor colombiano:** fuentes NIIF (Superfinanciera/SIMEV y estados de la emisora), precio en COP de la BVC, tasa libre y prima en la moneda del modelo según `colombia-nucleo-v1.md`; en Claude Code, scripts de la habilidad `valoracion-colombia` (`co_datos_niif.py`, `co_completar_estados.py`, `moneda_cop.py`).

## Pasos
0. **Firewall de aislamiento.** Antes de leer nada, declarar el ticker y no mezclar cifras, textos ni supuestos de otras empresas (`AISLAMIENTO=OK` al cierre).
1. **Identidad y método.** Ticker, emisor, CIK/regulador, clase de acción, moneda, calendario fiscal. Clasificar: operativa (FCFF/WACC), financiera (FCFE/Ke con capital regulatorio) u holding (SOTP). Método `A-1.2` salvo elección expresa de B. Operación: `desde cero` o `actualizar`. Asignar `<REV>` = `<TICKER>-<AAAAMMDD>-A12-R<n>` (consultar `catalogo.json` y `candidatos/` para no repetir).
2. **Fuentes primarias.** Último 10-K/20-F y 10-Q/6-K de estados, y **todos** los 8-K/6-K hasta hoy (`scripts/novedades_sec.py`). Hechos posteriores al corte: listarlos con fecha.
3. **Corte de mercado de una misma fecha.** Documentar un corte específico de la revisión con precio de cierre sin ajuste, Treasury y prima coherentes. Si difiere de `reference/corte_vigente.json`, no bloquear ni actualizar automáticamente Cartera: mantener su registro intacto y documentar la diferencia. Buscar una prima fechada o un ajuste temporal justificado, con supuestos y sensibilidad explícitos; no etiquetar una aproximación como observación oficial. Consultar al usuario solo si hace falta cambiar el corte global sin autorización. Usar `scripts/datos_mercado.py` cuando sea viable y dejar fuentes y fechas por dato.
4. **Hoja.** Copia de `vigente.ia` (`reference/plantillas.json`) en `AAA Finanzas / Análisis / <TICKER>/`, compartida con la cuenta de servicio. Nunca en plantillas ni en la raíz.
5. **Estados completos.** Importador (`refresh_native_model.py`, o el específico NIIF) y completar a mano con nota por celda desde el informe primario. LTM = FY previo + acumulado actual − acumulado comparable. Balance UDM al último trimestre.
5b. **Auditoría de estados.** `scripts/auditar_estados_sec.py` (emisores SEC) o `scripts/auditar_estados_ifrs.py` (NIIF/IFRS) contra el informe primario.
6. **Calidad de resultados (solo detectar, no ajustar):** partidas no recurrentes, impuesto diferido o tasa efectiva anómala, cambios de perímetro, splits, preferentes, arrendamientos, SBC, capital regulatorio (bancos).
7. **Contexto externo (solo recoger, con fecha y fuente):** noticias y consenso de analistas, pares comparables y datos sectoriales de Damodaran (`reference/damodaran/`, `damodaran_ventas_capital_sector_2026-01.json`), y la visión externa de la historia del negocio (capítulo 3B del análisis).
8. **Inventario de insumos:** tabla `dato | valor | período | escala | documento/URL | página o nota | celda`.

## Controles de cierre (todos deben cumplirse para `CERRADA`)
- `python3 scripts/estados_completos.py <TICKER>` → 0 hallazgos.
- `python3 scripts/diff_formulas_plantilla.py --sheet-id <ID> [--excepciones reference/excepciones_formulas/<TICKER>.json]` → 0 no declarados.
- `python3 scripts/ubicacion_hoja.py <TICKER> --sheet-id <ID>` → ubicación OK: la hoja vive en `Análisis/<TICKER>/` (REGLAS §11). Una carpeta con el nombre del ticker dentro de un archivo histórico no cumple: si `Análisis/<TICKER>` no existe, se crea (caso AMZN-20261102-A12-R2, 2-nov-2026).
- Precio, Treasury y prima con la misma fecha (o ajuste documentado).
- Cada cifra del inventario verificada contra su documento (no de memoria).
- `python3 scripts/inputs_completos.py <TICKER>` y `scripts/candados.py <TICKER>`: se informan tal cual; las entradas pendientes de fase 2 no bloquean la fase 1 pero quedan listadas en «Pendiente».
- Registro del corte: si se aplica un corte, `corte_vigente.json`, `cartera_drive.json` y las anclas de `multiplos_v3` deben apuntar a la hoja vigente (el catálogo manda: `hoja_de()` resuelve por `catalogo.json`).
- Aislamiento: ninguna cifra, texto o supuesto de otra empresa.

## Entrega
`FASE_1_ENTREGA.md` (formato del README), la hoja, y en «Para la fase siguiente»: sheet_id, corte, clasificación del método, banderas de calidad de resultados y hechos posteriores.

## Cierre operativo y continuidad
Aplicar «Continuidad y cierre operativo» del README: intentar scripts oficiales y, si no son viables, documentar comprobaciones equivalentes con alcance y tolerancia; registrar lo no cubierto. Datos disponibles y fórmulas verificables permiten continuar a fase 2 como CANDIDATO aunque queden automatizaciones pendientes. No marcar aprobados controles no realizados ni inventar datos para cumplir mínimos.
