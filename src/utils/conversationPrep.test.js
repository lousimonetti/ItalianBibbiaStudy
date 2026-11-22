import { describe, it, expect } from 'vitest';
import { buildPrep, prepText, readingHead } from './conversationPrep';
import { PHASES } from '../data/studyData';

const weeks = PHASES.flatMap((p) => p.weeks);

describe('readingHead', () => {
  it('keeps the book and first chapter of a CEI reference', () => {
    expect(readingHead('Giovanni 6,34-35.47-56')).toBe('Giovanni 6');
    expect(readingHead('Romani 1,16-17; 2,1-4')).toBe('Romani 1');
    expect(readingHead('')).toBe('');
  });
});

describe('buildPrep', () => {
  it('builds a sheet for every week of the course', () => {
    for (const w of weeks) {
      const prep = buildPrep(w);
      expect(prep, `week ${w.n}`).not.toBeNull();
      expect(prep.ask.length + prep.chunks.length, `week ${w.n}`).toBeGreaterThan(0);
      expect(prep.say.length, `week ${w.n}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('caps each list so the sheet stays short', () => {
    const big = {
      n: 1,
      questions: Array.from({ length: 9 }, (_, i) => ({ q: `Q${i}?` })),
      phrases: Array.from({ length: 9 }, (_, i) => ({ it: `p${i}`, en: `e${i}` })),
      vocab: Array.from({ length: 9 }, (_, i) => [`w${i}`, `g${i}`]),
    };
    const prep = buildPrep(big);
    expect(prep.ask).toHaveLength(4);
    expect(prep.chunks).toHaveLength(6);
    expect(prep.words).toHaveLength(6);
  });

  it('returns null for an empty week', () => {
    expect(buildPrep({ n: 1 })).toBeNull();
    expect(buildPrep(null)).toBeNull();
  });
});

describe('prepText', () => {
  it('lists the sections with their Italian text', () => {
    const prep = buildPrep(weeks[2]);
    const text = prepText(prep, 'Settimana 3');
    expect(text.startsWith('Settimana 3')).toBe(true);
    expect(text).toContain(prep.ask[0]);
    expect(text).toContain('Questa settimana ho letto Giovanni 6.');
    expect(text).toContain(prep.words[0].it);
  });
});
