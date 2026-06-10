import { describe, it, expect } from 'vitest';
import { normalize, levenshtein, scorePronunciation } from './pronunciation.js';

describe('normalize', () => {
  it('lowercases input', () => {
    expect(normalize('CIAO')).toBe('ciao');
  });

  it('trims surrounding whitespace', () => {
    expect(normalize('  ciao  ')).toBe('ciao');
  });

  it('strips accents from Italian vowels', () => {
    expect(normalize('città')).toBe('citta');
    expect(normalize('Gesù')).toBe('gesu');
    expect(normalize('è')).toBe('e');
    expect(normalize('é')).toBe('e');
    expect(normalize('à')).toBe('a');
    expect(normalize('ò')).toBe('o');
  });

  it('returns empty string unchanged', () => {
    expect(normalize('')).toBe('');
  });

  it('handles mixed case and accents together', () => {
    expect(normalize('Città')).toBe('citta');
  });
});

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('ciao', 'ciao')).toBe(0);
  });

  it('returns 0 for two empty strings', () => {
    expect(levenshtein('', '')).toBe(0);
  });

  it('returns length of string when other is empty', () => {
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('returns 1 for a single substitution', () => {
    expect(levenshtein('ciao', 'miao')).toBe(1);
  });

  it('returns 1 for a single insertion', () => {
    expect(levenshtein('abc', 'abcd')).toBe(1);
  });

  it('returns 1 for a single deletion', () => {
    expect(levenshtein('abcd', 'abc')).toBe(1);
  });

  it('handles the classic kitten/sitting example', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('is not necessarily symmetric (order matters for distances)', () => {
    // Levenshtein IS symmetric — both directions should equal
    expect(levenshtein('abc', 'xyz')).toBe(levenshtein('xyz', 'abc'));
  });

  it('counts multiple edits correctly', () => {
    expect(levenshtein('abc', 'xyz')).toBe(3);
  });
});

describe('scorePronunciation', () => {
  it('returns 100 for a perfect match', () => {
    expect(scorePronunciation('ciao', 'ciao')).toBe(100);
  });

  it('returns 100 when only case differs', () => {
    expect(scorePronunciation('ciao', 'Ciao')).toBe(100);
  });

  it('returns 100 when only accents differ', () => {
    expect(scorePronunciation('città', 'citta')).toBe(100);
  });

  it('returns 0 when target has no match with recognized', () => {
    // levenshtein('ciao','xyz') = 4, max length = 4 → 1 - 4/4 = 0
    expect(scorePronunciation('ciao', 'xyz')).toBe(0);
  });

  it('returns 0 when recognized is empty', () => {
    expect(scorePronunciation('ciao', '')).toBe(0);
  });

  it('returns 0 when both target and recognized are empty', () => {
    expect(scorePronunciation('', '')).toBe(100);
  });

  it('returns a value between 0 and 100', () => {
    const score = scorePronunciation('benedetto', 'benedeta');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('gives a near-perfect score for a one-character typo in a long word', () => {
    // 'risurrezione' vs 'risurrizione' — 1 edit out of 12 chars → ~92%
    const score = scorePronunciation('risurrezione', 'risurrizione');
    expect(score).toBeGreaterThan(85);
  });

  it('scores close-sounding Italian words lower than exact matches', () => {
    const exact = scorePronunciation('ciao', 'ciao');
    const close = scorePronunciation('ciao', 'miao');
    expect(exact).toBeGreaterThan(close);
  });

  it('returns 75 for a one-character miss in a four-character word', () => {
    // 'ciao' vs 'miao': dist=1, max=4 → 1 - 1/4 = 0.75 → 75
    expect(scorePronunciation('ciao', 'miao')).toBe(75);
  });
});
