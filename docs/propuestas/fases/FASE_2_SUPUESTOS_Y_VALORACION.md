# Fase 2 · Supuestos y valoración

**Invocación:** «Sigue con <TICKER> en fase 2». **Aplica:** prompt maestro **1/3 Valoración** (`docs/prompts/valoracion-modelo-jmr-v5.md`) y `REGLAS_VIGENTES.md`. **Estado de salida:** `CANDIDATO`. **No** escribe el artículo, **no** audita, **no** publica.

**Modelo recomendado (no normativo; ver [README](README.md)):** Claude Opus alto · ChatGPT Work (Astra/Sol alto). Declarar en la entrega el modelo y esfuerzo realmente usados.

## Requisito de entrada
Recuperar `FASE_1_ENTREGA.md` y sus evidencias (repositorio, Drive o archivos persistentes). Admitir `CERRADA CON CONTROLES PENDIENTES` si los insumos materiales para el cálculo están verificados. Si falta el archivo formal, reconstruirlo desde evidencia; resolver pendientes previos necesarios dentro de esta fase. Aplicar «Continuidad y cierre operativo» del README. No calcular con datos materiales ausentes ni fórmulas rotas; aislar esas dependencias y completar el resto. Los controles oficiales siguen informándose con su resultado real.


**Emisor colombiano:** anteponer `docs/prompts/colombia-nucleo-v1.md` al prompt 1/3. Holdings: SOTP Base como valor principal; financieras: FCFE/Ke con capital regulatorio.

## Pasos
1. **Supuestos con evidencia en ambas direcciones.** Para cada motor, tabla `supuesto | valor | historia 3/5 años y UDM | consenso o pares con fecha | mecanismo | qué lo refuta | efecto en valor`:
   - **Crecimiento** (año 1, años 2–5, 6–10) frente a historia, ritmo del último trimestre y consenso.
   - **Márgenes** normalizados (tasa efectiva normal si la del UDM está distorsionada) frente a historia y pares.
   - **Reinversión:** Sales-to-Capital marginal y ROIC (operativas); capital regulatorio, APR/RWA y deducciones de CET1 (financieras: el patrimonio requerido se liga a los activos de riesgo observados; el ROE es un resultado, no un supuesto impuesto); por segmento (holdings).
   - **Costo de capital:** beta de abajo hacia arriba **y** beta de regresión (con error estándar), prima madura y prima país de la fecha del corte, ponderación por exposición de ingresos.
   - **Terminal:** g del corte con techo en la tasa libre; ROIC/ROE terminal según la regla de moat.
   - Revisar explícitamente **sesgo agresivo y prudencia duplicada**; cada riesgo en un solo lugar (flujos, tasa o probabilidad).
1b. **Ciclo de vida y probabilidades.** `scripts/ciclo_de_vida.py` y `scripts/probabilidades.py` fijan la etapa y las probabilidades previas; `reference/damodaran/<TICKER>.json` guarda la lectura sectorial de Damodaran usada.
2. **Cuatro historias** completas y probabilidades = previa de la etapa + ajustes de 5 pp solo por indicadores que cruzaron su umbral escrito. Disrupción aparte.
3. **En la hoja:** escribir solo entradas; el DCF (o FCFE/SOTP), escenarios, sensibilidades nativas 5×5 (centro = Base), DCF inverso y múltiplos aplicables con anclas independientes salen de fórmulas. `PENDIENTE_ANCLA` (peso 0) solo procede si el dato que forma el ancla **no existe públicamente** y se documenta la búsqueda; precios de cierre, acciones y balances de un emisor cotizado siempre existen: si faltan en la hoja, es un dato de fase 1 que se completa en esta misma invocación, no una ancla pendiente (caso AMZN-20261102-A12-R2). Los cinco prioritarios aplicables deben quedar en OK, o N/A solo para EV/FCFF y P/FCFE con flujo FY+3 negativo. Motores especiales en pestañas añadidas y declaradas.
3b. **Múltiplos por ciclo.** `scripts/multiples_by_cycle.py` para operativas; bancos usan P/E, P/FCFE y P/BV con el contrato `review-relative-v1`.
4. **Recálculo independiente** del valor principal fuera de la hoja (código propio que lea las entradas de la hoja) y comparación.
5. **Captura** de la hoja con SHA-256 y **JSON candidato** construido solo desde la captura.

## Controles de cierre
- Recálculo independiente = hoja (diferencia < 1e-6 por acción) en las cuatro historias.
- Centros de todas las matrices = Base o VP3 del método; probabilidades suman 1; MOS = Base × 0,65.
- `diff_formulas_plantilla.py` → 0 no declarados; `integridad_hojas.py <TICKER>` sin hallazgos nuevos no explicados.
- `scripts/controles_supuestos.py <TICKER>`, `scripts/probabilidades.py` y `scripts/inputs_completos.py <TICKER>` / `candados.py <TICKER>`: resultado real en la entrega (en A-1.2 las celdas «PENDIENTE» legadas se explican una a una, no se ocultan).
- `node scripts/validar_matrices_candidato.cjs <JSON candidato>` (Modelo-JMR-datos): misma regla de múltiplos que el CI del catálogo. Si falla, la fase no queda CERRADA y no se puede publicar.
- `precios_historicos.py <TICKER> --sheet-id <ID>` completo.
- Aislamiento: `AISLAMIENTO=OK`.
- Tabla de supuestos completa, con cada fila revisada en ambas direcciones.
- Ningún supuesto ajustado para acercarse al precio (el DCF inverso solo se reporta).

## Entrega
`FASE_2_ENTREGA.md`, `VALORACION_A12_EN_REVISION.json` en `candidatos/valoraciones/<REV>/` (estado CANDIDATO), captura con hash. «Para la fase siguiente»: valores por historia, tabla de supuestos, salvedades y rutas.
