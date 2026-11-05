import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import { verseChunks } from './verseChunks';
import { MAX_WORDS } from './scramble';
import { passageLines } from './keyVerses';

const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const allLines = PHASES.flatMap((p) => p.weeks).flatMap((w) => passageLines(w));

describe('verseChunks', () => {
  it('leaves a short sentence whole', () => {
    expect(verseChunks('Gesù scoppiò in pianto.')).toEqual(['Gesù scoppiò in pianto.']);
  });

  it('splits at sentence boundaries before anything else', () => {
    expect(verseChunks('Io sono il pane della vita. Chi viene a me non avrà fame.'))
      .toEqual(['Io sono il pane della vita.', 'Chi viene a me non avrà fame.']);
  });

  it('splits a long sentence at clause punctuation', () => {
    const v = 'In principio era il Verbo, e il Verbo era presso Dio e il Verbo era Dio.';
    expect(verseChunks(v)).toEqual(['In principio era il Verbo,', 'e il Verbo era presso Dio e il Verbo era Dio.']);
  });

  it('hard-splits a stretch with no punctuation', () => {
    const v = Array.from({ length: 30 }, (_, i) => `parola${i}`).join(' ');
    const chunks = verseChunks(v);
    expect(chunks.length).toBe(3);
    expect(chunks.every((c) => words(c).length <= MAX_WORDS)).toBe(true);
  });

  it('folds a stranded opener into a neighbour', () => {
    const chunks = verseChunks('Allora disse, ai suoi discepoli che lo seguivano lungo la strada verso la città santa.');
    expect(chunks.every((c) => words(c).length >= 3)).toBe(true);
  });

  it('returns nothing for empty input', () => {
    expect(verseChunks('')).toEqual([]);
  });

  describe('over the whole course', () => {
    it('never loses or reorders a word', () => {
      for (const line of allLines) {
        expect(verseChunks(line.t).join(' ')).toBe(line.t.trim().replace(/\s+/g, ' '));
      }
    });

    it('keeps every chunk within the word limit', () => {
      const over = allLines.flatMap((l) => verseChunks(l.t)).filter((c) => words(c).length > MAX_WORDS);
      expect(over).toEqual([]);
    });
  });
});
