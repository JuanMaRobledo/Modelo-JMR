/* Entrada contextual a la auditoría integral: una sola vista por ticker.
   La pantalla integral muestra por separado controles DCF, informe económico y múltiplos;
   nunca presume que la existencia de un enlace equivale a certificación. */
(function(root){
"use strict";
function mount(container,ticker){
 if(!container)return;
 var key=String(ticker||"").trim().toUpperCase();
 container.textContent="";
 container.setAttribute("data-audit-ticker",key);
 if(!/^[A-Z][A-Z0-9.]{0,11}$/.test(key))return;
 var a=document.createElement("a");
 a.className="jmr-audit-context-link";
 a.textContent="Ver auditoría integral ↗";
 a.href="auditoria-integral.html?ticker="+encodeURIComponent(key);
 var note=document.createElement("span");
 note.className="jmr-audit-context-note";
 note.textContent="DCF / método principal · Supuestos · Múltiplos · Evidencia y salvedades";
 container.appendChild(a);container.appendChild(note);
}
root.JmrAuditLinks={mount:mount,normalize:function(x){return String(x||"").trim().toUpperCase();}};
})(window);
