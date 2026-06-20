# Plan — Make Italian Bible Study fully immersive, interactive & enticing

**Goal of this feature set:** turn the app from a *study tracker with downloadable
decks* into an *immersive daily habit* — one where the learner lives a little more
inside Italian every session, stays motivated to come back, yet never feels lost.
Three design pillars guide every item below:

1. **Immersion** — Italian is the default voice of the app, not an afterthought.
2. **Interactivity** — every screen has something to *do*, not just read.
3. **Comprehensibility & adaptability** — immersion with training wheels: instant
   translation-on-demand, difficulty that adapts to the learner, nothing
   intimidating.

## Hard constraints (do not violate)

These come from `CLAUDE.md` and bound every option below:

- **No backend.** Static `dist/` only. No OAuth, no server, no secrets at runtime.
- **`localStorage` only** for persistence. Namespace new keys `italian-bible-*`.
- Must keep building/deploying to **Azure Static Web Apps free tier**.
- **PWA/offline-first.** New features must degrade gracefully offline (TTS works
  offline; speech recognition and LanguageTool do not — that's acceptable).
- Vite pinned `^6`; `generate-anki.cjs` stays CommonJS.
- Any pre-generated content (audio, IPA, hints) is produced by a **one-time
  build/offline script** (like `generate-pronunciations.cjs`) and committed —
  never an API call at runtime.

## Where we are today (updated)

- Three tabs: Tracker, Flashcards (Anki / Practice / Pronunciation), Journal.
- Strong on **exposure**; still thin on **retention, listening, and active
  production** (Workstreams B–C, not yet started).
- ✅ **Immersion mode** (A1) flips UI chrome to Italian with English glosses.
- ✅ **Tap-to-translate** (A2) on example sentences + prompts.
- ✅ **TTS in the Tracker** (A3); `SpeakerButton` now also on the vocab table.
- ✅ **All 259 vocab tuples have IPA** (Phase 0).
- ✅ **Spaced repetition** (B1): Practice now has per-word memory (SM-2) in
  `localStorage`; sessions serve due cards first.
- Practice is still **recognition-only** (IT→EN, tap to reveal) — Workstream C.
- ✅ **Results persist** (B2): pronunciation scores saved; a "Parole difficili"
  panel surfaces struggling words and drills them through the SRS.

---

## Workstream A — Immersion foundations (make Italian the default)

The cheapest, highest-impact immersion wins. Mostly UI + a small data layer.

### A1. "Modalità immersione" (Immersion mode) toggle — ✅ DONE
A header switch (the **IT** pill, persisted `italian-bible-immersion`) flips UI
chrome to Italian: tab labels (Tracker→*Percorso*, Flashcards→*Schede*,
Journal→*Diario*), the Flashcards mode toggle, Practice card buttons (*Rivela*,
*Ce l'ho fatta ✓*, *Sto ancora imparando*), the Tracker section headers, the
progress bar, and the Today card. **Comprehensibility guard:** every Italian
chrome string carries its English as a hover/long-press `title` gloss (with a
faint dotted underline hint). Default is off, so beginners see English; one tap
immerses.
- New: `src/i18n/strings.js` (`{ key: { it, en } }` chrome map),
  `ImmersionContext.js` (`useImmersion` hook + persisted state),
  `ImmersionProvider.jsx` (wraps `<App>`), `UiText.jsx` (`<UiText k="…" />`).
  Behaviour locked by `UiText.test.jsx` (4 tests).
- **Scope (v1):** translated the highest-traffic chrome (tabs, Tracker headers,
  progress, Flashcards/Practice buttons). Journal/Pronunciation deep chrome and a
  touch tap-to-reveal popover (beyond the `title` tooltip) are deferred — add
  keys to `strings.js` and wrap with `<UiText>` to extend coverage.

### A2. Tap-to-translate everywhere (comprehensible input) — ✅ DONE
The core "easy to comprehend" lever. Italian words rendered in the app become
tappable; tapping reveals Italian + English + IPA + a speaker button in a small
popover, without leaving the page. Built entirely from existing vocab data.
- New: `src/utils/vocabIndex.js` — memoized `Map` from PHASES (full term **and**
  article-stripped stem → `{ it, en, ipa }`), plus `lookupWord` and a `tokenize`
  that preserves text exactly and keeps internal apostrophes (`l'unzione`).
  Unit-tested in `vocabIndex.test.js` (10 tests).
- New: `src/components/WordGloss.jsx` (tokenizes a string; only words found in
  the index become interactive — dotted underline) + `GlossPopover.jsx` (the
  translation card). Outside-click / Escape closes it.
- Wired into: Tracker example sentences and writing prompt (`WeekDetail.jsx`)
  and the Journal prompt (`JournalTab.jsx`).
- **Known v1 limits (deferred):** conjugated/derived forms ("crede" vs
  "credere", "adoratori" vs "adorare") and multi-word phrases inside a sentence
  don't match — those words just render plain. Whole-sentence audio is still
  available via the A3 speaker.

### A3. Wire TTS into the Tracker vocab table (known gap) — ✅ DONE
Added `<SpeakerButton>` to each row of `WeekDetail.jsx`'s vocab table (Italian
term, size 15) and to each example sentence (size 13), with compact CSS so the
dense table layout holds on touch. Small, high value — the Tracker is the screen
read every week and previously had no audio.

### A4. Fill the missing IPA
Re-run `node scripts/generate-pronunciations.cjs` (needs `ANTHROPIC_API_KEY`) to
close the 35/259 IPA gap, then commit `scripts/pronunciations.json` and the
updated `studyData.js`. Improves the pronunciation key, Practice back-face, and
Pronunciation mode display app-wide.

---

## Workstream B — Retention engine (the biggest fluency lever)

### B1. Lightweight SRS in browser Practice mode — ✅ DONE
Replaced session-only memory with a persistent **SM-2-flavored** scheduler.
Per-word `{ ease, interval, reps, lapses, due, last }` keyed by the Italian term
in `localStorage` (`italian-bible-srs`). Sessions draw **due** cards first
(earliest due first), then up to `newCap` new ones, capped at `maxSession`.
"Got it" advances the interval (1d → 3d → interval × ease); "Still learning"
lowers ease, resets the streak, and makes the card due immediately.
- New: `src/utils/srs.js` (pure — `review`, `isDue`, `buildQueue`, `stats`;
  10 unit tests in `srs.test.js`).
- New: `src/hooks/useSrs.js` (ref-backed store + version counter).
- `PracticeMode.jsx` now schedules from the SRS instead of `shuffle()`, records
  each grade, shows due/new/learned counts, and has an "all caught up" state
  with a "practice all anyway" fallback.
- **Deferred:** a true *daily* new-card cap (v1 caps per session) and surfacing
  the schedule outside Practice — that's B2 (persist & surface results).

### B2. Persist & surface results → "Parole difficili" (struggle list) — ✅ DONE
Pronunciation attempts now persist (`usePronunStats` → `italian-bible-pronun`:
per-word attempts/last/best/avg). `src/utils/wordStats.js` (`struggleList`, pure,
6 tests) ranks words by combining SRS lapses + low ease with weak pronunciation
scores. A collapsible **"Parole difficili"** panel on the Practice start screen
lists them with reasons and a **"Drill these"** button that runs an SRS-recorded
session of just those words — feeding straight back into B1's scheduler.
- New: `src/utils/wordStats.js` (+ test), `src/hooks/usePronunStats.js`.
- Touched: `PronunciationPractice.jsx` (record each score), `PracticeMode.jsx`
  (struggle panel), `useSrs.js` (`getStore()` accessor).

---

## Workstream C — Active production (output, both directions)

Today's practice is recognition-only. Fluency needs *production*.

### C1. EN→IT recall + cloze / fill-in-the-blank
Add card directions to Practice: **EN→IT typed recall** (forgiving match reusing
`normalize`/`levenshtein` from `utils/pronunciation.js`) and **cloze** built by
blanking the vocab word inside its stored `example` sentence (e.g. *"In principio
era il ____"*). All generated from existing data — no new content authoring.

### C2. Listening / dictation mode (comprehensible input via ear)
A mode that **speaks** an example sentence or verse (TTS, adjustable speed; reuse
`SpeakerButton`'s `rate`) and asks the learner to type or tap what they heard,
then reveals text + translation. Works fully offline. Extends listening from
single words to whole sentences.

### C3. Guided Italian journaling
The Journal already nudges Italian writing + LanguageTool grammar checks. Add
**sentence starters / scaffolds** pulled from the week's grammar focus and vocab,
and an inline word-count/streak nudge, to lower the blank-page barrier.

---

## Workstream D — Motivation & stickiness (make it enticing)

### D1. Streaks, daily goal & progress dashboard
A `localStorage` streak counter (`italian-bible-streak`) tied to the existing
`DAILY` schedule, a small daily goal (e.g. *N cards due + 1 journal line*), and a
"Today" dashboard that turns the current `TodayCard` into an actionable checklist
(read · review N due cards · write 1 sentence). Consistency predicts success more
than any single feature.

### D2. PWA reminders
Opt-in local notifications (Notification API + service worker) to nudge the daily
goal. Free, no backend. Gracefully absent where unsupported (iOS web is limited).

### D3. Celebration & momentum micro-interactions
Lightweight, tasteful: confetti/tricolor flourish on finishing a session or
hitting a streak milestone, animated progress bars, encouraging Italian
micro-copy (*Bravo! · Continua così!*) with English gloss. Pure CSS/JS, no deps.

### D4. Achievements / level map
A visual journey from Easter→Christmas (the 37 weeks) with unlockable badges per
phase/streak/SRS milestone, persisted in `localStorage`. Reinforces the existing
phase structure and gives a reason to return.

---

## Suggested sequencing (incremental, each shippable on its own)

| Phase | Items | Why first | Rough effort |
|------|-------|-----------|--------------|
| **0 — Hygiene** ✅ | Fix lint (`reactHooks.configs['recommended-latest']`); add CI lint+test steps; A4 IPA backfill (all 259 tuples now have IPA) | Unblocks reliable CI; cheap data win | S |
| **1 — Immersion quick wins** ✅ | A3 ✅ (TTS in Tracker), A2 ✅ (tap-to-translate), A1 ✅ (immersion toggle) | Highest immersion-per-line; mostly UI | M |
| **2 — Retention** ✅ | B1 ✅ (SRS), B2 ✅ (persist results + struggle list) | Biggest fluency lever | M–L |
| **3 — Production** | C1 (EN→IT + cloze), C2 (listening), C3 (journaling scaffolds) | Builds on SRS + immersion | M–L |
| **4 — Motivation** | D1 (streaks/dashboard), D3 (micro-interactions), D4 (badges), D2 (reminders) | Compounds everything above | M |

## Risks & guardrails

- **Don't break offline.** Speech recognition (Pronunciation) and LanguageTool
  (Journal grammar) already fail offline by design — keep new online-only
  features (if any) equally graceful. TTS, SRS, journaling, streaks all work
  offline.
- **Don't over-immerse.** Every Italian chrome string needs an English escape
  hatch (gloss on hover/long-press) or beginners churn. Immersion is opt-in and
  reversible.
- **Keep the data model single-source.** New per-word state (SRS, struggle list)
  keys off the Italian term and lives in `localStorage`; `studyData.js` stays the
  one source of vocab. Update the hardcoded "259 cards" UI strings if vocab counts
  change.
- **Testability.** Put logic in pure modules (`srs.js`, tokenizer, match scorer)
  with vitest coverage mirroring the existing `pronunciation.test.js` /
  `schedule.test.js` pattern; keep React components thin.

## Definition of done (per item)

- Works offline where it should; degrades gracefully where it can't.
- New persisted state uses an `italian-bible-*` key and survives reload.
- Unit tests for any non-trivial logic; `npm test` stays green.
- `npm run build` succeeds (CI deploys from it).
- Immersion strings carry an English gloss fallback.
