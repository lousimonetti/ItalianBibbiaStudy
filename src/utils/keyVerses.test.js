import { describe, it, expect } from 'vitest';
import {
  passageLines,
  exampleLines,
  readingLines,
  hasPassage,
  hasEnglish,
  keyVerses,
  splitSentences,
} from './keyVerses';

const weekNoPassage = {
  vocab: [
    ['il Verbo', 'the Word', 'In principio era il Verbo.', '/x/',
      { exEn: 'In the beginning was the Word.' }],
    ['la luce', 'the light', 'La luce splende nelle tenebre.', '/x/'],
    ['dup', 'dup', 'La luce splende nelle tenebre.', '/x/'], // duplicate example
    ['empty', 'empty', '', '/x/'], // no example
  ],
};

const weekWithPassage = {
  vocab: [['x', 'x', 'esempio', '/x/']],
  passage: {
    ref: 'Giovanni 1,1-3',
    translation: 'Riveduta',
    verses: [
      { n: 1, t: 'Nel principio era la Parola.', en: 'In the beginning was the Word.' },
      { n: 2, t: 'Essa era nel principio con Dio.' },
      { n: 3, t: '  ' }, // blank verse dropped
    ],
  },
};

describe('exampleLines', () => {
  it('dedupes and drops empty examples', () => {
    const lines = exampleLines(weekNoPassage);
    expect(lines.map((l) => l.t)).toEqual([
      'In principio era il Verbo.',
      'La luce splende nelle tenebre.',
    ]);
  });
  it('handles missing vocab', () => {
    expect(exampleLines({})).toEqual([]);
  });
});

describe('passageLines / hasPassage', () => {
  it('extracts non-empty verses', () => {
    expect(passageLines(weekWithPassage)).toEqual([
      { ref: '1', t: 'Nel principio era la Parola.', en: 'In the beginning was the Word.' },
      { ref: '2', t: 'Essa era nel principio con Dio.', en: '' },
    ]);
  });
  it('hasPassage reflects presence', () => {
    expect(hasPassage(weekWithPassage)).toBe(true);
    expect(hasPassage(weekNoPassage)).toBe(false);
  });
});

describe('hasEnglish', () => {
  it('is true when a verse carries an authored translation', () => {
    expect(hasEnglish(weekWithPassage)).toBe(true);
  });
  it('falls back to the vocab example translation', () => {
    expect(hasEnglish(weekNoPassage)).toBe(true);
    expect(readingLines(weekNoPassage)[0].en).toBe('In the beginning was the Word.');
  });
  it('is false when nothing is translated', () => {
    expect(hasEnglish({ vocab: [['x', 'x', 'esempio']] })).toBe(false);
  });
});

describe('readingLines', () => {
  it('prefers an authored passage', () => {
    expect(readingLines(weekWithPassage).length).toBe(2);
    expect(readingLines(weekWithPassage)[0].ref).toBe('1');
  });
  it('falls back to example sentences', () => {
    expect(readingLines(weekNoPassage).length).toBe(2);
  });
});

describe('splitSentences', () => {
  it('splits on terminal punctuation', () => {
    expect(splitSentences('Uno. Due! Tre?')).toEqual(['Uno.', 'Due!', 'Tre?']);
  });
  it('keeps a single sentence intact', () => {
    expect(splitSentences('senza punto finale')).toEqual(['senza punto finale']);
  });
});

describe('keyVerses', () => {
  it('flattens passage verses into sentences', () => {
    expect(keyVerses(weekWithPassage)).toEqual([
      'Nel principio era la Parola.',
      'Essa era nel principio con Dio.',
    ]);
  });
  it('uses example sentences when no passage', () => {
    expect(keyVerses(weekNoPassage)).toEqual([
      'In principio era il Verbo.',
      'La luce splende nelle tenebre.',
    ]);
  });
});
