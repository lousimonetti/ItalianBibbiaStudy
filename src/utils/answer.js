import { normalize, levenshtein } from './pronunciation';
import { LEADING_ARTICLE } from './locale';

// Forgiving typed-answer matching for production practice (EN→IT recall & cloze).
// Reuses the accent-folding `normalize` and `levenshtein` from pronunciation.js.
// The leading-article matcher comes from the course locale (locale.js).

// Lowercase, fold accents, drop a leading article and surrounding punctuation so
// "La Luce!" and "luce" compare equal.
export function canonical(s) {
  // Strip the article first (while the elided "l'" apostrophe is still intact),
  // then remove any remaining punctuation.
  return normalize(String(s ?? ''))
    .replace(LEADING_ARTICLE, '')
    .replace(/[.,;:!?"«»'`()]/g, '')
    .trim();
}

// True when `given` matches `expected` exactly (after canonicalizing) or within
// a small typo tolerance (~20% of the answer length, at least 1 edit).
export function checkAnswer(expected, given) {
  const e = canonical(expected);
  const g = canonical(given);
  if (!g) return false;
  if (e === g) return true;
  const tolerance = Math.max(1, Math.floor(e.length * 0.2));
  return levenshtein(e, g) <= tolerance;
}

// ── Grammar drills ──────────────────────────────────────────────────────────
// Drills need a stricter grader than vocab recall. A drill answer is often a
// single short form whose whole point is an accent or one letter — è vs e, dà
// vs da, sia vs sai. `canonical` folds accents away and `checkAnswer` allows at
// least one edit, so it would happily accept "a" for "è". Here accents are
// significant and short answers get no typo tolerance at all.

// Lowercase, collapse whitespace, unify apostrophes, drop surrounding
// punctuation — but keep every accent.
export function drillCanonical(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/[.,;:!?"«»()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkDrill(expected, given) {
  const e = drillCanonical(expected);
  const g = drillCanonical(given);
  if (!g) return false;
  if (e === g) return true;
  // A dropped or wrong accent is an error, never a free typo — "perche" for
  // "perché" is the mistake the drill exists to catch. Detect it by folding
  // accents: if that makes the two equal, the only difference WAS the accent.
  if (normalize(e) === normalize(g)) return false;
  // Short forms are exactly the ones that turn on one character — no fuzz.
  if (e.length < 5) return false;
  return levenshtein(e, g) <= 1;
}
