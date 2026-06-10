import { describe, it, expect } from 'vitest';
import { PHASES, DAILY } from './studyData.js';

describe('PHASES structure', () => {
  it('contains exactly 4 phases', () => {
    expect(PHASES).toHaveLength(4);
  });

  it('has a total of 37 weeks across all phases', () => {
    const total = PHASES.reduce((sum, p) => sum + p.weeks.length, 0);
    expect(total).toBe(37);
  });

  it('has week numbers 1 through 37 with no gaps or duplicates', () => {
    const weekNums = PHASES.flatMap(p => p.weeks.map(w => w.n)).sort((a, b) => a - b);
    expect(weekNums).toEqual(Array.from({ length: 37 }, (_, i) => i + 1));
  });

  it('every phase has an id, title, and non-empty weeks array', () => {
    for (const phase of PHASES) {
      expect(phase.id).toBeTruthy();
      expect(phase.title).toBeTruthy();
      expect(Array.isArray(phase.weeks)).toBe(true);
      expect(phase.weeks.length).toBeGreaterThan(0);
    }
  });
});

describe('week objects', () => {
  const allWeeks = PHASES.flatMap(p => p.weeks);

  it('every week has required fields: n, d, r, vocab, grammar, prompt, review', () => {
    for (const week of allWeeks) {
      expect(typeof week.n).toBe('number');
      expect(typeof week.d).toBe('string');
      expect(typeof week.r).toBe('string');
      expect(Array.isArray(week.vocab)).toBe(true);
      expect(typeof week.grammar).toBe('object');
      expect(typeof week.prompt).toBe('object');
      expect(typeof week.review).toBe('boolean');
    }
  });

  it('every week has at least one vocab item', () => {
    for (const week of allWeeks) {
      expect(week.vocab.length).toBeGreaterThan(0);
    }
  });

  it('every vocab item has at least 3 elements [italian, english, example]', () => {
    for (const week of allWeeks) {
      for (const item of week.vocab) {
        expect(item.length).toBeGreaterThanOrEqual(3);
        expect(typeof item[0]).toBe('string'); // italian
        expect(typeof item[1]).toBe('string'); // english
        expect(typeof item[2]).toBe('string'); // example sentence
      }
    }
  });

  it('when IPA is present (4th element) it starts and ends with a slash', () => {
    for (const week of allWeeks) {
      for (const item of week.vocab) {
        const ipa = item[3];
        if (ipa !== undefined) {
          expect(ipa.startsWith('/'), `IPA "${ipa}" should start with /`).toBe(true);
          expect(ipa.endsWith('/'), `IPA "${ipa}" should end with /`).toBe(true);
        }
      }
    }
  });

  it('every grammar object has title and body strings', () => {
    for (const week of allWeeks) {
      expect(typeof week.grammar.title).toBe('string');
      expect(week.grammar.title.length).toBeGreaterThan(0);
      expect(typeof week.grammar.body).toBe('string');
      expect(week.grammar.body.length).toBeGreaterThan(0);
    }
  });

  it('every prompt object has it and en strings', () => {
    for (const week of allWeeks) {
      expect(typeof week.prompt.it).toBe('string');
      expect(week.prompt.it.length).toBeGreaterThan(0);
      expect(typeof week.prompt.en).toBe('string');
      expect(week.prompt.en.length).toBeGreaterThan(0);
    }
  });

  it('no vocab Italian word is an empty string', () => {
    for (const week of allWeeks) {
      for (const [italian] of week.vocab) {
        expect(italian.trim()).not.toBe('');
      }
    }
  });
});

describe('DAILY schedule', () => {
  it('contains exactly 7 entries', () => {
    expect(DAILY).toHaveLength(7);
  });

  it('each entry has a day and task string', () => {
    for (const item of DAILY) {
      expect(typeof item.day).toBe('string');
      expect(item.day.length).toBeGreaterThan(0);
      expect(typeof item.task).toBe('string');
      expect(item.task.length).toBeGreaterThan(0);
    }
  });

  it('days run Mon through Sun', () => {
    const days = DAILY.map(d => d.day);
    expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});
