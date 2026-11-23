import { describe, it, expect, afterEach } from 'vitest';
import { storageKey } from './storageKey';
import { addSprint, recordSprint, loadSprints, median, sprintTrend, MAX_SPRINTS } from './sprintStore';

const run = (weekN, ...wpms) => ({ weekN, rounds: wpms.map((wpm) => ({ seconds: 60, words: wpm, wpm })) });
const PHASES = [
  { id: 'p1', weeks: [{ n: 1 }, { n: 2 }] },
  { id: 'p2', weeks: [{ n: 3 }] },
  { id: 'p3', weeks: [{ n: 4 }] },
];

describe('sprint store', () => {
  afterEach(() => localStorage.removeItem(storageKey('sprints')));

  it('keeps a finished run with its rounds and date', () => {
    recordSprint(run(2, 40, 50, 60), 7);
    expect(loadSprints()).toEqual([{ at: 7, weekN: 2, rounds: run(2, 40, 50, 60).rounds }]);
  });

  it('does not keep a run in which nothing was said', () => {
    expect(addSprint([], run(1, 0, 0, 0))).toEqual([]);
    recordSprint(run(1, 0, 0));
    expect(localStorage.getItem(storageKey('sprints'))).toBeNull();
  });

  it('drops the oldest past the cap', () => {
    let list = [];
    for (let i = 0; i < MAX_SPRINTS + 2; i += 1) list = addSprint(list, run(1, 30), i);
    expect(list).toHaveLength(MAX_SPRINTS);
    expect(list[0].at).toBe(2);
  });

  it('survives junk in storage', () => {
    localStorage.setItem(storageKey('sprints'), '{"no":1}');
    expect(loadSprints()).toEqual([]);
  });
});

describe('median', () => {
  it('handles odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3); // 2.5 rounded
    expect(median([])).toBeNull();
  });
});

describe('sprintTrend', () => {
  it('takes the median first-round rate per phase and compares with the last phase that had runs', () => {
    const runs = [run(1, 40, 60), run(2, 50, 70), run(4, 70)];
    const t = sprintTrend(runs, PHASES);
    expect(t[0]).toEqual({ phaseId: 'p1', runs: 2, wpm: 45, change: null });
    expect(t[1]).toEqual({ phaseId: 'p2', runs: 0, wpm: null, change: null });
    expect(t[2]).toEqual({ phaseId: 'p3', runs: 1, wpm: 70, change: 25 });
  });

  it('uses the first round with speech when round 1 was silent', () => {
    const r = { weekN: 3, rounds: [{ seconds: 60, words: 0, wpm: 0 }, { seconds: 45, words: 30, wpm: 40 }] };
    expect(sprintTrend([r], PHASES)[1].wpm).toBe(40);
  });
});
