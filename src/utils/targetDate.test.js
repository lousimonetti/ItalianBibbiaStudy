import { describe, it, expect, afterEach, vi } from 'vitest';
import { config } from '../../course/config';
import {
  startForEndDate, actualEndForEndDate, snapToWeekEnd, planForEndDate,
} from './targetDate';
import {
  getEndDate, setSessionStart, clearSessionStart, parseLocalDate, todayISO,
} from './sessionStart';

const WEEKS = config.schedule.weeks; // 37 for the reference course
const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const weekdayOf = (isoStr) =>
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseLocalDate(isoStr).getDay()];

afterEach(() => {
  vi.useRealTimers();
  clearSessionStart();
});

describe('snapToWeekEnd', () => {
  it('leaves a Sunday alone', () => {
    expect(iso(snapToWeekEnd(parseLocalDate('2027-05-16')))).toBe('2027-05-16');
    expect(weekdayOf('2027-05-16')).toBe('Sun');
  });

  it('moves any other day back to the Sunday before it', () => {
    // Mon 2027-05-17 → Sun 2027-05-16
    expect(iso(snapToWeekEnd(parseLocalDate('2027-05-17')))).toBe('2027-05-16');
    // Sat 2027-05-22 → Sun 2027-05-16
    expect(iso(snapToWeekEnd(parseLocalDate('2027-05-22')))).toBe('2027-05-16');
  });

  it('crosses a month and a year boundary correctly', () => {
    expect(iso(snapToWeekEnd(parseLocalDate('2027-01-01')))).toBe('2026-12-27');
  });
});

describe('startForEndDate', () => {
  it('always lands on a Monday, so the daily checklist stays aligned', () => {
    for (const end of ['2027-05-16', '2027-05-17', '2027-05-22', '2026-12-25', '2028-02-29']) {
      expect(weekdayOf(startForEndDate(end)), end).toBe('Mon');
    }
  });

  it('reproduces the course calendar from its own end date', () => {
    // The reference course runs Mon 2026-04-13 → Sun 2026-12-27.
    expect(startForEndDate('2026-12-27')).toBe('2026-04-13');
  });

  it('rejects malformed and impossible dates', () => {
    for (const bad of ['', null, undefined, 'tomorrow', '2026-13-01', '2026-02-31', '26-04-13']) {
      expect(startForEndDate(bad), String(bad)).toBe(null);
    }
  });

  it('rejects a nonsense week count', () => {
    expect(startForEndDate('2027-05-16', 0)).toBe(null);
    expect(startForEndDate('2027-05-16', 2.5)).toBe(null);
  });

  it('honours a non-default week count', () => {
    // 10 weeks back from Sun 2027-05-16 is Mon 2027-03-08.
    expect(startForEndDate('2027-05-16', 10)).toBe('2027-03-08');
  });
});

// The invariant that keeps startForEndDate and getEndDate honest: committing
// the derived start must produce an end date on or before the one asked for,
// and never more than six days earlier. A future edit to either side breaks it.
describe('round-trip against getEndDate()', () => {
  const targets = [
    '2026-12-25', '2026-12-27', '2027-01-01', '2027-03-14', '2027-05-16',
    '2027-05-17', '2027-08-31', '2028-02-29', '2028-03-01',
  ];

  it('finishes on or before the requested date, within six days', () => {
    for (const target of targets) {
      setSessionStart(startForEndDate(target));
      const delivered = getEndDate();
      const requested = parseLocalDate(target);
      const driftDays = Math.round((requested - delivered) / 86400000);
      expect(delivered.getTime(), target).toBeLessThanOrEqual(requested.getTime());
      expect(driftDays, target).toBeLessThanOrEqual(6);
      expect(driftDays, target).toBeGreaterThanOrEqual(0);
    }
  });

  it('is exact when the requested date is already a Sunday', () => {
    for (const target of targets.filter((t) => weekdayOf(t) === 'Sun')) {
      setSessionStart(startForEndDate(target));
      expect(iso(getEndDate()), target).toBe(target);
    }
  });

  it('agrees with actualEndForEndDate without touching storage', () => {
    for (const target of targets) {
      setSessionStart(startForEndDate(target));
      expect(iso(getEndDate()), target).toBe(actualEndForEndDate(target));
    }
  });

  // The Apr→Dec span crosses a DST transition, and getCurrentWeekN uses
  // fixed-millisecond division while getEndDate uses calendar arithmetic.
  // Pin the crossing rather than trusting it.
  it('holds across a DST transition', () => {
    const start = startForEndDate('2026-12-27');
    setSessionStart(start);
    expect(iso(getEndDate())).toBe('2026-12-27');
    expect(planForEndDate('2026-12-27', { today: '2026-04-13' }).startWeekN).toBe(1);
    expect(planForEndDate('2026-12-27', { today: '2026-12-27' }).startWeekN).toBe(WEEKS);
  });
});

describe('planForEndDate — comfortable target (plenty of time)', () => {
  const plan = () => planForEndDate('2028-05-14', { today: '2026-08-31' });

  it('is valid and starts in the future', () => {
    const p = plan();
    expect(p.valid).toBe(true);
    expect(p.reason).toBe(null);
    expect(p.startsInFuture).toBe(true);
    expect(p.daysUntilStart).toBeGreaterThan(0);
  });

  it('skips nothing and reports no current week', () => {
    const p = plan();
    expect(p.startWeekN).toBe(null);
    expect(p.skippedWeeks).toBe(0);
  });
});

describe('planForEndDate — tight target (not enough time)', () => {
  // Today Mon 2026-08-31; asking to finish by Sun 2026-12-27 leaves 17 weeks
  // of a 37-week program, so the program must already be underway.
  const plan = () => planForEndDate('2026-12-27', { today: '2026-08-31' });

  it('is valid but starts in the past', () => {
    const p = plan();
    expect(p.valid).toBe(true);
    expect(p.startsInFuture).toBe(false);
    expect(p.start).toBe('2026-04-13');
  });

  it('reports the week the learner would land in and what is skipped', () => {
    const p = plan();
    expect(p.startWeekN).toBe(21);
    expect(p.skippedWeeks).toBe(20);
    expect(p.startWeekN + p.weeksAvailable - 1).toBe(WEEKS);
  });
});

describe('planForEndDate — exact target', () => {
  it('starts today when the target is exactly one program away', () => {
    // Mon 2026-08-31 + 37 weeks − 1 day = Sun 2027-05-16.
    const p = planForEndDate('2027-05-16', { today: '2026-08-31' });
    expect(p.start).toBe('2026-08-31');
    expect(p.startWeekN).toBe(1);
    expect(p.skippedWeeks).toBe(0);
    expect(p.startsInFuture).toBe(false);
    expect(p.weeksAvailable).toBe(WEEKS);
  });
});

describe('planForEndDate — the snap is reported, never hidden', () => {
  it('flags when the delivered end date moved earlier than requested', () => {
    const p = planForEndDate('2027-05-20', { today: '2026-08-31' }); // a Thursday
    expect(p.snapped).toBe(true);
    expect(p.requestedEnd).toBe('2027-05-20');
    expect(p.end).toBe('2027-05-16');
    expect(parseLocalDate(p.end).getTime()).toBeLessThan(parseLocalDate('2027-05-20').getTime());
  });

  it('does not flag a snap when the request is already a week end', () => {
    const p = planForEndDate('2027-05-16', { today: '2026-08-31' });
    expect(p.snapped).toBe(false);
    expect(p.end).toBe(p.requestedEnd);
  });
});

describe('planForEndDate — rejections', () => {
  it('rejects a malformed date', () => {
    for (const bad of ['', null, 'next June', '2026-02-31']) {
      const p = planForEndDate(bad, { today: '2026-08-31' });
      expect(p.valid, String(bad)).toBe(false);
      expect(p.reason, String(bad)).toBe('malformed');
    }
  });

  it('rejects a finish line that is already behind us', () => {
    const p = planForEndDate('2026-01-04', { today: '2026-08-31' });
    expect(p.valid).toBe(false);
    expect(p.reason).toBe('past');
  });

  it('rejects a date that only becomes past after snapping', () => {
    // Wed 2026-09-02 snaps back to Sun 2026-08-30, which is before today.
    const p = planForEndDate('2026-09-02', { today: '2026-08-31' });
    expect(p.valid).toBe(false);
    expect(p.reason).toBe('past');
  });

  it('defaults `today` to the real clock', () => {
    vi.setSystemTime(new Date(2026, 7, 31, 12));
    expect(planForEndDate('2027-05-16').start).toBe('2026-08-31');
    expect(todayISO()).toBe('2026-08-31');
  });
});
