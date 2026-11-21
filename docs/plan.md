# Elecciones Generales 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Static GitHub Pages site where a voter finds their town and sees the Congreso and Senado candidacies for 29 Nov 2026, in Catalan and Spanish, live by Nov 24.

**Architecture:** A build-time Python pipeline parses BOE-A-2026-23103 (candidacies), the INE municipality xlsx, a vendored island mapping, curated YAML and (later) 2023 results into static JSON committed under `web/public/data/`. A Vite/React SPA with hash routing loads `municipalities.json` eagerly and per-constituency ballots lazily. JSON Schemas in `schemas/` are the contract both sides test against, so the frontend builds on fixtures while the pipeline is written.

**Tech Stack:** Python 3.12, uv, lxml, openpyxl, PyYAML, httpx, jsonschema, pytest, black, isort · Node 24, yarn 4 (corepack), Vite, React 19, TypeScript, Tailwind v4, Headless UI, Fuse.js, i18next/react-i18next, Vitest, Testing Library, jsdom · GitHub Actions + Pages.

**Spec:** `docs/spec.md`

## Global Constraints

- Election date 29 Nov 2026. Candidacies: BOE-A-2026-23103, XML `https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103`. Convocation/seats: Real Decreto 806/2026, BOE-A-2026-20742.
- INE source: `https://www.ine.es/daco/daco42/codmun/26codmun.xlsx`, sheet per province `01`…`52`, headers row 3 `CPRO|CMUN|DC|NOMBRE`, data from row 4.
- Municipality code = 5 digits (CPRO 2 + CMUN 3, zero-padded, no DC).
- Congreso seats sum 350; Ceuta 1, Melilla 1. Senado 208 seats in 59 constituencies; `maxMarks = max(seats - 1, 1)`.
- Senado island ids: `07-mallorca`, `07-menorca`, `07-eivissa-formentera`, `35-gran-canaria`, `35-fuerteventura`, `35-lanzarote`, `38-tenerife`, `38-la-palma`, `38-la-gomera`, `38-el-hierro`.
- Routes: `#/{lang}`, `#/{lang}/about`, `#/{lang}/{code}/{congreso|senado}[/{partySlug}]`; `lang ∈ {es, ca}`.
- localStorage keys: `eg26.lang`, `eg26.theme` (`system|light|dark`).
- JSON shapes exactly as `docs/spec.md` §3; `dataset ∈ {"fixture","boe-2026"}`.
- yarn only (never npm); uv only for Python. black + isort (profile black). Prettier defaults for web.
- No comments/TODOs in code, descriptive names, small functions, tests first.
- No free-text party descriptions. No PWA/service worker.
- All dependencies are added in Task 1 only; later tasks never edit `web/package.json`, `web/yarn.lock`, `pipeline/pyproject.toml`, `pipeline/uv.lock`. If a task truly needs a new dependency, stop and report.
- Pipeline network User-Agent: `elecciones-generales-2026-pipeline`.

## Review Focus

1. INE name forms (`Hospitalet de Llobregat, L'`, `Coruña, A`, `Alicante/Alacant`, `Donostia/San Sebastián`) must be findable by natural typing (`lhospitalet`, `a coruna`, `alacant`, `san sebastian`) → Task 7 (variants) and Task 13 (search) tests.
2. Exact name must outrank containing names (`madrid` → Madrid before Las Rozas de Madrid) and homonyms (two `Mieres`) must both appear with province shown → Task 13 tests.
3. Every Baleares/Canarias municipality, incl. Formentera and Teguise (La Graciosa), maps to its island Senado constituency, never the province → Task 6 tests; build raises otherwise (Task 11).
4. Parser silently dropping candidacies or candidates (No proclamada entries, nested-paren acronyms, Senado suplente lines, island subheadings) → Task 8 tests + Task 11 count warnings (Congreso `len(candidates) != seats`).
5. Stale deep links after the Nov 28 re-scrape (unknown municipality code or party slug) must land on the nearest valid view with a notice, and stale fixture/old ballot files must not survive a rebuild → Task 19 and Task 11 tests.

---

## Execution waves and file ownership

Parallel tasks within a wave touch disjoint files. Run each parallel task in its own git worktree/branch; merge in task-number order.

| Wave | Tasks (parallel) | Owns |
|---|---|---|
| 0 | T1 | everything it creates |
| 1 | T2 · T3 · T5 | T2: `.github/**` · T3: `schemas/**`, `web/src/contract/**`, `web/src/test/fixtures.ts`, `web/public/data/**`, `pipeline/src/elecciones_pipeline/contract.py`, `pipeline/tests/test_contract.py` · T5: `pipeline/src/elecciones_pipeline/normalize.py`, `pipeline/tests/test_normalize.py` |
| 2 | T4 · T6 · T7 · T8 · T9 · T10 | T4: `web/src/config.ts`, `web/src/data/**`, `web/src/i18n/**` (core + `common` ns), `web/src/test/setup.ts` · T6: `constituencies.py`, `pipeline/data/{seats_2026,provinces,island_constituencies}.yaml`, `pipeline/data/vendor/**` · T7: `municipalities.py` · T8: `candidacies/**`, `tests/fixtures/boe/**` · T9: `fetch.py`, `pipeline/data/sources.yaml` · T10: `parties.py`, `pipeline/data/{parties,logos}.yaml` |
| 3 | T11 · T12 · T13 · T14 · T15 · T18 | T11: `build.py`, `cli.py` · T12: `web/src/routing/**` · T13: `web/src/search/**`, ns `search` · T14: `web/src/theme/**`, ns `theme`, `web/index.html` · T15: `web/src/candidacies/**`, ns `candidacies` · T18: `web/src/about/**`, ns `about` |
| 4 | T16 · T17 | T16: `web/src/constituency/**`, ns `constituency` · T17: `web/src/party/**`, ns `party` |
| 5 | T19 | `web/src/App.tsx`, `web/src/main.tsx`, `web/src/shell/**`, ns `shell`, `web/index.html` (meta only), `web/public/og-image.png` |
| 6 | T20 **MVP live (Nov 24)** | `web/public/data/**` (real data) |
| 7 | T21 · T22 · T23 | T21: `pipeline/data/parties.yaml` · T22: `pipeline/data/logos.yaml`, `web/public/logos/**` · T23: `corrections.py`, `pipeline/data/corrections.yaml`, `build.py` |
| 8 | T24 → T25 | T24: `results_2023/**`, `build.py` · T25: `pipeline/data/lineage_2023.yaml` |
| 9 | T26 freeze + re-scrape (Nov 28) | `web/public/data/**` |

"ns X" = `web/src/i18n/locales/es/X.json` + `web/src/i18n/locales/ca/X.json`. Paths below without a prefix are relative to `pipeline/src/elecciones_pipeline/` (Python) or `web/src/` (TS) as the context makes obvious; tests live in `pipeline/tests/` or next to the TS source as `*.test.ts(x)`.

---

### Task 1: Repository scaffold

model: haiku (agent `chore`)

**Files:**
- Create: `.gitignore`, `README.md`, `LICENSE` (MIT), `web/**` (Vite react-ts template), `web/.yarnrc.yml`, `web/vite.config.ts`, `web/src/index.css`, `web/src/test/setup.ts`, `pipeline/pyproject.toml`, `pipeline/src/elecciones_pipeline/__init__.py`, `pipeline/src/elecciones_pipeline/cli.py`, `pipeline/tests/test_package.py`, `pipeline/data/raw/.gitkeep`

**Interfaces:**
- Produces: `yarn test` (vitest run, jsdom, setup `./src/test/setup.ts`), `yarn build` (`tsc -b && vite build`), `uv run pytest`, console script `elecciones = "elecciones_pipeline.cli:main"`; Vite `base: '/elecciones-generales-2026/'`.

- [ ] **Step 1: Init repo** — `git init -b main` in `/Users/alberto/Code/elecciones-generales-2026`; `.gitignore`: `node_modules/`, `dist/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, `pipeline/data/raw/*`, `!pipeline/data/raw/.gitkeep`, `.DS_Store`, `.yarn/*` (keep `.yarn/releases`), `*.tsbuildinfo`.
- [ ] **Step 2: Web scaffold** — `corepack enable`; `yarn create vite web --template react-ts`; `cd web && corepack use yarn@stable`; `.yarnrc.yml`: `nodeLinker: node-modules`.
- [ ] **Step 3: Web deps (all of them, now)** — `yarn add @headlessui/react fuse.js i18next react-i18next`; `yarn add -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event prettier`. Scripts: `"test": "vitest run"`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.
- [ ] **Step 4: Vite config** — plugins `react()`, `tailwindcss()`; `base: '/elecciones-generales-2026/'`; `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }`. `src/index.css`: `@import "tailwindcss";` + `@custom-variant dark (&:where(.dark, .dark *));`. `src/test/setup.ts`: `import '@testing-library/jest-dom/vitest';`. Replace template `App.tsx` with a component rendering `<h1>Eleccions generals 2026</h1>`; delete template assets/CSS.
- [ ] **Step 5: Pipeline scaffold** — `uv init --package --name elecciones-pipeline --python 3.12 pipeline` (module `elecciones_pipeline`, src layout); `uv add lxml openpyxl pyyaml httpx jsonschema`; `uv add --dev pytest black isort`. pyproject: `[tool.isort] profile = "black"`, `[tool.pytest.ini_options] testpaths = ["tests"]`, `[project.scripts] elecciones = "elecciones_pipeline.cli:main"`. `cli.py`: `def main() -> None` that builds an `argparse.ArgumentParser(prog="elecciones")` and parses args. `tests/test_package.py::test_package_is_importable` imports `elecciones_pipeline.cli` and asserts `callable(main)`.
- [ ] **Step 6: Verify** — `cd web && yarn build && yarn test --passWithNoTests` → both exit 0; `cd pipeline && uv run pytest && uv run black --check . && uv run isort --check .` → PASS.
- [ ] **Step 7: README** — sections: Requirements (Node 24 + corepack, uv), `web/` commands, `pipeline/` commands (`uv run elecciones fetch`, `uv run elecciones build`), data sources list from spec §2.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "chore: scaffold web and pipeline projects"`

---

### Task 2: GitHub repo, CI and Pages deploy

model: haiku (agent `chore`)

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Task 1 scripts.
- Produces: every push to `main` deploys `web/dist` to Pages.

- [ ] **Step 1: `ci.yml`** — on `pull_request` and `push`; job `pipeline`: `astral-sh/setup-uv`, `cd pipeline && uv run black --check . && uv run isort --check . && uv run pytest`; job `web`: `actions/setup-node` (node 24), `corepack enable`, `cd web && yarn install --immutable && yarn format:check && yarn test && yarn build`.
- [ ] **Step 2: `deploy.yml`** — on `push` to `main` + `workflow_dispatch`; permissions `pages: write`, `id-token: write`, `contents: read`; concurrency group `pages`; build as in ci web job, `actions/upload-pages-artifact` with `path: web/dist`, then `actions/deploy-pages`.
- [ ] **Step 3: STOP — ask the user** to confirm GitHub owner and public repo creation. Then `gh repo create <owner>/elecciones-generales-2026 --public --source . --push` and `gh api -X POST repos/<owner>/elecciones-generales-2026/pages -f build_type=workflow`.
- [ ] **Step 4: Verify** — `gh run watch` on the deploy run → success; `curl -sI https://<owner>.github.io/elecciones-generales-2026/` → `200`.
- [ ] **Step 5: Commit** — `git add .github && git commit -m "ci: add test and Pages deploy workflows" && git push`

---

### Task 3: Data contract (schemas, TS types, fixtures, contract test)

model: sonnet (agent `implementer`)

**Files:**
- Create: `schemas/municipalities.schema.json`, `schemas/ballot.schema.json`, `schemas/parties.schema.json`, `web/src/contract/types.ts`, `web/src/test/fixtures.ts`, `web/public/data/municipalities.json`, `web/public/data/parties.json`, `web/public/data/congreso/{08,07,51}.json`, `web/public/data/senado/{08,07-mallorca,07-eivissa-formentera,51}.json`, `pipeline/src/elecciones_pipeline/contract.py`
- Test: `pipeline/tests/test_contract.py`

**Interfaces:**
- Produces (TS, `web/src/contract/types.ts`):
```ts
export type Language = 'es' | 'ca';
export type Chamber = 'congreso' | 'senado';
export type LocalizedText = Record<Language, string>;
export interface ConstituencySummary { id: string; name: LocalizedText; seats: number; maxMarks: number | null }
export interface Municipality { code: string; name: string; aliases: string[]; congreso: string; senado: string }
export interface MunicipalityIndex { dataset: 'fixture' | 'boe-2026'; generatedAt: string; constituencies: Record<Chamber, ConstituencySummary[]>; municipalities: Municipality[] }
export interface Candidate { position: number; name: string; substituteNames: string[] }
export interface Results2023 { votes: number; percentage: number | null; seats: number; asAcronyms: string[] }
export interface Candidacy { slug: string; boeOrder: number; denomination: string; acronym: string; partyKey: string | null; isCoalition: boolean; candidates: Candidate[]; substitutes: Candidate[]; results2023: Results2023 | null }
export interface SourceLink { label: string; url: string }
export interface ConstituencyBallot { chamber: Chamber; constituencyId: string; seats: number; maxMarks: number | null; sources: SourceLink[]; candidacies: Candidacy[] }
export interface PartyLogo { path: string; sourceUrl: string; license: string; author: string }
export interface PartyProfile { key: string; name: string; logo: PartyLogo | null; website: string | null; programmeUrl: string | null; leader: string | null; founded: number | null; seats2023: { congreso: number; senado: number } | null; wikipedia: { es: string | null; ca: string | null } }
export interface PartyCatalog { parties: Record<string, PartyProfile> }
```
- Produces (TS, `web/src/test/fixtures.ts`): `fixtureIndex: MunicipalityIndex` (dataset `fixture`; municipalities: Barcelona 08019, L'Hospitalet de Llobregat 08101 alias `Hospitalet de Llobregat, L'`, Palma 07040, Formentera 07024, A Coruña 15030 alias `Coruña, A`, Alicante/Alacant 03014 aliases `Alicante`,`Alacant`, Donostia/San Sebastián 20069, Madrid 28079, Las Rozas de Madrid 28127, Mieres 33037, Mieres 17105, Ceuta 51001; constituency summaries for all referenced ids with real seat counts for Senado and `maxMarks`), `fixtureCongresoBarcelona: ConstituencyBallot` (seats 32, 3 candidacies: one with `results2023`, one with `results2023: null`, one coalition; full titulares + 2 suplentes each), `fixtureSenadoMallorca: ConstituencyBallot` (seats 3, maxMarks 2, candidates with `substituteNames`), `fixtureCatalog: PartyCatalog` (one profile with every field set, one with only key+name). All names obviously fictional (`Candidata Ejemplo 1`, `PARTIDO EJEMPLO A (PEA)`).
- Produces (Python, `contract.py`): `def validate_data_dir(data_dir: Path) -> list[str]` — returns human-readable error strings; empty = valid.
- `web/public/data/**` mirrors a subset of the TS fixtures (Barcelona, L'Hospitalet, Palma, Formentera, Ceuta + their 7 ballots), `dataset: "fixture"`.

- [ ] **Step 1: Write failing tests** in `pipeline/tests/test_contract.py`:
```python
WEB_DATA = Path(__file__).parents[2] / "web" / "public" / "data"

def test_committed_web_data_is_valid():
    assert validate_data_dir(WEB_DATA) == []

def test_schema_violation_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    index = json.loads((tmp_path / "municipalities.json").read_text())
    del index["municipalities"][0]["senado"]
    (tmp_path / "municipalities.json").write_text(json.dumps(index))
    assert any("senado" in error for error in validate_data_dir(tmp_path))

def test_missing_ballot_file_is_reported(tmp_path):
    copy_tree(WEB_DATA, tmp_path)
    (tmp_path / "senado" / "07-mallorca.json").unlink()
    assert validate_data_dir(tmp_path) == ["missing ballot senado/07-mallorca.json"]

def test_duplicate_slug_in_ballot_is_reported(tmp_path): ...
    # duplicate candidacies[1].slug = candidacies[0].slug in congreso/08.json → error contains "duplicate slug"
```
- [ ] **Step 2: Run** `cd pipeline && uv run pytest tests/test_contract.py -v` → FAIL (`ModuleNotFoundError: elecciones_pipeline.contract`).
- [ ] **Step 3: Write schemas** (draft 2020-12, `additionalProperties: false`, patterns: municipality code `^\d{5}$`, congreso id `^\d{2}$`, senado id `^\d{2}(-[a-z-]+)?$`, slug `^[a-z0-9]+(-[a-z0-9]+)*$`).
- [ ] **Step 4: Implement `validate_data_dir`** — jsonschema `Draft202012Validator` per file (`municipalities.json`, `parties.json`, every `congreso/*.json`, `senado/*.json`) + referential integrity: every municipality's `congreso`/`senado` id exists in `constituencies` and as a ballot file; ballot `seats`/`maxMarks` equal the summary's; slugs unique per ballot.
- [ ] **Step 5: Write `types.ts`, `fixtures.ts`, `web/public/data/**`.**
- [ ] **Step 6: Verify** — `uv run pytest tests/test_contract.py -v` → PASS; `cd web && yarn tsc -b` → exit 0.
- [ ] **Step 7: Commit** — `git commit -m "feat: define data contract with schemas, types and fixtures"`

---

### Task 4: Frontend foundation (config, loaders, i18n core)

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/config.ts`, `web/src/data/loaders.ts`, `web/src/i18n/index.ts`, `web/src/i18n/detectLanguage.ts`, `web/src/i18n/locales/{es,ca}/common.json`
- Modify: `web/src/test/setup.ts`
- Test: `web/src/data/loaders.test.ts`, `web/src/i18n/detectLanguage.test.ts`, `web/src/i18n/localeParity.test.ts`

**Interfaces:**
- Consumes: Task 3 types.
- Produces:
```ts
// config.ts
export const REPO_URL: string;            // import.meta.env.VITE_REPO_URL ?? 'https://github.com/<owner>/elecciones-generales-2026'
export const PARTIES_EDIT_URL: string;    // `${REPO_URL}/edit/main/pipeline/data/parties.yaml`
export const ISSUES_URL: string;          // `${REPO_URL}/issues/new`
export const STORAGE_KEYS: { language: 'eg26.lang'; theme: 'eg26.theme' };
export const SOURCE_URLS: { boeCandidacies: string; boeConvocation: string; ine: string; interior: string; commons: string; partiesYaml: string };
// data/loaders.ts  (memoized per path, fetch(`${import.meta.env.BASE_URL}data/...`), throws DataLoadError on !ok)
export class DataLoadError extends Error {}
export function loadMunicipalityIndex(): Promise<MunicipalityIndex>;
export function loadBallot(chamber: Chamber, constituencyId: string): Promise<ConstituencyBallot>;
export function loadPartyCatalog(): Promise<PartyCatalog>;
// i18n
export function detectLanguage(stored: string | null, navigatorLanguages: readonly string[]): Language;
export function initI18n(language: Language): typeof i18next;  // resources from import.meta.glob('./locales/*/*.json', { eager: true }), ns = file basename, defaultNS 'common', fallbackLng 'es'
```
- `common` keys: `appTitle`, `chamber.congreso`, `chamber.senado`, `language.es`, `language.ca`, `loading`, `loadError`.
- Every later UI task adds its own namespace file pair; nothing else in `i18n/` changes.

- [ ] **Step 1: Failing tests**
```ts
// detectLanguage.test.ts
it.each([
  [null, ['ca-ES'], 'ca'], [null, ['ca-ES-valencia'], 'ca'], [null, ['es-ES'], 'es'],
  [null, ['en-GB', 'ca'], 'ca'], [null, ['gl-ES'], 'es'], ['ca', ['es-ES'], 'ca'], ['xx', ['ca'], 'ca'],
])('stored %s + navigator %j → %s', (stored, languages, expected) =>
  expect(detectLanguage(stored, languages)).toBe(expected));
// localeParity.test.ts — every es/*.json has a ca twin with identical recursive key set, and no empty strings
// loaders.test.ts — stub fetch: loadBallot('senado','07-mallorca') requests `${BASE_URL}data/senado/07-mallorca.json`;
//   second call reuses the same promise (fetch called once); non-ok response rejects with DataLoadError
```
- [ ] **Step 2: Run** `cd web && yarn vitest run src/i18n src/data` → FAIL (modules missing).
- [ ] **Step 3: Implement** the interfaces above; `setup.ts` additionally calls `initI18n('es')`.
- [ ] **Step 4: Run** same command → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add data loaders, config and i18n core"`

---

### Task 5: Text normalization

model: sonnet (agent `implementer`)

**Files:**
- Create: `pipeline/src/elecciones_pipeline/normalize.py`
- Test: `pipeline/tests/test_normalize.py`

**Interfaces:**
- Produces: `def normalize_text(text: str) -> str` (NFKD, strip combining marks, casefold, `·` removed, `'’.-/,()` → space, collapse whitespace, strip); `def slugify(text: str) -> str` (same diacritic/case folding, drop `.` `'` `’` `·` `+`, every other non-alphanumeric run → `-`, trim `-`). `slugify` is both the URL slug and the acronym matching key.

- [ ] **Step 1: Failing tests**
```python
@pytest.mark.parametrize("raw, expected", [
    ("Hospitalet de Llobregat, L'", "hospitalet de llobregat l"),
    ("ARABA/ÁLAVA", "araba alava"), ("  València/Valencia ", "valencia valencia"),
    ("Sant Llorenç d’Hortons", "sant llorenc d hortons"), ("Castellbell i el Vilar", "castellbell i el vilar"),
    ("Col·legi", "collegi"),
])
def test_normalize_text(raw, expected): assert normalize_text(raw) == expected

@pytest.mark.parametrize("raw, expected", [
    ("PSOE", "psoe"), ("PSC-PSOE", "psc-psoe"), ("B.N.G.", "bng"), ("EH Bildu", "eh-bildu"),
    ("PSE-EE (PSOE)", "pse-ee-psoe"), ("C's", "cs"), ("Más Madrid", "mas-madrid"),
    ("CC-MPC", "cc-mpc"), ("+MPC", "mpc"), ("JxCAT-JUNTS", "jxcat-junts"),
])
def test_slugify(raw, expected): assert slugify(raw) == expected
```
- [ ] **Step 2: Run** `uv run pytest tests/test_normalize.py -v` → FAIL (ImportError).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add text normalization and slugify"`

---

### Task 6: Constituencies, seats and island mapping

model: sonnet (agent `implementer`)

**Files:**
- Create: `constituencies.py`, `pipeline/data/seats_2026.yaml`, `pipeline/data/provinces.yaml`, `pipeline/data/island_constituencies.yaml`, `pipeline/data/vendor/municipios_islas.csv`, `pipeline/data/vendor/README.md` (source URL, commit hash, license)
- Test: `pipeline/tests/test_constituencies.py`

**Interfaces:**
- Consumes: `normalize_text` (Task 5).
- Produces:
```python
@dataclass(frozen=True)
class Constituency:
    chamber: Literal["congreso", "senado"]; id: str; name_es: str; name_ca: str; seats: int; max_marks: int | None

class UnmappedIslandMunicipality(Exception): ...
class UnknownProvinceName(Exception): ...
class UnknownIslandHeading(Exception): ...

def senado_max_marks(seats: int) -> int
def load_constituencies(data_dir: Path) -> "ConstituencyRegistry"

class ConstituencyRegistry:
    congreso: list[Constituency]   # 52, ordered by id
    senado: list[Constituency]     # 59, ordered by id
    def congreso_id_for(self, municipality_code: str) -> str
    def senado_id_for(self, municipality_code: str) -> str
    def province_code_for_name(self, name: str) -> str
    def senado_id_for_island_heading(self, province_code: str, heading: str) -> str
    def get(self, chamber: str, constituency_id: str) -> Constituency
```
- Data shapes: `seats_2026.yaml` `{"08": 32, …}` transcribed from the RD 806/2026 annex (BOE-A-2026-20742) — do not copy 2023 values; `provinces.yaml` `{"07": {es: "Illes Balears", ca: "Illes Balears", boeNames: ["ILLES BALEARS", "BALEARS"]}, …}` (52 entries; ca names: Alacant, Castelló, València, Saragossa, Osca, Terol, Múrcia, Conca, Lleida, Girona, …; boeNames from the actual `JUNTA ELECTORAL DE …` headings in BOE-A-2026-23103 and INE sheet names); `island_constituencies.yaml` `{"07-mallorca": {es, ca, seats: 3, islaIds: [...], headingNames: [...]}, …}` — `islaIds` from the vendored CSV, `headingNames` from the BOE island subheadings.
- Senado seats: island constituencies per yaml; Ceuta `51`/Melilla `52` = 2; other provinces = 4. Provinces `07`, `35`, `38` have no province-level Senado constituency.

- [ ] **Step 1: Vendor CSV** — download `municipios_islas.csv` from codeforspain/ds-organizacion-administrativa into `pipeline/data/vendor/`; record URL, commit and license in the vendor README.
- [ ] **Step 2: Failing tests** (`registry` fixture = `load_constituencies(DATA_DIR)`; `code_of(name)` test helper reads the vendored CSV by `nombre` and returns `provincia_id`+`cmun`):
```python
def test_congreso_seats_sum_to_350(registry): assert sum(c.seats for c in registry.congreso) == 350
def test_ceuta_and_melilla_elect_one_deputy(registry): assert [registry.get("congreso", p).seats for p in ("51","52")] == [1, 1]
def test_senado_has_208_seats_in_59_constituencies(registry):
    assert (len(registry.senado), sum(c.seats for c in registry.senado)) == (59, 208)
@pytest.mark.parametrize("seats, marks", [(4, 3), (3, 2), (2, 1), (1, 1)])
def test_senado_max_marks(seats, marks): assert senado_max_marks(seats) == marks
def test_mallorca_max_marks_is_two(registry): assert registry.get("senado", "07-mallorca").max_marks == 2
@pytest.mark.parametrize("name, island", [("Palma","07-mallorca"), ("Formentera","07-eivissa-formentera"),
    ("Eivissa","07-eivissa-formentera"), ("Ciutadella de Menorca","07-menorca"), ("Teguise","35-lanzarote"),
    ("Valverde","38-el-hierro"), ("San Sebastián de la Gomera","38-la-gomera")])
def test_island_municipalities(registry, name, island): assert registry.senado_id_for(code_of(name)) == island
def test_every_island_municipality_is_mapped(registry):
    counts = Counter(registry.senado_id_for(code)[:2] for code in all_vendor_codes())
    assert counts == {"07": 67, "35": 34, "38": 54}
def test_mainland_municipality_uses_province(registry):
    assert (registry.congreso_id_for("08019"), registry.senado_id_for("08019")) == ("08", "08")
def test_unmapped_island_municipality_raises(registry):
    with pytest.raises(UnmappedIslandMunicipality): registry.senado_id_for("07999")
@pytest.mark.parametrize("name, code", [("ARABA/ÁLAVA","01"), ("Illes Balears","07"), ("VALÈNCIA/VALENCIA","46"),
    ("A CORUÑA","15"), ("Bizkaia","48"), ("SANTA CRUZ DE TENERIFE","38"), ("CEUTA","51")])
def test_province_code_for_name(registry, name, code): assert registry.province_code_for_name(name) == code
def test_unknown_island_heading_raises(registry): ...
```
- [ ] **Step 3: Run** `uv run pytest tests/test_constituencies.py -v` → FAIL (ImportError).
- [ ] **Step 4: Write the three YAML files and implement `constituencies.py`.** Name matching via `normalize_text` equality against `boeNames` + `es` + `ca`; island heading matching via `normalize_text(heading)` containing a normalized `headingNames` entry, restricted to that province.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat: add constituency registry with 2026 seats and island mapping"`

---

### Task 7: INE municipality parser and name variants

model: sonnet (agent `implementer`)

**Files:**
- Create: `municipalities.py`
- Test: `pipeline/tests/test_municipalities.py`

**Interfaces:**
- Produces:
```python
@dataclass(frozen=True)
class IneMunicipality: code: str; official_name: str
def read_ine_municipalities(xlsx_path: Path) -> list[IneMunicipality]   # sorted by code
def display_name(official_name: str) -> str
def search_aliases(official_name: str) -> list[str]
```
- Postposed articles moved front, per slash-part, case-insensitive: `El La Los Las L' Els Les Es Sa Ses So Lo O A Os As`. `L'` joins without space.

- [ ] **Step 1: Failing tests** (`ine_xlsx` fixture builds a tmp workbook with openpyxl: sheets `07` and `08`, title rows 1–2, headers row 3, rows from row 4; one sheet stores CPRO/CMUN as ints `7`/`40`, the other as strings `"08"`/`"019"`):
```python
def test_reads_zero_padded_codes_from_every_sheet(ine_xlsx):
    assert [m.code for m in read_ine_municipalities(ine_xlsx)] == ["07040", "08019", "08101"]
@pytest.mark.parametrize("official, shown", [
    ("Hospitalet de Llobregat, L'", "L'Hospitalet de Llobregat"), ("Coruña, A", "A Coruña"),
    ("Rozas de Madrid, Las", "Las Rozas de Madrid"), ("Salines, Ses", "Ses Salines"),
    ("Alicante/Alacant", "Alicante/Alacant"), ("Barcelona", "Barcelona"),
    ("Eliana, l'", "L'Eliana"), ("Palmas de Gran Canaria, Las", "Las Palmas de Gran Canaria")])
def test_display_name(official, shown): assert display_name(official) == shown
@pytest.mark.parametrize("official, aliases", [
    ("Alicante/Alacant", ["Alicante", "Alacant"]), ("Donostia/San Sebastián", ["Donostia", "San Sebastián"]),
    ("Coruña, A", ["Coruña, A"]), ("Barcelona", [])])
def test_search_aliases(official, aliases): assert search_aliases(official) == aliases
def test_real_ine_file_has_all_provinces():  # skipif raw/26codmun.xlsx missing
    municipalities = read_ine_municipalities(RAW / "26codmun.xlsx")
    assert len({m.code[:2] for m in municipalities}) == 52 and len(municipalities) > 8100
```
- [ ] **Step 2: Run** `uv run pytest tests/test_municipalities.py -v` → FAIL.
- [ ] **Step 3: Implement** with `openpyxl.load_workbook(read_only=True, data_only=True)`; skip rows with empty CPRO.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: parse INE municipalities with display names and aliases"`

---

### Task 8: BOE candidacy parser

model: sonnet (agent `implementer`)

**Files:**
- Create: `candidacies/__init__.py`, `candidacies/source.py`, `candidacies/boe_xml.py`, `candidacies/boe_html.py`, `candidacies/grammar.py`, `pipeline/tests/fixtures/boe/BOE-A-2026-23103-excerpt.xml`, `pipeline/tests/fixtures/boe/BOE-A-2026-23103-excerpt.html`
- Test: `pipeline/tests/test_candidacy_sources.py`, `pipeline/tests/test_candidacy_grammar.py`

**Interfaces:**
- Produces:
```python
# source.py
@dataclass(frozen=True)
class SourceParagraph: css_class: str; text: str
@dataclass(frozen=True)
class SourceDocument: boe_id: str; url: str; paragraphs: tuple[SourceParagraph, ...]
class CandidacySource(Protocol):
    def load(self) -> SourceDocument: ...
# boe_xml.py / boe_html.py
class BoeXmlSource:  def __init__(self, path: Path, boe_id: str) -> None
class BoeHtmlSource: def __init__(self, path: Path, boe_id: str) -> None
# grammar.py
@dataclass(frozen=True)
class CandidacyHeader: boe_order: int; denomination: str; acronym: str; is_coalition: bool
@dataclass(frozen=True)
class ParsedCandidate: position: int; name: str; substitute_names: tuple[str, ...]
@dataclass(frozen=True)
class ParsedCandidacy:
    province_heading: str; chamber: Literal["congreso", "senado"]; island_heading: str | None
    header: CandidacyHeader; candidates: tuple[ParsedCandidate, ...]; substitutes: tuple[ParsedCandidate, ...]
def parse_candidacy_header(text: str) -> CandidacyHeader | None
def parse_candidacies(document: SourceDocument) -> list[ParsedCandidacy]
```
- `url` = `https://www.boe.es/diario_boe/txt.php?id={boe_id}` (human-readable link used in ballot `sources`).
- Header acronym = content of the last top-level balanced parenthesised group at the end of the line (nested parens kept). Header requires the denomination part to be upper-case (candidate names are mixed case) — confirm against fixture CSS classes and prefer the class if it is distinctive.
- `is_coalition` = normalized denomination starts with `coalicion` or contains ` coalicion `.

- [ ] **Step 1: Capture fixture** — `curl -A elecciones-generales-2026-pipeline -o pipeline/data/raw/BOE-A-2026-23103.xml 'https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103'`; cut a well-formed excerpt keeping the XML envelope with: all of Barcelona (Congreso + Senado), all of Illes Balears Senado (three island subheadings), Ceuta, and one `No proclamada` entry (wherever it occurs). Save the same excerpt rendered as BOE HTML (`txt.php`) for the HTML adapter. Record in each fixture's first test the expected counts read by hand from the excerpt.
- [ ] **Step 2: Failing tests**
```python
# test_candidacy_grammar.py
def test_header_simple():
    assert parse_candidacy_header("1. PARTIDO SOCIALISTA OBRERO ESPAÑOL (PSOE)") == CandidacyHeader(1, "PARTIDO SOCIALISTA OBRERO ESPAÑOL", "PSOE", False)
def test_header_nested_acronym():
    assert parse_candidacy_header("4. PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSE-EE (PSOE))").acronym == "PSE-EE (PSOE)"
def test_header_coalition():
    assert parse_candidacy_header("7. COALICIÓN CANARIA-MUNICIPALISTAS PRIMERO CANARIAS (CC-MPC)").is_coalition
def test_candidate_line_is_not_header():
    assert parse_candidacy_header("1. Candidata Ejemplo Pérez") is None
def test_barcelona_congreso_in_boe_order(excerpt):  # orders == [1..N], first acronym as in excerpt
def test_barcelona_congreso_titulares_and_suplentes(excerpt):  # each candidacy: positions 1..len, len(candidates)==32, substitutes non-empty, substitute_names == ()
def test_senado_candidates_carry_substitutes(excerpt):  # every Barcelona Senado candidate has ≥1 substitute_names
def test_balearic_senado_split_by_island(excerpt):  # island_heading values == the three island subheadings, none None
def test_no_proclamada_candidacy_is_skipped(excerpt):  # its denomination absent from results
def test_full_document_counts():  # skipif raw XML missing
    parsed = parse_candidacies(BoeXmlSource(RAW_XML, "BOE-A-2026-23103").load())
    assert Counter(c.chamber for c in parsed) == {"congreso": 534, "senado": 361}
# test_candidacy_sources.py
def test_xml_source_keeps_order_and_classes(): ...  # first paragraphs' css_class/text from excerpt
def test_xml_and_html_sources_yield_same_candidacies(): assert parse_candidacies(xml.load()) == parse_candidacies(html.load())
```
- [ ] **Step 3: Run** `uv run pytest tests/test_candidacy_grammar.py tests/test_candidacy_sources.py -v` → FAIL.
- [ ] **Step 4: Implement sources** — lxml; XML: `<texto>` descendant `<p>` in order; HTML: `#textoxslt p`; text = `" ".join(itertext().split())`; drop empty.
- [ ] **Step 5: Implement grammar** as a state machine over paragraphs: states `province` (`JUNTA ELECTORAL DE <X>` sets `province_heading`, resets chamber/island) → `chamber` (`CONGRESO DE LOS DIPUTADOS` / `SENADO`) → optional island heading (any non-numbered paragraph inside Senado of provinces 07/35/38 that is not a header/suplente marker) → `candidacy` (header) → `titulares` (numbered lines) → `Suplentes:` switches to `suplentes` → Senado `Suplente…:` lines append to the previous candidate's `substitute_names`; a `No proclamada` paragraph discards the current candidacy. Keep each state's regexes as module constants.
- [ ] **Step 6: Run** → PASS (if full-document counts differ from 534/361, investigate the unmatched lines; do not edit the expected numbers without evidence from the document).
- [ ] **Step 7: Commit** — `git commit -m "feat: parse proclaimed candidacies from BOE XML and HTML"`

---

### Task 9: Source fetcher

model: haiku (agent `chore`)

**Files:**
- Create: `fetch.py`, `pipeline/data/sources.yaml`
- Test: `pipeline/tests/test_fetch.py`

**Interfaces:**
- Produces: `def fetch_sources(sources_yaml: Path, raw_dir: Path, client: httpx.Client) -> list[Path]`; `sources.yaml` entries `{id, url, file, license, manual}`. Entries: `boe-candidacies` → `BOE-A-2026-23103.xml`; `ine-municipalities` → `26codmun.xlsx`; `results-2023` → `manual: true` (url `https://infoelectoral.interior.gob.es/`, directory `results_2023/`).

- [ ] **Step 1: Failing tests** with `httpx.MockTransport`: `test_downloads_each_automatic_source` (files written with response bytes, return list of paths), `test_skips_manual_sources` (no request for manual entry), `test_raises_on_http_error` (404 → `httpx.HTTPStatusError`), `test_sends_pipeline_user_agent` (header `User-Agent: elecciones-generales-2026-pipeline`).
- [ ] **Step 2: Run** `uv run pytest tests/test_fetch.py -v` → FAIL.
- [ ] **Step 3: Implement** (`client.get(url, follow_redirects=True)`, `raise_for_status()`, write bytes).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add source fetcher"`

---

### Task 10: Party catalog (enrichment loader)

model: sonnet (agent `implementer`)

**Files:**
- Create: `parties.py`, `pipeline/data/parties.yaml` (`{}`), `pipeline/data/logos.yaml` (`{}`), `pipeline/tests/fixtures/parties.yaml`, `pipeline/tests/fixtures/logos.yaml`
- Test: `pipeline/tests/test_parties.py`

**Interfaces:**
- Consumes: `slugify` (Task 5), `schemas/parties.schema.json` (Task 3).
- Produces:
```python
@dataclass(frozen=True)
class LogoRecord: file: str; source_url: str; license: str; author: str
@dataclass(frozen=True)
class PartyEntry:
    key: str; name: str; tier: Literal["full", "basic"]; aliases: tuple[str, ...]
    website: str | None; programme_url: str | None; leader: str | None; founded: int | None
    seats_2023: tuple[int, int] | None; wikipedia_es: str | None; wikipedia_ca: str | None
class DuplicateAlias(Exception): ...
class PartyCatalog:
    def match(self, acronym: str) -> str | None
    def to_json(self, logos: dict[str, LogoRecord]) -> dict
def load_party_catalog(parties_yaml: Path) -> PartyCatalog
def load_logos(logos_yaml: Path) -> dict[str, LogoRecord]
```
- YAML keys are camelCase as in the JSON (`programmeUrl`, `seats2023: {congreso, senado}`, `wikipedia: {es, ca}`); logo `path` = `logos/{file}`.

- [ ] **Step 1: Failing tests**: `test_match_by_slugified_alias` (`match("PSC-PSOE") == match("psc psoe") == "psoe"`), `test_unknown_acronym_returns_none`, `test_duplicate_alias_across_parties_raises`, `test_to_json_validates_against_schema` (jsonschema with `schemas/parties.schema.json`), `test_logo_path_and_missing_logo_is_null`, `test_empty_yaml_gives_empty_catalog` (`load_party_catalog(Path("pipeline/data/parties.yaml")).to_json({}) == {"parties": {}}`).
- [ ] **Step 2: Run** `uv run pytest tests/test_parties.py -v` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: load curated party catalog and logos"`

---

### Task 11: Build command and export

model: sonnet (agent `implementer`)

**Files:**
- Create: `build.py`
- Modify: `cli.py`
- Test: `pipeline/tests/test_build.py`, `pipeline/tests/conftest.py`

**Interfaces:**
- Consumes: Tasks 3, 5, 6, 7, 8, 9, 10 interfaces.
- Produces:
```python
@dataclass(frozen=True)
class BuildPaths: data_dir: Path; raw_dir: Path; output_dir: Path
@dataclass(frozen=True)
class BuildReport: warnings: tuple[str, ...]; ballot_count: int; municipality_count: int
class BuildError(Exception): ...
def build_dataset(paths: BuildPaths, generated_at: datetime) -> BuildReport
def assign_slugs(acronyms: list[str]) -> list[str]
```
- CLI: `elecciones fetch` → `fetch_sources(data/sources.yaml, data/raw, httpx.Client(headers=UA))`; `elecciones build [--output ../web/public/data]` → prints warnings and counts; exit 1 on `BuildError`.
- Rules: `dataset = "boe-2026"`; ballot `sources = [{"label": boe_id, "url": document.url}]`; `results2023 = null`; municipalities sorted by code, `name = display_name`, `aliases = search_aliases`; candidacies in `boe_order`; slug collision → `{slug}-{n}` where n is the 1-based occurrence index starting at 2; Senado candidacy `substitutes = []`; JSON `ensure_ascii=False`, compact separators; output `congreso/` and `senado/` cleared before writing; finally `validate_data_dir(output_dir)` → `BuildError` on any error.
- Errors: constituency referenced by a municipality with no candidacies; unmapped island municipality; unknown province/island heading. Warnings: Congreso `len(candidates) != seats`; Senado `len(candidates) > seats`.

- [ ] **Step 1: Failing tests** (`conftest.py`: `build_inputs(tmp_path)` copies `pipeline/data/*.yaml` + vendor CSV, writes a tiny INE xlsx with Barcelona 08019, L'Hospitalet 08101, Palma 07040, Formentera 07024, Ceuta 51001, and copies the BOE excerpt as `raw/BOE-A-2026-23103.xml`):
```python
def test_build_writes_contract_valid_dataset(build_inputs): build(...); assert validate_data_dir(out) == []
def test_palma_points_to_mallorca_ballot(...): index["municipalities"] entry 07040 → senado "07-mallorca"; senado/07-mallorca.json maxMarks == 2
def test_hospitalet_display_name_and_alias(...): name == "L'Hospitalet de Llobregat", aliases == ["Hospitalet de Llobregat, L'"]
def test_assign_slugs_disambiguates(): assert assign_slugs(["PP", "P.P.", "PSOE"]) == ["pp", "pp-2", "psoe"]
def test_party_key_matched_from_catalog(...): with parties fixture yaml, PSC-PSOE candidacy partyKey == "psoe"
def test_referenced_constituency_without_candidacies_raises(...): add Madrid 28079 to INE → BuildError mentioning "congreso/28"
def test_congreso_candidate_count_mismatch_warns(...): drop one titular paragraph from excerpt → warning contains "congreso/08"
def test_stale_ballot_files_removed(...): pre-create out/senado/99.json → absent after build
def test_records_dataset_and_generated_at(...): index["dataset"] == "boe-2026"; generatedAt == "2026-11-23T10:00:00Z"
def test_ballot_sources_link_boe(...): sources == [{"label": "BOE-A-2026-23103", "url": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103"}]
```
- [ ] **Step 2: Run** `uv run pytest tests/test_build.py -v` → FAIL.
- [ ] **Step 3: Implement `build.py`** as small functions: `load_inputs`, `assemble_index`, `assemble_ballots`, `validate_coverage`, `write_dataset`.
- [ ] **Step 4: Wire `cli.py`** subcommands.
- [ ] **Step 5: Run** full `uv run pytest -v` → PASS.
- [ ] **Step 6: Commit** — `git commit -m "feat: add build command exporting the static dataset"`

---

### Task 12: Hash routing

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/routing/route.ts`, `web/src/routing/useHashRoute.ts`
- Test: `web/src/routing/route.test.ts`, `web/src/routing/useHashRoute.test.tsx`

**Interfaces:**
- Produces:
```ts
export type Route =
  | { page: 'home'; language: Language }
  | { page: 'about'; language: Language }
  | { page: 'ballot'; language: Language; municipalityCode: string; chamber: Chamber; partySlug: string | null };
export function parseRoute(hash: string): Route | null;   // null only when language missing/invalid
export function buildHash(route: Route): string;           // ballot always includes chamber
export function useHashRoute(): [Route | null, (route: Route) => void];
```

- [ ] **Step 1: Failing tests**
```ts
it.each([
  ['#/ca/08019/senado/psc-psoe', { page: 'ballot', language: 'ca', municipalityCode: '08019', chamber: 'senado', partySlug: 'psc-psoe' }],
  ['#/es/08019', { page: 'ballot', language: 'es', municipalityCode: '08019', chamber: 'congreso', partySlug: null }],
  ['#/es/08019/cortes', { page: 'ballot', language: 'es', municipalityCode: '08019', chamber: 'congreso', partySlug: null }],
  ['#/es/about', { page: 'about', language: 'es' }],
  ['#/ca', { page: 'home', language: 'ca' }], ['#/ca/', { page: 'home', language: 'ca' }],
  ['#/es/8019', { page: 'home', language: 'es' }],
])('parses %s', (hash, route) => expect(parseRoute(hash)).toEqual(route));
it.each(['', '#', '#/en/08019', '#/'])('rejects %s', (hash) => expect(parseRoute(hash)).toBeNull());
it('builds canonical ballot hash', () => expect(buildHash({ page: 'ballot', language: 'es', municipalityCode: '08019', chamber: 'congreso', partySlug: null })).toBe('#/es/08019/congreso'));
it('round-trips', () => { const hash = '#/ca/07040/senado/pp'; expect(buildHash(parseRoute(hash)!)).toBe(hash); });
// hook: navigate() sets window.location.hash; dispatching hashchange updates the returned route
```
- [ ] **Step 2: Run** `yarn vitest run src/routing` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add hash routing"`

---

### Task 13: Municipality search

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/search/normalizeForSearch.ts`, `web/src/search/municipalitySearch.ts`, `web/src/search/MunicipalitySearch.tsx`, ns `search` (`label`, `placeholder`, `noResults`)
- Test: `web/src/search/normalizeForSearch.test.ts`, `web/src/search/municipalitySearch.test.ts`, `web/src/search/MunicipalitySearch.test.tsx`

**Interfaces:**
- Consumes: `fixtureIndex` (Task 3), `Municipality`, `MunicipalityIndex`.
- Produces:
```ts
export function normalizeForSearch(text: string): string;
export const MAX_RESULTS = 10;
export function createMunicipalitySearch(municipalities: Municipality[]): (query: string) => Municipality[];
export function MunicipalitySearch(props: { index: MunicipalityIndex; onSelect: (municipality: Municipality) => void }): JSX.Element;
```
- Ranking: normalized name or alias equal to query → first; then name/alias starting with query; then Fuse (`threshold: 0.35`, `ignoreLocation: true`, keys `normalizedName` weight 2, `normalizedAliases` weight 1) by score. Dedupe by code. Option shows `municipality.name` + province name (`constituencies.congreso` summary name in current language).

- [ ] **Step 1: Failing tests**
```ts
it.each([["L'Hospitalet", 'l hospitalet'], ['Alacant/Alicante', 'alacant alicante'], ['Coruña, A', 'coruna a'], ['Col·legi', 'collegi'], ['  Sant  Martí ', 'sant marti']])
  ('normalizes %s', (raw, expected) => expect(normalizeForSearch(raw)).toBe(expected));
const search = createMunicipalitySearch(fixtureIndex.municipalities);
it.each([['a coruna', '15030'], ['coruña', '15030'], ['lhospitalet', '08101'], ["l'hospitalet", '08101'], ['hospitalet', '08101'],
  ['alacant', '03014'], ['alicante', '03014'], ['donostia', '20069'], ['san sebastian', '20069'], ['madrid', '28079'], ['barclona', '08019']])
  ('%s → %s first', (query, code) => expect(search(query)[0]?.code).toBe(code));
it('lists homonyms', () => expect(search('mieres').map((m) => m.code).sort()).toEqual(['17105', '33037']));
it('empty query yields nothing', () => expect(search('   ')).toEqual([]));
it('caps results', () => expect(search('a').length).toBeLessThanOrEqual(MAX_RESULTS));
// component: type "palma" → option "Palma" with "Illes Balears"; Enter/click → onSelect called with 07040 municipality; "zzzz" → noResults text
```
- [ ] **Step 2: Run** `yarn vitest run src/search` → FAIL.
- [ ] **Step 3: Implement** (Headless UI `Combobox`, `ComboboxInput`, `ComboboxOptions`, `ComboboxOption`; search index built once with `useMemo`; Tailwind with `dark:` variants).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add fuzzy diacritic-insensitive municipality search"`

---

### Task 14: Theme

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/theme/themePreference.ts`, `web/src/theme/ThemeToggle.tsx`, ns `theme` (`toggle.system`, `toggle.light`, `toggle.dark`)
- Modify: `web/index.html` (inline pre-paint script in `<head>`)
- Test: `web/src/theme/themePreference.test.ts`, `web/src/theme/ThemeToggle.test.tsx`

**Interfaces:**
- Produces:
```ts
export type ThemePreference = 'system' | 'light' | 'dark';
export function loadThemePreference(): ThemePreference;            // invalid/missing → 'system'
export function saveThemePreference(preference: ThemePreference): void;
export function nextThemePreference(current: ThemePreference): ThemePreference;  // system→light→dark→system
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): 'light' | 'dark';
export function applyTheme(theme: 'light' | 'dark'): void;         // toggles 'dark' on documentElement
export function ThemeToggle(): JSX.Element;                        // also follows matchMedia changes while 'system'
```

- [ ] **Step 1: Failing tests** — `resolveTheme('system', true) === 'dark'`, `resolveTheme('light', true) === 'light'`, `resolveTheme('dark', false) === 'dark'`; stored `'purple'` → `'system'`; cycle order; `applyTheme('dark')` adds class, `'light'` removes; ThemeToggle click from system → localStorage `eg26.theme === 'light'` and aria-label = `t('theme:toggle.light')` (mock `matchMedia`).
- [ ] **Step 2: Run** `yarn vitest run src/theme` → FAIL.
- [ ] **Step 3: Implement** + inline `<script>` in `index.html` reading `eg26.theme` and `matchMedia('(prefers-color-scheme: dark)')` to set the class before paint.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add light/dark theme with system default"`

---

### Task 15: Candidacy list, ordering and badges

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/candidacies/orderCandidacies.ts`, `web/src/candidacies/badgeColor.ts`, `web/src/candidacies/PartyBadge.tsx`, `web/src/candidacies/CandidacyList.tsx`, ns `candidacies` (`ordering.label`, `ordering.boe`, `ordering.alphabetical`, `ordering.votes2023`, `results2023.congreso` = "2023: {{percentage}} · {{seats}} escaños", `results2023.senado`, `results2023.as`, `coalition`)
- Test: `orderCandidacies.test.ts`, `badgeColor.test.ts`, `PartyBadge.test.tsx`, `CandidacyList.test.tsx`

**Interfaces:**
- Consumes: Task 3 types/fixtures, `BASE_URL` for logo src.
- Produces:
```ts
export type CandidacyOrdering = 'boe' | 'alphabetical' | 'votes2023';
export function orderCandidacies(candidacies: Candidacy[], ordering: CandidacyOrdering, language: Language): Candidacy[];
export function badgeColor(acronym: string): { background: string; foreground: string };
export function contrastRatio(foreground: string, background: string): number;
export function PartyBadge(props: { acronym: string; logo: PartyLogo | null; size: 'small' | 'large' }): JSX.Element;
export function CandidacyList(props: { candidacies: Candidacy[]; chamber: Chamber; partyCatalog: PartyCatalog | null; hrefFor: (candidacy: Candidacy) => string }): JSX.Element;
```
- `badgeColor`: hue from a stable string hash of `slugify`-like lowercase acronym, `hsl(h 65% 42%)` as hex; foreground `#ffffff` or `#111827`, whichever has higher contrast.

- [ ] **Step 1: Failing tests** — ordering: boe ascending; alphabetical uses `Intl.Collator(language, { sensitivity: 'base' })` (`ÁGORA` before `BLOQUE`), returns new array (input unchanged); votes2023 desc, `results2023: null` last, ties by boeOrder. badgeColor: deterministic, `PP` ≠ `PSOE`, `contrastRatio(fg, bg) >= 4.5` for 50 sample acronyms. PartyBadge: with logo → `img` alt = acronym, src ends with `logos/x.svg`; without → text acronym, `title` = full acronym. CandidacyList: renders denominations in BOE order as links with `hrefFor` hrefs; selecting alphabetical reorders; `votes2023` option absent when no candidacy has `results2023`; results line shows `34,12 %` in es (`Intl.NumberFormat`), coalition label for `isCoalition`.
- [ ] **Step 2: Run** `yarn vitest run src/candidacies` → FAIL.
- [ ] **Step 3: Implement** (ordering toggle = Headless UI `RadioGroup` or native radio group; state local).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add candidacy list with ordering and generated badges"`

---

### Task 16: Constituency view (tabs, seats, how to vote)

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/constituency/ConstituencyView.tsx`, `ChamberTabs.tsx`, `SeatsSummary.tsx`, `HowToVote.tsx`, ns `constituency`
- Test: `ChamberTabs.test.tsx`, `SeatsSummary.test.tsx`, `HowToVote.test.tsx`, `ConstituencyView.test.tsx`

**Interfaces:**
- Consumes: `CandidacyList` (Task 15), Task 3 types/fixtures.
- Produces:
```ts
export function ConstituencyView(props: {
  municipality: Municipality; constituency: ConstituencySummary; ballot: ConstituencyBallot;
  partyCatalog: PartyCatalog | null; chamberHref: (chamber: Chamber) => string; candidacyHref: (candidacy: Candidacy) => string;
}): JSX.Element;
```
- Copy (es / ca) fixed here:
  - `seats.congreso`: "Se eligen {{count}} diputados" / "S'escullen {{count}} diputats" (i18next plurals for 1)
  - `seats.senado`: "Se eligen {{count}} senadores · puedes marcar hasta {{maxMarks}}" / "S'escullen {{count}} senadors · pots marcar-ne fins a {{maxMarks}}"
  - `howToVote.congreso`: "Papeleta y sobre blancos. Elige una sola papeleta de candidatura (lista cerrada) y métela en el sobre blanco sin tachar ni añadir nada." / "Papereta i sobre blancs. Tria una sola papereta de candidatura (llista tancada) i posa-la al sobre blanc sense ratllar ni afegir res."
  - `howToVote.senado`: "Papeleta y sobre sepia. Una única papeleta con todos los candidatos: marca con una cruz hasta {{maxMarks}}, de la misma o de distintas candidaturas." / "Papereta i sobre sèpia. Una única papereta amb tots els candidats: marca amb una creu fins a {{maxMarks}}, de la mateixa o de diferents candidatures."

- [ ] **Step 1: Failing tests** — ChamberTabs: two links with `chamberHref` hrefs, active has `aria-current="page"`; SeatsSummary: Congreso Barcelona "Se eligen 32 diputados", Senado Mallorca contains "hasta 2"; HowToVote: Congreso mentions "sobre blanc" (ca), Senado mentions "sepia" and "hasta 3" for a 4-seat fixture; ConstituencyView: heading `municipality.name` + localized constituency name in ca, renders CandidacyList items.
- [ ] **Step 2: Run** `yarn vitest run src/constituency` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add constituency view with seats and how-to-vote help"`

---

### Task 17: Party detail

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/party/PartyDetail.tsx`, `web/src/party/CandidateList.tsx`, `web/src/party/PartyFacts.tsx`, ns `party` (`back`, `candidates`, `substitutes`, `substitute`, `senadoMarks` = "Puedes marcar hasta {{maxMarks}} candidatos en total", `facts.*`, `links.*`, `editOnGithub`)
- Test: `PartyDetail.test.tsx`, `CandidateList.test.tsx`, `PartyFacts.test.tsx`

**Interfaces:**
- Consumes: `PartyBadge` (Task 15), `PARTIES_EDIT_URL` (Task 4).
- Produces:
```ts
export function PartyDetail(props: { candidacy: Candidacy; chamber: Chamber; maxMarks: number | null; profile: PartyProfile | null; backHref: string }): JSX.Element;
```

- [ ] **Step 1: Failing tests** — renders denomination, acronym, large badge; Congreso: ordered list of titulares then "Suplentes" section; Senado: each candidate shows its `substituteNames`, marks note with `maxMarks`, no "Suplentes" section; `profile: null` → no facts block, edit link still present; full profile → website, programme, leader, founded, seats won in 2023, Wikipedia link in current language falling back to the other; all external links `target="_blank" rel="noopener noreferrer"`; edit link href `PARTIES_EDIT_URL`; back link href `backHref`.
- [ ] **Step 2: Run** `yarn vitest run src/party` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add party detail with candidates and curated facts"`

---

### Task 18: About page

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/about/AboutPage.tsx`, `web/src/about/LogoCredits.tsx`, ns `about`
- Test: `web/src/about/AboutPage.test.tsx`

**Interfaces:**
- Consumes: `SOURCE_URLS`, `ISSUES_URL` (Task 4), `PartyCatalog` type.
- Produces: `export function AboutPage(props: { generatedAt: string; partyCatalog: PartyCatalog | null }): JSX.Element;`
- Sections (structured, short): datasets — BOE Candidaturas proclamadas (BOE-A-2026-23103) + convocation (BOE-A-2026-20742); INE municipality list (26codmun); Ministerio del Interior 2023 results; Wikimedia Commons logos (per-logo name, license, author, source link); curated `parties.yaml` (link `SOURCE_URLS.partiesYaml`, open to corrections). Last updated. Disclaimer copy: es "Esta web es independiente. No está afiliada a ningún partido político, institución pública ni administración electoral. Comprueba siempre la información oficial." / ca "Aquest web és independent. No està afiliat a cap partit polític, institució pública ni administració electoral. Comprova sempre la informació oficial." "Report an error" link → `ISSUES_URL`.

- [ ] **Step 1: Failing tests** — `generatedAt '2026-11-23T10:00:00Z'` renders "23 de noviembre de 2026" (es, `Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Madrid' })`) and "23 de novembre de 2026" (ca); links to the four `SOURCE_URLS` dataset URLs present; logo credits list one row per profile with a logo (license + author + sourceUrl link) and is hidden when none; disclaimer text present; report link href `ISSUES_URL`.
- [ ] **Step 2: Run** `yarn vitest run src/about` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add about page with data provenance and disclaimer"`

---

### Task 19: App shell, header, footer, meta

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/shell/Header.tsx`, `web/src/shell/Footer.tsx`, `web/src/shell/LanguageToggle.tsx`, `web/src/shell/DemoBanner.tsx`, `web/src/shell/useBallotData.ts`, `web/src/shell/useLanguageRoute.ts`, ns `shell`, `web/public/og-image.png`
- Modify: `web/src/App.tsx`, `web/src/main.tsx`, `web/index.html` (`<html lang>`, title, description, `og:*`, `twitter:card summary_large_image`)
- Test: `web/src/App.test.tsx`, `web/src/shell/Footer.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 4, 12–18.
- Produces: `export function App(): JSX.Element`; `useBallotData(route) → { status: 'loading' | 'ready' | 'error'; index; ballot; partyCatalog; municipality; constituency; candidacy }`.
- Behaviour: no/invalid hash → `navigate({ page: 'home', language: detectLanguage(localStorage, navigator.languages) })` (replace, not push); valid route language → `i18n.changeLanguage`, `document.documentElement.lang`, persisted to `eg26.lang`; unknown municipality code → home + notice `shell:unknownMunicipality`; unknown party slug → ballot view + notice `shell:unknownParty`; search selection → `#/{lang}/{code}/congreso`; language toggle keeps the rest of the route; About link in header and footer; `dataset === 'fixture'` → DemoBanner.
- Footer copy: es "Web independiente, sin afiliación política. Orden por defecto: publicación en el BOE." / ca "Web independent, sense afiliació política. Ordre per defecte: publicació al BOE." + links BOE, INE, Interior (from `SOURCE_URLS`) + About.
- OG image 1200×630 PNG: title "Eleccions generals 2026 · Elecciones generales 2026", subtitle "29-N · Congreso · Senado"; author as SVG and rasterize with `yarn dlx @resvg/resvg-js-cli` (no new dependency).

- [ ] **Step 1: Failing tests** (`vi.mock('./data/loaders')` returning Task 3 fixtures):
```ts
it('redirects empty hash to detected language', ...)           // navigator ['ca-ES'] → location.hash '#/ca'
it('stored language beats navigator', ...)                    // eg26.lang 'es', navigator ca → '#/es'
it('renders Barcelona Congreso ballot', ...)                  // '#/es/08019' → "Se eligen 32 diputados"
it('renders Mallorca Senado with two marks', ...)             // '#/ca/07040/senado' → "fins a 2"
it('renders party detail from slug', ...)                     // '#/es/08019/congreso/<fixture slug>' → denomination heading
it('unknown municipality falls back home with notice', ...)   // '#/es/99999'
it('unknown party slug falls back to ballot with notice', ...)
it('renders about page', ...)                                 // '#/es/about'
it('language toggle keeps route and persists', ...)           // '#/es/08019/senado' → click ca → '#/ca/08019/senado', eg26.lang 'ca', html lang 'ca'
it('shows demo banner for fixture dataset', ...)
it('search selection navigates to congreso ballot', ...)
// Footer.test.tsx: neutrality notice, BOE/INE/Interior links, About link '#/es/about'
```
- [ ] **Step 2: Run** `yarn vitest run src/App.test.tsx src/shell` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `yarn test && yarn build && yarn format:check` → PASS.
- [ ] **Step 5: Manual check** — `yarn dev`, open `#/ca/07040/senado`, toggle theme/language, confirm no flash on reload in dark mode.
- [ ] **Step 6: Commit** — `git commit -m "feat: wire app shell with header, footer, about and meta tags"`

---

### Task 20: MVP data cut and release (target Nov 24)

model: haiku (agent `chore`)

**Files:**
- Modify: `web/public/data/**` (generated)

- [ ] **Step 1:** `cd pipeline && uv run elecciones fetch && uv run elecciones build --output ../web/public/data` → exit 0; save printed warnings into the commit message body.
- [ ] **Step 2:** `uv run pytest -v` (incl. full-document and real INE tests, now not skipped) → PASS.
- [ ] **Step 3:** `grep -c '"dataset":"boe-2026"' ../web/public/data/municipalities.json` → `1`; `ls ../web/public/data/congreso | wc -l` → `52`; `ls ../web/public/data/senado | wc -l` → `59`.
- [ ] **Step 4:** `cd web && yarn test && yarn build` → PASS. `yarn preview` and spot-check: Barcelona, Palma (Senado Mallorca, 2 marks), Formentera, Teguise, Ceuta, A Coruña, L'Hospitalet — counts of candidacies match the BOE document for those provinces. Report any mismatch as BLOCKED with details.
- [ ] **Step 5: Commit + push** — `git add web/public/data && git commit -m "data: first build from BOE-A-2026-23103" && git push`; `gh run watch` → deploy success; open the Pages URL.

---

### Task 21: Party enrichment curation (target Nov 26)

model: sonnet (agent `implementer`)

**Files:**
- Modify: `pipeline/data/parties.yaml`
- Test: `pipeline/tests/test_parties_data.py`

**Interfaces:**
- Consumes: Task 10 YAML shape; parsed acronyms from a build.
- Full tier: PSOE (aliases incl. PSC-PSOE, PSdeG-PSOE, PSE-EE (PSOE), PSOE Senate coalition "Senado de Progreso" as its own key), PP, UPN–PP (Navarra coalition, own key), Vox, Frente Amplio, Podemos, ERC, Junts, EH Bildu, PNV, BNG, CC–Municipalistas Primero Canarias, UPN, CUP, SALF, D21 (incl. Cs). Every other candidacy acronym seen in the build: `tier: basic` with `name` and `website` when verifiable, else just `name`.
- Facts only from verifiable sources (party site, Wikipedia, congreso.es/senado.es composition pages); unknown → `null`, never guessed.

- [ ] **Step 1: Failing test** — `test_every_full_tier_party_matches_a_2026_candidacy` (each full entry's aliases match ≥1 acronym in `web/public/data/**`), `test_every_full_tier_party_has_website_and_wikipedia_es`, `test_catalog_loads_without_duplicate_aliases`.
- [ ] **Step 2: Run** `uv run pytest tests/test_parties_data.py -v` → FAIL.
- [ ] **Step 3: Curate** `parties.yaml`.
- [ ] **Step 4: Run** → PASS; rebuild (`uv run elecciones build --output ../web/public/data`), `uv run pytest` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "data: curate party enrichment"`

---

### Task 22: Party logos from Wikimedia Commons

model: haiku (agent `chore`)

**Files:**
- Modify: `pipeline/data/logos.yaml`; Create: `web/public/logos/{key}.{svg|png}`

- [ ] **Step 1:** For PSOE, Podemos, UPN, ERC (2025 logo), EH Bildu (2023), PNV (2025), CC 2026 coalition: query `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&format=json&titles=File:<name>` (User-Agent `elecciones-generales-2026-pipeline`), download the original into `web/public/logos/{partyKey}.{ext}`, record `{file, sourceUrl (File: page), license (LicenseShortName), author (Artist, HTML stripped)}`. Keys must exist in `parties.yaml` (Task 21). Skip PP, Vox, BNG, CUP, SALF (badge fallback).
- [ ] **Step 2:** Only accept licenses that are PD-textlogo/public domain or CC BY/CC BY-SA; otherwise skip and list it in the report.
- [ ] **Step 3:** Rebuild + `uv run pytest` + `cd web && yarn build` → PASS; check About page lists each logo credit.
- [ ] **Step 4: Commit** — `git commit -m "data: add Wikimedia Commons logos with licenses"`

---

### Task 23: BOE corrections overrides

model: sonnet (agent `implementer`)

**Files:**
- Create: `corrections.py`, `pipeline/data/corrections.yaml` (`[]`)
- Modify: `build.py` (apply after parsing, before assembly)
- Test: `pipeline/tests/test_corrections.py`

**Interfaces:**
- Produces: `def load_corrections(path: Path) -> list[Correction]`; `def apply_corrections(candidacies: list[ParsedCandidacy], corrections: list[Correction], registry: ConstituencyRegistry) -> list[ParsedCandidacy]`. Correction = `{chamber, constituency, boeOrder, op, ...}`, ops `rename_candidate {list: candidates|substitutes, position, name}`, `remove_candidacy {}`, `set_acronym {acronym}`, plus `source` (BOE id of the corrección).
- Correction targeting a non-existent candidacy → `BuildError`.

- [ ] **Step 1: Failing tests** — one per op; unknown target raises; empty file is a no-op; build with a fixture correction changes the exported name.
- [ ] **Step 2: Run** `uv run pytest tests/test_corrections.py -v` → FAIL.
- [ ] **Step 3: Implement + wire into `build.py`.**
- [ ] **Step 4: Run** full suite → PASS.
- [ ] **Step 5:** Search BOE for "corrección de errores" referencing BOE-A-2026-23103; if found, encode entries with `source`.
- [ ] **Step 6: Commit** — `git commit -m "feat: apply BOE correction overrides"`

---

### Task 24: 2023 results source and lineage (target Nov 27, cuttable)

model: sonnet (agent `implementer`)

**Precondition:** the user has manually downloaded the 2023 Congreso and Senado results into `pipeline/data/raw/results_2023/` (Interior blocks automated fetches). Start by inspecting the file format and saving a 2-province excerpt (Barcelona + Illes Balears incl. island Senado rows) to `pipeline/tests/fixtures/results_2023/`.

**Files:**
- Create: `results_2023/__init__.py`, `results_2023/source.py`, `results_2023/<format>_source.py`, `results_2023/lineage.py`, `pipeline/data/lineage_2023.yaml` (`{}`)
- Modify: `build.py`
- Test: `pipeline/tests/test_results_2023.py`, `pipeline/tests/test_lineage.py`

**Interfaces:**
- Produces:
```python
@dataclass(frozen=True)
class CandidacyResult2023: chamber: str; constituency_id: str; acronym: str; votes: int; seats: int
@dataclass(frozen=True)
class Results2023: candidacies: tuple[CandidacyResult2023, ...]; valid_votes: dict[tuple[str, str], int]
class Results2023Source(Protocol):
    def load(self) -> Results2023: ...
def load_lineage(path: Path) -> dict[str, list[str]]
def predecessor_acronyms(acronym_2026: str, lineage: dict[str, list[str]]) -> list[str] | None   # None = use same acronym
def summarize(chamber: str, constituency_id: str, acronym_2026: str, lineage: dict[str, list[str]], results: Results2023) -> dict | None
```
- Senado `CandidacyResult2023.votes` = the candidacy's most-voted candidate; island constituencies use spec ids.
- `summarize`: Congreso → `{votes: sum, percentage: round(sum / valid * 100, 2), seats: sum, asAcronyms}`; Senado → `{votes: max, percentage: None, seats: sum, asAcronyms}`; predecessors matched by `slugify`; none present → `None`.

- [ ] **Step 1: Failing tests** — source excerpt yields known Barcelona Congreso votes for two parties and Mallorca Senado rows with `constituency_id == "07-mallorca"`; lineage: missing entry → same acronym; explicit list sums two predecessors; explicit `[]` → `None`; percentage rounding; Senado uses max; build integration fills `results2023` and the contract test still passes; build without the raw directory leaves `results2023: null` (cuttable).
- [ ] **Step 2: Run** `uv run pytest tests/test_results_2023.py tests/test_lineage.py -v` → FAIL.
- [ ] **Step 3: Implement** source adapter for the observed format, lineage, build wiring.
- [ ] **Step 4: Run** full suite → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: add 2023 results via predecessor lineage"`

---

### Task 25: Lineage curation for 2026 realignments

model: sonnet (agent `implementer`)

**Files:**
- Modify: `pipeline/data/lineage_2023.yaml`
- Test: `pipeline/tests/test_lineage_data.py`

- [ ] **Step 1: Failing test** — `test_explicit_lineage_references_existing_2023_acronyms` (every listed 2023 acronym exists in the 2023 results somewhere); `test_known_realignments_have_entries` for slugs of Frente Amplio, Podemos (`[]`), CC–MPC, UPN–PP, D21, PSOE "Senado de Progreso" coalition (use the actual 2026 acronyms from the build).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Curate** per spec §4 lineage notes; regional brands of Sumar 2023 (e.g. Catalan, Galician, Valencian lists) map to the regional Frente Amplio list in the same constituency.
- [ ] **Step 4:** Rebuild; print candidacies with ≥1 % of 2023 votes lacking results → review list in the report.
- [ ] **Step 5: Commit** — `git commit -m "data: curate 2023 lineage for 2026 coalitions"`

---

### Task 26: Freeze and Nov 28 re-scrape

model: haiku (agent `chore`)

- [ ] **Step 1 (Nov 27):** Announce freeze: only data commits after this point.
- [ ] **Step 2 (Nov 28):** `uv run elecciones fetch && uv run elecciones build --output ../web/public/data`; check BOE for new corrección de errores and, if any, report BLOCKED with the BOE id so Task 23's override format is filled by an implementer.
- [ ] **Step 3:** `git diff --stat web/public/data` and summarize changed constituencies; `uv run pytest && cd ../web && yarn test && yarn build` → PASS.
- [ ] **Step 4: Commit + push** — `git commit -m "data: re-scrape 2026-11-28"`; `gh run watch` → success; spot-check 3 towns live.
