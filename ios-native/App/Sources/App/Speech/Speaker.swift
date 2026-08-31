import Foundation
import AVFoundation
import SwiftUI
import BibbiaCore

// AVSpeechSynthesizer wrapper — the native replacement for the web app's
// SpeakerButton over window.speechSynthesis. The utterance language comes
// from the course locale (it-IT for the bundled course); `rate` mirrors the
// web component's optional rate prop (default slightly slowed for learners,
// slower still for Listening practice).

@MainActor
final class Speaker: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    static let shared = Speaker()

    @Published private(set) var speakingText: String?

    private let synthesizer = AVSpeechSynthesizer()

    // AVSpeechUtteranceDefaultSpeechRate ≈ 0.5; these approximate the web
    // app's 0.85× (default) and 0.6× (slow listening) of normal speed.
    static let defaultRate: Float = 0.45
    static let slowRate: Float = 0.35

    override private init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String, language: String, rate: Float = Speaker.defaultRate) {
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setCategory(.playback, options: .duckOthers)
        try? AVAudioSession.sharedInstance().setActive(true, options: [])
        #endif
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = Speaker.voice(for: language)
        utterance.rate = rate
        speakingText = text
        synthesizer.speak(utterance)
    }

    // Use the best voice the user has actually installed, not just the system
    // default. `AVSpeechSynthesisVoice(language:)` ignores Enhanced and Premium
    // voices downloaded under Settings → Accessibility → Spoken Content →
    // Voices; those are the biggest available jump in audio quality, and this
    // app is the only place they can be used — Safari exposes just the compact
    // default voice to web pages, so the web build cannot reach them at all.
    //
    // The ranking is VoiceChoice in BibbiaCore so it is unit-tested; a nil
    // result means nothing better than the default is installed, in which case
    // the original call is exactly right.
    static func voice(for language: String) -> AVSpeechSynthesisVoice? {
        let installed = AVSpeechSynthesisVoice.speechVoices().map {
            VoiceChoice.Candidate(identifier: $0.identifier,
                                  language: $0.language,
                                  quality: qualityRank($0.quality))
        }
        if let best = VoiceChoice.best(from: installed, language: language),
           let voice = AVSpeechSynthesisVoice(identifier: best.identifier) {
            return voice
        }
        return AVSpeechSynthesisVoice(language: language)
    }

    private static func qualityRank(_ quality: AVSpeechSynthesisVoiceQuality) -> Int {
        switch quality {
        case .premium: return 3
        case .enhanced: return 2
        default: return 1
        }
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
        speakingText = nil
    }

    func isSpeaking(_ text: String) -> Bool { speakingText == text }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.speakingText = nil }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.speakingText = nil }
    }
}

/// Tap to hear `text`; tap again to stop. Mirrors the web SpeakerButton.
struct SpeakerButton: View {
    let text: String
    var rate: Float = Speaker.defaultRate
    var compact = false

    @EnvironmentObject private var model: AppModel
    @ObservedObject private var speaker = Speaker.shared

    private var isSpeaking: Bool { speaker.isSpeaking(text) }

    var body: some View {
        Button {
            if isSpeaking {
                speaker.stop()
            } else {
                speaker.speak(text, language: model.ttsLanguage, rate: rate)
            }
        } label: {
            Image(systemName: isSpeaking ? "stop.circle.fill" : "speaker.wave.2.fill")
                .imageScale(compact ? .small : .medium)
                .foregroundStyle(isSpeaking ? Color.red : Color.accentColor)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isSpeaking ? "Stop audio" : "Hear \(text)")
    }
}
