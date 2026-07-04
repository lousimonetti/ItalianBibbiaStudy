import { describe, it, expect } from 'vitest';
import { weekPhrases } from './chunks.js';

describe('weekPhrases', () => {
  it('returns well-formed phrases, keeping the optional lit field', () => {
    const week = {
      phrases: [
        { it: 'in quel tempo', en: 'at that time' },
        { it: 'mi piace', en: 'I like it', lit: 'it pleases me' },
      ],
    };
    const out = weekPhrases(week);
    expect(out).toHaveLength(2);
    expect(out[1].lit).toBe('it pleases me');
  });

  it('drops malformed entries', () => {
    const week = {
      phrases: [
        { it: 'valido', en: 'valid' },
        { it: '', en: 'empty it' },
        { it: 'x', en: '' },
        null,
        { en: 'no it' },
      ],
    };
    expect(weekPhrases(week)).toHaveLength(1);
  });

  it('returns [] when absent', () => {
    expect(weekPhrases({})).toEqual([]);
    expect(weekPhrases(undefined)).toEqual([]);
    expect(weekPhrases({ phrases: 'nope' })).toEqual([]);
  });
});
