# De la historia a los números — guía para hacer los supuestos (Damodaran)

**Versión 2 · revisión del 4-nov-2026 (Colombia) · aplica REGLAS_VIGENTES §2 (v33).** Esta guía no crea reglas: explica **cómo** se hacen los
supuestos de cada historia para que salgan de la historia y no al revés. Se usa en F1 (proponer), F3 (revisar) y F5
(auditar), y la lee cualquier IA antes de tocar crecimiento, margen, reinversión o riesgo.

Fuentes: Aswath Damodaran, *Narrative and Numbers: The Value of Stories in Business* (Columbia Business School
Publishing, 2017); la pestaña «Stories to Numbers» de su hoja `fcffginzu.xlsx`; sus clases de valoración
(pages.stern.nyu.edu/~adamodar). En la hoja JMR, todo esto vive en `Escenarios e historias` desde la fila 104.

## La idea central

Un número sin historia es una hoja de cálculo; una historia sin números es un cuento. Damodaran une las dos cosas en
cinco pasos con retroalimentación: se empieza por el negocio, pero la evidencia y el cálculo pueden obligar a volver a la historia:

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
su mecanismo, no la Base ±x %. La Base es el escenario central defendido como más probable, sin recortes preventivos. No equivale automáticamente a la mediana ni al valor esperado de una distribución.

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
   No hay cuotas por defecto para líderes o nichos: la cuota se defiende con competencia, distribución y capacidad.
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
- Con retornos estables y períodos consistentes, el crecimiento del beneficio operativo por inversión nueva se
  relaciona con la tasa de reinversión y el retorno marginal. No es una identidad universal del crecimiento de ventas.
  Separar el efecto de mejorar los activos existentes; no proyectar eficiencia creciente a perpetuidad (fuentes S4/S5).

### Rentabilidad: ROIC terminal

- Sin ventaja duradera, el ROIC terminal converge al costo de capital (crecer no crea valor).
- Con ventaja duradera, puede quedar sobre el costo de capital, cerca del promedio de la industria o de pares con
  ventajas comparables; la historia dice cuál ventaja y por qué dura.
- ROIC terminal sobre la industria = REVISAR.

### Riesgo: un solo lugar

- **Costo de capital**: riesgo sistemático (beta sectorial, ERP, riesgo país). Es el mismo para las cuatro historias.
- **Riesgo propio del negocio** (cliente, regulación, tecnología, IA): va en los flujos de la historia que lo sufre
  (menor crecimiento, menor margen), no en la tasa.
- **Probabilidad de fracaso (convención JMR, no regla universal de Damodaran)**: solo en Disrupción, con su entrada propia (`Escenarios e historias!B216`), y entonces
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
- **Desplazamiento (etiqueta operativa JMR)**: un hecho que mueve probabilidades según §3. No confundir esta
  adaptación con el *narrative shift* de Damodaran, que modifica las características del negocio y sus inputs.
  En el autor, *change* amplía, reduce o sustituye el alcance del negocio, y *break* invalida su historia.
  Clasificar primero el hecho económico y después su efecto sobre parámetros, alcance o probabilidades (fuente S2).

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

## Ejemplo documentado, pendiente de juicio económico

DUOL-20261103-A12-R2 es la primera hoja con las cuatro historias completas
(`JMR-valuation/scripts/duol_historias_20261104.py` deja el contenido reproducible). Muestra cómo justificar un margen
y un ROIC muy por encima de la industria (marca, hábito, distribución gratuita), cómo registrar un TAM N/D sin
inventarlo y cómo escribir disparadores medibles (suscriptores, margen EBITDA ajustado, bookings).


## Construcción y revisión económica obligatoria (v33)

Esta sección aplica §2: completa la justificación de los inputs; no añade pestañas, campos JSON ni cambios de motor.
Fuentes y límites de la investigación en [FUENTES_STORIES_TO_NUMBERS.md](FUENTES_STORIES_TO_NUMBERS.md).
Los controles estructurales COMPLETA y 3P no certifican por sí solos calidad económica.

### Ficha por supuesto material

Registrar en el soporte F1/F3 de la misma revisión, sin crear otra plantilla:

| Afirmación del negocio | Motor y definición | Evidencia a favor y en contra (fuente/fecha) | Rango defendible | Valor y trayectoria elegidos | Dependencias | Hecho que lo refuta | Celda e impacto en Base/MOS |
|---|---|---|---|---|---|---|---|
| Una afirmación concreta por fila | Unidad, período y base contable | Distinguir dato de juicio; N/D explicado | Por qué ese intervalo | Por qué este valor y no otro | Qué debe cambiar conjuntamente | Indicador, umbral y plazo | Si no se midió el impacto, NO EJECUTADO |

La materialidad sigue §4B; no exigir precisión inexistente ni detener soportes independientes por un dato secundario.

### Ingresos: dos perspectivas compatibles

Construir la trayectoria con los motores disponibles: clientes × ingreso por cliente; tiendas × ventas por tienda;
volumen × precio; o transacciones × comisión. Explicitar retención, conversión y mezcla cuando sean materiales.
Contrastar con el mercado accesible, su crecimiento y la cuota resultante; no sumar mercados solapados ni dar por
alcanzable todo el gasto mundial. El TAM desconocido sigue N/D: un modelo por unidades puede sostener el crecimiento.

Para intermediarios, si el mercado está expresado en volumen bruto, ingresos = mercado bruto × cuota × comisión.
Si ya mide ingresos netos, no multiplicar otra vez por comisión. La participación calculada con ventas netas sobre
GMV no es una cuota comparable. Registrar y explicar la diferencia en el soporte; no modificar la fórmula de la
plantilla durante una valoración para ocultar este problema. Casos formativos: Uber y Zomato (S3/S6/S8).

### Márgenes y crecimiento se eligen conjuntamente

Descomponer el paso desde margen actual a objetivo: precio, mezcla, costo variable, escala y costos fijos. Indicar
qué mejora se alcanza, cuándo y a qué costo. Preservar el puente de margen reportado a ajustado; aplicar §0B y el
contrato de entrada existente. Comparar negocios equivalentes, no solo empresas con la misma etiqueta sectorial.

Si ganar cuota exige precios menores, más distribución o gasto comercial, reconocerlo. No combinar crecimiento
masivo y margen de nicho exclusivo sin evidencia. Ferrari enseña el costo de abandonar exclusividad; META ilustra
la interdependencia entre expansión, rentabilidad e inversión (S2/S3).

### Inversión: capacidad, escala y desfase

Distinguir ventas/capital medio (ventas / saldo de capital) del incremental utilizado para estimar la reinversión.
Un cociente de diferencias de un solo año puede ser inestable: revisar ventanas plurianuales, adquisiciones,
capacidad ociosa, construcción en curso y cambios de mix. La media histórica y los pares sirven de anclas, no de
sustitutos automáticos del juicio sobre inversión futura.

Digital no significa sin inversión: analizar I+D, tecnología y adquisiciones junto con capital físico y de trabajo,
sin duplicar gastos capitalizados. La capacidad ya pagada puede sostener crecimiento temporal con poca inversión;
no extrapolarlo para siempre. El desfase debe seguir evidencia y §4C. No normalizar capex ni cambiar el lag solo
porque el FCFF sea negativo. Caso para estudiar: Amazon, con su composición de negocios e inversión (S6/S9).

### ROIC y terminal: tres preguntas distintas

Separar retorno de activos existentes, retorno de capital nuevo y retorno terminal. Un ROIC histórico elevado no
prueba que el próximo dólar obtendrá lo mismo. Explicar duración y erosión de la ventaja. La referencia sectorial
no demuestra por sí sola una ventaja perpetua. Mantener el criterio terminal oficial de §4; documentar RESERVA y
sensibilidad si el mecanismo económico contradice su ancla, sin sustituir fórmulas ni elegir un ROIC para subir valor.

La expansión de margen produce crecimiento del beneficio además del crecimiento de ventas. No imponer de forma
mecánica g = reinversión × ROIC durante esa transición. En estabilidad, el control terminal relaciona reinversión,
g y retorno marginal con períodos compatibles; las ganancias de eficiencia no duran indefinidamente (S4/S5).

### Riesgo, alternativas y revisión posterior

Para cada riesgo material, anotar evento, flujos condicionados a continuidad, tasa sistemática, fracaso/recuperación
y posibles solapamientos. No contar dos veces el mismo evento. Menor margen en supervivencia y un fracaso distinto
pueden coexistir. Costo de capital común entre historias y fracaso solo en Disrupción siguen siendo convenciones
JMR: Damodaran usa otros diseños en sus casos y permite evolución del riesgo con la madurez (S3/S6).

Conservar cuatro historias con mecanismos defendibles, incluidos sus costos y restricciones. Las tres P son juicios
respaldados por pruebas; una marca Sí no es una probabilidad estimada. No asignar probabilidades por intuición ni
atribuir a Damodaran los porcentajes propios de §3. Un promedio C/B/O renormalizado es condicionado a ese conjunto,
no la esperanza de todos los desenlaces. Base, moda, mediana y esperanza no son sinónimos.

Antes de cerrar F3, escribir la objeción económica más fuerte a la Base y responderla con evidencia o RESERVA.
Después de cada resultado relevante, conservar previsión original, dato observado, error por motor y explicación:
¿cambió el dato, el mecanismo, la trayectoria o el alcance del negocio? Actualizar solo lo afectado y ejecutar sus
controles. Esto aplica el bucle de retroalimentación del autor sin convertir cada trimestre en una revaloración
completa automática (S2/S3).

### Lista adicional de cierre

- [ ] Los motores explican el recorrido anual y concilian con ingresos al año 10; mercado y comisión usan bases compatibles.
- [ ] El margen objetivo tiene un puente causal y costos coherentes con el crecimiento.
- [ ] La inversión considera capacidad, intangibles, escala y desfase sin duplicaciones.
- [ ] Retornos existentes, marginales y terminales se distinguen; eficiencia no se perpetúa.
- [ ] Cada supuesto material tiene ficha, contraevidencia y falsador; impactos no ejecutados se declaran.
- [ ] Convenciones JMR y enseñanzas del autor están diferenciadas; la Base admite contradicción específica.
