import SwiftUI
import BibbiaCore

struct ContentView: View {
    @EnvironmentObject private var model: AppModel
    // Selection is bound to the shared route so an App Intent can switch tabs
    // from outside the view tree (see Intents/AppRoute.swift).
    @EnvironmentObject private var route: AppRoute
    // Same persisted flag family the web app uses (`italian-bible-welcome-seen`).
    @State private var showWelcome = WebStore.loadString("welcome-seen") == nil
    // Set by the welcome sheet's start button; the lesson opens once the sheet
    // has gone, because one presentation cannot begin while another is ending.
    @State private var startAfterWelcome = false
    @State private var firstLesson: Lesson?

    var body: some View {
        TabView(selection: $route.tab) {
            TrackerView()
                .tabItem { Label("Tracker", systemImage: "calendar") }
                .tag(AppRoute.Tab.tracker)
            FlashcardsView()
                .tabItem { Label("Flashcards", systemImage: "rectangle.stack") }
                .badge(model.vocabDue)
                .tag(AppRoute.Tab.flashcards)
            JournalView()
                .tabItem { Label("Journal", systemImage: "square.and.pencil") }
                .tag(AppRoute.Tab.journal)
            // Course-level content: a course shipping no devotions gets no tab,
            // matching the web app's behaviour.
            if !model.course.devotionSections.isEmpty {
                DevotionsView()
                    .tabItem { Label("Prayers", systemImage: "hands.sparkles") }
                    .tag(AppRoute.Tab.prayers)
            }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
                .tag(AppRoute.Tab.settings)
        }
        .onAppear {
            #if DEBUG
            LaunchTiming.mark("ContentView.onAppear (first frame)")
            #endif
        }
        .sheet(isPresented: $showWelcome, onDismiss: {
            WebStore.saveString("welcome-seen", "1")
            if startAfterWelcome, case .lesson(let lesson, _) = model.nextLesson {
                route.tab = .tracker
                firstLesson = lesson
            }
            startAfterWelcome = false
        }) {
            WelcomeView { startAfterWelcome = true }
        }
        .fullScreenCover(item: $firstLesson) { lesson in
            LessonPlayerView(lesson: lesson)
        }
    }
}

// First-launch welcome: what this is in three lines, and one button that
// opens the first lesson. The calendar needs no choice here — the program
// started today (AppModel.ensureSessionStart stamped it on this first open).
// Twin of the web's WelcomeCard.
private struct WelcomeView: View {
    /// Called when the learner asks to start; the sheet then dismisses itself.
    let onStart: () -> Void

    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    private let steps: [(String, String)] = [
        ("Learn", "A five-minute lesson teaches a few words from the week’s passage. You hear each one first."),
        ("Read", "Then read the passage itself. Tap any word for its meaning and its sound."),
        ("Remember", "Words come back for review just before you would forget them."),
    ]

    private var startLabel: String {
        if case .lesson(let lesson, _) = model.nextLesson, lesson.weekN == 1, lesson.n == 1 {
            return "Start lesson 1"
        }
        return "Continue my lessons"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("BENVENUTO!")
                    .font(.caption.bold())
                    .tracking(1)
                    .foregroundStyle(.tint)
                Text("Read the Bible in Italian, one short lesson at a time.")
                    .font(.title.bold())
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(i + 1)")
                                .font(.footnote.bold())
                                .foregroundStyle(.tint)
                                .frame(width: 26, height: 26)
                                .background(Circle().fill(Color.accentColor.opacity(0.15)))
                                .accessibilityHidden(true)
                            Text("\(Text(step.0 + ".").bold()) \(step.1)")
                                .font(.callout)
                        }
                    }
                }
                if let end = model.endDate {
                    Text("Your \(model.course.schedule.weeks) weeks started today and end \(end.formatted(date: .long, time: .omitted)). Settings → New Session moves the calendar any time.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(24)
            .padding(.top, 16)
            .frame(maxWidth: 560, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 10) {
                Button {
                    onStart()
                    dismiss()
                } label: {
                    Text(startLabel)
                        .font(.headline)
                        .frame(maxWidth: .infinity, minHeight: 34)
                }
                .buttonStyle(.borderedProminent)
                .buttonBorderShape(.capsule)
                Button("Just look around") { dismiss() }
                    .font(.subheadline)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .frame(maxWidth: 560)
            .frame(maxWidth: .infinity)
            .background(.bar)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppModel.shared)
        .environmentObject(AppRoute.shared)
}
