# Instrucciones de fase JMR — invocación en una frase

**Estado:** vigente como forma de ejecución desde el 2-nov-2026 (ver [`PROCESO_UNICO_JMR.md`](../../PROCESO_UNICO_JMR.md), «Ejecución por fases»); la elección de modelo sigue siendo recomendación. Orquesta las cuatro fases de la [Propuesta Claude](../PROPUESTA_CLAUDE_FASES.md) y de la [Propuesta ChatGPT](../PROPUESTA_CHATGPT_FASES.md). **No son prompts maestros:** el contenido lo siguen fijando `modelo/REGLAS_VIGENTES.md`, `docs/PROCESO_UNICO_JMR.md` y los tres prompts maestros (1/3 valoración, 2/3 análisis, 3/3 auditoría). Si algo de aquí choca con ellos, prevalecen ellos.

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
1. **Alcance por invocación.** Una fase de forma predeterminada; si el usuario solicita varias, ejecutarlas en orden, sin pedir frases adicionales. Mantener la independencia de fase 4.
2. **Traspaso por archivo, no por memoria.** Cada fase deja `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` con el formato de abajo y la fase siguiente parte **solo** de ese archivo, de la hoja y del repositorio. Si falta la entrega, recuperarla desde la hoja y las evidencias; si tiene controles pendientes, aplicar la continuidad operativa descrita abajo y no bloquear por su estado documental.
3. **Ninguna cifra sin fuente.** Cada número que entra a la hoja, al JSON o al texto lleva documento, período y celda, o sale del JSON de la revisión. Prohibido escribir cifras de memoria; lo no verificado se marca [NO VERIFICADO].
4. **La hoja calcula.** Solo se escriben celdas de entrada; las salidas salen de fórmulas. Al cierre de las fases 1 y 2, `diff_formulas_plantilla.py` debe dar 0 reemplazos no declarados (fórmula → número o vacío).
5. **Nunca relajar un control para ponerlo en verde.** Si falla un control, corregirlo dentro del alcance o aislar las operaciones materialmente afectadas; completar el resto. El estado depende de su impacto real, no del simple número de controles pendientes.
5b. **Controles no ejecutados.** Un control que la herramienta no pudo correr se marca «NO EJECUTADO — requiere <herramienta>». La fase queda `CERRADA CON CONTROLES PENDIENTES` y la siguiente puede continuar como CANDIDATO con insumos verificables; los controles de publicación siguen pendientes hasta su ejecución. Ver [MODO_CHATGPT.md](MODO_CHATGPT.md).
6. **Estados:** fases 1 y 2 → `CANDIDATO`; fase 3 → `EN_REVISION` (si los controles pasan); fase 4 → dictamen, nunca `AUDITADO` automático.

7. **Emisores colombianos (BVC, COP):** mismas cuatro fases y mismos prompts maestros, con `docs/prompts/colombia-nucleo-v1.md` antepuesto como contexto local en las fases 2, 3 y 4 (no es un cuarto prompt). Moneda COP, estados NIIF, holdings por SOTP y financieras por FCFE según `REGLAS_VIGENTES.md`. En Claude Code, el procedimiento de datos y scripts es el de la habilidad `valoracion-colombia`. `colombia-valuation-v1.md` y `colombia-research-v1.md` son archivos de compatibilidad: no se ejecutan. Colombia figura en pausa desde el 21-oct-2026 (`docs/prompts/CONCILIACION_PROMPTS.md`); invocar una fase para un emisor colombiano equivale a reactivarlo para ese emisor.

## Formato de `FASE_<N>_ENTREGA.md`
```
# <TICKER> · <REV> · Fase <N> · <CERRADA | CERRADA CON CONTROLES PENDIENTES | BLOQUEADA>
Fecha · herramienta y modelo usados · hoja (sheet_id) · commits/PR
## Hecho y verificado        (con evidencia: comando, celda, documento)
## Controles de cierre       (cada control: resultado real, no intención)
## Decisiones y juicios      (qué se eligió, alternativa, efecto)
## Pendiente o bloqueado     (qué falta, por qué, qué se necesita)
## Para la fase siguiente    (insumos exactos que debe leer)
```

## Continuidad y cierre operativo — actualización 2-nov-2026

Esta actualización sustituye la exigencia de detener el trabajo por una entrega ausente o por cualquier control pendiente. No cambia fórmulas, parámetros financieros, criterios económicos ni gates de publicación.

1. **Completar el trabajo solicitado.** Una fase por invocación de forma predeterminada. Si el usuario pide expresamente varias fases, ejecutarlas en orden sin pedir una nueva frase entre ellas. La auditoría conserva su independencia y no se encadena en la sesión que construyó el modelo.
2. **Recuperar antes de bloquear.** Buscar entrega, inventario, hoja y capturas en repositorio, Drive y archivos persistentes. Identificar ticker, revisión, hoja y corte; no tomar una versión por el título más antiguo. Si falta el archivo formal, reconstruirlo desde evidencia leída, conservando fuentes y pruebas realmente realizadas. La ausencia de un nombre de archivo no es un bloqueo económico.
3. **Resolver dependencias dentro de la fase.** La invocación autoriza completar los pendientes previos necesarios y reversibles del mismo ticker y revisión, sin reiniciar datos correctos. Una entrega CERRADA CON CONTROLES PENDIENTES permite continuar como CANDIDATO si los insumos mínimos de la operación están verificados.
4. **Mínimos para calcular.** Identidad, revisión/hoja, escala/moneda, corte identificado, estados materiales reconciliables y fórmulas nativas accesibles. Comprobar directamente antes de escribir. Una cifra material ausente, fórmula rota o discrepancia no explicada impide únicamente los cálculos dependientes; continuar investigación y secciones independientes. Nunca presentar un valor no comprobado como oficial.
5. **Herramientas y equivalencia.** Ejecutar scripts oficiales cuando sea viable. Si no hay cliente, credenciales o script utilizable, intentar una comprobación directa equivalente: misma propiedad, alcance, tolerancia, evidencia reproducible y diferencias declaradas. Registrar APROBADO POR PRUEBA EQUIVALENTE, no afirmar que se ejecutó el comando oficial. Si no cubre el alcance, registrar NO EJECUTADO o PARCIAL y continuar la preparación independiente. Los gates exigidos para publicar siguen siendo obligatorios; una prueba alternativa no los pone en verde.
6. **Clasificar, no detener todo.** Separar (a) errores materiales de datos/fórmulas que bloquean operaciones dependientes, (b) comprobaciones técnicas pendientes de automatizar y (c) reservas económicas/supuestos debatibles que deben justificarse y sensibilizarse. No confundir un control de publicación pendiente con imposibilidad de redactar o preparar un candidato.
7. **Cierre honesto.** CERRADA: entregable completo y controles requeridos acreditados, con equivalencias identificadas cuando sean admisibles. CERRADA CON CONTROLES PENDIENTES: entregable de trabajo preparado, pero falta validación o publicación; enumerar cada pendiente y su efecto. BLOQUEADA: falta material que realmente impide completar el entregable solicitado, después de intentar recuperación; conservar todo lo alcanzado y explicar la operación exacta detenida. Nunca prometer que toda fase quedará aprobada.
8. **Publicación separada.** Fases 1/2 y research pendiente de promoción permanecen CANDIDATO. No publicar, promover a EN_REVISION ni marcar AUDITADO por cerrar un documento. Exigir autorización y todos los gates aplicables antes de promover. ChatGPT puede finalizar textos de fase 3 sin PR ni publicación; registrar publicación pendiente para Claude Code.
9. **Decisiones rutinarias.** Resolver autónomamente búsquedas, recuperación, cálculos de comprobación, supuestos razonados y documentación dentro del alcance. Preguntar solo por una decisión material del usuario sin autorización previa. Un corte específico de una revisión puede documentarse sin actualizar la Cartera global; no cambiar esta última sin autorización ni mezclar tasas de fechas diferentes como si fueran simultáneas.
10. **Entrega útil siempre.** Guardar FASE_N_ENTREGA.md con resultados reales, enlaces, alcance de pruebas y tareas concretas pendientes. No limitarse a reiterar el mismo bloqueo ni trasladar al usuario operaciones que el entorno actual sí puede ejecutar. Conservar el aislamiento y la independencia de auditoría.
