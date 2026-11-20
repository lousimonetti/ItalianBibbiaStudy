// Bambini: pure logic for the children's corner. Rounds for the listening game,
// the memory board and its flip rules, the sticker album store, and the prayer
// lookup. No React here; the component passes an `rng` so tests are exact.
//
// Nothing in this corner reaches the vocabulary SRS, the study streak or the
// course progress. A child tapping a lion is not evidence that the parent
// knows the word, and letting it count would make the parent's reviews lie.

import { storageKey } from './storageKey';
import { shuffled } from './gameRandom';

export const KIDS_KEY = storageKey('kids');

// How long the parent must hold the exit button to leave full-screen mode. Long
// enough that a small child tapping around does not leave by accident.
export const HOLD_MS = 1500;

// Praise for a right answer. All of these are the same for a boy or a girl
// (bravo/brava would need to know which).
export const CHEERS = ['Evviva!', 'Esatto!', 'Ottimo!', 'Perfetto!', 'Che bello!', 'Sì!'];
export const TRY_AGAIN = 'Riprova!';

export function cheer(n) {
  return CHEERS[((n % CHEERS.length) + CHEERS.length) % CHEERS.length];
}

// Every word in the corner, tagged with the theme it belongs to.
export function allWords(kids) {
  if (!kids?.themes) return [];
  return kids.themes.flatMap((t) => t.words.map((w) => ({ ...w, theme: t.id })));
}

// The prayers to say along with, in the order the course lists them, skipping
// any id the course does not ship or that has no line-by-line text.
export function kidPrayers(kids, sections) {
  const byId = new Map();
  for (const s of sections || []) for (const p of s.prayers || []) byId.set(p.id, p);
  return (kids?.prayers || [])
    .map((id) => byId.get(id))
    .filter((p) => p && Array.isArray(p.lines) && p.lines.length > 0);
}

// ── Ascolta e trova (listen and find) ───────────────────────────────────────

// A round of questions: each names one word aloud and shows `options` pictures.
// Every question has a different answer, and the right picture's position is
// shuffled, so a child cannot learn "always the middle one".
export function listenRound(words, rng, { questions = 6, options = 3 } = {}) {
  const pool = words || [];
  if (pool.length < 2) return [];
  const n = Math.min(questions, pool.length);
  const k = Math.min(options, pool.length);
  return shuffled(pool, rng).slice(0, n).map((answer) => {
    const others = shuffled(pool.filter((w) => w.it !== answer.it), rng).slice(0, k - 1);
    return { answer, options: shuffled([answer, ...others], rng) };
  });
}

// ── Trova le coppie (memory) ────────────────────────────────────────────────

// A board of `pairs` words, each twice, face down.
export function memoryBoard(words, rng, pairs = 4) {
  const chosen = shuffled(words || [], rng).slice(0, pairs);
  const cards = shuffled(
    chosen.flatMap((w) => [
      { key: `${w.it}#a`, word: w },
      { key: `${w.it}#b`, word: w },
    ]),
    rng,
  );
  return { cards, open: [], matched: [], moves: 0 };
}

// Turn card `i`. Returns the new board and what happened:
//   'ignored' a tap that does nothing (card already up, or two wrong cards are
//             still showing and waiting to turn back)
//   'open'    the first card of a pair is up
//   'match'   the second card matched the first; both stay up
//   'miss'    the second card did not match; call closeMiss() after a pause
export function flipCard(board, i) {
  const card = board.cards[i];
  if (!card || board.open.length >= 2 || board.open.includes(i) || board.matched.includes(card.word.it)) {
    return { board, event: 'ignored' };
  }
  if (board.open.length === 0) {
    return { board: { ...board, open: [i] }, event: 'open' };
  }
  const first = board.cards[board.open[0]];
  const moves = board.moves + 1;
  if (first.word.it === card.word.it) {
    return { board: { ...board, open: [], matched: [...board.matched, card.word.it], moves }, event: 'match' };
  }
  return { board: { ...board, open: [board.open[0], i], moves }, event: 'miss' };
}

export function closeMiss(board) {
  return board.open.length === 2 ? { ...board, open: [] } : board;
}

export function isFaceUp(board, i) {
  return board.open.includes(i) || board.matched.includes(board.cards[i]?.word.it);
}

export function boardDone(board) {
  return board.cards.length > 0 && board.matched.length * 2 === board.cards.length;
}

// ── Album (stickers) ────────────────────────────────────────────────────────

// { found: { [it]: true }, stars, locked }. `found` is the sticker album: a word
// becomes a sticker the first time the child picks it by ear or matches its
// pair. `locked` remembers full-screen mode across a reload, so a child cannot
// get out of it by refreshing the page.
export function emptyKids() {
  return { found: {}, stars: 0, locked: false };
}

export function normalizeKids(raw) {
  if (!raw || typeof raw !== 'object') return emptyKids();
  return {
    found: raw.found && typeof raw.found === 'object' ? { ...raw.found } : {},
    stars: Number.isFinite(raw.stars) && raw.stars > 0 ? Math.floor(raw.stars) : 0,
    locked: raw.locked === true,
  };
}

export function markFound(store, its) {
  const s = normalizeKids(store);
  for (const it of its || []) s.found[it] = true;
  return s;
}

export function addStars(store, n) {
  const s = normalizeKids(store);
  s.stars += Math.max(0, Math.floor(n || 0));
  return s;
}

export function setLocked(store, locked) {
  return { ...normalizeKids(store), locked: !!locked };
}

export function foundCount(store, words) {
  const found = normalizeKids(store).found;
  return (words || []).filter((w) => found[w.it]).length;
}

export function loadKids() {
  try {
    return normalizeKids(JSON.parse(localStorage.getItem(KIDS_KEY)));
  } catch {
    return emptyKids();
  }
}

export function saveKids(store) {
  try {
    localStorage.setItem(KIDS_KEY, JSON.stringify(normalizeKids(store)));
  } catch {
    // storage unavailable: the game still plays, the album is not kept
  }
  return store;
}
