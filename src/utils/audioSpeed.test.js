import { describe, it, expect, beforeEach } from 'vitest';

import {
  SPEEDS,
  DEFAULT_SPEED_ID,
  rateForId,
  getSpeedId,
  getRate,
  setSpeedId,
  subscribe,
} from './audioSpeed';

beforeEach(() => {
  // Reset to the default between tests (the store is module-level singleton state).
  setSpeedId(DEFAULT_SPEED_ID);
});

describe('audioSpeed — speeds table', () => {
  it('offers Slow / Normal / Fast with sensible rates', () => {
    expect(SPEEDS.map((s) => s.id)).toEqual(['slow', 'normal', 'fast']);
    expect(rateForId('slow')).toBe(0.6);
    expect(rateForId('normal')).toBe(0.85);
    expect(rateForId('fast')).toBe(1);
  });

  it('defaults to Normal (byte-identical to the previous fixed rate)', () => {
    expect(DEFAULT_SPEED_ID).toBe('normal');
    expect(rateForId(DEFAULT_SPEED_ID)).toBe(0.85);
  });

  it('falls back to Normal for an unknown id', () => {
    expect(rateForId('nope')).toBe(0.85);
  });
});

describe('audioSpeed — store', () => {
  it('sets a valid speed and exposes its rate', () => {
    setSpeedId('slow');
    expect(getSpeedId()).toBe('slow');
    expect(getRate()).toBe(0.6);
  });

  it('ignores invalid ids', () => {
    setSpeedId('slow');
    setSpeedId('bogus');
    expect(getSpeedId()).toBe('slow');
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    let calls = 0;
    const unsub = subscribe(() => { calls += 1; });
    setSpeedId('fast');
    expect(calls).toBe(1);
    // No-op when the value is unchanged.
    setSpeedId('fast');
    expect(calls).toBe(1);
    unsub();
    setSpeedId('slow');
    expect(calls).toBe(1);
  });
});
