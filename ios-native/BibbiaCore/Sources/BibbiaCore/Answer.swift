import Foundation

// Port of src/utils/answer.js — forgiving typed-answer matching for
// production practice (EN→IT recall, cloze, grammar drills).

private let punctuation: Set<Character> = [".", ",", ";", ":", "!", "?", "\"", "«", "»", "'", "`", "(", ")"]

/// Lowercase, fold accents, drop a leading article and punctuation so
/// "La Luce!" and "luce" compare equal. Mirrors answer.js canonical().
public func canonicalAnswer(_ s: String, articles: [String]) -> String {
    // Strip the article first (while the elided "l'" apostrophe is intact),
    // then remove any remaining punctuation.
    let normalized = normalizeText(s)
    let stripped = Articles.stripLeading(normalized, articles: articles)
    let noPunct = String(stripped.filter { !punctuation.contains($0) })
    return noPunct.trimmingCharacters(in: .whitespacesAndNewlines)
}

/// True when `given` matches `expected` exactly (after canonicalizing) or
/// within a small typo tolerance (~20% of the answer length, at least 1 edit).
public func checkAnswer(expected: String, given: String, articles: [String]) -> Bool {
    let e = canonicalAnswer(expected, articles: articles)
    let g = canonicalAnswer(given, articles: articles)
    if g.isEmpty { return false }
    if e == g { return true }
    let tolerance = max(1, Int(Double(e.count) * 0.2))
    return levenshtein(e, g) <= tolerance
}
