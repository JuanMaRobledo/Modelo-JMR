import { validSession } from '../sso-session.js';
import { tickerKey, resolveCompany, readSheet, validateChanges, sheetsRequest, readPublicWorkbook } from '../lib/model-sheet.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!validSession(req.headers.cookie)) return res.status(401).json({error:'Inicia sesión para consultar o editar el modelo.'});
  if (!['GET','PATCH'].includes(req.method)) { res.setHeader('Allow','GET, PATCH'); return res.status(405).end(); }
  if(req.method === 'PATCH') {
    // Session cookies are HttpOnly/SameSite=Lax; also reject cross-origin writes.
    const origin = req.headers.origin;
    let sameOrigin=false;try{sameOrigin=!!origin&&new URL(origin).host===req.headers.host;}catch{}
    if (!sameOrigin) return res.status(403).json({error:'Origen no autorizado.'});
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).end();
  }
  try {
    const ticker = tickerKey(req.query.ticker);
    const company = await resolveCompany(ticker);
    // Las versiones fuera del catálogo pueden consultarse, pero no sobrescribir
    // una hoja histórica desde el editor. Primero deben conciliarse.
    if(req.method==='PATCH' && company.catalogAvailable && !company.official)
      return res.status(409).json({error:'Valoración no incorporada al catálogo oficial: lectura permitida, edición bloqueada hasta su conciliación.'});
    if (!company.id) return res.status(409).json({error:'Esta valoración no tiene una hoja de Google vinculada.', record:company.record, path:company.path});
    if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT){
      if(req.method==='PATCH')return res.status(503).json({error:'La lectura está activa; falta configurar el acceso de escritura a Google Sheets.'});
      const publicSheet=await readPublicWorkbook(company.id);
      const record={...company.record,hojas:undefined};
      return res.json({record,path:company.path,...publicSheet});
    }
    const snapshot = await readSheet(company.id);
    if(req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body?.revision !== snapshot.revision) return res.status(409).json({error:'La hoja cambió desde la última lectura. Actualiza y revisa tus cambios.'});
      const data = validateChanges(snapshot.sheets, body.changes);
      await sheetsRequest(company.id, '/values:batchUpdate', {method:'POST', body:JSON.stringify({valueInputOption:'RAW', data})});
      const updated = await readSheet(company.id);
      return res.json({ ...company, id:undefined, ...updated });
    }
    res.json({ ...company, id:undefined, ...snapshot });
  } catch(error) {
    res.status(error.status || 500).json({error:error.status ? error.message : 'No se pudo sincronizar el modelo. Revisa la configuración y el acceso a la hoja.'});
  }
}
