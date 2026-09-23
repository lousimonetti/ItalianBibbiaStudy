import Foundation

// The reader's English view state — the Swift twin of the web app's
// `ReadingPassage.jsx` view toggle, persisted under the *same* storage key
// (`italian-bible-reading-view`) in the same JSON shape, so the shared backup
// file carries a reading habit between the two clients like every other store.
//
// Three states, because a word gloss and a whole translation are different
// needs: `off` reads the Italian (with a per-verse chip to pull up one line),
// `under` puts every verse's English beneath it, and `only` reads the passage
// as English prose while the speaker still speaks the Italian.
//
// Everything here is pure so it can be tested; the SwiftUI side only renders it.

public enum ReadingEnglishMode: String, Codable, CaseIterable, Sendable {
    case off
    case under
    case only

    /// The next state in the cycle the toggle button walks through.
    public var next: ReadingEnglishMode {
        switch self {
        case .off: return .under
        case .under: return .only
        case .only: return .off
        }
    }
}

public struct ReadingViewState: Equatable, Sendable {
    public var english: ReadingEnglishMode
    /// The "Struttura" clause-skeleton overlay (see ClauseSkeleton.swift).
    /// Shared with the web reader under the same key, so turning it on in one
    /// client turns it on in the other after a backup import.
    public var skeleton: Bool

    public init(english: ReadingEnglishMode = .off, skeleton: Bool = false) {
        self.english = english
        self.skeleton = skeleton
    }

    public mutating func cycleEnglish() { english = english.next }

    public mutating func toggleSkeleton() { skeleton.toggle() }

    /// Struttura marks up the Italian, so it has nothing to show in the
    /// English-only view — the web reader hides its toggle there too.
    public var showsSkeleton: Bool { skeleton && english != .only }

    /// Decode the stored JSON string. Anything unreadable falls back to the
    /// default rather than throwing — a corrupt preference must not stop the
    /// passage from rendering.
    ///
    /// `english` was a Bool before the third state existed, and a saved `true`
    /// meant what `under` means now, so old web installs migrate rather than
    /// reset.
    public static func decode(_ json: String?) -> ReadingViewState {
        guard let json,
              let obj = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
        else { return ReadingViewState() }

        var english = ReadingEnglishMode.off
        if let s = obj["english"] as? String, let mode = ReadingEnglishMode(rawValue: s) {
            english = mode
        } else if let b = obj["english"] as? Bool {
            english = b ? .under : .off
        }
        // NSNumber bridges booleans, so read `skeleton` the same forgiving way.
        let skeleton = (obj["skeleton"] as? Bool) ?? false
        return ReadingViewState(english: english, skeleton: skeleton)
    }

    /// Encode back to the web's JSON shape. Key order is fixed so a round trip
    /// is stable and diffable.
    public func encoded() -> String {
        "{\"english\":\"\(english.rawValue)\",\"skeleton\":\(skeleton)}"
    }
}

/// True when the passage carries at least one English line — the reader offers
/// its English controls only where there is something to show.
public func passageHasEnglish(_ passage: Passage) -> Bool {
    passage.verses.contains { ($0.en?.isEmpty == false) }
}
