import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY, HISTORY_DAYS, emptyStore, normalizeStore, advanceStreak, trimHistory,
  setWordProgress, wordDay, recordQuiz, quizDay, liveStreak, loadGame, saveGame,
} from './gameStore';

const D1 = '2026-09-20';
const D2 = '2026-09-21';
const D4 = '2026-09-23';

describe('normalizeStore', () => {
  it('fills in a missing or damaged store', () => {
    expect(normalizeStore(null)).toEqual(emptyStore());
    expect(normalizeStore('nonsense')).toEqual(emptyStore());
    expect(normalizeStore({ word: {} }).quiz.stats.played).toBe(0);
  });

  it('keeps what a real store already holds', () => {
    const s = normalizeStore({ word: { days: { [D1]: { guesses: ['luce'], status: 'won' } } } });
    expect(s.word.days[D1].status).toBe('won');
  });
});

describe('advanceStreak', () => {
  it('extends on consecutive days and never twice on one day', () => {
    let stats = advanceStreak({ streak: 0, best: 0, last: null }, D1);
    expect(stats.streak).toBe(1);
    stats = advanceStreak(stats, D1);
    expect(stats.streak).toBe(1);
    stats = advanceStreak(stats, D2);
    expect(stats.streak).toBe(2);
    expect(stats.best).toBe(2);
  });

  it('restarts after a missed day but keeps the best', () => {
    let stats = advanceStreak({ streak: 0, best: 0, last: null }, D1);
    stats = advanceStreak(stats, D2);
    stats = advanceStreak(stats, D4); // skipped D3
    expect(stats.streak).toBe(1);
    expect(stats.best).toBe(2);
  });
});

describe('setWordProgress', () => {
  it('remembers a half-played grid without counting it', () => {
    const s = setWordProgress(emptyStore(), D1, ['cena'], 'playing');
    expect(wordDay(s, D1)).toEqual({ guesses: ['cena'], status: 'playing' });
    expect(s.word.stats.played).toBe(0);
    expect(s.word.stats.streak).toBe(0);
  });

  it('counts a win once, with the row it landed on', () => {
    let s = setWordProgress(emptyStore(), D1, ['cena'], 'playing');
    s = setWordProgress(s, D1, ['cena', 'luce'], 'won');
    expect(s.word.stats).toMatchObject({ played: 1, won: 1, streak: 1, best: 1 });
    expect(s.word.stats.dist).toEqual({ 2: 1 });
  });

  it('cannot be farmed by replaying the same day', () => {
    let s = setWordProgress(emptyStore(), D1, ['luce'], 'won');
    s = setWordProgress(s, D1, ['luce'], 'won');
    s = setWordProgress(s, D1, ['cena', 'luce'], 'won');
    expect(s.word.stats.played).toBe(1);
    expect(s.word.stats.won).toBe(1);
    expect(s.word.stats.dist).toEqual({ 1: 1 });
  });

  it('counts a loss as played but not won', () => {
    const s = setWordProgress(emptyStore(), D1, new Array(6).fill('cena'), 'lost');
    expect(s.word.stats).toMatchObject({ played: 1, won: 0, streak: 1 });
    expect(s.word.stats.dist).toEqual({});
  });

  it('builds a streak across days', () => {
    let s = setWordProgress(emptyStore(), D1, ['luce'], 'won');
    s = setWordProgress(s, D2, ['luce'], 'lost');
    expect(s.word.stats.streak).toBe(2);
    expect(s.word.stats.played).toBe(2);
  });
});

describe('recordQuiz', () => {
  it('records the round and counts it once', () => {
    let s = recordQuiz(emptyStore(), D1, 7, 10);
    expect(quizDay(s, D1)).toMatchObject({ score: 7, total: 10, plays: 1 });
    expect(s.quiz.stats).toMatchObject({ played: 1, streak: 1, correct: 7, asked: 10 });

    s = recordQuiz(s, D1, 9, 10); // a replay
    expect(quizDay(s, D1)).toMatchObject({ score: 9, plays: 2 });
    expect(s.quiz.stats).toMatchObject({ played: 1, correct: 7, asked: 10 });
  });

  it('keeps the day\'s best score, not the latest', () => {
    let s = recordQuiz(emptyStore(), D1, 9, 10);
    s = recordQuiz(s, D1, 2, 10);
    expect(quizDay(s, D1).score).toBe(9);
  });

  it('counts a clean sweep as a win', () => {
    const s = recordQuiz(emptyStore(), D1, 10, 10);
    expect(s.quiz.stats.won).toBe(1);
  });
});

describe('liveStreak', () => {
  it('shows a run that reaches today or yesterday', () => {
    const s = setWordProgress(emptyStore(), D1, ['luce'], 'won');
    expect(liveStreak(s.word.stats, D1)).toBe(1);
    expect(liveStreak(s.word.stats, D2)).toBe(1);
  });

  it('is broken once a day is missed', () => {
    const s = setWordProgress(emptyStore(), D1, ['luce'], 'won');
    expect(liveStreak(s.word.stats, D4)).toBe(0);
    expect(liveStreak(null, D1)).toBe(0);
  });
});

describe('trimHistory', () => {
  it('keeps the newest days only', () => {
    let s = emptyStore();
    const days = {};
    for (let i = 0; i < HISTORY_DAYS + 20; i++) {
      const d = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
      days[d] = { guesses: [], status: 'won' };
    }
    s = trimHistory({ ...s, word: { ...s.word, days } });
    const kept = Object.keys(s.word.days);
    expect(kept).toHaveLength(HISTORY_DAYS);
    expect(kept[kept.length - 1]).toBe(Object.keys(days).sort().pop());
  });
});

describe('storage wrappers', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through localStorage', () => {
    saveGame(setWordProgress(emptyStore(), D1, ['luce'], 'won'));
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadGame().word.days[D1].status).toBe('won');
  });

  it('returns an empty store when nothing is saved or the value is corrupt', () => {
    expect(loadGame()).toEqual(emptyStore());
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadGame()).toEqual(emptyStore());
  });
});
