# Decisiones tomadas por delegación (13-nov-2026)

El usuario delegó las decisiones restantes. Cada una, con su razón y su reversibilidad:

1. **V2 vivía en `docs/v2/` de Modelo-JMR** hasta que existiera el repo `Modelo-JMR-V2`. **Actualización 13-nov-2026: migrado a `JuanMaRobledo/Modelo-JMR-V2` (177 pruebas verdes); esta copia queda congelada y sin mantenimiento hasta que el propietario autorice retirarla.** No se creó el repo: esta sesión no puede crear repositorios fuera de su alcance. Para migrar: crear el repo vacío y copiar `docs/jmr-v2.html`, `docs/v2/`, `scripts/v2-*`, `tests/*v2*`, `tests/fixtures/*v2*`. *Reversible.*
2. **No se toca Cartera.** El SSO solo autoriza un alias de preview; producción (`modelo-jmr.vercel.app`) no lo necesita. Cambiar autenticación exige revisión de seguridad humana.
3. **Criterios de publicación v1.0**: ver `metodologia/CRITERIOS_DE_PUBLICACION.md`. *Reversible (código + pruebas).*
4. **El libro es la fuente; el expediente se exporta** del libro (`exportar`) y debe conciliar con el motor (P07).
5. **Sin empresas reales**: `ANALISIS` está vacía; no se publican valoraciones sin informes ni auditoría independiente.

6. **JMR múltiplos** (complemento de V2, solo a solicitud expresa) nació en `docs/multiplos/` y se migró el mismo día a `JuanMaRobledo/JMR-M-ltiplos` (22 pruebas verdes). La copia de aquí queda congelada; el repo propio es el canónico.
