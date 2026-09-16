/**
 * Modelo JMR — intercambio de código OAuth de GitHub.
 *
 * Este es el ÚNICO lugar de toda la app donde vive el Client Secret de la
 * OAuth App de GitHub — nunca en el código del sitio (docs/), que es
 * público (GitHub Pages). El sitio le manda a este Worker el "code" que
 * GitHub le dio tras el login; el Worker lo cambia por un access_token
 * usando el secreto (que solo él conoce) y se lo devuelve al sitio. De ahí
 * en adelante el sitio usa ese token para hablar directo con
 * api.github.com — eso ya funciona sin proxy porque la API de GitHub sí
 * acepta CORS con un token en el header Authorization (lo que no acepta
 * CORS es el endpoint de intercambio de código en sí, por eso hace falta
 * este paso intermedio).
 *
 * Variables de entorno que hay que configurar en Cloudflare (Settings →
 * Variables and Secrets del Worker):
 *   GITHUB_CLIENT_ID     — Client ID de la OAuth App (no es secreto)
 *   GITHUB_CLIENT_SECRET — Client Secret de la OAuth App (SÍ es secreto —
 *                          marcarlo como "Secret", no como texto plano)
 *   ALLOWED_ORIGIN        — el origin exacto del sitio. Verificado en vivo
 *                          (sept-2026): el sitio sirve desde
 *                          "https://juanmarobledo.github.io" (repo de
 *                          proyecto en /Modelo-JMR/, pero el Origin de un
 *                          request nunca incluye el path, solo
 *                          esquema+host). Sin barra final.
 *
 * Si "Conectar con GitHub" falla con "Origen no permitido" o con un error
 * 500 pidiendo configurar ALLOWED_ORIGIN, revisar esta variable en el
 * dashboard de Cloudflare (Workers & Pages -> este Worker -> Settings ->
 * Variables and Secrets) — es la causa más común de que el login no
 * funcione, y no se puede diagnosticar ni arreglar desde el código del
 * repo porque vive solo en Cloudflare, fuera de control de versiones.
 */

// Un Origin nunca trae barra final ni distingue mayúsculas en el host, pero
// ALLOWED_ORIGIN es una variable que se pega a mano en el dashboard de
// Cloudflare -- normalizamos ambos lados antes de comparar para no fallar
// por un "https://user.github.io/" (con barra) vs "https://user.github.io"
// (sin barra) configurado en Settings -> Variables and Secrets.
function normalizeOrigin(o) {
  return (o || '').trim().replace(/\/+$/, '').toLowerCase();
}

function corsHeaders(origin, allowedOrigin) {
  var headers = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (origin && normalizeOrigin(origin) === normalizeOrigin(allowedOrigin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

async function handleRequest(request, env) {
  var origin = request.headers.get('Origin') || '';
  var cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!env.ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: 'El Worker no tiene configurada la variable ALLOWED_ORIGIN (Settings -> Variables and Secrets en Cloudflare).' }), {
      status: 500,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  if (normalizeOrigin(origin) !== normalizeOrigin(env.ALLOWED_ORIGIN)) {
    return new Response(JSON.stringify({ error: 'Origen no permitido: "' + origin + '" (el Worker espera "' + env.ALLOWED_ORIGIN + '").' }), {
      status: 403,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no soportado.' }), {
      status: 405,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  var body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Body inválido.' }), {
      status: 400,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  var code = body && body.code;
  if (!code || typeof code !== 'string') {
    return new Response(JSON.stringify({ error: 'Falta "code".' }), {
      status: 400,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  var ghRes;
  try {
    ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'No se pudo contactar a GitHub: ' + e.message }), {
      status: 502,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  var data;
  try {
    data = await ghRes.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Respuesta inválida de GitHub.' }), {
      status: 502,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error_description || data.error }), {
      status: 400,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  if (!data.access_token) {
    return new Response(JSON.stringify({ error: 'GitHub no devolvió un token.' }), {
      status: 502,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }

  return new Response(JSON.stringify({ access_token: data.access_token }), {
    status: 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
  });
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
