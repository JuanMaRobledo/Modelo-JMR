# JMR múltiplos

Aplicación aparte, complemento de **JMR V2.0**: valoración relativa por múltiplos, **sin DCF**. Se elabora **solo cuando el propietario lo solicita expresamente** (campo `solicitudExpresa` obligatorio).

- Contrato: `metodologia/CONTRATO_MULTIPLOS.md` + `contrato-multiplos.json`
- Motor y controles: `motor.mjs` · vista: `vista.mjs` · página: `../jmr-multiplos.html`
- Plantilla de libro (Excel, fórmulas): `plantilla/PLANTILLA_JMR_MULTIPLOS.xlsx` — `python3 scripts/multiplos-libro.py build|llenar|verify`
- Plantilla de expediente: `plantilla/PLANTILLA_EXPEDIENTE.json` → copiar a `empresas/TICKER.json`
- Catálogo: `node scripts/multiplos-catalogo.mjs [--check]`
- Pruebas: `node --test tests/jmr-multiplos-*.test.mjs` (la conciliación libro↔motor exige LibreOffice)

Estado: plantilla y app listas; **sin empresas** (no se publican valoraciones sin solicitud). La plantilla de libro no se ha abierto en Excel (solo LibreOffice/openpyxl). Vive en `docs/multiplos/` de Modelo-JMR, como V2 (decisión 1 de `docs/v2/DECISIONES.md`); no se tocó Cartera.
