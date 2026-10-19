import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { generateKeyPairSync } from 'node:crypto';
import { unpackSheets, revision, validateChanges, tickerKey } from '../lib/model-sheet.js';
import handler from '../api/model.js';
import { createSession } from '../sso-session.js';

const numeric = value => ({v:value,w:String(value),raw:{numberValue:value},formula:null});
const source = () => ({'Input sheet':{A26:{v:'Crecimiento'},B26:numeric(.12),B27:{v:.25,w:'25%',formula:'=B26*2',raw:{formulaValue:'=B26*2'}}}, 'Valuation output':{B5:numeric(100)}});
test('normalizes tickers and rejects paths/URLs',()=>{
  assert.equal(tickerKey(' aapl '),'AAPL');
  for(const key of ['../x','https://foo','', 'A'.repeat(25)])assert.throws(()=>tickerKey(key));
});
test('unpacks sparse Sheets grid with precision, formulas, zero and offsets',()=>{
  const result=unpackSheets({sheets:[{properties:{title:'Input sheet'},data:[{startRow:25,startColumn:1,rowData:[{values:[{userEnteredValue:{numberValue:.123456789},effectiveValue:{numberValue:.123456789},formattedValue:'12.35%'},{userEnteredValue:{formulaValue:'=0'},effectiveValue:{numberValue:0},formattedValue:'0'}]}]}]}]});
  assert.equal(result['Input sheet'].B26.v,.123456789);assert.equal(result['Input sheet'].C26.v,0);assert.equal(result['Input sheet'].C26.formula,'=0');
});
test('revision tracks inputs but ignores volatile effective recalculations',()=>{
  const a=source(),b=structuredClone(a);b['Input sheet'].B27.v=999;
  assert.equal(revision(a),revision(b));b['Input sheet'].B26.raw.numberValue=.13;assert.notEqual(revision(a),revision(b));
});
test('allows only finite numeric literal inputs and preserves formulas',()=>{
  const sheets=source(),change={sheet:'Input sheet',cell:'B26',previous:.12,value:.13};
  assert.deepEqual(validateChanges(sheets,[change]),[{range:"'Input sheet'!B26",values:[[.13]]}]);
  for(const bad of [{cell:'B27'},{cell:'A26'},{sheet:'Valuation output',cell:'B5'},{value:'=1'},{value:null},{value:Infinity},{cell:'B999'},{previous:.1}])assert.throws(()=>validateChanges(sheets,[{...change,...bad}]));
  assert.throws(()=>validateChanges(sheets,[change,change]));
});
function browserApi(){const context={console,AbortSignal,setTimeout,clearTimeout};context.globalThis=context;vm.runInNewContext(fs.readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8'),context);return context.JmrModelSync;}
test('native report and calculator share the same DCF base, exclude disruption from the mean',()=>{
  const api=browserApi(),sheets=source();sheets['Resumen de Valoración']={G4:numeric(.3),D36:numeric(7),D32:numeric(10)};
  sheets['Escenarios e historias']={H10:numeric(9),H11:numeric(10)};
  [10,6,-100,14].forEach((v,i)=>sheets['Escenarios e historias']['H'+(i+5)]=numeric(v));
  // Stub sheet serializer; numerical mappings are tested independent of presentation.
  const context={console,AbortSignal,setTimeout,clearTimeout,XLSX:{utils:{decode_cell:()=>({r:0,c:0}),encode_range:()=> 'A1',sheet_to_html:()=>'<table></table>'}}};context.globalThis=context;vm.runInNewContext(fs.readFileSync(new URL('../docs/model-sync.js',import.meta.url),'utf8'),context);
  const rec=context.JmrModelSync.record({record:{ticker:'AAPL',multiplosImplicitosDCF:{stale:1}},sheets,fetchedAt:'2026-10-19'});
  assert.equal(rec.valorEsperado.valor,10);assert.equal(rec.valorEsperado.dcfBase,10);assert.equal(rec.precioMOS,7);assert.equal(rec.multiplosImplicitosDCF,null);
  assert.equal(context.JmrModelSync.calculatorResult(rec).precioConMOS.base,7);assert.equal(api.ticker(' msft '),'MSFT');
});
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},end(){return this;}};}
test('API requires a signed app session before contacting a source', async()=>{
  const res=response();await handler({method:'GET',query:{ticker:'AAPL'},headers:{}},res);assert.equal(res.statusCode,401);
});
test('API rejects a cross-origin write even with a valid session',async()=>{
  process.env.APP_PASSWORD='test-only';const res=response();
  await handler({method:'PATCH',query:{ticker:'AAPL'},headers:{cookie:'jmr_sso_session='+createSession(),origin:'https://evil.example',host:'app.example','content-type':'application/json'}},res);
  assert.equal(res.statusCode,403);delete process.env.APP_PASSWORD;
});
test('API resolves the correct company, writes RAW inputs, rejects a stale revision',async()=>{
  const oldFetch=global.fetch;process.env.APP_PASSWORD='test-only';
  const pair=generateKeyPairSync('rsa',{modulusLength:2048});
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT=JSON.stringify({client_email:'test@example.invalid',private_key:pair.privateKey.export({format:'pem',type:'pkcs8'})});
  let value=.12,writes=0;
  global.fetch=async(url,options={})=>{
    let body;
    if(url.includes('/contents/valoraciones'))body=[{type:'file',name:'AAPL-1791720000000.json',path:'valoraciones/AAPL-1791720000000.json'},{type:'file',name:'MSFT-9999999999999.json',path:'valoraciones/MSFT-9999999999999.json'}];
    else if(url.includes('raw.githubusercontent'))body={ticker:'AAPL',hojaGoogle:'https://docs.google.com/spreadsheets/d/sheet-test/edit'};
    else if(url.includes('oauth2.googleapis'))body={access_token:'test-google-token',expires_in:3600};
    else if(url.includes('values:batchUpdate')){body=JSON.parse(options.body);assert.equal(body.valueInputOption,'RAW');assert.equal(body.data[0].range,"'Input sheet'!B26");value=body.data[0].values[0][0];writes++;body={updatedCells:1};}
    else if(url.includes('sheets.googleapis')){assert.ok(decodeURIComponent(url).includes('fields=sheets(properties(title),data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,formattedValue))))'));body={sheets:[{properties:{title:'Input sheet'},data:[{startRow:25,startColumn:1,rowData:[{values:[{userEnteredValue:{numberValue:value},effectiveValue:{numberValue:value},formattedValue:'12%'}]}]}]}]};}
    else throw new Error('Unexpected URL '+url);
    return {ok:true,json:async()=>body};
  };
  try{
    const headers={cookie:'jmr_sso_session='+createSession(),origin:'https://app.example',host:'app.example','content-type':'application/json'};
    let res=response();await handler({method:'GET',query:{ticker:'aapl'},headers},res);assert.equal(res.statusCode,200);const version=res.body.revision;assert.equal(res.body.record.ticker,'AAPL');assert.equal(JSON.stringify(res.body).includes('test-google-token'),false);
    res=response();await handler({method:'PATCH',query:{ticker:'AAPL'},headers,body:{revision:version,changes:[{sheet:'Input sheet',cell:'B26',previous:.12,value:.13}]}},res);assert.equal(res.statusCode,200);assert.equal(writes,1);assert.equal(res.body.sheets['Input sheet'].B26.v,.13);
    res=response();await handler({method:'PATCH',query:{ticker:'AAPL'},headers,body:{revision:version,changes:[{sheet:'Input sheet',cell:'B26',previous:.12,value:.99}]}},res);assert.equal(res.statusCode,409);assert.equal(writes,1);
  }finally{global.fetch=oldFetch;delete process.env.APP_PASSWORD;delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT;}
});
