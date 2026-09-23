import SwiftUI
import UIKit
import BibbiaCore

// The "Struttura" marks, shared by the reader (WordGlossText) and its legend
// so the two can never disagree. Mirrors the web's .sk-* styles in index.css:
// conjugated verbs solid-underlined, the participle of a two-word verb dashed,
// a bare participle italic gold and dotted, asides on a soft tinted band in
// secondary text — readable, not faded.
enum SkeletonStyle {
    /// Gold for bare participles: #8a6508 on light (5.3:1), #d6a419 on dark.
    static let participle = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0xD6 / 255, green: 0xA4 / 255, blue: 0x19 / 255, alpha: 1)
            : UIColor(red: 0x8A / 255, green: 0x65 / 255, blue: 0x08 / 255, alpha: 1)
    })

    /// The band behind an aside. A system fill, so it adapts to dark mode and
    /// Increase Contrast without a hand-tuned pair.
    static let asideBand = Color(uiColor: .tertiarySystemFill)

    /// One token's text, styled for its role. `vocab` keeps the normal
    /// accent colour for glossed words when no skeleton is showing.
    static func text(_ s: String, mark: SkeletonToken?, vocab: Bool = false) -> Text {
        let base = Text(s)
        guard let mark else {
            return base.foregroundStyle(vocab ? Color.accentColor : Color.primary)
        }
        switch mark.role {
        case .finite:
            return base.fontWeight(.semibold).foregroundStyle(Color.accentColor)
                .underline(true, pattern: .solid, color: .accentColor)
        case .compound:
            return base.fontWeight(.semibold).foregroundStyle(Color.accentColor)
                .underline(true, pattern: .dash, color: .accentColor)
        case .participle:
            return base.italic().foregroundStyle(participle)
                .underline(true, pattern: .dot, color: participle)
        case .plain:
            // While the skeleton shows, colour means role only, so glossed
            // words drop their accent — the same choice the web reader makes.
            return base.foregroundStyle(mark.dim ? Color.secondary : Color.primary)
        }
    }
}

extension View {
    /// The aside band, applied per token so it runs continuously across the
    /// words and the spaces between them, and wraps with the line.
    @ViewBuilder
    func skeletonBand(_ on: Bool) -> some View {
        if on { background(SkeletonStyle.asideBand) } else { self }
    }
}
