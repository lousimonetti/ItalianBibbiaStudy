import Foundation

// Decision logic behind the App Intents (see ../../../plan-siri.md, I1/I2).
//
// The intent *types* live in the app target because they need AppModel and the
// AppIntents framework; everything they have to decide lives here, so it is
// plain Foundation Swift that `swift test` covers on any machine. That split is
// deliberate: CI can run these tests, but it cannot run Siri.

public enum IntentLogic {

    // ── Week resolution ──────────────────────────────────────────────────────

    /// What a (possibly absent) week number resolves to.
    ///
    /// `nil` means the user said "this week" / "my week" and we fall back to the
    /// schedule. That fallback can legitimately fail — before day 1 or after the
    /// final week there *is* no current week — which is `.noCurrentWeek`, not an
    /// error state to apologise for.
    public enum WeekResolution: Equatable {
        case resolved(Int)
        case outOfRange(requested: Int, totalWeeks: Int)
        case noCurrentWeek
    }

    /// Resolve an intent's optional week parameter against the course.
    public static func resolveWeek(requested: Int?, currentWeekN: Int?,
                                   totalWeeks: Int) -> WeekResolution {
        if let n = requested {
            guard n >= 1, n <= totalWeeks else {
                return .outOfRange(requested: n, totalWeeks: totalWeeks)
            }
            return .resolved(n)
        }
        guard let current = currentWeekN else { return .noCurrentWeek }
        return .resolved(current)
    }

    /// Spoken/typed sentence for a resolution that did not produce a week.
    /// Returns nil for `.resolved` — the caller has a week and needs no excuse.
    public static func weekFailureDialog(_ resolution: WeekResolution) -> String? {
        switch resolution {
        case .resolved:
            return nil
        case let .outOfRange(requested, totalWeeks):
            return "This course only has \(totalWeeks) weeks, so there's no week \(requested)."
        case .noCurrentWeek:
            return "Your course isn't running right now. Start a new session to pick up where you left off."
        }
    }

    // ── Practice ─────────────────────────────────────────────────────────────

    /// Whether there is anything worth opening a practice session for.
    public static func hasPracticeWork(_ stats: SRSStats) -> Bool {
        stats.due > 0 || stats.new > 0
    }

    /// One-sentence summary Siri reads back when starting practice.
    public static func practiceSummary(_ stats: SRSStats) -> String {
        switch (stats.due, stats.new) {
        case (0, 0):
            return "You're all caught up — nothing due today."
        case let (due, 0):
            return "\(due) card\(due == 1 ? "" : "s") due. Let's review."
        case let (0, new):
            return "No reviews due. Starting \(new == 1 ? "a new card" : "some new cards")."
        case let (due, new):
            return "\(due) card\(due == 1 ? "" : "s") due and \(new) new. Let's review."
        }
    }

    // ── Progress ─────────────────────────────────────────────────────────────

    /// Confirmation line after ticking a week off.
    public static func progressSummary(weeksDone: Int, totalWeeks: Int) -> String {
        guard totalWeeks > 0 else { return "Marked done." }
        if weeksDone >= totalWeeks {
            return "That's all \(totalWeeks) weeks complete. Complimenti!"
        }
        let left = totalWeeks - weeksDone
        return "\(weeksDone) of \(totalWeeks) weeks done — \(left) to go."
    }

    /// Confirmation line after logging a reading.
    public static func streakSummary(streakCount: Int) -> String {
        switch streakCount {
        case ..<1: return "Reading logged."
        case 1: return "Reading logged. That's day one of your streak."
        default: return "Reading logged. You're on a \(streakCount)-day streak."
        }
    }

    // ── Entity display ───────────────────────────────────────────────────────

    /// Subtitle shown under a week in Siri / Shortcuts pickers.
    public static func weekSubtitle(_ week: Week) -> String {
        let topic = week.b.trimmingCharacters(in: .whitespaces)
        let reading = week.r.trimmingCharacters(in: .whitespaces)
        if topic.isEmpty { return reading }
        if reading.isEmpty { return topic }
        return "\(reading) · \(topic)"
    }

    /// Subtitle shown under a vocab card in Siri / Shortcuts pickers.
    public static func vocabSubtitle(_ card: VocabCard) -> String { card.en }

    // ── Vocab search (backs the entity string query) ──────────────────────────

    /// Rank vocab cards against a free-text query from Siri or Shortcuts.
    ///
    /// Matching is accent- and case-insensitive (`normalizeText`) and ignores a
    /// leading article on the Italian side, so "il Verbo" is reachable as
    /// "verbo" — the same affordance `VocabIndex` gives tap-to-translate.
    /// Ranking is exact → prefix → substring, Italian before English at each
    /// level, so a query that exactly names a card never loses to a longer card
    /// that merely contains it.
    public static func searchVocab(_ cards: [VocabCard], matching query: String,
                                   articles: [String] = [], limit: Int = 20) -> [VocabCard] {
        let q = normalizeText(query)
        guard !q.isEmpty else { return Array(cards.prefix(limit)) }

        func rank(_ card: VocabCard) -> Int? {
            let it = normalizeText(card.it)
            let bare = normalizeText(
                Articles.stripLeading(card.it, articles: articles)
                    .trimmingCharacters(in: .whitespaces))
            let en = normalizeText(card.en)

            if it == q || bare == q { return 0 }
            if en == q { return 1 }
            if it.hasPrefix(q) || bare.hasPrefix(q) { return 2 }
            if en.hasPrefix(q) { return 3 }
            if it.contains(q) || bare.contains(q) { return 4 }
            if en.contains(q) { return 5 }
            return nil
        }

        return cards
            .enumerated()
            .compactMap { idx, card in rank(card).map { (rank: $0, idx: idx, card: card) } }
            // Stable: equal ranks keep course order, so results don't shuffle
            // between identical queries.
            .sorted { $0.rank != $1.rank ? $0.rank < $1.rank : $0.idx < $1.idx }
            .prefix(limit)
            .map(\.card)
    }
}
