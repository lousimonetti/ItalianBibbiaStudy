import SwiftUI
import BibbiaCore

// The "Today" card — streak flame and the last seven days, the Continue button
// (next lesson or the review), today's three goals (read · practice · write),
// each a button that goes to the thing it names, and a jump to the current week.

struct TodayCardView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var route: AppRoute

    var body: some View {
        #if DEBUG
        let _ = LaunchTiming.once("TodayCardView")
        #endif
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label {
                    Text("\(model.streakCount) day\(model.streakCount == 1 ? "" : "s")")
                        .font(.headline)
                } icon: {
                    Text("🔥")
                }
                if model.streak.best > 0 {
                    Text("best \(model.streak.best)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if let end = model.endDate {
                    Text("→ \(end.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            weekStripView

            ContinueCard()

            let flags = model.flagsToday
            let doneCount = [flags.read, flags.practiced, flags.journaled].filter { $0 }.count
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Today's goals")
                    Spacer()
                    Text("\(doneCount) of 3")
                        .foregroundStyle(doneCount == 3 ? Color.accentColor : .secondary)
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
                // The ticks come from doing the thing where the button leads.
                HStack(spacing: 8) {
                    goal("book", "Leggi", hint: "Read this week's passage", done: flags.read) {
                        if let n = model.currentWeekN { route.openWeek(n) }
                    }
                    .disabled(model.currentWeekN == nil)
                    goal("rectangle.stack", "Ripassa", hint: "Review your words", done: flags.practiced) {
                        route.startPractice()
                    }
                    goal("square.and.pencil", "Scrivi", hint: "Write a line in Italian", done: flags.journaled) {
                        route.openJournal(week: model.currentWeekN)
                    }
                }
            }

            if model.versesDue > 0 {
                Label("\(model.versesDue) verses due in Flashcards", systemImage: "text.book.closed")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if let n = model.currentWeekN, let week = model.course.week(n) {
                NavigationLink(value: n) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Questa settimana · Week \(n)")
                                .font(.subheadline.bold())
                            Text("\(week.r) — \(week.b)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(RoundedRectangle(cornerRadius: 10)
                        .fill(Color.accentColor.opacity(0.1)))
                }
                .buttonStyle(.plain)
            } else {
                Text(beforeOrAfterMessage)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var beforeOrAfterMessage: String {
        if let start = ScheduleLogic.parseLocalDate(model.effectiveStartDate), start > Date() {
            return "The program starts \(start.formatted(date: .long, time: .omitted)). You can start earlier from Settings → New Session."
        }
        return "The program has ended — start a new session from Settings to run it again. 🎄"
    }

    /// The last seven days, oldest first; the days of the current run are filled.
    private var weekStripView: some View {
        let days = weekStrip(model.streak, today: todayStr())
        return HStack(spacing: 6) {
            ForEach(days) { day in
                Text(day.label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(day.done ? Color.white : day.today ? Color.primary : Color.secondary)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(day.done ? Color.red : Color.clear))
                    .overlay(Circle().strokeBorder(
                        day.done || day.today ? Color.red : Color.secondary.opacity(0.35),
                        style: StrokeStyle(lineWidth: 1.5, dash: day.today && !day.done ? [3, 2] : [])))
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(days.filter(\.done).count) of the last 7 days studied")
    }

    private func goal(_ icon: String, _ label: String, hint: String, done: Bool,
                      action: @escaping () -> Void) -> some View {
        // Borderless, so each goal takes its own tap inside the list row.
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: done ? "checkmark.circle.fill" : icon)
                    .foregroundStyle(done ? Color.accentColor : .secondary)
                Text(label)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(RoundedRectangle(cornerRadius: 10)
                .fill(done ? Color.accentColor.opacity(0.12) : Color(.secondarySystemBackground)))
            .contentShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.borderless)
        .accessibilityLabel("\(hint)\(done ? ", done" : "")")
    }
}
