# Órdenes de ejecución · Modelo JMR Reboot (R1–R6)

Lee antes `modelo/REGLAS_VIGENTES.md` §0R y `docs/CONTRATO_REBOOT_JMR.md`. Las mismas órdenes valen para ChatGPT y Claude. Cada fase termina con `FASE_<N>_ENTREGA.md` en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/`.

## Antes de empezar
Resuelve ticker, clase, mercado, moneda, FY/LTM, cotización fechada y etapa. Consulta `catalogo.json` y `registro/REVISIONES.md`: una revisión activa por ticker; lo de `archivo-v1/` es antecedente, nunca insumo. Declara modelo/herramienta/esfuerzo y el acceso realmente disponible. Si el emisor es financiero u holding sin motor equivalente, declara la excepción FCFE/SOTP; no inventes un FCFF industrial.

## R1 · Corte e identidad
1. Identifica fuentes primarias (10-K/10-Q/8-K o equivalentes), fecha de corte y precio fechado.
2. Fija tasa libre y prima de riesgo vigentes con su fuente y fecha.
3. Copia las plantillas Reboot (H, D, M, A) a `Modelo JMR/Análisis/<TICKER>`; registra los cuatro IDs y la huella del motor D y M.
4. Verifica que la primera pestaña de D sea `Presentación` y que exista `Resumen de valoraciones`.

## R2 · Históricos
1. Llena H (estados financieros, salud financiera, eficiencia, márgenes, dividendos, por acción) con hasta diez FY + LTM, **en el formato establecido**. Registra fuente, período, moneda, escala y clasificación por partida material; cero solo si está sustentado.
2. Flujos LTM = FY anterior + acumulado actual − acumulado comparable; balance al corte.
3. Concilia balance, EBIT, variación de caja y LTM; reproduce ratios materiales en dos períodos.

## R3 · Historias y DCF
1. Traspasa el snapshot FY-2/FY-1/FY/LTM de H a D por script con huella; sin `IMPORTRANGE`.
2. Escribe tres historias (Conservadora, Base, Optimista): mecanismo, evidencia, contraevidencia, rango, elección, celda e impacto. Probabilidades por etapa del ciclo, suma 100 %, fracaso solo en Conservadora, costo de capital común.
3. Revisa crecimiento, márgenes, ventas/capital, reinversión, ROIC (actual, marginal, terminal), I+D, arrendamientos, opciones, deuda, RSU, NOL y no operativos.
4. Ejecuta DCF, DCF inverso y sensibilidades 5×5. MOS 35 % = 0,65 × DCF Base. Verifica huella y compuertas.

## R4 · Múltiplos y resumen
1. Traspasa a M las series de H por script con huella.
2. Elige y justifica los supuestos por historia, los múltiplos de salida y los pesos por tipo de empresa (rentabilidad, intensidad de capital, ciclicidad, apalancamiento, relevancia del patrimonio). Núcleo: EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF; P/S y P/BV solo si aportan. N/A con causa, N/D con efecto; nunca ceros para fingir.
3. Concilia los supuestos de M con la Base de D y explica la diferencia.
4. Traspasa los resultados M→D con huella y completa `Resumen de valoraciones`: precio de mercado, DCF Base, MOS 35 %, Conservadora/Base/Optimista, esperado, múltiplos y pesos.

## R5 · Análisis y publicación
1. Escribe A: Nivel 1 de 14 capítulos y Nivel 2 de 12 apartados reproducibles, con las cifras de H, D y M de esta revisión; rehaz cualquier borrador cuyos supuestos hayan cambiado.
2. Genera los JSON de valoración y análisis con el contrato `jmr-reboot-3libros-v1`.
3. Valida hoja → JSON → catálogo → app. Si la app o un validador aún no conoce el contrato Reboot, registra el bloqueo y conserva CANDIDATO.
4. Publica `EN_REVISION` solo con la puerta del contrato aprobada.

## R6 · Auditoría independiente
Sesión distinta de la que construyó. Prioriza observaciones del usuario; recalcula tesis, supuestos, fuentes, matrices, terminal y materialidad. Dictamen `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE`. No modifica la valoración a escondidas.
