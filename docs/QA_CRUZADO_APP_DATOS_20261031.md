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
7. Adjuntar resultados visuales/funcionales (capturas sin secretos de escritorio/móvil, siete pestañas, revisión/hash, errores, correcciones) y las ejecuciones CI exactas. Evaluar por separado la aceptación de la app y la aprobación financiera del catálogo: no equiparar una prueba visual con una auditoría económica.

## Dos cierres independientes: no ampliar el alcance de limpieza

**A. Saneamiento técnico y estandarización de la app.** Se cierra solamente cuando:
- La app conserva una portada y una ficha única por ticker, con siete pestañas utilizables, subpestañas financieras, múltiplos visibles incluso si indican N/D, índice y enlaces sin duplicidad funcional.
- El catálogo elige una única revisión activa por ticker; los históricos se conservan, pero no se mezclan con la ficha vigente. Las 20 empresas comparten el contrato editorial y de presentación, sin exigir que todas tengan valores relativos aprobados.
- Las pruebas automatizadas del código de app y del contrato editorial/catalogación pasan en sus ámbitos, sin llamar «verde» al gate financiero separado.
- El Preview tiene acceso autenticado comprobado, datos de origen identificados y QA visual real en escritorio y móvil; cualquier vista de la rama #211 se prueba con fuente de datos de esa MISMA revisión, sin alterar `main` ni los controles de acceso.
- Se valida el despliegue previsto antes de decir «app saneada». Nunca inferirlo de READY o de 8 workflows verdes.

**B. Calidad y aprobación económica por empresa.** Permanece independiente: reconstruir anclas UBER/GOOGL; integrar nativos INTU/NU con semántica correcta; conciliar las seis ponderaciones divergentes; revisar 20 Nivel 2 y fuentes; cerrar el gate financiero de #211, seguido de revisión visual y auditoría económica según el proceso JMR. Ninguna excepción financiera se convierte en cero, en «N/A» ficticio ni en resultado aprobado para acelerar el saneamiento técnico.

**Regla de control del alcance:** los nuevos hallazgos de empresa se registran en el expediente correspondiente, no se agregan como tareas de rediseño de la app salvo que demuestren una falla reutilizable del lector. No fusionar el PR financiero #211 ni publicar valores no conciliados. El PR de app #151 requiere su propio QA autenticado antes de fusionar, aunque el gate financiero siga abierto.

La vigilancia diaria de cierre es informativa y de solo lectura; no reemplaza pruebas ni correcciones.
