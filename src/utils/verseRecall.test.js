import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import {
  verseTokens, fadeOrder, stageSizes, stageParts, stageCount, wordMatches, checkStage, stageForReps, gradeResult,
} from './verseRecall';
import { passageLines } from './keyVerses';

const VERSE = 'In principio era il Verbo, e il Verbo era presso Dio e il Verbo era Dio.';

describe('verseTokens', () => {
  it('keeps punctuation out of the word', () => {
    expect(verseTokens('«Pace a voi!».')).toEqual([
      { pre: '«', word: 'Pace', post: '' },
      { pre: '', word: 'a', post: '' },
      { pre: '', word: 'voi', post: '!».' },
    ]);
  });

  it('keeps an internal apostrophe in the word', () => {
    expect(verseTokens("l'uomo,")[0]).toEqual({ pre: '', word: "l'uomo", post: ',' });
  });
});

describe('fadeOrder', () => {
  it('is stable for the same text', () => {
    expect(fadeOrder(VERSE)).toEqual(fadeOrder(VERSE));
  });

  it('removes content words before short ones', () => {
    const tokens = verseTokens(VERSE);
    const firstFew = fadeOrder(VERSE).slice(0, 3).map((i) => tokens[i].word);
    expect(firstFew.every((w) => w.length >= 4)).toBe(true);
  });

  it('covers every word exactly once', () => {
    const order = fadeOrder(VERSE);
    expect(new Set(order).size).toBe(verseTokens(VERSE).length);
  });
});

describe('stageSizes', () => {
  it('grows up to the whole verse', () => {
    expect(stageSizes(10)).toEqual([1, 3, 6, 10]);
  });

  it('has no duplicate stage in a short verse', () => {
    expect(stageSizes(2)).toEqual([1, 2]);
    expect(stageSizes(1)).toEqual([1]);
    expect(stageSizes(0)).toEqual([]);
  });
});

describe('stageParts', () => {
  const blanks = (stage) => stageParts(VERSE, stage).map((p, i) => (p.blank ? i : -1)).filter((i) => i >= 0);

  it('only ever adds blanks', () => {
    for (let stage = 1; stage < stageCount(VERSE); stage++) {
      expect(blanks(stage)).toEqual(expect.arrayContaining(blanks(stage - 1)));
      expect(blanks(stage).length).toBeGreaterThan(blanks(stage - 1).length);
    }
  });

  it('blanks everything at the last stage', () => {
    const last = stageParts(VERSE, stageCount(VERSE) - 1);
    expect(last.every((p) => p.blank)).toBe(true);
  });

  it('works for every verse in the course', () => {
    for (const line of PHASES.flatMap((p) => p.weeks).flatMap((w) => passageLines(w))) {
      const count = stageCount(line.t);
      expect(count, line.t).toBeGreaterThan(0);
      const last = stageParts(line.t, count - 1);
      expect(last.filter((p) => p.word).every((p) => p.blank), line.t).toBe(true);
    }
  });
});

describe('wordMatches', () => {
  it('forgives case, accents and a small typo on a long word', () => {
    expect(wordMatches('Verbo', 'verbo')).toBe(true);
    expect(wordMatches('perché', 'perche')).toBe(true);
    expect(wordMatches('principio', 'principo')).toBe(true);
  });

  it('allows no typo on a short word', () => {
    expect(wordMatches('il', 'al')).toBe(false);
    expect(wordMatches('la', 'le')).toBe(false);
    expect(wordMatches('la', 'la')).toBe(true);
  });

  it('accepts a short word that looks like an article', () => {
    expect(wordMatches('il', 'il')).toBe(true);
  });

  it('rejects an empty answer', () => {
    expect(wordMatches('Verbo', '  ')).toBe(false);
  });
});

describe('checkStage', () => {
  it('grades answers in verse order', () => {
    const parts = [
      { word: 'In', blank: false },
      { word: 'principio', blank: true },
      { word: 'era', blank: true },
    ];
    expect(checkStage(parts, ['principio', 'no'])).toEqual({ results: [true, false], wrong: 1, total: 2 });
  });
});

describe('review grading', () => {
  it('asks for more of the verse as it becomes known', () => {
    expect(stageForReps(0, 4)).toBe(0);
    expect(stageForReps(2, 4)).toBe(2);
    expect(stageForReps(9, 4)).toBe(3);
  });

  it('maps results to grades', () => {
    expect(gradeResult({ wrong: 0, total: 5 })).toBe('good');
    expect(gradeResult({ wrong: 2, total: 5 })).toBe('hard');
    expect(gradeResult({ wrong: 4, total: 5 })).toBe('again');
    expect(gradeResult({ wrong: 1, total: 1 })).toBe('again');
  });
});
