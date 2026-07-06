import SwiftUI
import BibbiaCore

@main
struct ItalianBibbiaStudyApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .preferredColorScheme(model.theme.colorScheme)
                .tint(Color("AccentColor"))
        }
    }
}
