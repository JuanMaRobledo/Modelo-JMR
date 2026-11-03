# Fase 5 · Auditoría económica guiada por el usuario
**Versión:** JMR cinco fases, 2-nov-2026. **Prompt maestro:** `auditoria-economica-jmr-v1.md` (3/3). Dictamen en 18 secciones.
**Gatillo:** «Audita <TICKER> en fase 5» o «Fase 5 de <TICKER>: revisa estos puntos…».

## Secuencia guiada
1. Recuperar la única revisión publicada `EN_REVISION`, hoja, fuentes, análisis, las cinco decisiones clave de F3, y las observaciones del usuario (incluidas las de `auditorias/solicitudes/<TICKER>/<REV>.json`).
2. **Primero las preguntas del usuario:** transformar cada inquietud en prueba refutable y reproducible, con materialidad, fuente primaria, celda y efecto en DCF/múltiplos. El usuario puede agregar preguntas o corregir foco durante la sesión.
3. **Luego mínimo independiente obligatorio aunque no se haya preguntado:** auditabilidad de datos, signos, ROIC y reinversión, crecimiento, márgenes, WACC/Ke, terminal, NCI/EV–equity, ajustes I+D/leases/SBC, sensibilidad y potencial sesgo optimista o prudente.
4. Ejecutar comprobación independiente de principales flujos/identidades y contraste de controles de F1–F4. Preferir revisor de otro modelo o sesión nueva que no haya construido F1–F4. Si no es independiente, decirlo y no emitir dictamen independiente.
5. Emitir **VERIFICADO**, **VERIFICADO CON RESERVA MATERIAL** o **PENDIENTE**, con evidencias, límites de impacto y acciones correctivas. Guardar `FASE_5_ENTREGA.md` y auditoría separada por revisión sin alterar el libro ni el artículo sin autorización del usuario.
6. Si hay error material, abrir corrección versionada y volver a ejecutar los gates afectados; nunca confundir `EN_REVISION` con `AUDITADO`.

**No publicar directamente correcciones ni alterar calificaciones de forma automática.** El dictamen es explícitamente guiado por la intervención del usuario; independencia y mínimos económicos se mantienen.
