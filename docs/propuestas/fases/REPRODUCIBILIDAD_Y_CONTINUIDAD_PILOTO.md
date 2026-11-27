# Contrato piloto JMR · reproducibilidad sin bloqueo operativo

**Propuesta en rama aislada (3-nov-2026). No es una modificación normativa aprobada.**
Complementa, sin reemplazar, `modelo/REGLAS_VIGENTES.md` v27, `CONTRATO_INSUMOS_FASE_1.md` y el flujo vigente de **cinco fases**. Se aplica por ticker/revisión/hoja/corte; no modifica fórmulas ni plantillas, no cambia el motor ni autoriza publicación.

## Propósito y regla central

**Repetir la ejecución con las mismas entradas, supuestos, fórmulas, motor y corte debe producir las mismas salidas dentro de una tolerancia numérica declarada.** Si cambian los datos o el método, el cambio de resultado debe explicarse y auditarse, no forzarse al precio del modelo antiguo. La referencia inicial para revisar pérdidas de alcance es el prompt maestro v5 del 21-oct-2026 más el Método A-1.2; **no** se considera probada una calibración numérica anterior hasta reconstruir su snapshot exacto.

**Dos puertas diferentes:**
- **Continuidad de trabajo:** siempre permite seguir capturando, conciliando, investigando, redactando borradores y calculando **salidas no afectadas**. Un faltante documental menor no obliga a reiniciar una valoración ni impide pasar a la siguiente fase como `CANDIDATO_CON_RESERVAS`.
- **Validez de una salida / promoción:** cada dato o fórmula material sin resolver invalida **solo** los cálculos dependientes; no se publica ninguna revisión con errores materiales, fórmulas inconsistentes o controles oficiales de publicación faltantes. Pasar de fase operativa **no** significa aprobarla ni saltarse CI.

## Severidad, decisión y responsable

| Hallazgo | ¿Continuar investigación / fase? | ¿Calcular salida afectada? | ¿Publicar? |
|---|---|---|---|
| **M0**: identidad, hoja, período o fórmula estructural incompatible; error material en cifras, impuestos, bridge o WACC | Sí, en apartados independientes; aislar la salida afectada | No, hasta corregir/conciliar | No |
| **M1**: insumo material ausente o proxy no cuantificada; coherencia económica material no demostrada | Sí, como candidato con reserva y tareas concretas | N/D para el componente afectado; sí para los demás | No |
| **D2**: dato secundario, nota, peer parcial, diferencia no material cuantificada, control opcional pendiente | Sí, sin escalamiento automático | Sí, si se demuestra que no afecta materialmente | Solo cuando pasan los controles **obligatorios** de publicación |
| **N/A**: concepto verdaderamente no aplicable con condición y fuente/racional documentados | Sí | Sí | No bloquea por sí mismo |

Materialidad secundaria: aplicar umbrales y condiciones de `REGLAS_VIGENTES.md` §4B (impacto individual <2 %, conjunto <3 %, sin alterar decisión, identidades ni fórmulas), **no** convertir esos límites en tolerancia automática para un error conocido. Si el impacto es indeterminado, tratar como material hasta acotarlo. Una discrepancia SEC no es automáticamente M0: primero verificar signo, unidad, fecha y split; tampoco se aprueba porque un script devuelva 0.

## Calidad de captura, diferenciada del avance por fases

1. **F1 — insumos reales mínimos:** extraer el inventario de dependencias desde las fórmulas vigentes de `Input sheet`, DCF, WACC, I+D, leases, `Option value`, deuda/activos no operativos, RSU/SBC, escenarios y cinco múltiplos aplicables. Registrar el estado de **cada** dependencia material: fuente, período, unidad, signo, celda, clasificación (`VERIFICADO`, `AGREGADO_CON_PUENTE`, `PROXY_CON_RANGO`, `NO_APLICA`, `PENDIENTE`) y prueba independiente. No sustituir `PENDIENTE` o `NO DESGLOSADO` por cero. Un DCF con `LISTO` no certifica esta cobertura.
2. **F2 — estados completos:** capturar y contrastar hasta 10 FY + LTM cuando existen; comprobar balance, flujo, ingresos, impuestos, acciones ajustadas y períodos comparables. Dato incluido en otra línea requiere nota y puente, no un cero inventado.
3. **F3 — calibración:** revisar crecimiento, EBIT, CAPEX/reinversión, Sales-to-Capital marginal, ROIC/RONIC, WACC, terminal y múltiplos, con decisión `MANTENER/CAMBIAR/RESERVA`. Se calcula el impacto de cambios, sin intentar igualar por fuerza el valor histórico.
4. **F4 — análisis y eventual publicación:** se puede preparar Nivel 1 y 2 como borrador; la promoción a `EN_REVISION` exige la puerta integrada real sobre **el mismo sheet_id y revisión**, más calidad material aprobada.
5. **F5 — auditoría guiada independiente:** no sustituye los controles de F1–F4 ni detiene correcciones documentadas de investigación.

## Manifiesto por ejecución (no opcional cuando se habilite el gate)

Guardar un artefacto inmutable por corrida, idealmente JSON y log, con: ticker, `revision_id`, `sheet_id`, fecha de corte, moneda y método; SHA de tres repos y versión de plantilla; hash de entradas y fuentes congeladas, grafo de dependencias, fórmulas y supuestos; inventario por celda/fuente/período; pruebas ejecutadas con comando, exit code y evidencia; salidas DCF de cuatro historias, MOS, WACC, ROIC, S/C, FCFF y múltiplos aplicables; diferencias contra la corrida anterior; salvedades y decisión de avance/promoción. Cada paso almacena su artefacto y reanuda con los hashes anteriores. Un valor cambiado con hashes iguales es regresión; con hashes distintos exige causa, revisión y sensibilidad.

**No se reabre la extracción de F1/F2 por un pendiente económico F3**; sí se corrige o completa la celda exacta y se repiten únicamente sus cálculos y pruebas dependientes. Si una fuente mejora, no borrar el valor anterior: versión nueva + diferencia explicada.

## Caso piloto AMZN R5 — diagnóstico documentado, no cierre

- Vigente: datos PR [#234](https://github.com/JuanMaRobledo/Modelo-JMR-datos/pull/234), hoja `199x_GNl2608SFjj58hCtTjWpxleL2rqtRPJl4lZdW5I`. No reutilizar R2/R3 ni R4 como datos operativos. Valor Base **USD 149,19/acción PROVISIONAL**, MOS35% **USD 96,97** (no calibración objetivo).
- Insumos esenciales por `inputs_completos.py`: **0 vacíos** en la ejecución oficial registrada. Esto **no** demuestra que toda la clasificación contable/SEC sea correcta.
- Siguen documentadas **11 filas vacías** a clasificar y **20 diferencias SEC** preliminares (signos fiscales, EPS split y PPE de corte diferente); se deben reconciliar por fecha/definición, no rellenar indiscriminadamente.
- Incidencia de fórmulas fiscales heredadas [motor #204](https://github.com/JuanMaRobledo/JMR-valuation/issues/204); P/OCF documentado no coincide con salida calculada; `controles_todas.sh` **no está homologado ni ejecutado contra R5**. Ver [acta](https://github.com/JuanMaRobledo/Modelo-JMR-datos/blob/amzn/20261102-r5-plantilla-ia-limpia/candidatos/valoraciones/AMZN-20261102-A12-R5/CIERRE_TECNICO_F1_F2_20261103.md).
- **Se permite** avanzar con investigación económica, revisión de peers, CAPEX, ROIC y borrador de análisis como candidato; **no** certificar los precios afectados por errores de fórmula ni publicar/fusionar hasta corrección y puerta integrada.
- Siguiente secuencia mínima: (a) snapshot reproducible R5 y grafo; (b) clasificar 11 filas y homogeneizar SEC; (c) corregir fórmulas fiscales en **copia y PR de motor** con regresión; (d) ejecutar puertas con ID R5 explícito; (e) evaluar CAPEX/reinversión y explicar variación respecto del snapshot anterior; (f) ensayar ADBE y un negocio diferente.

## Prueba de aceptación transversal

1. Mismo snapshot+SHA de motor/plantilla+supuestos+fuentes → mismos resultados dentro de tolerancia, incluidas sensibilidades y múltiplos; cualquier diferencia inesperada falla.
2. Falta deliberada en un insumo material con escenarios `LISTO` → no se certifica la salida ni se publica, pero **continúa** el trabajo no afectado.
3. Campo condicional con `No` y justificación → `NO_APLICA`, sin forzar cero; no bloquea.
4. Hallazgo documental menor → tarea pendiente y continuidad, sin reconstrucción ni pérdida de avance.
5. Cambio de fórmula, supuesto, corte o fuente → delta explicado y nueva revisión/snapshot; no publicar con regresión material.
6. Las pruebas no pueden aprobar R5 leyendo el expediente publicado, una plantilla o la hoja R2.

Este documento es un **contrato piloto propuesto**; su adopción normativa y su integración en los runners oficiales requieren pruebas en AMZN y revisión del PR.

## Decisión provisional sobre `Sector` y `Crecimiento y Márgenes` (lectura real AMZN R5)

En la hoja candidata R5 se verificó que **ambas hojas tienen dependencias activas**, aunque no todos sus resultados son drivers directos del DCF Base:

- `Sector!A3:B7` incluye cinco comparables (MSFT, GOOGL, ORCL, WMT, COST) con datos fiscalmente fechados; `Sector!K3:N11` alimenta fórmulas de cuantiles/resúmenes en `Crecimiento y Márgenes!C15:F20`.
- `Crecimiento y Márgenes!C6:C9` y `D6:E17` calculan crecimiento histórico, márgenes y referencia sectorial, y están enlazados a `Input sheet!B30,B138,B141:B143`, `Origen de los Supuestos!F11:J11,F19:J19` y `Supuestos Recomendados!E6:H9`.
- `Input sheet!B30` es una **referencia de margen**, no el margen de proyección de cada historia; no confundir los diagnósticos de pares mixtos con el driver económico de Amazon.
- Los enlaces primarios de `Input sheet!B12:B16` a `Income Statement` y `Balance Sheet` permanecen en R5, y `Valuation output` usa el `Input sheet` y fórmulas de historias. Es el patrón fuente única a preservar.

**No eliminar ni deprecarlas físicamente todavía**. Una consolidación opcional en una sola hoja de `Referencias y calibración` requiere: (1) inventario global de referencias, nombres y scripts, incluidas fórmulas indirectas; (2) copia aislada y migración de pares + estadísticas + paneles diagnósticos; (3) prueba comparativa de DCF, WACC, cinco múltiplos, sensibilidades y valores de celdas enlazadas, con mismo snapshot y SHA; (4) homologación de las tres plantillas y validadores/perfil de pestañas; (5) solo después retiro de hojas en nuevas copias. Mientras tanto, **mantener las 46 hojas sin alterar y ocultar/organizar visualmente las redundantes si conviene**. Este hallazgo no autoriza actualizar R5 ni plantillas maestras.


## Eficiencia de tokens y costo operativo — criterio de aceptación

El objetivo de simplificación **no es reducir pestañas por sí mismo**. Menos pestañas no significa menos tokens si se siguen transfiriendo a la IA los mismos datos, fórmulas, estados, logs y documentos. La economía se obtiene **sin cambiar los datos, cálculos ni cobertura obligatoria**:

1. **Contexto mínimo y versionado:** cargar `CONTEXTO_CORTO.md` y un manifiesto de reglas/versión; recuperar cláusulas extensas solo si son pertinentes a la fase. No copiar los tres prompts maestros íntegros en cada paso, ni duplicar historial de conversación y logs previos.
2. **Lecturas selectivas de Sheets:** los scripts inspeccionan de forma automática las 46 pestañas según dependencias y producen un resumen estructurado para la IA. La IA recibe solo faltantes, cambios, fuentes, supuestos que necesitan juicio, hallazgos y resultados; los bloques numéricos originales siguen persistidos y auditables fuera del contexto conversacional.
3. **Una captura histórica reutilizable:** crear snapshot de datos SEC/NIIF y celdas por ticker/corte/revisión, con hash, y reutilizarlo entre F1 (mínimo material), F2 (ampliación a 10 FY+LTM), F3 y F4. Cambios en una fuente invalidan solo dependencias afectadas. No reabrir cada fase ni pedir los mismos estados varias veces.
4. **Cálculos deterministas fuera de la IA:** fórmulas nativas Sheets y scripts computan sumas, ROIC, WACC, capitalización I+D, proyecciones, DCF, múltiplos y sensibilidades; la IA selecciona fuentes, analiza y documenta hipótesis y anomalías, no recalcula extensos estados en su contexto. El cálculo independiente de auditoría también se ejecuta como código.
5. **Salida breve operativa / expediente completo almacenado:** por cada fase, dar al agente un resumen de diferencias y bloqueos clasificados con enlaces a artefactos completos, no adjuntar las 46 pestañas o stdout íntegro cuando no hay error.

**Medición obligatoria del piloto antes/después:** mismo AMZN R5, mismo corte, mismo set de pruebas, misma calidad de insumos; registrar tokens de entrada y salida por ejecución, llamadas y volumen de datos transferido, tiempo de ejecución, cobertura de celdas materiales, error de conciliación, DCF/múltiplos y número de reprocesos. Calcular `reducción de tokens = 1 - (tokens_nuevo / tokens_base)`. Sin contadores reales de ambos flujos, **no prometer un porcentaje**. Aceptar optimización únicamente si baja consumo/costo sin reducir cobertura ni alterar resultados no justificados. Conservar además acceso al detalle completo bajo demanda del auditor.
