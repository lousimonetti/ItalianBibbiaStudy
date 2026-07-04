// Transformation drill ("Trasforma") logic (plan-speaking.md S2): manipulate an
// Italian sentence entirely within Italian (pluralize, change tense, swap a
// clitic) — English never enters the loop, so it trains thinking in the target
// grammar. A transform item is { instruction, base, answer } with the
// instruction in Italian. Whole-sentence checking reuses the forgiving
// `checkAnswer`; a word-level diff (reused from dictogloss) shows *which* word
// the learner failed to transform. Pure + unit-tested.

import { normalize } from './pronunciation';
import { diffReconstruction } from './dictogloss';

export function transformItems(week) {
  if (!Array.isArray(week?.transform)) return [];
  return week.transform.filter(
    (t) =>
      t &&
      typeof t.instruction === 'string' && t.instruction.trim() &&
      typeof t.base === 'string' && t.base.trim() &&
      typeof t.answer === 'string' && t.answer.trim()
  );
}

// Canonical token sequence: fold accents/case/punctuation per word, collapse
// whitespace. Unlike Recall/Cloze, transforms are NOT fuzzy-matched — the
// transformations themselves are often single-character (pastore→pastori,
// la→le), so any per-word typo tolerance would accept the untransformed form.
// Exact form is required; a typo just means "retry" on a formative drill.
function tokens(s) {
  return normalize(String(s ?? ''))
    .replace(/[.,;:!?"«»'’`()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Grade a typed transform. Returns { correct, diff } where correct is exact
// token-sequence equality and diff is the dictogloss word-level comparison of
// the attempt against the expected answer (so the UI can highlight the words
// that differ on a miss).
export function checkTransform(item, typed) {
  const exp = tokens(item.answer);
  const got = tokens(typed);
  const correct = exp.length === got.length && exp.every((w, i) => w === got[i]);
  const diff = diffReconstruction(item.answer, typed);
  return { correct, diff };
}
