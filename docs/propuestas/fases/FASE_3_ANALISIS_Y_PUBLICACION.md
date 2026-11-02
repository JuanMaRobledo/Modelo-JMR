# Fase 3 · Análisis fundamental y publicación EN_REVISION

**Invocación:** «Sigue con <TICKER> en fase 3». **Aplica:** prompt maestro **2/3 Análisis fundamental** (`docs/prompts/research-fundamental-jmr-v5.md`). **Estado de salida:** `EN_REVISION` si todos los controles pasan; si falta validación o publicación, `CANDIDATO` con la entrega `CERRADA CON CONTROLES PENDIENTES`; `BLOQUEADA` solo si faltan insumos materiales que impiden el análisis. **No** recalcula, **no** cambia supuestos ni la hoja, **no** audita.

**Modelo recomendado (no normativo; ver [README](README.md)):** Claude Opus alto (redacción) y Sonnet medio (captura, JSON, PR) · ChatGPT Work, mismo modo que la fase 2. Declarar en la entrega el modelo y esfuerzo realmente usados.

## Requisito de entrada
Entrega recuperable de fase 2 y captura/JSON de la misma revisión con cifras nativas verificables. Admitir controles técnicos pendientes para redactar como CANDIDATO. Si falta el JSON formal, obtener una captura y construirlo con trazabilidad, sin inventar ni recalcular supuestos de valoración. Un error material impide solo las conclusiones dependientes. Aplicar «Continuidad y cierre operativo» del README.


**Emisor colombiano:** anteponer `docs/prompts/colombia-nucleo-v1.md` al prompt 2/3.

## Pasos
0. **Aislamiento y visión externa.** `AISLAMIENTO=OK`; el capítulo 3B contrasta la historia del emisor con la visión externa recogida en la fase 1.
1. **Nivel 1:** 14 capítulos canónicos (capítulo 5 de ciclos), mínimo 330 palabras por capítulo y 7.500 en total, con hechos y mecanismos propios del emisor.
2. **Nivel 2:** 12 apartados reproducibles con tablas leídas de la captura (no reescritas): históricos, fuentes, supuestos por historia, fórmulas literales, proyección, DCF y puente, escenarios, múltiplos, sensibilidades, matrices, conciliaciones (incluido el recálculo independiente) y salvedades.
3. **Verificación de cada afirmación:** toda cifra sale del JSON de la revisión o de un documento citado y comprobado en esta fase; las cifras calculadas en el texto se generan por código desde el JSON, no se escriben a mano.
4. **Publicación:** promover al catálogo (`valoraciones/` y `analisis/`), retirar del catálogo la revisión anterior del mismo ticker sin borrarla (marca `sustituidaPor`), ejecutar **todos los pasos** de los workflows del repositorio de datos en local, PR, CI en verde y fusión.

## Controles de cierre
- Workflows locales: `validar_catalogo`, `auditar_ponderaciones`, `auditar_integridad`, `auditar_profundidad`, `validar_profundidad_metodo_a`, `validar_no_regresion_20`, pruebas Node y Python → todos en verde.
- Pruebas de la app (Modelo-JMR) en verde.
- CI remoto en verde sobre el commit fusionado.
- Si una guarda del repositorio debe cambiar por la promoción (conteos, identificador de revisión), el cambio se declara en el PR y no relaja el criterio.

## Puerta oficial de publicación y pasos heredados
- `bash scripts/controles_todas.sh` (JMR-valuation) es la puerta oficial: probabilidades, controles_supuestos, consistencia_migracion, integridad_hojas, estados_completos, inputs_completos, candados. **`consistencia_migracion` (contrato del 17-oct) falla hoy en todas las revisiones A-1.2 (XP, INTU, DPZ, NU)**: se informa el resultado real, no se «arregla» ni se oculta; la decisión de publicar la toma el usuario con ese dato a la vista.
- Pasos **heredados (método anterior, FCFF)**, solo si la revisión no es A-1.2 o si el usuario los pide: `consistencia_app.py` (obsoleto), `subir_drive.py`, `pagina_cartera.py` e `insert_*` (leen celdas FCFF y mostrarían mal un banco). En A-1.2 se declaran «no aplica» en la entrega.
- `regenerar_una.sh` exige `publicacion_gate.py` y `--autorizar-publicacion`: no se ejecuta sin autorización expresa.

## Entrega
`FASE_3_ENTREGA.md`, PR fusionado, rutas del JSON y del análisis. «Para la fase siguiente»: identificador de la revisión publicada, hoja, JSON, análisis y lista de salvedades.

## Cierre del trabajo editorial sin promoción
Los textos N1/N2 se entregan completos aunque los gates de publicación no puedan ejecutarse. En ChatGPT, PR, CI y promoción pendientes no vuelven fallida una redacción terminada: entregar CERRADA CON CONTROLES PENDIENTES y estado CANDIDATO, con instrucciones concretas de publicación. No afirmar EN_REVISION ni publicación sin autorización y pruebas. Solo completar publicación en la herramienta y alcance autorizados.
