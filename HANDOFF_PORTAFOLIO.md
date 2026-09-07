# Handoff para Codex — Vista de portafolio unificada (Modelo JMR)

Este documento es un handoff de Claude hacia Codex (GPT) en la misma sesión de trabajo del repo `JuanMaRobledo/Modelo-JMR`. El usuario pidió una lista de 7 mejoras "todas desde el principio, de a pocos", y esta es la única que falta — la más grande, así que se corta acá para no arriesgar quedarse a mitad de camino por límite de contexto. Las otras 6 ya están hechas, probadas y en `main`.

## Qué es esta app (contexto imprescindible)

- Sitio 100% estático servido por GitHub Pages desde `docs/`. **No hay backend propio, no hay build step** — cada página es un `.html` con `<style>` y `<script>` inline (más `market_data.js`, `auth.js` y `research.js` compartidos). Todo cambio se hace editando esos archivos directamente.
- 4 páginas hoy, con nav compartida (`nav.appnav`) en las 4:
  - `docs/index.html` — **Bitácora de Valoración**: tabla de 55 casos de inversión hardcodeados en un `var DATA = [...]` (JSON válido embebido como literal JS) dentro del propio `<script>` del archivo, más una sección "Agregar hipótesis nueva" (subir PDF/DOCX, reconocimiento de campos, se guarda en GitHub en `bitacora/hipotesis.json` y se mezcla con `DATA` al cargar).
  - `docs/visor.html` — **Visor Modelo JMR**: sube un Excel del modelo de valoración (DCF Damodaran + 5 múltiplos), lo resume, y permite "Guardar valoración" en el repo privado `Modelo-JMR-datos`, carpeta `valoraciones/`, un archivo por guardado (`<TICKER>-<timestamp>.json`).
  - `docs/calculadora.html` — Calculadora DCF standalone, sin guardado en GitHub.
  - `docs/research.html` + `docs/research.js` — **Research Fundamental**: biblioteca de análisis cualitativos (subís un documento generado por Claude/ChatGPT con un prompt maestro fijo — `docs/prompts/analisis-fundamental-v1.md` —, se guarda en `Modelo-JMR-datos/analisis/<TICKER>-research-<id>.json`).
- **Persistencia**: todo lo "guardado de verdad" vive en un repo privado GitHub aparte, `JuanMaRobledo/Modelo-JMR-datos` (el repo del sitio, `Modelo-JMR`, es público a la fuerza porque GitHub Pages free no sirve desde repos privados). Se accede vía la API de Contents de GitHub (`https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/...`) usando un Personal Access Token que el usuario pega una vez. **El token se guarda en `localStorage` bajo la clave `jmr-gh-datastore-token` — es la MISMA clave en las 3 páginas que lo usan** (visor.html, index.html, research.js), así que conectarlo en cualquiera lo deja conectado en todas (mismo origen).
- **Login**: `auth.js` (compartido, cargado como primer `<script>` de cada `<body>`) tapa toda la página con un login usuario/contraseña simple — NO es seguridad real (es un sitio público, cualquiera puede ver el código fuente), solo evita curiosos. No lo toques salvo que te pidan cambiarlo.
- **API keys**:
  - FMP (Financial Modeling Prep, cotizaciones/logos): `market_data.js`, función `MarketData.getApiKey()` — tiene una key gratuita por defecto embebida (`DEFAULT_API_KEY`), así que ya funciona sin que el usuario haga nada; si él guarda una propia en cualquier página, esa tiene prioridad.
  - GitHub PAT: **nunca la hardcodees en el código**. A diferencia de la de FMP, esta da acceso de escritura al repo privado del usuario — si queda en el código público, GitHub Pages la expone a cualquiera y GitHub probablemente la revoca solo al detectarla. Siempre debe pegarse a mano y guardarse solo en `localStorage`.
- **Tema visual**: mismo set de variables CSS (`--bg`, `--surface`, `--ink`, `--accent`, `--positive`, `--negative`, etc.) copiado y pegado en cada página (no hay CSS compartido) — soporta claro/oscuro automático + un toggle manual. Si agregás una página nueva, copiá el bloque `:root{...}` de cualquiera de las 4 existentes tal cual.
- **Cache**: `docs/sw.js` es un service worker con `const CACHE = "modelo-jmr-vNN"` — **hay que subir el número cada vez que se despliega un cambio**, si no el navegador de producción sigue sirviendo la versión cacheada vieja. Está en v62 ahora mismo.

## Cómo se probó todo esto (sin backend, sin usuario real disponible)

No hay tests automatizados en el repo. Cada cambio de esta sesión se probó con **Playwright ad-hoc** (scripts sueltos, no versionados en el repo) que:
1. Levantan un `http.createServer` local sirviendo `docs/` como estático.
2. Usan `page.route()` para interceptar y mockear: las librerías de CDN (xlsx, pdf.js, mammoth, DOMPurify, marked, jsdiff, html2pdf — el sandbox donde corrí esto no tiene internet real, así que estas librerías nunca cargan de verdad; para research.js alcanza con stubs mínimos, ver más abajo) y la API de GitHub (`api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/...`).
3. Precargan `localStorage.setItem('jmr-auth-ok-v1','1')` vía `page.addInitScript` para saltarse el login de `auth.js` en cada test.

**Cuidado con el orden de registro de rutas de Playwright**: revisa las más recientes PRIMERO. Si registrás un comodín amplio (`.../libs/**`) después de uno específico (`.../libs/dompurify/**`), el amplio gana y tu stub específico nunca se usa — hay que registrar el comodín general PRIMERO y el específico DESPUÉS. Me mordió este bug dos veces en esta sesión.

Si vos (Codex) tenés acceso a internet real desde tu entorno, probablemente podés probar esto de forma más directa sin tanto mock — usá tu criterio.

## Las 6 mejoras ya hechas (por si necesitás tocar código cercano)

Todas en commits separados, ya en `main`, en este orden:
1. `d8b4128` — Búsqueda de texto completo en la biblioteca de Research (no solo ticker/empresa/título) — función `recordSearchText()` en `research.js`, cacheada por `id+updatedAt`.
2. `2a7b4d9` — Aviso de vínculo con el Visor desactualizado — función `checkLinkedValuationFreshness()`, se llama al abrir un análisis en `fillEditor()`.
3. `ea2c5d3` — Extracto de "Resumen ejecutivo" en las tarjetas de la biblioteca — función `recordExcerpt()`.
4. `5a95490` — Botón "Descargar PDF" (archivo real, vía `html2pdf.js` por CDN) además de "Imprimir / PDF" (diálogo del navegador) — función `downloadPdf()`.
5. `8b8c43e` — Compresión de logos e imágenes embebidas (data: URI) antes de guardar, vía canvas — funciones `compressImageDataUrl()` / `compressEmbeddedImages()`.
6. `14a7b58` — Enlace inverso: "Valoraciones guardadas" del Visor muestra "Ver análisis fundamental →" si el ticker tiene un Research guardado (`tickerFromResearchFileName()`, `listResearchTickers()` en `visor.html`); `research.html?ticker=XXX` filtra la biblioteca automáticamente al cargar (`applyDeepLinkFilter()` en `research.js`).

Todo esto también fue precedido, en la misma sesión, por: agregar `auth.js` (login), precargar la API key de FMP, agregar la sección "Agregar hipótesis nueva" + gráfico comparativo en la Bitácora, mostrar fecha real de análisis en "Valoraciones guardadas", y la biblioteca de Research original (esa la construyó Codex en un commit anterior — `4d80458` — antes de este handoff).

## La tarea pendiente: vista de portafolio unificada

**Idea**: una página nueva (5ta pestaña de nav) que junte, por ticker, las 3 fuentes de datos que hoy viven separadas: la ficha corta de la Bitácora, la valoración cuantitativa del Visor, y el análisis fundamental de Research — en una sola tarjeta/vista por empresa, buscable.

### Decisión de diseño que falta tomar (no la tomé yo — es tuya o del usuario)

La Bitácora (`index.html`) tiene sus 55 casos hardcodeados en un `var DATA = [...]` **dentro del HTML/JS de la propia página**, no en un archivo JSON separado fetcheable. Para que la vista de portafolio pueda leer esos 55 casos sin duplicar la lista a mano, tenés dos caminos:

- **(A) Fetch + regex-extract**: desde `portafolio.js`, hacer `fetch('index.html')`, tomar el texto crudo, y extraer el contenido de `var DATA = [ ... ];` con una regex (el array ya es JSON válido — cada objeto usa comillas dobles en las claves — así que después de extraerlo se puede `JSON.parse()` directo). Es frágil si alguien cambia el nombre de la variable o el formato del archivo, pero no requiere tocar `index.html` en absoluto.
- **(B) Migrar los 55 casos a un JSON separado**: crear `docs/bitacora-data.json` con el array, y que `index.html` lo cargue por `fetch` en vez de tenerlo embebido. Más limpio y reutilizable (portafolio.js lo lee igual de fácil), pero es un cambio a un archivo que ya funciona y further no lo pidió el usuario explícitamente — evaluá el riesgo/beneficio, o preguntale antes de tocarlo si tenés forma de hacerlo.

Mi recomendación: (A) primero (cero riesgo de romper la Bitácora), y dejar (B) como mejora aparte si el usuario la pide después.

Las hipótesis "custom" que el usuario agrega a mano en la Bitácora SÍ están en un JSON aparte y fetcheable: `Modelo-JMR-datos/bitacora/hipotesis.json` (mismo repo/token que todo lo demás). Mezclalas con las 55 hardcodeadas igual que hace `index.html` mismo (ver `loadAndMergeCustom()` en `docs/index.html`).

### Fuentes de datos a combinar (las 3, todas por ticker)

1. **Bitácora** (ver arriba): campos relevantes por caso — `ticker`, `empresa`, `fecha`, `cat`, `precio` (entrada), `zV`/`zD`/`zH` (zonas de valor, string tipo "335-355"), `oNeg`/`oBase`/`oOpt` (escenarios objetivo), `cagr`, `moat`, `riesgos`, `conclusion`.
2. **Visor** — listar `valoraciones/` en `Modelo-JMR-datos` (función ya existente y reutilizable: `listValoraciones()` en `visor.html`, o reimplementarla igual en `portafolio.js` — es un simple `GET .../contents/valoraciones`). Cada archivo, al abrirlo, tiene `ticker`, `precio`, `precioAnalisis`, `fecha`, `zonas` (`{value,deepValue,historica,conMOS}` cada uno `{min,max}`), `objetivoPonderado` (`{conservador,base,optimista}`), `cagr`. Ya hay precedente de leer y usar exactamente estos campos: `linkVisorValuation()` + `buildLinkedValuationHtml()` en `research.js` — copiá ese patrón.
3. **Research** — listar `analisis/` en `Modelo-JMR-datos`. Cada archivo tiene `ticker`, `company`, `title`, `html` (el documento completo, ya sanitizado), `logo`, `date`. Para el ticker que tenga varios, tomá el de `updatedAt` más reciente (mismo criterio que `syncRemote()` en `research.js`).

### Qué mostrar por ticker (sugerido, ajustá a gusto)

- Encabezado: logo (de Research si tiene, si no `logoUrlForTicker(ticker)` de FMP), ticker, nombre de empresa.
- Bloque Bitácora: fecha del caso, precio de entrada, categoría (Estándar/Especulativa), moat/riesgos/conclusión resumidos.
- Bloque Visor: precio actual, precio objetivo ponderado (los 3 escenarios), y reusar el gráfico comparativo ya construido (`buildComparativoChart()` en `docs/index.html`, o el patrón de `buildZonesChart()`/`buildScenarioChart()` en `visor.html` — cualquiera de los dos ya resuelve "precio vs. zonas vs. escenarios" visualmente, no hace falta inventar uno nuevo).
- Bloque Research: excerpt del Resumen ejecutivo (función `recordExcerpt()` ya escrita en `research.js` — se puede portar) + link "Ver análisis completo →" a `research.html?ticker=XXX` (el deep-link ya funciona, ver mejora #6 arriba).
- Buscador de texto completo arriba de todo, mismo criterio que ya se usó en Research (`recordSearchText()`), pero ahora indexando las 3 fuentes juntas.
- Un ticker puede tener 0, 1, 2 o las 3 fuentes — el diseño tiene que degradar bien cuando falta alguna (mostrar "Sin análisis fundamental guardado — crear uno →" en vez de dejar un hueco, por ejemplo).

### Cosas a reutilizar tal cual (no reinventar)

- El login (`auth.js`) y el bloque `:root{...}` de variables CSS — copiar de cualquier página existente.
- `market_data.js` para precio/logo en vivo.
- El patrón de conexión a GitHub (banner tipo el que se agregó a `research.html` en esta sesión — `renderGhBanner()`/`showGhBannerForm()` en `research.js` — portalo, es la versión más pulida de las 2-3 que hay en el repo).
- `parseRange()` (Bitácora, en `index.html`) para convertir "335-355" a `{min,max}`.
- `fmtN`/formato de moneda `es-CO` con `toLocaleString` — usado en todos lados, mantené consistencia.

### No te olvides

- Agregar `<a href="portafolio.html">Portafolio</a>` al `nav.appnav` en las **5** páginas (las 4 existentes + la nueva).
- Sumar `portafolio.html` (y `.js` si lo separás) a `APP_SHELL` en `docs/sw.js`, y **subir el número de `CACHE`** al terminar.
- Si agregás algo a `docs/manifest.json` (descripción, íconos) mantené consistencia con las demás entradas.
- Seguí el patrón de "de a poco" que pidió el usuario: implementá, probá, commiteá, en pasos chicos — no un commit gigante con todo el feature de una.

Cualquier duda de contexto que no esté cubierta acá, el historial de commits de este repo (`git log`) tiene mensajes largos y descriptivos de cada decisión tomada en esta sesión — son buena fuente adicional.
