# Gemini y otros LLM · entrada unificada Modelo JMR

Este archivo dirige **Gemini** al mismo contrato usado por ChatGPT y Claude. No establece un método nuevo.

## Selección de modelo obligatoria
- Para **JMR V2.0**, leer en orden:
  1. [Contrato único V2 v1.1.0](docs/v2/metodologia/CONTRATO_UNICO_LLM.md).
  2. [Contrato legible por máquina](docs/v2/metodologia/contrato-v2.json).
  3. [Procedimiento por empresa](docs/v2/metodologia/PROCEDIMIENTO_EXPEDIENTE.md).
  4. [Criterios de publicación V2](docs/v2/metodologia/CRITERIOS_DE_PUBLICACION.md).
- Para **Floyd**, seguir [AGENTS.md](AGENTS.md) y las instrucciones Floyd, sin trasladarlas a V2.

## Reglas de interacción
Publicar una valoración real en V2 para su revisión **no requiere auditoría previa**. Mostrar advertencias, datos faltantes y procedencia; si hay bloqueos materiales, no mostrar valores numéricos no sustentados. El paso a «Auditadas y aprobadas por mí» requiere aprobación humana explícita, nunca autoaprobación del LLM.

Usar siempre la plantilla del perfil económico, motor Damodaran, tres escenarios, MOS 35 % sobre Base, estados financieros completos, análisis fundamental y razones de los supuestos, con las ocho pestañas. No modificar ni eliminar Floyd. Antes de escribir confirmar rama, commit, versión de contrato y controles de CI; no inventar resultados o pruebas.
