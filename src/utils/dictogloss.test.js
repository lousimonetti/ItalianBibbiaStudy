import { describe, it, expect } from 'vitest';
import { tokenizeWords, diffReconstruction } from './dictogloss';

describe('tokenizeWords', () => {
  it('splits on whitespace and trims', () => {
    expect(tokenizeWords('  In principio  era ')).toEqual(['In', 'principio', 'era']);
  });
  it('handles empty', () => {
    expect(tokenizeWords('')).toEqual([]);
    expect(tokenizeWords(null)).toEqual([]);
  });
});

describe('diffReconstruction', () => {
  it('scores a perfect reconstruction 100', () => {
    const r = diffReconstruction('In principio era il Verbo', 'In principio era il Verbo');
    expect(r.score).toBe(100);
    expect(r.original.every((m) => m.ok)).toBe(true);
    expect(r.attempt.every((m) => m.ok)).toBe(true);
  });

  it('is forgiving of accents, case, and punctuation', () => {
    const r = diffReconstruction('La luce splende.', 'la LUCE splende');
    expect(r.score).toBe(100);
  });

  it('marks missing words and scores partial recall', () => {
    const r = diffReconstruction('In principio era il Verbo', 'In era Verbo');
    // 3 of 5 recovered
    expect(r.score).toBe(60);
    const missed = r.original.filter((m) => !m.ok).map((m) => m.w);
    expect(missed).toEqual(['principio', 'il']);
  });

  it('marks extra/wrong words in the attempt', () => {
    const r = diffReconstruction('era la vita', 'era la morte');
    const wrong = r.attempt.filter((m) => !m.ok).map((m) => m.w);
    expect(wrong).toEqual(['morte']);
  });

  it('handles duplicate words via multiset matching', () => {
    const r = diffReconstruction('la la luce', 'la luce');
    // one "la" recovered, one missing
    expect(r.original.filter((m) => m.ok).length).toBe(2);
    expect(r.original.filter((m) => !m.ok).length).toBe(1);
  });

  it('scores empty attempt 0', () => {
    expect(diffReconstruction('era la vita', '').score).toBe(0);
  });
});
