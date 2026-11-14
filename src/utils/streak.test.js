import { describe, it, expect } from 'vitest';
import {
  todayStr, dayBefore, withActivity, setFlag, currentStreak, todayFlags,
  streakStart, dueMilestone, weekStrip,
} from './streak.js';

describe('date helpers', () => {
  it('todayStr formats a date as local YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 5, 20))).toBe('2026-06-20');
  });
  it('dayBefore steps back one day, across month boundaries', () => {
    expect(dayBefore('2026-06-20')).toBe('2026-06-19');
    expect(dayBefore('2026-07-01')).toBe('2026-06-30');
  });
});

describe('withActivity', () => {
  it('starts a streak at 1 from empty', () => {
    const s = withActivity({}, '2026-06-20');
    expect(s.current).toBe(1);
    expect(s.best).toBe(1);
    expect(s.last).toBe('2026-06-20');
  });
  it('increments on a consecutive day', () => {
    let s = withActivity({}, '2026-06-19');
    s = withActivity(s, '2026-06-20');
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });
  it('is idempotent within the same day', () => {
    let s = withActivity({}, '2026-06-20');
    s = withActivity(s, '2026-06-20');
    expect(s.current).toBe(1);
  });
  it('resets to 1 after a missed day but keeps best', () => {
    let s = withActivity({}, '2026-06-18');
    s = withActivity(s, '2026-06-19'); // current 2
    s = withActivity(s, '2026-06-22'); // gap → reset
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });
});

describe('setFlag', () => {
  it('sets a flag and advances the streak', () => {
    const s = setFlag({}, 'practiced', '2026-06-20');
    expect(s.today).toMatchObject({ date: '2026-06-20', practiced: true, read: false, journaled: false });
    expect(s.current).toBe(1);
  });
  it('resets today flags when the date rolls over', () => {
    let s = setFlag({}, 'read', '2026-06-20');
    s = setFlag(s, 'practiced', '2026-06-21');
    expect(s.today).toMatchObject({ date: '2026-06-21', read: false, practiced: true });
    expect(s.current).toBe(2);
  });
});

describe('currentStreak', () => {
  it('returns the streak when last active is today or yesterday', () => {
    const s = { current: 5, last: '2026-06-20' };
    expect(currentStreak(s, '2026-06-20')).toBe(5);
    expect(currentStreak(s, '2026-06-21')).toBe(5);
  });
  it('returns 0 when the streak is broken by a gap', () => {
    const s = { current: 5, last: '2026-06-20' };
    expect(currentStreak(s, '2026-06-23')).toBe(0);
  });
  it('returns 0 for an empty store', () => {
    expect(currentStreak({}, '2026-06-20')).toBe(0);
  });
});

describe('todayFlags', () => {
  it('returns stored flags for today, fresh otherwise', () => {
    const s = { today: { date: '2026-06-20', read: true, practiced: false, journaled: false } };
    expect(todayFlags(s, '2026-06-20').read).toBe(true);
    expect(todayFlags(s, '2026-06-21')).toEqual({ date: '2026-06-21', read: false, practiced: false, journaled: false });
  });
});

describe('streak milestones', () => {
  it('names the run by its start, so a broken-and-rebuilt streak is new', () => {
    expect(streakStart('2026-11-10', 7)).toBe('2026-11-04');
    expect(streakStart('2026-11-10', 1)).toBe('2026-11-10');
  });

  it('is due on a milestone length not yet celebrated', () => {
    const store = { last: '2026-11-10', current: 7 };
    expect(dueMilestone(store, 7, null)).toEqual({ n: 7, id: '7@2026-11-04' });
    expect(dueMilestone(store, 7, '7@2026-11-04')).toBeNull();
  });

  it('celebrates the same length again for a new run', () => {
    const store = { last: '2026-12-20', current: 7 };
    expect(dueMilestone(store, 7, '7@2026-11-04')).toEqual({ n: 7, id: '7@2026-12-14' });
  });

  it('ignores lengths that are not milestones and an empty store', () => {
    expect(dueMilestone({ last: '2026-11-10', current: 8 }, 8, null)).toBeNull();
    expect(dueMilestone({}, 7, null)).toBeNull();
  });
});

describe('weekStrip', () => {
  it('is seven days ending today, oldest first', () => {
    const days = weekStrip({}, '2026-11-14'); // a Saturday
    expect(days.map((d) => d.date)).toEqual([
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14',
    ]);
    expect(days.map((d) => d.label).join('')).toBe('SMTWTFS');
    expect(days.filter((d) => d.today).map((d) => d.date)).toEqual(['2026-11-14']);
    expect(days.some((d) => d.done)).toBe(false);
  });
  it('marks the days of the current run, including today', () => {
    const days = weekStrip({ last: '2026-11-14', current: 3 }, '2026-11-14');
    expect(days.filter((d) => d.done).map((d) => d.date)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
  });
  it('leaves today open when the run ended yesterday', () => {
    const days = weekStrip({ last: '2026-11-13', current: 2 }, '2026-11-14');
    expect(days.filter((d) => d.done).map((d) => d.date)).toEqual(['2026-11-12', '2026-11-13']);
  });
  it('shows nothing for a broken run', () => {
    expect(weekStrip({ last: '2026-11-11', current: 5 }, '2026-11-14').some((d) => d.done)).toBe(false);
  });
  it('caps a long run at the seven days shown', () => {
    expect(weekStrip({ last: '2026-11-14', current: 40 }, '2026-11-14').every((d) => d.done)).toBe(true);
  });
});
