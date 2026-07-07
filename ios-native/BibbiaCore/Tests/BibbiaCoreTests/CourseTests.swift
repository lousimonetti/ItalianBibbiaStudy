import XCTest
@testable import BibbiaCore

// Guards the bundled course.json — the same invariants course/validate.js
// enforces on the web side, so a bad regeneration fails fast.

final class CourseTests: XCTestCase {
    let course = Course.shared

    func testTotalsMatchTheReferenceCourse() {
        XCTAssertEqual(course.id, "it-bible-cei")
        XCTAssertEqual(course.phases.count, 4)
        XCTAssertEqual(course.totalWeeks, 37)
        XCTAssertEqual(course.schedule.weeks, 37)
        XCTAssertEqual(course.totalVocab, 259)
    }

    func testWeeksAreNumberedConsecutivelyFromOne() {
        let ns = course.allWeeks.map(\.n)
        XCTAssertEqual(ns, Array(1...course.totalWeeks))
    }

    func testEveryWeekHasCoreContent() {
        for week in course.allWeeks {
            XCTAssertFalse(week.vocab.isEmpty, "week \(week.n) has no vocab")
            XCTAssertFalse(week.grammar.title.isEmpty, "week \(week.n) grammar title")
            XCTAssertFalse(week.prompt.it.isEmpty, "week \(week.n) prompt")
            XCTAssertFalse(week.d.isEmpty, "week \(week.n) date range")
            XCTAssertFalse(week.r.isEmpty, "week \(week.n) reading")
        }
    }

    func testEveryVocabTupleCarriesIPA() {
        // Course locale declares hasIPA — Phase 0 filled all 259.
        XCTAssertTrue(course.locale.hasIPA)
        for card in course.allVocab {
            XCTAssertFalse((card.ipa ?? "").isEmpty, "\(card.it) missing IPA")
        }
    }

    func testAllWeeksCarryReadingSuiteContent() {
        // O1–O5 shipped passages, drills and comprehension for all 37 weeks.
        for week in course.allWeeks {
            XCTAssertFalse(week.passage?.verses.isEmpty ?? true, "week \(week.n) passage")
            XCTAssertFalse(week.drill?.isEmpty ?? true, "week \(week.n) drill")
            XCTAssertFalse(week.comprehension?.isEmpty ?? true, "week \(week.n) comprehension")
        }
    }

    func testAllComprehensionItemsAreValid() {
        for week in course.allWeeks {
            for item in week.comprehension ?? [] {
                XCTAssertTrue(isValidComprehensionItem(item),
                              "week \(week.n): invalid \(item.type) item '\(item.it)'")
            }
        }
    }

    func testAllDrillsHaveABlankAndAnAnswer() {
        for week in course.allWeeks {
            for drill in drillItems(week) {
                let split = splitBlank(drill.q)
                XCTAssertFalse(split.before.isEmpty && split.after.isEmpty,
                               "week \(week.n): drill '\(drill.q)'")
                XCTAssertFalse(drill.a.isEmpty)
            }
        }
    }

    func testWeekLookup() {
        XCTAssertEqual(course.week(1)?.r, "John 1-2")
        XCTAssertEqual(course.week(37)?.review, true)
        XCTAssertNil(course.week(38))
        XCTAssertEqual(course.phase(containing: 1)?.id, "p1")
    }
}
