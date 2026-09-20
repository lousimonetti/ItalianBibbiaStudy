import { describe, it, expect } from 'vitest';
import {
  QUIZ_LENGTH, buildQuiz, blankOut, blankableWords, weeksInScope,
  vocabPool, drillPool, versePool, comprehensionPool, prayerPool,
} from './quizGame';
import { PHASES } from '../data/studyData';
import { devotionSections } from '../../course/devotions';

const DATE = '2026-09-20';

const tinyPhases = [{
  id: 'p1',
  weeks: [
    {
      n: 1, r: 'John 1',
      vocab: [
        ['la luce', 'the light', 'La luce splende', '/x/', { exEn: 'The light shines' }],
        ['le tenebre', 'the darkness', 'le tenebre', '/x/'],
        ['il Verbo', 'the Word', 'era il Verbo', '/x/'],
        ['la vita', 'life', 'era la vita', '/x/'],
      ],
      drill: [{ q: 'In principio ___ il Verbo.', a: 'era', hint: 'essere' }],
    },
    {
      n: 2, r: 'John 3',
      vocab: [
        ['nascere', 'to be born', 'bisogna nascere', '/x/'],
        ['il dono', 'the gift', 'il dono di Dio', '/x/'],
      ],
      drill: [{ q: '___ creduto in lui.', a: 'ha', hint: 'avere' }],
    },
  ],
}];

describe('blankOut', () => {
  it('blanks a standalone word, not a substring of another', () => {
    expect(blankOut('della gloria del Padre', 'del')).toBe('della gloria ___ Padre');
  });

  it('blanks the first occurrence', () => {
    expect(blankOut('la luce e la vita', 'la')).toBe('___ luce e la vita');
  });

  it('handles a word at the start of the line', () => {
    expect(blankOut('Nel nome del Padre', 'Nel')).toBe('___ nome del Padre');
  });

  it('returns null when the word is not there as a word', () => {
    expect(blankOut('della gloria', 'oria')).toBeNull();
    expect(blankOut('', 'del')).toBeNull();
    expect(blankOut('del Padre', '')).toBeNull();
  });
});

describe('blankableWords', () => {
  const text = 'In principio era il Verbo, e il Verbo era presso Dio.';

  it('skips words that occur more than once', () => {
    // Blanking "Verbo" would leave the answer visible in the other clause.
    expect(blankableWords(text)).not.toContain('Verbo');
    expect(blankableWords(text)).not.toContain('era');
  });

  it('skips short and function words', () => {
    const out = blankableWords('Questo è il dono della grazia eterna');
    expect(out).not.toContain('della');
    expect(out).not.toContain('è');
    expect(out).toContain('grazia');
  });
});

describe('pools', () => {
  it('scopes weeks and falls back to the whole course rather than empty', () => {
    expect(weeksInScope(PHASES, 3).every((w) => w.n <= 3)).toBe(true);
    expect(weeksInScope(PHASES, null).length).toBe(PHASES.flatMap((p) => p.weeks).length);
    // Week 0 exists nowhere — rather than serve nothing, serve everything.
    expect(weeksInScope(PHASES, 0).length).toBe(PHASES.flatMap((p) => p.weeks).length);
  });

  it('finds material of every kind in the bundled course', () => {
    const weeks = weeksInScope(PHASES);
    expect(vocabPool(weeks).length).toBeGreaterThan(200);
    expect(drillPool(weeks).length).toBeGreaterThan(50);
    expect(versePool(weeks).length).toBeGreaterThan(100);
    expect(comprehensionPool(weeks).length).toBeGreaterThan(50);
    expect(prayerPool(devotionSections).length).toBeGreaterThan(20);
  });

  it('only keeps prayer lines whose blank really is in the line', () => {
    const pool = prayerPool(devotionSections);
    for (const line of pool) expect(blankOut(line.it, line.blank)).toContain('___');
  });
});

describe('buildQuiz', () => {
  const quiz = buildQuiz({ date: DATE });

  it('builds a full round', () => {
    expect(quiz).toHaveLength(QUIZ_LENGTH);
  });

  it('is the same round all day and a different one tomorrow', () => {
    expect(buildQuiz({ date: DATE })).toEqual(quiz);
    expect(buildQuiz({ date: '2026-09-21' })).not.toEqual(quiz);
  });

  it('gives every question a usable set of options', () => {
    for (const q of quiz) {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.options[q.answer]).toBeTruthy();
      // No two options may read the same, or the question has two right answers.
      const seen = q.options.map((o) => o.toLowerCase().trim());
      expect(new Set(seen).size).toBe(seen.length);
      expect(q.label.it).toBeTruthy();
    }
  });

  it('shows a blank in every fill-in question', () => {
    for (const q of quiz) {
      if (['grammar', 'verse', 'prayer'].includes(q.kind)) expect(q.prompt).toContain('___');
    }
  });

  it('never blanks away the answer twice over', () => {
    for (const q of quiz) {
      if (q.kind !== 'verse' && q.kind !== 'prayer') continue;
      // The right answer must not still be sitting in the prompt.
      const re = new RegExp(`(^|[^A-Za-zÀ-ÿ])${q.options[q.answer]}([^A-Za-zÀ-ÿ]|$)`, 'i');
      expect(re.test(q.prompt)).toBe(false);
    }
  });

  it('does not give the answer away by capitalization', () => {
    // A capitalized "Cristo" among three lowercase distractors answers itself.
    const dates = ['2026-09-20', '2026-09-21', '2026-10-01', '2026-11-11', '2027-01-05'];
    for (const date of dates) {
      for (const q of buildQuiz({ date })) {
        if (q.kind === 'comprehension') continue;
        const caps = q.options.map((o) => /^[A-ZÀ-Þ]/.test(o));
        expect(new Set(caps).size, `${date} ${q.prompt} → ${q.options}`).toBe(1);
      }
    }
  });

  it('draws on more than one kind of course content', () => {
    const kinds = new Set(quiz.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(4);
  });

  it('asks no word twice in a round', () => {
    const vocab = quiz.filter((q) => q.kind.startsWith('vocab'));
    const asked = vocab.map((q) => (q.kind === 'vocab-it-en' ? q.prompt : q.options[q.answer]));
    expect(new Set(asked).size).toBe(asked.length);
  });

  it('honours weekMax', () => {
    const early = buildQuiz({ date: DATE, weekMax: 2 });
    for (const q of early) {
      const m = /^Settimana (\d+)$/.exec(q.source || '');
      if (m) expect(Number(m[1])).toBeLessThanOrEqual(2);
    }
    expect(early.length).toBe(QUIZ_LENGTH);
  });

  it('works for a course with no prayers and no passages', () => {
    const quizNoExtras = buildQuiz({ date: DATE, phases: tinyPhases, sections: [] });
    expect(quizNoExtras.length).toBeGreaterThan(0);
    for (const q of quizNoExtras) {
      expect(['vocab-en-it', 'vocab-it-en', 'grammar']).toContain(q.kind);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('stops instead of repeating itself when the material runs out', () => {
    const quizTiny = buildQuiz({ date: DATE, phases: tinyPhases, sections: [], count: 50 });
    const prompts = quizTiny.map((q) => `${q.kind}:${q.prompt}`);
    expect(new Set(prompts).size).toBe(prompts.length);
    expect(quizTiny.length).toBeLessThan(50);
  });

  it('survives an empty course without throwing', () => {
    expect(buildQuiz({ date: DATE, phases: [], sections: [] })).toEqual([]);
  });
});
