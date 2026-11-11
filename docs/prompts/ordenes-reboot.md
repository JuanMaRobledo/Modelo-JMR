# Órdenes de ejecución · Modelo JMR Floyd oficial (R1–R6, ex-Reboot)

> **Revisiones nuevas (desde 11-nov-2026): libro único.** Rigen `docs/CONTRATO_FLOYD_LIBRO_UNICO.md` y estas mismas fases R1–R6 con dos artefactos: (R1) copiar la plantilla `04 LIBRO ÚNICO` y el Doc A y registrar los dos IDs; (R2) llenar H, incluido el bloque «Datos del emisor» (`Entradas históricas auxiliares` filas 33–40), sin tocar fórmulas; (R3) supuestos solo en las celdas de entrada del `Input sheet` de cada motor que no vienen de H; sensibilidades en una copia; (R4) multiplicadores y pesos de M (el `Resumen` y la `Presentación` se concilian solos); (R5/R6) igual. No hay traspasos entre libros ni scripts de sincronización. Lo que sigue describe las revisiones heredadas de seis archivos.

Lee antes `modelo/REGLAS_VIGENTES.md` §0R y `docs/CONTRATO_REBOOT_JMR.md`. Las mismas órdenes valen para ChatGPT y Claude. Cada fase termina con `FASE_<N>_ENTREGA.md` en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/`.

## Mandato adicional · cobertura exhaustiva por fórmulas (regla vigente §0R.2)

**OBLIGATORIO ANTES DE R3:** no abandonar R2 por encontrar celdas vacías. Buscar primero en todos los 10-K/10-Q y notas, comparar etiquetas, completar los saldos del año previo al primer FY desde el 10-K más antiguo y el saldo del mismo trimestre previo al LTM. La IA busca además el precio histórico de cierre (último día bursátil) de cada FY con fecha+fuente. Llenar los datos de Balance, Resultados, Caja, auxiliares y precio; **NO** llenar manualmente Márgenes, Eficiencia, Salud, Dividendos, Por acción ni Trailing, pues se calculan solos mediante fórmulas simples. En estos paneles cada salida debe tener fórmula que devuelva valor, `N/D`, `N/M` o `N/A` respaldado, nunca espacio sin fórmula ni cero inventado.

**Escaneo obligatorio:** verificar los seis paneles B:L, documentar todos los `N/D` materiales hasta resolverlos o dejar bloqueo explícito, identificar `N/M` y justificar `N/A`. Revisar `Entradas históricas auxiliares` B64:B67 y balance/caja con FX. Las filas 26–32 y 42–48 son comparativas, 34–39 son *solo* entradas del emisor y 53–61 son puentes por fórmula; no cruzarlas indebidamente. No marcar `CONCILIADO` ni publicar con controles fallidos.

Esta reparación de la plantilla es **mantenimiento previamente autorizado**; NO cambia el reparto de la IA ni habilita editar el motor Damodaran durante valoraciones.

## Mandato de tres funciones y cero cambios estructurales
La IA ejecutora (1) captura/verifica **10 FY consecutivos cuando existan + LTM disponible** y documenta ausencias; (2) propone supuestos con justificación en entradas autorizadas; (3) elabora análisis fundamental cualitativo. **Solo las fórmulas y vínculos predefinidos calculan** ratios, DCF, múltiplos, escenarios, sensibilidades y presentación. Traspasos entre libros por automatización existente con huella, recálculo y conciliación; no copiar manualmente salidas ni declarar actualizados destinos obsoletos. No cambiar configuración de libros, hojas, tablas, vínculos, fórmulas, rangos, validaciones, selectores, comentarios ni scripts. Averías de arquitectura → bloqueo documentado y mantenimiento separado/autorizado. JSON, controles y publicación son tareas mecánicas, no funciones analíticas adicionales.

## Antes de empezar
Resuelve ticker, clase, mercado, moneda, FY/LTM, cotización fechada y etapa. Consulta `catalogo.json` y `registro/REVISIONES.md`: una revisión activa por ticker; lo de `archivo-v1/` es antecedente, nunca insumo. Declara modelo/herramienta/esfuerzo y el acceso realmente disponible. Si el emisor es financiero u holding sin motor equivalente, declara la excepción FCFE/SOTP; no inventes un FCFF industrial.

## R1 · Corte e identidad
1. Identifica fuentes primarias (10-K/10-Q/8-K o equivalentes), fecha de corte y precio fechado.
2. Fija tasa libre y prima de riesgo vigentes con su fuente y fecha.
3. Copia las plantillas Floyd R1–R6 a `Modelo JMR/Análisis/<TICKER>`: H, tres copias del LIBRO DCF (Base, Conservadora, Optimista), M y A. Registra los seis IDs.
4. Verifica que los tres libros D conserven el motor original (hojas, fórmulas y comentarios sin cambios) y que D-B tenga `Presentación` y `Resumen de valoraciones`.

## R2 · Históricos
1. Llena solo los tres estados y las entradas auxiliares de H con **diez FY consecutivos cuando existan + LTM disponible, en el formato original**, sin inventar años ausentes; salud financiera, eficiencia, márgenes, dividendos, por acción y Trailing Valuation se calculan por fórmulas. Registra fuente, período, moneda, escala y clasificación por partida material; cero solo si está sustentado.
2. Flujos LTM = FY anterior + acumulado actual − acumulado comparable; balance al corte.
3. Concilia balance, EBIT, variación de caja y LTM; reproduce ratios materiales en dos períodos.

## R3 · Historias y DCF
1. Escribe tres historias (Conservadora, Base, Optimista): mecanismo, evidencia, contraevidencia, rango, elección, celda e impacto. Probabilidades por etapa del ciclo, suma 100 %, fracaso solo en Conservadora, costo de capital común.
2. Carga en el `Input sheet` de cada libro D solo celdas de entrada, con valores tomados de H por script con huella o escritos directamente. No cambies fórmulas, comentarios, filas ni hojas del motor original.
3. Revisa crecimiento, márgenes, ventas/capital, reinversión, ROIC, I+D, arrendamientos, opciones, deuda y no operativos con las hojas originales (R&D converter, Operating lease converter, Option value, Cost of capital worksheet).
4. Obtén DCF inverso y sensibilidades 5×5 corriendo el motor original (cada corrida modifica entradas y se registra). MOS 35 % = 0,65 × DCF Base.

## R4 · Múltiplos y resumen
1. Traspasa a M los estados de H y los supuestos de D-B (crecimiento, márgenes, tasa, acciones, costo de capital) por script con huella.
2. Elige y justifica los múltiplos de salida por historia y los pesos por tipo de empresa (rentabilidad, intensidad de capital, ciclicidad, apalancamiento). Cinco múltiplos: EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF. **No se usan P/S ni P/BV.** N/A con causa, N/D con efecto; nunca ceros para fingir.
3. Verifica que `Presentación` y `Resumen de valoraciones` en D-B se actualicen mediante fórmulas y la sincronización ya definida, incluyendo precio fechado, DCF Base, MOS 35 %, Conservadora, Optimista, esperado y múltiplos con pesos. Concilia M con la Base. **No pegar ni recalcular manualmente salidas.**

## R5 · Análisis y publicación
1. Escribe A: Nivel 1 de 14 capítulos y Nivel 2 de 12 apartados reproducibles, con las cifras de H, D y M de esta revisión; rehaz cualquier borrador cuyos supuestos hayan cambiado.
2. Genera los JSON de valoración y análisis con el contrato `jmr-reboot-3libros-v1`.
3. Valida hoja → JSON → catálogo → app. Si la app o un validador aún no conoce el contrato Floyd R1–R6, registra el bloqueo y conserva CANDIDATO.
4. Publica `EN_REVISION` solo con la puerta del contrato aprobada.

## R6 · Auditoría independiente
Sesión distinta de la que construyó. Prioriza observaciones del usuario; recalcula tesis, supuestos, fuentes, matrices, terminal y materialidad. Dictamen `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE`. No modifica la valoración a escondidas.
