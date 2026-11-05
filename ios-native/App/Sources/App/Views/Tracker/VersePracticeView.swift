import SwiftUI
import BibbiaCore

// Fills in a verse's blanks. Shared by Memorize and verse review. A Text flow can't
// host inline fields in SwiftUI, so the verse shows numbered gaps above one field per gap.
struct VerseBlanksView: View {
    let text: String
    let stage: Int
    let onChecked: (StageResult) -> Void
    @EnvironmentObject private var model: AppModel
    @State private var answers: [String] = []
    @State private var result: StageResult?

    private var parts: [StagePart] { stageParts(text, stage: stage) }

    private var display: String {
        var n = 0
        return parts.map { part -> String in
            if !part.blank { return part.pre + part.word + part.post }
            n += 1
            return "\(part.pre)[\(n)]\(part.post)"
        }.joined(separator: " ")
    }

    var body: some View {
        let count = parts.filter(\.blank).count
        VStack(alignment: .leading, spacing: 10) {
            Text(verbatim: display).font(.body)
            if answers.count == count {
                ForEach(0..<count, id: \.self) { i in
                    HStack {
                        Text(verbatim: "\(i + 1)").font(.caption).foregroundStyle(.secondary).frame(width: 22)
                        TextField("Missing word", text: $answers[i])
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .disabled(result != nil)
                        if let result {
                            Image(systemName: result.results[i] ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(result.results[i] ? Color.accentColor : .red)
                                .accessibilityLabel(result.results[i] ? "Correct" : "Incorrect")
                        }
                    }
                }
            }
            if result == nil {
                Button("Check") {
                    let checked = checkStage(parts, answers: answers, articles: model.articles)
                    result = checked
                    onChecked(checked)
                }
                .buttonStyle(.borderedProminent)
            } else if let result, result.wrong > 0 {
                Text(verbatim: text).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .onAppear { answers = Array(repeating: "", count: count) }
    }
}

private struct MemorizeView: View {
    let row: ReadingRow
    @EnvironmentObject private var model: AppModel
    @State private var stage = 0
    @State private var attempt = 0
    @State private var result: StageResult?

    var body: some View {
        let count = stageCount(row.t)
        let passed = result?.wrong == 0
        let finished = passed && stage == count - 1
        VStack(alignment: .leading, spacing: 10) {
            Text("Stage \(stage + 1) of \(count)").font(.caption).foregroundStyle(.secondary)
            VerseBlanksView(text: row.t, stage: stage) { checked in
                result = checked
                if checked.wrong == 0 && stage == count - 1 { model.recordActivity(.practiced) }
            }
            .id("\(row.id)-\(attempt)")
            if finished {
                Text("Bene! You wrote the whole verse from memory.").foregroundStyle(Color.accentColor)
                Button("Start over") { again(0) }
            } else if passed {
                Button("Next stage") { again(stage + 1) }
            } else if result != nil {
                Button("Try again") { again(stage) }
            }
        }
    }

    private func again(_ next: Int) {
        stage = next
        result = nil
        attempt += 1
    }
}

private struct BuildView: View {
    let row: ReadingRow
    @EnvironmentObject private var model: AppModel
    @State private var index = 0
    @State private var picked: [Int] = []
    @State private var chips: [String] = []

    private var chunks: [String] {
        verseChunks(row.t).filter { $0.split(whereSeparator: \.isWhitespace).count >= 4 }
    }

    private func tokens(_ chunk: String) -> [String] {
        chunk.split(whereSeparator: \.isWhitespace).map(String.init)
    }

    private func load() {
        picked = []
        guard index < chunks.count else { return }
        let original = tokens(chunks[index])
        var shuffled = original.shuffled()
        if shuffled == original, Set(original).count > 1 {
            while shuffled == original { shuffled.shuffle() }
        }
        chips = shuffled
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if chunks.isEmpty {
                Text("This verse is too short to rebuild. Try another one.").foregroundStyle(.secondary)
            } else if index >= chunks.count {
                Text("Bene! You rebuilt the whole verse.").foregroundStyle(Color.accentColor)
                Button("Again") { index = 0; load() }
            } else {
                let answer = tokens(chunks[index])
                let complete = picked.count == answer.count
                let correct = complete && picked.map { chips[$0] } == answer
                if chunks.count > 1 {
                    Text("Part \(index + 1) of \(chunks.count)").font(.caption).foregroundStyle(.secondary)
                }
                ChipFlow(spacing: 6) {
                    ForEach(Array(picked.enumerated()), id: \.offset) { position, chip in
                        Button(chips[chip]) { picked.remove(at: position) }
                            .buttonStyle(.borderedProminent)
                            .disabled(correct)
                    }
                }
                .frame(minHeight: 40)
                if complete && !correct {
                    Text("Not quite. Tap a word to take it back.").font(.footnote).foregroundStyle(.red)
                }
                Divider()
                ChipFlow(spacing: 6) {
                    ForEach(chips.indices.filter { !picked.contains($0) }, id: \.self) { chip in
                        Button(chips[chip]) { picked.append(chip) }.buttonStyle(.bordered)
                    }
                }
                if correct {
                    Button("Next") {
                        if index + 1 == chunks.count { model.recordActivity(.practiced) }
                        index += 1
                        load()
                    }
                }
            }
        }
        .onAppear(perform: load)
    }
}

// Wraps word chips onto as many lines as they need.
private struct ChipFlow: Layout {
    var spacing: CGFloat

    private func rows(_ width: CGFloat, _ subviews: Subviews) -> [[(LayoutSubviews.Element, CGSize)]] {
        var rows: [[(LayoutSubviews.Element, CGSize)]] = [[]]
        var x: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > width, !rows[rows.count - 1].isEmpty {
                rows.append([])
                x = 0
            }
            rows[rows.count - 1].append((view, size))
            x += size.width + spacing
        }
        return rows
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        let laid = rows(width, subviews)
        let height = laid.reduce(0) { $0 + ($1.map(\.1.height).max() ?? 0) }
            + spacing * CGFloat(max(laid.count - 1, 0))
        return CGSize(width: width == .infinity ? 0 : width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for row in rows(bounds.width, subviews) {
            var x = bounds.minX
            let height = row.map(\.1.height).max() ?? 0
            for (view, size) in row {
                view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += height + spacing
        }
    }
}

private struct ShadowView: View {
    let row: ReadingRow
    @EnvironmentObject private var model: AppModel
    @State private var voice = TutorVoice()
    @State private var busy: String?
    @State private var results: [String: String] = [:]

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(verseChunks(row.t), id: \.self) { chunk in
                VStack(alignment: .leading, spacing: 6) {
                    Text(verbatim: chunk)
                    Button(busy == chunk ? "Listen, then repeat…" : "Hear & repeat") { run(chunk) }
                        .buttonStyle(.bordered)
                        .disabled(busy != nil)
                    if let result = results[chunk] {
                        Text(verbatim: result).font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .onDisappear { voice.cancel() }
    }

    private func run(_ chunk: String) {
        busy = chunk
        results[chunk] = nil
        Task {
            defer { busy = nil }
            guard await voice.requestMic() else {
                results[chunk] = "The microphone isn't available."
                return
            }
            await voice.speak(chunk, language: model.ttsLanguage, slow: false)
            switch await voice.listen(language: model.ttsLanguage) {
            case .words(let alternatives):
                let score = alternatives.map { scoreRepeat(target: chunk, heard: $0) }.max() ?? 0
                results[chunk] = "\(score)% · Heard: “\(alternatives.first ?? "")”"
                model.recordActivity(.practiced)
            case .noSpeech: results[chunk] = "I didn't hear you."
            case .micUnavailable: results[chunk] = "The microphone isn't available."
            case .cancelled: break
            }
        }
    }
}

struct VersePracticeView: View {
    let week: Week
    @State private var index = 0
    @State private var mode = Mode.memorize

    private enum Mode: String, CaseIterable, Identifiable {
        case memorize = "Memorize", build = "Build", shadow = "Shadow"
        var id: String { rawValue }
    }

    var body: some View {
        let rows = verseRefs(week)
        ScrollView {
            if rows.indices.contains(index) {
                let row = rows[index]
                VStack(alignment: .leading, spacing: 12) {
                    Picker("Verse", selection: $index) {
                        ForEach(rows.indices, id: \.self) { i in
                            Text(rows[i].fullRef.isEmpty ? "Verse \(i + 1)" : rows[i].fullRef).tag(i)
                        }
                    }
                    Picker("Practice style", selection: $mode) {
                        ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    HStack {
                        Text(verbatim: row.fullRef).font(.headline)
                        SpeakerButton(text: row.t, compact: true)
                    }
                    if !row.en.isEmpty {
                        Text(verbatim: row.en).font(.footnote).foregroundStyle(.secondary)
                    }
                    switch mode {
                    case .memorize: MemorizeView(row: row).id(row.id)
                    case .build: BuildView(row: row).id(row.id)
                    case .shadow: ShadowView(row: row).id(row.id)
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Versetti")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// Spaced review of whole verses: due ones first, then a few new ones each day.
struct VerseReviewView: View {
    @EnvironmentObject private var model: AppModel
    @State private var queue: [VocabCard]?
    @State private var stages: [String: Int] = [:]
    @State private var index = 0
    @State private var checked: SRSGrade?
    @State private var good = 0
    @State private var total = 0

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if let queue, index < queue.count {
                    card(queue[index], count: queue.count)
                } else {
                    start
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
        }
        .navigationTitle("Verse review")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder private var start: some View {
        let stats = srsStats(cards: model.reachedVerseCards, store: model.verseSrsStore,
                             now: Date().timeIntervalSince1970 * 1000)
        Text("Write verses from memory at spaced intervals. The better you know one, the more of it you'll be asked for.")
            .font(.footnote).foregroundStyle(.secondary)
        if let queue, !queue.isEmpty {
            Text("Session finished: \(good) of \(total) without a mistake.").foregroundStyle(Color.accentColor)
        }
        Text("\(stats.due) due · \(stats.new) new · \(stats.learned) started")
        if queue?.isEmpty == true {
            Text("You're all caught up for today.").foregroundStyle(.secondary)
        } else if stats.due + stats.new > 0 {
            Button("Start review") {
                let session = model.buildVerseSession()
                // Fixed when the session starts: grading a card raises its reps, and a
                // stage recomputed then would change the blanks just checked.
                stages = Dictionary(uniqueKeysWithValues: session.map { card in
                    (card.it, stageForReps(model.verseSrsStore[card.it]?.reps, count: stageCount(card.ex)))
                })
                queue = session
                index = 0
                checked = nil
                good = 0
                total = 0
            }
            .buttonStyle(.borderedProminent)
        }
    }

    @ViewBuilder private func card(_ card: VocabCard, count: Int) -> some View {
        Text("Verse \(index + 1) of \(count)").font(.caption).foregroundStyle(.secondary)
        HStack {
            Text(verbatim: card.it).font(.headline)
            if checked != nil { SpeakerButton(text: card.ex, compact: true) }
        }
        if !card.en.isEmpty { Text(verbatim: card.en).font(.footnote).foregroundStyle(.secondary) }
        VerseBlanksView(text: card.ex, stage: stages[card.it] ?? 0) { result in
            let grade = gradeResult(result)
            checked = grade
            total += 1
            if grade == .good { good += 1 }
            model.recordVerseReview(id: card.it, grade: grade)
        }
        .id(card.it)
        if checked != nil {
            Button("Next") {
                index += 1
                checked = nil
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
