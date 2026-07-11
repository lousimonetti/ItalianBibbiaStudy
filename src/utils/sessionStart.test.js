import { describe, it, expect, afterEach } from 'vitest';
import { config } from '../../course/config';
import { storageKey } from './storageKey';
import {
  getSessionStart,
  getSessionStartOverride,
  setSessionStart,
  clearSessionStart,
  getEndDate,
  getSessionStartLabel,
  getEndDateLabel,
  formatDateLabel,
  parseLocalDate,
  todayISO,
} from './sessionStart';

const KEY = storageKey('session-start');

afterEach(() => {
  localStorage.removeItem(KEY);
});

describe('getSessionStart / override', () => {
  it('falls back to the course startDate with no override', () => {
    expect(getSessionStartOverride()).toBeNull();
    expect(getSessionStart()).toBe(config.schedule.startDate);
  });

  it('returns the override once set', () => {
    setSessionStart('2026-07-06');
    expect(getSessionStartOverride()).toBe('2026-07-06');
    expect(getSessionStart()).toBe('2026-07-06');
  });

  it('ignores a malformed stored value', () => {
    localStorage.setItem(KEY, 'not-a-date');
    expect(getSessionStartOverride()).toBeNull();
    expect(getSessionStart()).toBe(config.schedule.startDate);
  });

  it('clearSessionStart reverts to the course default', () => {
    setSessionStart('2026-07-06');
    clearSessionStart();
    expect(getSessionStart()).toBe(config.schedule.startDate);
  });

  it('setSessionStart rejects a non-ISO date', () => {
    expect(() => setSessionStart('06/07/2026')).toThrow();
    expect(() => setSessionStart('')).toThrow();
  });

  it('stores the plain ISO string (iOS backup interop format)', () => {
    setSessionStart('2026-07-06');
    expect(localStorage.getItem(KEY)).toBe('2026-07-06');
  });
});

describe('getEndDate', () => {
  it('is the last day of the final week on the default calendar', () => {
    // Apr 13, 2026 + 37*7 − 1 days = Dec 27, 2026
    const end = getEndDate();
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(27);
  });

  it('tracks the override', () => {
    setSessionStart('2026-07-06');
    // Jul 6, 2026 + 258 days = Mar 21, 2027
    const end = getEndDate();
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(2);
    expect(end.getDate()).toBe(21);
  });
});

describe('labels', () => {
  it('formats dates with fixed English month abbreviations', () => {
    expect(formatDateLabel(new Date(2026, 3, 13))).toBe('Apr 13, 2026');
    expect(formatDateLabel(new Date(2026, 11, 27))).toBe('Dec 27, 2026');
  });

  it('getSessionStartLabel / getEndDateLabel reflect the session', () => {
    expect(getSessionStartLabel()).toBe('Apr 13, 2026');
    expect(getEndDateLabel()).toBe('Dec 27, 2026');
    setSessionStart('2026-07-06');
    expect(getSessionStartLabel()).toBe('Jul 6, 2026');
    expect(getEndDateLabel()).toBe('Mar 21, 2027');
  });
});

describe('helpers', () => {
  it('parseLocalDate builds a local-midnight date', () => {
    const d = parseLocalDate('2026-04-13');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(13);
    expect(d.getHours()).toBe(0);
  });

  it('todayISO is YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
