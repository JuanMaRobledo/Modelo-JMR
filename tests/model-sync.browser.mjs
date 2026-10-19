// Local browser verification with deterministic Sheets responses; no production writes.
import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const chrome=process.env.JMR_TEST_CHROME;
const xlsx=process.env.JMR_TEST_XLSX;
if(!chrome||!xlsx)throw new Error('Set JMR_TEST_CHROME and JMR_TEST_XLSX to local Chromium and SheetJS paths.');
const n=(v,w)=>({v,w:w??String(v),raw:{numberValue:v},formula:null});
const str=v=>({v,w:v,raw:{stringValue:v},formula:null});
let growth=.12,writes=0;
function snapshot(ticker){
  const sheets={'Input sheet':{A26:str('Crecimiento de ingresos'),B26:n(growth,growth*100+'%'),D1:n(90),B35:n(.04),B31:n(10),B49:str('Yes'),B50:n(.2),B33:n(1)},'Valuation output':{},'Resumen de Valoración':{G3:str('Software'),G4:n(.3)},'Escenarios e historias':{H10:n(95),H11:n(100)},'Financials Multiples':{}};
  const vo=sheets['Valuation output'];Object.entries({B5:1000,B7:200,B8:.25,C8:.25,M8:.25,B34:10,B29:100,B27:50,C14:.1,M14:.08,M4:.03,C40:2,H40:1,B41:500,B9:150,C4:.1,D4:.1,C6:.2,C46:.2,C55:.05,D55:.05,C57:.18,C45:.18,C106:.15,D106:.15,C108:.22,C47:.22}).forEach(([a,v])=>vo[a]=n(v));
  const rv=sheets['Resumen de Valoración'];for(let r=6;r<=40;r++){if(![...Array(8).keys()].map(x=>x+6).includes(r)&&r<32)continue;for(const c of ['B','C','D','E'])rv[c+r]=n(c==='B'?1/6:100+r);}
  [100,80,1,120].forEach((v,i)=>sheets['Escenarios e historias']['H'+(i+5)]=n(v));
  return {record:{ticker,nombreActivo:ticker+' Test',hojaGoogle:'https://docs.google.com/spreadsheets/d/test/edit'},path:'valoraciones/'+ticker+'-1791720000000.json',sheets,revision:'revision-'+growth,fetchedAt:new Date().toISOString(),writable:true};
}
const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/api/model')){
    if(req.method==='PATCH'){let body='';req.on('data',b=>body+=b);req.on('end',()=>{const d=JSON.parse(body);if(d.revision!=='revision-'+growth){res.writeHead(409,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'La hoja cambió.'}));return;}growth=d.changes[0].value;writes++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(snapshot(new URL(req.url,'http://test').searchParams.get('ticker'))));});return;}
    const key=new URL(req.url,'http://test').searchParams.get('ticker');setTimeout(()=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(snapshot(key)));},key==='SLOW'?250:0);return;
  }
  const path=req.url.startsWith('/test-xlsx.js')?xlsx:new URL('../docs'+req.url.split('?')[0],import.meta.url).pathname;
  try{res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path));}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],env:{...process.env,LD_LIBRARY_PATH:chrome.replace(/\/[^/]+$/,'')}});
try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>{if(r.url().includes('xlsx.full.min.js'))r.respond({status:200,contentType:'application/javascript',body:fs.readFileSync(xlsx)});else if(r.url().startsWith(base))r.continue();else r.abort();});
  await page.evaluateOnNewDocument(()=>localStorage.setItem('jmr-auth-ok-v1','1'));
  await page.goto(base+'/calculadora.html?ticker=AAPL');
  await page.waitForSelector('#result.show');
  assert.equal(await page.$eval('#rTicker',e=>e.textContent),'AAPL');
  assert.equal(await page.$eval('#rPrecioMOS',e=>e.textContent),'$70.00');
  assert.equal(await page.$eval('#revenue0',e=>e.value),'1000');
  // Change through the shared input panel. Native write changes the fractional cell.
  await page.$eval('[data-sync-cell="B26"]',e=>{e.value='15';e.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>document.querySelector('[data-sync-cell="B26"]')?.value==='15'&&!document.querySelector('[data-sync-cell="B26"]')?.disabled);
  assert.equal(growth,.15);assert.equal(writes,1);
  // A delayed response for SLOW cannot replace the newly selected company.
  await page.$eval('#ticker',e=>{e.value='SLOW';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.click('#lookupBtn');
  await page.$eval('#ticker',e=>{e.value='MSFT';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.click('#lookupBtn');
  await page.waitForFunction(()=>document.querySelector('#rTicker').textContent==='MSFT');
  await new Promise(r=>setTimeout(r,350));assert.equal(await page.$eval('#rTicker',e=>e.textContent),'MSFT');
  // A direct source edit is picked up by refresh and by the shared report record mapping.
  growth=.18;await page.click('[data-sync-refresh]');
  await page.waitForFunction(()=>document.querySelector('[data-sync-cell="B26"]')?.value==='18');
  assert.equal(await page.evaluate(async()=>{const s=await JmrModelSync.load('MSFT');return JmrModelSync.record(s).precioMOS;}),70);
  // Mobile layout: the source editor stays in the page width.
  await page.setViewport({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  console.log('Browser passed: ticker, native DCF/MOS, % write, delayed response, direct sheet refresh, mobile width.');
}finally{await browser.close();server.close();}
