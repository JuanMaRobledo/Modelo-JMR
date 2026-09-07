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
var GhOAuth = (function () {
  var GH_TOKEN_KEY = 'jmr-gh-datastore-token';
  var STATE_KEY = 'jmr-oauth-state';
  // Client ID de la OAuth App de GitHub — no es secreto, es seguro que
  // esté acá. Se completa una sola vez, después de crear la OAuth App
  // (ver instrucciones). Mientras esté vacío, GhOAuth.isConfigured()
  // devuelve false y cada página cae de vuelta al campo para pegar un
  // PAT a mano, así el sitio nunca queda roto en el medio de la
  // migración.
  var CLIENT_ID = '';
  // URL del Cloudflare Worker que hace el intercambio (ver
  // cloudflare-worker/oauth-worker.js). Tampoco es secreta.
  var WORKER_URL = '';
  var SCOPE = 'public_repo';

  function getGhToken() { try { return (localStorage.getItem(GH_TOKEN_KEY) || '').trim(); } catch (e) { return ''; } }
  function setGhToken(t) { try { localStorage.setItem(GH_TOKEN_KEY, (t || '').trim()); } catch (e) { } }
  function clearGhToken() { try { localStorage.removeItem(GH_TOKEN_KEY); } catch (e) { } }
  function isConfigured() { return !!(CLIENT_ID && WORKER_URL); }

  function startLogin() {
    if (!isConfigured()) return;
    var redirectUri = location.origin + location.pathname;
    var state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { sessionStorage.setItem(STATE_KEY, state); } catch (e) { }
    var url = 'https://github.com/login/oauth/authorize'
      + '?client_id=' + encodeURIComponent(CLIENT_ID)
      + '&scope=' + encodeURIComponent(SCOPE)
      + '&redirect_uri=' + encodeURIComponent(redirectUri)
      + '&state=' + encodeURIComponent(state);
    location.href = url;
  }

  // Se llama al arrancar cada página. Si la URL trae ?code=... (volvimos
  // de GitHub tras el login), lo cambia por un token vía el Worker y lo
  // guarda; si no, no hace nada. Siempre limpia el ?code=/&state= de la
  // URL antes de devolver, para que un F5 no reintente el mismo code
  // (GitHub solo lo acepta una vez).
  function handleCallback() {
    var params = new URLSearchParams(location.search);
    var code = params.get('code');
    if (!code) return Promise.resolve(false);
    var state = params.get('state');
    var savedState = null;
    try { savedState = sessionStorage.getItem(STATE_KEY); sessionStorage.removeItem(STATE_KEY); } catch (e) { }
    var cleanUrl = location.origin + location.pathname + location.hash;
    try { history.replaceState({}, document.title, cleanUrl); } catch (e) { }
    if (!state || !savedState || state !== savedState) {
      return Promise.reject(new Error('No se pudo validar el login de GitHub (estado inválido) — probá conectar de nuevo.'));
    }
    if (!isConfigured()) return Promise.reject(new Error('El login con GitHub todavía no está configurado en el sitio.'));
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
      return true;
    });
  }

  return {
    getGhToken: getGhToken,
    setGhToken: setGhToken,
    clearGhToken: clearGhToken,
    isConfigured: isConfigured,
    startLogin: startLogin,
    handleCallback: handleCallback
  };
})();
