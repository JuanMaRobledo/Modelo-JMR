# Estructura de la app JMR (contrato de navegación)

**Única fuente del menú:** `docs/mercado.js`, estilo en `docs/jmr-theme.css`. No incorporar menús nuevos independientes.

## Entradas
- **Análisis fundamental:** `research.html` (portada).
- **Empresa:** `expediente.html?ticker=<T>`, la ficha única que enlaza valoración, análisis, hojas, auditorías y sensibilidades.
- **Valoraciones:** `visor.html` / `visor.html?mercado=colombia` (destinos distintos, nunca la página abierta bajo otra etiqueta).
- **Hojas del modelo:** `editor-hoja.html?ticker=<T>`, lector de la hoja Google oficial.
- **Auditorías:** `auditorias.html?ticker=<T>`, `auditoria-integral.html?ticker=<T>`, `auditoria-multiplos.html?ticker=<T>`.
- **Observaciones para auditoría:** campo desplegable en `expediente.html?ticker=<T>`; borrador local y guardado explícito vía GitHub en `Modelo-JMR-datos/auditorias/solicitudes/<archivo-de-la-valoración>.json`. Revisión y ticker vinculados; las notas sincronizadas quedan visibles en un repositorio público.
- **Histórico:** `historicos.html`; **Bitácora de terceros:** `bitacora-terceros.html` (externa al modelo oficial).
- **Herramientas:** `calculadora.html` (simulación no persistente), `damodaran.html`, `screener.html`, `portafolio.html`, `mi-bitacora.html`.

`index.html` es únicamente una ruta antigua que redirige a `research.html`, **no** una categoría «Referencias». Un enlace que sale de un documento incrustado hacia `expediente.html` se abre en la pestaña principal, evitando recursión de iframes.

## Fuente única financiera
1. Resolver ticker en `Modelo-JMR-datos/catalogo.json` ANTES de elegir el archivo de valoración. Las rutas admiten `NKE-20261025-R6.json` y nombres análogos. Si no hay entrada de catálogo, el archivo se muestra como histórico/no conciliado, nunca como versión oficial.
2. Leer el libro real de Google Sheets vía `/api/model`; el editor no reproduce ni sustituye el cálculo de los múltiplos. Queda prohibido escribir números de salida o fórmulas desde el visor.
3. Los siete métodos de la plantilla provienen de las celdas de fórmula de `Descuento de múltiplos`, `PV` y `PBV` y sus pestañas nativas/Financials Multiples. **Su presencia en un JSON no certifica la fórmula.** La UI muestra cobertura de celdas con fórmula, no valida la coincidencia con plantilla. Esa coincidencia se exige en la puerta del proceso de publicación (`modelo/REGLAS_VIGENTES.md` §5A).
4. El visor puede calcular sensibilidades hipotéticas, pero jamás usarlas para sustituir precios de salida. Múltiplos con peso cero se calculan y presentan igualmente, con N/A justificado si la métrica no aplica.
5. Evitar nuevos menús, repositorios, motores o tablas duplicadas. Consolidar diseño en el CSS compartido y conservar historial separado.

## Comprobación
Ejecutar `node --test tests/mercado.test.js tests/expediente.test.mjs tests/editor-hoja.test.mjs tests/model-sync.test.mjs` y comprobar las rutas visibles y los controles de permisos antes de desplegar.
