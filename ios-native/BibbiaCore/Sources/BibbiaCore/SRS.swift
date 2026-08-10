import Foundation

// Port of src/utils/srs.js — the SM-2-flavored spaced-repetition scheduler. Timestamps are **milliseconds since the epoch** (JS Date.now()),
// and the card JSON shape matches the web app's `italian-bible-srs` store
// exactly, so sync-snapshot backups move between the PWA and this app.

public let MS_PER_DAY: Double = 86_400_000
public let DEFAULT_EASE = 2.5
public let MIN_EASE = 1.3
public let DAILY_NEW_CAP = 15  // max brand-new cards introduced per calendar day
public let MS_PER_MINUTE: Double = 60_000
public let HARD_FACTOR = 1.2   // interval multiplier for a 'hard' answer
/// Relearning ladder a lapsed card climbs before it is scheduled normally again.
public let RELEARN_STEPS: [Double] = [10 * MS_PER_MINUTE, MS_PER_DAY]

public struct SRSCard: Codable, Equatable {
    public var ease: Double
    public var interval: Double   // days
    public var reps: Int
    public var lapses: Int
    public var due: Double        // ms epoch
    public var last: Double?      // ms epoch
    public var created: Double?   // ms epoch (older web cards may lack it)
    /// Index into RELEARN_STEPS; nil means "not currently relearning".
    public var relearn: Int?

    public init(ease: Double = DEFAULT_EASE, interval: Double = 0, reps: Int = 0,
                lapses: Int = 0, due: Double = 0, last: Double? = nil, created: Double? = nil,
                relearn: Int? = nil) {
        self.ease = ease
        self.interval = interval
        self.reps = reps
        self.lapses = lapses
        self.due = due
        self.last = last
        self.created = created
        self.relearn = relearn
    }
}

/// The web app's whole SRS store: Italian term → card state.
public typealias SRSStore = [String: SRSCard]

public enum SRSGrade: String {
    case good   // "Got it"
    case hard   // "Hard" — recalled, but with effort
    case again  // "Still learning"
}

/// Apply one review to a card's prior state and return its next state.
public func srsReview(_ card: SRSCard?, grade: SRSGrade, now: Double) -> SRSCard {
    var ease = card?.ease ?? DEFAULT_EASE
    var reps = card?.reps ?? 0
    var lapses = card?.lapses ?? 0
    var interval = card?.interval ?? 0
    let relearn = card?.relearn
    // Stamp when a card was first introduced, so the daily new-card cap can
    // count today's new cards across sessions.
    let created = card?.created ?? now

    if grade == .again {
        // Lower the ease, reset the streak, and put the card at the bottom of
        // the relearning ladder so it comes back within the session.
        reps = 0
        lapses += 1
        ease = max(MIN_EASE, ease - 0.2)
        interval = 0
        return SRSCard(ease: ease, interval: interval, reps: reps, lapses: lapses,
                       due: now + RELEARN_STEPS[0], last: now, created: created, relearn: 0)
    }

    // A card in relearning climbs one step per correct answer before rejoining
    // the normal ladder.
    if let step = relearn {
        let next = step + 1
        if next < RELEARN_STEPS.count {
            return SRSCard(ease: ease, interval: interval, reps: reps, lapses: lapses,
                           due: now + RELEARN_STEPS[next], last: now, created: created, relearn: next)
        }
        return SRSCard(ease: ease, interval: 1, reps: 1, lapses: lapses,
                       due: now + MS_PER_DAY, last: now, created: created, relearn: nil)
    }

    if grade == .hard {
        // Recalled, but with effort: shrink the ease a little and grow the
        // interval gently rather than by the full ease factor.
        ease = max(MIN_EASE, ease - 0.15)
        reps += 1
        interval = interval > 0 ? max(1, (interval * HARD_FACTOR).rounded()) : 1
        return SRSCard(ease: ease, interval: interval, reps: reps, lapses: lapses,
                       due: now + interval * MS_PER_DAY, last: now, created: created, relearn: nil)
    }

    // grade == .good: advance the interval (1d, 3d, then interval * ease).
    reps += 1
    if reps == 1 { interval = 1 }
    else if reps == 2 { interval = 3 }
    else { interval = max(1, (interval * ease).rounded()) }

    return SRSCard(ease: ease, interval: interval, reps: reps, lapses: lapses,
                   due: now + interval * MS_PER_DAY, last: now, created: created, relearn: nil)
}

public func isDue(_ card: SRSCard?, now: Double) -> Bool {
    guard let card else { return false }
    return card.due <= now
}

/// Build a practice queue from the (already-filtered) card list and the SRS
/// store. Due cards first (earliest due first), then up to `newCap` never-seen
/// cards, capped at `maxSession` total.
public func buildQueue(cards: [VocabCard], store: SRSStore, now: Double,
                       newCap: Int = 12, maxSession: Int = 20) -> [VocabCard] {
    var due: [(card: VocabCard, due: Double, order: Int)] = []
    var fresh: [VocabCard] = []
    for (i, c) in cards.enumerated() {
        if let st = store[c.it] {
            if st.due <= now { due.append((c, st.due, i)) }
        } else {
            fresh.append(c)
        }
    }
    // Earliest due first; original order breaks ties (JS Array.sort is stable).
    due.sort { $0.due != $1.due ? $0.due < $1.due : $0.order < $1.order }
    let queue = due.map(\.card) + Array(fresh.prefix(newCap))
    return Array(queue.prefix(maxSession))
}

func sameLocalDay(_ a: Double, _ b: Double, calendar: Calendar) -> Bool {
    calendar.isDate(Date(timeIntervalSince1970: a / 1000),
                    inSameDayAs: Date(timeIntervalSince1970: b / 1000))
}

/// How many brand-new cards were first introduced on the same calendar day as
/// `now` — drives the daily new-card cap.
public func newIntroducedToday(store: SRSStore, now: Double,
                               calendar: Calendar = .current) -> Int {
    store.values.filter { card in
        guard let created = card.created else { return false }
        return sameLocalDay(created, now, calendar: calendar)
    }.count
}

/// The new-card allowance left for today given the daily cap.
public func newAllowanceToday(store: SRSStore, now: Double,
                              cap: Int = DAILY_NEW_CAP,
                              calendar: Calendar = .current) -> Int {
    max(0, cap - newIntroducedToday(store: store, now: now, calendar: calendar))
}

public struct SRSStats: Equatable {
    public let due: Int
    public let new: Int
    public let learned: Int
    public let total: Int
}

/// Counts for the practice start screen.
public func srsStats(cards: [VocabCard], store: SRSStore, now: Double) -> SRSStats {
    var due = 0
    var fresh = 0
    var learned = 0
    for c in cards {
        if let st = store[c.it] {
            learned += 1
            if st.due <= now { due += 1 }
        } else {
            fresh += 1
        }
    }
    return SRSStats(due: due, new: fresh, learned: learned, total: cards.count)
}
