# Auditoría de coherencia · Colombia · 20-oct-2026

**Alcance:** cuatro hojas de cálculo por clase de acción (GRUPOARGOS, PFGRUPOARG, GRUPOSURA y PFGRUPSURA), la hoja vigente bancaria PFDAVVNDA y la hoja auxiliar de prueba SOTP de Argos. No es auditoría contable, valoración certificada ni autorización para publicar una valoración nueva.

## 1. Jerarquía de métodos y expedientes

- **GRUPOARGOS y PFGRUPOARG (hojas vigentes):** SOTP / NAV Base **COP 18.710,46 por acción**, referencial. Suma de cotizadas valoradas a cotización fechada, no cotizadas a referencias contables y ajustes de matriz. No equivale a un DCF íntegro de filiales. La auditoría económica del 20-oct propone **COP 19.103,01** al sustituir Odinsa libro por proxy de acciones × COP 10.500: NO publicado y NO certificado.
- **Argos (expediente auxiliar independiente, no sustituye hojas vigentes):** DCF-SOTP Base COP 10.346,34, MOS35% COP 6.725,12. Se corrigió el control de conciliación secundario a 0 y el MOS sobre Base. No corresponde al NAV principal anterior y depende de supuestos por filial por verificar. Prohibido promediar ambos valores o publicar el auxiliar como si fuera la valoración vigente.
- **GRUPOSURA y PFGRUPSURA:** SOTP financiero por participaciones Base **COP 52.712,96**; auditado condicionado en trabajo **COP 51.939,70** por normalización Cibest LTM (sin Banistmo); sin reemplazo del vigente ni publicación. FCFE consolidado histórico COP 51.707,81 es solo comparador.
- **PFDAVVNDA:** FCFE Base COP 29.633,45; Ke inicial 16,01% y terminal 18,1% según hoja. Datos regulatorios HISTÓRICOS del 2T26 conciliados: RWA COPm 145.082.745, CET1 COPm 17.605.250, Tier I COPm 19.336.428 y capital total COPm 23.332.639. Los RWA futuros y las retenciones de capital NO están validados; el cociente CET1/RWA constante es solo una hipótesis. Prueba a diez años: retenciones Base menos aumento CET1 proxy COPm -819.445,20. NO es un déficit de solvencia observado. No certificar.

## 2. Correcciones de presentación guardadas en Drive

En las **cuatro hojas por clase**:
- El bloque **Resumen rápido** enlaza ahora SOTP Base y rango SOTP presente, en lugar de confundir el objetivo ponderado FY+3 legacy con el valor principal.
- El porcentaje del resumen es **SOTP Base / precio congelado - 1**, etiquetado como brecha frente a referencia, sin llamarlo rentabilidad anual futura. El precio de referencia de cada hoja se lee de `Input sheet!D1`, no se presume cotización en tiempo real.
- MOS sigue en 35% sobre SOTP Base; las preferencias de método, FCFE y escenarios económicos **no cambiaron**. Las fórmulas legadas FY+3 siguen en su bloque marcado **secundario**.
- En ambas hojas de **Argos**, las tres zonas que mostraban falsamente COP 0 y variaciones -100% cuando el DCF secundario estaba vacío ahora devuelven blanco; el precio único con MOS sigue calculado desde SOTP.
- En **Sura ordinaria**, `Clases de acción` y `Control Damodaran` apuntan al SOTP Base COP 52.712,96; el FCFE comparador deja de aparecer como valor principal.
- En **Argos preferencial**, el precio de referencia usado en el resumen se enlazó con su propio `Input sheet!D1` (COP 16.360 en la hoja, corte 30-sep); se eliminó un antiguo COP 21.860 copiado desde otra referencia.

### Verificación posterior de lectura

| Emisor/clase | SOTP Base COP | Precio congelado en su hoja COP | Brecha SOTP/Precio |
|---|---:|---:|---:|
| GRUPOARGOS | 18.710,46 | 21.100 | -11,32% |
| PFGRUPOARG | 18.710,46 | 16.360 | +14,37% |
| GRUPOSURA | 52.712,96 | 67.480 | -21,88% |
| PFGRUPSURA | 52.712,96 | 58.840 | -10,41% |

**Advertencia:** las dos referencias de Argos son de fechas diferentes (hojas de 19-oct y 30-sep); la brecha por clase **no** demuestra descuento relativo ord./PF. En la ficha de Sura ordinaria también conviven COP 67.480 como precio del análisis y COP 69.000 como «precio guardado» con fecha no conciliada. No usar como cotización simultánea.

## 3. Derechos económicos de clases, confirmación oficial

- Grupo Argos: ordinarias con voto, preferenciales con derechos económicos y voto excepcional. La Asamblea decretó **COP 750 por acción tanto ordinaria como preferencial para 2026**. Fuentes: [FAQ](https://www.grupoargos.com/relacion-con-el-inversionista/preguntas-frecuentes/acciones/), [distribución de utilidades 26-mar-2026](https://files.grupoargos.com/uploads-grupo-argos/2026/03/IR-PDU.pdf).
- Grupo SURA: dividendos **COP 2.000 por acción en 2026** para ambas clases, según [sitio oficial](https://www.gruposura.com/relacion-con-inversionistas/accion/). El [reglamento preferencial](https://www.gruposura.com/documento/propuesta-de-actualizacion-al-reglamento-de-emision-y-colocacion-de-acciones-con-dividendo-preferencial-2017/) contiene un mínimo condicionado al dividendo ordinario; no se justifica sumar hoy una prima monetaria a NAV sin evaluar la materialidad futura.
- **Paridad económica provisional** ord./PF = convención de NAV por acción y no equiparación de derechos políticos. No incorporar prima por voto ni descuento de liquidez sin fuente y valoración.

## 3 bis. Seguimiento CET1/RWA y FCFE · 20-oct-2026

Validación cruzada de la **nota oficial de solvencia pp. 56-57** del [EEFF consolidados 2T26](https://ir.davivienda.com/wp-content/uploads/2026/08/Banco-Davivienda-EEFF-Consolidados-2T26-2.pdf) con la hoja `PFDAVVNDA — Valoración JMR vigente`. Fuente real 30-jun-2026: RWA **COPm 145.082.745**, CET1 **COPm 17.605.250**; CET1/RWA **12,13%**, Tier I **13,33%** y solvencia total **16,08%**; mínimos reportados incl. colchones 7,00%, 8,50% y 11,50%. Estos datos **históricos sí están conciliados**; la previsión futura NO.

Se añadieron, sin editar el DCF, las filas `'Auditoría capital prudencial 2T26'!A95:G104` (sensibilidad objetivos CET1) y `A108:J125` (serie diez años y diagnóstico). Resultado mecánico Base: CET1 si todas las retenciones se transformaran en capital elegible a año 10 **COPm 36.670.681,44**, RWA proforma **COPm 308.951.618,66**, ratio CET1/RWA **11,8694%**. Mantener constante el ratio 2T26 **12,1346%** exigiría CET1 **COPm 37.490.126,65**, brecha de retenciones de **−819.445,20 COPm** (caída **0,2652 puntos porcentuales** desde el ratio inicial bajo la trayectoria implícita). A target ilustrativo 12,0%, brecha **−403.512,79 COPm**; a 11,5%, diferencia **+1.141.245,30 COPm**, **que NO es capital distribuible**.

El FCFE sumado (sin descuento) del modelo Base es **COPm 16.539.541,69**, versus proxy sujeto a conservar ratio 2T26 **COPm 15.720.096,48**, ambos antes de descuento. Esa diferencia no constituye valor intrínseco corregido: faltan política de colchones gerenciales, dividendos admisibles, tratamiento de OCI/deducciones/capital Tier y valor terminal consistente. **No publicar, no sustituir FCFE Base COP 29.633,45**. Se actualizó también la explicación en los informes de Davivienda niveles 1 y 2 en Google Docs, sin alterar Argos ni Sura.

## 4. Bloqueos económicos pendientes antes de certificar y publicar

1. **Holdings:** fechar tenencias, caja/deuda atribuible, NCI, deuda residual de matriz, compra de acciones y perímetro después de escisión; no mezclar equity de subsidiaria ya neto de deuda con EV de otra subsidiaria.
2. **Privadas/concesiones:** reconstruir puente de NAV económico de Odinsa, Pactia, SURA AM y Suramericana; valores gerenciales/cotizaciones sin transacción vigente son proxies con rangos, nunca certificados por proximidad a libro.
3. **Costo del patrimonio y deuda:** fuentes fechadas de TES libre de riesgo, beta desapalancada/apalancada sectorial, prima madura, prima país por exposición; Ke nominal COP = Rf + beta × ERP + lambda × CRP, evitando doble conteo del spread soberano. Kd solo para deuda financiera de la entidad pertinente.
4. **Bancos:** CET1, RWA monetario y regulatorio, Tier1, AT1/Tier2, deducciones, OCI y dividendos distribuibles por entidad/perímetro/escenario; no tomar depósitos como deuda a restar del FCFE.
5. **Títulos y precios:** congelar y comparar cotizaciones **misma sesión y especie**, comprobar recompras materializadas contra autorizadas, derechos PF, número de acciones en circulación/dilución por clase.
6. **Publicación:** comprobar coincidencia de hoja vigente → datos JSON → ficha de análisis → artículo → visor/bitácora/PDF. Si falta prueba, consignar `CONDICIONAL` / `PENDIENTE` y publicar solo con autorización explícita de la persona usuaria; no cambiar valores Base por promedios, números de otra hoja ni proxies sin etiqueta.

## 5. Regla de ejecución que evita nuevos «falta algo»

Primero cargar fuentes del emisor/SFC/BVC y fecha; después computar Rf, ERP, CRP, beta, Ke, Kd aplicable, número de títulos y valor por filial; validar unidades/perímetro/NCI/RWA; calcular cuatro historias y secundarios; finalmente generar informe y auditoría. Cada variable queda con **fuente, fecha, fórmula y clase de confianza**: reportada, derivada, hipótesis, no verificable. Falta material no divulgado permite una estimación **condicionada con sensibilidad**, no un hueco silencioso ni certificación falsa. No volver a pedir al usuario datos disponibles en fuentes públicas. Las hojas separadas no se mezclan.

**Trazabilidad:** cambios directos de presentación y fuente en Google Sheets realizados el 20-oct; este archivo y los tres prompts editados están solo en rama/PR de revisión, no integrados en `main`. Ninguna valoración se ha vuelto a publicar en la aplicación.
