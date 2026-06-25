import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportSnapshot,
  importSnapshot,
  validateSnapshot,
  encode,
  decode,
  SNAPSHOT_VERSION,
} from './syncSnapshot';
import { STORAGE_PREFIX, storageKey } from './storageKey';

beforeEach(() => {
  localStorage.clear();
});

describe('exportSnapshot', () => {
  it('collects only this course\'s keys', () => {
    localStorage.setItem(storageKey('progress'), '{"1":true}');
    localStorage.setItem(storageKey('srs'), '{"verbo":{}}');
    localStorage.setItem('coursekit-active-course', 'italian-bible'); // device-level, excluded
    localStorage.setItem('unrelated-key', 'nope');

    const snap = exportSnapshot();
    expect(snap.v).toBe(SNAPSHOT_VERSION);
    expect(snap.prefix).toBe(STORAGE_PREFIX);
    expect(Object.keys(snap.data).sort()).toEqual(
      [storageKey('progress'), storageKey('srs')].sort(),
    );
    expect(snap.data['coursekit-active-course']).toBeUndefined();
    expect(snap.data['unrelated-key']).toBeUndefined();
  });
});

describe('importSnapshot', () => {
  it('replaces existing course keys with the snapshot', () => {
    localStorage.setItem(storageKey('progress'), '{"old":true}');
    localStorage.setItem(storageKey('stale'), 'remove-me');
    localStorage.setItem('unrelated-key', 'keep');

    const snap = {
      v: SNAPSHOT_VERSION,
      prefix: STORAGE_PREFIX,
      courseId: 'x',
      data: { [storageKey('progress')]: '{"new":true}', [storageKey('journal')]: '{}' },
    };
    const res = importSnapshot(snap);

    expect(res.count).toBe(2);
    expect(localStorage.getItem(storageKey('progress'))).toBe('{"new":true}');
    expect(localStorage.getItem(storageKey('journal'))).toBe('{}');
    expect(localStorage.getItem(storageKey('stale'))).toBeNull(); // cleared
    expect(localStorage.getItem('unrelated-key')).toBe('keep'); // untouched
  });

  it('rejects a wrong-version or wrong-course snapshot', () => {
    expect(() => importSnapshot({ v: 999, prefix: STORAGE_PREFIX, data: {} })).toThrow();
    expect(() => importSnapshot({ v: SNAPSHOT_VERSION, prefix: 'other', data: {} })).toThrow();
    expect(() => validateSnapshot(null)).toThrow();
  });

  it('ignores foreign keys embedded in the snapshot data', () => {
    const snap = {
      v: SNAPSHOT_VERSION,
      prefix: STORAGE_PREFIX,
      data: { 'evil-key': 'x', [storageKey('progress')]: '{}' },
    };
    importSnapshot(snap);
    expect(localStorage.getItem('evil-key')).toBeNull();
    expect(localStorage.getItem(storageKey('progress'))).toBe('{}');
  });
});

describe('encode/decode round-trip', () => {
  it('survives compression', () => {
    localStorage.setItem(storageKey('progress'), '{"1":true,"2":true}');
    const snap = exportSnapshot();
    const restored = decode(encode(snap));
    expect(restored).toEqual(snap);
  });

  it('throws on garbage input', () => {
    expect(() => decode('')).toThrow();
    expect(() => decode('!!!not-lz!!!')).toThrow();
  });
});
