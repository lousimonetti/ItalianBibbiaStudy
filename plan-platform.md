# Plan — Turn this app into **CourseKit**: a config-driven study-app anyone can fork

> Companion to `plan.md` (which tracked building the Italian Bible course, now
> done). This plan is about **generalizing** that finished app into a reusable
> kit so anyone can define their *own* N-week comprehensible-input course —
> Spanish + *Don Quixote*, French + *Le Petit Prince*, Koine Greek + the New
> Testament, German + the news, even a non-language course — by editing **data
> and config, not components**. 37 weeks, 40 weeks, 12 weeks: just a number.

## The one-sentence goal

Separate **what you're studying** (a *course*: language, material, schedule,
vocab, grammar, prompts, branding) from **how you study it** (the engines:
spaced repetition, immersion mode, tap-to-translate, recall/cloze/listening,
streaks, achievements) — so the second never has to be touched to ship the
first.

## Why this is mostly a *lift-and-relocate*, not a rewrite

The hard part is already done. During the build the logic was deliberately put
in **pure, content-agnostic modules** that consume generic shapes:

| Engine | File | Already generic? |
|---|---|---|
| Spaced repetition | `src/utils/srs.js` | ✅ keys off any term string |
| Struggle ranking | `src/utils/wordStats.js` | ✅ |
| Cloze builder | `src/utils/cloze.js` | ✅ works on any `[term, example]` |
| Answer matching | `src/utils/answer.js` | ✅ (article list is the only IT bias) |
| Streaks / goals | `src/utils/streak.js` | ✅ |
| Achievements | `src/utils/achievements.js` | ⚠️ thresholds + "37 weeks" assume the course |
| Immersion mechanism | `src/i18n/*` | ✅ mechanism is generic; the *strings* are content |
| Gloss / vocab index | `src/utils/vocabIndex.js`, `WordGloss` | ⚠️ article-stripping + `it-IT` TTS are IT-specific |

So the work is: **pull the Italian-Bible specifics out of code into a `course/`
definition, and make the handful of locale/branding touch-points read from it.**

## What's hardcoded today (the decoupling surface)

Inventory from the current `main`:

1. **Course content** — `src/data/studyData.js` (`PHASES`, `DAILY`) and a
   *duplicated* copy inside `scripts/generate-anki.cjs`.
2. **Locale** — `it-IT` in `SpeakerButton.jsx`, `WordGloss.jsx`,
   `PronunciationPractice.jsx`; `language: 'it'` for LanguageTool in
   `JournalTab.jsx`; IPA assumed present (4th vocab element).
3. **Schedule** — `src/utils/schedule.js`: `PROGRAM_START = Apr 13 2026`,
   `PROGRAM_WEEKS = 37`.
4. **Branding & prose** — title "Italian Bible Study" (`index.html`, `App.jsx`),
   the tricolore bar, and tool/material copy hardwired into `WelcomeCard.jsx`,
   `GuideSection.jsx`, `WeekDetail.jsx`, `FlashcardsTab.jsx`, `Phase.jsx`
   ("Babbel focus"), `SentenceGuide.jsx`.
5. **Computed-but-hardcoded numbers** — "259 cards", "37 weeks" baked into UI
   strings instead of derived from the data.

That list *is* the backlog. Nothing else needs to move.

## Hard constraints (unchanged, still binding)

- **No backend / no runtime deps.** Static `dist/`, Azure free tier, offline-first.
- **`localStorage` only** for persistence (now: namespace **per course** — see T0).
- Content/config is **plain data** (JS or JSON) committed to the repo; any
  generation (Anki, IPA, audio) stays a **build/offline script**.
- Validation/authoring tooling may use **devDependencies** only (like vitest);
  the shipped app adds none.

---

## The course definition (the heart of the design)

A course is two committed files under `course/` plus optional assets:

### `course/config.js` — identity, locale, schedule, branding, resources
```js
export const config = {
  id: 'it-bible-cei',                       // namespaces localStorage + decks
  brand: {
    name: 'Italian Bible Study',
    tagline: '37 weeks to Christmas — La Bibbia CEI 2008 + Babbel + Anki',
    accent: '#008C45', accentDim: '#d4edda',
    ribbon: ['#008C45', '#c8c4ba', '#CE2B37'],   // was the tricolore bar
  },
  locale: {
    target: 'it-IT',     // TTS + speech-recognition lang
    native: 'en',        // the learner's language (gloss/translation side)
    grammarLang: 'it',   // LanguageTool code ('' disables the Journal check)
    hasIPA: true,        // false ⇒ hide IPA column + pronunciation key
    articles: ['il','lo','la','i','gli','le','un',"l'",…], // for stem-match
  },
  schedule: {
    startDate: '2026-04-13',
    weeks: 37,                              // ← 40, 12, anything
    daily: [ { day:'Mon', task:'…' }, … ],  // was DAILY
  },
  resources: [                              // was the hardcoded Babbel/iTalki/Bible prose
    { id:'text',  name:'La Bibbia CEI 2008', badge:'Primary text', role:'reading', body:'…' },
    { id:'srs',   name:'Babbel',             badge:'15 min/day',   body:'…' },
    { id:'talk',  name:'iTalki',             badge:'review weeks', body:'…' },
  ],
  chrome: { /* optional: target-language UI strings for immersion mode */ },
};
```

### `course/content.js` — the weeks (today's `PHASES`)
Unchanged tuple shape, so the engines need zero changes:
```js
export const phases = [{
  id:'p1', title:'Phase 1: Foundation', book:'Gospel of John', badgeLabel:'Beginner', …,
  weeks: [{
    n:1, d:'Apr 13-19', r:'John 1-2', b:'Greetings…', review:false,
    vocab: [['il Verbo','the Word','In principio era il Verbo','/il ˈvɛrbo/'], …], // IPA optional
    grammar:{ title:'…', body:'…' }, prompt:{ target:'…', native:'…' },
    italki:['…'],
  }],
}];
```
`src/data/studyData.js` becomes a thin re-export of the active course (keeps
every existing import working during migration).

### `course/index.js` — resolve + validate
Merges config+content into one `course` object, runs `validateCourse()` in dev,
and is the single import the app/`useCourse()` reads.

---

## Phased implementation

Each phase ships independently, keeps the **Italian Bible course byte-stable**
(it becomes the bundled reference course), and follows the repo rhythm: pure
logic in tested modules, build → PR → green → merge.

### T0 — Extract the course (foundational, no behavior change) — ✅ DONE
- ✅ `course/{config.js,content.js,index.js}` created; the data moved out of
  `studyData.js`, which is now a back-compat shim re-exporting `PHASES`/`DAILY`/
  `COURSE` (every existing import still works).
- ✅ **Schedule from config:** `schedule.js` reads `startDate`/`weeks` from
  `config.schedule`.
- ✅ **Derived numbers:** the "259 cards" / "37 weeks" / per-phase counts in
  `PracticeMode`, `PronunciationPractice`, `FlashcardsTab`, `GuideSection` are
  now computed from the course.
- ✅ **Validation:** `course/validate.js` (pure — shape, week-count ==
  `schedule.weeks`, unique/contiguous `n`, vocab tuple arity) + `validate.test.js`
  + `npm run validate-course`.
- **Moved to T5:** per-course localStorage key namespacing. It only matters once
  multiple courses coexist; a single fork-and-configure deploy keeps the existing
  keys. Doing it now would mean a migration with no present benefit.
- *Done:* the IT-Bible app behaves identically (lint clean, 164 tests, build +
  preview verified); all course data lives in `course/`.

### T1 — Locale generalization — ✅ DONE
- ✅ New `src/utils/locale.js` centralizes `TTS_LANG`/`NATIVE_LANG`/`GRAMMAR_LANG`/
  `HAS_IPA` and a `LEADING_ARTICLE` regex **built from `config.locale.articles`**
  (longest-first; handles elided `l'`). Generic-by-construction — `locale.test.js`
  proves it works for IT/ES/FR.
- ✅ `locale.target` threaded into `SpeakerButton`, `WordGloss` TTS, and
  `PronunciationPractice` (`rec.lang`); `locale.grammarLang` into the Journal
  check, and the Grammar toggle is hidden when it's empty.
- ✅ `hasIPA:false` ⇒ hides the IPA column, pronunciation-key panels, and the IPA
  on card backs (Tracker + Practice + Pronunciation). `answer.js` / `vocabIndex.js`
  / `cloze.js` now strip articles via the shared `LEADING_ARTICLE`.
- *Done:* flipping `config.locale` retargets audio, dictation, recognition, and
  grammar-check with no component edits (lint clean, 168 tests, build + preview).

### T2 — Branding & resources from config — ✅ DONE (chrome) / partial (deep prose)
- ✅ `App.jsx` header **name** (first word accented) + **tagline** + progress
  **goal** from `config.brand`; the ribbon bar renders from `brand.ribbon`;
  `Phase` topic column from `brand.topicLabel`; `document.title` set from
  `brand.name` in `main.jsx`.
- ✅ `WelcomeCard` intro from `config.brand.about` and the tool list from
  `config.resources[]` (each with `name`/`badge`/`desc`).
- **Deferred to T4:** accent **CSS variables** stay in `index.css` (light/dark are
  two values; runtime injection would fight the theme system — a fork edits the
  two `--accent` lines for now). `GuideSection.jsx`'s long-form methodology prose
  (Babbel/iTalki/CEI how-tos) and `SentenceGuide` examples remain
  course-specific; they're better moved into the course alongside the authoring
  kit (T4), where a `config.guide` blob or course markdown fits naturally.
- *Done:* the app's name, tagline, ribbon, goal, topic label, and tool list all
  come from the course (lint clean, 168 tests, build + preview).

### T3 — Anki generation from the course — ✅ DONE
- ✅ `generate-anki.cjs` now `await import()`s `course/content.js` + `config.js`
  (stays CommonJS) — the duplicated inline **`PHASES` and `PRON`/IPA** copies are
  gone, so the decks can't drift from the app. Cards take IPA from the vocab
  tuple's 4th element (gated by `config.locale.hasIPA`); deck names from
  `config.brand.name`; per-phase filenames a stable `DECK_FILES` map; the
  complete deck is sized to the course's week count.
- **Deferred:** seeding GUIDs/timestamps for deterministic output (the issue #37
  churn item) and moving the per-phase deck filenames into config (so
  `FlashcardsTab` and the generator share one source) — both small follow-ups.
- *Done:* `npm run generate-anki` rebuilds 42 decks (259 cards) from the course;
  full `npm run build` (prebuild → generate-anki) passes; card content unchanged.

### T4 — The authoring kit (the "anyone can pick it up" deliverable) — ✅ DONE
- ✅ `AUTHORING.md` — a from-scratch guide (TL;DR, the two files, spreadsheet
  on-ramp, what you get free, known rough edges).
- ✅ `course/schema.md` — field-by-field reference + the validator's rules.
- ✅ **Scaffolder:** `npm run new-course -- --weeks 40 --phases 4 --id x [--out d]
  [--force]` writes valid `config.js` + `content.js` skeletons with weeks
  pre-numbered `1..N` split across phases; refuses to clobber the active course
  without `--force`.
- ✅ **Spreadsheet on-ramp:** `npm run import-vocab -- vocab.csv` (a small CSV
  parser, IPA optional) prints paste-ready `{ weekN: [[...]] }` vocab.
- ✅ The validator already gives line-pointed errors ("week 12: missing prompt").
- **Deferred:** moving `GuideSection`/`SentenceGuide` prose into the course
  (`AUTHORING.md` tells forks to edit those components for now).
- *Done:* a non-developer can scaffold → fill → validate → run a course from the
  guide. Verified end-to-end (scaffold a 6-week/2-phase demo, import a CSV).

### T5 — (Optional) multiple courses in one deploy
- A `courses/` registry + a course picker; per-course key namespacing already
  exists from T0, so progress stays separate. Achievements/streak read the
  active course. Heavier; only if someone wants a multi-course hub.

## Proving it's generic — example courses

Ship 1–2 tiny example courses alongside the reference one (they double as
fixtures/tests):
- **A 40-week course** (e.g. Spanish + a public-domain novel) — proves the week
  count is just config and the achievements/journey scale to N.
- **A no-IPA, different-locale course** (e.g. French) — exercises
  `hasIPA:false` + `fr-FR` end to end.
`validateCourse` runs over every bundled course in CI.

## Things that must generalize carefully (gotchas)

- **Achievements thresholds** (`achievements.js`) — the "all weeks" badge and the
  50/150-word tiers should derive from `schedule.weeks` / total vocab, not
  constants; phase badges already key off `phases`.
- **Immersion is target-language UI.** Keep it **opt-in per course**: a course
  supplies `config.chrome` (target strings); with none, immersion is simply
  unavailable/falls back to native — no half-translated UI.
- **localStorage migration.** Namespacing keys per course is great for new
  courses but must **migrate the reference course's existing `italian-bible-*`
  keys** so current users don't lose streaks/SRS/progress.
- **Pronunciation mode** depends on browser `SpeechRecognition`, which supports
  many but not all locales — degrade with the existing "unsupported" panel.
- **RTL / non-Latin scripts** (Greek, Hebrew, Arabic) — tokenizer + article
  stemming assume Latin-ish words; flag as a known limit, fixable later.

## Sequencing & effort

| Phase | Outcome | Effort |
|---|---|---|
| **T0** ✅ Extract course + validate (numbers derived; namespacing → T5) | All data in `course/`, app unchanged | M |
| **T1** ✅ Locale generalization | Any language's audio/dictation/grammar | M |
| **T2** ✅ Branding & resources (chrome; deep guide prose → T4) | Course's own name/tagline/ribbon/tools | M |
| **T3** ✅ Anki from course (dedupe) | Decks for any course; no vocab drift | S–M |
| **T4** ✅ Authoring kit (guide, scaffolder, CSV import, validator) | Non-devs can ship a course | M–L |
| **T5** Multi-course hub (optional) | Several courses, one deploy | L |

Recommended order: **T0 → T1 → T2 → T3 → T4** (T5 only on demand). T0 unlocks
everything; T4 is what makes it truly "pick up and build your own."

## Definition of done (per phase)

- Reference Italian course stays **byte-stable** in behavior (snapshot/UI sanity).
- New course-specific state uses the `course-<id>-*` key convention.
- `validateCourse` passes for every bundled course; `npm test` green; `npm run
  build` succeeds; works offline.
- No new **runtime** dependencies; authoring tools are devDeps/scripts only.

## Naming

Working title **"CourseKit"** (or "Comprehensible Course Kit" / "StudyKit"). The
README repositions the repo: *"A fork-and-fill template for building your own
N-week immersive study course — comes with a complete 37-week Italian Bible
course as the worked example."*
