# Contexto colombiano del Modelo JMR · actualización 30-oct-2026

> **No es un prompt maestro ni una regla autónoma.** Esta ruta se conserva para compatibilidad con el editor. Se antepone al prompt activo de **Valoración 1/3** o **Análisis fundamental 2/3** únicamente como contexto local. La autoridad es `modelo/REGLAS_VIGENTES.md` y, para calibración, `modelo/METODOS_VALORACION.md`. No ejecutar los archivos históricos `colombia-valuation-v1.md` ni `colombia-research-v1.md`.

## Particularidades locales

- **Identidad y aislamiento.** Identificar emisor legal colombiano, ticker y clase negociada en BVC, derechos económicos y número de acciones por clase; no confundir acciones ordinarias, preferenciales ni ADR. Mantener por separado fecha del estado financiero, fecha de publicación, fecha del precio y fecha de valoración. Cada compañía usa su revisión/hoja oficial.
- **Datos y evidencia.** Priorizar estados y notas del emisor, información relevante y reportes de la Superintendencia Financiera, BVC, Banco de la República y DANE, según el dato. Tratar fuentes de terceros como contraste, no como estados auditados. Alinear consolidado/individual, NIIF, COP/USD y escala; no sustituir valores ausentes por cero.
- **Moneda y costo de capital.** Hacer coincidir moneda nominal/real de flujos y tasa. Documentar TES, componente soberano, inflación, tipo de cambio, ERP y prima país con fechas compatibles, sin sumar dos veces riesgo soberano. La cotización COP no determina por sí sola la exposición económica. No trasladar automáticamente el g nominal USD a modelos COP.
- **Modelo sectorial.** Operativas: FCFF/WACC; financieras: FCFE/Ke, ROE y capital/solvencia; holdings: SOTP por participada, derechos económicos, deuda, caja y costos propios, evitando doble conteo de fondos y gestoras. En concesiones utilizar la vida contractual cuando corresponda. Ajustar NIIF 16 y arrendamientos sin doble capitalización.
- **Escenarios y múltiplos.** Base, Conservador, Optimista y Disrupción separados; promedio ordinario solo de las tres primeras; MOS 35% exclusivamente sobre DCF/FCFE/SOTP Base. Evaluar cinco múltiplos prioritarios cuando sean económicamente aplicables; P/S y P/BV complementarios y no obligatorios salvo uso/ponderación explícitos. Para bancos, evaluar la pertinencia de P/BV y P/E sin imponer ratios industriales. Los pesos se justifican por compañía y se calculan en la hoja; **no existe mezcla universal 40/60 ni precio externo que sustituya el valor intrínseco Base**.
- **Horizontes y trazabilidad.** Mostrar valor por acción hoy, valores FY+1/2/3 y descuento a hoy cuando proceda, dividendos descontados sin duplicaciones, fuentes y celdas. Los resultados provienen de las fórmulas de la hoja de esa misma revisión. N/D o N/A con causa cuando falten datos o no aplique.

## Formato y flujo vigentes

- **Análisis fundamental Nivel 1:** 14 capítulos del Estilo JMR, incluido capítulo 5 sobre ciclo empresarial Damodaran, macro, crédito y ciclo de mercado Howard Marks. No exigir cinco fuerzas de Porter ni cinco filosofías.
- **Nivel 2:** 12 apartados de datos, entradas, proyecciones, fórmulas, conciliaciones, sensibilidad DCF y por múltiplos Base verificables, sin inventar tablas.
- **Auditoría 3/3:** posterior a revisión visual, en expediente independiente, sin escribir en la hoja de valoración.
- **Estado:** hasta completar controles técnicos y auditoría posterior, mostrar EN_REVISION y pendientes concretos; cambios en prompts no recalculan ni publican automáticamente valoraciones.

Esta nota complementa el prompt maestro, no modifica el Método A/B, plantillas, fórmulas, resultados ni revisiones históricas.
