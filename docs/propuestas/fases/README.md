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
- **ChatGPT (chat o Work):** cargar este directorio como instrucciones del proyecto, o pegar el archivo de la fase con la frase al final.

## Reglas comunes a las cuatro fases
1. **Una fase por sesión y por invocación.** Al terminar, la fase se detiene y entrega; nunca encadena la siguiente por su cuenta. La invocación de la fase siguiente por el usuario equivale a su revisión de la entrega anterior.
2. **Traspaso por archivo, no por memoria.** Cada fase deja `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` con el formato de abajo y la fase siguiente parte **solo** de ese archivo, de la hoja y del repositorio. Si la entrega anterior falta o no está en estado `CERRADA`, la fase se detiene y lo informa.
3. **Ninguna cifra sin fuente.** Cada número que entra a la hoja, al JSON o al texto lleva documento, período y celda, o sale del JSON de la revisión. Prohibido escribir cifras de memoria; lo no verificado se marca [NO VERIFICADO].
4. **La hoja calcula.** Solo se escriben celdas de entrada; las salidas salen de fórmulas. Al cierre de las fases 1 y 2, `diff_formulas_plantilla.py` debe dar 0 reemplazos no declarados (fórmula → número o vacío).
5. **Nunca relajar un control para ponerlo en verde.** Si un control falla y no se puede corregir dentro de la fase, la entrega queda `BLOQUEADA` con la causa exacta.
6. **Estados:** fases 1 y 2 → `CANDIDATO`; fase 3 → `EN_REVISION` (si los controles pasan); fase 4 → dictamen, nunca `AUDITADO` automático.

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
