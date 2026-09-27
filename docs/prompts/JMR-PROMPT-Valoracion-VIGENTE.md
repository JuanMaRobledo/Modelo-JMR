# Prompt Maestro: Modelo de Valoración Damodaran para Cualquier Ticker (v2)

> Destilado de la sesión de armado del modelo de DUOL. Pensado para pegarse tal cual (reemplazando `{TICKER}`) y disparar todo el proceso de punta a punta, incluyendo los chequeos que evitaron que el modelo quedara con errores silenciosos.

---

## Contexto que hay que tener antes de usar el prompt

- Repo `JMR-valuation` con `jmr_valuation/io/sec_edgar_loader.py` y `scripts/refresh_native_model.py`.
- Una **plantilla maestra en blanco** en Google Sheets (formato Damodaran/Ginzu) ya con las correcciones estructurales aplicadas (ver sección "Bugs ya corregidos" más abajo). Si vas a arrancar de una plantilla distinta, primero verificá que tenga esas correcciones.
- Credenciales de service account con acceso de Editor a la plantilla (`GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT`).
- Conector de Google Drive de la cuenta del usuario para guardar los entregables en `AAA Finanzas › Análisis › <empresa>` (carpeta `Análisis`, ID `1IVpgm89jA4BmYVc3HKSCQ1iec4fpYE25`). La service account no tiene cuota de Drive: no puede crear archivos propios, solo editar los que ya existen.
- Acceso a `WebSearch` para la parte cualitativa (noticias recientes, guía de la empresa, comparables).

---

## El prompt

```
Quiero que armes un modelo de valoración DCF completo para {TICKER} usando la
plantilla Damodaran/Ginzu en Google Sheets [ID o nombre de la plantilla maestra].
Como la plantilla probablemente ya tiene datos de otra empresa, sobreescribila en
vez de duplicarla (a menos que haya cupo de Drive para copiar).

Seguí este proceso, en este orden:

1. DATOS DUROS (automatizado, no toques manualmente lo que ya cubre el script)
   - Corré el pipeline de scripts/refresh_native_model.py para {TICKER}: trae datos
     reales de SEC EDGAR (XBRL) y llena Income Statement, Balance Sheet, Cash Flow
     Statement, encabezados de período, Trailing/Forward Valuation, Eficiencia de
     capital, Márgenes, Salud Financiera, Por acción y Sector.
   - Si es una empresa con menos de 10 años de historial o con estructura dual-class
     (acciones en circulación puede quedar stale), revisá que:
     a) los encabezados de período no muestren "Columna 2/3/4" (bug de Sheets Tables
        con celdas vacías — el padding debe ser "—", no "").
     b) las acciones en circulación no estén desactualizadas — si el tag puntual de
        XBRL dejó de reportarse, usar el fallback a diluted weighted-average shares
        (ya está en sec_edgar_loader.py, pero verificalo con el 10-Q/10-K más reciente).

2. COST OF CAPITAL
   - En "Cost of capital worksheet", verificá la industria (Input!B9/B10) contra la
     clasificación real de Damodaran, el approach de beta (normalmente "Single
     Business(Global)"), y el approach de costo de deuda: si la empresa no tiene
     deuda calificada real (interest expense ~0), usar "Direct Input" con un spread
     razonable en vez de dejar un rating heredado sin sentido.
   - Confirmá que el WACC resultante (celda de "Cost of capital based upon approach")
     sea coherente con el perfil de riesgo de la empresa.

3. INVESTIGACIÓN CUALITATIVA (WebSearch, no inventar)
   - Buscá: último earnings call / shareholder letter, guía oficial de la empresa
     (crecimiento, márgenes), consenso de analistas y revisiones de precio objetivo,
     noticias relevantes de los últimos 1-2 meses, eventos corporativos (M&A,
     directorio, litigios).
   - Llená con esto: Cualitativo (empresa, segmentos, bull/bear case, y la sección
     "Acontecimientos y Noticias Recientes" — NO dejar el contenido de la empresa
     anterior si estás reescribiendo la plantilla), Estadísticas (empleados, deuda,
     ratios reales), Stories to Numbers (narrativa + link de cada supuesto a la
     historia).

4. SUPUESTOS DE CRECIMIENTO Y MARGEN (Input sheet B27-B33) — la parte que más se
   rompe si se hace a ojo. Para cada uno, ANCLAR a un dato real, nunca a un número
   redondo:
   - Crecimiento Año 1 (B27): entre el crecimiento trailing reciente y la guía
     oficial más reciente de la empresa (no la guía vieja).
   - Crecimiento Años 2-5 (B29): desacelera respecto al Año 1, informado por el
     tamaño del mercado total direccionable y la madurez de la categoría.
   - Margen Año 1 (B28): ¡OJO! compará este número contra el margen "Base year"
     que el modelo realmente usa como continuidad — en 'Valuation output'!B6, que
     puede estar AJUSTADO por capitalización de I+D (si Input!B17="Yes") y no
     coincide con el margen GAAP/LTM crudo del Income Statement. Si B28 queda muy
     por debajo de B6 sin ninguna razón real (ej. guía de compresión de márgenes
     de la empresa), estás introduciendo una caída artificial en el año 1.
   - Margen objetivo de largo plazo (B30): ancorar en comparables MADUROS del
     mismo modelo de negocio (no en el promedio de industria crudo de Damodaran si
     ese promedio está distorsionado por empresas no rentables — revisar la hoja
     "Industry Averages(US)" antes de usarlo a ciegas), y no en el nivel de una
     megacap de otro perfil de negocio.
   - Años de convergencia (B31): más cortos si la brecha actual es temporal, más
     largos (7-10) si la empresa está reinvirtiendo a propósito (la propia guía de
     la empresa suele decir esto explícitamente — ej. "el margen retrocede el año
     que viene porque vamos a gastar más en marketing").
   - Sales-to-capital (B32/B33): bottom-up con CapEx/Revenue real, no un default
     genérico.

5. VERIFICAR QUE EL DCF REALMENTE USE ESOS SUPUESTOS (checklist de bugs conocidos
   de esta plantilla — revisar ANTES de confiar en los outputs, no después):
   - 'Valuation output'!C46 (margen objetivo del caso Base) debe ser
     ='Input sheet'!B30. Si en cambio es "=C49" o similar, está usando el margen
     LTM fijo e IGNORANDO tu supuesto de B30 — arreglalo.
   - 'Valuation output'!C45 (margen objetivo del caso Conservador) NO debe ser un
     MIN() crudo de estadísticas históricas de 10 años (puede colapsar a negativo
     si la empresa tuvo pérdidas grandes en el pasado, aunque hoy sea rentable).
     Preferí anclarlo al margen actual (mismo basis ajustado que B6 — "la historia
     de mejora se estanca donde ya está") o al promedio de industria SI ese
     promedio queda por debajo del caso Base (verificalo, no asumas).
   - 'Valuation output'!C55 (crecimiento del caso Conservador) NO debe salir de un
     MIN() de crecimiento histórico crudo — para una empresa de alto crecimiento
     eso puede dar un número MÁS ALTO que el propio caso Base, lo cual es absurdo
     para un escenario "conservador". Anclalo a algo explícitamente más bajo que
     el Base: el extremo bajo de la guía oficial de la empresa, o la tasa libre de
     riesgo si preferís el extremo más severo.
   - 'Valuation output'!C47/C106 (margen y crecimiento del caso Optimista) deben
     quedar POR ENCIMA del Base en ambas dimensiones. Revisá la fórmula real
     detrás de cada uno — en esta plantilla, por default, suelen estar atados a
     un MAX() de estadísticas históricas o a una celda "LTM" que en realidad
     repite el crecimiento del último año fiscal completo (no una tasa realmente
     trailing-twelve-months) — chequeá contra un dato real y reciente (ej. la tasa
     de crecimiento de la métrica operativa clave: usuarios, GMV, etc.) en vez de
     confiar en la etiqueta "LTM" de la hoja.
   - Confirmá el ORDEN final: Conservador < Base < Optimista en crecimiento,
     margen objetivo, y valor DCF por acción. Si no ordena así, hay un desconecte
     en alguna fórmula — no lo ignores.

6. MÚLTIPLOS OBJETIVO (hojas EVFCFF, POCF, PE, PFCFE, EVEBITDA)
   - Si el historial de la empresa tiene utilidades que cruzan de negativo a
     positivo (P/E y EV/EBITDA con signos que se invierten año a año), el
     mecanismo nativo de "MIN de los últimos 4 años" se rompe (puede dar
     múltiplos absurdos tipo -1500x). En ese caso, no uses el trailing histórico:
     calculá el múltiplo "objetivo" como implícito del propio DCF —
       Target P/E = Valor de Equity del DCF (Base) / Utilidad Neta proyectada FY+1
       Target EV/EBITDA = Enterprise Value del DCF (Base) / EBITDA proyectado FY+1
     — y repetí lo mismo para Conservador/Optimista con sus propios valores de
     DCF, en vez de aproximar con ±10% sobre Base si tenés tiempo de hacerlo bien.
   - Repetí el cálculo cada vez que cambies un supuesto de crecimiento/margen —
     quedan desactualizados en cuanto el DCF se mueve.

7. PONDERACIÓN DE MÉTODOS (Resumen de Valoración)
   - Revisá qué categoría de "Tipo de Empresa" mejor describe a {TICKER} en el
     selector (Crecimiento, Madura, Software, Financiera, REIT, Cíclica,
     Intensiva en Capital, Infraestructura, Defensiva, Hyper-Crecimiento/
     Pre-Rentable, Biotech/Farma, Genérico).
   - Si ninguna encaja bien, o el preset existente no calza con el historial real
     de la empresa (ej. le da mucho peso a EV/EBITDA cuando esa métrica fue
     históricamente inestable/con signo cambiante para esta empresa puntual),
     ajustá los pesos de esa categoría — no solo para esta empresa, hacelo en la
     tabla compartida (afecta a cualquier empresa futura que use esa categoría).
   - Regla general: más peso al DCF y a múltiplos de flujo de caja (FCFF/FCFE/OCF)
     cuando las utilidades/EBITDA son volátiles o negativas en el historial; más
     peso a P/E y EV/EBITDA cuando la empresa tiene utilidades estables y maduras.

8. BARRIDO DE ERRORES
   - Recorré TODAS las hojas del libro buscando celdas que empiecen con "#"
     (#DIV/0!, #REF!, #VALUE!, #N/A). Filtrá los falsos positivos (etiquetas de
     texto tipo "# Warrants issued=" o encabezados de tabla que literalmente
     dicen "#").
   - Los errores reales casi siempre vienen de: columnas de período vacías
     (CAGR dividiendo por blanco), falta de dividendos/opciones/deuda (fórmulas
     nativas que no contemplan el caso "sin dato"), o referencias circulares en
     "Option value" cuando no hay opciones de empleados (activar cálculo
     iterativo + IFERROR en la cadena).
   - Un puñado de errores en "Industry Averages(US)" (filas de industrias chicas
     con datos faltantes) son preexistentes del dataset de Damodaran y no
     dependen de la empresa que estés cargando — confirmalo comparando contra la
     plantilla en blanco antes de gastar tiempo en ellos.

9. HOJA RESUMEN "DE LA HISTORIA A LOS NÚMEROS"
   - Creá una hoja nueva (ej. "Tesis de Inversión y Supuestos") con:
     a) La historia en 3-4 líneas: la tensión central del caso de inversión.
     b) Tabla bull case / bear case.
     c) Tabla que conecta cada supuesto (crecimiento, margen, años de
        convergencia, sales-to-capital, WACC) con su justificación y la fuente
        real de datos, para los tres escenarios.
     d) Tabla de resultado: valor DCF y precio objetivo ponderado por escenario,
        vs. precio actual.
     e) Log breve de cualquier corrección estructural que hayas tenido que hacer
        (para que quede trazable qué se tocó y por qué).
     f) Conclusión de 3-4 líneas con la variable clave a monitorear.

10. GUARDADO EN LA CARPETA DE ANÁLISIS DE LA EMPRESA (obligatorio, sin pedir permiso)
   - La hoja del modelo queda donde está; no la muevas ni la dupliques.
   - Generá un resumen en Markdown llamado
     {TICKER}_Valoracion_Modelo_JMR_[AAAA-MM-DD].md con: link a la hoja, fecha de
     corte y de cotización, precio actual, WACC, supuestos por escenario, valor DCF
     y precio objetivo ponderado por escenario, y el log de correcciones con
     antes/después.
   - Guardalo en Google Drive en AAA Finanzas › Análisis › <empresa>. Buscá la
     subcarpeta por ticker y por nombre (p. ej. "NKE" o "PayPal"); usá la que ya
     tenga los análisis previos y creala con el ticker solo si no existe ninguna.
     Si ya hay un archivo con el mismo nombre, actualizalo en vez de duplicarlo.
   - Subilo como text/markdown sin convertir a Google Docs y a nombre de la cuenta
     del usuario: si solo tenés la service account, creá primero el archivo vacío
     con el conector de Drive y después cargá el contenido actualizándolo con la
     service account.
   - Verificá tamaño y MD5 contra el archivo local, devolvé el link y no muevas,
     renombres ni borres otros archivos de esa carpeta.
   - Si además se pidió el research fundamental, ese .md va en la misma carpeta
     (ver "JMR - PROMPT Research (VIGENTE v4.1).md" en la carpeta Prompts).

Reportame al final: el precio actual, el rango Conservador-Optimista, el precio
objetivo Base, cualquier bug estructural que hayas encontrado y corregido (con
antes/después) y el link al resumen guardado en la carpeta de análisis. Todos los cambios deben quedar reversibles — guardá un backup de
cualquier fórmula que sobreescribas antes de tocarla.
```

---

## Apéndice: bugs estructurales ya corregidos en la plantilla maestra (si arrancás de la plantilla ya corregida, no deberías volver a encontrarlos)

| # | Problema | Fix aplicado |
|---|---|---|
| 1 | Encabezados "Columna 2/3/4" en empresas con <10 años de historial | Padding con "—" en vez de celda vacía |
| 2 | Acciones en circulación desactualizadas en empresas dual-class / IPO reciente | Fallback a diluted weighted-average shares |
| 3 | CAGR9Y dividía por columna vacía → cascada de #DIV/0! por todo el árbol de escenarios | IFERROR en `Crecimiento y Márgenes!C7:C9` |
| 4 | P/E y EV/EBITDA rotos por historial de utilidades que cruza de negativo a positivo | Múltiplos objetivo recalculados como implícitos del propio DCF |
| 5 | Referencia circular en "Option value" (Black-Scholes con dilución) | Cálculo iterativo habilitado + IFERROR en la cadena |
| 6 | "TICKER" en blanco en varias hojas (`Input sheet!B1` vacío) | `Input sheet!B1` ahora referencia `Input sheet!A1` |
| 7 | Ponderación de métodos con preset genérico no calibrado al historial real | Rediseño de las 12 categorías + 2 nuevas (Hyper-Crecimiento/Pre-Rentable, Biotech/Farma) |
| 8 | `Valuation output!C46` (margen objetivo Base) desconectado de `Input!B30`, usaba LTM fijo | Reconectado a `Input sheet!B30` |
| 9 | `Valuation output!C45` (margen Conservador) podía colapsar a fuertemente negativo | Anclado al margen actual (mismo basis ajustado) |
| 10 | `Valuation output!C55` (crecimiento Conservador) podía superar al del Base | Anclado a un valor explícitamente inferior al Base |
| 11 | `Valuation output!C47`/`C106` (margen/crecimiento Optimista) podían quedar por debajo del Base, o usar un "LTM" mal etiquetado (en realidad el crecimiento del último año fiscal completo) | Recalibrados con fórmulas auto-ajustables por encima del Base |
| 12 | Margen Año 1 (`Input!B28`) comparado contra la base sin ajustar en vez de la base ajustada por I+D (`Valuation output!B6`) | Recalibrado contra el basis correcto |
| 13 | Proyección de capital de trabajo (NWC) basada en ΔNWC/ΔIngresos: explotaba cuando ΔIngresos ≈ 0 y referenciaba celdas vacías (H42/H82) | Reemplazada por intensidad de NWC (NWC / ingresos) aplicada a los ingresos proyectados (`scripts/model_steps.py::fix_nwc_projection`) |

**Regla de oro para cualquier ticker nuevo:** antes de confiar en cualquier output del DCF, verificá con datos reales (no con la fórmula "tal como está") que el ordenamiento Conservador < Base < Optimista se cumple en crecimiento, margen Y valor final. Si no se cumple, hay una celda desconectada en algún lado — es más común de lo que parece en esta plantilla.
