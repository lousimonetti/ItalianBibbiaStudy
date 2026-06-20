import { describe, it, expect } from 'vitest';
import {
  todayStr, dayBefore, withActivity, setFlag, currentStreak, todayFlags,
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
