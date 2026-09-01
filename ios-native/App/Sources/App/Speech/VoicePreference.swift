import Foundation
import AVFoundation
import BibbiaCore

// The user's chosen TTS voice, or nil for "automatic" (VoiceChoice picks the
// best installed one).
//
// Stored under the same `tts-voice` key the web app uses, holding the same kind
// of value — Apple's voice identifier is exactly the `voiceURI` Safari reports
// — so a backup carries the choice both ways. It degrades rather than breaks
// when it cannot be honoured: the web only ever sees compact voices, so an
// Emma Premium pick resolves to nothing there and falls back to the default,
// and likewise an unknown identifier here falls back to automatic.
enum VoicePreference {
    private static let key = "tts-voice"

    static func selected() -> String? {
        let v = WebStore.loadString(key)
        return (v?.isEmpty ?? true) ? nil : v
    }

    static func select(_ identifier: String?) {
        WebStore.saveString(key, (identifier?.isEmpty ?? true) ? nil : identifier)
    }

    /// Voices offerable for `language`, paired with a display label.
    static func options(for language: String) -> [(id: String, label: String)] {
        let byId = Dictionary(uniqueKeysWithValues:
            AVSpeechSynthesisVoice.speechVoices().map { ($0.identifier, $0) })
        return VoiceChoice.selectable(from: Speaker.installedCandidates(), language: language)
            .compactMap { candidate in
                guard let v = byId[candidate.identifier] else { return nil }
                let tier: String
                switch candidate.quality {
                case 3: tier = " (Premium)"
                case 2: tier = " (Enhanced)"
                default: tier = ""
                }
                return (id: v.identifier, label: v.name + tier)
            }
    }
}
