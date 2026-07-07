import Foundation
import SwiftUI
import BibbiaCore

// All persisted state lives in UserDefaults as JSON *strings* under the same
// `italian-bible-*` keys the web PWA uses in localStorage — that's what makes
// the web app's .json backup file import into this app unchanged (see
// SyncManager). New persisted state must go through WebStore, never a raw
// UserDefaults key.

enum WebStore {
    static let prefix = Course.storagePrefix

    static func key(_ name: String) -> String { "\(prefix)-\(name)" }

    static func loadJSON<T: Decodable>(_ name: String, as type: T.Type) -> T? {
        guard let s = UserDefaults.standard.string(forKey: key(name)) else { return nil }
        return try? JSONDecoder().decode(T.self, from: Data(s.utf8))
    }

    static func saveJSON<T: Encodable>(_ name: String, _ value: T) {
        guard let data = try? JSONEncoder().encode(value),
              let s = String(data: data, encoding: .utf8) else { return }
        UserDefaults.standard.set(s, forKey: key(name))
    }

    static func loadString(_ name: String) -> String? {
        UserDefaults.standard.string(forKey: key(name))
    }

    static func saveString(_ name: String, _ value: String?) {
        if let value {
            UserDefaults.standard.set(value, forKey: key(name))
        } else {
            UserDefaults.standard.removeObject(forKey: key(name))
        }
    }

    /// Every persisted string for this course — the snapshot export payload.
    static func allEntries() -> [String: String] {
        let p = prefix + "-"
        var out: [String: String] = [:]
        for (k, v) in UserDefaults.standard.dictionaryRepresentation() {
            if k.hasPrefix(p), let s = v as? String { out[k] = s }
        }
        return out
    }

    static func removeAll() {
        let p = prefix + "-"
        for k in UserDefaults.standard.dictionaryRepresentation().keys where k.hasPrefix(p) {
            UserDefaults.standard.removeObject(forKey: k)
        }
    }
}

struct JournalEntry: Codable, Equatable {
    var text: String
    var updatedAt: String   // ISO-8601, like the web app writes
}

enum Theme: String, CaseIterable, Identifiable {
    case system, light, dark
    var id: String { rawValue }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var label: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }
}

@MainActor
final class AppModel: ObservableObject {
    let course = Course.shared
    lazy var vocabIndex = VocabIndex(course: course)

    // Store shapes match the web localStorage values exactly.
    @Published private(set) var progress: [String: Bool] = [:]      // week n → done
    @Published private(set) var journal: [String: JournalEntry] = [:]
    @Published private(set) var srsStore: SRSStore = [:]
    @Published private(set) var pronunStore: PronunStore = [:]
    @Published private(set) var streak = StreakData()
    @Published var theme: Theme = .system { didSet { persistTheme() } }
    @Published private(set) var sessionStartOverride: String?       // "YYYY-MM-DD"
    @Published var reminders = ReminderPrefs() { didSet { WebStore.saveJSON("reminders", reminders) } }

    var articles: [String] { course.locale.articles }
    var ttsLanguage: String { course.locale.target }

    init() {
        reloadFromDisk()
    }

    /// Re-read every store from UserDefaults (startup + after a sync import).
    func reloadFromDisk() {
        progress = WebStore.loadJSON("progress", as: [String: Bool].self) ?? [:]
        journal = WebStore.loadJSON("journal", as: [String: JournalEntry].self) ?? [:]
        srsStore = WebStore.loadJSON("srs", as: SRSStore.self) ?? [:]
        pronunStore = WebStore.loadJSON("pronun", as: PronunStore.self) ?? [:]
        streak = WebStore.loadJSON("streak", as: StreakData.self) ?? StreakData()
        theme = Theme(rawValue: WebStore.loadString("theme") ?? "") ?? .system
        sessionStartOverride = WebStore.loadString("session-start")
        reminders = WebStore.loadJSON("reminders", as: ReminderPrefs.self) ?? ReminderPrefs()
        ensureSessionStart()
    }

    /// New users start the program the day they first open the app. The
    /// course config's fixed `startDate` is the web reference deploy's
    /// calendar — meaningless for an App Store install — so when no
    /// `session-start` override exists yet, stamp today as day 1 of week 1.
    /// An explicit choice (Settings → New Session, or a backup import that
    /// carries its own override) wins and is never overwritten.
    private func ensureSessionStart() {
        guard sessionStartOverride == nil else { return }
        let start = todayStr()
        sessionStartOverride = start
        WebStore.saveString("session-start", start)
    }

    private func persistTheme() {
        WebStore.saveString("theme", theme == .system ? nil : theme.rawValue)
    }

    // ── Progress ─────────────────────────────────────────────────────────────
    func isWeekDone(_ n: Int) -> Bool { progress[String(n)] == true }

    var weeksDone: Int { progress.values.filter { $0 }.count }

    var progressPct: Int {
        course.totalWeeks > 0 ? Int((Double(weeksDone) / Double(course.totalWeeks) * 100).rounded()) : 0
    }

    func toggleWeek(_ n: Int) {
        progress[String(n)] = !(progress[String(n)] ?? false)
        WebStore.saveJSON("progress", progress)
        if progress[String(n)] == true { Haptics.success() }
    }

    // ── Journal ──────────────────────────────────────────────────────────────
    func journalText(_ n: Int) -> String { journal[String(n)]?.text ?? "" }

    var journaledWeeks: Int {
        journal.values.filter { !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.count
    }

    func setJournalText(_ n: Int, _ text: String) {
        journal[String(n)] = JournalEntry(
            text: text,
            updatedAt: ISO8601DateFormatter().string(from: Date()))
        WebStore.saveJSON("journal", journal)
        if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            recordActivity(.journaled)
        }
    }

    // ── SRS / practice ───────────────────────────────────────────────────────
    func recordReview(term: String, grade: SRSGrade) {
        let now = Date().timeIntervalSince1970 * 1000
        srsStore[term] = srsReview(srsStore[term], grade: grade, now: now)
        WebStore.saveJSON("srs", srsStore)
        recordActivity(.practiced)
    }

    func recordPronunciation(term: String, score: Int) {
        let now = Date().timeIntervalSince1970 * 1000
        let prev = pronunStore[term] ?? PronunStat()
        pronunStore[term] = prev.recording(score: score, now: now)
        WebStore.saveJSON("pronun", pronunStore)
        recordActivity(.practiced)
    }

    var learnedCount: Int { srsStore.count }

    // ── Streak ───────────────────────────────────────────────────────────────
    func recordActivity(_ flag: StreakFlag) {
        streak = setFlag(streak, flag: flag, today: todayStr())
        WebStore.saveJSON("streak", streak)
    }

    var streakCount: Int { currentStreak(streak, today: todayStr()) }
    var flagsToday: TodayFlags { todayFlags(streak, today: todayStr()) }

    // ── Schedule / New Session ───────────────────────────────────────────────
    var effectiveStartDate: String { sessionStartOverride ?? course.schedule.startDate }

    var currentWeekN: Int? {
        ScheduleLogic.currentWeekN(startDate: effectiveStartDate, weeks: course.schedule.weeks)
    }

    var endDate: Date? {
        ScheduleLogic.endDate(startDate: effectiveStartDate, weeks: course.schedule.weeks)
    }

    /// "Apr 13-19"-style date range for week `n`, computed from the effective
    /// start date so it stays correct for a first-open or New Session start.
    /// Falls back to the authored `week.d` string if computation fails.
    func weekLabel(_ n: Int) -> String {
        ScheduleLogic.weekRangeLabel(startDate: effectiveStartDate, weekN: n)
            ?? course.week(n)?.d ?? ""
    }

    struct ResetScope {
        var progress = false
        var streak = false
        var srs = false
        var journal = false
    }

    /// Start (or restart) the program from `date` — see plan-new-session.md.
    func startNewSession(from date: Date, reset: ResetScope) {
        let start = todayStr(date)
        sessionStartOverride = start
        WebStore.saveString("session-start", start)
        if reset.progress { progress = [:]; WebStore.saveJSON("progress", progress) }
        if reset.streak { streak = StreakData(); WebStore.saveJSON("streak", streak) }
        if reset.srs { srsStore = [:]; WebStore.saveJSON("srs", srsStore) }
        if reset.journal { journal = [:]; WebStore.saveJSON("journal", journal) }
    }

    // ── Achievements ─────────────────────────────────────────────────────────
    var achievements: [Achievement] {
        let intProgress = Dictionary(uniqueKeysWithValues:
            progress.compactMap { k, v in Int(k).map { ($0, v) } })
        return computeAchievements(
            AchievementContext(progress: intProgress, learnedCount: learnedCount,
                               streakBest: streak.best, journaledWeeks: journaledWeeks),
            phases: course.phases, totalWeeks: course.totalWeeks)
    }
}
