import SwiftUI
import UIKit
import BibbiaCore

// "Lezione guidata": drives BibbiaCore's tutor engine with real speech. All teaching
// logic lives in the engine; this carries out its effects and reports back. A token
// marks the current speech turn so a result from a cancelled turn can't drive the lesson.
@MainActor
final class TutorSession: ObservableObject {
    @Published private(set) var state: TutorState
    @Published private(set) var summary: TutorSummary?
    private let voice = TutorVoice()
    private let model: AppModel
    private var token = 0

    init(week: Week, model: AppModel, resume: TutorSnapshot?) {
        let lesson = buildLesson(week)
        let usable = resume.flatMap { $0.i < lesson.steps.count ? $0 : nil }
        state = TutorState(lesson: lesson, resume: usable)
        self.model = model
    }

    func begin() async {
        UIApplication.shared.isIdleTimerDisabled = true
        let micOK = await voice.requestMic()
        if !micOK { state.typing = true }
        send(.start)
    }

    func send(_ event: TutorEvent) {
        let previous = state.i
        let result = tutorNext(state, event)
        state = result.state
        if state.phase != .done, state.i != previous {
            model.saveLessonResume(weekN: state.lesson.weekN, snapshot: state.snapshot)
        }
        for effect in result.effects { run(effect) }
    }

    private func run(_ effect: TutorEffect) {
        switch effect {
        case .cancel:
            token += 1
            voice.cancel()
        case .speak(let utterance):
            token += 1
            let current = token
            Task {
                await voice.speak(utterance.text, language: model.ttsLanguage, slow: utterance.slow)
                if current == token { send(.spoken) }
            }
        case .listen:
            token += 1
            let current = token
            Task {
                let heard = await voice.listen(language: model.ttsLanguage)
                guard current == token else { return }
                switch heard {
                case .words(let alternatives): send(.heard(alternatives))
                case .noSpeech: send(.noSpeech)
                case .micUnavailable: send(.micUnavailable)
                case .cancelled: break
                }
            }
        case .finish(let result):
            UIApplication.shared.isIdleTimerDisabled = false
            model.finishLesson(result)
            summary = result
        }
    }

    func close() {
        token += 1
        voice.cancel()
        UIApplication.shared.isIdleTimerDisabled = false
    }
}

struct VoiceTutorSection: View {
    let week: Week
    @EnvironmentObject private var model: AppModel
    @AppStorage("coursekit-tutor-ai") private var conversaEnabled = false
    @State private var presented: PresentedLesson?
    @State private var showConversa = false

    private struct PresentedLesson: Identifiable {
        let id = UUID()
        let resume: TutorSnapshot?
    }

    var body: some View {
        if !buildLesson(week).steps.isEmpty {
            let today = todayStr()
            let resume = model.tutorStore.resume(for: week.n, today: today)
            let record = model.tutorStore.weeks[String(week.n)]
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Lezione guidata").font(.headline)
                    Text("A spoken lesson on this week's passage, about 5–8 minutes"
                         + (record.map { " · best \($0.best)%" } ?? ""))
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                if let resume {
                    Button("Resume lesson") { presented = PresentedLesson(resume: resume) }
                    Button("Start over") { presented = PresentedLesson(resume: nil) }
                } else {
                    Button(record == nil ? "Start lesson" : "Start again") {
                        presented = PresentedLesson(resume: nil)
                    }
                }
                if conversaEnabled, model.tutorAI.isAvailable {
                    Button("Conversa") { showConversa = true }
                }
            }
            .fullScreenCover(item: $presented) { lesson in
                VoiceTutorView(week: week, resume: lesson.resume, model: model)
            }
            .fullScreenCover(isPresented: $showConversa) {
                ConversaView(week: week, model: model)
            }
        }
    }
}

struct VoiceTutorView: View {
    @StateObject private var session: TutorSession
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @EnvironmentObject private var model: AppModel
    @AppStorage("coursekit-tutor-ai") private var conversaEnabled = false
    @State private var typed = ""
    @State private var showConversa = false
    private let week: Week

    init(week: Week, resume: TutorSnapshot?, model: AppModel) {
        self.week = week
        _session = StateObject(wrappedValue: TutorSession(week: week, model: model, resume: resume))
    }

    private var state: TutorState { session.state }

    private var stepLabel: String {
        switch state.step?.kind {
        case .intro: return "Getting started"
        case .listen: return "Listen"
        case .repeat: return "Repeat after me"
        case .focus: return "Tricky words"
        case .ask: return "Answer aloud"
        case .recall: return "Say the missing word"
        case .recap, .none: return "Finishing up"
        }
    }

    private var status: String {
        switch state.phase {
        case .listening: return "Your turn, speak now"
        case .speaking: return "Tutor speaking…"
        case .typing: return "Your turn, type your answer"
        case .paused: return state.pausedReason == "silent" ? "Paused, I couldn't hear you" : "Paused"
        case .idle, .done: return ""
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let summary = session.summary {
                    TutorSummaryView(summary: summary, onConversa: conversaEnabled && model.tutorAI.isAvailable
                                     ? { showConversa = true } : nil)
                } else {
                    lesson
                }
            }
            .navigationTitle("Lezione guidata")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(session.summary == nil ? "Stop" : "Done") {
                        if session.summary == nil { session.send(.command(.stop)) }
                        session.close()
                        dismiss()
                    }
                }
            }
        }
        .task { await session.begin() }
        .onDisappear { session.close() }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active { session.send(.pause(nil)) }
        }
        .fullScreenCover(isPresented: $showConversa) {
            ConversaView(week: week, model: model, missedWords: rankFocusWords(state.wordMisses))
        }
    }

    private var lesson: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ProgressView(value: Double(state.i), total: Double(max(state.lesson.steps.count, 1)))
                HStack {
                    Text(stepLabel).font(.subheadline.bold()).foregroundStyle(Color.accentColor)
                    Spacer()
                    if state.phase == .listening {
                        Image(systemName: "mic.fill").foregroundStyle(.red).accessibilityHidden(true)
                    }
                    Text(status).font(.caption).foregroundStyle(.secondary)
                }
                content
                if let gloss = state.glossed {
                    Text(verbatim: "\(gloss.word): \(gloss.en)").font(.footnote)
                }
                if let caption = state.queue.first, state.step?.kind != .listen, !hidesCaption(caption) {
                    Text(caption.en.isEmpty || caption.en == state.step?.en
                         ? caption.text : "\(caption.text) (\(caption.en))")
                        .font(.footnote).italic().foregroundStyle(.secondary)
                }
                feedback
                if state.phase == .typing { typingField }
                controls
                if !state.typing {
                    Text("You can also say ripeti, più lentamente, avanti or basta, or ask che vuol dire…? about any word.")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
            .padding()
        }
    }

    @ViewBuilder private var content: some View {
        if let step = state.step {
            switch step.kind {
            case .listen:
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(step.lines.enumerated()), id: \.offset) { i, line in
                        Text(line.t)
                            .font(.body)
                            .foregroundStyle(state.queue.first?.line == i ? .primary : .secondary)
                            .padding(.leading, 8)
                            .overlay(alignment: .leading) {
                                if state.queue.first?.line == i {
                                    Rectangle().fill(Color.accentColor).frame(width: 3)
                                }
                            }
                    }
                }
            case .repeat:
                repeatLine(step)
            case .focus:
                if state.sub < state.focusWords.count {
                    Text(state.focusWords[state.sub])
                        .font(.largeTitle.weight(.medium))
                        .frame(maxWidth: .infinity)
                }
            case .ask:
                target(step.q, en: "")
                if state.hinted, !step.hint.isEmpty {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Hint").font(.caption.bold()).foregroundStyle(.secondary)
                        WordGlossText(text: step.hint).font(.footnote)
                    }
                }
            case .recall:
                if state.stepOk == nil {
                    let blank = state.hinted ? "\(firstLetter(step.answer))____" : "_____"
                    VStack(alignment: .leading, spacing: 4) {
                        Text(verbatim: "\(step.before) \(blank) \(step.after)").font(.title3.weight(.medium))
                        if !step.en.isEmpty { Text(verbatim: step.en).font(.footnote).foregroundStyle(.secondary) }
                    }
                } else {
                    target(step.full, en: step.en)
                }
            case .intro, .recap:
                EmptyView()
            }
        }
    }

    // The caption shows what is being spoken, which would give away a line the learner
    // is meant to be saying from memory.
    private func hidesCaption(_ caption: TutorUtterance) -> Bool {
        state.step?.kind == .repeat && state.textLevel > 0 && caption.text == state.step?.text
    }

    // A Repeat line with some or all of it hidden. Levels 1 and 2 blank a growing share
    // of the words, and level 3 is audio only.
    @ViewBuilder private func repeatLine(_ step: TutorStep) -> some View {
        let level = state.textLevel
        if level == 0 {
            VStack(alignment: .leading, spacing: 4) {
                if !state.pieces.isEmpty {
                    Text("Piece \(state.pieceI + 1) of \(state.pieces.count)")
                        .font(.caption.bold()).foregroundStyle(.secondary)
                }
                target(state.repeatText(step), en: step.en)
            }
        } else {
            VStack(alignment: .leading, spacing: 6) {
                if level >= TUTOR_SUPPORT_MAX {
                    Text("Listen and repeat from memory").font(.body).italic().foregroundStyle(.secondary)
                } else {
                    Text(verbatim: fadedLine(step.text, level: level)).font(.title3.weight(.medium))
                }
                if !step.en.isEmpty { Text(verbatim: step.en).font(.footnote).foregroundStyle(.secondary) }
                Button("Show text") { session.send(.showText) }.font(.footnote)
            }
        }
    }

    private func fadedLine(_ text: String, level: Int) -> String {
        stageParts(text, stage: level)
            .map { "\($0.pre)\($0.blank ? "_____" : $0.word)\($0.post)" }
            .joined(separator: " ")
    }

    private func target(_ text: String, en: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            WordGlossText(text: text).font(.title3.weight(.medium))
            if !en.isEmpty { Text(verbatim: en).font(.footnote).foregroundStyle(.secondary) }
        }
    }

    @ViewBuilder private var feedback: some View {
        if let f = state.feedback {
            VStack(alignment: .leading, spacing: 4) {
                Text(f.tone == .ok ? "Bene!" : f.tone == .silent ? "Non ho sentito" : "Quasi…")
                    .font(.subheadline.bold())
                    .foregroundStyle(f.tone == .ok ? Color.accentColor : f.tone == .silent ? .secondary : .red)
                if !f.heard.isEmpty {
                    Text(verbatim: "Heard: “\(f.heard)”").font(.footnote).italic().foregroundStyle(.secondary)
                    if f.tone != .ok, !f.piece {
                        Button("I said it right") { session.send(.override) }.font(.footnote)
                    }
                }
            }
        }
    }

    private var typingField: some View {
        HStack {
            TextField("Type it in Italian…", text: $typed)
                .textFieldStyle(.roundedBorder)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onSubmit(submitTyped)
            Button("Check", action: submitTyped).buttonStyle(.borderedProminent)
        }
    }

    private func submitTyped() {
        guard !typed.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        session.send(.typed(typed))
        typed = ""
    }

    private var controls: some View {
        let paused = state.phase == .paused
        let interactive = [TutorStepKind.repeat, .focus, .ask, .recall].contains(state.step?.kind ?? .intro)
        return ViewThatFits(in: .horizontal) {
            HStack { controlButtons(paused: paused, interactive: interactive) }
            VStack(alignment: .leading) { controlButtons(paused: paused, interactive: interactive) }
        }
        .buttonStyle(.bordered)
    }

    @ViewBuilder private func controlButtons(paused: Bool, interactive: Bool) -> some View {
        if paused {
            Button("Resume") { session.send(.resume) }.buttonStyle(.borderedProminent)
        } else {
            Button("Pause") { session.send(.pause(nil)) }
        }
        Button("Repeat") { session.send(.command(.repeat)) }.disabled(paused)
        Button(state.slow ? "Slow" : "Slower") { session.send(.command(.slower)) }.disabled(paused || state.slow)
        Button("Skip") { session.send(.command(.skip)) }.disabled(paused)
        if interactive {
            Button(state.typing ? "Use mic" : "Type instead") { session.send(.setTyping(!state.typing)) }
        }
    }
}

private struct TutorSummaryView: View {
    let summary: TutorSummary
    var onConversa: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(summary.completed ? "Lesson finished" : "Lesson stopped").font(.title2.bold())
            Text("\(summary.ok) of \(summary.total) correct (\(summary.score)%).")
            if !summary.missed.isEmpty {
                Text("\(summary.missed.joined(separator: ", ")) will come back in verse review.")
                    .foregroundStyle(.secondary)
            }
            if let onConversa {
                Button("Talk about it: Conversa", action: onConversa).buttonStyle(.bordered)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
    }
}
