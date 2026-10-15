// Run: node scripts/test-research-loading.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../docs/research.js'), 'utf8');
const code = source.slice(source.indexOf('  function syncRemote() {'), source.indexOf('\n  // Un análisis guardado'));
async function run() {
  let connected = true, failed = '', directoryFailed = false, library = [];
  const records = Array.from({ length: 39 }, (_, i) => ({ id: 'id-' + i, ticker: 'T' + i, updatedAt: '2026-10-14', articleHtml: i === 0 ? 'a'.repeat(1100000) : 'article', calculationHtml: '<table></table>' }));
  const files = records.map((r, i) => ({ type: 'file', name: i + '.json', path: 'analisis/' + i + '.json', sha: 'sha' + i, url: 'https://api.test/' + i, download_url: 'https://raw.test/' + i }));
  const context = {
    console, GH_API: 'https://api.test/', getGhToken: () => connected ? 'fixture' : '',
    ghHeaders: () => connected ? { Authorization: 'token fixture', Accept: 'application/vnd.github+json' } : {},
    getLocalLibrary: () => library.slice(), setLocalLibrary: x => { library = x; }, renderLibrary() {},
    fetch: async (url, options) => {
      if (url !== 'https://api.test/analisis') assert.equal(options.cache, 'no-store');
      if (url === 'https://api.test/analisis') return { ok: !directoryFailed, status: 503, json: async () => files };
      const i = Number(url.split('?')[0].split('/').pop());
      if (url.startsWith('https://api.test/')) assert.equal(options.headers.Accept, 'application/vnd.github.raw+json');
      else assert.equal(options.headers, undefined, 'Credentials must not be sent to the download host');
      return { ok: files[i].path !== failed, status: 503, json: async () => structuredClone(records[i]) };
    }
  };
  vm.createContext(context); vm.runInContext(code, context);
  assert.equal(await context.syncRemote(), 39);
  assert.equal(library[0].articleHtml.length, 1100000);
  failed = files[0].path;
  await assert.rejects(context.syncRemote(), /39 análisis disponibles.*No se pudieron actualizar 1/);
  assert.equal(library.length, 39);
  directoryFailed = true;
  await assert.rejects(context.syncRemote(), /HTTP 503/);
  assert.equal(library.length, 39);
  directoryFailed = false; failed = ''; connected = false;
  assert.equal(await context.syncRemote(), 39);
  library.push({ id: 'deleted', remotePath: 'analisis/deleted.json' }, { id: 'unsaved', ticker: 'LOCAL' });
  assert.equal(await context.syncRemote(), 40);
  assert(!library.some(r => r.id === 'deleted'));
  assert(library.some(r => r.id === 'unsaved'));
  // The other app views read the same large research files.
  const portfolio = fs.readFileSync(path.join(__dirname, '../docs/portafolio.js'), 'utf8');
  vm.runInContext(portfolio.slice(portfolio.indexOf('  function loadJsonFolder('), portfolio.indexOf('  function canonicalTicker(')), context);
  assert.equal((await context.loadJsonFolder('analisis')).length, 39);
  const bitacora = fs.readFileSync(path.join(__dirname, '../docs/mi-bitacora.html'), 'utf8');
  vm.runInContext(bitacora.slice(bitacora.indexOf('  function loadResearchDerived('), bitacora.indexOf('  function loadValuations(')), context);
  assert.equal((await context.loadResearchDerived()).length, 39);
  // Saving a decision must retain all article/calculation fields and use
  // the metadata SHA as the optimistic concurrency check for the PUT.
  for (const encoding of ['base64', 'none']) {
    let writes = 0;
    const record = records[0];
    const G = { getGhToken: () => 'fixture', ghHeaders: () => ({}), b64EncodeUnicode: x => Buffer.from(x).toString('base64'), b64DecodeUnicode: x => Buffer.from(x, 'base64').toString() };
    const decisionContext = { window: { GhOAuth: G }, fetch: async (url, options = {}) => {
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body), saved = JSON.parse(G.b64DecodeUnicode(body.content));
        assert.equal(body.sha, 'blob-sha');
        assert.equal(saved.articleHtml, record.articleHtml);
        assert.equal(saved.calculationHtml, record.calculationHtml);
        assert.equal(saved.decision.valor, 'mantener'); writes++;
        return { ok: true, json: async () => ({}) };
      }
      if (options.headers.Accept === 'application/vnd.github.raw+json') return { ok: true, json: async () => structuredClone(record) };
      return { ok: true, json: async () => ({ sha: 'blob-sha', encoding, content: encoding === 'base64' ? G.b64EncodeUnicode(JSON.stringify(record)) : '' }) };
    }};
    vm.createContext(decisionContext);vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/decision.js'), 'utf8'),decisionContext);
    await decisionContext.window.JmrDecision.saveToResearchFile('https://api.test/', 'analisis/0.json', { valor: 'mantener' });
    assert.equal(writes, 1);
  }
  console.log('PASS: large reports, 39 records, authenticated/raw downloads, partial failure, directory failure, deletions and unsaved records.');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
