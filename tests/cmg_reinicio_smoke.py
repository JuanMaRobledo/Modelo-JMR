#!/usr/bin/env python3
"""CMG: prueba local de la revisión, sin escribir en GitHub ni modificar la app.
Requiere repos hermanos, catálogo CMG preparado y playwright instalado.
Uso: python3 tests/cmg_reinicio_smoke.py
No sustituye los controles contables ni una auditoría económica.
"""
import functools
import json
import os
from pathlib import Path
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT.parent / "Modelo-JMR-datos"
REVISION = "CMG-2026-10-28-R1-REINICIO"
BASE = 24.93692709950013

def main():
    catalog = json.loads((DATA / "catalogo.json").read_text())
    valuation_paths = [p for p in catalog["valoraciones"] if Path(p).name.startswith("CMG-")]
    analysis_paths = [p for p in catalog["analisis"] if Path(p).name.startswith("CMG-")]
    if len(valuation_paths) != 1 or len(analysis_paths) != 1:
        raise SystemExit("CMG no tiene una valoración y análisis activos únicos: completar exportación/catálogo primero")
    record = json.loads((DATA / valuation_paths[0]).read_text())
    assert record["revisionId"] == REVISION
    assert record["publicationStatus"] == "EN_REVISION"
    assert record["validationStatus"] == "PENDIENTE_AUDITORIA_ECONOMICA"
    assert abs(record["valorPrincipal"] - BASE) < 1e-6
    analysis = json.loads((DATA / analysis_paths[0]).read_text())
    assert analysis["revisionId"] == REVISION
    assert analysis["analysisSchema"] == "jmr-analysis-two-levels-v5-completeness"
    assert analysis["articleHtml"] and analysis["calculationHtml"]
    assert not (record.get("auditoria") or {}).get("aprobada"), "No autocertificar auditoría"

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT / "docs")))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = "http://127.0.0.1:" + str(server.server_port)
    evidence = DATA / "evidencia" / REVISION / "playwright"
    evidence.mkdir(parents=True, exist_ok=True)
    errors = []
    checks = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
            try:
                context = browser.new_context()
                context.add_init_script("""
                    if (location.hostname === '127.0.0.1') {
                        localStorage.setItem('jmr-auth-ok-v1', '1');
                    }
                """)
                context.on("page", lambda page: page.on("pageerror", lambda error: errors.append(str(error))))

                def raw(route):
                    from urllib.parse import urlsplit, unquote
                    request = route.request
                    if request.method != "GET":
                        route.abort()
                        raise AssertionError("Intento de escritura externa: " + request.method)
                    prefix = "/JuanMaRobledo/Modelo-JMR-datos/main/"
                    path = unquote(urlsplit(request.url).path)
                    assert path.startswith(prefix), path
                    target = (DATA / path[len(prefix):]).resolve()
                    assert target.is_relative_to(DATA.resolve())
                    if not target.is_file():
                        route.fulfill(status=404, body="Archivo local ausente")
                        return
                    route.fulfill(status=200, path=str(target))

                def api(route):
                    from urllib.parse import urlsplit, unquote
                    request = route.request
                    if request.method != "GET":
                        route.abort()
                        raise AssertionError("Intento de escritura GitHub bloqueado")
                    prefix = "/repos/JuanMaRobledo/Modelo-JMR-datos/contents/"
                    path = unquote(urlsplit(request.url).path)
                    assert path.startswith(prefix)
                    relative = path[len(prefix):]
                    target = (DATA / relative).resolve()
                    assert target.is_relative_to(DATA.resolve())
                    if target.is_dir():
                        payload = [{"name": p.name, "path": str(p.relative_to(DATA)), "type": "dir" if p.is_dir() else "file"}
                                   for p in target.iterdir()]
                    elif target.is_file():
                        import base64
                        payload = {"content": base64.b64encode(target.read_bytes()).decode(), "encoding": "base64"}
                    else:
                        route.fulfill(status=404, body="{}")
                        return
                    route.fulfill(status=200, content_type="application/json", body=json.dumps(payload))

                context.route("https://raw.githubusercontent.com/JuanMaRobledo/Modelo-JMR-datos/main/**", raw)
                context.route("https://api.github.com/repos/JuanMaRobledo/Modelo-JMR-datos/contents/**", api)
                page = context.new_page()
                page.goto(origin + "/expediente.html?ticker=CMG")
                page.locator("#dossier").wait_for(state="visible")
                assert page.locator('[data-view="valoracion"]').get_attribute("aria-selected") == "true"
                frame = page.frame_locator("#viewFrame")
                frame.get_by_text("Valor intrínseco principal", exact=False).first.wait_for()
                assert "24,94" in frame.locator("body").inner_text() or "24.94" in frame.locator("body").inner_text()
                checks.append("Expediente inicia en DCF Base")
                precio_corte = frame.locator('#rPrecioAnalisis').inner_text(timeout=10000)
                assert '31.95' in precio_corte or '31,95' in precio_corte, ('Precio del corte mal mostrado', precio_corte)
                checks.append('Precio fechado 30-sep-2026 = USD 31,95, separado de cotización reciente')
                notice = page.locator('#revisionNotice').inner_text()
                assert 'EN REVISIÓN' in notice and 'PENDIENTE' in notice, ('Estado preliminar ambiguo', notice)
                checks.append('Etiqueta EN REVISION sin auditoría económica anticipada')

                page.screenshot(path=str(evidence / "expediente-dcf.png"), full_page=True)
                page.locator('[data-view="analisis"]').click()
                page.locator("#reviewPanel").wait_for(state="visible")
                assert page.locator("#auditReviewStatus").is_enabled()
                assert page.locator("#auditReviewNotes").is_editable()
                assert page.locator("#auditReviewStatus").input_value() == "EN_REVISION"
                checks.append("Selector y observaciones disponibles; no se envía formulario")

                reader = context.new_page()
                reader.goto(origin + "/analisis-lectura.html?ticker=CMG")
                reader.locator("#article h2").first.wait_for()
                assert reader.locator("#article h2").count() == 18
                assert "Valor intrínseco base:" in reader.locator("#article").inner_text()
                assert reader.locator("#level2").inner_text().strip()
                checks.append("Lector: artículo 18 secciones y Nivel 2")
                reader.screenshot(path=str(evidence / "lector.png"), full_page=True)

                visor = context.new_page()
                visor.goto(origin + "/visor.html?ticker=CMG")
                visor.get_by_text("Valor intrínseco principal", exact=False).first.wait_for()
                checks.append("Visor de la revisión")
                assert not errors, errors
                result = {"revisionId": REVISION, "scope": "localhost con datos de rama; no app real",
                          "checks": checks, "pageErrors": errors, "passed": True}
                (evidence / "resultado.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
                print(json.dumps(result, ensure_ascii=False))
            finally:
                browser.close()
    finally:
        server.shutdown()

if __name__ == "__main__":
    main()
