#!/usr/bin/env node
// Floyd R1-R6. Maintenance utility, NOT part of the Damodaran calculation engine.
// One stage per invocation to allow Sheet recalculation, review and SHA-256 evidence.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readSheet, sheetsRequest } from '../lib/model-sheet.js';
import { validateManifest, planStage, verifyApplied } from '../lib/floyd-transfer.js';

const flag=(name)=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
function halt(msg){console.error('FLOYD_SYNC_BLOQUEADO: '+msg);process.exitCode=1;}
const path=flag('--manifest'),stage=flag('--stage'),expected=flag('--expected-plan');
const apply=process.argv.includes('--apply');
if(!path||!stage){halt('usar --manifest docs/floyd-sync-manifests/<revision>.json --stage H_TO_D|H_TO_M|D_TO_M|RESULTS_TO_DB');}
else {
 try{
   // Prevent loading an arbitrary file or a manifest outside repository-controlled maintenance.
   const manifestPath=resolve(path),root=resolve('docs/floyd-sync-manifests');
   if(!manifestPath.startsWith(root+'/')||!manifestPath.endsWith('.json'))throw Error('ruta de manifiesto no aprobada');
   const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
   validateManifest(manifest);
   if(!manifestPath.endsWith('/'+manifest.revisionId+'.json'))throw Error('revisionId no coincide con archivo aprobado');
   const snapshots={};
   for(const [book,id] of Object.entries(manifest.books))snapshots[book]=await readSheet(id);
   const plan=planStage(manifest,snapshots,stage);
   const summary={revisionId:plan.revisionId,stage,mode:apply?'APPLY':'DRY_RUN',
     transferCount:plan.updates.length,planSha256:plan.signature,
     manifestSha256:plan.manifestSha256,sourceRevisions:plan.snapshotsSha256,
     transfers:plan.updates};
   if(!apply){console.log(JSON.stringify(summary,null,2));}
   else {
     if(process.env.FLOYD_SYNC_APPROVED!=='1')throw Error('falta aprobación explícita FLOYD_SYNC_APPROVED=1');
     if(!expected||expected!==plan.signature)throw Error('hash del plan no coincide con simulación --dry-run; no escribir');
     // No atomic guarantee across separate books. Verify *everything* before first batch.
     for(const u of plan.updates){
       const cell=snapshots[u.book].sheets[u.sheet]?.[u.cell];
       if(cell?.formula || cell?.raw?.formulaValue)throw Error('intento de modificar fórmula '+u.book+' '+u.sheet+'!'+u.cell);
     }
     const groups=new Map();
     for(const u of plan.updates){
       if(!groups.has(u.book))groups.set(u.book,[]);
       groups.get(u.book).push({range:"'"+u.sheet.replaceAll("'","''")+"'!"+u.cell,values:[[u.value]]});
     }
     const completed=[];
     for(const [book,data] of groups){
       const current=await readSheet(manifest.books[book]);
       if(current.revision!==snapshots[book].revision)throw Error('concurrencia detectada en '+book+'; transferencias ya aplicadas: '+completed.join(','));
       for(let i=0;i<data.length;i+=50){
         await sheetsRequest(manifest.books[book],'/values:batchUpdate',{method:'POST',
           body:JSON.stringify({valueInputOption:'RAW',data:data.slice(i,i+50)})});
       }
       completed.push(book);
     }
     const after={};
     for(const book of groups.keys())after[book]=await readSheet(manifest.books[book]);
     const verification=verifyApplied(plan,after);
     const receipt={...summary,mode:'VERIFIED',completed,verification};
     const reportPath=resolve('reports/floyd-sync',manifest.revisionId+'_'+stage+'.json');
     mkdirSync(dirname(reportPath),{recursive:true});
     writeFileSync(reportPath,JSON.stringify(receipt,null,2)+'\n','utf8');
     console.log(JSON.stringify(receipt,null,2));
   }
 }catch(e){halt(String(e.message||e));}
}
