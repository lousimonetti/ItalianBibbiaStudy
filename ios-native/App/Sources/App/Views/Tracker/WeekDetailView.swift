import SwiftUI
import BibbiaCore

struct WeekDetailView: View {
    let week: Week
    @EnvironmentObject private var model: AppModel

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(week.r).font(.headline)
                    Text("\(model.weekLabel(week.n)) · \(week.b)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Toggle("Week completed", isOn: Binding(
                    get: { model.isWeekDone(week.n) },
                    set: { _ in model.toggleWeek(week.n) }))
            }

            if let passage = week.passage {
                Section("Lettura — \(passage.ref) (\(passage.translation))") {
                    ReadingPassageView(passage: passage)
                }
            }

            Section("Vocabolario (\(week.vocab.count))") {
                ForEach(week.vocab, id: \.it) { card in
                    VocabRow(card: card)
                }
            }

            Section("Grammatica — \(week.grammar.title)") {
                Text(week.grammar.body)
                    .font(.callout)
            }

            let drills = drillItems(week)
            if !drills.isEmpty {
                Section("Esercizi di grammatica") {
                    ForEach(Array(drills.enumerated()), id: \.offset) { _, item in
                        GrammarDrillRow(item: item)
                    }
                }
            }

            let checks = comprehensionItems(week)
            if !checks.isEmpty {
                Section("Comprensione") {
                    ForEach(Array(checks.enumerated()), id: \.offset) { _, item in
                        ComprehensionRow(item: item)
                    }
                }
            }

            if let passage = week.passage, let verse = passage.verses.first {
                Section("Dictogloss — ascolta e ricostruisci") {
                    DictoglossView(sentence: verse.t)
                }
            }

            Section("Scrittura — prompt") {
                WordGlossText(text: week.prompt.it)
                    .font(.callout.italic())
                Text(week.prompt.en)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let italki = week.italki, !italki.isEmpty {
                Section("iTalki — conversation starters") {
                    ForEach(italki, id: \.self) { line in
                        HStack(alignment: .top) {
                            WordGlossText(text: line).font(.callout)
                            Spacer(minLength: 8)
                            SpeakerButton(text: line, compact: true)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Week \(week.n)")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct VocabRow: View {
    let card: VocabCard
    @EnvironmentObject private var model: AppModel

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(card.it).font(.body.bold())
                SpeakerButton(text: card.it, compact: true)
                Spacer()
                Text(card.en)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if model.course.locale.hasIPA, let ipa = card.ipa {
                Text(ipa)
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
            }
            // The form the headword actually takes in the sentence below.
            // Naming the lemma↔inflection relationship is most of what an
            // English speaker has to learn about Italian verbs.
            if let form = card.form, form.lowercased() != card.it.lowercased() {
                Text("→ \(form)")
                    .font(.caption)
                    .foregroundStyle(.tint)
            }
            HStack(alignment: .top, spacing: 8) {
                WordGlossText(text: card.ex)
                    .font(.callout.italic())
                Spacer(minLength: 8)
                SpeakerButton(text: card.ex, compact: true)
            }
            if let exEn = card.exEn {
                Text(exEn)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

// The week's passage, read the way the web reader reads it (ReadingPassage.jsx):
// every word tappable, a speaker per verse — and three ways to get at the
// English, because a word gloss and a whole translation answer different
// questions. The view state is ReadingViewState in BibbiaCore, persisted under
// the same `reading-view` key the web app uses, so the habit travels with a
// backup file.
struct ReadingPassageView: View {
    let passage: Passage
    @EnvironmentObject private var model: AppModel
    @State private var markedRead = false
    @State private var view = ReadingViewState.decode(WebStore.loadString("reading-view"))
    /// Verses whose English the reader pulled up one at a time. Deliberately
    /// not persisted: needing one line is a moment, not a setting.
    @State private var revealed: Set<Int> = []

    var fullText: String { passage.verses.map(\.t).joined(separator: " ") }

    private var translated: Bool { passageHasEnglish(passage) }
    private var englishOnly: Bool { view.english == .only }

    private var englishLabel: String {
        switch view.english {
        case .off: return "Inglese"
        case .under: return "✓ Inglese"
        case .only: return "✓ Solo inglese"
        }
    }

    private func cycleEnglish() {
        view.cycleEnglish()
        WebStore.saveString("reading-view", view.encoded())
        Haptics.light()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if translated {
                Button(action: cycleEnglish) {
                    Text(englishLabel)
                        .font(.caption.bold())
                }
                .buttonStyle(.bordered)
                .tint(view.english == .off ? .secondary : .accentColor)
                .accessibilityHint("Cycles between Italian, English under each verse, and English only")
            }

            ForEach(passage.verses) { verse in
                verseRow(verse)
            }
            footerRow
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func verseRow(_ verse: Verse) -> some View {
        // A verse with no authored English keeps its Italian in the English-only
        // view rather than leaving a hole in the passage.
        let en = (verse.en?.isEmpty == false) ? verse.en : nil
        let showsEnglishUnder = !englishOnly && en != nil
            && (view.english == .under || revealed.contains(verse.n))

        HStack(alignment: .top, spacing: 8) {
            Text("\(verse.n)")
                .font(.caption2.bold())
                .foregroundStyle(.secondary)
                .frame(width: 20, alignment: .trailing)

            VStack(alignment: .leading, spacing: 3) {
                if englishOnly, let en {
                    Text(en)
                        .font(.callout)
                } else {
                    WordGlossText(text: verse.t)
                        .font(.callout)
                }
                if showsEnglishUnder, let en {
                    Text(en)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer(minLength: 4)

            if view.english == .off, en != nil {
                Button {
                    if revealed.contains(verse.n) {
                        revealed.remove(verse.n)
                    } else {
                        revealed.insert(verse.n)
                    }
                    Haptics.light()
                } label: {
                    Text("EN")
                        .font(.caption2.bold())
                }
                .buttonStyle(.borderless)
                .foregroundStyle(revealed.contains(verse.n) ? Color.accentColor : Color.secondary)
                .accessibilityLabel("English for verse \(verse.n)")
            }

            // Speaks the Italian in every view — in the English-only reading
            // that is the point: read the meaning, hear the line it belongs to.
            SpeakerButton(text: verse.t, compact: true)
        }
    }

    private var footerRow: some View {
        HStack {
            SpeakerButton(text: fullText)
            Text("Ascolta tutto")
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Button {
                model.recordActivity(.read)
                markedRead = true
                Haptics.success()
            } label: {
                Label(markedRead || model.flagsToday.read ? "Letto ✓" : "Segna come letto",
                      systemImage: "book")
                    .font(.caption.bold())
            }
            .buttonStyle(.bordered)
            .disabled(markedRead || model.flagsToday.read)
        }
    }
}

private struct GrammarDrillRow: View {
    let item: DrillItem
    @EnvironmentObject private var model: AppModel
    @State private var answer = ""
    @State private var result: Bool?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            let split = splitBlank(item.q)
            clozeText(before: split.before, answer: "____", after: split.after)
                .font(.callout)
            if let hint = item.hint {
                Text(hint)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack {
                TextField("La risposta…", text: $answer)
                    .textFieldStyle(.roundedBorder)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .onSubmit(check)
                Button("Check", action: check)
                    .buttonStyle(.borderedProminent)
                    .disabled(answer.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if let result {
                Text(result ? "✓ Giusto!" : "✗ Risposta: \(item.a)")
                    .font(.caption.bold())
                    .foregroundStyle(result ? Color.accentColor : Color.red)
            }
        }
        .padding(.vertical, 2)
    }

    private func check() {
        let ok = checkAnswer(expected: item.a, given: answer, articles: model.articles)
        result = ok
        ok ? Haptics.success() : Haptics.error()
        if ok { model.recordActivity(.practiced) }
    }
}

private struct ComprehensionRow: View {
    let item: ComprehensionItem
    @State private var response: ComprehensionResponse?

    var answered: Bool { response != nil }
    var correct: Bool { response.map { isComprehensionCorrect(item, response: $0) } ?? false }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            WordGlossText(text: item.it).font(.callout)
            if let en = item.en {
                Text(en)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            if item.type == "tf" {
                HStack {
                    choiceButton("Vero", .bool(true))
                    choiceButton("Falso", .bool(false))
                }
            } else if let options = item.options {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(Array(options.enumerated()), id: \.offset) { i, option in
                        choiceButton(option, .index(i))
                    }
                }
            }
            if answered {
                Text(correct ? "✓ Giusto!" : "✗ Non proprio.")
                    .font(.caption.bold())
                    .foregroundStyle(correct ? Color.accentColor : Color.red)
                if let explain = item.explain {
                    Text(explain)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func choiceButton(_ label: String, _ value: ComprehensionResponse) -> some View {
        Button {
            guard !answered else { return }
            response = value
            isComprehensionCorrect(item, response: value) ? Haptics.success() : Haptics.error()
        } label: {
            Text(label)
                .font(.callout)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .frame(maxWidth: item.type == "mc" ? .infinity : nil, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 8)
                    .fill(background(for: value)))
        }
        .buttonStyle(.plain)
    }

    private func background(for value: ComprehensionResponse) -> Color {
        guard let response, response == value else { return Color.secondary.opacity(0.1) }
        return correct ? Color.accentColor.opacity(0.3) : Color.red.opacity(0.25)
    }
}

private struct DictoglossView: View {
    let sentence: String
    @EnvironmentObject private var model: AppModel
    @State private var attempt = ""
    @State private var diff: ReconstructionDiff?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                SpeakerButton(text: sentence)
                Text("Ascolta la frase, poi scrivi quello che ricordi.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                SpeakerButton(text: sentence, rate: Speaker.slowRate, compact: true)
                Text("lento").font(.caption2).foregroundStyle(.secondary)
            }
            TextField("La tua ricostruzione…", text: $attempt, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .lineLimit(2...4)
            Button("Confronta") {
                diff = diffReconstruction(original: sentence, attempt: attempt)
                model.recordActivity(.practiced)
            }
            .buttonStyle(.borderedProminent)
            .disabled(attempt.trimmingCharacters(in: .whitespaces).isEmpty)

            if let diff {
                Text("Recall: \(diff.score)%")
                    .font(.caption.bold())
                FlowLayout(spacing: 4) {
                    ForEach(Array(diff.original.enumerated()), id: \.offset) { _, mark in
                        Text(mark.w)
                            .font(.caption)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(RoundedRectangle(cornerRadius: 4)
                                .fill(mark.ok ? Color.accentColor.opacity(0.25)
                                              : Color.red.opacity(0.2)))
                    }
                }
            }
        }
        .padding(.vertical, 2)
    }
}
