import Foundation

// Port of src/utils/wordStats.js — derive a ranked "words you struggle with"
// list from the SRS store (lapses + low ease ⇒ recognition trouble) and the
// pronunciation store (low average score ⇒ speaking trouble).

public let WEAK_EASE = 2.2    // ease at/below this counts as shaky recall
public let WEAK_PRONUN = 60.0 // average pronunciation score below this is weak

/// Per-word pronunciation stats — matches the web `italian-bible-pronun`
/// store shape ({ attempts, last, best, sum, avg, at }).
public struct PronunStat: Codable, Equatable {
    public var attempts: Int
    public var last: Int
    public var best: Int
    public var sum: Int
    public var avg: Int
    public var at: Double?   // ms epoch of the last attempt

    public init(attempts: Int = 0, last: Int = 0, best: Int = 0,
                sum: Int = 0, avg: Int = 0, at: Double? = nil) {
        self.attempts = attempts
        self.last = last
        self.best = best
        self.sum = sum
        self.avg = avg
        self.at = at
    }

    /// One more attempt folded in (mirrors usePronunStats.record()).
    public func recording(score: Int, now: Double) -> PronunStat {
        let attempts = self.attempts + 1
        let sum = self.sum + score
        return PronunStat(attempts: attempts, last: score, best: max(best, score),
                          sum: sum, avg: Int((Double(sum) / Double(attempts)).rounded()),
                          at: now)
    }
}

public typealias PronunStore = [String: PronunStat]

public struct StruggleEntry: Equatable {
    public let card: VocabCard
    public let score: Double
    public let reasons: [String]
}

/// Ranked array of cards the learner is struggling with (highest score
/// first), capped at `limit`. Cards with no trouble signal are omitted.
public func struggleList(cards: [VocabCard], srsStore: SRSStore = [:],
                         pronunStore: PronunStore = [:], limit: Int = 12) -> [StruggleEntry] {
    var out: [(entry: StruggleEntry, order: Int)] = []
    for (i, c) in cards.enumerated() {
        let srs = srsStore[c.it]
        let pr = pronunStore[c.it]

        let lapses = Double(srs?.lapses ?? 0)
        let lowEase: Double = {
            guard let srs, srs.ease < WEAK_EASE else { return 0 }
            return WEAK_EASE - srs.ease
        }()
        let weakPronun: Double = {
            guard let pr, Double(pr.avg) < WEAK_PRONUN else { return 0 }
            return (WEAK_PRONUN - Double(pr.avg)) / WEAK_PRONUN
        }()

        let score = lapses + lowEase * 2 + weakPronun * 3
        if score <= 0 { continue }

        var reasons: [String] = []
        if lapses > 0 {
            reasons.append("\(Int(lapses)) miss\(lapses > 1 ? "es" : "") in review")
        }
        if let pr, Double(pr.avg) < WEAK_PRONUN {
            reasons.append("pronunciation \(pr.avg)%")
        } else if lowEase > 0, lapses == 0 {
            reasons.append("shaky recall")
        }

        out.append((StruggleEntry(card: c, score: score, reasons: reasons), i))
    }
    // Highest score first; original order breaks ties (JS sort is stable).
    out.sort { $0.entry.score != $1.entry.score ? $0.entry.score > $1.entry.score : $0.order < $1.order }
    return out.prefix(limit).map(\.entry)
}
