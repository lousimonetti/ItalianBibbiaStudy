import SwiftUI
import BibbiaCore

// Prayers tab — the native port of src/components/DevotionsTab.jsx.
//
// Why these texts earn a tab: the learner already knows their meaning by heart,
// so comprehension is free; they are formulaic chunks, which is the fastest
// route adults have to fluent production; and they are recited often enough to
// give the distributed re-encounter the weekly vocabulary cannot (only ~9% of
// vocab terms recur across weeks).
//
// Three modes per text, matching the web:
//   Read   — line-aligned Italian with an on-demand translation + per-line audio
//   Shadow — hear a line, say it back, get scored (the pronunciation pipeline)
//   Recall — one word per line hidden; type it from memory
//
// The tab hides itself when the course ships no devotions, so a fork without
// them is unaffected.
struct DevotionsView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            List {
                ForEach(model.course.devotionSections) { section in
                    Section {
                        ForEach(section.prayers) { prayer in
                            NavigationLink(value: prayer.id) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(prayer.title)
                                    Text(prayer.titleEn)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    } header: {
                        Text(section.title)
                    } footer: {
                        if let intro = section.intro { Text(intro) }
                    }
                }
            }
            .navigationTitle("Prayers")
            .navigationDestination(for: String.self) { id in
                if let prayer = model.prayer(id: id) {
                    PrayerDetailView(prayer: prayer)
                }
            }
        }
    }
}

private enum PrayerMode: String, CaseIterable, Identifiable {
    case read, shadow, recall
    var id: String { rawValue }
    var label: String {
        switch self {
        case .read: return "Read"
        case .shadow: return "Shadow"
        case .recall: return "Recall"
        }
    }
}

struct PrayerDetailView: View {
    let prayer: Prayer
    @State private var mode: PrayerMode = .read

    var body: some View {
        VStack(spacing: 0) {
            Picker("Mode", selection: $mode) {
                ForEach(PrayerMode.allCases) { m in Text(m.label).tag(m) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.bottom, 8)

            switch mode {
            case .read: PrayerReadMode(prayer: prayer)
            case .shadow: PrayerShadowMode(prayer: prayer)
            case .recall: PrayerRecallMode(prayer: prayer)
            }
        }
        .navigationTitle(prayer.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// A prayer with no `lines` can still be read as a whole, but the line-aligned
// modes have nothing to work with — say so rather than showing an empty screen.
private struct NoLinesNotice: View {
    var body: some View {
        ContentUnavailableViewCompat(
            title: "No line-by-line version",
            message: "This text hasn't been split into lines yet. Read mode still works.")
    }
}

// MARK: - Read

private struct PrayerReadMode: View {
    let prayer: Prayer
    @EnvironmentObject private var model: AppModel
    @State private var showEnglish = false

    var body: some View {
        List {
            if let note = prayer.note {
                Section { Text(note).font(.footnote).foregroundStyle(.secondary) }
            }
            Section {
                if let lines = prayer.lines, !lines.isEmpty {
                    ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(alignment: .firstTextBaseline) {
                                Text(line.it)
                                Spacer(minLength: 8)
                                SpeakerButton(text: line.it, compact: true)
                            }
                            if showEnglish {
                                Text(line.en).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(prayer.it)
                        if showEnglish {
                            Text(prayer.en).font(.caption).foregroundStyle(.secondary)
                        }
                        SpeakerButton(text: prayer.it)
                    }
                }
            } header: {
                Toggle("Show English", isOn: $showEnglish)
                    .font(.caption)
                    .textCase(nil)
            }
            if let focus = prayer.focus {
                Section("Grammar focus") {
                    Text(focus.text).font(.footnote)
                    if !focus.weeks.isEmpty {
                        Text("Weeks " + focus.weeks.map(String.init).joined(separator: ", "))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Shadow

private struct PrayerShadowMode: View {
    let prayer: Prayer
    @EnvironmentObject private var model: AppModel
    @StateObject private var recognizer = SpeechRecognizer()
    @State private var index = 0
    @State private var score: Int?

    private var lines: [PrayerLine] { prayer.lines ?? [] }
    private var line: PrayerLine? { lines.indices.contains(index) ? lines[index] : nil }

    var body: some View {
        if lines.isEmpty {
            NoLinesNotice()
        } else if !SpeechRecognizer.isAvailable(language: model.ttsLanguage) {
            ContentUnavailableViewCompat(
                title: "Speech recognition unavailable",
                message: "Shadowing needs on-device speech recognition for \(model.ttsLanguage). Read mode still works.")
        } else {
            shadowBody
        }
    }

    private var shadowBody: some View {
        VStack(spacing: 16) {
            Text("Line \(index + 1) of \(lines.count)")
                .font(.caption).foregroundStyle(.secondary)

            if let line {
                Text(line.it).font(.title3).multilineTextAlignment(.center)
                Text(line.en).font(.caption).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                SpeakerButton(text: line.it)
            }

            Button {
                toggle()
            } label: {
                Label(recognizer.isRecording ? "Stop" : "Repeat it",
                      systemImage: recognizer.isRecording ? "stop.circle.fill" : "mic.circle.fill")
            }
            .buttonStyle(.borderedProminent)
            .tint(recognizer.isRecording ? .red : .accentColor)

            if !recognizer.transcript.isEmpty {
                Text("Heard: “\(recognizer.transcript)”")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            if let score {
                Text("\(score)%")
                    .font(.title2).bold()
                    .foregroundStyle(score >= 80 ? .green : (score >= 55 ? .orange : .red))
            }
            if let error = recognizer.errorMessage {
                Text(error).font(.caption).foregroundStyle(.red)
            }

            HStack {
                Button("Previous") { move(-1) }.disabled(index == 0)
                Spacer()
                Button("Next") { move(1) }.disabled(index >= lines.count - 1)
            }
            .padding(.horizontal)

            Spacer()
        }
        .padding()
        // Releasing the mic on the way out matters: holding it makes the next
        // start() throw, which is the web app's documented lifecycle bug.
        .onDisappear { recognizer.stop() }
        .onChange(of: recognizer.isRecording) { recording in
            if !recording, !recognizer.transcript.isEmpty, let line {
                score = scorePronunciation(target: line.it, recognized: recognizer.transcript)
            }
        }
    }

    private func toggle() {
        if recognizer.isRecording {
            recognizer.stop()
        } else {
            score = nil
            Task {
                guard await recognizer.requestPermission() else { return }
                recognizer.start(language: model.ttsLanguage)
            }
        }
    }

    private func move(_ delta: Int) {
        recognizer.stop()
        score = nil
        index = max(0, min(lines.count - 1, index + delta))
    }
}

// MARK: - Recall

private struct PrayerRecallMode: View {
    let prayer: Prayer
    @EnvironmentObject private var model: AppModel
    @State private var typed: [Int: String] = [:]
    @State private var revealed: Set<Int> = []

    private var lines: [PrayerLine] { prayer.lines ?? [] }

    var body: some View {
        if lines.isEmpty {
            NoLinesNotice()
        } else {
            List {
                Section {
                    ForEach(Array(lines.enumerated()), id: \.offset) { i, line in
                        row(index: i, line: line)
                    }
                } footer: {
                    Text("One word per line is hidden. Type it from memory — accents and near-misses are forgiven.")
                }
            }
        }
    }

    @ViewBuilder
    private func row(index i: Int, line: PrayerLine) -> some View {
        if let split = PrayerCloze.split(line) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline, spacing: 0) {
                    Text(split.before)
                    Text(revealed.contains(i) ? split.answer : "____")
                        .bold()
                        .foregroundStyle(revealed.contains(i) ? .green : .secondary)
                    Text(split.after)
                }
                HStack {
                    TextField("word", text: binding(for: i))
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    if isCorrect(i, line) {
                        Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                    }
                    Button("Show") { revealed.insert(i) }.font(.caption)
                    SpeakerButton(text: line.it, compact: true)
                }
                Text(line.en).font(.caption2).foregroundStyle(.secondary)
            }
            .padding(.vertical, 2)
        } else {
            // Lines too short to blank fairly still belong in the text.
            Text(line.it).foregroundStyle(.secondary)
        }
    }

    private func binding(for i: Int) -> Binding<String> {
        Binding(get: { typed[i] ?? "" }, set: { typed[i] = $0 })
    }

    private func isCorrect(_ i: Int, _ line: PrayerLine) -> Bool {
        let t = typed[i] ?? ""
        guard !t.isEmpty else { return false }
        return PrayerCloze.isCorrect(t, for: line, articles: model.course.locale.articles)
    }
}

// iOS 17's ContentUnavailableView would be ideal, but the app floor is iOS 16.
private struct ContentUnavailableViewCompat: View {
    let title: String
    let message: String
    var body: some View {
        VStack(spacing: 8) {
            Text(title).font(.headline)
            Text(message)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
