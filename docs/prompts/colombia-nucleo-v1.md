# JMR Colombia · núcleo v1 (12-oct-2026) — leer ESTO primero

Versión compacta de `colombia-valuation-v1.md` y `colombia-research-v1.md` (55 KB cada uno). Los completos quedan para auditoría; si difieren, manda este núcleo y la regla r5 de esos archivos.

**Identidad.** Ticker local `.CL`, COP, BVC; cada emisora en su propio expediente; sin datos, supuestos ni rótulos de otra empresa (AISLAMIENTO = OK). Sin fallback a ADR.
**Corte.** Misma fecha que EE.UU.: cierres BVC, ERP implícita del mes + prima país, Rf COP = TES − spread soberano.
**Valor.** Principal = DCF Base intrínseco (RE/DDM o FCFE en bancos/aseguradoras; FCFF en industriales; SOTP intrínseco en holdings: cada filial por flujos, privadas a valores fechados). Esperado = Σ p × valor (informativo); precio con MOS = valor principal × (1 − 35%), sobre el DCF Base o el SOTP Base en holdings, nunca sobre el esperado. Múltiplos/SOTP de mercado/libro: secundarios (40% DCF + 60% múltiplos). Sin foso → retorno terminal = costo de capital. Con ROE = Ke el crecimiento terminal no crea valor.
**Historias.** Base, Conservadora, Optimista, Disrupción; 100%; Base primero; pre-mortem e indicadores.
**Múltiplos.** Tres anclas (historia propia, pares comparables, justificado); P/E y P/B en financieras; EV/EBITDA solo industriales; N/D si no hay comparables homogéneos (nunca cero).
**Horizontes.** Hoy y FY+3 ex-dividendo: P3 = (V0 − VP dividendos)(1+Ke)^3; mostrar ambos sin doble conteo.
**Entregables.** Valoración v4: 14 secciones (Resumen · Historia y visión externa · Datos · Supuestos y tasas · Historias · Múltiplos · Resultados · Intrínseco vs múltiplos · Sensibilidad · Log de cambios · El precio al final · Registro de decisión · Fuentes · Control de calidad), sin precio en el resumen. Research v5: 18 secciones del prompt internacional (Resumen ejecutivo … Control de calidad final).
**Cómo.** Cifras de la hoja con `JMR-valuation/scripts/co_lector.py`; informes con `co_informes_*.py`; controles `controles_todas.sh` (probabilidades, supuestos, consistencia, integridad y estados). Habilidad: `.claude/skills/valoracion-colombia`.
**Límites.** Datos de proveedor no certificados; la decisión de comprar o vender es del usuario; valor condicionado si NCI, caja libre o NAV privados no están probados.
