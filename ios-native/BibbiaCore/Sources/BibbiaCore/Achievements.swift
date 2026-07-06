import Foundation

// Port of src/utils/achievements.js — the achievement/badge list is *derived*
// from the existing stores (progress, SRS, streak, journal); earned state is
// never persisted separately, so badges stay correct even if a store is
// edited or cleared.

public struct Achievement: Equatable, Identifiable {
    public let id: String
    public let icon: String
    public let it: String
    public let en: String
    public let desc: String
    public let earned: Bool
}

public struct AchievementContext {
    public let progress: [Int: Bool]   // week n → done
    public let learnedCount: Int       // SRS terms seen at least once
    public let streakBest: Int
    public let journaledWeeks: Int     // weeks with a non-empty journal entry

    public init(progress: [Int: Bool], learnedCount: Int, streakBest: Int, journaledWeeks: Int) {
        self.progress = progress
        self.learnedCount = learnedCount
        self.streakBest = streakBest
        self.journaledWeeks = journaledWeeks
    }
}

public func computeAchievements(_ ctx: AchievementContext, phases: [Phase],
                                totalWeeks: Int) -> [Achievement] {
    let weeksDone = ctx.progress.values.filter { $0 }.count
    func phaseDone(_ p: Phase) -> Bool {
        !p.weeks.isEmpty && p.weeks.allSatisfy { ctx.progress[$0.n] == true }
    }

    var list: [Achievement] = [
        Achievement(id: "first", icon: "🌱", it: "Primo passo", en: "First step",
                    desc: "Complete your first week", earned: weeksDone >= 1),
        Achievement(id: "five", icon: "🚶", it: "In cammino", en: "On your way",
                    desc: "Complete 5 weeks", earned: weeksDone >= 5),
    ]
    for p in phases {
        list.append(Achievement(id: "phase-\(p.id)", icon: "🏅", it: p.book,
                                en: "\(p.book) complete",
                                desc: "Finish every week of \(p.book)",
                                earned: phaseDone(p)))
    }
    list.append(contentsOf: [
        Achievement(id: "streak7", icon: "🔥", it: "Una settimana", en: "7-day streak",
                    desc: "Study 7 days in a row", earned: ctx.streakBest >= 7),
        Achievement(id: "streak30", icon: "⚡", it: "Un mese intero", en: "30-day streak",
                    desc: "Study 30 days in a row", earned: ctx.streakBest >= 30),
        Achievement(id: "learn50", icon: "📚", it: "50 parole", en: "50 words learned",
                    desc: "Learn 50 words in Practice", earned: ctx.learnedCount >= 50),
        Achievement(id: "learn150", icon: "🧠", it: "150 parole", en: "150 words learned",
                    desc: "Learn 150 words in Practice", earned: ctx.learnedCount >= 150),
        Achievement(id: "writer", icon: "✍️", it: "Scrittore", en: "Writer",
                    desc: "Journal in 10 different weeks", earned: ctx.journaledWeeks >= 10),
        Achievement(id: "all", icon: "🎄", it: "Fino a Natale!", en: "All \(totalWeeks) weeks",
                    desc: "Complete all \(totalWeeks) weeks", earned: weeksDone >= totalWeeks),
    ])
    return list
}

public func earnedCount(_ list: [Achievement]) -> Int {
    list.filter(\.earned).count
}
