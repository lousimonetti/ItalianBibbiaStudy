import SwiftUI
import BibbiaCore

// Practice hub — SRS stats, style picker (Recognition / Recall / Cloze /
// Listening), the "Parole difficili" struggle panel, and Pronunciation.

enum PracticeStyle: String, CaseIterable, Identifiable {
    case recognition = "Recognition"
    case recall = "Recall"
    case cloze = "Cloze"
    case listening = "Listening"

    var id: String { rawValue }

    var subtitle: String {
        switch self {
        case .recognition: return "IT → EN · flip the card"
        case .recall: return "EN → IT · type it"
        case .cloze: return "Fill the blank in the sentence"
        case .listening: return "Hear the sentence · type it"
        }
    }
}

struct FlashcardsView: View {
    @EnvironmentObject private var model: AppModel
    @State private var style: PracticeStyle = .recognition
    @State private var session: [VocabCard]?

    private var cards: [VocabCard] { model.course.allVocab }

    private var stats: SRSStats {
        srsStats(cards: cards, store: model.srsStore,
                 now: Date().timeIntervalSince1970 * 1000)
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        stat("Due", stats.due, color: .orange)
                        stat("New", stats.new, color: .blue)
                        stat("Learned", stats.learned, color: .green)
                        stat("Total", stats.total, color: .secondary)
                    }
                    .frame(maxWidth: .infinity)
                }

                Section("Practice style") {
                    Picker("Style", selection: $style) {
                        ForEach(PracticeStyle.allCases) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)
                    Text(style.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Button {
                        startSession()
                    } label: {
                        Label(stats.due > 0 ? "Review \(min(stats.due, 20)) due cards"
                                            : "Practice", systemImage: "play.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(stats.due == 0 && stats.new == 0)

                    if stats.due == 0 && stats.new == 0 {
                        Text("Tutto fatto — all caught up! 🎉")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                let struggles = struggleList(cards: cards, srsStore: model.srsStore,
                                             pronunStore: model.pronunStore)
                if !struggles.isEmpty {
                    Section("Parole difficili — words you struggle with") {
                        ForEach(struggles, id: \.card.it) { entry in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(entry.card.it).font(.callout.bold())
                                    Text(entry.reasons.joined(separator: " · "))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                SpeakerButton(text: entry.card.it, compact: true)
                            }
                        }
                        Button("Drill these words") {
                            session = struggles.map(\.card)
                        }
                    }
                }

                Section("Pronunciation") {
                    NavigationLink {
                        PronunciationView()
                    } label: {
                        Label("Pronunciation & shadowing practice", systemImage: "mic")
                    }
                }
            }
            .navigationTitle("Flashcards")
            .fullScreenCover(item: Binding(
                get: { session.map { PracticeSessionPayload(cards: $0, style: style) } },
                set: { if $0 == nil { session = nil } }
            )) { payload in
                PracticeSessionView(payload: payload)
            }
        }
    }

    private func startSession() {
        let now = Date().timeIntervalSince1970 * 1000
        let allowance = newAllowanceToday(store: model.srsStore, now: now)
        let queue = buildQueue(cards: cards, store: model.srsStore, now: now,
                               newCap: min(12, allowance), maxSession: 20)
        if !queue.isEmpty { session = queue }
    }

    private func stat(_ label: String, _ value: Int, color: Color) -> some View {
        VStack {
            Text("\(value)").font(.title3.bold()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct PracticeSessionPayload: Identifiable {
    let cards: [VocabCard]
    let style: PracticeStyle
    var id: String { cards.map(\.it).joined() + style.rawValue }
}
