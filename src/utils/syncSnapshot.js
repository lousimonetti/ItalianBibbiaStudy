import LZString from 'lz-string';
import { config } from '../../course/config';
import { STORAGE_PREFIX } from './storageKey';

// Cross-device sync — the canonical snapshot of a course's localStorage progress.
// The app has no backend (see CLAUDE.md), so portability is built on a single
// versioned snapshot blob that any transport can carry: a QR code, a copy-paste
// "sync code", a downloaded .json file (all shipping now) and, on the roadmap, an
// online store. exportSnapshot/importSnapshot own the data; encode/decode own the
// compact wire form; transports never touch localStorage directly.

export const SNAPSHOT_VERSION = 1;

// Device-level keys that are intentionally NOT synced (they describe *this*
// device/browser, not the learner's progress).
const EXCLUDED_KEYS = new Set(['coursekit-active-course']);

function keyPrefix() {
  return `${STORAGE_PREFIX}-`;
}

// Collect every per-course key for the active course into a plain object.
function collectData() {
  const data = {};
  const prefix = keyPrefix();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || EXCLUDED_KEYS.has(key)) continue;
    if (key.startsWith(prefix)) {
      data[key] = localStorage.getItem(key);
    }
  }
  return data;
}

// Build a snapshot of this device's progress for the active course.
export function exportSnapshot() {
  return {
    v: SNAPSHOT_VERSION,
    prefix: STORAGE_PREFIX,
    courseId: config.id,
    exportedAt: new Date().toISOString(),
    data: collectData(),
  };
}

function isPlainObject(x) {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

// Validate a parsed snapshot, throwing a human-readable Error if it can't be
// applied to the active course.
export function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) throw new Error('Not a valid sync snapshot.');
  if (snapshot.v !== SNAPSHOT_VERSION) {
    throw new Error(`Unsupported snapshot version (${snapshot.v ?? 'unknown'}).`);
  }
  if (snapshot.prefix !== STORAGE_PREFIX) {
    throw new Error(
      `This snapshot is for a different course (${snapshot.courseId || snapshot.prefix}).`,
    );
  }
  if (!isPlainObject(snapshot.data)) throw new Error('Snapshot has no data.');
  return true;
}

// Apply a snapshot to localStorage. v1 supports a single mode, 'replace', which
// clears the active course's existing keys and writes the snapshot's. (Field-level
// 'merge' is intentionally deferred to the online-sync phase — see plan-sync.md.)
// Returns a summary the UI can show. Does NOT reload — the caller decides.
export function importSnapshot(snapshot, { mode = 'replace' } = {}) {
  validateSnapshot(snapshot);
  if (mode !== 'replace') throw new Error(`Unsupported import mode: ${mode}`);

  const prefix = keyPrefix();
  // Remove the course's current keys first so stale entries don't linger.
  const existing = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && !EXCLUDED_KEYS.has(key) && key.startsWith(prefix)) existing.push(key);
  }
  existing.forEach((key) => localStorage.removeItem(key));

  const written = [];
  for (const [key, value] of Object.entries(snapshot.data)) {
    // Defense in depth: only write keys that belong to this course.
    if (!key.startsWith(prefix) || EXCLUDED_KEYS.has(key)) continue;
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
      written.push(key);
    }
  }
  return { mode, written, count: written.length };
}

// Compact, URL-safe wire form for QR / copy-paste transports.
export function encode(snapshot) {
  return LZString.compressToEncodedURIComponent(JSON.stringify(snapshot));
}

// Inverse of encode(). Throws on malformed input.
export function decode(code) {
  const json = LZString.decompressFromEncodedURIComponent((code || '').trim());
  if (!json) throw new Error('Could not read sync code.');
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Sync code is corrupted.');
  }
  return parsed;
}

// Pretty JSON for the downloadable backup file.
export function toFileText(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}
