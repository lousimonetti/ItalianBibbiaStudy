import Foundation
import BibbiaCore

// LanguageTool grammar check — same public HTTPS endpoint and JSON shape the
// web JournalTab uses. Intentionally online-only; the UI degrades gracefully
// when offline.

struct GrammarMatch: Decodable, Identifiable {
    struct Replacement: Decodable { let value: String }
    let message: String
    let offset: Int
    let length: Int
    let replacements: [Replacement]

    var id: String { "\(offset)-\(length)-\(message)" }
    var suggestions: [String] { replacements.prefix(3).map(\.value) }
}

enum GrammarCheck {
    struct Response: Decodable { let matches: [GrammarMatch] }

    static func check(text: String, language: String) async throws -> [GrammarMatch] {
        guard !language.isEmpty else { return [] }
        var request = URLRequest(url: URL(string: "https://api.languagetool.org/v2/check")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._* ")
        let encoded = text.addingPercentEncoding(withAllowedCharacters: allowed)?
            .replacingOccurrences(of: " ", with: "+") ?? ""
        request.httpBody = Data("text=\(encoded)&language=\(language)".utf8)
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(Response.self, from: data).matches
    }

    /// The flagged substring a match points at, for display next to the message.
    static func flaggedText(in text: String, match: GrammarMatch) -> String {
        let chars = Array(text)
        guard match.offset >= 0, match.offset + match.length <= chars.count else { return "" }
        return String(chars[match.offset..<(match.offset + match.length)])
    }
}
