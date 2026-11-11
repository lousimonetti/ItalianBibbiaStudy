import { describe, it, expect } from 'vitest';
import { PHASES } from '../data/studyData';
import {
  weekLessons, balancedChunks, checkStep, solutionFor, isReady, isGraded,
  startRun, advance, currentStep, isFinished, progress, summarize, srsGrades,
  adaptLesson, wordLevel,
} from './lessonPlan';

const WEEKS = PHASES.flatMap((p) => p.weeks);
const ALL = WEEKS.flatMap(weekLessons);

// Play a lesson to the end; `miss(step)` decides which first attempts fail.
function play(lesson, miss = () => false) {
  let run = startRun(lesson);
  while (!isFinished(run)) {
    const step = currentStep(run);
    const correct = isGraded(step) ? (step.retry ? true : !miss(step)) : null;
    run = advance(run, correct);
  }
  return run;
}

describe('balancedChunks', () => {
  it('never strands a single item', () => {
    expect(balancedChunks([1, 2, 3, 4, 5, 6, 7]).map((c) => c.length)).toEqual([4, 3]);
    expect(balancedChunks([1, 2, 3, 4, 5]).map((c) => c.length)).toEqual([3, 2]);
    expect(balancedChunks([1, 2, 3, 4]).map((c) => c.length)).toEqual([4]);
    expect(balancedChunks([])).toEqual([]);
  });
});

describe('weekLessons over the whole course', () => {
  it('gives every week word lessons and a passage lesson', () => {
    for (const week of WEEKS) {
      const lessons = weekLessons(week);
      expect(lessons.length, `week ${week.n}`).toBeGreaterThanOrEqual(3);
      expect(lessons.at(-1).kind).toBe('passage');
      expect(lessons.map((l) => l.key)).toEqual(lessons.map((_, i) => `${week.n}.${i + 1}`));
    }
  });

  it('teaches every vocab word exactly once, with an intro and a typed recall', () => {
    for (const week of WEEKS) {
      const lessons = weekLessons(week).filter((l) => l.kind === 'words');
      expect(lessons.flatMap((l) => l.words)).toEqual(week.vocab.map((v) => v[0]));
      for (const l of lessons) {
        for (const term of l.words) {
          const kinds = l.steps.filter((s) => s.term === term).map((s) => s.kind);
          expect(kinds, `${l.key} ${term}`).toEqual(expect.arrayContaining(['intro', 'choice', 'recall']));
          // …and one sentence-level exercise wherever the example allows it.
          expect(kinds.indexOf('intro')).toBe(0);
        }
      }
    }
  });

  it('is deterministic', () => {
    expect(weekLessons(WEEKS[4])).toEqual(weekLessons(WEEKS[4]));
  });

  it('carries the grammar tip and drills on the last word lesson only', () => {
    const lessons = weekLessons(WEEKS[0]);
    const has = (l, kind) => l.steps.some((s) => s.kind === kind);
    expect(has(lessons[0], 'tip')).toBe(false);
    expect(has(lessons[1], 'tip')).toBe(true);
    expect(has(lessons[1], 'drill')).toBe(true);
  });

  it('puts verse rebuilds in most passage lessons', () => {
    const withVerse = ALL.filter((l) => l.kind === 'passage' && l.steps.some((s) => s.kind === 'build'));
    expect(withVerse.length).toBeGreaterThanOrEqual(30);
  });

  it('every graded step is passed by its own solution and failed by a wrong one', () => {
    let graded = 0;
    for (const lesson of ALL) {
      for (const step of lesson.steps) {
        if (!isGraded(step)) {
          expect(checkStep(step, null).correct).toBe(null);
          continue;
        }
        graded += 1;
        const solution = solutionFor(step);
        expect(isReady(step, solution), `${lesson.key} #${step.id} ${step.kind}`).toBe(true);
        expect(checkStep(step, solution).correct, `${lesson.key} #${step.id} ${step.kind}`).toBe(true);
        const wrong = step.kind === 'tf' ? !step.answer
          : step.kind === 'choice' || step.kind === 'mc' ? (step.answer + 1) % step.options.length
            : step.kind === 'build' ? [...solution].reverse()
              : 'zzzzzzzz';
        expect(checkStep(step, wrong).correct, `${lesson.key} #${step.id} wrong`).toBe(false);
      }
    }
    expect(graded).toBeGreaterThan(1000);
  });

  it('multiple-choice options are distinct and contain the answer once', () => {
    for (const lesson of ALL) {
      for (const step of lesson.steps.filter((s) => s.kind === 'choice')) {
        expect(new Set(step.options).size).toBe(step.options.length);
        expect(step.options.length).toBeGreaterThanOrEqual(2);
        expect(step.options[step.answer]).toBe(step.direction === 'it-en'
          ? WEEKS.find((w) => w.n === lesson.weekN).vocab.find((v) => v[0] === step.term)[1]
          : step.term);
      }
    }
  });

  it('degrades to nothing for an empty week', () => {
    expect(weekLessons(null)).toEqual([]);
    expect(weekLessons({ n: 1, vocab: [] })).toEqual([]);
  });
});

describe('a run', () => {
  const lesson = weekLessons(WEEKS[0])[0];

  it('a clean run visits each step once and scores 100', () => {
    const run = play(lesson);
    expect(run.queue.length).toBe(lesson.steps.length);
    expect(summarize(run).pct).toBe(100);
    expect(progress(run)).toBe(1);
  });

  it('re-queues a missed step once and counts only the first attempt', () => {
    const target = lesson.steps.find((s) => s.kind === 'recall');
    const run = play(lesson, (s) => s.id === target.id);
    expect(run.queue.length).toBe(lesson.steps.length + 1);
    expect(run.queue.at(-1)).toMatchObject({ id: target.id, retry: true });
    const sum = summarize(run);
    expect(sum.correct).toBe(sum.graded - 1);
  });

  it('missing the retry does not queue it again', () => {
    const target = lesson.steps.find((s) => s.kind === 'recall');
    let run = startRun(lesson);
    while (!isFinished(run)) {
      const step = currentStep(run);
      run = advance(run, isGraded(step) ? step.id !== target.id : null);
    }
    expect(run.queue.length).toBe(lesson.steps.length + 1);
  });

  it('ungraded steps never enter the score', () => {
    const run = play(lesson);
    const ungraded = lesson.steps.filter((s) => !isGraded(s)).length;
    expect(summarize(run).graded).toBe(lesson.steps.length - ungraded);
  });
});

describe('srsGrades', () => {
  const lesson = weekLessons(WEEKS[0])[0];
  const recallOf = (term) => lesson.steps.find((s) => s.kind === 'recall' && s.term === term);
  const clozed = lesson.steps.find((s) => s.kind === 'cloze');

  it('grades every word good on a clean run', () => {
    const grades = srsGrades(lesson, play(lesson));
    expect(grades.map((g) => g.term).sort()).toEqual([...lesson.words].sort());
    expect(grades.every((g) => g.grade === 'good')).toBe(true);
  });

  it('a missed recall is again; a missed cloze with a good recall is hard', () => {
    const missRecall = lesson.words.find((w) => w !== clozed.term);
    const run = play(lesson, (s) => s.id === recallOf(missRecall).id || s.id === clozed.id);
    const byTerm = Object.fromEntries(srsGrades(lesson, run).map((g) => [g.term, g.grade]));
    expect(byTerm[missRecall]).toBe('again');
    expect(byTerm[clozed.term]).toBe('hard');
  });

  it('a wrong tap changes nothing', () => {
    const run = play(lesson, (s) => s.kind === 'choice');
    expect(srsGrades(lesson, run).every((g) => g.grade === 'good')).toBe(true);
  });

  it('leaves a word alone when it is scheduled and not yet due', () => {
    const now = 1_000_000;
    const [a, b] = lesson.words;
    const store = { [a]: { due: now + 5 }, [b]: { due: now - 5 } };
    const terms = srsGrades(lesson, play(lesson), store, now).map((g) => g.term);
    expect(terms).not.toContain(a);
    expect(terms).toContain(b);
  });

  it('an abandoned run grades only the words that reached their recall', () => {
    expect(srsGrades(lesson, startRun(lesson))).toEqual([]);
  });
});

describe('adaptLesson', () => {
  const NOW = Date.UTC(2026, 10, 10);
  const DAYS = 86400000;
  const week = PHASES[0].weeks[0];
  const wordLesson = weekLessons(week).find((l) => l.kind === 'words');
  const [a, b] = wordLesson.words;
  const known = { reps: 5, interval: 30, ease: 2.5, lapses: 0, due: NOW + 10 * DAYS, relearn: null };
  const weak = { reps: 2, interval: 3, ease: 2.0, lapses: 3, due: NOW + DAYS, relearn: null };

  it('leaves a lesson alone for a learner with no history', () => {
    expect(adaptLesson(wordLesson, {}, NOW)).toBe(wordLesson);
  });

  it('classifies words', () => {
    expect(wordLevel(undefined, NOW)).toBe('normal');
    expect(wordLevel(known, NOW)).toBe('known');
    expect(wordLevel({ ...known, due: NOW - 1 }, NOW)).toBe('normal');
    expect(wordLevel({ ...known, relearn: 1 }, NOW)).toBe('normal');
    expect(wordLevel(weak, NOW)).toBe('weak');
    expect(wordLevel({ ...known, lapses: 2 }, NOW)).toBe('weak');
  });

  it('drops the steps of a word the learner knows well, keeps the rest, renumbers', () => {
    const out = adaptLesson(wordLesson, { [a]: known }, NOW);
    expect(out.steps.some((s) => s.term === a)).toBe(false);
    expect(out.steps.some((s) => s.term === b)).toBe(true);
    expect(out.steps.some((s) => s.kind === 'match')).toBe(true);
    expect(out.steps.map((s) => s.id)).toEqual(out.steps.map((_, i) => i));
    expect(out.adapted).toEqual({ skipped: 1, extra: 0 });
    expect(out.key).toBe(wordLesson.key);
  });

  it('adds one extra recall for a word the learner keeps missing, after the other recalls', () => {
    const out = adaptLesson(wordLesson, { [a]: weak }, NOW);
    const extra = out.steps.filter((s) => s.practice);
    expect(extra).toHaveLength(1);
    expect(extra[0]).toMatchObject({ kind: 'recall', term: a });
    const recalls = out.steps.map((s) => s.kind === 'recall');
    expect(out.steps.indexOf(extra[0])).toBe(recalls.lastIndexOf(true));
    expect(out.adapted).toEqual({ skipped: 0, extra: 1 });
  });

  it('keeps the whole lesson when every word is already known', () => {
    const store = Object.fromEntries(wordLesson.words.map((w) => [w, known]));
    expect(adaptLesson(wordLesson, store, NOW)).toBe(wordLesson);
  });

  it('never adapts the passage lesson', () => {
    const brano = weekLessons(week).find((l) => l.kind === 'passage');
    expect(adaptLesson(brano, { [a]: known }, NOW)).toBe(brano);
  });

  it('the extra recall does not feed the SRS twice', () => {
    const out = adaptLesson(wordLesson, { [a]: weak }, NOW);
    const run = play(out);
    const grades = srsGrades(out, run, { [a]: { ...weak, due: NOW - 1 } }, NOW);
    expect(grades.filter((g) => g.term === a)).toHaveLength(1);
  });
});
