import { describe, it, expect } from 'vitest';
import { transformItems, checkTransform } from './transformDrill.js';

const item = {
  instruction: 'Metti al plurale',
  base: 'Il pastore trova la pecora.',
  answer: 'I pastori trovano le pecore.',
};

describe('transformItems', () => {
  it('keeps well-formed items and drops malformed ones', () => {
    const week = {
      transform: [
        item,
        { instruction: '', base: 'x', answer: 'y' },
        { instruction: 'i', base: '', answer: 'y' },
        { instruction: 'i', base: 'x', answer: '' },
        null,
      ],
    };
    expect(transformItems(week)).toHaveLength(1);
  });

  it('returns [] when absent', () => {
    expect(transformItems({})).toEqual([]);
    expect(transformItems(undefined)).toEqual([]);
  });
});

describe('checkTransform', () => {
  it('accepts the exact answer (case/accent/punctuation forgiving)', () => {
    expect(checkTransform(item, 'I pastori trovano le pecore.').correct).toBe(true);
    expect(checkTransform(item, 'i pastori trovano le pecore').correct).toBe(true);
  });

  it('requires the exact transformed form — a single-char miss is wrong', () => {
    // The transformations are themselves single-character (pastore→pastori,
    // la→le), so fuzzy matching would defeat the drill. Untransformed and
    // partially-transformed answers must both fail.
    expect(checkTransform(item, 'Il pastore trova la pecora').correct).toBe(false);
    expect(checkTransform(item, 'I pastori trova le pecore').correct).toBe(false);
    expect(checkTransform(item, 'I pastori trovano la pecore').correct).toBe(false);
  });

  it('returns a word-level diff marking which words differ', () => {
    const { diff } = checkTransform(item, 'I pastori trova le pecore');
    // "trova" (singular, not transformed) should be unmatched in the attempt.
    const bad = diff.attempt.find((m) => m.w === 'trova');
    expect(bad.ok).toBe(false);
    expect(diff.original.find((m) => m.w === 'trovano').ok).toBe(false);
  });
});
