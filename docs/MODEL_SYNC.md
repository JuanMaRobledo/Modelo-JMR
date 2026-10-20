# Conexión entre análisis, editor oficial y simulador DCF

La aplicación tiene **tres funciones distintas**:

1. **Análisis fundamental** (`research.html`): Nivel 1 = 18 secciones de tesis; Nivel 2 = valoración oficial con estados financieros, ratios, insumos, cálculos y matrices de sensibilidad.
2. **Calculadora DCF** (`calculadora.html`): importa parámetros de una empresa guardada para hacer **simulaciones locales**. Ningún cambio de la calculadora se escribe en la hoja ni modifica el expediente oficial.
3. **Editor de hoja** (`editor-hoja.html?ticker=NKE`): importa todas las pestañas de la hoja vinculada por ticker, permite desplazarse por filas/columnas, prepara cambios en celdas numéricas literales del **Input sheet** y los estados `Income Statement`, `Balance Sheet`, `Cash Flow Statement`. Los resultados derivados, fórmulas, etiquetas, celdas nuevas y pestañas de sensibilidad no se alteran. La persona confirma los cambios y el servidor valida versión + valor anterior. Después de guardar, Google Sheets recalcula; el artículo NO se republica de forma automática.

## Requisitos de escritura

- La app debe ejecutarse en **Vercel con sesión autenticada** (en GitHub Pages solo hay lectura de hojas accesibles).
- La variable **`GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT`** debe estar configurada de forma secreta en el servidor y esa cuenta debe tener permiso de Editor sobre la hoja.
- `GET /api/model?ticker=<TICKER>` importa el libro; `PATCH /api/model?ticker=<TICKER>` guarda exclusivamente celdas numéricas de origen existentes mediante `valueInputOption: RAW` y verifica fórmula, revisión y valor anterior. El backend admite hasta 50 cambios por operación.
- La edición directa es una operación real sobre la **hoja Google**, no sobre los JSON ya publicados. Tras modificar insumos, se deben volver a validar y publicar las valoraciones/análisis, con controles del modelo. No se debe afirmar sincronización editorial si no ocurrió.
- Si falla el guardado o aparece un conflicto **409**, reimportar y comprobar los datos antes de reintentar; ningún error se interpreta como éxito.

## Alcance y seguridad

Todas las pestañas son navegables, pero las editables se limitan deliberadamente a datos fuente numéricos existentes. Para modificar fórmulas o estructura hay que abrir la hoja original en Google Sheets, con su propio historial de versiones. Se protegen los cálculos automáticos, los ratios y las matrices. No pegar claves en el navegador ni guardar credenciales en el código fuente.

## Lectura pública y activación de escritura en el servidor

El servidor puede leer la exportación pública de la hoja sin credenciales de Google. Esto activa la búsqueda por ticker y el refresco de cifras en modo de solo lectura, sin depender del CORS de Google. La credencial siguiente habilita la escritura.

1. Mantener `APP_PASSWORD`, ya usado por la sesión privada de la app. El endpoint comprueba la firma de la sesión directamente y rechaza escrituras de otro origen.
2. Configurar `GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT` como secreto del servidor, con el JSON completo de la cuenta de servicio usada para las hojas. Nunca debe tener prefijo público ni incluirse en git.
3. Activar la API de Google Sheets en ese proyecto y dar acceso de Editor a esa cuenta únicamente en las hojas que deban editarse.
4. Desplegar y verificar con una hoja de prueba: lectura, cambio de entrada desde el informe, recálculo en Sheets y refresco desde la calculadora. Los cambios reales quedan en el historial de versiones de Google Sheets.

En GitHub Pages no se ejecutan funciones de servidor. Si la hoja permite exportación pública, la calculadora puede leerla; la edición bidireccional necesita el despliegue con servidor. Si la lectura falla se indica el error y se conserva el informe publicado, sin presentar sus cifras como sincronizadas.

## Concurrencia y pruebas

Cada escritura comprueba la revisión de las entradas y el valor anterior de la celda; ante una diferencia devuelve 409. Esta comprobación no es una transacción atómica contra ediciones externas de Google Sheets: evita guardar desde una lectura antigua, pero no elimina la ventana entre comprobación y escritura. No editar simultáneamente la misma celda desde varios clientes.

`node --test tests/model-sync.test.mjs` verifica identidad, precisión, fórmulas, autenticación, rechazo de cambios obsoletos y el ciclo de lectura/escritura con Google simulado.

`JMR_TEST_CHROME=/ruta/chromium JMR_TEST_XLSX=/ruta/xlsx.full.min.js node tests/model-sync.browser.mjs` verifica la calculadora en navegador con fuentes locales simuladas: ticker, DCF/MOS nativo, escritura en porcentaje, respuestas tardías de otra empresa, refresco de la hoja y ancho móvil. Estas pruebas no certifican los permisos ni las credenciales del despliegue.
