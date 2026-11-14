import Foundation

// Port of src/utils/lessonFeedback.js and the note table of src/utils/sfx.js —
// the small decisions that make a lesson feel alive: which word of praise, how
// long the run of right answers is, and which sound an answer earns. Pinned to
// the JS by the lessonFeedback.json fixture, so a change there must be made here.

/// Praise for a right answer, varied by where the step sits in the lesson so
/// the same word is not repeated down the screen.
public let LESSON_PRAISE = ["Giusto!", "Esatto!", "Ottimo!", "Benissimo!", "Perfetto!"]

public func lessonPraise(_ index: Int) -> String {
    let n = LESSON_PRAISE.count
    return LESSON_PRAISE[((index % n) + n) % n]
}

/// A run of this many first-try answers in a row is called out.
public let LESSON_COMBO_MIN = 3

/// The run after an answer: one longer for a right first try; a miss, or a
/// step that has come back for its retry, ends it.
public func nextLessonCombo(_ combo: Int, correct: Bool, retry: Bool = false) -> Int {
    correct && !retry ? combo + 1 : 0
}

/// The short sounds a lesson plays. Each is a list of notes, synthesised at
/// run time, so there are no audio files to bundle.
public enum LessonSound: String, CaseIterable {
    case correct, wrong, match, combo, done

    public enum Wave: String { case sine, triangle }

    public struct Note: Equatable {
        public let freq: Double
        public let start: Double
        public let length: Double
        public let wave: Wave
    }

    public var notes: [Note] {
        func n(_ f: Double, _ s: Double, _ l: Double, _ w: Wave = .sine) -> Note {
            Note(freq: f, start: s, length: l, wave: w)
        }
        switch self {
        case .correct: return [n(659.25, 0, 0.09), n(987.77, 0.08, 0.14)]
        case .wrong: return [n(196, 0, 0.12, .triangle), n(155.56, 0.1, 0.2, .triangle)]
        case .match: return [n(880, 0, 0.07)]
        case .combo: return [n(659.25, 0, 0.08), n(830.61, 0.07, 0.08), n(1318.5, 0.14, 0.18)]
        case .done: return [n(523.25, 0, 0.12), n(659.25, 0.11, 0.12), n(783.99, 0.22, 0.12), n(1046.5, 0.33, 0.3)]
        }
    }

    /// The sound an answer earns, given the run *after* it (mirrors soundFor()).
    public static func forAnswer(correct: Bool, combo: Int) -> LessonSound {
        if !correct { return .wrong }
        return combo >= LESSON_COMBO_MIN && combo % LESSON_COMBO_MIN == 0 ? .combo : .correct
    }

    public static let sampleRate = 22_050

    /// The sound as 16-bit mono samples. Each note has a fast attack and an
    /// exponential tail, so notes do not click.
    public func samples(sampleRate: Int = LessonSound.sampleRate) -> [Int16] {
        let rate = Double(sampleRate)
        let total = notes.map { $0.start + $0.length }.max() ?? 0
        var mix = [Double](repeating: 0, count: Int((total + 0.02) * rate))
        let attack = 0.012
        for note in notes {
            let from = Int(note.start * rate)
            let count = Int(note.length * rate)
            for i in 0..<count where from + i < mix.count {
                let t = Double(i) / rate
                let phase = (note.freq * t).truncatingRemainder(dividingBy: 1)
                let wave: Double
                switch note.wave {
                case .sine: wave = sin(2 * .pi * phase)
                case .triangle: wave = 4 * abs(phase - 0.5) - 1
                }
                let envelope = t < attack
                    ? t / attack
                    : pow(0.001, (t - attack) / max(note.length - attack, 0.001))
                mix[from + i] += wave * envelope
            }
        }
        // Overlapping notes can sum past full scale; the clamp keeps them in range.
        return mix.map { Int16((max(-1, min(1, $0 * 0.6)) * Double(Int16.max)).rounded()) }
    }

    /// The sound as a complete WAV file, ready for an audio player.
    public func wavData(sampleRate: Int = LessonSound.sampleRate) -> Data {
        let pcm = samples(sampleRate: sampleRate)
        let dataSize = UInt32(pcm.count * 2)
        var data = Data()
        func put32(_ v: UInt32) { withUnsafeBytes(of: v.littleEndian) { data.append(contentsOf: $0) } }
        func put16(_ v: UInt16) { withUnsafeBytes(of: v.littleEndian) { data.append(contentsOf: $0) } }
        data.append(contentsOf: Array("RIFF".utf8)); put32(36 + dataSize)
        data.append(contentsOf: Array("WAVE".utf8))
        data.append(contentsOf: Array("fmt ".utf8)); put32(16)
        put16(1); put16(1)                               // PCM, mono
        put32(UInt32(sampleRate)); put32(UInt32(sampleRate * 2))
        put16(2); put16(16)                              // block align, bits per sample
        data.append(contentsOf: Array("data".utf8)); put32(dataSize)
        for s in pcm { put16(UInt16(bitPattern: s)) }
        return data
    }
}
