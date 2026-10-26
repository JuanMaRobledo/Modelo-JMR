# Conciliación de prompts: época del 30-sep al 20-oct frente a hoy (26-oct-2026)

Revisión hecha sobre el historial de `Modelo-JMR`, `Modelo-JMR-datos` y `JMR-valuation`. Todo lo citado sale de commits, de
archivos del repositorio o de `modelo/REGLAS_VIGENTES.md`; lo que es opinión va marcado como tal.

## 1. Qué versión es la mejor

**Conjunto de datos: el estado del 20-oct-2026** (`Modelo-JMR-datos@f5bde54`). Es el último estado con las 38 valoraciones,
38 análisis y el cierre `auditorias/cierre-valoraciones-2026-10-19.json`. Una nota sobre las fechas: el 30-sep había 22
valoraciones, el 11-oct 26, y se llegó a 38 entre el 14 y el 19-oct (34 el 13-oct, 39 el 15-oct, 38 del 16 al 19). Por eso
las 38 no caben en la ventana 30-sep a 11-oct; esa ventana es la de los prompts v4/v5 con criterio Damodaran, que son la
base de las 38.

| Época | Valoraciones | Prompt valoración / research | Qué pasó |
|---|---|---|---|
| 30-sep a 5-oct | 22 | 49 a 63 KB / 65 a 80 KB | Núcleo Damodaran: cuatro historias, DCF Base, ROIC terminal por foso. Limpio y legible. |
| 6 a 11-oct | 22 a 26 | 63 a 120 KB / 80 a 134 KB | Se añaden capas fechadas (fórmula única, aislamiento, flujo desde cero). Los commits del 11-oct reportan consistencia 16/16 e integridad 0. |
| 12 a 19-oct | 26 a 38 | 120 a 144 KB / 134 a 158 KB | Colombia, holdings, dos familias de 21 matrices por empresa, «contratos vigentes» apilados. Cierre: 38 en «conciliado con salvedades». |
| 20 a 21-oct (mañana) | 38 | 56 KB / 76 KB y nace la auditoría v1 | Depuración. Tres prompts independientes (valoración, análisis, auditoría). |
| 21-oct (tarde) a hoy | 4 | 26 KB / 84 KB / 25 KB | Se vació el catálogo y se empezó de cero: NFLX v7, NKE R6, NVDA R4 y META R5, con unos 200 commits y hasta seis revisiones por empresa. |

**Opinión basada en lo anterior:** la mejor combinación es *datos del 20-oct + reglas de método de hoy* (`REGLAS_VIGENTES`
v9 y los tres prompts v5/v5/v1.2). Los datos del 20-oct dan cobertura (38 empresas con 7 métodos y MOS ya sobre la Base en
36 de 38). Las reglas de hoy corrigen lo que impidió cerrarlas: el propio registro v4 de `REGLAS_VIGENTES` dice que las 38
«nunca salieron de conciliado con salvedades», y el contrato de 21 matrices por familia exigía un trabajo por empresa que
no terminaba. El 11-oct es la mejor versión *del método* en simplicidad, pero cubría solo 26 empresas.

## 2. Por qué lo de hoy da problemas (hechos)

1. **Cobertura:** de 38 valoraciones se pasó a 4; Colombia quedó eliminada por pausa pedida el 21-oct.
2. **Retrabajo:** 203 commits sin merges desde el 21-oct, 185 de ellos sobre esas cuatro empresas (NKE llegó a R6, NVDA a R4,
   META a R5). Del 28-sep al 20-oct fueron unos 700 commits, con 22 a 38 empresas publicadas.
3. **Reglas contradictorias que siguen en el repositorio** (verificado por búsqueda de texto):
   - `docs/prompts/contrato-historias-multiplos-20261017.md` está rotulado «CONTRATO VIGENTE 21-OCT-2026» y exige 21 matrices
     por familia; `REGLAS_VIGENTES` §8 dice matrices solo Base y opcionales.
   - `modelo/METODOLOGIA.md` (línea 393) dice que el margen de seguridad se aplica sobre el esperado; `REGLAS_VIGENTES` §1 dice
     solo sobre la Base.
   - `docs/prompts/colombia-nucleo-v1.md` («compra = esperado × 65 %») y `colombia-valuation-v1.md` (apartado «Esperado y
     margen de seguridad») usan el esperado; el núcleo también contradice a `REGLAS_VIGENTES` §1.
   - `docs/prompts/continuar-en-chatgpt-NFLX-2026-10-21.md` es un mensaje de una sola empresa dentro de la carpeta de prompts
     maestros y cita `REGLAS_VIGENTES` versión 4 (hoy es la 9).
   - La v5 de research conserva una «especificación editorial legada» de 77 KB (de 84 KB) subordinada al alcance nuevo.

## 3. Mapa de reglas de la época frente a hoy

| Regla de la época | Fecha | Hoy | Acción |
|---|---|---|---|
| Cuatro historias = escenarios, DCF Base principal, ROIC terminal por foso | 30-sep | v5 §2 a §4; `REGLAS` §2 y §4 | Conservada |
| Jerarquía de resultados, control de integridad, presentación | 1-oct | v5 §7 y §9; `controles_todas.sh` | Absorbida |
| Fórmula única en todas las hojas; hoy y FY+3 | 2-oct | v5 §5; `REGLAS` §5A | Absorbida |
| Flujo desde cero con datos de la SEC | 6-oct | v5 §1 a §3 | Absorbida |
| «Tu posición» en el registro | 6-oct | No está en prompts; habilidad `actualizar-cartera` lee la app Cartera | Mantener fuera del repositorio público |
| Aislamiento por empresa; múltiplos históricos normalizados | 7-oct | v5 §0.4 y §5 (historia propia por ciclo) | Absorbida |
| Controles de precisión | 9-oct | `precision-financiera-2026-10-09.md` sigue como anexo; la v5 no lo cita | **Reponer** el enlace desde `REGLAS` |
| Holdings: valor contable primero | 10-oct | `REGLAS` §1: SOTP Base principal | **Descartada** por contradecir §1 |
| SOTP patrimonial, FCP LP frente a GP, FY+3 sin duplicar | 10-oct | `colombia-*` v1 y menciones en los prompts vigentes | Conservada; Colombia está en pausa |
| Contrato único motor sectorial a visor | 10-oct | Sustituido por `REGLAS` §5A (fórmulas de la plantilla) | Descartada |
| Nivel 1 completo y nivel 2 solo cálculos | 14-oct | `REGLAS` §9 | Absorbida |
| DCF inverso y tres sensibilidades del Base | 15-oct | v5 §6 (texto idéntico) | Conservada |
| Dos familias de 21 matrices por empresa | 16 a 21-oct | `REGLAS` §8: solo Base, opcional | **Descartada**; retirar el archivo del 17-oct de la carpeta de vigentes |
| Probabilidades de la Conservadora por encima en todas las etapas | época | `REGLAS` §3: previas simétricas | Corregida por el usuario el 21-oct |
| Crecimiento terminal igual a la tasa libre | época | `REGLAS` §4: 4 % con techo en la tasa libre | Corregida el 21-oct |

## 4. Propuesta de conciliación

Tres capas, una sola fuente por regla. Opinión mía; nada de esto está aplicado salvo lo indicado en la sección 5.

1. **`modelo/REGLAS_VIGENTES.md` manda.** Cada regla del 30-sep al 20-oct que valga la pena vive allí y solo allí. Un
   prompt no lleva «contratos del día»: eso fue lo que llevó la v4 de 38 KB a 144 KB.
2. **Tres prompts cortos** (valoración, análisis, auditoría) que remiten a las reglas y no las repiten.
3. **Colombia como anexo sectorial**, reducido al núcleo de 2 KB y alineado a `REGLAS` §1, hasta que se reactive.

Ediciones concretas, en este orden y cada una en un commit propio para poder revertirla:

1. `contrato-historias-multiplos-20261017.md` a `archivo/`: contradice `REGLAS` §8.
2. `METODOLOGIA.md` línea 393 y `colombia-nucleo-v1.md`/`colombia-valuation-v1.md`: aplicar el MOS sobre la Base (SOTP Base en
   holdings), como dice `REGLAS` §1, en lugar del esperado.
3. `continuar-en-chatgpt-NFLX-2026-10-21.md` fuera de `docs/prompts/` (a `docs/ejemplos/` o a archivo) y su versión de reglas corregida.
4. Enlazar `precision-financiera-2026-10-09.md` desde `REGLAS`.
5. Recortar la «especificación editorial legada» de la v5 de research (77 KB) a lo que `REGLAS` §9 y la sección 18 no cubren.

Después de cada edición: `node --test tests/prompts-triad.test.mjs tests/work-prompt-parity.test.mjs`.

## 5. Estado de esta entrega

- Prompts de la época archivados sin cambios en `docs/prompts/archivo/epoca-2026-09-30/` y `epoca-2026-10-19/`.
- Ningún prompt vigente se modificó. Las ediciones de la sección 4 quedan pendientes de tu aprobación.
- Datos restaurados en `Modelo-JMR-datos` (rama `ccr-68242d45-bfmwvh`): ver `archivo/snapshot-2026-10-20-38-valoraciones/LEEME.md`.

## 6. Cómo mejorar las 38 una a una

Orden sugerido: las 4 pendientes del cierre del 19-oct (comparables contemporáneos y homogéneos por empresa, valor económico de
no cotizadas de Grupo Argos, SOTP de Grupo Sura y su preferencial, integración sectorial de Colombia) tocan sobre todo a
Colombia, que está en pausa; entonces conviene empezar por las 33 empresas que no son de Colombia. Para cada una, sin recalcular en bloque:

1. `bash scripts/controles_todas.sh <T>` (JMR-valuation): probabilidades, supuestos, consistencia, integridad y estados.
2. Aplicar las reglas del 21-oct que mueven cifras (g terminal 4 %, previas simétricas, prima por país al corte).
3. Una auditoría con `auditoria-economica-jmr-v1.md` y estado final VERIFICADO, VERIFICADO CON RESERVA MATERIAL o PENDIENTE.
   `REGLAS` §8: una auditoría por publicación, sin repetirla sin hecho nuevo.
4. Enlazar el análisis a la valoración (`linkedValuation.sourcePath`) para que `validar_catalogo.cjs` lo acepte, y recién ahí
   sumarlo a `catalogo.json`.
