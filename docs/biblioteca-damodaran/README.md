# Biblioteca Damodaran–JMR · versión inicial 0.1

**Creada:** 2026-11-05 · **Estado:** biblioteca metodológica de referencia, no fuente normativa autónoma ni valoración aprobada.  
**Normativa prevalente:** [REGLAS_VIGENTES.md](../../modelo/REGLAS_VIGENTES.md) y método A-1.2. La guía ya existente [HISTORIAS_A_NUMEROS.md](../HISTORIAS_A_NUMEROS.md) sigue vigente.  
**Caso piloto:** [DUOL](casos/DUOL.md), corte financiero 2026-09-30, candidato R4 **NO PUBLICAR**.

## Finalidad

Convertir los materiales públicos de **Aswath Damodaran** en decisiones de análisis y valoración reproducibles, **empezando por la historia económica y solo después escogiendo crecimiento, márgenes, reinversión, riesgo y valor terminal**. Esta biblioteca no sustituye los informes SEC, las hojas de cálculo ni la auditoría económica del Modelo JMR.

### Regla innegociable de integridad

**NO cambiar las fórmulas originales de las hojas Damodaran ni sus comentarios, notas, hilos o texto explicativo.** La misma prohibición se aplica al reusar plantillas en otras empresas. Para calcular variantes, usar una **copia de la hoja**, pestañas auxiliares/sidecars JMR y entradas documentadas, nunca reescribir esas fórmulas ni notas. Contrastar fórmulas y notas contra un libro original identificado en la auditoría; sin prueba, dejar el control como PENDIENTE. Los ajustes de datos derivados pueden incorporar fórmulas en **hojas JMR**, sin presentar estas como autoría de Damodaran. Si una transformación previa ya sustituyó fórmulas o notas originales, marcarlo como incumplimiento a inspeccionar: la biblioteca no legitima cambios retroactivos.

## Documentos de consulta

| Documento | Propósito |
|---|---|
| [Fuentes oficiales y videos](FUENTES_Y_VIDEOS.md) | Enlaces verificados, qué se leyó y qué queda por transcribir o estudiar |
| [Principios y decisiones](CRITERIOS.md) | Criterios por palanca; prueba, falsadores, errores frecuentes y separación autor/JMR |
| [Plantilla por empresa](PLANTILLA_FICHA.md) | Ficha operativa reutilizable de historia → variables → valoración → seguimiento |
| [Piloto DUOL](casos/DUOL.md) | Primera narrativa estructurada, escenarios y pendientes verificables |

## Protocolo de aprendizaje y uso en cada valoración

1. **Definir corte e identidad.** Ticker, moneda, fecha de mercado, último 10-K/10-Q, y versión de la plantilla original. No mezclar nueva noticia y datos antiguos inadvertidamente.
2. **Registrar la historia antes de mirar el precio.** Economía unitaria, competencia, mercado y ciclo de vida. Hipótesis en lenguaje natural, con mecanismo causal.
3. **Prueba posible → plausible → probable.** Datos primarios del emisor; comparables justificados; contraevidencia; incertidumbre explícita. La historia Base no debe incorporar colchones conservadores duplicados.
4. **Traducir historia a números con identidad económica.** Suscriptores × monetización; ingresos × margen = EBIT; NOPAT; reinversión = crecimiento / eficiencia del capital; ROIC marginal y costo de capital. Cada valor hipotético con rango y disparadores verificables.
5. **Construir historias distintas.** Conservadora, Base y Optimista (y Disrupción separada, según contrato JMR), sin variar todos los porcentajes mecánicamente ±x.
6. **Calcular con hojas originales protegidas.** Solo entradas y auxiliares JMR. Reproducir relaciones de crecimiento, rentabilidad y reinversión y conciliar todos los bloques/escenarios.
7. **Prueba de sensibilidad causal y falsación.** Cambiar una variable; verificar el resultado; revertir. Separar efectos de datos contables de cambios de narrativa, para no atribuir variaciones de valor a una causa incorrecta.
8. **Publicar solo tras controles.** Datos SEC, arrendamientos, R&D, fiscalidad, opciones, FCFF/FCFE, múltiplos, matriz 5×5, auditoría editorial/económica, CI y QA app. Al no ejecutar un control, declararlo pendiente.
9. **Mantener ciclo de actualización.** Cada 10-Q y evento material reabre los hechos afectados, no todos los supuestos por defecto. Guardar versiones previas en Archivo/[TICKER].

## Convención de evidencia y lectura

- **P1 · Primaria leída:** informe SEC del emisor, página original de Damodaran, publicación primaria con contenido inspeccionado.
- **P2 · Índice confirmado, contenido no transcrito:** nombre, enlace y temario del video/archivo confirmado por la página oficial. **No afirmar que se vio ni transcribió el video**.
- **H · Hipótesis JMR:** inferencia económica, escenarios, probabilidades, supuestos y sensibilidad. Siempre distinguirla de una enseñanza literal de Damodaran.
- **V · Validación ejecutada:** fórmula/resultado visto en la hoja de DUOL, con celda y enlace, fecha y alcance. No confundir «OK matemático» con «conclusión económica aprobada».

La biblioteca **no reproduce libros ni videos protegidos**; conserva resúmenes breves, ideas interpretadas y enlaces. La fuente primaria se consulta cuando la conclusión depende de un detalle específico. El material cubre una **primera selección priorizada**, no la totalidad de publicaciones, videos o libros de Damodaran. Los videos listados tienen solo índice/tema verificados salvo registro posterior con transcripción accesible.

## Autoridad y cambios

Si una hipótesis de esta biblioteca contradice el método JMR vigente, **no editar directamente la regla normativa ni las fórmulas**: documentar la discrepancia, presentar propuesta y someterla a revisión. Los materiales de referencia son vivos; actualizar el índice al ingresar nuevo video, nota, o experiencia contrastada. Antes de publicar una valoración dejar trazadas sus fuentes y la versión de esta biblioteca.
