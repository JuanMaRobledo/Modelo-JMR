# AFYA — Modelo JMR poblado y research fundamental (23-sep-2026)

| Archivo | Qué es |
|---|---|
| `Modelo_JMR_AFYA_2026-09-23.xlsx` | Plantilla Modelo JMR (copia de LULU) con todas las entradas reemplazadas por datos de Afya. Fórmulas del motor sin cambios. Se recalcula al abrir (Excel o al importar en Google Sheets). |
| `AFYA_Research_Fundamental_Modelo_JMR_2026-09-23.md` | Informe según el prompt maestro v4 (17 secciones) con auditoría del libro. |
| `scripts/` | Scripts que parchean el XML del .xlsx (conservan gráficos, imagen y validaciones) y documentan la fuente de cada cifra. |

Convenciones del libro: todo en **R$ millones**; el precio es `GOOGLEFINANCE(AFYA) × USDBRL` (valor de respaldo R$69,02 = US$13,49 × PTAX 5,1161 del 22-sep-2026). El motor calcula en R$, pero **«Resumen de Valoración» y «Presentación» se muestran en US$ por defecto**: selector `J2` (USD/BRL, lista desplegable) y tipo de cambio `L2` (= `Input sheet!G1`, GOOGLEFINANCE USDBRL en vivo; respaldo 5,1161). Tesis, Cualitativo y Estadísticas siguen en R$.

Resultados del Modelo JMR (R$/acción, conservador / base / optimista): DCF 46,34 / 64,52 / 77,88; ponderado 63,90 / 83,28 / 105,70 (US$12,49 / 16,28 / 20,66 a 5,1161). Advertencia: EV/EBITDA y EV/FCFF no restan deuda neta (~R$27,9 por acción), ver sección 5 del informe.
