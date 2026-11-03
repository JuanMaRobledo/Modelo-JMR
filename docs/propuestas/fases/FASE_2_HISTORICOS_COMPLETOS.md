# Fase 2 · Históricos financieros completos y verificables
**Versión:** JMR cinco fases, 2-nov-2026. **Estado de salida:** `CANDIDATO_HISTORICOS_COMPLETOS`. No reemplaza ni publica el DCF provisional de Fase 1 por sí sola.

## Objetivo
Obtener los datos históricos completos, **hasta diez años + LTM** cuando existan, en los tres estados financieros; reconstruir con trazabilidad el detalle que falta para estudiar tendencias, ROIC, reinversión, márgenes y múltiplos. Para IPO/emisores nuevos o Colombia justificar cobertura más corta. Las razones se calculan **con fórmulas nativas**, no como números pegados.

## Pasos
1. Recuperar `FASE_1_ENTREGA.md`, hoja y fuentes, sin recalcular supuestos ni copiar otras revisiones.
2. Cargar resultados, balance, flujos e indicadores auxiliares FY y LTM con `dato | período | USD/COP y escala | fuente primaria URL/nota | celda | clasificación contable`. Registrar FY previo y comparativos trimestrales usados en LTM. No contar dos veces inventarios, ROU/leases, deuda, diferidos y CAPEX bruto/neto.
3. Clasificar cada partida en **publicada separadamente / incluida en otra partida / no aplicable / no verificada**. SG&A, costos, I+D, D&A, SBC, arrendamientos, deuda, CFO/CFI/CFF y caja: no declarar `0` a conceptos no desglosados. Conciliar EBIT, net income, CFO, inversiones, deuda y balance para cada ejercicio.
4. Obtener precios FY históricos fechados (ajustados por splits) y acciones comparables para `Trailing Valuation` y anclas de múltiplos, sin precio del presente sobre beneficios de otra época. ROIC, ROE, ROA, márgenes, crecimiento y ratios se calculan mediante fórmulas. Verificar dos períodos con cálculos independientes y el LTM.
5. Ejecutar `estados_completos.py`, `auditar_estados_sec.py`/NIIF, `auditar_ceros_materiales.py`, `diff_formulas_plantilla.py` y controles de integridad disponibles o registrar la prueba equivalente y sus límites. Un test automático limpio no reemplaza la comparación de rubros SEC/NIIF.
6. Registrar el impacto sobre los supuestos iniciales y anclas: `valor provisional fase 1` vs nuevos datos (sin modificar por reflejo el escenario sin la revisión económica de F3). Guardar `FASE_2_ENTREGA.md` con datos faltantes, causas y materialidad.

**Puerta:** el dato material pendiente bloquea cálculos dependientes y la eventual publicación, pero puede continuar la revisión de Fase 3 como CANDIDATO con reservas exactas. **Prohibido:** valorar por múltiplos con impuestos mal signados o números de otra empresa; publicar; completar faltantes con cero.
