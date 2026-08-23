import AppIntents
import BibbiaCore

// App Entities — the course's weeks and vocab as things Siri and Shortcuts can
// name, pick from a list, and pass between actions (plan-siri.md, I2).
//
// These deliberately read `Course.shared` rather than AppModel: the course is
// immutable bundled data with no actor isolation, so the queries stay simple
// and can run wherever the system calls them. Only *mutating* intents need
// AppModel.

// ── Week ─────────────────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct WeekEntity: AppEntity, Identifiable {
    /// The week number (1-based) — stable across launches, so it is the id.
    var id: Int
    var reading: String
    var topic: String

    init(id: Int, reading: String, topic: String) {
        self.id = id
        self.reading = reading
        self.topic = topic
    }

    init(_ week: Week) {
        self.init(id: week.n, reading: week.r, topic: week.b)
    }

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Week")
    }

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "Week \(id)",
            subtitle: LocalizedStringResource(stringLiteral: subtitle))
    }

    private var subtitle: String {
        let parts = [reading, topic].filter { !$0.isEmpty }
        return parts.joined(separator: " · ")
    }

    static var defaultQuery = WeekEntityQuery()
}

@available(iOS 16.0, *)
struct WeekEntityQuery: EntityQuery {
    func entities(for identifiers: [Int]) async throws -> [WeekEntity] {
        identifiers.compactMap { Course.shared.week($0).map(WeekEntity.init) }
    }

    /// Shown when the user taps the parameter with nothing typed. The whole
    /// course is only ~37 rows, so offering all of them is friendlier than an
    /// arbitrary slice.
    func suggestedEntities() async throws -> [WeekEntity] {
        Course.shared.allWeeks.map(WeekEntity.init)
    }

    func defaultResult() async -> WeekEntity? {
        // "This week" is the useful default; fall back to week 1 before the
        // program starts so the parameter is never empty.
        let course = Course.shared
        let current = ScheduleLogic.currentWeekN(
            startDate: WebStore.loadString("session-start") ?? course.schedule.startDate,
            weeks: course.schedule.weeks)
        let n = current ?? 1
        return course.week(n).map(WeekEntity.init)
    }
}

// ── Vocab ────────────────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct VocabEntity: AppEntity, Identifiable {
    /// The Italian term — unique within the course and stable, so it is the id.
    var id: String
    var english: String
    var example: String

    init(id: String, english: String, example: String) {
        self.id = id
        self.english = english
        self.example = example
    }

    init(_ card: VocabCard) {
        self.init(id: card.it, english: card.en, example: card.ex)
    }

    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Word")
    }

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: LocalizedStringResource(stringLiteral: id),
            subtitle: LocalizedStringResource(stringLiteral: english))
    }

    static var defaultQuery = VocabEntityQuery()
}

@available(iOS 16.0, *)
struct VocabEntityQuery: EntityQuery, EntityStringQuery {
    func entities(for identifiers: [String]) async throws -> [VocabEntity] {
        let wanted = Set(identifiers)
        return Course.shared.allVocab
            .filter { wanted.contains($0.it) }
            .map(VocabEntity.init)
    }

    /// Free-text match from a spoken or typed query — accent/case-insensitive
    /// and article-aware, so "luce" reaches "la luce". See
    /// IntentLogic.searchVocab for the ranking rules (and its tests).
    func entities(matching string: String) async throws -> [VocabEntity] {
        IntentLogic.searchVocab(Course.shared.allVocab,
                                matching: string,
                                articles: Course.shared.locale.articles,
                                limit: 20)
            .map(VocabEntity.init)
    }

    func suggestedEntities() async throws -> [VocabEntity] {
        // 259 cards is too many to dump into a picker; show the first week's.
        (Course.shared.week(1)?.vocab ?? []).map(VocabEntity.init)
    }
}
