# Contexto corto — Modelo JMR (cinco fases)

**Versión 1 · 3-nov-2026 · basado en `modelo/REGLAS_VIGENTES.md` v27.** Resumen operativo para que cualquier IA (Claude, ChatGPT, Gemini) cargue lo esencial sin leer ~20.000 palabras. **No crea reglas ni las cambia:** cada punto remite a su sección (§) de `REGLAS_VIGENTES.md`, que prevalece ante cualquier diferencia. Si una regla cambia allí, actualizar este resumen en el mismo PR.

## 1. Reglas que aplican en todas las fases

1. **Aislamiento.** Una revisión vigente por emisor (ticker · `revision_id` · `sheet_id` · corte). No mezclar empresas, no reutilizar cifras, supuestos ni dictámenes de revisiones archivadas (§10). Declarar `AISLAMIENTO=OK`.
2. **Método.** A-1.2 por defecto; B solo por elección expresa del usuario. Nunca mezclar supuestos A y B en una revisión (§12).
3. **Origen de cada número.** Fuente primaria SEC/NIIF (o Treasury/Damodaran/mercado según el dato) con período, moneda, escala, nota/URL y celda (§0A, §11).
4. **Un cero no es un dato.** Una partida sin cifra separada es: cero publicado, incluida en otra línea (con conciliación), no aplicable (justificado) o pendiente. Nunca rellenar con `0` (§0A).
5. **La hoja calcula; la IA aporta datos crudos y supuestos.** No pegar resultados sobre fórmulas, no editar fórmulas ni reemplazar selectores (`B12`, `B22`, `B26`, método, historia, ponderación). Hacerlo es hallazgo bloqueante (§0B, §11). Perfil oficial: 46 pestañas; `Forward Valuation` deprecada pero no se borra.
6. **Honestidad de controles.** Nunca declarar APROBADO un control no ejecutado; registrar `NO EJECUTADO` con motivo. Los gates no se relajan (§0A, §6).
7. **Sin sesgo hacia el precio.** Nada se ajusta para acercar el valor a la cotización. La Base es la mediana, no el caso prudente: la prudencia vive solo en el MOS. Cada riesgo va en un solo lugar: flujos, tasa o probabilidad (§2).
8. **Materialidad (§4B).** Bloquea solo lo que mueve el valor Base o la decisión, rompe una fórmula/puente o no se puede acotar. `impacto % = 100 × |V_alt − V_base| / |V_base|`. No bloqueante: <2 % individual y <3 % acumulado, sin cruzar la decisión ni defecto estructural.
9. **Continuidad.** Un dato material ausente bloquea solo la salida dependiente (N/D); el resto avanza como CANDIDATO (Continuidad operativa).

## 2. Núcleo de valoración (§1–§5)

- **Valor principal:** DCF Base (FCFF operativas · FCFE financieras · SOTP holdings). **Precio con MOS = Base × 0,65.** Nunca sobre el ponderado (§1).
- **Cuatro historias** con DCF completo: Base, Conservadora, Optimista, Disrupción. Promedio y rango solo con C/B/O renormalizados; Disrupción aparte (§2).
- **Probabilidades previas por etapa** (B/C/O/D): madura 50/20/20/10 · crecimiento maduro 45/22,5/22,5/10 · alto crecimiento 40/22,5/22,5/15 · declive 40/25/15/20 · holding 45/22,5/22,5/10. Ajustes de 5 pp solo con cruce de umbral documentado; máximo 15 pp por historia (§3).
- **Costo de capital:** Rf y ERP del mismo corte; WACC se calcula en `Cost of capital worksheet` (`B12 = Detailed`), nunca se escribe a mano; comprobar `B14 = E63 = Input sheet!B36`. Pesos a mercado (§4, §4A).
- **Terminal:** g = 4,0 % nominal USD con techo en Rf (Colombia COP y financieras con g propio documentado); beta 1 terminal; ROIC terminal = WACC sin ventaja, promedio de industria con ventaja durable, punto medio si se desvanece; impuesto marginal a perpetuidad (§4).
- **Ajustes:** I+D con `R& D converter` si es recurrente; leases con `Operating lease converter` sin recapitalizar lo ya reconocido por ASC 842/NIIF 16; opciones con `Option value`, restadas una sola vez; RSU/SBC aparte (§4A).
- **Reinversión:** S/C medio ≠ marginal; FCFF negativo o Reinversión/NOPAT >100 % no son error probado sin análisis; no cambiar el lag sin prueba causal (§4C).
- **Múltiplos:** cinco prioritarios por aplicabilidad (EV/EBITDA, EV/FCFF, P/E, P/FCFE, P/OCF); P/S y P/BV opcionales y no bloqueantes. Múltiplo de salida por ciclo, ajustado por tasas (factor 0,6–1,4); Conservador ≤ múltiplo actual; ninguno sobre el justificado por fundamentales. Pesos justificados por tipo de empresa; N/A o N/D explicados, nunca cero (§5, §5A). P/E usa utilidad común si hay preferentes (§5B).

## 3. Qué exige cada fase y qué secciones consultar

| Fase | Objetivo y salida | No negociable | Consultar en REGLAS |
|---|---|---|---|
| **F1 · Valoración inicial** → CANDIDATO | Insumos de `Input sheet`, costo de capital, conversores materiales y múltiplos (FY + LTM + anclas, **no** 10 años). DCF inverso, cuatro historias propuestas, Base + MOS, múltiplos aplicables, 5×5 si es viable. | Seguir el grafo real de fórmulas (`CONTRATO_INSUMOS_FASE_1.md`); WACC, I+D, leases y Option value investigados o N/A con nota SEC. | §0A, §0D, §1–§5A, §12 |
| **F2 · Históricos** → CANDIDATO | Hasta 10 FY + LTM de los tres estados, precios históricos fechados con splits, ratios por fórmula. | Clasificar cada partida (§0A); scripts `estados_completos.py`, `auditar_estados_sec.py`/NIIF, `auditar_ceros_materiales.py`, `diff_formulas_plantilla.py`; probar ROIC/ROE/ROA/P/E/EV-EBITDA contra cálculo independiente en dos períodos. | §0A, §0B |
| **F3 · Supuestos** → CANDIDATO_REVISADO | MANTENER / CAMBIAR / RESERVA para crecimiento, margen, S/C y reinversión, ROIC, WACC y terminal, múltiplos. | Tabla `antes → después → causa → evidencia → celda → impacto en Base y MOS`; 5×5 y DCF inverso; `controles_todas.sh` y `candados.py`. | §2–§5, §4B, §4C, §6 |
| **F4 · Análisis y publicación** → EN_REVISION o CANDIDATO | Nivel 1 (14 capítulos, el 5 de ciclos) y Nivel 2 (12 apartados) con cifras de la misma revisión, sin recalcular. | Publicar solo con todos los gates aprobados (§6 y §8A) y conciliación hoja ↔ JSON ↔ app; la ficha muestra «auditoría pendiente». | §6, §8, §8A, §9 |
| **F5 · Auditoría guiada** → dictamen | Primero las preguntas del usuario (`auditorias/solicitudes/<TICKER>/<REV>.json`), luego el mínimo independiente. | Otro modelo o sesión; dictamen VERIFICADO / CON RESERVA MATERIAL / PENDIENTE (§4B); no modifica hoja ni artículo. | §4B, §8, §8A |

**Controles de publicación (§6), `bash scripts/controles_todas.sh` sin fallas:** probabilidades = previa + ajustes; supuestos S1–S6 (márgenes vs sector y Optimista ≤ Base + 10 pp, ROIC terminal, orden de historias, salto del múltiplo Optimista, g ≤ Rf, probabilidades); hoja = app = motor; integridad de la hoja; estados completos. Una alerta se cierra con evidencia, nunca relajando el control.

**Entregable mínimo (§8):** DCF de cuatro historias; tres 5×5 del DCF Base (WACC × g, ROIC terminal × g, crecimiento × margen) con centro igual al Base; múltiplos prioritarios o su excepción; 18 candados listos; sensibilidad de múltiplos solo en la historia Base.

## 4. Entrega de cada fase

`Modelo-JMR-datos/candidatos/valoraciones/<REV>/FASE_<N>_ENTREGA.md`, con el formato del [README de fases](propuestas/fases/README.md): título con estado (CERRADA / CERRADA CON CONTROLES PENDIENTES / BLOQUEADA), fecha, método, corte, `sheet_id`, herramienta/modelo/esfuerzo reales, `PASOS: n/n ejecutados`; hecho y comprobado; juicios; controles (APROBADO / PARCIAL / NO EJECUTADO); bloqueos materiales vs secundarios; insumos exactos para la fase siguiente.

## 5. Cuándo leer el documento completo

Leer la sección completa de `REGLAS_VIGENTES.md` cuando: el emisor es financiero, holding o colombiano (FCFE/SOTP/NIIF y `colombia-nucleo-v1.md`); hay preferentes o convertibles (§5B, PREF-02); se toca la plantilla o una fórmula (§0B, §11, mantenimiento con respaldo y regresión); se publica (§6, §8A, §10); o aparece cualquier duda que este resumen no resuelve.
