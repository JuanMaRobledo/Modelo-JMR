# De la historia a los números — guía para hacer los supuestos (Damodaran)

**Versión 1 · 5-nov-2026 · aplica REGLAS_VIGENTES §2 (v31).** Esta guía no crea reglas: explica **cómo** se hacen los
supuestos de cada historia para que salgan de la historia y no al revés. Se usa en F1 (proponer), F3 (revisar) y F5
(auditar), y la lee cualquier IA antes de tocar crecimiento, margen, reinversión o riesgo.

Fuentes: Aswath Damodaran, *Narrative and Numbers: The Value of Stories in Business* (Columbia Business School
Publishing, 2017); la pestaña «Stories to Numbers» de su hoja `fcffginzu.xlsx`; sus clases de valoración
(pages.stern.nyu.edu/~adamodar). En la hoja JMR, todo esto vive en `Escenarios e historias` desde la fila 104.

## La idea central

Un número sin historia es una hoja de cálculo; una historia sin números es un cuento. Damodaran une las dos cosas en
cinco pasos, siempre en este orden:

1. **Contar la historia** de la empresa (qué negocio, qué mercado, cómo gana dinero, qué ventaja tiene, qué riesgo corre).
2. **Probarla**: ¿es posible, plausible y probable?
3. **Convertirla en palancas de valor**: crecimiento, margen, reinversión y riesgo. Cada número tiene que poder
   señalar la frase de la historia que lo justifica.
4. **Valorar** con esas palancas (la hoja lo hace; no se pegan resultados).
5. **Seguirla**: qué hechos la romperían, la cambiarían o la desplazarían, y volver al paso 1 cuando ocurran.

El error que esta guía evita es el inverso: elegir un crecimiento o un margen «razonable» y después escribir una
historia que lo acompañe. Si el número viene primero, la historia es decoración.

## Paso 1 · La historia

Un párrafo por historia, escrito **antes de mirar el precio** (`Escenarios e historias`, celda «La historia»). Debe
contestar, en este orden:

- **Qué es la empresa y en qué mercado juega.** El mercado define el techo del crecimiento.
- **Cómo crece**: más clientes, más precio, más productos, más regiones. Uno o dos motores, no diez.
- **Cuánto gana cuando madura**: el margen que su economía permite (no el que tendría si todo saliera bien).
- **Cuánto tiene que invertir para crecer**: capital por dólar de ventas nuevas.
- **Qué riesgo corre y dónde vive ese riesgo**: en los flujos (la historia), no en la tasa salvo riesgo sistemático.

Tipo de historia según el ciclo de vida (lista de la celda «Tipo»): start-up, crecimiento joven, alto crecimiento,
crecimiento maduro, madurez estable, declive. El tipo ordena qué palanca importa más: en una start-up casi todo el
valor es crecimiento y supervivencia; en una madura, márgenes y devolución de caja; en declive, cuánto se rescata.

Las cuatro historias JMR (Base, Conservadora, Optimista, Disrupción) son **cuatro historias distintas**, cada una con
su mecanismo, no la Base ±x %. La Base es la más probable (la mediana), no la prudente.

## Paso 2 · Las 3P

| Prueba | Pregunta | Cómo se mide en la hoja | Qué hacer si falla |
|---|---|---|---|
| **Posible** | ¿Puede pasar sin violar la aritmética? | Participación del mercado en el año 10 = ventas del año 10 / TAM del año 10. Más de 100 % = IMPOSIBLE. | Rehacer la historia; no se «ajusta» el TAM. |
| **Plausible** | ¿Hay evidencia de que algo así ya ocurrió (en la empresa, en pares, en la industria)? | Margen del año 10, ROIC terminal y ventas/capital frente a la industria de Damodaran (`Input sheet` B9/B10). | REVISAR = escribir la ventaja que lo sostiene y su evidencia. |
| **Probable** | ¿Es lo que más probablemente pase? | Crecimiento 1-5 frente a la industria, ganancia de participación y valor del crecimiento (% del valor operativo). | La Base debe ser «probable = Sí». Si no lo es, no es la Base. |

Las señales son evidencia para el juicio, no el juicio. Una empresa con ventaja real puede estar sobre la industria;
lo que no puede es estar sobre la industria **sin explicar por qué**. Nada se corrige para acercar el valor al precio.

## Paso 3 · De la historia a cada número

### Crecimiento de ingresos: del mercado a la participación, no del aire

El crecimiento se **deriva**, no se elige:

1. **TAM actual** y su crecimiento, con fuente (F1). Si no hay dato confiable: N/D con motivo, nunca un número
   inventado para que la participación parezca razonable.
2. **Participación objetivo del año 10**: la que la historia defiende (fila «Participación objetivo del año 10»).
   Una historia de líder global puede defender 20-30 % de un mercado fragmentado; una de nicho, 2-5 %.
3. La hoja calcula **ingresos del año 10 implícitos** = TAM₁₀ × participación y el **crecimiento 1-10 implícito**.
4. El crecimiento año por año del modelo (filas de crecimiento de cada historia) debe llegar a esos ingresos. La fila
   «Brecha historia − modelo» marca REVISAR si difieren más de 10 %: o cambia la historia, o cambia el crecimiento.
5. La trayectoria (cuándo crece rápido y cuándo se desacelera) también sale de la historia: lanzamientos, saturación
   de usuarios, maduración del producto. Después del año 10, g ≤ tasa libre (§4).

Cuando el TAM en dinero no existe pero sí en unidades (usuarios, tiendas, suscriptores), se arma por unidades:
unidades del año 10 × ingreso por unidad, y cada factor se justifica con la historia. Es lo que hace DUOL con sus
segmentos (filas 96-101 de su hoja).

### Margen operativo: economía unitaria y pares maduros

- El margen objetivo es el que la empresa tendrá **cuando madure**, en la misma base contable de la hoja (I+D y
  arrendamientos capitalizados si la hoja los capitaliza).
- Anclas, en este orden: (1) la economía unitaria del negocio (precio menos costo variable por cliente o unidad);
  (2) el margen de pares **maduros** del mismo modelo de negocio; (3) el promedio de la industria de Damodaran.
- Margen sobre la industria = REVISAR: la historia tiene que decir qué ventaja (marca, escala, costo, red,
  regulación) lo sostiene y por cuánto tiempo.
- El año de convergencia también es historia: un negocio que ya opera a escala converge rápido; uno que aún invierte
  en crecer, lento.

### Reinversión: ventas/capital

- Ventas/capital = cuántos dólares de ventas nuevas genera cada dólar invertido. Sale del modelo de negocio: digital y
  de licencias (alto), industrial y de tiendas (bajo).
- Anclas: el ventas/capital **marginal** de la propia empresa (no el promedio histórico), el de pares y el de la
  industria. Sobre la industria = REVISAR.
- Comprobar la coherencia: crecimiento = tasa de reinversión × ROIC. Una historia de mucho crecimiento con poca
  reinversión exige un ROIC muy alto, y la historia tiene que explicarlo.

### Rentabilidad: ROIC terminal

- Sin ventaja duradera, el ROIC terminal converge al costo de capital (crecer no crea valor).
- Con ventaja duradera, puede quedar sobre el costo de capital, cerca del promedio de la industria o de pares con
  ventajas comparables; la historia dice cuál ventaja y por qué dura.
- ROIC terminal sobre la industria = REVISAR.

### Riesgo: un solo lugar

- **Costo de capital**: riesgo sistemático (beta sectorial, ERP, riesgo país). Es el mismo para las cuatro historias.
- **Riesgo propio del negocio** (cliente, regulación, tecnología, IA): va en los flujos de la historia que lo sufre
  (menor crecimiento, menor margen), no en la tasa.
- **Probabilidad de fracaso**: solo en Disrupción, con su entrada propia (`Escenarios e historias!B216`), y entonces
  esa historia no castiga además sus flujos por el mismo riesgo.

### Valor del crecimiento

La hoja muestra qué parte del valor operativo viene de crecer (sobre los activos actuales, NOPAT base / costo de
capital terminal). Si es ALTO, el valor depende de que la historia de crecimiento se cumpla: las pruebas de
crecimiento y reinversión merecen más evidencia. Si es NEGATIVO, crecer destruye valor en esa historia (ROIC bajo el
costo de capital): es coherente en una Disrupción, y es una alerta en cualquier otra.

## Paso 4 · Valorar

La hoja valora con las palancas; la IA no pega resultados (§0B). Leer el resultado contra la historia: si el valor
sorprende, la pregunta es qué palanca lo mueve y si la historia la sostiene, nunca cómo acercarlo al precio.

## Paso 5 · Seguir la historia: ruptura, cambio, desplazamiento

Tres disparadores por historia, observables y con umbral (no «si cambia la competencia»):

- **Ruptura**: un hecho que hace imposible la historia (pérdida de una licencia, un competidor que vuelve gratuito el
  producto). Se revalora desde cero.
- **Cambio**: un hecho que altera una palanca de forma material (márgenes que no llegan, crecimiento que se frena).
  Se cambian los supuestos afectados.
- **Desplazamiento**: un hecho que mueve la probabilidad entre historias sin cambiar su contenido (los indicadores
  del §3 que mueven 5 pp).

Los disparadores alimentan el capítulo 5 (ciclos), el plan de seguimiento (capítulo 13) y los indicadores de
probabilidad del §3.

## Lista de control antes de cerrar F1 o F3

- [ ] Cada historia tiene tipo, párrafo y estado COMPLETA en la hoja.
- [ ] El crecimiento sale de la participación objetivo (o de unidades × ingreso por unidad); la brecha historia −
      modelo está en OK o explicada.
- [ ] Cada palanca tiene su frase de «vínculo con la historia».
- [ ] Ninguna señal IMPOSIBLE; cada REVISAR tiene su evidencia en el juicio de la P correspondiente.
- [ ] La Base es «probable = Sí».
- [ ] El riesgo está en un solo lugar (costo de capital común; fracaso solo en Disrupción).
- [ ] Tres disparadores observables por historia.
- [ ] TAM con fuente, o N/D con motivo.

## Ejemplo resuelto

DUOL-20261103-A12-R2 es la primera hoja con las cuatro historias completas
(`JMR-valuation/scripts/duol_historias_20261104.py` deja el contenido reproducible). Muestra cómo justificar un margen
y un ROIC muy por encima de la industria (marca, hábito, distribución gratuita), cómo registrar un TAM N/D sin
inventarlo y cómo escribir disparadores medibles (suscriptores, margen EBITDA ajustado, bookings).
