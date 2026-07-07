import SwiftUI
import BibbiaCore

// The "Today" card — streak flame, the 3-item daily checklist
// (read · practice · write), and a jump to the current week.

struct TodayCardView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
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

            let flags = model.flagsToday
            HStack(spacing: 14) {
                checklistItem("book", "Leggi", done: flags.read)
                checklistItem("rectangle.stack", "Ripassa", done: flags.practiced)
                checklistItem("square.and.pencil", "Scrivi", done: flags.journaled)
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

    private func checklistItem(_ icon: String, _ label: String, done: Bool) -> some View {
        HStack(spacing: 5) {
            Image(systemName: done ? "checkmark.circle.fill" : icon)
                .foregroundStyle(done ? Color.accentColor : .secondary)
            Text(label)
                .font(.caption)
                .foregroundStyle(done ? .primary : .secondary)
        }
    }
}
