import Foundation

// Port of src/utils/dictogloss.js — reconstruction scoring (O4). The learner
// hears a sentence and types what they remember; compare at the word level,
// order-independent (a recovered word counts even if misplaced) — dictogloss
// rewards gist + form, not verbatim dictation.

private let punctuation: Set<Character> = [".", ",", ";", ":", "!", "?", "\"", "«", "»", "'", "`", "(", ")"]

// Word key: lowercase, fold accents, drop punctuation. Internal apostrophes
// fold out so "l'acqua" → "lacqua" matches forgivingly.
private func wordKey(_ w: String) -> String {
    String(normalizeText(w).filter { !punctuation.contains($0) })
}

public func tokenizeWords(_ text: String) -> [String] {
    text.split(whereSeparator: { $0.isWhitespace })
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .filter { !$0.isEmpty }
}

private func counts(_ words: [String]) -> [String: Int] {
    var m: [String: Int] = [:]
    for w in words {
        let k = wordKey(w)
        if k.isEmpty { continue }
        m[k, default: 0] += 1
    }
    return m
}

public struct WordMark: Equatable {
    public let w: String
    public let ok: Bool
}

public struct ReconstructionDiff: Equatable {
    public let original: [WordMark]   // each original word, ok = recovered
    public let attempt: [WordMark]    // each typed word, ok = matched an original
    public let score: Int             // 0–100 fraction of original words recovered
}

public func diffReconstruction(original: String, attempt: String) -> ReconstructionDiff {
    let origWords = tokenizeWords(original)
    let attWords = tokenizeWords(attempt)

    // Greedy multiset matching so duplicates are handled (e.g. two "la"s).
    var attRemaining = counts(attWords)
    let origMarks = origWords.map { w -> WordMark in
        let k = wordKey(w)
        if !k.isEmpty, let have = attRemaining[k], have > 0 {
            attRemaining[k] = have - 1
            return WordMark(w: w, ok: true)
        }
        return WordMark(w: w, ok: false)
    }

    var origRemaining = counts(origWords)
    let attMarks = attWords.map { w -> WordMark in
        let k = wordKey(w)
        if !k.isEmpty, let have = origRemaining[k], have > 0 {
            origRemaining[k] = have - 1
            return WordMark(w: w, ok: true)
        }
        return WordMark(w: w, ok: false)
    }

    let recovered = origMarks.filter(\.ok).count
    let score = origWords.isEmpty ? 0
        : Int((Double(recovered) / Double(origWords.count) * 100).rounded())

    return ReconstructionDiff(original: origMarks, attempt: attMarks, score: score)
}
