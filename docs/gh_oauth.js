// Login con GitHub (OAuth) — reemplaza el "pegá tu Personal Access Token"
// por un botón real de "Conectar con GitHub". El resto de cada página
// sigue igual: el token que termina en localStorage bajo la misma clave
// de siempre (jmr-gh-datastore-token) es el que ya usan ghHeaders()/
// getGhToken() en visor.html, research.js y mi-bitacora.html — no hace
// falta tocar esas llamadas, solo cómo se consigue el token.
//
// Por qué hace falta un Worker aparte (GhOAuth.WORKER_URL): GitHub no
// acepta pedidos con CORS al endpoint que cambia el "code" por un
// access_token — ese único paso necesita un intermediario. Ese
// intermediario (un Cloudflare Worker gratis, ver cloudflare-worker/
// en la raíz del repo) es el ÚNICO lugar donde vive el Client Secret de
// la OAuth App; nunca está en este archivo, que es público. Una vez
// obtenido el token, todo lo demás (leer y escribir en
// Modelo-JMR-datos) sigue yendo directo a api.github.com como siempre,
// sin pasar por el Worker — la API de GitHub sí acepta CORS ahí.
//
// El login siempre vuelve a un único callback fijo (oauth-callback.html)
// en vez de a la página desde la que se apretó "Conectar" — así la
// OAuth App de GitHub solo necesita UNA "Authorization callback URL"
// registrada, sin importar cuántas páginas del sitio puedan iniciar el
// login. oauth-callback.html hace el intercambio y redirige de vuelta a
// donde estaba el usuario (guardado en sessionStorage antes de salir).
var GhOAuth = (function () {
  var GH_TOKEN_KEY = 'jmr-gh-datastore-token';
  var STATE_KEY = 'jmr-oauth-state';
  var RETURN_KEY = 'jmr-oauth-return-to';
  // Client ID de la OAuth App de GitHub — no es secreto, es seguro que
  // esté acá. Se completa una sola vez, después de crear la OAuth App
  // (ver instrucciones). Mientras esté vacío, GhOAuth.isConfigured()
  // devuelve false y cada página cae de vuelta al campo para pegar un
  // PAT a mano, así el sitio nunca queda roto en el medio de la
  // migración.
  var CLIENT_ID = 'Ov23li9uoL2CDT8yGmho';
  // URL del Cloudflare Worker que hace el intercambio (ver
  // cloudflare-worker/oauth-worker.js). Tampoco es secreta.
  var WORKER_URL = 'https://modelo-jmr-oauth.juan0804.workers.dev';
  var SCOPE = 'public_repo';

  function getGhToken() { try { return (localStorage.getItem(GH_TOKEN_KEY) || '').trim(); } catch (e) { return ''; } }
  function setGhToken(t) { try { localStorage.setItem(GH_TOKEN_KEY, (t || '').trim()); } catch (e) { } }
  function clearGhToken() { try { localStorage.removeItem(GH_TOKEN_KEY); } catch (e) { } }
  function isConfigured() { return !!(CLIENT_ID && WORKER_URL); }

  // Únicas implementaciones de estas tres funciones — visor.html,
  // mi-bitacora.html, research.js y portafolio.js las usaban cada uno con
  // su propia copia (idéntica) del código; ahora todas apuntan acá para
  // que no puedan desincronizarse entre sí.
  function ghHeaders(token) {
    var h = { 'Accept': 'application/vnd.github+json' };
    var t = token || getGhToken();
    if (t) h['Authorization'] = 'token ' + t;
    return h;
  }
  function b64EncodeUnicode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64DecodeUnicode(str) { return decodeURIComponent(escape(atob(str))); }
  function callbackUrl() { return new URL('oauth-callback.html', location.href).href; }

  function startLogin() {
    if (!isConfigured()) return;
    var state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      sessionStorage.setItem(STATE_KEY, state);
      sessionStorage.setItem(RETURN_KEY, location.href);
    } catch (e) { }
    var url = 'https://github.com/login/oauth/authorize'
      + '?client_id=' + encodeURIComponent(CLIENT_ID)
      + '&scope=' + encodeURIComponent(SCOPE)
      + '&redirect_uri=' + encodeURIComponent(callbackUrl())
      + '&state=' + encodeURIComponent(state);
    location.href = url;
  }

  // Se llama SOLO desde oauth-callback.html. Cambia el "code" de la URL
  // por un token vía el Worker, lo guarda, y resuelve con la URL a la
  // que hay que volver (la página desde la que se apretó "Conectar").
  // Si algo falla, el error trae igual esa URL (err.returnTo) para poder
  // ofrecer un botón "Volver" incluso cuando el login no se completó.
  function completeLogin() {
    var params = new URLSearchParams(location.search);
    var returnTo = null;
    try { returnTo = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch (e) { }
    returnTo = returnTo || new URL('index.html', location.href).href;

    function fail(msg) {
      var err = new Error(msg);
      err.returnTo = returnTo;
      return Promise.reject(err);
    }

    var errorParam = params.get('error');
    if (errorParam) return fail('GitHub canceló el login: ' + (params.get('error_description') || errorParam));
    var code = params.get('code');
    if (!code) return fail('Falta el código de GitHub en la URL.');
    var state = params.get('state');
    var savedState = null;
    try { savedState = sessionStorage.getItem(STATE_KEY); sessionStorage.removeItem(STATE_KEY); } catch (e) { }
    if (!state || !savedState || state !== savedState) return fail('No se pudo validar el login (estado inválido) — probá conectar de nuevo.');
    if (!isConfigured()) return fail('El login con GitHub todavía no está configurado en el sitio.');

    return fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (e) { throw new Error((e && e.error) || ('HTTP ' + res.status)); });
      return res.json();
    }).then(function (data) {
      if (!data.access_token) throw new Error('GitHub no devolvió un token.');
      setGhToken(data.access_token);
      return returnTo;
    }).catch(function (err) {
      err.returnTo = returnTo;
      throw err;
    });
  }

  return {
    getGhToken: getGhToken,
    setGhToken: setGhToken,
    clearGhToken: clearGhToken,
    isConfigured: isConfigured,
    startLogin: startLogin,
    completeLogin: completeLogin,
    ghHeaders: ghHeaders,
    b64EncodeUnicode: b64EncodeUnicode,
    b64DecodeUnicode: b64DecodeUnicode
  };
})();
