import { describe, it, expect } from 'vitest';
import { splitBlank, drillItems } from './grammarDrill';

describe('splitBlank', () => {
  it('splits around an underscore blank', () => {
    expect(splitBlank('La luce ___ nelle tenebre')).toEqual({
      before: 'La luce ',
      after: ' nelle tenebre',
    });
  });
  it('handles a blank at the end', () => {
    expect(splitBlank('Io ___')).toEqual({ before: 'Io ', after: '' });
  });
  it('degrades when there is no blank', () => {
    expect(splitBlank('niente blank')).toEqual({ before: 'niente blank', after: '' });
  });
});

describe('drillItems', () => {
  it('keeps well-formed items and drops malformed ones', () => {
    const week = {
      drill: [
        { q: 'La luce ___', a: 'splende', hint: 'verb' },
        { q: 'no answer', a: '   ' },
        { a: 'orphan' },
        null,
      ],
    };
    const items = drillItems(week);
    expect(items.length).toBe(1);
    expect(items[0].a).toBe('splende');
  });
  it('returns [] when no drill', () => {
    expect(drillItems({})).toEqual([]);
  });
});
