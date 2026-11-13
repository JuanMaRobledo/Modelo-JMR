# Referencias oficiales de Damodaran

Copias de referencia (no editar) en `AAA Finanzas/MODELO JMR V2.0/PLANTILLAS`, descargadas de la web de Stern NYU el 13-nov-2026.

| Perfil | Archivo | Hojas relevantes | Verificado |
|---|---|---|---|
| Operativas | `fcffsimpleginzu.xlsx` | Input sheet, Valuation output | paridad 8 casos |
| Bancos/aseguradoras | `divginzu.xlsx` | Inputs, Valuation Output | paridad 9 casos |
| Bancos/aseguradoras | `eqexret.xls` | Inputs, Normalized Earnings, Excess Return Valuation | paridad 11 casos (copia convertida a xlsx) |
| Holdings | `illGE.xlsx` | SOTP Valuation | paridad 9 casos (modo réplica) |
| Holdings | `ill16p6.xls` | DCF valuation, EVEBITDA multiple | solo DCF + múltiplo; **no** es una suma de partes |
| Alto crecimiento | `higrowth.xls` | Input Sheet(assumtion), DCFValuation, Revenue Growth Numbers | paridad 14 casos (capex por sales-to-capital) |
| Alto crecimiento | `revgrowth.xls` | Market Share approach | paridad 3 casos |

Hallazgo: el libro `illGE` evalúa negocios con crecimiento ≥ costo de capital o NOPAT ≤ 0 (valores sin sentido económico). El motor JMR los rechaza; la réplica queda solo en modo de prueba.
