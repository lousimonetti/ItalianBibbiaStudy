// "Parola del giorno" — the daily word game (Wordle, played in Italian on the
// course's own vocabulary).
//
// Two decisions worth stating, because they shape everything below.
//
// 1. THE ANSWER ALWAYS COMES FROM THE COURSE. Guessing a random Italian word
//    teaches nothing; guessing `tenebre` and then being shown its gloss, its IPA
//    and the verse it comes from is a vocabulary re-encounter dressed as a game.
//    So the pool is the vocab list, and the end of a round is a reveal card.
//
// 2. THE GRID IS PLAYED IN BARE a–z. Italian words carry accents (perché, più)
//    and the course writes headwords with their article ("il Verbo"). Neither
//    belongs on a letter grid, so words are folded to unaccented letters for
//    play and the real spelling is shown on the reveal.
//
// Pure module: no storage, no clock. The caller passes the date.

import { PHASES } from '../data/studyData';
import { parseVocab } from '../../course/vocab';
import { devotionSections } from '../../course/devotions';
import { normalize } from './pronunciation';
import { LEADING_ARTICLE } from './locale';
import { commonWordsData } from './it2en';
import { rotatingPick } from './gameRandom';

export const MAX_GUESSES = 6;
export const MIN_LEN = 4;
export const MAX_LEN = 8;

// Fold any string to the bare alphabet the grid is played in.
export function fold(word) {
  return normalize(String(word ?? '')).replace(/[^a-z]/g, '');
}

// The headword without its article: "il Verbo" → "verbo", accents folded away.
function stem(term) {
  return normalize(String(term ?? '')).replace(LEADING_ARTICLE, '').trim();
}

// ── the answer pool ─────────────────────────────────────────────────────────

// Every single-word vocab headword of playable length, in course order (so the
// first week's words are the first entries and the rotation is stable across
// builds). Multi-word terms and anything that isn't plain letters after folding
// are skipped: the grid cannot show a space or an apostrophe.
export function buildWordPool(phases = PHASES) {
  const seen = new Set();
  const pool = [];
  for (const phase of phases) {
    for (const week of phase.weeks) {
      for (const tuple of week.vocab) {
        const v = parseVocab(tuple);
        const bare = stem(v.it);
        if (!bare || /\s/.test(bare)) continue;
        const word = fold(bare);
        if (word !== bare) continue; // had an apostrophe or a hyphen
        if (word.length < MIN_LEN || word.length > MAX_LEN) continue;
        if (seen.has(word)) continue;
        seen.add(word);
        pool.push({
          word,
          term: v.it,
          en: v.en,
          ipa: v.ipa,
          ex: v.ex,
          exEn: v.exEn,
          weekN: week.n,
          reading: week.r,
        });
      }
    }
  }
  return pool;
}

let POOL = null;
export function getWordPool() {
  if (!POOL) POOL = buildWordPool();
  return POOL;
}

export function getDailyWord(dateStr, pool = getWordPool()) {
  return rotatingPick(pool, dateStr, 'parola');
}

// ── the guess dictionary ────────────────────────────────────────────────────

// Which guesses count as real words. The course is the dictionary: its
// vocabulary and inflected forms, every example sentence, every authored verse,
// the drills, the prayers, plus the ~2,800-entry common-word gloss map that
// already ships for tap-to-translate. It is not a full Italian lexicon, which is
// why a rejected guess is a warning the player can override rather than a wall
// (see `WordGame`), and why that message says *this course's* word list.
export function buildDictionary(phases = PHASES, sections = devotionSections) {
  const dict = new Set();
  const add = (text) => {
    for (const raw of String(text ?? '').split(/[^A-Za-zÀ-ÿ]+/)) {
      const w = fold(raw);
      if (w.length >= MIN_LEN && w.length <= MAX_LEN) dict.add(w);
    }
  };

  for (const phase of phases) {
    for (const week of phase.weeks) {
      for (const tuple of week.vocab) {
        const v = parseVocab(tuple);
        add(stem(v.it));
        add(v.form);
        add(v.ex);
      }
      if (week.prompt) add(week.prompt.it);
      if (week.passage) for (const verse of week.passage.verses) add(verse.t);
      for (const d of week.drill || []) { add(d.q); add(d.a); }
      for (const c of week.comprehension || []) add(c.it);
      for (const p of week.phrases || []) add(p.it);
      for (const t of week.transform || []) { add(t.base); add(t.answer); }
    }
  }

  for (const section of sections || []) {
    for (const prayer of section.prayers || []) add(prayer.it);
  }

  const { words } = commonWordsData();
  for (const key of Object.keys(words)) add(key);

  return dict;
}

let DICT = null;
export function getDictionary() {
  if (!DICT) DICT = buildDictionary();
  return DICT;
}

export function isKnownWord(word) {
  return getDictionary().has(fold(word));
}

// ── play ────────────────────────────────────────────────────────────────────

// Mark each letter of a guess: 'correct' (right letter, right place),
// 'present' (right letter, wrong place) or 'absent'. Two passes, because a
// letter already matched in place must not also be counted as present
// elsewhere — that is the rule everyone gets wrong on doubled letters:
// guessing "sasso" against "salse" gives the second `s` its green and leaves
// only one `s` in the pool for the rest of the row.
export function scoreGuess(guess, answer) {
  const g = fold(guess);
  const a = fold(answer);
  const marks = new Array(g.length).fill('absent');
  const left = new Map();

  for (let i = 0; i < g.length; i++) {
    if (i < a.length && g[i] === a[i]) marks[i] = 'correct';
  }
  for (let i = 0; i < a.length; i++) {
    if (i < g.length && g[i] === a[i]) continue;
    left.set(a[i], (left.get(a[i]) || 0) + 1);
  }
  for (let i = 0; i < g.length; i++) {
    if (marks[i] === 'correct') continue;
    const n = left.get(g[i]) || 0;
    if (n > 0) {
      marks[i] = 'present';
      left.set(g[i], n - 1);
    }
  }
  return marks;
}

const RANK = { absent: 0, present: 1, correct: 2 };

// Best-known state per letter, for colouring the on-screen keyboard. A letter
// only ever improves: once green it stays green.
export function keyboardStates(guesses, answer) {
  const states = {};
  for (const guess of guesses || []) {
    const g = fold(guess);
    const marks = scoreGuess(g, answer);
    for (let i = 0; i < g.length; i++) {
      const ch = g[i];
      if (!states[ch] || RANK[marks[i]] > RANK[states[ch]]) states[ch] = marks[i];
    }
  }
  return states;
}

export function gameStatus(guesses, answer) {
  const a = fold(answer);
  if ((guesses || []).some((g) => fold(g) === a)) return 'won';
  return (guesses || []).length >= MAX_GUESSES ? 'lost' : 'playing';
}

const EMOJI = { correct: '🟩', present: '🟨', absent: '⬜' };

// The spoiler-free grid people paste into a chat.
export function shareGrid(guesses, answer, { date = '', title = 'Parola' } = {}) {
  const status = gameStatus(guesses, answer);
  const score = status === 'won' ? guesses.length : 'X';
  const head = [title, date, `${score}/${MAX_GUESSES}`].filter(Boolean).join(' ');
  const rows = (guesses || []).map((g) => scoreGuess(g, answer).map((m) => EMOJI[m]).join(''));
  return [head, ...rows].join('\n');
}
