// Timed spoken Q&A ("Rispondi subito") logic (plan-speaking.md S3): a question
// is asked aloud and the learner answers aloud within a few seconds — retrieval
// speed under pressure. A question item is { q, answers:[...], model } where
// `answers` are acceptable short answers and `model` is a full model sentence.
// Speech recognition of short answers is imperfect, so matching is generous:
// canonicalize the transcript and accept it if it fuzzy-equals OR contains any
// acceptable answer. Pure + unit-tested.

import { normalize, levenshtein } from './pronunciation';

export const ANSWER_SECONDS = 8;

export function questionItems(week) {
  if (!Array.isArray(week?.questions)) return [];
  return week.questions.filter(
    (q) =>
      q &&
      typeof q.q === 'string' && q.q.trim() &&
      Array.isArray(q.answers) && q.answers.some((a) => typeof a === 'string' && a.trim())
  );
}

// Fold accents/case/punctuation and collapse whitespace. Articles are kept —
// short answers are compared by containment, so stripping them is unnecessary
// and would blur "la vita" vs "vita" distinctions the model may care about.
export function canonSpoken(s) {
  return normalize(String(s ?? ''))
    .replace(/[.,;:!?"«»'’`()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyEq(a, b) {
  if (a === b) return true;
  const tol = Math.max(1, Math.floor(a.length * 0.2));
  return levenshtein(a, b) <= tol;
}

// True when the transcript satisfies any acceptable answer: exact/fuzzy whole
// match, or the answer appears as a whole-word run inside the transcript
// (so "Dio" is found in "è stato Dio a crearlo" but not inside "condio").
export function matchesSpoken(item, transcript) {
  const t = canonSpoken(transcript);
  if (!t) return false;
  const tWords = t.split(' ');
  for (const raw of item.answers ?? []) {
    const a = canonSpoken(raw);
    if (!a) continue;
    if (fuzzyEq(a, t)) return true;
    const aWords = a.split(' ');
    // whole-word-run containment
    for (let i = 0; i + aWords.length <= tWords.length; i++) {
      if (aWords.every((w, k) => w === tWords[i + k])) return true;
    }
  }
  return false;
}
