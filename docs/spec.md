# Elecciones Generales 2026 — Design Spec

Static GitHub Pages site for the Spanish general election of **29 November 2026**. A voter types their town, sees the Congreso and Senado candidacies on their ballot, and opens a candidacy to see its full candidate list and curated facts. UI in Catalan and Spanish, light/dark mode, no server code.

## 1. Scope

- Both chambers, two tabs per town.
- **Congreso** constituency = province (52, incl. Ceuta and Melilla). Closed list. Seats per province from the annex of Real Decreto 806/2026 (BOE-A-2026-20742) (sum 350; Ceuta 1, Melilla 1).
- **Senado** constituency = province, except:
  - Illes Balears (07): `07-mallorca` (3), `07-menorca` (1), `07-eivissa`, `07-formentera` (1; es "Ibiza-Formentera", ca "Eivissa, Formentera")
  - Las Palmas (35): `35-gran-canaria` (3), `35-fuerteventura` (1), `35-lanzarote` (1)
  - Santa Cruz de Tenerife (38): `38-tenerife` (3), `38-la-palma` (1), `38-la-gomera` (1), `38-el-hierro` (1)
  - Ceuta (51), Melilla (52): 2 seats each. All other provinces: 4 seats. Directly elected total: 208.
- **Senado open list, max marks** (LOREG art. 166): `maxMarks = max(seats - 1, 1)` → 4 seats: 3; 3 seats: 2; 2 seats: 1; 1 seat: 1. The "mark up to 3" copy is the general case; the UI always shows the constituency's own `maxMarks`.
- Party detail: badge/logo, denomination (as in BOE; no coalition member lists), acronym, links, structured facts (no free-text descriptions), ordered candidates (Congreso titulares + suplentes; Senado titulares with their suplente + "mark up to N" note).
- Constituency view: seats at stake, how-to-vote help per chamber (Congreso: white ballot, white envelope, one closed list, no marks; Senado: sepia envelope, single ballot, mark up to N), 2023 results per candidacy via predecessor lineage.
- Ordering: BOE publication order default; toggles: alphabetical (by denomination, `Intl.Collator(lang, {sensitivity: 'base'})`), 2023 votes (desc, nulls last, ties by BOE order).
- **About page** `#/{lang}/about` (linked from header and footer): provenance of each dataset (BOE Candidaturas proclamadas, INE municipality list, Ministerio del Interior 2023 results, Wikimedia Commons logos with per-logo license/author/source, curated `parties.yaml`), last-updated timestamp (pipeline build time), non-affiliation disclaimer (no party, institution or electoral administration), "report an error" link to GitHub issues.
- Footer: short neutrality notice, source links (BOE, INE, Interior), link to About.
- "Edit on GitHub" link per party → `parties.yaml` edit URL.
- Out of scope: PWA/service worker, server code, prose party descriptions, polls, per-party OG images.

## 2. Architecture

```
pipeline/   Python (uv, pytest, black, isort). Build-time only.
  data/     curated inputs (seats_2026.yaml, islands.csv, provinces.yaml, parties.yaml, logos.yaml, lineage_2023.yaml, sources.yaml)
  data/raw/ downloaded sources (gitignored)
  src/elecciones_pipeline/  parsers, enrichment, export, CLI
schemas/    JSON Schema (draft 2020-12) — the frontend/pipeline contract
web/        Vite + React + TypeScript + Tailwind v4 + Headless UI, yarn 4
  public/data/   generated JSON (committed); fixture set until first real build
  public/logos/  logos from Wikimedia Commons (committed)
.github/workflows/  test + Pages deploy
```

- Pipeline outputs are committed; CI never scrapes. Re-scrape is a manual `uv run elecciones fetch && uv run elecciones build`.
- Candidacies come from ONE BOE document, **BOE-A-2026-23103** (3 Nov 2026, 225 pp), XML at `https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103` (~950k chars, ~895 candidacies: 534 Congreso, 361 Senado). Body is flat `<p class="…">` paragraphs (`centro_negrita`, `centro_redonda`, …).
- Candidacy source behind a `CandidacySource` protocol (XML adapter preferred, HTML fallback); both reduce the document to ordered `SourceParagraph(css_class, text)`. A paragraph state machine turns them into candidacies:
  `JUNTA ELECTORAL DE <PROVINCE>` → `CONGRESO DE LOS DIPUTADOS` | `SENADO` → (Baleares/Canarias Senado: island subheading) → `<n>. <DENOMINATION> (<ACRONYM>)` → numbered titulares → `Suplentes:` → numbered suplentes (Congreso) | Senado candidates each followed by their `Suplente` line(s). Entries marked `No proclamada` are skipped. A format change touches only an adapter or the state machine.
- A later "corrección de errores" BOE document is handled by re-scraping (if BOE republishes) or by `pipeline/data/corrections.yaml` overrides applied after parsing.
- INE municipalities: `https://www.ine.es/daco/daco42/codmun/26codmun.xlsx`, one sheet per province (`01`…`52`), headers on row 3 `CPRO|CMUN|DC|NOMBRE`, data from row 4.
- Islands: vendored `pipeline/data/vendor/municipios_islas.csv` from codeforspain/ds-organizacion-administrativa (`municipio_id,provincia_id,isla_id,cmun,dc,nombre`) + `island_constituencies.yaml` mapping `isla_id` → Senado constituency id (Eivissa and Formentera both → `07-eivissa`, `07-formentera`).
- 2023 results behind a `Results2023Source` protocol. infoelectoral.interior.gob.es blocks automated fetches (403): the source file is a **manual download** into `pipeline/data/raw/results_2023/`; this feature is last and cuttable.
- Frontend loads `data/municipalities.json` eagerly; `data/{chamber}/{constituencyId}.json` and `data/parties.json` lazily (memoized fetch, `import.meta.env.BASE_URL` prefix).
- Hash routing (static hosting, no 404 rewrites):
  - `#/{lang}` home
  - `#/{lang}/about`
  - `#/{lang}/{ineCode}` → Congreso tab
  - `#/{lang}/{ineCode}/{congreso|senado}`
  - `#/{lang}/{ineCode}/{congreso|senado}/{partySlug}`
  - `lang ∈ {es, ca}`; `ineCode` = 5-digit INE code (2 province + 3 municipality, no control digit).
- Static OG image + meta tags in `index.html`.

## 3. Data contract (`schemas/`)

### `data/municipalities.json` — `municipalities.schema.json`
```json
{
  "dataset": "boe-2026",
  "generatedAt": "2026-11-23T10:00:00Z",
  "constituencies": {
    "congreso": [{ "id": "08", "name": { "es": "Barcelona", "ca": "Barcelona" }, "seats": 32, "maxMarks": null }],
    "senado":   [{ "id": "07-mallorca", "name": { "es": "Mallorca", "ca": "Mallorca" }, "seats": 3, "maxMarks": 2 }]
  },
  "municipalities": [
    { "code": "08101", "name": "L'Hospitalet de Llobregat", "aliases": ["Hospitalet de Llobregat, L'"], "congreso": "08", "senado": "08" }
  ]
}
```
- `dataset`: `"fixture"` or `"boe-2026"`. Fixture data triggers a visible "demo data" banner.
- `generatedAt`: pipeline build timestamp (UTC ISO 8601), shown on About.
- `municipality.name`: INE official name with postposed article moved to front; bilingual names keep the slash (`Alacant/Alicante`).
- `aliases`: every other searchable form (each side of a slash, the raw INE form).
- `congreso` = province code; `senado` = Senado constituency id.

### `data/{congreso|senado}/{constituencyId}.json` — `ballot.schema.json`
```json
{
  "chamber": "congreso",
  "constituencyId": "08",
  "seats": 32,
  "maxMarks": null,
  "sources": [{ "label": "BOE-A-2026-00000", "url": "https://www.boe.es/..." }],
  "candidacies": [{
    "slug": "psc-psoe",
    "boeOrder": 1,
    "denomination": "PARTIT DELS SOCIALISTES DE CATALUNYA",
    "acronym": "PSC-PSOE",
    "partyKey": "psoe",
    "isCoalition": false,
    "candidates":  [{ "position": 1, "name": "…", "substituteNames": [] }],
    "substitutes": [{ "position": 1, "name": "…", "substituteNames": [] }],
    "results2023": { "votes": 1000, "percentage": 34.12, "seats": 12, "asAcronyms": ["PSC-PSOE"] }
  }]
}
```
- `slug`: `slugify(acronym)`, unique within the file (collision → `-{boeOrder}` suffix).
- `partyKey`: key in `parties.json` or `null`.
- Senado: `substitutes` is `[]`, each candidate carries its `substituteNames` (one or more, BOE order). Congreso: `substituteNames` is `[]`.
- `results2023`: Congreso `percentage` = votes / valid votes × 100, 2 decimals. Senado: `votes` = most-voted candidate of that candidacy, `percentage` = `null`, `seats` = senators won. `asAcronyms` = 2023 acronyms summed. `null` when no predecessor.

### `data/parties.json` — `parties.schema.json`
```json
{ "parties": { "psoe": {
  "key": "psoe", "name": "Partido Socialista Obrero Español",
  "logo": { "path": "logos/psoe.svg", "sourceUrl": "https://commons.wikimedia.org/wiki/File:…", "license": "CC BY-SA 4.0", "author": "…" },
  "website": "https://…", "programmeUrl": null, "leader": "…", "founded": 1879,
  "seats2023": { "congreso": 121, "senado": 72 },
  "wikipedia": { "es": "https://es.wikipedia.org/…", "ca": null }
} } }
```
All fields except `key` and `name` are nullable / may be empty.

## 4. Curated inputs (`pipeline/data/`)

- `seats_2026.yaml`: `{ "<provinceCode>": <congresoSeats> }` transcribed from the 2026 Real Decreto de convocatoria.
- `provinces.yaml`: `{ "<provinceCode>": { es: …, ca: …, boeNames: [ … ] } }` — `boeNames` are the spellings found in BOE headings / INE (e.g. `Araba/Álava`, `València/Valencia`, `Illes Balears`).
- `vendor/municipios_islas.csv` + `island_constituencies.yaml`: island of each of the 67 Baleares and 88 Canarias municipalities.
- `corrections.yaml`: post-parse overrides from any BOE corrección de errores (`- {constituency, chamber, boeOrder, op: rename_candidate|remove_candidacy|set_acronym, …}`).
- `parties.yaml`: keyed by party key; `aliases` = acronyms as they appear in BOE (matched by `normalize_acronym`); `tier: full|basic`; fields mirror `parties.json` minus logo.
- `logos.yaml`: `{ <partyKey>: { file, sourceUrl, license, author } }`, files in `web/public/logos/`.
- `lineage_2023.yaml`: `{ <normalized 2026 acronym>: [<2023 acronyms>] }`. Missing entry → same normalized acronym in that constituency's 2023 results; explicit `[]` → no predecessor. Known 2026 realignments needing entries: Frente Amplio (Más Madrid, Sumar, IU, Comuns) ← SUMAR 2023 (and regional brands); Podemos separate (no 2023 list of its own → `[]`); CC–Municipalistas Primero Canarias ← CCa 2023; UPN–PP (Navarra) ← UPN + PP 2023; D21 (incl. Cs) ← Cs 2023 if present; PSOE "Senado de Progreso" Senate coalition ← its 2023 Senate equivalent.
- `sources.yaml`: pinned download URLs (BOE-A-2026-23103 XML, INE xlsx) used by `elecciones fetch`, with license notes; 2023 results listed as manual.

## 5. UI

- Header: title, About link, language toggle (es/ca), theme toggle (system → light → dark).
- Search: Headless UI Combobox, Fuse.js over pre-normalized `name` + `aliases` (lowercase, diacritics stripped, `·` removed so `l·l` → `ll`, `' ’ . - / , ( )` → space, whitespace collapsed). Exact normalized-name match ranks first, then prefix matches, then Fuse score. Max 10 results. Each option shows the province to disambiguate homonyms.
- Language: route segment wins; otherwise localStorage `eg26.lang`; otherwise `navigator.languages` (any `ca*` → `ca`, else `es`). Toggle rewrites the route and persists.
- Theme: localStorage `eg26.theme` ∈ `system|light|dark`; `dark` class on `<html>`; inline script in `index.html` applies it before first paint. Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`.
- i18n: react-i18next, one JSON namespace per feature under `web/src/i18n/locales/{es,ca}/{namespace}.json`, loaded by `import.meta.glob`; es/ca key parity is tested.
- Stale links (unknown municipality code or party slug after a re-scrape) fall back to the nearest valid view with a notice, never a blank page.

## 6. Quality

- TDD everywhere. pytest: municipality name variants, municipality→constituency mapping, seats/maxMarks, candidacy header + coalition parsing, candidate ordering, acronym normalization, enrichment matching, lineage, export contract. Vitest: search, routing, i18n parity/detection, ordering, theme, components.
- Pipeline `build` fails on: a province without Congreso candidacies, a Senado constituency without candidacies, a Baleares/Canarias municipality without island. Warns on: Congreso candidacy with `len(candidates) != seats`, Senado candidacy with more candidates than seats.
- `pipeline/tests/test_contract.py` validates every file in `web/public/data/` against `schemas/` plus referential integrity (every municipality's constituencies exist as files).

## 7. Timeline

| Date | Milestone |
|---|---|
| Nov 21–22 | Scaffold, contract, data spike, Pages deploy of skeleton |
| Nov 24 | **MVP live**: search, both ballots, candidates, seats, how-to-vote, About, ca/es, dark mode, hash URLs, badges |
| Nov 26 | Enrichment (parties.yaml full tier, logos) |
| Nov 27 | 2023 results (first cut acceptable); **freeze** |
| Nov 28 | Re-scrape BOE, rebuild, deploy |
