import SwiftUI
import BibbiaCore

struct TrackerView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TodayCardView()
                }
                Section {
                    AchievementsRow()
                }
                ForEach(model.course.phases) { phase in
                    Section {
                        ForEach(phase.weeks) { week in
                            WeekRow(week: week)
                        }
                    } header: {
                        HStack {
                            Text(phase.title)
                            Spacer()
                            Text(phase.badgeLabel)
                                .font(.caption2.bold())
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Capsule().fill(Color.accentColor.opacity(0.15)))
                        }
                    } footer: {
                        Text(phase.book)
                    }
                }
            }
            .navigationDestination(for: Int.self) { n in
                if let week = model.course.week(n) {
                    WeekDetailView(week: week)
                }
            }
            .navigationTitle(model.course.brand.name)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Text("\(model.weeksDone)/\(model.course.totalWeeks) · \(model.progressPct)%")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

private struct WeekRow: View {
    let week: Week
    @EnvironmentObject private var model: AppModel

    var isCurrent: Bool { model.currentWeekN == week.n }

    var body: some View {
        NavigationLink(value: week.n) {
            HStack(spacing: 12) {
                Button {
                    model.toggleWeek(week.n)
                } label: {
                    Image(systemName: model.isWeekDone(week.n)
                          ? "checkmark.circle.fill" : "circle")
                        .foregroundStyle(model.isWeekDone(week.n) ? Color.accentColor : .secondary)
                        .imageScale(.large)
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("Week \(week.n)")
                            .font(.subheadline.bold())
                        if week.review {
                            Text("REVIEW")
                                .font(.caption2.bold())
                                .foregroundStyle(.orange)
                        }
                        if isCurrent {
                            Text("NOW")
                                .font(.caption2.bold())
                                .padding(.horizontal, 5)
                                .padding(.vertical, 1)
                                .background(Capsule().fill(Color.accentColor))
                                .foregroundStyle(.white)
                        }
                    }
                    Text(week.r)
                        .font(.subheadline)
                    Text("\(model.weekLabel(week.n)) · \(week.b)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }
}

private struct AchievementsRow: View {
    @EnvironmentObject private var model: AppModel
    @State private var expanded = false

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            let columns = [GridItem(.adaptive(minimum: 96), spacing: 8)]
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(model.achievements) { badge in
                    VStack(spacing: 4) {
                        Text(badge.icon).font(.title2)
                        Text(badge.it)
                            .font(.caption2.bold())
                            .multilineTextAlignment(.center)
                        Text(badge.desc)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, minHeight: 88, alignment: .top)
                    .background(RoundedRectangle(cornerRadius: 10)
                        .fill(Color.accentColor.opacity(badge.earned ? 0.15 : 0.04)))
                    .opacity(badge.earned ? 1 : 0.45)
                }
            }
            .padding(.top, 6)
        } label: {
            HStack {
                Text("🏆 Traguardi")
                    .font(.subheadline.bold())
                Spacer()
                Text("\(earnedCount(model.achievements))/\(model.achievements.count)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    TrackerView().environmentObject(AppModel())
}
