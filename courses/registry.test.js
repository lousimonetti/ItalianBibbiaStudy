import { describe, it, expect } from 'vitest';
import { pickActive, listCourses, getActiveId, getActiveCourse, allCourses, DEFAULT_ID } from './registry.js';

describe('pickActive (pure)', () => {
  it('uses the stored id when it is a registered course', () => {
    expect(pickActive(['a', 'b'], 'b', 'a')).toBe('b');
  });
  it('falls back to the default when the stored id is unknown', () => {
    expect(pickActive(['a', 'b'], 'gone', 'a')).toBe('a');
  });
  it('falls back to the default when nothing is stored', () => {
    expect(pickActive(['a', 'b'], null, 'a')).toBe('a');
    expect(pickActive(['a', 'b'], '', 'a')).toBe('a');
  });
});

describe('registry (bundled)', () => {
  it('has at least the reference course and a default', () => {
    expect(listCourses().length).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_ID).toBe('it-bible-cei');
  });
  it('resolves the active course (default with empty storage)', () => {
    expect(getActiveId()).toBe('it-bible-cei');
    expect(getActiveCourse().config.id).toBe('it-bible-cei');
    expect(getActiveCourse().phases.length).toBeGreaterThan(0);
  });
  it('allCourses returns each course with config + phases', () => {
    for (const c of allCourses()) {
      expect(c.id).toBeTruthy();
      expect(c.config).toBeTruthy();
      expect(Array.isArray(c.phases)).toBe(true);
    }
  });
});
