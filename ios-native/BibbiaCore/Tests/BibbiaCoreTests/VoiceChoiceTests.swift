import XCTest
@testable import BibbiaCore

// The voice list on a real device is whatever the user has downloaded, so these
// fixtures mirror the two cases that actually occur: a stock phone (Alice only,
// default quality) and the reporter's phone (Luca enhanced + Emma premium
// downloaded, which Safari refused to expose and this app must use).
final class VoiceChoiceTests: XCTestCase {

    private let alice = VoiceChoice.Candidate(
        identifier: "com.apple.voice.compact.it-IT.Alice", language: "it-IT", quality: 1)
    private let luca = VoiceChoice.Candidate(
        identifier: "com.apple.voice.enhanced.it-IT.Luca", language: "it-IT", quality: 2)
    private let emma = VoiceChoice.Candidate(
        identifier: "com.apple.voice.premium.it-IT.Emma", language: "it-IT", quality: 3)
    private let rocko = VoiceChoice.Candidate(
        identifier: "com.apple.voice.compact.it-IT.Rocko", language: "it-IT", quality: 1)
    private let samantha = VoiceChoice.Candidate(
        identifier: "com.apple.voice.premium.en-US.Samantha", language: "en-US", quality: 3)

    func testPrefersPremiumOverEnhancedOverDefault() {
        let best = VoiceChoice.best(from: [alice, luca, emma], language: "it-IT")
        XCTAssertEqual(best, emma)
    }

    func testFallsBackToEnhancedWhenNoPremiumInstalled() {
        XCTAssertEqual(VoiceChoice.best(from: [alice, luca], language: "it-IT"), luca)
    }

    // The whole reason `best` returns an Optional: a stock phone must keep the
    // system default rather than being handed an arbitrary equal-quality voice.
    func testReturnsNilWhenOnlyDefaultQualityIsInstalled() {
        XCTAssertNil(VoiceChoice.best(from: [alice], language: "it-IT"))
    }

    // iOS ships novelty voices at default quality. Picking one over Alice would
    // be a regression, so they must never be eligible.
    func testNeverPicksANoveltyVoiceOverTheSystemDefault() {
        XCTAssertNil(VoiceChoice.best(from: [alice, rocko], language: "it-IT"))
    }

    func testIgnoresOtherLanguages() {
        XCTAssertNil(VoiceChoice.best(from: [alice, samantha], language: "it-IT"))
        XCTAssertEqual(VoiceChoice.best(from: [emma, samantha], language: "en-US"), samantha)
    }

    func testMatchesUnderscoreAndCaseVariantTags() {
        let odd = VoiceChoice.Candidate(
            identifier: "x", language: "it_it", quality: 3)
        XCTAssertEqual(VoiceChoice.best(from: [odd], language: "IT-it"), odd)
    }

    func testMatchesBareBaseLanguage() {
        let bare = VoiceChoice.Candidate(identifier: "bare", language: "it", quality: 2)
        XCTAssertEqual(VoiceChoice.best(from: [bare], language: "it-IT"), bare)
    }

    // A regional voice is a real upgrade when nothing matches the exact tag.
    func testAcceptsAnotherRegionOfTheSameLanguage() {
        let swiss = VoiceChoice.Candidate(identifier: "ch", language: "it-CH", quality: 3)
        XCTAssertEqual(VoiceChoice.best(from: [alice, swiss], language: "it-IT"), swiss)
    }

    func testPrefersExactTagOverAnotherRegionAtEqualQuality() {
        let swiss = VoiceChoice.Candidate(identifier: "ch", language: "it-CH", quality: 3)
        XCTAssertEqual(VoiceChoice.best(from: [swiss, emma], language: "it-IT"), emma)
    }

    // Stable across launches: the pick must not depend on list order.
    func testIsIndependentOfCandidateOrder() {
        let forward = VoiceChoice.best(from: [alice, luca, emma], language: "it-IT")
        let backward = VoiceChoice.best(from: [emma, luca, alice], language: "it-IT")
        XCTAssertEqual(forward, backward)
    }

    func testTieBreaksDeterministicallyBetweenTwoPremiumVoices() {
        let a = VoiceChoice.Candidate(identifier: "aaa", language: "it-IT", quality: 3)
        let z = VoiceChoice.Candidate(identifier: "zzz", language: "it-IT", quality: 3)
        XCTAssertEqual(VoiceChoice.best(from: [a, z], language: "it-IT"),
                       VoiceChoice.best(from: [z, a], language: "it-IT"))
    }

    func testHandlesAnEmptyVoiceList() {
        XCTAssertNil(VoiceChoice.best(from: [], language: "it-IT"))
    }
}
