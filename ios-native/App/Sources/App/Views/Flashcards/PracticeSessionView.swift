import SwiftUI
import BibbiaCore

// One SRS practice session. Cards graded "Got it" / "Still learning" write
// through BibbiaCore's srsReview into the shared store; a card graded
// "again" re-enters the back of this session's queue (like the web app,
// where it stays due and resurfaces).

struct PracticeSessionView: View {
    let payload: PracticeSessionPayload

    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var queue: [VocabCard] = []
    @State private var revealed = false
    @State private var typed = ""
    @State private var typedResult: Bool?
    @State private var done = 0
    @State private var missed = Set<String>()

    private var card: VocabCard? { queue.first }
    private var style: PracticeStyle { payload.style }

    var body: some View {
        NavigationStack {
            Group {
                if let card {
                    cardView(card)
                } else {
                    summaryView
                }
            }
            .navigationTitle("\(done) done · \(queue.count) left")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
            .onAppear { queue = payload.cards }
        }
    }

    // ── Card front/back per style ────────────────────────────────────────────
    @ViewBuilder
    private func cardView(_ card: VocabCard) -> some View {
        VStack(spacing: 20) {
            Spacer()
            switch style {
            case .recognition:
                Text(card.it).font(.largeTitle.bold())
                SpeakerButton(text: card.it)
                if revealed {
                    revealBlock(card)
                } else {
                    Button("Show answer") { reveal() }
                        .buttonStyle(.borderedProminent)
                }
            case .recall:
                Text(card.en).font(.title.bold())
                if revealed {
                    typedFeedback(expected: card.it)
                    revealBlock(card)
                } else {
                    answerField(prompt: "In italiano…", expected: card.it)
                }
            case .cloze:
                if let cloze = makeCloze(term: card.it, example: card.ex,
                                         articles: model.articles) {
                    (Text(cloze.before) +
                     Text(revealed ? cloze.answer : "____").bold().foregroundColor(.accentColor) +
                     Text(cloze.after))
                        .font(.title3)
                        .multilineTextAlignment(.center)
                    Text(card.en).font(.subheadline).foregroundStyle(.secondary)
                    if revealed {
                        typedFeedback(expected: cloze.answer)
                        revealBlock(card)
                    } else {
                        answerField(prompt: "La parola mancante…", expected: cloze.answer)
                    }
                } else {
                    // Not cloze-eligible — degrade to recognition (like the web).
                    Text(card.it).font(.largeTitle.bold())
                    if revealed {
                        revealBlock(card)
                    } else {
                        Button("Show answer") { reveal() }
                            .buttonStyle(.borderedProminent)
                    }
                }
            case .listening:
                HStack(spacing: 24) {
                    VStack {
                        SpeakerButton(text: card.ex)
                        Text("normale").font(.caption2).foregroundStyle(.secondary)
                    }
                    VStack {
                        SpeakerButton(text: card.ex, rate: Speaker.slowRate)
                        Text("lento").font(.caption2).foregroundStyle(.secondary)
                    }
                }
                if revealed {
                    typedFeedback(expected: card.ex)
                    revealBlock(card)
                } else {
                    answerField(prompt: "Scrivi quello che senti…", expected: card.ex)
                }
            }
            Spacer()
            if revealed { gradeButtons(card) }
        }
        .padding()
        .onAppear { if style == .listening { Speaker.shared.speak(card.ex, language: model.ttsLanguage) } }
    }

    private func revealBlock(_ card: VocabCard) -> some View {
        VStack(spacing: 8) {
            if style != .recognition {
                Text(card.it).font(.title.bold())
            }
            Text(card.en).font(.headline).foregroundStyle(.secondary)
            if model.course.locale.hasIPA, let ipa = card.ipa {
                Text(ipa).font(.callout.monospaced()).foregroundStyle(.secondary)
            }
            HStack(spacing: 8) {
                WordGlossText(text: card.ex).font(.callout.italic())
                SpeakerButton(text: card.ex, compact: true)
            }
        }
    }

    private func answerField(prompt: String, expected: String) -> some View {
        VStack(spacing: 10) {
            TextField(prompt, text: $typed)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .onSubmit { checkTyped(expected: expected) }
            HStack {
                Button("Check") { checkTyped(expected: expected) }
                    .buttonStyle(.borderedProminent)
                    .disabled(typed.trimmingCharacters(in: .whitespaces).isEmpty)
                Button("I don't know") { typedResult = false; reveal() }
                    .buttonStyle(.bordered)
            }
        }
        .padding(.horizontal)
    }

    @ViewBuilder
    private func typedFeedback(expected: String) -> some View {
        if let typedResult {
            Text(typedResult ? "✓ Giusto!" : "✗ You wrote: \(typed.isEmpty ? "—" : typed)")
                .font(.callout.bold())
                .foregroundStyle(typedResult ? Color.accentColor : Color.red)
        }
    }

    private func gradeButtons(_ card: VocabCard) -> some View {
        HStack(spacing: 12) {
            Button {
                grade(card, .again)
            } label: {
                Label("Still learning", systemImage: "arrow.counterclockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .tint(.red)

            Button {
                grade(card, .good)
            } label: {
                Label("Got it", systemImage: "checkmark")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private var summaryView: some View {
        VStack(spacing: 16) {
            Text("Sessione finita! 🎉").font(.title.bold())
            Text("\(done) cards reviewed" + (missed.isEmpty ? ""
                 : " · \(missed.count) to revisit"))
                .foregroundStyle(.secondary)
            Button("Done") { dismiss() }
                .buttonStyle(.borderedProminent)
        }
    }

    // ── Actions ──────────────────────────────────────────────────────────────
    private func reveal() {
        revealed = true
        Haptics.light()
    }

    private func checkTyped(expected: String) {
        let ok = checkAnswer(expected: expected, given: typed, articles: model.articles)
        typedResult = ok
        ok ? Haptics.success() : Haptics.error()
        reveal()
    }

    private func grade(_ card: VocabCard, _ g: SRSGrade) {
        model.recordReview(term: card.it, grade: g)
        if g == .again { missed.insert(card.it) }
        done += 1
        queue.removeFirst()
        // "Still learning" cards come back at the end of this session.
        if g == .again { queue.append(card) }
        revealed = false
        typed = ""
        typedResult = nil
    }
}
