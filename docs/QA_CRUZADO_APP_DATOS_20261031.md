# Modelo JMR — QA cruzado aplicación ↔ datos (31 octubre 2026)

**Tipo:** instrucción de validación, no acta de aprobación. La aplicación (#151) y los datos (#211) permanecen en borrador. No autoriza fusionar ni publicar.

## Estado verificado
- App #151 SHA `4f1cb4e5d4ebd700be1ecdceebc6960bf2f29cd5`: ocho workflows GitHub Actions en verde. El panel `docs/expediente.js` ahora muestra matrices Base 5×5 integradas por la misma revisión, ocultando centros inconciliados, fuentes de otra hoja, candidatos y N/A sin justificación.
- Datos #211: 16/20 matrices Base nativas integradas en la rama. INTU y NU conservan sus contratos de DCF independientes y múltiplos pendientes; UBER y GOOGL requieren anclas independientes. El gate financiero permanece en rojo por UBER; los controles editoriales están en verde.
- Preview de la app: deployment `dpl_7PRMENiSueeUXp5QQZEGHWAReGqj` de commit `a8705030e5a6551d5b8f5e3b93408c092624e7b3` fue READY, pero el acceso automatizado protegido recibió 401 tras redirección. Un deployment READY no es evidencia de visualización ni autenticación.
- **Advertencia de fuente:** `docs/expediente.js` actualmente define `RAW='https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR-datos/main/'`. Otras páginas embebidas también consultan `main`; si el Preview usa `main`, no está probando las correcciones del PR #211. No confundir QA de código con QA de datos integrados.
- **No modificar** las hojas ni fuentes de producción para realizar QA. No publicar las valoraciones provisionales ni permitir que N/D se muestre como cero.

## Procedimiento de aceptación (evidencia requerida)
1. Confirmar hash exacto de app y hash de la rama de datos en una fuente de QA aislada; el catálogo, valoración, análisis, sensibilidades, lector de hojas y panel de múltiplos deben corresponder al **mismo** commit de datos, ticker y revisión. La solución no debe cambiar la fuente `main` de producción antes del gate.
2. Acceder con autenticación válida a Preview Vercel; registrar HTTP 200 y sesión autorizada sin exponer secretos ni deshabilitar Deployment Protection/SSO. Verificar que la salida 401 corresponde al sistema correcto si persiste.
3. Verificar en **ADBE, DUOL, UBER, NVO y AFYA** en escritorio y móvil: siete pestañas `analisis`, `valoracion`, `financieros`, `indicadores`, `modelo`, `sensibilidades`, `revision`.
4. Confirmar índice único, enlaces, estados históricos no duplicados, navegación de retorno, precio de mercado fechado, DCF Base, MOS 35%, cuatro escenarios cuando existen, origen de ratios, fórmulas y fuente de cada tabla.
5. Confirmar sensibilidad DCF y de múltiplos sin números inventados: en SHAK/MELI renderizar cinco matrices OK y dos N/A con motivo; en UBER/GOOGL/INTU/NU no presentar valores relativos como auditados. Para la matriz nativa, cotejar 25 cifras, ejes y centro FY+3 con el JSON y la hoja.
6. Comprobar formularios de observaciones por ticker/revisión (no guardar en otra ficha), y que la auditoría económica no se inicia al pulsar LISTO.
7. Adjuntar resultados visuales/funcionales (capturas redacted de escritorio/móvil, siete pestañas, revisión/hash, errores, correcciones) y las ejecuciones CI exactas. Solo tras resolver el gate financiero de #211 y las discrepancias hoja→JSON considerar fusión.

## Criterio de «limpieza terminada»
Un PR con 8 workflows verdes no basta: se requiere catálogo y controles financieros aprobados, fuente de datos cruzada, acceso autenticado, QA de interfaz y despliegue de producción verificado. Hasta entonces conservar estado EN_REVISION y PR en borrador.

La vigilancia diaria de cierre es informativa y de solo lectura. No reemplaza esta validación real.
