import SwiftUI
import AppIntents
import BibbiaCore

@main
struct ItalianBibbiaStudyApp: App {
    // Both are shared singletons so the App Intents (which run outside the view
    // tree) drive the same objects the UI observes — see Intents/AppRoute.swift.
    @StateObject private var model = AppModel.shared
    @StateObject private var route = AppRoute.shared

    // @MainActor because the body reads two main-actor singletons. SwiftUI
    // runs App.init on the main actor anyway; stating it lets the compiler see
    // that, instead of us asserting it at runtime.
    @MainActor
    init() {
        // Must happen before any intent performs; App.init runs on launch,
        // including the background launches Siri triggers for intents.
        //
        // Read the singletons into locals FIRST. `add(dependency:)` takes a
        // @Sendable autoclosure, and referencing a main-actor-isolated static
        // property inside one is an error under the Swift 6 language mode.
        // Both types are already Sendable (@MainActor classes are), so once
        // the isolated *read* happens out here, capturing the value is fine.
        let model = AppModel.shared
        let route = AppRoute.shared
        AppDependencyManager.shared.add(dependency: model)
        AppDependencyManager.shared.add(dependency: route)
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
