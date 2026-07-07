import Foundation

// Port of src/utils/vocabIndex.js — O(1) lookup of any Italian word to its
// vocab gloss ({ it, en, ipa }), reachable by the full term and its
// article-stripped stem (so "il Verbo" is found as "verbo"), plus the
// word/non-word tokenizer that preserves the original text exactly.

public struct VocabGloss: Equatable {
    public let it: String
    public let en: String
    public let ipa: String
}

public final class VocabIndex {
    private var index: [String: VocabGloss] = [:]
    private let articles: [String]

    /// Build once from the course. First write wins, so the earliest
    /// (lowest-week) gloss is the canonical one for a repeated word.
    public init(course: Course) {
        self.articles = course.locale.articles
        for phase in course.phases {
            for week in phase.weeks {
                for card in week.vocab {
                    let gloss = VocabGloss(it: card.it, en: card.en, ipa: card.ipa ?? "")
                    add(card.it, gloss)
                    let cleaned = clean(card.it)
                    let stripped = stripArticle(cleaned)
                    if !stripped.isEmpty, stripped != cleaned {
                        add(stripped, gloss)
                    }
                }
            }
        }
    }

    private func clean(_ s: String) -> String {
        s.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func stripArticle(_ s: String) -> String {
        Articles.stripLeading(s, articles: articles)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func add(_ key: String, _ val: VocabGloss) {
        let k = clean(key)
        if !k.isEmpty, index[k] == nil { index[k] = val }
    }

    /// Look up a single word/token. Tries the word as-is, then with any
    /// leading article stripped (so "l'unzione" and "unzione" both resolve).
    public func lookup(_ word: String) -> VocabGloss? {
        if word.isEmpty { return nil }
        let w = clean(word)
        return index[w] ?? index[stripArticle(w)]
    }

    public var count: Int { index.count }
}

public struct TextToken: Equatable {
    public let text: String
    public let isWord: Bool
}

// Mirrors the JS tokenizer's [A-Za-zÀ-ÿ] word-character class.
private func isWordChar(_ c: Character) -> Bool {
    guard let scalar = c.unicodeScalars.first, c.unicodeScalars.count == 1 else { return false }
    let v = scalar.value
    return (0x41...0x5A).contains(v) || (0x61...0x7A).contains(v) || (0xC0...0xFF).contains(v)
}

/// Split an Italian string into word / non-word tokens, preserving every
/// character so the original text can be reconstructed exactly. A "word"
/// keeps internal apostrophes (l'unzione, dov'è) as a single token.
public func tokenize(_ text: String) -> [TextToken] {
    var tokens: [TextToken] = []
    let chars = Array(text)
    var i = 0
    var pendingStart = 0

    while i < chars.count {
        if isWordChar(chars[i]) {
            if i > pendingStart {
                tokens.append(TextToken(text: String(chars[pendingStart..<i]), isWord: false))
            }
            var end = i
            while end < chars.count {
                if isWordChar(chars[end]) {
                    end += 1
                } else if (chars[end] == "'" || chars[end] == "’"),
                          end + 1 < chars.count, isWordChar(chars[end + 1]) {
                    end += 1  // internal apostrophe followed by a letter
                } else {
                    break
                }
            }
            tokens.append(TextToken(text: String(chars[i..<end]), isWord: true))
            i = end
            pendingStart = end
        } else {
            i += 1
        }
    }
    if pendingStart < chars.count {
        tokens.append(TextToken(text: String(chars[pendingStart...]), isWord: false))
    }
    return tokens
}
