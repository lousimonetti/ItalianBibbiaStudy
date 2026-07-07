import Foundation

// Ports of src/utils/pronunciation.js — accent-folding normalization,
// Levenshtein distance, and the 0–100 pronunciation score.

/// Lowercase, trim, NFD-decompose, and drop combining diacritical marks
/// (U+0300–U+036F) — identical to pronunciation.js normalize().
public func normalizeText(_ s: String) -> String {
    let lowered = s.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    let decomposed = lowered.decomposedStringWithCanonicalMapping
    let kept = decomposed.unicodeScalars.filter { !(0x0300...0x036F).contains(Int($0.value)) }
    return String(String.UnicodeScalarView(kept))
}

/// Iterative Levenshtein edit distance over characters.
public func levenshtein(_ a: String, _ b: String) -> Int {
    let aChars = Array(a)
    let bChars = Array(b)
    let m = aChars.count
    let n = bChars.count
    if m == 0 { return n }
    if n == 0 { return m }

    var prev = Array(0...n)
    var curr = Array(repeating: 0, count: n + 1)
    for i in 1...m {
        curr[0] = i
        for j in 1...n {
            if aChars[i - 1] == bChars[j - 1] {
                curr[j] = prev[j - 1]
            } else {
                curr[j] = 1 + min(prev[j], curr[j - 1], prev[j - 1])
            }
        }
        swap(&prev, &curr)
    }
    return prev[n]
}

/// 0–100 similarity between the target text and a speech-recognition result.
public func scorePronunciation(target: String, recognized: String) -> Int {
    let t = normalizeText(target)
    let r = normalizeText(recognized)
    let dist = levenshtein(t, r)
    let denom = max(t.count, r.count, 1)
    return Int(((1.0 - Double(dist) / Double(denom)) * 100).rounded())
}
