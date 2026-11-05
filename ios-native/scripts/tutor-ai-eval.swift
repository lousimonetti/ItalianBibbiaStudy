// Runs the voice tutor's evaluation cases through Apple's on-device model, for comparison
// with Ollama on identical prompts. A development tool, deliberately outside Package.swift
// so it can't affect the app's build or minimum OS. Needs Apple Intelligence on this Mac.
//
//   node scripts/tutor-ai-eval/build-cases.mjs
//   DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer xcrun swiftc -parse-as-library \
//     ios-native/scripts/tutor-ai-eval.swift -o <scratch>/tutor-ai-eval
//   <scratch>/tutor-ai-eval scripts/tutor-ai-eval/out/cases.json scripts/tutor-ai-eval/out/results-foundation.json

import Foundation
import FoundationModels

struct Message: Decodable { let role: String; let content: String }
struct Case: Decodable { let id: String; let group: String; let system: String; let messages: [Message] }
struct Result: Encodable {
    let id: String
    let text: String
    let firstSentenceMs: Double?
    let totalMs: Double?
    let error: String?
}
struct Output: Encodable { let provider: String; let model: String; let results: [Result] }

// A fresh session per case, with the history flattened into the prompt, so a turn doesn't
// depend on the session state of the one before and matches what Ollama is sent.
func flatten(_ messages: [Message]) -> String {
    if messages.count == 1 { return messages[0].content }
    return messages.map { "\($0.role == "user" ? "Learner" : "Tutor"): \($0.content)" }.joined(separator: "\n")
}

func milliseconds(since start: ContinuousClock.Instant) -> Double {
    let d = ContinuousClock.now - start
    return Double(d.components.seconds) * 1000 + Double(d.components.attoseconds) / 1e15
}

func run(_ c: Case) async -> Result {
    let start = ContinuousClock.now
    var text = ""
    var first: Double?
    do {
        let session = LanguageModelSession(instructions: c.system)
        let options = GenerationOptions(temperature: 0.4, maximumResponseTokens: 200)
        for try await snapshot in session.streamResponse(to: flatten(c.messages), options: options) {
            text = snapshot.content
            if first == nil, text.range(of: #"[.!?](\s|$)"#, options: .regularExpression) != nil {
                first = milliseconds(since: start)
            }
        }
        return Result(id: c.id, text: text.trimmingCharacters(in: .whitespacesAndNewlines),
                      firstSentenceMs: first, totalMs: milliseconds(since: start), error: nil)
    } catch {
        return Result(id: c.id, text: text, firstSentenceMs: first, totalMs: nil, error: String(describing: error))
    }
}

@main
struct Main {
    static func main() async throws {
        let args = CommandLine.arguments
        guard args.count == 3 else {
            print("usage: tutor-ai-eval <cases.json> <results.json>")
            exit(1)
        }
        let availability = SystemLanguageModel.default.availability
        print("availability: \(availability)")
        guard case .available = availability else { exit(2) }
        print("supports Italian: \(SystemLanguageModel.default.supportsLocale(Locale(identifier: "it_IT")))")

        let cases = try JSONDecoder().decode([Case].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
        var results: [Result] = []
        for c in cases {
            let r = await run(c)
            results.append(r)
            print(r.error == nil ? ".": "x", terminator: "")
            fflush(stdout)
        }
        print("")
        let data = try JSONEncoder().encode(Output(provider: "foundation-models", model: "SystemLanguageModel.default", results: results))
        try data.write(to: URL(fileURLWithPath: args[2]))
        print(args[2])
    }
}
