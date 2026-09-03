// Pantalla de acceso simple para uso personal — NO es seguridad real: como
// el sitio es 100% estático (GitHub Pages, sin servidor propio), cualquiera
// que abra "Ver código fuente" o las herramientas de desarrollador puede
// leer este archivo igual, logueado o no. Solo evita que alguien que abre
// el link por curiosidad vea u opere la app sin querer. Por eso la
// contraseña real no queda en texto plano acá (se compara su hash SHA-256),
// aunque eso tampoco la protege de alguien que de verdad se lo proponga.
(function () {
  var USER = "juan0804";
  var PASS_HASH = "a5abc1ea59fec33f3b13fa73dd732f49bb303c90916e1adee160ddb9516b49c6";
  var STORAGE_KEY = "jmr-auth-ok-v1";

  var authed = false;
  try { authed = localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) {}
  if (authed) return;

  // Oculta el resto de la página antes de que se pinte, para que no haya
  // ni un instante de contenido visible sin loguearse.
  document.write('<style id="jmrAuthHide">body>*:not(#jmrAuthGate){display:none!important}</style>');

  function sha256Hex(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
      var bytes = new Uint8Array(buf), hex = "";
      for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
      return hex;
    });
  }

  function mount() {
    var gate = document.createElement("div");
    gate.id = "jmrAuthGate";
    gate.innerHTML =
      '<style>' +
      '#jmrAuthGate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg,#F5F6F2);z-index:9999;padding:20px;font-family:"Public Sans",-apple-system,"Segoe UI",sans-serif;}' +
      '#jmrAuthGate .card{background:var(--surface,#fff);border:1px solid var(--border-soft,#E7EBE3);border-radius:14px;box-shadow:var(--shadow,0 8px 24px -12px rgba(0,0,0,.2));padding:28px 26px;width:100%;max-width:320px;}' +
      '#jmrAuthGate h2{font-family:"Fraunces",Georgia,serif;font-size:20px;margin:0 0 4px;color:var(--ink,#16231F);}' +
      '#jmrAuthGate p.sub{font-size:12.5px;color:var(--ink-faint,#8A968F);margin:0 0 18px;}' +
      '#jmrAuthGate input{width:100%;padding:10px 12px;margin-bottom:10px;border:1px solid var(--border,#DBE1D9);border-radius:8px;background:var(--surface,#fff);color:var(--ink,#16231F);font-size:14px;box-sizing:border-box;}' +
      '#jmrAuthGate input:focus{outline:2px solid var(--focus,#3B7CE0);outline-offset:1px;}' +
      '#jmrAuthGate button{width:100%;padding:10px 12px;border:none;border-radius:8px;background:var(--accent,#A6791F);color:var(--accent-ink,#5C4212);font-weight:700;font-size:14px;cursor:pointer;}' +
      '#jmrAuthGate button:hover{filter:brightness(1.05);}' +
      '#jmrAuthGate .err{color:var(--negative,#B0452F);font-size:12.5px;margin:10px 0 0;}' +
      '</style>' +
      '<div class="card">' +
      '<h2>Acceso</h2>' +
      '<p class="sub">Ingresá para entrar al Modelo JMR.</p>' +
      '<input id="jmrAuthUser" type="text" placeholder="Usuario" autocomplete="username">' +
      '<input id="jmrAuthPass" type="password" placeholder="Contraseña" autocomplete="current-password">' +
      '<button id="jmrAuthBtn" type="button">Entrar</button>' +
      '<p class="err" id="jmrAuthErr" hidden>Usuario o contraseña incorrectos.</p>' +
      '</div>';
    document.body.appendChild(gate);

    function tryLogin() {
      var u = (document.getElementById("jmrAuthUser").value || "").trim();
      var p = document.getElementById("jmrAuthPass").value || "";
      sha256Hex(p).then(function (hash) {
        if (u === USER && hash === PASS_HASH) {
          try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) {}
          var style = document.getElementById("jmrAuthHide");
          if (style) style.remove();
          gate.remove();
        } else {
          document.getElementById("jmrAuthErr").hidden = false;
        }
      });
    }
    document.getElementById("jmrAuthBtn").addEventListener("click", tryLogin);
    gate.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); tryLogin(); } });
    document.getElementById("jmrAuthUser").focus();
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
