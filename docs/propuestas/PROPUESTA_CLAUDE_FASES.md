# Propuesta Claude — valoración JMR en cuatro fases

**Estado:** propuesta (2-nov-2026), no normativa. No modifica `modelo/REGLAS_VIGENTES.md` ni `docs/PROCESO_UNICO_JMR.md`; los tres prompts maestros siguen siendo la autoridad de contenido.
**Origen:** lecciones de NU-20261102-A12-R1 y R2. La mecánica salió bien con un modelo medio; los errores fueron de juicio y de rigor (Ke bajo, capital demasiado conservador, impuesto diferido detectado tarde, cifras escritas de memoria, fórmulas reemplazadas sin detectar) y casi todos los encontró la auditoría, no la construcción.

## Principios
1. Una fase por sesión. El usuario revisa la entrega antes de abrir la siguiente.
2. Quien audita no es quien valoró (otro agente u otro proveedor).
3. Ninguna cifra entra al análisis sin fuente y celda; ninguna fórmula de la plantilla se reemplaza por un número sin quedar declarada.
4. El modelo importa menos que los datos y los controles: con datos profesionales (FactSet, S&P, Morningstar) los supuestos mejoran más que cambiando de modelo.

## Fases

| Fase | Contenido | Prompt maestro | Modelo y esfuerzo | Entrega para la fase siguiente |
|---|---|---|---|---|
| **1. Datos y hoja** | Fuentes primarias (10-K/20-F, 10-Q/6-K, 8-K/6-K posteriores), corte de mercado (precio, Treasury y prima de la misma fecha), copia limpia de la plantilla, estados completos, insumos con nota de fuente | — (habilidad `analisis-nuevo`, pasos 1–2) | Claude **Sonnet**, esfuerzo **medio** | Hoja con estados completos; inventario de insumos con fuente y celda |
| **2. Supuestos y valoración** | Ke o WACC con beta observada y de abajo hacia arriba, prima país vigente; crecimiento, márgenes normalizados, reinversión/capital y ROIC/ROE contrastados con historia y consenso; cuatro historias; múltiplos con anclas; sensibilidades y DCF inverso | 1/3 Valoración | Claude **Opus**, esfuerzo **alto** | Hoja calculada, JSON desde captura con hash, tabla «supuesto → evidencia → alternativa → efecto» |
| **3. Análisis y publicación EN_REVISION** | Nivel 1 (14 capítulos) y Nivel 2 (12 apartados) con cifras de la misma revisión; controles del catálogo, CI y PR | 2/3 Análisis fundamental | Claude **Opus**, esfuerzo **alto** (redacción); **Sonnet medio** para captura, JSON, pruebas y PR | Revisión EN_REVISION en el catálogo; lista de salvedades |
| **4. Auditoría económica** | 18 secciones, dictamen VERIFICADO / CON RESERVA MATERIAL / PENDIENTE; hallazgos con efecto cuantificado en ambas direcciones | 3/3 Auditoría | **Otro agente**: Claude Opus en sesión nueva sin el contexto de la valoración, o un LLM de otro proveedor; esfuerzo **alto** | Informe de auditoría; decisiones para una revisión siguiente |

## Controles de cierre por fase
- **Fase 1:** `estados_completos` = 0; insumos con fuente y celda; precio, Treasury y prima de la misma fecha.
- **Fase 2:** diff de fórmulas contra la plantilla (ninguna fórmula → número sin declarar); recálculo independiente = hoja; centros de matrices = Base; cada supuesto contrastado con historia de 3/5 años y con el consenso, y revisado en ambas direcciones (agresivo y prudencia duplicada).
- **Fase 3:** cada cifra del texto sale del JSON o lleva fuente verificada; workflows del repositorio completos en local antes del PR; CI en verde antes de fusionar.
- **Fase 4:** el auditor no reutiliza el código ni las conclusiones del valorador; marca [NO VERIFICADO] lo que no comprobó.

## Lo que esta propuesta no resuelve
- No hay comparación medida contra modelos de otros proveedores; la elección de Claude por fase se basa en lo observado en NU, no en una prueba controlada.
- La calidad de los datos de mercado (CDS, consenso, betas) depende de las conexiones disponibles.

## Invocación por fases
Cada fase se ejecuta con una frase («Empieza el análisis de <TICKER> en fase 1», «Sigue con <TICKER> en fase 2», «… en fase 3», «Audita <TICKER> en fase 4»). Las instrucciones de cada fase y el formato de traspaso están en [`fases/`](fases/README.md). Claude Code: habilidad `fase-jmr`.
