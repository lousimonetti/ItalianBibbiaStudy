import Foundation
import Combine
import BibbiaCore

// Speech I/O for the voice tutor as async calls over the existing Speaker and
// SpeechRecognizer. Those switch the audio session between playback and record, so
// the mic is never open while the tutor is talking. SFSpeechRecognizer streams
// partials and never decides on its own that the learner has finished, so a short
// silence after the last partial ends the turn.
@MainActor
final class TutorVoice {
    enum Heard { case words([String]), noSpeech, micUnavailable, cancelled }

    static let silenceToFinish: TimeInterval = 1.4
    static let noSpeechLimit: TimeInterval = 8
    static let turnLimit: TimeInterval = 25

    private let recognizer = SpeechRecognizer()
    private var bag = Set<AnyCancellable>()
    private var timer: Timer?
    private var finishTurn: ((Heard) -> Void)?

    func requestMic() async -> Bool {
        guard SpeechRecognizer.isAvailable(language: Course.shared.locale.target) else { return false }
        return await recognizer.requestPermission()
    }

    func speak(_ text: String, language: String, slow: Bool) async {
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            Speaker.shared.speak(text, language: language,
                                 rate: slow ? Speaker.slowRate : Speaker.defaultRate) {
                cont.resume()
            }
        }
    }

    func listen(language: String, onDevice: Bool = false) async -> Heard {
        cancelListening()
        return await withCheckedContinuation { (cont: CheckedContinuation<Heard, Never>) in
            var finished = false
            finishTurn = { [weak self] result in
                guard !finished else { return }
                finished = true
                self?.teardown()
                cont.resume(returning: result)
            }
            recognizer.$transcript
                .dropFirst()
                .filter { !$0.isEmpty }
                .sink { [weak self] _ in self?.arm(after: Self.silenceToFinish) }
                .store(in: &bag)
            recognizer.$errorMessage
                .compactMap { $0 }
                .sink { [weak self] _ in self?.finishTurn?(.micUnavailable) }
                .store(in: &bag)
            recognizer.$isRecording
                .dropFirst()
                .filter { !$0 }
                .sink { [weak self] _ in self?.endFromRecognizer() }
                .store(in: &bag)
            recognizer.start(language: language, onDevice: onDevice)
            if let message = recognizer.errorMessage, !message.isEmpty {
                finishTurn?(.micUnavailable)
                return
            }
            arm(after: Self.noSpeechLimit)
            let limit = Timer.scheduledTimer(withTimeInterval: Self.turnLimit, repeats: false) { [weak self] _ in
                MainActor.assumeIsolated { self?.endFromRecognizer() }
            }
            limit.tolerance = 0.5
            turnLimit = limit
        }
    }

    private var turnLimit: Timer?

    private func arm(after interval: TimeInterval) {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) { [weak self] _ in
            MainActor.assumeIsolated { self?.endFromRecognizer() }
        }
    }

    private func endFromRecognizer() {
        let text = recognizer.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        finishTurn?(text.isEmpty ? .noSpeech : .words([text]))
    }

    private func teardown() {
        timer?.invalidate()
        timer = nil
        turnLimit?.invalidate()
        turnLimit = nil
        bag.removeAll()
        finishTurn = nil
        recognizer.stop()
    }

    private func cancelListening() {
        if let finish = finishTurn { finish(.cancelled) }
    }

    func cancel() {
        cancelListening()
        Speaker.shared.stop()
    }
}
