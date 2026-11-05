import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadVerseSrs, gradeVerse, applyLessonToReview, verseCards, verseStats, buildVerseSession, VERSE_DAILY_NEW_CAP,
} from './verseReview';
import { PHASES } from '../data/studyData';
import { DAY } from './srs';

const NOW = new Date(2026, 10, 5, 12).getTime();
const week = {
  n: 1,
  passage: {
    ref: 'Giovanni 1,1-5',
    verses: [1, 2, 3, 4, 5].map((n) => ({ n, t: `Versetto ${n}.`, en: `Verse ${n}.` })),
  },
};

beforeEach(() => localStorage.clear());

describe('verse review', () => {
  it('uses its own store, leaving vocabulary reviews alone', () => {
    gradeVerse('Giovanni 1,1', 'good', NOW);
    expect(Object.keys(loadVerseSrs())).toEqual(['Giovanni 1,1']);
    expect(localStorage.getItem('italian-bible-srs')).toBeNull();
    expect(localStorage.getItem('italian-bible-verse-srs')).not.toBeNull();
  });

  it('caps new verses per day, across sessions', () => {
    const cards = verseCards([week]);
    const first = buildVerseSession(cards, { now: NOW });
    expect(first.length).toBe(VERSE_DAILY_NEW_CAP);
    first.forEach((c) => gradeVerse(c.id, 'good', NOW));
    expect(buildVerseSession(cards, { now: NOW + 60000 })).toEqual([]);
  });

  it('brings a graded verse back when it falls due', () => {
    const cards = verseCards([week]);
    gradeVerse('Giovanni 1,1', 'good', NOW);
    expect(verseStats(cards, NOW).due).toBe(0);
    expect(verseStats(cards, NOW + 2 * DAY).due).toBe(1);
    expect(buildVerseSession(cards, { now: NOW + 2 * DAY })[0].id).toBe('Giovanni 1,1');
  });

  it('gives every course verse a unique id', () => {
    const cards = verseCards(PHASES.flatMap((p) => p.weeks));
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('applyLessonToReview', () => {
  it('schedules missed verses soon and recalled verses later', () => {
    applyLessonToReview({ missed: ['Giovanni 1,1'], recalled: ['Giovanni 1,2'] }, NOW);
    const store = loadVerseSrs();
    expect(store['Giovanni 1,1'].lapses).toBe(1);
    expect(store['Giovanni 1,2'].reps).toBe(1);
    expect(store['Giovanni 1,1'].due).toBeLessThan(store['Giovanni 1,2'].due);
  });

  it('counts a verse both missed and recalled as missed', () => {
    applyLessonToReview({ missed: ['Giovanni 1,1'], recalled: ['Giovanni 1,1'] }, NOW);
    expect(loadVerseSrs()['Giovanni 1,1'].lapses).toBe(1);
  });

  it('does not advance a verse twice in one day', () => {
    applyLessonToReview({ recalled: ['Giovanni 1,1'] }, NOW);
    const once = loadVerseSrs()['Giovanni 1,1'];
    applyLessonToReview({ recalled: ['Giovanni 1,1'] }, NOW + 60000);
    expect(loadVerseSrs()['Giovanni 1,1']).toEqual(once);
  });
});

describe('sync backups', () => {
  it('carries verse review and lesson progress in a snapshot', async () => {
    const { exportSnapshot } = await import('./syncSnapshot');
    gradeVerse('Giovanni 1,1', 'good', NOW);
    localStorage.setItem('italian-bible-tutor', '{"weeks":{},"resume":null}');
    const { data } = exportSnapshot();
    const keys = Object.keys(data);
    expect(keys).toContain('italian-bible-verse-srs');
    expect(keys).toContain('italian-bible-tutor');
  });
});
