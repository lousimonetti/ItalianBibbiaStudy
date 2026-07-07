import SwiftUI
import BibbiaCore

// Pronunciation practice over SFSpeechRecognizer — Words mode scores a single
// vocab term (recorded into the pronunciation store, feeding the struggle
// list), Shadowing mode (O1) scores the whole example sentence and stays
// session-local, exactly like the web app.

struct PronunciationView: View {
    @EnvironmentObject private var model: AppModel
    @StateObject private var recognizer = SpeechRecognizer()

    @State private var mode: Mode = .words
    @State private var index = 0
    @State private var score: Int?
    @State private var permissionDenied = false

    enum Mode: String, CaseIterable, Identifiable {
        case words = "Words"
        case shadowing = "Shadowing"
        var id: String { rawValue }
    }

    private var cards: [VocabCard] { model.course.allVocab }
    private var card: VocabCard { cards[index % cards.count] }
    private var target: String { mode == .words ? card.it : card.ex }

    var body: some View {
        VStack(spacing: 18) {
            Picker("Mode", selection: $mode) {
                ForEach(Mode.allCases) { m in Text(m.rawValue).tag(m) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            Spacer()

            Text(target)
                .font(mode == .words ? .largeTitle.bold() : .title3.bold())
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            if mode == .words, model.course.locale.hasIPA, let ipa = card.ipa {
                Text(ipa).font(.callout.monospaced()).foregroundStyle(.secondary)
            }
            SpeakerButton(text: target)

            if permissionDenied {
                Text("Microphone / speech recognition permission is off — enable it in iOS Settings → \(model.course.brand.name).")
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            } else {
                Button {
                    toggleRecording()
                } label: {
                    Label(recognizer.isRecording ? "Stop" : "Record",
                          systemImage: recognizer.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .font(.title2)
                }
                .buttonStyle(.borderedProminent)
                .tint(recognizer.isRecording ? .red : .accentColor)
            }

            if !recognizer.transcript.isEmpty {
                Text("Heard: “\(recognizer.transcript)”")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            if let error = recognizer.errorMessage {
                Text(error).font(.caption).foregroundStyle(.red)
            }
            if let score {
                VStack(spacing: 4) {
                    Text("\(score)%")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundStyle(score >= 80 ? Color.accentColor
                                        : score >= 60 ? Color.orange : Color.red)
                    Text(score >= 80 ? "Ottimo!" : score >= 60 ? "Quasi — riprova" : "Riprova")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            HStack {
                Button {
                    advance(-1)
                } label: {
                    Image(systemName: "chevron.left").frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                Button {
                    advance(1)
                } label: {
                    Image(systemName: "chevron.right").frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
        .navigationTitle("Pronunciation")
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear { recognizer.stop() }
        .onChange(of: recognizer.isRecording) { recording in
            if !recording, !recognizer.transcript.isEmpty { finishAttempt() }
        }
    }

    private func toggleRecording() {
        if recognizer.isRecording {
            recognizer.stop()
        } else {
            score = nil
            Task {
                guard await recognizer.requestPermission() else {
                    permissionDenied = true
                    return
                }
                recognizer.start(language: model.ttsLanguage)
            }
        }
    }

    private func finishAttempt() {
        let s = scorePronunciation(target: target, recognized: recognizer.transcript)
        score = s
        if mode == .words {
            // Words feed the persistent store + struggle list; shadowing stays
            // session-local (matches the web behavior).
            model.recordPronunciation(term: card.it, score: s)
        } else {
            model.recordActivity(.practiced)
        }
        s >= 80 ? Haptics.success() : Haptics.light()
    }

    private func advance(_ delta: Int) {
        recognizer.stop()
        score = nil
        index = (index + delta + cards.count) % cards.count
    }
}
