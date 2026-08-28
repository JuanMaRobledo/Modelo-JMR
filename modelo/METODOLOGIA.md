# Metodología de valoración

Este proceso se reconstruyó a partir del análisis de 55 casos de estudio reales (2022-2026),
buscando patrones repetidos en cómo se analizó cada empresa. No es una fórmula matemática única:
es un **checklist de 8 pasos** que combina múltiplos relativos con calidad de negocio.

---

## Paso 1 — Entender el negocio

- ¿Qué vende la empresa y en qué segmentos se divide? (% de ingresos por segmento)
- ¿Por qué cayó el precio recientemente? Distinguir entre:
  - **Caída coyuntural** (miedo de mercado, mal trimestre puntual, sector fuera de moda) → más
    interesante para comprar.
  - **Caída estructural** (pérdida real de competitividad, deterioro permanente del negocio) →
    exige mucho más margen de seguridad o descartar.

## Paso 2 — Moat (ventajas competitivas)

Evaluar cualitativamente cuáles de estas fuentes de moat tiene la empresa, y qué tan fuertes son:

| Fuente de moat | Preguntas guía |
|---|---|
| Costos de cambio (*switching costs*) | ¿Es costoso o incómodo para el cliente irse a la competencia? |
| Marca / poder de precio | ¿Puede subir precios sin perder clientes? |
| Escala / distribución | ¿Su tamaño le da ventajas de costo o alcance que otros no pueden igualar? |
| Efecto red | ¿El producto mejora mientras más gente lo usa? |
| Datos / contexto propietario | ¿Tiene información o contexto que un competidor nuevo no podría replicar rápido? |
| Costo de reemplazo de activos | ¿Sus plantas/infraestructura son carísimas o lentas de replicar? (ej. fabs de semiconductores) |

Un negocio sin ninguna de estas (ej. commodities, servicios fácilmente replicables) requiere
múltiplos más bajos y menor convicción de posición.

## Paso 3 — Salud financiera (checklist cuantitativo)

Revisar, en orden de importancia:

1. **Deuda neta / EBITDA** — umbral usado consistentemente:
   - `< 1x` → muy sano
   - `1x - 2x` → aceptable
   - `2x - 3x` → límite, exige cautela
   - `> 3x` → señal de alerta (red flag), reducir tamaño de posición o descartar
2. **Caja operativa y FCF** — ¿es positiva, estable o creciente? Una caja operativa
   **negativa o en deterioro** (ej. por capital de trabajo) es una señal de alarma seria, incluso
   si las utilidades reportadas se ven bien.
3. **Márgenes** (bruto, operativo, neto) y su tendencia — expansión sostenida = fortaleza del
   moat; compresión = posible pérdida de ventaja competitiva.
4. **ROE vs. ROIC** — comparar ambos. Un ROE alto "inflado" por apalancamiento o recompras con
   deuda, sin un ROIC igualmente alto, es una señal de alerta (no de fortaleza real).
   Comparar también el **ROIC actual vs. el promedio de 5 años** para saber si es sostenible.
5. **Uso del capital** — recompras, dividendos, adquisiciones son positivos si se financian con
   caja propia y generan valor; son una señal negativa si se financian con deuda creciente para
   sostener el precio de la acción (ej. recompras apalancadas).

## Paso 4 — Elegir el múltiplo correcto según el tipo de negocio

No se usa siempre el mismo múltiplo. Elegir según la naturaleza del negocio:

| Situación de la empresa | Múltiplo principal | Múltiplo de apoyo |
|---|---|---|
| Utilidades estables, poca deuda | **P/E** (actual y proyectado 2-4 años) | FCF yield |
| Deuda relevante en la estructura | **EV/EBITDA** | P/E |
| Sin utilidades estables o en fase de alto crecimiento | **P/S** (ventas) | P/GP (utilidad bruta) |
| Bancos, fintech, aseguradoras | **P/VL** (precio/valor en libros) | ROE |
| Cualquier caso (múltiplo "favorito" transversal) | **FCF yield** (FCF / valor de mercado) | — |

**Regla central:** el múltiplo actual se compara siempre contra el **promedio histórico propio**
de la empresa (ventana de 5 a 15 años, ajustando o excluyendo distorsiones como pandemia,
cargos no recurrentes o pérdidas puntuales), y en segundo lugar contra comparables directos del
sector. Rara vez se juzga "barato" en términos absolutos — casi siempre es "barato/caro
**relativo a su propia historia**".

Frases guía típicas del análisis:
- *"No es una ganga, pero es la valoración más baja en su historia."*
- *"Está cara, pero en línea con lo que merece por su calidad."*
- *"Barata vs. su historia, justa/cara en términos absolutos."*

Negocios de altísima calidad (moat fuerte, crecimiento consistente) rara vez cotizan baratos en
términos absolutos — ahí el criterio de compra es el **descuento relativo** a su propia historia,
no un múltiplo bajo per se. Negocios más cíclicos o de tipo commodity sí deben exigir múltiplos
bajos en términos absolutos.

## Paso 5 — Proyectar y calcular 3 escenarios de precio objetivo

1. Proyectar EPS o FCF por acción a 2-4 años (usar guías de la empresa, consenso de analistas, o
   una estimación propia conservadora si el consenso parece optimista).
2. Aplicar tres múltiplos distintos a esa proyección para obtener tres precios objetivo:
   - **Negativo/pesimista** — múltiplo bajo (cerca del mínimo histórico o de un escenario
     adverso).
   - **Base** — múltiplo cercano al promedio histórico ajustado.
   - **Optimista** — múltiplo alto (si se cumplen los mejores supuestos de crecimiento).
3. Calcular el **CAGR** de cada escenario desde el precio actual hasta el precio objetivo, y
   sumarle el **dividend yield** si aplica, para obtener el retorno anualizado total esperado.

### Anexo al Paso 5 — Regla automática para los múltiplos de salida

La Calculadora (`Modelo_Valoracion.xlsx`) puede fijar los 3 múltiplos de salida por ti, en vez de
que los estimes a ojo cada vez. Esta regla se obtuvo analizando cuantitativamente 15-18 de los 55
casos de estudio que tenían datos completos: para cada uno se calculó el **múltiplo implícito**
de cada escenario (precio objetivo ÷ EPS/FCF proyectado) y se comparó contra el múltiplo actual y
el promedio histórico del propio caso.

**Resultado:**

| Escenario | Regla | Rango observado |
|---|---|---|
| Negativo | ≈ **1.00×** el múltiplo actual | 0.70x - 1.30x |
| Base | ≈ **0.78×** el múltiplo promedio histórico | 0.56x - 1.01x |
| Optimista | ≈ **0.92×** el múltiplo promedio histórico | 0.65x - 1.23x |

En Excel: `Negativo = Múltiplo_actual`, `Base = 0.78 × Múltiplo_promedio_histórico`,
`Optimista = 0.92 × Múltiplo_promedio_histórico`.

**Nivel de confianza: medio.** No es una fórmula que el autor haya aplicado mecánicamente — él
mismo describe el proceso como juicio caso por caso ("le doy castigo", "soy ácido", "un múltiplo
decente sería..."). Lo que arroja el análisis es el **promedio de ese juicio**, con evidencia
textual directa que lo respalda (ej. en TEP el autor fija su múltiplo "razonable" en 18x contra un
promedio de 23x → 0.78, exactamente la media encontrada; en Nagarro dice explícitamente que evitó
irse "a la valoración promedio... porque de hacerlo, la valoración me daría por encima" del
optimista que sí usó).

**Matices importantes:**
- El escenario **Negativo se ancla al múltiplo actual, no al mínimo histórico de crisis** — la
  lectura es "el mercado no vuelve a pagar más de lo que paga hoy", no "vamos a una crisis".
- Los casos etiquetados **"Especulativa"** (AMD, NVO, DUOL, SE, CELH, UAA, NU, DLO, JD, entre
  otros) muestran razones sistemáticamente más bajas que el promedio — el "castigo" al múltiplo es
  mayor cuando hay menos convicción o experticia sobre el negocio.
- Cuando el autor se desvió al alza de esta regla (ej. EPAM en 2023, apostando a una
  reaceleración de crecimiento que no se cumplió), el resultado fue peor que en los casos donde
  se mantuvo conservador — una señal de que desviarse de la regla es un indicador de riesgo, no
  la norma.

Por eso la Calculadora deja una columna de **"ajuste manual" (%)** junto a cada múltiplo
automático: en 0% aplica la regla pura; puedes moverla (ej. -10% a -20% en hipótesis
especulativas, o al alza si tienes convicción de que el negocio merece re-ratear por encima de su
propia historia) sin perder el punto de partida objetivo.

## Paso 6 — Definir las 3 "zonas de valor"

A partir de los múltiplos históricos mínimos y el precio actual, definir tres rangos de precio
para escalonar compras (no todo de una vez):

- **VALUE** — nivel donde ya hay margen de seguridad razonable; primera entrada.
- **DEEP VALUE** — nivel más exigente, generalmente cerca de mínimos de varios años; refuerzo de
  posición.
- **VALORACIÓN HISTÓRICA** (u "Oportunidad Histórica") — el múltiplo mínimo absoluto visto en la
  historia de la acción (excluyendo crisis extremas tipo 2008-09 si no son comparables); entrada
  máxima de convicción, poco frecuente.

## Paso 7 — Factores cualitativos adicionales

- **Skin in the game**: ¿fundadores, familia fundadora o directivos tienen una participación
  accionaria relevante y/o están comprando (no vendiendo)? Se pondera como un factor positivo
  fuerte; su ausencia (insiders sin acciones o vendiendo) es una señal negativa.
- **Riesgos específicos**: regulatorios, geopolíticos (país, aranceles), competitivos
  (sustitución tecnológica, nuevos entrantes), de concentración de clientes.
- **Categoría de riesgo de la hipótesis**: clasificar explícitamente la posición como
  **Estándar** (negocio de calidad, moat claro, deuda controlada) o **Especulativa/Alto riesgo**
  (sector fuera de la experticia propia, sin utilidades consistentes, alta volatilidad, riesgo
  país extremo). El tamaño de la posición debe ser menor en el segundo grupo.

## Paso 8 — Gestión de la posición

- **Escalonar entradas**: comprar por tramos en las tres zonas de valor definidas en el Paso 6,
  no de una sola vez.
- **Tomar ganancias parciales ("peluquear")**: cuando el precio alcanza el escenario base u
  optimista, cerrar una parte de la posición (típicamente 20%-50%) y dejar correr el resto.
- **Reactivar la hipótesis**: si el precio vuelve a caer a niveles de las zonas de valor
  originales, se puede retomar la posición cerrada parcialmente, revalidando primero que la
  tesis de negocio siga intacta.
- **Actualizar periódicamente**: revisar la hipótesis cuando hay resultados trimestrales
  relevantes o el precio se mueve significativamente, y recalcular múltiplos/escenarios con la
  información nueva.

---

## Checklist rápido (resumen de una página)

1. [ ] Negocio y segmentos entendidos; razón de la caída identificada (coyuntural vs. estructural)
2. [ ] Moat evaluado (¿cuáles de las 6 fuentes aplican y qué tan fuertes son?)
3. [ ] Deuda neta/EBITDA calculada y clasificada (verde/amarillo/rojo)
4. [ ] Caja operativa y FCF revisados (¿positivos y estables?)
5. [ ] Márgenes y su tendencia (¿expansión o compresión?)
6. [ ] ROE vs. ROIC comparados (actual y promedio 5 años)
7. [ ] Múltiplo principal elegido según el tipo de negocio
8. [ ] Múltiplo actual comparado contra promedio histórico propio (y comparables de sector)
9. [ ] EPS/FCF proyectado a 2-4 años
10. [ ] 3 escenarios de precio objetivo + CAGR calculados
11. [ ] 3 zonas de valor definidas (Value / Deep Value / Valoración Histórica)
12. [ ] Skin in the game revisado
13. [ ] Riesgos específicos listados
14. [ ] Categoría de riesgo asignada (Estándar / Especulativa) y tamaño de posición decidido

Usa `Modelo_Valoracion.xlsx` (pestaña **Calculadora**) para aplicar este checklist con fórmulas
automáticas.
