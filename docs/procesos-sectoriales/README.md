# Procesos sectoriales Damodaran · JMR

Versión 1.0 · 12-nov-2026. Procesos para iniciar revisiones nuevas; no migran ni
revalúan expedientes existentes. Complementan el flujo Floyd R1–R6 y prevalecen
sobre los requisitos industriales cuando el emisor pertenece a estos perfiles.

| Perfil obligatorio en el expediente | Proceso | Principal | Contraste |
|---|---|---|---|
| `banco` | [Bancos](BANCOS.md) | FCFE de capital común / dividendos potenciales a Ke | Exceso de retorno; P/E, P/BV o P/TBV compatibles |
| `aseguradora` | [Aseguradoras](ASEGURADORAS.md) | Flujos distribuibles al común a Ke, por segmento cuando proceda | Exceso de retorno; múltiplos de patrimonio/beneficio normalizado |
| `holding` | [Holdings](HOLDINGS.md) | SOTP del patrimonio atribuible al común | NAV a mercado separado y múltiplos de participadas |

Una sociedad llamada «Holdings» puede ser un banco operativo: clasificar por
actividad, estructura y estados, no por nombre. Un conglomerado financiero puede
necesitar SOTP con bancos y aseguradoras valorados con sus propios procesos.
Una fintech de pagos sin captación ni riesgo crediticio propio puede ser operativa;
no imponer FCFE bancario sin analizar su actividad. REIT, fondos, fondos cerrados,
brokers y empresas en liquidación requieren clasificación adicional; no inferir que
encajan en los tres perfiles por ser financieros.

## Qué deriva de Damodaran y qué es convención JMR

Damodaran fundamenta la valoración de equity financiero, la reinversión en capital,
el vínculo crecimiento–rentabilidad–payout y el análisis de participaciones. Las
fases R1–R6, tres historias, costo del equity común entre historias al mismo corte,
MOS 35% sobre el principal Base, las puertas de publicación y el formato editorial
son convenciones JMR. Las exigencias regulatorias y contables son específicas del
emisor, jurisdicción y fecha: obtenerlas de regulador y estados actuales. No copiar
porcentajes históricos de ejemplos del autor como si fueran mínimos vigentes.

## Entrega común a los tres procesos

- Identidad: ticker, revisión inmutable, perfil, subtipo, perímetro consolidado/legal,
  clase de acción, moneda, escala, corte y precio fechado; hasta 10 FY + LTM cuando
  existan, sin inventar historia ausente.
- Un libro sectorial y un Doc A por revisión, con fuentes, históricos, ajustes,
  inputs, proyecciones C/B/O, principal, múltiplos aplicables, matrices/inverso,
  asuntos por revisar y firmas de inputs. Este requisito organizativo NO convierte
  el libro en `floyd-libro-unico-v1`: ese contrato identifica el Ginsu industrial.
- Matriz fuente → dato → transformación → celda → salida; inputs separados de
  fórmulas; snapshots identificados por revisión/corte/versión y huella SHA-256.
- Tres historias completas y coherentes, esperado separado, MOS solo al Base.
  Fracaso, si corresponde, explícito en Conservadora y sin repetir el mismo riesgo
  en tasa, flujos y probabilidad. La Base puede perder valor: no calibrar al precio.
- R5 usa el análisis de 14 capítulos y Nivel 2 de 12 apartados de esa revisión.
  Cambiar contenido económico de los apartados: ROE/capital o participadas en vez
  de llenar con EBITDA, CAPEX o deuda industrial que no sean aplicables.
- R6 revisa independientemente economía, datos, derechos del común, terminal y
  posible doble conteo. Un test de fórmula no es R6.

## Inicio y controles ejecutables

Crear un expediente de proceso desde `reference/procesos-sectoriales/banco.json`,
`aseguradora.json` o `holding.json`, completar su matriz de fuentes y controles y
ejecutar en `Modelo-JMR-datos`:

```sh
node scripts/preflight_sectorial.cjs expediente-sectorial.json
```

El resultado distingue `R1_LISTO`, `R2_LISTO`, `R3_R4_LISTOS` y
`CANDIDATO_R5_COMPLETO`. Cada fase mantiene la lista exacta de pendientes. No
autopublica ni atribuye `EN_REVISION`. El preflight industrial rechaza los tres
perfiles para evitar ejecutar Ginsu por error.

Para comprobar un ejemplo **sintético**, ejecutar desde `JMR-valuation`:

```sh
python3 scripts/comprobar_sectorial.py reference/procesos-sectoriales/ejemplo_banco.json
python3 scripts/comprobar_sectorial.py reference/procesos-sectoriales/ejemplo_aseguradora.json
python3 scripts/comprobar_sectorial.py reference/procesos-sectoriales/ejemplo_holding.json
```

Los ejemplos no contienen emisores reales ni supuestos recomendados. El comprobador
de equity exige capital común conciliado y clean surplus, mantiene aportaciones
negativas y verifica la identidad FCFE/exceso de retorno. El de SOTP detecta EV sin
convertir, posiciones duplicadas/anidadas y propiedad cruzada sin resolver.

Para los cálculos, usar fórmulas nativas de Sheets/Excel en una copia de un modelo
apropiado verificado, o construir un libro sectorial en mantenimiento separado.
La existencia de extensiones NU/PAGS/XP históricas no certifica una plantilla
reutilizable: algunas tienen datos y direcciones de emisor incrustados.
`JMR-valuation/scripts/comprobar_sectorial.py` es un comprobador matemático
independiente de capital/retornos o SOTP; sus números no se pegan sobre la hoja.

**Puerta real de publicación:** datos y cálculos completos, conciliaciones, firmas
vigentes, integridad del motor, documento y JSON de la misma revisión, adaptador y
validador compatibles con el contrato sectorial, catálogo y QA real de app. Si falta
plantilla o adaptador, conservar candidato y entregar diagnóstico; no inventar IDs,
activar el contrato industrial ni relajar el control para hacer visible la ficha.
R6 pendiente puede figurar como salvedad en una publicación EN_REVISION compatible,
según la política vigente; un dato/cálculo necesario ausente sigue bloqueando.

## Fuentes primarias verificadas

Consultadas el 12-nov-2026; la antigüedad del texto no sustituye regulación actual.

- [Damodaran, Valuing Financial Service Firms, abril de 2009](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/finfirm09.pdf): patrimonio, capital, dividendos potenciales y exceso de retorno.
- [Financial Service Companies: Value Drivers](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/bankvaluedriver.htm): riesgo de equity y reinversión regulatoria; evitar reapalancar una beta bancaria como si fuera industrial.
- [Valuing Financial Service Firms, capítulo](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/finfirm.pdf): modelos de equity y contraste de rentabilidad/patrimonio.
- [Cash and Non-operating Assets](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/cashval.pdf): participaciones, caja y perímetro de consolidación.
- [Cash and Cross Holdings](https://aswathdamodaran.blogspot.com/2010/05/cash-and-cross-holdings.html): riesgos económicos de propiedad cruzada y gobierno.
- [Índice oficial de modelos](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/spreadsh.htm): `divginzu.xls` para dividendos y modelos financieros; seleccionar el enfoque antes del archivo, contrastar versión e integridad.
