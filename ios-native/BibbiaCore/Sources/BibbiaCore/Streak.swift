import Foundation

// Port of src/utils/streak.js — daily streak + today's-goal tracking. The
// JSON shape matches the web app's `italian-bible-streak` key exactly.

public enum StreakFlag: String, CaseIterable, Codable {
    case read
    case practiced
    case journaled
}

public struct TodayFlags: Codable, Equatable {
    public var date: String
    public var read: Bool
    public var practiced: Bool
    public var journaled: Bool

    public init(date: String, read: Bool = false, practiced: Bool = false, journaled: Bool = false) {
        self.date = date
        self.read = read
        self.practiced = practiced
        self.journaled = journaled
    }

    public func has(_ flag: StreakFlag) -> Bool {
        switch flag {
        case .read: return read
        case .practiced: return practiced
        case .journaled: return journaled
        }
    }

    public var anyDone: Bool { read || practiced || journaled }
    public var allDone: Bool { read && practiced && journaled }
}

public struct StreakData: Codable, Equatable {
    public var current: Int
    public var best: Int
    public var last: String?
    public var today: TodayFlags?

    public init(current: Int = 0, best: Int = 0, last: String? = nil, today: TodayFlags? = nil) {
        self.current = current
        self.best = best
        self.last = last
        self.today = today
    }

    // Tolerant decoding (mirrors normalize() spreading over defaults) so a
    // partial or legacy web store never fails to parse.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        current = try c.decodeIfPresent(Int.self, forKey: .current) ?? 0
        best = try c.decodeIfPresent(Int.self, forKey: .best) ?? 0
        last = try c.decodeIfPresent(String.self, forKey: .last)
        today = try c.decodeIfPresent(TodayFlags.self, forKey: .today)
    }
}

/// Local "YYYY-MM-DD" for a date (mirrors todayStr()).
public func todayStr(_ date: Date = Date(), calendar: Calendar = .current) -> String {
    let c = calendar.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
}

/// The "YYYY-MM-DD" one day before `dateStr` (mirrors dayBefore()).
public func dayBefore(_ dateStr: String, calendar: Calendar = .current) -> String {
    let parts = dateStr.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return dateStr }
    var comps = DateComponents()
    comps.year = parts[0]
    comps.month = parts[1]
    comps.day = parts[2]
    guard let d = calendar.date(from: comps),
          let prev = calendar.date(byAdding: .day, value: -1, to: d) else { return dateStr }
    return todayStr(prev, calendar: calendar)
}

/// Advance the streak for an active `today`. Pure.
public func withActivity(_ store: StreakData, today: String) -> StreakData {
    var s = store
    if s.last == today {
        // already counted today
    } else if s.last == dayBefore(today) {
        s.current += 1
    } else {
        s.current = 1
    }
    s.best = max(s.best, s.current)
    s.last = today
    return s
}

/// Set one of today's goal flags (and advance the streak, since any flag is
/// activity). Resets today's flags when the date rolls over. Pure.
public func setFlag(_ store: StreakData, flag: StreakFlag?, today: String) -> StreakData {
    var s = store
    if s.today == nil || s.today!.date != today {
        s.today = TodayFlags(date: today)
    }
    if let flag {
        switch flag {
        case .read: s.today!.read = true
        case .practiced: s.today!.practiced = true
        case .journaled: s.today!.journaled = true
        }
    }
    return withActivity(s, today: today)
}

/// The streak honoring a gap — if the last active day isn't today or
/// yesterday, the streak is broken (0). Pure.
public func currentStreak(_ store: StreakData, today: String) -> Int {
    guard let last = store.last else { return 0 }
    if last == today || last == dayBefore(today) { return store.current }
    return 0
}

/// Today's flags (fresh when the stored day isn't today). Pure.
public func todayFlags(_ store: StreakData, today: String) -> TodayFlags {
    if let t = store.today, t.date == today { return t }
    return TodayFlags(date: today)
}
