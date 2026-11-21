# Vendored data

## municipios_islas.csv, islas.csv

- Source: https://github.com/codeforspain/ds-organizacion-administrativa (`data/municipios_islas.csv`, `data/islas.csv`)
- Commit: 1e9c99280ef4d7a12def33cafc3df59d9fc1f688 (2026-05-13)
- License: Open Data Commons Public Domain Dedication and License (PDDL 1.0), declared in the repository `datapackage.json`. A public domain dedication is compatible with redistribution under this project's MIT license.
- Files are unmodified copies.

## wikidata_municipality_labels.csv

- Source: Wikidata SPARQL endpoint (https://query.wikidata.org/sparql), municipalities of Spain keyed by INE code (property P772, 5 digits, no control digit).
- Retrieved: 2026-11-21. Regenerate with `cd pipeline && uv run elecciones refresh-labels`.
- License: CC0 1.0 (Wikidata). Columns: `code`, `es` label, `ca` label (empty when Wikidata has none); sorted by code, deduplicated.
- Query:

```sparql
SELECT ?code ?es ?ca WHERE {
  ?municipality wdt:P31/wdt:P279* wd:Q2074737 ;
                wdt:P772 ?code .
  OPTIONAL { ?municipality rdfs:label ?es . FILTER(LANG(?es) = "es") }
  OPTIONAL { ?municipality rdfs:label ?ca . FILTER(LANG(?ca) = "ca") }
}
```
