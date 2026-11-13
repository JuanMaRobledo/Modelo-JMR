// Cuaderno local de auditoría: conserva observaciones y prepara un paquete reproducible.
// No envía notas a GitHub ni aprueba, recalcula o publica valoraciones.
const VERSION='jmr-v2-auditoria-local-1';
const validTicker=t=>/^[A-Z0-9.-]{1,18}$/.test(t||'');
const key=t=>'jmr-v2-auditoria:'+t;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function storageGet(ticker){
  try{
    const data=JSON.parse(localStorage.getItem(key(ticker))||'null');
    if(data?.schemaVersion===VERSION && data.ticker===ticker && Array.isArray(data.entries)){
      return {schemaVersion:VERSION,ticker,entries:data.entries.slice(0,1000)};
    }
  }catch{}
  return {schemaVersion:VERSION,ticker,entries:[]};
}
function storageSet(data){
  localStorage.setItem(key(data.ticker),JSON.stringify(data));
}
function downloadJson(name,object){
  const blob=new Blob([JSON.stringify(object,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function now(){return new Date().toISOString();}
export function montarCuadernoAuditoria(model,root){
  if(!root||!validTicker(model?.ticker))return;
  const ticker=model.ticker;
  const sourceSha=model.libro?.sha256||null;
  let data=storageGet(ticker);
  root.innerHTML=[
    '<div class="sectionhead"><div><div class="eyebrow muted">CUADERNO DE AUDITORÍA</div><h3>Mis observaciones y solicitudes de revisión</h3></div></div>',
    '<p class="panel-hint">Las notas se guardan <strong>solo en este navegador</strong>. No cambian la valoración, no implican aprobación y no se suben a un repositorio público. Exporta un respaldo para conservarlas o revisarlas con otro LLM.</p>',
    '<form id="auditEntryForm" class="v2-audit-form">',
    '<label>Escenario <select name="scenario"><option value="general">General</option><option value="conservador">Conservador</option><option value="base">Base</option><option value="optimista">Optimista</option></select></label>',
    '<label>Supuesto o apartado <input name="field" maxlength="140" placeholder="Ej.: salesToCapital1to5, crecimiento, CAPEX"></label>',
    '<label>Nuevo valor propuesto (opcional) <input name="proposed" maxlength="100" placeholder="Ej.: 0,35 o 12 %"></label>',
    '<label class="v2-audit-wide">Observación, justificación o instrucción <textarea name="note" required maxlength="5000" rows="4" placeholder="Qué revisar, por qué y qué evidencia usar"></textarea></label>',
    '<button type="submit">Guardar observación</button></form>',
    '<p id="auditLocalStatus" class="panel-hint" role="status" aria-live="polite"></p>',
    '<div class="v2-audit-actions"><button type="button" id="auditExport" class="secondary">Exportar notas JSON</button>',
    '<button type="button" id="auditImport" class="secondary">Importar notas</button>',
    '<input type="file" id="auditImportFile" accept=".json,application/json" hidden>',
    '<button type="button" id="auditRequest" class="secondary">Preparar solicitud de nueva valoración</button></div>',
    '<p class="panel-hint">La solicitud genera un paquete JSON con historial, supuestos, cifras y observaciones. Para ejecutar el recálculo, adjúntalo a ChatGPT, Claude o Gemini; esta versión todavía no envía una orden automática al motor.</p>',
    '<h4>Historial de observaciones</h4><div id="auditEntries" class="v2-audit-entries"></div>'
  ].join('');
  const $=id=>root.querySelector('#'+id);
  const status=(s)=>{$('auditLocalStatus').textContent=s;};
  const draw=()=>{
    const box=$('auditEntries');box.replaceChildren();
    if(!data.entries.length){box.innerHTML='<p class="muted">No hay observaciones guardadas en este navegador.</p>';return;}
    for(const note of data.entries.slice().reverse()){
      const article=document.createElement('article');article.className='v2-audit-entry';
      const heading=document.createElement('p');const time=Number.isFinite(Date.parse(note.at))?new Date(note.at).toLocaleString('es-CO'):String(note.at||'');
      heading.textContent=(note.scenario||'general')+' · '+(note.field||'Sin campo específico')+' · '+time;
      const body=document.createElement('p');body.textContent=note.note||'';
      article.append(heading,body);
      if(note.proposed){const value=document.createElement('p');value.textContent='Cambio propuesto: '+note.proposed;article.append(value);}
      if(note.revisionSha256){const ref=document.createElement('small');ref.textContent='Revisión del libro: '+note.revisionSha256.slice(0,16)+'…';article.append(ref);}
      const close=document.createElement('button');close.type='button';close.className='secondary v2-audit-close';
      close.textContent=note.closedAt?'Resuelta':'Marcar resuelta';
      close.disabled=!!note.closedAt;
      close.addEventListener('click',()=>{
        note.closedAt=now();
        try{storageSet(data);draw();status('Observación resuelta; se conserva en el historial.');}
        catch{note.closedAt=null;status('No fue posible guardar el cambio. Exporta las notas.');}
      });
      article.append(close);box.append(article);
    }
  };
  $('auditEntryForm').addEventListener('submit',event=>{
    event.preventDefault();
    const f=new FormData(event.currentTarget);
    const note=String(f.get('note')||'').trim(),field=String(f.get('field')||'').trim(),proposed=String(f.get('proposed')||'').trim(),scenario=String(f.get('scenario')||'general');
    if(!note){status('Escribe una observación antes de guardar.');return;}
    const entry={id:(globalThis.crypto?.randomUUID?.()||String(Date.now())),at:now(),revisionSha256:sourceSha,scenario,field,proposed,note,closedAt:null};
    data.entries.push(entry);
    try{storageSet(data);event.currentTarget.reset();draw();status('Observación guardada en este navegador.');}
    catch{data.entries.pop();status('No fue posible guardar localmente. Verifica el almacenamiento del navegador.');}
  });
  $('auditExport').addEventListener('click',()=>{downloadJson(ticker+'-auditoria-'+new Date().toISOString().slice(0,10)+'.json',data);status('Respaldo JSON preparado.');});
  $('auditImport').addEventListener('click',()=>$('auditImportFile').click());
  $('auditImportFile').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>1_000_000)throw Error('Archivo demasiado grande.');
      const other=JSON.parse(await file.text());
      if(other.schemaVersion!==VERSION||other.ticker!==ticker||!Array.isArray(other.entries))throw Error('El archivo no pertenece al cuaderno de '+ticker+'.');
      const seen=new Set(data.entries.map(e=>e.id));
      const incoming=other.entries.filter(e=>e&&typeof e.id==='string'&&typeof e.note==='string'&&e.note.length<=5000&&!seen.has(e.id));
      data.entries.push(...incoming);storageSet(data);draw();status('Importadas '+incoming.length+' observaciones nuevas.');
    }catch(err){status('Error al importar: '+err.message);}
    event.target.value='';
  });
  $('auditRequest').addEventListener('click',()=>{
    const packet={
      schemaVersion:'jmr-v2-solicitud-revaloracion-1',createdAt:now(),company:model.company,ticker,
      source:{asOf:model.asOf,revisionSha256:sourceSha,estado:model.estado,profile:model.profile,units:model.units},
      financials:model.financials,history:model.history,assumptions:model.assumptions,
      justificaciones:model.justificaciones,libroReferencia:{sha256:sourceSha,valores:model.libro?.valores},
      auditEntries:data.entries,
      instruction:'Revalorar JMR V2 con plantilla Damodaran apropiada, verificar fuentes primarias y aplicar solamente cambios de auditoría pendientes validados. Recalcular escenarios conservador, base y optimista, sensibilidades y MOS 35 %, actualizar las justificaciones y el análisis fundamental, conservar la versión anterior y no marcar APROBADA sin consentimiento expreso. No asumir que valores propuestos sin validar son cifras oficiales.'
    };
    downloadJson(ticker+'-solicitud-revaloracion-'+new Date().toISOString().slice(0,10)+'.json',packet);
    status('Solicitud preparada como JSON. Adjunta este archivo a tu conversación para iniciar el análisis; no se ha recalculado ni publicado ningún valor.');
  });
  draw();
}
