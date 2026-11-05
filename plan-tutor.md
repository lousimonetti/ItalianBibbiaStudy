# plan-tutor.md: voice tutor, more verses, and the AI options

Status (2026-11-05): **the scripted tutor, the added verses and verse practice are
built on web and iOS, plus adaptive lessons and opt-in local Conversa. See the results below.**

Real-microphone testing is still outstanding (see Verification).

## Why

The app had many separate voice and verse exercises, but the learner had to find and
combine them, and nothing reacted to how a session was going. Reading was also thin at
199 verses, with no memorization or long-term review.

## What shipped

### Lezione guidata (scripted voice tutor)

A hands-free lesson of roughly 5-8 minutes on one week's passage, opened from the Today
card and each week:

1. **Listen** to the passage, line by line.
2. **Repeat** up to 12 chunks. On a miss the tutor names the missed words and replays
   slowly, with up to 2 retries, then moves on and records the verse as missed.
3. **Tricky words**: up to 3 of the words missed most.
4. **Answer** questions aloud. Only questions the passage itself answers are asked;
   those on the week's wider reading stay in Rispondi subito.
5. **Recall**: hear a verse with a word left out and say the word.
6. **Recap**: the score, and missed verses go into verse review.

Spoken commands (`ripeti`, `più lentamente`, `avanti`, `basta`) count only as the whole
utterance, and a correct answer always beats a command. Every command is also a button,
along with "I said it right" and "Type instead".

| Piece | Web | iOS |
|---|---|---|
| State machine | `src/utils/tutorEngine.js` | `BibbiaCore/TutorEngine.swift` |
| Chunks, references | `verseChunks.js`, `keyVerses.js` | `BibbiaCore/KeyVerses.swift` |
| Memorization | `verseRecall.js` | `BibbiaCore/VerseRecall.swift` |
| Tutor's lines | `src/data/tutorScript.js` | copied into `TutorEngine.swift` |
| Speech | `useTutorVoice.js` | `Speech/TutorVoice.swift` |
| Lesson UI | `VoiceTutor.jsx` | `Views/Tracker/VoiceTutorView.swift` |
| Verse practice, review | `VersePractice.jsx`, `VerseReview.jsx` | `Views/Tracker/VersePracticeView.swift` |

The engine is pure: `next(state, event)` returns the new state plus effects to carry out.
The `tutor.json` fixture replays whole lessons through the real JS, and
`TutorFixtureTests.swift` requires the Swift port to match every state and utterance.

**iOS differs from the original plan in one way.** It reuses the existing switch between
the playback and record audio sessions rather than `.playAndRecord`. The mic can't hear
the tutor because the two never run together. `TutorVoice` ends a turn after 1.4 s of
silence, because `SFSpeechRecognizer` never finishes a stream on its own.

### More verses

294 verses, up from 199: about 8 per week. Week 21 already had 8, and week 37 stays at 6
because it is the complete Psalm 150. New verses fill gaps within chapters the course
already quotes. All text comes from bibbiaedu.it (`verify-passages.py --show`), and the
whole course passes `verify-passages.py`. Each week now has 4 spoken questions.

Three existing answers contradicted the CEI text and were corrected: weeks 15 (*lo
baciò*), 18 (*rimossa*) and 37 (*corno*, *ogni vivente*).

### Verse practice and review

- **Versetti** on each week: Memorize (blanks grow 1, 3, about 60%, all), Build (word
  chips) and Shadow (hear and repeat one line).
- **Verse review** in Flashcards, using the existing scheduler in its own store, with at
  most 3 new verses a day. The Today card shows the due count.
- A lesson feeds review at most once per verse per day. Missed beats recalled.

New stores: `storageKey('verse-srs')` and `storageKey('tutor')`, in the same JSON on both
platforms, so backups carry them. New Session clears them with the flashcard and progress
scopes.

## Known limits

- **Not reliably offline or private.** The tutor's logic runs locally, but browser speech
  recognition usually doesn't: Chrome sends audio to Google and needs a connection. "Type
  instead" is the offline path. About & privacy now says this. On iOS, Apple's speech
  service is used, and on-device-only recognition has not been evaluated.
- **The iOS mic permission string looks wrong.** `NSMicrophoneUsageDescription` says audio
  is processed on-device, while `SpeechRecognizer` doesn't require on-device recognition.
  This predates the tutor; correct it before App Store review.
- **CEI permission is still open** (`launch-opportunities.md` L2). 294 quoted verses is
  more exposure than 199, and the license note now says "about eight verses per week".
  Confirm the quotation limits or get permission before promoting this publicly.
- Pass thresholds (`PASS_SCORE` 70) are untuned against real speech.

## Verification

Done: web and Swift test suites, lint, course validation, production build, a full lesson
in Chrome with injected fake speech APIs (dark mode and 375px width included), and an iOS
simulator build.

**Not done, needs a person with a mic:** a full lesson in desktop Chrome, in iOS Safari
(especially that the first speech fires from the Start tap), and in the iOS app on a
device (especially audio session switching and the 1.4 s silence cutoff).

## Interactive lessons (shipped, not yet committed)

Adaptive text fading, line breakdowns, tiered hints and spoken word questions (*che vuol dire...?*), on web and iOS, pinned by `tutor.json`. `PASS_SCORE` is still untuned against a real microphone, and adaptation depends on it.

## Local AI: evaluation results and what shipped

The rule still holds: **AI explains and never grades.** Harness: `scripts/tutor-ai-eval/` and `ios-native/scripts/tutor-ai-eval.swift`. Counts of explanations with no factual error are one reader's judgment, not a mechanical score.

| Check | Needed | Apple on-device | `gemma4:12b-mlx` |
|---|---|---|---|
| *Perche?* explanations, first prompt | 18 of 20 | about 3 | 15-16 |
| *Perche?* explanations, tuned prompt | 18 of 20 | at most 10 (automatic filter) | 16-17, plus 9 of 10 held out |
| False corrections of correct Italian | at most 1 | 0 | 0 (one automatic flag was "Si, e corretto", a confirmation) |
| Median time to first sentence | at most 3 s | 0.77 s | 1.55 s |
| Refused verses | under 5% | 6 of 294 | not run (Ollama skips this group) |

**Decision: *Perche?* did not reach the bar on either model, so it is off and has no UI.** `explainPrompt` remains only for the harness, to re-test future models. **Conversa shipped on both platforms**, opt-in. Apple's replies are visibly weaker than Gemma's, and it refuses some harmless text.

**Speed on an M5 MacBook Air, 24 GB, on charger:** thinking must be off (with it on, about 6 s and an empty reply); warming the model at the start takes the first reply from 3-4 s to about 1 s; context 2048 was as fast as 4096 and used about 3 GB less memory. Battery was not measured.

**Not verified:** a real microphone anywhere; on-device speech for Italian; Safari or the production HTTPS site reaching Ollama (Chrome may show a Local Network Access prompt); Conversa on a real iPhone.

**Option B (bring your own API key)** stays a separate, unscheduled idea: it would send transcripts to a cloud service.
