import Foundation

// Port of src/utils/tutorEngine.js, the voice tutor's pure state machine. Whole
// lessons are replayed against the real JS by the tutor.json fixture, so the two
// can't drift. The tutor's lines live in src/data/tutorScript.js; those copied here
// are checked by the same fixture.

public let TUTOR_PASS_SCORE = 70
public let TUTOR_MAX_RETRIES = 2
public let TUTOR_MAX_REPEATS = 12
public let TUTOR_MAX_FOCUS_WORDS = 3
public let TUTOR_MAX_RECALLS = 2
public let TUTOR_SILENT_LIMIT = 3
public let TUTOR_SUPPORT_MAX = 3
public let TUTOR_SUPPORT_RAISE_AFTER = 2
public let TUTOR_MAX_BREAKDOWNS = 3
public let TUTOR_MIN_BREAKDOWN_WORDS = 6
private let MAX_ASKED_WORDS = 4

private struct Line { let it: String; let en: String }

private enum L {
    static let intro = Line(it: "Cominciamo la lezione.", en: "Let's begin the lesson.")
    static let listen = Line(it: "Prima ascolta il brano.", en: "First, listen to the passage.")
    static let repeatAfter = Line(it: "Ora ripeti dopo di me.", en: "Now repeat after me.")
    static let again = Line(it: "Ancora una volta, più lentamente.", en: "Once more, more slowly.")
    static let careful = Line(it: "Attenzione a:", en: "Watch out for:")
    static let notHeard = Line(it: "Non ho sentito.", en: "I didn't hear you.")
    static let moveOn = Line(it: "Va bene, andiamo avanti.", en: "All right, let's move on.")
    static let focus = Line(it: "Ora alcune parole difficili.", en: "Now a few difficult words.")
    static let ask = Line(it: "Ora alcune domande sul brano.", en: "Now a few questions about the passage.")
    static let tryAgain = Line(it: "Prova ancora.", en: "Try again.")
    static let answerIs = Line(it: "La risposta è:", en: "The answer is:")
    static let recall = Line(it: "Ascolta bene e di’ la parola che manca.", en: "Listen carefully and say the missing word.")
    static let piecemeal = Line(it: "Proviamo un pezzo alla volta.", en: "Let's try one piece at a time.")
    static let wholeLine = Line(it: "Ora tutta la frase.", en: "Now the whole sentence.")
    static let hint = Line(it: "Ascolta di nuovo questa parte.", en: "Listen to this part again.")
    static let startsWith = Line(it: "La parola comincia con:", en: "The word starts with:")
    static let unknownWord = Line(it: "Non conosco questa parola.", en: "I don't know that word.")
    static let recap = Line(it: "La lezione è finita. Hai lavorato bene!", en: "The lesson is over. You've worked well!")
    static let praise = [
        Line(it: "Bene!", en: "Good!"), Line(it: "Ottimo!", en: "Excellent!"),
        Line(it: "Molto bene!", en: "Very good!"), Line(it: "Giusto!", en: "Right!"),
    ]
}

public enum TutorCommand: String {
    case `repeat`, slower, skip, stop
}

private let COMMANDS: [String: TutorCommand] = [
    "ripeti": .repeat, "ancora": .repeat, "repeat": .repeat, "again": .repeat,
    "piu lentamente": .slower, "lentamente": .slower, "piu piano": .slower, "slower": .slower,
    "avanti": .skip, "salta": .skip, "next": .skip, "skip": .skip,
    "basta": .stop, "stop": .stop,
]

private func canon(_ s: String) -> String {
    canonSpoken(String(s.map { "—–…-".contains($0) ? " " : $0 }))
}

public func parseCommand(_ transcript: String) -> TutorCommand? { COMMANDS[canon(transcript)] }

private let QUESTION_OPENERS: [[String]] = [
    "che cosa vuol dire", "che cosa vuole dire", "che cosa significa",
    "cosa vuol dire", "cosa vuole dire", "cosa significa",
    "che vuol dire", "che vuole dire", "che significa",
].map { $0.split(separator: " ").map(String.init) }

private func trimMarks(_ text: String) -> String {
    let marks: Set<Character> = ["?", "!", ".", ",", ";", ":", "…", "\"", "“", "”", "«", "»"]
    var chars = Array(text)
    while let c = chars.first, marks.contains(c) { chars.removeFirst() }
    while let c = chars.last, marks.contains(c) { chars.removeLast() }
    return String(chars)
}

/// The word a learner is asking about, or nil, kept in the form it was said, since the
/// accents and apostrophes that canon() removes are what the glossary looks up.
public func parseWordQuestion(_ transcript: String) -> String? {
    let tokens = transcript.split(whereSeparator: \.isWhitespace).map { trimMarks(String($0)) }.filter { !$0.isEmpty }
    let lower = tokens.map { $0.lowercased() }
    var asked: [String]?
    if lower.count >= 3, lower[0] == "what", lower[1] == "does", lower[lower.count - 1] == "mean" {
        asked = Array(tokens[2..<(tokens.count - 1)])
    } else if let opener = QUESTION_OPENERS.first(where: { lower.starts(with: $0) }) {
        asked = Array(tokens[opener.count...])
    }
    guard var words = asked, !words.isEmpty else { return nil }
    let leadIn = words.prefix(2).map { $0.lowercased() }.joined(separator: " ")
    if leadIn == "la parola" || leadIn == "the word" { words = Array(words.dropFirst(2)) }
    if words.isEmpty || words.count > MAX_ASKED_WORDS { return nil }
    return words.joined(separator: " ")
}

private let tutorVocabIndex = VocabIndex(course: Course.shared)

/// The English for a word or short phrase, from the same glossary as tap-to-translate.
/// A phrase nothing matches falls back to its last word ("la luce" to "luce").
public func glossWord(_ phrase: String) -> String? {
    let last = phrase.split(whereSeparator: \.isWhitespace).last.map(String.init) ?? phrase
    for candidate in phrase == last ? [phrase] : [phrase, last] {
        if let en = tutorVocabIndex.lookup(candidate)?.en ?? CommonWords.shared.lookup(candidate) { return en }
    }
    return nil
}

/// Pieces for a line the learner can't get whole, or [] if it shouldn't be split.
public func breakdownPieces(_ text: String) -> [String] {
    let count = text.split(whereSeparator: \.isWhitespace).count
    if count < TUTOR_MIN_BREAKDOWN_WORDS { return [] }
    let pieces = verseChunks(text, maxWords: (count + 1) / 2, minWords: 2)
    return pieces.count >= 2 ? pieces : []
}

public func firstLetter(_ word: String) -> String { word.first.map { String($0).uppercased() } ?? "" }

public func scoreRepeat(target: String, heard: String) -> Int {
    scorePronunciation(target: canon(target), recognized: canon(heard))
}

public func pickEvenly<T>(_ items: [T], max: Int) -> [T] {
    if items.count <= max { return items }
    return (0..<max).map { items[$0 * items.count / max] }
}

public enum TutorStepKind: String, Equatable { case intro, listen, `repeat`, focus, ask, recall, recap }

public struct TutorLine: Equatable {
    public let ref: String
    public let t: String
    public let en: String
}

public struct TutorStep: Equatable {
    public var kind: TutorStepKind
    public var lines: [TutorLine] = []
    public var text = ""
    public var en = ""
    public var verseId = ""
    public var first = false
    public var q = ""
    public var answers: [String] = []
    public var model = ""
    public var before = ""
    public var answer = ""
    public var after = ""
    public var full = ""
    public var hint = ""
    public var hintEn = ""
}

public struct TutorLesson: Equatable {
    public let weekN: Int
    public let steps: [TutorStep]
}

private func stripPunct(_ w: String) -> String { splitPunctuation(w).word }

private func vocabKeys(_ week: Week) -> Set<String> {
    var keys = Set<String>()
    for card in week.vocab {
        for raw in [card.it, card.form ?? ""] {
            for w in raw.split(whereSeparator: \.isWhitespace) {
                let k = canon(stripPunct(String(w)))
                if k.count >= 4 { keys.insert(k) }
            }
        }
    }
    return keys
}

private func buildRecalls(_ week: Week, _ rows: [ReadingRow]) -> [TutorStep] {
    let vocab = vocabKeys(week)
    var candidates: [(step: TutorStep, inVocab: Bool)] = []
    for row in rows {
        for chunk in verseChunks(row.t) {
            let tokens = chunk.split(whereSeparator: \.isWhitespace).map(String.init)
            if tokens.count < 4 { continue }
            let scored = tokens.enumerated()
                .map { (i: $0.offset, parts: splitPunctuation($0.element), key: canon(stripPunct($0.element))) }
                .filter { $0.key.count >= 5 }
            // JS sort is stable, so the original position breaks ties.
            let best = scored.enumerated().min { a, b in
                let av = vocab.contains(a.element.key), bv = vocab.contains(b.element.key)
                if av != bv { return av }
                if a.element.key.count != b.element.key.count { return a.element.key.count > b.element.key.count }
                return a.offset < b.offset
            }?.element
            guard let best else { continue }
            let before = (Array(tokens[..<best.i]) + [best.parts.pre]).joined(separator: " ")
            let after = ([best.parts.post] + Array(tokens[(best.i + 1)...])).joined(separator: " ")
            var step = TutorStep(kind: .recall)
            step.verseId = row.id
            step.en = row.en
            step.before = before.trimmingCharacters(in: .whitespaces)
            step.answer = best.parts.word
            step.after = after.trimmingCharacters(in: .whitespaces)
            step.full = chunk
            candidates.append((step, vocab.contains(best.key)))
        }
    }
    // Vocabulary hits first, stable, then the first candidate per verse.
    let ordered = candidates.filter(\.inVocab) + candidates.filter { !$0.inVocab }
    var seen = Set<String>()
    let perVerse = ordered.filter { seen.insert($0.step.verseId).inserted }.map(\.step)
    return pickEvenly(perVerse, max: TUTOR_MAX_RECALLS)
}

// The shortest stretch of the passage that answers a question, to replay as a hint.
private func hintFor(_ answers: [String], _ rows: [ReadingRow]) -> (hint: String, en: String) {
    for row in rows {
        if let chunk = verseChunks(row.t).first(where: { matchesSpoken(answers: answers, transcript: $0) }) {
            return (chunk, row.en)
        }
    }
    if let row = rows.first(where: { matchesSpoken(answers: answers, transcript: $0.t) }) { return (row.t, row.en) }
    return ("", "")
}

public func buildLesson(_ week: Week) -> TutorLesson {
    let rows = verseRefs(week)
    if rows.isEmpty { return TutorLesson(weekN: week.n, steps: []) }
    var steps = [TutorStep(kind: .intro)]
    var listen = TutorStep(kind: .listen)
    listen.lines = rows.map { TutorLine(ref: $0.ref, t: $0.t, en: $0.en) }
    steps.append(listen)

    let chunks = rows.flatMap { row in verseChunks(row.t).map { (text: $0, row: row) } }
    for (i, c) in pickEvenly(chunks, max: TUTOR_MAX_REPEATS).enumerated() {
        var s = TutorStep(kind: .repeat)
        s.text = c.text
        s.en = c.row.en
        s.verseId = c.row.id
        s.first = i == 0
        steps.append(s)
    }
    steps.append(TutorStep(kind: .focus))

    let passageText = rows.map(\.t).joined(separator: " ")
    let asked = questionItems(week).filter { matchesSpoken(answers: $0.answers, transcript: passageText) }
    for (i, q) in asked.enumerated() {
        var s = TutorStep(kind: .ask)
        s.q = q.q
        s.answers = q.answers
        s.model = q.model.isEmpty ? (q.answers.first ?? "") : q.model
        s.first = i == 0
        let hint = hintFor(q.answers, rows)
        s.hint = hint.hint
        s.hintEn = hint.en
        steps.append(s)
    }
    for (i, r) in buildRecalls(week, rows).enumerated() {
        var s = r
        s.first = i == 0
        steps.append(s)
    }
    steps.append(TutorStep(kind: .recap))
    return TutorLesson(weekN: week.n, steps: steps)
}

public func rankFocusWords(_ wordMisses: [String: Int], max: Int = TUTOR_MAX_FOCUS_WORDS) -> [String] {
    let sorted = wordMisses.sorted { a, b in
        a.value != b.value ? a.value > b.value : Array(a.key.utf16).lexicographicallyPrecedes(Array(b.key.utf16))
    }
    return sorted.prefix(max).map(\.key)
}

public struct TutorUtterance: Equatable {
    public let text: String
    public let en: String
    public let slow: Bool
    public let line: Int?

    init(_ text: String, en: String = "", slow: Bool = false, line: Int? = nil) {
        self.text = text
        self.en = en
        self.slow = slow
        self.line = line
    }

    fileprivate init(_ l: Line) { self.init(l.it, en: l.en) }
}

public enum TutorPhase: String { case idle, speaking, listening, typing, paused, done }
public enum TutorThen: String { case listen, advance, finish }
public enum TutorTone: String { case ok, retry, silent, miss }

public struct TutorFeedback: Equatable {
    public var tone: TutorTone
    public var heard: String
    public var score: Int?
    public var words: [String]
    public var piece = false
}

public struct TutorGloss: Equatable {
    public let word: String
    public let en: String
}

public struct TutorTotals: Codable, Equatable {
    public var ok: Int
    public var total: Int
    public init(ok: Int = 0, total: Int = 0) { self.ok = ok; self.total = total }
}

public struct TutorSnapshot: Codable, Equatable {
    public var i: Int
    public var sub: Int
    public var slow: Bool
    public var totals: TutorTotals
    public var missed: [String]
    public var recalled: [String]
    public var wordMisses: [String: Int]
    public var focusWords: [String]
    // Optional so a resume point saved before these existed still loads.
    public var support: Int?
    public var breakdowns: Int?
}

public struct TutorSummary: Equatable {
    public let weekN: Int
    public let ok: Int
    public let total: Int
    public let score: Int
    public let missed: [String]
    public let recalled: [String]
    public let completed: Bool
}

public enum TutorEvent: Equatable {
    case start, spoken, noSpeech, micUnavailable, override, resume, showText
    case heard([String])
    case typed(String)
    case setTyping(Bool)
    case command(TutorCommand)
    case pause(String?)
}

public enum TutorEffect: Equatable {
    case speak(TutorUtterance)
    case listen
    case cancel
    case finish(TutorSummary)
}

public struct TutorState: Equatable {
    public let lesson: TutorLesson
    public var i = 0
    public var sub = 0
    public var phase = TutorPhase.idle
    public var queue: [TutorUtterance] = []
    public var then = TutorThen.advance
    public var attempt = 0
    public var stepOk: Bool?
    public var feedback: TutorFeedback?
    public var slow = false
    public var typing = false
    public var silentStreak = 0
    public var pausedReason: String?
    public var totals = TutorTotals()
    public var missed: [String] = []
    public var recalled: [String] = []
    public var wordMisses: [String: Int] = [:]
    public var focusWords: [String] = []
    public var support = 0
    public var passStreak = 0
    public var supportDropped = false
    public var breakdowns = 0
    public var pieces: [String] = []
    public var pieceI = 0
    public var peek = false
    public var hinted = false
    public var glossed: TutorGloss?

    public init(lesson: TutorLesson, typing: Bool = false, resume: TutorSnapshot? = nil) {
        self.lesson = lesson
        self.typing = typing
        if let resume {
            i = resume.i
            sub = resume.sub
            slow = resume.slow
            totals = resume.totals
            missed = resume.missed
            recalled = resume.recalled
            wordMisses = resume.wordMisses
            focusWords = resume.focusWords
            support = resume.support ?? 0
            breakdowns = resume.breakdowns ?? 0
        }
    }

    public var step: TutorStep? { lesson.steps.indices.contains(i) ? lesson.steps[i] : nil }

    public var snapshot: TutorSnapshot {
        TutorSnapshot(i: i, sub: sub, slow: slow, totals: totals, missed: missed, recalled: recalled,
                      wordMisses: wordMisses, focusWords: focusWords, support: support, breakdowns: breakdowns)
    }

    /// What the learner is being asked to say right now on a Repeat step: a piece
    /// during a breakdown, otherwise the whole line.
    public func repeatText(_ step: TutorStep) -> String { pieces.isEmpty ? step.text : pieces[pieceI] }

    /// How much of a Repeat line to hide, on the same 0-3 scale as `support`. Any retry
    /// or breakdown shows it all, since hiding text from someone already struggling
    /// would only punish them.
    public var textLevel: Int { attempt > 0 || peek || !pieces.isEmpty ? 0 : support }

    public var summaryScore: Int {
        totals.total == 0 ? 0 : Int((Double(totals.ok) / Double(totals.total) * 100).rounded())
    }

    func summary(completed: Bool) -> TutorSummary {
        TutorSummary(weekN: lesson.weekN, ok: totals.ok, total: totals.total, score: summaryScore,
                     missed: missed, recalled: recalled, completed: completed)
    }
}

public typealias TutorResult = (state: TutorState, effects: [TutorEffect])

private func isInteractive(_ kind: TutorStepKind) -> Bool {
    [.repeat, .focus, .ask, .recall].contains(kind)
}

private func hasLetter(_ s: String) -> Bool { !splitPunctuation(s).word.isEmpty }

private func prompt(_ state: TutorState, _ step: TutorStep, withIntro: Bool) -> [TutorUtterance] {
    let slow = state.slow
    switch step.kind {
    case .intro:
        return [TutorUtterance(L.intro)]
    case .listen:
        let lines = step.lines.enumerated().flatMap { i, line in
            splitSentences(line.t).map { TutorUtterance($0, en: line.en, slow: slow, line: i) }
        }
        return (withIntro ? [TutorUtterance(L.listen)] : []) + lines
    case .repeat:
        return (withIntro && step.first ? [TutorUtterance(L.repeatAfter)] : [])
            + [TutorUtterance(state.repeatText(step), en: step.en, slow: slow)]
    case .focus:
        return (withIntro && state.sub == 0 ? [TutorUtterance(L.focus)] : [])
            + [TutorUtterance(state.focusWords[state.sub], slow: slow)]
    case .ask:
        return (withIntro && step.first ? [TutorUtterance(L.ask)] : []) + [TutorUtterance(step.q, slow: slow)]
    case .recall:
        return (withIntro && step.first ? [TutorUtterance(L.recall)] : [])
            + (hasLetter(step.before) ? [TutorUtterance(step.before, en: step.en, slow: slow)] : [])
            + (hasLetter(step.after) ? [TutorUtterance(step.after, en: step.en, slow: slow)] : [])
    case .recap:
        return [TutorUtterance(L.recap)]
    }
}

private func thenFor(_ kind: TutorStepKind) -> TutorThen {
    isInteractive(kind) ? .listen : kind == .recap ? .finish : .advance
}

private func run(_ state: TutorState, _ extra: [TutorEffect] = []) -> TutorResult {
    var s = state
    if let head = s.queue.first {
        s.phase = .speaking
        return (s, extra + [.speak(head)])
    }
    switch s.then {
    case .listen:
        if s.typing {
            s.phase = .typing
            return (s, extra)
        }
        s.phase = .listening
        return (s, extra + [.listen])
    case .finish:
        s.phase = .done
        return (s, extra + [.finish(s.summary(completed: true))])
    case .advance:
        return advance(s, extra)
    }
}

private func enter(_ state: TutorState, _ extra: [TutorEffect] = []) -> TutorResult {
    var s = state
    s.attempt = 0
    s.stepOk = nil
    s.pieces = []
    s.pieceI = 0
    s.peek = false
    s.hinted = false
    s.glossed = nil
    s.supportDropped = false
    guard let step = s.step else { return (s, extra) }
    if step.kind == .focus {
        if s.sub == 0 && s.focusWords.isEmpty { s.focusWords = rankFocusWords(s.wordMisses) }
        if s.sub >= s.focusWords.count { return advance(s, extra) }
    }
    s.queue = prompt(s, step, withIntro: true)
    s.then = thenFor(step.kind)
    return run(s, extra)
}

private func advance(_ state: TutorState, _ extra: [TutorEffect] = []) -> TutorResult {
    var s = state
    guard let step = s.step else { return (s, extra) }
    if isInteractive(step.kind), step.kind != .focus, let ok = s.stepOk {
        s.totals.total += 1
        if ok { s.totals.ok += 1 }
        if !ok, !step.verseId.isEmpty, !s.missed.contains(step.verseId) { s.missed.append(step.verseId) }
        if ok, step.kind == .recall, !s.recalled.contains(step.verseId) { s.recalled.append(step.verseId) }
    }
    s.feedback = nil
    if step.kind == .focus, s.sub + 1 < s.focusWords.count {
        s.sub += 1
        return enter(s, extra)
    }
    s.i += 1
    s.sub = 0
    return enter(s, extra)
}

private func grade(_ state: TutorState, _ step: TutorStep, _ alternatives: [String])
    -> (ok: Bool, heard: String, score: Int?) {
    let alts = alternatives.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    if step.kind == .repeat {
        let target = state.repeatText(step)
        var best = alts.first ?? ""
        var score = best.isEmpty ? 0 : scoreRepeat(target: target, heard: best)
        for alt in alts {
            let s = scoreRepeat(target: target, heard: alt)
            if s > score {
                best = alt
                score = s
            }
        }
        return (score >= TUTOR_PASS_SCORE, best, score)
    }
    let answers = step.kind == .ask ? step.answers
        : [step.kind == .focus ? state.focusWords[state.sub] : step.answer]
    if let match = alts.first(where: { matchesSpoken(answers: answers, transcript: $0) }) {
        return (true, match, nil)
    }
    return (false, alts.first ?? "", nil)
}

private func praiseLine(_ state: TutorState) -> TutorUtterance {
    TutorUtterance(L.praise[(state.i + state.sub + state.pieceI) % L.praise.count])
}

// Only an unaided first try earns less text next time.
private func creditPass(_ state: TutorState, _ step: TutorStep) -> TutorState {
    guard step.kind == .repeat else { return state }
    var s = state
    if s.attempt > 0 || s.peek {
        s.passStreak = 0
        return s
    }
    s.passStreak += 1
    if s.passStreak >= TUTOR_SUPPORT_RAISE_AFTER {
        s.passStreak = 0
        s.support = min(TUTOR_SUPPORT_MAX, s.support + 1)
    }
    return s
}

// A piece gets one ungraded try and then the lesson moves along, finishing on the
// whole line, which is the only try that counts.
private func nextPiece(_ state: TutorState, _ step: TutorStep, ok: Bool, heard: String, score: Int?) -> TutorResult {
    var s = state
    let lead = ok ? [praiseLine(state)] : heard.isEmpty ? [TutorUtterance(L.notHeard)] : []
    s.feedback = TutorFeedback(tone: ok ? .ok : heard.isEmpty ? .silent : .retry, heard: heard, score: score,
                               words: [], piece: true)
    if !heard.isEmpty { s.silentStreak = 0 }
    s.then = .listen
    if state.pieceI + 1 < state.pieces.count {
        s.pieceI += 1
        s.queue = lead + [TutorUtterance(state.pieces[s.pieceI], en: step.en, slow: true)]
    } else {
        s.pieces = []
        s.pieceI = 0
        s.queue = lead + [TutorUtterance(L.wholeLine), TutorUtterance(step.text, en: step.en, slow: true)]
    }
    return run(s)
}

// A question costs no attempt: answer it, then ask again what was being asked.
private func onWordQuestion(_ state: TutorState, _ step: TutorStep, _ word: String) -> TutorResult {
    var s = state
    let en = glossWord(word)
    s.silentStreak = 0
    s.glossed = en.map { TutorGloss(word: word, en: $0) }
    let answer = en.map { TutorUtterance(word, en: $0, slow: true) } ?? TutorUtterance(L.unknownWord)
    s.queue = [answer] + prompt(state, step, withIntro: false)
    s.then = .listen
    return run(s)
}

private func onPass(_ state: TutorState, _ step: TutorStep, heard: String, score: Int?,
                    _ extra: [TutorEffect] = []) -> TutorResult {
    var s = state
    let praise = praiseLine(state)
    let closing: [TutorUtterance]
    switch step.kind {
    case .ask: closing = [TutorUtterance(step.model)]
    case .recall: closing = [TutorUtterance(step.full, en: step.en)]
    default: closing = []
    }
    s.pieces = []
    s.pieceI = 0
    s.stepOk = true
    s.silentStreak = 0
    s.feedback = TutorFeedback(tone: .ok, heard: heard, score: score, words: [])
    s.queue = [praise] + closing
    s.then = .advance
    return run(s, extra)
}

private func missedWords(_ step: TutorStep, heard: String) -> [String] {
    diffReconstruction(original: step.text, attempt: heard).original
        .filter { !$0.ok }
        .map { stripPunct($0.w).lowercased() }
        .filter { canon($0).count >= 3 }
}

// A nudge after a wrong answer. Silence gets none, since nothing was tried yet.
private func wrongAnswerHint(_ step: TutorStep) -> [TutorUtterance] {
    if step.kind == .ask, !step.hint.isEmpty {
        return [TutorUtterance(L.hint), TutorUtterance(step.hint, en: step.hintEn)]
    }
    if step.kind == .recall {
        return [TutorUtterance(L.startsWith), TutorUtterance(firstLetter(step.answer))]
    }
    return []
}

private func onFail(_ state: TutorState, _ step: TutorStep, heard: String, score: Int?) -> TutorResult {
    var s = state
    let silent = heard.isEmpty
    let prefix = silent ? [TutorUtterance(L.notHeard)] : []
    let words = step.kind == .repeat && !silent ? missedWords(step, heard: heard) : []
    for w in words { s.wordMisses[w, default: 0] += 1 }
    if step.kind == .repeat, !silent {
        s.passStreak = 0
        // Silence isn't a miss, so it leaves the learner's support level alone.
        if !s.supportDropped {
            s.support = max(0, s.support - 1)
            s.supportDropped = true
        }
    }
    s.feedback = TutorFeedback(tone: silent ? .silent : .retry, heard: heard, score: score, words: words)
    let retries = step.kind == .repeat ? TUTOR_MAX_RETRIES : 1

    if state.attempt < retries {
        s.attempt += 1
        s.then = .listen
        if step.kind == .repeat {
            let pieces = !silent && state.attempt == 1 && state.breakdowns < TUTOR_MAX_BREAKDOWNS
                ? breakdownPieces(step.text) : []
            if let first = pieces.first {
                // Leaves one attempt, for the whole line once the pieces are done.
                s.attempt = retries
                s.pieces = pieces
                s.pieceI = 0
                s.breakdowns += 1
                s.queue = [TutorUtterance(L.piecemeal), TutorUtterance(first, en: step.en, slow: true)]
                return run(s)
            }
            let careful = words.isEmpty ? [] : [
                TutorUtterance(L.careful),
                TutorUtterance(words.prefix(2).joined(separator: ", "), slow: true),
            ]
            s.queue = prefix + [TutorUtterance(L.again)] + careful + [TutorUtterance(step.text, en: step.en, slow: true)]
        } else {
            let hint = silent ? [] : wrongAnswerHint(step)
            s.hinted = !hint.isEmpty
            s.queue = prefix + hint + [TutorUtterance(L.tryAgain)] + prompt(state, step, withIntro: false)
        }
        return run(s)
    }

    let reveal: [TutorUtterance]
    switch step.kind {
    case .ask: reveal = [TutorUtterance(L.answerIs), TutorUtterance(step.model)]
    case .recall: reveal = [TutorUtterance(L.answerIs), TutorUtterance(step.full, en: step.en)]
    default: reveal = [TutorUtterance(L.moveOn)]
    }
    s.stepOk = false
    s.feedback?.tone = .miss
    s.queue = prefix + reveal
    s.then = .advance
    return run(s)
}

private func onCommand(_ state: TutorState, _ command: TutorCommand) -> TutorResult {
    guard let step = state.step else { return (state, []) }
    var s = state
    switch command {
    case .repeat, .slower:
        if command == .slower { s.slow = true }
        s.queue = prompt(s, step, withIntro: false)
        s.then = thenFor(step.kind)
        return run(s, [.cancel])
    case .skip:
        if step.kind == .recap { return (state, []) }
        s.stepOk = nil
        s.queue = []
        return advance(s, [.cancel])
    case .stop:
        s.phase = .done
        s.queue = []
        return (s, [.cancel, .finish(state.summary(completed: false))])
    }
}

public func tutorNext(_ state: TutorState, _ event: TutorEvent) -> TutorResult {
    let nothing: TutorResult = (state, [])
    if state.phase == .done { return nothing }

    switch event {
    case .start:
        return state.phase == .idle && !state.lesson.steps.isEmpty ? enter(state) : nothing

    case .spoken:
        guard state.phase == .speaking else { return nothing }
        var s = state
        s.queue.removeFirst()
        return run(s)

    case .heard, .typed:
        guard state.phase == .listening || state.phase == .typing, let step = state.step else { return nothing }
        let alternatives: [String]
        if case .heard(let alts) = event { alternatives = alts }
        else if case .typed(let text) = event { alternatives = [text] }
        else { alternatives = [] }
        // The order matters. matchesSpoken accepts an answer inside a longer utterance,
        // so "che vuol dire la luce?" would pass as the answer "luce" if graded first.
        // On Repeat grading has to win instead: no verse in the course contains one of
        // these phrases today, but a course could add one, and repeating it isn't asking.
        let asked = parseWordQuestion(alternatives.first ?? "")
        if let asked, step.kind != .repeat { return onWordQuestion(state, step, asked) }
        let result = grade(state, step, alternatives)
        let inPieces = !state.pieces.isEmpty
        if result.ok {
            return inPieces
                ? nextPiece(state, step, ok: true, heard: result.heard, score: result.score)
                : onPass(creditPass(state, step), step, heard: result.heard, score: result.score)
        }
        var s = state
        if let command = parseCommand(alternatives.first ?? "") {
            s.silentStreak = 0
            return onCommand(s, command)
        }
        if let asked { return onWordQuestion(state, step, asked) }
        if inPieces { return nextPiece(state, step, ok: false, heard: result.heard, score: result.score) }
        if !result.heard.isEmpty { s.silentStreak = 0 }
        return onFail(s, step, heard: result.heard, score: result.score)

    case .noSpeech:
        guard state.phase == .listening, let step = state.step else { return nothing }
        var s = state
        s.silentStreak += 1
        if s.silentStreak >= TUTOR_SILENT_LIMIT {
            s.phase = .paused
            s.pausedReason = "silent"
            s.queue = prompt(state, step, withIntro: false)
            s.then = .listen
            return (s, [.cancel])
        }
        if !state.pieces.isEmpty { return nextPiece(s, step, ok: false, heard: "", score: nil) }
        return onFail(s, step, heard: "", score: nil)

    case .micUnavailable:
        var s = state
        s.typing = true
        if state.phase == .listening { s.phase = .typing }
        return (s, [])

    case .setTyping(let on):
        var s = state
        s.typing = on
        if on && state.phase == .listening {
            s.phase = .typing
            return (s, [.cancel])
        }
        if !on && state.phase == .typing { return run(s) }
        return (s, [])

    case .override:
        guard let step = state.step, isInteractive(step.kind), state.stepOk != true,
              state.phase != .paused, state.phase != .idle else { return nothing }
        if state.feedback?.piece == true { return nothing } // pieces are ungraded, so there is nothing to overturn
        return onPass(state, step, heard: state.feedback?.heard ?? "", score: state.feedback?.score, [.cancel])

    case .showText:
        guard state.step?.kind == .repeat, state.textLevel > 0 else { return nothing }
        var s = state
        s.peek = true
        s.passStreak = 0
        s.support = max(0, s.support - 1)
        return (s, [])

    case .command(let command):
        if state.phase == .idle || state.phase == .paused {
            return command == .stop ? onCommand(state, .stop) : nothing
        }
        return onCommand(state, command)

    case .pause(let reason):
        guard [.speaking, .listening, .typing].contains(state.phase) else { return nothing }
        var s = state
        s.phase = .paused
        s.pausedReason = reason ?? "manual"
        return (s, [.cancel])

    case .resume:
        guard state.phase == .paused else { return nothing }
        var s = state
        s.pausedReason = nil
        s.silentStreak = 0
        return run(s)
    }
}
