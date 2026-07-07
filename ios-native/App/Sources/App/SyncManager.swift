import Foundation
import BibbiaCore

// UserDefaults glue over BibbiaCore's SyncSnapshot — export/import the same
// v1 .json backup file the web PWA produces, so progress moves between the
// browser and this app in either direction.

enum SyncManager {
    static func exportSnapshot(course: Course) -> SyncSnapshot {
        SyncSnapshot(prefix: WebStore.prefix,
                     courseId: course.id,
                     exportedAt: ISO8601DateFormatter().string(from: Date()),
                     data: WebStore.allEntries())
    }

    static func exportFileData(course: Course) throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(exportSnapshot(course: course))
    }

    /// Parse + validate + apply a backup file. Throws a user-readable error.
    /// Caller must AppModel.reloadFromDisk() afterwards.
    @discardableResult
    static func importSnapshot(fileData: Data) throws -> Int {
        let snapshot: SyncSnapshot
        do {
            snapshot = try JSONDecoder().decode(SyncSnapshot.self, from: fileData)
        } catch {
            throw SyncImportError.notASnapshot
        }
        try validateSnapshot(snapshot, expectedPrefix: WebStore.prefix)
        let entries = importableEntries(snapshot, expectedPrefix: WebStore.prefix)
        // Replace mode (v1): clear this course's keys, then write the snapshot's.
        WebStore.removeAll()
        for (key, value) in entries {
            UserDefaults.standard.set(value, forKey: key)
        }
        return entries.count
    }
}

enum SyncImportError: LocalizedError {
    case notASnapshot

    var errorDescription: String? {
        "Not a valid sync backup file. Export one from the web app's Sync panel or this app's Settings."
    }
}
