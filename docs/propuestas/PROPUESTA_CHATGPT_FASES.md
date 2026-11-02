# Propuesta ChatGPT — valoración JMR en cuatro fases

**Estado:** propuesta (2-nov-2026), no normativa. Mismas cuatro fases y mismos controles que la [Propuesta Claude](PROPUESTA_CLAUDE_FASES.md); cambia la herramienta de cada fase. No modifica `modelo/REGLAS_VIGENTES.md` ni `docs/PROCESO_UNICO_JMR.md`.

> **Aviso de quien la redacta (Claude):** no tengo información verificada sobre las capacidades actuales de ChatGPT Work ni sobre los modos «Astra alto» y «Sol alto». La asignación sigue la indicación del usuario; la elección entre Astra y Sol se deja a una prueba concreta (ver al final), no a una opinión.

## Fases

| Fase | Contenido | Prompt maestro | Herramienta | Requisito para que funcione | Entrega |
|---|---|---|---|---|---|
| **1. Datos y hoja** | Fuentes primarias, corte de mercado de una misma fecha, estados completos con fuente por cifra | — | **ChatGPT (chat)** | El chat reúne y verifica los datos, pero si no puede escribir en Google Sheets ni ejecutar los scripts del repositorio, la carga en la hoja la hace otra herramienta con acceso (Work o Claude Code) a partir de una tabla de insumos con fuente y período | Tabla de insumos con fuente, período, escala y celda de destino; hoja con estados completos |
| **2. Supuestos y valoración** | Ke con beta observada y de abajo hacia arriba y prima país vigente; crecimiento, márgenes, reinversión/capital y ROE contrastados con historia y consenso; cuatro historias; múltiplos; sensibilidades y DCF inverso | 1/3 Valoración | **ChatGPT Work, modo Astra alto o Sol alto** | Acceso de escritura a la hoja y a GitHub, o un paso explícito de traslado; los resultados deben salir de fórmulas de la hoja, no del modelo | Hoja calculada; JSON desde captura con hash; tabla «supuesto → evidencia → alternativa → efecto» |
| **3. Análisis y publicación EN_REVISION** | Nivel 1 (14 capítulos) y Nivel 2 (12 apartados) con cifras de la misma revisión; controles del catálogo, CI y PR | 2/3 Análisis fundamental | **ChatGPT Work, mismo modo que la fase 2** | Ejecutar los workflows del repositorio (`node scripts/...`) antes del PR; si no puede, dejar el PR en borrador para que otra herramienta los corra | Revisión EN_REVISION en el catálogo; lista de salvedades |
| **4. Auditoría económica** | 18 secciones; dictamen VERIFICADO / CON RESERVA MATERIAL / PENDIENTE; hallazgos cuantificados en ambas direcciones | 3/3 Auditoría | **Otro LLM** (no ChatGPT): recomendado **Claude Opus, esfuerzo alto**, en sesión nueva con acceso de lectura a la hoja y al repositorio | Independencia real: no ve la conversación de las fases 2 y 3, solo la hoja, el JSON y el análisis publicados | Informe de auditoría; decisiones para una revisión siguiente |

## Controles de cierre (idénticos a la Propuesta Claude)
- **Fase 1:** `estados_completos` = 0; insumos con fuente y celda; precio, Treasury y prima de la misma fecha.
- **Fase 2:** diff de fórmulas contra la plantilla; recálculo independiente = hoja; centros de matrices = Base; cada supuesto contrastado con historia y consenso, en ambas direcciones.
- **Fase 3:** cada cifra del texto sale del JSON o lleva fuente verificada; workflows completos antes del PR; CI en verde antes de fusionar.
- **Fase 4:** el auditor no reutiliza código ni conclusiones del valorador; marca [NO VERIFICADO] lo que no comprobó.

## Riesgos propios de esta combinación
1. **Traspaso entre herramientas en la fase 1:** si el chat no escribe en la hoja, cada cifra pasa por una tabla intermedia; el riesgo es de transcripción. Mitigación: la herramienta que carga la hoja compara contra la tabla y contra la fuente.
2. **Acceso de Work al ecosistema JMR:** la hoja usa configuración regional es_ES (fórmulas con «;») y la cuenta de servicio no puede crear archivos; la copia de la plantilla la hace el usuario o un conector de Drive.
3. **Desconocimiento de los modos Astra/Sol:** no hay evidencia en este repositorio de cómo rinden en valoración bancaria o con las reglas JMR.

## Cómo elegir entre Astra alto y Sol alto
Correr la **fase 2 de una empresa ya valorada** (por ejemplo NU con los datos de la R2) en ambos modos, sin mostrarles la R2, y comparar:
- qué supuestos contrastan con evidencia y cuáles afirman sin fuente;
- si detectan el impuesto diferido del 1S26, la densidad creciente del APR y la prima país desactualizada;
- cuántas cifras erróneas o inventadas aparecen (verificadas contra el 20-F y el 6-K).
Se elige el modo con menos errores verificables, no el que llega al valor más parecido a la R2.
