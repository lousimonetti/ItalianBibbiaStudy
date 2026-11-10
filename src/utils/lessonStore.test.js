import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY, loadLessons, completeLesson, recordLesson, isDone, isWeekComplete, weekProgress, nextAction,
} from './lessonStore';

const plan = (weekN, count) => ({
  weekN,
  lessons: Array.from({ length: count }, (_, i) => ({ key: `${weekN}.${i + 1}` })),
});
const PLANS = [plan(1, 3), plan(2, 3), plan(3, 3)];
const doneStore = (...keys) => keys.reduce((s, k) => completeLesson(s, k, 100, '2026-01-01'), { done: {} });

beforeEach(() => localStorage.clear());

describe('lesson store', () => {
  it('loads empty and survives junk', () => {
    expect(loadLessons()).toEqual({ done: {} });
    localStorage.setItem(STORAGE_KEY, 'not json');
    expect(loadLessons()).toEqual({ done: {} });
    localStorage.setItem(STORAGE_KEY, '{"done":null}');
    expect(loadLessons()).toEqual({ done: {} });
  });

  it('records a completion and reads it back', () => {
    recordLesson('1.1', 80);
    expect(isDone(loadLessons(), '1.1')).toBe(true);
    expect(isDone(loadLessons(), '1.2')).toBe(false);
  });

  it('a repeat keeps the best score and first date, and counts', () => {
    let s = completeLesson({ done: {} }, '1.1', 90, '2026-01-01');
    s = completeLesson(s, '1.1', 60, '2026-02-02');
    expect(s.done['1.1']).toEqual({ date: '2026-01-01', pct: 90, times: 2 });
  });

  it('a week is complete only when it has lessons and all are done', () => {
    expect(isWeekComplete(doneStore('1.1', '1.2'), PLANS[0].lessons)).toBe(false);
    expect(isWeekComplete(doneStore('1.1', '1.2', '1.3'), PLANS[0].lessons)).toBe(true);
    expect(isWeekComplete(doneStore(), [])).toBe(false);
  });

  it('weekProgress counts finished lessons', () => {
    expect(weekProgress(doneStore('1.1', '1.3'), PLANS[0].lessons)).toEqual({ done: 2, total: 3 });
  });
});

describe('nextAction', () => {
  it('starts with the first unfinished lesson of the current week', () => {
    const a = nextAction({ plans: PLANS, store: doneStore('2.1'), currentWeekN: 2, due: 9 });
    expect(a).toMatchObject({ kind: 'lesson', ahead: false, lesson: { key: '2.2' } });
  });

  it('turns to the review once the week is finished and cards are due', () => {
    const store = doneStore('2.1', '2.2', '2.3');
    expect(nextAction({ plans: PLANS, store, currentWeekN: 2, due: 4 })).toEqual({ kind: 'review', due: 4 });
  });

  it('offers the next week ahead of schedule when nothing is due', () => {
    const store = doneStore('2.1', '2.2', '2.3');
    const a = nextAction({ plans: PLANS, store, currentWeekN: 2, due: 0 });
    expect(a).toMatchObject({ kind: 'lesson', ahead: true, lesson: { key: '3.1' } });
  });

  it('does not send the learner back to earlier weeks', () => {
    const store = doneStore('3.1', '3.2', '3.3');
    expect(nextAction({ plans: PLANS, store, currentWeekN: 3, due: 0 })).toEqual({ kind: 'done' });
  });

  it('outside the program dates, takes the course from the top', () => {
    const a = nextAction({ plans: PLANS, store: doneStore('1.1'), currentWeekN: null, due: 3 });
    expect(a).toMatchObject({ kind: 'lesson', lesson: { key: '1.2' } });
    const all = doneStore(...PLANS.flatMap((p) => p.lessons.map((l) => l.key)));
    expect(nextAction({ plans: PLANS, store: all, currentWeekN: null, due: 3 })).toEqual({ kind: 'review', due: 3 });
    expect(nextAction({ plans: PLANS, store: all, currentWeekN: null, due: 0 })).toEqual({ kind: 'done' });
  });
});
