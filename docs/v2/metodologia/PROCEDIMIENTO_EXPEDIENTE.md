# Procedimiento · una empresa nueva en JMR V2.0

La IA hace **tres** cosas económicas: (1) recopilar, normalizar y conciliar históricos, (2) proponer supuestos con justificación, (3) redactar el análisis fundamental. Todo cálculo derivado lo hacen fórmulas.

1. **Clasificar el perfil** (`operativa`, `banco`, `aseguradora`, `holding`, `alto-crecimiento`). Simple Ginsu cuando baste; los otros motores con condición declarada.
2. **Informes**: el usuario los coloca en `AAA Finanzas/MODELO JMR V2.0/ANALISIS/[TICKER]`. Leer primero esos; descargar solo lo que falte, de fuentes primarias. No inventar cifras.
3. **Libro** (operativas: `v2-libro-operativo.py`; bancos y aseguradoras: `v2-libro-financiero.py` con método `ddm` o `exceso`; alto crecimiento: `v2-libro-alto.py`; holdings: `v2-libro-holding.py`): copiar la plantilla de `PLANTILLAS`, llenar **«JMR Estados»** (azul = reportado) y **«JMR Fuentes»** (documento, período, página/nota, moneda, unidades, valor reportado, ajuste). Los controles de cuadre deben quedar en OK.
4. **Escenarios** en «JMR Escenarios»: tres conjuntos de supuestos, cada uno con justificación económica; WACC común salvo razón documentada. Recorrer los tres escenarios y guardar la instantánea.
5. **Exportar** el expediente desde el libro (no se escribe a mano):
   `python3 -I scripts/v2-libro-operativo.py exportar libro.xlsx meta.json trabajo/ docs/v2/empresas/TICKER.json`
   `python3 -I scripts/v2-libro-financiero.py exportar libro.xlsx <ddm|exceso> meta.json trabajo/ docs/v2/empresas/TICKER.json` (meta.json incluye `profile`)
   `python3 -I scripts/v2-libro-alto.py exportar libro.xlsx meta.json trabajo/ docs/v2/empresas/TICKER.json`
   `python3 -I scripts/v2-libro-holding.py exportar libro.xlsx meta.json trabajo/ docs/v2/empresas/TICKER.json`
   `meta.json` aporta `ticker`, `analysis`, `sources`, `justificaciones` (y `auditoria` solo si ya existe, firmada por un tercero).
6. **Catálogo**: `node scripts/v2-catalogo.mjs` y `npm test`. El estado queda determinado por los controles.
7. **PR** a `main`: CI en verde. Un expediente `PUBLICADO` solo se fusiona con la auditoría independiente adjunta.

Datos que bloquean solo esa valoración: se documenta el bloqueo concreto y se continúa con las demás.
