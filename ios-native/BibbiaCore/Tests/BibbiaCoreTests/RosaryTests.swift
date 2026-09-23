import XCTest
@testable import BibbiaCore

// The guided Rosary (port of src/utils/rosary.js). The fixture pins the Swift
// step list to the web's for all four sets; the rest covers the bundled course
// data and the persisted state's web-compatible JSON.

final class RosaryFixtureTests: XCTestCase {
    struct Step: Decodable {
        let kind: String
        let prayerId: String?
        let section: String
        let bead: String
        let count: String?
        let virtue: String?
        let text: String?
    }
    struct SetSteps: Decodable { let id: String; let steps: [Step] }
    struct Fixture: Decodable { let weekdays: [String]; let sets: [SetSteps] }

    private var rosary: RosaryData {
        get throws { try XCTUnwrap(Course.shared.rosary, "course.json should carry the rosary") }
    }

    func testWeekdayCycleMatchesWeb() throws {
        let fx = try loadFixture("rosary", as: Fixture.self)
        let sets = try rosary.sets
        XCTAssertEqual((0...6).map { mysterySet(forDay: $0, in: sets)?.id }, fx.weekdays)
    }

    func testStepsMatchWebForEverySet() throws {
        let fx = try loadFixture("rosary", as: Fixture.self)
        let data = try rosary
        XCTAssertEqual(fx.sets.count, data.sets.count)
        for expected in fx.sets {
            let set = try XCTUnwrap(data.sets.first { $0.id == expected.id })
            let steps = buildRosarySteps(data, set: set)
            XCTAssertEqual(steps.count, expected.steps.count, set.id)
            for (s, e) in zip(steps, expected.steps) {
                let at = "\(set.id)[\(s.index)]"
                XCTAssertEqual(s.kind.rawValue, e.kind, at)
                XCTAssertEqual(s.prayerId, e.prayerId, at)
                XCTAssertEqual(s.section.jsValue, e.section, at)
                XCTAssertEqual(s.bead.rawValue, e.bead, at)
                XCTAssertEqual(s.count.map { "\($0.n)/\($0.of)" }, e.count, at)
                XCTAssertEqual(s.virtue?.it, e.virtue, at)
                XCTAssertEqual(s.text, e.text, at)
            }
        }
    }
}

final class RosaryTests: XCTestCase {
    private var rosary: RosaryData { Course.shared.rosary! }

    func testEveryPrayedIdExistsInTheDevotions() {
        let ids = Set(Course.shared.devotionSections.flatMap { $0.prayers.map(\.id) })
        for set in rosary.sets {
            for step in buildRosarySteps(rosary, set: set) {
                if let id = step.prayerId { XCTAssertTrue(ids.contains(id), "missing devotion \(id)") }
            }
        }
    }

    func testShapeIsFiftyThreeHailMarysInSeventyNineSteps() {
        let steps = buildRosarySteps(rosary, set: rosary.sets[0])
        XCTAssertEqual(steps.count, 79)
        XCTAssertEqual(steps.filter { $0.prayerId == "ave-maria" }.count, 53)
        let tenth = steps.first { $0.section == .decade(2) && $0.count?.n == 10 }!
        XCTAssertEqual(sectionSteps(steps, of: tenth).count, 14)
    }

    func testAnnouncementAndCapitalization() {
        let dolorosi = rosary.sets.first { $0.id == "dolorosi" }!
        XCTAssertEqual(rosaryAnnouncement(dolorosi, index: 2),
                       "Nel terzo mistero doloroso si contempla la coronazione di spine.")
        XCTAssertEqual(capitalizeFirst("l'ascensione di Gesù"), "L'ascensione di Gesù")
    }

    func testJSWeekdayIsSundayZero() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let thursday = cal.date(from: DateComponents(year: 2026, month: 9, day: 24, hour: 12))!
        XCTAssertEqual(jsWeekday(thursday, calendar: cal), 4)
    }

    // MARK: state

    func testResumeOnlyCountsOnItsDay() {
        let s = RosaryState().withPosition(date: "2026-09-23", setId: "gloriosi", step: 17)
        XCTAssertEqual(s.resume(for: "2026-09-23")?.step, 17)
        XCTAssertNil(s.resume(for: "2026-09-24"))
        XCTAssertNil(s.clearingPosition().resume)
    }

    func testCompletionCountsOncePerDay() {
        var s = RosaryState().withPosition(date: "2026-09-23", setId: "gloriosi", step: 78)
        s = s.completing(on: "2026-09-23")
        XCTAssertEqual(s.completed, 1)
        XCTAssertNil(s.resume)
        XCTAssertEqual(s.completing(on: "2026-09-23").completed, 1)
        XCTAssertEqual(s.completing(on: "2026-09-24").completed, 2)
    }

    func testDecodesTheWebShapeIncludingPartialObjects() throws {
        let web = #"{"resume":{"date":"2026-09-23","setId":"luminosi","step":4},"completed":3,"last":"2026-09-22"}"#
        let s = try JSONDecoder().decode(RosaryState.self, from: Data(web.utf8))
        XCTAssertEqual(s, RosaryState(resume: RosaryResume(date: "2026-09-23", setId: "luminosi", step: 4),
                                      completed: 3, last: "2026-09-22"))
        let partial = try JSONDecoder().decode(RosaryState.self, from: Data(#"{"resume":null}"#.utf8))
        XCTAssertEqual(partial, RosaryState())
    }

    func testEncodesResumeAsExplicitNull() throws {
        let json = String(data: try JSONEncoder().encode(RosaryState()), encoding: .utf8)!
        XCTAssertTrue(json.contains(#""resume":null"#), json)
    }
}
