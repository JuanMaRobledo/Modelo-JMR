# Fase 1 · Datos y hoja

**Invocación:** «Empieza el análisis de <TICKER> en fase 1». **Estado de salida:** `CANDIDATO`. **No** estima supuestos, **no** valora, **no** escribe análisis.

## Objetivo
Dejar una copia limpia de la plantilla vigente con estados completos, corte de mercado coherente y un inventario de insumos donde cada cifra tenga fuente.


**Emisor colombiano:** fuentes NIIF (Superfinanciera/SIMEV y estados de la emisora), precio en COP de la BVC, tasa libre y prima en la moneda del modelo según `colombia-nucleo-v1.md`; en Claude Code, scripts de la habilidad `valoracion-colombia` (`co_datos_niif.py`, `co_completar_estados.py`, `moneda_cop.py`).

## Pasos
1. **Identidad y método.** Ticker, emisor, CIK/regulador, clase de acción, moneda, calendario fiscal. Clasificar: operativa (FCFF/WACC), financiera (FCFE/Ke con capital regulatorio) u holding (SOTP). Método `A-1.2` salvo elección expresa de B. Operación: `desde cero` o `actualizar`. Asignar `<REV>` = `<TICKER>-<AAAAMMDD>-A12-R<n>` (consultar `catalogo.json` y `candidatos/` para no repetir).
2. **Fuentes primarias.** Último 10-K/20-F y 10-Q/6-K de estados, y **todos** los 8-K/6-K hasta hoy (`scripts/novedades_sec.py`). Hechos posteriores al corte: listarlos con fecha.
3. **Corte de mercado de una misma fecha.** Precio de cierre (`auto_adjust=False`), Treasury 10 años del mismo día, prima madura de Damodaran (si la fecha difiere, ajustarla y documentar), prima país con su fecha (si la tabla oficial es antigua y hubo un evento, registrar el dato de mercado disponible con fuente). Una fecha, una fuente por dato.
4. **Hoja.** Copia de `vigente.ia` (`reference/plantillas.json`) en `AAA Finanzas / Análisis / <TICKER>/`, compartida con la cuenta de servicio. Nunca en plantillas ni en la raíz.
5. **Estados completos.** Importador (`refresh_native_model.py`, o el específico NIIF) y completar a mano con nota por celda desde el informe primario. LTM = FY previo + acumulado actual − acumulado comparable. Balance UDM al último trimestre.
6. **Calidad de resultados (solo detectar, no ajustar):** partidas no recurrentes, impuesto diferido o tasa efectiva anómala, cambios de perímetro, splits, preferentes, arrendamientos, SBC, capital regulatorio (bancos).
7. **Inventario de insumos:** tabla `dato | valor | período | escala | documento/URL | página o nota | celda`.

## Controles de cierre (todos deben cumplirse para `CERRADA`)
- `python3 scripts/estados_completos.py <TICKER>` → 0 hallazgos.
- `python3 scripts/diff_formulas_plantilla.py --sheet-id <ID> [--excepciones reference/excepciones_formulas/<TICKER>.json]` → 0 no declarados.
- Precio, Treasury y prima con la misma fecha (o ajuste documentado).
- Cada cifra del inventario verificada contra su documento (no de memoria).
- Aislamiento: ninguna cifra, texto o supuesto de otra empresa.

## Entrega
`FASE_1_ENTREGA.md` (formato del README), la hoja, y en «Para la fase siguiente»: sheet_id, corte, clasificación del método, banderas de calidad de resultados y hechos posteriores.
