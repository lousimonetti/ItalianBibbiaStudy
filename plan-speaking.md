# plan-speaking.md — Speaking & Thinking Naturally in Italian

## Status

**Phase P1 is implemented, tested, and merged into this branch.**

| Item | Status | Where |
|------|--------|-------|
| S7 Think-in-Italian micro-prompt | ✅ P1 | `src/data/thinkPrompts.js` (+test), `ThinkPrompt.jsx` on the Today card |
| S6 Sentence scramble ("Build") | ✅ P1 | `src/utils/scramble.js` (+test), fifth style in `PracticeMode.jsx` |
| S4a Spoken journaling | ✅ P1 | `DictationMic.jsx` (+`src/utils/speech.js`) in each `JournalTab` week editor |
| S4b 4/3/2 fluency sprint | ✅ P1 | `src/utils/fluencySprint.js` (+test), `FluencySprint.jsx` in each week editor |
| S5 Contrastive traps | ⬜ P2 | not started |
| S1 Phrase chunks / S3 spoken Q&A / S2 transforms | ⬜ P3 | not started |

P1 implementation notes:
- `src/utils/speech.js` centralizes SpeechRecognition detection; `DictationMic`
  auto-restarts recognition on Chrome's silence timeout until the user stops it
  (guarded by an `activeRef`). All mic components render nothing when the API
  is unavailable.
- Sprint transcripts and think-prompt scratch text are deliberately session-local
  (nothing persisted); rounds with speech tick `practiced`, and inserting a
  sprint transcript into the journal flows through the existing debounced
  auto-save (which ticks `journaled`).
- Build style: chips keep punctuation/capitalization as syntactic hints;
  eligibility is 4–12 words (`isScrambleEligible`); duplicate words are
  interchangeable by value in the order check; the shuffle never serves the
  original order when tokens allow.

**Goal:** close the gap the app doesn't yet cover — producing spontaneous
Italian and *thinking in Italian grammar* instead of mentally translating from
English. The app is strong on retention (SRS), comprehension (reading suite),
and pronunciation of known material. What's missing is **automatization**:
retrieving Italian structures directly, under time pressure, as whole chunks —
the thing that makes speech feel natural instead of assembled.

**Diagnosis (why "thinking in Italian" is hard, and what actually trains it):**

- Fluency research (DeKeyser's skill-acquisition theory; Segalowitz on
  automaticity) says the bottleneck isn't *knowing* grammar — it's converting
  declarative knowledge ("piacere works backwards") into procedural skill
  (saying "mi piace" without thinking). That conversion needs **repeated
  production practice under mild time pressure**, not more input.
- Native-like speech is mostly **formulaic chunks** (Wray 2002): natives don't
  assemble "in quel tempo" or "ce l'ho fatta" word-by-word, they retrieve them
  whole. Learners who study word-by-word are forced to translate-and-assemble —
  which is exactly the English-first mindset the user is fighting.
- The specific places English L1 thinking produces wrong Italian are known and
  finite: clitic pronoun placement, piacere-type verbs, null subjects,
  adjective position, preposition–article contractions, essere/avere
  auxiliaries. **Contrastive drilling of exactly those traps** is far more
  efficient than general grammar review.
- Nation's **4/3/2 technique** (Nation & Newton 2009) is the best-evidenced
  classroom fluency activity: say the same monologue three times with
  shrinking time limits. Repetition of *your own* meaning removes the
  what-to-say load so the how-to-say-it pathway gets automatized.

Everything below is data-driven, offline, localStorage-only, and reuses the
existing pipelines: the SpeechRecognition flow in `PronunciationPractice.jsx`,
TTS via `SpeakerButton`, forgiving matching in `src/utils/answer.js`, the SRS
store, and the per-week exercise merge in `courses/it-bible-cei/exercises.js`
→ `content.js`. No backend, ever (see "Explicitly out of scope" at the end).

---

## Feature workstreams

### S1 — Frasi fatte: chunk library with "how Italian construes it" glosses
**The single biggest mindset lever.** Extends `opportunities.md` O11.

- New optional per-week field `phrases` in `exercises.js`:
  ```js
  phrases: [
    { it: 'in quel tempo', en: 'at that time' },
    { it: 'mi piace',      en: 'I like it', lit: 'it pleases me' },
    { it: 'ce la faccio',  en: 'I can manage it', lit: 'I make it there' },
  ]
  ```
  2–4 chunks per week: formulaic biblical frames ("Gesù disse loro", "in
  verità vi dico") **plus** high-frequency conversational chunks that share
  the week's grammar focus. The optional `lit` field is the mindset feature:
  a literal word-by-word rendering that shows how Italian *construes* the
  meaning differently from English. Reading "mi piace = *it pleases me*" once
  does more for thinking-in-Italian than ten conjugation tables.
- Render in `WeekDetail.jsx` as a "Frasi fisse" row (speaker + gloss + lit),
  mirroring the existing vocab table styling.
- Feed them into Practice as SRS cards (they enter `buildCards` as ordinary
  items whose "word" is the whole chunk — Recognition/Recall/Listening all
  work unchanged; Cloze skips them).
- Data authoring: 37 weeks × ~3 = ~110 chunks. UI effort: low.

### S2 — Trasforma: grammar transformation drill
Classic pattern-drill: manipulate Italian *within* Italian — English never
enters the loop. This is the most direct "think in that grammar" exercise.

- New optional per-week field `transform` in `exercises.js`:
  ```js
  transform: [
    { instruction: 'Metti al plurale',
      base: 'Il pastore trova la pecora.',
      answer: 'I pastori trovano le pecore.' },
    { instruction: 'Metti al passato prossimo',
      base: 'Gesù parla alla folla.',
      answer: 'Gesù ha parlato alla folla.' },
  ]
  ```
  Instructions stay in Italian (pluralize, change tense, substitute a clitic
  pronoun, negate). Anchor `base` sentences to the week's vetted examples or
  passage so the Italian is correct.
- New component `TransformDrill.jsx` in `WeekDetail.jsx` (collapsible, sits
  beside `GrammarDrill`); pure logic in `src/utils/transformDrill.js` + test.
  Whole-sentence check via `checkAnswer` (accent/case-forgiving), plus a
  word-level diff on miss (reuse the `dictogloss.js` diff) so the learner sees
  *which* word they failed to transform.
- Counts as `practiced` for the streak. Not SRS-tracked (formative drill).
- Data authoring: 37 × 2. UI effort: low (mirrors `GrammarDrill`).

### S3 — Rispondi subito: timed spoken Q&A
Comprehension questions exist (O5) but they're read-and-tap. This asks them
**aloud** and demands a **spoken answer within a few seconds** — retrieval
speed under pressure is the operational definition of fluency.

- New optional per-week field `questions` in `exercises.js`:
  ```js
  questions: [
    { q: 'Chi ha creato il cielo e la terra?',
      answers: ['Dio', 'Dio ha creato il cielo e la terra'],
      model: 'Dio ha creato il cielo e la terra.' },
  ]
  ```
- New drill inside `PronunciationPractice.jsx` (third entry in `DRILLS`,
  alongside Words / Shadowing — the mic pipeline, `MicButton`, and scoring
  states are already there): TTS asks `q`; a visible ~8-second countdown
  starts; learner answers into the mic; the transcript is matched against
  `answers` with `checkAnswer`-style forgiveness (new pure util
  `src/utils/spokenAnswer.js` + test — canonicalize the transcript, accept a
  match on any acceptable answer or a fuzzy containment of one). Always
  reveal `model` afterwards with a speaker button, and allow self-override
  ("I said it right") since recognition of short answers is imperfect.
- Like Shadowing: ticks `practiced`, does **not** feed `usePronunStats`
  (documented lesson — sentence-level scores skew the per-word struggle list).
- Data authoring: 37 × 2–3. UI effort: medium (timer + one more drill case).

### S4 — Parla: spoken journaling + 4/3/2 fluency sprints
Turns the existing Journal from typed-only into the app's free-speaking room.
**No new data needed** — it runs on the existing weekly prompts.

- **S4a Speak-to-write:** a mic button in `JournalTab` next to each entry;
  SpeechRecognition (continuous mode, `TTS_LANG`) transcribes speech into the
  draft, where the existing debounced auto-save and LanguageTool grammar check
  take over. Speaking first and reading back what you actually said — with
  grammar feedback — is pushed output with repair, the Swain loop in one
  screen. Degrades to hidden when SpeechRecognition is unavailable (same
  guard as `PronunciationPractice`).
- **S4b 4/3/2 sprint:** a new mode reachable from the Journal (or Practice
  start screen): pick this week's `prompt.it`, then speak on it three times —
  60s, then 45s, then 30s — with the transcript captured each round. Show
  words-per-minute per round; the visible goal is *same message, less time*.
  Pure logic in `src/utils/fluencySprint.js` (round timing, wpm from
  transcript, round-over-round delta) + test. Session-local (no persistence
  beyond ticking `practiced` and `journaled`-if-saved); optionally offer
  "insert best transcript into journal".
- UI effort: medium. Highest impact-per-authoring-cost in the plan (zero
  content to write).

### S5 — Trappole inglesi: contrastive interference drills
Directly attacks translate-from-English habits at the known trap points.
Merges `opportunities.md` O14 (false friends) into a broader dataset.

- New course-level dataset `courses/it-bible-cei/contrastive.js` (~50–60
  items), exposed through content the same way exercises are (a `TRAPS`
  export re-exported by `content.js`; forks without one get `[]`):
  ```js
  { en: 'I like the psalms',
    it: 'Mi piacciono i salmi',
    trap: 'piacere',
    note: 'Italian flips it: the psalms please me — the verb agrees with what is liked.',
    wrongs: ['io piaccio i salmi', 'mi piace i salmi'] }
  ```
  Categories: piacere-type verbs, clitic placement (`lo vedo`, not `vedo lo`),
  null subject (drop "io/tu"), adjective position, preposition–article
  contractions (`nel`, `della`), essere/avere auxiliaries, false friends
  (*attualmente*, *parenti*, *sensibile*…).
- New "Trappole" drill mode in Practice: EN prompt → type (or speak) the
  Italian; check with `checkAnswer`. The `wrongs` list holds the predicted
  English-interference answers — when the learner's miss matches one, show the
  targeted `note` ("you translated word-by-word; here's how Italian frames
  it") instead of a generic ✗. Pure logic in `src/utils/contrastive.js`
  (match answer → correct / known-trap / other) + test.
- Per-trap-category accuracy tracked in localStorage
  (`storageKey('traps')`) so the drill serves weakest categories first.
- Data authoring: one file, one-time. UI effort: medium.

### S6 — Costruisci: sentence scramble (O7, unchanged spec)
Word-order intuition — assembling Italian sentences from chips builds the
syntactic feel that typing single words never touches. Already fully spec'd
in `opportunities.md` O7: one more `style` case in `PracticeMode.jsx`, chips
from the example sentence via a pure `src/utils/scramble.js` (+ test:
shuffle-never-equals-original for n>2, exact-order check). SRS-graded like
the other styles. All data exists. Included here because it belongs to this
bundle; effort: low.

### S7 — Pensa in italiano: daily inner-monologue micro-prompt
The habit hook. Thinking in Italian is a between-sessions behavior; the app
can seed it daily.

- A rotating one-liner on `TodayCard` from a small static list (~30 prompts in
  `src/data/thinkPrompts.js`, indexed by day-of-year — deterministic, no
  storage): *"Oggi: descrivi la tua colazione — in italiano, anche solo nella
  tua testa."*, *"Conta gli oggetti sulla tua scrivania, ad alta voce."*
  Each with a tap-to-reveal English gloss (same `UiText` hover pattern).
- Optional "60 secondi" button → a throwaway mic/type scratch box (nothing
  persisted); completing it ticks `practiced`.
- Effort: trivial. Ships first.

---

## Phasing

| Phase | Items | New authored data | Rationale |
|-------|-------|-------------------|-----------|
| **P1** | S7 micro-prompts, S6 scramble, S4 spoken journal + 4/3/2 | ~30 one-line prompts only | Zero/near-zero content cost, immediate speaking surface |
| **P2** | S5 contrastive traps | 1 file, ~50–60 items, one-time | Attacks the translate-from-English habit directly |
| **P3** | S1 phrases, S3 spoken Q&A, S2 transforms | per-week authoring (37 × ~7 items total) | The full per-week production layer, authored in `exercises.js` like O1–O5 |

Each phase is independently shippable. Within P3, author week 1–4 first and
ship with graceful absence (every renderer hides when its field is missing —
same pattern as `passage`/`drill`/`comprehension`), then backfill.

## Implementation notes (repo conventions to follow)

- **Data:** all per-week fields go in `courses/it-bible-cei/exercises.js` and
  merge onto weeks in `content.js` — never into the week definitions. The
  validator ignores optional fields, so nothing breaks validation. Remember
  explicit `.js` extensions on relative imports (Node ESM).
- **Pure module + sibling test** for every non-trivial behavior:
  `transformDrill.js`, `spokenAnswer.js`, `fluencySprint.js`,
  `contrastive.js`, `scramble.js` — each with a `*.test.js`.
- **Speech recognition:** reuse the `PronunciationPractice` pipeline and its
  guards (feature-detect, error recovery). Sentence-level scores never feed
  `usePronunStats` (documented lesson from Shadowing).
- **Storage:** any new persisted key via `storageKey('…')` — planned:
  `-traps`. Everything else is session-local.
- **Locale:** all TTS/recognition through `TTS_LANG`; S5's dataset is
  EN→IT-specific, so it's *course* data (a fork for another language pair
  writes its own or omits it).
- **Immersion mode:** new chrome strings go through `strings.js`/`UiText`
  (Italian-first labels — Frasi fatte, Trasforma, Rispondi, Trappole,
  Costruisci — with English hover glosses fit the existing immersion design).
- **Anki:** none of this touches deck generation; don't commit `.apkg` churn.

## Explicitly out of scope (for now)

- **AI conversation partner** (free-form dialogue with an LLM) — the genuinely
  best tool for spontaneous speech, but it requires an API key and violates
  the no-backend/no-secrets constraint. If the online-sync BaaS relaxation in
  `plan-sync.md` ever lands, an opt-in "bring your own key" conversation mode
  can be revisited. Everything in this plan works offline.
- **Recording/playback of the learner's own audio** (self-comparison against
  TTS) — valuable but needs `MediaRecorder` storage decisions; candidate
  follow-up after S3/S4 prove out the mic UX.
