import XCTest
@testable import BibbiaCore

// Behavioral tests mirroring answer.test.js / cloze.test.js — semantic cases
// beyond the fixture sweep.

private let articles = Course.shared.locale.articles

final class AnswerTests: XCTestCase {
    func testExactMatch() {
        XCTAssertTrue(checkAnswer(expected: "credere", given: "credere", articles: articles))
    }

    func testAccentAndCaseAndPunctuationFolding() {
        XCTAssertTrue(checkAnswer(expected: "perché", given: "Perche!", articles: articles))
        XCTAssertTrue(checkAnswer(expected: "la luce", given: "La Luce!", articles: articles))
    }

    func testLeadingArticleIsIgnoredBothWays() {
        XCTAssertTrue(checkAnswer(expected: "la luce", given: "luce", articles: articles))
        XCTAssertTrue(checkAnswer(expected: "luce", given: "la luce", articles: articles))
        XCTAssertTrue(checkAnswer(expected: "l'alleluja", given: "alleluja", articles: articles))
    }

    func testSmallTyposAreTolerated() {
        XCTAssertTrue(checkAnswer(expected: "credere", given: "credre", articles: articles))
    }

    func testWrongWordAndEmptyAreRejected() {
        XCTAssertFalse(checkAnswer(expected: "credere", given: "amare", articles: articles))
        XCTAssertFalse(checkAnswer(expected: "credere", given: "", articles: articles))
        XCTAssertFalse(checkAnswer(expected: "credere", given: "   ", articles: articles))
    }

    func testCanonicalStripsArticleAccentsAndPunctuation() {
        XCTAssertEqual(canonicalAnswer("La Luce!", articles: articles), "luce")
        XCTAssertEqual(canonicalAnswer("l'alleluja", articles: articles), "alleluja")
        XCTAssertEqual(canonicalAnswer("  perché  ", articles: articles), "perche")
    }
}

final class ClozeTests: XCTestCase {
    func testBlanksTheBareContentWordKeepingTheArticle() {
        let c = makeCloze(term: "la luce", example: "La luce splende", articles: articles)
        XCTAssertEqual(c, ClozeResult(before: "La ", answer: "luce", after: " splende"))
    }

    func testFallsBackToFullTermWhenStemMissing() {
        let c = makeCloze(term: "il Verbo", example: "In principio era il Verbo", articles: articles)
        XCTAssertEqual(c?.answer, "Verbo")
    }

    func testCaseInsensitiveMatchPreservesOriginalCasing() {
        let c = makeCloze(term: "credere", example: "CREDERE è vivere", articles: articles)
        XCTAssertEqual(c?.answer, "CREDERE")
        XCTAssertEqual(c?.before, "")
        XCTAssertEqual(c?.after, " è vivere")
    }

    func testIneligibleWhenTermNotInExample() {
        XCTAssertNil(makeCloze(term: "credere", example: "ha creduto in lui", articles: articles))
        XCTAssertNil(makeCloze(term: "", example: "frase", articles: articles))
        XCTAssertNil(makeCloze(term: "parola", example: "", articles: articles))
    }

    func testEligibilityRateOnTheRealCourseIsAboutSixtyPercent() {
        let cards = Course.shared.allVocab
        let eligible = cards.filter { isClozeEligible(card: $0, articles: articles) }.count
        // 159/259 on the reference course (the fixture sweep pins exact results).
        XCTAssertEqual(eligible, 159)
    }
}

final class ArticlesTests: XCTestCase {
    func testPlainArticleNeedsTrailingSpace() {
        XCTAssertEqual(Articles.stripLeading("la luce", articles: articles), "luce")
        XCTAssertEqual(Articles.stripLeading("lago", articles: articles), "lago",
                       "'la' must not match inside a word")
    }

    func testElidedArticleMatchesWithoutSpace() {
        XCTAssertEqual(Articles.stripLeading("l'alleluja", articles: articles), "alleluja")
        XCTAssertEqual(Articles.stripLeading("un'anima", articles: articles), "anima")
        XCTAssertEqual(Articles.stripLeading("l’unzione", articles: articles), "unzione",
                       "curly apostrophe form")
    }

    func testLongestArticleWinsAndCaseInsensitive() {
        XCTAssertEqual(Articles.stripLeading("gli strumenti", articles: articles), "strumenti")
        XCTAssertEqual(Articles.stripLeading("La Luce", articles: articles), "Luce")
        XCTAssertEqual(Articles.stripLeading("i cieli", articles: articles), "cieli")
    }

    func testNoMatchLeavesStringAlone() {
        XCTAssertEqual(Articles.stripLeading("credere", articles: articles), "credere")
        XCTAssertEqual(Articles.stripLeading("credere", articles: []), "credere")
    }
}
