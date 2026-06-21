import { describe, it, expect } from 'vitest';
import { storageKey, STORAGE_PREFIX } from './storageKey.js';
import { config } from '../../course/config.js';

describe('storageKey', () => {
  it('prefixes with the course storage prefix', () => {
    expect(storageKey('progress')).toBe(`${STORAGE_PREFIX}-progress`);
  });

  it('keeps the reference course on its historical prefix (no migration)', () => {
    // The bundled Italian course must keep `italian-bible-*` so existing data
    // survives. If this fails, existing users would lose progress/srs/streak.
    expect(STORAGE_PREFIX).toBe('italian-bible');
    expect(storageKey('srs')).toBe('italian-bible-srs');
    expect(storageKey('streak')).toBe('italian-bible-streak');
  });

  it('derives the prefix from config.storagePrefix', () => {
    expect(STORAGE_PREFIX).toBe(config.storagePrefix);
  });
});
