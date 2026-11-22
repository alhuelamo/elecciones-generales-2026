# Vendored data

## municipios_islas.csv, islas.csv

- Source: https://github.com/codeforspain/ds-organizacion-administrativa (`data/municipios_islas.csv`, `data/islas.csv`)
- Commit: 1e9c99280ef4d7a12def33cafc3df59d9fc1f688 (2026-05-13)
- License: Open Data Commons Public Domain Dedication and License (PDDL 1.0), declared in the repository `datapackage.json`. A public domain dedication is compatible with redistribution under this project's MIT license.
- Files are unmodified copies.

## wikidata_municipality_labels.csv

- Source: Wikidata SPARQL endpoint (https://query.wikidata.org/sparql), municipalities of Spain keyed by INE code (property P772, 5 digits, no control digit).
- Retrieved: 2026-11-22. Regenerate with `cd pipeline && uv run elecciones refresh-labels` (about 9 minutes).
- License: CC0 1.0 (Wikidata). Columns: `code`, `es`, `ca`, `eu`, `gl` labels (empty when Wikidata has none; a blank `es` falls back to the INE name); sorted by code, deduplicated.
- Fetched as one query per province (52), with retries and backoff; the write is refused unless every INE municipality is present with an `es` label. Query, with `{province}` the 2-digit INE province code:

```sparql
SELECT ?code ?es ?ca ?eu ?gl WHERE {
  ?municipality wdt:P772 ?code .
  FILTER(STRSTARTS(?code, "{province}") && STRLEN(?code) = 5)
  OPTIONAL { ?municipality rdfs:label ?es . FILTER(LANG(?es) = "es") }
  OPTIONAL { ?municipality rdfs:label ?ca . FILTER(LANG(?ca) = "ca") }
  OPTIONAL { ?municipality rdfs:label ?eu . FILTER(LANG(?eu) = "eu") }
  OPTIONAL { ?municipality rdfs:label ?gl . FILTER(LANG(?gl) = "gl") }
}
```
