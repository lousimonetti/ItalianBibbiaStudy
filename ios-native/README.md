# Italian Bible Study — native iOS app

A full native SwiftUI implementation of the Italian Bible Study web app
(this repo's root), following `../plan-ios-swift.md`. No JavaScript runtime,
no web view — every algorithm is a Swift port and every screen is SwiftUI.

Works fully **offline** (the only online features are the LanguageTool
grammar check in the Journal, same as the web app). Data is stored on-device
and is **backup-compatible with the web app**: a `.json` backup exported from
the web Sync panel imports into iOS Settings → Sync, and vice versa.

## What's in the app

| Tab | Features |
|-----|----------|
| **Tracker** | Today card (streak 🔥 + read/practice/write checklist), 4 phases × 37 weeks, achievements grid, week detail with CEI 2008 reading passage (every word tappable for gloss/IPA/audio), vocab with TTS speakers, grammar note, fill-in-the-blank drills, comprehension checks (T/F + multiple choice), dictogloss, writing prompt, iTalki starters |
| **Flashcards** | SM-2 spaced repetition (same scheduler + store format as the web), 4 practice styles — Recognition, Recall (typed), Cloze, Listening — daily new-card cap, "Parole difficili" struggle list with drill button, Pronunciation + Shadowing scored by on-device speech recognition |
| **Journal** | Per-week entries with writing scaffold (starters + tap-to-insert vocab chips), LanguageTool grammar check, Markdown export via share sheet |
| **Settings** | Light/dark theme, **New Session** (start/restart the 37 weeks from any date, optional resets), daily reminder (real local notification), backup export/import, About |

Native extras the web can't do: haptic feedback, real scheduled
notifications, `AVSpeechSynthesizer` TTS, `SFSpeechRecognizer` scoring.

**First open = day 1.** A new install stamps a `session-start` override at
first launch, so the 37-week program begins the day the user first opens the
app (the course config's fixed `startDate` is only the web reference
deploy's calendar). A one-time welcome sheet says so and points at
Settings → New Session, which can move the calendar to any date later; a
backup import that carries its own `session-start` wins. Every week's
displayed date range is **computed** from the effective start date
(`ScheduleLogic.weekRangeLabel`, same "Apr 13-19" style as the authored
strings — a test proves the computed labels reproduce all 37 authored
`week.d` values for the reference calendar), so the whole schedule stays
correct for any start date.

## Design (Figma)

**`design/figma-mockups.html`** is the design source: pixel-styled mockups of
every screen (welcome sheet, Tracker, week detail, gloss sheet, flashcards
hub, practice card, pronunciation, journal, settings, New Session, dark
mode), plus a style-guide panel with the design tokens — accent colors,
SF Pro type ramp, SF Symbols in use, and component specs. Open it in any
browser.

To work in Figma: install the free **html.to.design** plugin and paste the
file's HTML (each phone frame imports as an editable Figma frame), or
screenshot the 375×780 frames and drop them on a Figma page — 375 pt is the
iPhone logical width, so they align 1:1 with Figma's iPhone presets.

Every frame is annotated with the Swift file that implements it, so the page
doubles as a **design ⇄ code map**: see a screen, jump to its view. The older
pre-build wireframes remain in `../wireframes/ios-app-wireframes.html`.

## Layout

```
ios-native/
  project.yml               XcodeGen spec → generates the .xcodeproj
  design/
    figma-mockups.html      screen mockups + design tokens (Figma-importable)
  BibbiaCore/               SwiftPM package: ALL logic + course data (UI-free)
    Sources/BibbiaCore/     Swift ports of src/utils/*.js + Codable course model
      Resources/course.json bundled course data (generated — do not hand-edit)
    Tests/BibbiaCoreTests/  XCTest suite + JS-generated parity fixtures
  App/
    Sources/App/            SwiftUI app target (views, stores, speech, sync)
    Resources/              Asset catalog (AppIcon, AccentColor)
  scripts/
    export-course-json.mjs  regenerate course.json from ../courses/it-bible-cei
    generate-fixtures.mjs   regenerate test fixtures by RUNNING the JS utils
  DEPLOYMENT.md             step-by-step App Store guide for a first-time publisher
```

## Learn the codebase in 30 minutes

Read in this order — each step builds on the previous one:

1. **The data** — open `BibbiaCore/Sources/BibbiaCore/Resources/course.json`
   (skim the first week) then `Course.swift`, its Codable mirror. Everything
   in the app renders this one object: 4 phases → 37 weeks → vocab / grammar /
   passage / drills / comprehension / prompt.
2. **One logic module end to end** — `BibbiaCore/Sources/BibbiaCore/SRS.swift`
   (~150 lines): the SM-2 scheduler with binary grades. Then its two tests:
   `Tests/BibbiaCoreTests/SRSTests.swift` (behavior) and the `SRSFixtureTests`
   in `FixtureTests.swift` (replays grade sequences recorded from the web
   app's real `srs.js`). Every other module follows this exact pattern:
   pure functions + behavior tests + JS-parity fixtures.
3. **Persistence** — `App/Sources/App/AppModel.swift`. One `ObservableObject`
   owns every store; `WebStore` persists each as a JSON string in
   UserDefaults under the web app's localStorage keys (`italian-bible-srs`,
   `-streak`, …). That key-compatibility is the whole sync story: a backup
   file is just those strings bundled up (`SyncManager.swift`).
4. **One screen end to end** — pick "grade a flashcard":
   `FlashcardsView` builds a queue with `buildQueue()` →
   `PracticeSessionView` shows the card → "Got it" calls
   `model.recordReview()` → `srsReview()` computes the next due date →
   `WebStore.saveJSON` persists → the streak ticks via `setFlag()`. Five
   files, one direction of data flow, no other state.
5. **The design ⇄ code map** — open `design/figma-mockups.html` next to the
   `App/Sources/App/Views/` tree; each frame names its Swift file.
6. **The safety net** — `.github/workflows/ios-native-ci.yml`: fixture
   freshness on Linux (reruns the JS, diffs the committed fixtures),
   `swift test` + an unsigned simulator build on macOS.

Rules of thumb when changing things: new persisted state goes through
`WebStore` (never a raw UserDefaults key); new logic goes in `BibbiaCore`
with a test (views stay dumb); course-content edits happen in
`../courses/it-bible-cei/` followed by re-running the two scripts below.

### How the port stays honest

`BibbiaCore` mirrors the web logic function-for-function (SRS scheduler,
answer checking, cloze builder, streak, Italian grapheme→IPA converter,
schedule, reminders, achievements, struggle list, dictogloss, comprehension,
vocab index, sync snapshot). The test suite doesn't just re-test the ideas —
`generate-fixtures.mjs` **executes the real JS modules** and records their
outputs (e.g. `toIPA` for all ~900 distinct course words, cloze results for
all 259 vocab cards, SRS review sequences), and `FixtureTests.swift` asserts
the Swift ports reproduce them exactly. CI regenerates the fixtures and fails
if they're stale, so the two implementations can't silently drift.

Persistence uses `UserDefaults` with JSON strings under the **same keys as
the web's localStorage** (`italian-bible-progress`, `-srs`, `-streak`, …).
That single decision is what makes web ↔ iOS backups interchangeable.

## Building (needs a Mac)

```bash
# one-time
brew install xcodegen

cd ios-native
xcodegen generate          # creates ItalianBibbiaStudy.xcodeproj
open ItalianBibbiaStudy.xcodeproj
```

Pick a simulator (e.g. iPhone 16) and press ⌘R. To run on your own iPhone,
see `DEPLOYMENT.md` — a free Apple ID is enough for that.

## Tests

```bash
# Logic + parity tests — no Xcode project needed, runs with plain SwiftPM
swift test --package-path ios-native/BibbiaCore
```

Or in Xcode: ⌘U. CI (`.github/workflows/ios-native-ci.yml`) runs the suite on
macOS, builds the app for the simulator, and checks fixture freshness on Linux.

## When course content changes

The app bundles the course as JSON generated from the web data layer. After
editing `courses/it-bible-cei/`:

```bash
node ios-native/scripts/export-course-json.mjs   # refresh bundled course.json
node ios-native/scripts/generate-fixtures.mjs    # refresh test fixtures
swift test --package-path ios-native/BibbiaCore  # (on a Mac) confirm green
```

Commit the regenerated files; CI enforces freshness.

## Deliberate scope notes (v1)

- **Tabs**: Tracker / Flashcards / Journal / Settings. The web app's Prayers
  and Saints tabs are not in v1 (Saints depends on Wikipedia fetches; both are
  straightforward follow-ups on the same data pattern).
- **Sync**: `.json` backup file only (interchangeable with the web). The QR /
  copy-paste code transport is lz-string-compressed and stays web-only for now.
- **Speaking layer**: the course JSON already carries the S1–S3 speaking data
  (`phrases`, `transform`, `questions`) and the Trap drill dataset can be
  exported the same way — the views are follow-ups.
- **Widgets / Siri / iCloud**: designed in `../plan-ios-swift.md`
  (WidgetKit timeline, App Intents, key-value sync) — not built in v1 to keep
  the amateur deployment simple (no App Groups / extra capabilities needed).
- **Minimum iOS**: 16.0 (NavigationStack, `Layout`). SwiftData was skipped in
  favor of `UserDefaults` JSON stores — it would raise the floor to iOS 17
  and break backup-compatibility with the web app for no gain at this data size.
