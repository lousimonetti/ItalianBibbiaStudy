import Foundation

// Which installed system voice the app should speak with.
//
// The problem this solves is platform-specific and was measured, not guessed.
// `AVSpeechSynthesisVoice(language:)` — what Speaker used to call — returns the
// *default-quality* voice for a language and ignores every higher-quality voice
// the user has downloaded under Settings → Accessibility → Spoken Content →
// Voices. Those downloads are the single biggest audio-quality win available on
// an iPhone, and a native app is the only place they can be used at all: Safari
// hands web pages the compact default voice and nothing else (verified on both
// macOS and iOS — `speechSynthesis.getVoices()` returns only the two compact
// Alice tiers even when nine Italian voices are installed). So the web app
// physically cannot reach Emma or Luca, and this app can.
//
// The choice lives here rather than in Speaker so `swift test` can cover it:
// AVFoundation's voice list is whatever the CI machine happens to have
// installed, which is untestable, but the ranking over that list is pure.
public enum VoiceChoice {

    /// A system voice, reduced to just what the choice depends on.
    /// `Speaker` maps `AVSpeechSynthesisVoice` onto this.
    public struct Candidate: Equatable {
        public let identifier: String
        public let language: String
        /// 1 = default, 2 = enhanced, 3 = premium (AVSpeechSynthesisVoiceQuality).
        public let quality: Int

        public init(identifier: String, language: String, quality: Int) {
            self.identifier = identifier
            self.language = language
            self.quality = quality
        }
    }

    /// Normalize a BCP-47-ish tag: lowercase, underscores to hyphens.
    static func normalize(_ tag: String) -> String {
        tag.lowercased().replacingOccurrences(of: "_", with: "-")
    }

    /// The base language of a tag ("it" from "it-IT").
    static func baseLanguage(_ tag: String) -> String {
        let n = normalize(tag)
        return n.split(separator: "-").first.map(String.init) ?? n
    }

    /// Does `candidateLang` serve `wanted`? Exact tag, bare base, or another
    /// region of the same base ("it-CH" for a course asking for "it-IT") — the
    /// last is a deliberate fallback, since a regional Italian voice beats no
    /// upgrade at all.
    static func matches(_ candidateLang: String, wanted: String) -> Bool {
        let c = normalize(candidateLang)
        let base = baseLanguage(wanted)
        return c == normalize(wanted) || c == base || c.hasPrefix("\(base)-")
    }

    /// Voices the Settings picker should offer for `language`, best first.
    /// Unlike `best`, this keeps default-quality voices — a user explicitly
    /// choosing "Grandma" is a choice, not the accident `best` guards against.
    public static func selectable(from candidates: [Candidate],
                                  language: String) -> [Candidate] {
        let wanted = normalize(language)
        return candidates
            .filter { matches($0.language, wanted: wanted) }
            .sorted { a, b in
                if a.quality != b.quality { return a.quality > b.quality }
                return a.identifier < b.identifier
            }
    }

    /// What to speak with, given the user's Settings choice.
    ///
    /// An explicit pick wins outright — including a *downgrade*, because the
    /// user asked for it. It is honoured only when still installed and still
    /// matching the language; a stale identifier (voice deleted, course
    /// language changed) silently falls back rather than going mute. With no
    /// pick, this is exactly `best`.
    public static func resolve(selected: String?,
                               from candidates: [Candidate],
                               language: String) -> Candidate? {
        if let selected, !selected.isEmpty,
           let chosen = candidates.first(where: { $0.identifier == selected }),
           matches(chosen.language, wanted: normalize(language)) {
            return chosen
        }
        return best(from: candidates, language: language)
    }

    /// The best installed upgrade over the system default for `language`,
    /// or `nil` when there isn't one.
    ///
    /// Returning `nil` rather than "the best match" is the important part.
    /// Candidates at default quality are *not* eligible: iOS ships novelty
    /// voices (Grandma, Rocko, Flo) at exactly the same quality as Alice, so
    /// picking a default-quality voice off this list would trade the sensible
    /// system default for a joke voice. A `nil` return tells the caller to keep
    /// `AVSpeechSynthesisVoice(language:)`, which is the right answer whenever
    /// the user hasn't downloaded anything better.
    ///
    /// Ties break toward an exact language-tag match, then by identifier so the
    /// pick is stable across launches rather than following list order.
    public static func best(from candidates: [Candidate], language: String) -> Candidate? {
        let wanted = normalize(language)
        let eligible = candidates.filter { $0.quality > 1 && matches($0.language, wanted: wanted) }
        guard !eligible.isEmpty else { return nil }

        return eligible.max { a, b in
            if a.quality != b.quality { return a.quality < b.quality }
            let aExact = normalize(a.language) == wanted
            let bExact = normalize(b.language) == wanted
            if aExact != bExact { return !aExact }
            return a.identifier > b.identifier
        }
    }
}
