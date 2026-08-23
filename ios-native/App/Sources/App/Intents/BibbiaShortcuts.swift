import AppIntents

// Phrases that work with no user setup — the whole point of AppShortcuts
// (plan-siri.md, I1). Siri needs the app name in the phrase, so every entry
// interpolates .applicationName.
//
// Availability: AppShortcut gained shortTitle/systemImageName in iOS 16.4, so
// the provider is gated there while the intents themselves stay iOS 16.0. The
// app's floor is 16.0 (see project.yml) and everything still works on 16.0–16.3
// via the Shortcuts app; only the zero-setup phrases need 16.4.

@available(iOS 16.4, *)
struct BibbiaShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartPracticeIntent(),
            phrases: [
                "Practice Italian in \(.applicationName)",
                "Review my Italian with \(.applicationName)",
                "Start \(.applicationName)",
            ],
            shortTitle: "Practice",
            systemImageName: "rectangle.stack")

        AppShortcut(
            intent: LogReadingIntent(),
            phrases: [
                "Log my reading in \(.applicationName)",
                "I did my \(.applicationName) reading",
            ],
            shortTitle: "Log Reading",
            systemImageName: "book")

        AppShortcut(
            intent: OpenWeekIntent(),
            phrases: [
                "Open this week in \(.applicationName)",
                "Open a week in \(.applicationName)",
            ],
            shortTitle: "Open Week",
            systemImageName: "calendar")

        AppShortcut(
            intent: OpenJournalIntent(),
            phrases: [
                "Open my \(.applicationName) journal",
                "Write in \(.applicationName)",
            ],
            shortTitle: "Journal",
            systemImageName: "square.and.pencil")

        AppShortcut(
            intent: MarkWeekDoneIntent(),
            phrases: [
                "Mark this week done in \(.applicationName)",
            ],
            shortTitle: "Mark Week Done",
            systemImageName: "checkmark.circle")

        AppShortcut(
            intent: LookUpWordIntent(),
            phrases: [
                "Look up a word in \(.applicationName)",
                "What does this mean in \(.applicationName)",
            ],
            shortTitle: "Look Up Word",
            systemImageName: "character.book.closed")
    }
}
