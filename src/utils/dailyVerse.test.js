import { describe, it, expect, beforeEach } from 'vitest';
import { PHASES } from '../data/studyData';
import { verseRefs } from './keyVerses';
import { verseForDay, verseLesson, firstLetters, loadDailyVerse, recordDailyVerse } from './dailyVerse';
import { checkStep, solutionFor, isReady, isGraded, startRun, advance, currentStep, isFinished, srsGrades } from './lessonPlan';

const WEEKS = PHASES.flatMap((p) => p.weeks);
const ALL = WEEKS.flatMap((w) => verseRefs(w).map((row) => ({ row, week: w })));

beforeEach(() => localStorage.clear());

describe('verseForDay', () => {
  it('walks the week\'s passage in order across its seven days', () => {
    for (const week of WEEKS) {
      const rows = verseRefs(week);
      const picks = [0, 1, 2, 3, 4, 5, 6].map((d) => verseForDay({ weeks: WEEKS, currentWeekN: week.n, dayIndex: d }));
      const at = picks.map((p) => rows.findIndex((r) => r.id === p.id));
      expect(at[0], `week ${week.n}`).toBe(0);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      expect(new Set(at).size, `week ${week.n} repeats a verse`).toBe(Math.min(7, rows.length));
      expect(picks.every((p) => p.weekN === week.n)).toBe(true);
    }
  });

  it('carries the verses on either side', () => {
    const rows = verseRefs(WEEKS[0]);
    const first = verseForDay({ weeks: WEEKS, currentWeekN: 1, dayIndex: 0 });
    expect(first.prev).toBeNull();
    expect(first.next.t).toBe(rows[1].t);
  });

  it('outside the program deals a verse from the whole course, the same all day', () => {
    const a = verseForDay({ weeks: WEEKS, currentWeekN: null, dateStr: '2027-03-01' });
    const b = verseForDay({ weeks: WEEKS, currentWeekN: null, dateStr: '2027-03-01' });
    const c = verseForDay({ weeks: WEEKS, currentWeekN: null, dateStr: '2027-03-02' });
    expect(a.id).toBe(b.id);
    expect(c.id).not.toBe(a.id);
    expect(verseForDay({ weeks: [], currentWeekN: null, dateStr: '2027-03-01' })).toBeNull();
  });
});

describe('verseLesson', () => {
  const lessons = ALL.map(({ row, week }) => verseLesson(row, verseRefs(week)));

  it('builds a lesson for every verse in the course, each solvable', () => {
    for (const lesson of lessons) {
      expect(lesson.steps[0].kind).toBe('line');
      expect(lesson.steps.filter(isGraded).length, lesson.key).toBeGreaterThanOrEqual(2);
      for (const step of lesson.steps) {
        if (!isGraded(step)) continue;
        const value = solutionFor(step);
        expect(isReady(step, value), `${lesson.key} ${step.kind}`).toBe(true);
        expect(checkStep(step, value).correct, `${lesson.key} ${step.kind}`).toBe(true);
      }
    }
  });

  it('never leaves a blank\'s answer on screen', () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        const rest = step.kind === 'cloze' ? `${step.before} ${step.after}`
          : step.direction === 'fill' ? step.prompt : null;
        if (rest === null) continue;
        const answer = step.kind === 'cloze' ? step.answer : step.options[step.answer];
        const words = rest.toLowerCase().match(/[a-zà-ÿ]+/g) || [];
        expect(words, `${lesson.key}: ${rest}`).not.toContain(answer.toLowerCase());
      }
    }
  });

  it('is deterministic, unrecorded, and never grades into the SRS', () => {
    const { row, week } = ALL[0];
    const lesson = verseLesson(row, verseRefs(week));
    expect(verseLesson(row, verseRefs(week))).toEqual(lesson);
    expect(lesson.store).toBe('none');
    let run = startRun(lesson);
    while (!isFinished(run)) run = advance(run, isGraded(currentStep(run)) ? true : null);
    expect(srsGrades(lesson, run, {})).toEqual([]);
  });

  it('teaches the first-letters trick with the verse\'s own initials', () => {
    expect(firstLetters('In principio era il Verbo, e il Verbo era Dio.')).toBe('I p e i V e i V e D');
    const tip = lessons[0].steps.find((s) => s.kind === 'tip');
    expect(tip.body.startsWith(firstLetters(ALL[0].row.t))).toBe(true);
  });
});

describe('the done-today store', () => {
  it('counts a day once', () => {
    expect(loadDailyVerse()).toEqual({ last: null, days: 0 });
    recordDailyVerse('2026-11-13');
    recordDailyVerse('2026-11-13');
    expect(loadDailyVerse()).toEqual({ last: '2026-11-13', days: 1 });
    recordDailyVerse('2026-11-14');
    expect(loadDailyVerse().days).toBe(2);
  });
});
