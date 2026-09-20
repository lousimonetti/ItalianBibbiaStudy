import { describe, it, expect } from 'vitest';
import {
  hashSeed, mulberry32, rngFor, shuffled, dayNumber, rotatingPick, dailySample,
} from './gameRandom';

describe('hashSeed / mulberry32', () => {
  it('is deterministic for the same input', () => {
    expect(hashSeed('2026-09-20')).toBe(hashSeed('2026-09-20'));
  });

  it('separates neighbouring days', () => {
    expect(hashSeed('2026-09-20')).not.toBe(hashSeed('2026-09-21'));
  });

  it('produces floats in [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 500; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffled', () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8];

  it('returns a permutation without mutating the input', () => {
    const copy = [...list];
    const out = shuffled(list, rngFor('seed'));
    expect(list).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
  });

  it('is deterministic per seed', () => {
    expect(shuffled(list, rngFor('a'))).toEqual(shuffled(list, rngFor('a')));
    expect(shuffled(list, rngFor('a'))).not.toEqual(shuffled(list, rngFor('b')));
  });

  it('handles empty and single-item lists', () => {
    expect(shuffled([], rngFor('x'))).toEqual([]);
    expect(shuffled(['only'], rngFor('x'))).toEqual(['only']);
  });
});

describe('dayNumber', () => {
  it('counts days from the epoch', () => {
    expect(dayNumber('1970-01-01')).toBe(0);
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(dayNumber('2026-09-21') - dayNumber('2026-09-20')).toBe(1);
  });

  it('crosses a month and a year boundary by exactly one day', () => {
    expect(dayNumber('2026-10-01') - dayNumber('2026-09-30')).toBe(1);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
  });

  it('returns 0 for anything that is not a plain YYYY-MM-DD', () => {
    expect(dayNumber('')).toBe(0);
    expect(dayNumber(null)).toBe(0);
    expect(dayNumber('20 Sep 2026')).toBe(0);
  });
});

describe('rotatingPick', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];

  it('gives the same answer for the same date', () => {
    expect(rotatingPick(list, '2026-09-20', 's')).toBe(rotatingPick(list, '2026-09-20', 's'));
  });

  // A cycle is the run of `list.length` days starting at a multiple of that
  // length — the deck, dealt one card a day.
  const cycleDays = (cycleIndex) => Array.from({ length: list.length }, (_, i) => {
    const day = cycleIndex * list.length + i;
    return new Date(day * 86400000).toISOString().slice(0, 10);
  });

  it('serves every item once inside a cycle', () => {
    const picked = cycleDays(4000).map((d) => rotatingPick(list, d, 's'));
    expect([...picked].sort()).toEqual([...list].sort());
  });

  it('reshuffles for the next cycle', () => {
    const cycle1 = cycleDays(4000).map((d) => rotatingPick(list, d, 's'));
    const cycle2 = cycleDays(4001).map((d) => rotatingPick(list, d, 's'));
    expect([...cycle2].sort()).toEqual([...list].sort());
    expect(cycle2).not.toEqual(cycle1);
  });

  it('is empty-safe', () => {
    expect(rotatingPick([], '2026-09-20')).toBeNull();
    expect(rotatingPick(null, '2026-09-20')).toBeNull();
  });
});

describe('dailySample', () => {
  const list = Array.from({ length: 30 }, (_, i) => i);

  it('returns `count` distinct items', () => {
    const out = dailySample(list, 10, '2026-09-20', 'q');
    expect(out).toHaveLength(10);
    expect(new Set(out).size).toBe(10);
  });

  it('is stable per date and moves between dates', () => {
    expect(dailySample(list, 10, '2026-09-20', 'q')).toEqual(dailySample(list, 10, '2026-09-20', 'q'));
    expect(dailySample(list, 10, '2026-09-20', 'q')).not.toEqual(dailySample(list, 10, '2026-09-21', 'q'));
  });

  it('never returns more than the list holds', () => {
    expect(dailySample(['a', 'b'], 10, '2026-09-20')).toHaveLength(2);
    expect(dailySample([], 10, '2026-09-20')).toEqual([]);
  });
});
