# Valorar una nueva empresa con Floyd libro único

Mantenimiento técnico preparado el 12-nov-2026 sobre el contrato económico 1.5.
No cambia las fórmulas de Damodaran ni los valores existentes. La instalación de
los controles nuevos en la maestra requiere adopción explícita después de probar
la copia. Hasta entonces la maestra conserva sus controles 1.5.

## Alcance

La plantilla FCFF es para empresas operativas con estados consolidados compatibles.
Antes de copiar, determinar si el negocio necesita FCFE bancario, SOTP o segmentos;
no forzar bancos, aseguradoras o holdings dentro de una plantilla industrial.
No heredar supuestos, pesos, excepciones o aprobaciones de ORCL u otra empresa.

## Una ruta R1–R6

1. **R1.** Identificar ticker, revisión, ejercicio fiscal, moneda, escala, corte contable
   y fecha del precio. Copiar el libro único y el Doc A; registrar dos IDs distintos.
   Verificar cálculo iterativo (100 iteraciones, 1e-6). Una copia vacía no es valorable.
2. **R2.** Cargar diez FY y LTM, balance inicial/comparable, precios fiscales, auxiliares
   y fuentes primarias. Clasificar deuda, leases, preferentes, minoritarios y dilución;
   conciliar balance, EBIT y caja con FX. No confundir caja restringida con caja libre.
   Un dato no reportado mantiene N/D: una excepción exige celda exacta, revisión,
   fuente, motivo y aprobación documentada. No exceptuar una cantidad sin identificarla.
3. **R3.** Escribir tres historias y sus supuestos en inputs autorizados. No editar los
   coeficientes derivados B30:D39 de Supuestos y control. Justificar crecimiento,
   márgenes, reinversión, S/C, terminal y riesgo en conjunto. Ejecutar las tres matrices
   5×5 y cuatro soluciones inversas sobre una copia; conservar corridas y restauración.
   Solo entonces registrar las firmas de los inputs usados en Control de revisión C/D.
   Cambiar inputs, históricos, precio o revisión invalida esos sellos, aunque el Base
   vuelva por casualidad al mismo valor. No aceptar columnas g>Rf para decidir.
4. **R4.** Completar los cinco múltiplos aplicables y justificar pesos. N/M o N/A requiere
   explicación económica, peso cero cuando corresponda y ninguna cuadrícula ficticia.
   Comparar el DCF Base con múltiplos sin sustituirlo. MOS 35% solo sobre el Base.
5. **R5.** Extraer valoración y análisis de la misma revisión: Nivel 1 de 14 capítulos y
   Nivel 2 de 12 apartados. No copiar outputs de otra compañía. Ejecutar el preflight
   de una revisión con sus URLs reales; después los validadores del catálogo completo.
   Añadir ambas rutas y controlModeloA.empresas.TICKER.rutaValoracion exacta. Comprobar
   en la app ficha, fechas, Base/MOS, escenarios, matrices, análisis, fuentes y asuntos
   por revisar, también en móvil. Un JSON correcto no acredita esa prueba de navegador.
   Publicar EN_REVISION solo con datos completos, gates y salvedades visibles según 1.5.
6. **R6.** Auditoría económica independiente. No convertir pruebas técnicas en R6 ni
   declarar certificada una revisión por tener una ficha visible.

## Comandos en Modelo-JMR-datos

```sh
node scripts/preflight_floyd.cjs valoraciones/REV.json analisis/REV.json catalogo.json
node scripts/validar_reboot.cjs
node scripts/auditar_integridad.cjs
node scripts/validar_catalogo.cjs
node --test scripts/tests/floyd_proceso.test.cjs scripts/tests/validar_catalogo.test.cjs
```

Para un candidato fuera del catálogo, omitir el tercer argumento del preflight.
ESTRUCTURA_OK acredita JSON y vínculos; no acredita gates vivos, QA de app ni R6.
Los validadores resuelven por contrato: libro único y seis archivos heredados usan
las mismas comprobaciones numéricas; no simular IDs para hacer pasar el nuevo formato.

## Controles del libro propuestos y probados en copia

`JMR-valuation/scripts/floyd_libro_unico/controles_revision.py` genera un batch Sheets
con una pestaña externa a los motores. Rechaza reinstalación y layout desconocido;
no borra aprobaciones. Controla 27 bloques de inputs, conversores e históricos.
La firma conserva cada posición y longitud; los sellos empiezan vacíos.
No son auditoría económica ni mecanismo de permisos: un editor puede alterar celdas,
por lo que debe conservarse además la evidencia de las corridas y la integridad del motor.

- Control de revisión B2/B3: vigencia de matrices e inverso, separadas.
- Filas 45–144: excepciones por dirección y revisión; duplicados no cuentan; al
  resolverse el N/D o cambiar la revisión, la excepción deja de contar.
- Auxiliares D64 deriva del registro; B67 conserva sus conciliaciones originales.
- Supuestos y control B64 exige R2 y corridas vigentes además de los gates anteriores.
- Sensibilidades B32/D22:D25 dejan de mostrar corridas como vigentes tras un cambio.

Copia de prueba restaurada (sin empresa, excepciones ni sellos):
https://docs.google.com/spreadsheets/d/1GtMcMapinEe4-0n0aFCDngiUNlnZtZGAUvwj3o9-Hzc/edit

Respaldo de la maestra previo al mantenimiento:
https://docs.google.com/spreadsheets/d/18NXunNWhaZcCP-yIMbsgMUEGW7w6bB92jr5v9RiAnrY/edit

## Evidencia de mantenimiento

Prueba viva sobre copia: estado vacío NO PUBLICAR; una excepción exacta cuenta 1;
resolver la celda la lleva a 0; sellar firmas de prueba y modificar un input invalida
matrices e inverso. Después se restauraron input/fórmula y se retiraron todos los sellos
y datos sintéticos. Estos sellos de prueba no son corridas económicas ni una valoración.
Las escrituras del instalador se limitan a controles, auxiliares y guía, fuera de Ginsu.
La maestra permanece sin modificar hasta aprobar la instalación concreta.
