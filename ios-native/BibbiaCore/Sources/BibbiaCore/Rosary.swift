import Foundation

// Port of src/utils/rosary.js — the guided Rosary as a flat list of steps.
//
// 79 steps: crucifix (Sign of the Cross, Creed), the introductory beads (Our
// Father, three Hail Marys for faith/hope/charity, Glory Be), five decades of
// fourteen (announce the mystery, Our Father, ten Hail Marys, Glory Be, Fatima
// prayer), and the close (Hail Holy Queen, Sign of the Cross). Every structural
// fact is precomputed on the step, so the view only ever needs "step i of n".
//
// The course data names devotion ids rather than carrying prayer text, so the
// Ave Maria prayed here is the one taught in the Prayers tab. The rosary.json
// fixture (generated from the real JS) pins the step list for all four sets.

// MARK: - Course data (decoded from course.json → "rosary")

public struct RosaryData: Codable {
    public let prayers: RosaryPrayerIds
    public let virtues: [RosaryVirtue]
    public let sets: [MysterySet]
}

public struct RosaryPrayerIds: Codable {
    public let sign: String
    public let creed: String
    public let our: String
    public let hail: String
    public let glory: String
    public let fatima: String
    public let salve: String
}

public struct RosaryVirtue: Codable, Equatable {
    public let it: String
    public let en: String
}

public struct MysterySet: Codable, Identifiable, Equatable {
    public let id: String
    public let title: String
    public let titleEn: String
    /// The singular the announcement needs ("gaudioso"), not the set's plural.
    public let adjective: String
    /// Weekdays this set is prayed on, 0 = Sunday (JS `Date#getDay`).
    public let days: [Int]
    public let mysteries: [Mystery]
}

public struct Mystery: Codable, Equatable {
    /// Authored in mid-sentence (lowercase) form; headings capitalize it.
    public let it: String
    public let en: String
    public let ref: String
    public let fruitEn: String?
}

// MARK: - Steps

public let rosaryOrdinals = ["primo", "secondo", "terzo", "quarto", "quinto"]

public enum RosarySection: Equatable, Hashable {
    case intro
    case decade(Int)   // 0-based
    case closing

    /// The JS representation: 'intro' | 0…4 | 'closing' (fixture comparison).
    public var jsValue: String {
        switch self {
        case .intro: return "intro"
        case .closing: return "closing"
        case .decade(let d): return String(d)
        }
    }
}

public enum RosaryBead: String, Equatable {
    case cross, large, small, chain, medal
}

public struct RosaryCount: Equatable {
    public let n: Int
    public let of: Int
}

public struct RosaryStep: Equatable, Identifiable {
    public enum Kind: String { case prayer, mystery }

    public let index: Int
    public let kind: Kind
    /// Devotion id for a prayer step; nil for a mystery announcement.
    public let prayerId: String?
    public let section: RosarySection
    public let bead: RosaryBead
    /// "3 of 10" on a Hail Mary; nil elsewhere.
    public let count: RosaryCount?
    /// The opening Hail Marys' intention (fede / speranza / carità).
    public let virtue: RosaryVirtue?
    public let mystery: Mystery?
    /// The spoken announcement on a mystery step.
    public let text: String?

    public var id: Int { index }
}

/// Which set is prayed on a weekday (0 = Sunday). Falls back to the first set.
public func mysterySet(forDay day: Int, in sets: [MysterySet]) -> MysterySet? {
    sets.first { $0.days.contains(day) } ?? sets.first
}

/// JS-style weekday (0 = Sunday) for a date.
public func jsWeekday(_ date: Date = Date(), calendar: Calendar = .current) -> Int {
    calendar.component(.weekday, from: date) - 1
}

/// "Nel terzo mistero doloroso si contempla la coronazione di spine."
public func rosaryAnnouncement(_ set: MysterySet, index: Int) -> String {
    "Nel \(rosaryOrdinals[index]) mistero \(set.adjective) si contempla \(set.mysteries[index].it)."
}

/// Uppercase the first character only (keeps "L'ascensione di Gesù").
public func capitalizeFirst(_ s: String) -> String {
    guard let first = s.first else { return s }
    return first.uppercased() + s.dropFirst()
}

public func buildRosarySteps(_ rosary: RosaryData, set: MysterySet) -> [RosaryStep] {
    let p = rosary.prayers
    var steps: [RosaryStep] = []

    func add(_ prayerId: String?, _ section: RosarySection, _ bead: RosaryBead,
             kind: RosaryStep.Kind = .prayer, count: RosaryCount? = nil,
             virtue: RosaryVirtue? = nil, mystery: Mystery? = nil, text: String? = nil) {
        steps.append(RosaryStep(index: steps.count, kind: kind, prayerId: prayerId, section: section,
                                bead: bead, count: count, virtue: virtue, mystery: mystery, text: text))
    }

    add(p.sign, .intro, .cross)
    add(p.creed, .intro, .cross)
    add(p.our, .intro, .large)
    for (i, v) in rosary.virtues.enumerated() {
        add(p.hail, .intro, .small, count: RosaryCount(n: i + 1, of: rosary.virtues.count), virtue: v)
    }
    add(p.glory, .intro, .chain)

    for (d, mystery) in set.mysteries.enumerated() {
        add(nil, .decade(d), .large, kind: .mystery, mystery: mystery, text: rosaryAnnouncement(set, index: d))
        add(p.our, .decade(d), .large)
        for n in 1...10 {
            add(p.hail, .decade(d), .small, count: RosaryCount(n: n, of: 10))
        }
        add(p.glory, .decade(d), .chain)
        add(p.fatima, .decade(d), .chain)
    }

    add(p.salve, .closing, .medal)
    add(p.sign, .closing, .cross)
    return steps
}

/// The steps sharing a section with `step` — what the bead strip draws.
public func sectionSteps(_ steps: [RosaryStep], of step: RosaryStep) -> [RosaryStep] {
    steps.filter { $0.section == step.section }
}

// MARK: - Persistence (same JSON as the web's `italian-bible-rosary` key)
//
// { resume: { date, setId, step } | null, completed, last }
// A resume point only counts on the day it was saved; a completed Rosary is
// tallied once per day, like the streak.

public struct RosaryResume: Codable, Equatable {
    public var date: String
    public var setId: String
    public var step: Int

    public init(date: String, setId: String, step: Int) {
        self.date = date
        self.setId = setId
        self.step = step
    }
}

public struct RosaryState: Codable, Equatable {
    public var resume: RosaryResume?
    public var completed: Int
    public var last: String?

    public init(resume: RosaryResume? = nil, completed: Int = 0, last: String? = nil) {
        self.resume = resume
        self.completed = completed
        self.last = last
    }

    // Tolerant decode: the web merges a partial object over its defaults, so a
    // missing field here must mean the default, not a decode failure.
    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        resume = try? c.decodeIfPresent(RosaryResume.self, forKey: .resume)
        completed = (try? c.decodeIfPresent(Int.self, forKey: .completed)) ?? 0
        last = try? c.decodeIfPresent(String.self, forKey: .last)
    }

    // Write `resume: null` explicitly, as the web does.
    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(resume, forKey: .resume)
        try c.encode(completed, forKey: .completed)
        try c.encode(last, forKey: .last)
    }

    private enum CodingKeys: String, CodingKey { case resume, completed, last }

    public func resume(for date: String) -> RosaryResume? {
        resume?.date == date ? resume : nil
    }

    public func withPosition(date: String, setId: String, step: Int) -> RosaryState {
        var s = self
        s.resume = RosaryResume(date: date, setId: setId, step: step)
        return s
    }

    public func clearingPosition() -> RosaryState {
        var s = self
        s.resume = nil
        return s
    }

    public func completing(on date: String) -> RosaryState {
        var s = self
        if last != date { s.completed += 1 }
        s.resume = nil
        s.last = date
        return s
    }
}
