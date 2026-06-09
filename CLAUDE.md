# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173 (HMR, no service worker)
npm run build        # prebuild → generate-anki → vite build → dist/
npm run preview      # serve dist/ at http://localhost:4173 (service worker active)
npm run lint         # eslint
npm run generate-anki  # regenerate all .apkg files in public/anki/ (also runs via prebuild)
```

The `prebuild` hook runs `patch-sqljs.cjs` then `generate-anki.cjs` automatically before every `npm run build`. Run `npm run generate-anki` manually only when iterating on the Flashcards tab during dev.

**One-time scripts** (not part of the build):
- `node scripts/generate-pronunciations.cjs` — calls the Anthropic API to generate IPA for all vocab; writes `scripts/pronunciations.json`. Requires `ANTHROPIC_API_KEY` in the environment. Re-run only when vocab changes.

## Architecture

**Single-page PWA — no backend, no routing library.** All state is `localStorage`. The app is entirely static and must remain deployable to Azure Static Web Apps free tier.

**Tab structure** (`App.jsx`): Three tabs — Tracker, Flashcards, Journal — rendered conditionally by `activeTab` state. No React Router; tab switching unmounts the inactive tab components.

**Data layer** (`src/data/studyData.js`): Single source of truth. Exports `PHASES` (array of 4 phase objects, each with a `weeks` array of 37 total week objects) and `DAILY` (7-item weekly schedule). Each week object contains: `n` (week number 1–37), `d` (date range), `r` (Bible reading), `b` (Babbel topic), `vocab` (array of `[italian, english, example, ipa]` tuples), `grammar` (`{title, body}`), `prompt` (`{it, en}`), `review` (boolean), `italki` (optional string array of conversation-starter questions, only present on review weeks). Anki deck generation reads this same data via `scripts/generate-anki.cjs`.

**Anki generation** (`scripts/generate-anki.cjs`): Node CJS script (not ESM — Vite plugins are ESM but this runs in Node at build time). Produces 42 `.apkg` files in `public/anki/`: one per week (37), one per phase (4), one complete deck (`complete.apkg`). The vocab tuples from `studyData.js` are the card source.

**Hooks:**
- `useProgress` — week completion bits in `localStorage` under key `italian-bible-progress`
- `useJournal` — per-week text entries in `localStorage` under key `italian-bible-journal`; debounced auto-save; exports all entries as a single `.md` file
- `useInstallPrompt` — captures `beforeinstallprompt` for the Android install button

**Flashcards tab** (`FlashcardsTab.jsx`) has three modes toggled by local state: *Anki Decks* (download `.apkg` files), *Practice* (`PracticeMode.jsx` — in-browser flip cards with known/again queue, built from all vocab in `PHASES`), and *Pronunciation* (`PronunciationPractice.jsx`).

**Text-to-speech** (`SpeakerButton.jsx`): Uses `window.speechSynthesis` with `lang: 'it-IT'`. No external dependency — falls back silently if the API is unavailable.

**Schedule logic** (`src/utils/schedule.js`): Program start is hardcoded to `Apr 13, 2026`. `getCurrentWeekN()` returns the current week 1–37 based on real date, or `null` if before start or after week 37.

**PWA / offline**: `vite-plugin-pwa` with `registerType: 'autoUpdate'`. Workbox precaches all JS/CSS/HTML/PNG/SVG assets plus all `.apkg` files. Service worker is disabled in `npm run dev` — use `npm run preview` to test offline behavior.

**Grammar checking** (`JournalTab.jsx`): Calls `https://api.languagetool.org/v2/check` with `language: it`. This is an external API call — it fails offline, which is intentional and expected.

## Key constraints

- **No backend** — never introduce server-side logic, OAuth flows, or environment secrets. The app must build to a static `dist/` folder.
- **localStorage only** — all persistence is `localStorage`. There is no IndexedDB, no remote sync.
- `generate-anki.cjs` is CommonJS (`require`/`module.exports`). Do not convert it to ESM.
- `public/staticwebapp.config.json` must exclude `/anki/*` from the SPA `navigationFallback` or `.apkg` downloads break on Azure.
- Vite is pinned to `^6.x` — `vite-plugin-pwa` does not yet support Vite 8.
