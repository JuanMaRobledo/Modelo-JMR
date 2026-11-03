# Propuesta de flujo operativo JMR · una ejecución, controles diferenciales y publicación separada

**3-nov-2026 · propuesta para revisión en PR #172, no normativa ni implementada.** Complementa el flujo de cinco fases v2 y `REGLAS_VIGENTES.md` v27. **No** altera A-1.2, fórmulas, hojas oficiales, datos de AMZN ni autorización de publicación.

## Problema real observado (no mera percepción de lentitud)

1. El flujo vigente exige invocar varias fases y entregar expedientes repetidos. F1 inicia DCF antes de cerrar el histórico integral F2, por lo que faltantes tardíos pueden obligar a reparar la captura y volver a revisar supuestos.
2. `JMR-valuation/scripts/jmr_one_pass.py` ya existe y soporta snapshot/decisiones/insumos/plan, `--run-pipeline` y reanudación congelada. **No** ejecuta automáticamente análisis editorial, auditoría económica o publicación: su propio contrato dice que no certifica DCF ni publica.
3. `jmr_revision_pipeline.py` ya enlaza foto, DCF inverso, múltiplos, tablas, sensibilidades, Nivel 2 y controles con hashes. **Reutilizarlo**, no escribir otro motor financiero paralelo.
4. `controles_todas.sh` mezcla validadores que consumen registro y hoja oficiales/publicados: aún no sabe validar una candidata por `ticker + revision_id + sheet_id`. En AMZN R5 esto impide la prueba integrada sin riesgo de comprobar otra revisión.
5. `estados_completos.py` identifica vacíos por prevalencia de la fila en empresas comparables; confunde **alerta para cotejo** con **error material**. Amazon R5 muestra 11 filas, entre ellas desgloses agregados, emisión de acciones y LFCF derivable, que no deben llenarse por comparación con otras firmas.
6. `auditar_estados_sec.py` informa 20 diferencias en R5: 11 signos fiscales, 8 EPS pre-split y 1 PPE con fecha no comparable. El código 0 del auditor significa **informe terminado**, no conciliación aprobada.
7. No se midió aún un ahorro real de tokens; los agentes siguen leyendo documentos extensos, rangos y logs repetidos.

## Cambio propuesto: mismo método, menos trabajo repetido

### Experiencia externa

- **Comando principal:** `Valorar <TICKER> con Método JMR A-1.2, corte <FECHA>; continúa desde revisión <ID>.` El usuario no necesita invocar manualmente F1–F4 una a una, salvo cuando lo solicite.
- **Por defecto, una corrida continua F1→F4:** subetapas persistidas; F5 sigue como auditoría independiente posterior, nunca autocertificada por el mismo ejecutor.
- **Entrada mínima:** ticker, fecha de corte y revisión si existe. Buscar lo demás en el expediente. No volver a pedir un dato conocido.
- **Intervención humana solamente** para hipótesis/juicios económicos controvertidos o aprobación requerida antes de publicación. La fase F4 solo publica `EN_REVISION` cuando el usuario autorizó la publicación y el gate oficial de *esa misma revisión* aprobó.

### Contrato de datos y continuidad

1. `identidad.json`: `ticker`, `revision_id`, `sheet_id`, corte, plantilla, moneda, método, commits tres repos, hashes y versión. Prohibido resolver hoja publicada si se suministró `sheet_id`.
2. **Una extracción, acumulativa:** capturar FY/LTM mínimos en F1; F2 completa hasta 10 FY+LTM reutilizando las mismas filas, fuentes y períodos. Cache/snapshot SEC/NIIF con registro por `concepto + período + unidad + signo + fuente + celda`. Sin copiar manualmente las mismas cifras a hojas distintas.
3. **Estados primarios → fórmulas → Input → DCF/múltiplos.** Solo ingresar datos primarios y supuestos de analista en celdas aprobadas. WACC, capitalización I+D, leases, valor de opciones, ROIC, S/C, reinversión, múltiplos y sensibilidad calculados en plantilla/scripts; conservar fórmulas y auditarlas.
4. **Estado por dato sin rellenar ficticiamente:** `VERIFICADO`, `AGREGADO_CON_PUENTE`, `NO_APLICA_CON_FUENTE`, `PROXY_MATERIALIZADA`, `PENDIENTE_MATERIAL`, `PENDIENTE_SECUNDARIO`. En caso agregado, conservar celda vacía + fuente/puente a total, sin fingir cero. Un resultado dependiente de dato material no verificado es `N/D`, no un valor aprobado.
5. Si una revisión parcial falla, **reanudar solo la etapa afectada** y sus dependientes, con snapshots congelados. No clonar hoja, repetir SEC, cambiar escenarios ni crear R6 por cada salvedad.

### Puertas por objetivo (obligatorias, pero no todo es un bloqueo global)

- **Puerta A · calidad mínima de cálculo:** suficientes insumos materiales, ausencia de fórmula sustituida, integridad de identidades que alimentan salida, puente y WACC, cuatro DCF reproduciéndose; si falla una salida, marcar solo esa salida `N/D`. Permite seguir capturando datos, estimando otros componentes y redactando.
- **Puerta B · calidad de expediente:** histórico requerido, reconciliación SEC/NIIF según unidad, signo, split y fecha, anotaciones de agregados y N/A, supuestos F3 explicados, cinco múltiplos aplicables + sensibilidades, reproducibilidad entre snapshot/hoja/JSON. Clasificar hallazgos por materialidad; un aviso secundario no reabre F1.
- **Puerta C · promoción/publicación:** runner específico del candidato con `--ticker --revision-id --sheet-id --cutoff --manifest`; valida evidencia A+B, integridad estructural, correspondencia exacta de libro↔motor↔JSON↔app y todas las pruebas oficiales, sin sustituirlas por comparaciones con empresas publicadas. Falla cerrado ante `NO_EJECUTADO`, evidencia ajena o error material. Publicación `EN_REVISION` solo con aprobación de usuario en el contexto correspondiente.
- **F5:** auditoría económica independiente post-publicación, guiada por observaciones, con mismo snapshot congelado y versiones. No sirve para diferir problemas técnicos ya conocidos.

### El agente ve un informe corto, no miles de celdas

Un `resumen_ejecucion.json` más un parte de una pantalla: valor principal Base y MOS35%, cuatro historias, WACC, ROIC, márgenes, S/C, múltiplos y rango de sensibilidad, errores materiales por componente, salvedades documentadas, **cambio desde la ejecución previa** y próximo paso exacto. El detalle completo queda en artefactos y solo se abre si hay anomalía. Métricas: tokens entrada/salida, volumen de contexto, lecturas de Sheets, llamadas a SEC, reprocesos, tiempo de ejecución y pruebas verificadas; nunca prometer porcentaje de ahorro sin comparativa real.

## Aplicación inmediata y mínima a AMZN R5

**No reiniciar, no borrar hojas, no ajustar los 149,19 USD por acción al precio de mercado.** Revisión: [AMZN R5 PR #234](https://github.com/JuanMaRobledo/Modelo-JMR-datos/pull/234); motor [PR #203](https://github.com/JuanMaRobledo/JMR-valuation/pull/203).

| Prioridad | Trabajo exacto | Criterio de aceptación |
|---|---|---|
| 1 | Clasificar 11 filas de `estados_completos` por período con evidencia SEC y dependencia: agregado/derivado/no aplica/faltante material. El script debe leer esa clasificación y reportar **cobertura + faltantes materiales**, no suspender por cualquier blanco legítimo. | Los casos documentados no dan falso positivo; quitar una cifra material vuelve a fallar; no se pega cero ni se relaja regla. |
| 2 | Homologar auditor SEC: impuesto con convención de signo, EPS 2016–19 ajustado 20:1, PPE LTM con fecha de corte correcta y disponibilidad real, sin falsa comparación. | Desaparecen solo diferencias **explicadas**; las no conciliadas permanecen como hallazgos; comparaciones con prueba positiva/negativa. |
| 3 | Verificar regresión de las siete correcciones de la copia R5 y fijar snapshot posterior; conservar intactos cuatro DCF y WACC salvo causa documentada. Revisar múltiplos 2022 y P/OCF con el valor vigente. | Valor previo→nuevo de cada cambio, reproducibilidad, 0 fórmulas reemplazadas; el DCF Base sin cambio si drivers no cambian. |
| 4 | Convertir las comprobaciones candidatas de PR #203 en entrada de runner integrada y homologar `probabilidades`, `controles_supuestos`, `consistencia_migracion`, `integridad_hojas` a identidad exacta de R5 sin alterar publicación. | Runner ejecuta **todas** las pruebas requeridas y muestra código real, `PASS/FAIL/NO_EJECUTADO` por control; nunca consulta R2/R3 o catálogo publicado como sustituto. |
| 5 | Revisar economía F3: CAPEX bruto vs neto y desfase, Sales-to-Capital 0,72, ROIC terminal, márgenes por AWS/Retail/ads, WACC multinegocio, R&D/RSU/leases, activos no operativos, múltiplos y sensibilidades. | Tabla por supuesto `mantener/cambiar/reserva`, con fuente, racional, escenario, impacto y nueva prueba; sin fabricar FCFF positivo. |
| 6 | Elaborar Nivel 1/2, reconciliar JSON/hoja/app, someter a publicación condicional y preparar F5 separado. | Entrega única trazable; `EN_REVISION` solamente con autorización y Puerta C verde. |

La última reejecución autenticada de [Actions #41609454032](https://github.com/JuanMaRobledo/JMR-valuation/actions/runs/41609454032) reportó 0 entradas faltantes, 0 alertas de ceros, 15/15 candados y 0 reemplazos fórmula→constante, pero el validador histórico aún marca 11 filas y SEC 20 diferencias informativas. **Esto no es certificación**. El DCF Base calculado en vivo sigue 149,19148575564947 USD/acción y WACC 8,179602956%.

## Prueba transversal para otras empresas

Después de AMZN: ejecutar **ADBE** (software e I+D) y otra empresa de naturaleza diferente (p. ej., **NU** con FCFE/sector financiero) a partir de sus propias revisiones, no copiando supuestos de Amazon. Probar variaciones de fiscal-year-end, UDM, EPS split, operaciones sin opciones, empresas con pérdidas, apartados agregados y NIIF/Colombia.

**Definición de terminado del proceso:** una nueva empresa se puede procesar por el mismo orquestador sin modificar prompts ni scripts por ticker; una sola captura primaria reutilizable; hipótesis financieras justificadas; mismo snapshot+mismo código→mismos resultados; ningún control obligatorio omitido; el agente solo lee diferencias; los errores secundaros no reinician el trabajo; publicación diferenciada. Si solo AMZN funciona con excepciones codificadas ad hoc, **no se considera estandarizado**.

## Implementación incremental sin crear un segundo sistema

Primero corregir `estados_completos.py` (clasificación auditable y pruebas), `auditar_estados_sec.py` (signo/split/fecha) y completar modo candidato en un runner único que **envuelve** `jmr_one_pass.py` y `jmr_revision_pipeline.py`, no sustituye su motor. El trabajo de desarrollo va en PR(s) de `JMR-valuation` y pruebas aisladas; este documento por sí solo no modifica su ejecución. Solo tras piloto completo elevar las reglas operativas al README y `REGLAS_VIGENTES.md` mediante PR, sin renombrar retroactivamente expedientes.
