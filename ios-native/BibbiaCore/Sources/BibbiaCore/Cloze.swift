import Foundation

// Port of src/utils/cloze.js — build a fill-in-the-blank from a vocab term and
// its example sentence. Prefers blanking the bare content word (so the article
// stays as a gender hint), falling back to the full term. Returns nil when the
// term doesn't literally appear in the example (e.g. the example uses a
// conjugated form) — that card is not cloze-eligible.

public struct ClozeResult: Equatable {
    public let before: String
    public let answer: String
    public let after: String
}

public func makeCloze(term: String, example: String, articles: [String]) -> ClozeResult? {
    if term.isEmpty || example.isEmpty { return nil }
    let stripped = Articles.stripLeading(term, articles: articles)
        .trimmingCharacters(in: .whitespacesAndNewlines)

    let exampleChars = Array(example)
    let exampleLower = Array(example.lowercased())

    for candidate in [stripped, term] {
        if candidate.count < 2 { continue }
        let candLower = Array(candidate.lowercased())
        guard candLower.count <= exampleLower.count else { continue }
        // First case-insensitive occurrence (mirrors indexOf on lowercased strings).
        for start in 0...(exampleLower.count - candLower.count) {
            if Array(exampleLower[start..<(start + candLower.count)]) == candLower {
                return ClozeResult(
                    before: String(exampleChars[0..<start]),
                    answer: String(exampleChars[start..<(start + candLower.count)]),
                    after: String(exampleChars[(start + candLower.count)...])
                )
            }
        }
    }
    return nil
}

public func isClozeEligible(card: VocabCard, articles: [String]) -> Bool {
    makeCloze(term: card.it, example: card.ex, articles: articles) != nil
}
