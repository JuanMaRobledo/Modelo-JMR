const CACHE = "modelo-jmr-v78";
const APP_SHELL = [
  "index.html",
  "visor.html",
  "calculadora.html",
  "research.html",
  "research.js",
  "portafolio.html",
  "portafolio.js",
  "mi-bitacora.html",
  "gh_oauth.js",
  "oauth-callback.html",
  "prompts/analisis-fundamental-v1.md",
  "auth.js",
  "jmr_engine.js",
  "market_data.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Solo cacheamos pedidos del propio sitio (el "app shell" y sus CDNs de
  // terceros no cambian por request). Las llamadas a api.github.com y a
  // financialmodelingprep.com pasan sin cachear: son datos vivos (precios,
  // análisis, hipótesis) y cachearlas podía terminar sirviendo una
  // respuesta vieja como si fuera la actual ante cualquier hipo de red.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
