# Instrucciones de fase JMR — invocación en una frase

**Estado:** propuesta operativa (2-nov-2026). Orquesta las cuatro fases de la [Propuesta Claude](../PROPUESTA_CLAUDE_FASES.md) y de la [Propuesta ChatGPT](../PROPUESTA_CHATGPT_FASES.md). **No son prompts maestros:** el contenido lo siguen fijando `modelo/REGLAS_VIGENTES.md`, `docs/PROCESO_UNICO_JMR.md` y los tres prompts maestros (1/3 valoración, 2/3 análisis, 3/3 auditoría). Si algo de aquí choca con ellos, prevalecen ellos.

## Cómo se invoca

| Frase del usuario | Instrucción que se ejecuta | Prompt maestro que aplica |
|---|---|---|
| «Empieza el análisis de **<TICKER>** en fase 1» | [FASE_1_DATOS_Y_HOJA.md](FASE_1_DATOS_Y_HOJA.md) | — (procedimiento de datos de las habilidades) |
| «Sigue con **<TICKER>** en fase 2» (o «… en fase 2») | [FASE_2_SUPUESTOS_Y_VALORACION.md](FASE_2_SUPUESTOS_Y_VALORACION.md) | 1/3 Valoración |
| «Sigue con **<TICKER>** en fase 3» | [FASE_3_ANALISIS_Y_PUBLICACION.md](FASE_3_ANALISIS_Y_PUBLICACION.md) | 2/3 Análisis fundamental |
| «Audita **<TICKER>** en fase 4» | [FASE_4_AUDITORIA.md](FASE_4_AUDITORIA.md) | 3/3 Auditoría económica |

Variantes válidas: «empieza la fase N de <TICKER>», «<TICKER> fase N», «actualiza <TICKER> en fase 1» (operación *actualizar* en lugar de *desde cero*).

- **Claude Code:** la habilidad `fase-jmr` (repositorio JMR-valuation, `.claude/skills/fase-jmr/`) reconoce la frase y ejecuta el archivo de la fase.
- **ChatGPT (chat o Work):** seguir [MODO_CHATGPT.md](MODO_CHATGPT.md): instrucciones del proyecto para pegar, qué fase puede ejecutar y cuál requiere Claude Code (promoción y PR de la fase 3), controles «NO EJECUTADO» y dónde queda la entrega.

## Fases y modelo recomendado (resumen)

| Fase | Etapa del proceso | Estado de salida | Propuesta Claude | Propuesta ChatGPT |
|---|---|---|---|---|
| **1. Datos y hoja** | Preparación de datos | `CANDIDATO` | Claude **Sonnet**, esfuerzo medio | **ChatGPT (chat)** — escribe en Google Sheets |
| **2. Supuestos y valoración** | **Valoración** (prompt 1/3) | `CANDIDATO` | Claude **Opus**, esfuerzo alto | **ChatGPT Work**, Astra alto o Sol alto |
| **3. Análisis y publicación** | **Análisis** (prompt 2/3) y paso a **revisión** (`EN_REVISION`) | `EN_REVISION` | Claude **Opus** alto para redactar; **Sonnet** medio para captura, JSON, pruebas y PR | **ChatGPT Work**, mismo modo que la fase 2 |
| **4. Auditoría económica** | **Auditoría** independiente (prompt 3/3) | dictamen, nunca `AUDITADO` automático | Claude **Opus** alto en **sesión nueva**, o LLM de otro proveedor | **Otro LLM** (no ChatGPT); recomendado Claude Opus alto en sesión nueva |

- **Revisión** = lo que ocurre entre fases: el usuario lee la entrega `FASE_<N>_ENTREGA.md` y, al invocar la fase siguiente, la da por revisada. El estado `EN_REVISION` lo fija la fase 3, no un modelo distinto.
- **Regla de independencia:** la fase 4 nunca la hace el mismo modelo y sesión que hicieron las fases 2 y 3. Si no hay otro LLM disponible, mínimo una sesión nueva sin contexto, y la auditoría se califica «no independiente».
- Los modelos son **recomendaciones no normativas** (ver las dos propuestas): no hay comparación medida entre proveedores, y los modos Astra/Sol de ChatGPT no están verificados desde este repositorio. Los datos y los controles pesan más que el modelo.
- Cada `FASE_<N>_ENTREGA.md` debe declarar herramienta, modelo y esfuerzo realmente usados, aunque difieran de la recomendación.

## Reglas comunes a las cuatro fases
1. **Una fase por sesión y por invocación.** Al terminar, la fase se detiene y entrega; nunca encadena la siguiente por su cuenta. La invocación de la fase siguiente por el usuario equivale a su revisión de la entrega anterior.
2. **Traspaso por archivo, no por memoria.** Cada fase deja `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` con el formato de abajo y la fase siguiente parte **solo** de ese archivo, de la hoja y del repositorio. Si la entrega anterior falta o no está en estado `CERRADA`, la fase se detiene y lo informa.
3. **Ninguna cifra sin fuente.** Cada número que entra a la hoja, al JSON o al texto lleva documento, período y celda, o sale del JSON de la revisión. Prohibido escribir cifras de memoria; lo no verificado se marca [NO VERIFICADO].
4. **La hoja calcula.** Solo se escriben celdas de entrada; las salidas salen de fórmulas. Al cierre de las fases 1 y 2, `diff_formulas_plantilla.py` debe dar 0 reemplazos no declarados (fórmula → número o vacío).
5. **Nunca relajar un control para ponerlo en verde.** Si un control falla y no se puede corregir dentro de la fase, la entrega queda `BLOQUEADA` con la causa exacta.
6. **Estados:** fases 1 y 2 → `CANDIDATO`; fase 3 → `EN_REVISION` (si los controles pasan); fase 4 → dictamen, nunca `AUDITADO` automático.

7. **Emisores colombianos (BVC, COP):** mismas cuatro fases y mismos prompts maestros, con `docs/prompts/colombia-nucleo-v1.md` antepuesto como contexto local en las fases 2, 3 y 4 (no es un cuarto prompt). Moneda COP, estados NIIF, holdings por SOTP y financieras por FCFE según `REGLAS_VIGENTES.md`. En Claude Code, el procedimiento de datos y scripts es el de la habilidad `valoracion-colombia`. `colombia-valuation-v1.md` y `colombia-research-v1.md` son archivos de compatibilidad: no se ejecutan. Colombia figura en pausa desde el 21-oct-2026 (`docs/prompts/CONCILIACION_PROMPTS.md`); invocar una fase para un emisor colombiano equivale a reactivarlo para ese emisor.

## Formato de `FASE_<N>_ENTREGA.md`
```
# <TICKER> · <REV> · Fase <N> · <CERRADA | BLOQUEADA>
Fecha · herramienta y modelo usados · hoja (sheet_id) · commits/PR
## Hecho y verificado        (con evidencia: comando, celda, documento)
## Controles de cierre       (cada control: resultado real, no intención)
## Decisiones y juicios      (qué se eligió, alternativa, efecto)
## Pendiente o bloqueado     (qué falta, por qué, qué se necesita)
## Para la fase siguiente    (insumos exactos que debe leer)
```
