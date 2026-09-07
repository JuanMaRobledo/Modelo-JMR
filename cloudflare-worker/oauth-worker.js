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
 *   ALLOWED_ORIGIN        — el origin exacto del sitio, p. ej.
 *                          "https://juanmarobledo.github.io"
 */

function corsHeaders(origin, allowedOrigin) {
  var headers = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (origin && origin === allowedOrigin) headers['Access-Control-Allow-Origin'] = allowedOrigin;
  return headers;
}

async function handleRequest(request, env) {
  var origin = request.headers.get('Origin') || '';
  var cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (origin !== env.ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: 'Origen no permitido.' }), {
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
