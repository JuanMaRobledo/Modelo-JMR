# Contrato único de ejecución · Modelo JMR Floyd
**Versión:** 1.1 · 9-nov-2026 · **aplica idénticamente a ChatGPT (chat/Work), Claude (chat/Code) y cualquier agente conectado.**

## Plantillas oficiales, hoja Presentación y flujo de tres documentos · 9-nov-2026

Las **tres plantillas oficiales** viven en [Plantillas Modelo JMR Floyd](https://drive.google.com/drive/folders/16NLCP68hZ6axQPZnf4eYi4Lx4tUH-57u) dentro de Google Drive → Modelo JMR Floyd; no se escribe sobre los originales:

| Documento | Plantilla maestra inmutable | Propósito |
|---|---|---|
| **H1 · Históricos** | [Históricos, diez FY + LTM](https://docs.google.com/spreadsheets/d/1vYi0o9-jVdKNO27t7MsmwESqCHiXSwZGcDVjgiaytKA/edit) | Ingresos, balance, caja, ratios, procedencia y conciliaciones. |
| **H2 · Valoración** | [Damodaran + JMR con Presentación](https://docs.google.com/spreadsheets/d/11KqYtCY9q2sveWmk5qMEhDEoa_mDhuo1LQSc6I1z9gE/edit) | DCF Simple Ginzu original, hipótesis, tres historias, cinco múltiplos y sensibilidad. |
| **H3 · Análisis** | [Artículo Nivel 1 + soporte Nivel 2](https://docs.google.com/document/d/13TJsT-I5bieP-tgvYYo6N_QG5O-seUHUxYC7KzGEF6A/edit) | Un solo Google Doc con 14 capítulos N1 y 12 secciones N2. |

**Contrato de ubicación:** por ticker, guardar copias de H1/H2/H3 como tres documentos de trabajo activos bajo `Modelo JMR Floyd/Análisis/<TICKER>`. Todos comparten ticker, revisión, moneda y cortes. Las entregas y JSON son artefactos de soporte en el repositorio; no son un cuarto documento maestro. Si la revisión ya tiene libros, **reutilizarlos**, conservar sus IDs y reconciliarlos; no crear nuevas copias.

**Hoja obligatoria:** la primera pestaña del libro H2 se llama exactamente `Presentación`; no admite imágenes ni importación de valores pegados. Su lectura es solo fórmulas locales y metadatos verificables. Encabezar con precio de mercado fechado, valor intrínseco DCF Base y precio con MOS 35 % = `0,65 × DCF Base`; después Conservadora/Base/Optimista, esperado ponderado, múltiplos secundarios y principales motores económicos. **La Presentación no reemplaza ni modifica el motor `Valuation output` / `Input sheet`**. Comprobar expresamente igualdad de salidas `Presentación` ↔ `Escenarios e historias` ↔ `Valuation output`.

**Secuencia:** F1 identifica/reutiliza o copia **tres plantillas oficiales**; F2 captura y concilia H1, transfiere snapshot unidireccional FY-2/FY-1/FY/LTM a H2 (no `IMPORTRANGE`); F3 determina hipótesis, calcula DCF/múltiplos y verifica Presentación; F4 escribe H3, concilia la terna con JSON/catálogo/app y publica `EN_REVISION` solo si pasan gates; F5 es auditoría independiente. El análisis sigue un solo documento con dos niveles, no dos Google Docs.

**Prompt maestro único:** [PROMPT_MAESTRO_FLOYD_TRES_DOCUMENTOS.md](prompts/PROMPT_MAESTRO_FLOYD_TRES_DOCUMENTOS.md), para ChatGPT, Work y Claude; evita rutas de hojas distintas entre ejecutores. Si aparece una guía heredada A-1.2 de **cuatro escenarios**, para Floyd prevalece la regla de tres (Conservadora, Base, Optimista) de §0 de `REGLAS_VIGENTES`. El libro H1 ofrece renglones y estructura, no avala datos no conciliados; su validez se verifica en la revisión específica.

## Autoridad y principio de paridad
Esta es la **única secuencia operativa para el perfil Floyd**, con independencia del proveedor, modelo, ventana, sesión o nivel de razonamiento. Las reglas económicas y de publicación pertenecen a [`modelo/REGLAS_VIGENTES.md`](../modelo/REGLAS_VIGENTES.md) (§0, §0A–0D, §1–§12), que prevalece; el detalle de cada fase corresponde a [`docs/prompts/ordenes-floyd.md`](prompts/ordenes-floyd.md). El análisis sigue [`docs/prompts/research-fundamental-jmr-v5.md`](prompts/research-fundamental-jmr-v5.md) y [`docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md`](ESTILO_ANALISIS_FUNDAMENTAL_JMR.md). F5 sigue [`docs/prompts/auditoria-economica-jmr-v1.md`](prompts/auditoria-economica-jmr-v1.md).

**No existen «flujo de Claude» y «flujo de ChatGPT» separados.** Ambos consumen el mismo contrato y los mismos artefactos; los prompts de cada plataforma solo sirven de punto de entrada. Los documentos históricos A-1.2 de cuatro/cinco fases no se invocan para un expediente Floyd. La herramienta ejecutora puede cambiar; las etapas, los cálculos del motor, los gates y el formato de salida no.

## Regla de alcance y continuidad
- **Floyd** es el perfil oficial para nuevas valoraciones de empresas operativas que cubre el motor FCFF Simple Ginzu. Los emisores financieros/holdings que todavía requieren otro motor se registran como excepción técnica, no se les inventa un DCF Floyd industrial.
- Resolver **ticker, revisión, clase, mercado, moneda, FY/LTM, cotización fechada y etapa** antes de modificar cualquier archivo. Consultar primero `Modelo-JMR-datos/catalogo.json` y `registro/REVISIONES.md`: una revisión activa por ticker; lo archivado es antecedente, nunca insumo mecánico.
- Si el usuario pide «valora y analiza X con Floyd», completar **F1→F2→F3→F4** de forma ordenada y sin detenerse artificialmente entre fases. Si pide una sola fase, ejecutar esa fase. Si pide continuar, leer las entregas existentes y reanudar desde el **primer control realmente pendiente**. F5 se realiza después, por revisor/sesión independiente.
- Cada agente debe declarar **identidad del modelo/herramienta, esfuerzo identificable y acceso realmente disponible**. No atribuir a otra IA acciones que no estén verificadas ni afirmar resultados futuros.
- La diferencia entre el acceso a GitHub/Drive/SEC/Vercel de ChatGPT o Claude es **capacidad del entorno**, no diferencia de método. Si una herramienta no está disponible, registrar `NO_EJECUTADO`, alternativa probada y evidencia pendiente, sin declararlo APROBADO.

## Cinco fases Floyd · orden invariable
| Fase | Operación obligatoria | Salida |
|---|---|---|
| **F1 · Corte y preparación** | Identidad, fuente primaria, fechas, corte, moneda, tres **plantillas oficiales H1/H2/H3**, copias aisladas y mapa de insumos; verificar que FCFF cubre el negocio. | `CANDIDATO`, plan H1/H2, F1 entrega |
| **F2 · Históricos + traspaso** | **H1:** libro separado de **Históricos**, hasta 10 FY + LTM con fuentes, clasificaciones y conciliación; **H2:** traslado unidireccional FY-2/FY-1/FY/LTM al libro de **Valoración** sin `IMPORTRANGE`, sin alterar fórmulas/selectores y con pruebas de integridad. | `CANDIDATO`, ambos IDs y F2 entrega |
| **F3 · Supuestos y cálculo** | «Historias → números» Damodaran; **Conservadora, Base, Optimista** (sin cuarto escenario computado como historia Floyd), probabilidad total 100 %, fracaso solo en Conservadora, un costo de capital común, crecimiento/márgenes/ROIC/reinversión/Sales-to-Capital, I+D/leases/opciones; motor original DCF, inverso, cinco múltiplos aplicables y matrices 5×5; **MOS 35 % del DCF Base**, no del esperado. | `CANDIDATO_REVISADO`, fotografía y F3 entrega |
| **F4 · Investigación y publicación** | **Un documento H3: Nivel 1: 14 capítulos narrativos; Nivel 2: 12 apartados reproducibles** (incluyendo ciclos de empresa, macro, monetario, crédito/mercado y sentimiento); **Nivel 2: 12 apartados reproducibles**, fuentes, cifras, fórmula, escenarios, múltiplos y sensibilidades **de esta revisión**. Conciliar libros→JSON→app, ejecutar gates y publicar la pareja valoración/análisis como `EN_REVISION` únicamente cuando pase. | Una ficha, siete pestañas, estado `EN_REVISION`, F4 entrega |
| **F5 · Auditoría económica independiente** | Sesión/agente revisor distinto del constructor; observaciones del usuario, recálculo de tesis y supuestos, fuentes, matrices, terminal y materialidad. No modificar a escondidas la valoración y no autocertificar. | Dictamen `VERIFICADO`, `CON RESERVA MATERIAL` o `PENDIENTE`; F5 entrega |

## Contrato de datos idéntico para todos los tickers
Cada valoración Floyd publicada (`Modelo-JMR-datos/valoraciones/<REV>.json`) registra obligatoriamente:
```json
{
  "ticker": "<TICKER>",
  "revisionId": "<REV>",
  "perfil_valoracion": "Floyd",
  "version_metodo": "Floyd",
  "contratoLibros": "floyd-h1-h2-separados-v1",
  "libros": {
    "historicos": "https://docs.google.com/spreadsheets/d/<ID_H1>/edit",
    "valoracion": "https://docs.google.com/spreadsheets/d/<ID_H2>/edit",
    "analisis": "https://docs.google.com/document/d/<ID_DOC>/edit"
  },
  "estado": "EN_REVISION"
}
```
El ejemplo expresa el **esquema**, no URLs ni revisiones reales. Los IDs H1/H2 son diferentes; `hojaGoogle` y `sheet_id` apuntan al libro **Valoración**. El archivo `analisis/<TICKER>-research-<REV>.json` tiene igual `ticker`/`revisionId`, `linkedValuation.sourcePath`, `documentos.nivel1` y `documentos.nivel2` correspondientes al documento. No inventar URLs, citas ni evidencias.

La ficha existente conserva **siete pestañas**; estados financieros y ratios históricos leen H1, valoración, sensibilidad, modelo y otros resultados leen H2, y el análisis usa la revisión editorial emparejada. Sin un libro no sustituir silenciosamente por otro. El archivo `archivoFloyd` conserva todas las versiones previas sin borrarlas; no exponerlas como activas por búsqueda de nombres.

## Entregables por etapa e intercambio entre agentes
**Ruta única en GitHub:** `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` (F1 a F5). Cada entrega, ya sea escrita por Claude o ChatGPT, registra:
1. Ticker, revisión, `perfil_valoracion=Floyd`, corte contable/precio, fecha, agente/modelo/esfuerzo y fase.
2. IDs y enlaces verificados de H1, H2, documento de análisis; rama, PR, commit y enlaces de fuentes primarias.
3. `PASOS: n/n`, `AISLAMIENTO=OK` solo si se verificó, y controles `APROBADO/PARCIAL/NO_EJECUTADO` con evidencia reproducible (comando, resultado, celda, fuente, fecha).
4. Historia causal de cada supuesto material, datos/estimaciones diferenciados, resumen de cambios antes→después, DCF Base, esperado, MOS, sensibilidades y reservas.
5. Faltantes materiales vs secundarios, **primer siguiente paso exacto** y estado `CANDIDATO / CANDIDATO_REVISADO / EN_REVISION / PENDIENTE_F5`.

**Regla de traspaso:** la IA sucesora lee `catalogo.json`, el expediente `<REV>`, las entregas y las fuentes/hojas antes de editar. No vuelve a crear libros ni valoraciones, no mezcla revisiones y no considera una fase terminada solo por su nombre. Si hay trabajo concurrente, usar rama/PR y no sobrescribir el mismo archivo sin actualizarse. Los cambios se integran a repos oficiales, no en una conversación privada como única evidencia.

## Puerta de publicación universal, independiente del agente
1. Hoja/Fórmulas: H1 y H2 reales, distintos, fuente y corte rastreables; fórmula y huella intactas, entradas correctas. **No** certificar un control no ejecutado.
2. Economía: tres historias, probabilidades, Base y MOS, materialidad, tres centros DCF, cinco matrices de múltiplos según aplicabilidad, anclas/estado; documentar `N/D` y `N/A`.
3. Artículo: Nivel 1 y Nivel 2 no son resúmenes genéricos; pertenecen a la misma revisión y valores del modelo; distinguir brechas editoriales de calidad.
4. Integración: scripts/tests oficiales, `validar_catalogo.cjs`, `validar_profundidad_floyd.cjs` cuando procedan, hojas ↔ JSON ↔ catálogo ↔ app y estado publicado confirmado. La CI verde **no** prueba por sí sola auditoría económica F5 ni QA visual autenticado.
5. Si falla un control material, continuar los tramos independientes como **CANDIDATO** y no publicar una ficha incorrecta. Si la solicitud autoriza publicar, la promoción `EN_REVISION` se realiza cuando los gates estén aprobados; después F5 independiente. Las valoraciones antiguas quedan archivadas, no eliminadas.

## Ejecución desde cualquier plataforma
**ChatGPT / Work:** «Ejecuta la valoración y el análisis Floyd de <TICKER> con el contrato de `Modelo-JMR/docs/CONTRATO_EJECUCION_FLOYD.md`. Retoma la revisión existente, ejecuta F1–F4 y valida los gates. Deja F5 para un auditor independiente».

**Claude / Claude Code:** **exactamente la misma orden**, con los mismos IDs, mismas entregas, mismas reglas económicas y misma autorización de publicación.

**Criterio de aceptación:** si se intercambian los agentes después de F2 o F3, el siguiente produce el mismo formato de expediente, continúa desde la fase pendiente y tiene los mismos gates, sin necesidad de traducir prompts ni migrar datos.
