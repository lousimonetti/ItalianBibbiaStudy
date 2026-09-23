import { describe, it, expect, beforeEach } from 'vitest';
import { rosary } from '../../courses/it-bible-cei/rosary.js';
import { devotionSections } from '../../courses/it-bible-cei/devotions.js';
import {
  setForDay, announcement, buildSteps, sectionSteps, capitalize,
  loadRosary, resumeFor, savePosition, clearPosition, recordComplete,
} from './rosary';

const byId = (id) => rosary.sets.find((s) => s.id === id);

describe('setForDay', () => {
  it('follows the traditional weekly cycle', () => {
    const names = [0, 1, 2, 3, 4, 5, 6].map((d) => setForDay(d, rosary.sets).id);
    expect(names).toEqual(['gloriosi', 'gaudiosi', 'dolorosi', 'gloriosi', 'luminosi', 'dolorosi', 'gaudiosi']);
  });

  it('assigns every weekday exactly once', () => {
    const days = rosary.sets.flatMap((s) => s.days).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('announcement', () => {
  it('uses the ordinal and the singular adjective', () => {
    expect(announcement(byId('gaudiosi'), 0))
      .toBe("Nel primo mistero gaudioso si contempla l'annunciazione dell'angelo a Maria.");
    expect(announcement(byId('dolorosi'), 2))
      .toBe('Nel terzo mistero doloroso si contempla la coronazione di spine.');
  });

  it('authors mysteries in their mid-sentence (lowercase) form', () => {
    for (const s of rosary.sets) {
      expect(s.mysteries).toHaveLength(5);
      for (const m of s.mysteries) expect(m.it[0]).toBe(m.it[0].toLowerCase());
    }
  });
});

describe('buildSteps', () => {
  const steps = buildSteps(rosary, byId('gloriosi'));

  it('has the full 79-step shape', () => {
    expect(steps).toHaveLength(79);
    expect(steps.map((s) => s.index)).toEqual(steps.map((_, i) => i));
  });

  it('prays fifty-three Hail Marys: three opening plus five decades of ten', () => {
    expect(steps.filter((s) => s.prayerId === 'ave-maria')).toHaveLength(53);
    for (let d = 0; d < 5; d++) {
      const decade = steps.filter((s) => s.section === d);
      expect(decade.map((s) => s.kind === 'mystery' ? 'M' : s.prayerId)).toEqual([
        'M', 'padre-nostro', ...Array(10).fill('ave-maria'), 'gloria', 'fatima',
      ]);
      expect(decade.filter((s) => s.count).map((s) => s.count.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('opens on the crucifix and closes with the Salve Regina', () => {
    expect(steps.slice(0, 2).map((s) => s.prayerId)).toEqual(['segno-croce', 'credo']);
    expect(steps.slice(-2).map((s) => s.prayerId)).toEqual(['salve-regina', 'segno-croce']);
  });

  it('points only at devotions the course actually ships', () => {
    const ids = new Set(devotionSections.flatMap((s) => s.prayers).map((p) => p.id));
    const missing = steps.filter((s) => s.prayerId && !ids.has(s.prayerId));
    expect(missing).toEqual([]);
  });

  it('groups a step with the rest of its decade', () => {
    const tenth = steps.find((s) => s.section === 3 && s.count?.n === 10);
    expect(sectionSteps(steps, tenth)).toHaveLength(14);
  });
});

describe('capitalize', () => {
  it('uppercases the first letter only', () => {
    expect(capitalize("l'ascensione di Gesù")).toBe("L'ascensione di Gesù");
  });
});

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and survives garbage', () => {
    expect(loadRosary()).toEqual({ resume: null, completed: 0, last: null });
    localStorage.setItem('italian-bible-rosary', '{not json');
    expect(loadRosary().completed).toBe(0);
  });

  it('resumes only on the day the position was saved', () => {
    const state = savePosition('2026-09-23', 'gloriosi', 17);
    expect(resumeFor(state, '2026-09-23')).toEqual({ date: '2026-09-23', setId: 'gloriosi', step: 17 });
    expect(resumeFor(state, '2026-09-24')).toBeNull();
    expect(clearPosition().resume).toBeNull();
  });

  it('counts a completed Rosary once per day and clears the resume point', () => {
    savePosition('2026-09-23', 'gloriosi', 78);
    expect(recordComplete('2026-09-23')).toMatchObject({ completed: 1, resume: null });
    expect(recordComplete('2026-09-23').completed).toBe(1);
    expect(recordComplete('2026-09-24').completed).toBe(2);
  });
});
