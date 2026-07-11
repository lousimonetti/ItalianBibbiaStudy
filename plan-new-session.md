# Plan: New Session / Calendar Reset

**Status: SHIPPED.** T0–T4 are implemented (see the task list below). Notable
deviations from the original spec: the SRS reset clears the whole store —
matching the iOS app's `startNewSession` — rather than zeroing intervals
per-card (cleared cards simply become "new"; the vocab lives in the course,
nothing is lost but review history); the entry point is a `SessionRow` footer
on the `TodayCard` (a subtle "⟳ New session" link, or a prominent start button
when the program is inactive) rather than a settings sheet; and beyond the
spec, week date ranges shown in the UI are *computed* from the effective start
(`weekDateLabel` in `schedule.js`, the web port of iOS `weekRangeLabel`) once
an override is active, falling back to the authored `week.d` strings on the
default calendar. The override is the same plain `YYYY-MM-DD` string under the
same key the iOS app writes, so sync backups carry it in both directions.

**Goal:** Let any user (not just the original author) start the 37-week program
from *today* — and restart it whenever they want — without touching source code.
A "New Session" action writes a custom `sessionStart` override to `localStorage`;
`schedule.js` reads that override in preference to the hardcoded `startDate` in
`config`.

---

## Why

`config.schedule.startDate` is currently `2026-04-13` (Easter Sunday).  Anyone
who forks the repo or discovers the app later has to edit a source file to shift
the calendar.  Worse, there is no supported way to *restart* the course after
finishing or pausing.  This feature makes the timeline personal and mutable.

---

## Behaviour spec

| Action | Result |
|--------|--------|
| First launch (no override) | Calendar runs from `config.schedule.startDate` — **no change for existing users** |
| "Start New Session" | `sessionStart = today`; calendar resets to today + 37 weeks; optionally resets progress/SRS/streak/journal |
| "Reset to course default" | Deletes the override; reverts to `config.schedule.startDate` |
| App opened after override set | Override is read from `localStorage`; all schedule-derived UI (current week, end date, TodayCard) reflects new timeline |
| Partial reset | User may keep SRS/pronunciation data (hard-won) while clearing weekly progress & streak |

**End date** displayed in `TodayCard` and the header tagline changes to
`"X weeks to [end date]"` computed from the override.

---

## Task list

### T0 — Schedule override (pure logic, no UI)

- [x] Add `storageKey('session-start')` to the key registry (comment in `storageKey.js`)
- [x] Create `src/utils/sessionStart.js`:
  - `getSessionStart()` → reads override from localStorage; falls back to `config.schedule.startDate`
  - `setSessionStart(isoDate)` → writes ISO string to localStorage
  - `clearSessionStart()` → removes the key (reverts to config default)
- [x] Refactor `src/utils/schedule.js`:
  - Replace direct read of `config.schedule.startDate` with `getSessionStart()`
  - `PROGRAM_START` becomes a function-local derived value inside `getCurrentWeekN()` (so it re-reads on each call, not at module load — this is critical for post-reset correctness)
  - Export `getEndDate()` → `Date` object of session start + 37 weeks (used by UI)
  - Export `getSessionStartLabel()` → human-readable "Apr 13, 2026" string for display
- [x] Add `schedule.test.js` cases:
  - `getCurrentWeekN()` with override set (mock `Date.now`)
  - `getCurrentWeekN()` reverts correctly after `clearSessionStart()`
  - `getEndDate()` returns correct date

### T1 — New Session modal

- [x] Create `src/components/NewSessionModal.jsx`:
  - Trigger: "Start New Session" button (initially surfaced from `TrackerTab` header actions or a `SettingsSheet`)
  - Step 1: Date picker — "Start today (default)" | custom date input (YYYY-MM-DD)
  - Step 2: Reset scope checkboxes (all checked by default):
    - [ ] Weekly progress (completion ticks)
    - [ ] Streak & daily goal
    - [ ] SRS card schedule (keeps cards, resets intervals)
    - [ ] Journal entries
  - Step 3: Confirm button: "Begin 37-week program from [chosen date]"
  - Cancel at any step leaves everything unchanged
- [x] Wire the "Start New Session" entry point:
  - Add a `⟳ New session` icon-button in the `TodayCard` header (only shown when the current week is null — before start or after week 37 — *or* from the settings sheet at any time)
  - Settings sheet: always-visible "Session" section with current start/end dates + "Restart" link

### T2 — Reset executor

- [x] Create `src/utils/resetSession.js`:
  ```js
  // resetSession({ startDate, resetProgress, resetStreak, resetSrs, resetJournal })
  // Writes new sessionStart, then selectively clears localStorage keys.
  ```
  - Each reset flag maps to `localStorage.removeItem(storageKey('…'))`
  - SRS-partial reset: zero out `interval`/`reps`/`ease` for every card but keep the card list itself (so "hard-won vocab" isn't lost from the deck)
- [x] After reset, call `window.location.reload()` so all modules re-initialise from the new start date (same pattern as `CoursePicker`)

### T3 — UI updates

- [x] `TodayCard.jsx`: replace hardcoded `"Dec 25, 2026"` goal string with `getEndDate()` formatted dynamically
- [x] Update the `brand.tagline` shown on `WelcomeCard` to interpolate end date when an override is active, e.g. `"37 weeks to [end date] · La Bibbia CEI 2008"`
- [x] Show a subtle "Session started [date]" chip on the Tracker header when an override is active (so users know they're on a custom timeline)
- [x] `FlashcardsTab` / `PracticeMode` / `PronunciationPractice` still show hardcoded "259 cards" — those don't need to change (card count is content, not schedule)

### T4 — Tests & validation

- [x] `sessionStart.test.js` — unit tests for get/set/clear
- [x] `resetSession.test.js` — verify each flag clears only the right keys
- [x] Update existing `schedule.test.js` to account for the new dynamic `PROGRAM_START` (mock `getSessionStart`)
- [x] Manual smoke test: set override → reload → verify week number → clear override → verify revert

---

## Storage key

```
italian-bible-session-start   →   "2026-06-27"  (ISO date string, or absent)
```

This key uses `storageKey('session-start')` so it is per-course namespaced — a
fork running a French course won't collide with the Italian one.

---

## Architectural note on `schedule.js`

Currently `PROGRAM_START` is computed at **module load time**:

```js
const [sy, sm, sd] = config.schedule.startDate.split('-').map(Number);
const PROGRAM_START = new Date(sy, sm - 1, sd); // ← runs once, never updates
```

After T0 this must become a **per-call** read, otherwise the module caches the
old date even after the user writes a new `sessionStart`:

```js
export function getCurrentWeekN() {
  const start = getSessionStart(); // reads localStorage each time
  const [sy, sm, sd] = start.split('-').map(Number);
  const programStart = new Date(sy, sm - 1, sd);
  const diff = Date.now() - programStart.getTime();
  if (diff < 0) return null;
  const n = Math.floor(diff / 604800000) + 1;
  return n <= config.schedule.weeks ? n : null;
}
```

The reload-after-reset (T2) sidesteps the caching problem entirely for the reset
path, but the per-call read is still needed for components that mount after a
partial update.

---

## Open questions / future

- **Pre-start countdown:** when `getCurrentWeekN()` is null because the session
  hasn't started yet, show a countdown in `TodayCard` ("Program begins in 3 days").
- **Repeat sessions:** track a `sessionNumber` counter so the UI can say
  "You're on your 2nd run-through".
- **Per-phase restart:** restart from a specific phase rather than week 1
  (e.g., "I finished phase 1 last year — continue from phase 2").
