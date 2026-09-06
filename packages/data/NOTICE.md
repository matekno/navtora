# Atribuciones de datos

## tikkun.io

Los archivos en `raw/tikkun/` son copia de `src/data/pages/torah/*.json` y
`src/data/tables-of-contents/torah.json` del repositorio
https://github.com/akivajgordon/tikkun.io, commit fijado en `raw/tikkun/COMMIT`.

Licencia MIT, Copyright (c) Akiva Gordon. El texto de la Torá que contiene
proviene de la API de Sefaria con correcciones del autor.

Los archivos en `dist/` se derivan de esos datos.

## Sefaria

Cruce del texto consonántico contra la versión "Tanach with Text Only" de
Sefaria (dominio público). https://www.sefaria.org

## hebcal

`@hebcal/leyning` (BSD-2-Clause) y `@hebcal/core` (GPL-2.0) se usan únicamente
en el script de build para cruzar los límites de aliot. Ningún código de hebcal
se incluye en los artefactos ni en la aplicación.
