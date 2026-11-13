import { describe, it, expect } from 'vitest';
import { TIPS, TIP_CATEGORIES } from '../data/learningTips';
import { tipForDate, tipsByCategory } from './learningTips';

describe('learning tips', () => {
  it('every tip is complete and belongs to a category', () => {
    const cats = new Set(TIP_CATEGORIES.map((c) => c.id));
    expect(new Set(TIPS.map((t) => t.id)).size).toBe(TIPS.length);
    for (const tip of TIPS) {
      expect(cats.has(tip.cat), tip.id).toBe(true);
      expect(tip.title.length, tip.id).toBeGreaterThan(5);
      expect(tip.body.length, tip.id).toBeGreaterThan(40);
      for (const ex of tip.examples || []) {
        expect(ex.it && ex.en, tip.id).toBeTruthy();
        // The Italian side is spoken aloud, so no English notes belong in it.
        expect(ex.it, tip.id).not.toMatch(/[()=]/);
      }
    }
  });

  it('groups every tip, with no empty category', () => {
    const groups = tipsByCategory();
    expect(groups.flatMap((g) => g.tips)).toHaveLength(TIPS.length);
    expect(groups.every((g) => g.tips.length > 0)).toBe(true);
  });

  it('deals each tip once per cycle, the same tip all day', () => {
    expect(tipForDate('2026-11-13').id).toBe(tipForDate('2026-11-13').id);
    const start = Date.UTC(2026, 0, 1);
    const seen = new Set();
    for (let d = 0; d < TIPS.length * 2; d++) {
      seen.add(tipForDate(new Date(start + d * 86400000).toISOString().slice(0, 10)).id);
    }
    expect(seen.size).toBe(TIPS.length);
  });
});
