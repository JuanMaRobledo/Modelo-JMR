/* Catálogo reiniciado por solicitud del usuario: conservar credenciales y preferencias. */
(function(root){
'use strict';
var marker='jmr-catalog-reset-20261021-nflx-7168-v1';
try{
 if(root.localStorage.getItem(marker)==='done')return;
 ['jmr-research-library-v1','jmr-revision-multiplos-local-v1','jmr-ultima-hoja-google'].forEach(function(key){root.localStorage.removeItem(key);});
 root.localStorage.setItem(marker,'done');
}catch(error){console.warn('No fue posible vaciar el catálogo local anterior:',error);}
})(window);
