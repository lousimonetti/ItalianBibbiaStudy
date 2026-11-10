import Foundation

// The seam between Conversa and whatever language model is available. Apple's on-device
// model can't run in CI, so it lives in the app target behind this protocol, and
// everything that decides anything lives here where `swift test` can reach it.
//
// Ports the Conversa parts of src/utils/tutorPrompts.js and src/utils/sentenceStream.js,
// pinned by the conversa.json fixture.

public struct ChatMessage: Equatable, Sendable {
    public let role: String // "user" or "assistant"
    public let content: String
    public init(role: String, content: String) {
        self.role = role
        self.content = content
    }
}

public enum TutorAIError: Error, Equatable {
    case refused   // the model's guardrails declined
    case failed
}

public protocol TutorAI {
    /// Whether a model can answer right now. Decides whether Conversa is offered at all.
    var isAvailable: Bool { get }
    /// Pieces of a reply as they are generated. Ends by finishing or throwing TutorAIError.
    func stream(system: String, messages: [ChatMessage]) -> AsyncThrowingStream<String, Error>
    /// Prepares the model ahead of the first turn, to shorten the wait for it.
    func warmUp(system: String)
}

public extension TutorAI {
    func warmUp(system: String) {}
}

/// The default on anything without a usable model: Conversa is simply not offered.
public struct NoTutorAI: TutorAI {
    public init() {}
    public var isAvailable: Bool { false }
    public func stream(system: String, messages: [ChatMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { $0.finish(throwing: TutorAIError.failed) }
    }
}

/// Answers from a script, so tests can run a conversation with no model present.
public struct ScriptedTutorAI: TutorAI {
    public let pieces: [String]
    public let error: TutorAIError?
    public init(pieces: [String], error: TutorAIError? = nil) {
        self.pieces = pieces
        self.error = error
    }
    public var isAvailable: Bool { true }
    public func stream(system: String, messages: [ChatMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            for piece in pieces { continuation.yield(piece) }
            if let error { continuation.finish(throwing: error) } else { continuation.finish() }
        }
    }
}

/// A chat history as one prompt, for models whose sessions take a single prompt. A fresh
/// session each turn, rather than one kept alive, means a turn can't depend on hidden
/// session state, and behaves the same as on the web, where the history is resent.
public func flattenHistory(_ messages: [ChatMessage]) -> String {
    if messages.count == 1 { return messages[0].content }
    return messages
        .map { "\($0.role == "user" ? "Learner" : "Tutor"): \($0.content)" }
        .joined(separator: "\n")
}

/// The new text in a streamed snapshot. Apple's model reports the whole reply so far, not
/// the piece just added. A snapshot that rewrites earlier text yields nothing, because
/// what was already spoken can't be taken back.
public func streamDelta(previous: String, current: String) -> String {
    current.hasPrefix(previous) ? String(current.dropFirst(previous.count)) : ""
}

// MARK: - Prompts

public let CONVERSA_MAX_PASSAGE_CHARS = 1400
public let CONVERSA_MAX_VOCAB_TERMS = 12
public let CONVERSA_MAX_HISTORY_CHARS = 1600
public let CONVERSA_MAX_REPLY_WORDS = 30

private let TRANSCRIPT_RULE = "The learner's words come from speech recognition and may contain recognition errors. "
    + "Ignore spelling, accents, capitals and punctuation in them."
private let SOURCE_RULE = "Never quote or invent Bible verses. Use only the text given here."
private let FORMAT_RULE = "Write plain text only, with no markdown, lists or headings."

public func passageText(_ week: Week) -> String {
    var out: [String] = []
    var used = 0
    for row in verseRefs(week) {
        let size = row.t.utf16.count
        if !out.isEmpty, used + size + 1 > CONVERSA_MAX_PASSAGE_CHARS { break }
        out.append(row.t)
        used += size + 1
    }
    return out.joined(separator: "\n")
}

public func conversaOpening(_ week: Week) -> String {
    if let q = week.questions?.first?.q, !q.isEmpty { return q }
    return week.prompt.it
}

public func conversaSystem(_ week: Week, missedWords: [String] = []) -> String {
    let opening = conversaOpening(week)
    let vocab = week.vocab.prefix(CONVERSA_MAX_VOCAB_TERMS).map { "\($0.it) (\($0.en))" }.joined(separator: ", ")
    var parts = ["You are having a friendly spoken conversation in Italian with an adult learner about this week's Bible reading."]
    if !opening.isEmpty { parts.append("You began by asking the learner: \(opening)") }
    parts += [
        "Reply only in simple Italian that a beginner can follow, in at most \(CONVERSA_MAX_REPLY_WORDS) words: one or two short sentences, "
            + "ending with one simple question about the reading.",
        "If the learner makes a real grammar mistake, use the correct form naturally in your reply without pointing it out. "
            + "If what they said is correct, do not correct anything.",
        "If you can't understand them, ask them in Italian to say it again.",
        TRANSCRIPT_RULE,
        "If asked about doctrine or theology, say gently in Italian that a priest or teacher can help, then return to the reading.",
        SOURCE_RULE,
        FORMAT_RULE,
        "\nThis week's reading:\n\(passageText(week))",
    ]
    if !vocab.isEmpty { parts.append("\nWords to use when they fit: \(vocab)") }
    if !week.grammar.title.isEmpty { parts.append("\nGrammar this week: \(week.grammar.title)") }
    if !missedWords.isEmpty {
        parts.append("\nWords the learner found hard, worth using again: \(missedWords.joined(separator: ", "))")
    }
    return parts.joined(separator: "\n")
}

/// Newest turns kept within budget. Always keeps the newest turn, and starts on a learner
/// turn, the form every model's chat format expects.
public func trimHistory(_ messages: [ChatMessage], max: Int = CONVERSA_MAX_HISTORY_CHARS) -> [ChatMessage] {
    var kept: [ChatMessage] = []
    var used = 0
    for message in messages.reversed() {
        let size = message.content.utf16.count
        if !kept.isEmpty, used + size > max { break }
        kept.insert(message, at: 0)
        used += size
    }
    while kept.count > 1, kept[0].role != "user" { kept.removeFirst() }
    return kept
}

public func translatePrompt(_ text: String) -> (system: String, messages: [ChatMessage]) {
    ("Translate the Italian text into natural English. Reply with the translation only. \(FORMAT_RULE)",
     [ChatMessage(role: "user", content: text)])
}

// MARK: - Sentences from a stream

private func matches(_ text: String, _ pattern: String) -> Bool {
    text.range(of: pattern, options: .regularExpression) != nil
}

/// Removes markdown, which a voice would read out or a screen would show as stray symbols.
public func cleanReply(_ text: String) -> String {
    let lines = text.components(separatedBy: "\n").map {
        $0.replacingOccurrences(of: #"^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)"#, with: "", options: .regularExpression)
    }
    return lines.joined(separator: " ")
        .replacingOccurrences(of: "[*_`~]+", with: "", options: .regularExpression)
        .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

private func hasLetters(_ s: String) -> Bool { matches(s, #"\p{L}"#) }

/// Takes the buffer so far plus new text. Returns the sentences now complete, and what to
/// carry over. A mark only ends a sentence once whitespace follows it.
public func pushDelta(buffer: String, delta: String) -> (sentences: [String], buffer: String) {
    let chars = Array(buffer + delta)
    var sentences: [String] = []
    var start = 0
    var i = 0
    while i < chars.count {
        if ".!?;".contains(chars[i]), i + 1 < chars.count, chars[i + 1].isWhitespace {
            var end = i + 1
            while end < chars.count, chars[end].isWhitespace { end += 1 }
            let sentence = cleanReply(String(chars[start...i]))
            if hasLetters(sentence) { sentences.append(sentence) }
            start = end
            i = end
        } else {
            i += 1
        }
    }
    return (sentences, String(chars[start...]))
}

public func flushBuffer(_ buffer: String) -> [String] {
    let sentence = cleanReply(buffer)
    return hasLetters(sentence) ? [sentence] : []
}
