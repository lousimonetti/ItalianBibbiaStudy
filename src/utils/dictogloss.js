// Dictogloss reconstruction scoring (O4). The learner hears a sentence and types
// what they remember; we compare their reconstruction against the original at the
// word level and return per-word tokens (match | extra) for the original and the
// attempt, plus a 0–100 recall score. Order-independent at the token level (a
// recovered word counts even if misplaced) — dictogloss rewards gist + form, not
// verbatim dictation. Pure + unit-tested.

import { normalize } from './pronunciation';

// Word key: lowercase, fold accents, drop surrounding punctuation. Keeps internal
// apostrophes folded out so "l'acqua" → "lacqua" matches forgivingly.
function wordKey(w) {
  return normalize(w).replace(/[.,;:!?"«»'`()]/g, '');
}

export function tokenizeWords(text) {
  return String(text ?? '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

// Multiset of normalized word keys → counts.
function counts(words) {
  const m = new Map();
  for (const w of words) {
    const k = wordKey(w);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

// Compare attempt against original. Returns:
//   original: [{ w, ok }]  — each original word, ok=true if recovered
//   attempt:  [{ w, ok }]  — each typed word, ok=true if it matched an original
//   score:    0–100        — fraction of original content words recovered
export function diffReconstruction(original, attempt) {
  const origWords = tokenizeWords(original);
  const attWords = tokenizeWords(attempt);

  // Greedy multiset matching so duplicates are handled (e.g. two "la"s).
  const attRemaining = counts(attWords);
  const origMarks = origWords.map((w) => {
    const k = wordKey(w);
    const have = attRemaining.get(k) || 0;
    if (k && have > 0) {
      attRemaining.set(k, have - 1);
      return { w, ok: true };
    }
    return { w, ok: false };
  });

  const origRemaining = counts(origWords);
  const attMarks = attWords.map((w) => {
    const k = wordKey(w);
    const have = origRemaining.get(k) || 0;
    if (k && have > 0) {
      origRemaining.set(k, have - 1);
      return { w, ok: true };
    }
    return { w, ok: false };
  });

  const recovered = origMarks.filter((m) => m.ok).length;
  const score = origWords.length
    ? Math.round((recovered / origWords.length) * 100)
    : 0;

  return { original: origMarks, attempt: attMarks, score };
}
