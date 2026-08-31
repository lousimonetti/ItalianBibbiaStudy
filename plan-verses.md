# plan-verses.md — Deeper verse interaction, and where AI can actually live

Research + scoping pass (2026-08-26) on two questions asked together:

1. Can the weekly verses carry **more interaction** than they do today?
2. Can **AI components** be added — in the iOS app, the web app, or both?

They turn out to be different problems with different answers. (1) is cheap,
works everywhere, and mostly reuses modules that already exist and are already
tested. (2) is cheap *on iOS only*; on the web it is blocked by the
no-backend constraint, and that is a product decision rather than an
engineering one.

**Headline recommendation:** ship the non-AI verse work first (V1–V4, days of
work, every device). Put AI on iOS only, as the already-planned `plan-siri.md`
P3 explanation feature (V5). Do not put AI in the web app unless you are
willing to either relax no-backend or ship a bring-your-own-key flow.

---

## What the verses already do

`src/components/ReadingPassage.jsx` is only 55 lines, but it sits on a lot of
existing machinery:

- every word tappable → `WordGloss` → `vocabIndex` for course vocab, else
  `it2en.lookupCommon` + generated `it2ipa` approximate IPA;
- a per-line `SpeakerButton` (TTS at `TTS_LANG`);
- a "mark as read" button that ticks the streak's `read` flag;
- source lines from `keyVerses.readingLines(week)` — the authored
  `week.passage` when present (all 37 weeks), else the vetted vocab example
  sentences.

And `WeekDetail.jsx` (lines 88–92) hangs `Comprehension`, `Dictogloss` and
`SpokenQA` off the same week, with `GrammarDrill` / `TransformDrill` below the
grammar block.

So the passage is already the densest surface in the app. That is the good
news: the next layer is mostly composition of tested parts, not new
infrastructure.

---

## Workstreams

### V1 — Verse-line scramble *(low effort, high reuse)*

Shuffle the words of a passage line into chips; learner taps them into order.

`src/utils/scramble.js` already ships this logic for the Practice "Build"
style, and — importantly — its three core functions are **sentence-generic**,
taking a plain string rather than a card:

```js
scrambleTokens(sentence)   // → tokens
shuffleScramble(tokens)    // → display order
sameOrder(expected, picked)
```

Only `isScrambleEligible(card)` is card-shaped, so a verse variant needs its
own eligibility check against `MIN_WORDS` (4) / `MAX_WORDS` (12). Long verses
need splitting — `keyVerses.splitSentences(text)` already exists for that.

Estimate: ~1 day. New component beside `ReadingPassage`, no new pure module.

### V2 — Progressive verse memorization *(low effort, new module)*

The classic scripture-memory drill: show the verse, blank one word, then
three, then most, then all — the learner reconstructs at each stage.

**Correction worth recording:** this does *not* reuse `src/utils/cloze.js`.
`makeCloze(term, example, form)` is **term-driven** — it blanks one specific
vocab headword (or its authored inflected `form`) inside that word's own
example sentence, and returns `null` when the term is not literally present.
Progressive memorization blanks *N arbitrary tokens by position* with N
increasing per stage. Same shape, different function.

So V2 is a new pure module (`src/utils/verseRecall.js` or similar) following
the `cloze.js` pattern — pure, sibling `*.test.js` — plus a small component.
Grading should reuse `src/utils/answer.js` (`checkAnswer`) for the
accent/article-folding and typo tolerance already tuned there.

Estimate: ~1–2 days.

### V3 — Shadow the passage line-by-line *(low effort, high reuse)*

`PronunciationPractice.jsx` already has a Shadowing mode that plays an example
**sentence** via TTS, records the learner, and scores the whole sentence
through the existing speech-recognition pipeline. Pointing that same path at
`readingLines(week)` instead of vocab examples is a wiring change.

`src/utils/speech.js` centralizes availability (`getSpeechRecognition`,
`hasSpeechRecognition`), so the mic UI hides itself where unsupported — keep
that discipline.

Per the existing O1 decision, sentence-level scores stay session-local (they
do **not** feed the per-word struggle list) but should still tick the streak.

Estimate: ~1 day.

### V4 — Verses in the SRS *(medium effort — needs a storage decision)*

Today the SRS holds vocab only. Verses are the natural second card type: a
learner who has read Giovanni 1,1–5 in week 1 should meet it again in week 4.

`src/utils/srs.js` is card-type-agnostic — `review(card, grade)`,
`isDue(card)`, `buildQueue(cards, store, opts)`, `stats(cards, store)` — and
`useSrs.recordReview(term, grade)` keys the store by a **plain string**. So
verses can key in directly, but they would silently share a namespace with
vocab, which corrupts `stats()` counts and the `DAILY_NEW_CAP` accounting.

Two options, and this is the decision to make before building:

| Option | Cost | Risk |
|---|---|---|
| Namespace refs in the existing store (`v:Giovanni 1,5`) | No new key, rides existing sync snapshot | `stats`/`newAllowanceToday` need to filter by prefix; easy to miss a call site |
| Separate `storageKey('verse-srs')` store | Clean separation, own cap | New key → must be picked up by `syncSnapshot` (it auto-collects `STORAGE_PREFIX-*`, so this is nearly free) and by the iOS `course.json`/UserDefaults interop |

**Recommendation: the separate store.** `exportSnapshot()` already auto-collects
every `STORAGE_PREFIX-*` key, so sync is free, and it keeps the vocab
new-card cap meaning what it says.

Whichever is chosen, use `storageKey()` — never a hardcoded literal.

Estimate: ~2–3 days.

---

## The AI question

### V5 — iOS: on-device explanation *(viable; already scoped as `plan-siri.md` P3)*

This is the only place AI is currently free, private, offline, and **inside**
the existing constraint rather than relaxing it. `plan-siri.md` establishes:
on-device `SystemLanguageModel` needs **no entitlement**, no network, no API
key, and nothing to declare for `ITSAppUsesNonExemptEncryption`.

The I5 spike (2026-08-23) ran against the real model, and its conclusion
transfers directly to verses:

| | model | `checkAnswer` |
|---|---|---|
| first prompt | 12/16 | **14/16** |
| tuned prompt | **15/16** | 14/16 |
| false accepts | 0 | 0 |
| latency | ~600 ms | microseconds |

The model won on exactly one case in sixteen, and moved 12→15 on **prompt
wording alone** — sensitivity that cannot be regression-tested in CI. So:

> **Do not let the model judge anything. Let it explain.**

On a verse that means on-demand explanation of the *authored* text — "why
*le tenebre non la vinsero* and not *non l'hanno vinta*?" — which is real
pedagogical value that no amount of hand-authoring scales to, and which is
safe to get slightly wrong. A clumsy explanation costs far less than a wrong
verdict.

**Hard constraints to respect:**

- **Gate:** iOS 26+ **and** A17 Pro / M-series, against the project's iOS 16
  floor (`ios-native/project.yml`). A minority of installs will see this. It
  must be an *enhancement* to a path that already works without it — the
  single most important design rule in `plan-siri.md`.
- **Testability:** CI has no Apple Intelligence. Keep every FM call behind a
  protocol in `BibbiaCore` so the fallback path is what `swift test` actually
  exercises — the same anti-drift discipline as the generated fixtures.
- `@Generable` structured output was **not** verifiable in the spike sandbox
  (the macro plugin ships with Xcode, not CommandLineTools), so treat the
  structured-output path as unproven until it builds in CI.

Estimate: ~2–3 days for one feature. Most of it is availability gating and
UI; `IntentLogic.swift` already established the "pure decision logic in
BibbiaCore, thin wiring in the app target" pattern.

### V6 — Web: blocked by constraint, not by difficulty

`CLAUDE.md` hard constraints: no backend, no server-side logic, no environment
secrets, must build to a static `dist/` on Azure Static Web Apps free tier.
Against that, every option has a real cost:

| Option | Why it fails / what it costs |
|---|---|
| Chrome's built-in on-device model | Desktop Chrome only. Nothing on iOS Safari — where a mobile web user actually is. |
| WebLLM / transformers.js over WebGPU | Hundreds of MB to ~1 GB of model download. Breaks the Workbox precache story, the offline-first promise, and free-tier bandwidth. |
| **BYO API key** | User pastes their own key into Settings, stored in `localStorage`, called direct from the browser (which needs an explicit opt-in header — browser calls are blocked by default). Arguably does *not* violate "no environment secrets": there is no server and no build-time secret. Cost is trivial — Haiku 4.5 at $1/$5 per MTok makes a verse explanation a fraction of a cent. But asking public users for an API key is a strange onboarding step. |
| Small serverless proxy | The normal engineering answer, and the one `CLAUDE.md` forbids outright. Would relax no-backend the same way `plan-sync.md`'s BaaS option would. |

**Status: not scheduled.** Revisit only if the no-backend constraint is
deliberately relaxed (the `plan-sync.md` online-sync decision is the natural
moment to decide both at once), or if the app's audience narrows enough that
BYO-key onboarding is acceptable.

### V7 — Content-accuracy caveat (applies to V5 especially)

The CEI 2008 passage text in `courses/it-bible-cei/exercises.js` was populated
**from training knowledge**, because the egress proxy blocks all external
Bible APIs. `CLAUDE.md` records that the `passage` blocks are separately
vetted — unlike the 259 vocab *examples*, which have an open fidelity audit in
`REVIEW-pedagogy.md`. So the risk here is lower than for vocab, but it is not
zero: **an AI layer that explains a verse will confidently explain whatever
text you hand it.** Any V5 work should be sequenced after, or alongside, a
spot-check of the verses it will be pointed at.

---

## Phasing

- **P1 — V1 + V3.** Pure composition of tested modules, no storage decisions,
  no new data. ~2 days total for both.
- **P2 — V2 + V4.** One new pure module (V2) and one storage decision (V4).
  ~4 days.
- **P3 — V5**, as part of the `plan-siri.md` P3 slot. Gated, iOS-only, and
  scoped to *explanation* rather than judgement.
- **Not scheduled — V6.** Blocked on a constraint decision, not on effort.

## Backlog corrections made in this pass

- **O7 (Sentence Scramble) was already shipped** and is now marked as such in
  `opportunities.md` and removed from the `CLAUDE.md` open backlog. It landed
  as `plan-speaking.md` **S6** — the fifth Practice style "Build"
  (`src/utils/scramble.js`, chip UI in `PracticeMode.jsx:22`, SRS-graded,
  eligibility 4–12 words). The two documents used different names for the same
  feature ("Costruisci" vs "Build"), which is how it stayed open on paper.
- **O15 (Reading Speed)** remains open and is a natural rider on V1/V3, since
  both touch `ReadingPassage`.
- **O17 (Sentence-Level Tests)** overlaps V2 — treat V2 as its implementation
  rather than tracking both.
