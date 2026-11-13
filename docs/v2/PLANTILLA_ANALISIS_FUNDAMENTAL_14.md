# Plantilla oficial de análisis fundamental · Modelo JMR V2.0

**Estado:** estándar editorial para revisión, no autorización de publicación.

## Procedencia y alcance
Se recupera el índice exacto de **14 capítulos de Nivel 1** de `docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md` (Estilo JMR v1.4, 30-oct-2026), basado en la legibilidad de AZ Stocks y la filosofía *Stories to Numbers* de Aswath Damodaran. Es distinto de índices históricos de 18/20 apartados y del índice de valoración. Se aplica a todas las empresas V2, adaptando el contenido al emisor, **sin alterar el motor DCF**.

## Nivel 1 · índice fijo (14 capítulos)
1. **Tesis de inversión y conclusión:** negocio, tesis, dos factores decisivos, principales reservas y precio frente al valor.
2. **La empresa y su modelo económico:** historia, clientes, segmentos, monetización, geografías y economía unitaria.
3. **Industria, competencia y ventaja competitiva:** mercado, rivales, sustitutos, duración del moat y evidencia de poder de precios.
4. **Motores del crecimiento futuro:** demanda, volumen/precio/mezcla, capacidad, catalizadores y techo del crecimiento.
5. **Ciclos de la empresa, del mercado y de la macroeconomía:** ciclo de vida corporativo de Damodaran; macro, tasas y crédito; ciclo de mercado de Howard Marks y su efecto específico sobre drivers, WACC y riesgos.
6. **Historia financiera y calidad de resultados:** hasta 10 ejercicios, LTM si existe, márgenes, caja, deuda, SBC, dilución y anormalidades.
7. **Reinversión, eficiencia del capital y ROIC:** CAPEX, I+D, arrendamientos, capital de trabajo, Sales-to-Capital, ROIC histórico/marginal/terminal.
8. **Dirección, gobierno y asignación de capital:** incentivos, inversiones, dividendos, recompras, adquisiciones y accionistas.
9. **Nuestro proceso de valoración:** fuente y corte, modelo FCFF Simple Ginsu de Damodaran (u otro apropiado por perfil), ajustes, costo de capital y contraste externo sin reemplazar el DCF.
10. **Supuestos económicos y su justificación:** tres historias, crecimiento, márgenes, reinversión, Sales-to-Capital, ROIC, impuesto, WACC, terminal, dilución; razones, fuentes y contraevidencia.
11. **Valor intrínseco, escenarios y precio:** Base como principal, Conservador y Optimista, MOS 35% solo sobre Base; valor terminal, sensibilidades y múltiplos como contraste.
12. **Riesgos, tesis contraria y factores de ruptura:** mecanismos verificables y causas de invalidación; sin doble castigo.
13. **Catalizadores y plan de seguimiento:** indicadores, eventos verificables, umbrales y periodicidad; no inventar fechas.
14. **Fuentes, limitaciones y estado del estudio:** fuentes fechadas y trazables, faltantes y materialidad, estatus editorial, revisión personal y auditoría independiente.

**No incorporar las cinco fuerzas de Porter como sección.** No rellenar con generalidades para completar el índice.

## Nivel 2 · respaldo cuantitativo separado
El análisis narrativo se apoya en históricos y tres estados financieros, indicadores (crecimiento, márgenes, eficiencia y salud), libro de valoración, supuestos por escenario, proyección FCFF, sensibilidades y trazabilidad. Los números y fórmulas viven en las hojas financieras; el artículo los interpreta. El Nivel 2 no se reduce a un enlace ni se mezcla con los catorce capítulos.

## Contrato de datos e interfaz
- Un bloque editable por capítulo, **14 bloques en orden fijo**. Los subtítulos internos son flexibles.
- Portada con valor Base, precio de referencia fechado, precio MOS 35% y tres escenarios. Mostrar fuentes y distinción entre hechos e hipótesis.
- El editor puede guardar borradores localmente o en la rama editorial. **Guardar no equivale a aprobar**.
- Migrar textos anteriores por contenido, no por número; no perder información ni transformar un N/D en cero. Registrar capítulos incompletos.
- Los informes de financieras y holdings conservan el índice, usando FCFE/Ke o SOTP según corresponda; no aplicar FCFF industrial indebidamente.
- El expediente (hoja de históricos, libro de valoración y análisis) se entrega en su carpeta para **revisión personal previa**. No integrar, fusionar ni publicar automáticamente en la app tras valorar; solo hacerlo con autorización expresa y tras conciliar revisiones.
- Estado inicial: `EN_REVISION` o borrador no auditado. Aprobación personal y auditoría económica se distinguen de los controles técnicos.

## Oracle · migración piloto
La fuente original de Oracle contenía veinte apartados en cinco bloques. Reorganizar con trazabilidad en los catorce capítulos, sin modificar los valores intrínsecos o las hipótesis del libro ni afirmar que el trabajo está auditado. Marcar vacíos económicos y documentales de forma visible.
