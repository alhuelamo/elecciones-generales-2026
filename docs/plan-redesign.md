# Ballot-Paper Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the live site with a neutral "ballot paper" civic look with an editorial touch: paper/ink tokens, Fraunces + Atkinson Hyperlegible Next, a compact header, a new home hero with a countdown, ruled candidacy listings and ballot-replica party pages. All existing behavior is kept.

**Architecture:** Task 1 lays the foundation. Design tokens are Tailwind v4 `@theme` CSS variables in `web/src/index.css`, with `.dark` overrides, self-hosted fonts and a few shared design primitives in `web/src/design/`. Every later task consumes those tokens through utilities (`bg-paper`, `text-ink`, `border-rule`, `text-accent`, `bg-kraft`, `font-display`). Each later task owns one feature folder, so wave 1 runs fully in parallel.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4 (`.dark` class variant), Headless UI 2, react-i18next (es/ca), Vitest + Testing Library, yarn 4 (corepack), `@fontsource-variable/fraunces`, `@fontsource-variable/atkinson-hyperlegible-next`.

**Spec:** the agreed design is copied verbatim into the Global Constraints below. The base product spec is `docs/spec.md`, and the original build plan is `docs/plan.md`.

## Global Constraints

- **Out of bounds:** other agents are editing `pipeline/**`, `web/public/logos/**` and `web/public/data/**`, so the redesign must not touch those paths.
- **Dependencies:** only Task 1 may add dependencies or edit `web/package.json` / `web/yarn.lock`. If a later task truly needs a dependency, it stops and reports.
- **Look:** a "ballot paper" civic look with an editorial touch, kept neutral. No party colors anywhere in the chrome.
- **Fonts:**
  - Fraunces for headings (`font-display`).
  - Atkinson Hyperlegible Next for everything else (`font-sans`).
  - All numbers use `tabular-nums`.
  - Self-hosted via `@fontsource-variable`, never a Google CDN.
  - Variable weights only, and only the latin + latin-ext subsets.
- **Palette:** colors only through the tokens Task 1 defines (no raw `gray-*`, `blue-*` or `amber-*` utilities remain in `web/src`).
  - Light mode: paper `#FAF7F0`, ink `#1B1B1F`, fine graphite rules.
  - Dark mode: background `#16151A`, off-white text.
  - One accent, kraft/sepia (base `#B07A3A`), tuned per mode to WCAG AA. Use it sparingly: links, the focus ring, the active tab and `::selection`.
- **Chamber surfaces:** Congreso is a white-paper card with a fine border. Senado is a kraft-tinted card.
- **Badges and logos:**
  - Acronym badges are monochrome ink-on-paper. Keep the truncation, the initials fallback and the `onError` fallback.
  - Real logos keep their white plate.
- **Motion:** short transitions (≤150ms) on hover, focus and tab changes only. Everything is disabled under `prefers-reduced-motion: reduce`.
- **i18n:**
  - One language is visible at a time.
  - Every new string goes in both es and ca. "ns X" means `web/src/i18n/locales/{es,ca}/X.json`.
  - `src/i18n/localeParity.test.ts` must pass. It auto-detects new namespaces.
- **Mobile-first, with 375px as the hard target:**
  - No horizontal scroll.
  - Tap targets ≥44px (`min-h-11 min-w-11`).
  - The header never wraps.
- **Behavior and tests:**
  - Existing behavior stays, and existing tests stay green. Change a test only where its markup legitimately changes, and say why in the commit body.
  - App tests pin the clock with `vi.setSystemTime`.
- **Code style:**
  - TDD wherever behavior changes.
  - Descriptive names and no comments in code.
  - Prettier defaults: `yarn format:check` must pass.
  - `yarn lint` (oxlint) must be clean.
- **Commands** (run from `web/`): `yarn test`, `yarn build` (`tsc -b && vite build`), `yarn format:check`, `yarn lint`.

## Review Focus

1. **The 375px header** (wordmark, `ES | CA` control and theme menu in one row of at most 56px, with every control ≥44px) must not wrap or overflow in either language. Task 2 tests the classes; Task 12 checks it in a browser.
2. **Contrast:** each token pair must pass AA in both modes (ink, ink-muted and accent on paper, raised paper and kraft) and the focus ring must reach 3:1. A tweaked hex can silently drop below. Task 1 `tokens.test.ts` parses `index.css`.
3. **Countdown day boundaries in Europe/Madrid:** at 23:30 Madrid on 28 Nov the countdown says 1 day, not 0. A browser in another timezone gets the same answer. "Hoy se vota" starts at 00:00 on the 29th. Task 4 `daysUntilElection.test.ts`.
4. **The theme menu** must stay keyboard operable (Enter/Arrow/Escape). Choosing an item must persist `eg26.theme` and apply `.dark`, and "Sistema" must follow `matchMedia` changes. Task 2 tests.
5. **No stray old styling:** no old `gray-*`, `blue-*` or `amber-*` utilities and no second `<main>` remain. Task 11 greps for them, and Task 9 switches `<main>` to `<article>`.

---

## Execution waves and file ownership

Parallel tasks within a wave touch disjoint files. Run each parallel task in its own git worktree/branch; merge in task-number order.

| Wave | Tasks (parallel) | Owns |
|---|---|---|
| 0 | T1 | `web/package.json`, `web/yarn.lock`, `web/src/main.tsx`, `web/src/index.css`, `web/src/design/**`, `web/src/candidacies/badgeColor.ts` (import swap only), `web/src/App.tsx` (root `div` className only) |
| 1 | T2 · T3 · T4 · T5 · T6 · T7 · T8 · T9 · T10 | T2: `shell/Header.tsx`, `shell/Header.test.tsx`, `shell/LanguageToggle.tsx`, `theme/**`, ns `theme` · T3: `shell/Footer.tsx`, `shell/Footer.test.tsx`, `shell/DemoBanner.tsx`, `shell/ElectionBanner.tsx`, `shell/ElectionBanner.test.tsx` · T4: `App.tsx`, `App.test.tsx`, `home/**`, `shell/electionPhase.ts`, `shell/electionPhase.test.ts`, ns `home`, ns `shell` · T5: `search/**` · T6: `candidacies/**`, ns `candidacies` · T7: `constituency/**`, ns `constituency` · T8: `party/**`, ns `party` · T9: `about/**`, ns `about` · T10: `web/index.html` |
| 2 | T11 | integration fixes anywhere in `web/src/**` and `web/index.html` |
| 3 | T12 (orchestrator, browser) | nothing |

Paths without a prefix are relative to `web/src/`. Tests live next to their sources as `*.test.ts(x)`.

**Wave-1 contract for ns `shell`:** T4 removes `home.*` from ns `shell`. T2 and T3 must not edit ns `shell`. They reuse the existing keys (`appTitle` in `common`, `language.label`, `navigation`, `footer.*`, `electionBanner.*`, `demoBanner`).

---

### Task 1: Design foundation (deps, fonts, tokens, primitives)

model: sonnet (agent `implementer`)

**Files:**
- Modify: `web/package.json`, `web/yarn.lock`, `web/src/main.tsx`, `web/src/index.css`, `web/src/App.tsx` (root `div` className only), `web/src/candidacies/badgeColor.ts` (import `contrastRatio` from `../design/contrast`, delete the local copy)
- Create: `design/contrast.ts`, `design/chamberSurface.ts`, `design/Envelope.tsx`
- Test: `design/contrast.test.ts`, `design/tokens.test.ts`, `design/Envelope.test.tsx`

**Interfaces:**
- Produces these token utilities, each backed by a `--color-*` / `--font-*` variable in `@theme`, with `.dark { … }` overrides:
  - Colors: `paper`, `paper-raised`, `ink`, `ink-muted`, `rule`, `rule-strong`, `accent`, `kraft`, `kraft-rule`
  - Fonts: `font-display`, `font-sans`
- Produces these functions and constants:
```ts
export function contrastRatio(foregroundHex: string, backgroundHex: string): number;
export const CHAMBER_SURFACE_CLASSES: Record<Chamber, string>;
export function Envelope(props: { chamber: Chamber; className?: string }): JSX.Element;
```
- `CHAMBER_SURFACE_CLASSES`:
  - congreso: `"bg-paper-raised border border-rule rounded-sm"`
  - senado: `"bg-kraft border border-kraft-rule rounded-sm"`
- `Envelope` is an inline SVG with `aria-hidden="true"`, `data-chamber={chamber}` and a flap stroke. It is filled `fill-paper-raised` for Congreso and `fill-kraft` for Senado, with a `stroke-rule-strong` outline.

- [ ] **Step 1: Add dependencies**
  - Run `cd web && yarn add @fontsource-variable/fraunces @fontsource-variable/atkinson-hyperlegible-next`.
  - Inspect `node_modules/@fontsource-variable/*/`. If per-subset CSS exists (e.g. `latin-wght.css`, `latin-ext-wght.css`), import only those in `main.tsx`. Otherwise import `wght.css`; its unicode-range means browsers only download latin/latin-ext.
  - Family names: `"Fraunces Variable"` and `"Atkinson Hyperlegible Next Variable"`.
- [ ] **Step 2: Write the failing tests**
```ts
expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
```
`tokens.test.ts`:
- Import `../index.css?raw` and parse `--color-<name>: #rrggbb;` separately from the `@theme` block and from the `.dark` block.
- `it.each` over modes `light` and `dark` and pairs `[ink,paper] [ink-muted,paper] [ink,paper-raised] [accent,paper] [accent,paper-raised] [ink,kraft] [accent,kraft] [ink-muted,kraft]` → `toBeGreaterThanOrEqual(4.5)`.
- `[accent,paper]` must also reach ≥3 (focus ring).

`Envelope.test.tsx`: renders `container.querySelector('svg[aria-hidden="true"][data-chamber="senado"]')` non-null.
- [ ] **Step 3: Run** `yarn vitest run src/design` → FAIL (missing modules/tokens).
- [ ] **Step 4: Implement `index.css`**
  - Starting values (tune until the tests pass):
    - Light: paper `#FAF7F0`, paper-raised `#FFFFFF`, ink `#1B1B1F`, ink-muted `#55535C`, rule `#D9D4C7`, rule-strong `#8C877C`, accent `#8A5A22` (the darker, AA-safe version of `#B07A3A`), kraft `#EFE3CC`, kraft-rule `#C9B48E`.
    - Dark: paper `#16151A`, paper-raised `#1F1E24`, ink `#F2EEE6`, ink-muted `#B8B3A9`, rule `#34323A`, rule-strong `#6B6760`, accent `#D9A86A`, kraft `#2A2319`, kraft-rule `#5A4A33`.
    - Use hex values only, so the test can parse them.
  - Global rules:
    - `html` gets `bg-paper text-ink font-sans antialiased`, plus a paper texture: an SVG `feTurbulence` data URI as `background-image`, opacity ~0.03 in light and ~0.015 in dark.
    - `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`.
    - `::selection` uses an accent background and paper text.
    - `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0s !important; animation: none !important } }`.
  - `App.tsx` root `div`: `flex min-h-screen flex-col bg-paper text-ink`.
- [ ] **Step 5: Run** `yarn vitest run` → all PASS (badgeColor tests are still green after the import swap).
- [ ] **Step 6: Verify** with `yarn build && yarn format:check && yarn lint`. Then run `ls dist/assets/*.woff2`: it shows only Fraunces/Atkinson files. If Step 1 found per-subset CSS, only latin and latin-ext files appear.
- [ ] **Step 7: Commit** `git commit -m "feat(design): add paper/ink tokens, self-hosted fonts and design primitives"`

---

### Task 2: Compact header, language segmented control, theme menu

model: sonnet (agent `implementer`)

**Files:**
- Modify: `shell/Header.tsx`, `shell/LanguageToggle.tsx`, `theme/themePreference.ts` (delete `nextThemePreference`), `theme/themePreference.test.ts` (drop its cases), ns `theme`
- Create: `theme/ThemeMenu.tsx`
- Delete: `theme/ThemeToggle.tsx`, `theme/ThemeToggle.test.tsx`
- Test: `shell/Header.test.tsx`, `theme/ThemeMenu.test.tsx`

**Interfaces:**
- Consumes the tokens from T1. It also reuses `loadThemePreference`, `saveThemePreference`, `resolveTheme` and `applyTheme` from `theme/themePreference.ts`, along with the existing `matchMedia` subscription logic in ThemeToggle.
- Produces `export function ThemeMenu(): JSX.Element`. `Header(props: { language: Language; onLanguageChange: (language: Language) => void })` keeps its signature unchanged.
- ns `theme` replaces `toggle.*` with these keys:

| Key | es | ca |
|---|---|---|
| `menu.label` | `Tema: {{choice}}` | `Tema: {{choice}}` |
| `choice.system` | `Sistema` | `Sistema` |
| `choice.light` | `Claro` | `Clar` |
| `choice.dark` | `Oscuro` | `Fosc` |

- [ ] **Step 1: Write the failing tests** in `Header.test.tsx`. Render the header with i18n at `es`, then assert:
  - `getByRole("banner")` has classes `sticky top-0 h-14`, and its row has `flex-nowrap`.
  - `getByRole("link", { name: "Elecciones generales 2026" })` has href `#/es`.
    - The "29·N" wordmark (`font-display`, middle dot `text-accent`) is `aria-hidden`.
    - The title text is `sr-only sm:not-sr-only`, so the accessible name stays `common:appTitle`.
  - `queryByRole("link", { name: "Acerca de" })` is null.
  - `getByRole("button", { name: "es" })` has `aria-pressed="true"`, and `"ca"` has `"false"`.
    - Clicking `ca` calls `onLanguageChange("ca")`.
    - Both buttons have `min-h-11 min-w-11`. The text is lowercase in the DOM and `uppercase` comes from CSS. They are wrapped in a `role="group"` named `shell:language.label`.
- [ ] **Step 2: Write the failing tests** in `ThemeMenu.test.tsx`. Reuse the `mockMatchMedia` helper from the old ThemeToggle test and assert:
  - The button is named "Tema: Sistema" by default.
  - Click → `getAllByRole("menuitem")` names are `["Sistema","Claro","Oscuro"]`.
  - Clicking "Oscuro" → `document.documentElement` has class `dark`, `localStorage["eg26.theme"] === "dark"` and the button is named "Tema: Oscuro".
  - With the "Sistema" preference, `change(true)` adds `dark` and `change(false)` removes it.
  - Keyboard: focus the button, press `{Enter}` then `{ArrowDown}` then `{Enter}` (user-event) → the preference changes and focus returns to the button.
  - The current choice shows a `✓` glyph with `aria-hidden`.
- [ ] **Step 3: Run** `yarn vitest run src/shell/Header src/theme` → FAIL.
- [ ] **Step 4: Implement**
  - `ThemeMenu`:
    - Uses Headless UI `Menu`/`MenuButton`/`MenuItems`/`MenuItem`, without the `anchor` prop: items are positioned with `absolute right-0`.
    - The button is `◐` (aria-hidden) with `aria-label` = `t("menu.label",{choice})`, sized `min-h-11 min-w-11`.
    - Items are `min-h-11` with `data-focus:bg-kraft`.
    - Keep `role="menuitem"`. Add `aria-checked` only if the keyboard test stays green.
  - `Header`:
    - A single row, `max-w-3xl mx-auto h-14 px-4 flex items-center justify-between flex-nowrap gap-2`.
    - `sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-rule`.
    - The nav (`aria-label` `shell:navigation`) holds `LanguageToggle` and `ThemeMenu`.
    - `transition-colors duration-150` on interactive elements.
- [ ] **Step 5: Run** `yarn vitest run` → PASS. Then `yarn build && yarn format:check && yarn lint`.
- [ ] **Step 6: Commit** `git commit -m "feat(shell): compact sticky header with 29·N wordmark, ES|CA control and theme menu"`

---

### Task 3: Footer and banners restyle

model: haiku (agent `chore`)

**Files:**
- Modify: `shell/Footer.tsx`, `shell/DemoBanner.tsx`, `shell/ElectionBanner.tsx`
- Test: `shell/Footer.test.tsx`, `shell/ElectionBanner.test.tsx` (class assertions only if present)

**Interfaces:**
- Consumes the T1 tokens. Component signatures and text are unchanged. The Footer already contains the "Acerca de" link, which is now its only home.

- [ ] **Step 1: Restyle Footer**
  - Swap the classes to tokens: `border-t border-rule`, `text-ink-muted`, links `text-accent underline underline-offset-2`.
  - Every link becomes `inline-flex min-h-11 items-center`.
- [ ] **Step 2: Restyle ElectionBanner and DemoBanner** as a ruled strip: `bg-kraft text-ink border-b border-kraft-rule`, with the results link in `text-accent underline`. The results link keeps `min-h-11`.
- [ ] **Step 3: Run** `yarn vitest run src/shell && yarn format:check && yarn lint` → PASS. `grep -nE "(gray|blue|amber)-[0-9]" src/shell/{Footer,DemoBanner,ElectionBanner}.tsx` → no output.
- [ ] **Step 4: Commit** `git commit -m "style(shell): token-based footer and banners"`

---

### Task 4: Home page with hero, countdown and voting cards

model: sonnet (agent `implementer`)

**Files:**
- Create: `home/HomePage.tsx`, `home/ElectionCountdown.tsx`, `home/daysUntilElection.ts`, `home/HowToVoteCard.tsx`, ns `home`
- Modify:
  - `App.tsx`: delete the inline `HomePage`, import it from `home/`, restyle `NoticeMessage` with tokens.
  - `App.test.tsx`.
  - `shell/electionPhase.ts`: export `ELECTION_DAY_START`.
  - ns `shell`: remove `home.*`.
- Test: `home/HomePage.test.tsx`, `home/ElectionCountdown.test.tsx`, `home/daysUntilElection.test.ts`

**Interfaces:**
- Consumes:
  - `electionPhase(now: Date): ElectionPhase` and `ELECTION_DAY_START`.
  - `Envelope` and `CHAMBER_SURFACE_CLASSES` (T1).
  - `WhereToVote()` (unchanged, T7).
  - `MunicipalitySearch({ index, onSelect })` (unchanged, T5).
- Produces:
```ts
export function daysUntilElection(now: Date): number;
export function ElectionCountdown(props: { now?: () => Date }): JSX.Element | null;
export function HomePage(props: { language: Language; data: BallotData; navigate: (route: Route) => void }): JSX.Element;
```
- ns `home`:

| Key | es | ca |
|---|---|---|
| `title` | `¿Qué hay en tu papeleta?` | `Què hi ha a la teva papereta?` |
| `subtitle` | `Busca tu municipio y consulta las candidaturas al Congreso y al Senado del 29 de noviembre.` | `Cerca el teu municipi i consulta les candidatures al Congrés i al Senat del 29 de novembre.` |
| `countdown.before_one` | `Falta 1 día · domingo 29 de noviembre` | `Falta 1 dia · diumenge 29 de novembre` |
| `countdown.before_other` | `Faltan {{count}} días · domingo 29 de noviembre` | `Falten {{count}} dies · diumenge 29 de novembre` |
| `countdown.electionDay` | `Hoy se vota` | `Avui es vota` |
| `cards.whereToVote` | `Dónde votar` | `On votar` |
| `cards.howToVote` | `Cómo se vota` | `Com es vota` |
| `cards.congreso` | `Congreso: papeleta y sobre blancos. Eliges una candidatura.` | `Congrés: papereta i sobre blancs. Tries una candidatura.` |
| `cards.senado` | `Senado: papeleta y sobre sepia. Marcas candidatos con una cruz.` | `Senat: papereta i sobre sèpia. Marques candidats amb una creu.` |

- [ ] **Step 1: Write the failing tests** in `daysUntilElection.test.ts`. Days are counted as calendar days in Europe/Madrid:
```ts
it.each([
  ["2026-11-21T12:00:00+01:00", 8],
  ["2026-11-28T23:30:00+01:00", 1],
  ["2026-11-28T00:05:00+01:00", 1],
  ["2026-11-27T23:59:00+01:00", 2],
  ["2026-11-28T23:30:00-05:00", 0],
])("%s → %d", (iso, days) => expect(daysUntilElection(new Date(iso))).toBe(days));
```
- [ ] **Step 2: Write the failing tests** in `ElectionCountdown.test.tsx`, with i18n at `es`:
  - `now` = 21 Nov 12:00 → text "Faltan 8 días · domingo 29 de noviembre".
  - 28 Nov 12:00 → "Falta 1 día · domingo 29 de noviembre".
  - 29 Nov 10:00 → "Hoy se vota".
  - 29 Nov 21:00 → renders nothing.
  - The number is wrapped in `tabular-nums`.
- [ ] **Step 3: Write the failing tests** in `HomePage.test.tsx`, with fixture data:
  - h1 "¿Qué hay en tu papeleta?" has `font-display`.
  - `combobox` has focus.
  - `getByRole("heading",{name:"Dónde votar"})` and `getByRole("heading",{name:"Cómo se vota"})` render.
  - Two envelope SVGs with `data-chamber` `congreso`/`senado` are present.
  - Selecting "Barcelona" calls `navigate` with `{page:"ballot",language:"es",municipalityCode:"08019",chamber:"congreso",partySlug:null}`.
- [ ] **Step 4: Update `App.test.tsx`**
  - Add `beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-21T12:00:00+01:00")); })` and `afterEach(() => vi.useRealTimers())`.
  - Change the heading "Encuentra tu municipio" → "¿Qué hay en tu papeleta?".
  - Change the "Troba el teu municipi" expectation → "Què hi ha a la teva papereta?".
  - Rename the about test to say the link now comes from the footer. `getByRole("link",{name:"Acerca de"})` is now unique.
- [ ] **Step 5: Run** `yarn vitest run src/home src/App.test.tsx` → FAIL.
- [ ] **Step 6: Implement**
  - `daysUntilElection`:
    - Read `year`/`month`/`day` with `Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts`.
    - Return `(Date.UTC(2026,10,29) - Date.UTC(y,m-1,d)) / 86_400_000`.
  - `ElectionCountdown`:
    - Uses the same 60_000 ms interval pattern as `ElectionBanner`.
    - Shows `before` → `countdown.before` with `count`, `electionDay` → `countdown.electionDay`, `over` → `null`.
    - Small `text-ink-muted` line.
  - `HomePage` layout:
    - Countdown, then h1 `font-display text-3xl sm:text-4xl`, then the subtitle.
    - The search hero (T5 provides the label and field).
    - Then a `grid gap-4 sm:grid-cols-2` of two cards on `bg-paper-raised border border-rule`.
    - "Dónde votar" wraps `<WhereToVote />`.
    - `HowToVoteCard` shows both `Envelope`s with `cards.congreso`/`cards.senado`.
  - Token-ize `NoticeMessage`.
- [ ] **Step 7: Run** `yarn vitest run` → PASS (incl. locale parity). Then `yarn build && yarn format:check && yarn lint`.
- [ ] **Step 8: Commit** `git commit -m "feat(home): ballot hero, Madrid-day countdown and voting cards"`

---

### Task 5: Search hero

model: sonnet (agent `implementer`)

**Files:**
- Modify: `search/MunicipalitySearch.tsx`
- Test: `search/MunicipalitySearch.test.tsx`

**Interfaces:**
- The `MunicipalitySearch` signature, the search logic and ns `search` are all unchanged.

- [ ] **Step 1: Write the failing test**
  - `getByText("Buscar municipio")` (the existing label key) is a visible `<label>` (not `sr-only`).
  - `getByLabelText("Buscar municipio")` is the combobox, and it has focus on mount.
  - The input has class `h-14` and `border-b-2`.
  - Each option has `min-h-11`.
- [ ] **Step 2: Run** `yarn vitest run src/search` → FAIL.
- [ ] **Step 3: Implement** a visible label above the input (Headless UI `Label` or `<label htmlFor>`) in `text-sm font-semibold`. The input:
  - `h-14 w-full bg-transparent text-lg border-0 border-b-2 border-ink focus:border-accent focus:outline-none` (the global focus ring stays on `:focus-visible`).
  - Keeps `autoFocus`.
  - Options sit on `bg-paper-raised border border-rule`, with `data-focus:bg-kraft` and the province in `text-ink-muted`.
- [ ] **Step 4: Run** `yarn vitest run` → PASS. Then `yarn format:check && yarn lint`.
- [ ] **Step 5: Commit** `git commit -m "feat(search): official-form search hero with visible label"`

---

### Task 6: Ruled candidacy listing and monochrome badge

model: sonnet (agent `implementer`)

**Files:**
- Modify: `candidacies/CandidacyList.tsx`, `candidacies/PartyBadge.tsx`
- Delete: `candidacies/badgeColor.ts`, `candidacies/badgeColor.test.ts` (no remaining consumer once the badge is monochrome)
- Test: `candidacies/CandidacyList.test.tsx`, `candidacies/PartyBadge.test.tsx`

**Interfaces:**
- The `PartyBadge` and `CandidacyList` props are unchanged.
- Produces `export function formatBallotOrder(boeOrder: number): string` in `candidacies/formatBallotOrder.ts`, which returns `String(boeOrder).padStart(2, "0")`.

- [ ] **Step 1: Write the failing tests**
  - `formatBallotOrder(1) === "01"` and `formatBallotOrder(12) === "12"`.
  - CandidacyList: the first row link contains `"01"` in an element with `tabular-nums`. It still has `toHaveTextContent("PARTIDO EJEMPLO A")` and `href="#/es/08/congreso/pea"`.
  - The list has `divide-y`.
  - PartyBadge without a logo has classes `bg-paper text-ink ring-1 ring-ink` and no inline `style` background. The existing truncation, initials and `onError` tests stay.
- [ ] **Step 2: Run** `yarn vitest run src/candidacies` → FAIL.
- [ ] **Step 3: Implement**
  - Each row is a document line, `grid grid-cols-[2.5rem_auto_1fr] items-center gap-3 py-3 min-h-11`:
    - order number in `tabular-nums text-ink-muted`,
    - badge,
    - denomination `font-semibold`, with the existing 2023 line below it in `text-sm text-ink-muted tabular-nums`.
  - The list uses `divide-y divide-rule border-y border-rule`.
  - Keep the existing sort controls; restyle the selected sort state in `text-accent`.
  - Logo images keep `bg-white`.
- [ ] **Step 4: Run** `yarn vitest run` → PASS (including the alphabetical test `toContain("A ")`). Then `yarn format:check && yarn lint`.
- [ ] **Step 5: Commit** `git commit -m "feat(candidacies): ruled ballot-order listing with monochrome badges"`

---

### Task 7: Constituency view restyle

model: sonnet (agent `implementer`)

**Files:**
- Modify: `constituency/ConstituencyView.tsx`, `constituency/ChamberTabs.tsx`, `constituency/SeatsSummary.tsx`, `constituency/HowToVote.tsx`, `constituency/WhereToVote.tsx` (classes only)
- Test: `constituency/ChamberTabs.test.tsx`, `constituency/HowToVote.test.tsx`

**Interfaces:**
- Consumes `CHAMBER_SURFACE_CLASSES` and `Envelope` (T1).
- `WhereToVote()` keeps its signature because T4 renders it. All props are unchanged. The ns `constituency` keys are kept.

- [ ] **Step 1: Write the failing tests**
  - ChamberTabs: the `aria-current="page"` link has `border-accent text-ink`, and the other link has `border-transparent`. Both links are `min-h-11`.
  - HowToVote: `getByTestId("envelope-swatch")` keeps its `data-chamber` and contains `svg[aria-hidden="true"]`.
- [ ] **Step 2: Run** `yarn vitest run src/constituency` → FAIL.
- [ ] **Step 3: Implement**
  - The h1 uses `font-display`.
  - Tabs: an underline `border-b-2` with `transition-colors duration-150`, sitting on a `border-b border-rule` strip.
  - `SeatsSummary` and `HowToVote` sit inside a `CHAMBER_SURFACE_CLASSES[chamber]` card (`p-4`).
  - Swap `SWATCH_CLASSES` (amber) for `<Envelope chamber>` inside the existing swatch span.
  - The seat numbers are `tabular-nums`.
- [ ] **Step 4: Run** `yarn vitest run` → PASS. Then `yarn format:check && yarn lint`.
- [ ] **Step 5: Commit** `git commit -m "style(constituency): chamber paper cards, accent tabs, envelope icons"`

---

### Task 8: Party detail as a ballot replica

model: sonnet (agent `implementer`)

**Files:**
- Modify: `party/PartyDetail.tsx`, `party/CandidateList.tsx`, `party/PartyFacts.tsx`, `party/linkChip.ts`, ns `party`
- Create: `party/BallotPaper.tsx`
- Test: `party/BallotPaper.test.tsx`, `party/PartyDetail.test.tsx`, `party/CandidateList.test.tsx`

**Interfaces:**
- Consumes `CHAMBER_SURFACE_CLASSES` (T1) and `PartyBadge` (T6, props unchanged).
- Produces `export function BallotPaper(props: { candidacy: Candidacy; chamber: Chamber; maxMarks: number }): JSX.Element`. Pass `maxMarks` from whatever `PartyDetail` already passes to the `senadoMarks` text.
- ns `party` adds `ballot.caption`: es `Representación orientativa, no válida para votar` / ca `Representació orientativa, no vàlida per votar`.

- [ ] **Step 1: Write the failing tests** in `BallotPaper.test.tsx`:
  - The paper is a `figure` whose `figcaption` reads "Representación orientativa, no válida para votar".
  - Congreso:
    - The figure has `bg-paper-raised`.
    - The header holds the logo (`getAllByRole("img",{name:"PEA"})` length 1) and the denomination.
    - It contains list "Candidatos" and heading "Suplentes".
    - It has no checkboxes.
  - Senado:
    - The figure has `bg-kraft`.
    - Each candidate row has one `span[aria-hidden="true"][data-testid="ballot-checkbox"]` (count = candidates).
    - `queryAllByRole("checkbox")` is empty.
    - It shows "Puedes marcar hasta 2 candidatos en total".
- [ ] **Step 2: Keep the existing PartyDetail and CandidateList assertions**: h1, "Web oficial" before the list, /Volver/, `img` "PEA" exactly once, unpadded "1Candidata Ejemplo A1", "Editar en GitHub", "Coalición".
- [ ] **Step 3: Run** `yarn vitest run src/party` → FAIL.
- [ ] **Step 4: Implement**
  - `PartyDetail` order: back link, h1 `font-display`, facts/links, then `BallotPaper`. Remove the logo from the page header so it appears once.
  - `BallotPaper`: `figure` with `CHAMBER_SURFACE_CLASSES[chamber] shadow-sm max-w-md mx-auto p-5`.
    - Header: badge + denomination in `font-semibold uppercase`, plus a `border-b border-rule-strong`.
    - Body: `CandidateList`, with positions in `tabular-nums`.
    - Senado: before each name, a `size-5 border-2 border-ink` checkbox span, and the marks note.
  - `linkChip` / `PartyFacts`: token classes only, with links `min-h-11`.
- [ ] **Step 5: Run** `yarn vitest run` → PASS (incl. parity). Then `yarn format:check && yarn lint`.
- [ ] **Step 6: Commit** `git commit -m "feat(party): ballot-paper replica for Congreso and Senado"`

---

### Task 9: About page restyle

model: haiku (agent `chore`)

**Files:**
- Modify: `about/AboutPage.tsx`
- Test: `about/AboutPage.test.tsx` (only if it queries `main`)

**Interfaces:**
- The props and ns `about` are unchanged.

- [ ] **Step 1: Change the semantics and classes**
  - The root `<main>` becomes `<article>`, because App already renders `<main>`.
  - h1 and h2 use `font-display`.
  - Links are `text-accent underline`, rules use `border-rule`, and dates are `tabular-nums`.
  - The logo-license list rows are `divide-y divide-rule`.
- [ ] **Step 2: Run** `yarn vitest run src/about && yarn format:check && yarn lint` → PASS. `grep -n "<main" src/about/AboutPage.tsx` → no output.
- [ ] **Step 3: Commit** `git commit -m "style(about): token styling and article landmark"`

---

### Task 10: index.html meta

model: haiku (agent `chore`)

**Files:**
- Modify: `web/index.html` (head meta only; keep the inline pre-paint theme script byte-for-byte)

- [ ] **Step 1: Add the meta tags**
  - `<meta name="theme-color" content="#FAF7F0" media="(prefers-color-scheme: light)">`
  - `<meta name="theme-color" content="#16151A" media="(prefers-color-scheme: dark)">`
  - `<meta name="color-scheme" content="light dark">`
  - `og:site_name` "Elecciones generales 2026"
  - `og:url` `https://alhuelamo.com/elecciones-generales-2026/`
  - `og:locale` `es_ES`, plus `og:locale:alternate` `ca_ES`
  - `twitter:card` `summary_large_image` (if missing)
  - `twitter:title` / `twitter:description`, mirroring the existing og title/description
  - Keep the existing og:image.
- [ ] **Step 2: Verify** with `cd web && yarn build && grep -cE 'og:(site_name|url|locale)|twitter:(title|description)|theme-color' dist/index.html` → ≥8.
- [ ] **Step 3: Commit** `git commit -m "chore(web): theme-color, og and twitter meta"`

---

### Task 11: Integration pass

model: sonnet (agent `implementer`)

**Files:**
- Modify: whatever the merge of T1–T10 needs, within `web/src/**` and `web/index.html` only.

- [ ] **Step 1: Merge** the wave-1 branches in task order and resolve conflicts. Expected hotspots are `App.tsx` (T1 vs T4) and ns `shell`.
- [ ] **Step 2: Check for leftovers.**
  - `grep -rnE "(gray|blue|amber|white)-[0-9]|bg-white|text-black" web/src --include=*.tsx`: the only allowed hit is `bg-white` on logo `<img>` plates. Fix any other hit.
  - `grep -rn "ThemeToggle\|badgeColor\|home\.title" web/src` → no output.
- [ ] **Step 3: Check 375px overflow by class review.** Look for fixed widths and `whitespace-nowrap` without `min-w-0`/`truncate` in Header, the CandidacyList rows and BallotPaper. Long denominations must wrap or truncate.
- [ ] **Step 4: Verify** with `cd web && yarn format:check && yarn lint && yarn test && yarn build` → all exit 0.
- [ ] **Step 5: Commit** `git commit -m "chore(web): integrate ballot-paper redesign"`

---

### Task 12: Browser verification (orchestrator, not an agent)

model: none (orchestrator, manual)

- [ ] Start the preview `web` from `.claude/launch.json` (`yarn --cwd web dev --port 5173 --strictPort`).
- [ ] At 375px and at desktop width, in light and dark and in es and ca, check:
  - home (countdown, hero autofocus, both cards),
  - Barcelona Congreso,
  - Teguise Senado,
  - one party detail per chamber (ballot paper, Senado checkboxes and marks note, caption),
  - About (credits incl. logo licenses, build date on real data).
- [ ] Checklist on every page: no horizontal scroll, the header stays on one row ≤56px, tap targets ≥44px, the theme menu works by keyboard, only one language is visible, and motion is off with reduced-motion emulated.
- [ ] Run `yarn --cwd web build` and confirm the og/twitter/theme-color meta in `web/dist/index.html`.

---

## Open questions

1. **Election day.** The home countdown says "Hoy se vota" while the global `ElectionBanner` also says it's election day. Keep both, or hide the countdown on election day? The plan keeps both.
2. **The constituency `HowToVote` section** now partly duplicates the home "Cómo se vota" card. The plan keeps it, because it carries the per-constituency `maxMarks`.
3. **`theme-color`** follows the system scheme only. Should an explicit Claro/Oscuro choice also rewrite the meta at runtime (it would be T2's job)? The plan does not.
4. **Senado paper header.** The real Senado ballot is one sheet listing all parties. Should the Senado replica show the logo header like Congreso? The plan shows it, since the tests require the logo exactly once.
5. **The og-image** keeps its current look. Should it be redone in the new style?
