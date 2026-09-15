import XCTest
@testable import BibbiaCore

// The reader's English view state. The web twin's tests live in
// src/components/ReadingPassage.test.jsx; these cover the same decisions on the
// side that matters here — the cycle, and the storage shape the two clients
// share through the backup file.

final class ReadingViewTests: XCTestCase {

    func testEnglishCyclesOffUnderOnlyAndBack() {
        var state = ReadingViewState()
        XCTAssertEqual(state.english, .off)
        state.cycleEnglish()
        XCTAssertEqual(state.english, .under)
        state.cycleEnglish()
        XCTAssertEqual(state.english, .only)
        state.cycleEnglish()
        XCTAssertEqual(state.english, .off)
    }

    func testDecodesTheWebsThreeStateShape() {
        XCTAssertEqual(ReadingViewState.decode("{\"english\":\"only\",\"skeleton\":true\u{7D}"),
                       ReadingViewState(english: .only, skeleton: true))
        XCTAssertEqual(ReadingViewState.decode("{\"english\":\"under\",\"skeleton\":false\u{7D}"),
                       ReadingViewState(english: .under, skeleton: false))
    }

    // A saved `true` came from the old two-state toggle, where "on" meant the
    // English sat under each verse.
    func testMigratesTheOldBooleanPreference() {
        XCTAssertEqual(ReadingViewState.decode("{\"english\":true\u{7D}").english, .under)
        XCTAssertEqual(ReadingViewState.decode("{\"english\":false\u{7D}").english, .off)
    }

    func testFallsBackToTheDefaultRatherThanFailing() {
        XCTAssertEqual(ReadingViewState.decode(nil), ReadingViewState())
        XCTAssertEqual(ReadingViewState.decode(""), ReadingViewState())
        XCTAssertEqual(ReadingViewState.decode("not json"), ReadingViewState())
        XCTAssertEqual(ReadingViewState.decode("{\u{7D}"), ReadingViewState())
        XCTAssertEqual(ReadingViewState.decode("{\"english\":\"sideways\"\u{7D}"), ReadingViewState())
    }

    // iOS has no clause-skeleton view, so it must not answer for it: a round
    // trip through this app leaves the web device's setting alone.
    func testPreservesTheWebOnlySkeletonFlag() {
        var state = ReadingViewState.decode("{\"english\":\"off\",\"skeleton\":true\u{7D}")
        state.cycleEnglish()
        XCTAssertEqual(state.encoded(), "{\"english\":\"under\",\"skeleton\":true\u{7D}")
    }

    func testEncodeDecodeRoundTrips() {
        for mode in ReadingEnglishMode.allCases {
            for skeleton in [true, false] {
                let state = ReadingViewState(english: mode, skeleton: skeleton)
                XCTAssertEqual(ReadingViewState.decode(state.encoded()), state)
            }
        }
    }

    func testPassageHasEnglishTracksTheAuthoredLines() {
        let withEn = Passage(ref: "Gv 1,1", translation: "CEI 2008",
                             verses: [Verse(n: 1, t: "In principio era il Verbo.",
                                            en: "In the beginning was the Word.")])
        let without = Passage(ref: "Gv 1,1", translation: "CEI 2008",
                              verses: [Verse(n: 1, t: "In principio era il Verbo.", en: nil)])
        let empty = Passage(ref: "Gv 1,1", translation: "CEI 2008",
                            verses: [Verse(n: 1, t: "In principio era il Verbo.", en: "")])
        XCTAssertTrue(passageHasEnglish(withEn))
        XCTAssertFalse(passageHasEnglish(without))
        XCTAssertFalse(passageHasEnglish(empty))
    }

    // The point of the whole change: the bundled course must actually carry the
    // English, or every control above is dead UI.
    func testTheBundledCourseShipsEnglishForEveryPassageVerse() {
        var verses = 0
        for week in Course.shared.allWeeks {
            guard let passage = week.passage else { continue }
            XCTAssertTrue(passageHasEnglish(passage), "week \(week.n) passage has no English")
            for verse in passage.verses {
                verses += 1
                XCTAssertFalse((verse.en ?? "").isEmpty,
                               "week \(week.n) verse \(verse.n) has no English")
            }
        }
        XCTAssertEqual(verses, 200, "the course's authored verse count changed")
    }
}
