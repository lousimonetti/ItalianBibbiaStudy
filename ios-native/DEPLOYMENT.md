# Deploying to the App Store — a first-timer's guide

This walks you from "I have this repo" to "my app is on the App Store",
assuming you've never shipped an iOS app before. Budget expectations:

| Step | Cost | Time |
|------|------|------|
| Run on the simulator | free | 15 min |
| Run on your own iPhone | free (Apple ID) | 30 min |
| TestFlight beta (you + friends/family) | **$99/yr** Apple Developer Program | half a day + ~1 day Apple processing |
| App Store release | included in the $99 | 1–3 days for review |

If the app is just for you, **stop after step 3** — you never need to pay
Apple anything (the free install expires after 7 days and needs re-installing
from Xcode; the $99 membership removes that limit via TestFlight).

---

## 1. Prerequisites (one-time Mac setup)

1. A Mac running a recent macOS (any Apple-silicon Mac, or Intel from ~2019).
2. Install **Xcode** from the Mac App Store (free, ~15 GB, grab a coffee).
   Launch it once and accept the license / let it install components.
3. Install [Homebrew](https://brew.sh) if you don't have it, then:
   ```bash
   brew install xcodegen node
   ```
4. Clone this repo and generate the Xcode project:
   ```bash
   git clone <your fork of this repo>
   cd ItalianBibbiaStudy/ios-native
   xcodegen generate
   open ItalianBibbiaStudy.xcodeproj
   ```

## 2. Make the app yours (5 minutes, do this first)

1. **Bundle identifier** — open `project.yml` and change
   `com.example.italianbibbiastudy` to something you own, conventionally your
   domain or name reversed: `com.janedoe.italianbible`. It must be globally
   unique on the App Store and **can never change after release**. Re-run
   `xcodegen generate` after editing.
2. **App icon** — you need one 1024×1024 PNG, no transparency, no rounded
   corners (iOS rounds it for you). Any image editor works; free generators
   like [icon.kitchen](https://icon.kitchen) are fine. In Xcode, open
   `App/Resources/Assets.xcassets` → **AppIcon** and drop the PNG in the
   single 1024pt slot.
3. **Display name** (optional) — `CFBundleDisplayName` in `project.yml`
   ("Italian Bible Study" is 20 characters; the home screen truncates around
   14, showing "Italian Bible…").

## 3. Run it — simulator, then your own iPhone (free)

1. **Simulator**: in Xcode's toolbar pick any iPhone simulator and press ⌘R.
   Check the tabs work; TTS speaks with the Italian voice.
2. **Your iPhone**:
   - Xcode → Settings → Accounts → **+** → sign in with your Apple ID
     (a normal free one).
   - Click the project (blue icon, left sidebar) → target
     **ItalianBibbiaStudy** → *Signing & Capabilities* → check **Automatically
     manage signing** and pick your "(Personal Team)".
   - Plug in your iPhone (or pair over Wi-Fi), select it as the run
     destination, ⌘R.
   - First run: the phone blocks the app. Fix on the phone at
     *Settings → General → VPN & Device Management → trust your developer app*.
   - On the phone, enable Developer Mode if prompted
     (*Settings → Privacy & Security → Developer Mode*, then reboot).

   ⚠️ Free-account installs expire after **7 days** and you're limited to 3
   apps — fine for personal use, re-run from Xcode weekly.

3. **Sanity test on device** (the simulator can't do all of these):
   - Tracker → open a week → tap a passage word → gloss sheet + speaker works.
   - Flashcards → run a practice session → grade a few cards; check haptics.
   - Pronunciation → allow mic + speech permissions → record a word → score
     appears.
   - Settings → Export backup → share to Files; re-import it.
   - Settings → enable the daily reminder → check the notification arrives
     (set the hour to the next full hour to test quickly).
   - Web interop: on the web app, Sync → download the `.json` backup, AirDrop
     it to the phone, import it in Settings → Sync. Your streak/progress
     should appear.

## 4. Join the Apple Developer Program ($99/year)

Needed for TestFlight and the App Store.

1. Go to [developer.apple.com/programs](https://developer.apple.com/programs/)
   → Enroll, as an **Individual** (the simple path; your personal name shows
   as the seller). Pay the $99. Approval is usually minutes-to-hours, can
   take a day.
2. Back in Xcode → Settings → Accounts, your team changes from
   "(Personal Team)" to a real team. In *Signing & Capabilities* select the
   new team. That's the only signing work you do — leave "Automatically
   manage signing" on and Xcode handles certificates and profiles.

## 5. Create the app record in App Store Connect

1. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com) →
   **My Apps** → **+** → *New App*:
   - Platform: iOS · Name: what users see in the store (must be unique
     store-wide; have 2–3 backups ready)
   - Primary language: English · Bundle ID: pick the one from step 2
   - SKU: any private string, e.g. `italianbible-001`.
2. You don't fill the listing yet — you just need the record to exist so
   uploads have somewhere to land.

## 6. Upload a build (TestFlight)

1. In Xcode: select **Any iOS Device (arm64)** as the destination (not a
   simulator), then **Product → Archive**.
2. When the Organizer window opens: **Distribute App → App Store Connect →
   Upload**, accept defaults, Upload. (This replaces the old `altool` CLI
   flow — you never need the terminal for this.)
3. Wait for the "processing completed" email (~15–60 min), then in App Store
   Connect → your app → **TestFlight** tab:
   - Answer the *export compliance* question if asked — this app sets
     `ITSAppUsesNonExemptEncryption=false` so it's usually auto-answered
     (it only uses HTTPS, which is exempt).
   - **Internal testing**: add yourself as a tester → install the TestFlight
     app on your phone → accept the invite. Internal builds are live
     immediately, no review, and last 90 days.
   - **External testing** (friends/family via a public link) requires a light
     "beta review", usually < 1 day.
4. Live with it for a week. The web app's data can come with you (Sync
   import), so do your real daily study on the beta.

## 7. Fill in the App Store listing

In App Store Connect → your app → the version page. What you'll need:

- **Screenshots** — required sizes: 6.9" (iPhone 16 Pro Max class) and, if
  you support iPad (this project does), 13" iPad Pro. Easiest path: run the
  app in those two **simulators**, ⌘S saves a PNG at the exact required
  resolution. 3–5 screenshots each: Tracker, a week's reading, a flashcard
  session, the journal.
- **Description** — plain text. Lead with what it does: *"A 37-week
  self-paced Italian course that reads the Bible (CEI 2008) as its primary
  text — spaced-repetition flashcards, listening, pronunciation scoring,
  grammar drills, and a writing journal. Works offline."*
- **Keywords** (100 chars) — e.g. `italian,learn italian,bible,flashcards,
  srs,vocabulary,language,study`
- **Support URL** — your GitHub repo URL is acceptable.
- **Privacy policy URL** — required even when you collect nothing. A one-page
  statement in the repo (e.g. `PRIVACY.md` published via GitHub Pages)
  saying: all data stays on device; the only network calls are the optional
  LanguageTool grammar check (text you submit is sent to
  api.languagetool.org) and Apple speech recognition for pronunciation
  scoring; no accounts, no analytics, no ads.
- **App Privacy questionnaire** — because journal text is sent to
  LanguageTool *only when the user taps Check* and isn't linked to identity,
  the honest answers are: Data collected: **None** (LanguageTool processing
  is user-initiated and not "collection" by you — but read the questions
  yourself; if unsure, declare "User Content — not linked to you, App
  functionality").
- **Age rating** questionnaire → effectively 4+.
- **Category** — Education (primary), Reference (secondary).
- **Pricing** — Free unless you have reasons otherwise.

## 8. Submit for review

1. On the version page, pick the build you uploaded, save, **Add for Review →
   Submit**.
2. In *App Review notes*, preempt the reviewer: "Microphone and speech
   recognition are used only for pronunciation practice (Flashcards →
   Pronunciation). No account is needed; all content is bundled."
3. Typical wait: 24–72 h. Common first-app rejections and the fix:
   - **Guideline 2.1 (crashes)** — test the exact archive build via
     TestFlight first, not just Debug runs.
   - **4.2 minimum functionality** — not a risk here; the app is substantial.
   - **5.1.1 permission strings** — ours are specific already (see
     `project.yml`); don't blank them.
   - **Metadata rejected** — screenshots must show the real app, no device
     frames with wrong devices.
4. If rejected: reply in Resolution Center, fix, resubmit — turnaround on
   resubmission is usually faster. It's a conversation, not a verdict.
5. On approval, release (manual or automatic per your version settings). 🎉

## 9. Shipping updates

1. Bump `MARKETING_VERSION` (e.g. `1.0.1`) — and always bump
   `CURRENT_PROJECT_VERSION` — in `project.yml`, `xcodegen generate`,
   re-archive, upload, submit. Updates go through review too, but faster.
2. If course content changed, regenerate the bundled data first:
   ```bash
   node ios-native/scripts/export-course-json.mjs
   node ios-native/scripts/generate-fixtures.mjs
   swift test --package-path ios-native/BibbiaCore
   ```

## Troubleshooting

- **"Signing for ItalianBibbiaStudy requires a development team"** — target →
  Signing & Capabilities → pick your team.
- **"Failed to register bundle identifier"** — someone owns that id; make
  yours more unique in `project.yml`, regenerate.
- **Device not showing as a run destination** — unlock the phone, tap "Trust
  This Computer", enable Developer Mode, use a data-capable cable.
- **Italian voice sounds robotic / silent on device** — iOS downloads voices
  on demand: phone *Settings → Accessibility → Spoken Content → Voices →
  Italian* and download one (e.g. Alice). The app uses whatever `it-IT`
  voice is installed.
- **Mic recording works in simulator but scoring is empty** — the simulator
  uses the Mac's mic; on device make sure both permission prompts (mic AND
  speech recognition) were accepted — reset via iOS Settings → the app.
- **XcodeGen changes don't appear** — `xcodegen generate` again; Xcode picks
  up the regenerated project automatically (close it first if it's weird).
