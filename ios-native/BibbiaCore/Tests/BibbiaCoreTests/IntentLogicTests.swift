import XCTest
@testable import BibbiaCore

// Covers the decision logic behind the App Intents (plan-siri.md I1/I2).
// Siri itself is untestable in CI; everything it *decides* is tested here.

final class IntentLogicTests: XCTestCase {
    let course = Course.shared

    // ── resolveWeek ──────────────────────────────────────────────────────────

    func testExplicitWeekResolvesWhenInRange() {
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: 12, currentWeekN: 3, totalWeeks: 37),
            .resolved(12))
    }

    func testExplicitWeekWinsOverTheCurrentWeek() {
        // "Open week 5" must open week 5 even mid-week-3.
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: 5, currentWeekN: 3, totalWeeks: 37),
            .resolved(5))
    }

    func testMissingWeekFallsBackToTheCurrentWeek() {
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: nil, currentWeekN: 3, totalWeeks: 37),
            .resolved(3))
    }

    func testWeekZeroAndNegativesAreOutOfRange() {
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: 0, currentWeekN: 3, totalWeeks: 37),
            .outOfRange(requested: 0, totalWeeks: 37))
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: -2, currentWeekN: 3, totalWeeks: 37),
            .outOfRange(requested: -2, totalWeeks: 37))
    }

    func testWeekPastTheEndIsOutOfRange() {
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: 38, currentWeekN: 3, totalWeeks: 37),
            .outOfRange(requested: 38, totalWeeks: 37))
    }

    func testFinalWeekIsInRange() {
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: 37, currentWeekN: nil, totalWeeks: 37),
            .resolved(37))
    }

    func testNoCurrentWeekWhenProgramIsNotRunning() {
        // Before day 1 or after the last week, currentWeekN is nil.
        XCTAssertEqual(
            IntentLogic.resolveWeek(requested: nil, currentWeekN: nil, totalWeeks: 37),
            .noCurrentWeek)
    }

    func testOnlyFailingResolutionsProduceDialog() {
        XCTAssertNil(IntentLogic.weekFailureDialog(.resolved(4)))
        XCTAssertNotNil(IntentLogic.weekFailureDialog(.noCurrentWeek))
        XCTAssertNotNil(
            IntentLogic.weekFailureDialog(.outOfRange(requested: 99, totalWeeks: 37)))
    }

    func testOutOfRangeDialogNamesBothNumbers() {
        let dialog = IntentLogic.weekFailureDialog(
            .outOfRange(requested: 99, totalWeeks: 37)) ?? ""
        XCTAssertTrue(dialog.contains("99"))
        XCTAssertTrue(dialog.contains("37"))
    }

    // ── practice ─────────────────────────────────────────────────────────────

    func testHasPracticeWork() {
        XCTAssertFalse(IntentLogic.hasPracticeWork(
            SRSStats(due: 0, new: 0, learned: 10, total: 10)))
        XCTAssertTrue(IntentLogic.hasPracticeWork(
            SRSStats(due: 1, new: 0, learned: 10, total: 10)))
        XCTAssertTrue(IntentLogic.hasPracticeWork(
            SRSStats(due: 0, new: 1, learned: 10, total: 10)))
    }

    func testPracticeSummaryCaughtUp() {
        let s = IntentLogic.practiceSummary(SRSStats(due: 0, new: 0, learned: 5, total: 5))
        XCTAssertTrue(s.lowercased().contains("caught up"))
    }

    func testPracticeSummarySingularDueIsNotPluralised() {
        let s = IntentLogic.practiceSummary(SRSStats(due: 1, new: 0, learned: 5, total: 5))
        XCTAssertTrue(s.contains("1 card due"))
        XCTAssertFalse(s.contains("cards"))
    }

    func testPracticeSummaryPluralisesDue() {
        let s = IntentLogic.practiceSummary(SRSStats(due: 4, new: 0, learned: 5, total: 5))
        XCTAssertTrue(s.contains("4 cards due"))
    }

    func testPracticeSummaryMentionsBothCounts() {
        let s = IntentLogic.practiceSummary(SRSStats(due: 3, new: 2, learned: 5, total: 10))
        XCTAssertTrue(s.contains("3"))
        XCTAssertTrue(s.contains("2"))
    }

    // ── progress / streak ────────────────────────────────────────────────────

    func testProgressSummaryCountsRemaining() {
        let s = IntentLogic.progressSummary(weeksDone: 10, totalWeeks: 37)
        XCTAssertTrue(s.contains("10 of 37"))
        XCTAssertTrue(s.contains("27"))
    }

    func testProgressSummaryCelebratesCompletion() {
        let s = IntentLogic.progressSummary(weeksDone: 37, totalWeeks: 37)
        XCTAssertTrue(s.contains("37"))
        XCTAssertFalse(s.contains("to go"))
    }

    func testProgressSummaryHandlesEmptyCourse() {
        // Never divide-by-zero or claim "0 of 0 weeks done".
        XCTAssertEqual(IntentLogic.progressSummary(weeksDone: 0, totalWeeks: 0),
                       "Marked done.")
    }

    func testStreakSummaryWordsDayOneSpecially() {
        XCTAssertTrue(IntentLogic.streakSummary(streakCount: 1).contains("day one"))
        XCTAssertTrue(IntentLogic.streakSummary(streakCount: 9).contains("9-day"))
        XCTAssertFalse(IntentLogic.streakSummary(streakCount: 0).contains("streak"))
    }

    // ── entity display ───────────────────────────────────────────────────────

    func testWeekSubtitleJoinsReadingAndTopic() {
        guard let week = course.week(1) else { return XCTFail("week 1 missing") }
        let s = IntentLogic.weekSubtitle(week)
        XCTAssertTrue(s.contains(week.r))
        XCTAssertTrue(s.contains(week.b))
    }

    func testEveryWeekProducesANonEmptySubtitle() {
        for week in course.allWeeks {
            XCTAssertFalse(IntentLogic.weekSubtitle(week).isEmpty,
                           "week \(week.n) has an empty Siri subtitle")
        }
    }

    // ── vocab search ─────────────────────────────────────────────────────────

    private var articles: [String] { course.locale.articles }

    func testEmptyQueryReturnsAPrefixRatherThanNothing() {
        // Shortcuts shows an unfiltered picker before the user types.
        let out = IntentLogic.searchVocab(course.allVocab, matching: "  ",
                                          articles: articles, limit: 5)
        XCTAssertEqual(out.count, 5)
    }

    func testSearchIsAccentInsensitive() {
        guard let accented = course.allVocab.first(where: {
            $0.it != normalizeText($0.it)
        }) else { return }  // course has no accented headword — nothing to assert
        let folded = normalizeText(accented.it)
        let out = IntentLogic.searchVocab(course.allVocab, matching: folded,
                                          articles: articles)
        XCTAssertTrue(out.contains { $0.it == accented.it },
                      "\(accented.it) should be findable as \(folded)")
    }

    func testSearchIsCaseInsensitive() {
        guard let card = course.allVocab.first else { return XCTFail("no vocab") }
        let out = IntentLogic.searchVocab(course.allVocab,
                                          matching: card.it.uppercased(),
                                          articles: articles)
        XCTAssertEqual(out.first?.it, card.it)
    }

    func testExactMatchOutranksSubstringMatch() {
        // A card whose term is a substring of a longer term must still win when
        // the query names it exactly.
        let cards = [
            VocabCard(it: "verbo divino", en: "divine word", ex: ""),
            VocabCard(it: "verbo", en: "word", ex: ""),
        ]
        let out = IntentLogic.searchVocab(cards, matching: "verbo")
        XCTAssertEqual(out.first?.it, "verbo")
    }

    func testItalianOutranksEnglishAtTheSameMatchLevel() {
        let cards = [
            VocabCard(it: "parola", en: "luce", ex: ""),   // English happens to be "luce"
            VocabCard(it: "luce", en: "light", ex: ""),
        ]
        let out = IntentLogic.searchVocab(cards, matching: "luce")
        XCTAssertEqual(out.first?.it, "luce")
    }

    func testArticleStrippedTermOutranksAMerePrefixMatch() {
        // Discriminating: "il Verbo" only beats "verbosita" for query "verbo"
        // if the article is genuinely stripped (bare exact, rank 0) rather than
        // merely contained (rank 4). Uses the course's real article format —
        // note the list has NO trailing spaces; passing "il " instead silently
        // strips nothing, which is exactly the bug this shape catches.
        let cards = [
            VocabCard(it: "verbosita", en: "wordiness", ex: ""),
            VocabCard(it: "il Verbo", en: "the Word", ex: ""),
        ]
        let out = IntentLogic.searchVocab(cards, matching: "verbo", articles: articles)
        XCTAssertEqual(out.map(\.it), ["il Verbo", "verbosita"])
    }

    func testEveryArticledCourseTermIsTopRankedByItsBareStem() {
        // 199 of the 259 reference-course terms carry a leading article, so
        // "luce" must find "la luce" — this is the main way a spoken query
        // reaches a card.
        let articled = course.allVocab.filter {
            Articles.leadingMatchLength($0.it, articles: articles) > 0
        }
        XCTAssertFalse(articled.isEmpty, "course has no articled terms to check")
        for card in articled {
            let bare = Articles.stripLeading(card.it, articles: articles)
                .trimmingCharacters(in: .whitespaces)
            let out = IntentLogic.searchVocab(course.allVocab, matching: bare,
                                              articles: articles, limit: 5)
            XCTAssertEqual(out.first?.it, card.it,
                           "bare stem '\(bare)' should rank \(card.it) first")
        }
    }

    func testSearchMatchesTheEnglishSide() {
        let cards = [VocabCard(it: "luce", en: "light", ex: "")]
        let out = IntentLogic.searchVocab(cards, matching: "light")
        XCTAssertEqual(out.first?.it, "luce")
    }

    func testSearchRespectsTheLimit() {
        let out = IntentLogic.searchVocab(course.allVocab, matching: "a",
                                          articles: articles, limit: 3)
        XCTAssertLessThanOrEqual(out.count, 3)
    }

    func testNoMatchReturnsEmpty() {
        let out = IntentLogic.searchVocab(course.allVocab,
                                          matching: "zzzzqqqqxxxx",
                                          articles: articles)
        XCTAssertTrue(out.isEmpty)
    }

    func testSearchIsStableAcrossIdenticalQueries() {
        let a = IntentLogic.searchVocab(course.allVocab, matching: "e",
                                        articles: articles, limit: 10)
        let b = IntentLogic.searchVocab(course.allVocab, matching: "e",
                                        articles: articles, limit: 10)
        XCTAssertEqual(a.map(\.it), b.map(\.it))
    }

    func testEveryCourseTermFindsItselfExactly() {
        // The entity query must be able to resolve any card Siri names back.
        for card in course.allVocab {
            let out = IntentLogic.searchVocab(course.allVocab, matching: card.it,
                                              articles: articles, limit: 5)
            XCTAssertTrue(out.contains { $0.it == card.it },
                          "\(card.it) is not findable by its own term")
        }
    }
}
