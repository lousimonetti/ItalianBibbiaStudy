import SwiftUI
import BibbiaCore

struct JournalView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Scrivi 3–5 frasi in italiano ogni settimana — writing is the production practice that locks vocabulary in.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                ForEach(model.course.phases) { phase in
                    Section(phase.title) {
                        ForEach(phase.weeks) { week in
                            NavigationLink {
                                JournalEntryView(week: week)
                            } label: {
                                row(week)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Journal")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    ShareLink(item: exportMarkdown()) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .disabled(model.journaledWeeks == 0)
                }
            }
        }
    }

    private func row(_ week: Week) -> some View {
        let text = model.journalText(week.n)
        return VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text("Week \(week.n)").font(.subheadline.bold())
                if !text.isEmpty {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.accentColor)
                        .imageScale(.small)
                }
            }
            Text(text.isEmpty ? week.prompt.en : text)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
    }

    /// Same single-file export as the web app's "Export .md".
    private func exportMarkdown() -> String {
        var lines = ["# \(model.course.brand.name) — Journal", ""]
        for phase in model.course.phases {
            lines.append("## \(phase.title)")
            lines.append("")
            for week in phase.weeks {
                let text = model.journalText(week.n)
                guard !text.isEmpty else { continue }
                lines.append("### Week \(week.n) — \(week.r)")
                lines.append(text)
                lines.append("")
            }
        }
        return lines.joined(separator: "\n")
    }
}

struct JournalEntryView: View {
    let week: Week
    @EnvironmentObject private var model: AppModel

    @State private var text = ""
    @State private var matches: [GrammarMatch]?
    @State private var checking = false
    @State private var checkError: String?
    @State private var scaffoldOpen = false

    var body: some View {
        List {
            Section("Prompt") {
                WordGlossText(text: week.prompt.it)
                    .font(.callout.italic())
                Text(week.prompt.en)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("La tua voce") {
                TextEditor(text: $text)
                    .frame(minHeight: 140)
                    .autocorrectionDisabled()
                    .onChange(of: text) { newValue in
                        model.setJournalText(week.n, newValue)
                        matches = nil
                    }
            }

            Section {
                DisclosureGroup("Aiuto per scrivere — starters & vocab", isExpanded: $scaffoldOpen) {
                    Text(week.grammar.title)
                        .font(.caption.bold())
                    ForEach(starters, id: \.self) { starter in
                        Button {
                            insert(starter + " ")
                        } label: {
                            Text(starter + " …").font(.callout.italic())
                        }
                    }
                    FlowLayout(spacing: 6) {
                        ForEach(week.vocab, id: \.it) { card in
                            Button {
                                insert(card.it)
                            } label: {
                                Text(card.it)
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Capsule().fill(Color.accentColor.opacity(0.12)))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            if !model.course.locale.grammarLang.isEmpty {
                Section("Grammar check (online)") {
                    Button {
                        runCheck()
                    } label: {
                        if checking {
                            ProgressView()
                        } else {
                            Label("Check my Italian", systemImage: "checkmark.seal")
                        }
                    }
                    .disabled(checking || text.trimmingCharacters(in: .whitespaces).isEmpty)

                    if let checkError {
                        Text(checkError).font(.caption).foregroundStyle(.red)
                    }
                    if let matches {
                        if matches.isEmpty {
                            Text("✓ Nessun errore trovato!")
                                .font(.callout.bold())
                                .foregroundStyle(Color.accentColor)
                        }
                        ForEach(matches) { match in
                            VStack(alignment: .leading, spacing: 2) {
                                Text("“\(GrammarCheck.flaggedText(in: text, match: match))”")
                                    .font(.callout.bold())
                                Text(match.message)
                                    .font(.caption)
                                if !match.suggestions.isEmpty {
                                    Text("Try: " + match.suggestions.joined(separator: ", "))
                                        .font(.caption)
                                        .foregroundStyle(Color.accentColor)
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Week \(week.n)")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { text = model.journalText(week.n) }
    }

    private var starters: [String] {
        ["Questa settimana ho letto…", "Ho imparato che…", "Mi ha colpito…", "Penso che…"]
    }

    private func insert(_ s: String) {
        text += (text.isEmpty || text.hasSuffix(" ") || text.hasSuffix("\n") ? "" : " ") + s
    }

    private func runCheck() {
        checking = true
        checkError = nil
        Task {
            defer { checking = false }
            do {
                matches = try await GrammarCheck.check(
                    text: text, language: model.course.locale.grammarLang)
            } catch {
                checkError = "Grammar check needs an internet connection."
            }
        }
    }
}
