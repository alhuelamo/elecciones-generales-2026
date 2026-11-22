# 2023 Constituency Results Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact "Resultados de 2023 en {circunscripción}" block to each chamber tab of the constituency page, directly above the candidacy list. The block shows:
- the real, complete 2023 result of that constituency: turnout, total votes and a link to the Ministerio del Interior source;
- for Congreso only, a vote-share bar chart with the 3 % barrier;
- a seat chart: a hemicycle for Congreso constituencies with 10 or more seats, one dot per seat otherwise, and always dots for Senado;
- party colours taken from Spanish Wikipedia, with a grey fallback.

**Architecture:**
- The pipeline extends both 2023 xlsx parsers so they also emit one `ConstituencyResult2023` per constituency. The existing per-candidacy lineage is untouched.
- The build turns each of those into a nullable `constituencyResults2023` object on the existing ballot JSON (`web/public/data/{chamber}/{id}.json`), adds a per-party `color` from the new `pipeline/data/party_colors.yaml`, and validates it through `schemas/ballot.schema.json`.
- The web gets a new feature folder `web/src/results2023/`:
  - pure helpers: vote-share rows, seat ordering, party colour and outline, hemicycle geometry;
  - three components: `VoteShareChart`, `SeatChart` (with its legend) and `Results2023Block`;
  - a new i18n namespace, `results2023`.
- `ConstituencyView` renders `Results2023Block` right before `CandidacyList`.

**Tech Stack:**
- Pipeline: Python 3 + uv, openpyxl, PyYAML, jsonschema, pytest, black and isort.
- Web: Vite, React 19, TypeScript, Tailwind v4 tokens, react-i18next (es/ca), Vitest + Testing Library, yarn 4, oxlint and prettier.

**Spec:** the brief is copied into Global Constraints below. Related documents: product spec `docs/spec.md`, earlier plans `docs/plan.md` and `docs/plan-redesign.md`.

## Data contract (decided)

`constituencyResults2023` is a **required, nullable** field on every ballot JSON. It is `null` when the 2023 source files are absent.

```jsonc
"constituencyResults2023": {
  "electorate": 5224561,          // Total censo (CER + CERA)
  "totalVotes": 3639500,          // Total votantes
  "turnoutPercentage": 69.66,     // totalVotes / electorate * 100, 2 dp
  "validVotes": 3601234,          // Votos válidos (candidacies + blank)
  "blankVotes": 21000,            // Votos en blanco / Papeletas en blanco
  "blankPercentage": 0.58,        // Congreso: blankVotes / validVotes * 100, 2 dp; Senado: null
  "combinedDistrictName": null,   // "Eivissa-Formentera" on both 07-eivissa and 07-formentera Senado ballots, else null
  "parties": [
    {
      "acronym": "PP",            // exactly as on the 2023 ballot (raw header cell, stripped)
      "name": "PARTIDO POPULAR",  // exactly as on the 2023 ballot
      "votes": 1453000,           // Congreso: list votes; Senado: null
      "percentage": 40.35,        // Congreso: votes / validVotes * 100, 2 dp; Senado: null
      "seats": 16,
      "color": "#1d84ce"          // from party_colors.yaml by exact acronym, else null (web applies grey)
    }
  ]
}
```

**Why this shape:**
- **On the ballot, not in a separate file.** The tab already fetches this file, so there is no new loader, no new request and no new contract file. The data swaps with the tab for free, and `test_committed_web_data_is_valid` covers it.
- **The cost is small.** Eivissa-Formentera appears twice, once in each island's ballot (4 parties).
- **No `chamber` or `seats` inside the object.** The chamber is already on the ballot. The 2023 seat total is `sum(parties.seats)`, and it can differ from the 2026 `ballot.seats`, so the web must never use `ballot.seats` for these charts.
- **Congreso `parties`** has every list with more than 0 votes, sorted by votes descending.
- **Senado `parties`** has only the lists that won at least one seat. Senators are elected as people, so `votes` and `percentage` are `null`. Parties are sorted by seats descending, with ties broken by the best candidate's votes; those votes are used for ordering only and are not published.
- **`blankPercentage` is `null` for Senado** because the Senado block shows no vote share.

## Global Constraints

- **Placement and design**
  - The block sits above `CandidacyList`, inside the current chamber tab.
  - It is compact: one surface, `rounded-frame border border-rule bg-paper p-4`, with internal `gap-3`.
  - The surface is plain paper in both chambers, so the party colours' 3:1 contrast check against `paper` matches the real background. The bar track itself has no fill.
  - Use the existing primitives and tokens only: `paper`, `paper-raised`, `ink`, `ink-muted`, `rule`, `rule-strong`, `accent`, `kraft`.
  - Party colours appear only in bars, seat dots and legend swatches. Everything else stays monochrome.
- **Heading**
  - es: `Resultados de 2023 en {{constituency}}`
  - ca: `Resultats de 2023 a {{constituency}}`
  - When `combinedDistrictName` is set, `{{constituency}}` is that name and an explanatory caption is shown below the heading.
- **Caption**
  - Format: `Participación: 70,4 % · 3.712.540 votos · Fuente: Ministerio del Interior`.
  - Turnout is shown with 1 decimal. Votes are formatted with `Intl.NumberFormat(i18n.language)`.
  - The source is a link through `web/src/design/ExternalLink.tsx` to `SOURCE_URLS.interior` (`web/src/config.ts`). `ExternalLink.test.tsx` fails if any other file uses `target="_blank"` or `noopener`.
- **Vote-share chart (Congreso only)**
  - Horizontal bars in plain HTML/CSS. No SVG and no chart library.
  - Rows are sorted by votes descending. Parties under 1 % of valid votes are grouped into one "Otros" row, which is always grey.
  - "En blanco" is a muted grey row (`bg-rule` fill with a `border-rule-strong` edge). "Otros" and then "En blanco" come after the party rows.
  - Labels sit outside the bars: acronym on the left, percentage (1 decimal) on the right. The full party name is in sr-only text.
  - The bar scale is the largest row percentage, so the widest bar takes the full track.
  - A dashed vertical line at 3 % is labelled `barrera del 3 %` (same text in es and ca).
  - Each row is a list item whose visible text is readable by assistive technology. Bars are `aria-hidden`.
- **Party colours**
  - Bar fills use the party colour. The fallback grey is `#8c877c`, which passes 3:1 on both papers.
  - Each colour is checked against `paper` in both themes (`#faf7f0` light, `#16151a` dark). If either check is below 3:1, the element gets an `outline outline-1 outline-ink` outline.
- **Seat chart**
  - A hemicycle when the constituency's 2023 seat total is at least 10 (`HEMICYCLE_MIN_SEATS = 10`) and the chamber is Congreso. Otherwise a wrapping row of dots, one per seat. Senado always uses dots.
  - Seats are ordered by seats descending, with the largest party starting from the left.
  - Legend: `PP 16 · PSOE 10 · SUMAR 6 · VOX 5`, with a swatch per party and the acronyms raw as on the 2023 ballot.
  - The Senado tab adds a note. es: `En el Senado se vota a personas, no a listas: no hay porcentaje por partido`. ca: `Al Senat es vota a persones, no a llistes: no hi ha percentatge per partit`.
- **Hemicycle geometry** is a pure, unit-tested function:
  - `rows = n < 5 ? 1 : max(1, round(sqrt(n / 3)))`.
  - Radii are spread evenly from `INNER_RADIUS_RATIO = 0.4` to 1. A single row uses radius 1.
  - Seats per row are proportional to the radius, using largest-remainder rounding so they sum to exactly n. Ties go to the outer row.
  - Within a row, angles are spread evenly over π. A row with a single seat uses π/2.
  - All positions are sorted by angle descending (π, the left end, first), with ties broken by row ascending. Parties are then assigned in order.
- **Responsive and dark mode:** no horizontal scroll at 375 px, and the block works in both themes.
- **Unchanged:** the per-row `2023: …` line in `CandidacyList` stays exactly as it is.
- **Tests**
  - The existing 278 web and 312 pipeline tests stay green. Change an existing test only when its fixture shape legitimately changes, and give the reason in the commit body.
  - TDD: write failing tests first, see them fail for the right reason, implement, then refactor.
- **Code style**
  - Descriptive names, no comments, small functions, constants in UPPERCASE.
  - Python: black + isort.
  - Web: `yarn format:check` and `yarn lint` must be clean.
- **Commands**
  - From `pipeline/`: `uv run pytest`, `uv run black --check .`, `uv run isort --check-only .`, `uv run elecciones build`.
  - From `web/`: `yarn test`, `yarn build`, `yarn format:check`, `yarn lint`.
- **Raw data**
  - `pipeline/data/raw/**` is gitignored and exists only in the main checkout. Tasks 3, 4 and 10 must run there, or symlink `pipeline/data/raw` into their worktree.
  - Every other task uses the committed fixtures only.
- **i18n**
  - New namespace `results2023` in `web/src/i18n/locales/{es,ca}/results2023.json`. `localeParity.test.ts` auto-detects it.
  - Every string must exist in both languages.
- **Git**
  - Commits are signed via 1Password. Never disable signing and never use `--no-gpg-sign`.
  - Always commit with explicit pathspecs: `git commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- <paths>`.
  - Only Task 10 pushes, with `git push git@github.com:alhuelamo/elecciones-generales-2026.git main`.

## Review Focus

1. **The Eivissa-Formentera split.** The combined 2023 Senado district must appear in the block of both island ballots, with the combined caption. It must still not be attributed to either island in the per-candidacy lineage: keep `test_senado_combined_eivissa_formentera_district_is_not_attributed_to_either_island` green. Owned by Task 2 tests and the Task 4 json test.
2. **Percentage base.** Party and blank percentages are computed over valid votes (candidacies + blank), not over total votes, and parties under 1 % are grouped as "Otros". Owned by Task 1 and Task 4 (`35.7` for the 952347-vote list in fixture 08) and Task 5 `voteShareRows.test.ts`.
3. **Hemicycle row counts sum to n**, with the leftmost seat going to the largest party. Owned by Task 6 `hemicycle.test.ts`, with the exact per-row counts listed there.
4. **Colour contrast.** Every colour, including the fallback, gets an outline when it is below 3:1 on either paper. `PAPER_COLORS` must match `index.css`. Owned by Task 5 `partyColor.test.ts`.
5. **The 2023 seat total, not the 2026 one.** The hemicycle threshold and the dot count use `sum(parties.seats)`, never `ballot.seats`. Owned by Task 8 tests, which use a fixture whose 2023 total differs from its ballot seats.

---

## Execution waves and file ownership

| Wave | Tasks (parallel) | Owns |
|---|---|---|
| 1 | T1 · T3 · T5 · T6 | T1: `pipeline/src/elecciones_pipeline/results_2023/{source,congreso_xlsx_source}.py`, `pipeline/tests/test_results_2023.py` (Congreso tests) · T3: `pipeline/data/party_colors.yaml`, `pipeline/src/elecciones_pipeline/party_colors.py`, `pipeline/tests/test_party_colors_data.py` · T5: `web/src/contract/types.ts`, `web/src/test/fixtures.ts`, `web/src/results2023/{voteShareRows,seatAllocation,partyColor}.ts(+tests)` · T6: `web/src/results2023/hemicycle.ts(+test)` |
| 2 | T2 · T7 · T8 | T2: `pipeline/src/elecciones_pipeline/results_2023/senado_xlsx_source.py`, `pipeline/tests/test_results_2023.py` (Senado tests) · T7: `web/src/results2023/VoteShareChart.tsx(+test)`, `web/src/i18n/locales/{es,ca}/results2023.json` (creates) · T8: `web/src/results2023/{SeatChart,SeatLegend}.tsx(+tests)`, appends keys to ns `results2023` |
| 3 | T4 · T9 | T4: `pipeline/src/elecciones_pipeline/build.py`, `pipeline/src/elecciones_pipeline/results_2023/constituency_json.py(+test)`, `schemas/ballot.schema.json`, `pipeline/tests/test_build.py`, `web/public/data/**` · T9: `web/src/results2023/Results2023Block.tsx(+test)`, `web/src/constituency/ConstituencyView.tsx(+test)`, ns `results2023` |
| 4 | T10 | verification, commit, push |
| 5 | T11 (main session, browser) | nothing |

T7 and T8 both touch ns `results2023`. T7 creates it, and T8 rebases on top of T7 and only appends keys. If you would rather not have them overlap, run T8 after T7.

---

### Task 1: Congreso constituency results in the pipeline

model: sonnet (agent `implementer`)

**Files:**
- Modify: `pipeline/src/elecciones_pipeline/results_2023/source.py`, `pipeline/src/elecciones_pipeline/results_2023/congreso_xlsx_source.py`, `pipeline/src/elecciones_pipeline/results_2023/__init__.py` (exports)
- Test: `pipeline/tests/test_results_2023.py`

**Interfaces:**
```python
@dataclass(frozen=True)
class PartyResult2023:
    acronym: str
    name: str
    votes: int | None
    seats: int

@dataclass(frozen=True)
class ConstituencyResult2023:
    chamber: str
    constituency_id: str
    electorate: int
    total_votes: int
    valid_votes: int
    blank_votes: int
    combined_district_name: str | None
    parties: tuple[PartyResult2023, ...]

@dataclass(frozen=True)
class Results2023:
    candidacies: tuple[CandidacyResult2023, ...]
    valid_votes: dict[tuple[str, str], int]
    constituencies: dict[tuple[str, str], ConstituencyResult2023] = field(default_factory=dict)
```
- The `default_factory` keeps the existing constructor sites (`tests/test_lineage.py:18,58`) unchanged. `build.py` is wired in Task 4.
- New Congreso column constants:
  - `ELECTORATE_COLUMN = 7` (Total censo)
  - `TOTAL_VOTES_COLUMN = 10` (Total votantes)
  - `BLANK_VOTES_COLUMN = 13`
- Party names come from `rows[header_index - 2]`, at the same column as the acronym. Strip both.

- [ ] **Step 1:** Print the Balears (07) and Barcelona (08) totals and the first party names from `pipeline/tests/fixtures/results_2023/congreso_excerpt.xlsx`. Use a throwaway `uv run python -c` and do not commit it.
- [ ] **Step 2:** Write the failing tests in `test_results_2023.py`:
  - `test_congreso_constituency_result_has_totals`: 08 has electorate, total_votes and blank_votes equal to the printed values, valid_votes 2667478, and combined_district_name None.
  - `test_congreso_constituency_parties_have_ballot_name_votes_and_seats`: the 952347-vote party has 13 seats and its name is the raw cell text.
  - `test_congreso_constituency_parties_are_sorted_by_votes_and_skip_zero_votes`.
  - `test_congreso_results_keep_candidacy_lineage` already exists; keep it green.
- [ ] **Step 3:** Run `uv run pytest tests/test_results_2023.py`. The tests fail on the missing attribute or empty `constituencies`.
- [ ] **Step 4:** Implement. Add the dataclasses, then build the `constituencies` dict in `CongresoXlsxSource.load` through small functions (`_constituency_result(row, constituency_id, party_columns)`, `_party_results(...)`).
- [ ] **Step 5:** Run `uv run pytest`. Everything passes (312 plus the new tests). Then run `uv run black --check . && uv run isort --check-only .`.
- [ ] **Step 6:** Commit:
  ```bash
  git commit -m "feat(pipeline): parse 2023 Congreso constituency totals and party results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- pipeline/src/elecciones_pipeline/results_2023 pipeline/tests/test_results_2023.py
  ```

---

### Task 2: Senado constituency results, including the combined Eivissa-Formentera district

model: sonnet (agent `implementer`)

**Depends on:** T1 (dataclasses).

**Files:**
- Modify: `pipeline/src/elecciones_pipeline/results_2023/senado_xlsx_source.py`
- Test: `pipeline/tests/test_results_2023.py`

**Interfaces:**
- Column constants:
  - `ELECTORATE_COLUMN = 9`
  - `TOTAL_VOTES_COLUMN = 12`
  - `BLANK_VOTES_COLUMN = 15`
- Party names come from `rows[header_index - 1]`.
- Replace `COMBINED_ISLAND_DISTRICTS` with a mapping:
  ```python
  COMBINED_ISLAND_DISTRICTS = {"eivissa-formentera": CombinedIslandDistrict(constituency_ids=("07-eivissa", "07-formentera"), seats=1)}
  ```
  `CombinedIslandDistrict` is a small frozen dataclass in this module. Its 1 seat is the 2023 count; the 2026 registry has no combined id.
- `_constituency_ids` keeps returning `()` for the combined district, so lineage stays unattributed.
- A separate `_block_constituency_ids(row)` returns the island ids for the combined district and otherwise the same ids as `_constituency_ids`.
- Senado party results:
  - Group the top-N winning candidates by acronym. `seats` is the number of winners per acronym, `votes=None` and `name` is the ballot party name.
  - Sort by seats descending, then by the best candidate's votes descending.
  - Only parties with at least 1 seat are kept.
- `combined_district_name` is the raw `row[CONSTITUENCY_NAME_COLUMN]` stripped for the combined district, otherwise `None`.

- [ ] **Step 1:** Print the totals for Mallorca, Eivissa-Formentera and Barcelona from `senado_excerpt.xlsx` with a throwaway script.
- [ ] **Step 2:** Write the failing tests:
  - `test_senado_constituency_result_lists_only_seat_winners_without_votes`: in 08, PSC (858698) has 3 seats and votes None. The seat total matches the registry seats.
  - `test_senado_constituency_result_has_totals` (Mallorca).
  - `test_senado_combined_district_results_are_shown_on_both_islands`: `constituencies[("senado","07-eivissa")]` equals `constituencies[("senado","07-formentera")]` except for `constituency_id`. `combined_district_name` is the raw name, and the result has 1 seat, won by the 26389-vote list.
  - The existing `test_senado_combined_eivissa_formentera_district_is_not_attributed_to_either_island` must stay unchanged and green.
- [ ] **Step 3:** Run `uv run pytest tests/test_results_2023.py`. The new tests fail.
- [ ] **Step 4:** Implement with small functions.
- [ ] **Step 5:** Run `uv run pytest` (all green) and the black/isort checks.
- [ ] **Step 6:** Commit:
  ```bash
  git commit -m "feat(pipeline): parse 2023 Senado constituency results incl. combined Eivissa-Formentera" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- pipeline/src/elecciones_pipeline/results_2023/senado_xlsx_source.py pipeline/tests/test_results_2023.py
  ```

---

### Task 3: Party colours file, loader and validation

model: sonnet (agent `implementer`, needs web lookups; run in the main checkout for the raw files)

**Files:**
- Create: `pipeline/data/party_colors.yaml`, `pipeline/src/elecciones_pipeline/party_colors.py`, `pipeline/tests/test_party_colors_data.py`, `pipeline/tests/test_party_colors.py`

**Interfaces:**
- YAML format, keyed by the exact 2023 acronym. It follows the provenance style of `logos.yaml`:
  ```yaml
  PP:
    color: "#1d84ce"
    sourceUrl: https://es.wikipedia.org/wiki/Partido_Popular
  ```
- Loader:
  ```python
  def load_party_colors(path: Path) -> dict[str, str]
  ```
  It maps each acronym to its lowercase hex and raises `BuildError` on a malformed entry.

- [ ] **Step 1: Enumerate acronyms.**
  - Use a throwaway script that reads `pipeline/data/raw/results_2023/PROV_02_202307_1.xlsx` and `PROV_03_202307_1.xlsx` directly with openpyxl.
  - Collect the distinct Congreso acronyms with ≥1 % of valid votes in any province or ≥1 seat, and the distinct Senado acronyms that won ≥1 seat (top-N per district).
  - Expect regional variants such as `PSC`, `PSIB-PSOE`, `PSdeG-PSOE`, `SUMAR - ECP`, `B.N.G.`, `U.P.N.`, `JxCAT - JUNTS`, `ASG` and `A.H.I.`.
- [ ] **Step 2: Look up colours.**
  - For each acronym, open the party's or coalition's Spanish Wikipedia article and read the infobox "Color político" (or "Color") hex.
  - Add an entry only when a hex is stated there. The `sourceUrl` is that article.
  - Skip anything not verifiable; those parties get the grey fallback on the web. Never guess and never use a 2026 successor's colour.
  - Report the skipped acronyms in the task notes.
- [ ] **Step 3: Write the failing tests.**
  - `test_party_colors_data.py`, in the style of `test_parties_data.py` (module fixture with `yaml.safe_load`):
    - every key is a non-empty string;
    - every `color` matches `^#[0-9a-f]{6}$`;
    - every `sourceUrl` starts with `https://es.wikipedia.org/wiki/`;
    - no entry has extra keys.
  - `test_party_colors.py`: `load_party_colors` returns lowercase hex by acronym, and raises `BuildError` on a missing `color` or a bad hex (use tmp files).
- [ ] **Step 4:** Run `uv run pytest tests/test_party_colors*.py`. The tests fail on the missing module.
- [ ] **Step 5:** Implement the loader. Then run `uv run pytest` and the black/isort checks.
- [ ] **Step 6:** Commit:
  ```bash
  git commit -m "feat(pipeline): add 2023 party colours sourced from Spanish Wikipedia" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- pipeline/data/party_colors.yaml pipeline/src/elecciones_pipeline/party_colors.py pipeline/tests/test_party_colors_data.py pipeline/tests/test_party_colors.py
  ```

---

### Task 4: Build and schema wiring, plus regenerated published data

model: sonnet (agent `implementer`; run in the main checkout for the raw files)

**Depends on:** T1, T2, T3.

**Files:**
- Create: `pipeline/src/elecciones_pipeline/results_2023/constituency_json.py`, `pipeline/tests/test_constituency_json.py`
- Modify: `pipeline/src/elecciones_pipeline/build.py`, `schemas/ballot.schema.json`, `pipeline/tests/test_build.py`, `web/public/data/**` (regenerated)

**Interfaces:**
```python
def constituency_results_json(result: ConstituencyResult2023 | None, colors: dict[str, str]) -> dict | None
```
- It returns exactly the shape in the "Data contract" section. Percentages use `round(x, 2)`. For Senado, `percentage` and `blankPercentage` are `None`.
- `build.py` changes:
  - `_Inputs` gains `party_colors: dict[str, str]`, loaded from `paths.data_dir / "party_colors.yaml"`.
  - `_load_results_2023` merges `loaded.constituencies` into the returned `Results2023`.
  - `_ballot` adds `"constituencyResults2023": constituency_results_json(inputs.results_2023.constituencies.get((constituency.chamber, constituency.id)), inputs.party_colors)`.
- Schema changes:
  - Add `constituencyResults2023` to `required` and `properties` as `oneOf [null, $ref #/$defs/constituencyResults2023]`.
  - The new `$defs` use `additionalProperties: false`.
  - Integers are ≥0, and `turnoutPercentage` is between 0 and 100.
  - `votes`, `percentage` and `blankPercentage` are integer/number or null.
  - `color` is null or a string matching `^#[0-9a-f]{6}$`.
  - `combinedDistrictName` is null or a non-empty string.

- [ ] **Step 1: Write the failing tests.**
  - `test_constituency_json.py`:
    - A hand-built Congreso result gives the exact dict, including `percentage` and `blankPercentage` over `valid_votes`, `turnoutPercentage`, and a known colour versus `None`.
    - A Senado result gives null percentages and null votes.
    - `None` input gives `None`.
  - `test_build.py`:
    - `test_build_fills_constituency_results_2023_when_source_present` (uses `install_results_2023`): for congreso 08, `validVotes` is 2667478, the party with votes 952347 has `percentage` 35.7 and `seats` 13, and its `color` equals the yaml value for that acronym, or None if absent (read the yaml in the test).
    - Extend `test_build_without_results_2023_leaves_null` so `constituencyResults2023` is also null.
- [ ] **Step 2:** Run `uv run pytest`. The new tests fail, and so does `test_committed_web_data_is_valid` once the schema field is required.
- [ ] **Step 3:** Implement the json module, the build wiring and the schema.
- [ ] **Step 4:** Regenerate the data with `uv run elecciones build`. All 114 files under `web/public/data/` are rewritten. Spot-check:
  - `congreso/28.json`: parties sum to 37 seats.
  - `senado/07-eivissa.json` and `senado/07-formentera.json`: `combinedDistrictName` is set and there is 1 seat.
  - `congreso/51.json` (Ceuta): 1 seat.
- [ ] **Step 5:** Run `uv run pytest` (all green, including `test_committed_web_data_is_valid`) and the black/isort checks.
- [ ] **Step 6:** Commit, with a body explaining that the schema field is required:
  ```bash
  git commit -m "feat(pipeline): publish per-constituency 2023 results with party colours" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- pipeline/src/elecciones_pipeline/build.py pipeline/src/elecciones_pipeline/results_2023/constituency_json.py pipeline/tests/test_constituency_json.py pipeline/tests/test_build.py schemas/ballot.schema.json web/public/data
  ```

---

### Task 5: Web contract types, fixtures and pure helpers

model: sonnet (agent `implementer`)

**Files:**
- Modify: `web/src/contract/types.ts`, `web/src/test/fixtures.ts`
- Create: `web/src/results2023/voteShareRows.ts`, `web/src/results2023/seatAllocation.ts`, `web/src/results2023/partyColor.ts`
- Test: `web/src/results2023/voteShareRows.test.ts`, `web/src/results2023/seatAllocation.test.ts`, `web/src/results2023/partyColor.test.ts`

**Interfaces:**
```ts
export interface PartyResult2023 { acronym: string; name: string; votes: number | null; percentage: number | null; seats: number; color: string | null }
export interface ConstituencyResults2023 { electorate: number; totalVotes: number; turnoutPercentage: number; validVotes: number; blankVotes: number; blankPercentage: number | null; combinedDistrictName: string | null; parties: PartyResult2023[] }
// ConstituencyBallot gains: constituencyResults2023: ConstituencyResults2023 | null

export const MINIMUM_SHARE_PERCENTAGE = 1;
export type VoteShareRow =
  | { kind: "party"; acronym: string; name: string; percentage: number; color: string | null }
  | { kind: "others"; percentage: number }
  | { kind: "blank"; percentage: number };
export function voteShareRows(results: ConstituencyResults2023): VoteShareRow[];

export function seatParties(results: ConstituencyResults2023): PartyResult2023[];
export function seatColors(parties: PartyResult2023[]): (string | null)[];
export function totalSeats(results: ConstituencyResults2023): number;

export const FALLBACK_PARTY_COLOR = "#8c877c";
export const PAPER_COLORS = { light: "#faf7f0", dark: "#16151a" } as const;
export const MINIMUM_NON_TEXT_CONTRAST = 3;
export function partyColor(color: string | null): string;
export function needsOutline(colorHex: string): boolean;
```
- `voteShareRows`:
  - Party rows are those with `percentage >= 1`, sorted by votes descending.
  - Then one `others` row, only if any party is under 1 %. Its percentage is `round(sum(votes) / validVotes * 100, 2)`.
  - Then a `blank` row with `blankPercentage`.
- `seatParties` returns the parties with seats > 0, using a stable sort by seats descending and then votes descending, where null votes keep the input order.
- `seatColors` expands those parties to one entry per seat.
- `needsOutline` is true when `contrastRatio` is below 3 against either `PAPER_COLORS` value.

**Fixtures:**
- `buildFixtureBallot` sets `constituencyResults2023: null`, so existing tests are unaffected.
- Add `fixtureCongresoResults2023`, using the fictional `PEA`, `PEB`, `CEC-D` and two sub-1 % parties `PEE` and `PEF`, with `turnoutPercentage: 70.41` and `totalVotes: 3712540`.
  - Use an 8-seat total, so it differs from the 32-seat ballot, for Review Focus 5.
  - Add a `fixtureCongresoLargeResults2023` with 12 seats for the hemicycle.
- Add `fixtureSenadoResults2023` (null votes and percentages) and `fixtureSenadoCombinedResults2023` (`combinedDistrictName: "Eivissa-Formentera"`, 1 seat).

- [ ] **Step 1: Write the failing tests.**
  - Grouping into "Others", with a known sum.
  - Order (parties, then others, then blank) and no `others` row when every party is at least 1 %.
  - Seat order and tie-break, and `seatColors` length equal to `totalSeats`.
  - `partyColor(null)` returns the fallback.
  - `needsOutline("#ffffff")` and `needsOutline("#000000")` are true. `needsOutline(FALLBACK_PARTY_COLOR)` is false.
  - `PAPER_COLORS` equals `--color-paper` in `@theme` and in `.dark` of `src/index.css`, read with `readFileSync` the same way as `tokens.test.ts`.
- [ ] **Step 2:** Run `yarn vitest run src/results2023`. The tests fail on the missing modules.
- [ ] **Step 3:** Implement, then run `yarn test` (all green, 278 plus new), `yarn build` (`tsc -b` catches every fixture that lacks the new field), `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit:
  ```bash
  git commit -m "feat(web): add 2023 constituency results types and pure helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- web/src/contract/types.ts web/src/test/fixtures.ts web/src/results2023
  ```

---

### Task 6: Hemicycle geometry

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/results2023/hemicycle.ts`
- Test: `web/src/results2023/hemicycle.test.ts`

**Interfaces:**
```ts
export const INNER_RADIUS_RATIO = 0.4;
export interface SeatPosition { x: number; y: number; row: number; angle: number }
export function hemicycleRowCount(seatCount: number): number;
export function hemicycleRowSeats(seatCount: number): number[];
export function hemicycleSeatPositions(seatCount: number): SeatPosition[];
export function hemicycleSeatRadius(positions: SeatPosition[]): number;
```
- Coordinates are unit-circle values, with x in [-1, 1], y in [0, 1] and y pointing up. The component flips y for SVG.
- `hemicycleSeatRadius` is `0.45 * min pairwise distance`. It is O(n²), which is fine for n ≤ 37. A single seat gets 0.45 × the row spacing fallback of 0.6.

- [ ] **Step 1: Write the failing tests** (`it.each`):
  - `hemicycleRowCount`: 1→1, 4→1, 5→1, 10→2, 12→2, 16→2, 32→3, 37→4.
  - `hemicycleRowSeats`: 10→[3,7], 32→[6,11,15], 37→[5,8,11,13], 3→[3]. Each list sums to n and is non-decreasing.
  - `hemicycleSeatPositions(n)`:
    - length n for n in 1..40;
    - angles non-increasing;
    - the first position has the minimum x;
    - every y ≥ 0 and every radius is in [0.4, 1];
    - n=1 gives a single seat at angle π/2 and radius 1.
  - `hemicycleSeatRadius`: 2 × radius is less than every pairwise distance for n=10 and n=37.
- [ ] **Step 2:** Run `yarn vitest run src/results2023/hemicycle.test.ts`. The tests fail.
- [ ] **Step 3:** Implement as small pure functions: `rowRadii`, `largestRemainderSeats`, `rowAngles`.
- [ ] **Step 4:** Run `yarn test`, `yarn format:check` and `yarn lint`.
- [ ] **Step 5:** Commit:
  ```bash
  git commit -m "feat(web): add pure hemicycle seat geometry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- web/src/results2023/hemicycle.ts web/src/results2023/hemicycle.test.ts
  ```

---

### Task 7: VoteShareChart

model: sonnet (agent `implementer`)

**Depends on:** T5.

**Files:**
- Create: `web/src/results2023/VoteShareChart.tsx`, `web/src/results2023/VoteShareChart.test.tsx`, `web/src/i18n/locales/es/results2023.json`, `web/src/i18n/locales/ca/results2023.json`

**Interfaces:**
```tsx
export function VoteShareChart(props: { results: ConstituencyResults2023 }): JSX.Element;
```
- Keys in ns `results2023`:

| Key | es | ca |
|---|---|---|
| `voteShare.label` | Porcentaje sobre votos válidos | Percentatge sobre vots vàlids |
| `voteShare.threshold` | barrera del 3 % | barrera del 3 % |
| `voteShare.others` | Otros | Altres |
| `voteShare.blank` | En blanco | En blanc |

- Markup:
  - `<ul aria-label={t("voteShare.label")}>`, where each row is an `<li>` in a 3-column grid: `grid-cols-[minmax(0,6rem)_1fr_auto]`.
  - Columns are the label (acronym, `break-words`, sr-only name), a track (`relative`), and the percentage (`tabular-nums`, `Intl.NumberFormat` with 1 fraction digit, plus " %").
  - The bar is `aria-hidden` with inline `width: (percentage / scale) * 100%` and `backgroundColor: partyColor(color)`. It gets the outline when `needsOutline` is true.
  - The `others` row uses `FALLBACK_PARTY_COLOR`. The `blank` row uses `bg-rule border border-rule-strong` and the label is `text-ink-muted`.
  - The 3 % line is an `aria-hidden` absolutely positioned dashed `border-l border-dashed border-ink-muted` element over the tracks column at `left: 3 / scale * 100%`. It carries a small `text-xs text-ink-muted` visible label `barrera del 3 %`, which is not duplicated per row.

- [ ] **Step 1: Write the failing tests** with `fixtureCongresoResults2023`:
  - the list items appear in order with `PEA` first, then "Otros", then "En blanco";
  - the percentage text is formatted `34,1 %`;
  - the threshold label `barrera del 3 %` is shown;
  - an inline style on the `PEA` bar contains the fixture colour, and a `null` colour falls back to `#8c877c`;
  - a colour below 3:1 gets the outline class;
  - after `i18next.changeLanguage("ca")` the row reads "Altres", and the test resets to "es" in `afterEach`.
- [ ] **Step 2:** Run the tests and confirm they fail.
- [ ] **Step 3:** Implement. Then run `yarn test` (including `localeParity`), `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit:
  ```bash
  git commit -m "feat(web): add 2023 vote-share bar chart" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- web/src/results2023/VoteShareChart.tsx web/src/results2023/VoteShareChart.test.tsx web/src/i18n/locales/es/results2023.json web/src/i18n/locales/ca/results2023.json
  ```

---

### Task 8: SeatChart (hemicycle or dots) and SeatLegend

model: sonnet (agent `implementer`)

**Depends on:** T5, T6. Rebase on T7 for ns `results2023`.

**Files:**
- Create: `web/src/results2023/SeatChart.tsx`, `web/src/results2023/SeatChart.test.tsx`, `web/src/results2023/SeatLegend.tsx`, `web/src/results2023/SeatLegend.test.tsx`
- Modify: `web/src/i18n/locales/{es,ca}/results2023.json` (append keys)

**Interfaces:**
```tsx
export const HEMICYCLE_MIN_SEATS = 10;
export function SeatChart(props: { chamber: Chamber; results: ConstituencyResults2023 }): JSX.Element;
export function SeatLegend(props: { parties: PartyResult2023[] }): JSX.Element;
```
- Keys:

| Key | es | ca |
|---|---|---|
| `seats.label` | Reparto de escaños | Repartiment d'escons |
| `seats.senadoNote` | En el Senado se vota a personas, no a listas: no hay porcentaje por partido | Al Senat es vota a persones, no a llistes: no hi ha percentatge per partit |

- Chart choice:
  - The hemicycle is used when `chamber === "congreso"` and `totalSeats(results) >= HEMICYCLE_MIN_SEATS`.
  - It is an `<svg viewBox="-1.1 -1.1 2.2 1.2" role="img" aria-label={legendText}>`, sized `w-full max-w-sm`. It draws one `<circle>` per position at (x, -y) with radius `hemicycleSeatRadius`, filled with `partyColor(seatColors[i])`. An outlined seat gets `stroke` set to `var(--color-ink)` with a thin stroke width.
  - Otherwise the chart is dots: an `aria-hidden` `<ul className="flex flex-wrap gap-1">` of `size-4 rounded-full` spans, plus an sr-only legend text.
- Legend:
  - `SeatLegend` renders the items `PP 16 · PSOE 10 …`, each with a `size-3` swatch (`aria-hidden`) followed by the text `"{acronym} {seats}"`, separated by ` · `.
  - It wraps at 375 px.
- `legendText` is the same string the legend shows.
- The Senado note is rendered under the legend for `chamber === "senado"` (`text-sm text-ink-muted`).
- Seat counts always come from `totalSeats(results)`, never from the ballot.

- [ ] **Step 1: Write the failing tests:**
  - `fixtureCongresoLargeResults2023` (12 seats) renders `role="img"` with 12 circles.
  - `fixtureCongresoResults2023` (8 seats) renders 8 dots and no svg.
  - Senado with ≥10 seats still renders dots. Build an inline 10-seat Senado result in the test.
  - The first circle (leftmost) has the largest party's colour.
  - The legend text equals `PEA 4 · CEC-D 2 · PEB 2` (the fixture order).
  - The Senado note is present only for Senado, and is checked in ca too.
- [ ] **Step 2:** Run the tests and confirm they fail.
- [ ] **Step 3:** Implement, then run `yarn test`, `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit:
  ```bash
  git commit -m "feat(web): add 2023 seat chart with hemicycle, dots and legend" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- web/src/results2023/SeatChart.tsx web/src/results2023/SeatChart.test.tsx web/src/results2023/SeatLegend.tsx web/src/results2023/SeatLegend.test.tsx web/src/i18n/locales/es/results2023.json web/src/i18n/locales/ca/results2023.json
  ```

---

### Task 9: Results2023Block and ConstituencyView wiring

model: sonnet (agent `implementer`)

**Depends on:** T5, T7, T8.

**Files:**
- Create: `web/src/results2023/Results2023Block.tsx`, `web/src/results2023/Results2023Block.test.tsx`
- Modify: `web/src/constituency/ConstituencyView.tsx`, `web/src/constituency/ConstituencyView.test.tsx`, `web/src/i18n/locales/{es,ca}/results2023.json`

**Interfaces:**
```tsx
export function Results2023Block(props: { ballot: ConstituencyBallot; constituencyName: string }): JSX.Element | null;
```
- Keys:

| Key | es | ca |
|---|---|---|
| `heading` | Resultados de 2023 en {{constituency}} | Resultats de 2023 a {{constituency}} |
| `turnout` | Participación: {{turnout}} | Participació: {{turnout}} |
| `votes` | {{votes}} votos | {{votes}} vots |
| `source` | Fuente: Ministerio del Interior | Font: Ministeri de l'Interior |
| `combinedDistrict` | En 2023 Eivissa y Formentera formaban una sola circunscripción al Senado; estos son sus resultados conjuntos. | El 2023 Eivissa i Formentera formaven una sola circumscripció al Senat; aquests en són els resultats conjunts. |

- Rendering:
  - Return `null` when `ballot.constituencyResults2023` is null.
  - Otherwise render a `<section aria-labelledby>` on the compact surface from Global Constraints, containing, in order:
    1. an `h2` with `font-display text-lg font-semibold`;
    2. the combined caption, if any;
    3. `VoteShareChart`, Congreso only;
    4. `SeatChart`;
    5. a `<p className="text-sm text-ink-muted">` with turnout · votes · `<ExternalLink href={SOURCE_URLS.interior}>`.
  - Turnout has 1 fraction digit and votes use `Intl.NumberFormat(i18n.language)`.
- `ConstituencyView` renders `<Results2023Block ballot={ballot} constituencyName={constituencyName} />` immediately before `<CandidacyList …>`.

- [ ] **Step 1: Write the failing tests:**
  - Block heading `Resultados de 2023 en Barcelona`.
  - Caption text `Participación: 70,4 % · 3.712.540 votos`.
  - The source link has the `SOURCE_URLS.interior` href and `rel` containing `noopener`, which shows ExternalLink is used.
  - Nothing renders for a null result.
  - The combined district: the heading uses `Eivissa-Formentera` and the caption is present.
  - Senado: no vote-share list.
  - ca heading `Resultats de 2023 a Barcelona`.
  - `ConstituencyView.test.tsx`: with `constituencyResults2023: fixtureCongresoResults2023`, the block heading precedes the candidacy list (`compareDocumentPosition`). The existing per-row `2023:` assertions are untouched.
  - `ExternalLink.test.tsx` stays green.
- [ ] **Step 2:** Run the tests and confirm they fail.
- [ ] **Step 3:** Implement, then run `yarn test`, `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit:
  ```bash
  git commit -m "feat(web): show 2023 constituency results above the candidacy list" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- web/src/results2023/Results2023Block.tsx web/src/results2023/Results2023Block.test.tsx web/src/constituency/ConstituencyView.tsx web/src/constituency/ConstituencyView.test.tsx web/src/i18n/locales/es/results2023.json web/src/i18n/locales/ca/results2023.json
  ```

---

### Task 10: Full verification and push

model: haiku (agent `chore`; main checkout)

- [ ] From `pipeline/`, run `uv run pytest`, `uv run black --check .` and `uv run isort --check-only .`. Report the counts; the 312 existing tests must still pass alongside the new ones.
- [ ] Run `uv run elecciones build`. Then run `git status --porcelain web/public/data`, which must be empty because Task 4 already committed the data. If it is not empty, report it and do not commit.
- [ ] From `web/`, run `yarn test` (the 278 existing tests still pass, plus the new ones), `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] Confirm `git status` shows no uncommitted tracked changes, then run `git push git@github.com:alhuelamo/elecciones-generales-2026.git main`.
- [ ] Report the test counts, any warnings and the pushed SHA. On any failure, report BLOCKED with the output and do not fix anything.

---

### Task 11: Browser verification (main session, not an agent)

model: none (main session, manual)

- [ ] Start the `web` preview (`yarn --cwd web dev --port 5173 --strictPort`).
- [ ] Check these pages at desktop width and at 375 px, in es and ca, and in light and dark:
  - Madrid Congreso: hemicycle with 37 seats, vote share and the 3 % line.
  - Barcelona Congreso and Senado.
  - Soria Congreso: dots.
  - Ceuta Congreso: 1 dot.
  - Eivissa and Formentera Senado: combined caption and 1 seat.
  - Teguise Senado.
- [ ] Checklist on every page:
  - The block sits above the candidacy list.
  - No horizontal scroll at 375 px.
  - Labels sit outside the bars and long acronyms (`ESCAÑOS EN BLANCO`, `JxCAT - JUNTS`) wrap without overflow.
  - Outlines are visible on low-contrast colours in both themes.
  - The source link opens in a new tab.
  - The per-row `2023: …` line is unchanged.
  - The rest of the page is still monochrome.

---

## Open questions

1. **Turnout and "votos" definition.** The plan uses Total votantes / Total censo including CERA, which is Interior's official final scrutiny (Madrid 69,66 %, Spain 66,59 %), and shows "votos" as Total votantes. The brief's example "70,4 %" matches Spain's CER-only figure (70,41 %). Switch to CER-only (Congreso columns 5 and 8)? Only the column constants and labels change.
2. **"Otros" and "En blanco" placement.** The plan puts them after all party rows instead of sorting them in by size. Is that acceptable?
3. **Senado party list.** The plan keeps only seat winners, so losing lists are not listed. The caption shows turnout and votes but not blank ballots. Is that acceptable?
4. **Acronym display.** Labels and the legend show the raw 2023 ballot acronyms (`SUMAR`, `VOX`, `B.N.G.`, `PSC`), not the brief's mixed-case `Sumar` and `Vox`. Keep them raw?
5. **Colour coverage.** Acronyms without a verifiable "Color político" on Spanish Wikipedia stay grey, which includes some regional Senado variants. Should a federation such as `PSIB-PSOE` inherit `PSOE`'s colour (citing the PSOE article), or stay grey?
