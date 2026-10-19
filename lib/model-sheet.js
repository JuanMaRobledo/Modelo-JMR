import { createHash, createSign } from 'node:crypto';

export const DATA_REPO = 'JuanMaRobledo/Modelo-JMR-datos';
export function tickerKey(value) {
  const key = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9._-]{1,24}$/.test(key)) throw Object.assign(new Error('Ticker inválido.'), { status: 400 });
  return key;
}
async function json(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Object.assign(new Error(`La fuente respondió HTTP ${response.status}.`), { status: response.status === 404 ? 404 : 502 });
  return response.json();
}
export async function resolveCompany(ticker) {
  const root = `https://api.github.com/repos/${DATA_REPO}/contents/`;
  const files = await json(root + 'valoraciones?ref=main', { headers: { 'User-Agent': 'JMR-model-sync' } });
  const matching = files.filter(f => f.type === 'file' && f.name.replace(/-\d{10,}\.json$/i, '').replace(/\.json$/i, '').toUpperCase() === ticker)
    .sort((a,b) => b.name.localeCompare(a.name, 'en', { numeric: true }));
  if (!matching.length) throw Object.assign(new Error('No hay una valoración guardada para este ticker.'), { status: 404 });
  const path = matching[0].path;
  const record = await json(`https://raw.githubusercontent.com/${DATA_REPO}/main/${path}`);
  if (tickerKey(record.ticker) !== ticker) throw new Error('La empresa del registro no coincide.');
  const id = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/.exec(record.hojaGoogle || '')?.[1];
  return { record, path, id };
}
let credentialCache;
async function googleToken() {
  if (credentialCache?.expires > Date.now() + 60000) return credentialCache.token;
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT) throw Object.assign(new Error('La sincronización con Google Sheets aún no está configurada en el servidor.'), { status: 503 });
  const account = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT);
  const now = Math.floor(Date.now()/1000);
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = b64({ alg:'RS256', typ:'JWT' }) + '.' + b64({ iss:account.client_email, scope:'https://www.googleapis.com/auth/spreadsheets', aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600 });
  const signer = createSign('RSA-SHA256'); signer.update(unsigned);
  const assertion = unsigned + '.' + signer.sign(account.private_key, 'base64url');
  const result = await json('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion}).toString() });
  credentialCache = { token:result.access_token, expires:Date.now()+result.expires_in*1000 };
  return credentialCache.token;
}
export async function sheetsRequest(id, suffix = '', options = {}) {
  const token = await googleToken();
  return json(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}${suffix}`, {
    ...options, headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }
  });
}
export function unpackSheets(data) {
  const sheets = {};
  for (const sheet of data.sheets || []) {
    const cells = {};
    for (const grid of sheet.data || []) (grid.rowData || []).forEach((row, ri) => {
      (row.values || []).forEach((cell, ci) => {
        if (!cell.effectiveValue && !cell.userEnteredValue) return;
        let column = '', n = (grid.startColumn || 0) + ci + 1;
        while(n) { n--; column = String.fromCharCode(65+n%26)+column; n=Math.floor(n/26); }
        const v = cell.effectiveValue || {}, raw = cell.userEnteredValue || {};
        cells[column+((grid.startRow || 0)+ri+1)] = {
          v:v.numberValue ?? v.stringValue ?? v.boolValue ?? null,
          w:cell.formattedValue ?? '', raw,
          formula:raw.formulaValue || null
        };
      });
    });
    sheets[sheet.properties.title] = cells;
  }
  return sheets;
}
export function revision(sheets) {
  return createHash('sha256').update(JSON.stringify(Object.keys(sheets).sort().map(name => [name,
    Object.keys(sheets[name]).sort().map(a => [a,sheets[name][a].raw])]))).digest('hex');
}
export async function readSheet(id) {
  const fields = 'sheets(properties(title),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,formattedValue))))';
  // The fields mask keeps this request below the full formatted workbook size.
  const data = await sheetsRequest(id, '?includeGridData=true&fields='+encodeURIComponent(fields));
  const sheets = unpackSheets(data);
  return { sheets, revision:revision(sheets), fetchedAt:new Date().toISOString() };
}
export function validateChanges(sheets, changes) {
  if (!Array.isArray(changes) || !changes.length || changes.length > 50) throw Object.assign(new Error('Envía entre 1 y 50 cambios.'), {status:400});
  const seen = new Set();
  return changes.map(change => {
    // Only existing literal numeric assumptions. Calculated cells and financial statements remain read-only.
    const { sheet, cell, value, previous } = change;
    const existing = sheets[sheet]?.[cell];
    if (sheet !== 'Input sheet' || !/^(B[1-9]\d{0,2}|D1)$/.test(cell || '') || seen.has(cell) ||
        !existing || existing.formula || typeof existing.raw?.numberValue !== 'number' ||
        typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value)>1e15) {
      throw Object.assign(new Error('Solo se pueden editar supuestos numéricos de entrada; las fórmulas se conservan.'), {status:400});
    }
    if (previous !== existing.raw.numberValue) throw Object.assign(new Error('La celda cambió en la hoja. Actualiza y revisa antes de guardar.'), {status:409});
    seen.add(cell);
    return { range:`'Input sheet'!${cell}`, values:[[value]] };
  });
}

// A public native workbook can be read without granting Google write access.
// The server fetch avoids browser CORS restrictions; IDs come only from the company registry.
export async function readPublicWorkbook(id) {
  if (!/^[\w-]+$/.test(id)) throw Object.assign(new Error('Identificador de hoja inválido.'), {status:400});
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, {
    redirect:'follow', signal:AbortSignal.timeout(20000), headers:{Accept:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
  });
  if(!response.ok) throw Object.assign(new Error('No se pudo leer la hoja pública de la empresa.'), {status:502});
  const maxBytes=2*1024*1024;
  if(Number(response.headers.get('content-length'))>maxBytes)throw Object.assign(new Error('La hoja supera el tamaño permitido para lectura pública.'),{status:413});
  const workbook=Buffer.from(await response.arrayBuffer());
  if(workbook.length>maxBytes)throw Object.assign(new Error('La hoja supera el tamaño permitido para lectura pública.'),{status:413});
  if(workbook.length<100||workbook[0]!==0x50||workbook[1]!==0x4b)throw Object.assign(new Error('Google no devolvió una hoja de cálculo accesible.'),{status:502});
  return {publicWorkbook:workbook.toString('base64'),writable:false,fetchedAt:new Date().toISOString(),writeError:'Falta configurar el acceso de escritura a Google Sheets en el servidor.'};
}
