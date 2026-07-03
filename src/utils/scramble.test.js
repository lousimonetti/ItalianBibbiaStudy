import { describe, it, expect } from 'vitest';
import {
  scrambleTokens,
  isScrambleEligible,
  shuffleScramble,
  sameOrder,
  MIN_WORDS,
  MAX_WORDS,
} from './scramble.js';

describe('scrambleTokens', () => {
  it('splits on whitespace keeping punctuation and apostrophes attached', () => {
    expect(scrambleTokens('E il Verbo si fece carne.')).toEqual([
      'E', 'il', 'Verbo', 'si', 'fece', 'carne.',
    ]);
    expect(scrambleTokens("l'uomo vide  la luce")).toEqual([
      "l'uomo", 'vide', 'la', 'luce',
    ]);
  });

  it('returns [] for empty/missing input', () => {
    expect(scrambleTokens('')).toEqual([]);
    expect(scrambleTokens(undefined)).toEqual([]);
    expect(scrambleTokens('   ')).toEqual([]);
  });
});

describe('isScrambleEligible', () => {
  it('accepts sentences within the word-count window', () => {
    expect(isScrambleEligible({ ex: 'In principio era il Verbo' })).toBe(true);
  });

  it('rejects too-short and too-long examples', () => {
    expect(isScrambleEligible({ ex: 'la luce splende' })).toBe(false); // 3 < MIN
    const long = Array.from({ length: MAX_WORDS + 1 }, (_, i) => `w${i}`).join(' ');
    expect(isScrambleEligible({ ex: long })).toBe(false);
    expect(isScrambleEligible({})).toBe(false);
    expect(isScrambleEligible({ ex: '' })).toBe(false);
  });

  it('bounds are sane', () => {
    expect(MIN_WORDS).toBeGreaterThanOrEqual(3);
    expect(MAX_WORDS).toBeGreaterThan(MIN_WORDS);
  });
});

describe('shuffleScramble', () => {
  const tokens = ['In', 'principio', 'era', 'il', 'Verbo'];

  it('preserves the multiset of tokens', () => {
    const out = shuffleScramble(tokens);
    expect([...out].sort()).toEqual([...tokens].sort());
  });

  it('never returns the original order when tokens differ (identity shuffle nudged)', () => {
    // rand() → 1-ε keeps Fisher-Yates a no-op, forcing the nudge path.
    const out = shuffleScramble(tokens, () => 0.9999999);
    expect(sameOrder(tokens, out)).toBe(false);
    expect([...out].sort()).toEqual([...tokens].sort());
  });

  it('differs from the original across random runs', () => {
    for (let i = 0; i < 25; i++) {
      expect(sameOrder(tokens, shuffleScramble(tokens))).toBe(false);
    }
  });

  it('leaves all-identical tokens alone (no infinite nudge)', () => {
    const same = ['la', 'la', 'la'];
    expect(shuffleScramble(same)).toEqual(same);
  });

  it('does not mutate its input', () => {
    const copy = [...tokens];
    shuffleScramble(tokens, () => 0.5);
    expect(tokens).toEqual(copy);
  });
});

describe('sameOrder', () => {
  it('exact sequence matches', () => {
    expect(sameOrder(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(sameOrder(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(sameOrder(['a', 'b'], ['a'])).toBe(false);
  });

  it('duplicate words are interchangeable by value', () => {
    // "di padre in padre": either 'padre' chip may fill either slot.
    expect(sameOrder(['di', 'padre', 'in', 'padre'], ['di', 'padre', 'in', 'padre'])).toBe(true);
  });
});
