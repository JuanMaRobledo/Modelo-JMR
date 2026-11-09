# Órdenes de ejecución · Modelo JMR Reboot (R1–R6)

Lee antes `modelo/REGLAS_VIGENTES.md` §0R y `docs/CONTRATO_REBOOT_JMR.md`. Las mismas órdenes valen para ChatGPT y Claude. Cada fase termina con `FASE_<N>_ENTREGA.md` en `Modelo-JMR-datos/candidatos/valoraciones/<REV>/`.

## Antes de empezar
Resuelve ticker, clase, mercado, moneda, FY/LTM, cotización fechada y etapa. Consulta `catalogo.json` y `registro/REVISIONES.md`: una revisión activa por ticker; lo de `archivo-v1/` es antecedente, nunca insumo. Declara modelo/herramienta/esfuerzo y el acceso realmente disponible. Si el emisor es financiero u holding sin motor equivalente, declara la excepción FCFE/SOTP; no inventes un FCFF industrial.

## R1 · Corte e identidad
1. Identifica fuentes primarias (10-K/10-Q/8-K o equivalentes), fecha de corte y precio fechado.
2. Fija tasa libre y prima de riesgo vigentes con su fuente y fecha.
3. Copia las plantillas Reboot a `Modelo JMR/Análisis/<TICKER>`: H, tres copias del LIBRO DCF (Base, Conservadora, Optimista), M y A. Registra los seis IDs.
4. Verifica que los tres libros D conserven el motor original (hojas, fórmulas y comentarios sin cambios) y que D-B tenga `Presentación` y `Resumen de valoraciones`.

## R2 · Históricos
1. Llena solo los tres estados y las entradas auxiliares de H con hasta diez FY + LTM, **en el formato original**; salud financiera, eficiencia, márgenes, dividendos, por acción y Trailing Valuation se calculan por fórmulas. Registra fuente, período, moneda, escala y clasificación por partida material; cero solo si está sustentado.
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
3. Completa `Presentación` y `Resumen de valoraciones` en D-B con precio fechado, DCF Base, MOS 35 %, Conservadora, Optimista, esperado y múltiplos con sus pesos, y concilia M con la Base.

## R5 · Análisis y publicación
1. Escribe A: Nivel 1 de 14 capítulos y Nivel 2 de 12 apartados reproducibles, con las cifras de H, D y M de esta revisión; rehaz cualquier borrador cuyos supuestos hayan cambiado.
2. Genera los JSON de valoración y análisis con el contrato `jmr-reboot-3libros-v1`.
3. Valida hoja → JSON → catálogo → app. Si la app o un validador aún no conoce el contrato Reboot, registra el bloqueo y conserva CANDIDATO.
4. Publica `EN_REVISION` solo con la puerta del contrato aprobada.

## R6 · Auditoría independiente
Sesión distinta de la que construyó. Prioriza observaciones del usuario; recalcula tesis, supuestos, fuentes, matrices, terminal y materialidad. Dictamen `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE`. No modifica la valoración a escondidas.
