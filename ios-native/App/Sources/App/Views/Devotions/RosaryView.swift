import SwiftUI
import BibbiaCore

// Guided Rosary — the native port of src/components/RosaryTab.jsx.
//
// Five decades means the Ave Maria fifty times: the same Italian, said aloud,
// until it is yours. The step list comes from BibbiaCore's buildRosarySteps
// (fixture-checked against the web); prayer texts are the course's devotions,
// looked up by id, so this and the Prayers tab share one source.
//
// Reached from the top of the Prayers tab rather than its own tab — a sixth
// tab on iPhone would land in the "More" overflow.
struct RosaryView: View {
    @EnvironmentObject private var model: AppModel
    @State private var set: MysterySet?
    @State private var stepIndex: Int?       // nil = the start screen
    @State private var finished = false
    @State private var showEnglish = false

    private var rosary: RosaryData? { model.course.rosary }
    private var steps: [RosaryStep] {
        guard let rosary, let set else { return [] }
        return buildRosarySteps(rosary, set: set)
    }
    private var today: String { todayStr() }
    private var todaysSet: MysterySet? {
        rosary.flatMap { mysterySet(forDay: jsWeekday(), in: $0.sets) }
    }

    var body: some View {
        Group {
            if finished, let set {
                RosaryDoneView(set: set, completed: model.rosaryState.completed) {
                    finished = false
                    stepIndex = nil
                }
            } else if let stepIndex, let set, steps.indices.contains(stepIndex) {
                RosaryGuideView(set: set, steps: steps, index: stepIndex, showEnglish: $showEnglish,
                                onMove: move, onPause: { self.stepIndex = nil })
            } else {
                startScreen
            }
        }
        .navigationTitle("Il Santo Rosario")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard set == nil, let rosary else { return }
            let resume = model.rosaryState.resume(for: today)
            set = resume.flatMap { r in rosary.sets.first { $0.id == r.setId } } ?? todaysSet
        }
    }

    // MARK: navigation

    private func move(_ delta: Int) {
        guard let current = stepIndex, let set else { return }
        let next = current + delta
        if next >= steps.count {
            model.completeRosary()
            Haptics.success()
            finished = true
            return
        }
        guard next >= 0 else { return }
        Haptics.light()
        stepIndex = next
        model.saveRosaryPosition(setId: set.id, step: next)
    }

    private func begin() {
        guard let set else { return }
        finished = false
        stepIndex = 0
        model.saveRosaryPosition(setId: set.id, step: 0)
    }

    // MARK: start screen

    @ViewBuilder
    private var startScreen: some View {
        if let rosary {
            List {
                if let resume = model.rosaryState.resume(for: today),
                   let resumeSet = rosary.sets.first(where: { $0.id == resume.setId }) {
                    Section {
                        Button {
                            set = resumeSet
                            finished = false
                            stepIndex = resume.step
                        } label: {
                            Label("Riprendi — step \(resume.step + 1) of today's \(resumeSet.titleEn)",
                                  systemImage: "arrow.uturn.forward.circle.fill")
                        }
                    }
                }

                Section {
                    ForEach(rosary.sets) { s in
                        Button {
                            set = s
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(s.title).foregroundStyle(.primary)
                                    Text(s.titleEn + (s.id == todaysSet?.id ? " · oggi" : ""))
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if s.id == set?.id {
                                    Image(systemName: "checkmark").foregroundStyle(Color.accentColor)
                                }
                            }
                        }
                        .accessibilityAddTraits(s.id == set?.id ? .isSelected : [])
                    }
                } header: {
                    Text("Misteri")
                } footer: {
                    Text("Today's mysteries are chosen for you by the traditional weekly cycle; pick any set to pray another.")
                }

                if let set {
                    Section(set.title) {
                        ForEach(Array(set.mysteries.enumerated()), id: \.offset) { i, m in
                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(i + 1). \(capitalizeFirst(m.it))")
                                Text("\(m.en) · \(m.ref)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                    Section {
                        Button(action: begin) {
                            Text("Inizia il Rosario")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                    } footer: {
                        if model.rosaryState.completed > 0 {
                            Text("Rosaries prayed in Italian: \(model.rosaryState.completed)"
                                 + (model.rosaryState.last == today ? " — including today" : ""))
                        }
                    }
                }
            }
        } else {
            ContentUnavailableView("No Rosary in this course", systemImage: "circle.dotted")
        }
    }
}

// MARK: - Guided step

private struct RosaryGuideView: View {
    let set: MysterySet
    let steps: [RosaryStep]
    let index: Int
    @Binding var showEnglish: Bool
    let onMove: (Int) -> Void
    let onPause: () -> Void

    @EnvironmentObject private var model: AppModel
    private var step: RosaryStep { steps[index] }

    private var sectionLabel: (it: String, en: String) {
        switch step.section {
        case .intro: return ("Introduzione", "Opening prayers")
        case .closing: return ("Conclusione", "Closing prayers")
        case .decade(let d): return ("Decina \(d + 1) di 5", "Decade \(d + 1) of 5")
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 8) {
                HStack(alignment: .firstTextBaseline) {
                    Text(sectionLabel.it).font(.subheadline.bold())
                    Text(sectionLabel.en).font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text(set.title).font(.caption).foregroundStyle(.secondary)
                }
                ProgressView(value: Double(index + 1), total: Double(steps.count))
                BeadStrip(steps: sectionSteps(steps, of: step), current: step.index)
            }
            .padding(.horizontal)
            .padding(.vertical, 8)

            Divider()

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if step.kind == .mystery {
                        MysteryStepView(step: step, set: set, showEnglish: showEnglish)
                    } else {
                        PrayerStepView(step: step, showEnglish: showEnglish)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
            .id(index) // start each step at the top
        }
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 12) {
                Button { onMove(-1) } label: {
                    Label("Indietro", systemImage: "chevron.left").frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(index == 0)
                Button { onMove(1) } label: {
                    Text(index == steps.count - 1 ? "Amen" : "Avanti")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .controlSize(.large)
            .padding(.horizontal)
            .padding(.vertical, 10)
            .background(.bar)
        }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button {
                    showEnglish.toggle()
                } label: {
                    Image(systemName: showEnglish ? "character.bubble.fill" : "character.bubble")
                }
                .accessibilityLabel(showEnglish ? "Hide English" : "Show English")
                Button("Pausa", action: onPause)
            }
        }
    }
}

private struct BeadStrip: View {
    let steps: [RosaryStep]
    let current: Int

    var body: some View {
        HStack(spacing: 5) {
            ForEach(steps) { s in
                bead(s)
                    .foregroundStyle(s.index <= current ? Color.accentColor : Color.secondary.opacity(0.45))
                    .scaleEffect(s.index == current ? 1.3 : 1)
                    .animation(.snappy, value: current)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 22)
        .accessibilityElement()
        .accessibilityLabel("Bead \((steps.firstIndex { $0.index == current } ?? 0) + 1) of \(steps.count) in this part")
    }

    @ViewBuilder
    private func bead(_ s: RosaryStep) -> some View {
        let filled = s.index <= current
        switch s.bead {
        case .cross:
            Image(systemName: "cross.fill").font(.system(size: 13))
        case .large:
            shape(Circle(), filled: filled).frame(width: 15, height: 15)
        case .small:
            shape(Circle(), filled: filled).frame(width: 10, height: 10)
        case .chain:
            shape(Rectangle(), filled: filled).frame(width: 6, height: 6).rotationEffect(.degrees(45))
        case .medal:
            shape(Ellipse(), filled: filled).frame(width: 13, height: 17)
        }
    }

    private func shape<S: Shape>(_ shape: S, filled: Bool) -> some View {
        ZStack {
            shape.fill(filled ? AnyShapeStyle(.foreground) : AnyShapeStyle(.clear))
            shape.stroke(.foreground, lineWidth: 1.5)
        }
    }
}

private struct PrayerStepView: View {
    let step: RosaryStep
    let showEnglish: Bool
    @EnvironmentObject private var model: AppModel

    var body: some View {
        if let id = step.prayerId, let prayer = model.prayer(id: id) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(prayer.title).font(.title3.bold()).foregroundStyle(Color.accentColor)
                        if let count = step.count {
                            Text("\(count.n)/\(count.of)")
                                .font(.title3).monospacedDigit().foregroundStyle(.secondary)
                        }
                    }
                    Text(prayer.titleEn).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                SpeakerButton(text: prayer.it)
            }
            if let virtue = step.virtue {
                HStack(spacing: 4) {
                    WordGlossText(text: "Per la \(virtue.it)")
                    Text("· for \(virtue.en)").font(.caption).foregroundStyle(.secondary)
                }
            }
            if let lines = prayer.lines, !lines.isEmpty {
                ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
                    VStack(alignment: .leading, spacing: 2) {
                        WordGlossText(text: line.it).font(.body)
                        if showEnglish {
                            Text(line.en).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            } else {
                WordGlossText(text: prayer.it)
                if showEnglish {
                    Text(prayer.en).font(.caption).foregroundStyle(.secondary)
                }
            }
        } else {
            Text("Missing prayer: \(step.prayerId ?? "?")").foregroundStyle(.secondary)
        }
    }
}

private struct MysteryStepView: View {
    let step: RosaryStep
    let set: MysterySet
    let showEnglish: Bool

    private static let ordinalsEn = ["first", "second", "third", "fourth", "fifth"]

    var body: some View {
        if case .decade(let d) = step.section, let mystery = step.mystery, let text = step.text {
            Text("\(capitalizeFirst(rosaryOrdinals[d])) mistero \(set.adjective)")
                .font(.caption).textCase(.uppercase).foregroundStyle(.secondary)
            Text(capitalizeFirst(mystery.it))
                .font(.title2.bold()).foregroundStyle(Color.accentColor)
            Text("\(mystery.en) · \(mystery.ref)")
                .font(.subheadline).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                WordGlossText(text: text)
                Spacer(minLength: 8)
                SpeakerButton(text: text, compact: true)
            }
            .padding(.top, 6)
            if showEnglish {
                let kind = set.titleEn.replacingOccurrences(of: " Mysteries", with: "").lowercased()
                Text("In the \(Self.ordinalsEn[d]) \(kind) mystery we contemplate \(mystery.en.replacingOccurrences(of: "The ", with: "the ", options: .anchored)).")
                    .font(.caption).foregroundStyle(.secondary)
            }
            if let fruit = mystery.fruitEn {
                Text("Fruit of the mystery: \(fruit)")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
    }
}

private struct RosaryDoneView: View {
    let set: MysterySet
    let completed: Int
    let onBack: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 48)).foregroundStyle(Color.accentColor)
            Text("Sia lodato Gesù Cristo.").font(.title2.bold())
            Text("Praised be Jesus Christ.").foregroundStyle(.secondary)
            Text("You prayed the \(set.titleEn) in Italian — fifty Ave Marias. Rosaries prayed: \(completed).")
                .font(.callout).multilineTextAlignment(.center).foregroundStyle(.secondary)
            Spacer()
            Button(action: onBack) {
                Text("Back to the mysteries").frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(24)
    }
}
