import SwiftUI
import BibbiaCore

struct ContentView: View {
    @EnvironmentObject private var model: AppModel
    // Same persisted flag family the web app uses (`italian-bible-welcome-seen`).
    @State private var showWelcome = WebStore.loadString("welcome-seen") == nil

    var body: some View {
        TabView {
            TrackerView()
                .tabItem { Label("Tracker", systemImage: "calendar") }
            FlashcardsView()
                .tabItem { Label("Flashcards", systemImage: "rectangle.stack") }
            JournalView()
                .tabItem { Label("Journal", systemImage: "square.and.pencil") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .sheet(isPresented: $showWelcome, onDismiss: {
            WebStore.saveString("welcome-seen", "1")
        }) {
            WelcomeView()
        }
    }
}

// First-launch welcome — tells a new user their program started today
// (AppModel.ensureSessionStart stamped the session-start on this first open)
// and where to change the date.
private struct WelcomeView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            Text("Benvenuto! 🇮🇹")
                .font(.largeTitle.bold())
            Text(model.course.brand.about)
                .font(.callout)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 6) {
                Text("Your \(model.course.schedule.weeks)-week journey starts today")
                    .font(.headline)
                if let end = model.endDate {
                    Text("Week 1 begins now — week \(model.course.schedule.weeks) ends \(end.formatted(date: .long, time: .omitted)).")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 12)
                .fill(Color.accentColor.opacity(0.12)))

            Text("Prefer a different start date? Settings → New Session moves the calendar any time.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()
            Button {
                dismiss()
            } label: {
                Text("Iniziamo!")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .interactiveDismissDisabled(false)
    }
}

#Preview {
    ContentView().environmentObject(AppModel())
}
