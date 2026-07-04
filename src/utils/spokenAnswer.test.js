import { describe, it, expect } from 'vitest';
import { questionItems, canonSpoken, matchesSpoken, ANSWER_SECONDS } from './spokenAnswer.js';

const q = {
  q: 'Chi ha creato il cielo e la terra?',
  answers: ['Dio', 'Dio ha creato il cielo e la terra'],
  model: 'Dio ha creato il cielo e la terra.',
};

describe('ANSWER_SECONDS', () => {
  it('is a short pressure window', () => {
    expect(ANSWER_SECONDS).toBeGreaterThan(3);
    expect(ANSWER_SECONDS).toBeLessThanOrEqual(15);
  });
});

describe('questionItems', () => {
  it('keeps items with a question and at least one answer', () => {
    const week = {
      questions: [
        q,
        { q: 'no answers', answers: [] },
        { q: '', answers: ['x'] },
        null,
      ],
    };
    expect(questionItems(week)).toHaveLength(1);
  });

  it('returns [] when absent', () => {
    expect(questionItems({})).toEqual([]);
  });
});

describe('canonSpoken', () => {
  it('folds accents/case/punctuation and collapses whitespace', () => {
    expect(canonSpoken('  Dìo,  ha  creato! ')).toBe('dio ha creato');
  });
});

describe('matchesSpoken', () => {
  it('accepts a short answer as a whole-word run inside a longer transcript', () => {
    expect(matchesSpoken(q, 'è stato Dio a crearlo')).toBe(true);
    expect(matchesSpoken(q, 'Dio')).toBe(true);
  });

  it('accepts a fuzzy whole-sentence match', () => {
    expect(matchesSpoken(q, 'Dio ha creato il cielo e la terra')).toBe(true);
  });

  it('does not match the answer buried inside a larger word', () => {
    // "dio" must not be found inside "condio"
    expect(matchesSpoken({ q: '?', answers: ['dio'] }, 'condio piatto')).toBe(false);
  });

  it('rejects a wrong or empty answer', () => {
    expect(matchesSpoken(q, 'la luce')).toBe(false);
    expect(matchesSpoken(q, '')).toBe(false);
    expect(matchesSpoken(q, '   ')).toBe(false);
  });
});
