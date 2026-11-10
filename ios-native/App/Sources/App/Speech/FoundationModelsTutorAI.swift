import Foundation
import BibbiaCore
#if canImport(FoundationModels)
import FoundationModels
#endif

// Apple's on-device model behind BibbiaCore's TutorAI protocol. It can't run in CI, so this
// stays thin wiring: everything it decides is tested through the protocol in BibbiaCore.
//
// Measured on it (plan-tutor.md): good enough for Conversa, not for grammar explanations,
// which is why the app only ever asks it for conversation.
func makeTutorAI() -> TutorAI {
    #if canImport(FoundationModels)
    return FoundationModelsTutorAI()
    #else
    return NoTutorAI()
    #endif
}

#if canImport(FoundationModels)
final class FoundationModelsTutorAI: TutorAI {
    private var warmed: LanguageModelSession?

    var isAvailable: Bool {
        let model = SystemLanguageModel.default
        guard case .available = model.availability else { return false }
        return model.supportsLocale(Locale(identifier: "it_IT"))
    }

    func warmUp(system: String) {
        let session = LanguageModelSession(instructions: system)
        session.prewarm()
        warmed = session
    }

    func stream(system: String, messages: [ChatMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    let session = LanguageModelSession(instructions: system)
                    let options = GenerationOptions(temperature: 0.4, maximumResponseTokens: 200)
                    var sent = ""
                    for try await snapshot in session.streamResponse(to: flattenHistory(messages), options: options) {
                        let piece = streamDelta(previous: sent, current: snapshot.content)
                        if !piece.isEmpty {
                            sent = snapshot.content
                            continuation.yield(piece)
                        }
                    }
                    continuation.finish()
                } catch let error as LanguageModelSession.GenerationError {
                    switch error {
                    case .guardrailViolation, .refusal:
                        continuation.finish(throwing: TutorAIError.refused)
                    default:
                        continuation.finish(throwing: TutorAIError.failed)
                    }
                } catch {
                    continuation.finish(throwing: TutorAIError.failed)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}
#endif
