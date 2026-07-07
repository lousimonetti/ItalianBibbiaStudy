import Foundation
import UserNotifications
import BibbiaCore

// Daily study reminder via UNUserNotificationCenter — a real scheduled local
// notification, which the web PWA could only approximate while open. The
// enabled/hour prefs persist under the same `italian-bible-reminders` key
// family; the pure gating logic (shouldNotify) lives in BibbiaCore.

enum ReminderScheduler {
    static let identifier = "daily-study-reminder"

    static func requestPermission() async -> Bool {
        (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    /// Schedule (or reschedule) the repeating daily reminder.
    static func schedule(hour: Int, brandName: String) async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [identifier])

        let content = UNMutableNotificationContent()
        content.title = brandName
        content.body = "Non hai ancora studiato oggi — a few minutes keeps the streak alive. 🔥"
        content.sound = .default

        var components = DateComponents()
        components.hour = hour
        components.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        try? await center.add(request)
    }

    static func cancel() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: [identifier])
    }
}
