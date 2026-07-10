import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storageKey } from './storageKey';
import { resetSession } from './resetSession';

const STORES = ['progress', 'streak', 'srs', 'journal'];
const SESSION_KEY = storageKey('session-start');

function seedStores() {
  for (const name of STORES) localStorage.setItem(storageKey(name), '{"seed":true}');
}

function survivingStores() {
  return STORES.filter((name) => localStorage.getItem(storageKey(name)) !== null);
}

beforeEach(seedStores);

afterEach(() => {
  localStorage.removeItem(SESSION_KEY);
  for (const name of STORES) localStorage.removeItem(storageKey(name));
});

describe('resetSession', () => {
  it('always writes the session-start override', () => {
    resetSession({ startDate: '2026-07-06' });
    expect(localStorage.getItem(SESSION_KEY)).toBe('2026-07-06');
  });

  it('clears nothing when no flags are set', () => {
    resetSession({ startDate: '2026-07-06' });
    expect(survivingStores()).toEqual(STORES);
  });

  it('clears every store when all flags are set', () => {
    resetSession({
      startDate: '2026-07-06',
      resetProgress: true,
      resetStreak: true,
      resetSrs: true,
      resetJournal: true,
    });
    expect(survivingStores()).toEqual([]);
  });

  it.each([
    ['resetProgress', 'progress'],
    ['resetStreak', 'streak'],
    ['resetSrs', 'srs'],
    ['resetJournal', 'journal'],
  ])('%s clears only the %s store', (flag, store) => {
    resetSession({ startDate: '2026-07-06', [flag]: true });
    expect(survivingStores()).toEqual(STORES.filter((s) => s !== store));
  });

  it('rejects an invalid start date without touching any store', () => {
    expect(() => resetSession({ startDate: 'tomorrow', resetProgress: true })).toThrow();
    expect(survivingStores()).toEqual(STORES);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
