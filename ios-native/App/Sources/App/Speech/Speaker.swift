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
    //
    // `nonisolated` because they are used as default arguments (`rate: Float =
    // Speaker.defaultRate`), which are evaluated at the *call* site — a
    // nonisolated context. Without it the class's @MainActor isolation makes
    // that a hard error under the Swift 6 language mode. Safe: both are
    // immutable Sendable values.
    nonisolated static let defaultRate: Float = 0.45
    nonisolated static let slowRate: Float = 0.35

    override private init() {
        super.init()
        synthesizer.delegate = self
    }

    // Audio-session work is done here, off the main thread. AVAudioSession's
    // own diagnostics say why: "This method can lead to UI unresponsiveness if
    // called on the main thread" (setActive) and "...while the audio session is
    // active" (setCategory). Doing both synchronously on every tap made the
    // Prayers screen — which has a speaker button per line — visibly janky and
    // timed out the system gesture gate.
    nonisolated private static let sessionQueue = DispatchQueue(
        label: "italianbibbiastudy.speaker.audio-session", qos: .userInitiated)

    nonisolated private static func prepareSessionForPlayback() {
        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        // Only reconfigure when something else moved it — SpeechRecognizer sets
        // .record and deactivates on stop, so we cannot configure once at init
        // and forget. Re-setting the category on an already-correct active
        // session is exactly the expensive no-op Apple warns about.
        if session.category != .playback {
            try? session.setCategory(.playback, options: .duckOthers)
        }
        try? session.setActive(true, options: [])
        #endif
    }

    func speak(_ text: String, language: String, rate: Float = Speaker.defaultRate) {
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }
        speakingText = text

        // Configure the session off-main, then speak back on the main actor.
        // Only Sendable values cross the queue — AVSpeechUtterance and
        // AVSpeechSynthesisVoice are not Sendable, so the utterance is built on
        // the far side rather than captured here.
        Speaker.sessionQueue.async {
            Speaker.prepareSessionForPlayback()
            // Deliberately DispatchQueue.main, not Task { @MainActor }.
            // AVSpeechSynthesizer.speak does a forced synchronous hop
            // internally; invoking it from inside a Swift Concurrency context
            // makes the runtime warn "unsafeForcedSync called from Swift
            // Concurrent context", because that can stall a cooperative pool
            // thread. A plain main-queue dispatch is not such a context.
            // assumeIsolated is honest here: we are provably on the main queue.
            DispatchQueue.main.async {
                MainActor.assumeIsolated {
                    Speaker.shared.startUtterance(text: text, language: language, rate: rate)
                }
            }
        }
    }

    /// Begin the utterance, unless the learner has moved on. The identity guard
    /// matters because session setup is asynchronous: without it, tapping a
    /// second line while the first is still being prepared would speak both.
    private func startUtterance(text: String, language: String, rate: Float) {
        guard speakingText == text else { return }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = Speaker.voice(for: language)
        utterance.rate = rate
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
    //
    // Confirmed on device 2026-08-31: with Luca (Enhanced) and Emma (Premium)
    // downloaded, this selects com.apple.voice.premium.it-IT.Emma — the voice
    // Safari refuses to expose to the web app at all.
    /// Voices installed on this device, in the shape VoiceChoice reasons about.
    /// `nonisolated` so the Settings picker can build its list without hopping
    /// to the main actor — this only reads AVSpeechSynthesisVoice's static
    /// catalogue and returns plain value types.
    nonisolated static func installedCandidates() -> [VoiceChoice.Candidate] {
        AVSpeechSynthesisVoice.speechVoices().map {
            VoiceChoice.Candidate(identifier: $0.identifier,
                                  language: $0.language,
                                  quality: qualityRank($0.quality))
        }
    }

    // Resolving a voice means enumerating every installed voice, which is far
    // too costly to redo on each tap — a prayer renders one speaker button per
    // line. Cached against the language and the user's Settings pick, so a
    // changed preference still takes effect immediately.
    private static var voiceCache: [String: AVSpeechSynthesisVoice] = [:]

    static func voice(for language: String) -> AVSpeechSynthesisVoice? {
        let selected = VoicePreference.selected()
        let key = "\(language)|\(selected ?? "auto")"
        if let cached = voiceCache[key] { return cached }

        let picked = VoiceChoice.resolve(selected: selected,
                                         from: installedCandidates(),
                                         language: language)
        let resolved = picked.flatMap { AVSpeechSynthesisVoice(identifier: $0.identifier) }
            ?? AVSpeechSynthesisVoice(language: language)
        if let resolved { voiceCache[key] = resolved }
        return resolved
    }

    /// Drop the cache when the device's installed voices may have changed.
    static func invalidateVoiceCache() { voiceCache.removeAll() }

    nonisolated private static func qualityRank(_ quality: AVSpeechSynthesisVoiceQuality) -> Int {
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
