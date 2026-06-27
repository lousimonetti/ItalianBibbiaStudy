# Plan: iOS / iPadOS App (App Store, iOS 15+)

**Goal:** Ship a native iOS and iPadOS app to the App Store that mirrors the
full feature set of the web PWA, feels native to the platform, and adds
iOS-exclusive capabilities (widgets, haptics, Siri shortcuts, iCloud backup).

---

## Technology choice

| Option | Pros | Cons |
|--------|------|------|
| **React Native + Expo** ✅ | Reuses all JS business logic (srs.js, answer.js, schedule.js, etc.); single codebase for iOS & Android future; large ecosystem | Some native feel polish needed; bridge overhead on heavy animations |
| SwiftUI native | Perfect iOS feel; best performance | Full rewrite; no code reuse; longer timeline |
| Capacitor/WKWebView shell | Fastest to ship; zero rewrite | Not truly native; poor App Store review; limited iOS API access |

**Decision: React Native with Expo SDK 52+ (bare workflow for full native control).**
The web app's pure-JS utility modules (`srs.js`, `answer.js`, `cloze.js`,
`it2ipa.js`, `streak.js`, `achievements.js`, `schedule.js`, etc.) are
framework-agnostic and drop in with zero changes. Components need a React Native
rewrite (no DOM), but the logic layer is already portable.

---

## Platform targets

- **Minimum:** iOS 15.0 / iPadOS 15.0
- **Optimised for:** iOS 17/18 (Dynamic Island, live activities, interactive widgets)
- **Deployment:** Apple App Store (primary); TestFlight for beta
- **iPad:** adaptive layout (sidebar navigation on regular-width, tab bar on compact)

---

## Repository layout

```
ios-app/                         ← new top-level directory in this repo
  app.json                       ← Expo config (name, bundle ID, permissions)
  package.json                   ← separate from web app; shared utils symlinked
  babel.config.js
  tsconfig.json                  ← TypeScript (new code), JS utils kept as-is
  src/
    navigation/
      RootNavigator.tsx          ← tab bar (Tracker / Flashcards / Journal)
      TrackerStack.tsx           ← stack: TrackerScreen → WeekDetailScreen
    screens/
      TrackerScreen.tsx          ← TodayCard + weekly progress list
      WeekDetailScreen.tsx       ← vocab table, reading passage, grammar drill
      FlashcardsScreen.tsx       ← mode picker → PracticeScreen / PronunciationScreen
      PracticeScreen.tsx         ← SRS card flip
      PronunciationScreen.tsx    ← mic + scoring
      JournalScreen.tsx          ← per-week text entries
      SettingsScreen.tsx         ← theme, session reset, sync, reminders
    components/
      TodayCard.tsx
      WeekRow.tsx
      SrsCard.tsx                ← flip animation (Reanimated)
      WordGloss.tsx              ← tap-to-translate (adapted from web)
      SpeakerButton.tsx          ← Expo Speech wrapper
      SyncSheet.tsx              ← QR export / import
      NewSessionSheet.tsx        ← session reset flow
    hooks/
      useProgress.ts             ← AsyncStorage adapter of web useProgress
      useSrs.ts                  ← AsyncStorage adapter of web useSrs
      useStreak.ts               ← AsyncStorage adapter of web useStreak
      useJournal.ts              ← AsyncStorage adapter of web useJournal
      usePronunStats.ts
      useTheme.ts
    utils/                       ← symlink or copy of src/utils/ from web app
      srs.js                     ← zero changes needed
      answer.js                  ← zero changes needed
      cloze.js                   ← zero changes needed
      it2ipa.js                  ← zero changes needed
      streak.js                  ← zero changes needed
      achievements.js            ← zero changes needed
      schedule.js                ← adapted (sessionStart reads AsyncStorage)
      storageKey.js              ← adapted (prefix logic unchanged)
    widgets/                     ← iOS widget extensions (Swift, separate target)
      TodayWidget.swift          ← streak + today's checklist (WidgetKit)
      StreakWidget.swift          ← current streak counter
    intents/
      StartStudyIntent.swift     ← Siri Shortcut: "Start Italian study"
  ios/                           ← Xcode project (ejected Expo)
    ItalianBibleStudy/
      Info.plist
      ItalianBibleStudy.entitlements
    ItalianBibleStudyWidget/     ← widget extension target
  __tests__/
    utils/                       ← same test coverage as web (vitest or Jest)
```

---

## Web → iOS adaptation map

| Web | iOS replacement |
|-----|----------------|
| `localStorage` | `@react-native-async-storage/async-storage` — same key/value API, async |
| `window.speechSynthesis` | `expo-speech` (`Speech.speak(text, { language: 'it-IT', rate: 0.85 })`) |
| `SpeechRecognition` API | `@react-native-voice/voice` (native bridge to iOS Speech framework) |
| PWA service worker | Expo's offline cache + `expo-file-system` for `.apkg` downloads |
| `window.Notification` | `expo-notifications` (push + local; requires permission prompt) |
| `jsqr` (QR decode) | `expo-camera` + `expo-barcode-scanner` |
| `qrcode` (QR encode) | `react-native-qrcode-svg` |
| CSS animations | `react-native-reanimated` (card flip, confetti) |
| HTML `<input type="file">` | `expo-document-picker` |
| `navigator.share` | `expo-sharing` |
| React Router / tabs | `@react-navigation/bottom-tabs` + `@react-navigation/native-stack` |
| `vite-plugin-pwa` | Expo bare workflow + `expo-updates` for OTA |
| LanguageTool API | Same HTTPS call (`languagetool.org/v2/check`) — no change |
| Anki `.apkg` download | `expo-file-system` download → `expo-sharing` to open in Anki iOS |

---

## iOS-exclusive features

### Must-have for launch (v1.0)

- **Haptic feedback** — `expo-haptics`: light tick on card reveal, success pulse on
  "Got it", error buzz on wrong answer, heavy thud on streak milestone.
- **Home screen widgets** (WidgetKit, Swift) — two sizes:
  - **Small:** current streak + today's 3-checkbox progress (read / practiced / journaled)
  - **Medium:** current week title + "Next task: [daily task text]" + streak
- **iOS Notifications** — `expo-notifications` local trigger: daily study reminder
  at user-chosen hour (replaces the web's best-effort in-browser notification).
- **iCloud Backup** — `@react-native-community/async-storage` data survives device
  replacement via iCloud key-value store (`NSUbiquitousKeyValueStore`); opt-in toggle
  in Settings.
- **Dynamic Type** — all text uses iOS semantic font sizes so the app respects the
  user's accessibility font size preference.
- **Dark mode** — follows iOS system `colorScheme`; matches web `useTheme`.

### Phase 2 (post-launch)

- **Siri Shortcuts** — "Hey Siri, start Italian practice" → opens to Practice mode
- **Live Activities / Dynamic Island** (iOS 16+) — during a Practice session, shows
  a pill with card count remaining
- **Share Sheet extension** — share any Italian text from Safari → tap-to-translate
  in the app
- **Spotlight indexing** — week titles searchable from iOS Spotlight
- **Face ID / Touch ID** journal lock — optional privacy gate on the Journal tab
- **Continuity Camera** — scan a printed Anki card to add it to the custom deck
- **iPad split view** — tracker list on left, week detail on right (UISplitViewController
  via React Navigation `@react-navigation/drawer`)

---

## App Store requirements checklist

- [ ] Bundle ID: `com.italianbibliastudy.app` (or user's Apple Developer account ID)
- [ ] Apple Developer Program enrollment ($99/year)
- [ ] App icons: 1024×1024 + all required sizes (generated via `expo-image`)
- [ ] Launch screen: storyboard (Expo default + customised)
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) — declare `localStorage`/AsyncStorage,
  microphone (pronunciation), camera (QR sync), speech recognition
- [ ] App Privacy labels in App Store Connect: no data shared with third parties;
  LanguageTool receives journal text (user-controlled, opt-in)
- [ ] Microphone usage description (`NSMicrophoneUsageDescription`)
- [ ] Speech recognition usage (`NSSpeechRecognitionUsageDescription`)
- [ ] Camera usage (`NSCameraUsageDescription`) — QR sync
- [ ] Notifications usage (`NSUserNotificationUsageDescription`)
- [ ] iCloud entitlement (`com.apple.developer.icloud-services`)
- [ ] TestFlight beta: internal (up to 100 testers) → external (up to 10,000)
- [ ] App Review notes: "No login required; all data stored locally; LanguageTool
  call is user-initiated grammar check on journal text only"

---

## Screen inventory (see `wireframes/ios-app-wireframes.html` for visuals)

| Screen | Route | Notes |
|--------|-------|-------|
| Onboarding | `Onboarding` | First-launch only; "Start today" or pick date; shown once |
| Tracker | `Tracker` (tab 1) | TodayCard + phase/week list |
| Week Detail | `WeekDetail` (sheet/push) | Vocab, reading, drills, comprehension |
| Flashcards | `Flashcards` (tab 2) | Mode picker → Practice / Pronunciation |
| Practice | `Practice` (push) | SRS card flip with style selector |
| Pronunciation | `Pronunciation` (push) | Mic + IPA + score |
| Journal | `Journal` (tab 3) | List → per-week entry; grammar check; scaffold |
| Settings | `Settings` (modal/sheet) | Theme, session, sync, reminders, iCloud |
| Sync | `Sync` (sheet from Settings) | QR + paste + file import/export |
| New Session | `NewSession` (sheet) | Date picker + reset scope + confirm |

---

## Storage migration from web

The web app uses `localStorage` with prefix `italian-bible-*`.  The iOS app uses
`AsyncStorage` with the **same keys** — so a user who exports a sync snapshot from
the web PWA and imports it on iOS gets their full progress with no transformation.
`syncSnapshot.js` already handles the encode/decode; the import path on iOS calls
`AsyncStorage.setItem` instead of `localStorage.setItem`.

---

## Build pipeline

```
# Development
cd ios-app && npx expo start

# iOS simulator
npx expo run:ios

# Production build (EAS Build — Expo's cloud CI)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

CI/CD: add a separate GitHub Actions workflow `ios-app-ci.yml`:
- `npm test` (shared utils)
- `npx tsc --noEmit` (TypeScript check)
- `eas build` on push to `main` (requires `EXPO_TOKEN` secret)
- `eas submit` on release tag (manual trigger)

---

## Milestone timeline (rough)

| Milestone | Scope | Est. |
|-----------|-------|------|
| M0 — scaffold | Expo bare init, symlink shared utils, navigation skeleton | 1 week |
| M1 — Tracker | TodayCard, week list, week detail (vocab + reading + drills) | 2 weeks |
| M2 — Flashcards | SRS practice, cloze, listening, pronunciation | 2 weeks |
| M3 — Journal | Entry list, scaffold, grammar check | 1 week |
| M4 — Polish | Haptics, dark mode, Dynamic Type, iPad layout | 1 week |
| M5 — Widgets | WidgetKit Today widget (Swift) | 1 week |
| M6 — Sync | QR + file import/export, iCloud opt-in | 1 week |
| M7 — App Store | Icons, privacy manifest, TestFlight, review | 1 week |
| **Total** | | **~10 weeks** |

---

## Open questions

- **Monorepo vs. separate repo:** keeping `ios-app/` inside this repo lets shared
  utils be referenced without publishing to npm; a separate repo is cleaner for CI
  isolation. Recommend monorepo for now, separate later if CI gets noisy.
- **Android:** React Native supports it; the same codebase ships to Android with
  minimal extra work. Defer to post-iOS-launch.
- **OTA updates:** `expo-updates` lets JS-layer changes (logic, content) ship
  without App Store review. Native code changes (new permissions, Swift widgets)
  still need a full review cycle.
- **LanguageTool privacy:** journal text is sent to `languagetool.org` for grammar
  check. App Store privacy label must disclose this. Consider offering a "no grammar
  check" mode as the default to simplify the label.
