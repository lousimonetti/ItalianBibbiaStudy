import Foundation

// Port of src/utils/syncSnapshot.js (v1, the `.json` backup-file transport).
//
// The web PWA's "Download .json" backup is this exact structure; because the
// iOS app persists every store as a JSON *string* under the same
// `italian-bible-*` keys, a backup file exported from the web app imports
// into iOS unchanged, and vice versa. (The QR / copy-paste code transport is
// lz-string-compressed and web-only for now.)

public let SNAPSHOT_VERSION = 1

/// Device-level keys that are intentionally NOT synced.
public let SNAPSHOT_EXCLUDED_KEYS: Set<String> = ["coursekit-active-course"]

public struct SyncSnapshot: Codable, Equatable {
    public let v: Int
    public let prefix: String
    public let courseId: String
    public let exportedAt: String
    public let data: [String: String]

    public init(v: Int = SNAPSHOT_VERSION, prefix: String, courseId: String,
                exportedAt: String, data: [String: String]) {
        self.v = v
        self.prefix = prefix
        self.courseId = courseId
        self.exportedAt = exportedAt
        self.data = data
    }
}

public enum SnapshotError: LocalizedError, Equatable {
    case wrongVersion(Int)
    case wrongCourse(String)

    public var errorDescription: String? {
        switch self {
        case .wrongVersion(let v): return "Unsupported snapshot version (\(v))."
        case .wrongCourse(let id): return "This snapshot is for a different course (\(id))."
        }
    }
}

/// Mirrors validateSnapshot() — throws when the snapshot can't be applied to
/// the active course.
public func validateSnapshot(_ snapshot: SyncSnapshot, expectedPrefix: String) throws {
    guard snapshot.v == SNAPSHOT_VERSION else { throw SnapshotError.wrongVersion(snapshot.v) }
    guard snapshot.prefix == expectedPrefix else {
        throw SnapshotError.wrongCourse(snapshot.courseId.isEmpty ? snapshot.prefix : snapshot.courseId)
    }
}

/// The keys from `snapshot.data` that may be written for this course —
/// defense in depth, mirrors importSnapshot()'s filtering.
public func importableEntries(_ snapshot: SyncSnapshot, expectedPrefix: String) -> [String: String] {
    let prefix = expectedPrefix + "-"
    return snapshot.data.filter { key, _ in
        key.hasPrefix(prefix) && !SNAPSHOT_EXCLUDED_KEYS.contains(key)
    }
}
