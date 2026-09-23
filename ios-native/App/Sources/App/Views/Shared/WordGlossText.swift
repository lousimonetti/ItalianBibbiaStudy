import SwiftUI
import BibbiaCore

// Native counterpart of the web WordGloss/GlossPopover: renders an Italian
// string with every word tappable. Vocab words get their stored gloss + IPA;
// any other word gets a common-words English gloss (CommonWords — the port
// of the web's it2en.js) when known, plus an auto-generated approximate IPA
// (flagged ≈) — the same graceful degradation as the web app. Uses a simple
// flow Layout (iOS 16) so tappable words wrap like normal text.

struct WordGlossText: View {
    let text: String
    /// Optional Struttura markup (`analyzeClauses(text).tokens`). Indices line
    /// up with `tokenize(text)` because the analyzer tokenizes the same way.
    var roles: [SkeletonToken]? = nil

    @EnvironmentObject private var model: AppModel
    @State private var selected: SelectedWord?

    private struct SelectedWord: Identifiable {
        let word: String
        var id: String { word }
    }

    var body: some View {
        let tokens = tokenize(text)
        let marks = roles?.count == tokens.count ? roles : nil
        FlowLayout(spacing: 0) {
            ForEach(Array(tokens.enumerated()), id: \.offset) { i, token in
                let mark = marks?[i]
                if token.isWord {
                    SkeletonStyle.text(token.text, mark: mark,
                                       vocab: model.vocabIndex.lookup(token.text) != nil)
                        .skeletonBand(mark?.dim == true)
                        .onTapGesture { selected = SelectedWord(word: token.text) }
                } else {
                    Text(token.text)
                        .skeletonBand(mark?.dim == true)
                }
            }
        }
        .sheet(item: $selected) { sel in
            GlossSheet(word: sel.word)
                .presentationDetents([.height(230)])
                .presentationDragIndicator(.visible)
        }
    }
}

private struct GlossSheet: View {
    let word: String
    @EnvironmentObject private var model: AppModel

    var body: some View {
        let gloss = model.vocabIndex.lookup(word)
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(gloss?.it ?? word)
                    .font(.title2.bold())
                SpeakerButton(text: gloss?.it ?? word)
                Spacer()
            }
            if let gloss {
                Text(gloss.en)
                    .font(.headline)
                    .foregroundStyle(.secondary)
                if model.course.locale.hasIPA, !gloss.ipa.isEmpty {
                    Text(gloss.ipa)
                        .font(.body.monospaced())
                }
            } else {
                // Not in the vocab — common-words gloss when known, plus
                // best-effort IPA marked approximate.
                if let common = CommonWords.shared.lookup(word) {
                    Text(common)
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
                if model.course.locale.hasIPA {
                    Text("≈ \(toIPA(word))")
                        .font(.body.monospaced())
                    Text("Approximate pronunciation — tap the speaker for audio.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Minimal left-to-right wrapping layout for the tappable word runs.
struct FlowLayout: Layout {
    var spacing: CGFloat = 0

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, maxX: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > width {
                x = 0
                y += rowHeight
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
            maxX = max(maxX, x)
        }
        return CGSize(width: width == .infinity ? maxX : width, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > bounds.minX, x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), anchor: .topLeading,
                          proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
