import { describe, it, expect } from 'vitest';
import { shouldNotify, DEFAULT_HOUR } from './reminders.js';

const at = (h) => new Date(2026, 5, 20, h, 0, 0);
const base = { enabled: true, permission: 'granted', hour: 19, lastNotified: null };

describe('shouldNotify', () => {
  it('fires when enabled, granted, unstudied, past the hour, not yet notified today', () => {
    expect(shouldNotify(base, { now: at(20), studiedToday: false, today: '2026-06-20' })).toBe(true);
  });

  it('does not fire before the reminder hour', () => {
    expect(shouldNotify(base, { now: at(18), studiedToday: false, today: '2026-06-20' })).toBe(false);
  });

  it('does not fire if already studied today', () => {
    expect(shouldNotify(base, { now: at(20), studiedToday: true, today: '2026-06-20' })).toBe(false);
  });

  it('does not fire twice in one day', () => {
    const prefs = { ...base, lastNotified: '2026-06-20' };
    expect(shouldNotify(prefs, { now: at(21), studiedToday: false, today: '2026-06-20' })).toBe(false);
  });

  it('respects disabled and missing permission', () => {
    expect(shouldNotify({ ...base, enabled: false }, { now: at(20), today: '2026-06-20' })).toBe(false);
    expect(shouldNotify({ ...base, permission: 'default' }, { now: at(20), today: '2026-06-20' })).toBe(false);
  });

  it('falls back to the default hour when unset', () => {
    const prefs = { enabled: true, permission: 'granted', lastNotified: null };
    expect(shouldNotify(prefs, { now: at(DEFAULT_HOUR), today: '2026-06-20' })).toBe(true);
    expect(shouldNotify(prefs, { now: at(DEFAULT_HOUR - 1), today: '2026-06-20' })).toBe(false);
  });

  it('returns false for null prefs', () => {
    expect(shouldNotify(null, {})).toBe(false);
  });
});
