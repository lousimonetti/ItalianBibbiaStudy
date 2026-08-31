import { describe, it, expect, afterEach, vi } from 'vitest';
import { getCurrentWeekN, getTodayDayIndex, weekRangeLabel, weekDateLabel, weekNumberFor, weekDayLabels } from './schedule.js';
import { setSessionStart, clearSessionStart } from './sessionStart.js';

// Apr 13, 2026 is a Monday — verified: new Date(2026, 3, 13).getDay() === 1
const PROGRAM_START = new Date(2026, 3, 13);

afterEach(() => {
  vi.useRealTimers();
  clearSessionStart();
});

describe('getCurrentWeekN', () => {
  it('returns null one day before program start', () => {
    vi.setSystemTime(new Date(2026, 3, 12));
    expect(getCurrentWeekN()).toBeNull();
  });

  it('returns null well before program start', () => {
    vi.setSystemTime(new Date(2025, 0, 1));
    expect(getCurrentWeekN()).toBeNull();
  });

  it('returns 1 on the first day of the program', () => {
    vi.setSystemTime(new Date(2026, 3, 13));
    expect(getCurrentWeekN()).toBe(1);
  });

  it('returns 1 on the last day of week 1', () => {
    vi.setSystemTime(new Date(2026, 3, 19, 23, 59, 59));
    expect(getCurrentWeekN()).toBe(1);
  });

  it('returns 2 on the first day of week 2', () => {
    vi.setSystemTime(new Date(2026, 3, 20));
    expect(getCurrentWeekN()).toBe(2);
  });

  it('returns the correct week mid-program', () => {
    // Week 19 starts 18 * 7 = 126 days after Apr 13 → Aug 17, 2026
    const week19Start = new Date(PROGRAM_START.getTime() + 18 * 7 * 24 * 3600 * 1000);
    vi.setSystemTime(week19Start);
    expect(getCurrentWeekN()).toBe(19);
  });

  it('returns 37 on the first day of the final week', () => {
    // Week 37 starts 36 * 7 = 252 days after Apr 13 → Dec 21, 2026
    const week37Start = new Date(PROGRAM_START.getTime() + 36 * 7 * 24 * 3600 * 1000);
    vi.setSystemTime(week37Start);
    expect(getCurrentWeekN()).toBe(37);
  });

  it('returns 37 on the last day of the final week', () => {
    const week37End = new Date(PROGRAM_START.getTime() + (37 * 7 - 1) * 24 * 3600 * 1000);
    vi.setSystemTime(week37End);
    expect(getCurrentWeekN()).toBe(37);
  });

  it('returns null one week after the program ends', () => {
    const afterEnd = new Date(PROGRAM_START.getTime() + 38 * 7 * 24 * 3600 * 1000);
    vi.setSystemTime(afterEnd);
    expect(getCurrentWeekN()).toBeNull();
  });

  it('returns a value between 1 and 37 during the program', () => {
    vi.setSystemTime(new Date(2026, 8, 1)); // Sep 1, 2026
    const n = getCurrentWeekN();
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(37);
  });
});

describe('getCurrentWeekN with a session-start override', () => {
  it('computes the week from the override, not the course startDate', () => {
    setSessionStart('2026-07-06'); // a Monday well after the authored start
    vi.setSystemTime(new Date(2026, 6, 10)); // Jul 10 — week 13 of the default calendar
    expect(getCurrentWeekN()).toBe(1);
    vi.setSystemTime(new Date(2026, 6, 13)); // Jul 13 — first day of override week 2
    expect(getCurrentWeekN()).toBe(2);
  });

  it('returns null before an override start in the future', () => {
    setSessionStart('2026-08-01');
    vi.setSystemTime(new Date(2026, 6, 10));
    expect(getCurrentWeekN()).toBeNull();
  });

  it('reverts to the course calendar after clearSessionStart, without a module reload', () => {
    setSessionStart('2026-07-06');
    vi.setSystemTime(new Date(2026, 6, 10));
    expect(getCurrentWeekN()).toBe(1);
    clearSessionStart();
    expect(getCurrentWeekN()).toBe(13); // Apr 13 + 88 days
  });
});

describe('weekRangeLabel / weekDateLabel', () => {
  it('labels week 1 of the default calendar', () => {
    expect(weekRangeLabel(1)).toBe('Apr 13-19');
  });

  it('labels a week that spans a month boundary', () => {
    expect(weekRangeLabel(3)).toBe('Apr 27-May 3'); // Apr 27 – May 3
  });

  it('follows the override', () => {
    setSessionStart('2026-07-06');
    expect(weekRangeLabel(1)).toBe('Jul 6-12');
  });

  it('rejects out-of-range week numbers', () => {
    expect(weekRangeLabel(0)).toBeNull();
    expect(weekRangeLabel(null)).toBeNull();
  });

  it('weekDateLabel keeps the authored string on the default calendar', () => {
    const week = { n: 1, d: 'Apr 13–19' };
    expect(weekDateLabel(week)).toBe('Apr 13–19');
  });

  it('weekDateLabel computes the range once an override is active', () => {
    setSessionStart('2026-07-06');
    const week = { n: 1, d: 'Apr 13–19' };
    expect(weekDateLabel(week)).toBe('Jul 6-12');
  });
});

describe('getTodayDayIndex', () => {
  it('returns 0 for Monday', () => {
    vi.setSystemTime(new Date(2026, 3, 13)); // Apr 13, 2026 is Monday
    expect(getTodayDayIndex()).toBe(0);
  });

  it('returns 1 for Tuesday', () => {
    vi.setSystemTime(new Date(2026, 3, 14));
    expect(getTodayDayIndex()).toBe(1);
  });

  it('returns 2 for Wednesday', () => {
    vi.setSystemTime(new Date(2026, 3, 15));
    expect(getTodayDayIndex()).toBe(2);
  });

  it('returns 4 for Friday', () => {
    vi.setSystemTime(new Date(2026, 3, 17));
    expect(getTodayDayIndex()).toBe(4);
  });

  it('returns 5 for Saturday', () => {
    vi.setSystemTime(new Date(2026, 3, 18));
    expect(getTodayDayIndex()).toBe(5);
  });

  it('returns 6 for Sunday', () => {
    vi.setSystemTime(new Date(2026, 3, 19));
    expect(getTodayDayIndex()).toBe(6);
  });

  it('always returns a value between 0 and 6', () => {
    const idx = getTodayDayIndex();
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(6);
  });
});

describe('weekNumberFor', () => {
  it('answers for an explicit start, without consulting storage', () => {
    const start = '2026-04-13';
    expect(weekNumberFor(start, 37, new Date(2026, 3, 13).getTime())).toBe(1);
    expect(weekNumberFor(start, 37, new Date(2026, 3, 19).getTime())).toBe(1);
    expect(weekNumberFor(start, 37, new Date(2026, 3, 20).getTime())).toBe(2);
  });

  it('returns null before the start and after the final week', () => {
    const start = '2026-04-13';
    expect(weekNumberFor(start, 37, new Date(2026, 3, 12).getTime())).toBeNull();
    // Week 37 ends Dec 27, 2026; Dec 28 is past the end.
    expect(weekNumberFor(start, 37, new Date(2026, 11, 27).getTime())).toBe(37);
    expect(weekNumberFor(start, 37, new Date(2026, 11, 28).getTime())).toBeNull();
  });

  it('returns null for a malformed start', () => {
    for (const bad of ['', null, undefined, 'nonsense']) {
      expect(weekNumberFor(bad, 37, Date.now()), String(bad)).toBeNull();
    }
  });

  it('is what getCurrentWeekN delegates to', () => {
    vi.setSystemTime(new Date(2026, 7, 31));
    setSessionStart('2026-04-13');
    expect(getCurrentWeekN()).toBe(weekNumberFor('2026-04-13', 37, Date.now()));
  });
});

// getTodayDayIndex changed from wall-clock weekday to offset-from-start so the
// daily checklist works for a session that does not begin on a Monday. For the
// reference course — which starts Mon Apr 13, 2026 — the two must agree
// exactly, so existing users see no change at all. This pins that.
describe('getTodayDayIndex — offset from start', () => {
  const wallClock = (d) => (d.getDay() + 6) % 7; // the formula it replaced

  it('matches the old wall-clock formula on the Monday-aligned course calendar', () => {
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(2026, 3, 13 + i);
      vi.setSystemTime(day);
      expect(getTodayDayIndex(), day.toDateString()).toBe(wallClock(day));
    }
  });

  it('still matches deep into the program, not just in week 1', () => {
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(2026, 7, 31 + i); // week 21, a Monday-start week
      vi.setSystemTime(day);
      expect(getTodayDayIndex(), day.toDateString()).toBe(wallClock(day));
    }
  });

  it('counts from the start date for a session that begins mid-week', () => {
    setSessionStart('2026-09-02'); // a Wednesday
    vi.setSystemTime(new Date(2026, 8, 2));
    expect(getTodayDayIndex()).toBe(0); // day 1 of the program week
    vi.setSystemTime(new Date(2026, 8, 3));
    expect(getTodayDayIndex()).toBe(1);
    vi.setSystemTime(new Date(2026, 8, 8)); // the following Tuesday closes it
    expect(getTodayDayIndex()).toBe(6);
    vi.setSystemTime(new Date(2026, 8, 9)); // next week wraps around
    expect(getTodayDayIndex()).toBe(0);
  });

  it('shows the first day when the program has not started yet', () => {
    setSessionStart('2027-01-04');
    vi.setSystemTime(new Date(2026, 8, 1));
    expect(getTodayDayIndex()).toBe(0);
  });
});

describe('weekDayLabels', () => {
  it('is Mon…Sun for the Monday-aligned course calendar', () => {
    vi.setSystemTime(new Date(2026, 3, 13));
    expect(weekDayLabels(1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('follows the real weekdays for a mid-week start', () => {
    setSessionStart('2026-09-02'); // Wednesday
    expect(weekDayLabels(1)).toEqual(['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue']);
  });

  it('stays consistent for a later week', () => {
    setSessionStart('2026-09-02');
    expect(weekDayLabels(5)).toEqual(['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue']);
  });
});
