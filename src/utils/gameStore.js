// Persistence for the daily games (localStorage `<prefix>-game`).
//
// Same split as the rest of the app: pure reducers here, thin storage wrappers
// at the bottom. The key is namespaced through `storageKey`, so it rides along
// in the sync snapshot (which collects every `<prefix>-*` key) and a fork gets
// its own.
//
// Two rules the reducers enforce, because a game that can be farmed is not a
// streak:
//   • a day counts once — replaying never re-counts as played, and the day's
//     recorded result is the first finish of that day;
//   • the game streak follows the same day-before rule as the study streak.

import { storageKey } from './storageKey';
import { todayStr, dayBefore } from './streak';

export const STORAGE_KEY = storageKey('game');

// How many days of results to keep. Enough for a history strip, small enough
// that the sync snapshot stays QR-sized.
export const HISTORY_DAYS = 60;

const emptyStats = () => ({ played: 0, won: 0, streak: 0, best: 0, last: null });

export function emptyStore() {
  return {
    version: 1,
    word: { days: {}, stats: { ...emptyStats(), dist: {} } },
    quiz: { days: {}, stats: { ...emptyStats(), correct: 0, asked: 0 } },
  };
}

export function normalizeStore(raw) {
  const base = emptyStore();
  if (!raw || typeof raw !== 'object') return base;
  return {
    version: 1,
    word: {
      days: { ...(raw.word?.days || {}) },
      stats: { ...base.word.stats, ...(raw.word?.stats || {}), dist: { ...(raw.word?.stats?.dist || {}) } },
    },
    quiz: {
      days: { ...(raw.quiz?.days || {}) },
      stats: { ...base.quiz.stats, ...(raw.quiz?.stats || {}) },
    },
  };
}

// Pure: advance a per-game day streak. Identical shape to the study streak —
// same day is a no-op, yesterday extends, anything older restarts at 1.
export function advanceStreak(stats, date) {
  const s = { ...stats };
  if (s.last === date) return s;
  s.streak = s.last === dayBefore(date) ? (s.streak || 0) + 1 : 1;
  s.best = Math.max(s.best || 0, s.streak);
  s.last = date;
  return s;
}

// Keep only the newest HISTORY_DAYS entries of each day map.
export function trimHistory(store) {
  const trim = (days) => {
    const keys = Object.keys(days).sort();
    if (keys.length <= HISTORY_DAYS) return days;
    return Object.fromEntries(keys.slice(-HISTORY_DAYS).map((k) => [k, days[k]]));
  };
  return {
    ...store,
    word: { ...store.word, days: trim(store.word.days) },
    quiz: { ...store.quiz, days: trim(store.quiz.days) },
  };
}

// ── word game ───────────────────────────────────────────────────────────────

export function wordDay(store, date) {
  return normalizeStore(store).word.days[date] || null;
}

// Pure: save the row-by-row state of today's word game, and — the first time it
// finishes — fold it into the stats. `status` is 'playing' | 'won' | 'lost'.
export function setWordProgress(store, date, guesses, status) {
  const s = normalizeStore(store);
  const prev = s.word.days[date];
  const alreadyDone = prev && prev.status !== 'playing';
  s.word.days = { ...s.word.days, [date]: { guesses: [...guesses], status } };

  if (!alreadyDone && status !== 'playing') {
    const stats = advanceStreak(s.word.stats, date);
    stats.played = (stats.played || 0) + 1;
    if (status === 'won') {
      stats.won = (stats.won || 0) + 1;
      const n = guesses.length;
      stats.dist = { ...stats.dist, [n]: (stats.dist?.[n] || 0) + 1 };
    }
    s.word.stats = stats;
  }
  return trimHistory(s);
}

// ── quiz ────────────────────────────────────────────────────────────────────

export function quizDay(store, date) {
  return normalizeStore(store).quiz.days[date] || null;
}

// Pure: record a finished round. Only the first round of the day counts toward
// played/streak; a replay can still raise the day's best score.
export function recordQuiz(store, date, score, total) {
  const s = normalizeStore(store);
  const prev = s.quiz.days[date];
  s.quiz.days = {
    ...s.quiz.days,
    [date]: { score: Math.max(score, prev?.score ?? 0), total, plays: (prev?.plays || 0) + 1 },
  };

  if (!prev) {
    const stats = advanceStreak(s.quiz.stats, date);
    stats.played = (stats.played || 0) + 1;
    if (total > 0 && score === total) stats.won = (stats.won || 0) + 1;
    stats.correct = (stats.correct || 0) + score;
    stats.asked = (stats.asked || 0) + total;
    s.quiz.stats = stats;
  }
  return trimHistory(s);
}

// Pure: the streak honouring a gap — a run that ended before yesterday is over.
export function liveStreak(stats, today = todayStr()) {
  if (!stats || !stats.last) return 0;
  return stats.last === today || stats.last === dayBefore(today) ? stats.streak || 0 : 0;
}

// ── storage wrappers ────────────────────────────────────────────────────────

export function loadGame() {
  try {
    return normalizeStore(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return emptyStore();
  }
}

export function saveGame(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable — the round still plays, it just isn't remembered
  }
  return store;
}
