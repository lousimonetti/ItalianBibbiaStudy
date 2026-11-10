import XCTest
@testable import BibbiaCore

// Pins Swift's Conversa to the web's real JS, down to every utterance and every prompt
// sent to a model. See the conversa block in generate-fixtures.mjs.

private struct Fixture: Decodable {
    struct Message: Decodable { let role: String; let content: String }
    struct Prompt: Decodable {
        let week: Int; let hard: [String]; let opening: String; let passage: String; let system: String
    }
    struct Trim: Decodable { let messages: [Message]; let max: Int; let out: [Message] }
    struct Clean: Decodable { let input: String; let out: String }
    struct Stream: Decodable { let deltas: [String]; let out: [String] }
    struct Translate: Decodable { let text: String; let system: String }
    struct Utterance: Decodable { let text: String; let en: String; let slow: Bool }
    struct Summary: Decodable { let weekN: Int; let turns: Int; let completed: Bool }
    struct Effect: Decodable {
        let type: String; let utterance: Utterance?; let summary: Summary?
        let id: Int?; let system: String?; let messages: [Message]?
    }
    struct Event: Decodable {
        let type: String; let alternatives: [String]?; let text: String?; let command: String?
        let on: Bool?; let reason: String?; let id: Int?
    }
    struct Glossed: Decodable { let word: String; let en: String }
    struct State: Decodable {
        let phase: String; let queue: [Utterance]; let history: [Message]; let turns: Int; let genId: Int
        let generating: Bool; let regenerate: Bool; let buffer: String; let reply: [String]; let lastReply: [String]
        let slow: Bool; let typing: Bool; let silentStreak: Int; let pausedReason: String?; let failure: String?
        let closing: Bool; let glossed: Glossed?
    }
    struct Turn: Decodable { let event: Event; let effects: [Effect]; let state: State }
    struct Run: Decodable { let name: String; let week: Int; let typing: Bool; let missedWords: [String]; let turns: [Turn] }

    let prompts: [Prompt]; let trims: [Trim]; let cleans: [Clean]; let streams: [Stream]
    let translate: Translate; let maxTurns: Int; let streakTurns: Int; let runs: [Run]
}

final class ConversaFixtureTests: XCTestCase {
    private static let fixture: Fixture? = try? loadFixture("conversa", as: Fixture.self)
    private var f: Fixture { Self.fixture! }
    private var weeks: [Week] { Course.shared.phases.flatMap(\.weeks) }
    private func message(_ m: Fixture.Message) -> ChatMessage { ChatMessage(role: m.role, content: m.content) }

    override func setUpWithError() throws {
        try XCTSkipIf(Self.fixture == nil, "conversa.json missing or undecodable")
    }

    func testPromptsMatchWeb() {
        XCTAssertGreaterThanOrEqual(f.prompts.count, 37)
        for p in f.prompts {
            let week = weeks.first { $0.n == p.week }!
            XCTAssertEqual(conversaOpening(week), p.opening, "week \(p.week)")
            XCTAssertEqual(passageText(week), p.passage, "week \(p.week)")
            XCTAssertEqual(conversaSystem(week, missedWords: p.hard), p.system, "week \(p.week)")
        }
        XCTAssertEqual(translatePrompt(f.translate.text).system, f.translate.system)
        XCTAssertEqual(CONVERSA_MAX_TURNS, f.maxTurns)
        XCTAssertEqual(CONVERSA_STREAK_TURNS, f.streakTurns)
    }

    func testHistoryTrimmingMatchesWeb() {
        for t in f.trims {
            XCTAssertEqual(trimHistory(t.messages.map(message), max: t.max), t.out.map(message))
        }
    }

    func testSentenceStreamMatchesWeb() {
        for c in f.cleans { XCTAssertEqual(cleanReply(c.input), c.out, c.input) }
        for s in f.streams {
            var buffer = ""
            var out: [String] = []
            for d in s.deltas {
                let r = pushDelta(buffer: buffer, delta: d)
                out += r.sentences
                buffer = r.buffer
            }
            out += flushBuffer(buffer)
            XCTAssertEqual(out, s.out, "\(s.deltas)")
        }
    }

    private func event(_ e: Fixture.Event) -> ConversaEvent {
        switch e.type {
        case "start": return .start
        case "spoken": return .spoken
        case "noSpeech": return .noSpeech
        case "micUnavailable": return .micUnavailable
        case "retry": return .retry
        case "rephrase": return .rephrase
        case "resume": return .resume
        case "heard": return .heard(e.alternatives ?? [])
        case "typed": return .typed(e.text ?? "")
        case "setTyping": return .setTyping(e.on ?? false)
        case "delta": return .delta(id: e.id ?? 0, text: e.text ?? "")
        case "generated": return .generated(id: e.id ?? 0)
        case "failed": return .failed(id: e.id ?? 0, reason: e.reason ?? "error")
        case "command": return .command(TutorCommand(rawValue: e.command ?? "")!)
        case "pause": return .pause(e.reason)
        default: fatalError("unknown event \(e.type)")
        }
    }

    private func describe(_ effect: ConversaEffect) -> String {
        switch effect {
        case .speak(let u): return "speak|\(u.text)|\(u.en)|\(u.slow)"
        case .listen: return "listen"
        case .cancel: return "cancel"
        case .generate(let id, let system, let messages):
            return "generate|\(id)|\(system)|\(messages.map { "\($0.role):\($0.content)" })"
        case .finish(let s): return "finish|\(s.weekN)|\(s.turns)|\(s.completed)"
        }
    }

    private func describe(_ e: Fixture.Effect) -> String {
        if let u = e.utterance { return "speak|\(u.text)|\(u.en)|\(u.slow)" }
        if let s = e.summary { return "finish|\(s.weekN)|\(s.turns)|\(s.completed)" }
        if e.type == "generate" {
            return "generate|\(e.id ?? -1)|\(e.system ?? "")|\((e.messages ?? []).map { "\($0.role):\($0.content)" })"
        }
        return e.type
    }

    func testWholeConversationsReplayIdenticallyToWeb() {
        XCTAssertGreaterThanOrEqual(f.runs.count, 12)
        for run in f.runs {
            let week = weeks.first { $0.n == run.week }!
            var state = ConversaState(week: week, typing: run.typing, missedWords: run.missedWords)
            for (n, turn) in run.turns.enumerated() {
                let label = "\(run.name) turn \(n) (\(turn.event.type))"
                let result = conversaNext(state, event(turn.event))
                state = result.state
                let e = turn.state
                XCTAssertEqual(result.effects.map { describe($0) }, turn.effects.map { describe($0) }, label)
                XCTAssertEqual(state.phase.rawValue, e.phase, label)
                XCTAssertEqual(state.queue.map(\.text), e.queue.map(\.text), label)
                XCTAssertEqual(state.queue.map(\.slow), e.queue.map(\.slow), label)
                XCTAssertEqual(state.history, e.history.map(message), label)
                XCTAssertEqual(state.turns, e.turns, label)
                XCTAssertEqual(state.genId, e.genId, label)
                XCTAssertEqual(state.generating, e.generating, label)
                XCTAssertEqual(state.regenerate, e.regenerate, label)
                XCTAssertEqual(state.buffer, e.buffer, label)
                XCTAssertEqual(state.reply, e.reply, label)
                XCTAssertEqual(state.lastReply, e.lastReply, label)
                XCTAssertEqual(state.slow, e.slow, label)
                XCTAssertEqual(state.typing, e.typing, label)
                XCTAssertEqual(state.silentStreak, e.silentStreak, label)
                XCTAssertEqual(state.pausedReason, e.pausedReason, label)
                XCTAssertEqual(state.failure, e.failure, label)
                XCTAssertEqual(state.closing, e.closing, label)
                XCTAssertEqual(state.glossed?.word, e.glossed?.word, label)
                XCTAssertEqual(state.glossed?.en, e.glossed?.en, label)
            }
        }
    }

    // The replays must actually reach what they claim to pin.
    func testReplaysCoverTheHardCases() {
        let states = f.runs.flatMap { $0.turns.map(\.state) }
        XCTAssertTrue(states.contains { $0.phase == "failed" })
        XCTAssertTrue(states.contains { $0.phase == "paused" && $0.regenerate })
        XCTAssertTrue(states.contains { $0.pausedReason == "silent" })
        XCTAssertTrue(states.contains { $0.closing })
        XCTAssertTrue(states.contains { $0.glossed != nil })
        XCTAssertTrue(states.contains { $0.failure == "refused" })
        XCTAssertTrue(states.contains { $0.failure == "empty" })
    }
}

final class TutorAITests: XCTestCase {
    func testNoModelMeansNoConversa() async {
        let ai = NoTutorAI()
        XCTAssertFalse(ai.isAvailable)
        do {
            for try await _ in ai.stream(system: "s", messages: []) { XCTFail("no text expected") }
            XCTFail("should have thrown")
        } catch {
            XCTAssertEqual(error as? TutorAIError, .failed)
        }
    }

    func testScriptedModelDeliversItsScript() async throws {
        let ai = ScriptedTutorAI(pieces: ["Uno. ", "Due."])
        var out = ""
        for try await piece in ai.stream(system: "s", messages: []) { out += piece }
        XCTAssertEqual(out, "Uno. Due.")
    }

    func testScriptedRefusalSurfaces() async {
        let ai = ScriptedTutorAI(pieces: [], error: .refused)
        do {
            for try await _ in ai.stream(system: "s", messages: []) {}
            XCTFail("should have thrown")
        } catch {
            XCTAssertEqual(error as? TutorAIError, .refused)
        }
    }

    func testFlattenHistory() {
        let one = [ChatMessage(role: "user", content: "Ciao")]
        XCTAssertEqual(flattenHistory(one), "Ciao")
        let many = one + [ChatMessage(role: "assistant", content: "Bene."), ChatMessage(role: "user", content: "Sì")]
        XCTAssertEqual(flattenHistory(many), "Learner: Ciao\nTutor: Bene.\nLearner: Sì")
    }

    func testStreamDeltaTurnsSnapshotsIntoPieces() {
        XCTAssertEqual(streamDelta(previous: "", current: "Ciao"), "Ciao")
        XCTAssertEqual(streamDelta(previous: "Ciao", current: "Ciao a tutti"), " a tutti")
        XCTAssertEqual(streamDelta(previous: "Ciao", current: "Ciao"), "")
    }

    func testAnEarlierRewriteYieldsNothing() {
        XCTAssertEqual(streamDelta(previous: "Ciao a", current: "Salve a tutti"), "")
    }

    // A whole turn through the protocol, as ConversaSession drives it.
    func testAConversationWithAScriptedModelNeverGrades() async throws {
        let week = Course.shared.phases[0].weeks[0]
        let ai = ScriptedTutorAI(pieces: ["Sbagliato, ", "hai fallito. ", "Che cosa pensi?"])
        var r = conversaNext(ConversaState(week: week), .start)
        while r.state.phase == .speaking { r = conversaNext(r.state, .spoken) }
        r = conversaNext(r.state, .heard(["La luce è bella."]))
        guard case .generate(let id, let system, let messages)? = r.effects.last else { return XCTFail("no generate") }
        for try await piece in ai.stream(system: system, messages: messages) {
            r = conversaNext(r.state, .delta(id: id, text: piece))
        }
        r = conversaNext(r.state, .generated(id: id))
        while r.state.phase == .speaking { r = conversaNext(r.state, .spoken) }
        XCTAssertEqual(r.state.phase, .listening)
        r = conversaNext(r.state, .command(.stop))
        XCTAssertEqual(r.effects.last, .finish(ConversaSummary(weekN: week.n, turns: 1, completed: false)))
    }
}
