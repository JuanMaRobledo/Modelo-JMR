# Oracle · Auditoría de doble contabilización · JMR V2.0
Fecha: 2026-11-13. Estado **EN_PROCESO**, conciliación definitiva con Excel R2 y WACC pendiente.

## Hallazgo y reparación concreta
En el libro V2 anterior, `'JMR Estados'!K25:L25 = 0,0` representaba arrendamientos financieros faltantes. La fórmula original `'Input sheet'!B15 = 'JMR Estados'!L24+'JMR Estados'!L25` ya separaba financiación bancaria de deuda por arrendamientos; no se modificó.

Corregido en el nuevo **R2 Excel** (mismo motor 21 hojas, sin sobrescribir el R1):
- FY2025 `K25`: **2.934** (257 corriente + 2.677 no corriente).
- FY2026 `L25`: **7.701** (620 corriente + 7.081 no corriente).
- FY2026 préstamos y bonos **129.541**: NO incluye arrendamientos financieros, pues en balance los leases financieros están dentro de otros pasivos corrientes y no corrientes. Input B15 suma ahora **137.242** una sola vez.
- FY2026 arrendamientos operativos **30.190** (3.542 corriente + 26.648 no corriente): **NO se suman a la deuda financiera** porque su gasto ordinario de **2.794** ya reduce EBIT.
- Las inversiones bajo arrendamientos financieros están en activo PP&E y la amortización **351** reduce EBIT; intereses financieros **279** se clasifican fuera del EBIT. No volver a deducir el principal ni el interés separadamente del FCFF.
- Compromisos futuros de leasing todavía no iniciados (FY2026: US$260.000 millones) **no** son pasivo actual; no deben sumarse mecánicamente a deuda ni descontarse de nuevo si se modelan en gastos/reinversión futura.
- Minoritarios **548** y preferentes convertibles Serie D **4.954**: mantuvimos el puente conjunto **5.502** y **2.914 millones** de acciones promedio diluidas sin suponer conversión. Si en otra revisión se utiliza conversión explícita, retirar la reclamación preferente del puente para impedir duplicación.
- Stock-based compensation, opciones y RSU no se vuelven a deducir como gasto adicional. Su dilución futura sigue pendiente de evaluación independiente.

## Corrección de motor en la app
- `financials.debt` = **129.541** (solo préstamos y bonos).
- `financials.financeLeaseLiabilities` = **7.701** (únicamente arrendamientos financieros).
- `financials.operatingLeaseLiabilities` = **30.190** se conserva para trazabilidad, **no** se descuenta.
- Nuevo puente: `equity = EV − debt − financeLeaseLiabilities − minority + cash + nonoperatingAssets − optionsValue`.
- Mismo puente en la sensibilidad terminal 5×5.
- Ratios históricos y tabla de balance usan `debt + leases` una sola vez; los renglones contables conservan su desglose.
- Se bloquea el input si `debtIncludesFinanceLeases=true` y además `financeLeaseLiabilities>0`.

## Impacto bruto para comparación (WACC fijo, no certificación)
| Escenario | Antiguo US$/acc. | Después de descontar lease FY2026 US$/acc. |
|---|---:|---:|
| Conservador | 5,06884 | 2,42608 |
| Base | 55,65601 | 53,01325 |
| Optimista | 143,71443 | 141,07167 |
| MOS 35 % Base | 36,17640 | 34,45861 |

Cada reducción es `7.701/2.914 = US$2,642759` por acción. Es una **conciliación puente con WACC fijo**, no una valoración definitiva. El incremento de la deuda cambia la mezcla de financiamiento en `Cost of capital worksheet`; el workbook R2 **debe recalcularse y sus valores confrontarse** con la app, además de revisar tratamiento de CAPEX y ROIC.

## Regla de publicación
No se reetiqueta como auditada. `libro.valores` mantiene la instantánea R1, por lo que el control P07 de paridad se **deja abierto**, se marca `EN_PROCESO`, y no se certifica el precio todavía. Al recalcular y verificar el R2, actualizar `libro.valores`, `libro.sha256` y controles con evidencia reproducible, sin tocar fórmulas originales.

## Enlaces
- [Libro V2 R2 en Google Drive](https://docs.google.com/spreadsheets/d/1Lx3t_dpyqCNuQ7Bx7JWZZHXtigiqwcWS/edit)
- [Libro anterior R1, preservado](https://docs.google.com/spreadsheets/d/1rrDeCErDGGmH0H7RZZyNY8S3hR1vrlSI/edit)
- [Oracle 10-K FY2026, Nota 9 y balance](https://www.sec.gov/Archives/edgar/data/1341439/000119312526277521/orcl-20260531.htm)
- [Oracle 10-Q agosto 2026, Nota 6: FY2027 Q1 sin mezclar cortes](https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm)
