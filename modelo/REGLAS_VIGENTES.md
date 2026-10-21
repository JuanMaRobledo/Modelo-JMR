# Reglas vigentes del Modelo JMR

**Versión 1 · 21-oct-2026.** Este documento es la única fuente de las reglas de método. Si un prompt
(`docs/prompts/*.md`), `METODOLOGIA.md`, una habilidad o un comentario de código dice otra cosa, prevalece este
documento. Una regla nueva no se agrega como «regla del día X» en un prompt: se cambia aquí, se sube la versión y se
anota en el registro de cambios del final.

## 1. Valor principal y margen de seguridad

- **Empresas operativas (internacionales y colombianas):** valor principal = DCF Base (FCFF; FCFE en financieras).
- **Holdings (Grupo Argos, Grupo Sura y sus preferenciales):** valor principal = SOTP Base.
- **Precio con MOS = valor principal × (1 − MOS)**, MOS = 35%. Nunca sobre el esperado ni sobre el ponderado de
  métodos. En el registro: `baseMOS = "dcfBase"` o `"sotpBase"`. Un holding sin SOTP no tiene precio con MOS.
- Código: `JMR-valuation/scripts/normalize_saved_mos.py`, `consistencia_migracion.py` (M2), `docs/valuation-board.js`
  y `docs/visor.html`.

## 2. Historias y promedio

- Cuatro historias: Base, Conservadora, Optimista y Disrupción, cada una con DCF completo.
- El promedio y el rango ordinarios usan **solo Conservadora, Base y Optimista** (pesos renormalizados). Disrupción
  se presenta aparte («¿Qué pasaría si todo fallara?») y conserva su probabilidad como dato. *(Decisión del usuario
  del 21-oct-2026: se mantiene así.)*

## 3. Probabilidades

- **Previa por etapa del ciclo de vida** (Damodaran), en `JMR-valuation/reference/probabilidades_prior.json`
  (Base / Conservadora / Optimista / Disrupción):

  | Etapa | Previa |
  |---|---|
  | Madura estable | 50 / 25 / 15 / 10 |
  | Crecimiento maduro | 45 / 25 / 20 / 10 |
  | Crecimiento alto | 40 / 25 / 20 / 15 |
  | Declive | 40 / 30 / 10 / 20 |
  | Holding colombiano | 45 / 30 / 15 / 10 |

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

## 5. Múltiplos de salida

- Por ciclo: el múltiplo del escenario es el que la empresa tuvo cuando sus fundamentales se parecían a los del
  escenario en FY+3 (`scripts/multiples_by_cycle.py`).
- **Ajuste por tasas:** cada múltiplo histórico × (k del cierre − g) / (k del corte − g), con k = Treasury +
  prima implícita del cierre (`reference/costo_capital_historico.json`); factor entre 0,6 y 1,4.
- **Topes:** Conservador ≤ múltiplo actual; Base ≤ 0,78× y Optimista ≤ 0,92× el promedio propio; **ningún escenario
  por encima del múltiplo justificado por sus fundamentales (ancla C)**. Comparables solo comprueban.
- Optimista más de 25% sobre el actual: solo con `justificacion_salto` en `<T>_ciclo.json`.

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

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1 | 21-oct-2026 | Consolida las reglas dispersas en los prompts (17, 18 y 21-oct). MOS sobre DCF Base o SOTP Base (antes había código que lo calculaba sobre el esperado). Probabilidades por previa + indicadores. g terminal 4% (antes = tasa libre, 5,29%). Prima por país en la fecha del corte. Ajuste por tasas y tope del ancla C en los múltiplos por ciclo. Controles de razonabilidad y foto de supuestos. |
