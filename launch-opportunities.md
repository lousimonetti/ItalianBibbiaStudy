# Public Launch — Opportunities Assessment

**Question:** the app is feature-complete for its original single user. What
stands between the current state and a *public* launch — other people finding,
installing, and successfully using it — and what are the highest-leverage
opportunities around that launch?

This is the launch-readiness companion to `opportunities.md` (learning
features). Items are numbered **L1–L16** and grouped: **blockers** (launch is
broken or risky without them), **launch-quality** (strangers' first five
minutes), **distribution** (web / iOS / Android channels), and **growth**
(after the doors open).

---

## Snapshot of where the product stands

Everything a learner needs is built and merged: the 37-week course, SRS
practice, reading/comprehension suite, speaking roadmap (P1–P3), streaks,
offline PWA, QR/file cross-device sync, the CourseKit multi-course platform
(T0–T5), and a native iOS app in `ios-native/` with a step-by-step App Store
guide. Nothing below is about missing study features — it is all about the gap
between "works for the author" and "works for the public."

---

## LAUNCH BLOCKERS

### L1 — New Session / Calendar Reset on the web app (`plan-new-session.md`)

**✅ SHIPPED** — `sessionStart.js`/`resetSession.js`/`NewSession.jsx` +
per-call `schedule.js`; week ranges compute from the effective start; the
override uses the iOS key/format so sync backups interop. Original rationale:

**The single hard functional blocker.** `config.schedule.startDate` is
hardcoded to `2026-04-13`. A stranger who opens the web app today lands in the
middle of week ~13 with weeks 1–12 already "missed," and has **no way to start
the program from today** without editing source. The full spec already exists
in `plan-new-session.md` (T0 schedule override in `localStorage` →
`src/utils/sessionStart.js`; T1 "New Session" sheet; T2 selective data reset;
T3 dynamic end-date display) and — crucially — **the iOS app already
implements exactly this pattern** (`ensureSessionStart()` stamps a
`session-start` override on first open, and week date ranges are computed from
the effective start). The web app needs parity before anyone else can use it.

- Effort: S–M (the plan is written; iOS is the reference implementation)
- Priority: **do first — nothing else matters if new users can't start**

### L2 — Content licensing: CEI 2008 passage text

**◐ PARTIALLY SHIPPED** — the attribution notices are live (CEI quotation
notice + Wikipedia CC BY-SA + LanguageTool credit in the new About & privacy
panel, driven by `config.licenses`; the Journal credits LanguageTool while the
grammar check is on). Remaining human action: verify quotation scope /
email the Fondazione for explicit permission (options below).

`courses/it-bible-cei/exercises.js` ships 4–8 verses of **La Bibbia CEI 2008**
per week for all 37 weeks. The CEI translation is copyrighted (© Fondazione di
Religione Santi Francesco d'Assisi e Caterina da Siena / CEI). Private
personal use is one thing; *public distribution* on the open web and the App
Store is redistribution. Before launch, pick one:

1. **Attribution + quotation scope** — CEI's standard permission allows
   limited verse quotation with the prescribed copyright notice for
   non-commercial use. Add the notice to the reading panel, the About section,
   and the App Store listing; verify the per-work quotation limits against
   what's shipped (the app quotes short excerpts, never a full book — likely
   fine, but verify).
2. **Ask** — CEI/Fondazione grants gratis licenses for non-commercial
   catechetical use; a short email may fully clear it.
3. **Fallback** — a public-domain Italian translation (e.g. Diodati 1649/1821)
   swapped into `exercises.js` if permission is refused. Archaic Italian makes
   this a last resort for a *learning* app.

The same diligence applies to the Saints tab's Wikipedia extracts (CC BY-SA —
needs visible attribution + license link; the "Leggi tutto su Wikipedia" links
help but a license mention is required) and to the Anki export (the `.apkg`
example sentences are original course content — fine).

- Effort: S (notice + email) — but has **lead time**; start now
- Priority: **must be resolved before the URL is shared publicly**

### L3 — Privacy policy + permission disclosures

**✅ SHIPPED** — `AboutPrivacy.jsx`: a static, offline "About & privacy"
modal behind an app footer link covering data-on-device, the two online
services (LanguageTool, Wikipedia), and mic/camera/notification use. Reuse
its text for the App Store privacy labels. Original rationale:

Required for the App Store (privacy nutrition labels) and expected on the web.
The app is genuinely privacy-friendly — no backend, no accounts, no analytics,
all data in `localStorage` — which is a *selling point* once written down. The
policy must disclose the three outbound calls (LanguageTool grammar check
sends journal text to `api.languagetool.org`; Wikipedia REST for saints;
nothing else), plus mic/speech-recognition use (audio processed by the
browser/OS speech service), notifications, and camera (QR import). Host it as
a static page in the app (About/Settings) so it works offline too.

- Effort: S
- Priority: blocker for App Store, near-blocker for web

---

## LAUNCH QUALITY — a stranger's first five minutes

### L4 — First-run onboarding tied to L1

`WelcomeCard` exists (resources list, `-welcome-seen` key) but assumes the
author's context. A public first-run should: (1) ask "start today or pick a
date?" — writing the L1 override; (2) one-screen tour of the five tabs;
(3) set expectations (37 weeks, ~30 min/day, works offline, install to home
screen). The iOS app's one-time welcome sheet is the model.

- Effort: S–M · builds directly on L1

### L5 — README + in-app About refresh

`README.md` still describes **three** tabs, a `studyData.js` data layer, and
`unzip italian-bible-pwa.zip` setup — three generations stale. For launch it
is the landing page for the *developer* audience (see L14): rewrite around
what shipped (5 tabs, SRS, speaking suite, sync, iOS app, CourseKit), add
screenshots, and link `AUTHORING.md`. Add a `LICENSE` file — the repo
currently has none, so nobody may legally fork the "fork-and-fill" template.

- Effort: S · the missing LICENSE is itself a small blocker for the template story

### L6 — Social/SEO metadata + PWA manifest polish

`index.html` has no Open Graph / Twitter card tags, so every share renders as
a bare link — the cheapest possible launch-day win. Add `og:title`,
`og:description`, `og:image` (one nice screenshot), canonical URL. In the PWA
manifest add `screenshots` (enables Chrome's richer install sheet), separate
`purpose: 'any'` and `'maskable'` icon entries (a single `'any maskable'` icon
gets cropped badly on Android), `lang`, and `categories: ['education']`.

- Effort: S

### L7 — Robustness on unknown devices

The author's devices are known; the public's aren't. Three cheap hardenings:
(1) a top-level React **error boundary** with a "copy error / reload" screen —
today one render crash white-screens the whole PWA; (2) `localStorage`
**quota/`SecurityError` guards** (Safari private mode throws on `setItem`;
a wrapped `storageKey` setter degrades gracefully); (3) a pass over
**Safari/iOS PWA behavior** — speech recognition is Chrome-only (already
gated by `src/utils/speech.js`), but verify TTS voice availability messaging
and the 7-day ITP localStorage eviction risk (mitigation: nudge users to
Install to Home Screen, which exempts storage, and to export a sync backup —
both features already exist; this is a messaging task, not a build task).

- Effort: M · do before, not after, the traffic arrives

### L8 — Custom domain before first user

Documented in the README and **order-sensitive**: `localStorage` is
origin-scoped, so moving from `*.azurestaticapps.net` to a real domain later
strands every early user's progress (the QR sync is the escape hatch, but
don't rely on it). Buy the domain, wire it up, *then* share the URL.

- Effort: S · zero code

---

## DISTRIBUTION CHANNELS

### L9 — App Store release of the iOS app

The app is **built**; `ios-native/DEPLOYMENT.md` already walks the whole path.
Remaining is execution: unique bundle id, 1024px icon, screenshots
(`design/figma-mockups.html` frames are a head start), the $99 Apple
Developer Program, privacy labels (from L3), App Review content-rights answer
(from L2), and a **TestFlight beta round first** — 5–10 external testers
shaking out device/voice/locale issues before public review.

- Effort: M (mostly process) · 1–2 weeks calendar time including review

### L10 — Android presence: PWA install now, optional Play Store later

The PWA already installs on Android with an in-app prompt — for launch, just
document it. A Play Store listing via **TWA/Bubblewrap** (wraps the deployed
URL; needs `assetlinks.json` on the static host + a $25 one-time fee) is a
low-effort discoverability follow-up, not a blocker.

- Effort: S now, M for TWA later

### L11 — Decide the sync story's public framing (and `plan-sync.md` follow-ups)

QR/file sync is shipped and is the *only* cross-device path — say so plainly
in onboarding ("your data lives on this device; here's how to back it up").
Post-launch, the `plan-sync.md` online auto-sync (opt-in BaaS) graduates from
nice-to-have to the most-requested feature the moment two-device users exist;
multi-QR chunking matters once real users have large snapshots.

- Effort: S (messaging) now; the BaaS work is post-launch

---

## GROWTH — once the doors open

### L12 — Feedback channel inside the app

A "Feedback" link (GitHub issue template or `mailto:`) in the About/Settings
area. Without a backend there is no telemetry — user reports are the *only*
signal, so make reporting effortless. Pair with a visible version string
(commit hash injected at build) so reports are diagnosable.

- Effort: S

### L13 — Launch communications

The app has two authentic stories: (a) *the app* — "learn Italian through the
Bible in 37 weeks, free, offline, no account" for r/italianlearning, Catholic
communities, language-learning forums; (b) *the build* — a research-backed,
no-backend PWA + SwiftUI port with JS-fixture parity tests, ideal for a Show
HN / dev.to write-up. Prepare one good screenshot set + a 60-second screen
recording; L6's OG tags make every share look right.

- Effort: S–M · pure prep, no code

### L14 — Launch CourseKit as a separate product: the template repo

T0–T5 made this "fork-and-fill." Cash that in: mark the repo (or a cleaned
mirror) as a **GitHub template repo**, so "Use this template" replaces
fork-and-strip. Prerequisites: the LICENSE (L5), and the two known platform
gaps become the template's top issues — **Anki generation still targets only
the default course**, and **`GuideSection.jsx`/`SentenceGuide.jsx` still hold
course-specific prose** (`AUTHORING.md` already flags moving them into
`course/` as the follow-up). A second small demo course in `courses/` (the
`new-course` scaffolder can seed it) proves the multi-course picker publicly.

- Effort: M · this is the story that differentiates the project

### L15 — Lightweight quality gates for public traffic

A Lighthouse pass (PWA/a11y/SEO categories — a11y has never been audited:
contrast in dark mode, focus states, `aria-label`s on the many icon buttons),
and a `bundlesize`/build-size check in CI so the no-backend app stays fast on
mid-range phones. CI already runs lint + 237 tests + build; these bolt on.

- Effort: S–M

### L16 — Post-launch learning-feature backlog stays as-is

The remaining `opportunities.md` items (O12 adaptive cap, O9 spaced writing
retrieval, O6 morphology, O15 reading speed, O10 error classification) and
issue #37 are *retention* features — they matter after users arrive. Nothing
in that backlog blocks launch; resist doing them first.

---

## Addendum — verified findings (follow-up pass)

- **Dependabot alerts are dev-tooling only.** `npm audit --omit=dev` → **0
  production vulnerabilities**; the full audit shows 11 (5 high) all in the
  build chain (vite, babel plugins, postcss, undici, serialize-javascript…).
  Nothing vulnerable ships to users. Action: `npm audit fix` + bump vite
  within the pinned `^6.x` — hygiene before the repo goes public/template
  (L14), not a launch blocker.
- **Offline Anki decks are documented but not configured.** README and
  CLAUDE.md say Workbox precaches `.apkg`, but `vite.config.js`'s
  `globPatterns` is `'**/*.{js,css,html,ico,png,svg}'` — no `apkg` — so deck
  downloads fail offline. All 42 decks total only **256 KB**: either add
  `apkg` to the glob (costs nothing) or fix the docs.
- **Hosting headroom confirmed.** `public/` is ~300 KB; Azure SWA free-tier
  caps (250 MB app, 100 GB/mo bandwidth) leave orders of magnitude of room.
- **LanguageTool at public scale.** The public API is rate-limited per client
  IP (~20 req/min), so per-user usage is fine; its terms expect attribution —
  add a "powered by LanguageTool" line in the Journal (fold into L3's
  disclosures).

---

## Suggested sequence

| Phase | Items | Outcome |
|-------|-------|---------|
| **1. Unblock** | L1 (new session) · L2 (CEI licensing, start the clock) · L5 LICENSE | a stranger can start today, legally |
| **2. Polish** | L3 privacy · L4 onboarding · L6 metadata · L7 robustness · L8 domain | first five minutes survive contact |
| **3. Ship web** | L11 sync framing · L12 feedback · L13 comms | soft launch: share the URL |
| **4. Ship iOS** | L9 TestFlight → App Store | second channel |
| **5. Grow** | L14 CourseKit template · L10 Play Store TWA · L15 gates · then O-backlog | compounding |

The critical path is short: **L1 is the only real engineering blocker, and its
plan is already written with a working iOS reference implementation.**
Everything else in phases 1–3 is small, mostly non-code work that can proceed
in parallel.
