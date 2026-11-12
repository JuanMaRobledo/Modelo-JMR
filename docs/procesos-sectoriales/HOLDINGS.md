# Proceso JMR · holdings

## R1 · Dibujar qué posee el accionista

Identificar holding de inversiones, conglomerado operativo o grupo financiero mixto.
Construir organigrama con participaciones directas/indirectas, porcentajes económicos
y de voto, clases, acciones en tesorería, pactos, preferentes y derechos de terceros.
Usar balances separados de matriz además de consolidados. Distinguir control de
propiedad económica: controlar una filial no da derecho al 100% de su equity.

Principal: SOTP intrínseco del patrimonio común atribuible. NAV a precios de mercado
se calcula y etiqueta aparte; no sustituye una valoración intrínseca sin cambiar su
nombre/base. No usar un WACC consolidado universal para todos los negocios.

## R2 · Inventario y puente de la matriz

Cada participación lleva ID único, emisor, porcentaje económico, fecha, moneda,
clase, método, fuente y alcance: valor del equity completo o valor ya atribuible.
Conciliar inventario con inversiones en estados separados, asociadas, consolidadas
y cambios de estructura posteriores al corte. No usar valor en libros como valor
intrínseco por comodidad; explicitar la limitación si solo hay una aproximación.

Obtener caja libre exclusivamente de matriz, deuda externa propia, préstamos
intercompañía, garantías/apoyos obligatorios, preferentes y otras obligaciones,
costos recurrentes de matriz y fiscalidad. Distinguir efectivo atrapado y caja de
filiales que ya está incluida en su valor. Separar impuestos ya incorporados de los
que surgirían por una venta plausible, con base fiscal, tasa, fecha y probabilidad.
No deducir siempre impuestos de liquidación en una tesis de continuidad.

## R3 · Valorar partes y recomponer

Valorar operativas por FCFF/WACC, bancos/aseguradoras por flujos a equity/Ke y otros
activos por enfoque adecuado. Si una parte llega como EV, primero convertirla a
valor de equity con sus propios derechos y deuda; recién después multiplicar por
participación. Si ya llega como equity, no restar la deuda de esa filial otra vez.

`equity común matriz = Σ(participación económica × equity de cada parte)
 + caja/activos libres de matriz no incluidos
 − deuda y derechos externos de matriz
 − VP(costos de matriz no incluidos)
 − VP(impuestos incrementales no incluidos)`.

Usar o bien la participación atribuible de cada filial o bien una valoración de
100% con deducción de terceros a valor económico, nunca ambos. Las filiales
incluidas dentro de otra parte no se vuelven a añadir. Si existen participaciones
recíprocas, resolver el sistema de propiedad sobre valores propios sin la tenencia
cruzada y comprobarlo; no multiplicar porcentajes en círculo ni sumar capitalizaciones
brutas. Sin información suficiente, esa porción queda N/D y se cuantifica el bloqueo.

Consolidar costos corporativos una sola vez. Si ya se asignaron a cada negocio,
no volver a capitalizarlos en matriz. Garantías/recursos con recurso al holding se
incluyen cuando no estén en las partes; responsabilidades de filiales limitadas
no se convierten automáticamente en deuda propia de la matriz.

Tres historias coordinadas por negocios y factores comunes: ciclo, moneda, tasas,
regulación, capital y decisiones de matriz. No armar un optimista sumando máximos
independientes que no puedan ocurrir juntos. Monedas y cortes homogéneos: descontar
cada parte en su moneda/tasa coherente y convertir al mismo corte, no mezclar flujos
reales con tasas nominales. Explicar concentración y dependencia de dividendos.

## R4 · Qué significa el descuento de holding

Comparar SOTP intrínseco y NAV de mercado, separando el descuento observado del
ajuste económico. Descuento observado = 1 − capitalización comparable/NAV de mercado
positivo; no aplicarlo al SOTP como factor adicional para justificar el precio.
Gobierno, asignación de capital, fuga fiscal, iliquidez y costos deben traducirse a
flujos/derechos verificables. Si se usa un ajuste residual, exigir fundamento y
probar que no repite costos/impuestos/riesgos ya descontados. No porcentaje universal.

Sensibilidades: valor de las dos mayores partes, supuestos/tasas de sus negocios,
FX relevante, impuestos y costo corporativo. El centro de cada matriz coincide con
SOTP Base. Inverso: valor implícito de una parte o costo/descuento implícito que hace
coincidir el precio; no usar esa solución como input recomendado. No crear un DCF
consolidado para llenar un requisito industrial. Contrastes por múltiplos de las
participadas usan sus propios denominadores y métodos sectoriales.

## R5–R6 · Derechos por acción y cierre

Puente a valor por clase con derechos económicos reales y acciones actualizadas;
no dividir el mismo equity íntegro entre cada clase. Si una preferente se resta
como derecho no se incluyen además sus acciones convertidas en ese mismo caso.
MOS 35% exclusivamente sobre SOTP Base por acción. Publicar tabla de partes,
participaciones, EV→equity cuando aplique, puente matriz, fuentes, tres historias y
salvedades. R6 debe reproducir propiedad, evitar doble conteo y cuestionar el valor
de las partes grandes y las transferencias de capital.

Revisar después de resultados de participadas, ventas/adquisiciones, recompras,
cambios de propiedad y refinanciación de matriz. Un SOTP antiguo no se vuelve
actual por actualizar solo la cotización del holding.

[Fuentes y controles comunes](README.md). Plantilla de arranque:
`Modelo-JMR-datos/reference/procesos-sectoriales/holding.json`.
