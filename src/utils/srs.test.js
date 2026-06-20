import { describe, it, expect } from 'vitest';
import { review, isDue, buildQueue, stats, DAY, DEFAULT_EASE, MIN_EASE } from './srs.js';

const NOW = 1_700_000_000_000;

describe('review — good grade', () => {
  it('first good rep schedules 1 day out', () => {
    const c = review(undefined, 'good', NOW);
    expect(c.reps).toBe(1);
    expect(c.interval).toBe(1);
    expect(c.due).toBe(NOW + 1 * DAY);
    expect(c.ease).toBe(DEFAULT_EASE);
    expect(c.lapses).toBe(0);
  });

  it('second good rep schedules 3 days out', () => {
    let c = review(undefined, 'good', NOW);
    c = review(c, 'good', NOW);
    expect(c.reps).toBe(2);
    expect(c.interval).toBe(3);
    expect(c.due).toBe(NOW + 3 * DAY);
  });

  it('third+ good rep multiplies interval by ease', () => {
    let c = review(undefined, 'good', NOW);
    c = review(c, 'good', NOW);
    c = review(c, 'good', NOW); // interval 3 * 2.5 = 7.5 -> round 8
    expect(c.interval).toBe(Math.round(3 * DEFAULT_EASE));
    expect(c.due).toBe(NOW + c.interval * DAY);
  });
});

describe('review — again grade', () => {
  it('resets reps, lowers ease, makes the card due now, counts a lapse', () => {
    let c = review(undefined, 'good', NOW);
    c = review(c, 'good', NOW); // build some progress
    const lapsed = review(c, 'again', NOW);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.interval).toBe(0);
    expect(lapsed.due).toBe(NOW);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ease).toBeCloseTo(DEFAULT_EASE - 0.2, 5);
  });

  it('never lowers ease below the floor', () => {
    let c;
    for (let i = 0; i < 20; i++) c = review(c, 'again', NOW);
    expect(c.ease).toBe(MIN_EASE);
  });
});

describe('isDue', () => {
  it('true when due <= now, false otherwise, false for missing', () => {
    expect(isDue({ due: NOW - 1 }, NOW)).toBe(true);
    expect(isDue({ due: NOW }, NOW)).toBe(true);
    expect(isDue({ due: NOW + 1 }, NOW)).toBe(false);
    expect(isDue(undefined, NOW)).toBe(false);
  });
});

describe('buildQueue', () => {
  const cards = [
    { it: 'a' }, { it: 'b' }, { it: 'c' }, { it: 'd' }, { it: 'e' },
  ];

  it('puts due cards (earliest first) before new cards', () => {
    const store = {
      b: { due: NOW - 100 },
      c: { due: NOW - 5000 }, // most overdue
      d: { due: NOW + DAY },  // not due
    };
    const q = buildQueue(cards, store, { now: NOW, newCap: 12, maxSession: 20 });
    // due: c (oldest), b ; then new: a, e ; d excluded (future)
    expect(q.map((x) => x.it)).toEqual(['c', 'b', 'a', 'e']);
  });

  it('respects newCap', () => {
    const q = buildQueue(cards, {}, { now: NOW, newCap: 2, maxSession: 20 });
    expect(q).toHaveLength(2);
  });

  it('respects maxSession (due prioritized)', () => {
    const store = { a: { due: NOW - 1 }, b: { due: NOW - 2 }, c: { due: NOW - 3 } };
    const q = buildQueue(cards, store, { now: NOW, newCap: 12, maxSession: 2 });
    expect(q).toHaveLength(2);
    expect(q.map((x) => x.it)).toEqual(['c', 'b']); // most overdue first
  });
});

describe('stats', () => {
  it('counts due / new / learned', () => {
    const cards = [{ it: 'a' }, { it: 'b' }, { it: 'c' }];
    const store = { a: { due: NOW - 1 }, b: { due: NOW + DAY } };
    const s = stats(cards, store, NOW);
    expect(s).toEqual({ due: 1, new: 1, learned: 2, total: 3 });
  });
});
