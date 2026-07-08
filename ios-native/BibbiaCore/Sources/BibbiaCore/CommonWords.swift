import Foundation

// Port of src/utils/it2en.js — the common Italian → English gloss fallback
// for words that aren't in the course vocab (function words, verb forms,
// common biblical nouns). The data is bundled as common-words.json, generated
// from the web module by ios-native/scripts/export-course-json.mjs so the two
// apps gloss from the same source of truth.

public struct CommonWords {
    private let words: [String: String]
    private let elisions: [String: String]

    public static let shared: CommonWords = {
        do { return try CommonWords.load() }
        catch { fatalError("common-words.json failed to load: \(error)") }
    }()

    // `Bundle.module` is an internal generated accessor, so it can't appear
    // as a public default argument — resolve it in the body instead.
    public static func load(bundle: Bundle? = nil) throws -> CommonWords {
        let bundle = bundle ?? Bundle.module
        guard let url = bundle.url(forResource: "common-words", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        struct Data_: Decodable { let words: [String: String]; let elisions: [String: String] }
        let decoded = try JSONDecoder().decode(Data_.self, from: Data(contentsOf: url))
        return CommonWords(words: decoded.words, elisions: decoded.elisions)
    }

    /// English gloss for a common Italian word, or nil. Tries the word
    /// exactly, then — for apostrophe'd words — an elided prefix combined
    /// with the gloss of the stem ("l'uomo" → "the man"). Mirrors
    /// lookupCommon() in it2en.js exactly (the commonGloss fixture proves it).
    public func lookup(_ word: String) -> String? {
        if word.isEmpty { return nil }
        let w = word.lowercased().replacingOccurrences(of: "’", with: "'")
        if let exact = words[w] { return exact }
        if let apos = w.firstIndex(of: "'"), apos != w.startIndex {
            if let prefix = elisions[String(w[w.startIndex..<apos])],
               let stem = words[String(w[w.index(after: apos)...])] {
                return "\(prefix) \(stem)"
            }
        }
        return nil
    }

    public var count: Int { words.count }
}
