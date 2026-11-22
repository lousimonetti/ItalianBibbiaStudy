# Fluency review: what the evidence says, what the app covers, what was missing

**Date:** 2026-11-22
**Question asked:** review the plan, find the best methods for becoming fluent, and check
that nothing important is missing.
**Goal used for the review:** both, Scripture first. Read Scripture and the liturgy with
ease, and also hold an everyday conversation in Italian.

The earlier reviews (`opportunities.md`, `REVIEW-pedagogy.md`, `plan-speaking.md`) asked
"what would improve this app?". This one asks a different question: "what does it take to
become fluent, and which of those things does the app leave out?". Most of the answer is
reassuring. Four gaps were large enough to build now, and they are built (B1 to B4 below).

---

## 1. What was measured

Counted from `courses/it-bible-cei`, not estimated.

| Measure | Value |
|---|---|
| Course vocabulary cards | 259, about 77% Bible nouns |
| Passage verses | 378 |
| Running words of passage text | 7,312 (about 200 a week) |
| Distinct word forms in the passages | 1,714 |
| Phrase chunks / spoken questions | 81 / 148 |
| Drills / transforms / comprehension items | 74 / 74 / 74 (before this review) |
| Weeks with a scheduled tutor conversation | 5 of 37 |
| Learner-chosen cards, error log, proficiency check | none |
| Anything after week 37 | nothing (`getCurrentWeekN()` returns `null`) |

Grammar the weekly syllabus never taught, although all of it runs through both the
Gospels and ordinary speech: **the imperative, indirect object pronouns (gli, le),
combined pronouns (glielo, me lo), ci and ne, and the impersonal si.** Imperatives appeared
only inside a few drill items.

One earlier decision also needed revisiting. `REVIEW-pedagogy.md` R3 proposed a core
vocabulary layer and it was dropped as a duplicate of `src/utils/it2en.js`. The two do
different jobs: `it2en.js` is a gloss dictionary that helps you *understand* a word when you
tap it; it was never something you *study*. Of its words, none were ever scheduled for
review. The gap R3 described was still open.

---

## 2. The methods, and how well the app covers them

| Method, with the main evidence | Before this review |
|---|---|
| Spaced retrieval, the testing effect, interleaving (Roediger and Karpicke 2006; Kornell and Bjork 2008) | **Strong.** Real SM-2 scheduler, seven practice styles, a smart mix, a daily new-card cap. |
| Explicit grammar with form-focused practice (Norris and Ortega 2000) | **Strong, with five missing topics** (section 1). |
| Noticing (Schmidt 1990) | **Strong.** Grammar taught through exegesis, the Struttura view, tap-to-gloss everywhere. |
| Pronunciation: shadowing, feedback | **Good.** Missing: minimal pairs for the sounds English speakers merge (fato / fatto, open and closed e and o). |
| Formulaic chunks (Wray 2002) | **Modest.** 81 chunks, all biblical register. |
| Automatization: 4/3/2, timed answers (Nation and Newton 2009; DeKeyser; Segalowitz) | **Good.** Fluency sprints, Rispondi subito, the voice tutor. |
| Motivation and habit (Dornyei 2001) | **Very strong.** Streaks, goals, Continue, celebrations, reminders. |
| **Vocabulary size by frequency** (Nation 2006; Laufer and Ravenhorst-Kalovski 2010; Hu and Nation 2000) | **The biggest gap.** Comfortable reading needs about 95-98% of the words on the page known; everyday conversation needs roughly 2,000-3,000 word families. The study deck had 259 cards, nearly all Bible nouns, and almost none of the very frequent words that make up most of any text. |
| **Comprehensible input in quantity** (Krashen 1985; Nation's four strands) | **Thin inside the app.** About 7,000 words of text over 37 weeks, and only synthesized audio. The plan relies on reading whole chapters outside the app, which is right, but nothing pointed at real spoken Italian. |
| **Interaction with people** (Long 1996, the Interaction Hypothesis) | **Thin.** 5 tutor weeks, with no preparation before or capture after. |
| Learner-chosen input, sentence mining | **Missing.** Every card was chosen by the course. |
| A feedback loop over time (Swain 1985: output, notice the gap, revise) | **Partial.** LanguageTool corrects a journal entry, but corrections are not kept or revisited. |
| Measuring progress (CEFR can-do statements, coverage, speed) | **Missing.** Only fluency-sprint WPM. |
| Life after the course | **Missing.** |

### An honest expectation

37 weeks at 30-40 minutes a day is roughly **130-180 hours**. The US Foreign Service
Institute puts Italian at about **600-750 class hours** for an English speaker to reach
professional working proficiency. So the course on its own should land somewhere around
**A2 to B1**, strongest in reading Scripture and weakest in spontaneous speech. That is a good
result for the time, but it is not fluency. What closes the distance is volume: more input
(reading and listening outside the app) and, above all for speaking, hours of conversation
with people. The app cannot supply those hours, but it can make each one count, which is
what B4 is for.

---

## 3. What was built

### B1. Parole di base, an everyday core deck

`courses/it-bible-cei/coreVocab.js`: **497 words in 13 topics**: little words (prepositions
and their contractions, pronouns including the clitics, connectors, common adverbs),
everyday verbs, describing words, people and family, time, food and drink, home, body and
health, town and travel, work and study, feelings, nature and weather, and **parish life**
(la messa, la parrocchia, l'omelia), which is the bridge from the Gospel text to Mass and to
conversation after church. Every word has an example sentence and its English.

- Optional registry field `core`, resolved by `course/core.js`; the deck hides without it.
- A **deck chooser** in Practice (Corso / Parole di base / Mie parole), with topic filters
  for the core deck. All seven practice styles work on it unchanged.
- All decks share the **one SRS store**, keyed by term, so a single daily new-card cap
  covers everything. (The plan proposed a separate store; sharing it turned out simpler and
  keeps the cap exact. `coreVocab.test.js` guarantees no core term is also a course term.)
  The due badge, Continue's review and the struggle list count every deck.
- IPA is computed with `toIPA` and marked approximate, rather than stored unverified.
- 384 words were added to `it2en.js` so every example is tappable; `glossCoverage.test.js`
  now covers the core examples.
- Not added to the weekly lessons, because `lessonPlan.js` is pinned to its Swift twin.

### B2. Mie parole, sentence mining

Tap any word that is not already a card and choose **Save to My words**. It is saved with
the sentence it was met in and the place it came from (the week, the prayer, the saint).
Saved words are reviewed in Practice under *Mie parole*, where a missing meaning can be
filled in. Store: `storageKey('mined')` (`src/utils/mined.js`), so it rides sync backups.

### B3. The five missing grammar points

Each is a passage note on a week whose **verified passage already shows the form**, quoted
verbatim, so no new CEI text was added:

| Week | Passage | Point |
|---|---|---|
| 3 | *chi ne mangia non muoia* | ne (with ci for contrast) |
| 5 | *Gli rispose Marta... Gesù le disse* | indirect object pronouns |
| 14 | *Vendete... datelo... fatevi... Non temere* | the imperative and its pronouns |
| 16 | *non glielo impedite* (and week 13's *te lo pagherò*) | combined pronouns |
| 35 | *a chi si devono le tasse* | the impersonal and passive si |

Each also adds two drill items and two transforms to the week (a `GRAMMAR_GAPS` layer in
`exercises.js`), and the trap drill gained 8 items in 4 new categories.

### B4. Conversation and real listening

Every week now has a collapsed **Prepare for a conversation** section: a sheet built from
the week's own questions, phrases, passage and words, with a copy button for sending it to a
tutor; an **After the conversation** form that saves new words and corrections to My words;
and **Real Italian to listen to**, six links in `config.listening` (the CEI daily readings,
Vatican News and its podcast, TV2000, Podcast Italiano, RaiPlay Sound). The daily readings
are the strongest of these for this course: the same translation, and tomorrow's Gospel can
be read the night before Mass.

---

## 4. What is still missing, ranked

Not built in this pass. Ranked by learning gain for the effort.

1. **A progress check.** Per phase: a short CEFR can-do self-assessment, plus measures the
   app can compute itself: the share of next week's passage made of words the learner has
   reviewed to maturity (the 95-98% coverage threshold, made visible), reading speed (O15),
   and the trend in fluency-sprint WPM. Without it, nobody can tell whether the course is
   working.
2. **Error log and rewrite** (O10 plus Swain). Keep each accepted LanguageTool correction
   as a before/after pair and bring it back as a "correct your own sentence" drill.
3. **Life after week 37.** A continuation mode: SRS and My words carry on; suggest a
   reading plan through the rest of the Gospels in the CEI daily readings; keep the daily
   verse dealing from the whole course.
4. **Minimal pairs** (O8): fato / fatto, caro / carro, pena / penna, and open versus closed
   e and o, by ear first. Doubled consonants are the commonest English-speaker error and
   change meaning.
5. **O9 Ricorda**: show the journal entry from 7 and 30 days ago.
6. **Grow the core deck** toward 1,500-2,000 words, in the same format and with the same
   tests, and add everyday chunks (*fare due chiacchiere*, *non vedo l'ora*) beside the
   biblical ones.
7. **Record and compare**: hear your own voice next to the model (`MediaRecorder`; a
   storage decision first).
8. **Smaller items**: an adaptive new-card cap (O12); considering FSRS in place of SM-2,
   which needs fewer reviews for the same retention; human-voice audio where licensing
   allows.
9. **iOS twins of B1 to B4.** The core deck data and the B3 notes reach iOS through
   `course.json`, but there is no deck chooser, no Save to My words and no conversation
   section on iOS yet. Saved words written by the web app sit in the shared `srs` and
   `mined` keys and survive a backup round trip, but iOS does not show them.

---

## 5. Sources

Hu and Nation (2000) Unknown vocabulary density and reading comprehension; Nation (2006) How
large a vocabulary is needed for reading and listening?; Laufer and Ravenhorst-Kalovski
(2010) Lexical threshold revisited; Nation and Newton (2009) Teaching ESL/EFL Listening and
Speaking; Krashen (1985) The Input Hypothesis; Long (1996) The role of the linguistic
environment in second language acquisition; Swain (1985) Communicative competence: some
roles of comprehensible input and comprehensible output; Schmidt (1990) The role of
consciousness in second language learning; Norris and Ortega (2000) Effectiveness of L2
instruction; Roediger and Karpicke (2006) Test-enhanced learning; Kornell and Bjork (2008)
Learning concepts and categories; Wray (2002) Formulaic Language and the Lexicon; Dornyei
(2001) Motivational Strategies in the Language Classroom; US Foreign Service Institute
language difficulty rankings.
