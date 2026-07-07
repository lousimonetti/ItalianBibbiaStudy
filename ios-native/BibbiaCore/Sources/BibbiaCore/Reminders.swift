import Foundation

// Port of src/utils/reminders.js — the pure decision for the local daily
// study reminder. On iOS the app also schedules a real UNUserNotificationCenter
// notification (something the web PWA cannot do), but the in-app nudge logic
// stays identical and unit-tested.

public let DEFAULT_REMINDER_HOUR = 19  // 7pm

public struct ReminderPrefs: Codable, Equatable {
    public var enabled: Bool
    public var hour: Int?
    public var permissionGranted: Bool
    public var lastNotified: String?   // "YYYY-MM-DD"

    public init(enabled: Bool = false, hour: Int? = nil,
                permissionGranted: Bool = false, lastNotified: String? = nil) {
        self.enabled = enabled
        self.hour = hour
        self.permissionGranted = permissionGranted
        self.lastNotified = lastNotified
    }
}

/// Should we fire the reminder right now? Mirrors shouldNotify().
public func shouldNotify(prefs: ReminderPrefs?,
                         now: Date = Date(),
                         studiedToday: Bool,
                         today: String,
                         calendar: Calendar = .current) -> Bool {
    guard let prefs, prefs.enabled else { return false }
    guard prefs.permissionGranted else { return false }
    if studiedToday { return false }
    if let lastNotified = prefs.lastNotified, lastNotified == today { return false }
    let hour = prefs.hour ?? DEFAULT_REMINDER_HOUR
    return calendar.component(.hour, from: now) >= hour
}
