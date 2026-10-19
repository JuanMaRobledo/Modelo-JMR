# Conexión DCF, hoja e informe

La calculadora busca el ticker exacto en las valoraciones vigentes de `Modelo-JMR-datos`. Usa la hoja vinculada como fuente de cifras, conserva sus fórmulas y lee los resultados nativos, incluidos el DCF Base y el MOS. Los datos FMP solo se consultan cuando la empresa no tiene un modelo guardado.

La calculadora y el informe comparten `model-sync.js`. El panel **Datos de la hoja** permite cambiar las entradas numéricas existentes y sin fórmula de la columna B de `Input sheet`, y D1. Las tasas formateadas en porcentaje se editan en porcentaje. Al salir del campo se guarda el valor numérico en la hoja con `valueInputOption: RAW`. Las demás celdas son de lectura.

El informe actualiza la tarjeta de valoración y los anexos al abrirse, al volver a la ventana y cada 30 segundos mientras esté visible. El texto histórico del artículo y los cálculos escritos no se reescriben automáticamente: se avisa que requieren revisión. No se reemplazan cifras de prosa por coincidencia de números. Los informes SOTP conservan su flujo propio.

## Activación en el servidor

1. Mantener `APP_PASSWORD`, ya usado por la sesión privada de la app. El endpoint comprueba la firma de la sesión directamente y rechaza escrituras de otro origen.
2. Configurar `GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT` como secreto del servidor, con el JSON completo de la cuenta de servicio usada para las hojas. Nunca debe tener prefijo público ni incluirse en git.
3. Activar la API de Google Sheets en ese proyecto y dar acceso de Editor a esa cuenta únicamente en las hojas que deban editarse.
4. Desplegar y verificar con una hoja de prueba: lectura, cambio de entrada desde el informe, recálculo en Sheets y refresco desde la calculadora. Los cambios reales quedan en el historial de versiones de Google Sheets.

En GitHub Pages no se ejecutan funciones de servidor. Si la hoja permite exportación pública, la calculadora puede leerla; la edición bidireccional necesita el despliegue con servidor. Si la lectura falla se indica el error y se conserva el informe publicado, sin presentar sus cifras como sincronizadas.

## Concurrencia y pruebas

Cada escritura comprueba la revisión de las entradas y el valor anterior de la celda; ante una diferencia devuelve 409. Esta comprobación no es una transacción atómica contra ediciones externas de Google Sheets: evita guardar desde una lectura antigua, pero no elimina la ventana entre comprobación y escritura. No editar simultáneamente la misma celda desde varios clientes.

`node --test tests/model-sync.test.mjs` verifica identidad, precisión, fórmulas, autenticación, rechazo de cambios obsoletos y el ciclo de lectura/escritura con Google simulado.

`JMR_TEST_CHROME=/ruta/chromium JMR_TEST_XLSX=/ruta/xlsx.full.min.js node tests/model-sync.browser.mjs` verifica la calculadora en navegador con fuentes locales simuladas: ticker, DCF/MOS nativo, escritura en porcentaje, respuestas tardías de otra empresa, refresco de la hoja y ancho móvil. Estas pruebas no certifican los permisos ni las credenciales del despliegue.
