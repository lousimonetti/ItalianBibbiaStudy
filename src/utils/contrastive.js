// "Trappole inglesi" drill logic (plan-speaking.md S5). Pure verdict +
// per-category stats; the drill UI lives in TrapDrill.jsx and the dataset in
// the course (course/traps.js).
//
// Matching deliberately does NOT reuse answer.js's `canonical`: that strips a
// leading article, and here article presence can be the whole point ("mia
// madre" vs the trap "la mia madre"). Sentences are compared with accent/
// case/punctuation folding and whitespace collapse only.

import { normalize, levenshtein } from './pronunciation';
import { storageKey } from './storageKey';

export const STORAGE_KEY = storageKey('traps');

export function canonSentence(s) {
  return normalize(String(s ?? ''))
    .replace(/[.,;:!?"«»'’`()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(expected, given) {
  const e = canonSentence(expected);
  if (e === given) return true;
  const tolerance = Math.max(1, Math.floor(e.length * 0.2));
  return levenshtein(e, given) <= tolerance;
}

// Verdict for one answer:
//   'correct' — matches the target (or an accepted alternate)
//   'trap'    — matches a predicted English-interference form → show the note
//   'other'   — wrong, but not the predicted way
//   'empty'   — nothing typed
// Predicted wrongs are checked *exactly* first so an interference form that
// happens to sit within typo distance of the correct answer (e.g. "mi piace i
// salmi" vs "mi piacciono i salmi") is never fuzzy-accepted as correct; fuzzy
// wrong-matching runs after the correct check to catch typo'd trap answers.
export function verdict(item, given) {
  const g = canonSentence(given);
  if (!g) return 'empty';
  const wrongs = item.wrongs ?? [];
  if (wrongs.some((w) => canonSentence(w) === g)) return 'trap';
  const accepted = [item.it, ...(item.alt ?? [])];
  if (accepted.some((a) => fuzzyMatch(a, g))) return 'correct';
  if (wrongs.some((w) => fuzzyMatch(w, g))) return 'trap';
  return 'other';
}

// ── per-category stats (store shape: { [trap]: { attempts, correct } }) ─────
export function recordResult(store, trap, ok) {
  const prev = (store || {})[trap] || { attempts: 0, correct: 0 };
  return {
    ...(store || {}),
    [trap]: { attempts: prev.attempts + 1, correct: prev.correct + (ok ? 1 : 0) },
  };
}

// Accuracy 0–1, or null when the category was never attempted.
export function accuracyFor(store, trap) {
  const s = (store || {})[trap];
  if (!s || !s.attempts) return null;
  return s.correct / s.attempts;
}

// Order drill items weakest-category-first: never-attempted categories lead
// (they're unknowns), then ascending accuracy. Item order within a category is
// randomized. `rand` is injectable for tests.
export function orderByWeakness(items, store, rand = Math.random) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const rank = (item) => {
    const acc = accuracyFor(store, item.trap);
    return acc === null ? -1 : acc;
  };
  return shuffled.sort((a, b) => rank(a) - rank(b));
}

// ── localStorage wrappers ────────────────────────────────────────────────────
export function loadTrapStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveTrapResult(trap, ok) {
  const next = recordResult(loadTrapStats(), trap, ok);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — degrade silently
  }
  return next;
}
