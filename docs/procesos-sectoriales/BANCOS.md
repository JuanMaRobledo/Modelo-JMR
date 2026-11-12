# Proceso JMR · bancos

## R1 · Elegir el perímetro y el método

Confirmar banco comercial, banco de inversión, conglomerado, entidad digital o
prestamista; identificar qué negocio asume crédito/captación y cuál presta servicios.
Principal: FCFE de capital común/dividendos potenciales descontado a Ke. DDM de
pagos observados solo si la política de reparto representa capacidad distribuible;
si acumula capital o está restringido, conciliar la diferencia. Exceso de retorno
es contraste del mismo patrimonio y supuestos, no un segundo valor para promediar.

Registrar regulador, entidad legal que genera/puede remitir dividendos y clase
ordinaria/ADR. Determinar si se requiere SOTP de negocios diferentes.

## R2 · Historia y puente de capital

Obtener estados auditados, notas, reportes prudenciales y divulgaciones de riesgo.
Cargar cartera bruta/neta y por tipo, depósitos/fondeo, ingresos y gastos financieros,
comisiones, gastos, pérdidas crediticias, castigos/recuperaciones, mora y coberturas;
patrimonio atribuible al común, preferentes/AT1 y minoritarios; RWA, capital CET1,
Tier 1, capital total, deducciones, colchones y restricciones. Conciliar cifras IFRS/
GAAP con las prudenciales: CET1 no equivale automáticamente a patrimonio contable.

Preparar puentes de utilidad común, reservas, acciones y patrimonio: apertura +
resultado + emisiones − recompras − dividendos ± OCI/FX/otros = cierre. El ROE
histórico usa una base consistente (habitualmente promedio); el proyectado debe
indicar explícitamente qué capital inicial/promedio genera el resultado.

Clasificar depósitos y fondeo del negocio dentro de los resultados de intermediación.
No restarlos de nuevo como deuda neta tras calcular equity; no sumar caja operativa,
reservas de liquidez ni cartera como activos extra. Solo un excedente efectivamente
liberable puede sumarse por separado, una vez y con fecha/fuente.

## R3 · Historia → crédito → capital → flujo

Por año y escenario: clientes/volumen y cartera, rendimiento de activos, costo de
fondeo, spread/NIM, comisiones, eficiencia, costo de riesgo e impuestos → utilidad
atribuible al común. Usar resultados después de pérdidas crediticias normalizadas;
no normalizar toda pérdida como excepcional ni extrapolar liberaciones de provisiones.

RWA y densidad de riesgo, deducciones y metas de capital prudenciales generan capital
común requerido. Documentar el puente a patrimonio económico/contable; no multiplicar
CET1 por RWA y tratarlo como patrimonio contable sin conciliación. Usar el mayor
requerimiento que realmente limite la distribución, considerando colchón de gestión,
liquidez y restricciones legales; no asumir un porcentaje universal.

En una base conciliada y sin otros movimientos no operativos:

`FCFE_t = utilidad común_t − (capital común requerido_t − capital común requerido_(t−1))`.

Separar emisiones externas, OCI y distribuciones: la aportación necesaria es un flujo
negativo para el accionista; no truncarla a cero. Si la distribución legal es menor,
modelar el capital retenido y su liberación futura, no hacerlo desaparecer. Déficit
inicial, rescate o dilución exige escenario completo y efecto por acción.

Ke usa moneda y riesgo del equity bancario, beta de comparables financieros y país
compatibles; no aplicar mecánicamente D/E de depósitos a beta desapalancada industrial.
Mantener Ke de partida común entre historias JMR; riesgos idiosincráticos van en flujos
coherentes. Una tasa terminal distinta debe reflejar transición documentada de riesgo.

Terminal con capital inicial `B_n`: `NI_(n+1)=ROE_estable×B_n`,
`reinversión_(n+1)=g×B_n`, `TV=(ROE_estable−g)×B_n/(Ke_estable−g)`.
La identidad `g=retención×ROE` solo se usa en estado estable y bases compatibles.
Exigir `Ke>g`, payout sostenible y capital suficiente. ROE estable superior a Ke
requiere ventaja defendible; ni ROE=Ke ni un premium son supuestos automáticos.

## R4 · Contrastes e incertidumbre

Conciliar con `equity=B_0+VP(NI_t−Ke_t×B_(t−1))+VP(exceso terminal)` bajo clean surplus.
Ajustar OCI, recompras y base de capital antes de concluir que una diferencia es error.
Contrastar P/E con utilidad común normalizada y P/BV o P/TBV con patrimonio compatible,
ROE, riesgo y calidad de activos. P/FCFE solo con flujo positivo y representativo.
EV/EBITDA y EV/FCFF se excluyen de la ruta bancaria: no completar pesos industriales.

Matrices: Ke×ROE terminal, crecimiento de RWA×capital objetivo y costo de riesgo×NIM.
Probar estrés combinado de crédito/fondeo/capital, no solo cambios aislados. Inverso:
ROE o rentabilidad requerida por el precio, respetando capital y restricciones.
Centros deben reproducir Base; un cambio de inputs invalida corridas y el inverso.

## R5–R6 · Entrega y ruptura de tesis

Publicar solo con capital/depósitos y utilidad común conciliados, derechos y acciones
correctos, tres historias y contrastes aplicables, fuentes, motor y adaptador verificados.
Seguir trimestralmente mora, costo de riesgo, NIM, depósitos, capital, restricciones y
dilución. R6 debe cuestionar recuperación crediticia, solvencia y ROE terminal.
Un incumplimiento regulatorio o capital negativo exige recapitalización/run-off o
resolución explícita; la perpetuidad de un banco sano no resuelve insolvencia.

[Fuentes y controles comunes](README.md). Plantilla de arranque:
`Modelo-JMR-datos/reference/procesos-sectoriales/banco.json`.
