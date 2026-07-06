import Foundation

// Port of src/utils/it2ipa.js — rule-based Italian grapheme → IPA converter.
// Italian orthography is highly phonetic, so a broad transcription can be
// generated on the fly for words that are NOT in the vocab index
// (conjugations, names, function words). Best-effort *approximation* meant as
// a learning hint alongside the TTS audio — not a lexicon. Known limits
// (intentional, callers label the output "approx."):
//   - open/closed vowels (ɛ/e, ɔ/o) are only distinguished from accent marks;
//   - diphthongs are not glided (so "uomo"/"piede" may mis-stress);
//   - default stress is penultimate (correct for most Italian words);
//   - s/z voicing and z = /ts/ are broad regional choices.
// Output is wrapped in /…/ to match the stored vocab IPA format.

private let accentMap: [Character: String] = [
    "à": "a", "á": "a", "è": "ɛ", "é": "e", "ì": "i", "í": "i", "î": "i",
    "ò": "ɔ", "ó": "o", "ù": "u", "ú": "u", "â": "a", "ê": "e", "ô": "o", "û": "u",
]
private let plainVowels: Set<Character> = ["a", "e", "i", "o", "u"]
private let frontVowels: Set<Character> = ["e", "è", "é", "i", "ì", "í"]
private let geminating: Set<Character> = ["b", "d", "f", "l", "m", "n", "p", "r", "s", "t", "v"]
private let plainConsonants: Set<Character> = ["b", "d", "f", "k", "l", "m", "n", "p", "r", "t", "v"]

private func isVowelChar(_ c: Character?) -> Bool {
    guard let c else { return false }
    return plainVowels.contains(c) || accentMap[c] != nil
}

private func isFront(_ c: Character?) -> Bool {
    guard let c else { return false }
    return frontVowels.contains(c)
}

// Each segment is (phoneme, isVowel, hasAccentMark).
private struct Segment {
    let p: String
    let v: Bool
    let stress: Bool
}

private func toSegments(_ w: [Character]) -> [Segment] {
    var segs: [Segment] = []
    var i = 0
    let len = w.count
    func at(_ k: Int) -> Character? { k >= 0 && k < len ? w[k] : nil }
    func pushC(_ p: String) { segs.append(Segment(p: p, v: false, stress: false)) }
    func pushV(_ p: String, _ stress: Bool) { segs.append(Segment(p: p, v: true, stress: stress)) }
    func lastIsVowel() -> Bool { segs.last?.v == true }

    while i < len {
        let c = w[i]
        let n = at(i + 1)
        let n2 = at(i + 2)

        // --- trigraphs / digraphs ---
        if c == "g", n == "l", n2 == "i" {
            // "gli": ʎ. Before a vowel the i is absorbed (figlio); otherwise the
            // i is a nucleus (figli, the article "gli").
            pushC("ʎ")
            i += isVowelChar(at(i + 3)) ? 3 : 2
            continue
        }
        if c == "g", n == "n" { pushC("ɲ"); i += 2; continue }
        if c == "s", n == "c" {
            if n2 == "h" { pushC("s"); pushC("k"); i += 3; continue } // schi/sche
            if isFront(n2) {
                pushC("ʃ")
                // scia/scio/sciu -> the i is absorbed
                i += (n2 == "i" && isVowelChar(at(i + 3))) ? 3 : 2
                continue
            }
            pushC("s"); pushC("k"); i += 2; continue // sca/sco/scu/sc+cons
        }
        if c == "c", n == "c" {
            if n2 == "h" { pushC("kː"); i += 3; continue }
            if isFront(n2) {
                pushC("t"); pushC("tʃ") // geminate affricate
                i += (n2 == "i" && isVowelChar(at(i + 3))) ? 3 : 2
                continue
            }
            pushC("kː"); i += 2; continue
        }
        if c == "g", n == "g" {
            if n2 == "h" { pushC("gː"); i += 3; continue }
            if isFront(n2) {
                pushC("d"); pushC("dʒ")
                i += (n2 == "i" && isVowelChar(at(i + 3))) ? 3 : 2
                continue
            }
            pushC("gː"); i += 2; continue
        }
        if c == "c", n == "h" { pushC("k"); i += 2; continue }
        if c == "g", n == "h" { pushC("g"); i += 2; continue }

        // --- single c / g (soft before front vowels) ---
        if c == "c" {
            if n == "i", isVowelChar(n2) { pushC("tʃ"); i += 2; continue } // cia/cio/ciu
            if isFront(n) { pushC("tʃ"); i += 1; continue }
            pushC("k"); i += 1; continue
        }
        if c == "g" {
            if n == "i", isVowelChar(n2) { pushC("dʒ"); i += 2; continue } // gia/gio/giu
            if isFront(n) { pushC("dʒ"); i += 1; continue }
            pushC("g"); i += 1; continue
        }

        // --- q(u) ---
        if c == "q" {
            pushC("k")
            if n == "u" { pushC("w"); i += 2; continue }
            i += 1; continue
        }

        // --- doubled plain consonants -> geminate ---
        if let n, c == n, geminating.contains(c) {
            pushC(String(c) + "ː"); i += 2; continue
        }
        if c == "z", n == "z" { pushC("t"); pushC("ts"); i += 2; continue }

        // --- single consonants ---
        if c == "z" { pushC("ts"); i += 1; continue }
        if c == "s" {
            // intervocalic s -> voiced (broad northern norm)
            let voiced = lastIsVowel() && isVowelChar(n)
            pushC(voiced ? "z" : "s"); i += 1; continue
        }
        if c == "h" { i += 1; continue } // silent
        if plainConsonants.contains(c) { pushC(String(c)); i += 1; continue }

        // --- vowels ---
        if let mapped = accentMap[c] { pushV(mapped, true); i += 1; continue }
        if plainVowels.contains(c) { pushV(String(c), false); i += 1; continue }

        // anything else (digits, stray punctuation): pass through, non-vowel
        pushC(String(c)); i += 1
    }
    return segs
}

// Pick the stressed vowel index. An explicit accent mark wins; otherwise
// default to the penultimate vowel, falling back to the only/last vowel.
private func stressedVowelIndex(_ segs: [Segment]) -> Int {
    var vowelIdx: [Int] = []
    for (idx, s) in segs.enumerated() where s.v { vowelIdx.append(idx) }
    if vowelIdx.isEmpty { return -1 }
    if let accented = segs.firstIndex(where: { $0.v && $0.stress }) { return accented }
    if vowelIdx.count == 1 { return vowelIdx[0] }
    return vowelIdx[vowelIdx.count - 2]
}

// "muta + liquida" onset test: a stop/f (optionally geminate) before l/r.
private func isStopOrF(_ p: String) -> Bool {
    guard let first = p.first else { return false }
    guard "bpdtgkfv".contains(first) else { return false }
    return p.count == 1 || (p.count == 2 && p.hasSuffix("ː"))
}

/// Convert a single Italian word to a broad IPA transcription wrapped in /…/.
/// Returns "" for empty/whitespace input.
public func toIPA(_ word: String) -> String {
    let w = word.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    if w.isEmpty { return "" }

    let segs = toSegments(Array(w))
    if segs.isEmpty { return "" }

    let stressIdx = stressedVowelIndex(segs)

    // The stress mark sits before the syllable onset. Italian splits an
    // intervocalic cluster as coda+onset, so the onset is normally just the
    // single consonant before the stressed vowel — except a "muta + liquida"
    // cluster (stop/f + l/r) and a preceding s (str-, spr-) stay together.
    var onset = stressIdx
    if onset > 0, !segs[onset - 1].v {
        onset -= 1
        let liquid = segs[onset].p == "l" || segs[onset].p == "r"
        if liquid, onset - 1 >= 0, isStopOrF(segs[onset - 1].p) {
            onset -= 1
        }
        if onset - 1 >= 0, segs[onset - 1].p == "s" {
            onset -= 1
        }
    }

    var out = ""
    for (idx, s) in segs.enumerated() {
        if idx == onset, stressIdx != -1 { out += "ˈ" }
        out += s.p
    }
    return "/\(out)/"
}
