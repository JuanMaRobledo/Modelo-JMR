# Proceso JMR · aseguradoras

## R1 · Separar negocios y derechos

Identificar vida/ahorro/rentas, daños y accidentes (P&C), salud, reaseguro y gestión
de activos. Separar segmentos si difieren materialmente; un grupo mixto puede
requerir SOTP con valoración de equity por negocio y deuda/costos de matriz aparte.
Fijar perímetro legal, regulador, norma contable, clase de acción y capacidad de
remitir capital desde cada subsidiaria.

Principal: flujos distribuibles al común a Ke; DDM si pagos representan capacidad,
o exceso de retorno cuando el patrimonio y beneficio económico son conciliables.
No usar FCFF industrial ni valorar primas como ventas de software. R1 debe explicar
por qué el motor elegido refleja garantías, pasivos y capital del ramo.

## R2 · Desarmar utilidad, reservas y solvencia

Recopilar estados auditados, notas actuariales y reportes de solvencia. Separar
primas emitidas/devengadas o ingresos de seguros bajo la norma aplicable, sin mezclar
bases IFRS 17 y antiguas; siniestros, gastos y resultado de suscripción; cartera de
inversión, duración, calidad, rendimiento, valorizaciones y deterioros; reservas,
recuperables de reaseguro, resultados atribuibles al común y patrimonio conciliado.

P&C: ratios de siniestralidad/gastos/combinado en bases homogéneas, desarrollo de
reservas, IBNR, catástrofes, retención y reaseguro. Vida: pólizas en vigor, nuevo
negocio, persistencia/rescates, mortalidad/longevidad, garantías, tasas acreditadas,
costos de adquisición y ALM. Documentar base y tratamiento del CSM cuando exista;
CSM no es caja libre ni un activo que se agregue automáticamente al DCF.

Registrar régimen de solvencia y capital elegible/requerido, composición, deducciones,
colchones y restricciones. RBC, SCR/MCR u otro sistema son alternativas jurisdiccionales,
no porcentajes intercambiables. Conciliar capital prudencial con equity común;
no usar el ratio de solvencia como monto de patrimonio.

## R3 · Beneficio normalizado y capital que puede repartirse

Proyectar volumen/precio/mezcla y suscripción con siniestros y gastos normalizados;
modelar catástrofes y desarrollo adverso de reservas como riesgo, sin eliminarlos
por haber sido extraordinarios en un ejercicio. Proyectar inversiones con vencimientos,
reinversión, spreads de crédito y pérdidas; evitar usar solo el rendimiento histórico
cuando cambia la curva de tasas.

En vida/ahorro, modelar obligaciones y opciones de asegurados, rescates y costos del
nuevo negocio junto con activos y capital. En P&C, crecimiento de primas/reservas y
riesgo de activos determinan necesidades de capital; no imponer RWA/CET1 bancario.

Construir utilidad común y cambio de capital requerido sobre la misma base económica:
`flujo potencial_t = utilidad común_t − reinversión en capital común_t`.
Conciliar distribuciones efectivamente permitidas, capital atrapado y liberaciones
futuras. Un déficit puede necesitar aportaciones: mantener flujo negativo y dilución.
El float y los activos que respaldan reservas ya participan en el resultado y en las
obligaciones del negocio: no sumar el float como caja libre ni deducir otra vez todas
las reservas del valor de equity. Excedente solo con evidencia de disponibilidad.

Ke debe reflejar el ramo, moneda y país del equity asegurador. Justificar ROE sostenible
considerando suscripción, inversión y capital. Terminal con crecimiento de capital,
beneficio y payout coherentes, `Ke>g`; en base clean surplus puede contrastarse con
`TV=(ROE_estable−g)×B_n/(Ke_estable−g)`. No trasladar un ROE elevado por liberación de
reservas al terminal. Run-off y garantías materiales requieren sus propios flujos.

## R4 · Contrastes y pruebas de ruptura

Contraste de exceso de retorno en patrimonio compatible. P/E normalizado y P/BV/P/TBV
solo entre ramos, contabilidad, OCI, goodwill y riesgo comparables. Embedded value o
valor actuarial publicado es un contraste con perímetro propio: no sumarlo al DCF
completo ni asumir que incorpora el nuevo negocio de la misma forma. P/FCFE solo
con reparto potencial representativo; sin EV/EBITDA industrial por defecto.

Matrices: Ke×ROE terminal; P&C, combinado normalizado×carga de catástrofes; vida,
spread acreditado/inversión×rescates; capital objetivo×crecimiento. Añadir estrés
combinado de mercado, reaseguro/reservas y solvencia. Inverso: combinado/ROE o
spread que justifica el precio, conservando obligaciones y capital. No inventar una
matriz con nombres sectoriales sobre un DCF industrial intacto.

## R5–R6 · Evidencia exigida y seguimiento

Cerrar los puentes de reservas, inversiones, capital prudencial/common equity y
utilidad; comprobar que no se suma float/CSM dos veces. Tres historias, fuentes,
outputs nativos y adaptador compatibles antes de publicar. Fuentes actuariales
insuficientes mantienen bloqueada la parte material; la longitud del texto no la suple.
Seguir resultados de suscripción, reservas, ALM, rescates, reaseguradores y solvencia.
R6 contrasta el ciclo asegurador, calidad de reservas y distribución real del capital.

[Fuentes y controles comunes](README.md). Plantilla de arranque:
`Modelo-JMR-datos/reference/procesos-sectoriales/aseguradora.json`.
