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

## Where we are today (baseline)

- Three tabs: Tracker, Flashcards (Anki / Practice / Pronunciation), Journal.
- Strong on **exposure**; thin on **retention, listening, and active production**.
- UI chrome is almost entirely **English** — not immersive.
- Practice is **session-only** (no per-card memory) and **recognition-only**
  (IT→EN, tap to reveal).
- Scores in Practice & Pronunciation are **discarded** at session end.
- `SpeakerButton` (it-IT TTS) exists but is **not wired into the Tracker vocab
  table** (`WeekDetail.jsx`).
- 35/259 vocab tuples **lack IPA**.

---

## Workstream A — Immersion foundations (make Italian the default)

The cheapest, highest-impact immersion wins. Mostly UI + a small data layer.

### A1. "Modalità immersione" (Immersion mode) toggle
A global switch (persist `italian-bible-immersion`) that flips UI chrome to
Italian: tab labels (Tracker→*Percorso*, Flashcards→*Schede*, Journal→*Diario*),
buttons (*Inizia*, *Rivela*, *Ce l'ho fatta*, *Sto ancora imparando*), section
headers, and the daily schedule. **Comprehensibility guard:** any Italian chrome
string shows its English on long-press / hover (a tiny `<Gloss it="" en="">`
component). New learners start with it off; one tap immerses.
- New: `src/i18n/strings.js` — `{ key: { it, en } }` map; a `useUiLang()` hook.
- Touches: `App.jsx`, every tab component (swap hardcoded strings for `t(key)`).

### A2. Tap-to-translate everywhere (comprehensible input)
The core "easy to comprehend" lever. Any Italian word/verse rendered in the app
becomes tappable; tapping reveals English + IPA + a speaker button in a small
popover, without leaving the page. Built from existing vocab data (we already
have `[it, en, ex, ipa]`); unknown words fall back to TTS-only.
- New: `src/components/GlossPopover.jsx` + a `WordGloss` wrapper that tokenizes a
  sentence and links tokens to the vocab index.
- Build a vocab lookup index once from `PHASES` (Italian → {en, ipa}).

### A3. Wire TTS into the Tracker vocab table (known gap)
Add `<SpeakerButton>` to each row of `WeekDetail.jsx`'s vocab table and to each
example sentence. Small, already-flagged, high value — the Tracker is the screen
read every week and currently has no audio.

### A4. Fill the missing IPA
Re-run `node scripts/generate-pronunciations.cjs` (needs `ANTHROPIC_API_KEY`) to
close the 35/259 IPA gap, then commit `scripts/pronunciations.json` and the
updated `studyData.js`. Improves the pronunciation key, Practice back-face, and
Pronunciation mode display app-wide.

---

## Workstream B — Retention engine (the biggest fluency lever)

### B1. Lightweight SRS in browser Practice mode
Replace session-only memory with a persistent **SM-2 / Leitner** scheduler.
Store per-word `{ ease, interval, due, reps, lapses, lastSeen }` keyed by the
Italian term in `localStorage` (`italian-bible-srs`). Sessions draw **due** cards
first, then new ones (configurable daily new-card cap). This is the single change
most tied to long-term success and fits the localStorage-only constraint.
- New: `src/utils/srs.js` (pure, fully unit-testable like `pronunciation.js`).
- New: `src/hooks/useSrs.js`.
- Refactor `PracticeMode.jsx` to schedule from the SRS instead of `shuffle()`.

### B2. Persist & surface results → "Parole difficili" (struggle list)
Stop discarding Practice/Pronunciation scores. Persist attempts and surface a
"words you struggle with" view; feed it straight into B1's queue. Unlocks a
visible sense of progress and targeted drilling.

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
| **0 — Hygiene** | Fix lint (`reactHooks.configs['recommended-latest']`); add CI test step; A4 IPA backfill | Unblocks reliable CI; cheap data win | S |
| **1 — Immersion quick wins** | A3 (TTS in Tracker), A2 (tap-to-translate), A1 (immersion toggle) | Highest immersion-per-line; mostly UI | M |
| **2 — Retention** | B1 (SRS), B2 (persist results) | Biggest fluency lever | M–L |
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
