import { describe, it, expect } from 'vitest';
import { devotionSections } from '../../course/devotions';
import { rosary } from '../../course/rosary';
import { prayerLessons, mysteryLesson, saintLesson, storyWords, lineCloze } from './devotionLessons';
import {
  checkStep, solutionFor, isReady, isGraded, startRun, advance, currentStep, isFinished, summarize, srsGrades,
} from './lessonPlan';

const PRAYERS = devotionSections.flatMap((s) => s.prayers);
const PRAYER_LESSONS = PRAYERS.flatMap(prayerLessons);
const MYSTERY_LESSONS = rosary.sets.map(mysteryLesson);

// A story in the shape Wikipedia's summary returns: a few plain sentences.
const STORY = 'Francesco fu un religioso e poeta italiano. Fondò un ordine di frati e predicò la povertà. '
  + 'Il santo ricevette le stimmate sul monte. Morì ad Assisi e la Chiesa lo proclamò santo dopo due anni. '
  + 'Oggi molti pellegrini visitano la sua tomba nella basilica.';

// Every graded step must accept its own solution and reject a wrong one.
function expectSolvable(lesson) {
  for (const step of lesson.steps) {
    if (!isGraded(step)) { expect(isReady(step, step.kind === 'match' ? true : null), step.kind).toBe(true); continue; }
    const value = solutionFor(step);
    expect(isReady(step, value), `${lesson.key} ${step.kind}`).toBe(true);
    expect(checkStep(step, value).correct, `${lesson.key} ${step.kind} ${step.prompt || step.answer}`).toBe(true);
    if (step.kind === 'choice') {
      expect(new Set(step.options).size).toBe(step.options.length);
      expect(step.options.length).toBeGreaterThanOrEqual(3);
      expect(checkStep(step, (step.answer + 1) % step.options.length).correct).toBe(false);
    }
  }
}

describe('prayerLessons', () => {
  it('gives every line-aligned prayer at least one lesson, and the rest none', () => {
    for (const p of PRAYERS) {
      const lessons = prayerLessons(p);
      if ((p.lines || []).length >= 3) expect(lessons.length, p.id).toBeGreaterThan(0);
      if (!p.lines) expect(lessons).toEqual([]);
    }
    expect(PRAYER_LESSONS.length).toBeGreaterThan(8);
  });

  it('keeps lessons short and keys unique', () => {
    const keys = PRAYER_LESSONS.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const l of PRAYER_LESSONS) {
      expect(l.steps.filter((s) => s.kind === 'line').length, l.key).toBeLessThanOrEqual(5);
      expect(l.steps.length, l.key).toBeGreaterThan(5);
      expect(l.store).toBe('devotion');
    }
  });

  it('every step is solvable', () => {
    PRAYER_LESSONS.forEach(expectSolvable);
  });

  it('is deterministic', () => {
    expect(PRAYERS.flatMap(prayerLessons)).toEqual(PRAYER_LESSONS);
  });

  it('blanks whole words only, and grades them strictly', () => {
    expect(lineCloze({ it: 'della gloria del Padre', en: '', blank: 'del' })).toEqual({
      before: 'della gloria ', answer: 'del', after: ' Padre',
    });
    expect(lineCloze({ it: 'Amen.', en: '' })).toBeNull();
    // A blank that occurs twice would leave its answer on screen.
    expect(lineCloze({ it: 'Gloria al Padre e al Figlio', en: '', blank: 'al' }).answer).toBe('Gloria');
    for (const step of PRAYER_LESSONS.flatMap((l) => l.steps).filter((s) => s.kind === 'cloze')) {
      const rest = `${step.before} ${step.after}`.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
      expect(rest, `${step.before}[${step.answer}]${step.after}`).not.toContain(step.answer.toLowerCase());
    }
    const step = PRAYER_LESSONS.flatMap((l) => l.steps).find((s) => s.kind === 'cloze' && s.answer.toLowerCase() === 'dello');
    expect(checkStep(step, 'dello').correct).toBe(true);
    expect(checkStep(step, 'della').correct).toBe(false);
  });

  it('asks which line comes next with the real next line', () => {
    const padre = PRAYERS.find((p) => p.id === 'padre-nostro');
    const lines = padre.lines.map((l) => l.it);
    const next = prayerLessons(padre).flatMap((l) => l.steps).filter((s) => s.instruction === 'Which line comes next?');
    expect(next.length).toBeGreaterThan(0);
    for (const s of next) expect(s.options[s.answer]).toBe(lines[lines.indexOf(s.prompt) + 1]);
  });

  it('never grades into the vocabulary SRS', () => {
    for (const lesson of PRAYER_LESSONS) {
      let run = startRun(lesson);
      while (!isFinished(run)) run = advance(run, isGraded(currentStep(run)) ? true : null);
      expect(summarize(run).pct).toBe(100);
      expect(srsGrades(lesson, run, {})).toEqual([]);
    }
  });
});

describe('mysteryLesson', () => {
  it('builds one solvable lesson per set, meeting all five mysteries', () => {
    expect(MYSTERY_LESSONS).toHaveLength(4);
    for (const [i, lesson] of MYSTERY_LESSONS.entries()) {
      expect(lesson.key).toBe(`rosary:${rosary.sets[i].id}`);
      expect(lesson.steps.filter((s) => s.kind === 'line')).toHaveLength(5);
      expect(lesson.steps.find((s) => s.kind === 'match').pairs).toHaveLength(5);
      expect(lesson.steps.some((s) => s.audio)).toBe(true);
      expectSolvable(lesson);
    }
  });

  it('every mystery names a picture', () => {
    for (const set of rosary.sets) for (const m of set.mysteries) expect(m.wiki, m.en).toBeTruthy();
  });
});

describe('saintLesson', () => {
  it('picks lowercase glossed words, each with its sentence', () => {
    const picks = storyWords(STORY);
    expect(picks.length).toBeGreaterThanOrEqual(3);
    expect(picks.length).toBeLessThanOrEqual(5);
    for (const p of picks) {
      expect(p.word).toBe(p.word.toLowerCase());
      expect(p.sentence).toContain(p.word);
      expect(p.en).toBeTruthy();
    }
    expect(new Set(picks.map((p) => p.en)).size).toBe(picks.length);
  });

  it('builds a solvable, unrecorded lesson', () => {
    const lesson = saintLesson('San Francesco', STORY);
    expect(lesson.store).toBe('none');
    expectSolvable(lesson);
    const fill = lesson.steps.find((s) => s.direction === 'fill');
    expect(fill.prompt).toContain('____');
    expect(fill.prompt).not.toContain(fill.options[fill.answer]);
  });

  it('returns null when the text yields too little', () => {
    expect(saintLesson('X', 'Maria.')).toBeNull();
    expect(saintLesson('X', '')).toBeNull();
    expect(saintLesson('X', undefined)).toBeNull();
  });
});
