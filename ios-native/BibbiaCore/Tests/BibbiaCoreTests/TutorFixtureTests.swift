import XCTest
@testable import BibbiaCore

// Pins the Swift voice tutor and verse practice to the web's real JS, down to every
// utterance of whole replayed lessons. See the tutor block in generate-fixtures.mjs.

private struct Fixture: Decodable {
    struct Canon: Decodable { let input: String; let out: String }
    struct Match: Decodable { let answers: [String]; let transcript: String; let ok: Bool }
    struct TextList: Decodable { let text: String; let out: [String] }
    struct Row: Decodable { let ref: String; let t: String; let en: String; let id: String; let fullRef: String }
    struct Ref: Decodable { let week: Int; let ref: String; let expanded: [String]; let rows: [Row] }
    struct BadRef: Decodable { let ref: String; let out: [String] }
    struct Token: Decodable { let pre: String; let word: String; let post: String }
    struct Recall: Decodable { let text: String; let tokens: [Token]; let order: [Int]; let sizes: [Int] }
    struct Word: Decodable { let expected: String; let given: String; let ok: Bool }
    struct Command: Decodable { let text: String; let out: String? }
    struct Score: Decodable { let target: String; let heard: String; let score: Int }
    struct Focus: Decodable { let misses: [String: Int]; let out: [String] }
    struct Even: Decodable { let n: Int; let max: Int; let out: [Int] }
    struct Line: Decodable { let ref: String; let t: String; let en: String }
    struct Step: Decodable {
        let kind: String; let lines: [Line]; let text: String; let en: String; let verseId: String
        let first: Bool; let q: String; let answers: [String]; let model: String
        let before: String; let answer: String; let after: String; let full: String
        let hint: String; let hintEn: String
    }
    struct Lesson: Decodable { let week: Int; let steps: [Step] }
    struct Utterance: Decodable { let text: String; let en: String; let slow: Bool; let line: Int? }
    struct Summary: Decodable {
        let weekN: Int; let ok: Int; let total: Int; let score: Int
        let missed: [String]; let recalled: [String]; let completed: Bool
    }
    struct Effect: Decodable { let type: String; let utterance: Utterance?; let summary: Summary? }
    struct Event: Decodable {
        let type: String; let alternatives: [String]?; let text: String?
        let command: String?; let on: Bool?; let reason: String?
    }
    struct Totals: Decodable { let ok: Int; let total: Int }
    struct Glossed: Decodable { let word: String; let en: String }
    struct State: Decodable {
        let i: Int; let sub: Int; let phase: String; let attempt: Int; let stepOk: Bool?; let slow: Bool
        let typing: Bool; let silentStreak: Int; let pausedReason: String?; let then: String
        let queue: [Utterance]; let tone: String?; let heard: String?; let score: Int?; let words: [String]
        let totals: Totals; let missed: [String]; let recalled: [String]
        let wordMisses: [String: Int]; let focusWords: [String]
        let support: Int; let passStreak: Int; let breakdowns: Int; let pieces: [String]; let pieceI: Int
        let peek: Bool; let hinted: Bool; let glossed: Glossed?; let piece: Bool; let textLevel: Int
    }
    struct Turn: Decodable { let event: Event; let effects: [Effect]; let state: State }
    struct Run: Decodable { let week: Int; let policy: String; let turns: [Turn] }
    struct OptionalText: Decodable { let text: String; let out: String? }
    struct Gloss: Decodable { let word: String; let out: String? }
    struct Letter: Decodable { let word: String; let out: String }

    let canon: [Canon]; let match: [Match]; let sentences: [TextList]; let chunks: [TextList]
    let refs: [Ref]; let badRefs: [BadRef]; let recall: [Recall]; let words: [Word]; let commands: [Command]
    let scores: [Score]; let focus: [Focus]; let even: [Even]; let lessons: [Lesson]; let runs: [Run]
    let wordQuestions: [OptionalText]; let gloss: [Gloss]; let pieces: [TextList]; let letters: [Letter]
}

final class TutorFixtureTests: XCTestCase {
    private static let fixture: Fixture? = try? loadFixture("tutor", as: Fixture.self)
    private var f: Fixture { Self.fixture! }
    private var articles: [String] { Course.shared.locale.articles }
    private var weeks: [Week] { Course.shared.phases.flatMap(\.weeks) }

    override func setUpWithError() throws {
        try XCTSkipIf(Self.fixture == nil, "tutor.json missing or undecodable")
    }

    func testSpokenMatchingMatchesWeb() {
        for c in f.canon { XCTAssertEqual(canonSpoken(c.input), c.out, c.input) }
        XCTAssertGreaterThan(f.match.count, 400)
        for c in f.match {
            XCTAssertEqual(matchesSpoken(answers: c.answers, transcript: c.transcript), c.ok,
                           "\(c.answers) vs \(c.transcript)")
        }
    }

    func testSentencesAndChunksMatchWeb() {
        XCTAssertGreaterThanOrEqual(f.chunks.count, 290)
        for c in f.sentences { XCTAssertEqual(splitSentences(c.text), c.out, c.text) }
        for c in f.chunks { XCTAssertEqual(verseChunks(c.text), c.out, c.text) }
    }

    func testReferencesMatchWeb() {
        for r in f.refs {
            XCTAssertEqual(expandRef(r.ref), r.expanded, r.ref)
            let week = weeks.first { $0.n == r.week }!
            let rows = verseRefs(week)
            XCTAssertEqual(rows.map(\.id), r.rows.map(\.id), "week \(r.week)")
            XCTAssertEqual(rows.map(\.fullRef), r.rows.map(\.fullRef), "week \(r.week)")
            XCTAssertEqual(rows.map(\.t), r.rows.map(\.t), "week \(r.week)")
        }
        for r in f.badRefs { XCTAssertEqual(expandRef(r.ref), r.out, r.ref) }
    }

    func testFadeOrderMatchesWeb() {
        for r in f.recall {
            let tokens = verseTokens(r.text)
            XCTAssertEqual(tokens.map(\.pre), r.tokens.map(\.pre), r.text)
            XCTAssertEqual(tokens.map(\.word), r.tokens.map(\.word), r.text)
            XCTAssertEqual(tokens.map(\.post), r.tokens.map(\.post), r.text)
            XCTAssertEqual(fadeOrder(r.text), r.order, r.text)
            XCTAssertEqual(stageSizes(r.order.count), r.sizes, r.text)
        }
        for w in f.words {
            XCTAssertEqual(wordMatches(expected: w.expected, given: w.given, articles: articles), w.ok,
                           "\(w.expected) vs \(w.given)")
        }
    }

    func testEngineHelpersMatchWeb() {
        for c in f.commands { XCTAssertEqual(parseCommand(c.text)?.rawValue, c.out, c.text) }
        for c in f.scores { XCTAssertEqual(scoreRepeat(target: c.target, heard: c.heard), c.score, c.heard) }
        for c in f.focus { XCTAssertEqual(rankFocusWords(c.misses), c.out) }
        for c in f.even { XCTAssertEqual(pickEvenly(Array(0..<c.n), max: c.max), c.out) }
    }

    func testInteractiveHelpersMatchWeb() {
        for c in f.wordQuestions { XCTAssertEqual(parseWordQuestion(c.text), c.out, c.text) }
        XCTAssertGreaterThan(f.gloss.count, 300)
        for c in f.gloss { XCTAssertEqual(glossWord(c.word), c.out, c.word) }
        XCTAssertGreaterThan(f.pieces.count, 300)
        for c in f.pieces { XCTAssertEqual(breakdownPieces(c.text), c.out, c.text) }
        for c in f.letters { XCTAssertEqual(firstLetter(c.word), c.out, c.word) }
    }

    // A same-day resume saved before support and breakdowns existed must still load.
    func testOlderResumePointStillDecodes() throws {
        let json = #"{"i":3,"sub":0,"slow":false,"totals":{"ok":1,"total":1},"missed":[],"recalled":[],"wordMisses":{},"focusWords":[]}"#
        let snap = try JSONDecoder().decode(TutorSnapshot.self, from: Data(json.utf8))
        XCTAssertNil(snap.support)
        let state = TutorState(lesson: TutorLesson(weekN: 1, steps: []), resume: snap)
        XCTAssertEqual(state.support, 0)
        XCTAssertEqual(state.breakdowns, 0)
    }

    func testEveryLessonMatchesWeb() {
        XCTAssertEqual(f.lessons.count, 37)
        for lesson in f.lessons {
            let steps = buildLesson(weeks.first { $0.n == lesson.week }!).steps
            XCTAssertEqual(steps.count, lesson.steps.count, "week \(lesson.week)")
            for (s, e) in zip(steps, lesson.steps) {
                let label = "week \(lesson.week) \(e.kind)"
                XCTAssertEqual(s.kind.rawValue, e.kind, label)
                XCTAssertEqual(s.lines.map(\.t), e.lines.map(\.t), label)
                XCTAssertEqual(s.text, e.text, label)
                XCTAssertEqual(s.en, e.en, label)
                XCTAssertEqual(s.verseId, e.verseId, label)
                XCTAssertEqual(s.first, e.first, label)
                XCTAssertEqual(s.q, e.q, label)
                XCTAssertEqual(s.answers, e.answers, label)
                XCTAssertEqual(s.model, e.model, label)
                XCTAssertEqual(s.before, e.before, label)
                XCTAssertEqual(s.answer, e.answer, label)
                XCTAssertEqual(s.after, e.after, label)
                XCTAssertEqual(s.full, e.full, label)
                XCTAssertEqual(s.hint, e.hint, label)
                XCTAssertEqual(s.hintEn, e.hintEn, label)
            }
        }
    }

    private func event(_ e: Fixture.Event) -> TutorEvent {
        switch e.type {
        case "start": return .start
        case "spoken": return .spoken
        case "noSpeech": return .noSpeech
        case "micUnavailable": return .micUnavailable
        case "override": return .override
        case "resume": return .resume
        case "showText": return .showText
        case "heard": return .heard(e.alternatives ?? [])
        case "typed": return .typed(e.text ?? "")
        case "setTyping": return .setTyping(e.on ?? false)
        case "command": return .command(TutorCommand(rawValue: e.command ?? "")!)
        case "pause": return .pause(e.reason)
        default: fatalError("unknown event \(e.type)")
        }
    }

    private func describe(_ effect: TutorEffect) -> String {
        switch effect {
        case .speak(let u): return "speak|\(u.text)|\(u.en)|\(u.slow)|\(String(describing: u.line))"
        case .listen: return "listen"
        case .cancel: return "cancel"
        case .finish(let s):
            return "finish|\(s.weekN)|\(s.ok)|\(s.total)|\(s.score)|\(s.missed)|\(s.recalled)|\(s.completed)"
        }
    }

    private func describe(_ e: Fixture.Effect) -> String {
        if let u = e.utterance { return "speak|\(u.text)|\(u.en)|\(u.slow)|\(String(describing: u.line))" }
        if let s = e.summary {
            return "finish|\(s.weekN)|\(s.ok)|\(s.total)|\(s.score)|\(s.missed)|\(s.recalled)|\(s.completed)"
        }
        return e.type
    }

    func testWholeLessonsReplayIdenticallyToWeb() {
        XCTAssertGreaterThanOrEqual(f.runs.count, 20)
        // The replays must actually reach what they claim to pin.
        let states = f.runs.flatMap { $0.turns.map(\.state) }
        XCTAssertTrue(states.contains { $0.support == TUTOR_SUPPORT_MAX })
        XCTAssertTrue(states.contains { !$0.pieces.isEmpty })
        XCTAssertTrue(states.contains { $0.breakdowns == TUTOR_MAX_BREAKDOWNS })
        XCTAssertTrue(states.contains { $0.hinted })
        XCTAssertTrue(states.contains { $0.glossed != nil })
        XCTAssertTrue(states.contains { $0.peek })
        XCTAssertTrue(states.contains { $0.piece })
        for run in f.runs {
            let week = weeks.first { $0.n == run.week }!
            var state = TutorState(lesson: buildLesson(week))
            for (n, turn) in run.turns.enumerated() {
                let label = "week \(run.week) \(run.policy) turn \(n) (\(turn.event.type))"
                let result = tutorNext(state, event(turn.event))
                state = result.state
                let e = turn.state
                XCTAssertEqual(result.effects.map { describe($0) }, turn.effects.map { describe($0) }, label)
                XCTAssertEqual(state.phase.rawValue, e.phase, label)
                XCTAssertEqual(state.i, e.i, label)
                XCTAssertEqual(state.sub, e.sub, label)
                XCTAssertEqual(state.attempt, e.attempt, label)
                XCTAssertEqual(state.stepOk, e.stepOk, label)
                XCTAssertEqual(state.slow, e.slow, label)
                XCTAssertEqual(state.typing, e.typing, label)
                XCTAssertEqual(state.silentStreak, e.silentStreak, label)
                XCTAssertEqual(state.pausedReason, e.pausedReason, label)
                XCTAssertEqual(state.then.rawValue, e.then, label)
                XCTAssertEqual(state.queue.map(\.text), e.queue.map(\.text), label)
                XCTAssertEqual(state.queue.map(\.slow), e.queue.map(\.slow), label)
                XCTAssertEqual(state.feedback?.tone.rawValue, e.tone, label)
                XCTAssertEqual(state.feedback?.heard, e.heard, label)
                XCTAssertEqual(state.feedback?.score, e.score, label)
                XCTAssertEqual(state.feedback?.words ?? [], e.words, label)
                XCTAssertEqual(state.totals.ok, e.totals.ok, label)
                XCTAssertEqual(state.totals.total, e.totals.total, label)
                XCTAssertEqual(state.missed, e.missed, label)
                XCTAssertEqual(state.recalled, e.recalled, label)
                XCTAssertEqual(state.wordMisses, e.wordMisses, label)
                XCTAssertEqual(state.focusWords, e.focusWords, label)
                XCTAssertEqual(state.support, e.support, label)
                XCTAssertEqual(state.passStreak, e.passStreak, label)
                XCTAssertEqual(state.breakdowns, e.breakdowns, label)
                XCTAssertEqual(state.pieces, e.pieces, label)
                XCTAssertEqual(state.pieceI, e.pieceI, label)
                XCTAssertEqual(state.peek, e.peek, label)
                XCTAssertEqual(state.hinted, e.hinted, label)
                XCTAssertEqual(state.glossed?.word, e.glossed?.word, label)
                XCTAssertEqual(state.glossed?.en, e.glossed?.en, label)
                XCTAssertEqual(state.feedback?.piece ?? false, e.piece, label)
                XCTAssertEqual(state.textLevel, e.textLevel, label)
                if result.effects.isEmpty, state.phase == .done { break }
            }
        }
    }

    // The web's store shape, so a lesson record rides a backup file both ways.
    func testTutorStoreDecodesWebJSON() throws {
        let json = #"{"weeks":{"30":{"done":1,"best":71,"last":"2026-11-05"}},"resume":null}"#
        let store = try JSONDecoder().decode(TutorStore.self, from: Data(json.utf8))
        XCTAssertEqual(store.weeks["30"]?.best, 71)
        XCTAssertNil(store.resume)
    }

    func testLessonReviewGradesOncePerDay() {
        let now = Date(timeIntervalSince1970: 1_800_000_000).timeIntervalSince1970 * 1000
        var store = applyLessonToReview(missed: ["A"], recalled: ["A", "B"], store: [:], now: now)
        XCTAssertEqual(store["A"]?.lapses, 1)
        XCTAssertEqual(store["B"]?.reps, 1)
        let once = store["B"]
        store = applyLessonToReview(missed: [], recalled: ["B"], store: store, now: now + 60_000)
        XCTAssertEqual(store["B"], once)
    }

    func testEveryStageGrowsAndEndsWithWholeVerse() {
        for r in f.recall {
            let last = stageParts(r.text, stage: stageCount(r.text) - 1)
            XCTAssertTrue(last.filter { !$0.word.isEmpty }.allSatisfy(\.blank), r.text)
        }
    }
}
