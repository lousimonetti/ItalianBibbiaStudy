import SwiftUI
import UniformTypeIdentifiers
import BibbiaCore

struct SettingsView: View {
    @EnvironmentObject private var model: AppModel

    @State private var showNewSession = false
    @State private var showImporter = false
    @State private var importMessage: String?
    @State private var exportFile: SnapshotFile?

    var body: some View {
        NavigationStack {
            List {
                Section("Appearance") {
                    Picker("Theme", selection: $model.theme) {
                        ForEach(Theme.allCases) { t in Text(t.label).tag(t) }
                    }
                }

                Section("Program") {
                    LabeledContent("Start date", value: model.effectiveStartDate)
                    if let end = model.endDate {
                        LabeledContent("End date",
                                       value: end.formatted(date: .abbreviated, time: .omitted))
                    }
                    LabeledContent("Current week",
                                   value: model.currentWeekN.map { "Week \($0)" } ?? "—")
                    Button("New Session — start or restart from any date") {
                        showNewSession = true
                    }
                }

                RemindersSection()

                Section {
                    Button {
                        exportBackup()
                    } label: {
                        Label("Export backup (.json)", systemImage: "square.and.arrow.up")
                    }
                    Button {
                        showImporter = true
                    } label: {
                        Label("Import backup (.json)", systemImage: "square.and.arrow.down")
                    }
                    if let importMessage {
                        Text(importMessage).font(.caption).foregroundStyle(.secondary)
                    }
                } header: {
                    Text("Sync")
                } footer: {
                    Text("The backup file is interchangeable with the web app's Sync panel — export there, import here (or the other way round).")
                }

                Section("About") {
                    Text(model.course.brand.about)
                        .font(.caption)
                    ForEach(model.course.resources) { res in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text(res.name).font(.callout.bold())
                                Text(res.badge)
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 1)
                                    .background(Capsule().fill(Color.accentColor.opacity(0.12)))
                            }
                            Text(res.desc).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showNewSession) {
                NewSessionView()
            }
            .sheet(item: $exportFile) { file in
                ShareLink(item: file.url) {
                    Label("Share \(file.url.lastPathComponent)", systemImage: "square.and.arrow.up")
                        .padding()
                }
                .presentationDetents([.height(160)])
            }
            .fileImporter(isPresented: $showImporter,
                          allowedContentTypes: [.json]) { result in
                importBackup(result)
            }
        }
    }

    private struct SnapshotFile: Identifiable {
        let url: URL
        var id: URL { url }
    }

    private func exportBackup() {
        do {
            let data = try SyncManager.exportFileData(course: model.course)
            let name = "\(model.course.id)-backup-\(todayStr()).json"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
            try data.write(to: url)
            exportFile = SnapshotFile(url: url)
        } catch {
            importMessage = "Export failed: \(error.localizedDescription)"
        }
    }

    private func importBackup(_ result: Result<URL, Error>) {
        do {
            let url = try result.get()
            guard url.startAccessingSecurityScopedResource() else {
                throw SyncImportError.notASnapshot
            }
            defer { url.stopAccessingSecurityScopedResource() }
            let count = try SyncManager.importSnapshot(fileData: Data(contentsOf: url))
            model.reloadFromDisk()
            importMessage = "✓ Imported \(count) stores."
            Haptics.success()
        } catch {
            importMessage = error.localizedDescription
            Haptics.error()
        }
    }
}

private struct RemindersSection: View {
    @EnvironmentObject private var model: AppModel
    @State private var permissionDenied = false

    var body: some View {
        Section {
            Toggle("Daily reminder", isOn: Binding(
                get: { model.reminders.enabled },
                set: { enable(on: $0) }))
            if model.reminders.enabled {
                Picker("Hour", selection: Binding(
                    get: { model.reminders.hour ?? DEFAULT_REMINDER_HOUR },
                    set: { setHour($0) })) {
                    ForEach(6..<23, id: \.self) { h in
                        Text(String(format: "%02d:00", h)).tag(h)
                    }
                }
            }
            if permissionDenied {
                Text("Notifications are off for this app — enable them in iOS Settings.")
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        } header: {
            Text("Reminders")
        } footer: {
            Text("A local notification — nothing leaves your device.")
        }
    }

    private func enable(on: Bool) {
        if !on {
            model.reminders.enabled = false
            ReminderScheduler.cancel()
            return
        }
        Task {
            let granted = await ReminderScheduler.requestPermission()
            permissionDenied = !granted
            model.reminders.enabled = granted
            model.reminders.permissionGranted = granted
            if granted {
                await ReminderScheduler.schedule(
                    hour: model.reminders.hour ?? DEFAULT_REMINDER_HOUR,
                    brandName: model.course.brand.name)
            }
        }
    }

    private func setHour(_ hour: Int) {
        model.reminders.hour = hour
        guard model.reminders.enabled else { return }
        Task {
            await ReminderScheduler.schedule(hour: hour, brandName: model.course.brand.name)
        }
    }
}

struct NewSessionView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss

    @State private var startDate = Date()
    @State private var reset = AppModel.ResetScope()
    @State private var confirming = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Start date", selection: $startDate, displayedComponents: .date)
                } footer: {
                    if let end = ScheduleLogic.endDate(startDate: todayStr(startDate),
                                                       weeks: model.course.schedule.weeks) {
                        Text("Week 1 begins on that date; week \(model.course.schedule.weeks) ends \(end.formatted(date: .long, time: .omitted)).")
                    }
                }

                Section {
                    Toggle("Reset week progress", isOn: $reset.progress)
                    Toggle("Reset streak", isOn: $reset.streak)
                    Toggle("Reset flashcard (SRS) history", isOn: $reset.srs)
                    Toggle("Reset journal", isOn: $reset.journal)
                } header: {
                    Text("Also reset")
                } footer: {
                    Text("Leave everything off to keep your data and just move the calendar.")
                }

                Button("Start new session") { confirming = true }
                    .frame(maxWidth: .infinity)
            }
            .navigationTitle("New Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .confirmationDialog("Start a new \(model.course.schedule.weeks)-week session?",
                                isPresented: $confirming, titleVisibility: .visible) {
                Button(resetSummary, role: anyReset ? ButtonRole.destructive : nil) {
                    model.startNewSession(from: startDate, reset: reset)
                    Haptics.success()
                    dismiss()
                }
            }
        }
    }

    private var anyReset: Bool {
        reset.progress || reset.streak || reset.srs || reset.journal
    }

    private var resetSummary: String {
        anyReset ? "Start and reset selected data" : "Start (keep all data)"
    }
}
