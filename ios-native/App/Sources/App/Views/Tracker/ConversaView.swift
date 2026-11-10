import SwiftUI
import UIKit
import BibbiaCore

// "Conversa": a free spoken conversation about the week's passage, with replies from
// Apple's on-device model. All the logic lives in BibbiaCore's ConversaEngine; this carries
// out its effects and reports back. Nothing here touches a score or review, and the
// conversation disappears when it closes.
@MainActor
final class ConversaSession: ObservableObject {
    @Published private(set) var state: ConversaState
    @Published private(set) var summary: ConversaSummary?
    private let voice = TutorVoice()
    private let model: AppModel
    private let ai: TutorAI
    private var token = 0
    private var generation: Task<Void, Never>?

    init(week: Week, model: AppModel, missedWords: [String]) {
        state = ConversaState(week: week, missedWords: missedWords)
        self.model = model
        ai = model.tutorAI
    }

    var localSpeech: Bool { SpeechRecognizer.supportsOnDevice(language: model.ttsLanguage) }

    func begin() async {
        UIApplication.shared.isIdleTimerDisabled = true
        ai.warmUp(system: conversaSystem(state.week, missedWords: state.missedWords))
        let micOK = await voice.requestMic()
        if !micOK { state.typing = true }
        send(.start)
    }

    func send(_ event: ConversaEvent) {
        let result = conversaNext(state, event)
        state = result.state
        for effect in result.effects { run(effect) }
    }

    private func run(_ effect: ConversaEffect) {
        switch effect {
        case .cancel:
            token += 1
            voice.cancel()
            generation?.cancel()
            generation = nil
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
                let heard = await voice.listen(language: model.ttsLanguage, onDevice: true)
                guard current == token else { return }
                switch heard {
                case .words(let alternatives): send(.heard(alternatives))
                case .noSpeech: send(.noSpeech)
                case .micUnavailable: send(.micUnavailable)
                case .cancelled: break
                }
            }
        case .generate(let id, let system, let messages):
            generation?.cancel()
            let stream = ai.stream(system: system, messages: messages)
            generation = Task { [weak self] in
                do {
                    for try await piece in stream {
                        guard !Task.isCancelled else { return }
                        self?.send(.delta(id: id, text: piece))
                    }
                    guard !Task.isCancelled else { return }
                    self?.send(.generated(id: id))
                } catch {
                    guard !Task.isCancelled else { return }
                    let refused = (error as? TutorAIError) == .refused
                    self?.send(.failed(id: id, reason: refused ? "refused" : "error"))
                }
            }
        case .finish(let result):
            UIApplication.shared.isIdleTimerDisabled = false
            generation?.cancel()
            if result.turns >= CONVERSA_STREAK_TURNS { model.recordActivity(.practiced) }
            summary = result
        }
    }

    func close() {
        token += 1
        voice.cancel()
        generation?.cancel()
        UIApplication.shared.isIdleTimerDisabled = false
    }
}

struct ConversaView: View {
    @StateObject private var session: ConversaSession
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @EnvironmentObject private var model: AppModel
    @State private var typed = ""

    init(week: Week, model: AppModel, missedWords: [String] = []) {
        _session = StateObject(wrappedValue: ConversaSession(week: week, model: model, missedWords: missedWords))
    }

    private var state: ConversaState { session.state }

    private var status: String {
        switch state.phase {
        case .listening: return "Your turn, speak now"
        case .speaking: return "Tutor speaking…"
        case .thinking: return "Thinking…"
        case .typing: return "Your turn, type your reply"
        case .paused: return state.pausedReason == "silent" ? "Paused, I couldn't hear you" : "Paused"
        case .failed: return "No answer"
        case .idle, .done: return ""
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let summary = session.summary {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Conversation finished").font(.title2.bold())
                        Text("You took \(summary.turns) \(summary.turns == 1 ? "turn" : "turns"). It wasn't graded or saved.")
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                } else {
                    conversation
                }
            }
            .navigationTitle("Conversa")
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
    }

    private var conversation: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    if state.phase == .listening {
                        Image(systemName: "mic.fill").foregroundStyle(.red).accessibilityHidden(true)
                    }
                    Text(status).font(.caption).foregroundStyle(.secondary)
                }
                ForEach(Array(state.history.enumerated()), id: \.offset) { _, turn in
                    if turn.role == "user" {
                        Text(verbatim: turn.content)
                            .padding(8)
                            .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    } else {
                        ConversaTutorTurn(text: turn.content, ai: model.tutorAI)
                    }
                }
                let live = (state.reply + [state.buffer]).joined(separator: " ").trimmingCharacters(in: .whitespaces)
                if !live.isEmpty { Text(verbatim: live) }
                if let gloss = state.glossed {
                    Text(verbatim: "\(gloss.word): \(gloss.en)").font(.footnote)
                }
                if state.phase == .failed {
                    Text(state.failure == "refused"
                         ? "Apple's on-device model declined to answer that. This happens even with harmless text, so try saying it another way."
                         : "The on-device model couldn't answer.")
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
                if state.phase == .typing { typingField }
                controls
                Text(note).font(.caption2).foregroundStyle(.secondary)
            }
            .padding()
        }
    }

    private var note: String {
        "AI replies come from Apple's on-device model and can be wrong, so trust the reading over the tutor. Nothing is graded or saved. "
            + (session.localSpeech
               ? "Your speech is recognized on this device."
               : "Italian speech recognition here may use Apple's online service. Type instead to avoid that.")
    }

    private var typingField: some View {
        HStack {
            TextField("Type in Italian…", text: $typed)
                .textFieldStyle(.roundedBorder)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onSubmit(submitTyped)
            Button("Send", action: submitTyped).buttonStyle(.borderedProminent)
        }
    }

    private func submitTyped() {
        guard !typed.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        session.send(.typed(typed))
        typed = ""
    }

    @ViewBuilder private var controls: some View {
        ViewThatFits(in: .horizontal) {
            HStack { buttons }
            VStack(alignment: .leading) { buttons }
        }
        .buttonStyle(.bordered)
    }

    @ViewBuilder private var buttons: some View {
        if state.phase == .failed {
            Button("Try again") { session.send(.retry) }.buttonStyle(.borderedProminent)
            Button("Say something else") { session.send(.rephrase) }
        } else if state.phase == .paused {
            Button("Resume") { session.send(.resume) }.buttonStyle(.borderedProminent)
        } else {
            Button("Pause") { session.send(.pause(nil)) }
            Button("Repeat") { session.send(.command(.repeat)) }.disabled(state.generating)
            Button(state.slow ? "Slow" : "Slower") { session.send(.command(.slower)) }.disabled(state.generating || state.slow)
            Button("New topic") { session.send(.command(.skip)) }.disabled(state.generating)
            Button(state.typing ? "Use mic" : "Type instead") { session.send(.setTyping(!state.typing)) }
        }
    }
}

// One tutor reply, with its English fetched only when asked for.
private struct ConversaTutorTurn: View {
    let text: String
    let ai: TutorAI
    @State private var english = ""
    @State private var status = Status.idle

    private enum Status { case idle, loading, done, failed }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            WordGlossText(text: text)
            switch status {
            case .idle:
                Button("In English") { Task { await translate() } }.font(.footnote)
            case .failed:
                Button("Try again") { Task { await translate() } }.font(.footnote)
            case .loading, .done:
                Text(verbatim: english.isEmpty ? "…" : english).font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private func translate() async {
        status = .loading
        english = ""
        let prompt = translatePrompt(text)
        do {
            for try await piece in ai.stream(system: prompt.system, messages: prompt.messages) { english += piece }
            status = .done
        } catch {
            status = .failed
        }
    }
}
