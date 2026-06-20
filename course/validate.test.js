import { describe, it, expect } from 'vitest';
import { validateCourse } from './validate.js';
import { config } from './config.js';
import { phases } from './content.js';

const goodConfig = {
  id: 'x',
  locale: { target: 'it-IT', native: 'en' },
  schedule: { startDate: '2026-04-13', weeks: 2, daily: new Array(7).fill({ day: 'd', task: 't' }) },
};
const goodPhases = [
  { id: 'p1', weeks: [
    { n: 1, r: 'A', prompt: { it: 'x' }, vocab: [['a', 'b', 'c']] },
    { n: 2, r: 'B', prompt: { it: 'y' }, vocab: [['d', 'e', 'f', '/g/']] },
  ] },
];

describe('validateCourse', () => {
  it('passes a well-formed course', () => {
    expect(validateCourse(goodConfig, goodPhases)).toEqual([]);
  });

  it('flags a week-count mismatch with the schedule', () => {
    const errs = validateCourse({ ...goodConfig, schedule: { ...goodConfig.schedule, weeks: 5 } }, goodPhases);
    expect(errs.join(' ')).toMatch(/2 weeks but config.schedule.weeks is 5/);
  });

  it('flags duplicate and missing week numbers', () => {
    const dup = [{ id: 'p', weeks: [
      { n: 1, r: 'A', prompt: { it: 'x' }, vocab: [['a', 'b', 'c']] },
      { n: 1, r: 'B', prompt: { it: 'y' }, vocab: [['d', 'e', 'f']] },
    ] }];
    const errs = validateCourse(goodConfig, dup);
    expect(errs.join(' ')).toMatch(/duplicate number/);
    expect(errs.join(' ')).toMatch(/missing number 2/);
  });

  it('flags a bad vocab tuple and missing required config', () => {
    const bad = [{ id: 'p', weeks: [
      { n: 1, r: 'A', prompt: { it: 'x' }, vocab: [['only-one']] },
      { n: 2, r: 'B', prompt: { it: 'y' }, vocab: [['a', 'b', 'c']] },
    ] }];
    expect(validateCourse(goodConfig, bad).join(' ')).toMatch(/vocab\[0\]/);
    expect(validateCourse({ id: 'x', schedule: goodConfig.schedule }, goodPhases).join(' ')).toMatch(/locale\.target/);
  });

  it('validates the real bundled Italian course', () => {
    expect(validateCourse(config, phases)).toEqual([]);
  });
});
