import XCTest
@testable import BibbiaCore

final class SyncSnapshotTests: XCTestCase {
    // A backup file exactly as the web app's "Download .json" writes it.
    let webFile = """
    {
      "v": 1,
      "prefix": "italian-bible",
      "courseId": "it-bible-cei",
      "exportedAt": "2026-07-06T12:00:00.000Z",
      "data": {
        "italian-bible-progress": "{\\"1\\":true,\\"2\\":true}",
        "italian-bible-streak": "{\\"current\\":3,\\"best\\":5,\\"last\\":\\"2026-07-06\\"}",
        "italian-bible-srs": "{\\"il Verbo\\":{\\"ease\\":2.5,\\"interval\\":1,\\"reps\\":1,\\"lapses\\":0,\\"due\\":1750086400000,\\"last\\":1750000000000,\\"created\\":1750000000000}}",
        "coursekit-active-course": "it-bible-cei",
        "other-app-key": "should not import"
      }
    }
    """

    func decodeWebFile() throws -> SyncSnapshot {
        try JSONDecoder().decode(SyncSnapshot.self, from: Data(webFile.utf8))
    }

    func testDecodesTheWebBackupFileFormat() throws {
        let snap = try decodeWebFile()
        XCTAssertEqual(snap.v, 1)
        XCTAssertEqual(snap.prefix, "italian-bible")
        XCTAssertEqual(snap.data.count, 5)
        XCTAssertNoThrow(try validateSnapshot(snap, expectedPrefix: "italian-bible"))
    }

    func testImportableEntriesFilterForeignAndExcludedKeys() throws {
        let entries = importableEntries(try decodeWebFile(), expectedPrefix: "italian-bible")
        XCTAssertEqual(Set(entries.keys),
                       ["italian-bible-progress", "italian-bible-streak", "italian-bible-srs"])
    }

    func testImportedStoreStringsDecodeIntoTheSwiftModels() throws {
        let entries = importableEntries(try decodeWebFile(), expectedPrefix: "italian-bible")
        let progress = try JSONDecoder().decode(
            [String: Bool].self, from: Data(entries["italian-bible-progress"]!.utf8))
        XCTAssertEqual(progress, ["1": true, "2": true])
        let streak = try JSONDecoder().decode(
            StreakData.self, from: Data(entries["italian-bible-streak"]!.utf8))
        XCTAssertEqual(streak.current, 3)
        let srs = try JSONDecoder().decode(
            SRSStore.self, from: Data(entries["italian-bible-srs"]!.utf8))
        XCTAssertEqual(srs["il Verbo"]?.reps, 1)
    }

    func testValidationRejectsWrongVersionOrCourse() throws {
        let wrongVersion = SyncSnapshot(v: 2, prefix: "italian-bible", courseId: "it-bible-cei",
                                        exportedAt: "", data: [:])
        XCTAssertThrowsError(try validateSnapshot(wrongVersion, expectedPrefix: "italian-bible")) {
            XCTAssertEqual($0 as? SnapshotError, .wrongVersion(2))
        }
        let wrongCourse = SyncSnapshot(prefix: "other-course", courseId: "other",
                                       exportedAt: "", data: [:])
        XCTAssertThrowsError(try validateSnapshot(wrongCourse, expectedPrefix: "italian-bible")) {
            XCTAssertEqual($0 as? SnapshotError, .wrongCourse("other"))
        }
    }

    func testRoundTripPreservesEverything() throws {
        let snap = try decodeWebFile()
        let encoded = try JSONEncoder().encode(snap)
        XCTAssertEqual(try JSONDecoder().decode(SyncSnapshot.self, from: encoded), snap)
    }
}
