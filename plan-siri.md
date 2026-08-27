# plan-siri.md — Siri, App Intents & Apple Intelligence (iOS)

## Status

**P1 SHIPPED (I1 + I2) and CI-green. P2 closed out; P3 rescoped by a spike.**

Every gated item is now resolved rather than pending: **I4** verified and ruled
out (neither the journal nor books schema fits), **I3** deferred (App Groups
need the paid Developer Program, which would break `DEPLOYMENT.md`'s
free-account onboarding), **I5** spiked against the real on-device model and
**rescoped** — it lost to `checkAnswer` on verdicts, so its value is
*explaining* a rejection, not making one. All four open questions are closed.

As of 2026-08-22 the app exposes
seven App Intents with zero entitlements and no change to the iOS 16 floor.
This document supersedes the one-line "Siri / Shortcuts | `AppIntents`
framework (iOS 16+)" row in `plan-ios-swift.md` (tech stack table) and the
"Widgets / Siri / iCloud" deferral note in `ios-native/README.md`.

What landed:

- `BibbiaCore/Sources/BibbiaCore/IntentLogic.swift` — all intent decision
  logic (week resolution, spoken summaries, vocab search ranking), pure
  Foundation Swift, with 32 tests in `IntentLogicTests.swift`.
- `App/Sources/App/Intents/` — `AppRoute` (navigation state an intent can
  drive), `CourseEntities` (`WeekEntity` + `VocabEntity` with queries),
  `CourseIntents` (the seven intents), `BibbiaShortcuts` (zero-setup phrases).
- Wiring: `AppModel.shared` + `AppRoute.shared` registered with
  `AppDependencyManager`; `ContentView` tab selection, `TrackerView` and
  `JournalView` navigation paths, and `FlashcardsView`'s practice trigger are
  now route-bound.

Deviations from the spec below, and why:

- **Seven intents, not six.** `LookUpWordIntent` was added — once `VocabEntity`
  existed for I2 it was nearly free, and it is the one intent that returns a
  value other intents can chain from.
- **`StartNewSessionIntent` never resets stores from voice.** The spec's table
  listed it plainly; a misheard phrase must not be able to wipe progress, so it
  moves the calendar only (`ResetScope()` all-false) behind a
  `requestConfirmation`. Destructive resets stay in the Settings sheet, which
  names the stores it clears (`plan-new-session.md`).
- **`MarkWeekDoneIntent` is not a toggle.** `AppModel.toggleWeek` flips; saying
  "mark this week done" twice would silently un-tick it, so the intent checks
  `isWeekDone` first.
- **`JournalView` moved to value-based navigation** (`NavigationLink(value:)` +
  `navigationDestination`) to make the week deep-link possible — the same
  pattern `TrackerView` already used.

**Verification status:** `BibbiaCore` compiles and the intent files typecheck
against the real AppIntents SDK. Neither the iOS app target nor `swift test`
could be built in the authoring sandbox (Xcode is not installed — only
CommandLineTools, which has no iOS SDK and no XCTest), so **CI is the first
real build**. The logic was instead verified empirically against the real
course data: all 37 weeks produce non-empty Siri subtitles, and all 259 vocab
terms resolve to themselves through the entity query.

**What changed (WWDC 2026, June 9 2026):** Apple formally **deprecated
SiriKit** and made **App Intents the only way Siri can call into a
third-party app**. Siri itself moved to a Gemini-backed engine with a
standalone app. From the iOS 27 public release, SiriKit-based apps still
compile but receive no voice traffic, no Spotlight indexing, and no Apple
Intelligence personalisation.

**Why that is good news here:** this app has *zero* SiriKit code, so there is
no migration debt. Everything below is a greenfield adopt, and the baseline
tier costs no entitlement at all.

---

## The entitlement landscape

The thing one goes looking for — `com.apple.developer.siri` — is the **legacy
SiriKit** entitlement and should not be adopted in new code. The entitlements
that exist and require approval are all on the **Foundation Models** side.

| Tier | Unlocks | Entitlement | Cost |
|---|---|---|---|
| **App Intents** | Siri voice, Shortcuts, Spotlight, Action Button, widget actions | **none** | free |
| **App Schemas** (assistant schemas) | Apple Intelligence reasons over your entities + onscreen context | **none** — must conform to an Apple-defined domain shape | free |
| **Foundation Models, on-device** (`SystemLanguageModel`) | on-device LLM: structured output (`@Generable`), streaming, tool calling | **none** | free |
| **Foundation Models, cloud** (`PrivateCloudComputeLanguageModel`) | Apple server model, 32K context, reasoning levels | `com.apple.developer.private-cloud-compute` — **request required** | free (no API charge) |
| Custom fine-tuned adapters | load your own trained adapter | *Foundation Models Framework Adapter Entitlement* — **request required** | — |

**PCC eligibility** (worth recording, because this project qualifies): App
Store Small Business Program membership **and** fewer than 2 million
first-time downloads across all your apps, plus the entitlement assigned to
the app. No cloud API cost. Requested at
`developer.apple.com/contact/request/private-cloud-compute/`. If either
condition lapses you get 6 months to migrate. Limited to regions where Apple
Intelligence ships.

## The version + hardware gate

`ios-native/project.yml` pins `deploymentTarget iOS: "16.0"`, and
`ios-native/README.md` records that SwiftData was deliberately skipped to hold
that floor. Against that:

| Tier | Needs |
|---|---|
| App Intents | **iOS 16** — works on the current target today, no project change |
| App Schemas | iOS 18.x |
| Foundation Models | iOS 26+ **and** A17 Pro / M-series silicon |

**None of this forces raising the deployment target.** Gate with `@available`
and a runtime `SystemLanguageModel.availability` check. But it does mean
anything Apple-Intelligence-flavoured is invisible to a meaningful slice of
devices, so it can only ever be an *enhancement* to a feature that already
works without it — never the only path to it. That rule is the single most
important design constraint in this document.

---

## Constraint analysis

The repo's hard constraint is **no backend, no secrets, offline-first**
(`plan.md` hard constraints; `CLAUDE.md` key constraints). Checked against
each tier:

- **App Intents / App Schemas** — no network, no server, no secrets. Fully
  inside the constraint.
- **On-device Foundation Models** — no server, no API key, no network, nothing
  to declare for `ITSAppUsesNonExemptEncryption`. **Inside the constraint.**
  This is the notable finding: `plan-speaking.md` § "Explicitly out of scope"
  rules out an AI conversation partner, and the stated reason is the
  backend/secrets problem, deferred to the `plan-sync.md` BaaS relaxation.
  On-device FM sits *inside* the existing constraint rather than relaxing it,
  so that deferral is worth revisiting on its own merits.
- **PCC** — no server *of yours* and no API key, but it **is** a network call.
  That touches the "Data collected: None" App Privacy answer that
  `ios-native/DEPLOYMENT.md` step 9 walks through, and it breaks the offline
  guarantee. A deliberate decision, not a default.

---

## Workstreams

### I1 — App Intents: the core actions (no entitlement, iOS 16) ✅ SHIPPED

The prerequisite for every other tier, and the only one with no gates at all.
`AppModel` already exposes the needed surface:

| Intent | Backing call | Phrase |
|---|---|---|
| `StartPracticeIntent` | opens Flashcards → practice | "Practice Italian" |
| `OpenWeekIntent(week:)` | `weekLabel(_:)`, `currentWeekN` | "Open week 12" |
| `MarkWeekDoneIntent(week:)` | `toggleWeek(_:)` | "Mark this week done" |
| `LogReadingIntent` | `recordActivity(.read)` | "I did my reading" |
| `StartNewSessionIntent(date:)` | `startNewSession(from:reset:)` | "Restart my course" |
| `OpenJournalIntent(week:)` | `journalText(_:)` / `setJournalText(_:_:)` | "Open my Italian journal" |

Ships with an `AppShortcutsProvider` so the phrases work with no user setup.
Also lands Spotlight surfacing and Action Button binding for free.

### I2 — `WeekEntity` / `VocabEntity` as App Entities ✅ SHIPPED

`AppEntity` conformances over the existing `Course` model (`Week`,
`VocabCard`) so intents take real parameters and Siri can disambiguate
("which week?"). Prerequisite for I5.

### I3 — Widget + App Group ⏸ DEFERRED 2026-08-23 (blocked on paid membership)

**Decision: not now.** Not because the widget is unwanted, but because of a
constraint that only surfaced when the cost was priced properly.

A widget showing streak / today's checklist has to read the app's user state,
which lives in `UserDefaults` under the `italian-bible-*` keys. A widget
extension is a **separate process**, so sharing that state requires an **App
Group** — and App Groups are an entitlement that a **free Personal Team cannot
use**. They need the paid Apple Developer Program.

That matters here specifically because `DEPLOYMENT.md` deliberately onboards
via a free Apple ID: install on your own iPhone first, pay the $99 only when
you actually want to publish. Adding a progress widget moves that spend from
*"when you publish"* to *"before you can test at all"*, which inverts the
document's whole premise. `ios-native/README.md` already recorded keeping
"no App Groups / extra capabilities" as a deliberate simplicity call; this is
that call holding up under a concrete price.

**Revisit when the paid program is already in hand** — at that point the
capability is free to add and the work is small.

**Capability-free alternative, if a home-screen presence is wanted sooner:** a
widget that reads *only bundled course data* (say a day-of-year-rotated
"Pensa in italiano" phrase, in the spirit of `src/data/thinkPrompts.js`) needs
no App Group at all, because it reads nothing user-specific. It cannot show
streak, progress, due counts, or even the current week — the last one because
week number is derived from the user's `session-start` override. Considered
and not chosen for now.

### I3 (original spec) — Widget + App Group (carried over from `plan-ios-swift.md`)

A WidgetKit timeline showing streak + today's checklist. Requires an App
Group capability — the *first* real capability this project adds, and the
reason `ios-native/README.md` deferred it ("no App Groups / extra
capabilities needed" was a deliberate simplicity call for amateur
deployment). Re-evaluate that trade explicitly before committing.

### I4 — App Schemas: journal + books domains ❌ RULED OUT (2026-08-23)

**Verified, and neither domain fits. Do not build this.** Open question 1 is
now closed. The plan's own rule applies: a forced-fit schema is worse than a
plain App Intent, and the plain App Intents from I1 already cover these actions.

**`journal.createEntry`** takes `message: AttributedString` (required) plus
optional `title`, `entryDate: Date?`, `location: CLPlacemark?` and
`mediaItems`, and returns a `journal.entry` entity. Three mismatches, the
first two fatal:

1. **Wrong operation.** `createEntry` *creates* an entry. This app has a fixed
   set of N week-slots that are *edited* — there is no create. The schema's
   central verb has no meaning here.
2. **Wrong key.** The schema is date-indexed; this app is **week-indexed**, and
   a given week's dates differ per user because they are computed from that
   user's `session-start` override (`plan-new-session.md`). There is no stable
   date↔entry mapping to expose.
3. `location` / `mediaItems` have no analogue and would be silently dropped;
   `AttributedString` vs the stored plain `String` is convertible and minor.

Conceptually the app's journal is *guided weekly writing against a fixed course
prompt*, not free-form dated journaling. The schema models the latter.

**`library.book` / `openBook(target:)`** models a library of discrete books you
open. This app has no books — it has 4–8 authored verses embedded in a week's
lesson beside grammar, vocab and drills. Beyond the fit problem there is a
licensing one: the schema wants `IndexedEntity`, i.e. donating the content to
the **system-wide index**. CEI 2008 quotation permission is still unconfirmed
(L2 in `launch-opportunities.md`), and donating scripture text to Spotlight/Siri
is materially broader distribution than rendering it in-app. Even if the shape
fit, this should not ship before L2 closes.

*Confidence note:* the schema shapes above come from secondary sources
(conference write-ups and community docs), because Apple's documentation pages
are JS-rendered and could not be fetched directly. The **ruling** rests on the
operation/key mismatches, which are structural and would not change if a
property list turns out slightly different — but re-check the exact properties
if this is ever revisited.

### I4 (original spec) — App Schemas: journal + books domains

There is **no education or language-learning domain**. The available domains
are mail, photos/videos, messages, documents, browser, books, journal,
presentations, spreadsheets, calendar, camera, system. Two plausible fits:

- **journal** — the app ships a Journal tab with week-indexed entries.
- **books** — reading passages per week.

Both need shape verification before commitment (see Open questions). If the
shape does not fit, **skip this workstream** — a forced-fit schema is worse
than a plain App Intent.

### I5 — On-device Foundation Models: SPIKED 2026-08-23 — revised recommendation

**The spike ran for real.** macOS 27 on this machine reports
`SystemLanguageModel.default.availability == .available`, so the on-device
model was measured rather than guessed at. Open question 4 is closed, but the
answer changes what I5 should be.

**Setup.** 16 realistic learner answers built from real week 1–2 cards
(exact, article dropped, typo, number slip, valid synonym, valid paraphrase,
case-only, wrong word, opposite, conjugated-not-infinitive, near-miss noun,
wrong sense), graded by the model and by the existing `checkAnswer`, scored
against hand-labelled ground truth.

| | model | `checkAnswer` |
|---|---|---|
| first prompt | 12/16 | **14/16** |
| tuned prompt | **15/16** | 14/16 |
| false accepts | **0** | 0 |
| false rejects | 1 | 2 |
| latency | ~600 ms | microseconds |

**What this actually shows:**

1. **Zero false accepts, both runs.** The main risk — a model cheerfully
   telling a learner a wrong answer is right — did not materialise. It
   correctly rejected `credo` for "to believe", `il peccatore` for "the
   Savior", and `bene` for "the well".
2. **The verdict gain is one case in sixteen.** Tuned, the model wins only on
   `l'oscurità` (a valid synonym for "darkness"). A 20-line pure function is
   within one case of a 3-billion-parameter model, runs everywhere, and is
   already covered by tests.
3. **It is alarmingly prompt-sensitive.** 12/16 → 15/16 from *wording alone*.
   The first prompt said "a small spelling slip … is fine" and it still
   rejected `la lucce`. That sensitivity cannot be regression-tested in CI
   (no Apple Intelligence on runners), so it is unguarded drift.
4. **It still failed a case it was explicitly instructed to accept** —
   `essere nato` for "to be born", even after the tuned prompt named that
   exact example.

**Revised recommendation: do not use the model for verdicts. Use it for
explanations.** The genuinely new capability is the *feedback text*, which
`checkAnswer` can never produce: "sapere means to know, not to believe",
"credo is a present tense verb, not the infinitive". That is real pedagogical
value, and it is the half that is safe to get slightly wrong — a clumsy
explanation costs far less than a wrong verdict.

So: keep `checkAnswer` as the grader (fast, deterministic, testable, works on
every device), and optionally ask the model to *explain* a rejection when it
is available. This sidesteps the prompt-sensitivity risk entirely, and the
existing availability-fallback rule still applies — no explanation on older
hardware, same grade either way.

**Verse application (added 2026-08-26, see `plan-verses.md` V5).** The
explain-don't-judge verdict generalises past answer grading: the strongest
concrete use is on-demand explanation of the *authored* weekly passage — "why
*le tenebre non la vinsero* and not *non l'hanno vinta*?" — which is real
pedagogical value that hand-authoring does not scale to, and which is safe to
get slightly wrong. Two riders: the CEI 2008 passage text was populated from
training knowledge (external Bible APIs are proxy-blocked), so **the model will
confidently explain whatever text it is handed** — spot-check the verses it
points at first; and this remains an enhancement over a passage that already
reads, speaks, and glosses without it.

The other three I5 ideas (generated drill sentences, conversation partner,
journal feedback) were **not** spiked and remain unevaluated. Note the
conversation partner is the one where a 600 ms turnaround is fine and there is
no "correct answer" to get wrong, so it may still be the strongest of them.

*Limitations:* n=16, one model, one machine, single run per prompt, and cases
I wrote myself. Directional, not statistical. Also `@Generable` structured
output could **not** be tested — the `FoundationModelsMacros` plugin ships with
Xcode, not CommandLineTools, so the spike parsed plain text instead.

### I5 (original spec) — On-device Foundation Models: the capability tier

Where new product lives rather than new plumbing. Each item must degrade to
the existing behaviour when `SystemLanguageModel.availability != .available`:

- **Free-form answer grading.** Today `Answer.swift` `checkAnswer` is
  canonical-fold + Levenshtein tolerance. An on-device model could accept a
  *correct paraphrase* that is not within typo distance — and, critically,
  explain *why* a wrong answer is wrong. Fallback: current `checkAnswer`.
- **Generated drill sentences.** New `transform` / cloze items over the
  week's authored vocab, so drills stop being finite. Fallback: the authored
  `exercises.js` items (which stay the source of truth).
- **Conversation partner.** The `plan-speaking.md` deferral, revisited — a
  week-scoped spoken exchange using only the week's vocab and grammar focus.
  Fallback: feature hidden.
- **Journal feedback.** A gentler complement to the LanguageTool grammar
  check, and one that works **offline** — LanguageTool is one of the two
  intentional online-only enrichments, so this is a strict improvement in
  posture. Fallback: LanguageTool as today.

Use `@Generable` for structured output so results parse deterministically
rather than by string-scraping.

### I6 — Siri onscreen context

Once I2 + I4 exist, Siri can answer about what is on screen ("what does this
word mean?" while a passage is open). Mostly falls out of the entity work;
no separate entitlement.

### I7 — PCC (deferred, probably skip)

Buys context window and reasoning this app does not obviously need, and costs
the clean privacy story. Record the eligibility (above) and revisit only if
I5 hits a concrete on-device ceiling.

### I8 — Test + CI story ✅ SHIPPED (for I1/I2)

`ios-native-ci.yml` already runs `swift test` + an unsigned simulator build.
Intents are testable as plain types; the FM path is **not** testable in CI
(no Apple Intelligence in the simulator/runner). Keep all FM calls behind a
protocol so the fallback path is what CI actually exercises — matching the
existing anti-drift discipline where fixtures are generated from the real JS.

---

## Phasing

- **P1 — I1 + I2.** ✅ Shipped 2026-08-22. No entitlement, no version gate, no capability.
- **P2 — closed out, nothing to build.** I4 verified and ruled out; I3
  deferred on the paid-membership constraint (both 2026-08-23).
- **P3 — I5 (+ I6), scope reduced by the spike.** Not "grade answers with the
  model" — that lost to `checkAnswer`. Use the model to *explain* a rejection
  the existing checker already made, or to explain the week's authored verse
  (`plan-verses.md` V5). Gate every item on availability.
- **Not scheduled — I7.**

---

## Implementation notes (repo conventions to follow)

- Intents live in `ios-native/App/Sources/App/Intents/` (the path
  `plan-ios-swift.md` already reserved).
- Pure decision logic goes in `BibbiaCore` with an XCTest sibling, matching
  the existing pure-module-plus-test pattern; the intent types themselves stay
  in the app target (they need `AppModel`).
- **No new persisted keys.** Intents mutate through existing `AppModel`
  methods so the `italian-bible-*` UserDefaults contract — and therefore
  backup interop with the web app — is untouched.
- Adding a capability means editing `ios-native/project.yml` (XcodeGen) and
  regenerating, never hand-editing `.xcodeproj`.
- If any course-content shape changes, re-run
  `ios-native/scripts/export-course-json.mjs` **and**
  `generate-fixtures.mjs` and commit — CI enforces freshness.
- Adding an entitlement changes `DEPLOYMENT.md` step 9 (App Privacy) and
  possibly step 3 (capabilities). Update it in the same PR.

---

## Explicitly out of scope

- Any third-party cloud LLM (OpenAI/Anthropic/Gemini direct) — needs an API
  key, breaks the no-secrets constraint outright.
- Rewriting the authored course content to be model-generated. The authored
  vocab, exercises and exegesis stay the source of truth; models *extend*
  practice, never replace curriculum.
- Android / web parity for any of this. These are iOS-only capabilities; the
  web app's feature set is unaffected.

---

## Open questions

1. ~~**Does the `journal` assistant schema actually fit?**~~ **CLOSED
   2026-08-23 — no.** It is date-indexed and create-oriented; this app is
   week-indexed and edit-oriented. `library.book` does not fit either, and
   carries a CEI-licensing problem on top. See I4 above. I2's plain
   `WeekEntity` already covers what a schema would have wrapped.
2. **Has the iOS 27 ship date moved?** Reporting put it at September 2026.
   Confirm before planning P3 around it.
3. ~~**Is the App Group trade worth it for I3?**~~ **CLOSED 2026-08-23 — no,
   not yet.** It is not merely "a small increase in provisioning complexity":
   App Groups require the **paid** Developer Program, so a progress widget
   would force the $99 spend before the app could be tested on device at all,
   inverting `DEPLOYMENT.md`'s free-account onboarding. Deferred until the
   paid membership exists. See I3 above.
4. ~~**Does on-device FM handle Italian well enough?**~~ **CLOSED
   2026-08-23 — yes for explaining, no for grading.** Spiked on real course
   data: 0 false accepts, but only a one-case verdict gain over `checkAnswer`
   and badly prompt-sensitive. Its real value is the feedback text. See I5
   above for the revised recommendation and the numbers.

---

## Sources

- [WWDC 2026: Everything announced on Siri AI, iOS 27, Apple Intelligence — TechCrunch](https://techcrunch.com/2026/06/09/wwdc-2026-everything-announced-on-siri-ai-os-27-apple-intelligence-and-more/)
- [Build intelligent Siri experiences with App Schemas — WWDC26 session 240](https://developer.apple.com/videos/play/wwdc2026/240/)
- [Private Cloud Compute — Apple Developer](https://developer.apple.com/private-cloud-compute/)
- [App schema domains — Apple Developer Documentation](https://developer.apple.com/documentation/appintents/app-schema-domains)
- [App Intents — Apple Developer Documentation](https://developer.apple.com/documentation/appintents)
- [Foundation Models API in iOS 27: What Is Open, Gated, and Entitlement-Only](https://3nsofts.com/guides/foundation-models/foundation-models-api-ios-27-entitlements)
- [Apple Retires SiriKit for App Intents in iOS 27 — SoftwareSeni](https://www.softwareseni.com/why-apple-is-retiring-sirikit-and-what-app-intents-means-for-developers/)

*Researched 2026-08-21. Apple's entitlement policies change; re-verify the
entitlement table before acting on it.*
