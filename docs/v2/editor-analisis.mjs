// Editor visual integrado de análisis fundamental JMR V2.
// Los borradores compartidos se escriben SOLO en una rama editorial de GitHub.
// El SSO da acceso de lectura; para guardar remotamente se exige OAuth de GitHub.
export const SECCIONES_ANALISIS_V2 = [
  ['business','Negocio y modelo económico'],
  ['moat','Ventaja competitiva'],
  ['story','Historias → números'],
  ['risks','Riesgos y contraevidencia'],
  ['conclusion','Conclusión fundamental'],
];
const REPO='JuanMaRobledo/Modelo-JMR';
const RAMA='v2/analisis-borradores';
const IMAGE_MAX=700000;
const SAFE_TAGS=new Set(['p','div','br','strong','b','em','i','u','h3','h4','ul','ol','li','blockquote','a','figure','figcaption','img']);
const DROP_TAGS=new Set(['script','style','svg','iframe','object','embed','form','input','video','audio','template','math']);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rawPrefix='https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR/';
function validImage(src){
  if(/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src))return src.length<1000000;
  try{
    const u=new URL(src);
    return u.protocol==='https:'&&u.origin==='https://raw.githubusercontent.com'&&u.pathname.startsWith('/JuanMaRobledo/Modelo-JMR/');
  }catch{return false;}
}
function cleanHtml(html){
 const parsed=document.createElement('template');parsed.innerHTML=String(html||'');
 const output=document.createElement('div');
 const walk=(node,container)=>{
  if(node.nodeType===Node.TEXT_NODE){container.appendChild(document.createTextNode(node.nodeValue||''));return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const tag=node.tagName.toLowerCase();
  if(DROP_TAGS.has(tag))return;
  if(!SAFE_TAGS.has(tag)){for(const ch of [...node.childNodes])walk(ch,container);return;}
  if(tag==='img'){
   const src=node.getAttribute('src')||'';
   if(!validImage(src))return;
   const img=document.createElement('img');img.src=src;img.alt=(node.getAttribute('alt')||'Imagen de análisis').slice(0,180);
   img.loading='lazy';container.appendChild(img);return;
  }
  const item=document.createElement(tag);
  if(tag==='a'){
   const url=node.getAttribute('href')||'';
   try{const u=new URL(url);if(u.protocol==='https:'){item.setAttribute('href',u.href);item.setAttribute('target','_blank');item.setAttribute('rel','noopener noreferrer');}}catch{}
  }
  for(const ch of [...node.childNodes])walk(ch,item);
  container.appendChild(item);
 };
 for(const child of [...parsed.content.childNodes])walk(child,output);
 return output.innerHTML;
}
function normalizar(model, document){
 const blocks={};
 for(const [key] of SECCIONES_ANALISIS_V2){
  const rich=document?.blocks?.[key];
  blocks[key]=cleanHtml(typeof rich==='string'?rich:'<p>'+esc(model.analysis?.[key]||'Pendiente de análisis')+'</p>');
 }
 return {schemaVersion:'jmr-v2-analisis-1',ticker:model.ticker,blocks};
}
async function getOfficial(ticker){
 try{
  const resp=await fetch('./v2/analisis/'+encodeURIComponent(ticker)+'.json',{cache:'no-store'});
  if(!resp.ok)return null;
  const data=await resp.json();
  return data.ticker===ticker&&data.schemaVersion==='jmr-v2-analisis-1'?data:null;
 }catch{return null;}
}
function githubToken(){return globalThis.GhOAuth?.getGhToken?.()||'';}
async function github(path,options={}){
 const token=githubToken();if(!token)throw new Error('Conecta tu cuenta de GitHub para guardar los cambios en el repositorio.');
 const r=await fetch('https://api.github.com/repos/'+REPO+'/'+path,{
  ...options,
  headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers},
  cache:'no-store'
 });
 if(r.status===404&&options.allowNotFound)return null;
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.message||('GitHub HTTP '+r.status));
 return data;
}
async function asegurarRama(){
 const ref=await github('git/ref/heads/'+RAMA,{allowNotFound:true});
 if(ref)return;
 const main=await github('git/ref/heads/main');
 try{await github('git/refs',{method:'POST',body:JSON.stringify({ref:'refs/heads/'+RAMA,sha:main.object.sha})});}
 catch(err){if(!String(err).includes('Reference already exists'))throw err;}
}
const rutaAnalisis=ticker=>'docs/v2/analisis/'+ticker+'.json';
async function getBorrador(ticker){
 const info=await github('contents/'+rutaAnalisis(ticker)+'?ref='+encodeURIComponent(RAMA),{allowNotFound:true});
 if(!info)return {data:null,sha:null};
 const raw=info.content?.replace(/\s/g,'')||'';
 const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
 const data=JSON.parse(new TextDecoder().decode(bytes));
 return {data,sha:info.sha};
}
function encodeUtf8(text){
 const bytes=new TextEncoder().encode(text);
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));
 return btoa(binary);
}
async function guardarArchivo(path,content,sha,message){
 return github('contents/'+path,{method:'PUT',body:JSON.stringify({message,content,branch:RAMA,...(sha?{sha}:{})})});
}
async function subirImagenes(blocks,ticker){
 for(const key of Object.keys(blocks)){
  const host=document.createElement('div');host.innerHTML=cleanHtml(blocks[key]);
  for(const img of [...host.querySelectorAll('img[src^="data:image/"]')]){
   const [header,base64]=img.src.split(',');
   const ext=header.includes('png')?'png':header.includes('webp')?'webp':'jpg';
   const nombre=crypto.randomUUID()+'.'+ext;
   const path='docs/v2/imagenes/'+ticker+'/'+nombre;
   if(base64.length>950000)throw new Error('Una imagen supera el límite permitido para el borrador.');
   await guardarArchivo(path,base64,null,'docs(v2): imagen editorial '+ticker);
   img.src=rawPrefix+RAMA+'/'+path;
  }
  blocks[key]=cleanHtml(host.innerHTML);
 }
}
export async function montarEditorAnalisis(model,root){
 const ticker=String(model.ticker||'').toUpperCase();
 const keyLocal='jmr-v2-analisis-local-'+ticker;
 let official=normalizar(model,await getOfficial(ticker));
 let saved=official,editando=false;
 // Se lee el borrador local, sin confundirlo con un cambio publicado.
 try{const local=JSON.parse(localStorage.getItem(keyLocal)||'null');if(local?.ticker===ticker)saved=normalizar(model,local);}catch{}
 root.innerHTML='<div class="v2-editor-bar">'+
 '<span id="editorOrigin" class="note"></span>'+
 '<button id="analysisEdit" type="button" class="secondary">Editar análisis</button>'+
 '<button id="analysisConnect" type="button" class="secondary" hidden>Conectar GitHub</button>'+
 '<button id="analysisBold" type="button" class="secondary" hidden title="Negrita">Negrita</button>'+
 '<button id="analysisItalic" type="button" class="secondary" hidden title="Cursiva">Cursiva</button>'+
 '<button id="analysisBullet" type="button" class="secondary" hidden title="Lista">Lista</button>'+
 '<label class="filebutton" id="analysisImageLabel" hidden>Insertar imagen<input id="analysisImage" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>'+
 '<button id="analysisSaveLocal" type="button" class="secondary" hidden>Guardar en este navegador</button>'+
 '<button id="analysisSaveGitHub" type="button" hidden>Guardar borrador en GitHub</button>'+
 '<button id="analysisExport" type="button" class="secondary" hidden>Exportar JSON</button>'+
 '<button id="analysisCancel" type="button" class="secondary" hidden>Cancelar</button>'+
 '</div><p id="editorStatus" class="v2-editor-note" role="status" aria-live="polite"></p>'+
 '<div id="analysisSections" class="analysis-grid"></div>';
 const $=id=>root.querySelector('#'+id);
 const sections=$('analysisSections');
 function obtener(){
  const blocks={};
  for(const [name] of SECCIONES_ANALISIS_V2){blocks[name]=cleanHtml(sections.querySelector('[data-editor-section="'+name+'"]').innerHTML);}
  return {schemaVersion:'jmr-v2-analisis-1',ticker,blocks,updatedAt:new Date().toISOString()};
 }
 function dibujar(doc){
  sections.replaceChildren();
  for(const [name,label] of SECCIONES_ANALISIS_V2){
   const card=document.createElement('section');card.className='analysis-block';
   const title=document.createElement('h4');title.textContent=label;card.append(title);
   const body=document.createElement('div');
   body.className='v2-rich-editor';body.dataset.editorSection=name;
   body.innerHTML=cleanHtml(doc.blocks[name]);
   body.contentEditable=editando?'true':'false';
   body.setAttribute('aria-label',label);card.append(body);sections.append(card);
  }
  $('analysisEdit').textContent=editando?'Terminar edición':'Editar análisis';
  $('editorOrigin').textContent=saved===official?'Análisis publicado · lectura':'Borrador local o de edición · sin publicar';
  for(const id of ['analysisBold','analysisItalic','analysisBullet','analysisImageLabel','analysisSaveLocal','analysisSaveGitHub','analysisExport','analysisCancel'])$(id).hidden=!editando;
  $('analysisConnect').hidden=!editando||!!githubToken();
 }
 function notice(message,isError=false){$('editorStatus').textContent=message;$('editorStatus').dataset.level=isError?'error':'info';}
 function active(){return document.activeElement?.closest?.('[data-editor-section]')||sections.querySelector('[data-editor-section]');}
 function command(cmd){const el=active();if(!el||!editando)return;el.focus();document.execCommand(cmd,false,null);}
 $('analysisEdit').addEventListener('click',async()=>{
  if(editando){saved=obtener();editando=false;dibujar(saved);notice('Cambios en pantalla: usa Guardar antes de cerrar para conservarlos.');return;}
  if(githubToken()){
   try{const {data}=await getBorrador(ticker);if(data?.ticker===ticker){saved=normalizar(model,data);notice('Borrador persistente cargado desde GitHub.');}}
   catch(err){notice('No se pudo leer el borrador de GitHub: '+err.message,true);}
  }
  editando=true;dibujar(saved);
  notice('Edición integrada en esta ficha. Los cambios quedan como borrador, sin alterar DCF ni publicar automáticamente. Las imágenes guardadas en el repositorio público no deben contener información privada.');
 });
 $('analysisBold').addEventListener('click',()=>command('bold'));
 $('analysisItalic').addEventListener('click',()=>command('italic'));
 $('analysisBullet').addEventListener('click',()=>command('insertUnorderedList'));
 sections.addEventListener('paste',e=>{
  if(!editando)return;
  e.preventDefault();
  document.execCommand('insertText',false,e.clipboardData.getData('text/plain').slice(0,100000));
 });
 sections.addEventListener('drop',e=>{if(editando)e.preventDefault();});
 $('analysisImage').addEventListener('change',async e=>{
  const f=e.target.files?.[0];e.target.value='';if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>IMAGE_MAX){notice('Imagen no válida. Usa PNG, JPEG o WebP de menos de 700 KB.',true);return;}
  const target=active();if(!target)return;
  const reader=new FileReader();
  reader.onload=()=>{
   const img=document.createElement('img');img.src=String(reader.result);img.alt=f.name.slice(0,180);
   const figure=document.createElement('figure');figure.append(img);
   const caption=document.createElement('figcaption');caption.textContent=f.name;figure.append(caption);
   target.append(figure);notice('Imagen insertada. Guarda el borrador para conservarla.');
  };
  reader.readAsDataURL(f);
 });
 $('analysisSaveLocal').addEventListener('click',()=>{
  try{const d=obtener();localStorage.setItem(keyLocal,JSON.stringify(d));saved=d;notice('Borrador guardado únicamente en este navegador. No se publicó en la app.');}
  catch{notice('No se pudo guardar localmente: espacio insuficiente. Usa Exportar JSON.',true);}
 });
 $('analysisSaveGitHub').addEventListener('click',async()=>{
  if(!githubToken()){notice('Conecta GitHub primero. El acceso SSO no autoriza escrituras en el repositorio.',true);return;}
  $('analysisSaveGitHub').disabled=true;notice('Guardando en rama editorial; producción no se modificará.');
  try{
   const doc=obtener();
   await asegurarRama();
   const {sha}=await getBorrador(ticker);
   await subirImagenes(doc.blocks,ticker);
   await guardarArchivo(rutaAnalisis(ticker),encodeUtf8(JSON.stringify(doc,null,2)+'\n'),sha,'docs(v2): borrador de análisis '+ticker);
   saved=normalizar(model,doc);try{localStorage.removeItem(keyLocal);}catch{}
   notice('Borrador e imágenes guardados en la rama '+RAMA+'. Pendiente de revisión: NO publicado ni auditado.');
   dibujar(saved);
  }catch(err){notice('No se pudo guardar en GitHub: '+err.message,true);}
  finally{$('analysisSaveGitHub').disabled=false;}
 });
 $('analysisExport').addEventListener('click',()=>{
  const obj=obtener();const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=ticker+'-analisis-V2-borrador.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 });
 $('analysisCancel').addEventListener('click',()=>{editando=false;dibujar(saved);notice('Edición cancelada. No se ha publicado ningún cambio.');});
 $('analysisConnect').addEventListener('click',()=>globalThis.GhOAuth?.startLogin?.());
 dibujar(saved);
 return root;
}
