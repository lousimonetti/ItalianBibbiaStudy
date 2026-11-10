import SwiftUI
import BibbiaCore

// Where lessons are started from: the Today card's Continue button, a week's
// lesson list, and the path of lesson nodes on each week row. Twin of LessonHub.jsx.

/// The Today card's primary action: one button that always knows what is next
/// — the current week's next lesson, the review when cards are due, or next
/// week's first lesson early.
struct ContinueCard: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var route: AppRoute
    @State private var active: Lesson?

    var body: some View {
        Group {
            switch model.nextLesson {
            case .lesson(let lesson, let ahead):
                card(button: "Continue",
                     title: "Week \(lesson.weekN) · Lesson \(lesson.n) of \(model.lessons(forWeek: lesson.weekN).count) — \(lesson.title)",
                     sub: "\(ahead ? "Ahead of schedule · " : "")\(lesson.sub) · about \(lesson.minutes) min") {
                    active = lesson
                }
                if model.vocabDue > 0 {
                    Button("\(model.vocabDue) due — review") { route.startPractice() }
                        .font(.footnote.weight(.semibold))
                        .buttonStyle(.bordered)
                        .buttonBorderShape(.capsule)
                }
            case .review(let due):
                card(button: "Review",
                     title: "\(due) card\(due == 1 ? "" : "s") due",
                     sub: "This week's lessons are done — keep the words alive.") {
                    route.startPractice()
                }
            case .done:
                Text("Tutto fatto — every lesson finished and nothing due.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .fullScreenCover(item: $active) { lesson in
            LessonPlayerView(lesson: lesson)
        }
    }

    private func card(button: String, title: String, sub: String, action: @escaping () -> Void) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: action) {
                Label(button, systemImage: "play.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity, minHeight: 30)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.capsule)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(sub).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}

/// A week's lessons, each startable (or repeatable) on its own.
struct WeekLessonsSection: View {
    let week: Week
    @EnvironmentObject private var model: AppModel
    @State private var active: Lesson?

    var body: some View {
        let lessons = model.lessons(forWeek: week.n)
        if !lessons.isEmpty {
            let progress = model.lessonStore.progress(lessons)
            Section {
                ForEach(lessons) { lesson in
                    let finished = model.lessonStore.isDone(lesson.key)
                    HStack(spacing: 12) {
                        Image(systemName: finished ? "checkmark.circle.fill" : "\(lesson.n).circle")
                            .imageScale(.large)
                            .foregroundStyle(finished ? Color.accentColor : .secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lesson.title).font(.subheadline.weight(.semibold))
                            Text("\(lesson.sub) · about \(lesson.minutes) min")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if finished {
                            Button("Repeat") { active = lesson }
                                .buttonStyle(.bordered)
                                .buttonBorderShape(.capsule)
                                .accessibilityLabel("Repeat lesson \(lesson.n): \(lesson.title)")
                        } else {
                            Button("Start") { active = lesson }
                                .buttonStyle(.borderedProminent)
                                .buttonBorderShape(.capsule)
                                .accessibilityLabel("Start lesson \(lesson.n): \(lesson.title)")
                        }
                    }
                }
            } header: {
                HStack {
                    Text("Lezioni")
                    Spacer()
                    Text("\(progress.done) / \(progress.total) done")
                }
            }
            .fullScreenCover(item: $active) { lesson in
                LessonPlayerView(lesson: lesson)
            }
        }
    }
}

/// The leading mark on a week row: an empty ring, a ring filled in proportion
/// to the lessons done, or a tick once the week is complete. It reports; the
/// lessons are what get done. (The manual override is the toggle in the week.)
struct WeekStatusRing: View {
    let weekN: Int
    @EnvironmentObject private var model: AppModel

    var body: some View {
        let progress = model.lessonStore.progress(model.lessons(forWeek: weekN))
        let done = model.isWeekDone(weekN)
        Group {
            if done {
                Image(systemName: "checkmark.circle.fill")
                    .resizable()
                    .foregroundStyle(Color.accentColor)
            } else {
                ZStack {
                    Circle().stroke(Color.secondary.opacity(0.3), lineWidth: 3)
                    Circle()
                        .trim(from: 0, to: progress.total > 0 ? Double(progress.done) / Double(progress.total) : 0)
                        .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                .padding(1.5)
            }
        }
        .frame(width: 24, height: 24)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(done ? "Week \(weekN) complete"
                                 : "Week \(weekN): \(progress.done) of \(progress.total) lessons done")
    }
}

/// The week's lessons as a short path of nodes on its row: 1 — 2 — 3, each a
/// button that opens that lesson, filled in once it is finished.
struct WeekLessonPath: View {
    let weekN: Int
    @EnvironmentObject private var model: AppModel
    @State private var active: Lesson?

    var body: some View {
        let lessons = model.lessons(forWeek: weekN)
        if !lessons.isEmpty {
            HStack(spacing: 0) {
                ForEach(Array(lessons.enumerated()), id: \.element.id) { i, lesson in
                    let finished = model.lessonStore.isDone(lesson.key)
                    if i > 0 {
                        // Green only once the lessons on both sides are done.
                        Rectangle()
                            .fill(finished && model.lessonStore.isDone(lessons[i - 1].key)
                                  ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 8, height: 2)
                    }
                    // Borderless, so the tap belongs to the node and not to the
                    // row's NavigationLink behind it.
                    Button { active = lesson } label: {
                        ZStack {
                            Circle().fill(finished ? Color.accentColor : Color.clear)
                            Circle().strokeBorder(finished ? Color.accentColor : Color.secondary.opacity(0.4),
                                                  lineWidth: 2)
                            if finished {
                                Image(systemName: "checkmark").font(.caption2.bold()).foregroundStyle(.white)
                            } else {
                                Text("\(lesson.n)").font(.caption.bold()).foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 30, height: 30)
                        .contentShape(Circle())
                    }
                    .buttonStyle(.borderless)
                    .accessibilityLabel("Week \(weekN), lesson \(lesson.n): \(lesson.title)\(finished ? ", done" : "")")
                }
            }
            .fullScreenCover(item: $active) { lesson in
                LessonPlayerView(lesson: lesson)
            }
        }
    }
}
