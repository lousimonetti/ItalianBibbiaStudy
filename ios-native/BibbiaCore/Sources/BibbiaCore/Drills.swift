import Foundation

// Ports of src/utils/grammarDrill.js and src/utils/comprehension.js —
// helpers for the per-week fill-in-the-blank drills (O3) and the reading
// comprehension checks (O5).

public struct BlankSplit: Equatable {
    public let before: String
    public let after: String
}

/// Split a drill question at its `___` blank (2+ underscores) so the UI can
/// render an inline input. `after` is empty when there is no blank — degrade
/// by appending the input at the end. Mirrors splitBlank().
public func splitBlank(_ q: String) -> BlankSplit {
    let chars = Array(q)
    var i = 0
    while i < chars.count {
        if chars[i] == "_", i + 1 < chars.count, chars[i + 1] == "_" {
            var end = i
            while end < chars.count, chars[end] == "_" { end += 1 }
            return BlankSplit(before: String(chars[0..<i]), after: String(chars[end...]))
        }
        i += 1
    }
    return BlankSplit(before: q, after: "")
}

/// A week's drills, dropping malformed items. Mirrors drillItems().
public func drillItems(_ week: Week) -> [DrillItem] {
    (week.drill ?? []).filter { !$0.a.trimmingCharacters(in: .whitespaces).isEmpty }
}

/// A week's comprehension checks, dropping malformed items.
public func comprehensionItems(_ week: Week) -> [ComprehensionItem] {
    (week.comprehension ?? []).filter(isValidComprehensionItem)
}

public func isValidComprehensionItem(_ item: ComprehensionItem) -> Bool {
    if item.it.trimmingCharacters(in: .whitespaces).isEmpty { return false }
    if item.type == "tf" { return item.answerBool != nil }
    if item.type == "mc" {
        guard let options = item.options, options.count >= 2,
              let answer = item.answerIndex else { return false }
        return answer >= 0 && answer < options.count
    }
    return false
}

public enum ComprehensionResponse: Equatable {
    case bool(Bool)
    case index(Int)
}

/// Is the learner's response correct? Mirrors isCorrect().
public func isComprehensionCorrect(_ item: ComprehensionItem, response: ComprehensionResponse) -> Bool {
    guard isValidComprehensionItem(item) else { return false }
    switch (item.type, response) {
    case ("tf", .bool(let b)): return b == item.answerBool
    case ("mc", .index(let i)): return i == item.answerIndex
    default: return false
    }
}
