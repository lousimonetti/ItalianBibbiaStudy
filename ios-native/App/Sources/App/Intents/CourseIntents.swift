import AppIntents
import BibbiaCore

// The App Intents themselves (plan-siri.md, I1).
//
// Two shapes here:
//   • Navigating intents set openAppWhenRun and hand off to AppRoute.
//   • Mutating intents (mark done, log reading) run WITHOUT opening the app, so
//     "I did my reading" from the Lock Screen just works.
//
// Every intent keeps its decision-making in IntentLogic (BibbiaCore) so CI can
// test it — Siri itself is untestable in CI. The bodies here are wiring only.
//
// AppModel and AppRoute are both @MainActor, so every perform() that touches
// them is marked @MainActor too — the system awaits the hop for us.

@available(iOS 16.0, *)
private func dialog(_ s: String) -> IntentDialog {
    IntentDialog(stringLiteral: s)
}

// ── Open a week ──────────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct OpenWeekIntent: AppIntent {
    static var title: LocalizedStringResource = "Open a Week"
    static var description = IntentDescription(
        "Opens a week of the course — its reading, vocabulary and grammar note.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Week")
    var week: WeekEntity?

    @Dependency private var model: AppModel
    @Dependency private var route: AppRoute

    static var parameterSummary: some ParameterSummary {
        Summary("Open \(\.$week)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let resolution = IntentLogic.resolveWeek(
            requested: week?.id,
            currentWeekN: model.currentWeekN,
            totalWeeks: model.course.totalWeeks)

        guard case let .resolved(n) = resolution else {
            return .result(dialog: dialog(
                IntentLogic.weekFailureDialog(resolution) ?? "Couldn't open that week."))
        }
        route.openWeek(n)
        let label = model.course.week(n).map { "Week \(n) — \($0.r)" } ?? "Week \(n)"
        return .result(dialog: dialog(label))
    }
}

// ── Start practice ───────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct StartPracticeIntent: AppIntent {
    static var title: LocalizedStringResource = "Practice Italian"
    static var description = IntentDescription(
        "Starts a spaced-repetition practice session with the cards due today.")
    static var openAppWhenRun: Bool = true

    @Dependency private var model: AppModel
    @Dependency private var route: AppRoute

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let stats = srsStats(cards: model.course.allVocab,
                             store: model.srsStore,
                             now: Date().timeIntervalSince1970 * 1000)
        // Still open the Flashcards tab when there's nothing due — the user
        // asked for it, and the screen explains the "all caught up" state
        // better than a dead-end dialog would.
        if IntentLogic.hasPracticeWork(stats) {
            route.startPractice()
        } else {
            route.tab = .flashcards
        }
        return .result(dialog: dialog(IntentLogic.practiceSummary(stats)))
    }
}

// ── Mark a week done (no app launch) ─────────────────────────────────────────

@available(iOS 16.0, *)
struct MarkWeekDoneIntent: AppIntent {
    static var title: LocalizedStringResource = "Mark a Week Done"
    static var description = IntentDescription(
        "Ticks a week off your progress tracker.")

    @Parameter(title: "Week")
    var week: WeekEntity?

    @Dependency private var model: AppModel

    static var parameterSummary: some ParameterSummary {
        Summary("Mark \(\.$week) as done")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let resolution = IntentLogic.resolveWeek(
            requested: week?.id,
            currentWeekN: model.currentWeekN,
            totalWeeks: model.course.totalWeeks)

        guard case let .resolved(n) = resolution else {
            return .result(dialog: dialog(
                IntentLogic.weekFailureDialog(resolution) ?? "Couldn't mark that week."))
        }
        // toggleWeek flips; only call it when the week isn't already done, so
        // saying it twice never silently un-ticks the week.
        if !model.isWeekDone(n) { model.toggleWeek(n) }
        return .result(dialog: dialog(
            "Week \(n) done. " +
            IntentLogic.progressSummary(weeksDone: model.weeksDone,
                                        totalWeeks: model.course.totalWeeks)))
    }
}

// ── Log today's reading (no app launch) ──────────────────────────────────────

@available(iOS 16.0, *)
struct LogReadingIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Today's Reading"
    static var description = IntentDescription(
        "Ticks the reading box on today's checklist and keeps your streak alive.")

    @Dependency private var model: AppModel

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        model.recordActivity(.read)
        return .result(dialog: dialog(
            IntentLogic.streakSummary(streakCount: model.streakCount)))
    }
}

// ── Open the journal ─────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct OpenJournalIntent: AppIntent {
    static var title: LocalizedStringResource = "Open My Italian Journal"
    static var description = IntentDescription(
        "Opens your weekly Italian writing journal.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Week")
    var week: WeekEntity?

    @Dependency private var model: AppModel
    @Dependency private var route: AppRoute

    static var parameterSummary: some ParameterSummary {
        Summary("Open the journal for \(\.$week)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Unlike the other week-taking intents, "open my journal" with no week
        // is a perfectly good request for the journal *list* — so a missing
        // current week is not a failure here.
        let resolution = IntentLogic.resolveWeek(
            requested: week?.id,
            currentWeekN: model.currentWeekN,
            totalWeeks: model.course.totalWeeks)

        if case .outOfRange = resolution {
            return .result(dialog: dialog(
                IntentLogic.weekFailureDialog(resolution) ?? "No such week."))
        }
        if case let .resolved(n) = resolution {
            route.openJournal(week: n)
            return .result(dialog: dialog("Week \(n) journal."))
        }
        route.openJournal(week: nil)
        return .result(dialog: dialog("Here's your journal."))
    }
}

// ── Look up a word ───────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct LookUpWordIntent: AppIntent {
    static var title: LocalizedStringResource = "Look Up an Italian Word"
    static var description = IntentDescription(
        "Gives the English meaning of a word from your course vocabulary.")

    @Parameter(title: "Word")
    var word: VocabEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Look up \(\.$word)")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
        let meaning = word.english
        let line = word.example.isEmpty
            ? "\(word.id) means \(meaning)."
            : "\(word.id) means \(meaning). For example: \(word.example)"
        return .result(value: meaning, dialog: dialog(line))
    }
}

// ── Start a new session ──────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct StartNewSessionIntent: AppIntent {
    static var title: LocalizedStringResource = "Start a New Session"
    static var description = IntentDescription(
        "Restarts the course calendar from a date you choose. Your progress, streak and review history are kept — clear those in Settings if you want a clean slate.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Start Date")
    var date: DateComponents?

    @Dependency private var model: AppModel
    @Dependency private var route: AppRoute

    static var parameterSummary: some ParameterSummary {
        Summary("Restart the course from \(\.$date)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let start = date.flatMap { Calendar.current.date(from: $0) } ?? Date()
        let formatted = start.formatted(date: .long, time: .omitted)

        // Deliberately never resets progress/streak/SRS/journal from voice —
        // that is a destructive choice and belongs to the Settings sheet, which
        // shows exactly which stores it will clear (see plan-new-session.md).
        let prompt = dialog(
            "Restart the \(model.course.schedule.weeks)-week course from \(formatted)? Your progress is kept.")
        try await requestConfirmation(dialog: prompt)

        model.startNewSession(from: start, reset: AppModel.ResetScope())
        route.tab = .tracker
        route.trackerPath = []
        return .result(dialog: dialog("Course restarted from \(formatted)."))
    }
}
