# Data attributions

## tikkun.io

The files in `raw/tikkun/` are copies of `src/data/pages/torah/*.json` and
`src/data/tables-of-contents/torah.json` from
https://github.com/akivajgordon/tikkun.io, at the commit pinned in `raw/tikkun/COMMIT`.

MIT License, Copyright (c) Akiva Gordon. Its Torah text comes from the Sefaria
API with corrections by the author.

The files in `dist/` are derived from that data.

## Sefaria

The consonantal text is cross-checked against Sefaria's "Tanach with Text Only"
version (public domain). https://www.sefaria.org

## hebcal

`@hebcal/leyning` (BSD-2-Clause) and `@hebcal/core` (GPL-2.0) are used by the
build script to cross-check aliyah boundaries. No hebcal code is included in the
generated data. The web app uses them at runtime for the reading calendar; see
the license note in the top-level README.
