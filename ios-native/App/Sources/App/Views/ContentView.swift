import SwiftUI
import BibbiaCore

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

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
    }
}

#Preview {
    ContentView().environmentObject(AppModel())
}
