import { normalize, levenshtein } from './pronunciation';

// Forgiving typed-answer matching for production practice (EN→IT recall & cloze).
// Reuses the accent-folding `normalize` and `levenshtein` from pronunciation.js.

const LEADING_ARTICLE = /^(l['’]|gli\s+|le\s+|il\s+|lo\s+|la\s+|i\s+|uno\s+|una\s+|un['’]?\s*)/i;

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
