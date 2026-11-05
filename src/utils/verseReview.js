// Spaced review of whole verses under storageKey('verse-srs'). A separate store
// from vocabulary so the vocabulary daily cap and counts keep their meaning, and
// so the scheduler in srs.js can be reused unchanged: it only needs a card keyed by
// a stable id, so each verse is presented to it as { it: id }.
import { storageKey } from './storageKey';
import { review, buildQueue, stats, newAllowanceToday } from './srs';
import { verseRefs } from './keyVerses';
import { getCurrentWeekN } from './schedule';
import { PHASES } from '../data/studyData';

const KEY = storageKey('verse-srs');

// Memorizing a verse is far more work than learning a word.
export const VERSE_DAILY_NEW_CAP = 3;

export function loadVerseSrs() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ }
}

export function gradeVerse(id, grade, now = Date.now()) {
  const store = loadVerseSrs();
  save({ ...store, [id]: review(store[id], grade, now) });
}

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Feeds a finished tutor lesson into review. A verse is graded at most once a day
// here, because repeating a lesson should not push its verses months ahead, and a
// verse both missed and recalled in one lesson counts as missed.
export function applyLessonToReview({ missed = [], recalled = [] }, now = Date.now()) {
  const store = { ...loadVerseSrs() };
  const apply = (id, grade) => {
    if (store[id] && sameDay(store[id].last, now)) return;
    store[id] = review(store[id], grade, now);
  };
  missed.forEach((id) => apply(id, 'again'));
  recalled.filter((id) => !missed.includes(id)).forEach((id) => apply(id, 'good'));
  save(store);
}

// Every course verse as a review card, in course order.
export function verseCards(weeks) {
  return weeks.flatMap((week) =>
    verseRefs(week).map((row) => ({ it: row.id, id: row.id, t: row.t, en: row.en, ref: row.fullRef, weekN: week.n })));
}

// Verses reached so far, so review never asks for a week still ahead of the learner.
export function reachedVerseCards(currentWeekN = getCurrentWeekN()) {
  const weeks = PHASES.flatMap((p) => p.weeks);
  return verseCards(currentWeekN ? weeks.filter((w) => w.n <= currentWeekN) : weeks);
}

export function verseStats(cards, now = Date.now()) {
  return stats(cards, loadVerseSrs(), now);
}

// Due verses first, then a few new ones within today's allowance, drawn only from
// `cards` so a learner is never asked to memorize a week they haven't reached.
export function buildVerseSession(cards, { now = Date.now(), maxSession = 8 } = {}) {
  const store = loadVerseSrs();
  const newCap = newAllowanceToday(store, now, VERSE_DAILY_NEW_CAP);
  return buildQueue(cards, store, { now, newCap, maxSession });
}
