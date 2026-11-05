# plan-tutor.md: voice tutor, more verses, and the AI options

Status (2026-11-05): **the scripted tutor, the added verses and verse practice are
built on web and iOS. The AI options below are plans only; neither is built.**

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

## AI options (plans only)

Both keep the rule from the `plan-siri.md` I5 spike: **AI explains and never grades.**
`checkAnswer` and `matchesSpoken` stay the only graders, and nothing a model says reaches
the SRS.

### Option A: iOS on-device explanations

**Learner experience:** after a miss, a "Perché?" button gives a short English
explanation, such as why *vinsero* rather than *hanno vinto*. Other devices see the same
lesson without the button.

**How it works**
- A `TutorExplainer` protocol in `BibbiaCore`, taking the verse, its English, expected
  text, heard text and the week's grammar note, with a no-op default so `swift test`
  covers the fallback.
- A `SystemLanguageModel` implementation in the app target, streaming its text.
- The miss is already in `TutorState.feedback`, so the engine needs no change.

**Constraints**
- No key, server, entitlement or usage cost.
- Needs A17 Pro or M-series with Apple Intelligence available. The 26.6 floor removes the
  OS gate but not the hardware gate.
- CI can't exercise the model, so evaluate on a fixed sample set locally.

**Check first:** whether the model handles Italian input, the quality of its explanations
(the spike tested grading on 16 cases, not explanations), and whether its guardrails trip
on biblical text.

**Size:** about 2-3 days.

### Option B: web bring-your-own-key conversation

**Learner experience:** an opt-in "Conversa" mode. The learner talks about the week's
passage and the tutor replies aloud in simple Italian with gentle corrections. "Perché?"
explanations also become available on the web.

**How it works**
- Recognized text, never audio, goes straight from the browser to Claude. The reply
  streams in and is spoken sentence by sentence.
- The official `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`, dynamically
  imported to stay out of the main bundle. Confirm browser access against current docs at
  build time.
- System prompt: the week's passage, vocabulary and grammar focus, the learner's level,
  and short replies. Handle `refusal` stop reasons, and render replies as plain text.

**Security and privacy (required)**
- **Store the key outside `STORAGE_PREFIX-*`**, for example `coursekit-tutor-ai`.
  `exportSnapshot()` collects every prefixed key, so a prefixed key would leak into QR
  codes and backup files. Add a test proving it stays out.
- The site has no Content-Security-Policy, and any XSS could read a key in `localStorage`.
  Add a CSP in `staticwebapp.config.json` first, allowing only the services the app uses.
- Tell users to create a dedicated key with a spending limit, and offer "forget key".
- Disclose in About & privacy that transcripts go to Anthropic.
- Record the exception in the CLAUDE.md constraints: a user-supplied runtime key, with no
  server and no build secret.

**Estimated cost** of a 20-turn conversation at about 2,000 input and 150 output tokens
per turn, before caching (list prices cached 2026-10-06):

| Model | Approximate cost |
|---|---|
| `claude-opus-5-5` | $0.22 |
| `claude-haiku-5-5` | $0.006 |

Choose the default model when building this, and measure real turns, since voice replies
also need low latency.

**On iOS later:** the key goes in the Keychain, not UserDefaults, which rides in backups.

**Size:** about 1 week, including the CSP.

### Recommendation

Decide after using the scripted tutor. Option A adds the least risk but reaches only some
devices. Option B is the only one offering real conversation everywhere, but asking for an
API key suits you and technical users better than a public launch.
