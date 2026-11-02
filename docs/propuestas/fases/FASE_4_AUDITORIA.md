# Fase 4 · Auditoría económica independiente

**Invocación:** «Audita <TICKER> en fase 4». **Aplica:** prompt maestro **3/3 Auditoría económica** (`docs/prompts/auditoria-economica-jmr-v1.md`): 18 secciones exactas, dictamen VERIFICADO / VERIFICADO CON RESERVA MATERIAL / PENDIENTE. **No** modifica la valoración, la hoja ni el análisis; **no** cambia el estado a `AUDITADO` sin autorización expresa.

**Modelo recomendado (no normativo; ver [README](README.md)):** Claude Opus alto en sesión nueva, u otro LLM distinto del de las fases 2 y 3 (no ChatGPT si hizo 2 y 3). Declarar en la entrega el modelo y esfuerzo realmente usados.

## Requisito de independencia (obligatorio)
- Debe ejecutarse en una **sesión nueva** y, preferiblemente, con **otro LLM** distinto del que hizo las fases 2 y 3.
- Si quien audita reconoce que construyó la valoración en la misma conversación, debe declararlo en la sección 1 y calificar la auditoría como «no independiente»; el expediente no puede pasar a `AUDITADO` con esa auditoría.
- Lee solo lo publicado: catálogo, JSON, análisis, hoja y fuentes primarias. No lee las entregas de las fases 2 y 3 hasta haber formado su propio juicio (las usa al final para contrastar).


**Emisor colombiano:** anteponer `docs/prompts/colombia-nucleo-v1.md` al prompt 3/3 como contexto local.

## Pasos
1. Resolver la revisión vigente en `catalogo.json` y leer `auditorias/solicitudes/<TICKER>/<REV>.json` si existe.
2. Reproducir el valor principal con código propio y comparar con la hoja; verificar identidades, centros de matrices y fechas.
3. Verificar fuentes de los insumos materiales contra los documentos primarios (no contra el análisis).
4. Examinar cada supuesto con las seis preguntas del prompt y en ambas direcciones; cuantificar el efecto de cada hallazgo (también los favorables al valor).
5. Formato de la hoja: `diff_formulas_plantilla.py` y excepciones declaradas.
5b. Ejecutar de forma independiente `inputs_completos.py`, `candados.py`, `estados_completos.py`, `integridad_hojas.py` y `controles_supuestos.py` y reportar resultados reales; la comprobación de `AISLAMIENTO=OK` es propia, no heredada. Si la revisión auditada aún no está en el catálogo, ejecutarlos con `JMR_HOJA_<TICKER>=<sheet_id>` (JMR-valuation, `hoja_vigente.py`); no aceptar resultados contra la ancla legada. Añadir `ubicacion_hoja.py <TICKER> --sheet-id <ID>`.
6. Clasificar hallazgos (A bloqueante, B reserva material, C no bloqueante, D no aplica) y emitir dictamen.

## Controles de cierre
- 18 títulos H2 exactos y en orden; resumen oral de 90–150 palabras.
- Cada hallazgo con evidencia, celda, efecto cuantificado y propuesta; las pruebas no ejecutadas, marcadas como tales.
- Publicación del informe en `auditorias/narrativas/<TICKER>.md` **solo** con autorización expresa del usuario.

## Entrega
`FASE_4_ENTREGA.md` con el dictamen y el informe; si hay hallazgos que exigen nueva revisión, la lista de cambios propuestos para una fase 2 posterior (nueva `<REV>`).
