import { describe, it, expect } from 'vitest';
import { SAINTS } from '../data/saintsCalendar.js';
import {
  dateKey,
  saintForDate,
  addDays,
  summaryUrl,
  searchUrl,
  articleUrl,
  withCached,
} from './saints.js';

describe('SAINTS calendar', () => {
  it('covers all 366 days of the year, including Feb 29', () => {
    expect(Object.keys(SAINTS)).toHaveLength(366);
    expect(SAINTS['02-29']).toBeTruthy();
    // walk a leap year day-by-day: every date must resolve
    const d = new Date(2028, 0, 1);
    for (let i = 0; i < 366; i++) {
      expect(SAINTS[dateKey(d)], dateKey(d)).toBeTruthy();
      d.setDate(d.getDate() + 1);
    }
  });

  it('every entry has a display name and both wiki titles', () => {
    for (const [key, s] of Object.entries(SAINTS)) {
      expect(s.name?.trim(), key).toBeTruthy();
      expect(s.it?.trim(), key).toBeTruthy();
      expect(s.en?.trim(), key).toBeTruthy();
    }
  });

  it('keys are well-formed MM-DD dates', () => {
    for (const key of Object.keys(SAINTS)) {
      expect(key).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
    }
  });
});

describe('dateKey / saintForDate / addDays', () => {
  it('formats month-day with zero padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('01-05');
    expect(dateKey(new Date(2026, 11, 25))).toBe('12-25');
  });

  it('resolves the saint for a date', () => {
    const s = saintForDate(new Date(2026, 9, 4)); // Oct 4
    expect(s.key).toBe('10-04');
    expect(s.name).toContain('Francesco');
  });

  it('addDays crosses month and year boundaries without mutating', () => {
    const d = new Date(2026, 11, 31);
    const next = addDays(d, 1);
    expect(dateKey(next)).toBe('01-01');
    expect(dateKey(d)).toBe('12-31');
    expect(dateKey(addDays(next, -1))).toBe('12-31');
  });
});

describe('wiki URL builders', () => {
  it('builds REST summary URLs with underscores and encoding', () => {
    expect(summaryUrl('it', "Francesco d'Assisi")).toBe(
      "https://it.wikipedia.org/api/rest_v1/page/summary/Francesco_d'Assisi"
    );
    expect(summaryUrl('en', 'Mary, mother of Jesus')).toContain('en.wikipedia.org');
    expect(summaryUrl('en', 'Mary, mother of Jesus')).toContain('Mary%2C_mother_of_Jesus');
  });

  it('builds CORS-enabled opensearch URLs', () => {
    const u = searchUrl('it', 'San Gennaro');
    expect(u).toContain('action=opensearch');
    expect(u).toContain('origin=*');
    expect(u).toContain('San%20Gennaro');
  });

  it('builds article links', () => {
    expect(articleUrl('it', 'Papa Leone I')).toBe('https://it.wikipedia.org/wiki/Papa_Leone_I');
  });
});

describe('withCached', () => {
  it('adds entries with a savedAt stamp, without mutating', () => {
    const c0 = {};
    const c1 = withCached(c0, '10-04', { name: 'x' }, 40, 123);
    expect(c0).toEqual({});
    expect(c1['10-04'].savedAt).toBe(123);
  });

  it('evicts the oldest entries beyond max', () => {
    let cache = {};
    for (let i = 1; i <= 5; i++) {
      cache = withCached(cache, `k${i}`, { i }, 3, i);
    }
    expect(Object.keys(cache).sort()).toEqual(['k3', 'k4', 'k5']);
  });
});
