# Contrato único de valoración y publicación — Modelo JMR V2.0

**Versión:** 1.1.0 · **Fecha:** 13-nov-2026 · **Ámbito exclusivo:** JMR V2.0  
**Autoridad:** decisiones del propietario. **Aplicación:** ChatGPT, Claude, Gemini y cualquier LLM.  
**Floyd:** modelo y reglas independientes; no sustituir, sobrescribir ni eliminar sus archivos.

## Regla principal: publicación y auditoría son procesos distintos

**La valoración y el análisis fundamental se muestran en la aplicación independientemente de que estén auditados.** La falta de auditoría **no** puede, por sí sola, impedir que aparezcan en el visor de pendientes. La publicación en la app significa **disponible para lectura y revisión**, no aprobación económica ni recomendación de compra.

Hay tres dimensiones independientes:
1. **Visibilidad en la aplicación:** `PUBLICADA_PARA_REVISION` (se ve en V2) o `BLOQUEADA` (no se exponen valores sin fundamento). No depende de la auditoría.
2. **Controles técnicos/económicos:** `BLOQUEADO`, `EN_PROCESO`, `EN_REVISION` o `PUBLICADO` (código histórico del control, no evidencia de aprobación personal).
3. **Auditoría personal:** `PENDIENTE` o `APROBADA_POR_USUARIO`. Ningún LLM puede atribuirse esa aprobación.

El visor **«Pendientes de mi auditoría»** debe incluir todos los expedientes reales visibles sin aprobación personal, aun con estado `EN_PROCESO` o `EN_REVISION`; las salvedades serán destacadas y las cifras se etiquetarán como provisionales. **«Auditadas y aprobadas por mí»** solo contiene expedientes con aprobación explícita del propietario y evidencia trazable para la revisión vigente. Una actualización material reinicia la aprobación para la nueva revisión, sin borrar la historia anterior.

Un expediente **BLOQUEADO** por ausencia de datos imprescindibles, incoherencia insalvable o motor no aplicable puede mostrar ficha explicativa y asuntos pendientes, pero **no un valor intrínseco numérico no sustentado**. No se inventan datos, informes ni firmas.

## Método único, independiente del LLM

1. Clasificar empresa antes de valorar: `operativa` (Damodaran `fcffsimpleginzu`), `banco` o `aseguradora` (DDM / exceso de retorno), `holding` (SOTP), `alto-crecimiento` (`higrowth` si se justifica). Elegir una plantilla oficial de `AAA Finanzas/MODELO JMR V2.0/PLANTILLAS`, crear copia por empresa, no editar plantillas maestras.
2. Usar primero los documentos de `AAA Finanzas/MODELO JMR V2.0/ANALISIS/[TICKER]`. Priorizar informes anuales y trimestrales originales; si faltan informes antiguos, usar los disponibles, registrar el período cubierto y las lagunas. **Diez años son objetivo, no requisito absoluto**; no inventar ejercicios.
3. Conciliar los estados financieros históricos, con partidas y unidades uniformes; documentar fuente primaria, fecha, página o nota, cifra reportada y ajustes. Separar FY de LTM. Estados completos de resultados, situación financiera y flujos de efectivo, con N/D justificado para ausencias.
4. Analizar márgenes, múltiplos, eficiencia y salud financiera. Aplicar con evidencia los tratamientos de arrendamientos, I+D, SBC/dilución, opciones, NOL y capital invertido cuando sean materiales.
5. Tres escenarios **Conservador, Base y Optimista**. Para cada uno publicar la historia económica, evidencia y contraevidencia, por qué se escogen crecimiento, márgenes, reinversión, ventas/capital, ROIC terminal, WACC y valor terminal, además de los riesgos. Los parámetros se determinan con evidencia; nunca elegirlos solo para alcanzar una cotización.
6. Mantener el motor y libro Damodaran de V2 como fuente de cálculo. Exportar el JSON desde el libro; conciliar **los tres valores por acción** entre libro y motor con tolerancia 0,5 %. Sensibilidad explícita 5×5 para variables relevantes. Múltiplos son análisis comparativo, no promedio con el DCF.
7. Portada V2: conservar la presentación de **precio de mercado, valor intrínseco Base, precio con MOS del 35 % sobre el Base, brecha y los tres escenarios**. Marcar claramente precio/fecha de corte y si es una valoración preliminar.
8. Publicar con **las ocho pestañas de Floyd adaptadas a V2**: Análisis fundamental, Valoración, Estados financieros, Indicadores, Modelo y supuestos, Sensibilidades, Asuntos por revisar, Revisión y auditoría. Ninguna pestaña debe remitir los datos propios a Floyd. Estados financieros completos disponibles en su pestaña o ventana propia.
9. El **análisis fundamental será amplio y completo**, integrado en la ficha, legible y **editable desde el navegador**, incluyendo imágenes; el guardado crea una revisión/borrador sin alterar automáticamente el DCF ni certificarla. Mostrar negocio, moat, historias→números, riesgos y conclusión, con fuentes y contraste de tesis.
10. Ejecutar `node scripts/v2-catalogo.mjs --check`, las pruebas V2 y controles económicos. Publicar para revisión una empresa real **sin esperar auditoría** cuando existan datos suficientes para una valoración trazable; conservar estado y pendientes. La aprobación personal se registra aparte, no la inventa la IA.

## Contrato de salida entre agentes

Todos los LLM deben entregar el **mismo formato estructurado**, usando `docs/v2/empresas/[TICKER].json` y los campos del motor vigente. El resultado mínimo es: perfil, fuente y período por dato material, historial, supuestos por escenario y sus razones, valoraciones por escenario, MOS, estados financieros, indicadores, análisis fundamental, referencias de libro, controles, `visibilidadApp`, `visorAuditoria`, `aprobacionUsuario` y asuntos pendientes. Un LLM puede proponer supuestos narrativos; **no puede sustituir fórmulas por números manuales** ni concederse aprobación.

**Regla de cambios:** una revisión del método exige modificar este contrato, `contrato-v2.json`, el validador/catálogo cuando aplique y pruebas en el mismo PR. No mezclar con `AGENTS.md` o los contratos de Floyd. Todos los modelos deben informar el commit y versión de contrato usados.

## Distinción de condiciones

- **Visible para revisar:** información real, modelo aplicable, sin bloqueos que invaliden el valor, con salvedades visibles; no requiere aprobación independiente ni personal.
- **Auditoría independiente:** revisión económica/documental y sus evidencias; se registra cuando realmente ocurra.
- **Aprobado por ti:** aprobación personal expresa referida a versión concreta de valoración y análisis. Solo entonces entra en el visor auditado.
