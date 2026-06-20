import { describe, it, expect } from 'vitest';
import { struggleList, WEAK_EASE, WEAK_PRONUN } from './wordStats.js';

const cards = [
  { it: 'a', en: 'A' },
  { it: 'b', en: 'B' },
  { it: 'c', en: 'C' },
  { it: 'd', en: 'D' },
];

describe('struggleList', () => {
  it('omits cards with no trouble signal', () => {
    const srs = { a: { lapses: 0, ease: 2.5 } };
    const pr = { a: { avg: 90 } };
    expect(struggleList(cards, srs, pr)).toEqual([]);
  });

  it('flags lapses, weak pronunciation, and low ease with reasons', () => {
    const srs = { b: { lapses: 2, ease: 2.5 }, c: { lapses: 0, ease: 2.0 } };
    const pr = { d: { avg: 40 } };
    const list = struggleList(cards, srs, pr);
    const byTerm = Object.fromEntries(list.map((x) => [x.card.it, x]));
    expect(byTerm.b.reasons).toContain('2 misses in review');
    expect(byTerm.d.reasons).toContain('pronunciation 40%');
    expect(byTerm.c.reasons).toContain('shaky recall');
    expect(byTerm.a).toBeUndefined();
  });

  it('ranks the most-struggling word first', () => {
    const srs = { b: { lapses: 1, ease: 2.5 } };
    const pr = { d: { avg: 10 } }; // very weak pronunciation → higher score
    const list = struggleList(cards, srs, pr);
    expect(list[0].card.it).toBe('d');
  });

  it('respects the limit', () => {
    const srs = { a: { lapses: 1, ease: 2.5 }, b: { lapses: 1, ease: 2.5 }, c: { lapses: 1, ease: 2.5 } };
    expect(struggleList(cards, srs, {}, { limit: 2 })).toHaveLength(2);
  });

  it('handles empty/missing stores without throwing', () => {
    expect(struggleList(cards)).toEqual([]);
    expect(struggleList(cards, undefined, undefined)).toEqual([]);
  });

  it('exposes its thresholds', () => {
    expect(WEAK_EASE).toBe(2.2);
    expect(WEAK_PRONUN).toBe(60);
  });
});
