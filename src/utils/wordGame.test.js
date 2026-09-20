import { describe, it, expect } from 'vitest';
import {
  MAX_GUESSES, MIN_LEN, MAX_LEN,
  fold, buildWordPool, getWordPool, getDailyWord, isKnownWord,
  scoreGuess, keyboardStates, gameStatus, shareGrid,
} from './wordGame';

const fakePhases = [{
  id: 'p1',
  weeks: [{
    n: 1, r: 'John 1', vocab: [
      ['la luce', 'the light', 'La luce splende', '/x/'],
      ['le tenebre', 'the darkness', 'le tenebre', '/x/'],
      ['il Verbo', 'the Word', 'In principio era il Verbo', '/x/'],
      ['lo Spirito Santo', 'the Holy Spirit', 'lo Spirito Santo', '/x/'], // two words
      ['il re', 'the king', 'il re', '/x/'],                              // too short
      ['la misericordia', 'mercy', 'la misericordia', '/x/'],             // too long
      ["l'uomo", 'the man', "l'uomo", '/x/'],                             // elided article
      ['dell-alto', 'from on high', 'dall alto', '/x/'],                   // hyphen
      ['la luce', 'the light (again)', 'duplicate', '/x/'],               // duplicate
    ],
  }],
}];

describe('fold', () => {
  it('reduces a word to the bare alphabet the grid is played in', () => {
    expect(fold('perché')).toBe('perche');
    expect(fold('Più')).toBe('piu');
    expect(fold("l'uomo")).toBe('luomo');
    expect(fold('  LUCE ')).toBe('luce');
  });
});

describe('buildWordPool', () => {
  const pool = buildWordPool(fakePhases);

  it('strips the article and keeps one entry per word', () => {
    // "l'uomo" survives: the elided article is stripped like any other.
    expect(pool.map((p) => p.word)).toEqual(['luce', 'tenebre', 'verbo', 'uomo']);
  });

  it('carries the reveal data with each word', () => {
    expect(pool[0]).toMatchObject({ word: 'luce', term: 'la luce', en: 'the light', weekN: 1 });
  });

  it('accepts only playable single words', () => {
    // multi-word, too short, too long and hyphenated entries are all gone
    expect(pool.some((p) => /spirito|^re$|misericordia|dell/.test(p.word))).toBe(false);
  });
});

describe('the course pool', () => {
  const pool = getWordPool();

  it('is big enough for a long rotation', () => {
    expect(pool.length).toBeGreaterThan(80);
  });

  it('only contains playable words with a gloss', () => {
    for (const entry of pool) {
      expect(entry.word).toMatch(/^[a-z]+$/);
      expect(entry.word.length).toBeGreaterThanOrEqual(MIN_LEN);
      expect(entry.word.length).toBeLessThanOrEqual(MAX_LEN);
      expect(entry.en).toBeTruthy();
      expect(entry.term).toBeTruthy();
    }
  });

  it('has no duplicate answers', () => {
    const words = pool.map((p) => p.word);
    expect(new Set(words).size).toBe(words.length);
  });
});

describe('getDailyWord', () => {
  it('is the same word all day and a different one tomorrow', () => {
    expect(getDailyWord('2026-09-20')).toEqual(getDailyWord('2026-09-20'));
    expect(getDailyWord('2026-09-20').word).not.toBe(getDailyWord('2026-09-21').word);
  });

  it('never repeats inside one pass of the pool', () => {
    const pool = getWordPool();
    const seen = new Set();
    // Start on a cycle boundary — that is the window the rotation guarantees.
    const firstDay = Math.ceil(20716 / pool.length) * pool.length;
    for (let i = 0; i < pool.length; i++) {
      const d = new Date((firstDay + i) * 86400000).toISOString().slice(0, 10);
      seen.add(getDailyWord(d).word);
    }
    expect(seen.size).toBe(pool.length);
  });
});

describe('scoreGuess', () => {
  it('marks an exact guess correct throughout', () => {
    expect(scoreGuess('luce', 'luce')).toEqual(['correct', 'correct', 'correct', 'correct']);
  });

  it('separates right-place from wrong-place letters', () => {
    // answer l-u-c-e, guess c-e-n-a
    expect(scoreGuess('cena', 'luce')).toEqual(['present', 'present', 'absent', 'absent']);
  });

  it('does not double-count a letter the answer only has once', () => {
    // 'luce' has one l: the second and third l of 'lull' get nothing
    expect(scoreGuess('lull', 'luce')).toEqual(['correct', 'correct', 'absent', 'absent']);
  });

  it('spends greens before yellows on a repeated letter', () => {
    // answer n-o-t-t-e, guess t-e-t-t-o
    expect(scoreGuess('tetto', 'notte')).toEqual(['absent', 'present', 'correct', 'correct', 'present']);
  });

  it('folds accents on both sides', () => {
    expect(scoreGuess('perché', 'perche')).toEqual(new Array(6).fill('correct'));
  });
});

describe('keyboardStates', () => {
  it('keeps the best state seen for each letter', () => {
    // 'cena': c is present (wrong place). 'luce': c is correct — it must not
    // fall back to yellow.
    const states = keyboardStates(['cena', 'luce'], 'luce');
    expect(states.c).toBe('correct');
    expect(states.n).toBe('absent');
    expect(states.u).toBe('correct');
  });

  it('is empty before the first guess', () => {
    expect(keyboardStates([], 'luce')).toEqual({});
  });
});

describe('gameStatus', () => {
  it('is playing until the answer or the last row', () => {
    expect(gameStatus([], 'luce')).toBe('playing');
    expect(gameStatus(['cena'], 'luce')).toBe('playing');
  });

  it('is won on a match at any row', () => {
    expect(gameStatus(['cena', 'luce'], 'luce')).toBe('won');
  });

  it('is lost once the rows run out', () => {
    expect(gameStatus(new Array(MAX_GUESSES).fill('cena'), 'luce')).toBe('lost');
  });
});

describe('shareGrid', () => {
  it('renders the score line and one emoji row per guess', () => {
    const text = shareGrid(['cena', 'luce'], 'luce', { date: '2026-09-20' });
    expect(text.split('\n')).toEqual([
      `Parola 2026-09-20 2/${MAX_GUESSES}`,
      '🟨🟨⬜⬜',
      '🟩🟩🟩🟩',
    ]);
  });

  it('marks a loss with X', () => {
    const guesses = new Array(MAX_GUESSES).fill('cena');
    expect(shareGrid(guesses, 'luce', { date: '2026-09-20' })).toContain(`X/${MAX_GUESSES}`);
  });

  it('never leaks the answer', () => {
    expect(shareGrid(['cena', 'luce'], 'luce', { date: '2026-09-20' })).not.toMatch(/luce/i);
  });
});

describe('isKnownWord', () => {
  it('accepts course vocabulary and common Italian words', () => {
    expect(isKnownWord('luce')).toBe(true);
    expect(isKnownWord('LUCE')).toBe(true);
    expect(isKnownWord('perché')).toBe(true);
  });

  it('rejects letter soup', () => {
    expect(isKnownWord('xqzk')).toBe(false);
  });

  it('knows every answer it can serve', () => {
    for (const entry of getWordPool()) expect(isKnownWord(entry.word)).toBe(true);
  });
});
