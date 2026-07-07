import XCTest
@testable import BibbiaCore

final class AchievementsTests: XCTestCase {
    let course = Course.shared

    func ctx(progress: [Int: Bool] = [:], learned: Int = 0, streak: Int = 0,
             journaled: Int = 0) -> AchievementContext {
        AchievementContext(progress: progress, learnedCount: learned,
                           streakBest: streak, journaledWeeks: journaled)
    }

    func compute(_ c: AchievementContext) -> [Achievement] {
        computeAchievements(c, phases: course.phases, totalWeeks: course.totalWeeks)
    }

    func earned(_ list: [Achievement], _ id: String) -> Bool {
        list.first { $0.id == id }!.earned
    }

    func testNothingEarnedOnAFreshStore() {
        let list = compute(ctx())
        XCTAssertEqual(earnedCount(list), 0)
        XCTAssertEqual(list.count, 2 + course.phases.count + 6)
    }

    func testWeekMilestones() {
        XCTAssertTrue(earned(compute(ctx(progress: [1: true])), "first"))
        let five = Dictionary(uniqueKeysWithValues: (1...5).map { ($0, true) })
        XCTAssertTrue(earned(compute(ctx(progress: five)), "five"))
        XCTAssertFalse(earned(compute(ctx(progress: five)), "all"))
        let all = Dictionary(uniqueKeysWithValues: (1...37).map { ($0, true) })
        XCTAssertTrue(earned(compute(ctx(progress: all)), "all"))
    }

    func testPhaseBadgeNeedsEveryWeekOfThePhase() {
        let p1weeks = course.phases[0].weeks.map(\.n)
        var progress = Dictionary(uniqueKeysWithValues: p1weeks.map { ($0, true) })
        XCTAssertTrue(earned(compute(ctx(progress: progress)), "phase-p1"))
        progress[p1weeks.last!] = false
        XCTAssertFalse(earned(compute(ctx(progress: progress)), "phase-p1"))
    }

    func testStreakLearnAndWriterBadges() {
        XCTAssertTrue(earned(compute(ctx(streak: 7)), "streak7"))
        XCTAssertFalse(earned(compute(ctx(streak: 6)), "streak30"))
        XCTAssertTrue(earned(compute(ctx(streak: 30)), "streak30"))
        XCTAssertTrue(earned(compute(ctx(learned: 50)), "learn50"))
        XCTAssertTrue(earned(compute(ctx(learned: 150)), "learn150"))
        XCTAssertTrue(earned(compute(ctx(journaled: 10)), "writer"))
    }
}

final class WordStatsTests: XCTestCase {
    func card(_ it: String) -> VocabCard { VocabCard(it: it, en: "x", ex: "y") }

    func testUntouchedCardsAreOmitted() {
        let list = struggleList(cards: [card("a"), card("b")])
        XCTAssertTrue(list.isEmpty)
    }

    func testLapsesAndWeakPronunciationRankAndExplain() {
        let cards = [card("lapsy"), card("mumbly"), card("fine")]
        let srs: SRSStore = ["lapsy": SRSCard(ease: 2.5, lapses: 2),
                             "fine": SRSCard(ease: 2.5)]
        let pronun: PronunStore = ["mumbly": PronunStat(attempts: 3, avg: 40)]
        let list = struggleList(cards: cards, srsStore: srs, pronunStore: pronun)
        XCTAssertEqual(list.count, 2)
        XCTAssertEqual(list[0].card.it, "lapsy", "2 lapses (score 2) outranks weak pronun (score 1)")
        XCTAssertEqual(list[0].reasons, ["2 misses in review"])
        XCTAssertEqual(list[1].reasons, ["pronunciation 40%"])
    }

    func testLowEaseAloneReadsAsShakyRecall() {
        let srs: SRSStore = ["shaky": SRSCard(ease: 1.8)]
        let list = struggleList(cards: [card("shaky")], srsStore: srs)
        XCTAssertEqual(list[0].reasons, ["shaky recall"])
    }

    func testLimitCapsTheList() {
        let cards = (1...20).map { card("w\($0)") }
        let srs = Dictionary(uniqueKeysWithValues: cards.map {
            ($0.it, SRSCard(ease: 2.5, lapses: 1))
        })
        XCTAssertEqual(struggleList(cards: cards, srsStore: srs, limit: 12).count, 12)
    }

    func testPronunStatRecordingMatchesWebAveraging() {
        var stat = PronunStat()
        stat = stat.recording(score: 80, now: 1000)
        stat = stat.recording(score: 61, now: 2000)
        XCTAssertEqual(stat.attempts, 2)
        XCTAssertEqual(stat.best, 80)
        XCTAssertEqual(stat.last, 61)
        XCTAssertEqual(stat.avg, 71, "Math.round((80+61)/2) = 71")
    }
}

final class DrillsTests: XCTestCase {
    func testSplitBlank() {
        XCTAssertEqual(splitBlank("In principio ___ il Verbo."),
                       BlankSplit(before: "In principio ", after: " il Verbo."))
        XCTAssertEqual(splitBlank("___ creduto in lui."),
                       BlankSplit(before: "", after: " creduto in lui."))
        XCTAssertEqual(splitBlank("no blank here"),
                       BlankSplit(before: "no blank here", after: ""))
        XCTAssertEqual(splitBlank("single _ underscore"),
                       BlankSplit(before: "single _ underscore", after: ""))
    }

    func testComprehensionValidityAndCorrectness() {
        let tf = ComprehensionItem(type: "tf", it: "Vero?", answerBool: true)
        XCTAssertTrue(isValidComprehensionItem(tf))
        XCTAssertTrue(isComprehensionCorrect(tf, response: .bool(true)))
        XCTAssertFalse(isComprehensionCorrect(tf, response: .bool(false)))
        XCTAssertFalse(isComprehensionCorrect(tf, response: .index(0)), "type mismatch")

        let mc = ComprehensionItem(type: "mc", it: "Quale?", options: ["a", "b", "c"], answerIndex: 1)
        XCTAssertTrue(isComprehensionCorrect(mc, response: .index(1)))
        XCTAssertFalse(isComprehensionCorrect(mc, response: .index(0)))

        XCTAssertFalse(isValidComprehensionItem(
            ComprehensionItem(type: "tf", it: "  ")), "blank question")
        XCTAssertFalse(isValidComprehensionItem(
            ComprehensionItem(type: "mc", it: "Q", options: ["only"], answerIndex: 0)))
        XCTAssertFalse(isValidComprehensionItem(
            ComprehensionItem(type: "mc", it: "Q", options: ["a", "b"], answerIndex: 5)))
    }

    func testDrillItemsDropsBlankAnswers() {
        let week = Course.shared.week(1)!
        XCTAssertFalse(drillItems(week).isEmpty)
        for d in drillItems(week) {
            XCTAssertFalse(d.a.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }
}

final class VocabIndexTests: XCTestCase {
    let index = VocabIndex(course: Course.shared)

    func testLookupByFullTermAndBareStem() {
        XCTAssertEqual(index.lookup("il Verbo")?.en, "the Word")
        XCTAssertEqual(index.lookup("verbo")?.en, "the Word")
        XCTAssertEqual(index.lookup("luce")?.en, "the light")
        XCTAssertEqual(index.lookup("LUCE")?.en, "the light", "case-insensitive")
    }

    func testLookupStripsArticleFromTheQueryToo() {
        XCTAssertEqual(index.lookup("la vita")?.en, "life")
        XCTAssertEqual(index.lookup("l'alleluja")?.en, "alleluia")
        XCTAssertEqual(index.lookup("alleluja")?.en, "alleluia")
    }

    func testUnknownWordIsNil() {
        XCTAssertNil(index.lookup("pizza"))
        XCTAssertNil(index.lookup(""))
    }

    func testTokenizePreservesTextExactly() {
        let samples = [
            "In principio era il Verbo, il Verbo era presso Dio.",
            "l'unzione — dov'è? «Ecco!»",
            "  spaces   and\tpunctuation!  ",
            "perché città più",
        ]
        for text in samples {
            let tokens = tokenize(text)
            XCTAssertEqual(tokens.map(\.text).joined(), text, "reconstruction of '\(text)'")
        }
    }

    func testTokenizeKeepsInternalApostrophesInOneWord() {
        let words = tokenize("l'unzione e dov'è").filter(\.isWord).map(\.text)
        XCTAssertEqual(words, ["l'unzione", "e", "dov'è"])
    }

    func testEveryPassageWordTokenizes() {
        for week in Course.shared.allWeeks {
            for verse in week.passage?.verses ?? [] {
                let tokens = tokenize(verse.t)
                XCTAssertEqual(tokens.map(\.text).joined(), verse.t,
                               "week \(week.n) verse \(verse.n)")
                XCTAssertTrue(tokens.contains { $0.isWord })
            }
        }
    }
}
