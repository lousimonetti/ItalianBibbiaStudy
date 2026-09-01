import Foundation

// Codable model of the bundled course.json, generated from the web app's
// courses/it-bible-cei by ios-native/scripts/export-course-json.mjs.
// Field names deliberately mirror the web data layer (week.n / .d / .r / .b,
// vocab it/en/ex/ipa) so anyone reading both codebases sees the same shapes.

public struct Course: Codable {
    public let id: String
    public let brand: Brand
    public let locale: CourseLocale
    public let schedule: CourseSchedule
    public let resources: [CourseResource]
    /// Optional course content: a course that ships no devotions has no
    /// Prayers tab. Optional (not just empty) so a course.json predating the
    /// field still decodes — use `devotionSections` to read it.
    public let devotions: [DevotionSection]?
    public let phases: [Phase]

    /// Devotions, never nil. The Prayers tab hides itself when this is empty.
    public var devotionSections: [DevotionSection] { devotions ?? [] }

    /// The reference course's localStorage prefix, kept identical to the web
    /// app so sync-snapshot backup files are interchangeable between the PWA
    /// and this app.
    public static let storagePrefix = "italian-bible"

    public static let shared: Course = {
        do { return try Course.load() }
        catch { fatalError("course.json failed to load: \(error)") }
    }()

    // `Bundle.module` is an internal generated accessor, so it can't appear
    // as a public default argument — resolve it in the body instead.
    public static func load(bundle: Bundle? = nil) throws -> Course {
        let bundle = bundle ?? Bundle.module
        guard let url = bundle.url(forResource: "course", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(Course.self, from: data)
    }

    public var allWeeks: [Week] { phases.flatMap(\.weeks) }
    public var totalWeeks: Int { allWeeks.count }
    public var totalVocab: Int { allWeeks.reduce(0) { $0 + $1.vocab.count } }
    public var allVocab: [VocabCard] { allWeeks.flatMap(\.vocab) }

    public func week(_ n: Int) -> Week? {
        allWeeks.first { $0.n == n }
    }

    public func phase(containing weekN: Int) -> Phase? {
        phases.first { $0.weeks.contains { $0.n == weekN } }
    }
}

public struct Brand: Codable {
    public let name: String
    public let tagline: String
    public let goal: String
    public let topicLabel: String
    public let about: String
}

public struct CourseLocale: Codable {
    public let target: String       // TTS + speech-recognition language, e.g. "it-IT"
    public let native: String       // learner's language, e.g. "en"
    public let grammarLang: String  // LanguageTool code ("" disables grammar check)
    public let hasIPA: Bool
    public let articles: [String]
}

public struct CourseSchedule: Codable {
    public let startDate: String    // "YYYY-MM-DD", local
    public let weeks: Int
    public let daily: [DailyTask]
}

public struct DailyTask: Codable {
    public let day: String
    public let task: String
}

public struct CourseResource: Codable, Identifiable {
    public let id: String
    public let name: String
    public let badge: String
    public let role: String
    public let desc: String
}

// Devotional texts — the prayers a learner already knows by heart in their own
// language. Pedagogically these are the strongest material in the app: meaning
// comes free, they are formulaic chunks (the fastest route adults have to
// fluent production), and they are recited often enough to deliver the
// distributed re-encounter weekly vocabulary cannot.
//
// `lines` is what makes the interactive modes possible — per-line audio,
// shadowing, and the Recall cloze. `blank` names the word Recall hides, picked
// for grammatical payload (`sia`, `venga`) rather than difficulty, so it is
// authored rather than derived. Prayers without `lines` still render from the
// full `it`/`en` text.
public struct DevotionSection: Codable, Identifiable {
    public let id: String
    public let title: String
    public let titleEn: String
    public let intro: String?
    public let introEn: String?
    public let prayers: [Prayer]
}

public struct Prayer: Codable, Identifiable {
    public let id: String
    public let title: String
    public let titleEn: String
    public let note: String?
    public let noteEn: String?
    public let it: String
    public let en: String
    public let focus: PrayerFocus?
    public let lines: [PrayerLine]?

    /// Line-aligned modes need `lines`; the UI falls back to the full text.
    public var hasLines: Bool { !(lines ?? []).isEmpty }
}

public struct PrayerFocus: Codable {
    public let text: String
    public let weeks: [Int]
}

// Deliberately NOT Identifiable: a prayer can repeat a line verbatim, and
// identifying by text would collide inside a ForEach. Views enumerate instead.
public struct PrayerLine: Codable, Equatable {
    public let it: String
    public let en: String
    /// The word a Recall card hides. Authored for grammatical payload; when
    /// absent the UI falls back to the longest word (see `effectiveBlank`).
    public let blank: String?
}

public struct Phase: Codable, Identifiable {
    public let id: String
    public let title: String
    public let book: String
    public let badgeLabel: String
    public let weeks: [Week]
}

public struct Week: Codable, Identifiable {
    public let n: Int          // 1-based week number
    public let d: String       // date range label
    public let r: String       // reading/material
    public let b: String       // topic label
    public let review: Bool
    public let vocab: [VocabCard]
    public let grammar: GrammarNote
    public let prompt: WeekPrompt
    public let italki: [String]?
    public let passage: Passage?
    public let drill: [DrillItem]?
    public let comprehension: [ComprehensionItem]?
    public let phrases: [Phrase]?
    public let transform: [TransformItem]?
    public let questions: [SpokenQuestion]?

    public var id: Int { n }
}

public struct VocabCard: Codable, Hashable {
    public let it: String
    public let en: String
    public let ex: String
    public let ipa: String?
    /// The example sentence's English translation, when the course supplies one.
    public let exEn: String?
    /// The inflected form the headword takes in `ex` ("credere" -> "ha creduto").
    /// Drives cloze blanking and lets a conjugated word resolve to its lemma.
    public let form: String?

    public init(it: String, en: String, ex: String, ipa: String? = nil,
                exEn: String? = nil, form: String? = nil) {
        self.it = it
        self.en = en
        self.ex = ex
        self.ipa = ipa
        self.exEn = exEn
        self.form = form
    }
}

public struct GrammarNote: Codable {
    public let title: String
    public let body: String
}

public struct WeekPrompt: Codable {
    public let it: String
    public let en: String
}

public struct Passage: Codable {
    public let ref: String
    public let translation: String
    public let verses: [Verse]
}

public struct Verse: Codable, Identifiable {
    public let n: Int
    public let t: String

    public var id: Int { n }
}

public struct DrillItem: Codable {
    public let q: String       // sentence containing a ___ blank
    public let a: String       // expected fill
    public let hint: String?

    public init(q: String, a: String, hint: String? = nil) {
        self.q = q
        self.a = a
        self.hint = hint
    }
}

public struct ComprehensionItem: Codable {
    public let type: String            // "tf" | "mc"
    public let it: String
    public let en: String?
    public let options: [String]?      // mc only
    public let answerBool: Bool?       // tf only
    public let answerIndex: Int?       // mc only
    public let explain: String?

    public init(type: String, it: String, en: String? = nil, options: [String]? = nil,
                answerBool: Bool? = nil, answerIndex: Int? = nil, explain: String? = nil) {
        self.type = type
        self.it = it
        self.en = en
        self.options = options
        self.answerBool = answerBool
        self.answerIndex = answerIndex
        self.explain = explain
    }
}

public struct Phrase: Codable {
    public let it: String
    public let en: String
    public let lit: String?
}

public struct TransformItem: Codable {
    public let instruction: String
    public let base: String
    public let answer: String
}

public struct SpokenQuestion: Codable {
    public let q: String
    public let answers: [String]
    public let model: String
}
