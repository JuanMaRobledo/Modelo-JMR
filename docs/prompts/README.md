# Prompts del Modelo JMR

Cada prompt tiene **un solo archivo vigente**, con un nombre fijo que no cambia entre versiones. La versión exacta está en la primera línea de cada archivo.

| Archivo | Uso | Versión vigente |
|---|---|---|
| `JMR-PROMPT-Valoracion-VIGENTE.md` | Armar la valoración DCF Damodaran + 5 múltiplos en la hoja de Google Sheets | v2 |
| `JMR-PROMPT-Research-VIGENTE.md` | Research fundamental de 17 secciones (lo carga la pestaña «Prompt maestro» de `research.html`) | v4.1 |

Cuando salga una versión nueva:

1. Mueve el vigente a `archivo/` con el nombre `JMR-PROMPT-<Tipo>-v<N>_archivado-<AAAA-MM-DD>.md`.
2. Guarda la versión nueva con el mismo nombre `JMR-PROMPT-<Tipo>-VIGENTE.md`.

En Google Drive se usa la misma convención, en la carpeta `Prompts`: «JMR - PROMPT Valoracion (VIGENTE v2).md», «JMR - PROMPT Research (VIGENTE v4.1).md» y la subcarpeta `_Archivo (versiones viejas)`.
