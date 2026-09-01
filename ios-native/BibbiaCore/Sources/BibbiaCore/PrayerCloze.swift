import Foundation

// Recall mode for devotional texts — the iOS port of blankFor/splitOnBlank in
// src/components/DevotionsTab.jsx. Kept here rather than in the view so the
// rules are testable, and so web and iOS blank the same word in the same line.
public enum PrayerCloze {

    /// Words as the web regex sees them: letters including accents, with
    /// internal apostrophes kept so "dell'anima" is one word rather than two.
    public static func words(in line: String) -> [String] {
        var out: [String] = []
        var current = ""
        for ch in line {
            if ch.isLetter {
                current.append(ch)
            } else if (ch == "'" || ch == "\u{2019}"), !current.isEmpty {
                // Only an *internal* apostrophe continues a word — a trailing
                // one ends it, so "poi'" does not swallow the next word.
                current.append(ch)
            } else {
                if !current.isEmpty { out.append(trimApostrophes(current)); current = "" }
            }
        }
        if !current.isEmpty { out.append(trimApostrophes(current)) }
        return out.filter { !$0.isEmpty }
    }

    private static func trimApostrophes(_ s: String) -> String {
        var t = s
        while let last = t.last, last == "'" || last == "\u{2019}" { t.removeLast() }
        return t
    }

    /// The word Recall hides. Authored `blank` wins — it is chosen for
    /// grammatical payload (`sia`, `venga`), not difficulty. Otherwise fall
    /// back to the longest word, which is the web's rule.
    public static func blank(for line: PrayerLine) -> String {
        if let b = line.blank, !b.isEmpty { return b }
        return words(in: line.it).max { $0.count < $1.count } ?? ""
    }

    /// A line split into the text before the blank, the answer, and the text
    /// after — or nil when the line cannot make a fair card.
    public struct Split: Equatable {
        public let before: String
        public let answer: String
        public let after: String
    }

    public static func split(_ line: PrayerLine) -> Split? {
        let ws = words(in: line.it)
        // A one-word line ("Amen.") would blank its only word, leaving nothing
        // to recall from — that is a blank stare, not a cloze. Skip it.
        guard ws.count >= 2 else { return nil }

        let target = blank(for: line)
        guard !target.isEmpty,
              let r = line.it.range(of: target, options: .caseInsensitive)
        else { return nil }

        return Split(before: String(line.it[line.it.startIndex..<r.lowerBound]),
                     answer: String(line.it[r]),
                     after: String(line.it[r.upperBound...]))
    }

    /// Grading reuses the course-wide forgiving comparison, so Recall accepts
    /// the same near-misses as every other typed answer in the app. `articles`
    /// comes from the course locale, as everywhere else.
    public static func isCorrect(_ typed: String, for line: PrayerLine,
                                 articles: [String]) -> Bool {
        guard let s = split(line) else { return false }
        return checkAnswer(expected: s.answer, given: typed, articles: articles)
    }
}
