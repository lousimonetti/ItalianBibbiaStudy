import Foundation

// Port of src/utils/schedule.js, plus the "New Session" derivation from
// plan-new-session.md: the effective start date is an override the user picks
// (persisted by the app layer) falling back to the course's configured start.

public enum ScheduleLogic {
    /// Parse a local "YYYY-MM-DD" into a Date at local midnight.
    public static func parseLocalDate(_ s: String, calendar: Calendar = .current) -> Date? {
        let parts = s.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        var comps = DateComponents()
        comps.year = parts[0]
        comps.month = parts[1]
        comps.day = parts[2]
        return calendar.date(from: comps)
    }

    /// Current week 1…weeks based on the real date, or nil before the start
    /// or after the final week. Mirrors getCurrentWeekN().
    public static func currentWeekN(startDate: String, weeks: Int,
                                    now: Date = Date(),
                                    calendar: Calendar = .current) -> Int? {
        guard let start = parseLocalDate(startDate, calendar: calendar) else { return nil }
        let diff = now.timeIntervalSince(start)
        if diff < 0 { return nil }
        let n = Int(diff / (7 * 86_400)) + 1
        return n <= weeks ? n : nil
    }

    /// 0=Mon … 6=Sun (mirrors getTodayDayIndex()).
    public static func todayDayIndex(now: Date = Date(), calendar: Calendar = .current) -> Int {
        // Calendar weekday: 1=Sun … 7=Sat  →  0=Mon … 6=Sun
        let weekday = calendar.component(.weekday, from: now)
        return (weekday + 5) % 7
    }

    /// The program's end date (start + weeks*7 days) for display.
    public static func endDate(startDate: String, weeks: Int,
                               calendar: Calendar = .current) -> Date? {
        guard let start = parseLocalDate(startDate, calendar: calendar) else { return nil }
        return calendar.date(byAdding: .day, value: weeks * 7 - 1, to: start)
    }

    /// The first and last day of week `weekN` (1-based) for a program
    /// starting on `startDate`.
    public static func weekDates(startDate: String, weekN: Int,
                                 calendar: Calendar = .current) -> (start: Date, end: Date)? {
        guard weekN >= 1,
              let start = parseLocalDate(startDate, calendar: calendar),
              let weekStart = calendar.date(byAdding: .day, value: (weekN - 1) * 7, to: start),
              let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart) else {
            return nil
        }
        return (weekStart, weekEnd)
    }

    // The course content's authored `week.d` style ("Apr 13-19",
    // "Apr 27-May 3"): 3-letter English month, day-only right side when the
    // week stays in one month. Fixed table (not DateFormatter) so labels are
    // stable regardless of device locale and match the authored strings
    // exactly for the reference calendar.
    private static let monthAbbrev = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    /// "Apr 13-19"-style label for week `weekN`, computed from the program's
    /// effective start date — replaces the authored `week.d` string, which is
    /// only correct for the reference calendar.
    public static func weekRangeLabel(startDate: String, weekN: Int,
                                      calendar: Calendar = .current) -> String? {
        guard let (weekStart, weekEnd) = weekDates(startDate: startDate, weekN: weekN,
                                                   calendar: calendar) else { return nil }
        let s = calendar.dateComponents([.month, .day], from: weekStart)
        let e = calendar.dateComponents([.month, .day], from: weekEnd)
        guard let sm = s.month, let sd = s.day, let em = e.month, let ed = e.day else {
            return nil
        }
        if sm == em {
            return "\(monthAbbrev[sm - 1]) \(sd)-\(ed)"
        }
        return "\(monthAbbrev[sm - 1]) \(sd)-\(monthAbbrev[em - 1]) \(ed)"
    }
}
