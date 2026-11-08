# Órdenes de ejecución · Modelo JMR Floyd (perfil oficial)

## Selecciona el perfil antes de ejecutar

Para una valoración nueva de una empresa operativa cubierta por Simple Ginzu FCFF, usa Floyd por defecto. Si el usuario elige otro perfil o la tarea continúa una revisión ya identificada, respeta ese perfil. Registra `perfil_valoracion=Floyd`, ticker, clase, revisión, corte y fase. Las financieras, holdings y otros emisores cuyo motor requerido no esté cubierto por Floyd siguen el flujo compatible FCFE/SOTP. Distingue el perfil operativo del método de estimación de supuestos. Lee las reglas generales vigentes de fuentes, aislamiento, integridad, materialidad y trazabilidad. Para Floyd, aplica las órdenes de este archivo en lugar de las instrucciones A-1.2 sobre valoración temprana en F1 y cuatro historias. Conserva el formato de entrega de fases.

Ejecuta la fase pedida. Si te piden varias, ejecútalas en orden y valida las dependencias antes de pasar a cada una. Si te piden una valoración Floyd integral sin número de fase, identifica el primer tramo pendiente y completa F1–F3 en orden. Si también te piden el análisis, continúa con F4 después de cerrar los insumos materiales. Reserva F5 para una sesión independiente que reciba el expediente. Mantén cada expediente como CANDIDATO hasta que cumpla los controles de su fase y los de publicación aplicables.

## F1 · Preparación del corte

1. Identifica ticker, clase, moneda, escala, último FY, corte LTM y fecha de mercado. Registra fuentes primarias, cotización fechada y el mapa de insumos materiales.
2. Comprueba la idoneidad del motor Simple Ginzu FCFF. Si el emisor exige un motor que Floyd todavía no cubre, registra el bloqueo de valoración y continúa con los datos verificables.
3. Localiza la revisión Floyd candidata. Si no existe, crea el expediente aislado y una copia de valoración desde la [Maestra Floyd de tres escenarios](https://docs.google.com/spreadsheets/d/157EabbntPVoydBgBZNjp90BBjoliGDOts2E0MxNVKSc/edit). Identifica la versión y huella esperada de la maestra. Entrega el mapa de carga para F2. Calcula el valor en F3.

## F2 · Históricos y traspaso

1. **H1.** Crea o reutiliza un libro separado de Históricos de esa revisión. Carga hasta diez FY y LTM de resultados, balance y flujo de caja con fuentes primarias y notas de reclasificación. Registra por partida material período, moneda, escala, fuente, celda y clasificación: reportada, incluida en otra línea, no aplicable o pendiente. Escribe cero solo si está sustentado. Usa fórmulas de la plantilla para ratios y registra precios históricos fechados.
2. Concilia balance, EBIT, variación de caja y LTM con fuentes. En flujos aplica FY anterior + acumulado actual − acumulado comparable. En balance usa el saldo al corte. Reproduce los ratios materiales en dos períodos y coteja ceros o ausencias en partidas sensibles.
3. **H2.** Traspasa FY-2, FY-1, FY y LTM desde Históricos a Valoración mediante una carga unidireccional, sin `IMPORTRANGE`. Verifica mapa de períodos, unidades, origen y destino. Escribe solo insumos en celdas habilitadas, preserva fórmulas, selectores y notas, y concilia la copia contra la fuente. Repite el control de integridad tras la carga. Si solo se invoca H1, entrega Históricos y deja H2 pendiente.

## F3 · Supuestos y valoración

1. Lee las entregas F1 y F2 y el marco [Historias a números](../HISTORIAS_A_NUMEROS.md). Cierra primero los faltantes que afecten materialmente el cálculo. Justifica cada palanca con mecanismo, evidencia y contraevidencia, rango, elección, celda e impacto. Registra antes → después para los drivers Base cuando exista una revisión comparable.
2. Revisa crecimiento, márgenes, ventas/capital, reinversión, ROIC existente, marginal y terminal, costo de capital y crecimiento terminal. Verifica I+D, arrendamientos, opciones, deuda, RSU, NOL y no operativos según aplique. Mantén un solo `Input sheet` y costo de capital común. Escribe las diferencias por escenario en `Escenarios e historias` o `Segmentos`.
3. Construye **Conservadora, Base y Optimista**. Usa probabilidades por etapa del ciclo ajustadas a tres historias y justifica desviaciones. Verifica que sumen 100 % y que Conservadora ≤ Base ≤ Optimista. Modela el fracaso solo en la Conservadora. Activa Segmentos cuando existan fuentes y diferencias económicas que lo justifiquen, y concilia ingresos, EBIT y reinversión con el consolidado.
4. Ejecuta DCF, DCF inverso, múltiplos JMR aplicables y sensibilidades 5×5. Concilia cada centro con su referencia y explica las excepciones por múltiplo. Separa DCF Base, valor esperado y múltiplos. Calcula MOS 35 % sobre el Base. Verifica la huella, las compuertas económicas y sus avisos con evidencia antes de declarar el resultado revisado.

## F4 · Análisis y expediente candidato

1. Comprueba que Históricos y Valoración están conciliados y que los supuestos materiales de F3 están cerrados. Usa ambos libros y el corte de esa misma revisión.
2. Aplica el contrato editorial del maestro 2/3. Redacta Nivel 1 y Nivel 2 con tres escenarios. Vincula tesis, ciclo, riesgos y evidencia a los supuestos y las cifras de la hoja. Rehaz borradores anteriores si cambiaron los datos o supuestos que los sustentan.
3. Prepara el JSON y valida hoja → JSON → visor en un entorno aislado. Si el visor o un validador aún exige el perfil A-1.2, registra el bloqueo de integración y conserva las tres historias. Publica como EN_REVISION solo si se aprobaron los controles técnicos y la conciliación del perfil Floyd con los datos y el visor, bajo §6 y §8A. Hasta entonces conserva el expediente como CANDIDATO.

## F5 · Auditoría independiente

1. Abre el expediente candidato por revisión y comprueba la independencia de la sesión. Si la sesión construyó el expediente, registra cualquier recálculo como control interno y deja el dictamen independiente PENDIENTE.
2. Aplica los controles del maestro 3/3 a los tres escenarios y a ambos libros. Reproduce cálculos, desafía las palancas materiales y el terminal, coteja fuentes, múltiplos, matrices y coherencia del análisis. Clasifica hallazgos con evidencia e impacto y emite el dictamen que corresponda. Entrega los ajustes al constructor para su resolución.

## Entrega y límites del perfil

Escribe `Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md` por fase. Registra IDs de los libros, documento y corte, herramienta/modelo/esfuerzo identificables, `AISLAMIENTO=OK` cuando esté verificado, pasos ejecutados, controles APROBADO/PARCIAL/NO EJECUTADO con evidencia, faltantes y siguiente acción. Declara el tramo material pendiente y deja N/D la salida dependiente. Si la limitación es inmaterial y está acotada, documenta el impacto y sigue. Conserva las fórmulas y reporta la huella observada.

H4 del plan Floyd (adaptar registro de plantillas, validadores, catálogo y app) es mantenimiento del perfil. Para copiar la maestra utiliza el ID de Floyd de F1 hasta que el registro técnico disponga de selección por perfil. Registra cualquier incompatibilidad como control pendiente de integración del expediente.

## Continuación conocida · UBER Floyd 3T-2026

Si el expediente sigue en el punto de partida documentado, reanuda **F2 · H1** para el corte del 30-sep-2026. Busca primero un libro de Históricos en la [carpeta de UBER](https://drive.google.com/drive/folders/1E4PrIP1tzLhd8fxVlUQLDBoJR5zTdrOA). Usa la [valoración candidata](https://docs.google.com/spreadsheets/d/1jMzDqRnTiBdbeFJmB0UH4aLdthBtC1JtiRhl8PEQBcg/edit) como referencia de conciliación y consulta el [prompt de captura](https://github.com/JuanMaRobledo/JMR-valuation/blob/ccr-e7bec77f-14giyk/reference/modelo_floyd_2026-11-08/PROMPT_CHATGPT_HISTORICOS_UBER.md) para rangos y fuentes del emisor.
