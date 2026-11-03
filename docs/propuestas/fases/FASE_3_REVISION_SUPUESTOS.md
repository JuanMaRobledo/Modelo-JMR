# Fase 3 · Prueba económica de supuestos y valoración revisada
**Versión:** JMR cinco fases, 2-nov-2026. **Estado de salida:** `CANDIDATO_REVISADO`. Sin publicación ni auditoría final.
**Insumos:** FASE_1 y FASE_2, hoja oficial, reportes primarios y método A-1.2.

## Pregunta central
¿Son lógicos y están respaldados **crecimiento, márgenes, reinversión/Sales-to-Capital, ROIC, WACC y valor terminal** dada la historia verificada y el ciclo del negocio? La respuesta puede ser `MANTENER`, `CAMBIAR` o `RESERVA DOCUMENTADA`. No se recalibra a la cotización.

## Pruebas y decisiones
1. Contrastar el crecimiento 1–5 y 6–10 contra FY, LTM, segmentos, sector, reinversión y vida corporativa de Damodaran. Explicar la desaceleración.
2. Margen EBIT GAAP vs ajustado (I+D y leases) frente a economía y competencia; justificar trayectoria y escenario, sin mezclar definiciones.
3. **Reinversión:** conciliación CAPEX, D&A, cambio NWC, adquisiciones y activos intangibles/I+D; capital invertido ajustado; Sales-to-Capital marginal 1–5 y convergencia industrial 6–10; lag de inversiones y retorno incremental. Comprobar flujos negativos, reinversión/NOPAT, ventas por unidad de capital y shocks razonables, no asumir que atípicos son automáticamente errores.
4. **ROIC:** contable, ajustado, marginal y terminal; dinámica a 10 años, ventajas duraderas, ROIC vs WACC y reinversión sostenible g/ROIC, sin salto inexplicado al terminal.
5. WACC/Ke: beta, riesgo país, deuda y leases sin duplicación, ERP y Rf de cortes coherentes; g terminal ≤ Rf y WACC > g; opciones/SBC, NCI y activos no operativos controlados en EV–equity.
6. Múltiplos: cinco prioritarios aplicables, calidad de FCFF/FCFE/beneficios y normalizaciones, ancla de ciclo y descuento FY+1/2/3; matrices Base, centros vs valores oficiales. P/S/P/BV no bloqueantes sin peso.
7. Someter Base/Conservadora/Optimista/Disrupción a sensibilidad DCF 5×5, DCF inverso, tasas, márgenes, ROIC, S/C e impacto de ajustes materiales; comparar F1→F3 de forma reproducible.
8. Emitir `FASE_3_ENTREGA.md` con **tabla cambio | motivo económico | evidencia | celda | valor anterior/nuevo | impacto DCF Base y MOS | tests ejecutados**, anclas, rutas, fallos y estado. No tocar fórmulas estructurales salvo mantenimiento separado y regresión, no escribir resultados calculados.
9. Verificar gates financieros completos para la promoción de F4: `controles_todas.sh`, 18 candados, fórmula/selector, conciliación hoja–motor–JSON y datos materiales. Si hay bloqueo, no declarar READY.

**Puerta:** F4 solo publica si controles de promoción pasan y todos los errores materiales están resueltos, pero puede redactarse el artículo sin publicar en condición CANDIDATO. La F5 conserva auditoría independiente guiada por el usuario.
