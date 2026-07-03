import { describe, it, expect } from 'vitest';
import { ROUNDS, countWords, wpm, summarizeRounds, sprintDelta } from './fluencySprint.js';

describe('ROUNDS', () => {
  it('is three shrinking time limits', () => {
    expect(ROUNDS).toHaveLength(3);
    expect(ROUNDS[0]).toBeGreaterThan(ROUNDS[1]);
    expect(ROUNDS[1]).toBeGreaterThan(ROUNDS[2]);
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('In principio era il Verbo')).toBe(5);
    expect(countWords('  ciao   mondo  ')).toBe(2);
  });

  it('handles empty input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});

describe('wpm', () => {
  it('scales words to a per-minute rate', () => {
    expect(wpm('uno due tre quattro cinque', 30)).toBe(10); // 5 words / 30s
    expect(wpm('uno due tre', 60)).toBe(3);
  });

  it('rounds to the nearest integer', () => {
    expect(wpm('uno due tre quattro', 45)).toBe(5); // 5.33…
  });

  it('is 0 for no words or no time', () => {
    expect(wpm('', 60)).toBe(0);
    expect(wpm('ciao', 0)).toBe(0);
  });
});

describe('summarizeRounds', () => {
  it('summarizes each spoken round against its time limit', () => {
    const s = summarizeRounds(['a b c d', 'a b c'], [60, 45, 30]);
    expect(s).toEqual([
      { round: 1, seconds: 60, words: 4, wpm: 4 },
      { round: 2, seconds: 45, words: 3, wpm: 4 },
    ]);
  });

  it('ignores transcripts beyond the round count', () => {
    expect(summarizeRounds(['a', 'b', 'c', 'd'], [10, 10])).toHaveLength(2);
  });

  it('handles no rounds yet', () => {
    expect(summarizeRounds([])).toEqual([]);
  });
});

describe('sprintDelta', () => {
  const mk = (wpms) => wpms.map((w, i) => ({ round: i + 1, seconds: 60, words: w, wpm: w }));

  it('is the % change from first to last spoken round', () => {
    expect(sprintDelta(mk([10, 12, 15]))).toBe(50);
    expect(sprintDelta(mk([20, 15]))).toBe(-25);
  });

  it('skips empty rounds', () => {
    const summary = [
      { round: 1, seconds: 60, words: 0, wpm: 0 },
      { round: 2, seconds: 45, words: 9, wpm: 12 },
      { round: 3, seconds: 30, words: 9, wpm: 18 },
    ];
    expect(sprintDelta(summary)).toBe(50);
  });

  it('is null until two spoken rounds exist', () => {
    expect(sprintDelta([])).toBeNull();
    expect(sprintDelta(mk([10]))).toBeNull();
    expect(sprintDelta(mk([0, 0]))).toBeNull();
  });
});
