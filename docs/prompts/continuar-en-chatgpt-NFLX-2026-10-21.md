# Prompt para continuar en ChatGPT · Modelo JMR · NFLX · 21-oct-2026

> Copia todo lo que está debajo de la línea en un chat nuevo de ChatGPT. Adjunta:
> 1. la hoja «Modelo JMR - NFLX - prueba integral plantilla IA 2026-10-21» exportada a .xlsx;
> 2. `JMR-valuation/reference/damodaran/NFLX.json` (la ficha de historias);
> 3. `Modelo-JMR/docs/prompts/valoracion-modelo-jmr-v5.md` y `Modelo-JMR/modelo/REGLAS_VIGENTES.md`;
> 4. para el análisis: `research-fundamental-jmr-v5.md`;
> 5. opcional: el 10-Q de NFLX a jun-2026 y la carta del 3T26.

---

Actúa como analista de valoración del **Modelo JMR**, con criterio Damodaran. Vas a continuar una valoración de
**Netflix (NFLX)** que otro asistente dejó a medio camino. Los documentos adjuntos mandan, en este orden:
1. `REGLAS_VIGENTES.md` (versión 4);
2. `valoracion-modelo-jmr-v5.md` (cómo valorar);
3. `research-fundamental-jmr-v5.md` (cómo escribir el análisis).

Léelos completos antes de empezar. Si algo de este mensaje los contradice, prevalecen ellos.

## Reglas de trabajo (no negociables)

- **Integridad:**
  - Cada cifra lleva una de tres etiquetas: [Dato] con fuente y fecha, [Cálculo] con su fórmula, o [Juicio] con la
    evidencia a favor y en contra.
  - Si no tienes un dato, escribe N/D y explica qué queda sin anclar. Nunca inventes cifras, fuentes ni enlaces.
  - No uses información posterior al corte del **30-sep-2026**, salvo como «hecho posterior» rotulado (los
    resultados del 3T26 salieron después del corte).
- **Calibración honesta, no conservadora por sistema:**
  - La Base es el desenlace más probable, no el prudente; la prudencia vive solo en el margen de seguridad de 35%.
  - Conservadora y Optimista exigen la misma evidencia.
  - Cada riesgo va en un solo lugar: flujos, tasa o probabilidad.
  - Nada se ajusta para acercarse al precio.
- **No modifiques la hoja.** Tú calculas, verificas y propones; el usuario aplica los cambios. Entrega cada cambio
  propuesto como tabla: hoja, celda, valor actual, valor propuesto y motivo.
- **Aritmética:** muestra las fórmulas y verifica dos veces los resultados clave (puente de valor operativo a valor
  por acción, promedio de historias y MOS).

## Estado al 21-oct-2026 (lo que ya está hecho y verificado)

**Corte de mercado (30-sep-2026):**
- Precio NFLX US$69,58.
- Treasury 10 años 5,29% y prima madura de Damodaran 3,70% (octubre de 2026, misma fecha).
- Crecimiento terminal 4% nominal (techo: la tasa libre).
- Costo de capital terminal 8,99%.

**Estados financieros (LTM a jun-2026, conciliados con la SEC):**
- Ingresos US$48.371 millones; EBIT GAAP US$14.354 millones (29,7%).
- Se corrigieron 17 celdas: balance LTM al 10-Q, BPA ajustado por el split 10 a 1 y cambio neto de caja.

**Ajustes de Damodaran (todos validados en la hoja):**
- **I+D capitalizado:** «Technology and development», vida de 3 años. Activo de US$6.947 millones, EBIT +US$714
  millones (+1,48 pp de margen).
- **Arrendamientos operativos como deuda:** VP de US$2.327 millones, EBIT +US$171 millones (+0,35 pp), sin doble
  conteo (no están en la deuda del balance).
- **Opciones de empleados:** 123,9 millones a US$39,21, plazo de 4,6 años, volatilidad de 33,8%, dividendo 0. Valor
  de US$4.973 millones.
- Margen base ajustado: 31,5%.

**Costo de capital (validado):**
- Método de beta «Single Business(Global)», con beta de 0,99.
- Prima por regiones de 4,92% (ventas: UCAN 21.088, EMEA 15.604, LATAM 5.870, APAC 5.809).
- Rating A3/A-, costo de la deuda antes de impuestos de 6,18%, tasa marginal de 25%.
- Deuda contable de US$14.463 millones más arrendamientos.
- **WACC: 10,02%.**

**Ficha de historias** (ver `NFLX.json`; márgenes en base reportada, el modelo los lleva a la base ajustada):

| Historia | Probabilidad | Crecimiento años 1-5 | Margen objetivo |
|---|---|---|---|
| Base | 45% | ~11% el año 1, bajando a ~7% | 36% |
| Conservadora | 22,5% | ~9%, bajando a ~4,5% | 32,5% |
| Optimista | 22,5% | ~12-16%, bajando a ~9% | 40% |
| Disrupción | 10% | ~7%, luego estancamiento; ROIC terminal = costo de capital | 22% |

Las probabilidades son la previa de la etapa «crecimiento maduro», sin ajustes por indicadores todavía.

**Múltiplos por ciclo** (última corrida, con el ajuste por tasas y el ancla C como techo), en veces,
Conservador / Base / Optimista:

| Método | Conservador | Base | Optimista |
|---|---|---|---|
| EV/EBITDA | 20,0 | 26,8 | 26,8 |
| EV/FCFF | 19,5 | 22,3 | 25,5 |
| P/E | 21,9 | 36,4 | 36,4 |
| P/FCFE | 17,1 | 19,2 | 21,6 |
| P/OCF | 24,2 | 26,0 | 26,0 |

**Alerta abierta:** EV/EBITDA y P/E de la Base y el Optimista quedan más de 25% sobre el múltiplo actual. Exige
`justificacion_salto` con evidencia o una corrección.

## Lo que falta (en este orden)

1. **DCF de las cuatro historias.** Con la hoja adjunta (pestañas «Escenarios e historias», «Valuation output»,
   «Input sheet»):
   - verifica que cada historia reproduzca su DCF anual a 10 años más la perpetuidad, y el puente al valor por acción
     (deuda, arrendamientos, caja, opciones y acciones);
   - informa el DCF Base;
   - informa el promedio de Conservadora, Base y Optimista, con las probabilidades renormalizadas y rotulado
     «condicionado a que no ocurra la disrupción»;
   - informa la Disrupción aparte, en el recuadro «¿Qué pasaría si todo fallara?»;
   - informa el precio con MOS = DCF Base × 0,65.

   Si la hoja exportada no trae los valores calculados (celdas con fórmulas sin evaluar), recalcula tú con los
   supuestos de la ficha y la estructura del §4 del prompt v5, y dilo.
2. **Revisa el margen con I+D en la perpetuidad.** El ajuste de +1,48 pp es el de hoy. En estado estable, con un
   crecimiento de 4% y una vida de 3 años, el efecto es menor (≈ (I+D − amortización)/ventas). Calcúlalo y di cuánto
   cambia el DCF Base si se usa el valor de estado estable.
3. **Resuelve la alerta de múltiplos** (EV/EBITDA y P/E): justifica el salto con evidencia o propón el múltiplo
   corregido.
4. **Sensibilidades mínimas del DCF Base:** WACC terminal × g, ROIC terminal × g y crecimiento × margen. Agrega el
   DCF inverso: qué crecimiento de los años 1-5 justifica US$69,58.
5. **Controles del §7 del prompt v5:** responde Sí/No a cada uno. Si todos pasan, la valoración queda **VALIDADA**; si
   no, lista los hallazgos.
6. **Recién después, el análisis fundamental** de 18 secciones (`research-fundamental-jmr-v5.md`). Copia las cifras
   de la valoración validada; no recalcules.
7. **Entrega final:**
   - resumen de valoración (DCF Base, promedio de tres, Disrupción, MOS y DCF inverso);
   - tabla de cambios propuestos a la hoja;
   - ficha JSON actualizada (formato del §9.10 del prompt v5);
   - el análisis en Markdown.

La decisión de comprar, mantener o vender la toma el usuario. No publiques nada; el usuario lo hace con autorización.
