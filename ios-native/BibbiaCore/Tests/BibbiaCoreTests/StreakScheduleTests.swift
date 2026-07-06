import XCTest
@testable import BibbiaCore

final class StreakTests: XCTestCase {
    func testDayBefore() {
        XCTAssertEqual(dayBefore("2026-07-02"), "2026-07-01")
        XCTAssertEqual(dayBefore("2026-03-01"), "2026-02-28")
        XCTAssertEqual(dayBefore("2026-01-01"), "2025-12-31")
        XCTAssertEqual(dayBefore("garbage"), "garbage")
    }

    func testConsecutiveDaysGrowTheStreak() {
        var s = setFlag(StreakData(), flag: .read, today: "2026-07-01")
        s = setFlag(s, flag: .read, today: "2026-07-02")
        XCTAssertEqual(s.current, 2)
        XCTAssertEqual(s.best, 2)
    }

    func testSameDayCountsOnce() {
        var s = setFlag(StreakData(), flag: .read, today: "2026-07-01")
        s = setFlag(s, flag: .practiced, today: "2026-07-01")
        XCTAssertEqual(s.current, 1)
        XCTAssertTrue(s.today!.read)
        XCTAssertTrue(s.today!.practiced)
        XCTAssertFalse(s.today!.journaled)
    }

    func testGapResetsCurrentButKeepsBest() {
        var s = setFlag(StreakData(), flag: .read, today: "2026-07-01")
        s = setFlag(s, flag: .read, today: "2026-07-02")
        s = setFlag(s, flag: .read, today: "2026-07-05")
        XCTAssertEqual(s.current, 1)
        XCTAssertEqual(s.best, 2)
    }

    func testCurrentStreakHonorsTheYesterdayGrace() {
        let s = setFlag(StreakData(), flag: .read, today: "2026-07-01")
        XCTAssertEqual(currentStreak(s, today: "2026-07-01"), 1)
        XCTAssertEqual(currentStreak(s, today: "2026-07-02"), 1, "yesterday still counts")
        XCTAssertEqual(currentStreak(s, today: "2026-07-03"), 0, "two days breaks it")
        XCTAssertEqual(currentStreak(StreakData(), today: "2026-07-01"), 0)
    }

    func testDecodingToleratesPartialWebStores() throws {
        let empty = try JSONDecoder().decode(StreakData.self, from: Data("{}".utf8))
        XCTAssertEqual(empty, StreakData())
        let partial = try JSONDecoder().decode(
            StreakData.self, from: Data(#"{"current":3,"last":"2026-07-01"}"#.utf8))
        XCTAssertEqual(partial.current, 3)
        XCTAssertEqual(partial.best, 0)
        XCTAssertNil(partial.today)
    }
}

final class ScheduleTests: XCTestCase {
    var utc: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }

    func date(_ y: Int, _ m: Int, _ d: Int, hour: Int = 12) -> Date {
        var comps = DateComponents()
        comps.year = y; comps.month = m; comps.day = d; comps.hour = hour
        return utc.date(from: comps)!
    }

    func testBeforeStartIsNil() {
        XCTAssertNil(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                now: date(2026, 4, 12), calendar: utc))
    }

    func testFirstAndLastWeekBounds() {
        XCTAssertEqual(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                  now: date(2026, 4, 13), calendar: utc), 1)
        XCTAssertEqual(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                  now: date(2026, 4, 19), calendar: utc), 1)
        XCTAssertEqual(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                  now: date(2026, 4, 20), calendar: utc), 2)
        // Week 37 runs Dec 21–27; past the end returns nil.
        XCTAssertEqual(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                  now: date(2026, 12, 25), calendar: utc), 37)
        XCTAssertNil(ScheduleLogic.currentWeekN(startDate: "2026-04-13", weeks: 37,
                                                now: date(2026, 12, 28), calendar: utc))
    }

    func testSessionRestartFromAnyDate() {
        // The New Session feature passes a different startDate string.
        XCTAssertEqual(ScheduleLogic.currentWeekN(startDate: "2026-07-06", weeks: 37,
                                                  now: date(2026, 7, 10), calendar: utc), 1)
    }

    func testEndDate() {
        let end = ScheduleLogic.endDate(startDate: "2026-04-13", weeks: 37, calendar: utc)!
        XCTAssertEqual(todayStr(end, calendar: utc), "2026-12-27")
    }

    func testTodayDayIndexMondayIsZero() {
        // 2026-07-06 is a Monday, 2026-07-12 a Sunday.
        XCTAssertEqual(ScheduleLogic.todayDayIndex(now: date(2026, 7, 6), calendar: utc), 0)
        XCTAssertEqual(ScheduleLogic.todayDayIndex(now: date(2026, 7, 12), calendar: utc), 6)
    }

    func testInvalidStartDateIsNil() {
        XCTAssertNil(ScheduleLogic.currentWeekN(startDate: "not-a-date", weeks: 37,
                                                now: date(2026, 7, 6), calendar: utc))
    }
}

final class RemindersTests: XCTestCase {
    var utc: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }

    func at(hour: Int) -> Date {
        var comps = DateComponents()
        comps.year = 2026; comps.month = 7; comps.day = 6; comps.hour = hour
        return utc.date(from: comps)!
    }

    let enabled = ReminderPrefs(enabled: true, hour: 19, permissionGranted: true)

    func testFiresAtOrAfterTheHourWhenIdle() {
        XCTAssertTrue(shouldNotify(prefs: enabled, now: at(hour: 19),
                                   studiedToday: false, today: "2026-07-06", calendar: utc))
        XCTAssertTrue(shouldNotify(prefs: enabled, now: at(hour: 22),
                                   studiedToday: false, today: "2026-07-06", calendar: utc))
        XCTAssertFalse(shouldNotify(prefs: enabled, now: at(hour: 18),
                                    studiedToday: false, today: "2026-07-06", calendar: utc))
    }

    func testSuppressedWhenDisabledStudiedOrAlreadyNotified() {
        XCTAssertFalse(shouldNotify(prefs: nil, now: at(hour: 20),
                                    studiedToday: false, today: "2026-07-06", calendar: utc))
        XCTAssertFalse(shouldNotify(prefs: ReminderPrefs(enabled: false, permissionGranted: true),
                                    now: at(hour: 20), studiedToday: false,
                                    today: "2026-07-06", calendar: utc))
        XCTAssertFalse(shouldNotify(prefs: ReminderPrefs(enabled: true, permissionGranted: false),
                                    now: at(hour: 20), studiedToday: false,
                                    today: "2026-07-06", calendar: utc))
        XCTAssertFalse(shouldNotify(prefs: enabled, now: at(hour: 20),
                                    studiedToday: true, today: "2026-07-06", calendar: utc))
        var notified = enabled
        notified.lastNotified = "2026-07-06"
        XCTAssertFalse(shouldNotify(prefs: notified, now: at(hour: 20),
                                    studiedToday: false, today: "2026-07-06", calendar: utc))
        XCTAssertTrue(shouldNotify(prefs: notified, now: at(hour: 20),
                                   studiedToday: false, today: "2026-07-07", calendar: utc),
                      "yesterday's notification doesn't suppress today's")
    }

    func testDefaultHourIsSevenPM() {
        let noHour = ReminderPrefs(enabled: true, permissionGranted: true)
        XCTAssertFalse(shouldNotify(prefs: noHour, now: at(hour: 18),
                                    studiedToday: false, today: "2026-07-06", calendar: utc))
        XCTAssertTrue(shouldNotify(prefs: noHour, now: at(hour: 19),
                                   studiedToday: false, today: "2026-07-06", calendar: utc))
    }
}
