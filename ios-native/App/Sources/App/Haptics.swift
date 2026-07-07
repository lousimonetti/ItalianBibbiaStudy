import Foundation
#if canImport(UIKit)
import UIKit
#endif

// Lightweight haptic feedback — one of the native niceties the web PWA can't
// do (plan-ios-swift.md "iOS-exclusive additions").

enum Haptics {
    static func light() {
        #if canImport(UIKit)
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        #endif
    }

    static func success() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        #endif
    }

    static func error() {
        #if canImport(UIKit)
        UINotificationFeedbackGenerator().notificationOccurred(.error)
        #endif
    }
}
