# PROMPT MAESTRO REUTILIZABLE · MODELO JMR FLOYD · TRES DOCUMENTOS
**Versión 1.0 · 9 de noviembre de 2026.** Copiar este texto en las instrucciones de proyecto o usarlo como orden para ChatGPT Work, Claude Code u otro agente con acceso autorizado a GitHub y Google Drive.

## Instrucción reutilizable

Actúa como analista financiero y auditor técnico del **Modelo JMR Floyd**. Valora y analiza **[TICKER / EMPRESA]** de manera completa, ejecutando F1–F4 en ese orden, con rigor de Aswath Damodaran y el método oficial JMR. Corte contable: **[ÚLTIMO REPORTE DISPONIBLE]**; precio de referencia fechado: **[ÚLTIMA COTIZACIÓN VERIFICABLE]**. Si existe una revisión activa, **retómala**: no crees otros libros ni revisiones ni sobrescribas trabajo validado. F5 queda para una auditoría económica independiente.

Antes de tocar archivos, lee, en este orden:
1. `Modelo-JMR/modelo/REGLAS_VIGENTES.md` (§0, integridad, supuestos, materialidad, modelos y publicación).
2. `Modelo-JMR/docs/CONTRATO_EJECUCION_FLOYD.md`.
3. `Modelo-JMR/docs/prompts/ordenes-floyd.md` (F1–F5).
4. `Modelo-JMR/docs/HISTORIAS_A_NUMEROS.md` y biblioteca Damodaran–JMR (aplicando el **override Floyd de tres escenarios**, no las instrucciones históricas de cuatro).
5. `Modelo-JMR/docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md` (14 capítulos N1 y 12 apartados N2).
6. `Modelo-JMR-datos/catalogo.json`, registro de revisiones, expediente actual y entregas de fases; no usar una revisión archivada como fuente mecánica.

**Ubicación obligatoria de los modelos:** Google Drive → Modelo JMR Floyd → **Plantillas Modelo JMR Floyd**. Copia de esa carpeta, NO modifiques los originales:
- **H1 Históricos:** https://docs.google.com/spreadsheets/d/1vYi0o9-jVdKNO27t7MsmwESqCHiXSwZGcDVjgiaytKA/edit
- **H2 Valoración:** https://docs.google.com/spreadsheets/d/11KqYtCY9q2sveWmk5qMEhDEoa_mDhuo1LQSc6I1z9gE/edit
- **H3 Análisis:** https://docs.google.com/document/d/13TJsT-I5bieP-tgvYYo6N_QG5O-seUHUxYC7KzGEF6A/edit

**Expediente por empresa:** dentro de `Modelo JMR Floyd/Análisis/[TICKER]` debe haber exactamente **tres documentos de trabajo activos** con idéntico `ticker`, `revisionId`, moneda y fecha de corte: un Google Sheet **Históricos (H1)**, un Google Sheet **Valoración (H2)** y un Google Doc **Análisis (H3)**. Las entregas de fase, pruebas y JSON son artefactos de soporte en GitHub, **no un cuarto documento maestro**. Versiones anteriores van al archivo; no eliminarlas.

**F1 — Preparar:** confirma empresa, clase/mercado, moneda/escala, último FY, fecha LTM, precio y fuente, sector/ciclo. Verifica si el motor FCFF Simple Ginzu cubre la empresa. Si requiere FCFE bancario o SOTP, declara excepción y no inventes un DCF industrial. Busca y reutiliza la revisión y libros activos; solo si no existen, copia por separado las tres plantillas oficiales. Crea ficha de fuentes, identificadores H1/H2/H3 y mapa de captura.

**F2 — Históricos:** carga en H1 hasta diez FY más LTM, con Income Statement, Balance Sheet, Cash Flow Statement, ratios, precios por período, acciones y fuente/celda/fecha/unidad. Reconcilia balance, EBIT, variación de caja y períodos; para flujos LTM usa FY anterior + YTD actual − YTD comparable; balance LTM es saldo al corte. Diferencia dato reportado, cifra incluida, N/A, pendiente y cero explícitamente probado. Copia un **snapshot unidireccional** FY-2/FY-1/FY/LTM a entradas autorizadas de H2, **sin IMPORTRANGE**, preservando desplegables, fórmulas, nombres y comentarios originales Damodaran. Verifica dato H1 ↔ entrada H2 y huella del motor antes/después.

**F3 — Valorar:** construye tres historias verdaderamente distintas **Conservadora, Base, Optimista**, probabilidad total 100%, un costo de capital común; probabilidad de fracaso solo en Conservadora, sin doble conteo. Justifica crecimiento anual, márgenes, reinversión, Sales-to-Capital, ROIC existente/marginal/terminal, WACC/Ke, tasa libre, g terminal, impuestos, capitalización I+D, arrendamientos, NOL, SBC/opciones, deuda y segmentos aplicables con evidencia, contraevidencia, celdas y efecto económico. Mantén **intacto el motor y las fórmulas de Damodaran**; los ajustes JMR van en hojas auxiliares. Ejecuta DCF FCFF, inverso, cinco múltiplos prioritarios aplicables (EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF) con valores presentes FY+1/2/3, anclas y matrices 5×5, más tres matrices DCF Base 5×5 (WACC×g, ROIC terminal×g, crecimiento×margen). Justifica N/D o N/A. **El valor intrínseco principal es DCF Base; precio con MOS 35% = 0,65 × DCF Base.** El esperado y los múltiplos son secundarios; no ajustes hipótesis para acercar DCF al precio.

**PRESENTACIÓN OBLIGATORIA:** H2 debe iniciar con una hoja titulada exactamente **Presentación**; solo lectura, sin imágenes. Muestra precio de referencia y fecha, DCF Base, MOS35%, valores Conservadora/Base/Optimista, valor esperado, múltiplos como contraste, WACC, crecimiento, márgenes, ROIC, reinversión, Sales-to-Capital, estado de controles y enlaces H1/H3 si están verificados. Todo resultado se enlaza con fórmulas a H2; prohibido pegar valores de otra revisión. Verifica que el DCF Base y MOS coinciden con la hoja de cálculo, no solo su apariencia.

**F4 — Analizar y preparar publicación:** escribe H3 **Nivel 1 (14 capítulos narrativos)** y **Nivel 2 (12 apartados cuantitativos reproducibles)** según el contrato editorial. Incluye ciclos corporativos Damodaran, macro/monetario/crédito y sentimiento Howard Marks, historias→números, evolución 10 años, matrices, múltiplos, fórmulas, fuentes/celdas, reservas y contradicciones. Reconcílialo con H1 y H2 de **esta revisión**. Construye JSON/catálogo con `perfil_valoracion=Floyd`, `contratoLibros=floyd-h1-h2-separados-v1`, tres URL reales y `hojaGoogle` apuntando H2. Valida hojas → JSON → app, pruebas y puerta de publicación. **Solo si todos los controles materiales pasan**, publica como **EN_REVISION** y reemplaza exclusivamente la ficha activa de esa empresa; archiva las versiones previas conservando trazabilidad y diseño de siete pestañas. Si falla un gate material, entrega CANDIDATO y bloqueos demostrados: nunca afirmes que se publicó.

**F5 — Independiente:** otra sesión/agente revisará tesis y supuestos, DCF, ROIC/reinversión, terminal, múltiplos, materiales y fuentes, sin autocertificación ni cambios encubiertos.

**Entrega y continuidad:** cada fase escribe `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` con revisión, H1/H2/H3 verificados, rama/PR/commit, entradas→fórmulas→resultados, cambios antes/después, pruebas APROBADO/PARCIAL/NO_EJECUTADO, fuentes/fechas, materialidad, valores Base/esperado/MOS, primera acción siguiente y estado. Mantén una sola versión activa por ticker. Reporta avances concretos y bloqueos sin pedir confirmaciones innecesarias; distingue los cambios realizados de su verificación, fusión y despliegue.

**No negociables:** no borrar ni corromper libros activos; no duplicar expedientes; no cambiar fórmulas/notas originales Damodaran; no usar cifras sin fuente ni ceros inventados; no publicar con matrices ficticias, incoherencias H1/H2/H3, fallos de integración o revisión pendiente material. Evita crear documentos adicionales fuera del esquema de tres.

## Orden corta para uso recurrente
**«Valora y analiza [TICKER] con el Modelo JMR Floyd y el esquema oficial H1 Históricos + H2 Valoración (con Presentación) + H3 Análisis. Lee las reglas, contrato, órdenes y el prompt maestro en GitHub; retoma la revisión activa, ejecuta F1–F4, valida integridad y publicación EN_REVISION. F5 será independiente. Usa las tres plantillas oficiales de la carpeta Plantillas Modelo JMR Floyd sin modificar los originales».**
