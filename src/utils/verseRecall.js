// Progressive verse memorization: show the verse, blank a word, then a few, then
// most, then all of it. The blanks only ever grow, so what was recalled at one stage
// is asked for again at the next. The order is seeded from the verse text, so a verse
// always fades the same way and the Swift port can be pinned to it by fixture. Pure.

import { checkAnswer } from './answer';
import { canonSpoken } from './spokenAnswer';

const WORD_CORE = /^([^\p{L}]*)(.*?)([^\p{L}]*)$/su;

// Each whitespace token split into its surrounding punctuation and the word itself.
export function verseTokens(text) {
  return String(text ?? '').trim().split(/\s+/).filter(Boolean).map((tok) => {
    const [, pre, word, post] = WORD_CORE.exec(tok);
    return { pre, word, post };
  });
}

// A 32-bit multiplicative hash and LCG, used instead of Math.random so the fade
// order is reproducible.
function seedOf(text) {
  let h = 17;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) >>> 0;
  return h;
}

function seededShuffle(items, seed) {
  const out = [...items];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Token indexes in the order they disappear: content words first, because a blanked
// "il" tests almost nothing, then the short words.
export function fadeOrder(text) {
  const tokens = verseTokens(text);
  const indexes = tokens.map((t, i) => (t.word ? i : -1)).filter((i) => i >= 0);
  const long = indexes.filter((i) => canonSpoken(tokens[i].word).length >= 4);
  const short = indexes.filter((i) => canonSpoken(tokens[i].word).length < 4);
  const seed = seedOf(text);
  return [...seededShuffle(long, seed), ...seededShuffle(short, seed)];
}

// Blank counts per stage: 1, 3, about 60%, then everything, without repeats.
export function stageSizes(wordCount) {
  if (wordCount <= 0) return [];
  const sizes = [1, 3, Math.ceil(wordCount * 0.6), wordCount];
  const out = [];
  for (const raw of sizes) {
    const size = Math.min(raw, wordCount);
    if (size > (out.at(-1) ?? 0)) out.push(size);
  }
  return out;
}

// One verse at one stage, as parts to render: { pre, word, post, blank }.
export function stageParts(text, stage) {
  const tokens = verseTokens(text);
  const order = fadeOrder(text);
  const sizes = stageSizes(order.length);
  const size = sizes[Math.min(stage, sizes.length - 1)] ?? 0;
  const blanks = new Set(order.slice(0, size));
  return tokens.map((t, i) => ({ ...t, blank: blanks.has(i) }));
}

export function stageCount(text) {
  return stageSizes(fadeOrder(text).length).length;
}

// Very short words get no typo tolerance: one edit turns "la" into "le" or "il" into
// "al", and those differences are exactly what memorizing the verse should catch.
export function wordMatches(expected, given) {
  const e = canonSpoken(expected);
  const g = canonSpoken(given);
  if (!g) return false;
  return e.length <= 3 ? e === g : checkAnswer(expected, given);
}

// Grades the answers for one stage's blanks, in the order they appear in the verse.
export function checkStage(parts, answers) {
  const blanks = parts.filter((p) => p.blank);
  const results = blanks.map((p, i) => wordMatches(p.word, answers[i] ?? ''));
  return { results, wrong: results.filter((ok) => !ok).length, total: results.length };
}

// Review stage grows with how well the verse is already known.
export function stageForReps(reps, count) {
  return Math.min(reps ?? 0, Math.max(count - 1, 0));
}

export function gradeResult({ wrong, total }) {
  if (wrong === 0) return 'good';
  return wrong * 2 <= total ? 'hard' : 'again';
}
