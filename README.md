# Modelo-JMR — Modelo de Valoración por Múltiplos Relativos

Este repositorio organiza y sistematiza el enfoque de valoración fundamental usado en
**"Casos de estudio"** (55 hipótesis de inversión analizadas entre 2022 y 2026), y lo convierte
en un **modelo replicable** para analizar nuevas empresas de forma consistente.

## Contenido

| Carpeta / archivo | Qué es | Para qué sirve |
|---|---|---|
| `modelo/METODOLOGIA.md` | El proceso paso a paso (8 pasos) inferido de los 55 casos | Leerlo antes de valorar una empresa nueva — es el "manual" del modelo |
| `modelo/Modelo_Valoracion.xlsx` | Calculadora en Excel + checklist cualitativo + índice de los 55 casos | Herramienta de trabajo: se llena con los datos de una empresa nueva y calcula precios objetivo, CAGR y zonas de valor automáticamente |
| `casos_de_estudio/CASOS_DE_ESTUDIO.md` | Ficha detallada de cada uno de los 55 casos (negocio, moat, métricas, múltiplos, objetivos, riesgos, actualizaciones) | Consulta rápida de cualquier caso histórico y sus números |

## Cómo usar esto en la práctica

1. **Antes de valorar una empresa nueva:** lee `modelo/METODOLOGIA.md` para recordar el proceso.
2. **Para calcular:** abre `modelo/Modelo_Valoracion.xlsx`, pestaña **Calculadora**, y llena las
   celdas en azul/amarillo (precio, EPS/FCF proyectado, múltiplos actuales e históricos). El
   archivo calcula solo los 3 escenarios de precio objetivo, el CAGR de cada uno y sugiere las
   zonas de valor.
3. **Para consultar un caso pasado** (por ejemplo, "¿a qué múltiplo compré MSFT?" o "¿cuál era
   la zona Deep Value de LULU?"): usa la pestaña **Casos de Estudio** del Excel para una vista
   rápida en tabla, o `casos_de_estudio/CASOS_DE_ESTUDIO.md` para el detalle narrativo completo.

## Filosofía del modelo (resumen)

El autor original **casi nunca valora en términos absolutos** ("esto vale X porque genera Y").
En cambio, compara sistemáticamente:

- El múltiplo **actual** de la empresa (P/E, EV/EBITDA, FCF yield, P/S, P/GP o P/VL, según el
  tipo de negocio) contra su **propio promedio histórico** (ventana de 5 a 15 años).
- Ese descuento/prima relativo, combinado con la **calidad del negocio** (moat, márgenes, deuda,
  retorno sobre capital) y la **razón de la caída** (coyuntural vs. estructural), determina si
  hay margen de seguridad.
- El resultado son **tres escenarios de precio objetivo** (negativo, base, optimista) a 2-4 años,
  con su CAGR implícito, y **tres zonas de compra** (Value, Deep Value, Valoración Histórica)
  para escalonar entradas.

Ver el detalle completo en `modelo/METODOLOGIA.md`.

> Nota: este documento y sus conclusiones tienen finalidad educativa y de organización personal
> de información. No constituyen asesoría financiera ni recomendación de compra o venta.
