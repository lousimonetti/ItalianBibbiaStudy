# Language Learning Opportunities Assessment

**Project:** ItalianBibbiaStudy  
**Date:** 2026-06-26  
**Scope:** Adult L2 Italian acquisition — assess current feature set against research-backed best practices and identify highest-leverage improvements.

---

## Implementation status

**O1–O5 are fully implemented, tested, and merged.** All 37 weeks carry authored
drill, comprehension, and passage data in `courses/it-bible-cei/exercises.js`.

| Item | Status | Notes |
|------|--------|-------|
| O1 Shadowing | ✅ Complete | Second drill type in `PronunciationPractice.jsx` |
| O2 Interactive reading | ✅ Complete | `ReadingPassage.jsx` + CEI 2008 passages for all 37 weeks |
| O3 Grammar drill | ✅ Complete | `GrammarDrill.jsx`, 2 items × 37 weeks |
| O4 Dictogloss | ✅ Complete | `Dictogloss.jsx`, word-level diff, scored per verse |
| O5 Comprehension checks | ✅ Complete | `Comprehension.jsx`, 2 items × 37 weeks |

**O2 passages**: CEI 2008 text (4–8 key verses per week) was authored from
training knowledge and committed to `exercises.js`. The `week.passage` field was
originally left as a drop-in upgrade slot because the build sandbox blocked all
external Bible APIs (`api.getbible.net`, `bibbiaedu.it`, `scrutatio.it` — all
returned 403 via the egress proxy). The passages are now fully populated; if a
user later wants to verify or replace individual verses against a canonical
online source, they can update `exercises.js` verse-by-verse — the data shape
and rendering pipeline are stable.

**O6–O17 remain open.** See the MEDIUM and LOW priority sections below.

---

## Implementation learnings

Recorded here so future sessions don't re-derive these decisions.

**Proxy egress policy blocks all Bible sources.** The Claude Code remote
environment routes outbound HTTPS through a policy-enforcing proxy that
whitelists only package registries (npm, pypi, etc.) and Anthropic endpoints.
`api.getbible.net`, `bibbiaedu.it/CEI2008/`, `scrutatio.it/bibbia/` and
`bible-api.com` all return 403 at the CONNECT level — not a site auth issue, a
network policy one. Do not retry these; use training knowledge or have the user
paste text manually.

**Exercise data stays in `exercises.js`, not `content.js`.** The merge pattern
(`content.js` maps `rawPhases` and spreads `EXERCISES[week.n]` onto each week)
keeps the large authored body out of the week definitions and is easy to extend.
New optional fields (`passage`, `drill`, `comprehension`) are ignored by the
validator, so adding more exercise types doesn't break validation.

**Node ESM requires explicit `.js` extensions on relative imports.** When
`content.js` was first changed to `import { EXERCISES } from './exercises'`
(without `.js`), Node's ESM resolver threw `ERR_MODULE_NOT_FOUND`. Always use
`./exercises.js` (the explicit extension) in the course data files — Vite handles
bare imports fine but the Anki generator (`generate-anki.cjs`) and the validator
both run in Node and need the extension.

**Shadowing scores must not feed `usePronunStats`.** Shadowing scores the whole
example sentence; per-word pronunciation stats (`usePronunStats`) are keyed by
the vocabulary term. Mixing sentence-level scores into the per-word store skewed
the "Parole difficili" struggle list (sentences are harder than words, so all
items appeared to be struggling). Shadowing calls `recordActivity('practiced')`
for the streak but does not call `recordPronun`. Word-mode pronunciation still
feeds both.

**Passage text length for dictogloss.** 4–8 verses per week is the right range.
Shorter (1–3) doesn't give the dictogloss enough reconstruction challenge; longer
(10+) makes the verse selector loop feel repetitive. Key-verse excerpts rather
than continuous chapters also let the passage highlight theologically central
content, which improves motivation.

**`generate-anki.cjs` churn is non-deterministic.** Every `npm run build`
rewrites all 42 `.apkg` files with new timestamps/GUIDs even when card content is
unchanged. Always run `git checkout -- 'public/anki/*.apkg'` before committing if
the build ran — committing the churn bloats the repo with no content change.

## What the App Does Well

Before identifying gaps, it's worth naming what's already solid, because these are the right foundations:

- **Spaced repetition with SM-2.** The core retention engine is research-validated. Session scheduling (due-first, new-card cap, lapses) mirrors best-practice implementations.
- **Multiple retrieval modes.** Recognition, Recall, Cloze, and Listening address different retrieval pathways. Interleaving them (which the style selector enables) has strong research support over blocked practice (Kornell & Bjork, 2008).
- **Production output.** The weekly journal with LanguageTool grammar checking is genuine pushed output — learners must produce, not just recognise.
- **Contextual vocabulary.** Words are always paired with authentic example sentences from the biblical text, not decontextualised definitions.
- **Struggle identification.** Combining SRS lapses + pronunciation scores into a ranked drill list is a meaningful proxy for the words most needing retrieval practice.
- **Motivation scaffolding.** Streaks, badges, the Today checklist, and opt-in reminders address the adult learner's primary obstacle: consistency.

---

## Research Framework

Adult L2 acquisition research consistently identifies four acquisition conditions (following Lightbown & Spada, Nation, Swain, and Schmidt):

1. **Noticing** — learners must consciously attend to target forms before acquiring them.
2. **Comprehensible input** (Krashen's i+1) — exposure at just above current level, in sufficient quantity.
3. **Pushed output** (Swain's Output Hypothesis) — producing language under communicative pressure exposes gaps that input alone cannot.
4. **Feedback and error repair** — timely, specific feedback on form closes those gaps.

The app's strongest coverage is retention (#1 via SRS retrieval) and some output (#3 via journal). The largest gaps are in quantity and interactivity of comprehensible input (#2) and specificity of feedback on form (#4).

---

## Opportunities by Priority

Opportunities are grouped as **High / Medium / Low** based on estimated impact on fluency and implementation tractability given the existing architecture.

---

### HIGH PRIORITY

#### O1 — Shadowing Mode
**Research basis:** Shadowing (listening + simultaneous or slightly-delayed repetition) is one of the highest-impact techniques for prosody, fluency, and phonological encoding in adult learners (Tamai, 2005; Graham et al., 2011). It targets suprasegmentals (rhythm, stress, liaisons) that isolated word-level practice cannot reach.

**Gap:** The app has TTS for individual words and sentences, and speech recognition for pronunciation scoring — but no mode that combines *listening + speaking simultaneously*. The Listening mode requires typing, not speaking.

**Opportunity:** Add a "Shadowing" session type in PracticeMode or PronunciationPractice:
1. TTS plays the example sentence (or a longer phrase).
2. Learner immediately repeats it aloud (0.5–1s delay, or simultaneous).
3. Speech recognition captures the utterance and scores it against the full sentence (already possible with the existing recognition + Levenshtein pipeline).
4. Record score into `usePronunStats` alongside word-level attempts.

This reuses `SpeakerButton`, the speech recognition in `PronunciationPractice.jsx`, and `answer.js` — the plumbing is largely already there.

---

#### O2 — Interactive Bible Passage Rendering
**Research basis:** Extensive reading of authentic, meaningful text at a comfortable level is one of the highest-return activities for vocabulary growth and reading speed in adult learners (Nation & Wang, 1999; Day & Bamford, 1998). The app teaches vocab *about* the passages but the passages themselves are read externally.

**Gap:** The weekly reading (e.g., "Read John 1:1-18") happens in an external app or printed Bible. The learner gets no glossing, no word-tapping, no comprehension scaffolding on the actual text. The tap-to-translate `WordGloss` infrastructure already exists and works on any Italian string — it just isn't applied to the biblical text.

**Opportunity:**
1. Add the Italian Bible text for each week's reading passage to `content.js` (one field per week, a short string of 3–8 verses).
2. Render it in `WeekDetail.jsx` with `<WordGloss>` wrapping — every word becomes tappable for IPA + translation.
3. Add a "Mark as read today" button that ticks the streak's `read` flag (currently this is done manually via a checkbox with no actual text to read in-app).

This transforms a passive checkbox into genuine comprehensible-input practice within the app. The `WordGloss` + `vocabIndex` pipeline already handles every word — known vocab shows the full gloss, unknown words generate approximate IPA.

---

#### O3 — Grammar Drilling (Form-Focused Practice)
**Research basis:** Passive grammar notes improve declarative knowledge but don't build procedural fluency. Form-focused instruction — especially when tied to the week's communicative content — measurably improves accuracy in adult learners (Norris & Ortega, 2000; Ellis, 2002).

**Gap:** Each week has a `grammar` field (`{title, body}`) with an HTML explanation. Learners read it but never practise the specific form. The journal prompt provides output, but free production is not a diagnostic — learners avoid structures they're unsure of.

**Opportunity:** Add a "Grammar drill" section in WeekDetail (collapsible, like JournalScaffold):
- 3–5 fill-in-the-blank sentences targeting that week's grammatical feature.
- Sentences drawn from or modelled on the week's Bible passage.
- Auto-checked with the same `answer.js` logic.
- Not SRS-tracked (short formative task, not a retention item).

This is the lowest-infrastructure option: purely static data added to each week's `grammar` object, rendered as a simple drill UI.

---

#### O4 — Dictogloss (Listen → Reconstruct)
**Research basis:** Dictogloss (Wajnryb, 1990) is one of the most efficient techniques for simultaneous grammar and vocabulary consolidation in adult learners: listen to a passage, take notes, reconstruct it in writing, compare with original. It activates both input processing and pushed output in a single task.

**Gap:** The Listening mode does single-sentence dictation. The journal is weekly free writing on a prompt. Neither bridges into passage-level listening with reconstruction.

**Opportunity:** Add a "Passaggio" (passage) mode within Practice:
1. TTS plays the week's Bible excerpt (3–5 verses) once at normal speed, twice at slow speed.
2. Learner types their reconstruction (a paragraph, not word-for-word).
3. Show the original text; highlight differences with a diff view (diffing by sentence, not character — a simple `split('.').map` comparison).
4. No automatic grading; learner self-evaluates. The comparison view does the pedagogical work.

This requires the passage text (see O2) and TTS (already exists), plus a simple diff renderer. The JournalTab's auto-save pattern handles the draft.

---

#### O5 — Comprehension Checks on Weekly Readings
**Research basis:** Comprehension questions drive deeper processing of input (Nation, 2001). Without them, extensive reading can become passive decoding rather than active meaning-making.

**Gap:** There are no comprehension questions on the weekly Bible passage. Learners have no way to verify they understood what they read.

**Opportunity:** Add 2–3 simple comprehension questions per week to `content.js` (a new `comprehension` field). Format: true/false or multiple choice (3 options). Render them in WeekDetail after the reading text (once O2 adds the text). Auto-check answers; no SRS tracking — these are formative comprehension checks, not retention items.

The data addition is significant (37 × 3 questions) but the UI component is trivial.

---

### MEDIUM PRIORITY

#### O6 — Morphological Pattern Drills (Word Family Awareness)
**Research basis:** Morphological awareness — recognising that *amare/amato/amabile/amore* share a root — is a robust predictor of vocabulary growth and reading speed in adult learners of inflected languages (Singson et al., 2000; McBride-Chang et al., 2005). Italian's rich morphology makes this especially high-value.

**Gap:** Vocab items are treated as atomic units. "amare" and "amato" are separate cards with no visible relationship. Learners build no mental grammar of Italian morphology from the app.

**Opportunity:**
1. Add optional `root` and `family` fields to vocab tuples (e.g., `root: 'am'`, `family: ['amare', 'amato', 'amore']`).
2. In the Practice card back and WeekDetail vocab table, show "Related: amare / amato / amore" as a link-list.
3. When a card is marked "Again," offer to queue related forms for a quick recognition pass.

The data annotation is the main cost; the UI is a small extension to the existing card-back template.

---

#### O7 — Sentence Construction (Word-Order Scramble)
**Research basis:** Sentence-unscrambling tasks (also called "jumbled sentences") improve awareness of syntactic structure and are particularly effective for learners of verb-final or VSO languages. For Italian (SVO with flexible topic-fronting), it builds intuition for canonical vs. marked word orders.

**Gap:** Production tasks require either typed single-word recall (Recall mode) or typed reconstructed sentences from hearing (Listening mode). There's no task where learners assemble a grammatically correct Italian sentence from given words.

**Opportunity:** Add a "Costruisci" (Build) card style in PracticeMode:
- Present the example sentence's words in shuffled order as tappable chips.
- Learner taps words in correct order; the sentence assembles below.
- Auto-check on submission (exact match only, no Levenshtein — word order matters).
- Grade into SRS like other modes.

All required data (example sentences) already exists. This adds one more case to the existing `style` switch in `PracticeMode.jsx`.

---

#### O8 — Minimal Pairs Pronunciation Drill
**Research basis:** Minimal pair drills target phonemic contrast perception and production, the hardest phonological task for adult learners (Flege, 1995). Italian contrasts that English speakers reliably miss: /r/ vs /l/, /ts/ vs /s/, /dʒ/ vs /ʒ/, double vs single consonants (*pala* vs *palla*).

**Gap:** Pronunciation practice scores words in isolation against themselves — the recogniser accepts a best match from three alternatives. There's no contrastive task that forces discrimination between phonemically similar words.

**Opportunity:**
1. Add a curated `minimalPairs` dataset (20–30 pairs from Italian phonology: *caro/carro*, *fato/fatto*, *casa/cassa*, *polo/pollo*, etc.).
2. Add a "Coppie minime" drill mode in PronunciationPractice:
   - TTS plays one member of the pair (randomly chosen).
   - Learner must identify which was spoken (A or B button).
   - Alternatively: learner speaks one, app identifies which it recognised.
3. Track discrimination accuracy separately from overall pronunciation scores.

This is a self-contained new component with its own small dataset, not entangled with the SRS vocab.

---

#### O9 — Spaced Writing Retrieval (Previous Entries Prompt)
**Research basis:** The testing effect (Roediger & Karpicke, 2006) applies to writing: recalling and re-engaging with previously produced text improves retention of the vocabulary and structures used. Free writing is productive; spaced retrieval of one's own prior writing adds another retrieval loop.

**Gap:** Journal entries are written once and rarely revisited. The export function produces a markdown file, but there's no in-app mechanism to surface an old entry for review.

**Opportunity:**
1. On the journal start screen, show the entry from 7 and 30 days ago (if they exist) as collapsible "Ricorda?" (Remember?) panels.
2. Underneath each, place 2–3 of the vocab words from that week as recall chips — learner can tap to see if they still know the translation.
3. No new data needed; `useJournal` and the SRS store already have everything required.

---

#### O10 — Error Type Classification
**Research basis:** Lumping all errors together ("again" vs "got it") discards diagnostic information. Separating spelling errors from morphological errors from lexical errors from meaning errors enables targeted review and makes error patterns visible (Corder, 1967; Ellis, 1994).

**Gap:** When a Recall answer is marked wrong, the app records one lapse. Whether the learner typed "amare" for "amato" (morphological), "amore" for "amato" (lexical), or "amatto" for "amato" (orthographic) is lost.

**Opportunity:** On the "Not quite" reveal screen, after showing the correct answer, add 2 quick-tap reason buttons:
- "I spelled it wrong" → log orthographic error
- "Wrong word / wrong form" → log morphological/lexical error
- "I blanked completely" → log retrieval failure

Store these in the SRS record alongside lapses. Surface them in the "Parole difficili" panel with distinct icons. This is a light data extension + UI change, no algorithm change.

---

#### O11 — Collocations and Formulaic Language Tracking
**Research basis:** Formulaic sequences ("set phrases," collocations, lexical chunks) account for a large fraction of native-like fluency and are more efficiently acquired as wholes than assembled from grammar rules (Wray, 2002; Lewis, 1993). Biblical Italian is especially formulaic ("Gesù disse loro," "In quel tempo," "Il Signore è con te").

**Gap:** Vocabulary is tracked word-by-word. Frequent multi-word units from the text are invisible to the SRS.

**Opportunity:**
1. Add an optional `phrases` array to each week's content — a small list of 2–4 high-frequency formulaic expressions from that week's passage (the author curates these; no automation needed).
2. Render them in WeekDetail as a "Frasi fisse" (Fixed phrases) row with speaker + gloss.
3. Add them as SRS cards in Practice — they appear as single-answer Recognition/Recall items (the phrase is the "word").

---

#### O12 — Adaptive Daily New-Card Cap
**Research basis:** A fixed daily-new-card cap treats all learning speeds equally. Research on working memory and learning rate shows adult learners differ substantially in optimal load, and performance-based pacing outperforms calendar-based pacing for retention (Kornell, 2009).

**Gap:** `DAILY_NEW_CAP = 15` is a hardcoded constant. A learner who completes every session with high accuracy sees the same cap as one who is struggling. The cap resets by calendar day regardless of review load.

**Opportunity:**
1. Compute a "recent accuracy rate" over the last 20 reviews (stored already in SRS).
2. Adjust the daily new cap: accuracy ≥ 85% → 20 new cards; 70–84% → 15; 50–69% → 10; < 50% → 5 (consolidation mode, no new).
3. Show the effective cap on the Practice start screen ("Today: up to X new words, based on your recent accuracy").

This is a pure change to `srs.js`'s `buildSession` function with a small UI string addition.

---

### LOW PRIORITY (Longer-term or Niche)

#### O13 — Register Awareness Notes
Biblical Italian is more formal and archaising than modern colloquial Italian. The CEI 2008 uses constructions (passive voice patterns, subjunctive frequency, particles like *egli/ella*) that a learner would never hear in everyday speech. This is actually an asset — learners of liturgical/literary Italian should know when a form they've learned is register-marked. A small "Nota di registro" annotation on select vocab items ("*egli* is formal; everyday Italian uses *lui*") would prevent register interference when learners try conversational Italian.

#### O14 — L1 Interference Flags on False Friends
English-Italian false friends (*attualmente* ≠ "actually," *sensibile* ≠ "sensible," *parenti* ≠ "parents") are a high-frequency error source for adult English L1 learners. Flagging the 20–30 most problematic ones in the vocab data (a `falsefriendflag` field) and surfacing a brief note on the card back would prevent fossilization.

#### O15 — Reading Speed Tracking
Fluency in reading is measured not just by comprehension but by automaticity — words should be recognised without conscious decoding. If the interactive Bible passage rendering (O2) is built, timing how long a learner spends per passage (words-per-minute) and charting it over weeks would give a direct fluency metric that complements the SRS accuracy data.

#### O16 — Peer / Accountability Partner Feature
Research strongly supports social accountability for adult language learners (Dörnyei, 2001). Even a lightweight mechanism — export a weekly summary (streak, words learned, journal written) as a shareable image or text snippet — would support learners who study alongside a friend or iTalki tutor. The existing sync snapshot infrastructure could be extended to produce a "study report" export.

#### O17 — Sentence-Level Vocabulary Testing (Not Just Word-Level)
A known weakness of word-pair SRS is that learners learn to associate cards rather than building lexical networks. Sentence-level tests — given a sentence with one word missing, choose the correct word from four plausible options — are more ecologically valid than pure recall. This overlaps with Cloze mode but uses distractors rather than free production, targeting recognition-in-context rather than production.

---

## Implementation Priority Summary

| # | Opportunity | Impact | Effort | Reuses Existing Code |
|---|------------|--------|--------|----------------------|
| O1 | Shadowing Mode | High | Medium | Yes — TTS + speech recognition |
| O2 | Interactive Bible Text | High | Medium | Yes — WordGloss, vocabIndex |
| O3 | Grammar Drilling | High | Low | Yes — answer.js |
| O4 | Dictogloss | High | Medium | Yes — TTS, journal draft pattern |
| O5 | Comprehension Checks | High | Low (UI) / High (content) | Yes |
| O6 | Morphological Awareness | Medium | Medium | Partial |
| O7 | Sentence Scramble | Medium | Low | Yes — existing sentence data |
| O8 | Minimal Pairs | Medium | Medium | Yes — speech recognition |
| O9 | Spaced Writing Retrieval | Medium | Low | Yes — useJournal, SRS |
| O10 | Error Type Classification | Medium | Low | Yes — SRS record |
| O11 | Collocations / Phrases | Medium | Low | Yes — SRS pipeline |
| O12 | Adaptive New-Card Cap | Medium | Low | Yes — srs.js |
| O13 | Register Notes | Low | Low (data) | Yes |
| O14 | False Friend Flags | Low | Low (data) | Yes |
| O15 | Reading Speed Tracking | Low | Medium | Requires O2 |
| O16 | Social / Accountability | Low | Medium | Partial — sync |
| O17 | Sentence-Level Tests | Low | Medium | Partial — cloze |

---

## Next steps (post O1–O5)

O1–O5 are shipped. The remaining open items in priority order:

1. **O12 (Adaptive New-Card Cap)** — One function change in `srs.js`
   (`buildSession`) + one string on the Practice start screen. Highest
   leverage-to-effort ratio of anything remaining. Learners who are mastering
   cards quickly get more new input; struggling learners get consolidation time.
   No data authoring required.

2. **O9 (Spaced Writing Retrieval)** — Surface the journal entry from 7 and 30
   days ago as collapsible "Ricorda?" panels on the journal start screen. No new
   data; `useJournal` and the SRS store already hold everything. Directly
   exploits the testing effect on the learner's own produced text.

3. **O7 (Sentence Scramble)** — Add a "Costruisci" card style in PracticeMode:
   shuffle the words of an example sentence into chips, learner taps them into
   order. All sentence data exists. One more `style` case in `PracticeMode.jsx`.
   Low risk, good syntactic awareness payoff.

4. **O6 (Morphological Awareness)** — Add optional `root`/`family` fields to
   vocab tuples and surface related forms on card backs and the vocab table.
   Primarily a data annotation task; the UI extension is small.

5. **O15 (Reading Speed)** — Now that O2 passages are in place, timing time-on-
   passage and computing words-per-minute is feasible. A simple `Date.now()`
   delta between "passage loaded" and "mark as read" clicked, stored in
   `localStorage`, would give a fluency trend chart with no backend.

6. **O10 (Error Type Classification)** — Add 3 quick-tap reason buttons on the
   "Not quite" reveal screen (spelling / wrong form / blank). Light SRS data
   extension, no algorithm change.

---

*Assessment based on: Nation & Newton (2009) Teaching ESL/EFL Listening and Speaking; Lightbown & Spada (2013) How Languages Are Learned; Schmidt (1990) The role of consciousness in second language learning; Norris & Ortega (2000) Effectiveness of L2 instruction; Roediger & Karpicke (2006) Test-enhanced learning; Wajnryb (1990) Grammar Dictation; Dörnyei (2001) Motivational Strategies in the Language Classroom.*
