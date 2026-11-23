import { describe, it, expect, afterEach } from 'vitest';
import { storageKey } from './storageKey';
import {
  isWellKnown, cardKeyFor, passageCoverage, nextWeekN,
  addCheck, loadChecks, recordCheck, checkSummary, MAX_CHECKS_PER_PHASE,
} from './progressCheck';
import { canDo } from '../../course/canDo';
import { PHASES } from '../data/studyData';

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 23);
const mature = { reps: 4, interval: 20, ease: 2.5, lapses: 0, due: NOW + 5 * DAY, relearn: null };
const week = (text) => ({ n: 99, passage: { verses: [{ n: 1, t: text }] } });

describe('isWellKnown', () => {
  it('needs enough reviews and a long enough interval', () => {
    expect(isWellKnown(mature)).toBe(true);
    expect(isWellKnown({ ...mature, reps: 2 })).toBe(false);
    expect(isWellKnown({ ...mature, interval: 10 })).toBe(false);
    expect(isWellKnown(undefined)).toBe(false);
  });

  it('still counts a mature word on the day it falls due', () => {
    expect(isWellKnown({ ...mature, due: NOW - DAY })).toBe(true);
  });

  it('does not count a word that is relearning, even at step 0', () => {
    expect(isWellKnown({ ...mature, relearn: 0 })).toBe(false);
  });
});

describe('cardKeyFor', () => {
  it('maps a course word, its article-less stem and its inflected form to the card', () => {
    expect(cardKeyFor('luce')).toBe('la luce');
    expect(cardKeyFor('crede')).toBe('credere');
  });

  it('maps a core word, through an elision too', () => {
    expect(cardKeyFor('finestra')).toBe('la finestra');
    expect(cardKeyFor("dell'ombrellone", [{ it: 'ombrellone', en: 'beach umbrella' }])).toBe('ombrellone');
  });

  it('maps a saved word and returns null for a word no deck has', () => {
    expect(cardKeyFor('Ombrellone', [{ it: 'ombrellone' }])).toBe('ombrellone');
    expect(cardKeyFor('ombrellone')).toBeNull();
  });
});

describe('passageCoverage', () => {
  it('sorts running words into known, learning, unseen and no card', () => {
    const cov = passageCoverage(week('La luce crede, la luce e la finestra di ombrellone.'), {
      'la luce': mature,
      credere: { ...mature, reps: 1, interval: 1 },
    });
    // e, di and finestra are core cards not yet seen; the articles and
    // ombrellone have no card of their own.
    expect(cov.tokens).toBe(10);
    expect(cov.known).toBe(2);
    expect(cov.learning).toBe(1);
    expect(cov.unseen).toBe(3);
    expect(cov.noCard).toBe(4);
    expect(cov.carded).toBe(6);
    expect(cov.pct).toBe(33);
  });

  it('lists the most frequent unknown words, but not short grammar words', () => {
    const cov = passageCoverage(week('La finestra, la finestra e la luce crede.'), {});
    expect(cov.toLearn[0]).toBe('la finestra');
    expect(cov.toLearn).toEqual(expect.arrayContaining(['la luce', 'credere']));
    expect(cov.toLearn.some((t) => t.replace(/^(la|il|l')\s*/, '').length <= 3)).toBe(false);
  });

  it('pools several weeks and gives null when nothing is carded', () => {
    expect(passageCoverage([week('luce'), week('luce')], {}).tokens).toBe(2);
    expect(passageCoverage(week('ombrellone'), {}).pct).toBeNull();
  });

  it('measures every real phase without throwing, with most words carded or named', () => {
    for (const p of PHASES) {
      const cov = passageCoverage(p.weeks, {});
      expect(cov.tokens).toBeGreaterThan(500);
      expect(cov.carded).toBeGreaterThan(0.4 * cov.tokens);
      expect(cov.known).toBe(0);
    }
  });
});

describe('nextWeekN', () => {
  it('is the week after the current one, capped, or week 1 when inactive', () => {
    expect(nextWeekN(5, 37)).toBe(6);
    expect(nextWeekN(37, 37)).toBe(37);
    expect(nextWeekN(null, 37)).toBe(1);
  });
});

describe('self-check store', () => {
  afterEach(() => localStorage.removeItem(storageKey('checks')));

  it('keeps every check per phase, up to a cap', () => {
    let store = {};
    for (let i = 0; i < MAX_CHECKS_PER_PHASE + 3; i += 1) store = addCheck(store, 'p1', { a: 2 }, i);
    expect(store.p1).toHaveLength(MAX_CHECKS_PER_PHASE);
    expect(store.p1[0].at).toBe(3);
  });

  it('round-trips through storage and survives junk', () => {
    recordCheck('p2', { x: 1 }, 5);
    expect(loadChecks()).toEqual({ p2: [{ at: 5, answers: { x: 1 } }] });
    localStorage.setItem(storageKey('checks'), '[1,2]');
    expect(loadChecks()).toEqual({});
  });

  it('tallies the latest check and the one before it', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const s = checkSummary([{ at: 1, answers: { a: 0 } }, { at: 2, answers: { a: 2, b: 1 } }], items);
    expect(s.latest).toEqual({ at: 2, yes: 1, help: 1, notYet: 1, total: 3 });
    expect(s.previous.notYet).toBe(3);
    expect(checkSummary([], items)).toEqual({ latest: null, previous: null });
  });
});

describe('can-do statements (course data)', () => {
  it('gives every phase 4 to 6 statements with unique ids and a level', () => {
    const ids = new Set();
    for (const p of PHASES) {
      const set = canDo[p.id];
      expect(set?.level).toBeTruthy();
      expect(set.items.length).toBeGreaterThanOrEqual(4);
      expect(set.items.length).toBeLessThanOrEqual(6);
      for (const it of set.items) {
        expect(it.en).toMatch(/^I can /);
        expect(ids.has(it.id)).toBe(false);
        ids.add(it.id);
      }
    }
  });
});
