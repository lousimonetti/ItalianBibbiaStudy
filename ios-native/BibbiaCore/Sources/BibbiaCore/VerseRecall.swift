import Foundation

// Port of src/utils/verseRecall.js (progressive memorization) and the pure parts of
// verseReview.js. Pinned to the JS by the tutor.json fixture, including fade order.

private func isLetter(_ s: Unicode.Scalar) -> Bool {
    switch s.properties.generalCategory {
    case .uppercaseLetter, .lowercaseLetter, .titlecaseLetter, .modifierLetter, .otherLetter: return true
    default: return false
    }
}

public struct VerseToken: Equatable {
    public let pre: String
    public let word: String
    public let post: String
}

func splitPunctuation(_ token: String) -> VerseToken {
    let scalars = Array(token.unicodeScalars)
    func text(_ range: Range<Int>) -> String {
        var view = String.UnicodeScalarView()
        view.append(contentsOf: scalars[range])
        return String(view)
    }
    guard let first = scalars.firstIndex(where: isLetter),
          let last = scalars.lastIndex(where: isLetter) else {
        return VerseToken(pre: token, word: "", post: "")
    }
    return VerseToken(pre: text(0..<first), word: text(first..<(last + 1)),
                      post: text((last + 1)..<scalars.count))
}

public func verseTokens(_ text: String) -> [VerseToken] {
    text.split(whereSeparator: \.isWhitespace).map { splitPunctuation(String($0)) }
}

private func seedOf(_ text: String) -> UInt32 {
    var h: UInt32 = 17
    for unit in text.utf16 { h = h &* 31 &+ UInt32(unit) }
    return h
}

private func seededShuffle(_ items: [Int], seed: UInt32) -> [Int] {
    var out = items
    var s = seed
    guard out.count > 1 else { return out }
    for i in stride(from: out.count - 1, to: 0, by: -1) {
        s = s &* 1_664_525 &+ 1_013_904_223
        out.swapAt(i, Int(s % UInt32(i + 1)))
    }
    return out
}

public func fadeOrder(_ text: String) -> [Int] {
    let tokens = verseTokens(text)
    let indexes = tokens.indices.filter { !tokens[$0].word.isEmpty }
    let long = indexes.filter { canonSpoken(tokens[$0].word).count >= 4 }
    let short = indexes.filter { canonSpoken(tokens[$0].word).count < 4 }
    let seed = seedOf(text)
    return seededShuffle(long, seed: seed) + seededShuffle(short, seed: seed)
}

public func stageSizes(_ wordCount: Int) -> [Int] {
    guard wordCount > 0 else { return [] }
    var out: [Int] = []
    for raw in [1, 3, Int((Double(wordCount) * 0.6).rounded(.up)), wordCount] {
        let size = min(raw, wordCount)
        if size > (out.last ?? 0) { out.append(size) }
    }
    return out
}

public struct StagePart: Equatable {
    public let pre: String
    public let word: String
    public let post: String
    public let blank: Bool
}

public func stageParts(_ text: String, stage: Int) -> [StagePart] {
    let order = fadeOrder(text)
    let sizes = stageSizes(order.count)
    let size = sizes.isEmpty ? 0 : sizes[min(stage, sizes.count - 1)]
    let blanks = Set(order.prefix(size))
    return verseTokens(text).enumerated().map { i, t in
        StagePart(pre: t.pre, word: t.word, post: t.post, blank: blanks.contains(i))
    }
}

public func stageCount(_ text: String) -> Int { stageSizes(fadeOrder(text).count).count }

public func wordMatches(expected: String, given: String, articles: [String]) -> Bool {
    let e = canonSpoken(expected)
    let g = canonSpoken(given)
    if g.isEmpty { return false }
    return e.count <= 3 ? e == g : checkAnswer(expected: expected, given: given, articles: articles)
}

public struct StageResult: Equatable {
    public let results: [Bool]
    public var wrong: Int { results.filter { !$0 }.count }
    public var total: Int { results.count }
}

public func checkStage(_ parts: [StagePart], answers: [String], articles: [String]) -> StageResult {
    let blanks = parts.filter(\.blank)
    return StageResult(results: blanks.enumerated().map { i, part in
        wordMatches(expected: part.word, given: i < answers.count ? answers[i] : "", articles: articles)
    })
}

public func stageForReps(_ reps: Int?, count: Int) -> Int { min(reps ?? 0, max(count - 1, 0)) }

public func gradeResult(_ result: StageResult) -> SRSGrade {
    if result.wrong == 0 { return .good }
    return result.wrong * 2 <= result.total ? .hard : .again
}

// ── verseReview.js ───────────────────────────────────────────────────────────

/// Memorizing a verse is far more work than learning a word.
public let VERSE_DAILY_NEW_CAP = 3

/// Course verses as cards the scheduler can queue: `it` is the verse's stable id.
public func verseCards(_ weeks: [Week]) -> [VocabCard] {
    weeks.flatMap { week in
        verseRefs(week).map { VocabCard(it: $0.id, en: $0.en, ex: $0.t) }
    }
}

/// Feeds a finished lesson into verse review, at most once per verse per day, and a
/// verse both missed and recalled counts as missed. Mirrors applyLessonToReview().
public func applyLessonToReview(missed: [String], recalled: [String], store: SRSStore, now: Double,
                                calendar: Calendar = .current) -> SRSStore {
    var next = store
    func apply(_ id: String, _ grade: SRSGrade) {
        if let last = next[id]?.last, sameLocalDay(last, now, calendar: calendar) { return }
        next[id] = srsReview(next[id], grade: grade, now: now)
    }
    missed.forEach { apply($0, .again) }
    recalled.filter { !missed.contains($0) }.forEach { apply($0, .good) }
    return next
}

// ── tutorStore.js ────────────────────────────────────────────────────────────

public struct TutorWeekRecord: Codable, Equatable {
    public var done: Int
    public var best: Int
    public var last: String?
}

public struct TutorResumePoint: Codable, Equatable {
    public var weekN: Int
    public var date: String
    public var snap: TutorSnapshot

    public init(weekN: Int, date: String, snap: TutorSnapshot) {
        self.weekN = weekN
        self.date = date
        self.snap = snap
    }
}

/// The `tutor` key, in the web's exact JSON, so it rides backups both ways.
public struct TutorStore: Codable, Equatable {
    public var weeks: [String: TutorWeekRecord]
    public var resume: TutorResumePoint?

    public init(weeks: [String: TutorWeekRecord] = [:], resume: TutorResumePoint? = nil) {
        self.weeks = weeks
        self.resume = resume
    }

    public func resume(for weekN: Int, today: String) -> TutorSnapshot? {
        guard let resume, resume.weekN == weekN, resume.date == today else { return nil }
        return resume.snap
    }

    public mutating func recordLesson(_ summary: TutorSummary, today: String) {
        let key = String(summary.weekN)
        let prev = weeks[key] ?? TutorWeekRecord(done: 0, best: 0, last: nil)
        weeks[key] = TutorWeekRecord(done: prev.done + 1, best: max(prev.best, summary.score), last: today)
        resume = nil
    }
}
