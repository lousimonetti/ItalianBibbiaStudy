import SwiftUI
import AppIntents
import BibbiaCore

@main
struct ItalianBibbiaStudyApp: App {
    // Both are shared singletons so the App Intents (which run outside the view
    // tree) drive the same objects the UI observes — see Intents/AppRoute.swift.
    @StateObject private var model = AppModel.shared
    @StateObject private var route = AppRoute.shared

    init() {
        // Must happen before any intent performs; App.init runs on launch,
        // including the background launches Siri triggers for intents.
        AppDependencyManager.shared.add(dependency: AppModel.shared)
        AppDependencyManager.shared.add(dependency: AppRoute.shared)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .environmentObject(route)
                .preferredColorScheme(model.theme.colorScheme)
                .tint(Color("AccentColor"))
        }
    }
}
