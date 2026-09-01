import XCTest
@testable import BibbiaCore

final class PrayerClozeTests: XCTestCase {

    private func line(_ it: String, _ en: String = "", blank: String? = nil) -> PrayerLine {
        PrayerLine(it: it, en: en, blank: blank)
    }

    // ── word splitting ───────────────────────────────────────────────────────

    func testKeepsInternalApostropheAsOneWord() {
        XCTAssertEqual(PrayerCloze.words(in: "nell'ora della morte"),
                       ["nell'ora", "della", "morte"])
    }

    func testHandlesTypographicApostrophe() {
        XCTAssertEqual(PrayerCloze.words(in: "dell\u{2019}anima"), ["dell\u{2019}anima"])
    }

    func testKeepsAccentedLetters() {
        XCTAssertEqual(PrayerCloze.words(in: "così sia"), ["così", "sia"])
    }

    func testDropsPunctuationAndTrailingApostrophes() {
        XCTAssertEqual(PrayerCloze.words(in: "Amen."), ["Amen"])
        XCTAssertEqual(PrayerCloze.words(in: "po' di pane"), ["po", "di", "pane"])
    }

    // ── blank selection ──────────────────────────────────────────────────────

    // The authored blank is chosen for grammatical payload, so it must beat the
    // longest-word heuristic even when it is a short word.
    func testAuthoredBlankWinsOverLongestWord() {
        let l = line("Sia santificato il tuo nome", blank: "Sia")
        XCTAssertEqual(PrayerCloze.blank(for: l), "Sia")
    }

    func testFallsBackToLongestWord() {
        let l = line("Sia santificato il tuo nome")
        XCTAssertEqual(PrayerCloze.blank(for: l), "santificato")
    }

    // ── splitting into a card ────────────────────────────────────────────────

    func testSplitsAroundTheBlank() {
        let l = line("Venga il tuo regno", blank: "Venga")
        let s = PrayerCloze.split(l)
        XCTAssertEqual(s?.before, "")
        XCTAssertEqual(s?.answer, "Venga")
        XCTAssertEqual(s?.after, " il tuo regno")
    }

    func testSplitPreservesOriginalCasing() {
        // Matching is case-insensitive, but the answer returned is the text as
        // it appears in the line, not the authored blank's casing.
        let l = line("Venga il tuo regno", blank: "venga")
        XCTAssertEqual(PrayerCloze.split(l)?.answer, "Venga")
    }

    // A one-word line has no context left once blanked — not a fair card.
    func testRefusesAOneWordLine() {
        XCTAssertNil(PrayerCloze.split(line("Amen.")))
    }

    func testReturnsNilWhenTheBlankIsNotInTheLine() {
        XCTAssertNil(PrayerCloze.split(line("Venga il tuo regno", blank: "assente")))
    }

    func testRoundTripsBeforeAnswerAfterBackToTheLine() {
        let l = line("Sia fatta la tua volontà", blank: "fatta")
        let s = PrayerCloze.split(l)!
        XCTAssertEqual(s.before + s.answer + s.after, l.it)
    }

    // ── grading ──────────────────────────────────────────────────────────────

    func testGradingAcceptsExactAndForgivesAccentSlips() {
        let articles = ["il", "la", "lo", "i", "le", "gli", "l'", "un", "una"]
        let l = line("Sia fatta la tua volontà", blank: "volontà")
        XCTAssertTrue(PrayerCloze.isCorrect("volontà", for: l, articles: articles))
        XCTAssertFalse(PrayerCloze.isCorrect("regno", for: l, articles: articles))
    }

    // ── the real course data ─────────────────────────────────────────────────

    // Guards the authored dataset: every line that Recall will offer must make
    // a usable card, and its answer must grade itself correct.
    func testEveryAuthoredPrayerLineMakesAGradeableCard() throws {
        let course = try Course.load()
        let articles = course.locale.articles
        var cards = 0
        for section in course.devotionSections {
            for prayer in section.prayers {
                for l in prayer.lines ?? [] {
                    guard let s = PrayerCloze.split(l) else { continue }
                    cards += 1
                    XCTAssertFalse(s.answer.isEmpty, "empty answer in \(prayer.id): \(l.it)")
                    XCTAssertEqual(s.before + s.answer + s.after, l.it,
                                   "split lost text in \(prayer.id): \(l.it)")
                    XCTAssertTrue(PrayerCloze.isCorrect(s.answer, for: l, articles: articles),
                                  "\(prayer.id) line does not grade itself: \(l.it)")
                }
            }
        }
        XCTAssertGreaterThan(cards, 30, "expected the authored prayers to yield real cards")
    }

    func testCourseCarriesTheDevotions() throws {
        let course = try Course.load()
        XCTAssertEqual(course.devotionSections.count, 3)
        XCTAssertEqual(course.devotionSections.reduce(0) { $0 + $1.prayers.count }, 13)
    }
}
