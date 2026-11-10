import Foundation

// Port of src/utils/conversaEngine.js. Whole conversations are replayed against the real
// JS by the conversa.json fixture, so the two can't drift.
//
// Nothing here grades. A model's words are spoken and shown, and go nowhere else: the
// summary reports only how many turns the learner took. Each generation has an id, and a
// delta or failure carrying an older id is ignored, so a stream that was cancelled can
// never drive the next turn.

public let CONVERSA_MAX_TURNS = 10
public let CONVERSA_STREAK_TURNS = 3

private let CHANGE_TOPIC = "Possiamo parlare di altro?"
private let NOT_HEARD = TutorUtterance("Non ho sentito.", en: "I didn't hear you.")
private let UNKNOWN_WORD = TutorUtterance("Non conosco questa parola.", en: "I don't know that word.")
private let CLOSING = TutorUtterance("Grazie della conversazione. A presto!", en: "Thanks for the conversation. See you soon!")
private let FAILED = TutorUtterance("Scusa, ora non riesco a rispondere.", en: "Sorry, I can't answer right now.")
private let REFUSED = TutorUtterance("Scusa, di questo non posso parlare.", en: "Sorry, I can't talk about that.")

public enum ConversaPhase: String { case idle, speaking, listening, typing, thinking, paused, failed, done }

public struct ConversaSummary: Equatable {
    public let weekN: Int
    public let turns: Int
    public let completed: Bool
}

public enum ConversaEvent: Equatable {
    case start, spoken, noSpeech, micUnavailable, retry, rephrase, resume
    case heard([String])
    case typed(String)
    case setTyping(Bool)
    case delta(id: Int, text: String)
    case generated(id: Int)
    case failed(id: Int, reason: String)
    case command(TutorCommand)
    case pause(String?)
}

public enum ConversaEffect: Equatable {
    case speak(TutorUtterance)
    case listen
    case cancel
    case generate(id: Int, system: String, messages: [ChatMessage])
    case finish(ConversaSummary)
}

public struct ConversaState {
    public let week: Week
    public let missedWords: [String]
    public var phase = ConversaPhase.idle
    public var queue: [TutorUtterance] = []
    public var history: [ChatMessage] = []
    public var turns = 0
    public var genId = 0
    public var generating = false
    public var regenerate = false
    public var buffer = ""
    public var reply: [String] = []
    public var lastReply: [String] = []
    public var slow = false
    public var typing = false
    public var silentStreak = 0
    public var pausedReason: String?
    public var failure: String?
    public var closing = false
    public var glossed: TutorGloss?

    public init(week: Week, typing: Bool = false, missedWords: [String] = []) {
        self.week = week
        self.typing = typing
        self.missedWords = missedWords
    }
}

public typealias ConversaResult = (state: ConversaState, effects: [ConversaEffect])

private func summary(_ s: ConversaState, completed: Bool) -> ConversaSummary {
    ConversaSummary(weekN: s.week.n, turns: s.turns, completed: completed)
}

private func spoken(_ s: ConversaState, _ text: String) -> TutorUtterance {
    TutorUtterance(text, slow: s.slow)
}

private func run(_ state: ConversaState, _ extra: [ConversaEffect] = []) -> ConversaResult {
    var s = state
    if let head = s.queue.first {
        s.phase = .speaking
        return (s, extra + [.speak(head)])
    }
    if s.generating {
        s.phase = .thinking
        return (s, extra)
    }
    if s.failure != nil {
        s.phase = .failed
        return (s, extra)
    }
    if s.closing {
        s.phase = .done
        return (s, extra + [.finish(summary(s, completed: true))])
    }
    if s.typing {
        s.phase = .typing
        return (s, extra)
    }
    s.phase = .listening
    return (s, extra + [.listen])
}

private func generate(_ state: ConversaState, _ extra: [ConversaEffect] = []) -> ConversaResult {
    var s = state
    s.genId += 1
    s.phase = .thinking
    s.queue = []
    s.generating = true
    s.regenerate = false
    s.buffer = ""
    s.reply = []
    s.failure = nil
    return (s, extra + [.generate(id: s.genId,
                                  system: conversaSystem(s.week, missedWords: s.missedWords),
                                  messages: trimHistory(s.history))])
}

private func onSilence(_ state: ConversaState) -> ConversaResult {
    var s = state
    s.silentStreak += 1
    if s.silentStreak >= TUTOR_SILENT_LIMIT {
        s.phase = .paused
        s.pausedReason = "silent"
        s.queue = s.lastReply.map { spoken(s, $0) }
        return (s, [.cancel])
    }
    s.queue = [NOT_HEARD]
    return run(s)
}

private func onCommand(_ state: ConversaState, _ command: TutorCommand) -> ConversaResult {
    var s = state
    switch command {
    case .repeat, .slower:
        if command == .slower { s.slow = true }
        if s.generating { return (s, []) }
        s.silentStreak = 0
        let current = s
        s.queue = current.lastReply.map { spoken(current, $0) }
        return run(s, [.cancel])
    case .skip:
        if s.generating || s.closing { return (s, []) }
        s.silentStreak = 0
        s.history.append(ChatMessage(role: "user", content: CHANGE_TOPIC))
        return generate(s, [.cancel])
    case .stop:
        s.phase = .done
        s.queue = []
        s.generating = false
        return (s, [.cancel, .finish(summary(state, completed: false))])
    }
}

private func onLearner(_ state: ConversaState, _ text: String) -> ConversaResult {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { return onSilence(state) }
    var s = state
    // The glossary answers these directly, faster and more reliably than a model would.
    if let asked = parseWordQuestion(trimmed) {
        let en = glossWord(asked)
        s.silentStreak = 0
        s.glossed = en.map { TutorGloss(word: asked, en: $0) }
        s.queue = [en.map { TutorUtterance(asked, en: $0, slow: true) } ?? UNKNOWN_WORD]
        return run(s)
    }
    if let command = parseCommand(trimmed) { return onCommand(s, command) }
    s.turns += 1
    s.silentStreak = 0
    s.glossed = nil
    s.history.append(ChatMessage(role: "user", content: trimmed))
    return generate(s)
}

private func onFailed(_ state: ConversaState, reason: String) -> ConversaResult {
    var s = state
    s.generating = false
    s.buffer = ""
    s.reply = []
    s.failure = reason
    s.queue = [reason == "refused" ? REFUSED : FAILED]
    return run(s, [.cancel])
}

public func conversaNext(_ state: ConversaState, _ event: ConversaEvent) -> ConversaResult {
    let nothing: ConversaResult = (state, [])
    if state.phase == .done { return nothing }
    var s = state

    switch event {
    case .start:
        guard state.phase == .idle else { return nothing }
        let opening = conversaOpening(state.week)
        if opening.isEmpty {
            s.phase = .done
            return (s, [.finish(summary(s, completed: false))])
        }
        s.history = [ChatMessage(role: "assistant", content: opening)]
        s.lastReply = [opening]
        s.queue = [spoken(s, opening)]
        return run(s)

    case .spoken:
        guard state.phase == .speaking else { return nothing }
        s.queue.removeFirst()
        return run(s)

    case .heard(let alternatives):
        guard state.phase == .listening else { return nothing }
        return onLearner(state, alternatives.first ?? "")

    case .typed(let text):
        guard state.phase == .typing else { return nothing }
        return onLearner(state, text)

    case .noSpeech:
        return state.phase == .listening ? onSilence(state) : nothing

    case .micUnavailable:
        s.typing = true
        if state.phase == .listening { s.phase = .typing }
        return (s, [])

    case .setTyping(let on):
        s.typing = on
        if on && state.phase == .listening {
            s.phase = .typing
            return (s, [.cancel])
        }
        if !on && state.phase == .typing { return run(s) }
        return (s, [])

    case .delta(let id, let text):
        guard id == state.genId, state.generating else { return nothing }
        let pushed = pushDelta(buffer: state.buffer, delta: text)
        s.buffer = pushed.buffer
        s.reply += pushed.sentences
        s.queue += pushed.sentences.map { spoken(state, $0) }
        return state.phase == .thinking && !s.queue.isEmpty ? run(s) : (s, [])

    case .generated(let id):
        guard id == state.genId, state.generating else { return nothing }
        let tail = flushBuffer(state.buffer)
        let reply = state.reply + tail
        if reply.isEmpty { return onFailed(state, reason: "empty") }
        let closing = state.turns >= CONVERSA_MAX_TURNS
        s.generating = false
        s.buffer = ""
        s.reply = []
        s.lastReply = reply
        s.closing = closing
        s.history.append(ChatMessage(role: "assistant", content: reply.joined(separator: " ")))
        s.queue += tail.map { spoken(state, $0) } + (closing ? [CLOSING] : [])
        return state.phase == .thinking ? run(s) : (s, [])

    case .failed(let id, let reason):
        guard id == state.genId, state.generating else { return nothing }
        return onFailed(state, reason: reason)

    case .retry:
        guard state.phase == .failed else { return nothing }
        s.failure = nil
        return generate(s)

    case .rephrase:
        guard state.phase == .failed else { return nothing }
        // It wasn't answered, so it doesn't count as a turn taken.
        if let last = s.history.last, last.role == "user" {
            s.history.removeLast()
            if last.content != CHANGE_TOPIC { s.turns -= 1 }
        }
        s.failure = nil
        return run(s)

    case .command(let command):
        if [.idle, .paused, .failed].contains(state.phase) {
            return command == .stop ? onCommand(state, .stop) : nothing
        }
        return onCommand(state, command)

    case .pause(let reason):
        guard [.speaking, .listening, .typing, .thinking].contains(state.phase) else { return nothing }
        s.phase = .paused
        s.pausedReason = reason ?? "manual"
        // A half-finished reply can't be picked up again, so abandon it and ask afresh.
        if state.generating {
            s.generating = false
            s.regenerate = true
            s.genId += 1
            s.queue = []
            s.buffer = ""
            s.reply = []
        }
        return (s, [.cancel])

    case .resume:
        guard state.phase == .paused else { return nothing }
        s.pausedReason = nil
        s.silentStreak = 0
        return s.regenerate ? generate(s) : run(s)
    }
}
