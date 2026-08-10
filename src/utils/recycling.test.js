import { describe, it, expect } from 'vitest';
import { recycledWords } from './recycling.js';

const w1 = {
  n: 1,
  vocab: [['la luce', 'the light', 'La luce splende', '/x/'], ['il mondo', 'the world', 'il mondo è fatto', '/x/']],
  prompt: { it: 'In principio.' },
};
const w2 = {
  n: 2,
  vocab: [['il pozzo', 'the well', 'sedeva presso il pozzo', '/x/']],
  prompt: { it: 'La luce del mondo splende ancora.' },
};
const w3 = {
  n: 3,
  vocab: [['il pane', 'bread', 'io sono il pane', '/x/']],
  prompt: { it: 'Nulla di ripetuto qui.' },
};
const ALL = [w1, w2, w3];

describe('recycledWords', () => {
  it('finds earlier-week terms that resurface in this week’s material', () => {
    const out = recycledWords(w2, ALL);
    expect(out.map((r) => r.it).sort()).toEqual(['il mondo', 'la luce']);
    expect(out.find((r) => r.it === 'la luce').firstWeek).toBe(1);
  });

  it('returns nothing when no earlier word reappears', () => {
    expect(recycledWords(w3, ALL)).toEqual([]);
  });

  it('never reports the week’s own vocabulary as recycled', () => {
    const out = recycledWords(w2, ALL);
    expect(out.map((r) => r.it)).not.toContain('il pozzo');
  });

  it('ignores later weeks', () => {
    // Week 1 can't recycle anything — nothing precedes it.
    expect(recycledWords(w1, ALL)).toEqual([]);
  });

  it('matches on whole words, not substrings', () => {
    const early = { n: 1, vocab: [['la vita', 'life', 'la vita', '/x/']], prompt: { it: '' } };
    const later = { n: 2, vocab: [['x', 'y', 'gli invitati non vennero', '/x/']], prompt: { it: '' } };
    // "vita" appears inside "invitati" but must not match.
    expect(recycledWords(later, [early, later])).toEqual([]);
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      n: i + 1,
      vocab: [[`parola${i}`, 'word', `parola${i}`, '/x/']],
      prompt: { it: '' },
    }));
    const last = { n: 99, vocab: [['z', 'z', many.map((m) => m.vocab[0][0]).join(' '), '/x/']], prompt: { it: '' } };
    expect(recycledWords(last, [...many, last], { limit: 4 })).toHaveLength(4);
  });

  it('degrades safely on bad input', () => {
    expect(recycledWords(null, ALL)).toEqual([]);
    expect(recycledWords(w2, null)).toEqual([]);
  });
});
