import Foundation

// Port of the LEADING_ARTICLE matcher from src/utils/locale.js.
//
// The web app builds a regex `^(gli\s+|un['’]|il\s+|…)` from the course's
// article list — longest article first, elided articles ("l'", "un'") matching
// with no following space, the rest requiring trailing whitespace. This is the
// same matcher expressed as prefix scanning.

public enum Articles {
    /// The active course's article list (lowercase), longest first.
    public static func sorted(_ articles: [String]) -> [String] {
        articles.sorted { $0.count > $1.count }
    }

    /// Returns the number of characters the leading-article match consumes at
    /// the start of `s` (article + trailing whitespace / apostrophe), or 0 when
    /// no article matches. Case-insensitive, like the `i` regex flag.
    public static func leadingMatchLength(_ s: String, articles: [String]) -> Int {
        guard !articles.isEmpty else { return 0 }
        let chars = Array(s.lowercased())
        for article in sorted(articles) {
            let a = article.lowercased()
            if a.hasSuffix("'") || a.hasSuffix("’") {
                // Elided article: stem + either apostrophe form, no space needed.
                let stem = Array(a.dropLast())
                guard chars.count > stem.count else { continue }
                if Array(chars.prefix(stem.count)) == stem {
                    let next = chars[stem.count]
                    if next == "'" || next == "’" {
                        return stem.count + 1
                    }
                }
            } else {
                // Plain article: must be followed by 1+ whitespace (all consumed).
                let stem = Array(a)
                guard chars.count > stem.count else { continue }
                if Array(chars.prefix(stem.count)) == stem, chars[stem.count].isWhitespace {
                    var end = stem.count
                    while end < chars.count, chars[end].isWhitespace { end += 1 }
                    return end
                }
            }
        }
        return 0
    }

    /// `s` with a leading article removed (mirrors `.replace(LEADING_ARTICLE, '')`).
    /// Does NOT trim the remainder — callers trim where the JS does.
    public static func stripLeading(_ s: String, articles: [String]) -> String {
        let n = leadingMatchLength(s, articles: articles)
        return n > 0 ? String(s.dropFirst(n)) : s
    }
}
