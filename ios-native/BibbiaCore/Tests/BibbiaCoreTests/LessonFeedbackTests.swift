import XCTest
@testable import BibbiaCore

// The seven-day strip, the praise, the run of right answers and the sound
// table, each compared with what the real JS produced.

final class WeekStripFixtureTests: XCTestCase {
    struct Scenario: Decodable {
        let store: StreakData
        let today: String
        let days: [StreakDay]
    }

    func testWeekStripMatchesWeb() throws {
        for sc in try loadFixture("weekStrip", as: [Scenario].self) {
            XCTAssertEqual(weekStrip(sc.store, today: sc.today), sc.days, "today \(sc.today), last \(sc.store.last ?? "nil")")
        }
    }
}

final class LessonFeedbackTests: XCTestCase {
    struct Fixture: Decodable {
        struct Answer: Decodable { let correct: Bool; let retry: Bool; let combo: Int; let sound: String }
        struct Note: Decodable { let freq: Double; let start: Double; let length: Double; let wave: String }
        struct Sound: Decodable { let name: String; let notes: [Note] }
        let comboMin: Int
        let praise: [String]
        let run: [Answer]
        let sounds: [Sound]
    }

    func testPraiseComboAndSoundChoiceMatchWeb() throws {
        let f = try loadFixture("lessonFeedback", as: Fixture.self)
        XCTAssertEqual(LESSON_COMBO_MIN, f.comboMin)
        XCTAssertEqual(f.praise.indices.map(lessonPraise), f.praise)
        var combo = 0
        for (i, a) in f.run.enumerated() {
            combo = nextLessonCombo(combo, correct: a.correct, retry: a.retry)
            XCTAssertEqual(combo, a.combo, "answer \(i)")
            XCTAssertEqual(LessonSound.forAnswer(correct: a.correct, combo: combo).rawValue, a.sound, "answer \(i)")
        }
    }

    func testSoundTableMatchesWeb() throws {
        let f = try loadFixture("lessonFeedback", as: Fixture.self)
        XCTAssertEqual(Set(f.sounds.map(\.name)), Set(LessonSound.allCases.map(\.rawValue)))
        for s in f.sounds {
            let sound = try XCTUnwrap(LessonSound(rawValue: s.name))
            XCTAssertEqual(sound.notes.count, s.notes.count, s.name)
            for (mine, theirs) in zip(sound.notes, s.notes) {
                XCTAssertEqual(mine.freq, theirs.freq, s.name)
                XCTAssertEqual(mine.start, theirs.start, s.name)
                XCTAssertEqual(mine.length, theirs.length, s.name)
                XCTAssertEqual(mine.wave.rawValue, theirs.wave, s.name)
            }
        }
    }

    func testEverySoundIsAShortAudibleWavFile() {
        for sound in LessonSound.allCases {
            let samples = sound.samples()
            XCTAssertLessThan(Double(samples.count) / Double(LessonSound.sampleRate), 0.8, sound.rawValue)
            XCTAssertGreaterThan(samples.map { abs(Int($0)) }.max() ?? 0, 8000, "\(sound.rawValue) is audible")
            XCTAssertLessThan(abs(Int(samples.last ?? 0)), 400, "\(sound.rawValue) ends quietly, without a click")
            let wav = sound.wavData()
            XCTAssertEqual(wav.count, 44 + samples.count * 2, sound.rawValue)
            XCTAssertEqual(String(decoding: wav.prefix(4), as: UTF8.self), "RIFF")
            XCTAssertEqual(String(decoding: wav[8..<12], as: UTF8.self), "WAVE")
        }
    }
}
