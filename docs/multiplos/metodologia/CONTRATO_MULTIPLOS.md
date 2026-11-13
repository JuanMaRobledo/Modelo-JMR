# Contrato JMR múltiplos

**Versión:** 1.0.0 · **Fecha:** 13-nov-2026 · **Ámbito:** aplicación **JMR múltiplos**, complemento de la valoración principal **JMR V2.0**.
**Independencia:** no usa DCF, no modifica V2 ni Floyd y no se mezcla con sus datos, motores o catálogos. Aplica a ChatGPT, Claude, Gemini y cualquier agente.

## 1. Se ejecuta solo cuando se solicita expresamente
Ningún agente crea ni actualiza un expediente de múltiplos por iniciativa propia, ni como subproducto de una valoración V2 o Floyd. Cada expediente lleva `solicitudExpresa {fecha, texto}` con la petición del propietario; sin ella el control **M01** bloquea el valor. «Valora X» (V2) **no** es una solicitud de múltiplos.

## 2. Qué es
Valoración relativa por múltiplos sobre los estados financieros históricos, márgenes y datos de mercado de la empresa: `valor por acción = múltiplo × métrica → (puente EV→equity) → ÷ acciones`. Es un **análisis comparativo**: nunca se promedia con el DCF de V2. El valor de V2 puede aparecer como `v2Ref` informativo y solo con su origen.

## 3. Método
1. **Perfil** (mismo del expediente V2): `operativa`, `alto-crecimiento`, `banco`, `aseguradora`, `holding`. Cada perfil admite solo sus métodos (`contrato-multiplos.json`); bancos, aseguradoras y holdings no usan EV.
2. **Históricos**: ≥ 3 ejercicios completos con fuente primaria, período, página o nota, unidades y ajustes (mismos requisitos de evidencia de V2). Las definiciones de EBITDA, NOPAT, FCFF y reinversión son las de `JMR_IND` en V2; FCFE = utilidad neta − reinversión + Δdeuda.
3. **Referencia por método** = múltiplos propios de cada ejercicio (con el precio de cierre de ese ejercicio) + múltiplos de comparables (con fuente y fecha). Solo valores positivos; el resto es N/M.
4. **Escenarios**: conservador = percentil 25, base = mediana, optimista = percentil 75 de la referencia (mínimo 3 observaciones). Un múltiplo **manual** exige justificación económica (≥ 20 caracteres); el crecimiento de la métrica sobre el último ejercicio es 0 % salvo evidencia.
5. **Pesos** por método, suma 100 %, con justificación (≥ 40 caracteres). Si un método es N/M su peso se redistribuye; el valor es válido con ≥ 80 % del peso aplicable y ≥ 2 métodos.
6. **Puente EV → equity**: + caja + activos no operativos − deuda − minoritarias − preferentes − opciones.
7. **MOS 35 %** sobre el escenario base (igual que V2) y sensibilidad 5×5 (múltiplo × métrica, ±20 %) por método.
8. **Libro** (`PLANTILLA_JMR_MULTIPLOS.xlsx`, `scripts/multiplos-libro.py`): solo entradas azules; todo lo demás son fórmulas. El valor por acción del libro y del motor deben coincidir con tolerancia 0,5 % (**M13**). Un LLM puede proponer supuestos narrativos; no puede sustituir fórmulas por números.

## 4. Estados y auditoría
`BLOQUEADO` (hay un bloqueo: sin valor numérico), `EN_PROCESO` (valor visible, con errores de control), `EN_REVISION` (sin errores). La visibilidad en la app no es aprobación económica. Ningún LLM puede atribuirse la aprobación del propietario ni una auditoría independiente.

## 5. Archivos
| Pieza | Ruta |
|---|---|
| Aplicación | `docs/jmr-multiplos.html` (+ `docs/multiplos/vista.mjs`, `app.mjs`) |
| Motor y controles | `docs/multiplos/motor.mjs` |
| Expedientes | `docs/multiplos/empresas/TICKER.json` (plantilla: `plantilla/PLANTILLA_EXPEDIENTE.json`) |
| Catálogo propio | `docs/multiplos/catalogo.json` · `node scripts/multiplos-catalogo.mjs [--check]` |
| Libro | `docs/multiplos/plantilla/PLANTILLA_JMR_MULTIPLOS.xlsx` |

## 6. Cambios al método
Modificar este contrato, `contrato-multiplos.json`, motor y pruebas en el mismo PR. Informar commit y versión de contrato usados.
