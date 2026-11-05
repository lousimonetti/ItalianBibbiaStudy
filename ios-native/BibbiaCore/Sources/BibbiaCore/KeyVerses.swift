import Foundation

// Ports of src/utils/spokenAnswer.js, the reading helpers in keyVerses.js, and
// verseChunks.js. Pinned to the JS by the tutor.json fixture.

/// Fold accents, case and punctuation, and collapse whitespace. Mirrors canonSpoken().
public func canonSpoken(_ s: String) -> String {
    let dropped: Set<Character> = [".", ",", ";", ":", "!", "?", "\"", "«", "»", "'", "’", "`", "(", ")"]
    let kept = String(normalizeText(s).filter { !dropped.contains($0) })
    return kept.split(whereSeparator: \.isWhitespace).joined(separator: " ")
}

private func fuzzyEqual(_ a: String, _ b: String) -> Bool {
    if a == b { return true }
    return levenshtein(a, b) <= max(1, a.count / 5)
}

/// True when the transcript satisfies an acceptable answer: a fuzzy whole match, or
/// the answer as a whole-word run inside the transcript. Mirrors matchesSpoken().
public func matchesSpoken(answers: [String], transcript: String) -> Bool {
    let t = canonSpoken(transcript)
    if t.isEmpty { return false }
    let words = t.split(separator: " ").map(String.init)
    for raw in answers {
        let a = canonSpoken(raw)
        if a.isEmpty { continue }
        if fuzzyEqual(a, t) { return true }
        let answerWords = a.split(separator: " ").map(String.init)
        if answerWords.count > words.count { continue }
        for i in 0...(words.count - answerWords.count)
        where Array(words[i..<(i + answerWords.count)]) == answerWords {
            return true
        }
    }
    return false
}

/// A week's well-formed spoken questions. Mirrors questionItems().
public func questionItems(_ week: Week) -> [SpokenQuestion] {
    (week.questions ?? []).filter { q in
        !q.q.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && q.answers.contains { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }
}

// Splits after any of `marks` when whitespace follows, keeping the mark on the left.
private func splitAfter(_ text: String, marks: Set<Character>) -> [String] {
    var out: [String] = []
    var current = ""
    var previous: Character?
    var inGap = false
    for ch in text {
        if ch.isWhitespace {
            if let previous, marks.contains(previous), !inGap {
                out.append(current)
                current = ""
                inGap = true
            } else if !inGap {
                current.append(ch)
            }
            if !inGap { previous = ch }
            continue
        }
        inGap = false
        current.append(ch)
        previous = ch
    }
    out.append(current)
    return out.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
}

public func splitSentences(_ text: String) -> [String] {
    splitAfter(text, marks: [".", "!", "?", ";"])
}

/// "Atti 22,26-28; 23,11" to one full reference per verse. Empty when unparseable.
public func expandRef(_ ref: String) -> [String] {
    let trimmed = ref.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let digit = trimmed.firstIndex(where: \.isNumber),
          digit > trimmed.startIndex,
          trimmed[trimmed.index(before: digit)].isWhitespace else { return [] }
    let book = trimmed[..<digit].trimmingCharacters(in: .whitespaces)
    var out: [String] = []
    var chapter: String?
    for raw in trimmed[digit...].split(separator: ";", omittingEmptySubsequences: false) {
        var part = raw.trimmingCharacters(in: .whitespaces)
        if let comma = part.firstIndex(of: ",") {
            chapter = part[..<comma].trimmingCharacters(in: .whitespaces)
            part = String(part[part.index(after: comma)...])
        }
        guard let chapter else { return [] }
        for seg in part.split(separator: ".", omittingEmptySubsequences: false) {
            let bounds = seg.split(separator: "-", omittingEmptySubsequences: false).map { Int($0) }
            guard let first = bounds.first, let a = first else { return [] }
            let end = (bounds.count > 1 ? bounds[1] : nil) ?? a
            if end >= a { for v in a...end { out.append("\(book) \(chapter),\(v)") } }
        }
    }
    return out
}

public struct ReadingRow: Equatable {
    public let ref: String
    public let t: String
    public let en: String
    public let id: String
    public let fullRef: String
}

/// Reading rows with a stable per-verse id. Mirrors readingLines() + verseRefs().
public func verseRefs(_ week: Week) -> [ReadingRow] {
    let trim: (String) -> String = { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    var rows: [(ref: String, t: String, en: String)] = (week.passage?.verses ?? [])
        .map { (String($0.n), trim($0.t), trim($0.en ?? "")) }
        .filter { !$0.t.isEmpty }
    let hasPassage = !rows.isEmpty
    if !hasPassage {
        var seen = Set<String>()
        for card in week.vocab {
            let ex = trim(card.ex)
            if ex.isEmpty || !seen.insert(ex.lowercased()).inserted { continue }
            rows.append(("", ex, trim(card.exEn ?? "")))
        }
    }
    let refs = hasPassage ? expandRef(week.passage?.ref ?? "") : []
    let aligned = refs.count == rows.count
    return rows.enumerated().map { i, row in
        ReadingRow(ref: row.ref, t: row.t, en: row.en,
                   id: aligned ? refs[i] : "w\(week.n):\(i + 1)",
                   fullRef: aligned ? refs[i] : "")
    }
}

// ── verseChunks.js ───────────────────────────────────────────────────────────

public let MIN_CHUNK_WORDS = 3
public let MAX_CHUNK_WORDS = 12

private func wordCount(_ s: String) -> Int { s.split(whereSeparator: \.isWhitespace).count }

private func splitHard(_ piece: String, maxWords: Int) -> [String] {
    let words = piece.split(whereSeparator: \.isWhitespace).map(String.init)
    let count = Int((Double(words.count) / Double(maxWords)).rounded(.up))
    return (0..<count).map { i in
        words[(i * words.count / count)..<((i + 1) * words.count / count)].joined(separator: " ")
    }
}

private func mergeShort(_ pieces: [String], maxWords: Int, minWords: Int) -> [String] {
    var out: [String] = []
    var carry = ""
    for piece in pieces {
        let joined = carry.isEmpty ? piece : "\(carry) \(piece)"
        if !carry.isEmpty, wordCount(joined) > maxWords {
            out.append(carry)
            carry = wordCount(piece) < minWords ? piece : ""
            if carry.isEmpty { out.append(piece) }
        } else if wordCount(joined) < minWords {
            carry = joined
        } else {
            out.append(joined)
            carry = ""
        }
    }
    if !carry.isEmpty {
        if let last = out.last, wordCount("\(last) \(carry)") <= maxWords {
            out[out.count - 1] = "\(last) \(carry)"
        } else {
            out.append(carry)
        }
    }
    return out
}

public func verseChunks(_ text: String, maxWords: Int = MAX_CHUNK_WORDS,
                        minWords: Int = MIN_CHUNK_WORDS) -> [String] {
    let pieces = splitSentences(text).flatMap { sentence -> [String] in
        if wordCount(sentence) <= maxWords { return [sentence] }
        let clauses = splitAfter(sentence, marks: [",", ":"]).flatMap { clause in
            wordCount(clause) <= maxWords ? [clause] : splitHard(clause, maxWords: maxWords)
        }
        return mergeShort(clauses, maxWords: maxWords, minWords: minWords)
    }
    return mergeShort(pieces, maxWords: maxWords, minWords: minWords)
}
