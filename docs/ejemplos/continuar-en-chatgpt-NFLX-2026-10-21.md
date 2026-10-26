# Prompt para continuar en ChatGPT · Modelo JMR · NFLX · actualizado 21-oct-2026

> Ejemplo de mensaje para retomar una sola empresa (NFLX) en otro modelo. No es un prompt maestro: los tres vigentes están en `docs/prompts/`.

> Copia todo lo que está debajo de la línea en un chat nuevo de ChatGPT (sirve igual para cualquier otro modelo).
> Adjunta:
> 1. la hoja «Modelo JMR - NFLX» vigente (ID `163ra1unWvu6hhtkBa_hh-43emBsmNDDbCInllK6MC6w`), exportada a .xlsx;
> 2. `JMR-valuation/reference/damodaran/NFLX.json` (la ficha de historias);
> 3. `Modelo-JMR/modelo/REGLAS_VIGENTES.md`, `docs/prompts/valoracion-modelo-jmr-v5.md` y
>    `docs/prompts/research-fundamental-jmr-v5.md`;
> 4. `JMR-valuation/data/NFLX_Research_Fundamental_Modelo_JMR_2026-10-21.md` (el análisis publicado);
> 5. para la actualización: la carta a accionistas del 3T26 (20-oct-2026) y el 10-Q del 3T26 cuando salga.

---

Actúa como analista de valoración del **Modelo JMR**, con criterio Damodaran. La valoración de **Netflix (NFLX)**
al corte del **30-sep-2026** está **VALIDADA y publicada**. Tu trabajo es mantenerla, no rehacerla. Los documentos
adjuntos mandan, en este orden:
1. `REGLAS_VIGENTES.md` (la versión vigente, hoy la 11);
2. `valoracion-modelo-jmr-v5.md`;
3. `research-fundamental-jmr-v5.md`.

Léelos completos antes de empezar. Si algo de este mensaje los contradice, prevalecen ellos.

## Reglas de trabajo (no negociables)

- **Integridad:**
  - Cada cifra lleva una de tres etiquetas: [Dato] con fuente y fecha, [Cálculo] con su fórmula, o [Juicio] con la
    evidencia a favor y en contra.
  - Si no tienes un dato, escribe N/D y explica qué queda sin anclar. Nunca inventes cifras, fuentes ni enlaces.
- **Calibración honesta, no conservadora por sistema:**
  - La Base es el desenlace más probable, no el prudente; la prudencia vive solo en el margen de seguridad de 35%.
  - Conservadora y Optimista exigen la misma evidencia.
  - Cada riesgo va en un solo lugar: flujos, tasa o probabilidad.
  - Nada se ajusta para acercarse al precio.
- **Una auditoría por publicación.** No re-audites la valoración del 30-sep sin un hecho nuevo. Solo cambia lo que
  un dato nuevo obliga a cambiar (modo C de actualización trimestral).
- **No modifiques la hoja.** Propones y el usuario aplica. Entrega cada cambio como tabla: hoja, celda, valor actual,
  valor propuesto y motivo.
- **Aritmética:** muestra las fórmulas y verifica dos veces el puente al valor por acción, el promedio de las tres
  historias y el MOS.

## Valoración vigente (corte del 30-sep-2026, VALIDADA el 21-oct-2026)

**Mercado:**
- Precio US$69,58.
- Treasury a 10 años 5,29% y prima madura de Damodaran 3,70%, de la misma fecha.
- Crecimiento terminal 4,0% nominal.
- Costo de capital terminal 8,99%.

**Estados (LTM a jun-2026, conciliados con la SEC):**
- Ingresos US$48.371 millones.
- EBIT GAAP US$14.354 millones (29,7%; 31,0% normalizado por el impuesto de Brasil).

**Ajustes de Damodaran:**
- **I+D capitalizado:** vida de 3 años, +1,48 pp de margen.
- **Arrendamientos operativos como deuda:** VP de US$2.327 millones, +0,35 pp de margen, sin doble conteo.
- **Opciones de empleados:** US$4.973 millones, por Black-Scholes.

**Costo de capital:**
- WACC 10,02% y costo del patrimonio 10,33%.
- Beta global reapalancada 1,02.
- Prima por regiones 4,92%.
- Rating A3/A-, costo de la deuda antes de impuestos 6,18%.
- Tasa marginal 25%.

**ROIC terminal:**
- 21,52% en Base, Conservadora y Optimista. Es el punto medio, decisión del usuario del 21-oct-2026.
- En la Disrupción es igual al costo de capital (8,99%).

**Las cuatro historias** (probabilidades = previa de «crecimiento maduro», sin ajustes; márgenes en base reportada):

| Historia | Probabilidad | Crecimiento | Margen objetivo | DCF por acción |
|---|---|---|---|---|
| Base | 45% | 11% el año 1, bajando ~1 pp por año (8,9% compuesto a 5 años) | 36% | **US$65,95** |
| Conservadora | 22,5% | Precio por miembro a la mitad; publicidad ~US$6.000 M en 2031 | 32,5% | US$53,51 |
| Optimista | 22,5% | Publicidad > US$12.000 M en 2031; precio sin rotación | 40% | US$80,87 |
| Disrupción (aparte) | 10% | Año 1 contratado y luego estancamiento | 22% | US$23,92 |

**Resultados:**
- **Promedio de Conservadora, Base y Optimista** (pesos renormalizados, condicionado a que no ocurra la disrupción):
  US$66,57.
- **Precio con MOS** = DCF Base × 0,65 = **US$42,86**.
- **DCF inverso:** US$69,58 exige un crecimiento compuesto de 9,9% en los años 1-5, frente a 8,9% en la Base. El
  precio pide algo un poco mejor que la Base.

**Sensibilidades del DCF Base:**
- WACC ±1 pp: US$83,38 y US$54,31.
- g terminal ±0,5 pp: US$70,23 y US$62,42.
- ROIC terminal = costo de capital: US$52,11.
- Crecimiento de los años 1-5 ±2 pp: US$73,09 y US$59,49.
- Margen objetivo ±2 pp: US$69,54 y US$62,35.

**Múltiplos de salida** (por ciclo, con ajuste por tasas y el ancla C como techo; secundarios, 60% de su bloque),
en veces, Conservador / Base / Optimista:

| Método (peso) | Conservador | Base | Optimista |
|---|---|---|---|
| EV/EBITDA (20%) | 13,24 | 14,02 | 15,26 |
| EV/FCFF (10%) | 19,51 | 22,28 | 25,49 |
| P/E (20%) | 15,73 | 17,63 | 19,81 |
| P/FCFE (5%) | 17,10 | 19,21 | 21,57 |
| P/OCF (5%) | 17,50 | 20,23 | 23,16 |

Todos quedan bajo el múltiplo actual. No hay alerta de salto.

**Controles:**
- `controles_todas.sh NFLX` sin fallas.
- Los 18 candados de la hoja listos.
- Entradas completas.
- Consistencia hoja = app = motor.

## Hecho posterior al corte (no entra en la valoración del 30-sep)

Carta a accionistas del 3T26, del 20-oct-2026:
- ingresos LTM a septiembre de US$49.734,6 millones;
- EBIT GAAP de US$15.564,9 millones (31,3%);
- meta de publicidad de 2026 rebajada de ~US$3.000 a ~US$2.700 millones;
- flujo libre de 2026 de ~US$12.000 millones (antes ~US$12.500 millones);
- licencia ampliada con Disney.

## Lo que falta (en este orden)

1. **Lectura del 3T26 frente a los indicadores de la ficha.** Para cada indicador de `NFLX.json` con umbral escrito:
   - di si cruzó su umbral, con [Dato] y fecha;
   - si cruzó, propón el ajuste de 5 pp de probabilidad que corresponda (máximo 15 pp por historia frente a la
     previa);
   - si no cruzó, las probabilidades no se mueven.

   Atención con la publicidad: la rebaja a ~US$2.700 millones es evidencia en contra de la Base y la Optimista.
   Comprueba si alcanza el umbral, sin duplicar el riesgo en flujos y probabilidad a la vez.
2. **Supuestos que el 3T26 obliga a revisar.** Lista solo esos (por ejemplo, el margen del año 1 o la trayectoria de
   la publicidad). Para cada uno: valor vigente, valor propuesto, evidencia, y efecto aproximado sobre el DCF Base
   usando las sensibilidades de arriba.
3. **Nuevo corte (31-oct-2026), cuando lo haya.** Precio, Treasury y prima madura de la misma fecha. Recalcula el DCF
   de las cuatro historias, el promedio de tres, la Disrupción aparte, el MOS sobre el DCF Base y el DCF inverso.
4. **Controles del §7 del prompt v5.** Responde Sí/No a cada uno: VALIDADO si todos pasan, CON HALLAZGOS si falla
   alguno.
5. **Análisis fundamental:** actualiza solo las secciones afectadas (9, 12, 14, 15 y 18 como mínimo). Copia las
   cifras de la valoración; no recalcules dentro del análisis.
6. **Entrega:**
   - resumen (DCF Base, promedio de tres, Disrupción, MOS y DCF inverso, cada uno frente al valor vigente);
   - tabla de cambios a la hoja;
   - ficha JSON actualizada (§9.10 del prompt v5);
   - secciones del análisis reescritas, en Markdown.

La decisión de comprar, mantener o vender la toma el usuario. No publiques nada; el usuario lo hace con autorización.
