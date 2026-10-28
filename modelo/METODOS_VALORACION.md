# Selector y contrato de métodos de valoración JMR

**Vigente desde 28-oct-2026.** Hay **dos juegos de reglas** para valorar empresas. La selección se hace **por revisión de valoración** y nunca cambia implícitamente otras empresas o revisiones.

| | Método A | Método B |
|---|---|---|
| Nombre | Calibración fundamental por drivers, tasas base y coherencia económica | JMR vigente hasta el 28-oct-2026 (versión 15) |
| Documento | [`METODO_A_JMR.md`](METODO_A_JMR.md) | [`METODO_B_JMR.md`](METODO_B_JMR.md) |
| Fundamento de supuestos | Modelo por segmentos, *inside/outside view*, persistencia de retornos e historial de errores | Estimación tradicional JMR: historia, medias, pares, sector, criterios y validadores vigentes |
| Motor | Idéntico al de B | Idéntico al de A |
| DCF principal y alternativas | FCFF para operativas; FCFE para financieras; SOTP para holdings, según normas comunes | Igual |
| Escenarios, MOS, múltiplos, sensibilidades | Normas comunes de `REGLAS_VIGENTES.md` | Igual |
| Auditoría independiente | Otro Google Sheet, solo tras revisión visual y solicitud | Igual |

## Fuente normativa y precedencia

1. `REGLAS_VIGENTES.md` mantiene las **reglas compartidas** de valoración, estructura de hojas, conservación de fórmulas, métodos de cálculo, estados, 7 múltiplos, materialidad, autorización y publicación.
2. Si la revisión tiene `metodo_valoracion = A`, aplicar el documento `METODO_A_JMR.md` **para seleccionar, justificar y contrastar supuestos**. En caso de discrepancia sobre calibración con una regla tradicional B, prevalece A. Una discrepancia técnica sobre fórmulas, contabilidad o publicación no se resuelve mediante A: prevalecen las normas comunes.
3. Si tiene `metodo_valoracion = B`, aplicar la instantánea `METODO_B_JMR.md`; si cambian después reglas compartidas por seguridad, integridad o contabilización, se anota la incompatibilidad y la revisión aplicable. La instantánea nunca se reescribe retroactivamente.
4. Los prompts no alteran el método elegido ni sustituyen las fuentes normativas.

## Contrato de identificación

Cada **nueva revisión** debe registrar al inicio en el expediente de valoración, como mínimo:

```json
{
  "ticker": "TICKER",
  "revision_id": "TICKER-AAAAMMDD-R1",
  "fecha_corte": "AAAA-MM-DD",
  "metodo_valoracion": "A",
  "version_metodo": "A-1.0",
  "sheet_id": "ID_REAL_DE_LA_COPIA_DE_LA_PLANTILLA",
  "fuentes_supuestos": "Origen de los Supuestos y/o evidencia por revisión"
}
```

- Valores válidos: `A`/`A-1.0` o `B`/`B-15`. No se admiten etiquetas mixtas `A+B` en una sola revisión.
- **Nuevas valoraciones:** escoger A o B explícitamente. Si no se indica cuál, el proceso **no debe inventarlo**; se conserva B como compatibilidad de herramientas anteriores, pero se informa la elección B antes de valorar. No se activa A silenciosamente.
- **Revisiones previas sin campo:** interpretar como `B` legado para lectura y comparación, **sin reescribir archivos, resultados, estados ni auditorías**.
- Toda ficha de A requiere trazabilidad de drivers, tasas base y coherencia según A. No basta declarar `A` en el JSON.
- La etiqueta del método debe acompañar valoración, análisis y auditoría de una misma revisión. El análisis no recalcula el valor.
- Las copias nuevas comparten la plantilla oficial de **46 pestañas**. No añadir pestañas de metodología o auditoría a las hojas; la evidencia vive en celdas de supuestos existentes o en archivos externos por revisión.

## Comparación A contra B

Para comparar una empresa usar mismo emisor, clase, fecha de corte, moneda, estados históricos, ajustes contables y plantilla; **solo** variar la justificación y estimación de supuestos. Una valoración comparativa no sustituye la ficha vigente automáticamente ni se publica sin autorización. Conservar copias separadas identificadas A y B; comparar drivers, supuestos, DCF Base, precio MOS, escenarios, múltiplos y sensibilidades, además de riesgos y limitaciones. Registrar si la diferencia proviene de hipótesis económicas o de otro problema técnico.

## Puerta mínima de implementación

Esta versión crea la normativa y la opción de selección **documental**. No se ha añadido un selector gráfico a la app ni se ha cambiado el cálculo en producción. Para automatizar el campo se requiere incorporar lectura y persistencia de `metodo_valoracion` al ejecutor y al catálogo, probar compatibilidad con expedientes legados, pasar regresión y autorizar la integración. Nunca declarar operativa una selección automática que no esté implementada y verificada.
