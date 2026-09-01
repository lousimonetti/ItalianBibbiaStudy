import SwiftUI

// A line with one span emphasised — the blank in a cloze card, or the answer
// once revealed.
//
// This used to be `Text(a) + Text(b).bold() + Text(c)`, which iOS 26 deprecates
// in favour of string interpolation. Interpolating is not safe here: the spans
// are course text, and `Text("\(before)…")` treats its argument as a
// LocalizedStringKey, so a stray `%` in a passage would be read as a format
// specifier. An AttributedString carries the styling without ever passing the
// content through a format string, and needs no availability gate.
func clozeText(before: String, answer: String, after: String,
               emphasisColor: Color = .accentColor) -> Text {
    var s = AttributedString(before)

    var mid = AttributedString(answer)
    mid.inlinePresentationIntent = .stronglyEmphasized
    mid.foregroundColor = emphasisColor
    s.append(mid)

    s.append(AttributedString(after))
    return Text(s)
}
