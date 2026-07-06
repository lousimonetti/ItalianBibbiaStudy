import XCTest
@testable import BibbiaCore

// Behavioral tests mirroring src/utils/srs.test.js — queue building, the
// daily new-card cap, and start-screen stats.

final class SRSTests: XCTestCase {
    let now: Double = 1_750_000_000_000
    var utc: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }

    func card(_ n: Int) -> VocabCard {
        VocabCard(it: "parola\(n)", en: "word\(n)", ex: "esempio con parola\(n)")
    }

    func testFirstGoodReviewSchedulesOneDayOut() {
        let c = srsReview(nil, grade: .good, now: now)
        XCTAssertEqual(c.reps, 1)
        XCTAssertEqual(c.interval, 1)
        XCTAssertEqual(c.due, now + MS_PER_DAY)
        XCTAssertEqual(c.created, now)
    }

    func testAgainResetsAndIsDueImmediately() {
        var c = srsReview(nil, grade: .good, now: now)
        c = srsReview(c, grade: .good, now: now + MS_PER_DAY)
        let created = c.created
        c = srsReview(c, grade: .again, now: now + 4 * MS_PER_DAY)
        XCTAssertEqual(c.reps, 0)
        XCTAssertEqual(c.lapses, 1)
        XCTAssertEqual(c.interval, 0)
        XCTAssertEqual(c.due, now + 4 * MS_PER_DAY)
        XCTAssertEqual(c.created, created, "created survives lapses")
        XCTAssertTrue(isDue(c, now: now + 4 * MS_PER_DAY))
    }

    func testEaseNeverDropsBelowMinimum() {
        var c: SRSCard? = nil
        for i in 0..<20 {
            c = srsReview(c, grade: .again, now: now + Double(i) * MS_PER_DAY)
        }
        XCTAssertEqual(c!.ease, MIN_EASE, accuracy: 0.0001)
    }

    func testBuildQueuePutsEarliestDueFirstThenNew() {
        let cards = (1...5).map(card)
        var store: SRSStore = [:]
        store["parola1"] = SRSCard(due: now - 1000)          // due, later
        store["parola2"] = SRSCard(due: now - 5000)          // due, earliest
        store["parola3"] = SRSCard(due: now + MS_PER_DAY)    // not due
        let queue = buildQueue(cards: cards, store: store, now: now)
        XCTAssertEqual(queue.map(\.it), ["parola2", "parola1", "parola4", "parola5"])
    }

    func testBuildQueueRespectsNewCapAndMaxSession() {
        let cards = (1...30).map(card)
        let queue = buildQueue(cards: cards, store: [:], now: now, newCap: 12, maxSession: 20)
        XCTAssertEqual(queue.count, 12)
        let capped = buildQueue(cards: cards, store: [:], now: now, newCap: 25, maxSession: 20)
        XCTAssertEqual(capped.count, 20)
    }

    func testNewIntroducedTodayCountsSameCalendarDayOnly() {
        // Noon UTC so day boundaries are unambiguous in the UTC calendar.
        let noon: Double = 1_750_075_200_000
        var store: SRSStore = [:]
        store["a"] = SRSCard(due: 0, created: noon - 3_600_000)        // same day
        store["b"] = SRSCard(due: 0, created: noon - MS_PER_DAY)       // yesterday
        store["c"] = SRSCard(due: 0, created: noon + 3_600_000)        // same day
        store["d"] = SRSCard(due: 0, created: nil)                     // legacy card
        XCTAssertEqual(newIntroducedToday(store: store, now: noon, calendar: utc), 2)
        XCTAssertEqual(newAllowanceToday(store: store, now: noon, calendar: utc),
                       DAILY_NEW_CAP - 2)
    }

    func testStatsCountsDueNewLearned() {
        let cards = (1...4).map(card)
        var store: SRSStore = [:]
        store["parola1"] = SRSCard(due: now - 1)
        store["parola2"] = SRSCard(due: now + MS_PER_DAY)
        let s = srsStats(cards: cards, store: store, now: now)
        XCTAssertEqual(s, SRSStats(due: 1, new: 2, learned: 2, total: 4))
    }

    func testStoreRoundTripsThroughWebJSONShape() throws {
        // The exact JSON the web app writes under `italian-bible-srs`.
        let webJSON = """
        {"il Verbo":{"ease":2.5,"interval":3,"reps":2,"lapses":0,
        "due":1750172800000,"last":1750000000000,"created":1749000000000}}
        """
        let store = try JSONDecoder().decode(SRSStore.self, from: Data(webJSON.utf8))
        XCTAssertEqual(store["il Verbo"]?.interval, 3)
        let encoded = try JSONEncoder().encode(store)
        let round = try JSONDecoder().decode(SRSStore.self, from: encoded)
        XCTAssertEqual(round, store)
    }
}
