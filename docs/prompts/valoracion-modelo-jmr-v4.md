# Prompt Maestro: Modelo de Valoración Damodaran para Cualquier Ticker (v4)

> Reemplaza a la v3 (30-sep-2026). Conserva el proceso de punta a punta (SEC EDGAR, costo de capital, supuestos anclados, chequeo de bugs, múltiplos con tres anclas, múltiplos a valor presente, guardado en Drive) y adopta el **criterio de Damodaran** como eje:
>
> 1. **El valor intrínseco es el DCF.** El DCF de hoy es la cifra principal de la valoración.
> 2. **Los múltiplos son precio relativo y se tratan por aparte.** Se eligen con el protocolo de tres anclas (historia depurada, peers ajustados y múltiplo justificado), nunca derivados del DCF. Se pueden ponderar con el DCF en la app con los pesos de la categoría de empresa, pero esa mezcla es opcional y nunca reemplaza al DCF.
> 3. **Primero la historia, después los números y el precio al final.** Cada supuesto sale de una historia explícita (posible, plausible, probable), contrastada con tasas base; se cuantifican tres o cuatro historias con probabilidades y un valor esperado; el precio aparece recién al final (DCF inverso y crecimiento implícito) para no anclar el análisis.
> 4. **Decisión separada del análisis.** El documento termina con un registro de decisión; la decisión (comprar, mantener o vender) la toma el usuario en la app.
>
> Pensado para pegarse tal cual (reemplazando `{TICKER}`).

---

## Contexto que hay que tener antes de usar el prompt

- Repo `JMR-valuation` con `jmr_valuation/io/sec_edgar_loader.py`, `scripts/refresh_native_model.py` y `scripts/discount_multiples.py`.
- Una **plantilla maestra en blanco** en Google Sheets (formato Damodaran/Ginzu) con las correcciones estructurales aplicadas (ver el apéndice) y la hoja **«Descuento de múltiplos»** (múltiplos a valor presente en 1, 2 y 3 años). Si arrancás de una plantilla distinta, verificá primero que tenga ambas cosas; si le falta la hoja, corré `PYTHONPATH=.:scripts python scripts/discount_multiples.py --sheet-id <ID>`.
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

Reglas que aplican a todo el proceso:
- Toda cifra material lleva fuente y fecha (link directo a 10-K/10-Q/20-F/6-K,
  comunicado o proveedor de datos). No uses información posterior a la fecha de
  corte. No inventes consensos, múltiplos de peers, cifras ni links: si un dato no
  existe, decilo y explicá cómo afecta el supuesto.
- Separá siempre dato reportado, cálculo tuyo y juicio del analista.
- Guardá un backup de cualquier celda o fórmula antes de sobreescribirla. Todos
  los cambios deben ser reversibles.

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
   - Revisá splits, recompras netas, compensación en acciones, partidas no
     recurrentes y cambios de perímetro que distorsionen la historia o los
     múltiplos históricos de 'Trailing Valuation'.

2. COST OF CAPITAL
   - En "Cost of capital worksheet", verificá la industria (Input!B9/B10) contra la
     clasificación real de Damodaran, el approach de beta (normalmente "Single
     Business(Global)"), y el approach de costo de deuda: si la empresa no tiene
     deuda calificada real (interest expense ~0), usar "Direct Input" con un spread
     razonable en vez de dejar un rating heredado sin sentido.
   - BETA BOTTOM-UP (Damodaran): la beta de regresión de la acción es solo una
     referencia. Partí de la beta desapalancada del sector de Damodaran (tabla
     "Betas by Sector (US)", corregida por caja, fecha de la tabla), reapalancala
     con la D/E de mercado de la empresa y justificá cualquier ajuste por riesgo
     propio (concentración de clientes o de un distribuidor, una sola categoría,
     moda, regulación). Documentá beta de regresión, beta del sector, beta usada
     y el efecto en el DCF de usar una u otra.
   - Confirmá que el WACC resultante (celda de "Cost of capital based upon approach")
     sea coherente con el perfil de riesgo de la empresa. Anotá también el costo
     del patrimonio (Ke, 'Cost of capital worksheet'!B63): es la tasa con la que se
     descuentan los múltiplos a hoy.

3. INVESTIGACIÓN CUALITATIVA (WebSearch, no inventar)
   - Buscá: último earnings call / shareholder letter, guía oficial de la empresa
     (crecimiento, márgenes), consenso de analistas y revisiones de precio objetivo,
     noticias relevantes de los últimos 1-2 meses, eventos corporativos (M&A,
     directorio, litigios).
   - Buscá también los múltiplos actuales de al menos 3 comparables del mismo
     modelo de negocio (con la fecha y la definición de cada múltiplo) y verificá
     que la hoja "Sector" tenga esos peers y no los de otra empresa.
   - Llená con esto: Cualitativo (empresa, segmentos, bull/bear case, y la sección
     "Acontecimientos y Noticias Recientes" — NO dejar el contenido de la empresa
     anterior si estás reescribiendo la plantilla), Estadísticas (empleados, deuda,
     ratios reales), Stories to Numbers (narrativa + link de cada supuesto a la
     historia).

3B. HISTORIA Y VISIÓN EXTERNA (criterio Damodaran; ANTES de fijar supuestos y SIN
    mirar la cotización ni los múltiplos de mercado)
   - Escribí la historia en un párrafo: qué es la empresa en 5-10 años, de dónde
     sale el crecimiento, qué margen es sostenible y por qué, cuánto hay que
     reinvertir y qué riesgo tiene. Pasala por el filtro posible / plausible /
     probable en una tabla con la evidencia de cada afirmación.
   - Visión externa: ubicá a la empresa en su tramo de tamaño de las tasas base de
     crecimiento de ventas a 5 años (Mauboussin & Callahan, The Base Rate Book,
     2016, Exhibit 4 — real, en dólares de 2015: sumá la inflación esperada para
     comparar con el DCF nominal; o "Bayes and Base Rates 2.0" si tenés la cifra
     nominal). Reportá la media, la mediana y qué fracción de empresas de ese
     tamaño logra el crecimiento que proponés. Te alejás de la tasa base solo con
     evidencia específica, y lo decís.
   - Descomponé el crecimiento en piezas verificables: por segmento, marca,
     producto o región; orgánico frente a comprado (las adquisiciones rompen la
     comparabilidad y no son crecimiento gratis); cuando exista, ventas al
     consumidor o sell-through frente a lo facturado (separa demanda de
     inventario); participación de mercado y crecimiento de la categoría.
   - Márgenes: separá GAAP de normalizado (cargos de una vez, integración,
     litigios, amortización de compras) y anclá el objetivo en un comparable
     maduro del mismo negocio, explicando la brecha de margen bruto y de escala.
   - Reinversión y retorno: orgánico (capex, capital de trabajo, sales-to-capital
     real) y comprado (precio pagado frente a ventas y NOPAT de lo comprado =
     retorno sobre lo pagado vs. costo de capital). El capital invertido debe
     incluir todo lo que financió el negocio (también preferentes o mezzanine).

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
     genérico. Chequeá que el ROIC implícito del año 10 sea razonable.
   - ROIC después del año 10 (B49/B50), criterio Damodaran: por defecto la
     plantilla supone que en la etapa estable la empresa gana exactamente su
     costo de capital (B49 = "No"), así que el crecimiento a perpetuidad no crea
     valor. Cambialo solo si se cumplen las tres condiciones:
       1. Ventaja competitiva identificable y durable (marca, efectos de red,
          costos de cambio, escala, licencias o patentes que se renuevan),
          explicada en la historia. Un ROIC alto hoy no alcanza.
       2. ROIC actual ('Valuation output'!B42) por encima del costo de capital
          terminal ('Valuation output'!M14), sostenido en los últimos 3-5 años.
       3. La historia Base no pone esa ventaja bajo amenaza directa
          (sustitución tecnológica, pérdida sostenida de participación,
          competencia que ya presiona precios).
     Si se cumplen: B49 = "Yes" y B50 = el MENOR entre el ROIC actual y el ROIC
     después de impuestos de su industria en Damodaran (misma fecha que las
     betas). Si el promedio de la industria no es representativo (NA, o por
     debajo del costo de capital porque agrega muchas empresas con pérdidas,
     p. ej. Software (Internet)), usá la industria madura más cercana y decilo.
     Nunca un ROIC terminal mayor que el actual ni menor que el costo de capital
     terminal. Dejá nota en B50 con el valor, la fuente y el motivo, y reportá
     el DCF con y sin el ajuste. Si no aplica, escribí por qué (qué condición
     falla). Después revisá que los múltiplos de salida sigan contando la misma
     historia (paso 6.5, crecimiento implícito).
   - Cada supuesto de la hoja tiene que salir de la historia del paso 3B: los
     escenarios Conservador, Base y Optimista son historias, no porcentajes
     redondos alrededor del Base. Si el Base se aleja de la tasa base de su
     tamaño, la evidencia específica tiene que estar escrita.

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

5B. HISTORIAS, PROBABILIDADES Y VALOR ESPERADO (criterio Damodaran)
   - Definí 3 o 4 historias mutuamente excluyentes (por ejemplo: la historia
     central, una más débil, una de deterioro y una de éxito amplio). Para cada
     una: crecimiento por segmento o marca en los años 1-5, margen objetivo,
     sales-to-capital y, si corresponde, riesgo. Cuantificá cada historia con el
     motor del modelo calibrado contra el DCF Base de la hoja
     (scripts/damodaran_stories.py) sin tocar la hoja.
   - Asigná probabilidades justificadas (evidencia de hoy + tasas base) y calculá
     el valor esperado por acción. Mostrá también una tabla de sensibilidad
     crecimiento × margen del DCF Base.
   - Pre-mortem: si en 3 años la tesis falló, ¿por qué? (al menos cuatro causas),
     y la evidencia en contra de tu propia historia central.
   - Indicadores: 6-8 métricas observables con su valor actual y los umbrales que
     reforzarían cada historia, y una regla para mover las probabilidades cada
     trimestre (5-10 pp según la evidencia) sin cambiar el valor de cada historia
     salvo que cambie un supuesto.

6. MÚLTIPLOS OBJETIVO (PRECIO RELATIVO) — SELECCIÓN RAZONADA E INDEPENDIENTE DEL DCF
   (hojas EVEBITDA, EVFCFF, PE, PFCFE, POCF; celdas J8 = Conservador,
   J19 = Base, J30 = Optimista)

   El múltiplo de salida responde a: ¿cuánto pagaría razonablemente el mercado al
   cierre de FY+3 por cada unidad de métrica de esta empresa, dado lo que será en
   ese momento (crecimiento, rentabilidad, riesgo)? NO es una variable de ajuste.

   PROHIBIDO: derivar un múltiplo del valor del DCF (Valor de Equity del DCF /
   Utilidad Neta, EV del DCF / EBITDA, 'Valuation output'!B26/F20 o similares),
   o mover un múltiplo después de ver el DCF para que ambos valores se acerquen.
   Eso vacía la comparación intrínseco vs. relativo: los múltiplos tienen que ser
   una segunda opinión, no un eco del DCF. (Esto reemplaza el paso 6 de la v2.)

   6.1 Aplicabilidad de cada método: aplicable / aplicable con cautela / no aplicable.
       - La métrica proyectada de FY+1 a FY+3 ('Financials Multiples') tiene que
         ser positiva y representativa; si es negativa o casi cero, el método NO
         aplica.
       - Financieras: EV/EBITDA y EV/FCFF no aplican. Endeudamiento neto errático:
         P/FCFE con cautela. Cíclicas: métrica normalizada a mitad de ciclo. SBC
         material: advertir que P/OCF y los múltiplos de caja la ignoran.
       - Si un método no aplica, no le pongas un múltiplo arbitrario: dejalo
         documentado y resolvelo en la ponderación (paso 8).

   6.2 Tres anclas obligatorias por método (con definición, período y fuente):
       A. HISTORIA DEPURADA de la empresa ('Trailing Valuation': P/E fila 13,
          P/OCF 15, P/FCF 16 como referencia de P/FCFE, EV/EBITDA 21, EV/FCF 24
          como referencia de EV/FCFF; resumen en 'Supuestos de los Múltiplos').
          EV/FCF usa el flujo DESPUÉS de intereses: para compararlo con EV/FCFF
          multiplicalo por (FCF después de intereses ÷ FCFF) de 'Financials
          Multiples'. Si el último cierre trae partidas no operativas en
          'Interest / Other' (ganancias en inversiones, diferencia cambiaria),
          usá la mediana de los tres cierres o 1,0 y decilo. En los peers, EV/FCFF
          = EV ÷ (FCF + intereses × (1 − 21%)).
          Revisá que la historia esté ajustada por splits: cierres con múltiplos
          ~10-20 veces menores que los siguientes son precio sin ajustar, no
          historia; excluilos y decilo (y no los uses como tope del Optimista).
          Mediana de 5 y 10 años, percentiles 25 y 75, mínimo, máximo y LTM.
          Excluí y listá los atípicos: años con métrica negativa o ~0, múltiplos
          > 2,5× la mediana (burbuja) o < 0,4× (crisis puntual), salvo que sean el
          régimen actual. Excluí también los cierres distorsionados por partidas no
          recurrentes (ej. un beneficio tributario único que infla la utilidad) y
          citá la fuente. Si la empresa cambió de etapa (hipercrecimiento → madurez,
          o una re-valoración del sector), usá como A solo los cierres de la etapa
          actual más el LTM y declará desde qué año y por qué. Si no queda ningún
          cierre representativo, decilo: ese método se ancla en B y C.
       B. COMPARABLES ('Sector', filas 3-11: P/E en F, EV/FCF en G, P/FCF en H,
          EV/EBITDA en I, P/OCF en J; P/E forward en E). Mínimo 3 peers del mismo
          modelo de negocio, misma definición y fecha. Reportá mediana, rango y n.
          Ajustá la mediana EXPLÍCITAMENTE por diferencias de crecimiento a FY+3,
          margen, ROIC y riesgo — cada ajuste en % y con su motivo (ej. "−15%
          porque su crecimiento a FY+3 es la mitad del de los peers").
       C. MÚLTIPLO JUSTIFICADO POR FUNDAMENTALES (Damodaran), con los SUPUESTOS del
          escenario (no con su resultado), en FY+3:
            EV/FCFF   = (1 + g) / (WACC − g)
            P/FCFE    = (1 + g) / (Ke − g)
            P/E       = payout sostenible × (1 + g) / (Ke − g),
                        payout sostenible = 1 − g / ROE
            EV/EBITDA = EV/FCFF justificado × (FCFF / EBITDA de FY+3)
            P/OCF     = P/FCFE justificado × (FCFE / OCF de FY+3)
          g = punto medio entre el crecimiento promedio de los años 4-10 del
          escenario y el de perpetuidad (nunca mayor al de los años 4-10); WACC =
          promedio de los años 4-10; ROE = utilidad de FY+3 / patrimonio en libros
          LTM. g siempre al menos 1 pp por debajo de Ke y de WACC: si no, C no se
          calcula para ese escenario. Si Ke − g es chico y el resultado se dispara,
          decilo y dale menos peso a C.
          Si cambiás supuestos de crecimiento/margen/tasa, recalculá SOLO el ancla C.

   6.3 Regla para fijar los tres escenarios:
       - BASE (J19) = (1 − λ) × promedio(A, B) + λ × C_base.
         λ (entre 0 y 1) dice cuánto se acerca el Base al justificado: poco (0-0,25)
         si la empresa de FY+3 se parece a la de hoy o si C es inestable; más si la
         empresa de FY+3 va a ser claramente distinta. Declará λ y su motivo. Si A
         no tiene cierres representativos, usá B en lugar de promedio(A, B).
         Si la empresa crece mucho más hoy que en FY+3 (ej. 80% hoy, 40% en FY+3),
         el múltiplo de hoy no sirve para la métrica de FY+3: no lo uses como A.
         Si C no se puede calcular (g ≥ Ke o WACC − 1 pp), λ no aplica.
         Control: el Base tiene que quedar DENTRO del rango [mín(A,B,C);
         máx(A,B,C)]; si queda afuera es una excepción que justificás con
         evidencia concreta.
       - CONSERVADOR (J8) = Base × promedio de las dispersiones a la baja de cada
         ancla: P25/mediana de A, P25/mediana de los peers y C_conservador/C_base.
         Así el escenario Conservador sale de la misma lógica que el Base (menor
         crecimiento, múltiplos del cuartil bajo). NO uses "Base × 0,9" por inercia.
       - OPTIMISTA (J30) = Base × promedio de las dispersiones al alza: P75/mediana
         de A, P75/mediana de los peers y C_optimista/C_base. No superes el máximo
         de toda la historia depurada sin justificarlo.
       - Peers: excluí y justificá los que no son comparables en la etapa o en la
         métrica (en declive, en dificultades, con margen GAAP negativo o
         distorsionado por compensación en acciones) y los megacaps de otro perfil.
         El ajuste sobre la mediana de peers (en %) resume diferencias de
         crecimiento, margen, ROIC y riesgo, con cada componente explicado.
       - Siempre Conservador < Base < Optimista. Escribí los tres valores en
         J8/J19/J30 con 2 decimales (explícitos, sin depender de reglas
         automáticas de la plantilla).
       - Coherencia entre métodos: los cinco Base tienen que contar la misma
         historia (un EV/EBITDA alto con un P/E bajo solo se sostiene si lo
         explica la deuda o los impuestos). Explicá cualquier incoherencia.

   6.4 Chequeo de independencia (DESPUÉS de fijar los múltiplos): leé en
       'Descuento de múltiplos' los múltiplos consolidados hoy y comparalos con el
       DCF hoy.
       - No cambies ningún múltiplo para acercar uno al otro.
       - Diferencia > ±25%: explicá la causa (el mercado paga más/menos que los
         fundamentales, ciclo, supuestos agresivos del DCF) y cuál de los dos es
         más confiable para esta empresa y por qué.
       - Diferencia < ±5% en la mayoría de los métodos: confirmá expresamente que
         los múltiplos salieron de A, B y C y no del DCF.

   6.5 Chequeo de crecimiento implícito (criterio Damodaran), OBLIGATORIO:
       corré scripts/implied_growth.py {TICKER} (escribe la pestaña 'Crecimiento
       implícito' de la hoja, el JSON de reference/multiplos_v3 y el campo
       crecimientoImplicito de la valoración guardada).
       - Múltiplos: cada múltiplo Base se compara con el MÚLTIPLO QUE IMPLICA EL
         DCF en FY+3 (el que, con la misma métrica FY+3, deuda neta, acciones y
         dividendos de la hoja, da el DCF llevado a FY+3). Los dos pasan por la
         misma fórmula de crecimiento perpetuo (las de C despejadas para g), así
         que el sesgo de la fórmula —supone el ROE de FY+3 para siempre, mientras
         el DCF lleva el retorno al costo de capital después del año 10— se
         cancela. Alerta: diferencia > 2 pp en crecimiento implícito o > 25% en
         valor (con múltiplos altos el crecimiento de Gordon se acerca al costo
         de capital en los dos casos y deja de distinguir diferencias grandes).
       - DCF inverso: el crecimiento de ingresos de los años 1-5 que justifica el
         precio de hoy frente al del DCF.
       - Ante una alerta, decidí con evidencia cuál historia es la correcta y
         alineá los supuestos: si la evidencia sostiene más crecimiento, subilo en
         el DCF (y C sube solo); si no (historial de otra etapa, crecimiento
         comprado con adquisiciones, historial corto), acercá el múltiplo al
         justificado subiendo λ (0,5 o más) y dejá el histórico solo como tope del
         Optimista. Nunca muevas uno para que se parezca al otro sin esa decisión.
       - El crecimiento por adquisiciones no es gratis: separá orgánico de
         comprado y tratá las compras como reinversión.

   6.6 Documentación en la hoja:
       - 'Supuestos de los Múltiplos'!A3: síntesis de 3-5 líneas (regla usada,
         anclas principales, ajustes, excepciones). Aclará que J8/J19/J30 se
         fijaron con este protocolo aunque los rótulos de la fila 5 digan
         "x0,9" o "mín. positivo 4 cierres".
       - 'Supuestos de los Múltiplos'!A12: evaluación (diferencia con el DCF y
         método más confiable para esta empresa).
       - La tabla completa de origen va en la hoja de tesis (paso 10) y en el .md
         (paso 11).

7. MÚLTIPLOS A VALOR PRESENTE (hoja "Descuento de múltiplos", automática)
   - La hoja trae a hoy cada múltiplo en 1, 2 y 3 años:
     VP_n = (Precio objetivo FY+n + Dividendos acumulados FY+1..FY+n) / (1 + Ke)^n,
     consolida cada método con el promedio de los tres horizontes (C6 = "Solo 3
     años" usa solo el de 3 años) y pondera: DCF hoy × peso DCF + múltiplos
     consolidados hoy × peso múltiplos.
   - No escribas en ella salvo C5 (Ke manual, solo con motivo documentado) o C6.
   - Verificá: Ke (B5) = el Ke del paso 2; el chequeo "VP a 3 años < FY+3 sin
     descontar" dice OK en los tres escenarios (filas 47-49 y columna K); y
     'Resumen de Valoración' C32:E34 muestra DCF hoy, múltiplos hoy y ponderado.
   - Si la hoja no existe, corré scripts/discount_multiples.py (ver Contexto).

8. PONDERACIÓN OPCIONAL DE MÉTODOS (Resumen de Valoración)
   - El valor intrínseco es el DCF. El ponderado DCF + múltiplos es una lectura
     opcional que la app muestra por aparte; los pesos dependen del tipo de
     empresa (tabla I5:U11) y solo tiene sentido si los múltiplos pasaron el
     chequeo de crecimiento implícito (6.5).
   - Revisá qué categoría de "Tipo de Empresa" (G3) mejor describe a {TICKER}
     (Crecimiento, Madura, Software, Financiera, REIT, Cíclica, Intensiva en
     Capital, Infraestructura, Defensiva, Hyper-Crecimiento/Pre-Rentable,
     Biotech/Farma, Genérico) y justificá la elección.
   - Si ninguna encaja, o un método quedó "no aplica" en el paso 6.1 y la
     categoría le da peso, primero probá otra categoría que refleje mejor el
     historial. Solo si ninguna sirve, ajustá los pesos de la tabla compartida:
     afecta a TODAS las empresas de esa categoría (también las ya valoradas), así
     que registrá el cambio con antes/después en el log y avisá en el reporte
     final qué otras valoraciones usan esa categoría.
   - Regla general: más peso al DCF y a múltiplos de flujo de caja (FCFF/FCFE/OCF)
     cuando las utilidades/EBITDA son volátiles o negativas en el historial; más
     peso a P/E y EV/EBITDA cuando la empresa tiene utilidades estables y maduras.

9. BARRIDO DE ERRORES
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

10. HOJA RESUMEN "DE LA HISTORIA A LOS NÚMEROS"
   - Completá la hoja "Tesis de Inversión y Supuestos" (creala si no existe) con:
     a) La historia en 3-4 líneas: la tensión central del caso de inversión.
     b) Tabla bull case / bear case.
     c) Tabla que conecta cada supuesto (crecimiento, margen, años de
        convergencia, sales-to-capital, WACC, Ke) con su justificación y la fuente
        real de datos, para los tres escenarios.
     d) TABLA DE ORIGEN DE LOS MÚLTIPLOS, una fila por método: aplicabilidad;
        ancla A (mediana 5A/10A, P25-P75, LTM, atípicos excluidos); ancla B
        (mediana de peers, n, rango, ajuste en % y motivo); ancla C (fórmula, g,
        tasa, resultado); Conservador / Base / Optimista elegidos; regla y
        excepciones; celdas escritas.
     e) Tabla de resultado por escenario, separando HOY de FY+3:
        DCF hoy · múltiplos consolidados hoy · valor intrínseco ponderado hoy ·
        precio con MOS hoy · precio objetivo FY+3 ponderado · precio actual y
        diferencia (valor hoy / precio − 1).
     f) Log breve de cualquier corrección estructural que hayas tenido que hacer
        (para que quede trazable qué se tocó y por qué).
     g) Conclusión de 3-4 líneas con la variable clave a monitorear y cuál de los
        dos enfoques (DCF o múltiplos) es más confiable para esta empresa.
     h) Historias con probabilidades y valor esperado (paso 5B).

11. GUARDADO EN LA CARPETA DE ANÁLISIS DE LA EMPRESA (obligatorio, sin pedir permiso)
   - La hoja del modelo queda donde está; no la muevas ni la dupliques.
   - Generá un resumen en Markdown llamado
     {TICKER}_Valoracion_Modelo_JMR_[AAAA-MM-DD].md con estas secciones, en este
     orden (el precio aparece recién en la sección 11):
       1. Resumen: valor intrínseco (DCF hoy) por escenario y valor esperado de
          las historias; en una línea aparte, los múltiplos como precio relativo.
          Sin precio de mercado.
       2. Historia y visión externa (paso 3B): historia, filtro posible /
          plausible / probable, tasas base, descomposición del crecimiento,
          márgenes normalizados, reinversión y retorno.
       3. Datos: link a la hoja, fecha de corte, conciliación de las cifras base.
       4. Supuestos del DCF por escenario (valor, celda, procedencia, evidencia a
          favor y en contra) y costo de capital (Rf, beta de regresión y beta
          bottom-up, ERP, Ke, Kd, pesos, WACC inicial y terminal).
       5. Historias, probabilidades y valor esperado (paso 5B): tabla de
          historias, sensibilidad crecimiento × margen, pre-mortem e indicadores.
       6. Múltiplos (precio relativo): la tabla de origen del paso 10.d y un
          párrafo por método; chequeo de independencia (6.4).
       7. Resultados: precio FY+3 por método y escenario; los 15 valores presente
          por escenario; consolidado por método; DCF hoy; ponderado hoy
          (opcional); MOS; chequeo VP3 < FY+3.
       8. DCF vs. múltiplos (lectura Damodaran: qué expectativas reflejan los
          múltiplos, qué supone el DCF, cuál es más confiable y por qué).
       9. Sensibilidad del DCF (±2 pp de crecimiento, ±3 pp de margen, ±1 pp de
          WACC, beta de regresión vs. bottom-up) y de los múltiplos (±20%).
      10. Log de cambios en la hoja y correcciones estructurales.
      11. El precio al final: precio actual; DCF inverso (crecimiento de los años
          1-5 que justifica el precio, con varios márgenes y betas); crecimiento
          implícito de cada múltiplo (6.5); qué historia necesita el precio y
          "¿qué sabe el mercado que yo no?".
      12. Registro de decisión: historia en una frase, probabilidades, valor
          esperado, rango, confianza, qué cambiaría la opinión y fecha de
          revisión. La decisión (comprar / mantener / vender) la registra el
          usuario en la app; no la tomes por él.
      13. Fuentes (primarias y secundarias, con fecha y link directo).
      14. Control de calidad (tabla Sí/No, marcando Sí solo si lo verificaste): lo
          de la v3 más: historia escrita antes de los números; tasas base del
          tamaño reportadas; orgánico vs. comprado separado; margen normalizado
          anclado en un maduro; beta bottom-up documentada; 3-4 historias con
          probabilidades y valor esperado; pre-mortem e indicadores; el precio
          no aparece antes de la sección 11.
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
     (ver "JMR - PROMPT Research (VIGENTE v5).md" en la carpeta Prompts).

Reportame al final: el valor intrínseco (DCF hoy) por escenario y el valor esperado
de las historias; los múltiplos consolidados hoy como precio relativo y el ponderado
opcional; recién después, el precio actual y el DCF inverso; el precio objetivo FY+3
Base y el rango Conservador-Optimista; los cinco múltiplos Base con su ancla
principal; la diferencia DCF vs. múltiplos y su explicación; cualquier bug
estructural que hayas encontrado y corregido (con antes/después); cualquier cambio
a la tabla compartida de pesos; y el link al resumen guardado en la carpeta de
análisis.
```

---

## Qué cambió respecto de la v3

| Tema | v3 | v4 |
|---|---|---|
| Valor intrínseco | DCF hoy, múltiplos hoy y ponderado presentados juntos | El DCF es el valor intrínseco; los múltiplos son precio relativo por aparte; el ponderado es opcional (app) con pesos por tipo de empresa |
| Orden del análisis | Supuestos → resultados → comparación con el precio | Historia → visión externa → supuestos → historias con probabilidades → precio al final |
| Tasas base | No | Obligatorias por tramo de tamaño (Mauboussin) |
| Crecimiento | Un número agregado | Por segmento o marca; orgánico vs. comprado; sell-through vs. facturado |
| Beta | Regresión o la del libro | Bottom-up del sector (Damodaran), la de regresión como referencia |
| Escenarios | Conservador / Base / Optimista | Además 3-4 historias con probabilidades y valor esperado, pre-mortem e indicadores |
| Decisión | No | Registro de decisión; comprar / mantener / vender lo elige el usuario en la app |

## Qué cambió respecto de la v2

| Paso | v2 | v3 |
|---|---|---|
| 6. Múltiplos (reglas precisadas tras el piloto ADBE/DUOL del 29-sep-2026: etapa actual, cierres no recurrentes, g del justificado, λ y Conservador/Optimista por dispersión) | Si el historial cruzaba de negativo a positivo, el múltiplo objetivo se calculaba como implícito del DCF (Equity DCF / Utilidad, EV DCF / EBITDA); si no, MIN de 4 años con ±10% | Tres anclas obligatorias (historia depurada, peers ajustados, múltiplo justificado por fundamentales); regla explícita para Base, Conservador y Optimista; prohibido derivar del DCF o ajustar después de verlo; chequeo de independencia; documentación en la hoja |
| 7. Valor presente | No existía | Hoja «Descuento de múltiplos»: VP a 1, 2 y 3 años, consolidado y ponderado con el DCF hoy; chequeo VP3 < FY+3 |
| 8. Ponderación | Ajustar la tabla compartida si la categoría no calza | Primero elegir otra categoría; si se cambia la tabla, registrarlo y avisar a qué valoraciones afecta |
| 10-11. Entregables | Valor DCF y precio objetivo ponderado | DCF hoy, múltiplos hoy y ponderado hoy por separado, tabla de origen de los múltiplos, sensibilidad y control de calidad |

Motivo: en la evaluación del 29-sep-2026, 100 de 110 múltiplos Base de las 22 valoraciones guardadas estaban escritos a mano en ~0,48× la mediana histórica de cada empresa, y en varias el valor de los múltiplos quedó casi igual al del DCF (DUOL, INTU, PLTR, ADBE), con casos derivados del DCF de forma explícita (LULU). Así, los múltiplos dejaban de funcionar como segunda opinión.

---

## Apéndice: bugs estructurales ya corregidos en la plantilla maestra (si arrancás de la plantilla ya corregida, no deberías volver a encontrarlos)

| # | Problema | Fix aplicado |
|---|---|---|
| 1 | Encabezados "Columna 2/3/4" en empresas con <10 años de historial | Padding con "—" en vez de celda vacía |
| 2 | Acciones en circulación desactualizadas en empresas dual-class / IPO reciente | Fallback a diluted weighted-average shares |
| 3 | CAGR9Y dividía por columna vacía → cascada de #DIV/0! por todo el árbol de escenarios | IFERROR en `Crecimiento y Márgenes!C7:C9` |
| 4 | P/E y EV/EBITDA rotos por historial de utilidades que cruza de negativo a positivo | v2: múltiplos implícitos del propio DCF. **v3: reemplazado** por la selección razonada del paso 6 (si la métrica proyectada es negativa, el método no aplica; si solo la historia es ruidosa, pesan más los peers y el múltiplo justificado) |
| 5 | Referencia circular en "Option value" (Black-Scholes con dilución) | Cálculo iterativo habilitado + IFERROR en la cadena |
| 6 | "TICKER" en blanco en varias hojas (`Input sheet!B1` vacío) | `Input sheet!B1` ahora referencia `Input sheet!A1` |
| 7 | Ponderación de métodos con preset genérico no calibrado al historial real | Rediseño de las 12 categorías + 2 nuevas (Hyper-Crecimiento/Pre-Rentable, Biotech/Farma) |
| 8 | `Valuation output!C46` (margen objetivo Base) desconectado de `Input!B30`, usaba LTM fijo | Reconectado a `Input sheet!B30` |
| 9 | `Valuation output!C45` (margen Conservador) podía colapsar a fuertemente negativo | Anclado al margen actual (mismo basis ajustado) |
| 10 | `Valuation output!C55` (crecimiento Conservador) podía superar al del Base | Anclado a un valor explícitamente inferior al Base |
| 11 | `Valuation output!C47`/`C106` (margen/crecimiento Optimista) podían quedar por debajo del Base, o usar un "LTM" mal etiquetado (en realidad el crecimiento del último año fiscal completo) | Recalibrados con fórmulas auto-ajustables por encima del Base |
| 12 | Margen Año 1 (`Input!B28`) comparado contra la base sin ajustar en vez de la base ajustada por I+D (`Valuation output!B6`) | Recalibrado contra el basis correcto |
| 13 | Proyección de capital de trabajo (NWC) basada en ΔNWC/ΔIngresos: explotaba cuando ΔIngresos ≈ 0 y referenciaba celdas vacías (H42/H82) | Reemplazada por intensidad de NWC (NWC / ingresos) aplicada a los ingresos proyectados (`scripts/model_steps.py::fix_nwc_projection`) |
| 14 | El Resumen mezclaba el DCF (valor hoy) con los múltiplos (precio FY+3) | Auditoría A3: DCF × (1+Ke)³ para el bloque FY+3; y hoja «Descuento de múltiplos» (29-sep-2026) con los múltiplos traídos a hoy en 1, 2 y 3 años, DCF hoy, múltiplos hoy y ponderado por separado |

**Regla de oro para cualquier ticker nuevo:** antes de confiar en cualquier output del DCF, verificá con datos reales (no con la fórmula "tal como está") que el ordenamiento Conservador < Base < Optimista se cumple en crecimiento, margen Y valor final. Si no se cumple, hay una celda desconectada en algún lado — es más común de lo que parece en esta plantilla. **Y para los múltiplos:** si su valor hoy coincide casi exactamente con el DCF, sospechá que no son independientes y revisá de dónde salieron.
