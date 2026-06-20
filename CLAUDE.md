# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173 (HMR, no service worker)
npm run build        # prebuild → generate-anki → vite build → dist/
npm run preview      # serve dist/ at http://localhost:4173 (service worker active)
npm run lint         # eslint (flat config; clean as of Phase 0)
npm run generate-anki  # regenerate all .apkg files in public/anki/ (also runs via prebuild)
npm test             # vitest run — 93 tests across 6 files, all green
npm run test:watch   # vitest in watch mode
```

The `prebuild` hook runs `patch-sqljs.cjs` then `generate-anki.cjs` automatically before every `npm run build`. Run `npm run generate-anki` manually only when iterating on the Flashcards tab during dev.

**Fresh-clone gotcha:** web/remote sessions start with no `node_modules`. Run
`npm ci` first or `lint`/`test`/`build` fail with `Cannot find package '@eslint/js'`
(this masks the real lint error documented in the Tooling note below).

**One-time scripts** (not part of the build):
- `node scripts/generate-pronunciations.cjs` — calls the Anthropic API to generate IPA for all vocab; writes `scripts/pronunciations.json`. Requires `ANTHROPIC_API_KEY` in the environment. Re-run only when vocab changes.

## Architecture

**Single-page PWA — no backend, no routing library.** All state is `localStorage`. The app is entirely static and must remain deployable to Azure Static Web Apps free tier.

**Tab structure** (`App.jsx`): Three tabs — Tracker, Flashcards, Journal — rendered conditionally by `activeTab` state. No React Router; tab switching unmounts the inactive tab components.

**Data layer** (`src/data/studyData.js`): Single source of truth for the React app. Exports `PHASES` (array of 4 phase objects, each with a `weeks` array of 37 total week objects) and `DAILY` (7-item weekly schedule). Each week object contains: `n` (week number 1–37), `d` (date range), `r` (Bible reading), `b` (Babbel topic), `vocab` (array of `[italian, english, example, ipa]` tuples), `grammar` (`{title, body}`), `prompt` (`{it, en}`), `review` (boolean), `italki` (optional string array of conversation-starter questions, only present on review weeks).

**Anki generation** (`scripts/generate-anki.cjs`): Node CJS script (not ESM — Vite plugins are ESM but this runs in Node at build time). Produces 42 `.apkg` files in `public/anki/`: one per week (37), one per phase (4), one complete deck (`complete.apkg`). **Gotcha:** this script does *not* import `studyData.js` — it keeps its own **duplicated inline copy** of the vocab (only `[italian, english, example]`, no IPA) "to keep the script standalone." So Anki cards carry no IPA, and the two vocab copies can drift; if you edit vocab in `studyData.js`, mirror it here (and vice-versa). Output `.apkg` files are also non-deterministic (timestamps/GUIDs) — every `npm run build` rewrites all 42 even with no content change, so don't commit that churn unless the card *content* actually changed.

**Hooks:**
- `useProgress` — week completion bits in `localStorage` under key `italian-bible-progress`
- `useJournal` — per-week text entries in `localStorage` under key `italian-bible-journal`; debounced auto-save; exports all entries as a single `.md` file
- `useInstallPrompt` — captures `beforeinstallprompt` for the Android install button
- `useTheme` — light/dark toggle persisted in `localStorage` under key `italian-bible-theme`; toggles the `dark` class on `<html>`

All persisted keys are namespaced `italian-bible-*` (`-progress`, `-journal`, `-theme`). Any new feature that persists state should follow that prefix.

**Flashcards tab** (`FlashcardsTab.jsx`) has three modes toggled by local state: *Anki Decks* (download `.apkg` files), *Practice* (`PracticeMode.jsx` — in-browser flip cards with known/again queue, built from all vocab in `PHASES`), and *Pronunciation* (`PronunciationPractice.jsx`).

**Text-to-speech** (`SpeakerButton.jsx`): Uses `window.speechSynthesis` with `lang: 'it-IT'`. No external dependency — falls back silently if the API is unavailable.

**Tap-to-translate** (`WordGloss.jsx` + `GlossPopover.jsx`, backed by `src/utils/vocabIndex.js`): wraps an Italian string and makes any word that exists in the vocab index tappable → a popover with Italian + English + IPA + a speaker. `vocabIndex.js` builds a memoized `Map` once from `PHASES`, keyed by both the full term and its article-stripped stem (so "il Verbo" is reachable as "verbo"); `tokenize` preserves the original text exactly and keeps internal apostrophes. Words not in the index render as plain text (no match for conjugations/derived forms — that's an accepted v1 limit). Wired into example sentences + writing prompt (`WeekDetail.jsx`) and the Journal prompt (`JournalTab.jsx`). All client-side, works offline.

**Schedule logic** (`src/utils/schedule.js`): Program start is hardcoded to `Apr 13, 2026`. `getCurrentWeekN()` returns the current week 1–37 based on real date, or `null` if before start or after week 37. `getTodayDayIndex()` returns 0=Mon … 6=Sun, used to highlight today's row in `DAILY`.

**PWA / offline**: `vite-plugin-pwa` with `registerType: 'autoUpdate'`. Workbox precaches all JS/CSS/HTML/PNG/SVG assets plus all `.apkg` files. Service worker is disabled in `npm run dev` — use `npm run preview` to test offline behavior.

**Grammar checking** (`JournalTab.jsx`): Calls `https://api.languagetool.org/v2/check` with `language: it`. This is an external API call — it fails offline, which is intentional and expected.

## Key constraints

- **No backend** — never introduce server-side logic, OAuth flows, or environment secrets. The app must build to a static `dist/` folder.
- **localStorage only** — all persistence is `localStorage`. There is no IndexedDB, no remote sync.
- `generate-anki.cjs` is CommonJS (`require`/`module.exports`). Do not convert it to ESM.
- `public/staticwebapp.config.json` must exclude `/anki/*` from the SPA `navigationFallback` or `.apkg` downloads break on Azure.
- Vite is pinned to `^6.x` — `vite-plugin-pwa` does not yet support Vite 8.

## Audio button (`SpeakerButton.jsx`) — status

Validated working via `src/components/SpeakerButton.test.jsx`, which mocks the
Web Speech API and confirms: Italian-language utterance (`it-IT`), slowed
`rate: 0.85`, speaking/stop state transitions, click-to-cancel, and error
recovery. Note for tests: the component reads `'speechSynthesis' in window` at
module-load time, so the fake API must be installed on `window` **before** the
component is imported (the test uses a top-level `await import`), and utterance
callbacks (`onstart`/`onend`/`onerror`) must be wrapped in `act()` so React
flushes the state updates.

**Wiring (updated):** `SpeakerButton` is used in Practice (`PracticeMode.jsx`),
Pronunciation (`PronunciationPractice.jsx`), and — as of Phase 1 / A3 — the
Tracker week vocab table (`WeekDetail.jsx`), where each Italian term and its
example sentence now has a compact inline speaker. The compact sizing lives in
`index.css` under `.vocab-it-word .speaker-btn` / `.vocab-ex-row .speaker-btn`
(specificity beats the `@media (pointer: coarse)` 40px override, so the table
stays dense on touch).

## Fluency roadmap — ideas to raise success rate

The app is strong on *exposure* (reading, vocab, downloadable Anki) but thin on
the levers most tied to fluency: spaced retention, comprehensible listening, and
active production. In rough priority order:

1. **Spaced repetition in the in-browser Practice mode.** `PracticeMode` is
   session-only — "Still learning" cards repeat within the session, then reset;
   there is no per-card memory. A lightweight SM-2/Leitner scheduler (store
   ease/interval/due-date per word in `localStorage`) is the biggest retention
   lever and fits the localStorage-only constraint. Today the real SRS only
   lives in the downloaded Anki decks.
2. ~~**Fill missing IPA.**~~ **Done (Phase 0).** All 259 vocab tuples now carry
   IPA. The 35 that were missing already had correct IPA in
   `scripts/pronunciations.json` — it was a merge gap, not a generation gap, so
   no API call was needed (the values were merged into `studyData.js` directly).
3. **Listening / comprehensible-input mode.** Reuse TTS to read example
   sentences and full verses (not just single words) at adjustable speed.
4. **Active production, both directions.** Practice is recognition-only
   (Italian→English, tap to reveal). Add English→Italian recall and cloze /
   fill-in-the-blank built from the stored example sentences.
5. **Streaks + daily goal + reminders.** A localStorage streak counter and PWA
   notifications reinforce the existing `DAILY` schedule; consistency predicts
   success more than any single feature.
6. **Persist and surface practice results.** `PracticeMode` and
   `PronunciationPractice` discard scores at session end. Persisting them unlocks
   a "words you struggle with" view and feeds the SRS scheduler in #1.

## Verified repo facts (as of this review)

- **Data totals:** 4 phases, 37 weeks, **259** vocab tuples, **all with IPA** (the
  4th tuple element) as of Phase 0. **5** weeks carry an `italki` array. The
  count is hardcoded in a few UI strings (e.g. "259 cards" in
  `PracticeMode.jsx` / `PronunciationPractice.jsx` / `FlashcardsTab.jsx`); if
  vocab counts change, update those strings too — they are not computed.
- **Tests:** `npm test` runs 93 vitest tests across 6 files
  (`SpeakerButton`, `useProgress`, `useJournal`, `studyData`, `pronunciation`,
  `schedule`), all passing.
- **CI:** `.github/workflows/azure-static-web-apps-*.yml` runs `npm ci` →
  `npm run lint` → `npm test` → `npm run build` on every PR to `main`, and
  deploys to production only on push to `main`. It deploys via the
  `@azure/static-web-apps-cli` (`swa deploy`) rather than the container action
  to dodge MCR Docker-pull throttling. No per-PR preview envs (free-tier staging
  cap is 3, CLI has no teardown). Lint and test now gate CI alongside the build.

## Tooling note — `npm run lint` (fixed in Phase 0)

`eslint.config.js` previously referenced `reactHooks.configs.flat.recommended`,
but `eslint-plugin-react-hooks@5.2.0` exposes `recommended-legacy`,
`recommended`, and `recommended-latest` — there is no `.configs.flat`, so the
config threw `Cannot read properties of undefined (reading 'recommended')` before
linting any file. Now fixed to `reactHooks.configs['recommended-latest']`.
Two further adjustments keep lint green: `no-unused-vars` also takes
`argsIgnorePattern: '^[A-Z_]'` (so JSX component params like `Icon` aren't
flagged — there's no `eslint-plugin-react` to teach the base rule that `<Icon/>`
is a use), and a `**/*.test.{js,jsx}` override adds Node globals (test files use
`global`).
