# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status & roadmap

- **The immersion/fluency build is complete and merged.** All four workstreams
  from `plan.md` shipped — **A** immersion (immersion mode, tap-to-translate,
  Tracker TTS), **B** retention (in-browser SRS + struggle list), **C**
  production (recall, cloze, listening, journaling scaffold), **D** motivation
  (streaks + Today checklist, confetti, achievement badges, opt-in reminders) —
  plus a polish pass (daily new-card cap, wider immersion coverage, tap-to-hear
  for un-glossed words). `plan.md` is the per-item record (all ✅).
- **CourseKit generalization (`plan-platform.md`): T0–T4 complete and merged.**
  The app is now a usable **fork-and-fill, config-driven template** — anyone can
  build their own N-week (37 / 40 / …) course by editing the `course/` definition
  and following `AUTHORING.md`, with no component edits.
  **T0:** all course data lives in `course/` (see Data layer below);
  `studyData.js` is a back-compat shim; the schedule and the
  previously-hardcoded counts are derived from the course; `course/validate.js`
  + `npm run validate-course` guard it. **T1 done:** locale (`src/utils/locale.js`)
  drives TTS/speech-recognition language, LanguageTool language, IPA visibility,
  and article-stripping from `config.locale`. **T2 done:** branding/resources
  come from `config.brand` (name/tagline/goal/ribbon/topicLabel/about, +
  `document.title`) and `config.resources` (the WelcomeCard tool list). **T3 done:**
  `generate-anki.cjs` sources vocab+IPA from the course via dynamic `import()` (no
  more duplicated inline copy — resolves the issue #37 drift item). **T4 done:**
  the authoring kit — `AUTHORING.md`, `course/schema.md`, `npm run new-course`
  (scaffolder) and `npm run import-vocab` (CSV→vocab). **T5a done:** per-course
  localStorage namespacing via `storageKey()` / `config.storagePrefix` (reference
  course keeps `italian-bible-*`, zero migration; forks self-namespace).
  **T5b done:** a multi-course **registry + picker** — the data moved to
  `courses/<id>/`, `courses/registry.js` bundles all courses and resolves the
  active one from localStorage, `course/config.js` + `course/content.js` are now
  thin resolvers, and `CoursePicker` (header) switches courses (persist + reload;
  hidden when only one course is registered, so the reference deploy is
  unchanged). **The whole platform (T0–T5) is complete.** Known limit: Anki deck
  generation + the Flashcards download list still target the *default* course
  only (the in-browser Practice/SRS is the per-course study path).
  **Note:** `GuideSection.jsx` / `SentenceGuide.jsx` still hold long-form
  course-specific prose; `AUTHORING.md` tells forks to edit those components
  (moving them into `course/` is a noted follow-up).
- **Cross-device sync shipped (offline, no backend).** Progress is portable via a
  versioned `localStorage` snapshot carried by QR code / copy-paste code / `.json`
  file (`syncSnapshot.js` + `SyncPanel.jsx`). **Online auto-sync** (opt-in BaaS —
  would relax the no-backend constraint) is planned in `plan-sync.md`. Also shipped:
  tap **any** Italian word for an auto-generated approximate IPA + audio
  (`it2ipa.js`, generalized `WordGloss`).
- **Reading & comprehension suite (`opportunities.md` O1–O5) complete and
  merged.** Shadowing (O1), Interactive reading (O2), Grammar drill (O3),
  Dictogloss (O4), and Comprehension checks (O5) are all live. All 37 weeks carry
  authored `drill`, `comprehension`, and `passage` data in
  `courses/it-bible-cei/exercises.js`. CEI 2008 passage text (4–8 key verses per
  week) was populated from training knowledge after external Bible APIs were found
  to be blocked by the egress proxy — if individual verses need updating, edit
  `exercises.js` directly. See `opportunities.md` for the full implementation
  learnings and remaining open items (O6–O17).
- **New Session / Calendar Reset (`plan-new-session.md`): planned, not started.**
  Lets any user start (or restart) the 37-week program from today — or any chosen
  date — without editing source code. Writes a `session-start` override to
  `localStorage` via a new `src/utils/sessionStart.js`; `schedule.js` reads the
  override in preference to `config.schedule.startDate`. A "New Session" bottom
  sheet in Settings (T1) lets users pick a start date, choose which data to reset
  (progress/streak/SRS intervals/journal, T2), then reloads. `TodayCard` and the
  header tagline dynamically display the new end date (T3). Full task list in
  `plan-new-session.md`.
- **Natural speaking / thinking-in-Italian (`plan-speaking.md`): P1–P3 shipped —
  the whole roadmap is complete.** Targets the automatization gap — producing spontaneous Italian
  without translating from English. **P1 (zero-content) is implemented:**
  **S7** daily "Pensa in italiano" micro-prompt on the Today card
  (`src/data/thinkPrompts.js` rotated by day-of-year, `ThinkPrompt.jsx` with a
  throwaway type/dictate scratch box; done ticks `practiced`); **S6** sentence
  scramble as a fifth Practice style "Build" (`src/utils/scramble.js`, chip UI
  in `PracticeMode.jsx`, SRS-graded, eligibility 4–12 words); **S4** spoken
  journaling (`DictationMic.jsx` — continuous `TTS_LANG` dictation appended to
  the draft, auto-restarting through Chrome's silence timeout) + Nation 4/3/2
  fluency sprints (`src/utils/fluencySprint.js` + `FluencySprint.jsx` in each
  Journal week editor: 60s→45s→30s rounds on the week's prompt, per-round WPM
  + delta, optional insert-into-journal). SpeechRecognition detection is
  centralized in `src/utils/speech.js`; mic UI hides when unavailable.
  **P2 (S5) is implemented:** the "Trappole" drill — a fourth Flashcards mode
  (`TrapDrill.jsx`, hidden when the course ships no dataset) drilling 56
  curated English-interference traps in 12 categories (piacere-verbs, clitic
  placement, null subject, adjective position, articulated prepositions,
  essere/avere, avere idioms, false friends (= O14), c'è/ci sono, tense+da,
  possessive articles, no-preposition verbs). Data is course-level
  (`courses/it-bible-cei/contrastive.js`, resolved via `course/traps.js` +
  optional registry fields). `src/utils/contrastive.js` holds the verdict
  logic — predicted wrongs match exactly *before* the fuzzy correct check
  (interference forms sit within typo tolerance of the right answer), a trap
  match shows the item's targeted note, and per-category accuracy under
  `storageKey('traps')` drives weakest-first ordering.
  **P3 (per-week authoring) is implemented** for all 37 weeks in a single
  `SPEAKING` block merged onto `BASE_EXERCISES` in `exercises.js`: **S1** Frasi
  fisse — formulaic chunks with optional literal "how Italian construes it"
  glosses (`chunks.js` + `PhraseList.jsx`); **S2** Trasforma — Italian-only
  transformation drills checked by *exact* canonical token match, not the fuzzy
  `checkAnswer` (single-char transforms like pastore→pastori would otherwise be
  accepted untransformed), with a `dictogloss` word-diff on a miss
  (`transformDrill.js` + `TransformDrill.jsx` beside GrammarDrill); **S3**
  Rispondi subito — timed spoken Q&A about the reading, placed per-week in
  `WeekDetail` (questions are passage-anchored) reusing `src/utils/speech.js`
  (`spokenAnswer.js` + `SpokenQA.jsx`). `exercises.speaking.test.js` guards the
  authored data (every transform answer passes its checker and every base
  fails it; every question is satisfied by its own model). Full spec in
  `plan-speaking.md`.
- **iOS / iPadOS App (`plan-ios-app.md`): planned, not started.**
  A full native App Store app targeting iOS 15+ built with **React Native + Expo
  SDK 52** (bare workflow). All pure-JS utility modules (`srs.js`, `answer.js`,
  `cloze.js`, `it2ipa.js`, `streak.js`, etc.) port with zero changes; hooks are
  adapted to `AsyncStorage`; `localStorage` → `@react-native-async-storage`;
  `speechSynthesis` → `expo-speech`; `SpeechRecognition` →
  `@react-native-voice/voice`; `window.Notification` → `expo-notifications`.
  iOS-exclusive additions: haptic feedback (card flip, grade, streak milestones),
  **WidgetKit home-screen widgets** (streak + today's checklist in Swift), Siri
  Shortcuts, iCloud opt-in backup, Dynamic Type, and an adaptive iPad layout
  (persistent sidebar via `@react-navigation/drawer`). Milestone timeline ~10 weeks.
  Visual wireframes are in `wireframes/ios-app-wireframes.html` (open in any
  browser — covers Onboarding, Tracker, Week Detail, Flashcards, Pronunciation,
  Journal, Settings, New Session sheet, iPad sidebar, and home-screen widgets).
  Full architecture and App Store checklist in `plan-ios-app.md`.
  A **full SwiftUI rewrite** alternative is documented in `plan-ios-swift.md`
  (SwiftUI + SwiftData, AVSpeechSynthesizer, SFSpeechRecognizer, CoreHaptics,
  native WidgetKit, ~8–12 MB binary, iOS-only). That plan includes concrete Swift
  ports of all 8 JS utility modules (SRS, Answer, Cloze, Streak, IPA, etc.),
  SwiftData `@Model` types, WidgetKit `TimelineProvider`, iCloud KV sync, and
  Siri `AppIntent` stubs. Both plans share the same wireframes
  (`wireframes/ios-app-wireframes.html`).
- **Open backlog:** GitHub issue #37 (future enhancements — touch tap-to-reveal,
  surfacing "N due" outside Practice, cloze lemmatization, configurable reminder
  hour, streak-milestone confetti, the `generate-anki` duplication/non-determinism);
  sync follow-ups in `plan-sync.md` (multi-QR chunking for large snapshots,
  field-level merge, online auto-sync); fluency follow-ups from `opportunities.md`
  (O12 adaptive new-card cap, O9 spaced writing retrieval, O7 sentence scramble,
  O6 morphological awareness, O15 reading speed, O10 error type classification).

## Commands

```bash
npm run dev          # dev server at http://localhost:5173 (HMR, no service worker)
npm run build        # prebuild → generate-anki → vite build → dist/
npm run preview      # serve dist/ at http://localhost:4173 (service worker active)
npm run lint         # eslint (flat config; clean as of Phase 0)
npm run generate-anki  # regenerate all .apkg files in public/anki/ (also runs via prebuild)
npm test             # vitest run — 237 tests across 27 files, all green
npm run test:watch   # vitest in watch mode
npm run validate-course  # validate course/ (config + content) against the schema
npm run new-course -- --weeks 40 --phases 4 --id my-course --force  # scaffold a blank course
npm run import-vocab -- vocab.csv   # CSV (week,target,native,example,ipa) → paste-ready vocab
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

**Data layer** (`courses/` + `course/`): each course's data lives in `courses/<id>/{config.js,content.js}` (`config` = id, brand, locale, schedule incl. `startDate`/`weeks`/`daily`, resources; `content` = `phases`). `courses/registry.js` statically bundles all courses and picks the **active** one from localStorage (`coursekit-active-course`); `course/config.js` and `course/content.js` are thin **resolvers** that re-export the active course's `config`/`phases` — so the ~12 files that `import { config } from '../../course/config'` transparently get the active course. Switching courses (`registry.setActiveCourse` / the `CoursePicker`) persists + reloads so every module re-resolves. `course/index.js` resolves config+content into `course` (+ derived `totals`). `course/validate.js` checks the invariants (`npm run validate-course`, also exercised by `validate.test.js`). `src/data/studyData.js` is now a **back-compat shim** re-exporting `PHASES` (from content), `DAILY` (from `config.schedule.daily`), and `COURSE` — so existing `import { PHASES } from '../data/studyData'` keeps working. Each phase has `id`, `title`, `book`, badge fields, and a `weeks` array; each week: `n` (1–N), `d` (date range), `r` (reading/material), `b` (topic), `vocab` (array of `[target, native, example, ipa?]` tuples — IPA optional), `grammar` (`{title, body}`), `prompt` (`{it, en}`), `review` (boolean), `italki` (optional). The schedule (`schedule.js`) and the previously-hardcoded "259 cards"/"37 weeks" counts are now **derived** from the course, not literals.

**Anki generation** (`scripts/generate-anki.cjs`): Node CJS script (not ESM — Vite plugins are ESM but this runs in Node at build time). Produces 42 `.apkg` files in `public/anki/`: one per week (37), one per phase (4), one complete deck (`complete.apkg`). **As of T3** it sources card data from the course via dynamic `import()` of `course/content.js` + `course/config.js` (no more duplicated inline vocab/IPA copy — they can't drift), staying CommonJS per the repo constraint. Cards carry IPA from the vocab tuple's 4th element when `config.locale.hasIPA`; deck names come from `config.brand.name`; per-phase filenames are a stable `DECK_FILES` map keyed by phase id (still referenced by `FlashcardsTab`). Output `.apkg` files remain non-deterministic (timestamps/GUIDs) — every `npm run build` rewrites all 42 even with no content change, so don't commit that churn unless the card *content* actually changed.

**Hooks:**
- `useProgress` — week completion bits in `localStorage` under key `italian-bible-progress`
- `useJournal` — per-week text entries in `localStorage` under key `italian-bible-journal`; debounced auto-save; exports all entries as a single `.md` file
- `useInstallPrompt` — captures `beforeinstallprompt` for the Android install button
- `useTheme` — light/dark toggle persisted in `localStorage` under key `italian-bible-theme`; toggles the `dark` class on `<html>`
- `useSrs` — spaced-repetition store under key `italian-bible-srs`; React glue over the pure `src/utils/srs.js` (per-word `{ ease, interval, reps, lapses, due, last, created }`). Keeps the store in a ref + a `version` counter; `recordReview(term, grade)`, `buildSession(cards, opts)`, `getStats(cards)`, `getStore()`. Powers Practice mode. `buildSession` enforces a **daily new-card cap** (`DAILY_NEW_CAP`, default 15) using each card's `created` day, so no more than N new cards are introduced per calendar day across sessions.
- `usePronunStats` — pronunciation attempts under key `italian-bible-pronun` (per-word `{ attempts, last, best, sum, avg, at }`); `record(term, score)`, `getStore()`. Recorded by Pronunciation mode; combined with the SRS store by `src/utils/wordStats.js` (`struggleList`) to drive the Practice "Parole difficili / words you struggle with" panel.
- `useStreak` — daily streak + today's-goal flags under key `italian-bible-streak`; React glue over pure `src/utils/streak.js` (`{ last, current, best, today: { date, read, practiced, journaled } }`). The dashboard reads it on mount (`TodayCard` remounts on tab switch, picking up activity recorded elsewhere); `recordActivity(flag)` is called fire-and-forget from `PracticeMode` (`'practiced'`) and `JournalTab` (`'journaled'`), and `tickRead` marks the reading box.

All persisted keys are **per-course namespaced** via `storageKey(name)` (`src/utils/storageKey.js`), which prefixes with `config.storagePrefix` (the reference course keeps `'italian-bible'`, so existing data needs no migration; a scaffolded course gets its own prefix). Keys in use: `-progress`, `-journal`, `-theme`, `-immersion`, `-srs`, `-pronun`, `-streak`, `-reminders`, `-welcome-seen`. New persisted state should use `storageKey('…')`, never a hardcoded literal.

**Immersion mode / i18n** (`src/i18n/`): "Modalità immersione" flips UI *chrome* (tab labels, section headers, key buttons) to Italian, with the English shown as a hover/long-press `title` gloss — the comprehensibility guard. Default is English (off), so non-immersive output is byte-identical to before. Pieces: `strings.js` (`{ key: { it, en } }` chrome map — chrome only, never user content), `ImmersionContext.js` (context + `useImmersion` hook + persisted key `italian-bible-immersion`), `ImmersionProvider.jsx` (provider, wrapped around `<App>` in `main.jsx`), and `UiText.jsx` (`<UiText k="tab.tracker" />` — renders `en` when off, `it`+title when on). The context has a sensible default value, so components render English even without the provider (tests rely on this). **Lint gotcha:** the context/hook live in a `.js` file and the provider in a `.jsx` file on purpose — keeping a non-component export (the hook) out of the `.jsx` satisfies `react-refresh/only-export-components`.

**Flashcards tab** (`FlashcardsTab.jsx`) has three modes toggled by local state: *Anki Decks* (download `.apkg` files), *Practice* (`PracticeMode.jsx` — SRS-scheduled, with a style selector for Recognition / Recall / Cloze / Listening and a "Parole difficili" struggle panel), and *Pronunciation* (`PronunciationPractice.jsx`).

**Reading & comprehension suite (opportunities.md O1–O5, rendered in `WeekDetail.jsx`).** Five research-backed features layered onto each week, all data-driven and degrading gracefully when content is absent:
- **O2 Interactive reading** (`ReadingPassage.jsx`): renders the week's connected verses with every word tappable (`WordGloss`) + a per-line speaker + a "mark as read" button that ticks the streak's `read` flag. Source is `week.passage` (now authored for all 37 weeks in `exercises.js` — CEI 2008 text, 4–8 key verses per week) with graceful fallback to the week's vetted vocab example sentences via `src/utils/keyVerses.js`. To update or verify individual verses, edit `exercises.js` directly; the egress proxy blocks all external Bible APIs so they cannot be fetched programmatically in this environment.
- **O5 Comprehension** (`Comprehension.jsx` + `src/utils/comprehension.js`): collapsible true/false + multiple-choice checks (`week.comprehension`), each with an English gloss.
- **O4 Dictogloss** (`Dictogloss.jsx` + `src/utils/dictogloss.js`): hear a verse → type a reconstruction → word-level diff + recall score (order-independent multiset match, accent/case/punctuation-forgiving). Counts as `practiced` activity.
- **O3 Grammar drill** (`GrammarDrill.jsx` + `src/utils/grammarDrill.js`): fill-in-the-blank items (`week.drill`) anchored to vetted example sentences so the Italian is correct; answers use the same forgiving `checkAnswer`.
- **O1 Shadowing**: a second drill type inside `PronunciationPractice.jsx` (toggle *Words* / *Shadowing*) — TTS plays the example **sentence**, the learner repeats it aloud, and the existing speech-recognition pipeline scores the whole sentence. Sentence scores stay session-local (not fed into the per-word struggle list) but still tick the streak.

The per-week `drill`/`comprehension`/`passage` content lives in `courses/it-bible-cei/exercises.js` and is merged onto each week by `n` at the bottom of `content.js` (keeps the large exercise body out of the week definitions). All 37 weeks carry drills + comprehension; the validator ignores these optional fields. Pure modules `keyVerses`/`dictogloss`/`grammarDrill`/`comprehension` each have a sibling test.

**Text-to-speech** (`SpeakerButton.jsx`): Uses `window.speechSynthesis`; the utterance language is the course locale (`TTS_LANG` from `src/utils/locale.js`, = `config.locale.target`, currently `it-IT`). Optional `rate` prop (default `0.85`; Listening mode passes a slower rate). No external dependency — falls back silently if the API is unavailable.

**Locale (`src/utils/locale.js`, as of T1):** single source for the course's `TTS_LANG`/`NATIVE_LANG`/`GRAMMAR_LANG`/`HAS_IPA` and a `LEADING_ARTICLE` regex built from `config.locale.articles`. `SpeakerButton`, `WordGloss`, and `PronunciationPractice` speak/recognize `TTS_LANG`; `answer.js`/`vocabIndex.js`/`cloze.js` strip articles via `LEADING_ARTICLE`; `HAS_IPA:false` hides the IPA column, pronunciation-key panels, and card-back IPA; `GRAMMAR_LANG:''` hides the Journal grammar toggle. Flipping `config.locale` retargets the language with no component edits.

**Tap-to-translate / tap-for-pronunciation** (`WordGloss.jsx` + `GlossPopover.jsx`, backed by `src/utils/vocabIndex.js`): wraps an Italian string and makes **every** word tappable → a popover. Words in the vocab index show Italian + English + stored IPA + a speaker; **any other word** (conjugations, names, function words) shows an **auto-generated approximate IPA** (flagged with `≈`) + a speaker. `vocabIndex.js` builds a memoized `Map` once from `PHASES`, keyed by both the full term and its article-stripped stem (so "il Verbo" is reachable as "verbo"); `tokenize` preserves the original text exactly and keeps internal apostrophes. The on-the-fly IPA comes from `src/utils/it2ipa.js` (`toIPA(word)`, + `it2ipa.test.js`), a pure rule-based Italian grapheme→IPA converter (digraphs gli/gn/sc/ch/gh, soft c/g, geminates, intervocalic-s voicing, accent-mark/penultimate stress) — a broad approximation labelled "approx.", gated on `HAS_IPA`; the TTS audio is the accurate channel. Non-vocab words render with a lighter `.gloss-word-plain` affordance so real glosses stay visually primary. Wired into example sentences + writing prompt (`WeekDetail.jsx`) and the Journal prompt (`JournalTab.jsx`). All client-side, works offline.

**Cross-device sync** (`src/utils/syncSnapshot.js` + `SyncPanel.jsx`, see `plan-sync.md`): progress moves between devices with **no backend** via one versioned snapshot of the active course's `localStorage`. `exportSnapshot()` auto-collects every `STORAGE_PREFIX-*` key (excludes the device-level `coursekit-active-course`); `importSnapshot(snap, { mode:'replace' })` validates version+course and rewrites the keys; `encode`/`decode` compress with `lz-string`. `SyncPanel` (header button → modal) offers export (QR + copy-paste code + `.json` download) and import (camera QR scan via `jsqr`, paste, or file), reloading after import. `qrcode`/`jsqr` are dynamically `import()`ed to stay out of the main bundle. Online auto-sync (BaaS, opt-in — would relax the no-backend constraint) is on the roadmap in `plan-sync.md`.

**Schedule logic** (`src/utils/schedule.js`): Program start is hardcoded to `Apr 13, 2026`. `getCurrentWeekN()` returns the current week 1–37 based on real date, or `null` if before start or after week 37. `getTodayDayIndex()` returns 0=Mon … 6=Sun, used to highlight today's row in `DAILY`.

**PWA / offline**: `vite-plugin-pwa` with `registerType: 'autoUpdate'`. Workbox precaches all JS/CSS/HTML/PNG/SVG assets plus all `.apkg` files. Service worker is disabled in `npm run dev` — use `npm run preview` to test offline behavior.

**Grammar checking** (`JournalTab.jsx`): Calls `https://api.languagetool.org/v2/check` with `language: config.locale.grammarLang` (`it` for the bundled course; `''` hides the Grammar toggle entirely). This is an external API call — it fails offline, which is intentional and expected.

**Journal writing scaffold** (`JournalScaffold.jsx`, Phase 3 / C3): a collapsible "Aiuto per scrivere" panel in each entry with the week's grammar focus, Italian sentence starters, and the week's vocab as click-to-insert chips. `WeekJournalRow`'s `insertText` appends to the draft (existing debounced auto-save + grammar check fire on change). Pure UI over existing week data, works offline.

**Achievements** (`Achievements.jsx` + `src/utils/achievements.js` + `useAchievements`, Phase 4 / D4): a collapsible "Traguardi" badge grid on the Tracker. Earned state is *derived* from the existing stores (`-progress`, `-srs`, `-streak`, `-journal`) — there is **no** `-achievements` key. `useAchievements` reads those stores once on mount (the Tracker remounts on tab switch, refreshing it).

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

1. ~~**Spaced repetition in the in-browser Practice mode.**~~ **Done (Phase 2 /
   B1).** `PracticeMode` now schedules from a real SM-2-flavored scheduler
   (`src/utils/srs.js` + `useSrs`): per-word ease/interval/due persisted in
   `localStorage` (`italian-bible-srs`). Sessions serve due cards first (earliest
   first) then a few new ones; "Got it"/"Still learning" grade each card and
   advance or reset its schedule. Start screen shows due/new/learned counts and
   an "all caught up" state.
2. ~~**Fill missing IPA.**~~ **Done (Phase 0).** All 259 vocab tuples now carry
   IPA. The 35 that were missing already had correct IPA in
   `scripts/pronunciations.json` — it was a merge gap, not a generation gap, so
   no API call was needed (the values were merged into `studyData.js` directly).
3. ~~**Listening / comprehensible-input mode.**~~ **Done (Phase 3 / C2).** Practice
   has a *Listening* style: TTS speaks the example **sentence** (not just the
   word) at adjustable speed (Slow 0.6 / Normal 0.85), you type what you hear,
   then reveal text + translation and self-grade into the SRS. `SpeakerButton`
   gained an optional `rate` prop (default 0.85).
4. ~~**Active production, both directions.**~~ **Done (Phase 3 / C1).** Practice
   now has a style selector: *Recognition* (IT→EN, tap to reveal), *Recall*
   (EN→IT, type it), and *Cloze* (fill the blanked word in the example sentence,
   ~61% of cards eligible). Typed answers use forgiving matching
   (`src/utils/answer.js` — accent/article-folding + ~20% Levenshtein tolerance,
   reusing `pronunciation.js`); cloze blanks are built by `src/utils/cloze.js`.
   All three styles record to the same SRS store.
5. ~~**Streaks + daily goal + reminders.**~~ **Done (Phase 4 / D1 + D2).**
   `useStreak` (`italian-bible-streak`) tracks a consecutive-day streak and a
   3-item "Today" checklist (read · review · write) on the `TodayCard`;
   practice/journal activity auto-ticks it. `Reminders.jsx`
   (`italian-bible-reminders`) adds an opt-in daily reminder via the Notification
   API — best-effort/local (no backend), nudging once a day when the app is open
   past your reminder hour and you haven't studied. Pure decision in
   `src/utils/reminders.js` (`shouldNotify`).
6. ~~**Persist and surface practice results.**~~ **Done (Phase 2 / B2).**
   Pronunciation attempts now persist (`usePronunStats` → `italian-bible-pronun`).
   `src/utils/wordStats.js` (`struggleList`) combines SRS lapses/low-ease with
   weak pronunciation scores into a ranked "Parole difficili" panel on the
   Practice start screen, with a "Drill these" button that runs an SRS-recorded
   session of just those words.

## Verified repo facts (as of this review)

- **Data totals:** 4 phases, 37 weeks, **259** vocab tuples, **all with IPA** (the
  4th tuple element) as of Phase 0. **5** weeks carry an `italki` array. The
  count is hardcoded in a few UI strings (e.g. "259 cards" in
  `PracticeMode.jsx` / `PronunciationPractice.jsx` / `FlashcardsTab.jsx`); if
  vocab counts change, update those strings too — they are not computed.
- **Tests:** `npm test` runs **237 vitest tests across 27 files**, all passing.
  Pure-logic modules each have a sibling `*.test.js`: `srs`, `wordStats`,
  `cloze`, `answer`, `streak`, `achievements`, `reminders`, `vocabIndex`,
  `pronunciation`, `it2ipa`, `syncSnapshot`, `schedule`, `studyData`,
  `keyVerses`, `dictogloss`, `grammarDrill`, `comprehension`, plus
  `SpeakerButton`, `UiText`, `useProgress`, `useJournal`. New non-trivial logic
  should follow that pure-module-plus-test pattern.
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
