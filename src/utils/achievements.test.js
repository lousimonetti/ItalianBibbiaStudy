import { describe, it, expect } from 'vitest';
import { computeAchievements, earnedCount } from './achievements.js';

const PHASES = [
  { id: 'p1', book: 'John', weeks: [{ n: 1 }, { n: 2 }] },
  { id: 'p2', book: 'Luke', weeks: [{ n: 3 }, { n: 4 }] },
];

describe('computeAchievements', () => {
  it('earns nothing from an empty context', () => {
    const list = computeAchievements({}, PHASES);
    expect(earnedCount(list)).toBe(0);
    expect(list.find((a) => a.id === 'first').earned).toBe(false);
  });

  it('earns week-count badges from progress', () => {
    const progress = { 1: true, 2: true, 3: true, 4: true, 5: true };
    const list = computeAchievements({ progress }, PHASES);
    expect(list.find((a) => a.id === 'first').earned).toBe(true);
    expect(list.find((a) => a.id === 'five').earned).toBe(true);
  });

  it('earns a phase badge only when every week of the phase is done', () => {
    const list1 = computeAchievements({ progress: { 1: true } }, PHASES);
    expect(list1.find((a) => a.id === 'phase-p1').earned).toBe(false);
    const list2 = computeAchievements({ progress: { 1: true, 2: true } }, PHASES);
    expect(list2.find((a) => a.id === 'phase-p1').earned).toBe(true);
    expect(list2.find((a) => a.id === 'phase-p2').earned).toBe(false);
  });

  it('earns streak, vocab, and writer badges from their counters', () => {
    const list = computeAchievements({ streakBest: 30, learnedCount: 150, journaledWeeks: 10 }, PHASES);
    expect(list.find((a) => a.id === 'streak7').earned).toBe(true);
    expect(list.find((a) => a.id === 'streak30').earned).toBe(true);
    expect(list.find((a) => a.id === 'learn50').earned).toBe(true);
    expect(list.find((a) => a.id === 'learn150').earned).toBe(true);
    expect(list.find((a) => a.id === 'writer').earned).toBe(true);
  });

  it('includes one badge per phase', () => {
    const list = computeAchievements({}, PHASES);
    expect(list.filter((a) => a.id.startsWith('phase-'))).toHaveLength(2);
  });
});
