# Módulo Colombia · v1

La página `colombia.html` permite obtener por ticker local cotización COP,
estados anuales/trimestrales e historia diaria de precios. Exporta JSON,
CSV y un Excel de datos; prepara los dos prompts Colombia; incorpora informes
Markdown con identidad; guarda expedientes en el navegador y, mediante
autorización explícita, en `Modelo-JMR-datos/colombia/expedientes/`.

## Separación

- API propia: `/api/colombia?ticker=ECOPETROL.CL`.
- Contrato compartido entre API, CLI y página: `colombia/core.js`.
- Ticker `.CL` más identidad BVC/COP verificada en respuesta; sin fallback a ADR.
- Cada consulta crea un UUID y un expediente sin supuestos heredados.
- Clave local propia: `jmr-colombia-dossiers-v1`.
- Prompts propios: `colombia-research-v1.md`, `colombia-valuation-v1.md`.
- Carpeta remota propia; las bibliotecas US no se leen ni se escriben.
- El adaptador FMP existente rechaza `.CL` y dirige a este apartado.
- Endpoints `/api/` excluidos de caché offline del service worker.

## Cobertura y límites explícitos

Yahoo entrega una historia parcial que varía por emisor y campo. Los datos
son del proveedor, **no una descarga oficial certificada**. Fecha fiscal,
fecha de consulta y fecha de última negociación se conservan separadas.
Fecha de publicación y duración exacta de períodos requieren conciliación
con documentos oficiales. No se inventan diez años, LTM, minoritarios,
acciones por clase, WACC, probabilidades ni retornos terminales.

El Excel descargado es un paquete financiero, **no una copia de la maestra
de valoración ni un DCF ya calculado**. La metodología permite FCFF,
patrimonio financiero y suma de partes; los dos últimos requieren su rama
de plantilla/motor adecuada antes de calcular. Este módulo no certifica
que la plantilla industrial vigente soporte bancos o holdings.

Los informes requieren frontmatter con `market: CO`, `ticker` local exacto
, `analysis_date` y `run_id` del expediente. Se muestran como texto; contenido HTML
no se ejecuta. Importar no equivale a certificar sus cálculos. La publicación
es de un expediente pendiente de auditoría, no de una valoración certificada.

## Línea de comandos

Node.js 20+ sin dependencias adicionales:

    node scripts/colombia-datos.mjs ECOPETROL.CL --output /ruta/trabajo

Escribe en una carpeta nueva `colombia/<ticker>/<uuid>/`: expediente JSON,
CSV, dos prompts personalizados y LEEME. No sobrescribe ni publica.
El wrapper Python `JMR-valuation/scripts/colombia_datos.py` recibe
`--web-repo` y `--output` y llama el mismo contrato; no importa código SEC.

## Validación

    node --test tests/colombia.test.js
    node tests/terminal-capital.cjs

Los tests comprueban identidad/mercado, moneda, fechas, faltantes, ceros
reales, duplicados contradictorios, independencia de ejecuciones, caída
parcial del proveedor, separación de FMP y exclusión de caché de API.
