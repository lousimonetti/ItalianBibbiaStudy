import Foundation

// TEMPORARY launch instrumentation. Remove once the startup stall is diagnosed.
//
// Prints elapsed milliseconds at a few points on the launch path so a device
// run says where the time actually goes, instead of us reasoning about it from
// the outside. `print` is used rather than Logger because the Run scheme sets
// OS_ACTIVITY_MODE=disable, which suppresses os_log but not print.
#if DEBUG
enum LaunchTiming {
    nonisolated(unsafe) private static var t0: Date?

    static func begin() {
        t0 = Date()
        print("[launch] 0 ms — App.init begin")
    }

    static func mark(_ label: String) {
        guard let t0 else { return }
        let ms = Int(-t0.timeIntervalSinceNow * 1000)
        print("[launch] \(ms) ms — \(label)")
    }

    nonisolated(unsafe) private static var seen = Set<String>()

    /// Log the FIRST evaluation of a view body only — bodies re-run constantly,
    /// and it is the first-render ordering we care about. Returns Void so it
    /// can be used as `let _ = LaunchTiming.once("X")` inside a ViewBuilder.
    static func once(_ label: String) {
        guard !seen.contains(label) else { return }
        seen.insert(label)
        mark("first body: \(label)")
    }

    /// Sample how late the main queue services a scheduled hop. Lateness
    /// beyond the scheduled delay is time the main thread was blocked and
    /// could not have serviced a tap.
    ///
    /// Samples at 20 Hz via asyncAfter rather than reposting with no delay.
    /// The zero-delay version was a busy-loop: it kept the main queue
    /// permanently non-empty, which both burns CPU and batches other work into
    /// bursts — so it partly manufactured the gaps it was reporting.
    static func probeMainQueue() {
        guard let start = t0 else { return }
        if -start.timeIntervalSinceNow > 15 {
            print("[launch] main-queue probe finished")
            return
        }
        let interval = 0.05
        let scheduledAt = Date()
        DispatchQueue.main.asyncAfter(deadline: .now() + interval) {
            let late = -scheduledAt.timeIntervalSinceNow - interval
            if late > 0.25 {
                print("[launch] MAIN THREAD BLOCKED \(Int(late * 1000)) ms "
                      + "(ending at \(Int(-start.timeIntervalSinceNow * 1000)) ms)")
            }
            probeMainQueue()
        }
    }

    /// Wrap a synchronous step and report how long it took on its own.
    @discardableResult
    static func measure<T>(_ label: String, _ body: () throws -> T) rethrows -> T {
        let s = Date()
        let out = try body()
        let ms = Int(-s.timeIntervalSinceNow * 1000)
        print("[launch] \(label) took \(ms) ms")
        mark("after \(label)")
        return out
    }
}
#endif
