# Modo ChatGPT — cómo ejecutar las cuatro fases desde ChatGPT

**Estado:** vigente; actualización de continuidad operativa del 2-nov-2026. Verificar las herramientas reales de cada sesión antes de declarar una limitación. Las reglas y controles son los de [README](README.md) y los tres prompts maestros; este archivo solo adapta la forma de ejecutarlos.

## 1. Instrucciones del proyecto (pegar una vez)
Crear en ChatGPT un proyecto «JMR» y pegar como instrucciones:

```
Eres el ejecutor de UNA fase del proceso JMR. Cuando el usuario diga «Empieza el análisis de <TICKER> en fase 1», «Sigue con <TICKER> en fase 2/3» o «Audita <TICKER> en fase 4»:
1. Lee el archivo de esa fase (FASE_<N>_*.md) y el README de fases, adjuntos al proyecto. Si tienes el prompt maestro de la fase (1/3, 2/3, 3/3), léelo también: prevalece.
2. Ejecuta la fase solicitada; si el usuario pide varias, ejecútalas en orden. Recupera los pendientes previos necesarios. Mantén independiente la auditoría.
3. Ninguna cifra sin fuente (documento, período, celda). Lo no verificado: [NO VERIFICADO].
4. Si un control exige un script o una herramienta que no tienes, NO lo omitas en silencio ni lo des por pasado: márcalo «NO EJECUTADO — requiere <herramienta>» y deja la fase BLOQUEADA o «CERRADA CON CONTROLES PENDIENTES», según el README.
5. Nunca relajes un control. Nunca marques AUDITADO.
6. Termina con FASE_<N>_ENTREGA.md en el formato del README, incluyendo modelo y esfuerzo realmente usados.
```
Archivos a adjuntar al proyecto: `docs/propuestas/fases/*.md`, `modelo/REGLAS_VIGENTES.md`, `docs/PROCESO_UNICO_JMR.md` y los tres prompts de `docs/prompts/` (valoración v5, research v5, auditoría v1). Para emisores colombianos, también `colombia-nucleo-v1.md`.

## 2. Qué puede y qué no puede hacer ChatGPT, fase por fase

| Fase | Herramienta | ChatGPT hace | Si no tiene la herramienta |
|---|---|---|---|
| **1 Datos y hoja** | Chat con Google Sheets | Copia de la plantilla `vigente.ia` en `AAA Finanzas / Análisis / <TICKER>/`, estados completos con nota por celda, corte de mercado, inventario de insumos | Entrega el inventario y las celdas a pegar; el usuario (o Claude Code) copia la hoja |
| **2 Valoración** | Work, Astra/Sol alto | Escribe solo entradas en la hoja; el DCF/FCFE y sensibilidades salen de fórmulas; recálculo independiente | Sin código: recálculo «NO EJECUTADO»; la fase no puede quedar `CERRADA` |
| **3 Análisis y publicación** | Work | Redacta Nivel 1 (14 cap.) y Nivel 2 (12 apart.) desde la captura de la hoja y entrega los textos | **Promoción al catálogo, workflows locales, PR y CI: los hace Claude Code** (o una persona con git) con la frase «Sigue con <TICKER> en fase 3: publica los textos ya entregados» (la habilidad `fase-jmr` ejecuta solo los pasos de publicación) |
| **4 Auditoría** | Otro LLM (no ChatGPT) | — | Se hace en Claude Opus alto en sesión nueva (ver README) |

## 3. Controles de cierre: quién los ejecuta
| Control | Con código/repositorio | Sin ellos |
|---|---|---|
| `estados_completos`, `diff_formulas_plantilla`, `integridad_hojas`, `inputs_completos`, `candados`, `controles_supuestos` | ChatGPT los corre (si tiene Python y JMR-valuation) | Se marcan «NO EJECUTADO»; los corre Claude Code antes de cerrar la fase |
| Revisión manual de la hoja | Siempre posible | Compara contra la plantilla vigente celda a celda en las pestañas listadas; dejar la lista en la entrega |

Una fase con controles «NO EJECUTADO» **no está `CERRADA`**: queda `CERRADA CON CONTROLES PENDIENTES` y se puede continuar preparando la siguiente como CANDIDATO si los insumos mínimos están verificados. Aplicar «Continuidad y cierre operativo» del README; no promover hasta pasar los gates.

## 4. Dónde queda la entrega
- ChatGPT escribe `FASE_<N>_ENTREGA.md` en el chat y, si tiene acceso, como pestaña de texto «ENTREGA FASE N» en la hoja de la empresa.
- El usuario la copia a `Modelo-JMR-datos/candidatos/valoraciones/<REV>/` (o pide a Claude Code «guarda la entrega de la fase N de <TICKER>»).
- La fase siguiente, en cualquier herramienta, parte solo de esa entrega, la hoja y el repositorio.

## 5. Flujo completo con un ejemplo
1. «Empieza el análisis de XYZ en fase 1» → ChatGPT chat: hoja, estados, corte, inventario; entrega fase 1.
2. Revisas la entrega. «Sigue con XYZ en fase 2» → ChatGPT Work: supuestos, valoración, entrega fase 2.
3. Revisas. «Sigue con XYZ en fase 3» → ChatGPT Work: textos N1/N2. Luego, en Claude Code: «Publica XYZ fase 3» (promoción, controles, PR).
4. «Audita XYZ en fase 4» → Claude Opus en sesión nueva (o otro LLM no ChatGPT).

## 6. Riesgos conocidos
- Cambiar de herramienta entre fases pierde contexto: por eso todo se traspasa por archivo.
- El modo Astra/Sol y la escritura en Sheets del chat no están verificados aquí; la primera ejecución real debe revisarse celda a celda con `diff_formulas_plantilla`.
- Sin código, ChatGPT puede reemplazar fórmulas de la plantilla por números (error ya ocurrido en NU): exigir que escriba solo celdas de entrada.

## Recuperación autónoma y cierre
Buscar entregas también en Drive y archivos persistentes. Si falta el documento formal, reconstruirlo desde evidencia verificable. Usar scripts oficiales o documentar pruebas equivalentes y sus límites. No enviar al usuario a otra herramienta antes de intentar resolver lo que permite esta sesión. BLOQUEADA se reserva para faltas materiales que impiden el entregable; el research completo sin promoción puede cerrarse CON CONTROLES PENDIENTES.
