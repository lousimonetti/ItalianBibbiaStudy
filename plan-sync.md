# Cross-device sync

## Shipped: offline portability (no backend)

Progress can be moved between devices with **no backend**, preserving the repo's
core constraint. Everything is built on one canonical, versioned snapshot of the
active course's `localStorage`, carried by interchangeable transports:

- **Snapshot core** — `src/utils/syncSnapshot.js` (+ `syncSnapshot.test.js`):
  - `exportSnapshot()` gathers every `STORAGE_PREFIX-*` key (auto-discovered, so no
    hardcoded key list to drift) into `{ v, prefix, courseId, exportedAt, data }`,
    excluding the device-level `coursekit-active-course`.
  - `importSnapshot(snap, { mode: 'replace' })` validates version + course prefix,
    clears the course's current keys, and writes the snapshot's (only keys that
    belong to the active course — defense in depth).
  - `encode`/`decode` use `lz-string` for a compact, URL-safe wire form.
- **UI** — `src/components/SyncPanel.jsx`: a header button opens a modal with
  **This device** (QR code + copy-paste sync code + download `.json`) and **Import**
  (camera QR scan via `jsqr`, paste a code, or upload a file). Import confirms, then
  reloads so all hooks re-read `localStorage`. `qrcode`/`jsqr` are dynamically
  imported so they stay out of the main bundle.

### Known limits (intentional for v1)
- **QR capacity:** large snapshots (lots of journal text + SRS history) can exceed a
  single QR; the panel falls back to the code/file with a message. *Follow-up:*
  multi-QR chunking.
- **Import = replace** (whole-store overwrite). *Follow-up:* field-level merge (needed
  for the online phase below).

## Roadmap: online auto-sync (relaxes the no-backend constraint)

Optional, opt-in, gated behind sign-in — explicitly a departure from the current
"no backend / localStorage only" constraint, so it must stay off by default and not
regress the static-deploy path.

- **Store:** a BaaS free tier (e.g. Supabase) holding one row per (user, course) =
  the same `syncSnapshot` blob. Reuse `exportSnapshot`/`importSnapshot` verbatim;
  the network layer is just another transport.
- **Auth:** BaaS email/OAuth; no secrets in the repo (publishable anon key only).
- **Conflict resolution:** start last-write-wins on the whole blob; graduate to
  per-key (and ideally per-field for journal/SRS) merge so two devices edited offline
  don't clobber each other. This is the main reason `importSnapshot` already takes a
  `mode`.
- **Sync triggers:** on app open, on visibility change, and debounced after writes.
