# Ficha reutilizable: empresa, historia y supuestos — Damodaran–JMR

> Copiar **esta plantilla documental**, no la hoja Damodaran. La hoja se clona desde la maestra autorizada por ticker/revisión. **Fórmulas, notas y comentarios originales son intocables**. Las pruebas y derivaciones viven en auxiliares JMR.

## Identificación y fuentes

| Elemento | Completar |
|---|---|
| Emisor / ticker / tipo de negocio | |
| Corte financiero, precio fechado, moneda, unidad | |
| 10-K / 10-Q / anexos primarios | |
| Hoja oficial y copia de trabajo (IDs) | |
| Versión plantilla FCFF Damodaran y benchmark de integridad | |
| Método, escenarios y norma JMR vigente | |
| Autor/evaluador, fecha y revisión económica | |
| Estado: CANDIDATO / EN_REVISION / PUBLICADO | |

## 1. Historia **antes** de los números

**La empresa:** quién compra, qué problema resuelve y cuáles son sus alternativas.

**Motor de crecimiento:** unidades físicas (clientes/usuarios), retención, precios, productos, geografías y TAM. No inventar cuota si TAM desconocido.

**Ventaja competitiva:** evidencia de marca/red/escala/hábitos/producto, coste de cambio, duración estimada, pruebas de resiliencia y contraejemplos.

**Economía de la empresa madura:** estructura de costes, margen EBIT económico, inversión necesaria y por qué el ROI nuevo puede o no superar el WACC.

**Ciclo macro/competencia:** tipos de interés, moneda, crédito, regulación, IA, sentimiento (separado de flujos).

**Tres eventos que confirmarían y tres que invalidarían la historia:** con umbrales definidos y fecha de próxima medición.

## 2. Prueba de la historia 3P

| Historia | Posible (TAM/capacidad) | Plausible (precedentes/competencia) | Probable (evidencia) | Falsador principal |
|---|---|---|---|---|
| Conservadora | | | | |
| Base | | | | |
| Optimista | | | | |
| Disrupción (no ponderada si JMR vigente así lo exige) | | | | |

Un TAM N/D no puede convertirse en un TAM inventado para cerrar la prueba. La Base debe ser probable, no «todo descontado por si acaso».

## 3. Tabla central de supuestos, por escenario y período

Completar siempre **historia ↔ variable ↔ fuente ↔ prueba ↔ cambio esperado**:

| Palanca | Historial reportado / ajustado | Cons. 1–5 / 6–10 / terminal | Base 1–5 / 6–10 / terminal | Opt. 1–5 / 6–10 / terminal | Mecanismo causal y fuente |
|---|---|---|---|---|---|
| Crecimiento de ingresos y sus motores | | | | | |
| Margen EBIT económico (no EBITDA) | | | | | |
| S/C marginal y reinversión ($) | | | | | |
| ROIC medio, marginal y terminal | | | | | |
| WACC, deuda, riesgo país | | | | | |
| Impuesto efectivo/marginal, NOL | | | | | |
| Arrendamientos e I+D | | | | | |
| Acciones, opciones, SBC, caja no operativa | | | | | |

### Tres comprobaciones económicas esenciales

1. **Ingreso**: ¿unidades × monetización = total contable/proyección? ¿CAGR de motor oficial y sumas segmentadas cuadran? Si hay puente de normalización, etiquetarlo.
2. **Reinversión**: ¿FCFF = NOPAT − reinversión? ¿La historia de crecimiento se reconcilia con Sales-to-Capital y Δcapital, incluidos R&D y arrendamientos?
3. **Terminal**: ¿g ≤ RF nominal relevante y g < WACC? ¿Reinversión = NOPAT × g/ROIC? ¿Una caída de ROIC nuevo desde año10 tiene trayectoria y razón? ¿ROIC medio histórico ≠ ROIC marginal?

## 4. Evidencia y falsadores por hipótesis

| Hipótesis JMR | Dato primario [P] y fecha | Principio Damodaran [D] | Interpretación [H] | Confianza y vulnerabilidad | Qué noticia haría cambiar el supuesto |
|---|---|---|---|---|---|
| | | | | | |

Ningún video no transcrito puede servir para citas de minuto o palabras atribuidas al profesor. Registrar videos pendientes en FUENTES_Y_VIDEOS.

## 5. Sensibilidades económicas (no precios inversos)

- Margen EBIT ±2 pp con explicación.
- Sales-to-Capital 1–5 y 6–10 con economía del producto.
- ROIC **marginal terminal**: WACC vs exceso moderado, erosión finita como diagnóstico separado. Prohibido alterar fórmulas originales.
- G terminal con reinversión compatible; tasas RF/ERP/CRP al mismo corte.
- Riesgo geográfico por ingresos reales, no sede ni proxy arbitraria.
- Arrendamientos: política operativa vs recast de financiación, ingresos / gasto / ROU / deuda / WACC / valor final, con **puentes contables**.
- Impuestos/NOL, I+D, dilución.

Cada sensibilidad debe: **(1)** partir de copia verificable, **(2)** cambiar solo parámetros declarados, **(3)** leer resultado y controles, **(4)** revertir y demostrar regreso a baseline. Sensibilidad «gana valor» no equivale a Base aprobada.

## 6. Matriz de auditoría y publicación

| Control | Evidencia, celda, commit o enlace | Estado OK / BLOQUEADO / NO EJECUTADO |
|---|---|---|
| No alteración de fórmulas y comentarios originales | | |
| Corte financiero y precios homogéneos | | |
| Balance completo y leasing ASC842 con corriente | | |
| Capitalización R&D por cohortes homogéneas | | |
| ROIC y reinversión reconciliados | | |
| 4 escenarios y convergencia de motores | | |
| Sensibilidad DCF 3×5×5 | | |
| Múltiplos FY+3 y matrices propias | | |
| FCFE informativo y dilución | | |
| Análisis Nivel 1 y Nivel 2 | | |
| Suite CI, auditoría visual y económica | | |
| GitHub main, catálogo y app producción | | |

### Entrega

Una decisión de inversión usable requiere explicar **qué debe ocurrir para que el valor sea correcto**, las razones de desacuerdo y las pruebas que podrían refutar el resultado. Guardar fecha, versiones, cambios y pendientes. **No fusionar, publicar ni certificar por un check matemático aislado.**
