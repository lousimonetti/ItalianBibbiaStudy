# Plan — Make Italian Bible Study fully immersive, interactive & enticing

> **Status: all four workstreams (A–D) complete and merged.**
>
> **Subsequent plans (in order):**
> - `plan-platform.md` — CourseKit generalization (T0–T5 complete): config-driven
>   template, multi-course registry, per-course localStorage namespacing.
> - `plan-sync.md` — Cross-device sync via QR / code / `.json` (shipped). Online
>   auto-sync (BaaS opt-in) remains open.
> - `opportunities.md` — Reading & comprehension suite (O1–O5 shipped): shadowing,
>   interactive reading, grammar drill, dictogloss, comprehension checks.
> - `plan-new-session.md` — **New Session / Calendar Reset** (planned). Let any
>   user start or restart the 37-week program from today without editing source
>   code. Introduces `src/utils/sessionStart.js` + `schedule.js` refactor +
>   a "New Session" modal with selective-reset scope (T0–T4).
> - `plan-ios-app.md` — **iOS / iPadOS App Store app** (planned). React Native +
>   Expo SDK 52 path: all pure-JS utils port unchanged; `localStorage` →
>   `AsyncStorage`; `speechSynthesis` → `expo-speech`; adds WidgetKit (Swift
>   extension), haptics, iCloud opt-in, Siri Shortcuts, iPad sidebar. ~10 weeks.
> - `plan-ios-swift.md` — **Full SwiftUI rewrite** (planned, alternative to RN).
>   SwiftUI + SwiftData; concrete Swift ports of all 8 JS utility modules (SRS
>   SM-2 scheduler, Answer/Levenshtein, Cloze, Streak, ItalianIPA, Schedule);
>   `AVSpeechSynthesizer`, `SFSpeechRecognizer`, `CoreHaptics`, native WidgetKit,
>   `AppIntents` (Siri), `NSUbiquitousKeyValueStore` (iCloud). ~8–12 MB binary.
>   iOS-only; no Android path. ~10–11 weeks.
> - `wireframes/ios-app-wireframes.html` — browser-renderable phone-frame mockups
>   for both iOS plans: 7 flows covering Onboarding, Tracker, Week Detail,
>   Flashcards, Pronunciation, Journal, Settings / New Session sheet, iPadOS
>   sidebar, and WidgetKit home-screen widgets (small + medium).


**Goal of this feature set:** turn the app from a *study tracker with downloadable
decks* into an *immersive daily habit* — one where the learner lives a little more
inside Italian every session, stays motivated to come back, yet never feels lost.
Three design pillars guide every item below:

1. **Immersion** — Italian is the default voice of the app, not an afterthought.
2. **Interactivity** — every screen has something to *do*, not just read.
3. **Comprehensibility & adaptability** — immersion with training wheels: instant
   translation-on-demand, difficulty that adapts to the learner, nothing
   intimidating.

## Hard constraints (do not violate)

These come from `CLAUDE.md` and bound every option below:

- **No backend.** Static `dist/` only. No OAuth, no server, no secrets at runtime.
- **`localStorage` only** for persistence. Namespace new keys `italian-bible-*`.
- Must keep building/deploying to **Azure Static Web Apps free tier**.
- **PWA/offline-first.** New features must degrade gracefully offline (TTS works
  offline; speech recognition and LanguageTool do not — that's acceptable).
- Vite pinned `^6`; `generate-anki.cjs` stays CommonJS.
- Any pre-generated content (audio, IPA, hints) is produced by a **one-time
  build/offline script** (like `generate-pronunciations.cjs`) and committed —
  never an API call at runtime.

## Where we are today (updated)

- Three tabs: Tracker, Flashcards (Anki / Practice / Pronunciation), Journal.
- Strong on **exposure**; still thin on **retention, listening, and active
  production** (Workstreams B–C, not yet started).
- ✅ **Immersion mode** (A1) flips UI chrome to Italian with English glosses.
- ✅ **Tap-to-translate** (A2) on example sentences + prompts.
- ✅ **TTS in the Tracker** (A3); `SpeakerButton` now also on the vocab table.
- ✅ **All 259 vocab tuples have IPA** (Phase 0).
- ✅ **Spaced repetition** (B1): Practice now has per-word memory (SM-2) in
  `localStorage`; sessions serve due cards first.
- ✅ **Active production** (C1): Practice has Recognition / Recall (EN→IT typed) /
  Cloze styles, all grading into the SRS.
- ✅ **Results persist** (B2): pronunciation scores saved; a "Parole difficili"
  panel surfaces struggling words and drills them through the SRS.

---

## Workstream A — Immersion foundations (make Italian the default)

The cheapest, highest-impact immersion wins. Mostly UI + a small data layer.

### A1. "Modalità immersione" (Immersion mode) toggle — ✅ DONE
A header switch (the **IT** pill, persisted `italian-bible-immersion`) flips UI
chrome to Italian: tab labels (Tracker→*Percorso*, Flashcards→*Schede*,
Journal→*Diario*), the Flashcards mode toggle, Practice card buttons (*Rivela*,
*Ce l'ho fatta ✓*, *Sto ancora imparando*), the Tracker section headers, the
progress bar, and the Today card. **Comprehensibility guard:** every Italian
chrome string carries its English as a hover/long-press `title` gloss (with a
faint dotted underline hint). Default is off, so beginners see English; one tap
immerses.
- New: `src/i18n/strings.js` (`{ key: { it, en } }` chrome map),
  `ImmersionContext.js` (`useImmersion` hook + persisted state),
  `ImmersionProvider.jsx` (wraps `<App>`), `UiText.jsx` (`<UiText k="…" />`).
  Behaviour locked by `UiText.test.jsx` (4 tests).
- **Coverage:** tabs, Tracker headers, progress, Today card, Flashcards/Practice
  buttons, the Practice start-screen labels, and the Journal header (title +
  Grammar/Export). Extending further is just: add keys to `strings.js` and wrap
  with `<UiText>`. (A touch tap-to-reveal popover beyond the `title` tooltip is
  still a possible future enhancement.)

### A2. Tap-to-translate everywhere (comprehensible input) — ✅ DONE
The core "easy to comprehend" lever. Italian words rendered in the app become
tappable; tapping reveals Italian + English + IPA + a speaker button in a small
popover, without leaving the page. Built entirely from existing vocab data.
- New: `src/utils/vocabIndex.js` — memoized `Map` from PHASES (full term **and**
  article-stripped stem → `{ it, en, ipa }`), plus `lookupWord` and a `tokenize`
  that preserves text exactly and keeps internal apostrophes (`l'unzione`).
  Unit-tested in `vocabIndex.test.js` (10 tests).
- New: `src/components/WordGloss.jsx` (tokenizes a string; only words found in
  the index become interactive — dotted underline) + `GlossPopover.jsx` (the
  translation card). Outside-click / Escape closes it.
- Wired into: Tracker example sentences and writing prompt (`WeekDetail.jsx`)
  and the Journal prompt (`JournalTab.jsx`).
- **Limits:** conjugated/derived forms ("crede" vs "credere") and multi-word
  phrases inside a sentence aren't *glossed* — but as a follow-up they're now
  **tap-to-hear** (TTS), so every word has audio even without a translation.

### A3. Wire TTS into the Tracker vocab table (known gap) — ✅ DONE
Added `<SpeakerButton>` to each row of `WeekDetail.jsx`'s vocab table (Italian
term, size 15) and to each example sentence (size 13), with compact CSS so the
dense table layout holds on touch. Small, high value — the Tracker is the screen
read every week and previously had no audio.

### A4. Fill the missing IPA
Re-run `node scripts/generate-pronunciations.cjs` (needs `ANTHROPIC_API_KEY`) to
close the 35/259 IPA gap, then commit `scripts/pronunciations.json` and the
updated `studyData.js`. Improves the pronunciation key, Practice back-face, and
Pronunciation mode display app-wide.

---

## Workstream B — Retention engine (the biggest fluency lever)

### B1. Lightweight SRS in browser Practice mode — ✅ DONE
Replaced session-only memory with a persistent **SM-2-flavored** scheduler.
Per-word `{ ease, interval, reps, lapses, due, last }` keyed by the Italian term
in `localStorage` (`italian-bible-srs`). Sessions draw **due** cards first
(earliest due first), then up to `newCap` new ones, capped at `maxSession`.
"Got it" advances the interval (1d → 3d → interval × ease); "Still learning"
lowers ease, resets the streak, and makes the card due immediately.
- New: `src/utils/srs.js` (pure — `review`, `isDue`, `buildQueue`, `stats`;
  10 unit tests in `srs.test.js`).
- New: `src/hooks/useSrs.js` (ref-backed store + version counter).
- `PracticeMode.jsx` now schedules from the SRS instead of `shuffle()`, records
  each grade, shows due/new/learned counts, and has an "all caught up" state
  with a "practice all anyway" fallback.
- **Daily new-card cap added (follow-up):** `srs.js` stamps each card's first
  review (`created`); `buildSession` caps new cards at `DAILY_NEW_CAP` (15) per
  calendar day across sessions.

### B2. Persist & surface results → "Parole difficili" (struggle list) — ✅ DONE
Pronunciation attempts now persist (`usePronunStats` → `italian-bible-pronun`:
per-word attempts/last/best/avg). `src/utils/wordStats.js` (`struggleList`, pure,
6 tests) ranks words by combining SRS lapses + low ease with weak pronunciation
scores. A collapsible **"Parole difficili"** panel on the Practice start screen
lists them with reasons and a **"Drill these"** button that runs an SRS-recorded
session of just those words — feeding straight back into B1's scheduler.
- New: `src/utils/wordStats.js` (+ test), `src/hooks/usePronunStats.js`.
- Touched: `PronunciationPractice.jsx` (record each score), `PracticeMode.jsx`
  (struggle panel), `useSrs.js` (`getStore()` accessor).

---

## Workstream C — Active production (output, both directions)

Today's practice is recognition-only. Fluency needs *production*.

### C1. EN→IT recall + cloze / fill-in-the-blank — ✅ DONE
Practice now has a **style selector**: Recognition (existing IT→EN flip),
**Recall** (EN→IT typed), and **Cloze** (fill the blanked vocab word in its
example sentence, e.g. *"In principio era il ____"*). All from existing data.
- New: `src/utils/cloze.js` (`makeCloze`/`isClozeEligible`, blanks the bare
  content word; ~61% of cards eligible — the rest use a conjugated form) and
  `src/utils/answer.js` (`canonical`/`checkAnswer` — accent/article-folding +
  ~20% Levenshtein tolerance, reusing `pronunciation.js`). 9 unit tests across
  `cloze.test.js` + `answer.test.js`.
- `PracticeMode.jsx`: style selector, typed-answer card with correct/incorrect
  feedback; cloze sessions draw only from eligible cards; all styles grade into
  the same SRS store.

### C2. Listening / dictation mode (comprehensible input via ear) — ✅ DONE
Added a 4th Practice style, **Listening**: TTS speaks the example **sentence** at
adjustable speed (Slow 0.6 / Normal 0.85), the learner types what they hear, then
reveals the text + translation and self-grades into the SRS. Works fully offline;
extends listening from single words to whole sentences.
- `SpeakerButton.jsx` gained an optional `rate` prop (default 0.85).
- `PracticeMode.jsx`: listening prompt (play + speed toggle), dictation input,
  reveal + self-grade. Eligible for all cards (every card has an example).

### C3. Guided Italian journaling — ✅ DONE
Lowered the blank-page barrier: a collapsible **"Aiuto per scrivere"** scaffold in
each Journal entry surfaces the week's grammar focus, five Italian **sentence
starters** (*Oggi ho letto…*, *Ho imparato che…*, …), and the week's **vocabulary
as click-to-insert chips** (English on hover). Clicking appends to the entry.
- New: `src/components/JournalScaffold.jsx`.
- `JournalTab.jsx`: an `insertText` handler appends a starter/word to the draft
  (auto-save + grammar check already fire on change). The existing word count
  stays; a streak nudge is Phase 4 (D1).

---

## Workstream D — Motivation & stickiness (make it enticing)

### D1. Streaks, daily goal & progress dashboard — ✅ DONE
A `localStorage` streak counter (`italian-bible-streak`) and a "Today" checklist
on the `TodayCard`: 🔥 consecutive-day streak (+ best), and three goals —
**read** (manual tick) · **review flashcards** (auto-ticked on a Practice grade)
· **write a line in Italian** (auto-ticked on a non-empty journal save). Any
tracked activity advances the streak; a missed day resets it (best is kept).
- New: `src/utils/streak.js` (pure — `withActivity`, `setFlag`, `currentStreak`,
  `todayFlags`; 12 unit tests) and `src/hooks/useStreak.js`.
- `PracticeMode`/`JournalTab` call `recordActivity(...)` fire-and-forget;
  `TodayCard` shows the dashboard (it remounts on tab switch, so cross-tab
  activity is picked up).
- **Deferred:** PWA notification reminders → D2.

### D2. PWA reminders — ✅ DONE
An opt-in **"Remind me daily"** toggle on the `TodayCard` that requests
Notification permission and, while the app is open, nudges once a day if you're
past your reminder hour (default 7pm) and haven't studied. No backend/push (hard
constraint), so it's best-effort/local — fires via the service worker's
`showNotification` (falling back to `new Notification`). Renders nothing where
the Notification API is unavailable; shows a blocked state if permission is
denied.
- New: `src/utils/reminders.js` (pure `shouldNotify`; 7 tests) and
  `src/components/Reminders.jsx`. Persisted under `italian-bible-reminders`.

### D3. Celebration & momentum micro-interactions — ✅ DONE
Tasteful and dependency-free: a **tricolore confetti** burst + an animated
Italian cheer (*Perfetto! / Bravo! / Continua così!*, scaled by score, with an
English `title` gloss) on finishing a Practice session ≥70%; a subtle shimmer on
the main progress bar. All honor `prefers-reduced-motion`.
- New: `src/components/Confetti.jsx` (pure CSS/JS particles, self-unmounting).
- `PracticeMode` SessionEnd shows the confetti + cheer.

### D4. Achievements / level map — ✅ DONE
A collapsible **"Traguardi"** badge grid on the Tracker (earned count in the
header). ~11 badges derived from existing stores — week milestones, one per phase
(every week of the book done), 7- & 30-day streaks, 50/150 words learned, a
journaling badge, and "Fino a Natale!" for all 37 weeks. Earned state is
**computed** from `progress`/`srs`/`streak`/`journal` (no new persistence), so it
stays correct if a store changes.
- New: `src/utils/achievements.js` (pure `computeAchievements`; 5 tests),
  `src/hooks/useAchievements.js`, `src/components/Achievements.jsx`.

---

## Suggested sequencing (incremental, each shippable on its own)

| Phase | Items | Why first | Rough effort |
|------|-------|-----------|--------------|
| **0 — Hygiene** ✅ | Fix lint (`reactHooks.configs['recommended-latest']`); add CI lint+test steps; A4 IPA backfill (all 259 tuples now have IPA) | Unblocks reliable CI; cheap data win | S |
| **1 — Immersion quick wins** ✅ | A3 ✅ (TTS in Tracker), A2 ✅ (tap-to-translate), A1 ✅ (immersion toggle) | Highest immersion-per-line; mostly UI | M |
| **2 — Retention** ✅ | B1 ✅ (SRS), B2 ✅ (persist results + struggle list) | Biggest fluency lever | M–L |
| **3 — Production** ✅ | C1 ✅ (EN→IT + cloze), C2 ✅ (listening), C3 ✅ (journaling scaffolds) | Builds on SRS + immersion | M–L |
| **4 — Motivation** ✅ | D1 ✅ (streaks/dashboard), D3 ✅ (micro-interactions), D4 ✅ (badges), D2 ✅ (reminders) | Compounds everything above | M |

## Risks & guardrails

- **Don't break offline.** Speech recognition (Pronunciation) and LanguageTool
  (Journal grammar) already fail offline by design — keep new online-only
  features (if any) equally graceful. TTS, SRS, journaling, streaks all work
  offline.
- **Don't over-immerse.** Every Italian chrome string needs an English escape
  hatch (gloss on hover/long-press) or beginners churn. Immersion is opt-in and
  reversible.
- **Keep the data model single-source.** New per-word state (SRS, struggle list)
  keys off the Italian term and lives in `localStorage`; `studyData.js` stays the
  one source of vocab. Update the hardcoded "259 cards" UI strings if vocab counts
  change.
- **Testability.** Put logic in pure modules (`srs.js`, tokenizer, match scorer)
  with vitest coverage mirroring the existing `pronunciation.test.js` /
  `schedule.test.js` pattern; keep React components thin.

## Definition of done (per item)

- Works offline where it should; degrades gracefully where it can't.
- New persisted state uses an `italian-bible-*` key and survives reload.
- Unit tests for any non-trivial logic; `npm test` stays green.
- `npm run build` succeeds (CI deploys from it).
- Immersion strings carry an English gloss fallback.

---

## Where next — the two major open directions

### 1. New Session / Calendar Reset (`plan-new-session.md`)

The 37-week calendar is currently anchored to a hardcoded `startDate` in the
course config. Anyone who starts the app late — or wants to restart — has to
edit source code. The New Session feature writes a `sessionStart` override to
`localStorage`; `schedule.js` reads that override on every call (not at module
load, which would cache the old date). Four tasks:

| Task | Scope |
|------|-------|
| **T0** | `src/utils/sessionStart.js` get/set/clear + `schedule.js` per-call read |
| **T1** | `NewSessionModal.jsx` — date picker → date preview → confirm |
| **T2** | `src/utils/resetSession.js` — selective clear of progress / streak / SRS / journal |
| **T3** | Dynamic end-date in `TodayCard` and header tagline |
| **T4** | `sessionStart.test.js`, `resetSession.test.js`, updated `schedule.test.js` |

The reload-after-reset (same pattern as `CoursePicker`) sidesteps caching; the
per-call read still matters for components that mount mid-session.

---

### 2. iOS / iPadOS App Store app

Two fully-worked paths — pick one:

#### Path A — React Native + Expo (`plan-ios-app.md`)

All pure-JS util modules (`srs.js`, `answer.js`, `cloze.js`, `it2ipa.js`,
`streak.js`, `achievements.js`, `schedule.js`) port with **zero changes**. Hooks
are adapted to `AsyncStorage` (same key names → same sync snapshot format →
web ↔ iOS data portability with no conversion). New native capabilities added
on top: `expo-speech` (TTS), `@react-native-voice/voice` (speech recognition),
`expo-notifications` (real push, not best-effort browser), `expo-haptics`,
WidgetKit (Swift extension sharing an App Group with the RN app).

- Binary: ~50–70 MB. Android path open (same codebase).
- `eas build` + `eas submit` for App Store distribution.
- Timeline: ~10 weeks (M0 scaffold → M7 App Store).

#### Path B — Full SwiftUI rewrite (`plan-ios-swift.md`)

All 8 JS utils ported to Swift (function-for-function; see the concrete Swift
snippets in the plan). SwiftData `@Model` types for SRS cards and journal
entries; `@AppStorage` for streak, progress bits, theme, session start.
`AVSpeechSynthesizer` (no bridge), `SFSpeechRecognizer` (more accurate than the
bridge), native `WidgetKit` `TimelineProvider`, `AppIntents` (Siri Shortcuts),
`NSUbiquitousKeyValueStore` (iCloud), `CoreHaptics`, `NavigationSplitView`
(iPad sidebar without any extra library).

- Binary: ~8–12 MB. iOS-only.
- Same QR sync snapshot format as the web app (interoperable).
- Timeline: ~10–11 weeks (M0 scaffold → M8 App Store).

#### Decision guide

```
Android in scope ever?        → React Native
Want a sub-15 MB binary?      → SwiftUI
Fastest path to feature parity? → React Native (~1 week saved via JS reuse)
Best possible native feel?    → SwiftUI
WidgetKit without a bridge?   → SwiftUI
```

Both plans share `wireframes/ios-app-wireframes.html` — open it in any browser
to see all 7 flows (Onboarding, Tracker, Week Detail, Flashcards, Pronunciation,
Journal, Settings / New Session, iPad sidebar, home-screen widgets).
