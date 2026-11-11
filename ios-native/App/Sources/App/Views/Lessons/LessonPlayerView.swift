import SwiftUI
import BibbiaCore

// The guided-lesson player: one exercise on screen at a time, a progress bar,
// a verdict after each answer, a summary at the end. Twin of the web's
// LessonPlayer.jsx. Every decision — what the steps are, whether an answer is
// right, what comes back for a retry, what reaches the SRS — is BibbiaCore's
// (Lessons.swift, pinned to the JS by lessons.json). This view only collects a
// value per step and carries out what the run says.

struct LessonPlayerView: View {
    private let planned: Lesson

    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    // The plan is the same for everyone; what is dropped or repeated depends on
    // the words this learner already knows or keeps missing (adaptLesson).
    @State private var lesson: Lesson
    @State private var run: LessonRun
    @State private var didAdapt = false
    @State private var value: LessonValue?
    @State private var verdict: LessonVerdict?
    @State private var summary: LessonSummary?
    @State private var weekDone = false

    init(lesson: Lesson) {
        planned = lesson
        _lesson = State(initialValue: lesson)
        _run = State(initialValue: LessonRun(lesson))
    }

    private var step: LessonStep? { run.current }

    private func adaptedNote(_ a: LessonAdaptation) -> String {
        var parts: [String] = []
        if a.skipped > 0 { parts.append("Skipping \(a.skipped) word\(a.skipped == 1 ? "" : "s") you know well") }
        if a.extra > 0 { parts.append("extra practice on \(a.extra)") }
        return parts.joined(separator: " · ")
    }
    private var ready: Bool { step.map { isLessonStepReady($0, value: value) } ?? false }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            if let summary {
                ScrollView { LessonSummaryView(lesson: lesson, summary: summary, weekDone: weekDone) { dismiss() } }
            } else if let step {
                ScrollView {
                    VStack(spacing: 16) {
                        if let a = lesson.adapted, run.index == 0 {
                            Text(adaptedNote(a))
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        if step.retry {
                            Text("One more try at this one")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 3)
                                .background(Capsule().fill(Color.secondary.opacity(0.15)))
                        }
                        LessonStepView(step: step, value: $value, verdict: verdict,
                                       onPick: pick, onSubmit: primary)
                    }
                    .padding()
                    .frame(maxWidth: 640)
                    .frame(maxWidth: .infinity)
                }
                // A fresh identity per position resets each step's own state
                // (the match board, the text field's focus).
                .id(run.index)
                footer(step)
            }
        }
        .onAppear {
            // Once only: onAppear can fire again mid-lesson, which must not restart the run.
            if !didAdapt {
                didAdapt = true
                let adapted = adaptLesson(planned, store: model.srsStore, now: Date().timeIntervalSince1970 * 1000)
                if adapted != lesson { lesson = adapted; run = LessonRun(adapted) }
            }
            speakIfIntro(run.current)
        }
        .onDisappear { Speaker.shared.stop() }
    }

    private var topBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 12) {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Close lesson")
                ProgressView(value: summary == nil ? run.progress : 1)
                    .tint(.accentColor)
                    .animation(.easeOut(duration: 0.25), value: run.index)
            }
            Text("Week \(lesson.weekN) · \(lesson.title)")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.leading, 56)
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 6)
    }

    @ViewBuilder
    private func footer(_ step: LessonStep) -> some View {
        let tone: Color? = verdict?.correct.map { $0 ? Color.accentColor : Color.red }
        VStack(alignment: .leading, spacing: 10) {
            if let verdict, let correct = verdict.correct {
                VStack(alignment: .leading, spacing: 3) {
                    Text(correct ? "Giusto!" : "Non proprio")
                        .font(.headline)
                        .foregroundStyle(correct ? Color.accentColor : Color.red)
                    if !verdict.answer.isEmpty {
                        HStack(spacing: 6) {
                            Text(verdict.answer).font(.callout.weight(.semibold))
                            if let spoken = italian(for: step) { SpeakerButton(text: spoken, compact: true) }
                        }
                    }
                    if !verdict.note.isEmpty {
                        Text(verdict.note).font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            if isTapOnly(step) && verdict == nil {
                Text("Choose an answer")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 48)
            } else {
                Button(action: primary) {
                    Text(step.isGraded && verdict == nil ? "Check" : "Continue")
                        .font(.headline)
                        .frame(maxWidth: .infinity, minHeight: 32)
                }
                .buttonStyle(.borderedProminent)
                .disabled(verdict == nil && !ready)
            }
        }
        .padding()
        .frame(maxWidth: 640)
        .frame(maxWidth: .infinity)
        .background((tone ?? Color.clear).opacity(0.12))
        .overlay(alignment: .top) { Divider() }
    }

    private func isTapOnly(_ step: LessonStep) -> Bool {
        step.kind == .choice || step.kind == .mc || step.kind == .tf
    }

    /// The Italian worth hearing once a step is answered — the whole sentence
    /// where there is one. Nil when the answer shown is English or Vero/Falso.
    private func italian(for step: LessonStep) -> String? {
        switch step.kind {
        case .cloze: return step.card?.ex
        case .recall: return step.card?.it
        case .drill:
            guard let q = step.q, let a = step.answerText else { return nil }
            let parts = splitBlank(q)
            return parts.before + a + parts.after
        case .transform: return step.answerText
        case .build: return step.text
        case .choice: return step.direction == "en-it" || step.audio ? step.term : nil
        default: return nil
        }
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    private func primary() {
        guard summary == nil, let step else { return }
        if !step.isGraded {
            if ready { goNext(nil) }
        } else if let verdict {
            goNext(verdict.correct)
        } else {
            check(value)
        }
    }

    private func check(_ v: LessonValue?) {
        guard let step, verdict == nil, isLessonStepReady(step, value: v) else { return }
        let result = checkLessonStep(step, value: v, articles: model.articles)
        verdict = result
        if result.correct == true { Haptics.success() } else { Haptics.error() }
    }

    /// Tapping an option is the answer — no separate Check press.
    private func pick(_ v: LessonValue) {
        guard verdict == nil else { return }
        value = v
        check(v)
    }

    private func goNext(_ correct: Bool?) {
        let next = run.advanced(correct: correct)
        run = next
        value = nil
        verdict = nil
        if next.isFinished {
            weekDone = model.completeLesson(lesson, run: next)
            summary = next.summary
            Haptics.success()
        } else {
            speakIfIntro(next.current)
        }
    }

    /// Say a new word as it appears — hearing it first is the point of the step.
    private func speakIfIntro(_ step: LessonStep?) {
        guard let step else { return }
        if step.kind == .intro, let card = step.card {
            Speaker.shared.speak(card.it, language: model.ttsLanguage)
        } else if step.kind == .choice, step.audio, let term = step.term {
            Speaker.shared.speak(term, language: model.ttsLanguage)
        }
    }
}

// ── One step ─────────────────────────────────────────────────────────────────

private struct LessonStepView: View {
    let step: LessonStep
    @Binding var value: LessonValue?
    let verdict: LessonVerdict?
    let onPick: (LessonValue) -> Void
    let onSubmit: () -> Void

    @EnvironmentObject private var model: AppModel

    var body: some View {
        switch step.kind {
        case .intro: intro
        case .match: MatchBoard(step: step) { value = .done }
        case .tip: tip
        case .choice:
            instruction(step.audio ? "Listen — what does it mean?"
                        : step.direction == "it-en" ? "What does this mean?" : "How do you say this in Italian?")
            HStack(spacing: 8) {
                // A listening step keeps the word hidden until it is answered.
                if !step.audio || verdict != nil {
                    Text(step.prompt ?? "").font(.title.bold()).multilineTextAlignment(.center)
                }
                if step.direction == "it-en" { SpeakerButton(text: step.prompt ?? "") }
            }
            options(step.options, answer: step.answerIndex, picked: pickedIndex) { onPick(.index($0)) }
        case .mc:
            instruction("About the reading")
            sentence(step.text ?? "", gloss: true)
            sub(step.en)
            options(step.options, answer: step.answerIndex, picked: pickedIndex) { onPick(.index($0)) }
        case .tf:
            instruction("Vero o falso? — true or false, from the reading")
            sentence(step.text ?? "", gloss: true)
            sub(step.en)
            options(["Vero", "Falso"], answer: step.answerBool.map { $0 ? 0 : 1 }, picked: pickedBool) {
                onPick(.bool($0 == 0))
            }
        case .cloze:
            instruction("Fill the blank — \(step.card?.en ?? "")")
            clozeText(before: step.before ?? "",
                      answer: verdict == nil ? "____" : (step.answerText ?? ""),
                      after: step.after ?? "")
                .font(.title3)
                .multilineTextAlignment(.center)
            LessonTextField(value: $value, verdict: verdict, prompt: "Scrivi qui…", onSubmit: onSubmit)
        case .recall:
            instruction("Type the Italian")
            Text(step.card?.en ?? "").font(.title.bold()).multilineTextAlignment(.center)
            LessonTextField(value: $value, verdict: verdict, prompt: "Scrivi qui…", onSubmit: onSubmit)
        case .drill:
            let parts = splitBlank(step.q ?? "")
            instruction("Complete the sentence")
            clozeText(before: parts.before,
                      answer: verdict == nil ? "____" : (step.answerText ?? ""),
                      after: parts.after)
                .font(.title3)
                .multilineTextAlignment(.center)
            sub(step.hint)
            LessonTextField(value: $value, verdict: verdict, prompt: "Scrivi qui…", onSubmit: onSubmit)
        case .transform:
            instruction(step.instruction ?? "")
            sentence(step.text ?? "", gloss: false)
            LessonTextField(value: $value, verdict: verdict, prompt: "Riscrivi la frase…", onSubmit: onSubmit)
        case .build:
            build
        }
    }

    private var pickedIndex: Int? {
        if case .index(let i) = value { return i }
        return nil
    }

    private var pickedBool: Int? {
        if case .bool(let b) = value { return b ? 0 : 1 }
        return nil
    }

    private func instruction(_ text: String) -> some View {
        Text(text)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
    }

    @ViewBuilder
    private func sub(_ text: String?) -> some View {
        if let text, !text.isEmpty {
            Text(text).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
    }

    @ViewBuilder
    private func sentence(_ text: String, gloss: Bool) -> some View {
        if gloss {
            WordGlossText(text: text).font(.title3)
        } else {
            Text(text).font(.title3).multilineTextAlignment(.center)
        }
    }

    private func eyebrow(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.caption2.bold())
            .tracking(1)
            .foregroundStyle(.tint)
    }

    @ViewBuilder
    private var intro: some View {
        if let card = step.card {
            eyebrow("New word")
            HStack(spacing: 10) {
                Text(card.it).font(.largeTitle.bold()).multilineTextAlignment(.center)
                SpeakerButton(text: card.it)
            }
            if model.course.locale.hasIPA, let ipa = card.ipa {
                Text(ipa).font(.callout.monospaced()).foregroundStyle(.secondary)
            }
            Text(card.en).font(.title3).foregroundStyle(.secondary)
            if !card.ex.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top, spacing: 8) {
                        WordGlossText(text: card.ex).font(.body)
                        Spacer(minLength: 4)
                        SpeakerButton(text: card.ex, compact: true)
                    }
                    if let exEn = card.exEn {
                        Text(exEn).font(.footnote).foregroundStyle(.secondary)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
            }
        }
    }

    private var tip: some View {
        VStack(alignment: .leading, spacing: 10) {
            eyebrow("Grammar")
            Text(step.title ?? "").font(.title3.bold())
            Text(step.body ?? "").font(.callout)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
    }

    private func options(_ labels: [String], answer: Int?, picked: Int?,
                         onTap: @escaping (Int) -> Void) -> some View {
        VStack(spacing: 10) {
            ForEach(Array(labels.enumerated()), id: \.offset) { i, label in
                let state: TileState = verdict == nil ? .idle
                    : i == answer ? .correct
                    : i == picked ? .wrong : .dim
                Button { onTap(i) } label: { LessonTile(label: label, state: state) }
                    .buttonStyle(.plain)
                    .disabled(verdict != nil)
            }
        }
        .frame(maxWidth: 440)
    }

    @ViewBuilder
    private var build: some View {
        let picked: [Int] = { if case .order(let o) = value { return o }; return [] }()
        let tone: Color = verdict?.correct == true ? .accentColor
            : verdict?.correct == false ? .red : Color.secondary.opacity(0.4)
        instruction(step.audio ? "Listen, then put the words in order" : "Put the words in order")
        if step.audio, let text = step.text {
            SpeakerButton(text: text)
                .scaleEffect(1.8)
                .frame(width: 60, height: 60)
                .background(Circle().fill(Color.accentColor.opacity(0.12)))
        }
        sub(step.en)
        FlowLayout(spacing: 8) {
            if picked.isEmpty {
                Text("Tap the words below…").font(.footnote).foregroundStyle(.secondary)
            }
            ForEach(picked, id: \.self) { ci in
                chip(step.chips[ci], selected: true) { value = .order(picked.filter { $0 != ci }) }
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, minHeight: 60, alignment: .topLeading)
        .background(RoundedRectangle(cornerRadius: 12)
            .strokeBorder(tone, style: StrokeStyle(lineWidth: 2, dash: verdict == nil ? [6, 4] : [])))
        FlowLayout(spacing: 8) {
            ForEach(Array(step.chips.enumerated()), id: \.offset) { ci, word in
                if !picked.contains(ci) {
                    chip(word, selected: false) { value = .order(picked + [ci]) }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func chip(_ word: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(word)
                .font(.body.weight(.medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Capsule().fill(selected ? Color.accentColor.opacity(0.15) : Color(.secondarySystemBackground)))
                .overlay(Capsule().strokeBorder(selected ? Color.accentColor : Color.secondary.opacity(0.3)))
        }
        .buttonStyle(.plain)
        .disabled(verdict != nil)
    }
}

private enum TileState { case idle, selected, correct, wrong, dim }

private struct LessonTile: View {
    let label: String
    let state: TileState

    var body: some View {
        let border: Color = {
            switch state {
            case .correct, .selected: return .accentColor
            case .wrong: return .red
            default: return Color.secondary.opacity(0.3)
            }
        }()
        let fill: Color = {
            switch state {
            case .correct: return Color.accentColor.opacity(0.15)
            case .wrong: return Color.red.opacity(0.12)
            default: return Color(.secondarySystemBackground)
            }
        }()
        Text(label)
            .font(.body.weight(.medium))
            .multilineTextAlignment(.center)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(RoundedRectangle(cornerRadius: 12).fill(fill))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(border, lineWidth: 2))
            .opacity(state == .dim ? 0.55 : 1)
            .contentShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct LessonTextField: View {
    @Binding var value: LessonValue?
    let verdict: LessonVerdict?
    let prompt: String
    let onSubmit: () -> Void

    @FocusState private var focused: Bool

    var body: some View {
        let border: Color = verdict?.correct == true ? .accentColor
            : verdict?.correct == false ? .red : Color.secondary.opacity(0.3)
        TextField(prompt, text: Binding(
            get: { if case .text(let s) = value { return s }; return "" },
            set: { value = .text($0) }))
            .font(.title3)
            .multilineTextAlignment(.center)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .submitLabel(.done)
            .focused($focused)
            .onSubmit(onSubmit)
            .disabled(verdict != nil)
            .padding(.vertical, 12)
            .padding(.horizontal, 14)
            .frame(maxWidth: 440)
            .background(RoundedRectangle(cornerRadius: 12).fill(Color(.secondarySystemBackground)))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(border, lineWidth: 2))
            .onAppear { focused = true }
    }
}

// Tap one tile on each side. A right pair locks; a wrong pair flashes and
// clears. Ungraded — a warm-up — but the board cannot be left unfinished.
private struct MatchBoard: View {
    let step: LessonStep
    let onDone: () -> Void

    @State private var left: Int?
    @State private var right: Int?
    @State private var matched = Set<Int>()
    @State private var wrong = false

    var body: some View {
        Text("Match each word to its meaning")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.secondary)
        HStack(alignment: .top, spacing: 12) {
            column(step.left, selection: left, label: { step.pairs[$0].it }) { tap(left: $0) }
            column(step.right, selection: right, label: { step.pairs[$0].en }) { tap(right: $0) }
        }
    }

    private func column(_ order: [Int], selection: Int?, label: @escaping (Int) -> String,
                        tap: @escaping (Int) -> Void) -> some View {
        VStack(spacing: 10) {
            ForEach(order, id: \.self) { idx in
                let state: TileState = matched.contains(idx) ? .correct
                    : selection == idx ? (wrong ? .wrong : .selected) : .idle
                Button { tap(idx) } label: { LessonTile(label: label(idx), state: state) }
                    .buttonStyle(.plain)
                    .disabled(matched.contains(idx))
                    .opacity(matched.contains(idx) ? 0.7 : 1)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func tap(left idx: Int) {
        guard !wrong else { return }
        left = left == idx ? nil : idx
        resolve()
    }

    private func tap(right idx: Int) {
        guard !wrong else { return }
        right = right == idx ? nil : idx
        resolve()
    }

    private func resolve() {
        guard let l = left, let r = right else { return }
        if l == r {
            matched.insert(l)
            left = nil
            right = nil
            Haptics.light()
            if matched.count == step.pairs.count { onDone() }
        } else {
            wrong = true
            Haptics.error()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                wrong = false
                left = nil
                right = nil
            }
        }
    }
}

private struct LessonSummaryView: View {
    let lesson: Lesson
    let summary: LessonSummary
    let weekDone: Bool
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            Text(summary.pct >= 90 ? "Perfetto!" : summary.pct >= 70 ? "Bravo!" : "Continua così!")
                .font(.title.bold())
                .foregroundStyle(.tint)
            Text("Lesson complete — \(lesson.title)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(summary.pct)%").font(.system(size: 54, weight: .heavy, design: .rounded))
            Text("\(summary.correct) of \(summary.graded) right first time")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            if weekDone {
                Label("Week \(lesson.weekN) complete — every lesson finished", systemImage: "checkmark.seal.fill")
                    .font(.subheadline.bold())
                    .foregroundStyle(.tint)
            }
            if !lesson.words.isEmpty {
                Text("These words are now in your review:")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.top, 6)
                FlowLayout(spacing: 6) {
                    ForEach(lesson.words, id: \.self) { word in
                        Text(word)
                            .font(.footnote.weight(.medium))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.accentColor.opacity(0.12)))
                    }
                }
            }
            Button(action: onClose) {
                Text("Continue").font(.headline).frame(maxWidth: .infinity, minHeight: 32)
            }
            .buttonStyle(.borderedProminent)
            .padding(.top, 14)
        }
        .padding()
        .padding(.top, 32)
        .frame(maxWidth: 640)
        .frame(maxWidth: .infinity)
    }
}
