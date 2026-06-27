# Plan: Full SwiftUI Rewrite (iOS / iPadOS)

A native Swift app using SwiftUI + SwiftData targeting iOS 15+. No JavaScript
runtime, no bridges. Every component is a SwiftUI view; every algorithm is a
Swift type. The web app's logic layer (~618 lines across 8 utils) is ported
function-for-function.

Compare with `plan-ios-app.md` (React Native + Expo) to decide which path fits
your priorities.

---

## When to choose this over React Native

| Criterion | React Native + Expo | SwiftUI |
|-----------|---------------------|---------|
| Logic reuse from web | Most utils port as-is | Full rewrite required |
| Native iOS feel | Good, minor gaps | Perfect — it IS iOS |
| WidgetKit + App Intents | Requires Swift extension | First-class citizen |
| AVSpeechSynthesizer / SFSpeechRecognizer | Via bridge (expo-speech / @rn-voice) | Direct framework access |
| App binary size | ~60 MB (includes JS engine) | ~8–12 MB |
| Battery / memory | Bridge overhead | None |
| Android path later | Yes (same codebase) | Separate project needed |
| Initial build time | ~5 weeks for feature parity | ~8–10 weeks (all rewrite) |

**Choose SwiftUI if:** you want the best possible iOS product and don't need
Android. Choose React Native if: you want to reuse the JS logic layer or want
Android later.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI (iOS 15+ declarative views) |
| Navigation | `NavigationStack` (iOS 16) + `TabView`; `NavigationSplitView` for iPad |
| Persistence (complex) | SwiftData (`@Model`) — SRS cards, journal entries |
| Persistence (simple) | `@AppStorage` / `UserDefaults` — streak, progress bits, theme, session start |
| TTS | `AVSpeechSynthesizer` (no dependency) |
| Speech recognition | `Speech` framework (`SFSpeechRecognizer`) |
| Notifications | `UserNotifications` (`UNUserNotificationCenter`) |
| Haptics | `CoreHaptics` + `UIFeedbackGenerator` |
| Widgets | `WidgetKit` (same target) |
| Siri / Shortcuts | `AppIntents` framework (iOS 16+) |
| iCloud sync | `NSUbiquitousKeyValueStore` (key-value, mirrors UserDefaults) |
| QR export | `CoreImage.CIQRCodeGenerator` |
| QR scan | `AVFoundation` camera + `VisionKit` `DataScannerViewController` (iOS 16) |
| Networking | `URLSession` (LanguageTool grammar check — unchanged) |
| Build | Xcode 15+ · Swift 5.9+ |
| Tests | `XCTest` (logic) + `XCUITest` (UI smoke) |

---

## Repository layout

```
ios-swift/
  ItalianBibbiaStudy.xcodeproj/
  ItalianBibbiaStudy/
    App/
      ItalianBibbiaStudyApp.swift     // @main, ModelContainer setup
      ContentView.swift               // TabView / NavigationSplitView root
      AppDelegate.swift               // UIApplicationDelegate (notifications)

    Course/
      CourseData.swift                // static struct mirrors courses/it-bible-cei/
      CourseConfig.swift              // brand, locale, schedule, resources
      CourseContent.swift             // phases → weeks → vocab, grammar, passage…
      SessionStart.swift              // read/write sessionStart (mirrors sessionStart.js)
      Schedule.swift                  // getCurrentWeekN(), getEndDate() (mirrors schedule.js)

    Models/                           // SwiftData @Model types
      SRSCardRecord.swift             // one row per Italian term
      JournalEntry.swift              // one row per week
      PronunRecord.swift              // pronunciation history per term

    Logic/                            // pure Swift; no SwiftUI imports
      SRS.swift                       // SM-2 scheduler (mirrors srs.js)
      Answer.swift                    // canonical() + checkAnswer() (mirrors answer.js)
      Cloze.swift                     // makeCloze() (mirrors cloze.js)
      ItalianIPA.swift                // toIPA() rule-based converter (mirrors it2ipa.js)
      Streak.swift                    // withActivity(), setFlag() (mirrors streak.js)
      WordStats.swift                 // struggleList() (mirrors wordStats.js)
      Achievements.swift              // badge logic (mirrors achievements.js)
      Reminders.swift                 // shouldNotify() (mirrors reminders.js)
      GrammarCheck.swift              // LanguageTool API call
      SyncSnapshot.swift              // export/import JSON blob (mirrors syncSnapshot.js)
      StorageKeys.swift               // typed key constants (mirrors storageKey.js)
      VocabIndex.swift                // O(1) term lookup (mirrors vocabIndex.js)

    Storage/
      ProgressStore.swift             // weekly completion bits (UserDefaults)
      StreakStore.swift                // streak + today flags (UserDefaults + iCloud)
      SRSStore.swift                  // SwiftData CRUD over SRSCardRecord
      JournalStore.swift              // SwiftData CRUD over JournalEntry
      PronunStore.swift               // SwiftData CRUD over PronunRecord
      SyncManager.swift               // bridges Storage layer ↔ SyncSnapshot JSON

    Views/
      Tracker/
        TrackerView.swift             // phase list + today card
        TodayCardView.swift           // streak + 3-item checklist
        WeekRowView.swift             // single week row in list
        WeekDetailView.swift          // segmented: vocab / reading / drills
        VocabGridView.swift           // grid of VocabCardView
        VocabCardView.swift           // single word card with speaker + IPA
        ReadingPassageView.swift      // tappable passage (O2)
        WordGlossView.swift           // popover on word tap
        GrammarDrillView.swift        // fill-in-blank (O3)
        DictoglossView.swift          // hear → type → diff (O4)
        ComprehensionView.swift       // T/F + multiple choice (O5)

      Flashcards/
        FlashcardsView.swift          // mode picker + stats + struggle panel
        PracticeView.swift            // SRS session orchestrator
        SRSCardView.swift             // flip animation + grade buttons
        PronunciationView.swift       // mic + score display
        ShadowingView.swift           // sentence shadowing (O1)

      Journal/
        JournalListView.swift         // per-week entry list
        JournalEntryView.swift        // TextEditor + scaffold + grammar check
        WritingScaffoldView.swift     // collapsible starters + vocab chips
        GrammarResultsView.swift      // LanguageTool underlines + suggestions

      Settings/
        SettingsView.swift            // appearance, session, reminders, sync
        NewSessionView.swift          // date picker + reset scope + confirm
        SyncView.swift                // QR + paste + file import/export
        RemindersView.swift           // time picker + toggle

      Shared/
        SpeakerButton.swift           // AVSpeechSynthesizer wrapper view
        StreakBadgeView.swift         // flame + count chip
        ProgressRingView.swift        // circular progress for score
        ConfettiView.swift            // streak milestone animation

    Widgets/
      ItalianBibleWidgetBundle.swift  // @main for widget extension
      SmallStreakWidget.swift         // 2×2: streak + 3 icons
      MediumTodayWidget.swift        // 4×2: streak + week title + checklist
      WidgetDataStore.swift          // App Group UserDefaults shared with main app

    Intents/
      StartStudyIntent.swift          // AppIntent: "Start Italian study"
      OpenWeekIntent.swift            // AppIntent: "Open week N"

  ItalianBibbiaStudyTests/
    LogicTests/
      SRSTests.swift
      AnswerTests.swift
      ClozeTests.swift
      ItalianIPATests.swift
      StreakTests.swift
      AchievementsTests.swift
      RemindersTests.swift
      ScheduleTests.swift
    StorageTests/
      SRSStoreTests.swift
      JournalStoreTests.swift
```

---

## Logic layer — Swift ports

All ports are pure (no SwiftUI, no storage imports); each has a corresponding
`XCTest` file. Where the JS uses `Date.now()` for testability, Swift uses an
injectable `Date` parameter defaulting to `Date()`.

### `Logic/SRS.swift`

```swift
import Foundation

let DAY: TimeInterval = 86400
let DEFAULT_EASE = 2.5
let MIN_EASE = 1.3
let DAILY_NEW_CAP = 15

struct SRSCardState: Codable, Equatable {
    var ease: Double = DEFAULT_EASE
    var interval: Int = 0
    var reps: Int = 0
    var lapses: Int = 0
    var due: Date = .distantPast
    var last: Date?
    var created: Date = Date()
}

enum SRSGrade: String { case good, again, hard, easy }

func review(_ card: SRSCardState?, grade: SRSGrade, now: Date = Date()) -> SRSCardState {
    var ease = card?.ease ?? DEFAULT_EASE
    var reps = card?.reps ?? 0
    var lapses = card?.lapses ?? 0
    var interval = card?.interval ?? 0
    let created = card?.created ?? now

    switch grade {
    case .again:
        reps = 0; lapses += 1
        ease = max(MIN_EASE, ease - 0.2)
        interval = 0
        return SRSCardState(ease: ease, interval: interval, reps: reps,
                            lapses: lapses, due: now, last: now, created: created)
    case .hard:
        reps += 1
        ease = max(MIN_EASE, ease - 0.15)
        interval = max(1, Int((Double(interval) * 1.2).rounded()))
        return SRSCardState(ease: ease, interval: interval, reps: reps,
                            lapses: lapses, due: now.addingTimeInterval(Double(interval) * DAY),
                            last: now, created: created)
    case .good:
        reps += 1
        if reps == 1 { interval = 1 }
        else if reps == 2 { interval = 3 }
        else { interval = max(1, Int((Double(interval) * ease).rounded())) }
        return SRSCardState(ease: ease, interval: interval, reps: reps,
                            lapses: lapses, due: now.addingTimeInterval(Double(interval) * DAY),
                            last: now, created: created)
    case .easy:
        reps += 1
        ease = min(ease + 0.15, 4.0)
        interval = max(4, Int((Double(interval) * ease * 1.3).rounded()))
        return SRSCardState(ease: ease, interval: interval, reps: reps,
                            lapses: lapses, due: now.addingTimeInterval(Double(interval) * DAY),
                            last: now, created: created)
    }
}

func isDue(_ card: SRSCardState, now: Date = Date()) -> Bool {
    card.due <= now
}

func newIntroducedToday(_ store: [String: SRSCardState], now: Date = Date()) -> Int {
    let cal = Calendar.current
    return store.values.filter { cal.isDate($0.created, inSameDayAs: now) }.count
}

func newAllowanceToday(_ store: [String: SRSCardState], now: Date = Date(),
                        cap: Int = DAILY_NEW_CAP) -> Int {
    max(0, cap - newIntroducedToday(store, now: now))
}

struct SRSStats { let due: Int; let new: Int; let learned: Int; let total: Int }

func srsStats(cards: [VocabCard], store: [String: SRSCardState],
              now: Date = Date()) -> SRSStats {
    var due = 0; var fresh = 0; var learned = 0
    for card in cards {
        if let st = store[card.italian] {
            learned += 1
            if st.due <= now { due += 1 }
        } else { fresh += 1 }
    }
    return SRSStats(due: due, new: fresh, learned: learned, total: cards.count)
}
```

---

### `Logic/Answer.swift`

```swift
import Foundation

// Fold Italian accented vowels to their plain equivalents.
// Mirrors pronunciation.js normalize() + answer.js canonical().
func canonicalAnswer(_ input: String, leadingArticles: [String]) -> String {
    var s = input.lowercased()
    let folds: [Character: Character] = [
        "à":"a","á":"a","è":"e","é":"e","ì":"i","í":"i",
        "î":"i","ò":"o","ó":"o","ù":"u","ú":"u"
    ]
    s = String(s.map { folds[$0] ?? $0 })
    // Strip a leading article (longest match first — mirrors LEADING_ARTICLE regex)
    let sorted = leadingArticles.sorted { $0.count > $1.count }
    for art in sorted {
        if s.hasPrefix(art + " ") { s = String(s.dropFirst(art.count + 1)); break }
        if s.hasPrefix(art + "'") { s = String(s.dropFirst(art.count + 1)); break }
    }
    // Strip punctuation
    s = s.components(separatedBy: CharacterSet(charactersIn: ".,;:!?\"«»'`()"))
         .joined()
    return s.trimmingCharacters(in: .whitespaces)
}

// Levenshtein distance (iterative, O(n*m)).
func levenshtein(_ a: String, _ b: String) -> Int {
    let aArr = Array(a), bArr = Array(b)
    var dp = Array(0...bArr.count)
    for i in 1...max(aArr.count, 1) {
        guard i <= aArr.count else { break }
        var prev = dp[0]; dp[0] = i
        for j in 1...max(bArr.count, 1) {
            guard j <= bArr.count else { break }
            let temp = dp[j]
            dp[j] = aArr[i-1] == bArr[j-1] ? prev
                  : 1 + min(prev, dp[j], dp[j-1])
            prev = temp
        }
    }
    return dp[bArr.count]
}

func checkAnswer(expected: String, given: String,
                 leadingArticles: [String]) -> Bool {
    let e = canonicalAnswer(expected, leadingArticles: leadingArticles)
    let g = canonicalAnswer(given, leadingArticles: leadingArticles)
    guard !g.isEmpty else { return false }
    if e == g { return true }
    let tolerance = max(1, Int(Double(e.count) * 0.2))
    return levenshtein(e, g) <= tolerance
}
```

---

### `Logic/Streak.swift`

```swift
import Foundation

struct StreakStore: Codable {
    var current: Int = 0
    var best: Int = 0
    var last: String? = nil
    var today: TodayFlags? = nil
}

struct TodayFlags: Codable {
    var date: String
    var read: Bool = false
    var practiced: Bool = false
    var journaled: Bool = false
}

func todayString(_ date: Date = Date()) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}

func dayBefore(_ dateStr: String) -> String {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    guard let d = f.date(from: dateStr) else { return dateStr }
    return f.string(from: Calendar.current.date(byAdding: .day, value: -1, to: d)!)
}

func setFlag(_ store: StreakStore, flag: String, today: String = todayString()) -> StreakStore {
    var s = store
    if s.today == nil || s.today!.date != today {
        s.today = TodayFlags(date: today)
    }
    switch flag {
    case "read":       s.today!.read = true
    case "practiced":  s.today!.practiced = true
    case "journaled":  s.today!.journaled = true
    default: break
    }
    // advance streak
    if s.last != today {
        s.current = (s.last == dayBefore(today)) ? (s.current + 1) : 1
    }
    s.best = max(s.best, s.current)
    s.last = today
    return s
}

func currentStreak(_ store: StreakStore, today: String = todayString()) -> Int {
    guard let last = store.last else { return 0 }
    return (last == today || last == dayBefore(today)) ? store.current : 0
}
```

---

### `Logic/Cloze.swift`

```swift
import Foundation

struct ClozeResult {
    let before: String
    let answer: String
    let after: String
}

func makeCloze(term: String, example: String,
               leadingArticles: [String]) -> ClozeResult? {
    guard !term.isEmpty, !example.isEmpty else { return nil }
    // strip the leading article to use the bare content word as blank
    var stripped = term
    let sorted = leadingArticles.sorted { $0.count > $1.count }
    for art in sorted {
        if stripped.lowercased().hasPrefix(art + " ") {
            stripped = String(stripped.dropFirst(art.count + 1)); break
        }
    }
    for candidate in [stripped, term] {
        guard candidate.count >= 2 else { continue }
        if let range = example.range(of: candidate,
                                     options: .caseInsensitive) {
            return ClozeResult(
                before: String(example[example.startIndex..<range.lowerBound]),
                answer: String(example[range]),
                after:  String(example[range.upperBound...])
            )
        }
    }
    return nil
}

func isClozeEligible(card: VocabCard, leadingArticles: [String]) -> Bool {
    makeCloze(term: card.italian, example: card.example,
              leadingArticles: leadingArticles) != nil
}
```

---

### `Logic/ItalianIPA.swift`

The 173-line JS converter maps 1:1 to Swift. The segment loop and digraph rules
(`gli`→`ʎ`, `gn`→`ɲ`, soft c/g, `sc`+front, `ch`/`gh`, geminates,
intervocalic-s voicing) translate directly. Key difference: Swift `String`
indexing requires `String.Index` — use `Array(word)` for O(1) random access,
same as the JS approach.

```swift
import Foundation

// Entry point — mirrors toIPA(word) in it2ipa.js.
func toIPA(_ word: String) -> String {
    let w = word.lowercased()
    let segments = toSegments(w)      // see full impl below
    let stressed = placeStress(segments)
    return "/" + stressed.map(\.phoneme).joined() + "/"
}

// Segment types
struct Segment {
    var phoneme: String
    var isVowel: Bool
    var hasAccent: Bool
}

private let accentMap: [Character: (plain: Character, open: Bool)] = [
    "à": ("a", false), "á": ("a", false),
    "è": ("ɛ", true),  "é": ("e", false),
    "ì": ("i", false), "í": ("i", false), "î": ("i", false),
    "ò": ("ɔ", true),  "ó": ("o", false),
    "ù": ("u", false), "ú": ("u", false),
    "â": ("a", false), "ê": ("e", false), "ô": ("o", false), "û": ("u", false),
]
private let plainVowels: Set<Character> = ["a","e","i","o","u"]
private let frontVowels: Set<Character> = ["e","è","é","i","ì","í"]

// (Full toSegments + placeStress implementation follows the same rules as
// it2ipa.js — ~130 lines of rule-application over Array(word), using index
// arithmetic identical to the JS version. Omitted here for brevity but is a
// direct transliteration.)
```

---

### `Logic/Schedule.swift`

```swift
import Foundation

struct Schedule {
    let startDate: Date
    let weeks: Int

    // Reads the sessionStart override from UserDefaults; falls back to
    // the static course config. Matches schedule.js post-T0 refactor.
    static func effectiveStartDate() -> Date {
        if let override = UserDefaults.standard.string(forKey: StorageKeys.sessionStart) {
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
            if let d = f.date(from: override) { return d }
        }
        return CourseConfig.schedule.startDate
    }

    static func getCurrentWeekN(now: Date = Date()) -> Int? {
        let start = effectiveStartDate()
        let diff = now.timeIntervalSince(start)
        guard diff >= 0 else { return nil }
        let n = Int(diff / (7 * 86400)) + 1
        return n <= CourseConfig.schedule.weeks ? n : nil
    }

    static func getEndDate() -> Date {
        effectiveStartDate().addingTimeInterval(Double(CourseConfig.schedule.weeks) * 7 * 86400)
    }
}
```

---

## TTS — `Views/Shared/SpeakerButton.swift`

```swift
import SwiftUI
import AVFoundation

struct SpeakerButton: View {
    let text: String
    var rate: Float = 0.5          // AVSpeechUtteranceDefaultSpeechRate ≈ 0.5; web used 0.85
    var language = "it-IT"

    @State private var speaking = false
    private let synthesizer = AVSpeechSynthesizer()

    var body: some View {
        Button {
            if speaking { synthesizer.stopSpeaking(at: .immediate); speaking = false }
            else { speak() }
        } label: {
            Image(systemName: speaking ? "stop.circle.fill" : "speaker.wave.2.fill")
                .foregroundStyle(speaking ? .red : .green)
        }
    }

    private func speak() {
        let utt = AVSpeechUtterance(string: text)
        utt.voice = AVSpeechSynthesisVoice(language: language)
        utt.rate = rate
        speaking = true
        // AVSpeechSynthesizerDelegate could track completion; simplified here
        synthesizer.speak(utt)
        // Estimate duration to clear speaking state
        let duration = Double(text.count) / 10.0 + 0.5
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { speaking = false }
    }
}
```

---

## Speech recognition — `Views/Flashcards/PronunciationView.swift`

```swift
import SwiftUI
import Speech

@Observable final class PronunciationSession {
    var transcript = ""
    var isRecording = false
    var score: Double? = nil

    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let engine = AVAudioEngine()

    func requestPermission() async -> Bool {
        await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status == .authorized)
            }
        }
    }

    func start(language: String = "it-IT") {
        recognizer = SFSpeechRecognizer(locale: Locale(identifier: language))
        request = SFSpeechAudioBufferRecognitionRequest()
        guard let request else { return }
        request.shouldReportPartialResults = true
        let inputNode = engine.inputNode
        inputNode.installTap(onBus: 0, bufferSize: 1024,
                             format: inputNode.outputFormat(forBus: 0)) { buf, _ in
            request.append(buf)
        }
        engine.prepare(); try? engine.start()
        isRecording = true
        task = recognizer?.recognitionTask(with: request) { [weak self] result, err in
            if let result { self?.transcript = result.bestTranscription.formattedString }
            if result?.isFinal == true || err != nil { self?.stop() }
        }
    }

    func stop() {
        engine.stop(); engine.inputNode.removeTap(onBus: 0)
        request?.endAudio(); isRecording = false
    }

    // Score: word-level intersection / expected-word-count, accent-folded.
    func scoreAgainst(expected: String, articles: [String]) -> Double {
        let expWords = expected.lowercased().split(separator: " ").map(String.init)
        let gotWords = transcript.lowercased().split(separator: " ").map(String.init)
        let hits = expWords.filter { e in gotWords.contains { canonicalAnswer($0, leadingArticles: articles) == canonicalAnswer(e, leadingArticles: articles) } }.count
        return expWords.isEmpty ? 0 : Double(hits) / Double(expWords.count)
    }
}
```

---

## Storage — SwiftData models

```swift
import SwiftData
import Foundation

// One row per vocab term per course. Mirrors the per-word object in useSrs.js.
@Model final class SRSCardRecord {
    @Attribute(.unique) var term: String      // Italian word (the key)
    var courseID: String                       // namespacing (= config.id)
    var ease: Double
    var interval: Int
    var reps: Int
    var lapses: Int
    var due: Date
    var last: Date?
    var created: Date

    init(term: String, courseID: String) {
        self.term = term; self.courseID = courseID
        ease = DEFAULT_EASE; interval = 0; reps = 0; lapses = 0
        due = .distantPast; created = Date()
    }
}

// One row per week.
@Model final class JournalEntry {
    @Attribute(.unique) var weekKey: String    // "<courseID>-week-<n>"
    var weekN: Int
    var courseID: String
    var text: String
    var updatedAt: Date

    init(weekN: Int, courseID: String) {
        self.weekN = weekN; self.courseID = courseID
        self.weekKey = "\(courseID)-week-\(weekN)"
        text = ""; updatedAt = Date()
    }
}
```

```swift
// App entry point — sets up the shared ModelContainer.
@main struct ItalianBibbiaStudyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [SRSCardRecord.self, JournalEntry.self, PronunRecord.self])
    }
}
```

Progress bits (37 booleans) and streak stay in `UserDefaults`/`@AppStorage` —
they're tiny and don't need querying:

```swift
enum StorageKeys {
    static let sessionStart     = "italian-bible-session-start"
    static let theme            = "italian-bible-theme"
    static let immersion        = "italian-bible-immersion"
    static let weekProgress     = "italian-bible-progress"   // JSON [Int: Bool]
    static let streak           = "italian-bible-streak"     // JSON StreakStore
    static let reminders        = "italian-bible-reminders"  // JSON ReminderPrefs
}
```

---

## Widgets — `Widgets/SmallStreakWidget.swift`

WidgetKit reads from an **App Group** shared `UserDefaults` (no bridge needed
— this is the primary advantage of Swift widgets over React Native widgets):

```swift
import WidgetKit
import SwiftUI

struct StreakEntry: TimelineEntry {
    let date: Date
    let streak: Int
    let todayFlags: TodayFlags
    let weekTitle: String
}

struct Provider: TimelineProvider {
    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> Void) {
        completion(entry())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> Void) {
        let next = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        completion(Timeline(entries: [entry()], policy: .after(next)))
    }
    func placeholder(in context: Context) -> StreakEntry { entry() }

    private func entry() -> StreakEntry {
        // Read from the App Group UserDefaults that the main app writes to.
        let shared = UserDefaults(suiteName: "group.com.italianbibliastudy")!
        let streakData = shared.data(forKey: StorageKeys.streak)
            .flatMap { try? JSONDecoder().decode(StreakStore.self, from: $0) }
            ?? StreakStore()
        let weekN = Schedule.getCurrentWeekN() ?? 0
        let title = weekN > 0 ? CourseContent.weeks[weekN - 1].title : "—"
        return StreakEntry(date: Date(), streak: currentStreak(streakData),
                          todayFlags: todayFlags(streakData), weekTitle: title)
    }
}

struct SmallStreakWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SmallStreak", provider: Provider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("Streak")
        .description("Today's study progress and streak.")
        .supportedFamilies([.systemSmall])
    }
}
```

---

## Siri Shortcuts — `Intents/StartStudyIntent.swift`

```swift
import AppIntents

struct StartStudyIntent: AppIntent {
    static let title: LocalizedStringResource = "Start Italian Study"
    static let description = IntentDescription("Opens Italian Bible Study in Practice mode.")
    static let openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        // Deep-link to Practice tab via URL scheme or UserDefaults flag read by ContentView
        UserDefaults.standard.set("flashcards", forKey: "launch-tab")
        return .result()
    }
}
```

---

## iCloud backup — `Storage/StreakStore.swift`

```swift
// Mirror streak + progress to iCloud key-value store (opt-in).
// NSUbiquitousKeyValueStore syncs up to 1 MB; our payload is <10 KB.
class iCloudSync {
    static let store = NSUbiquitousKeyValueStore.default

    static func pushAll() {
        guard UserDefaults.standard.bool(forKey: "icloud-sync-enabled") else { return }
        for key in [StorageKeys.streak, StorageKeys.weekProgress, StorageKeys.reminders] {
            if let data = UserDefaults.standard.data(forKey: key) {
                store.set(data, forKey: key)
            }
        }
        store.synchronize()
    }

    static func pullAll() {
        guard UserDefaults.standard.bool(forKey: "icloud-sync-enabled") else { return }
        for key in [StorageKeys.streak, StorageKeys.weekProgress, StorageKeys.reminders] {
            if let data = store.data(forKey: key) {
                UserDefaults.standard.set(data, forKey: key)
            }
        }
    }
}
```

---

## Haptics — usage throughout the app

```swift
import CoreHaptics
import UIKit

enum HapticEvent {
    case cardFlip      // UIImpactFeedbackGenerator(.light)
    case gradeGood     // UINotificationFeedbackGenerator(.success)
    case gradeAgain    // UINotificationFeedbackGenerator(.error)
    case streakMilestone  // Custom CHHapticPattern (3 heavy taps)
}

func haptic(_ event: HapticEvent) {
    switch event {
    case .cardFlip:
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    case .gradeGood:
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    case .gradeAgain:
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    case .streakMilestone:
        // Custom pattern — three escalating thumps
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        // … CHHapticPattern implementation
    }
}
```

---

## Sync snapshot — cross-device (QR / file)

The existing `syncSnapshot.js` export format is preserved exactly so a user can
move data between the web PWA and the iOS app without conversion:

```swift
// Export: collect all UserDefaults keys + SwiftData rows into the same JSON
// shape as syncSnapshot.js, then compress with zlib (mirrors lz-string).
func exportSnapshot() throws -> Data {
    var payload: [String: Any] = [
        "v": 2,
        "course": CourseConfig.id,
        "ts": Date().timeIntervalSince1970,
    ]
    // Progress, streak, reminders from UserDefaults
    for key in [StorageKeys.weekProgress, StorageKeys.streak, StorageKeys.reminders] {
        if let val = UserDefaults.standard.string(forKey: key) { payload[key] = val }
    }
    // SRS from SwiftData — serialise to same {term: {ease,interval,...}} shape
    // Journal entries similarly
    let json = try JSONSerialization.data(withJSONObject: payload)
    return try (json as NSData).compressed(using: .zlib) as Data
}
```

---

## NavigationSplitView (iPad)

```swift
struct ContentView: View {
    @State private var selectedWeek: WeekData? = nil
    @Environment(\.horizontalSizeClass) private var hSizeClass

    var body: some View {
        if hSizeClass == .regular {
            // iPad: persistent sidebar
            NavigationSplitView {
                TrackerSidebarView(selectedWeek: $selectedWeek)
            } detail: {
                if let week = selectedWeek {
                    WeekDetailView(week: week)
                } else {
                    TodayCardView()
                }
            }
        } else {
            // iPhone: tab bar
            TabView {
                TrackerView().tabItem { Label("Tracker", systemImage: "calendar") }
                FlashcardsView().tabItem { Label("Flashcards", systemImage: "rectangle.stack") }
                JournalView().tabItem { Label("Journal", systemImage: "pencil") }
            }
        }
    }
}
```

---

## What does NOT need rewriting

| Item | Status |
|------|--------|
| Course content data (37 weeks, vocab, passages, drills) | Transcribed to `CourseContent.swift` static arrays — mechanical work, no logic changes |
| LanguageTool grammar API call | Same HTTPS endpoint, same JSON shape — `URLSession` replaces `fetch` |
| Sync QR format / snapshot JSON | Same schema — preserved for web ↔ iOS interoperability |
| All 37 weeks of `exercises.js` (drills, comprehension, passages) | Transcribed to Swift structs — tedious but mechanical |

---

## Xcode project config

```
Target: ItalianBibbiaStudy
  Bundle ID: com.italianbibliastudy.app
  Deployment target: iOS 15.0
  Capabilities:
    - Push Notifications
    - Background Modes > Background fetch
    - iCloud > Key-value storage
    - App Groups > group.com.italianbibliastudy
    - Siri

Target: ItalianBibbiaStudyWidget
  Kind: Widget Extension
  Capabilities:
    - App Groups > group.com.italianbibliastudy (shared with main)

Signing:
  - Apple Developer Program membership required
  - Automatic signing in Xcode
```

---

## Build & CI

```bash
# Development (simulator)
xcodebuild -scheme ItalianBibbiaStudy -destination 'platform=iOS Simulator,name=iPhone 16' build

# Tests
xcodebuild test -scheme ItalianBibbiaStudy -destination 'platform=iOS Simulator,name=iPhone 16'

# Archive for TestFlight
xcodebuild archive -scheme ItalianBibbiaStudy -archivePath build/ItalianBibbiaStudy.xcarchive
xcodebuild -exportArchive -archivePath build/ItalianBibbiaStudy.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/

# Upload to App Store Connect
xcrun altool --upload-app -f build/ItalianBibbiaStudy.ipa \
  -u "$APPLE_ID" -p "$APP_SPECIFIC_PASSWORD"
```

GitHub Actions workflow (`ios-swift-ci.yml`):
```yaml
jobs:
  build-and-test:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - run: xcodebuild test -scheme ItalianBibbiaStudy
               -destination 'platform=iOS Simulator,name=iPhone 16'
               | xcpretty
      - run: xcodebuild archive …   # only on tag push
```

---

## Milestone timeline

| Milestone | Scope | Est. |
|-----------|-------|------|
| M0 — Project scaffold | Xcode project, SwiftData container, tab + split nav | 3 days |
| M1 — Logic layer | All 8 JS utils ported to Swift with XCTest coverage | 1 week |
| M2 — Course data | `CourseContent.swift` (37 weeks × vocab + metadata) | 3 days |
| M3 — Tracker | TodayCard, week list, WeekDetail (vocab + reading + drills) | 2 weeks |
| M4 — Flashcards | SRS flip, grade buttons, cloze, listening, pronunciation | 2 weeks |
| M5 — Journal | Entry list, scaffold, grammar check | 1 week |
| M6 — Settings + sync | New session, QR export/import, iCloud toggle | 1 week |
| M7 — Native features | Widgets, haptics, Siri, Dynamic Type | 1 week |
| M8 — App Store | Icons, privacy manifest, TestFlight, review | 1 week |
| **Total** | | **~10–11 weeks** |

Similar to React Native because the saved logic-reuse time is offset by the
extra SwiftUI view work compared to adapted React components.

---

## Trade-off summary vs React Native

```
                      SwiftUI         React Native + Expo
──────────────────────────────────────────────────────────
Binary size           8–12 MB         50–70 MB
Startup time          fast            ~300ms JS init
Widget integration    native          requires Swift ext anyway
Speech quality        SFSpeechRec     @rn-voice bridge
TTS control           full AVFoundation  limited expo-speech
Animation             SwiftUI/Reanimated  Reanimated
Logic reuse from web  none            ~618 lines unchanged
Android path          separate proj   same codebase
Long-term maint.      iOS-only Swift  JS shared with web
```

**Bottom line:** if you ever want to ship Android too, choose React Native.
If this is iOS-only forever and you want the best possible native product —
no bridge overhead, trivial widgets, full AVFoundation TTS fidelity,
CoreHaptics — choose SwiftUI. The timelines are roughly equal; the React Native
path saves ~1 week upfront (logic reuse) but accumulates small native-feel debt
over time.
