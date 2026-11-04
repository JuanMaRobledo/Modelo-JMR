# Fase 4 · Análisis fundamental y publicación preliminar
**Versión:** JMR cinco fases, 2-nov-2026. **Prompt maestro:** `research-fundamental-jmr-v5.md` (2/3).
**Salida:** `EN_REVISION` si los controles técnicos de promoción están aprobados; de lo contrario `CANDIDATO` con artículo y bloqueos, sin publicidad engañosa ni publicación.

## Pasos
1. Recuperar entregas F1–F3, hoja/corte/revisión y resultados verdaderos de historias/múltiplos; confirmar cifras últimas y coherencia entre datos y supuestos. Ninguna cifra inventada o de revisión sustituida.
2. **Nivel 1**: artículo narrativo JMR completo de 14 capítulos, incluyendo tesis, industria, ventaja, ciclos corporativo/macro/crédito/sentimiento, drivers, historia económica, reinversión, ROIC, riesgos, directivos, escenarios y seguimiento.
3. **Nivel 2**: anexo cuantitativo reproducible de 12 apartados: históricos FY+LTM, fuentes, input, costos capital, ROIC, DCF anual/escenario, EV–equity, múltiplos FY+1/2/3, sensibilidades DCF y por múltiplo Base, DCF inverso, pruebas y conciliaciones. Mismo `revision_id` y `sheet_id` del expediente.
3b. **DCF por FCFE (informativo, REGLAS §1 v28):** si la hoja tiene la pestaña `DCF FCFE`, ejecutar `JMR-valuation/scripts/dcf_fcfe_registro.py <TICKER>` para escribir `dcfFCFE` en el registro y en el análisis y la sección «DCF por FCFE (informativo)» al final del Nivel 2. No es valor principal, no lleva MOS y el ponderado FCFF/FCFE no entra en el valor principal. Financieras con `DCF FCFE financiero` (NU, XP, PAGS): no aplica.
4. Ejecutar TODOS los controles técnicos de publicación y evidencia: integridad financiera, fuente SEC/NIIF, ceros, selectores, fórmulas, motor/hoja, múltiples, matriz 5×5, JSON, tests de app/CI y preview. No relajar puertas por presentar como `EN_REVISION`.
5. **Publicación:** la invocación expresa de `Fase 4` autoriza intentar publicación preliminar. Solo si gates de publicación pasan, sincronizar hoja → JSON → app en una revisión, archivar anterior sin perder historia, mostrar claramente `EN_REVISION / AUDITORÍA ECONÓMICA PENDIENTE`. Comprobar URL en producción o preview autorizada. Si falta permiso o gate, no publicar y documentar exactamente cuál.
6. Entregar `FASE_4_ENTREGA.md` con URL de ficha, PR, hash, revisión/corte, estado CI, prueba visual, pendientes y puntos abiertos para la auditoría guiada.

**No** ejecutar auditoría final o emitir VERIFICADO aquí; eso corresponde a F5. No publicar números que dependan de fórmulas tributarias o puentes EV no conciliados.
