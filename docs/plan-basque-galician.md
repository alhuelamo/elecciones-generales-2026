# Basque and Galician Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Basque (`eu`) and Galician (`gl`) as full UI languages, next to `es` and `ca`.
- A compact language menu replaces the two-button toggle, so four languages fit at 375 px.
- Browser detection maps `eu*` and `gl*` to the new languages.
- Hash routes accept `eu` and `gl`.
- Places use official or co-official names:
  - Municipality names come from INE bilingual forms.
  - Provinces use the forms listed in this plan.
- Party pages fall back from eu/gl Wikipedia to es.
- The eu/gl UI strings are machine-translated by the implementing agent. In eu/gl, a small notice in that language links to a prefilled GitHub issue for reporting translation errors.

**Architecture:**
- **Single source of truth.** One module, `web/src/i18n/languages.ts`, owns `SUPPORTED_LANGUAGES`, the `Language` type and the native names. The routing, detection and menu code all derive from it, and `contract/types.ts` re-exports `Language`.
- **Sparse names.** On the data side, eu/gl names are emitted only when they differ from es. The web reads them through one helper, `localizedName(text, language)`, which falls back to `es`. This keeps the gzipped `municipalities.json` from growing much; emitting eu/gl on every entry was measured at +47 %.
- **Pipeline.** It gains eu/gl Wikidata label columns, optional eu/gl keys in `provinces.yaml` and `island_constituencies.yaml`, and nullable eu/gl Wikipedia URLs.

**Tech Stack:** Vite 8, React 19, TypeScript, Tailwind v4 tokens, Headless UI 2 (`Menu`), react-i18next, Vitest + Testing Library, yarn 4, oxlint and prettier. The pipeline uses Python with uv, pytest, black and isort, and is validated against the JSON Schemas in `schemas/`.

**Spec:** the brief agreed with the user is copied into the Global Constraints below. The base product spec is `docs/spec.md`.

## Dependency on the 2023 results plan

**This plan starts only after `docs/plan-results-2023.md` is fully merged on `main`**, including its pipeline output, `party_colors.yaml` and the new `results2023` i18n namespace. That plan also edits `ConstituencyView.tsx`, `build.py` and `web/public/data/**`.

Task 9 (the eu/gl translations) runs **last** and must cover every namespace present at that point, `results2023` included. If the results plan is not merged when this plan starts, stop and report. Do not edit `docs/plan-results-2023.md`.

## Global Constraints

- **Language codes.** The codes are `es`, `ca`, `eu` and `gl`, in that menu order. Only `web/src/i18n/languages.ts` lists them on the web side; no other file may hard-code the list.
- **Native names.** The language names are Castellano, Català, Euskara and Galego. They are never translated, so they live in a constant rather than in the locales. The unused `common.language.{es,ca}` keys are removed.
- **Language menu.**
  - It uses the Headless UI `Menu`, styled like `web/src/theme/ThemeMenu.tsx`: `BUTTON_CLASSES`, the same `MenuItems` panel, tap targets of at least 44 px and `data-focus:bg-kraft`.
  - The button shows the active code in uppercase and has the accessible name `"{t('language.label')}: {native name}"`, for example "Idioma: Castellano".
  - Each item shows the native name, has `lang={code}`, and marks the current choice the same way ThemeMenu does.
  - Keyboard navigation works and focus returns to the button when the menu closes.
- **Detection.** `detectLanguage` keeps its rule: a valid stored language wins, then the first supported primary subtag in `navigator.languages`, then `es`. `eu-ES` maps to `eu` and `gl-ES` maps to `gl`.
- **Routing.** `parseRoute` accepts every `SUPPORTED_LANGUAGES` code and rejects anything else. `buildHash` is unchanged. `<html lang>` follows the route through the existing `useLanguageRoute`.
- **Place names.**
  - Municipalities only ever use parts of the official INE name and never a Wikidata exonym. For a bilingual INE name ("A/B"), eu and gl pick the part closest to that language's Wikidata label. Without a label, they fall back to the es choice. Monolingual names are the same in every language.
  - eu/gl keys are emitted only when they differ from es. Search aliases include the eu/gl labels.
  - Provinces use the forms in the Task 2 table. Every other province, and every island, falls back to es.
- **Party text.** Party names and other party text are not translated, and candidacy names stay exactly as in the BOE.
- **Wikipedia.** The fallback chain is `es → ca`, `ca → es`, `eu → es` and `gl → es`. The schema and pipeline gain nullable `eu`/`gl` URLs, which stay `null` unless verified (see Open questions).
- **Machine-translation notice.**
  - It appears only for `eu` and `gl`, in that language.
  - It links through `web/src/design/ExternalLink.tsx`. This is mandatory: the guard test in `ExternalLink.test.tsx` fails on any other `target="_blank"` or `noopener`.
  - The link goes to `${ISSUES_URL}?title=…&body=…`, built with `URLSearchParams`. The body includes the current page URL and the language code.
- **Translations.** The implementing agent translates the strings itself, with no external services or APIs.
  - Keep every interpolation (`{{count}}`, `{{maxMarks}}`, ...), every `<days>` tag and every `_one`/`_other` plural suffix exactly as they are. eu and gl both use the `one`/`other` CLDR plural forms.
  - Keep proper nouns as in es: Congreso, Senado, BOE, INE, party names.
- **Payload.** `municipalities.json` may grow by at most 5 % gzipped. Task 8 measures it; the baseline is 125,293 B.
- **Tests.**
  - The baseline is 278 web and 312 pipeline tests, and it stays green throughout.
  - Work test-first: write the failing test, see it fail for the right reason, implement, then refactor.
  - Follow the existing test style: `it.each` rows, `@pytest.mark.parametrize`, and the fixtures in `web/src/test/fixtures.ts` and `pipeline/tests/fixtures/`.
- **Code style.** No comments or TODOs in code. Use descriptive names and UPPERCASE constants. Use yarn (never npm) and uv. Python goes through black and isort. Web code must pass `yarn format:check` and `yarn lint`.
- **Commits.**
  - One commit per task, using explicit pathspecs: `git add <paths>` for new files, then `git commit -m "<msg>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- <paths>`.
  - Commits are signed through 1Password. Never disable signing or pass `--no-gpg-sign`. If signing fails, stop and report.
  - Only Task 10 pushes, with `git push git@github.com:alhuelamo/elecciones-generales-2026.git main`.
- **Commands.**
  - Web, from `web/`: `yarn test`, `yarn build`, `yarn format:check`, `yarn lint`.
  - Pipeline, from `pipeline/`: `uv run pytest`, `uv run black --check .`, `uv run isort --check-only .`.

## Review Focus

- No second hard-coded language list survives. Check with `grep -rn '"ca"' web/src --include='*.ts*'`: only locale-aware tables keyed by `Language` may remain.
- `LocalizedText` stays sparse-safe. Every read of a `name` object goes through `localizedName`.
- `localized_names` never returns a string that is not a part of the INE official name.
- The language menu is accessible: its name, `lang` on the items, keyboard navigation and focus return. It also must not make the header wrap at 375 px.
- The notice uses `ExternalLink`, and the issue URL encodes its parameters correctly.
- The translations keep every placeholder and tag, and no untranslated `es` text is left in the `eu`/`gl` files.

## Execution waves and file ownership

| Wave | Tasks | Files owned |
|---|---|---|
| 1 | T1 · T2 | T1: `web/src/i18n/languages.ts(+test)`, `web/src/i18n/localizedName.ts(+test)`, `web/src/contract/types.ts`, `web/src/routing/route.ts(+test)`, `web/src/i18n/detectLanguage.ts(+test)` · T2: `pipeline/src/elecciones_pipeline/{labels,municipalities,constituencies,build}.py`, `pipeline/data/{provinces,island_constituencies}.yaml`, `schemas/municipalities.schema.json`, `pipeline/tests/{test_labels,test_municipalities,test_constituencies,test_build,test_contract}.py`, `pipeline/tests/fixtures/**` (labels only) |
| 2 | T3 · T4 · T5 · T6 · T7 | T3: `web/src/shell/LanguageMenu.tsx(+test)`, delete `web/src/shell/LanguageToggle.tsx`, `web/src/shell/Header.tsx(+test)`, `web/src/App.test.tsx`, `web/src/i18n/locales/{es,ca}/common.json` · T4: `web/src/shell/useDocumentTitle.ts(+test)`, `web/src/constituency/ConstituencyView.tsx(+test)`, `web/src/search/MunicipalitySearch.tsx(+test)` · T5: `pipeline/src/elecciones_pipeline/parties.py`, `pipeline/tests/test_parties.py`, `pipeline/tests/fixtures/parties.yaml`, `schemas/parties.schema.json`, `web/src/contract/types.ts`, `web/src/test/fixtures.ts`, `web/src/party/PartyLinks.tsx(+test)` · T6: `web/src/shell/MachineTranslationNotice.tsx(+test)`, `web/src/shell/Footer.tsx(+test)`, `web/src/i18n/locales/{es,ca}/shell.json` · T7: `web/index.html`, `README.md`, `docs/spec.md` |
| 3 | T8 | `pipeline/data/vendor/wikidata_municipality_labels.csv`, `web/public/data/**` |
| 4 | T9 | `web/src/i18n/localeParity.test.ts`, `web/src/i18n/locales/{eu,gl}/**` (creates), `web/src/App.test.tsx` (one smoke row) |
| 5 | T10, then the browser check | nothing new |

T1 and T5 both touch `types.ts`, but they are in different waves. Every wave-2 task starts only after T1 (and T5 also after T2). Within a wave, the tasks run in parallel.

---

### Task 1: Language registry, sparse `LocalizedText`, routing and detection

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/i18n/languages.ts`, `web/src/i18n/languages.test.ts`, `web/src/i18n/localizedName.ts`, `web/src/i18n/localizedName.test.ts`
- Modify: `web/src/contract/types.ts`, `web/src/routing/route.ts`, `web/src/routing/route.test.ts`, `web/src/i18n/detectLanguage.ts`, `web/src/i18n/detectLanguage.test.ts`

**Interfaces:**
```ts
// web/src/i18n/languages.ts
export const SUPPORTED_LANGUAGES = ["es", "ca", "eu", "gl"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "es";
export const LANGUAGE_NATIVE_NAMES: Record<Language, string>;
export function isSupportedLanguage(value: string): value is Language;

// web/src/i18n/localizedName.ts
export function localizedName(text: LocalizedText, language: Language): string;

// web/src/contract/types.ts
export type { Language } from "../i18n/languages";
export type LocalizedText = Record<"es" | "ca", string> & Partial<Record<"eu" | "gl", string>>;
```

**Behaviour:**
- `localizedName` returns `text[language] ?? text.es`.
- `route.ts` and `detectLanguage.ts` drop their local lists and use `isSupportedLanguage` and `DEFAULT_LANGUAGE` instead.
- `i18n/index.ts` keeps `fallbackLng: "es"`. Switch it to `DEFAULT_LANGUAGE` only if that stays a one-line change.

- [ ] **Step 1:** Write the failing tests.
  - `languages.test.ts`:
    - `isSupportedLanguage` is true for `es`, `ca`, `eu` and `gl`, and false for `en`, `EU` and `""`.
    - `LANGUAGE_NATIVE_NAMES` has one entry per supported language: Castellano, Català, Euskara, Galego.
  - `localizedName.test.ts`, as `it.each` rows `[language, expected]` over `{ es: "San Sebastián", ca: "Donostia", eu: "Donostia" }`:
    - `es` gives "San Sebastián".
    - `ca` gives "Donostia".
    - `eu` gives "Donostia".
    - `gl`, which has no key, gives "San Sebastián".
  - `detectLanguage.test.ts`:
    - Change the row `[null, ["gl-ES"], "es"]` to `"gl"`.
    - Add the rows `[null, ["eu-ES"], "eu"]`, `[null, ["eu"], "eu"]`, `["gl", ["es-ES"], "gl"]` and `[null, ["en-GB", "gl-ES"], "gl"]`.
  - `route.test.ts`:
    - `#/eu`, `#/gl/...` and the about routes parse with the right language.
    - `#/en` returns null.
    - The `buildHash` round-trip holds for eu and gl.
- [ ] **Step 2:** Run `yarn vitest run src/i18n src/routing`. The tests should fail because the modules are missing or the assertions don't match.
- [ ] **Step 3:** Implement, then run `yarn test` (all green), `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit with the message `feat(web): centralise supported languages and add eu/gl routing and detection`, using explicit pathspecs.

### Task 2: Pipeline eu/gl names (labels, municipalities, constituencies, schema)

model: sonnet (agent `implementer`)

**Files:**
- Modify: `pipeline/src/elecciones_pipeline/labels.py`, `pipeline/src/elecciones_pipeline/municipalities.py`, `pipeline/src/elecciones_pipeline/constituencies.py`, `pipeline/src/elecciones_pipeline/build.py`, `pipeline/data/provinces.yaml`, `pipeline/data/island_constituencies.yaml` (only if an island gets a non-es form), `schemas/municipalities.schema.json`
- Tests: `pipeline/tests/test_labels.py`, `test_municipalities.py`, `test_constituencies.py`, `test_build.py`, `test_contract.py`, plus label fixtures as needed

**Interfaces:**
```python
HEADER = ["code", "es", "ca", "eu", "gl"]

@dataclass(frozen=True)
class MunicipalityLabels:
    es: str
    ca: str
    eu: str = ""
    gl: str = ""

def localized_names(official_name: str, labels: MunicipalityLabels | None) -> dict[str, str]
# returns {"es", "ca"} plus "eu"/"gl" only when they differ from es

@dataclass(frozen=True)
class Constituency:
    chamber: str
    id: str
    names: dict[str, str]   # replaces name_es/name_ca; same sparse rule
    seats: int
    max_marks: int
```

**Behaviour:**
- `SPARQL_QUERY` gains `?eu ?gl` with OPTIONAL label filters.
- `_parse_rows` reads `row.get("eu", "")` and `row.get("gl", "")`, so the current three-column vendor CSV still parses until Task 8 regenerates it. Labels are capitalised as today.
- `localized_names`:
  - es and ca are unchanged.
  - For bilingual names, `eu = _closest_part(parts, labels.eu) if labels.eu else es`, and likewise for gl.
  - For monolingual names, only es and ca are returned.
- `search_aliases` adds `labels.eu` and `labels.gl` to the candidates. It drops an alias only when that alias equals every displayed name (es, ca, and eu/gl with their es fallback).
- `needs_label_fallback` is unchanged; it stays es/ca-based.
- `constituencies.py` builds `names` from the YAML entry: `{"es": entry["es"], "ca": entry["ca"]}` plus `eu`/`gl` when the entry has them and they differ from es. `_index_province_names` also indexes `eu`/`gl` if present.
- `build.py`:
  - `_constituency_summary` emits `"name": constituency.names`.
  - `_label_warnings` checks every value in `entry["name"]` for a "/".
- `municipalities.schema.json`: `$defs.localizedName` gains optional `"eu"` and `"gl"` (`type: string`, `minLength: 1`). `required` stays `["es","ca"]` and `additionalProperties` stays false.

**Province table** (edit `provinces.yaml`; add only these eu/gl keys):

| INE | es (already in the YAML) | eu | gl |
|---|---|---|---|
| 01 | Araba/Álava | Araba | — |
| 06 | Badajoz | — | Badaxoz |
| 13 | Ciudad Real | — | Cidade Real |
| 17 | Girona | — | Xirona |
| 23 | Jaén | — | Xaén |
| 26 | La Rioja | Errioxa | A Rioxa |
| 31 | Navarra | Nafarroa | — |
| 35 | Las Palmas | — | As Palmas |
| 39 | Cantabria | Kantabria | — |

"—" means no key, so es is used. The es values of 15 A Coruña, 20 Gipuzkoa, 27 Lugo, 32 Ourense, 36 Pontevedra and 48 Bizkaia are already the official forms, so they get no eu/gl keys. Islands get no eu/gl keys unless open question 1 is answered.

- [ ] **Step 1:** Write the failing tests.
  - `test_labels.py`:
    - `normalize_labels_csv` writes five columns.
    - `read_labels` parses a CSV that lacks the eu/gl columns, giving `eu == ""`.
    - The SPARQL query requests eu and gl.
  - `test_municipalities.py`:
    - Extend the parametrized `test_localized_names` to expected dicts:
      - `Donostia/San Sebastián` with es label "San Sebastián" and eu/gl labels "Donostia" gives eu "Donostia" and gl "Donostia". Keep the current test's ca value.
      - A bilingual name with no eu/gl label gives no eu/gl keys.
      - A monolingual name gives only es and ca, even when the eu label is an exonym.
    - Alias test: an eu-only label shows up in the aliases.
  - `test_constituencies.py`:
    - Congreso 31 gives `{"es": "Navarra", "ca": <current>, "eu": "Nafarroa"}`.
    - Congreso 28 gives no eu/gl keys.
    - Senado islands give no eu/gl keys.
  - `test_build.py` / `test_contract.py`:
    - A built `municipalities.json` with eu names validates.
    - The schema rejects `{"es":"x","ca":"x","fr":"x"}` and `{"es":"x","ca":"x","eu":""}`.
- [ ] **Step 2:** Run `uv run pytest`. Only the new tests should fail.
- [ ] **Step 3:** Implement, then run `uv run pytest` (all green), `uv run black --check .` and `uv run isort --check-only .`. Do not run `refresh-labels` or `build` here; Task 8 does that.
- [ ] **Step 4:** Commit with the message `feat(pipeline): add sparse Basque and Galician place names`.

### Task 3: Language menu replaces the toggle

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/shell/LanguageMenu.tsx`, `web/src/shell/LanguageMenu.test.tsx`
- Delete: `web/src/shell/LanguageToggle.tsx`, along with its test if one exists
- Modify: `web/src/shell/Header.tsx`, `web/src/shell/Header.test.tsx`, `web/src/App.test.tsx`, `web/src/i18n/locales/es/common.json`, `web/src/i18n/locales/ca/common.json` (remove the unused `language` block)

**Interface:** `export function LanguageMenu(props: { active: Language; onChange: (language: Language) => void })`. It has the same props as `LanguageToggle`, so `Header.tsx` only swaps the import and the element.

- [ ] **Step 1:** Write the failing tests, following the `ThemeMenu.test.tsx` style.
  - `LanguageMenu.test.tsx`:
    - The button is named "Idioma: Castellano" and shows "ES".
    - Opening it lists four `menuitem`s named Castellano, Català, Euskara and Galego, each with the matching `lang` attribute.
    - The current choice is marked.
    - Clicking Euskara calls `onChange("eu")`.
    - The keyboard sequence `{Enter}{ArrowDown}{Enter}` selects Català and returns focus to the button.
  - `Header.test.tsx`: replace the group and `aria-pressed` tests. The test now finds the "Idioma: Castellano" button, opens it, picks Català and expects `onLanguageChange("ca")`.
  - `App.test.tsx`:
    - In the `ca-ES` detection test, replace "click button ca" with opening the language menu and picking Català. It still expects `localStorage["eg26.lang"] === "ca"` and `document.documentElement.lang === "ca"`.
    - Add one row that picks Galego and expects `gl`.
- [ ] **Step 2:** Run `yarn vitest run src/shell src/App.test.tsx`. The tests should fail because `LanguageMenu` is missing.
- [ ] **Step 3:** Implement it by copying the ThemeMenu structure. Then check that the header row does not wrap at 375 px. In code this means the button has no extra width classes beyond `BUTTON_CLASSES` and `min-w-11`; the main session checks the real layout in the browser.
- [ ] **Step 4:** Run `yarn test`, `yarn build`, `yarn format:check` and `yarn lint`, then commit with the message `feat(web): replace language toggle with a four-language menu`. Include the deleted file in the pathspec.

### Task 4: Read sparse names through `localizedName`

model: sonnet (agent `implementer`)

**Files:** modify `web/src/shell/useDocumentTitle.ts` (line ~12), `web/src/constituency/ConstituencyView.tsx` (lines ~32-33), `web/src/search/MunicipalitySearch.tsx` (lines ~38 and 72), and their tests.

- [ ] **Step 1:** Add the failing tests.
  - The tests use a fixture municipality whose name is `{es:"San Sebastián", ca:"Donostia", eu:"Donostia"}`.
  - In `eu`, each consumer shows "Donostia".
  - In `gl`, where the fixture has no `gl` key, each consumer shows the es name and never `undefined`.
  - Switch the language with `i18next.changeLanguage` and reset it to `es` in `afterEach`.
- [ ] **Step 2:** Run the three test files. They should fail, with `undefined` showing up in the title or label.
- [ ] **Step 3:** Replace every `name[language]` with `localizedName(name, language)`, then grep for any other `.name[` reads with `grep -rn "name\[" web/src --include='*.tsx' --include='*.ts'`. `createMunicipalitySearch` (`Object.values`) already works with sparse names; leave it as is.
- [ ] **Step 4:** Run `yarn test`, `yarn build`, `yarn format:check` and `yarn lint`, then commit with the message `fix(web): fall back to Spanish names for languages without a localized form`.

### Task 5: Wikipedia eu/gl and the fallback chain

model: sonnet (agent `implementer`)

**Files:**
- Pipeline: `pipeline/src/elecciones_pipeline/parties.py`, `pipeline/tests/test_parties.py`, `pipeline/tests/fixtures/parties.yaml`, `schemas/parties.schema.json`
- Web: `web/src/contract/types.ts`, `web/src/test/fixtures.ts`, `web/src/party/PartyLinks.tsx`, `web/src/party/PartyLinks.test.tsx`

**Behaviour:**
- `PartyEntry` gains `wikipedia_eu` and `wikipedia_gl`, read with `wikipedia.get(...)`. `_party_json` always emits all four keys.
- In the schema, `wikipedia.required` becomes `["es","ca","eu","gl"]`, all of them `nullableUrl`.
- In the web types, `PartyProfile.wikipedia` becomes `Record<Language, string | null>`, and the fixtures add `eu: null, gl: null`.
- `PartyLinks.tsx` replaces `otherLanguage` with:
  ```ts
  const WIKIPEDIA_FALLBACKS: Record<Language, readonly Language[]> = {
    es: ["es", "ca"],
    ca: ["ca", "es"],
    eu: ["eu", "es"],
    gl: ["gl", "es"],
  };
  ```
  It then picks the first non-null URL.
- `pipeline/data/parties.yaml` is not edited here (see Open questions).

- [ ] **Step 1:** Write the failing tests.
  - `test_parties.py`: update the expected wikipedia to `{"es": None, "ca": None, "eu": None, "gl": None}`, and add a case where a fixture eu URL passes through.
  - `test_contract.py`, or the existing parties schema test: a document missing `eu` is rejected.
  - `PartyLinks.test.tsx`, as `it.each` rows `[language, wikipedia, expectedHref]`:
    - eu with only es set gives the es URL.
    - gl with gl set gives the gl URL.
    - eu with only ca set gives no link.
    - ca with only es set gives the es URL.
- [ ] **Step 2:** Run `uv run pytest tests/test_parties.py` and `yarn vitest run src/party`. Both should fail.
- [ ] **Step 3:** Implement. Then run both full suites, plus black and isort, plus `yarn build`, `yarn format:check` and `yarn lint`. Do not regenerate `web/public/data` here; Task 8 does that. Until then, `parties.json` lacks eu/gl, which is fine at runtime because the chain falls back to es.
- [ ] **Step 4:** Commit with the message `feat: add eu/gl Wikipedia links with Spanish fallback`.

### Task 6: Machine-translation notice

model: sonnet (agent `implementer`)

**Files:**
- Create: `web/src/shell/MachineTranslationNotice.tsx`, `web/src/shell/MachineTranslationNotice.test.tsx`
- Modify: `web/src/shell/Footer.tsx`, `web/src/shell/Footer.test.tsx` (create it if missing), `web/src/i18n/locales/es/shell.json`, `web/src/i18n/locales/ca/shell.json`

**Interfaces:**
```ts
const MACHINE_TRANSLATED_LANGUAGES: ReadonlySet<Language> = new Set(["eu", "gl"]);
export function translationIssueUrl(issue: { title: string; body: string }): string; // `${ISSUES_URL}?${new URLSearchParams(issue)}`
export function MachineTranslationNotice(props: { language: Language });         // renders null for es/ca
```

**Behaviour:**
- The notice is one muted `text-sm` line in `Footer`, rendered above the neutrality text. It reads "{notice} {link}", for example "Machine translation. Report an error".
- The link is an `ExternalLink` to `translationIssueUrl({ title: t("machineTranslation.issueTitle", { language }), body: t("machineTranslation.issueBody", { language, page: window.location.href }) })`, with an `inline-flex min-h-11` tap target.
- New keys go in ns `shell` under `machineTranslation`: `notice`, `report`, `issueTitle` and `issueBody`.
  - Add them to es and ca too, in Spanish and Catalan, because the parity test requires identical keys. Those values are never shown.
  - Task 9 writes the eu/gl values.

- [ ] **Step 1:** Write the failing tests.
  - `translationIssueUrl({title:"[eu] Itzulpen akatsa", body:"a&b\nc"})` starts with `ISSUES_URL + "?"` and round-trips through `new URL(...).searchParams`.
  - For `it.each(["eu","gl"])`, the notice renders a link whose `href` starts with `ISSUES_URL` and contains `title=`, and which has `target="_blank"`.
  - For `it.each(["es","ca"])`, nothing renders.
  - `Footer` passes `language` through to the notice.
- [ ] **Step 2:** Run `yarn vitest run src/shell`. The tests should fail. The eu/gl locales don't exist yet, so the text falls back to es; assert on the link and its `href`, not the wording.
- [ ] **Step 3:** Implement, then run `yarn test`. The `ExternalLink` guard test must stay green. Also run `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] **Step 4:** Commit with the message `feat(web): add machine-translation notice with issue link for eu/gl`.

### Task 7: Meta tags and docs

model: haiku (agent `chore`)

**Files:** `web/index.html`, `README.md`, `docs/spec.md`

- [ ] **Step 1:** In `web/index.html`, add `<meta property="og:locale:alternate" content="eu_ES" />` and `<meta property="og:locale:alternate" content="gl_ES" />` next to the existing `ca_ES` alternate. Leave `<html lang="es">` and `og:locale es_ES` unchanged.
- [ ] **Step 2:** Run `grep -n -i "catal\|es/ca\|castellano\|two languages\|dos idiomas" README.md docs/spec.md`. Update each statement about the supported languages so it lists es, ca, eu and gl, and mentions that eu/gl are machine-translated with an issue link. Do not touch other plan files.
- [ ] **Step 3:** Run `yarn build` from `web/`; it must succeed.
- [ ] **Step 4:** Commit with the message `docs: announce Basque and Galician support`.

### Task 8: Regenerate labels and published data

model: haiku (agent `chore`)

**Files:** `pipeline/data/vendor/wikidata_municipality_labels.csv`, `web/public/data/**`

- [ ] **Step 1:** Record the baseline: `gzip -c web/public/data/municipalities.json | wc -c`. Expect about 125,293.
- [ ] **Step 2:** From `pipeline/`, run `uv run elecciones refresh-labels`. This queries Wikidata over the network. Then check the result:
  - The header is `code,es,ca,eu,gl`.
  - The row count is still about 8,166.
  - Run `git diff --stat` on the CSV.
  - Count the rows whose es or ca values changed. If any did, report them verbatim and continue (see Open questions).
- [ ] **Step 3:** Run `uv run elecciones build`, then `uv run pytest`. Report any label warnings it prints.
- [ ] **Step 4:** Measure the new gzip size of `municipalities.json`. If it grew by more than 5 %, stop and report BLOCKED without committing. Otherwise, spot-check these entries with `jq`, using the codes from the JSON:
  - Donostia/San Sebastián has eu "Donostia".
  - Vitoria-Gasteiz has eu "Gasteiz" if INE lists it as bilingual.
  - A Coruña has no eu/gl key.
  - The Navarra constituency has eu "Nafarroa".
- [ ] **Step 5:** From `web/`, run `yarn test`.
- [ ] **Step 6:** Commit with the message `chore(data): regenerate labels and data with eu/gl names`, using the explicit pathspecs `pipeline/data/vendor/wikidata_municipality_labels.csv web/public/data`.

### Task 9: Basque and Galician translations (runs last)

model: sonnet (agent `implementer`)

**Precondition:** Tasks 1–8 are committed, and `docs/plan-results-2023.md` is fully merged, so `results2023.json` exists in es and ca.

**Files:**
- Modify: `web/src/i18n/localeParity.test.ts`, `web/src/App.test.tsx`
- Create: `web/src/i18n/locales/eu/*.json` and `web/src/i18n/locales/gl/*.json`, one file per es namespace. Today those are about, candidacies, common, constituency, home, party, search, shell and theme, plus results2023.

- [ ] **Step 1:** Generalise `localeParity.test.ts`, which is the red step.
  - For `it.each(SUPPORTED_LANGUAGES.filter((language) => language !== DEFAULT_LANGUAGE))`:
    - The locale's set of files equals the es set: none missing and none extra.
    - Each file has exactly the es key set, flattened.
  - Over every locale:
    - No value is empty.
    - Every `{{placeholder}}` and `<tag>` in an es value also appears in the matching value.
    - No value in eu or gl is identical to its es counterpart, except for an explicit `IDENTICAL_ALLOWED` list of keys. That list covers proper nouns, URLs and code-like strings.
  - Run `yarn vitest run src/i18n/localeParity.test.ts`. It should fail for eu and gl, because the files are missing.
- [ ] **Step 2:** Write every eu and gl file by translating the es file yourself, with no external services, and using ca as a second reference.
  - Use standard Batua for Basque and RAG norms for Galician.
  - Translate the dates into each language's own form, for example "domingo 29 de noviembre" becomes "azaroaren 29a, igandea" in eu and "domingo 29 de novembro" in gl.
  - Use the existing UI terms consistently: "Hautagaitzak" / "Candidaturas" for candidacies, and keep Congreso and Senado.
  - Write `shell.machineTranslation.*` in the target language. The `issueTitle` should start with `[eu]` or `[gl]`.
  - Keep the `_one`/`_other` suffixes.
- [ ] **Step 3:** Smoke test: in `App.test.tsx`, add one row that renders the home page in `eu` and one in `gl`, each asserting that a known translated heading is present. This proves the glob picks up the new directories.
- [ ] **Step 4:** Run `yarn test` (all green), `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] **Step 5:** Commit with the message `feat(i18n): add Basque and Galician translations`, using the pathspecs `web/src/i18n/locales/eu web/src/i18n/locales/gl web/src/i18n/localeParity.test.ts web/src/App.test.tsx`.

### Task 10: Full verification and push

model: haiku (agent `chore`)

- [ ] **Step 1:** Web: from `web/`, run `yarn test`, `yarn build`, `yarn format:check` and `yarn lint`.
- [ ] **Step 2:** Pipeline: from `pipeline/`, run `uv run pytest`, `uv run black --check .` and `uv run isort --check-only .`.
- [ ] **Step 3:** Report the test counts. Both must be at or above the baseline of 278 web and 312 pipeline tests.
- [ ] **Step 4:** `git status` must be clean apart from untracked files that existed before this plan. Then check that every commit from this plan carries the trailer and a good signature, using `git log --show-signature`.
- [ ] **Step 5:** Run `git push git@github.com:alhuelamo/elecciones-generales-2026.git main`. Never force-push. If the push is rejected, stop and report.

### Browser verification (main session, not an agent)

At 375 px and on desktop, in both light and dark themes, check that:
- The header does not wrap, and the menu opens, works by keyboard and changes `<html lang>`.
- `#/eu` and `#/gl` load directly, and `navigator.language = eu-ES` lands on eu.
- In eu, Donostia shows as "Donostia" in search and the constituency view.
- The machine-translation notice shows in eu and gl only, and opens a prefilled issue.
- A party with only an es Wikipedia link shows that link in eu and gl.

## Open questions

1. **Exonym table.** Is the province table in Task 2 acceptable? It uses eu Araba, Errioxa, Nafarroa and Kantabria, and gl Badaxoz, Cidade Real, Xirona, Xaén, A Rioxa and As Palmas. Everything else stays es. Two groups are left out as uncertain:
   - Basque adapted forms of other provinces, such as Avila, Kordoba, Zaragoza and Gaztela.
   - Galician island names with articles, such as A Palma, A Gomera and O Hierro.

   Both stay es unless you approve them.
2. **Wikipedia eu/gl URLs.** May an agent verify them over the network, using Wikidata sitelinks or an HTTP 200 check, and fill them into `pipeline/data/parties.yaml`? The default leaves them `null` and relies on the es fallback.
3. **Wikidata label refresh.** Task 8's `refresh-labels` call is a network call, and it may also change existing es/ca labels, which can flip the es/ca choice for some bilingual municipalities. Should Task 8 accept that drift, or keep the old es/ca columns and add only eu/gl? The default accepts the drift and reports it.
4. **Notice placement.** The notice goes in the footer by default. Should it instead be a slim line under the header, so it is visible without scrolling?

## Decisions (approved 2026-11-22)

1. Province names approved as listed (eu: Araba, Errioxa, Nafarroa, Kantabria; gl: Badaxoz, Cidade Real, Xirona, Xaén, A Rioxa, As Palmas). Islands and all other provinces stay es.
2. Agents may look up eu/gl party Wikipedia URLs (plain public reads of es/eu/gl.wikipedia.org) and add only verified, existing ones; es fallback otherwise.
3. refresh-labels may change existing es/ca municipality labels, but the agent must list every es/ca change for review before committing.
4. The machine-translation notice is a slim line under the header (eu/gl only), not in the footer.
