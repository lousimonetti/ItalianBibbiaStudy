import Foundation
import SwiftUI

// Navigation state an App Intent can drive from outside the view tree
// (see ../../../../plan-siri.md, I1).
//
// Intents run in the app's process but not inside SwiftUI, so they cannot push
// a NavigationLink or flip a @State. They write here instead; the views observe
// it. Kept deliberately tiny — one selected tab, one path per stack, and
// one-shot triggers that the observing view consumes and clears.

@MainActor
final class AppRoute: ObservableObject {
    /// Shared instance. Intents reach it through AppDependencyManager; the
    /// view tree gets the same object as an @EnvironmentObject, so both sides
    /// are driving one piece of state.
    static let shared = AppRoute()

    enum Tab: String, Hashable {
        case tracker, flashcards, journal, prayers, settings
    }

    @Published var tab: Tab = .tracker

    /// Week numbers pushed onto the Tracker's NavigationStack.
    @Published var trackerPath: [Int] = []
    /// Week numbers pushed onto the Journal's NavigationStack.
    @Published var journalPath: [Int] = []

    /// One-shot: set to a fresh UUID to ask Flashcards to begin a session.
    /// FlashcardsView clears it once consumed, so asking twice in a row still
    /// fires twice (a plain Bool would coalesce).
    @Published var practiceTrigger: UUID?

    // ── Intent-facing helpers ────────────────────────────────────────────────

    func openWeek(_ n: Int) {
        tab = .tracker
        trackerPath = [n]
    }

    func openJournal(week n: Int?) {
        tab = .journal
        journalPath = n.map { [$0] } ?? []
    }

    func startPractice() {
        tab = .flashcards
        // Leaving a half-finished week detail pushed would hide the practice
        // screen behind it.
        trackerPath = []
        practiceTrigger = UUID()
    }
}
