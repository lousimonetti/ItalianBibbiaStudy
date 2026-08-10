# Pedagogy review — Italian Bible Study / CourseKit

> **Read this first — scope correction.**
> This review was written against commit `94134e0`. While it was being written,
> `main` moved three merges ahead and independently closed several of the gaps
> below. Specifically, `main` now has:
> - **`src/utils/it2en.js`** — a ~370-entry dictionary that fixes the gloss-coverage
>   gap in §2.2 (measured at 17% here). §2.2's *diagnosis* stands; its proposed
>   fix (a `coreWords.js` layer, R3) was **dropped as duplicate work**.
> - **`courses/it-bible-cei/exercises.js`** — per-week drills, comprehension
>   questions, and **real CEI 2008 passage text with verse numbers**, plus
>   `GrammarDrill` / `TransformDrill` / `Dictogloss` / `Comprehension` /
>   `ReadingPassage` / `SpokenQA` components. This closes §2.6 (grammar explained
>   but never practiced) and §2.8 (the primary text isn't in the app), and largely
>   supersedes §4's fidelity concern for the passages it covers. R6's
>   `grammar.drills` was **dropped as duplicate work**.
> - **`contrastive.js` / `traps.js`** — English-interference drills, which
>   overlap nothing here but are worth knowing about.
>
> What was **implemented** from this review, because `main` still lacked it:
> R1, R2, R4, R5, R9, R10, R12, R13 (partial), R14, the lexical-recycling idea
> from R8, the passage notes from §5, and the Devotions rebuild from R7.
> Sections §2.2, §2.6 and §2.8 below are preserved as originally written — the
> measurements were real at the time — but should be read as **already addressed
> on main**, not as outstanding work.

A review of the app against second-language-acquisition (SLA) research for
**adult learners whose L1 is English**, plus concrete opportunities in three
areas the request named: pedagogy, adaptability, and using the biblical text
itself as a teaching instrument.

Measurements below were computed directly from `courses/it-bible-cei/content.js`
(script: `scratchpad/an.mjs`), not estimated.

---

## 1. What the app already does right

These are not filler — each maps to a well-supported finding, and the app
implements them better than most self-built study tools.

| Principle | Evidence in the app |
|---|---|
| **Spaced retrieval beats restudy** (Roediger & Karpicke) | `src/utils/srs.js` — real SM-2-flavored scheduling, per-word ease/interval, persisted. Not a "flip through the deck" toy. |
| **Retrieval must be effortful and productive, not just recognition** | Four practice styles, three of which require production (Recall EN→IT, Cloze, Listening dictation). |
| **Desirable difficulty / forgiving scoring** | `answer.js` accepts ~20% Levenshtein distance + accent/article folding — penalizes only real errors, not typos. Correct call; strict matching kills adult motivation. |
| **New-material throttling** | `DAILY_NEW_CAP = 15` enforced across sessions via `created` timestamps. Most homemade SRS setups fail exactly here. |
| **Output + corrective feedback** (Swain's output hypothesis) | Journal + LanguageTool, with click-to-apply corrections. |
| **Lowering affective filter** (Krashen) | Streaks, confetti, "Continua così!", blank-page scaffolds, no punitive scoring. |
| **Noticing** (Schmidt) | Weekly grammar notes are explicitly framed as *attention directors, not checkboxes* (`GuideSection.jsx`) — that framing is pedagogically correct and rarely stated so clearly. |
| **Interleaving + distributed practice** | Weekly cadence, review weeks at 8/18/28/36/37, `DAILY` schedule varies modality daily. |
| **Phonological encoding** | IPA on all 259 items + TTS everywhere + speech-recognition scoring. |

The architecture is also genuinely good: pure logic modules with sibling tests,
config-driven course data, no backend. Everything below is additive — nothing
here requires tearing down what exists.

---

## 2. Measured gaps

### 2.1 The vocabulary is ~77% nouns. You cannot build a sentence from nouns.

```
259 vocab tuples
  199  article + noun   ("il Verbo", "la luce", "il pozzo")
   40  bare infinitive  ("credere", "guarire")
   20  everything else
```

There are essentially **zero adjectives, adverbs, conjunctions, prepositions,
pronouns, or conjugated verb forms** in the vocabulary. Yet weeks 4, 6, 12, 16,
17, and 30 teach *adjective agreement, prepositions, object pronouns, relative
pronouns, connectives, and argumentative connectors* — grammar points whose
target words are not in the deck. The learner is asked to notice `di / a / da /
in / con / su / per` in week 6 and is never given a single card for them.

For an English-L1 adult, function words are the hardest part of Italian
(preposition choice is nearly arbitrary from an English standpoint) and the
highest-leverage: ~50% of running text. They are the one category totally absent.

### 2.2 Lexical coverage of the app's own example sentences is 17%

Tap-to-translate (`WordGloss`) is described in `CLAUDE.md` as "the
comprehensibility guard." Measured against the example sentences it is asked to
gloss:

```
1,079 word tokens across all example sentences
  185 glossable via the vocab index      → 17%
  411 distinct word forms un-glossable
```

Top un-glossable forms: `di(39) in(17) non(13) dio(13) è(12) per(12) sono(11)
e(10) del(8) nella(8) signore(8) ha(7) nel(7) mio(7) era(6) si(6)`.

Even crediting bare articles as transparent, coverage is ~33%. Nation's research
puts the threshold for unassisted comprehension at **95–98% lexical coverage**.
`dio` and `signore` being un-glossable in a *Bible* course is the clearest
symptom: the index is built only from vocab headwords, so the most frequent
words in the corpus are the ones it can't explain.

### 2.3 "Example sentences" are mostly 4-word fragments, with no translation

```
242 of 259 examples do not begin with a capital (i.e. are clipped fragments)
median length: 4 words     p90: 6 words     max: 9 words
```

The data tuple is `[italian, english, example, ipa]` — **there is no field for
the example's translation.** Three consequences:

1. **Listening mode is actively misleading.** `PracticeMode.jsx:231-232` reveals
   the sentence `card.ex` and then renders `card.en` — the *single word's*
   gloss — in the `.prac-translation` slot. The learner hears
   *"mangiarono e si saziarono"*, types it, and is told the translation is
   **"to be satisfied."** This is a straightforward defect, and it can't be
   fixed in the component because the data doesn't exist.
2. Dictation on a decontextualized 4-word fragment trains transcription, not
   comprehension.
3. The richest comprehensible input available — actual scripture sentences — is
   never presented as input.

### 2.4 39% of cards can't do cloze, silently

```
cloze-eligible:                                    159 / 259  (61%)
headword not literally present in its own example: 100 / 259  (39%)
```

The cause is almost always **inflection**: headword `credere` → example `ha
creduto`; `nascere` → `bisogna nascere di nuovo` (that one works); `saziarsi` →
`si saziarono`. `makeCloze` does a literal substring match and returns `null`.

This is a hidden opportunity, not just a bug. The lemma↔inflected-form
relationship is *precisely* what an English-L1 adult must internalize about
Italian, and the data already encodes 100 worked examples of it. The app throws
them away instead of teaching them.

### 2.5 Words are met once and never met again

```
233 unique terms across 259 tuples
 21 terms (9%) appear in more than one week
```

The SRS re-tests the *card*, but the learner never re-encounters the *word in a
new context*. Nation's estimate is 8–12 encounters in varied contexts for a word
to become usable in production. Card repetition builds a translation pair;
contextual re-encounter builds a word. The course currently delivers the former
only.

### 2.6 Grammar is explained but never practiced

37 grammar notes, all well written, **zero associated exercises**. This is the
single biggest structural gap for adult learners. The research consensus
(Norris & Ortega's meta-analysis; DeKeyser on skill acquisition) is that adults
benefit substantially from *explicit instruction plus form-focused practice* —
explanation alone produces recognition, not control. The app has the explanation
half and none of the practice half.

`checkAnswer` already exists and is exactly the right engine for transformation
drills. The gap is content and one component, not infrastructure.

### 2.7 Binary grading discards information

`review()` accepts only `good` / `again`. Two side effects:

- A card recalled *slowly and painfully* and one recalled *instantly* advance
  identically (both → interval × ease). Adults self-report this difference
  reliably; a `hard` grade is cheap to add and meaningfully improves scheduling.
- A lapse resets `interval` to 0 and `due` to now, with no relearning steps. The
  card returns in the same session then jumps straight back to the 1d→3d ladder.
  A short relearning step (10 min → 1 day) is standard and reduces re-lapses.

### 2.8 The primary text isn't in the app

The Bible passage — the "primary text," per the config — lives on external sites
(`lachiesa.it`, `bibbiaedu.it`). The app cannot gloss the actual chapter, cannot
do assisted reading, cannot track what was read beyond a checkbox, and cannot
present its own vocabulary *in the context it came from*. The reading loop is
the one loop the app doesn't support. (Licensing likely prevents bundling CEI
2008 wholesale — but the ~15–25 verses per week that the vocabulary is actually
drawn from are a different matter, and are the ones that matter pedagogically.)

### 2.9 The Prayers tab is the most underused asset in the app

`PrayersTab.jsx` + `src/data/prayers.js` (undocumented in `CLAUDE.md`) contain
the Rosary, the Creed, the Pater Noster, Ave Maria, Salve Regina, the St. Michael
prayer, and the Leonine prayers, with English throughout.

For this specific learner these texts are *ideal* input, and better than
anything else in the app:

- **The meaning is already known**, by heart, in English. Comprehension is free —
  which is the entire difficulty of finding comprehensible input at this level.
- They are **memorizable formulaic chunks**, and formulaic language is how adults
  achieve fluent production earliest (Wray; Boers & Lindstromberg). Chunks
  bypass the sentence-assembly bottleneck.
- They are **repeated ritually**, delivering the distributed re-encounter that
  §2.5 says the vocabulary lacks.
- They are dense in exactly the grammar the course teaches: `sia santificato`
  (subjunctive, week 19), `venga il tuo regno` (jussive subjunctive), `dacci`,
  `rimetti`, `liberaci`, `prega per noi` (imperatives + clitic attachment,
  never taught), `che sei nei cieli` (relative `che`, week 16), `benedetta fra
  le donne` (agreement, week 4), `fu concepito … nacque … patì … discese …
  risuscitò … salì` (passato remoto — a whole tense the course never teaches,
  despite it being everywhere in the CEI narrative text).

Currently the tab is read-only text with one whole-prayer TTS button. It is
connected to nothing: not the SRS, not Listening, not the grammar weeks, not the
streak.

### 2.10 Smaller items

- **No `hard` word-level tracking outside SRS/pronunciation.** `struggleList` is
  good but only sees two signals.
- **Listening has two speeds and no repetition-until-understood loop.** The
  standard technique (listen → listen again → reveal) isn't enforced; there's a
  single Reveal button.
- **No shadowing / chorusing anywhere**, despite full TTS and mic infrastructure
  both existing. Shadowing is the highest-yield pronunciation activity available
  and needs no new dependencies.
- **`si saziarono`-type reflexives, clitics, and `passato remoto`** — three of the
  most confusing features for English speakers reading the CEI text — appear
  constantly in the examples and are never taught. `passato remoto` is
  conspicuous: weeks 8–11 teach `passato prossimo` and `imperfetto`, but the
  narrative text the learner is reading is in `passato remoto` (`vinsero`,
  `mangiarono`, `nacque`, `scoppiò`). The course teaches the spoken past and
  assigns the literary past.

---

## 3. Recommendations, ranked by (learning gain ÷ effort)

### P0 — correctness

**R1. Fix the Listening translation mismatch.** Add an optional 5th tuple
element `exEn` (example translation). Until populated, Listening should show the
Italian sentence and the word gloss *labeled as the word gloss*, not as the
sentence translation. `PracticeMode.jsx:231-232`.

**R2. Tell the learner why Cloze shrank.** The Cloze button disables only when
*zero* cards qualify; otherwise the deck silently drops 39%. Show the eligible
count on the style button.

### P1 — highest learning gain

**R3. Add a core-vocabulary layer (`course/coreWords.js`).** ~150 high-frequency
function words and conjugated forms: prepositions and `preposizioni articolate`,
subject/object/clitic pronouns, `essere`/`avere`/`fare`/`dire`/`potere`/`volere`
conjugated in the tenses the course teaches, conjunctions, the top 30 adjectives
and adverbs. Feed it into `vocabIndex` (fixes §2.2 immediately — gloss coverage
should exceed 90%) and optionally into the SRS as a separate deck.

This is the single highest-leverage change in this document. It fixes
comprehensibility, gives the grammar weeks their missing target words, and
unblocks real sentence work.

**R4. Add example-sentence translations + promote examples to real sentences.**
Extend the tuple to `[it, en, ex, ipa, exEn]` (optional, back-compatible; the
validator can warn rather than fail). Then:
- Listening becomes real dictation-with-comprehension.
- A new **Sentence Recall** style (EN sentence → type the Italian) becomes
  possible — the strongest production exercise the app could offer, and
  `checkAnswer` already handles the grading.
- The Tracker vocab table becomes readable input rather than a fragment list.

**R5. Teach the lemma↔inflection relationship.** Add optional `form` to the
tuple: the inflected form as it appears in the example (`credere` → `ha
creduto`). Then:
- `makeCloze` matches on `form` first → cloze eligibility ~100%.
- The card back can show `credere → ha creduto (passato prossimo)`, converting
  100 existing silent failures into 100 morphology lessons.
- A new **Transformation** practice style falls out for free: given `credere` +
  "passato prossimo, 3rd sing." → type `ha creduto`.

**R6. Give every grammar note 3–5 auto-checked items.** Add optional
`grammar.drills: [{ prompt, answer, hint }]` per week. Render below the grammar
box in `WeekDetail` and as a practice style. Reuse `checkAnswer`. This closes
the largest structural gap (§2.6) with one component and content work — no new
engine.

**R7. Activate the Prayers tab.** In rough order of value per unit of work:
1. **Line-by-line rendering** with per-line TTS and per-line English toggle
   (currently the whole prayer is one blob and one button).
2. **Shadowing mode**: play a line → learner repeats → `scorePronunciation`
   (already built) scores it → next line. This reuses `PronunciationPractice`'s
   entire pipeline against far better material.
3. **Chunk cards in the SRS**: prayer lines as cloze items (`sia ____ il tuo
   nome`). Formulaic chunks are the fastest route to fluent production.
4. **Cross-link to grammar weeks**: week 19 (congiuntivo) links to the Pater
   Noster; week 26 (formal/informal register) links to the fact that God is
   always `tu`; a new passato remoto note links to the Creed.
5. Count prayer practice toward the streak.

**R8. Deliberate lexical recycling.** When generating a week's example
sentences, prefer sentences that also contain words from 2–6 weeks earlier, and
mark recycled words in the UI ("seen in week 3"). Even without new content, a
"words from earlier weeks appearing in this week's reading" panel is derivable
from existing data and creates re-encounter.

### P2 — scheduler and modality polish

**R9. Add a `hard` grade** (ease −0.15, interval × 1.2) and **relearning steps**
after a lapse (10 min, then 1 day) before rejoining the ladder.

**R10. Enforce the listen-twice loop** in Listening mode: first Reveal press
replays instead of revealing (once), then reveals.

**R11. Surface "N due" outside Practice** — already on the backlog (issue #37);
it's the cheapest retention win available.

### P3 — adaptability (CourseKit)

The template goal is "fork and fill with no component edits." Four things
currently break that:

**R12. `src/data/prayers.js` + `PrayersTab` are course content in `src/`.** A
fork building a Spanish business-language course gets a hardcoded "Preghiere"
tab of Catholic prayers. Move to `courses/<id>/devotions.js` (or a generic
`texts.js` — "memorized texts" is the general category: prayers, poems, songs,
proverbs, oaths) and hide the tab when the active course defines none.

**R13. `GuideSection.jsx` / `SentenceGuide.jsx` hold course-specific prose.**
Already noted in `CLAUDE.md` as a follow-up — worth doing, since `SentenceGuide`
in particular is a per-language artifact (Italian sentence patterns) sitting in
a shared component.

**R14. Hardcoded `37`** in `src/App.jsx:156` and `src/utils/achievements.js:27`
(`'All 37 weeks'`, `weeksDone >= 37`) — should read `config.schedule.weeks`. The
achievement is silently unearnable in any course that isn't 37 weeks.

**R15. Anki generation and the Flashcards download list target the default
course only** — known limit; worth stating in `AUTHORING.md` as a documented
constraint if it isn't going to be fixed.

Schema additions from R3–R6 should all be **optional fields**, so existing
courses keep validating and `npm run validate-course` can warn (not fail) on
absence.

---

## 4. Text fidelity — one thing to verify

The config states examples are drawn from **La Bibbia CEI 2008**. Several
examples look like paraphrase or a different edition. Week 1 has:

```js
['le tenebre', 'the darkness', 'le tenebre non la vinsero', ...]
```

CEI 2008 revised this verse; CEI 1974 and CEI 2008 differ in both the number of
`tenebra/tenebre` and the verb. Similar questions apply anywhere an example
reads more smoothly than the liturgical text.

This matters more than it might seem: the whole design promise is that the
vocabulary the learner drills is the vocabulary they will meet in the chapter
that evening. Every paraphrased example is a card that fires on nothing. **An
audit pass of all 259 examples against the CEI 2008 text is worth doing**, and
would pair naturally with the R4 (translations) and R5 (inflected forms)
content work — one pass through the data, three improvements.

---

## 5. Teaching the passages *through* the grammar

This is the part the request gestured at, and it is where this app could become
genuinely distinctive. Right now the grammar notes and the biblical content run
on parallel tracks: the grammar note for week 1 is "essere e avere," while the
text sitting right there is the Prologue of John — one of the most
grammatically loaded passages in scripture, where **the tense choices carry the
doctrine**.

The proposal is a new optional field, `week.exegesis`, rendered in `WeekDetail`:
a short passage note that explains a theological point *by way of an Italian
grammatical form*. Not devotional commentary bolted on; the grammar **is** the
observation.

Six worked examples, drawn from weeks already in the course. (Italian wordings
below should be verified against CEI 2008 per §4 before shipping.)

### 5.1 Week 1 — John 1:1–14 · the imperfetto of eternity

> **In principio *era* il Verbo** … *tutto **è stato fatto** per mezzo di lui* …
> *e il Verbo **si fece** carne*

Three different past forms in fourteen verses, and the difference is the whole
argument:

- **`era`** — *imperfetto*. Unbounded, no beginning, no endpoint. Italian's
  imperfect describes a state that simply *obtained*. The Word doesn't *begin*;
  it *was already being*.
- **`è stato fatto`** — *passato prossimo*, passive. Bounded, completed,
  agentive. Creation is an event with a start and a finish, done *through* him.
- **`si fece`** — *passato remoto*, reflexive. A single, punctual, historically
  distant act. The Incarnation is a moment, not a state.

So the Prologue's central distinction — *the Word was, the world was made, the
Word became* — is carried entirely by aspect. An English speaker reads "was /
was made / became" and sees three flat past tenses. An Italian reader sees three
different relationships to time.

**Language payoff:** this is the clearest possible introduction to
imperfetto-vs-perfective, which is the #1 persistent difficulty for English-L1
learners of Romance languages, and which the course currently defers to week 11.
Teaching it in week 1 *as a fact about this text* is more memorable than
teaching it in week 11 as a rule.

### 5.2 Week 7 — John 15 · the pronoun that shouldn't be there

> **Io sono** la vite, voi i tralci

Italian is a **pro-drop** language: `sono la vite` is complete and normal.
Stating `io` is *marked* — it means contrast or emphasis. It is the difference
between "I'm the vine" and "***I*** am the vine."

Every one of John's "I am" sayings does this: `Io sono il pane della vita`, `Io
sono la luce del mondo` (already in week 4's vocab), `Io sono il buon pastore`
(week 5), `Io sono la risurrezione`. The Italian preserves the emphatic weight of
the Greek ἐγώ εἰμι that English simply cannot mark, because English requires the
subject pronoun anyway.

**Language payoff:** teaches pro-drop and the pragmatics of pronoun use — a
feature English has no equivalent for, and one learners routinely get wrong by
over-supplying pronouns. Here the learner meets it as a *literary device* rather
than a rule.

### 5.3 Week 9 — Luke 1 · Mary's subjunctive, and the prophetic perfect

Two grammar lessons in one chapter.

**The fiat** (Luke 1:38) — *Avvenga di me secondo la tua parola* — is a
**subjunctive of volition**. Not "it will happen" (indicative, prediction), not
"let it happen" as a command, but the optative subjunctive: consent to something
not yet real. Mary's answer is grammatically an *assent to a possibility*. The
entire theology of the fiat is in the mood of one verb.

**The Magnificat** (Luke 1:46–55) then does something stranger. It opens in the
**present** — `L'anima mia magnifica il Signore` — and immediately switches to
**perfect**: `ha guardato l'umiltà … ha spiegato la potenza … ha rovesciato i
potenti … ha innalzato gli umili`. God has *already* thrown down the mighty and
raised the lowly. This is the **prophetic perfect**: a future so certain it is
narrated as accomplished. The tense is the claim.

**Language payoff:** week 19 currently introduces the congiuntivo abstractly, in
Acts. Anchoring it to the fiat gives it an unforgettable hook. And the prophetic
perfect gives a *reason* to care about passato prossimo (week 8–9) beyond
conjugation drill.

### 5.4 Week 13 — reflexives, and what `si` is doing

Week 13 teaches reflexive verbs. The text is full of them doing four different
jobs, and English collapses all four:

| Italian | job | English |
|---|---|---|
| `si lavò le mani` | true reflexive — to oneself | he washed his hands |
| `si saziarono` (wk 3) | inchoative — a change of state | they were satisfied |
| `il Verbo si fece carne` | middle voice — became | the Word became flesh |
| `si dice che…` | impersonal `si` — one says | it is said |

`si` is the hardest little word in Italian for English speakers, precisely
because English has no reflex for it. Teaching it as *four jobs of one clitic*,
with a scripture example for each already present in the vocabulary, is far
more effective than "reflexive verbs are actions done to oneself" (the current
week 13 note).

### 5.5 Week 21 — Acts · the divine passive

Week 21 teaches the passive voice. Scripture is the reason the passive matters:
the **divine passive** (*passivum divinum*) is a Semitic reverence idiom in
which God is the deliberately unnamed agent.

> `sarà dato` — it will be given [by God]
> `beati i perseguitati, perché di essi è il regno`
> `i vostri peccati sono perdonati` — your sins are forgiven [by God]

Italian gives you two ways to do this, and choosing between them is a real
grammar lesson:

- `essere` + participle — `sono perdonati` (agent suppressible, state or event)
- the **`si passivante`** — `si perdonano i peccati` (agent structurally
  impossible to state)

**Language payoff:** the `si passivante` is a genuinely Italian-specific
construction with no English counterpart, and it is normally taught as a dry
transformation. Here it has a reason to exist.

### 5.6 Week 26 — register · why God is always `tu`

Week 26 teaches `tu` vs `Lei`, formal vs informal. Italian devotional language
makes the point better than any textbook dialogue:

> `Padre nostro, che **sei** nei cieli` — 2nd person **singular, informal**
> `Ave, o Maria, piena di grazia, il Signore è con **te**`
> `Santa Maria… **prega** per noi` — informal imperative

Italian would use `Lei` for a shopkeeper, a stranger, a bank clerk. It uses `tu`
for God. That is a deliberate theological statement about intimacy encoded in a
pronoun choice — and a learner who has internalized *why* will never again
wonder which form to use with a friend.

This also directly links the **Prayers tab** (§2.9) to the grammar syllabus,
which is R7's cross-linking recommendation made concrete.

### 5.7 A gap worth naming: `passato remoto`

The narrative spine of the CEI Gospels is `passato remoto` — `vinsero`,
`nacque`, `patì`, `discese`, `risuscitò`, `salì`, `scoppiò`, `mangiarono`. The
course teaches `passato prossimo` (weeks 8–10) and `imperfetto` (week 11) and
never teaches `passato remoto` at all.

This is defensible for *speaking* — modern northern spoken Italian uses it
rarely. It is not defensible for *reading the assigned text*, which is what the
learner does six days a week. At minimum the course needs a recognition-only
note: "you will not say these, but you will read them constantly; here is how to
recognize the pattern and map it to the infinitive." The Apostles' Creed in the
Prayers tab is a compact, already-memorized paradigm of it.

---

## 6. Suggested sequencing

Each step is independently shippable and leaves the app working.

| Step | Work | Unlocks |
|---|---|---|
| 1 | R1, R2, R14 — defect fixes | Correctness; ~1 hour |
| 2 | R3 — `coreWords.js` + wire into `vocabIndex` | Gloss coverage 17% → 90%+; grammar weeks get their target words |
| 3 | R4 + R5 — content pass adding `exEn` and `form`, audited against CEI 2008 (§4) | Real Listening, Sentence Recall, ~100% cloze, morphology teaching |
| 4 | R6 — `grammar.drills` schema + drill component | Closes the explain-without-practice gap |
| 5 | R7 — Prayers: line-level UI, shadowing, chunk cards | Turns the best material in the app into the most-used |
| 6 | `week.exegesis` field + §5 notes | The differentiator — grammar as exegesis |
| 7 | R9, R10, R8 — scheduler and recycling polish | Retention |
| 8 | R12, R13, R15 — CourseKit cleanup | The fork-and-fill promise actually holds |

Steps 2–3 are the ones that matter most; steps 5–6 are the ones no other app
does.
