# Estructura de la app JMR (contrato de navegación)

**Única fuente del menú:** `docs/mercado.js`, estilo en `docs/jmr-theme.css`. No incorporar menús nuevos independientes.

## Entradas: una empresa, una ficha

- **Única portada de empresas y análisis:** `expediente.html?seccion=analisis`. El catálogo permite filtrar Todas, Internacionales y Colombia.
- **Una empresa:** `expediente.html?ticker=<T>&seccion=analisis`; siempre empieza en Análisis si no hay sección explícita. El enlace puede seleccionar `seccion=financieros&sheet=Income%20Statement`, por ejemplo.
- **Siete pestañas, un mismo expediente:** Análisis fundamental, Valoración, Estados financieros, Indicadores, Modelo y supuestos, Sensibilidades, Revisión y auditoría.
- **Subpestañas financieras:** resultados, balance, flujo de efectivo, LTM, dividendos, cifras por acción; ratios, *Trailing Valuation*, *Forward Valuation*, eficiencia, márgenes, solvencia/deuda. La fuente original es siempre Google Sheets.
- **Modelo:** el lector oficial `editor-hoja.html?ticker=<T>&embedded=1&seccion=modelo` mantiene el selector de **todas** las hojas nativas del libro, incluidas ocultas. Los favoritos son accesos rápidos, no un subconjunto de los datos.
- **Acceso a una hoja original por separado:** `editor-hoja.html?ticker=<T>&sheet=<N>`; se abre solo por acción explícita de usuario. El lector incrustado acepta `postMessage` exclusivamente del mismo origen y del `parent` correcto, para navegar sin reimportar el libro.
- **Valoración por múltiplos:** subpestaña siempre visible en Valoración, junto con el DCF. La tarjeta compara valor intrínseco Base, precio relativo por múltiplos descontado a hoy y combinación DCF + múltiplos cuando existe. Tabla de EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF, además de P/S y P/BV cuando constan, incluso con peso cero. Conservar separados valores FY+3 y VP Base; ausencias se muestran como N/D. Datos tomados del JSON oficial, sin recomputar ni certificar fórmulas.\n- **Sensibilidades:** panel independiente con las matrices DCF que concilian con la valoración activa; nunca se presentan anclas o múltiplos no certificados como resultados calculados.
- **Compatibilidad de formatos VP:** algunas revisiones (por ejemplo DUOL) guardan los tres escenarios de cada múltiplo ya descontados. La vista los etiqueta como VP y solo presenta el agregado relativo cuando la suma ponderada concilia con el combinado oficial en los tres escenarios; si no, indica N/D sin reconstruir valoraciones. NVO e INTU permanecen pendientes hasta disponer de múltiplos nativos conciliados.
- **Revisión:** observaciones persistidas por ticker/revisión, opciones EN_REVISION, LISTO y REHACER; auditorías ausentes se indican como pendientes, no enlaces vacíos.
- **Navegación general:** Empresas y análisis, Cartera, Herramientas (desplegable), Histórico y Bitácora de terceros. Las páginas técnicas conservan rutas de compatibilidad, pero no constituyen portadas rivales.

El diseño usa un panel de contenido único dentro del expediente. **Los visores técnicos heredados de valoración/lectura** continúan integrados como documentos de la misma ventana hasta que puedan migrarse sin romper cálculos, exportación PDF o permisos. No se abren automáticamente ventanas nuevas.

`index.html` es redirección antigua al catálogo. Los enlaces incrustados que regresan al expediente apuntan a `_top`, para impedir expedientes anidados.

## Control de integridad del Modelo A (30-oct-2026)

- La app puede leer la clasificación por revisión exacta de `Modelo-JMR-datos/catalogo.json`, campo `controlModeloA.empresas`: `rutaValoracion`, `metodo`, `estado` y `multiplos`.
- **Las revisiones anteriores al Modelo A** no aparecen en el análisis central mientras se rehacen, pero sus archivos siguen preservados en GitHub/Histórico. La exclusión nunca borra archivos ni sobrescribe valoraciones.
- **Las revisiones A-1.2 actualmente publicadas** permanecen accesibles con estado **INCOMPLETA / EN_REVISIÓN** hasta cerrar los componentes y la auditoría. Una subpestaña que muestra N/D **no es un método terminado**.
- Para declarar `COMPLETA`, exigir análisis narrativo Nivel 1, Nivel 2 con cálculos y fuentes reproducibles, datos históricos, DCF de cuatro escenarios, ROIC / reinversión / márgenes / crecimiento / WACC o Ke, cinco múltiplos económicos principales aplicables (o N/A documentado por tipo de empresa), sensibilidades DCF y de múltiplos, conciliación de valor presente, revisión y auditoría independientes. P/S y P/BV complementarios salvo aplicación relevante como P/BV bancario.
- El contrato es **revisión-específico**: si cambia el `rutaValoracion` del catálogo, el lector evita heredar una clasificación obsoleta y requiere reclasificación. Si el catálogo aún no tiene el campo durante un despliegue coordinado, mantiene compatibilidad de lectura sin presentar ningún expediente como certificado.
- Los formatos de matrices `sensibilidadDCF.matrices`, `sensibilidadDCF.matriz` (array o `{wacc,g,valores}`) y FCFE (`{KeEscenarios,gEscenarios,valorPorAccion}`) se interpretan **solo para mostrar datos existentes**, previa verificación de matriz 5×5 y coincidencia del centro con el DCF o FCFE Base publicado. Las otras estructuras no se fabrican.

## Dos niveles del análisis fundamental

El lector `analisis-lectura.html` / ficha `expediente.html` aplica el [Estilo JMR narrativo](ESTILO_ANALISIS_FUNDAMENTAL_JMR.md): Nivel 1 largo con 13 capítulos de empresa → fundamentales → proceso → supuestos → valor; Nivel 2 desplegable con cálculos. Los legados conservan su estructura hasta actualización. Las tablas breves útiles del artículo no se eliminan. Porter y cinco filosofías dejan de ser obligatorios.

## Fuente única financiera
1. Resolver ticker en `Modelo-JMR-datos/catalogo.json` ANTES de elegir el archivo de valoración. Las rutas admiten `NKE-20261025-R6.json` y nombres análogos. Si no hay entrada de catálogo, el archivo se muestra como histórico/no conciliado, nunca como versión oficial.
2. Leer el libro real de Google Sheets vía `/api/model`; el editor no reproduce ni sustituye el cálculo de los múltiplos. Queda prohibido escribir números de salida o fórmulas desde el visor.
3. Los siete métodos de la plantilla provienen de las celdas de fórmula de `Descuento de múltiplos`, `PV` y `PBV` y sus pestañas nativas/Financials Multiples. **Su presencia en un JSON no certifica la fórmula.** La UI muestra cobertura de celdas con fórmula, no valida la coincidencia con plantilla. Esa coincidencia se exige en la puerta del proceso de publicación (`modelo/REGLAS_VIGENTES.md` §5A).
4. El visor puede calcular sensibilidades hipotéticas, pero jamás usarlas para sustituir precios de salida. Múltiplos con peso cero se calculan y presentan igualmente, con N/A justificado si la métrica no aplica.
5. Evitar nuevos menús, repositorios, motores o tablas duplicadas. Consolidar diseño en el CSS compartido y conservar historial separado.

## Comprobación
Ejecutar `node --test tests/mercado.test.js tests/expediente.test.mjs tests/editor-hoja.test.mjs tests/model-sync.test.mjs` y comprobar las rutas visibles y los controles de permisos antes de desplegar.

## Revisión visual del análisis

En la pestaña **Análisis fundamental** de la ficha unificada se selecciona el estado `EN_REVISION`, `LISTO` o `REHACER`, y se registran puntos de auditoría por ticker y **revisión exacta**. Se guardan con OAuth en `Modelo-JMR-datos/auditorias/solicitudes/<T>/<REVISION>.json`. El borrador local nunca equivale a guardado en GitHub. `LISTO` significa «listo para ejecutar auditoría cuando el usuario la solicite» y **no** que la auditoría esté aprobada. `REHACER` requiere motivación; no modifica automáticamente las hojas.
