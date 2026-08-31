// Verb-form recognition drill — map an inflected form back to its infinitive.
//
// Closes the reading-tense gap named in week 37's exegesis: the course teaches
// the passato prossimo and the imperfetto, but CEI narrative runs on the passato
// remoto with the trapassato prossimo behind it. Production is explicitly NOT the
// goal — a reader only needs the form → infinitive mapping to be instant.
//
// Grading is EXACT on the canonical form, not fuzzy. answer.js's ~20% edit
// tolerance would accept "dare" for "dire" (one edit in four characters), and
// those are two different verbs that both appear in this dataset — the same
// reason transformDrill.js grades exactly. Instead of fuzzy-accepting, a wrong
// answer that happens to be another verb in the dataset gets its own 'confused'
// verdict, which is the more useful feedback: it names the pair you mixed up.
//
// Pure + unit-tested. The dataset is course data (course/verbForms.js); the UI
// hides itself when a course ships none.

import { canonical } from './answer';
import { storageKey } from './storageKey';
import { recordResult, accuracyFor, orderByWeakness } from './contrastive';

export const STORAGE_KEY = storageKey('verb-forms');

export const categoryOf = (item) => item?.cat ?? '';

// Accepted answers for an item: its infinitive plus any listed alternates.
function accepted(item) {
  return [item.inf, ...(item.alt ?? [])].map(canonical);
}

/**
 * Grade one answer.
 *   'correct'  — the right infinitive (or an accepted alternate)
 *   'confused' — a different infinitive that exists in this dataset
 *   'wrong'    — anything else
 *   'empty'    — nothing typed
 * `pool` is the dataset, used only to detect the 'confused' case.
 */
export function verdict(item, given, pool = []) {
  const g = canonical(given);
  if (!g) return 'empty';
  if (accepted(item).includes(g)) return 'correct';
  const others = new Set(pool.filter((o) => o !== item).flatMap(accepted));
  return others.has(g) ? 'confused' : 'wrong';
}

// The verb the learner confused this one with, for the feedback line. Returns
// null unless the verdict is 'confused'.
export function confusedWith(given, pool = []) {
  const g = canonical(given);
  return pool.find((o) => accepted(o).includes(g))?.inf ?? null;
}

// ── scheduling + stats (per category, sharing the trap drill's store shape) ──
export function orderForms(items, store, rand = Math.random) {
  return orderByWeakness(items, store, rand, categoryOf);
}

export function loadFormStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveFormResult(cat, ok) {
  const next = recordResult(loadFormStats(), cat, ok);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — degrade silently
  }
  return next;
}

export { accuracyFor };

// ── the 3rd-plural rule, as a checkable claim ────────────────────────────────
// Almost every strong passato remoto builds its 3rd plural by adding -ro to the
// 3rd singular (disse → dissero). essere is the one exception. The drill shows
// this as a hint on plural items, so it is worth being able to state it.
export function pluralFromSingular(singular) {
  const s = String(singular ?? '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'fu') return 'furono';
  return `${s}ro`;
}

export function followsPluralRule(singular, plural) {
  return pluralFromSingular(singular) === String(plural ?? '').trim().toLowerCase();
}
