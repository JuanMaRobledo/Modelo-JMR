# Reglas vigentes del Modelo JMR

**Versión 38 · 10-nov-2026 (Floyd R1–R6, separación IA/cálculo).** Este documento es la única fuente de las reglas de método. Si un prompt
(`docs/prompts/*.md`), `METODOLOGIA.md`, una habilidad o un comentario de código dice otra cosa, prevalece este
documento. Una regla nueva no se agrega como «regla del día X» en un prompt: se cambia aquí, se sube la versión y se
anota en el registro de cambios del final.

**Doble método:** desde esta versión las valoraciones seleccionan `Método A` o `Método B` por revisión. La selección normativa y precedencia se describen en [`METODOS_VALORACION.md`](METODOS_VALORACION.md), con reglas particulares en [`METODO_A_JMR.md`](METODO_A_JMR.md) y copia íntegra del método anterior en [`METODO_B_JMR.md`](METODO_B_JMR.md). El presente documento mantiene las reglas **compartidas** de cálculo, plantilla y publicación. En el flujo compatible A-1.2 se aplica Método A, salvo elección expresa de B por el usuario; registrar y comunicar la selección antes de estimar. La interpretación B sin etiqueta se conserva exclusivamente para leer revisiones históricas, sin reclasificarlas ni recalcularlas.

## 0R. Perfil oficial: Modelo JMR Floyd R1–R6 (versión 39 · 11-nov-2026)

**§0R.0 · Libro único (11-nov-2026).** Por decisión expresa del usuario, las revisiones NUEVAS usan `contratoLibros=floyd-libro-unico-v1` (`docs/CONTRATO_FLOYD_LIBRO_UNICO.md`): un solo libro (Históricos, tres motores Damodaran, Múltiplos, Resumen y Presentación, con fórmulas entre pestañas) más el Doc A. Las reglas de abajo sobre seis archivos y `jmr-reboot-3libros-v1` rigen las revisiones heredadas hasta migrarlas. La IA conserva sus tres funciones; el `Input sheet` toma las cifras de la empresa de H por fórmula.

**Decisión expresa del usuario, 10-nov-2026:** el modelo desarrollado como «Reboot» se convierte en el **único Floyd oficial**. El Floyd F1–F5 anterior queda **LEGADO/ARCHIVADO** en `archivo-v1/` y sus tres plantillas anteriores quedan en carpeta marcada archivo-v1. La decisión no altera ninguna fórmula ni número histórico ni convierte revisiones no aprobadas en publicadas.

**Fuente de verdad:** `docs/CONTRATO_REBOOT_JMR.md` y `docs/prompts/ordenes-reboot.md` son los nombres técnicos históricos de los **contratos actuales Floyd R1–R6**. El prompt `docs/prompts/PROMPT_MAESTRO_REBOOT.md` funciona con la misma identidad oficial y todos los proveedores. §0, §0C y §0D describen métodos archivados y quedan subordinados en caso de conflicto.

**Seis archivos:** Históricos H, DCF Base D-B, Conservadora D-C y Optimista D-O (Simple Ginsu original de Damodaran), Múltiplos M (EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF; sin P/S ni P/BV), Análisis A (14 capítulos y 12 apartados). Copiar las plantillas oficiales desde la carpeta Drive `Plantillas Modelo JMR Floyd (R1–R6)`, ID `1fFlAbKsdMKfjPB_nPcc6Y-9hQ7tQj14t`.

**Seis fases:** R1 identidad/corte; R2 históricos; R3 historias y DCF con DCF inverso y sensibilidades 5×5; R4 múltiplos/presentación; R5 análisis/JSON/app y eventual `EN_REVISION` tras controles; R6 auditoría económica por agente o sesión independiente. Los supuestos nacen de historias → números, con ROIC, reinversión, ventas/capital, crecimiento, márgenes y WACC documentados. Tres escenarios, MOS 35% exclusivamente sobre DCF Base, WACC común, sin fórmulas alteradas; todos los traspasos con huella reproducible.

**Identificación técnica sin romper histórico:** nuevas valoraciones deben usar `perfil_valoracion=Floyd` y `contratoLibros=jmr-reboot-3libros-v1` (nombre del contrato creado durante Reboot; **conservar como identificador estable**). Los JSON anteriores con `perfil_valoracion=Reboot` y el mismo contrato se leen como alias del Floyd vigente y pueden migrarse sin cambiar `revisionId`. El Floyd F1–F5 usa `floyd-h1-h2-separados-v1` y no tiene tres DCF separados. La app resuelve según el contrato, no por el texto «Floyd».

**Prohibición de publicación prematura:** sin seis IDs y fuentes, integridad del motor, análisis R5, revisión económica y pruebas hoja→JSON→catálogo→app, mantener `CANDIDATO`; no mezclar datos del legado. El archivo histórico es de consulta únicamente.


### 0R.1. Reparto inmutable: la IA solo tiene tres funciones analíticas

**Toda valoración Floyd, en cualquier proveedor, reserva a la IA exactamente tres funciones:**
1. **Recopilar, verificar, clasificar y cargar los datos históricos primarios** de **10 ejercicios fiscales completos consecutivos siempre que existan**, más LTM si es posible. Registrar fuente, fecha, moneda, unidad, escala, nota, correspondencia contable y conciliación. No inventar años ausentes ni imputar ceros por falta de fuente.
2. **Proponer y justificar supuestos económicos** para los escenarios en entradas autorizadas, con historia → números, evidencia y contraevidencia, fuente, rango, efecto y fecha. Incluye crecimiento, márgenes, ROIC, reinversión, ventas/capital, WACC, terminal, probabilidades y pesos aplicables.
3. **Redactar el análisis cualitativo fundamental**, explicando tesis y supuestos. El Nivel 2 extrae y explica resultados automáticos de la misma revisión, sin calcular ni pegar cifras derivadas.

**El motor calcula, no la IA:** todos los ratios, indicadores, DCF, múltiplos, sensibilidades, escenarios, resúmenes y presentaciones derivan de fórmulas y vínculos internos ya establecidos. Las transferencias entre libros H→D, H→M, D-B→M y M/D-C/D-O→D-B utilizan las **automatizaciones predefinidas con huella y prueba de conciliación** del contrato Floyd: son infraestructura mecánica, no una cuarta función analítica. En la arquitectura actual los vínculos entre libros son sincronizaciones por script, **no necesariamente referencias en tiempo real**; una entrada cambiada exige propagar, recalcular y comprobar que el destino esté actualizado. Prohibido pegar manualmente salidas calculadas.

**El agente valorador no puede modificar la configuración:** durante una valoración no debe crear, eliminar, reordenar, renombrar ni modificar libros, tablas, hojas, fórmulas, vínculos, validaciones, selectores, rangos, comentarios, diseños, scripts o motores. Solo se escriben **datos primarios y supuestos en celdas de entrada expresamente permitidas de las copias de la revisión**, y texto del análisis. R1 permite copiar una plantilla oficial intacta, no rediseñarla. La generación mecánica de entregas, JSON, pruebas y publicación no amplía las tres funciones analíticas.

**Ante una rotura:** registrar celda/dependencia, evidencia, impacto y bloqueo; no corregir fórmulas ni arquitectura improvisadamente. Un cambio estructural requiere mantenimiento **separado y explícitamente autorizado**, con respaldo y pruebas de regresión. La publicación queda bloqueada si falla integridad de fórmulas, traspaso o vigencia de las dependencias.

## 0. PERFIL ARCHIVADO — Floyd F1–F5 (solo consulta)

**Advertencia:** todo este §0 y sus referencias F1–F5 son históricos. Para nuevas valoraciones y continuación de UBER rige §0R (Floyd R1–R6).

**Decisión del 8-nov-2026.** Floyd es el perfil oficial por defecto para nuevas valoraciones de empresas operativas cubiertas por Simple Ginzu FCFF. Aplica el perfil elegido expresamente por el usuario y respeta el perfil de toda revisión que se continúe. Para financieras, holdings y otros casos que requieren motores que Floyd todavía no cubre, usa el flujo compatible con FCFE/SOTP según corresponda. Los expedientes previos conservan método, cifras, hoja y estado hasta que se apruebe una revisión que los sustituya.

**Órdenes obligatorias:** [F1–F5 de Floyd](../docs/prompts/ordenes-floyd.md). En Floyd, F1 prepara corte y alcance. F2 concilia el libro de Históricos y traspasa FY-2, FY-1, FY y LTM al libro de Valoración. F3 valora tres escenarios (Conservadora, Base y Optimista), con costo de capital común, fracaso solo en Conservadora y módulo de segmentos cuando aplique. F4 redacta el análisis tras cerrar los insumos materiales y comprueba hoja, JSON y visor. F5 es independiente. Se conserva el MOS 35 % sobre el DCF Base.

**Contrato documental Floyd · 9-nov-2026:** exactamente **tres archivos maestros activos por revisión**: (H1) libro de Históricos de diez FY + LTM y fuentes, (H2) libro de Valoración preservando íntegramente el motor Damodaran Simple Ginzu y sus notas, y (H3) **un** documento de Análisis con Nivel 1 y Nivel 2. Las **tres plantillas oficiales** están en [Plantillas Modelo JMR Floyd](https://drive.google.com/drive/folders/16NLCP68hZ6axQPZnf4eYi4Lx4tUH-57u); [H1](https://docs.google.com/spreadsheets/d/1vYi0o9-jVdKNO27t7MsmwESqCHiXSwZGcDVjgiaytKA/edit), [H2](https://docs.google.com/spreadsheets/d/11KqYtCY9q2sveWmk5qMEhDEoa_mDhuo1LQSc6I1z9gE/edit) y [H3](https://docs.google.com/document/d/13TJsT-I5bieP-tgvYYo6N_QG5O-seUHUxYC7KzGEF6A/edit). Las copias vigentes van a `Modelo JMR Floyd/Análisis/<TICKER>`; una revisión activa por ticker, sin libros duplicados. **H2 debe empezar con la pestaña `Presentación`**, sin imágenes, de solo lectura, enlazada por fórmula al valor intrínseco DCF Base, cotización fechada, MOS35%=0,65×Base, escenarios, esperado y drivers; no sustituye `Valuation output`. El flujo F1–F5, los gates y la compatibilidad de app se rigen por [CONTRATO_EJECUCION_FLOYD](../docs/CONTRATO_EJECUCION_FLOYD.md) y [prompt maestro](../docs/prompts/PROMPT_MAESTRO_FLOYD_TRES_DOCUMENTOS.md). Las entregas y JSON de GitHub son soportes técnicos, no un cuarto documento maestro. No alterar revisiones preexistentes sin instrucción expresa.


Para Floyd prevalecen estas instrucciones sobre las cláusulas específicas de A-1.2 acerca de valoración inicial en F1, cuatro historias, probabilidad de Disrupción y formato de 47 pestañas. Conserva los controles comunes de fuentes, integridad, materialidad, cálculo y publicación. El estado oficial del **perfil** es distinto del estado de un **expediente**: para publicar una revisión Floyd en la app exige validadores compatibles con tres escenarios, conciliación y controles de §6 y §8A. Si falta evidencia técnica o financiera, la revisión sigue como CANDIDATO.

## Continuidad operativa de fases — 2-nov-2026

Por instrucción del usuario, la preparación de candidatos no se detiene automáticamente por una entrega formal ausente o un control técnico pendiente. Recuperar evidencia, resolver dependencias previas y completar el trabajo verificable. Admitir avance entre fases como CANDIDATO con insumos materiales comprobados, identificando controles oficiales, pruebas equivalentes y límites. Detener solo operaciones afectadas por datos materiales ausentes, fórmulas rotas o discrepancias no resueltas. Nunca certificar un control no realizado. Las reglas de cálculo y los gates de promoción/publicación se conservan íntegros. Detalle operativo en [README de fases](../docs/propuestas/fases/README.md), «Continuidad y cierre operativo». Esta actualización reemplaza las puertas documentales absolutas anteriores, no modifica A-1.2 ni concede autorización de publicación.

## 0A. Integridad verificable de datos — obligatoria para cualquier IA

- **Completo no significa relleno.** Una celda no vacía —en especial un `0`— no demuestra que el rubro esté capturado. La Fase 1 coteja las partidas SEC/NIIF estrictamente necesarias para Input/DCF/múltiplos; la Fase 2 completa el cotejo histórico por período, moneda y clasificación de hoja: ventas, costo de ventas/ingresos, SG&A, I+D, D&A, SBC, deuda, arrendamientos, CFO, inversión y financiación. Registrar reporte, página/nota, período, escala, celda y regla de traslado.
- **Cuatro estados para una partida sin cifra separada:** cero explícito publicado, incluida en otra línea (indicar línea y conciliación), no aplicable con justificación, o pendiente de verificar. Está prohibido llamar `0 económico` a «no desglosado» y prohibido sustituir ausencia de fuente por un cero. Los hallazgos pendientes se conservan identificables.
- **Prueba contra reclasificaciones ficticias:** cuando una partida reportada está escondida en «Other Operating Expenses» u otro agregado, trasladarla sin duplicarla y demostrar estabilidad de EBIT, CFO y DCF por el mero cambio de presentación. Los totales que cuadran no prueban por sí solos que todas las categorías estén bien.
- **Dos validaciones complementarias, nunca intercambiables:** `estados_completos.py` busca huecos; `auditar_ceros_materiales.py` alerta sobre ceros o vacíos sin evidencia; adicionalmente `auditar_estados_sec.py` / `auditar_estados_ifrs.py` y el cotejo humano/IA con informes primarios verifican cifras y definiciones. Guardar resultados por ticker, revisión y `sheet_id`. Un control no ejecutado se declara y no se presume aprobado.
- **Puerta de publicación:** no promover `EN_REVISION` cuando quede sin resolver un dato o reclasificación material que afecte la valoración o no permita acotar su impacto; se admite investigación como `CANDIDATO` conforme a continuidad operativa. Esta exigencia aplica por igual a ChatGPT, Claude y cualquier otro ejecutor y no modifica A-1.2, fórmulas ni el MOS.

## 0B. Arquitectura de cálculos: datos primarios, fórmulas y trazabilidad de indicadores

- **Capas obligatorias para cualquier IA:** (1) dato externo capturado (estados oficiales, precio fechado, acciones y tasas) como entrada con fuente/corte/unidad/nota; (2) indicadores financieros derivados calculados con **fórmulas nativas en Sheets/Excel**, nunca pegados como resultados; (3) fotografía de salida identificada por revisión, corte y versión de fórmula para JSON, análisis y auditoría. La hoja sigue siendo fuente de los cálculos.
- **Prohibido sustituir fórmulas por números:** ROIC, ROE, ROA, NOPAT, capital invertido promedio, márgenes, rentabilidad, crecimiento, eficiencia, salud financiera y `Trailing Valuation` (market cap, EV, P/E, EV/EBITDA, P/FCF, P/OCF, P/BV y otros múltiplos) deben salir de fórmulas rastreables. La IA puede calcular comprobaciones independientes, pero no pegarlas encima. Si la plantilla ya trae fórmulas correctas, preservarlas.
- **Precisar denominadores y fechas:** ROE/ROA usan media de saldos inicial/final; ROIC debe declarar NOPAT, capital invertido promedio y tratamiento de caja excedentaria, goodwill, leases, I+D y SBC. Trading/trailing multiples requieren un **precio de cierre fechado para cada período** y acciones con split aplicado; no usar precio de hoy sobre beneficios de 2018 y llamarlo múltiplo histórico. Un denominador cero/no disponible produce N/D o vacío explicado, nunca múltiplo artificial. Diferenciar múltiplos observados LTM de proyecciones forward.
- **Prueba de integridad para fases 1–3:** inspeccionar `Eficiencia de capital`, `Márgenes`, `Salud Financiera`, `Por acción`, `Trailing Valuation` y `Income Statement`/estados. Comprobar que cada celda de salida B:L conserve fórmula en comparación con plantilla y que NO haya números pegados en rangos derivados. `diff_formulas_plantilla.py` sigue obligatorio; incorporar verificación específica de estos rangos en evidencia; probar al menos ROIC, ROE, ROA, P/E y EV/EBITDA contra cálculo independiente con cifras primarias para dos períodos (incluido LTM si está completo). Bloquear publicación por fórmulas sustituidas, falta de split, precio sin fecha o desajuste material.
- **Múltiplos históricos secundarios:** `Múltiplos históricos` se alimenta de `Trailing Valuation` por fórmulas/función reproducible con filtros documentados de denominadores positivos y outliers, sin valores manuales sin trazabilidad. El motor histórico no sobreescribe los siete métodos de valoración principal ni el DCF. Las fórmulas del maestro solo se alteran en mantenimiento separado con respaldo y prueba de regresión; para una empresa, solo se escribe en su copia.

## 0C. Orden operativo obligatorio: cinco fases (versión 26)

**Desde la aprobación del PR correspondiente**, la secuencia para todas las nuevas revisiones, tanto ChatGPT como Claude, será: **F1 Valoración inicial Damodaran y cuatro historias → F2 Historia financiera completa → F3 Contraste de supuestos económicos → F4 Artículo Nivel 1/2 y publicación EN_REVISION → F5 Auditoría posterior guiada por el usuario**. Orquestador y entregas canónicos en `docs/propuestas/fases/README.md`.

- **F1 acotada, no engañosa:** obtener exclusivamente las cifras necesarias para rellenar `Input sheet`, `Cost of capital worksheet`, los conversores que afectan materialmente al DCF y las hojas de múltiplos, con FY/LTM y anclas pertinentes. Proponer escenarios Base/Conservadora/Optimista/Disrupción y calcular valores **provisionales** si los datos materiales alcanzan. No retrasar toda valoración por faltar historia de 10 años sin impacto material; no inventar datos para presentar el valor como aprobado.
- **F2 histórica:** completar y verificar hasta 10 FY + LTM cuando existan, con SEC/NIIF, balance de apertura, accionistas/leases/deuda y precios históricos; indicadores derivados calculados por **fórmulas**, no pegados. La ausencia no desglosada se documenta (reglas §0A/0B).
- **F3 económica:** contrastar y, si procede, modificar los supuestos de crecimiento, EBIT, ROIC, Sales-to-Capital marginal, reinversión y desfase, costo de capital y terminal, múltiples; llevar trazabilidad `antes → después → causa → impacto` y repetir pruebas afectadas. No ajustar al precio.
- **F4 publicación:** sólo después de todas las comprobaciones técnicas de §6/§8A; el usuario al invocar F4 autoriza intentar publicar el expediente `EN_REVISION` cuando los gates sean aprobados. Un fallo real impide la promoción, no la redacción como candidato. El contenido narrativo y cuantitativo debe reflejar **la misma revisión final**.
- **F5 auditoría dirigida:** el usuario define dudas prioritarias; un auditor independiente/otra sesión verifica también el núcleo mínimo de materialidad, supuestos y conciliaciones; emite dictamen económico, no publica correcciones implícitas.
- **Compatibilidad:** los expedientes y las entregas creados bajo el esquema de 4 fases son históricos: su número NO acredita la nueva fase equivalente. Se mapean por evidencia, respetando la revisión, sin reiniciar datos correctos ni arrastrar R2/R3 a una revisión nueva.

**Retiro de `Forward Valuation`:** módulo declarado **obsoleto** del análisis principal; sus indicadores prospectivos están cubiertos por DCF y múltiples FY+1/2/3. **No borrar aún de la plantilla de 46 hojas ni de AMZN R4 u otras hojas vigentes:** para convertir la plantilla futura a **45** se exige (1) inventario y pruebas de dependencias de fórmula/nombres/validaciones/scripts, (2) respaldos y migración sin pérdida de cálculo de las variantes Maestra/IA/Manual, (3) validador y app compatibles con perfil 45 y legado 46, (4) comparación regresiva de DCF/múltiplos antes/después. No se cambia el motor por un borrado de pestaña sin pruebas. Al completarse, actualizar el registro `reference/plantillas.json` y subir nueva versión del perfil. Archivo histórico permanece intacto.

## 0D. Cobertura integral de dependencias de Fase 1 (versión 27)

**No basta con completar las celdas visibles de Input sheet.** La fase 1 debe obtener, de fuentes primarias y con corte definido, **todas las entradas materiales** de las hojas auxiliares requeridas por DCF Damodaran y múltiplos aplicables: `Cost of capital worksheet`, `Synthetic rating`, `R& D converter`, `Operating lease converter`, `Option value`, `Failure Rate worksheet` y notas sobre opciones, RSU/SBC, NOL, preferentes, minoritarios, deuda a mercado y activos no operativos, además de `Financials Multiples`, sus cinco métodos, anclas FY+1/2/3 y matrices. **Es obligatorio inspeccionar las fórmulas reales de la plantilla** para encontrar dependencias indirectas, no rellenar listas genéricas ni convertir celdas sin evidencia en cero.

El registro de fuente y estado por celda y el algoritmo de cobertura se establecen en [Contrato único de insumos F1](../docs/propuestas/fases/CONTRATO_INSUMOS_FASE_1.md), que es vinculante para ChatGPT, Work, Claude y cualquier agente. `Option value` puede concluir `NO_APLICA` solo con evidencia de que no hay opciones/warrants económicos; ello **no** exime evaluar RSU/SBC ni dilución. I+D no desglosada requiere proxy explicado, reversibilidad y sensibilidad, sin falsificar una partida reportada; ASC842/NIIF16 debe verificarse antes de capitalizar leases. WACC se calcula en su hoja y se comprueba, sin confundir tasa libre de riesgo con costo de capital.

**Puerta de Fase 1:** entregar matriz cobertura de entradas, cálculo DCF Base/escenarios y múltiplos aplicables o `N/D` por dependencias materiales no verificadas. La ausencia de historia de diez años completos no es excusa para omitir la amortización mínima de I+D, opción value, WACC o anclas relevantes; esos insumos pertenecen a la fase 1. Fase 2 obtiene el resto de históricos. Controles técnicos de publicación siguen en F4, auditoría guiada en F5.

## 1. Valor principal y margen de seguridad

- **Empresas operativas (internacionales y colombianas):** valor principal = DCF Base (FCFF; FCFE en financieras).
- **Holdings (Grupo Argos, Grupo Sura y sus preferenciales):** valor principal = SOTP Base.
- **DCF por FCFE (informativo, v28):** la pestaña `DCF FCFE` de la plantilla vigente calcula, con el mismo motor y los
  mismos supuestos que el DCF FCFF, un valor por acción por historia (Conservadora, Base, Optimista) y su promedio
  ponderado; solo añade la deuda (endeudamiento neto con razón deuda/valor, intereses y ahorro fiscal) y descuenta al
  costo del patrimonio. **Debe figurar en toda valoración cuya hoja tenga la pestaña:** en el registro (`dcfFCFE`), en la
  app (tablero de valoración) y en el Nivel 2 del análisis. **No es valor principal, no lleva MOS** y el «ponderado
  FCFF/FCFE» (peso de la entrada `B8`, 50 % por defecto) **no entra en el valor principal**, pero **se muestra con su
  ponderación (p. ej. 50 % FCFF · 50 % FCFE) en la tabla de valores potenciales de la app, junto al DCF, los múltiplos y
  el ponderado DCF + múltiplos**: el principal sigue siendo el
  DCF FCFF Base (FCFE/SOTP en financieras y holdings). Los valores se copian de la hoja sin recalcular
  (`JMR-valuation/scripts/dcf_fcfe_registro.py`); se bloquea si el DCF FCFF Base de la pestaña no coincide con
  `valorPrincipal` o si el promedio FCFF no concilia con `Escenarios e historias!H10`. Las financieras con su propio
  `DCF FCFE financiero` (NU, XP, PAGS) no usan esta pestaña. Una brecha FCFE/FCFF grande señala incoherencia entre deuda, Kd, pesos y WACC: se explica en F3/F5 y
  nunca se usa para ajustar supuestos. Construcción y control: `JMR-valuation/scripts/build_fcfe_sheet.py` y `verificar_fcfe_sheet.py` (v30).
- **Precio con MOS = valor principal × (1 − MOS)**, MOS = 35%. Nunca sobre el esperado ni sobre el ponderado de
  métodos. En el registro: `baseMOS = "dcfBase"` o `"sotpBase"`. Un holding sin SOTP no tiene precio con MOS.
- Código: `JMR-valuation/scripts/normalize_saved_mos.py`, `consistencia_migracion.py` (M2), `docs/valuation-board.js`
  y `docs/visor.html`.

## 2. Historias y promedio

- **Calibración honesta:** la Base es el escenario central defendido como más probable, no el prudente; la prudencia vive solo
  en el MOS. Conservadora y Optimista exigen la misma evidencia. Cada riesgo va en un solo lugar (flujos, tasa o
  probabilidad). Nada se ajusta para acercarse al precio.

- Cuatro historias: Base, Conservadora, Optimista y Disrupción, cada una con DCF completo.
- **Calidad económica de supuestos (v33):** en F1/F3, para cada hipótesis material guardar mecanismo → motor →
  evidencia a favor y en contra con fecha → rango defendible → valor y trayectoria elegidos → dependencias →
  falsador → celda → impacto Base/MOS (o NO EJECUTADO). Usar el soporte existente y materialidad §4B.
  Conciliar crecimiento por motores con mercado accesible; en plataformas distinguir volumen bruto, cuota,
  comisión e ingresos netos. Justificar conjuntamente crecimiento y margen, capacidad e inversión, e intangibles
  sin doble conteo. Distinguir ROIC de activos existentes, de nuevas inversiones y terminal: g = reinversión × ROIC
  requiere beneficio operativo, retornos y períodos compatibles; la eficiencia transitoria no se perpetúa.
  En F3 responder la objeción económica más fuerte a la Base; en F5 verificar esas relaciones sin modificar inputs.
  Registrar después previsión y resultado observado por motor; revisar solo las hipótesis afectadas y sus controles.
  Detalle y fuentes: `docs/HISTORIAS_A_NUMEROS.md` v2 y `docs/FUENTES_STORIES_TO_NUMBERS.md`.
- **Atribución y estadística (v33):** Base, moda, mediana y esperanza no son equivalentes. El promedio C/B/O sigue
  siendo condicionado a esas historias. Las ponderaciones §3, costo de capital común entre historias, fracaso solo
  en Disrupción y etiquetas operativas de disparadores son convenciones JMR, no reglas universales de Damodaran.
  Se conservan valores, fórmulas, límites y gates. Las 3P exigen juicio sustentado; COMPLETA no certifica calidad económica.
- **Historias → números (Damodaran, *Stories to Numbers* y *Narrative and Numbers*, v31).** Cada historia se
  completa en `Escenarios e historias` (sección desde la fila 104) en este orden: (1) **tipo de historia** por ciclo de
  vida (start-up, crecimiento joven, alto crecimiento, crecimiento maduro, madurez estable, declive) y **la historia en
  un párrafo** atada a flujos, crecimiento y riesgo, escrita antes de mirar el precio; (2) **vínculo con la historia**
  para cada palanca (crecimiento, margen, impuestos, ventas/capital, ROIC, costo de capital y, si aplica, fracaso):
  una frase que diga qué parte de la historia justifica ese número; (3) **prueba de las 3P** con números calculados
  por fórmula —posible: participación del mercado en el año 10 frente al TAM; plausible: margen del año 10, ROIC
  terminal y ventas/capital frente a la industria de Damodaran; probable: crecimiento 1-5 frente a la industria,
  ganancia de participación y valor del crecimiento— y un juicio Sí / Con reserva / No por cada P, con evidencia;
  (4) **tres disparadores** (ruptura, cambio o desplazamiento de la historia) con señal observable, umbral y efecto.
  Una señal REVISAR exige explicar la ventaja o la evidencia que la sostiene; IMPOSIBLE (participación > 100 %) obliga
  a rehacer la historia. La Base debe ser «probable» = Sí. Ninguna señal se corrige para acercar el valor al precio.
- **Los supuestos salen de la historia (v32).** Cómo hacerlo, palanca por palanca, está en
  [`docs/HISTORIAS_A_NUMEROS.md`](../docs/HISTORIAS_A_NUMEROS.md), de lectura obligatoria en F1, F3 y F5. En particular,
  el crecimiento se **deriva**: TAM₁₀ × participación objetivo del año 10 que defiende la historia (o unidades × ingreso
  por unidad) da los ingresos del año 10, y el crecimiento año por año del modelo debe llegar a ellos. La fila «Brecha
  historia − modelo» de cada historia marca REVISAR si difieren más de 10 %: se cambia la historia o el crecimiento,
  nunca se deja la brecha sin explicar. Sin TAM confiable, la participación queda N/D y el crecimiento se justifica por
  unidades o por motores con evidencia.
- **Riesgo en un solo lugar en las historias (v31):** el costo de capital es común a las cuatro historias (riesgo
  sistemático); la **probabilidad de fracaso solo se usa en Disrupción**, con su entrada propia
  (`Escenarios e historias!B216`, que lee `Valuation output!B179`), y entonces esa historia no castiga además sus
  flujos por el mismo riesgo. `Input sheet!B52 = "Yes"` (fracaso para todas) genera alerta §2 en las otras historias.
- **Tamaño del mercado (TAM, v31):** dato de Fase 1 con fuente, fecha, moneda y escala de los ingresos, más su
  crecimiento anual (`Escenarios e historias!B106:B107`). Sin dato confiable se registra N/D con motivo y la prueba
  «posible» queda N/D; nunca se inventa un mercado para que la participación parezca razonable.
- El promedio y el rango ordinarios usan **solo Conservadora, Base y Optimista** (pesos renormalizados). Disrupción
  se presenta aparte («¿Qué pasaría si todo fallara?») y conserva su probabilidad como dato. *(Decisión del usuario
  del 21-oct-2026: se mantiene así.)*

## 3. Probabilidades

- **Previa JMR por etapa del ciclo de vida** (clasificación inspirada en Damodaran; porcentajes propios del proyecto), en `JMR-valuation/reference/probabilidades_prior.json`
  (Base / Conservadora / Optimista / Disrupción):

  | Etapa | Previa |
  |---|---|
  | Madura estable | 50 / 20 / 20 / 10 |
  | Crecimiento maduro | 45 / 22,5 / 22,5 / 10 |
  | Crecimiento alto | 40 / 22,5 / 22,5 / 15 |
  | Declive | 40 / 25 / 15 / 20 |
  | Holding | 45 / 22,5 / 22,5 / 10 |

  Conservadora y Optimista son simétricas salvo en declive: sin evidencia, el promedio no cae bajo la Base por
  construcción.

- **Ajustes:** de 5 pp, cada uno atado a un indicador de la ficha que cruzó su umbral escrito, con evidencia y fecha
  (`ajustes_prob`). Máximo 15 pp de desvío por historia frente a la previa. Sin cruce de umbral, no se mueven.
- Control: `scripts/probabilidades.py` (0 fallos). Calibración: `scripts/foto_supuestos.py` (§7).

## 4. Costo de capital y valor terminal

- Tasa libre y prima madura de **la misma fecha** (corte mensual de Damodaran).
- Prima por país = prima madura del corte + prima de riesgo país de la tabla anual de Damodaran (ERP total de la
  tabla − su prima madura, 4,23% en enero de 2026). Nunca el ERP total de enero con la prima madura de otro mes.
- **Crecimiento terminal = 4,0% nominal USD** (inflación esperada ~2,3% + crecimiento real ~1,7%), con techo en la
  tasa libre (`g_terminal` del corte; `aplicar_corte.py` escribe B68/B69). Colombia en COP y las financieras FCFE
  conservan su g propio y documentado.
- Costo de capital terminal: beta 1 (tasa libre + prima madura); Brasil conserva parte de la prima país.
- ROIC terminal: sin ventaja = costo de capital; ventaja durable = promedio de la industria; ventaja que se desvanece
  = punto medio (`reference/moat_2026-09-30.json`).
- Impuesto: efectivo al principio, marginal a perpetuidad (AFYA 34% desde el 4-oct-2026).

### 4A. WACC: una fuente y método económico

- Para empresas operativas, el **WACC oficial se calcula en `Cost of capital worksheet`**, nunca se escribe manualmente en `Input sheet`. El camino normal es **`B12 = Detailed`**, porque permite estimar cada componente. Elegir **`B22 = Multibusiness(US/Global)`** solo cuando existan líneas de negocio económicamente distintas, con ventas y betas bottom-up trazables; si la firma es esencialmente un único negocio, usar **`Single Business(US/Global)`**. Para riesgo país, **`B26 = Operating regions/countries`** si las ventas por exposición están verificadas; `Will Input` únicamente cuando esa prima ponderada ya se haya calculado con las mismas fuentes y fecha y se deje la conciliación. Nunca interpretar `Detailed`, `Multibusiness` y `Operating regions` como tres alternativas excluyentes: los dos últimos son submétodos del primero. La distribución/histograma es comprobación externa, no WACC principal sin justificación económica.
- Obtener Rf y ERP del mismo corte y moneda, beta desapalancada y reapalancada, Ke, Kd antes de impuestos de deuda/rating, tasa marginal y pesos de **mercado** para patrimonio, deuda y preferentes. Arrendamientos únicamente incrementales entran como deuda. Verificar `Cost of capital worksheet!B14 = E63 = Input sheet!B36`, suma de pesos = 100 % y registro del método, supuestos y fuentes. En financieras el método primario es FCFE/Ke; en holdings SOTP, usando tasas congruentes para cada negocio, no WACC consolidado mecánico.
- Capitalizar **I+D recurrente** cuando corresponda con `R& D converter`: vida útil explícita, gastos históricos, activo creado, amortización y EBIT ajustado; sumar activo a capital invertido y revisar reinversión/Sales-to-Capital. No mezclar margen GAAP con margen ajustado. Si se descarta, fundamentar por qué el gasto no representa inversión separable o por qué el efecto cuantificado es inmaterial.
- Revisar **arrendamientos** con `Operating lease converter`: obligaciones fuera de balance → VP, deuda, EBIT, capital y reinversión; los pasivos ya reconocidos por ASC 842/NIIF 16 se reconcilian con el balance y **nunca se capitalizan/restan por segunda vez**. `B18=No` puede ser correcto si significa 'sin conversión adicional', no que no existan arrendamientos.
- Revisar **`Option value`** cuando haya opciones/warrants: cantidad, precio de ejercicio, vida remanente, volatilidad y dividendos, valoración reproducible, valor total y resta **una sola vez** del patrimonio. Conciliar acciones básicas vs. diluidas actuales y el gasto por SBC; no usar simultáneamente acciones diluidas que ya incorporan ese derecho y volver a restarlo. La etiqueta 'dilution adjusted' de la plantilla NO acredita por sí sola dilución económica: verificar la fórmula efectiva, no el título. Otras RSU/SBC se evalúan por el método económicamente apropiado y sin doble conteo.

### 4B. Materialidad de hallazgos y límites

- Un hallazgo solo bloquea si cambia sustancialmente el valor Base o la decisión, invalida una fórmula/puente, afecta integridad crítica del dato o **no permite acotar** una incertidumbre potencialmente material. No confundir una falta documental secundaria con un error matemático.
- Para cada limitación comparar **valor Base oficial** con el valor alternativo o el peor caso razonable, manteniendo los demás supuestos: `impacto_individual_% = 100 × |V_alternativo − V_base| / |V_base|`. Documentar fuente, método y rango probado. Para resultados adversos conjuntos, usar un límite acumulado conservador; no sumar porcentajes con signos opuestos para cancelar riesgos. Si no hay base positiva o no se puede calcular/acotar, evaluar estructura y marcar pendiente.
- **Salvedad NO bloqueante:** impacto máximo individual **<2 %** y total conservador **<3 %** del valor principal, sin cruzar la decisión/MOS y sin defecto crítico de identidades, fórmulas, unidades, moneda, fechas, deuda, acciones, tasas, escenarios o doble conteo. Los umbrales son política operativa JMR, no criterio estadístico ni aval a inventar ceros.
- **Revisión material:** impacto igual o mayor a 2 % individual o 3 % acumulado, cruce de decisión, o efecto plausible sin límite verificable: no declarar completamente verificado; recalcular o corregir. Una incertidumbre cuantificada y material puede figurar como «VERIFICADO CON RESERVA MATERIAL», nunca como validado sin reserva. Un error estructural o de fuente crítica es **PENDIENTE**, aunque la estimación puntual dé impacto pequeño.
- Estados por empresa y versión: **VERIFICADO**, **VERIFICADO CON RESERVA MATERIAL** o **PENDIENTE**. Las salvedades inmateriales son hallazgos *dentro* de VERIFICADO (no un estado eterno). Cada auditoría registra ID, causa, evidencia, `V_base`, alternativa, impacto individual y acumulado, decisión, si bloquea, motivo, responsable y prueba ejecutada/no ejecutada. No se marca «NO APLICA» algo que aplica, ni «VALIDADO» un candado cuyos requisitos técnicos sigan fallando. El dictamen distingue certificación aritmética, fuentes y juicio económico.

### 4C. Calidad de la reinversión y compatibilidad financiera (versión 17)

- El panel diagnóstico de `Supuestos Recomendados` se mantiene **dentro** de las 46 hojas oficiales Maestra, IA y Manual. Muestra relación promedio `Ventas/Capital`, S/C futuro, lag, reinversión año 1, `Reinversión/NOPAT`, reinversión indicativa lag 0, ROIC año 10/terminal y tasa terminal `g/ROIC`. Es un **control**, no modifica automáticamente las entradas ni el DCF. En plantillas en blanco las fórmulas deben quedar vacías hasta cargar una compañía, sin inyectar datos de MELI.
- El analista nunca iguala automáticamente S/C medio al marginal, ni considera un FCFF negativo, `Reinversión/NOPAT > 100 %` o ROIC año 10 diferente al terminal como **error probado**. Requieren explicación contable, datos comparables y una prueba de materialidad antes de cambiar entradas.
- En mixtas Commerce/Fintech/Crédito, conciliar préstamo/activos de clientes, fondeo de cartera, fondos y caja restringidos, provisiones, margen, capital regulatorio y financiamiento al pasar de EV a equity. Utilizar FCFE/ROE en negocios financieros cuando sea posible y SOTP por segmentos cuando existan datos fiables; si falta separación, documentar reserva material y no inventar asignaciones ni doble contar deuda y capital.
- No cambiar el desfase de reinversión del DCF sin prueba causal. Una comparación del primer año con lag 0 es **solo indicativa**; una valoración alternativa exige recalcular diez años de FCFF y perpetuidad con el mismo alcance, moneda y corte. Conservar `Valor Base` original para medir el cambio y los umbrales de materialidad del §4B.
- En valores existentes, la nueva alerta puede cambiar su **prioridad de revisión** pero NO reemplaza resultados históricos. Un cambio de supuestos genera una revisión nueva y separada con la misma secuencia: valoración y análisis preliminares `EN_REVISION`, revisión visual del usuario y luego, solo bajo solicitud, auditoría económica externa a la plantilla. Para A aplicar detalle de `METODO_A_JMR.md` §A.5.1; B histórico se preserva.

## 5. Múltiplos de salida

- Por ciclo: el múltiplo del escenario es el que la empresa tuvo cuando sus fundamentales se parecían a los del
  escenario en FY+3 (`scripts/multiples_by_cycle.py`).
- **Ajuste por tasas:** cada múltiplo histórico × (k del cierre − g) / (k del corte − g), con k = Treasury +
  prima implícita del cierre (`reference/costo_capital_historico.json`); factor entre 0,6 y 1,4.
- **Topes:** Conservador ≤ múltiplo actual; **ningún escenario por encima del múltiplo justificado por sus
  fundamentales (ancla C)**. Sin descuentos generales adicionales: los factores de Toro (0,78× / 0,92×) quedan solo
  como diagnóstico. Comparables solo comprueban.
- Optimista más de 25% sobre el actual: solo con `justificacion_salto` en `<T>_ciclo.json`.

### 5A. Núcleo de cinco múltiplos y dos indicadores complementarios

- **Cinco métodos de contraste prioritarios** en empresas operativas: EV/EBITDA, EV/FCFF, P/E, P/FCFE y P/OCF. Evaluar cada uno con su denominador y fórmula; calcular cuando sea económicamente aplicable y exista trazabilidad. Si un flujo no es positivo o no es comparable, registrar **N/A justificado**; si falta evidencia para un método prioritario, registrar **N/D y su materialidad**. Nunca inventar positivos, dividendos, caja ni múltiplos. Para financieras, aplicar el contrato FCFE/Ke y los múltiplos propios del negocio; no exigir EV industriales.
- **Dos métodos opcionales y no esenciales: P/S (P/Ventas, pestaña `PV`) y P/BV (pestaña `PBV`).** Solo calcular y publicar si añaden contraste económico fiable con ventas, patrimonio común y acciones comparables. **Su ausencia, N/A, N/D o falta de matrices NO bloquea la valoración, la publicación EN_REVISION ni una auditoría por sí sola**, y no se considera defecto de cobertura del núcleo. No construir una proyección patrimonial o un P/S solo para completar siete. Si un método opcional recibe peso positivo en una valoración concreta, entonces sí exige cálculo válido, fundamento, conciliación y controles antes de utilizarlo en el ponderado. Conservar resultados históricos sin reescribirlos.
- Usar las fórmulas existentes de `Financials Multiples`, de las pestañas de cada método y de `Descuento de múltiplos`. Los cinco métodos originales conservan su mecánica; no reconstruirlos por empresa ni reemplazar resultados o fórmulas por cifras escritas por la IA.
- El trabajo del analista consiste en escoger y justificar los supuestos en las celdas de entrada de `Financials Multiples`, los múltiplos de salida por historia (actualmente `J8/J19/J30`) y la selección/ponderación de métodos. Las métricas proyectadas, precios, dividendos y valores presentes los calculan las fórmulas. Conservar las conexiones y selectores de la plantilla.
- Las versiones Maestra, IA y Manual **conservan** las pestañas P/S y P/BV, sus fórmulas y cadena de cálculo existentes para uso voluntario: históricos → supuestos/métrica proyectada → múltiplo de salida → precio FY+1/FY+2/FY+3 → dividendos → descuento → ponderación. La presencia de pestañas no implica que haya que alimentarlas, ni hace obligatoria su sensibilidad. No crear cálculo paralelo ni tomar precios objetivo de terceros como resultado JMR.
- P/S = capitalización bursátil / ventas = precio por acción / ventas por acción; precio objetivo = múltiplo de salida P/S × ventas proyectadas / acciones compatibles. P/BV = capitalización bursátil / patrimonio común = precio por acción / valor libro común por acción; precio objetivo = múltiplo de salida P/BV × patrimonio común proyectado / acciones compatibles. P/BV exige conciliar patrimonio inicial + utilidad atribuible al común − dividendos + emisiones − recompras ± otros movimientos de patrimonio; los ajustes se documentan, y un cero precargado no demuestra ausencia de movimientos. Estos dos métodos son de equity: no restar de nuevo la deuda neta.
- Aplicar a cada método **utilizado** las reglas de selección del §5 y la justificación económica del negocio. No hay peso mínimo para P/S ni P/BV; su contribución puede ser cero o inexistente. No sumar métodos derivados como si fueran validaciones independientes.
- **Ponderación por tipo de empresa:** El analista/IA elegirá y justificará el peso de cada múltiplo según el tipo de empresa y su modelo de negocio: rentabilidad y madurez, intensidad de capital, ciclicidad, apalancamiento, relevancia del patrimonio contable y calidad/comparabilidad de las métricas. No aplicar pesos iguales ni una distribución universal por defecto, ni copiar pesos de otra compañía. Documentar por método el porcentaje, la razón económica y cualquier exclusión con peso cero; normalizar al 100 % dentro del bloque de múltiplos seleccionados, distinguiéndolo del peso global de ese bloque frente al método principal. El usuario podrá modificar los pesos. Evaluar los cinco prioritarios según su aplicabilidad; los dos complementarios son opcionales aunque existan en la plantilla y su peso sea cero.
- Si un método prioritario es económicamente inaplicable, mostrar N/A con causa; si falta un dato material, N/D con dato pendiente y efecto. Para P/S y P/BV basta indicar «complementario no utilizado» o N/A cuando proceda; no debe figurar como deuda metodológica que impida publicar. Nunca usar cero para fingir cálculo ni completar denominadores no interpretables. Buscar datos únicamente cuando la utilidad económica y materialidad lo justifiquen.
- Antes de entregar, comprobar fórmulas y salidas de los cinco prioritarios **aplicables** o sus excepciones justificadas, puentes EV/equity, unidades, acciones, dividendos y descuentos. Para P/S y P/BV aplicar control solo si se **utilizan o tienen peso positivo**; su ausencia sin peso no es fallo. Hoja, valoración y análisis deben ser de la misma revisión.

**Anexos de apoyo (no son prompts; las reglas siguen aquí):** [`docs/prompts/precision-financiera-2026-10-09.md`](../docs/prompts/precision-financiera-2026-10-09.md) (evidencia, corte, tasas, UDM y publicación) y [`docs/prompts/contrato-historias-multiplos-20261017.md`](../docs/prompts/contrato-historias-multiplos-20261017.md) (fórmulas y ejes de las matrices de múltiplos de la Base).

**Regla de implementación para las 23 empresas activas y todas las futuras:** toda hoja oficial debe contener `Financials Multiples`, `Descuento de múltiplos` y `Sensibilidad por múltiplo` en la misma revisión; desde la hoja se extraen al JSON oficial los métodos, escenarios FY+1/2/3, valores presentes, pesos, controles y matrices aplicables. La app muestra esa publicación (con acceso a las hojas originales), nunca calcula precios de múltiples por su cuenta ni importa precios de una revisión sustituida. Distinguir tres estados: `CALCULADO` (VP y controles conciliados), `N/D` (fuente o fórmula pendiente) y `N/A` (no aplicable económicamente); registrar motivos. Existencia de pestaña no prueba cálculo. Los cinco métodos prioritarios deben evaluarse según aplicabilidad; P/S y P/BV son complementarios y opcionales. No certificar ni publicar como completo un método sin conciliación hoja→JSON→app.

### 5B. Derechos de preferentes y utilidad común (PREF-01, 28-oct-2026)

P/E y EPS deben usar utilidad atribuible al accionista común. Financials Multiples conserva la utilidad consolidada y añade un puente separado: utilidad común = utilidad consolidada − dividendos preferentes devengados − asignación participante no monetaria. P/FCFE usa el flujo antes de derechos preferentes menos los pagos efectivos a preferentes. P/BV conserva el puente patrimonial: restar las distribuciones de caja pertinentes y registrar otros movimientos de equity; no restar otra vez una asignación de beneficios sin salida de caja. Conciliar devengo, pago y pasivos de dividendos en la documentación del caso.

En ausencia demostrada de preferentes, los tres puentes conservan los valores previos. Si existen preferentes y faltan entradas o evidencia, bloquear el resultado afectado; no sustituir datos ausentes por cero. El mantenimiento de fórmulas se registra en la plantilla oficial con respaldo y regresión antes de incorporarlo a copias nuevas; no habilita cambios libres de fórmulas durante una valoración. FCFF y OCF conservan sus definiciones operativas.

El valor contable, el nominal/redención, el valor de mercado y las acciones de conversión son conceptos distintos. Las preferentes convertibles exigen conciliación de reclamación y dilución sin doble conteo; su coste esperado no se presume igual al cupón dividido por su precio. PREF-01 no certifica automáticamente esa valoración ni el WACC de un caso concreto.

**PREF-02:** `Cost of capital worksheet!B97` distingue `Yield simple` (preferente perpetua simple) de `Retorno esperado híbrido`. En este último caso, D63 usa el retorno esperado B98, con fuente B99; si falta, bloquea el WACC. El puente opcional B104:B109 pondera a mercado el retorno del componente financiero y el de conversión; para una opción, K_opción = Rf + (Ke − Rf) × (S·delta / valor_opción). Los dividendos efectivos B51 permanecen separados. En ausencia de preferentes D63=0. El método y los límites contractuales se documentan por emisor; las plantillas permanecen sin parámetros de empresas. Mantenimiento autorizado de preferentes, con respaldo y regresión; no obliga a recalcular otras empresas durante el reinicio de CELH.

## 6. Controles de publicación

`bash scripts/controles_todas.sh` sin fallas antes de publicar o fusionar:

1. probabilidades = previa + ajustes;
2. razonabilidad de supuestos (`controles_supuestos.py`):
   - S1: márgenes frente al sector y Optimista ≤ Base + 10 pp;
   - S2: ROIC terminal frente a la referencia sin ventaja durable;
   - S3: orden de las historias;
   - S4: salto del múltiplo del Optimista;
   - S5: g ≤ tasa libre;
   - S6: probabilidades;
3. consistencia hoja = app = motor;
4. integridad de la hoja;
5. estados completos.

Una alerta de supuestos se cierra con evidencia en `justificacion_supuestos`, nunca relajando el control.

## 7. Seguimiento del acierto

Al cerrar cada corte: `scripts/foto_supuestos.py foto`. Con cada resultado anual, el dato real se agrega a
`reference/fotos/realizados.json`, y `foto_supuestos.py comparar` mide qué historia acertó. Con suficientes
observaciones, las frecuencias por etapa recalibran las previas del §3 (nueva versión de este documento).

## 8. Proceso eficiente (lo mínimo que se exige y cuándo algo está listo)

- **Un comando:** `bash scripts/valorar.sh <T> [hoja] [pares] [industria]`. Avanza por fases, salta lo hecho y se
  detiene solo en el paso de juicio (la ficha de historias, generada con el prompt v5).
- **Entregable mínimo obligatorio:**
  - DCF de las cuatro historias;
  - **sensibilidad DCF Base prioritaria:** como mínimo WACC terminal × crecimiento perpetuo, ROIC terminal × crecimiento perpetuo y crecimiento explícito × margen EBIT, todas 5 × 5 con **precio por acción en cada celda**, y centro exactamente conciliado al DCF Base. Cuando hay motor congruente de la misma revisión, ampliar a ROIC terminal × WACC terminal, Sales-to-Capital × margen EBIT, WACC inicial × crecimiento explícito, tasa marginal × reinversión y WACC terminal × escala mecánica del valor terminal (80–120%). Nunca reutilizar motor FCFF de 10 años en NFLX si su DCF principal utiliza transición ROIC de 20 años; generar precios únicamente con el horizonte real de cada empresa. No inventar celdas no verificadas. El crecimiento perpetuo exige reinversión sostenible g/ROIC; WACC > g y ROIC > g. Distinguir escala mecánica del TV de una variación de g o un múltiplo de salida; publicar la contribución del VP terminal al VP operativo, y el DCF inverso;
  - evaluación de los cinco múltiplos prioritarios aplicables con sus salidas por historia o excepción N/A/N/D justificada según §5A; P/S y P/BV solo si aportan valor o tienen peso, sin bloquear la publicación cuando no se utilicen;
  - entradas **materiales/aplicables** completas y los 18 candados de cálculo listos (`inputs_completos.py`, `candados.py`); faltantes secundarios solo si su impacto es acotado y quedan anotados según §4B. Ningún hallazgo menor debe bloquear por defecto una valoración, pero un candado real de fórmula o coherencia nunca se evade inventando datos.

  - **Sensibilidad de múltiplos solo en historia Base.** No crear ni mostrar matrices Conservadora, Optimista o Disrupción, pero conservar todas las valoraciones, supuestos y precios por escenario de los métodos calculados, incluyendo P/S y P/BV cuando existan en la revisión histórica. Dar prioridad visual al DCF sobre cualquier múltiplo.

  **Anexo obligatorio de sensibilidades en Nivel 2:** presentar, además de las matrices DCF Base, una matriz 5×5 por cada método **prioritario aplicable y válido** de los cinco (EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF). Las matrices P/S y P/BV son **opcionales**, no integran requisitos mínimos ni bloquean publicación o cierre por su ausencia. Eje vertical = múltiplo elegido real en veces; eje horizontal = fundamental FY+3 en unidades; celda = valor presente por acción descontado por la fórmula oficial, centro conciliado al VP3 del método (no al DCF Base ni al promedio FY+1/2/3). Incluir segunda ancla observada al corte cuando la hoja la contenga, claramente distinguida de la elegida, y sin alterar pesos. Solo historia Base. Si falta cálculo fiable o corresponde N/A, explicar el dato/fórmula y documentar el N/A/N/D o la exclusión voluntaria, sin bloquear por P/S/P/BV; **no inventar matriz** y no confundir ausencia editorial con cambio del resultado financiero. Las familias de sensibilidad económicamente justificada son adicionales y no se presentan como sustituto del valor por acción. La evaluación de los cinco prioritarios y el carácter opcional de P/S/P/BV se rigen por §5A.
- **Estados:**
  - **VERIFICADO** = controles estructurales/financieros aprobados y solo salvedades no bloqueantes con prueba de materialidad (§4B);
  - **VERIFICADO CON RESERVA MATERIAL** = límites cuantificados con impacto material; requiere resolverlos antes de tratar el valor como definitivo sin reserva;
  - **PENDIENTE** = control estructural/material fallido o incertidumbre material sin cuantificar.

  Las salvedades son notas, no un estado. No existe «conciliado con salvedades» indefinido.
- **Una auditoría por cierre definitivo.** La publicación preliminar EN_REVISIÓN conserva los controles técnicos completos, pero no anticipa el dictamen económico. Este se emite después de la revisión visual y de las observaciones del usuario. No se re-audita sin un hecho nuevo (resultados, 8-K material, cambio de regla).
  Una actualización trimestral solo toca lo que cambió (modo C de `actualizar-cartera`).
- **Una regla, un lugar:** un cambio de método se hace aquí, sube la versión y se aplica a todas las empresas en una
  sola pasada; nunca empresa por empresa ni como «contrato del día» en un prompt.


### 8A. Flujo híbrido: revisión visual antes de auditoría independiente (27-oct-2026)

1. **Valoración y análisis de la misma revisión al publicar:** las cuatro historias y múltiplos se construyen provisionalmente en Fase 1, se revisan económicamente en Fase 3 y el artículo de 14 capítulos con Nivel 2 se produce en Fase 4. Las tres piezas deben asociarse a la misma revisión, aunque se elaboren en fases diferentes.
2. **Controles técnicos antes de publicar:** ejecutar §6, integridad de la hoja, conservación de fórmulas y selectores, origen de entradas, alertas de supuestos y conciliación hoja↔JSON↔app. No omitir candados materiales para obtener una publicación preliminar.
3. **Publicación preliminar EN_REVISIÓN:** solo con autorización y controles aprobados. La ficha mostrará claramente que la auditoría económica independiente está pendiente; no se podrá etiquetar VERIFICADO por el mero éxito de los controles técnicos.
4. **Observaciones del usuario:** en el expediente de la compañía se pueden registrar puntos para auditar. El borrador local se sincroniza solo mediante la acción explícita de guardarlo en GitHub, en `Modelo-JMR-datos/auditorias/solicitudes/<TICKER>/<REVISION_ID>.json`. El usuario escoge EN_REVISION, LISTO o REHACER; LISTO equivale a listo para auditoría, no a dictamen aprobado. REHACER no actualiza automáticamente los cálculos. El repositorio es público: se advierte antes de publicar. Vincular ticker, revisión y fecha, nunca transferir notas silenciosamente de otra revisión.
5. **Auditoría económica diferida:** cuando se pida «Audita <TICKER>», identificar la revisión vigente en el catálogo y consultar primero los puntos de auditoría de esa revisión, si existen. Además, examinar siempre la razonabilidad de crecimiento, márgenes, ROIC, reinversión, WACC/Ke, terminal, DCF/FCFE/SOTP, múltiplos, riesgos y materialidad. Solo entonces emitir VERIFICADO, VERIFICADO CON RESERVA MATERIAL o PENDIENTE.
6. **Cierre y cambios:** dictamen, hoja y artículo de la misma revisión. Una corrección autorizada debe repetir los controles afectados. Conservar solicitudes y auditorías de revisiones anteriores como histórico.

El cambio afecta la secuencia y los estados, no el método financiero, fórmulas o candados técnicos.

## 9. Análisis fundamental completo: Estilo JMR narrativo (v23, 30-oct-2026)

**Tres prompts operativos únicos:** `docs/prompts/valoracion-modelo-jmr-v5.md` (1/3), `docs/prompts/research-fundamental-jmr-v5.md` (2/3) y `docs/prompts/auditoria-economica-jmr-v1.md` (3/3). Los prompts de `archivo/`, `recuperado-*` y `colombia-research-v1.md` son antecedentes, no reglas ejecutables. Cualquier contradicción se resuelve por este §9 y §§5/8: no conservar prohibiciones históricas de sensibilidad por múltiplos.

**Regla editorial vigente:** se reemplaza el índice obligatorio de 18 capítulos de META y la exigencia de cinco filosofías/Porter por el **Estilo JMR de 14 capítulos**, inspirado en la claridad narrativa de AZ Stocks pero con metodología y juicios propios. El contrato completo y los nombres exactos están en [`docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md`](../docs/ESTILO_ANALISIS_FUNDAMENTAL_JMR.md).

**Nivel 1, siempre largo y explicativo:** 1. Tesis de inversión y conclusión; 2. La empresa y su modelo económico; 3. Industria, competencia y ventaja competitiva; 4. Motores del crecimiento futuro; 5. Ciclos de la empresa, del mercado y de la macroeconomía; 6. Historia financiera y calidad de resultados; 7. Reinversión, eficiencia del capital y ROIC; 8. Dirección, gobierno y asignación de capital; 9. Nuestro proceso de valoración; 10. Supuestos económicos y su justificación; 11. Valor intrínseco, escenarios y precio; 12. Riesgos, tesis contraria y factores de ruptura; 13. Catalizadores y plan de seguimiento; 14. Fuentes, limitaciones y estado del estudio. El lector debe entender el negocio, su economía, nuestros juicios y cómo llegamos al valor sin abrir una hoja. Cada sección contiene hechos, mecanismos y pruebas específicas del emisor, no títulos vacíos. Las subsecciones varían por sector.

**Nivel 2, cuantitativo:** estados y series 3/5/10 años y LTM, ratios, hojas, ajustes contables, fuentes, Inputs, Cost of Capital, reinversión anual, DCF/FCFE/SOTP, **sección «DCF por FCFE (informativo)» (§1)**, EV→equity, cuatro historias, múltiplos, inverso, matrices de sensibilidad Base, controles y conciliaciones. Conservar la misma revisión y enlaces; ninguna simulación local modifica resultados oficiales. El Nivel 1 puede mantener tablas breves interpretativas y cifras decisivas; no duplicar anexos numéricos masivos.

**Ciclo corporativo (Damodaran) y ciclo de mercado (Howard Marks), obligatorios en Nivel 1:** desarrollar el capítulo 5 separado «Ciclos de la empresa, del mercado y de la macroeconomía» con (a) etapa de vida de la empresa —start-up, crecimiento joven, alto crecimiento, crecimiento maduro, madurez estable o declive—, evidencia de ventas, márgenes, FCFF/FCFE, reinversión, ROIC, asignación de capital y transición; (b) fase macroeconómica y monetaria **observada a la fecha de corte**, inflación, tasas efectivas y su dirección, crecimiento, consumo, empleo, crédito, divisas y demanda sectorial; (c) ciclo de liquidez/crédito y actitud ante riesgo, expectativas y precio frente al valor; (d) canal causal a volumen, precios, márgenes, capital de trabajo, inversiones, ROIC, WACC/Ke y valor terminal; (e) hipótesis a favor y contraria, señales líderes y umbrales para cambiar el juicio. Distinguir ciclo de vida estructural de fluctuación macro coyuntural, y distinguir hechos observados de inferencias. La fase cíclica no es una profecía ni se aplica el mismo diagnóstico a todos los emisores. Fuentes primarias (Damodaran, Fed, BEA, BLS, FMI/bancos centrales y SEC/IR) y secundarias fechadas; no introducir datos posteriores a la fecha de corte como conocidos de antemano.

**Probabilidades por ciclo:** identificar la previa corporativa del §3, las cuatro historias y los indicadores verificables de ciclo. Solo registrar cambios de probabilidad con cruce de umbral documentado, en bloques de 5 puntos porcentuales y dentro de límites §3; conservar total 100 %. Si hay diagnóstico cualitativo sin umbral/medición verificable, presentar probabilidades **sin modificar** y describir condiciones futuras de actualización. El análisis de Marks contextualiza los riesgos, NO añade descuento arbitrario al DCF ni altera dos veces crecimiento, WACC y probabilidad. No confundir probabilidad de escenario con expectativa de retorno o con la variación de precio intrínseco.

**Integridad del Nivel 2:** anexo cuantitativo propio, indexado, con tablas legibles y trazabilidad: históricos 3/5/10 años + LTM y reconciliación; Input efectivamente utilizado y fuente por input (no asumir que una celda visible gobierna cada historia); conversores I+D, leases, SBC y dilución; Cost of Capital descompuesto; proyección por año e historia (ventas, EBIT, impuestos, reinversión, capital, ROIC, FCFF/FCFE, WACC, factores y VP); terminal con reinversión g/ROIC; puente EV-equity; precio por acción; cinco múltiplos prioritarios según aplicabilidad y P/S/P/BV solo si se utilizan, con conciliación FY+1/2/3 a VP cuando proceda; las tres sensibilidades mínimas del DCF Base del §8, más matrices ampliadas verificadas de la misma revisión; DCF inverso; registro de probabilidades, hipótesis de ciclo y efectos de shocks sobre drivers; enlaces a hoja y celdas/fórmulas efectivas. Distinguir fórmulas algebraicas explicativas de fórmulas literales verificadas en Google Sheets. Mostrar N/D y faltantes con motivo. No sustituir cifras por enlaces externos ni inventar grillas. No marcar completa una sección por existir su encabezado. La lectura de Sheets y la redacción del anexo no autorizan cambiar resultados o auditar económicamente.

**Valor, calidad y calibración:** portada con valor principal Base, cotización fechada, MOS35% sobre Base, escenarios comparables y disrupción separada; señalar el denominador correcto de brechas. La sección 10 debe cubrir crecimiento, márgenes, impuestos, reinversión/Sales-to-Capital, desfases, ROIC marginal/terminal, WACC/Ke, g, dilución y criterios de valor terminal según el sector, con valor elegido, trayectoria, evidencia, mecanismo económico, alternativas e invalidadores. Para empresas financieras adaptar FCFE/Ke, ROE, fondeo y capital regulatorio; holdings adaptan SOTP.

**Actualizar sin recortar ni aparentar cierre:** preservar historia, contenido sustantivo y fuentes de la última revisión pertinente; reubicar capítulos por su tema y completar evidencia ausente. No inventar, no copiar supuestos ajenos, no revalorar por reorganización. Una reubicación mecánica es solo `ESTRUCTURA_MIGRADA`, nunca prueba de investigación terminada; se requiere revisión semántica de coherencia y profundidad. Sin fuente suficiente registrar `PENDIENTE_EDITORIAL` con tema y material faltante. No desplegar cambios como auditados sin auditoría económica independiente, que sigue después de revisión visual del usuario.

**Compatibilidad:** informes anteriores mantienen su revisión y texto original hasta migración documental; la app no debe fabricar los 14 capítulos para un legado ni declarar que cumplen. Los validadores de los 18 encabezados quedan reemplazados. Porter y cinco filosofías son opcionales, solo si generan una visión específica útil. Los números de valoración, las fórmulas, el Método A/B y la auditoría no cambian por el estilo.

## 10. Una valoración vigente por empresa y archivo de revisiones

- Al pedir una **valoración nueva**, crearla en una copia limpia de la plantilla vigente y archivar las valoraciones anteriores de esa misma empresa, con sus análisis, auditorías, exportaciones y revisiones sustituidas. Conservar una sola valoración de trabajo vigente por empresa; sus cuatro historias no son cuatro expedientes distintos.
- Usar la carpeta de Drive [Valoraciones antiguas](https://drive.google.com/drive/folders/10ZCGoZ4hKVqtg6ekcyYHsm8IHPZOBVLq). Los expedientes retirados el 24-oct-2026 están en [Revisiones sustituidas](https://drive.google.com/drive/folders/1M2sWqAR60HBIBx0JbRn057kawpD9ZsZG). Archivar conserva los archivos e identificadores; no borrar el historial.
- El archivo histórico queda **excluido de las entradas automáticas, selección de valoración vigente, importación a la app y recuperación de supuestos**. Un título antiguo que diga «vigente», «final» o «publicada» no acredita vigencia. Resolver siempre por empresa, revisión e identificador de la hoja actual.
- No copiar supuestos, resultados, dictámenes ni narrativa de otra revisión como si pertenecieran al expediente nuevo. Los documentos financieros primarios pueden reutilizarse únicamente tras verificar fuente, fecha, período y pertinencia; no confundir un estado histórico con una valoración anterior.
- En EN_REVISIÓN, valoración y análisis activos deben ser de la misma revisión y el dictamen económico se marca pendiente. En el cierre auditado, las tres piezas deben compartir revisión. Nunca reutilizar auditorías archivadas como dictamen vigente. La nueva revisión conserva su estado real y archivar la previa no equivale a validar ni publicar la nueva.
- Mantener un registro de movimientos y comprobar origen, destino y hoja conservada. Una actualización ordinaria conserva la identidad del expediente y su historial de versiones; una valoración nueva sustituye la anterior en el catálogo activo.

Hojas de trabajo conservadas tras el archivo del 24-oct-2026 (identidad documental; no certifica publicación ni validación):

| Empresa | Revisión de trabajo | ID de la hoja |
|---|---|---|
| NKE | R4 · 23-oct-2026 | `1wWS0qNCWvSrYCI53kk7H1zBshn-RJWjeKFu10sHCNWw` |
| NFLX | v7 · 23-oct-2026 | `18JpUSeyJ9i7MOqHJ3-yB3Kz4BuwTXIwlIwoJvdlbfnE` |
| META | R4 · 23-oct-2026 | `1Ap5ylZGNdW_qyEIH5dVy22jTfHSy1TNB5bFsiW1IXsg` |
| NVDA | R1 · 23-oct-2026 | `1hvlfGunORzgup0OyxyW0QRBcosZ_xooLI-gMH1kixpE` |

## 11. Hojas unificadas y reparto del trabajo entre la IA y las fórmulas

**Reparto.** Lo que la IA aporta es (1) conseguir los **datos crudos** con su fuente primaria y (2) **estimar los supuestos** y explicar por qué. Todo cálculo lo hacen las fórmulas de la hoja. La IA no escribe resultados sobre celdas con fórmula, no «calibra» una salida y no reconstruye un cálculo fuera de la hoja.

**Ubicación en Drive (obligatoria).** Toda hoja de valoración se crea —copia de la plantilla— directamente en `AAA Finanzas / Análisis / <TICKER>/` (id de Análisis `1IVpgm89jA4BmYVc3HKSCQ1iec4fpYE25`): una carpeta por empresa, nombrada con el **ticker** (no con el nombre de la empresa), que se crea si no existe. Nunca en la carpeta de plantillas, en la raíz de Análisis, en un archivo histórico ni en otra carpeta. La hoja vigente de cada ticker vive en esa carpeta; las anteriores se archivan según las reglas de revisiones sustituidas. Al mover un archivo se conserva su ID.

**Formato único.** Cada nueva valoración parte de una copia de la plantilla maestra vigente (registro en `JMR-valuation/reference/plantillas.json`), compartida por IA y Manual. Desde 28-oct-2026 el formato oficial contiene 46 pestañas de valoración, datos y supuestos; desde 4-nov-2026, 47 con la pestaña informativa `DCF FCFE` (§1). Las copias históricas de 61 pestañas conservan su versión:
- las mismas pestañas del perfil vigente (47; el 4-nov-2026 se añadió `DCF FCFE` a las hojas vigentes de operativas del catálogo, sin cambiar sus valores; las financieras con FCFE propio, las revisiones sustituidas y cualquier copia anterior que falte conservan 46 y su ausencia es solo AVISO en `diff_formulas_plantilla.py`), en el mismo orden y con las mismas dimensiones; no se añaden, quitan, renombran ni reordenan en una valoración individual. Los soportes propios de una empresa (conciliaciones SEC, registros de revisión y auditorías) van a expedientes independientes y no agregan pestañas a la valoración;
- todas las fórmulas de la plantilla intactas: una fórmula sustituida por un número, o editada, es un hallazgo bloqueante;
- **todos los selectores** (validaciones de datos: `B12`, `B22`, `B26`, selectores de método, de historia y de ponderación) con su validación original. Cambiar una opción es elegir de la lista; un selector reemplazado por un valor o eliminado es un hallazgo bloqueante.

**Datos crudos.** Se diligencian todos los datos de entrada aplicables, cada uno con fuente (nota de la celda o pestaña `Origen de los Supuestos`: documento, URL, período, página o nota, fecha de consulta). La materialidad del §4B decide qué faltante secundario no bloquea; nunca se inventa un cero.

**Auditoría independiente.** Una vez publicada la valoración y el análisis como EN_REVISIÓN, el usuario hace la revisión visual. La auditoría económica se inicia solo cuando la solicita y se documenta en un **Google Sheets independiente por ticker y revisión**, vinculado al expediente. No se añaden pestañas de auditoría a la valoración ni se modifican sus resultados.

**Control.** Las valoraciones nuevas deben compararse con el perfil oficial vigente (47 pestañas; 46 en copias anteriores al 4-nov-2026); los expedientes históricos de 61 pestañas conservan su perfil original. Antes de confiar en el resultado UNIFICADA de `scripts/unificacion_hojas.py`, se debe adaptar el validador a los dos perfiles y validar referencias, fórmulas y selectores. No declarar la regresión integral superada hasta ejecutar ese control.

**Entregables.** El análisis fundamental siempre completo (§9). La auditoría explica el porqué de cada supuesto estimado y la fuente de **todos** los datos de entrada, con un inventario que cubra todas las celdas de entrada (prompt de auditoría v1.3).

## 12. Dos métodos de estimación de supuestos (28-oct-2026)

- **Método A:** nueva calibración por drivers operativos, clases de referencia de crecimiento y rentabilidad, margen y reinversión consistentes, persistencia del ROIC y seguimiento prospectivo. Se especifica en [`METODO_A_JMR.md`](METODO_A_JMR.md). No constituye una metodología de cálculo distinta: las fórmulas, el núcleo de cinco múltiplos aplicables, dos complementarios voluntarios, cuatro historias, MOS, condiciones de publicación y plantillas siguen el mismo motor.
- **Método B:** el procedimiento JMR anterior, preservado sin cambios de fondo como instantánea completa v15 en [`METODO_B_JMR.md`](METODO_B_JMR.md). Estudios anteriores sin etiqueta se interpretan B sin reescribir sus cifras.
- Para nuevas valoraciones registrar método/version/fecha/revisión/hoja en el expediente conforme a [`METODOS_VALORACION.md`](METODOS_VALORACION.md). Prohibido mezclar supuestos A y B en una sola revisión. Las comparaciones se hacen con copias aisladas y mismo corte. No introducir un selector en la plantilla ni pestañas de auditoría.
- **Prioridad normativa:** estos controles comunes (integridad, contabilidad, fórmulas, autoría, fuente, materiales y publicación) rigen ambos métodos. Las diferencias de **calibración** entre A y B siguen el método expresamente elegido; el archivo B no se reescribe por cambios futuros sin registrar revisión.
- La existencia de estos documentos no certifica integración del selector a la app ni validación predictiva de A. Las pruebas automáticas y el seguimiento se documentarán antes de proclamar su calibración superior.

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 38 | 10-nov-2026 | §0R.1: la IA ejecutora solo captura históricos 10 FY + LTM, propone supuestos justificados y redacta análisis; resultados por fórmulas/vínculos y sincronización aprobada; prohibido reconfigurar plantillas durante valoración. Cambio documental, sin modificar libros ni motores. |
| 39 | 11-nov-2026 | §0R.0: libro único (`floyd-libro-unico-v1`) vigente para revisiones nuevas; plantilla `04 LIBRO ÚNICO`; plantillas 01/02b/03 archivadas; `Input sheet` alimentado desde H; app lee `libros.unico`. Revisiones heredadas siguen en `jmr-reboot-3libros-v1`. Sin cambio de fórmulas del motor ni de MOS 35 % sobre Base. |
| 35 | 9-nov-2026 | §0: tres plantillas Floyd oficiales (H1 Históricos, H2 Valoración con Presentación, H3 análisis N1+N2), carpeta y prompt maestro; no cambia motor, supuestos ni expedientes existentes. |
| 34 | 8-nov-2026 | §0: Floyd es el perfil oficial para nuevas operativas FCFF. Órdenes F1–F5 de Floyd, tres escenarios y controles de publicación por revisión. |
| 33 | 4-nov-2026 (Colombia) | §2: calidad económica de supuestos, fichas causales y seguimiento; guía v2 con fuentes originales, motores de ingresos, comisión, margen/inversión conjuntos, ROIC marginal y eficiencia; distingue convenciones JMR y conceptos estadísticos. Sin recalcular valoraciones ni alterar fórmulas, probabilidades o gates. La fecha local difiere de registros anteriores fechados en UTC. |
| 32 | 5-nov-2026 | §2: los supuestos salen de la historia; guía `docs/HISTORIAS_A_NUMEROS.md` obligatoria en F1/F3/F5; crecimiento derivado de TAM₁₀ × participación objetivo con fila de brecha historia − modelo en cada historia (`build_historias_sheet.py`, aplicada a plantillas y hojas vigentes sin cambio de valores); control de publicación para revisiones nuevas. |
| 31 | 4-nov-2026 | §2: historias → números según Damodaran (tipo de historia, párrafo, vínculo por palanca, prueba 3P con números frente a TAM e industria, juicio por P y disparadores ruptura/cambio/desplazamiento); costo de capital común y fracaso solo en Disrupción (entrada propia); TAM como dato de F1. Sección nueva en `Escenarios e historias` A104:N238 (`JMR-valuation/scripts/build_historias_sheet.py`), aplicada a Maestra, IA, Manual y 24 hojas vigentes de operativas con valores idénticos antes y después (DUOL, aplicada después de mover su DCF de control a A242:N256, es la primera con las cuatro historias completas; financieras y sustituidas sin la sección, AVISO en `diff_formulas_plantilla.py`). |
| 30 | 4-nov-2026 | §1 y §11: la pestaña `DCF FCFE` se añade a Maestra, IA y Manual (perfil 47) y a las 25 hojas vigentes de operativas (XP, NU y PAGS excluidas), sin cambiar fórmulas existentes ni valores; Ke terminal = (WACC_T − wD·Kd·(1−t) − wP·Kp)/wE; control hoja = Python 25/25 (`verificar_fcfe_sheet.py`). Respaldo y resultados en `JMR-valuation/reference/backups/dcf_fcfe_2026-11-04/`. |
| 29 | 4-nov-2026 | §1: el DCF por FCFE y el ponderado FCFF/FCFE (50 % / 50 % por defecto) se muestran con su ponderación en la tabla de valores potenciales de la app, igual que el DCF y los múltiplos; siguen sin entrar en el valor principal ni llevar MOS. Sin cambios de método ni de valores. |
| 28 | 4-nov-2026 | §1 y §9: el DCF por FCFE (pestaña `DCF FCFE` de la plantilla) pasa a mostrarse en registro, app y Nivel 2 como dato informativo; no es valor principal, no lleva MOS y el ponderado FCFF/FCFE no entra en el valor principal. Sin cambios de método ni de valores principales. |
| 27 | 2-nov-2026 | §0D: contrato vinculante de obtención completa de datos mínimos de DCF, cinco múltiplos y todas sus hojas auxiliares (WACC, I+D, leases, Option value y demás); control por celda y no cero ficticio. Sin cambios económicos ni publicaciones. |
| 26 | 2-nov-2026 | §0C: flujo operativo de cinco fases, valoración inicial focalizada, historia en F2, juicio F3, publicación F4 y auditoría guiada F5; Forward Valuation deprecado, retiro físico solo tras regresión y perfil 45. |
| 25 | 2-nov-2026 | §0B: indicadores de rentabilidad y múltiplos históricos y LTM mediante fórmulas trazables; precios históricos con fecha y split, sin sobrescribir celdas derivadas. Conserva A-1.2, MOS y valores existentes. |
| 24 | 2-nov-2026 | §0A: integridad de conceptos contra fuentes primarias, ceros/agrupaciones documentados y control complementario anticeros antes de promover. Aplica a cualquier IA, sin alterar resultados existentes ni método económico. |
| 23 | 30-oct-2026 | Unificación documental: tres prompts activos 1/3 valoración, 2/3 análisis (14 capítulos con ciclos autónomos, Nivel 2 con 12 apartados), 3/3 auditoría (18 secciones). Sensibilidades DCF Base y de múltiplos Base aplicables obligatorias en la hoja; P/S y P/BV opcionales. Los prompts históricos no son autoridad ni se ejecutan. No modifica fórmulas, valoraciones ni datos. |
| 22 | 30-oct-2026 | §5A, §8, §9: P/S y P/BV pasan a ser complementarios opcionales; no bloquean publicación/cobertura cuando no se usan, sin cambiar plantillas, fórmulas, pesos existentes ni valoraciones. Cinco métodos prioritarios sujetos a aplicabilidad; matrices solo cuando hay base verificable. |
| 21 | 30-oct-2026 | §8: Nivel 2 incluye sensibilidades 5×5 por múltiplo Base y, cuando existe, segundo ancla LTM; centros conciliados al VP3 propio. No modifica fórmulas, resultados ni estados de auditoría. |
| 20 | 30-oct-2026 | §9: ciclo corporativo de Damodaran, ciclo macro/crédito/sentimiento de Marks y especificación verificable de Nivel 2 completo. Solo edición; sin cambios de valoración ni probabilidades. |
| 19 | 30-oct-2026 | §9: Estilo JMR narrativo propio de 13 capítulos y Nivel 2 cuantitativo; Porter/cinco filosofías dejan de ser obligatorios. No se recalcula ninguna valoración. |
| 18 | 29-oct-2026 | §9: se conserva el índice largo y ordenado de META/AZ Stocks en Nivel 1; ampliaciones financieras como subsecciones; Nivel 2 independiente y cuantitativo. Control de nombres y orden, no solo 18 encabezados; sin recalcular valores. |
| 17 | 28-oct-2026 | §4C: control de calidad de reinversión, lag, S/C marginal y ROIC, puente de empresas híbridas y revisión versionada de legados; sin alterar motores DCF, versiones pasadas ni auditoría. |
| 16 | 28-oct-2026 | Coexisten dos métodos de calibración: A (drivers/tasas base/ROIC) y B (instantánea íntegra de las reglas v15); cálculo, plantilla y auditoría permanecen compartidos. No hay recálculo de empresas ni cambio de motor. |
| 15 | 28-oct-2026 | Plantillas oficiales reducidas de 61 a 46 pestañas; las auditorías se mantienen en Google Sheets independientes después de revisión visual. Se preservaron respaldos. Validación automática de perfil pendiente. |
| 14 | 28-oct-2026 | PREF-02: coste esperado de híbridos, cupón separado y control de faltantes; respaldos y regresión. |
| 13 | 28-oct-2026 | §5B: puentes separados de utilidad común, FCFE y patrimonio para preferentes; mantenimiento autorizado, respaldos y regresión. Sin recalcular otras empresas ni certificar WACC de híbridos. |
| 12 | 27-oct-2026 | §8A: proceso híbrido, controles técnicos antes de la publicación preliminar, observaciones por revisión y auditoría posterior. Sin cambios financieros. |
| 11 | 26-oct-2026 | §11 nuevo: hojas unificadas (formato de la maestra, fórmulas y selectores intactos, sin pestañas añadidas), reparto IA (datos crudos y supuestos) y fórmulas (cálculo); control `unificacion_hojas.py`. Auditoría v1.3: porqué de cada supuesto y fuente de todos los datos de entrada. Sin cambios en valores de empresas. |
| 10 | 26-oct-2026 | Conciliación de prompts: el contrato de historias y múltiplos pasa a matrices solo en la Base; el MOS de METODOLOGIA y de los prompts de Colombia se aplica sobre el DCF/SOTP Base; los anexos de precisión y de múltiplos se enlazan desde §6. Sin cambios en fórmulas ni en valores de empresas. |
| 9 | 24-oct-2026 | §10: una sola valoración vigente por empresa; las nuevas valoraciones archivan las anteriores con sus documentos asociados; archivo excluido de selección e importación automática. Se identifican las cuatro hojas actuales sin certificar su validación ni publicación. |
| 8 | 23-oct-2026 | §5A: el analista/IA elige y justifica el peso de cada múltiplo según el tipo de empresa y su modelo de negocio; sin pesos universales ni omisión de cálculos por peso cero. |
| 7 | 23-oct-2026 | §5A y §8: cálculo obligatorio de siete múltiplos con fórmulas existentes; P/S y P/BV en Maestra/IA/Manual; juicio limitado a entradas, múltiplos de salida y pesos; controles también con peso cero. Sin recálculo ni publicación de empresas. |
| 6 | 23-oct-2026 | §§4A–4B, 8: capitalización de I+D, leases, opciones, cálculo WACC Detailed con beta multi-negocio y ERP geográfico, límites de materialidad y estados de verificación. No se modifican valores de empresas. |
| 5 | 23-oct-2026 | §9: análisis fundamental completo como regla permanente; cobertura sustantiva de las 18 secciones, adaptación sectorial, dos niveles, preservación del artículo al actualizar y verificación editorial en auditoría. Sin cambios en fórmulas, ponderaciones ni mínimos cuantitativos del §8. |
| 4 | 21-oct-2026 | Revisión del historial (38 valoraciones que nunca salieron de «conciliado con salvedades»): previas simétricas (antes la Conservadora pesaba más en todas las etapas), control de márgenes sin alertar lo ya demostrado (umbral 2,5× sector), §8 proceso eficiente (un comando, mínimo obligatorio, estado VALIDADO, una auditoría por publicación). |
| 3 | 21-oct-2026 | Prompts de análisis fundamental (v5 corregido) y auditoría (v1.2) alineados y válidos para cualquier modelo: el análisis copia las cifras de la valoración oficial (no recalcula), MOS solo sobre la Base (el texto anterior decía «sobre el esperado»), promedio de tres historias, probabilidades por previa + indicadores; la auditoría busca sesgo en ambas direcciones (agresividad y prudencia duplicada) y verifica g, ajuste por tasas y ancla C. |
| 2 | 21-oct-2026 | Prompt de valoración v5 (`docs/prompts/valoracion-modelo-jmr-v5.md`): autocontenido y válido para cualquier modelo de lenguaje, un solo método de múltiplos (el v4 mezclaba λ, ciclo y Toro), etiquetas [Dato]/[Cálculo]/[Juicio] y ficha JSON de salida. Calibración honesta (§2). Topes de Toro retirados (doble prudencia). |
| 1 | 21-oct-2026 | Consolida las reglas dispersas en los prompts (17, 18 y 21-oct). MOS sobre DCF Base o SOTP Base (antes había código que lo calculaba sobre el esperado). Probabilidades por previa + indicadores. g terminal 4% (antes = tasa libre, 5,29%). Prima por país en la fecha del corte. Ajuste por tasas y tope del ancla C en los múltiplos por ciclo. Controles de razonabilidad y foto de supuestos. |
| 36 | 9-nov-2026 | §0R: reboot del modelo. Perfil Reboot con LIBRO HISTÓRICOS, DCF y MÚLTIPLOS más análisis, fases R1–R6, flujo H→D/H→M/M→D con huella; Floyd solo para UBER y CMG. Archivo previo en `archivo-v1/`. Sin cambio de fórmulas ni de MOS 35 % sobre Base. |
