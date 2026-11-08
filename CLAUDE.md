# Claude Code · Modelo JMR Floyd (mismo contrato que ChatGPT)

Lee primero [AGENTS.md](AGENTS.md), que contiene las **mismas instrucciones** utilizadas por ChatGPT/Work. La fuente única para ambos es [Contrato de ejecución Floyd](https://github.com/JuanMaRobledo/Modelo-JMR/blob/main/docs/CONTRATO_EJECUCION_FLOYD.md), junto con [Órdenes Floyd F1–F5](https://github.com/JuanMaRobledo/Modelo-JMR/blob/main/docs/prompts/ordenes-floyd.md) y las reglas económicas de `modelo/REGLAS_VIGENTES.md`.

La habilidad local `fase-jmr` debe dirigir el trabajo a ese contrato; **no** ejecutar instrucciones históricas que hablen de cuatro fases, cuatro historias A-1.2 o una sola hoja. Para una empresa Floyd la secuencia es F1→F2 (H1/H2)→F3 (tres historias)→F4 (análisis 14+12, publicación EN_REVISION con CI)→F5 (auditoría independiente). Los datos, documentos y estados son idénticos a los de ChatGPT. No declarar controles realizados sin ejecutarlos.
