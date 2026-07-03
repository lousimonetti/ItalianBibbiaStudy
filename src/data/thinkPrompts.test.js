import { describe, it, expect } from 'vitest';
import { THINK_PROMPTS, dayOfYear, promptForDate } from './thinkPrompts.js';

describe('THINK_PROMPTS', () => {
  it('has a month-scale rotation of well-formed prompts', () => {
    expect(THINK_PROMPTS.length).toBeGreaterThanOrEqual(28);
    for (const p of THINK_PROMPTS) {
      expect(p.it).toBeTruthy();
      expect(p.en).toBeTruthy();
    }
  });

  it('has no duplicate Italian prompts', () => {
    const its = THINK_PROMPTS.map(p => p.it);
    expect(new Set(its).size).toBe(its.length);
  });
});

describe('dayOfYear', () => {
  it('counts days from Jan 1 = 1', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    expect(dayOfYear(new Date(2026, 0, 31))).toBe(31);
    expect(dayOfYear(new Date(2026, 1, 1))).toBe(32);
  });

  it('handles year end', () => {
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365); // 2026 is not a leap year
  });
});

describe('promptForDate', () => {
  it('is deterministic for a given day', () => {
    const d = new Date(2026, 6, 3);
    expect(promptForDate(d)).toBe(promptForDate(new Date(2026, 6, 3)));
  });

  it('returns a member of the list', () => {
    expect(THINK_PROMPTS).toContain(promptForDate(new Date(2026, 3, 13)));
  });

  it('rotates to a different prompt the next day', () => {
    const a = promptForDate(new Date(2026, 6, 3));
    const b = promptForDate(new Date(2026, 6, 4));
    expect(a).not.toBe(b);
  });

  it('covers the whole list over one cycle', () => {
    const seen = new Set();
    for (let i = 0; i < THINK_PROMPTS.length; i++) {
      seen.add(promptForDate(new Date(2026, 0, 1 + i)));
    }
    expect(seen.size).toBe(THINK_PROMPTS.length);
  });
});
