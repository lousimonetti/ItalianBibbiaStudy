// Which guided lessons are finished, and what the learner should do next.
// Stored under storageKey('lessons') as
//   { done: { "<week>.<lesson>": { date: 'YYYY-MM-DD', pct, times } } }
// so it rides along in sync backups with every other per-course store.
// The pure functions take the store as an argument; load/record touch
// localStorage.

import { storageKey } from './storageKey';
import { todayStr } from './streak';

export const STORAGE_KEY = storageKey('lessons');

const empty = () => ({ done: {} });

export function loadLessons() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return raw && typeof raw.done === 'object' && raw.done ? raw : empty();
  } catch {
    return empty();
  }
}

// Mark a lesson finished. Redoing one keeps the best score and the first
// completion date, and counts the repeat.
export function completeLesson(store, key, pct, date = todayStr()) {
  const prev = store?.done?.[key];
  const entry = prev
    ? { ...prev, pct: Math.max(prev.pct ?? 0, pct), times: (prev.times || 1) + 1 }
    : { date, pct, times: 1 };
  return { ...(store || empty()), done: { ...(store?.done || {}), [key]: entry } };
}

export function recordLesson(key, pct) {
  const next = completeLesson(loadLessons(), key, pct);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — degrade silently
  }
  return next;
}

export const isDone = (store, key) => !!store?.done?.[key];

export function weekProgress(store, lessons) {
  return { done: lessons.filter((l) => isDone(store, l.key)).length, total: lessons.length };
}

// The single thing the "Continue" button should do. `plans` is
// [{ weekN, lessons }] for the whole course, in order.
//   1. an unfinished lesson in the current week
//   2. otherwise the review, when cards are due
//   3. otherwise the first unfinished lesson of a later week (`ahead`)
//   4. otherwise nothing — everything is done
// Outside the program's dates (`currentWeekN` null) there is no "current
// week", so the course is simply taken from the top.
export function nextAction({ plans, store, currentWeekN, due = 0 }) {
  const firstOpen = (list) => {
    for (const p of list) {
      const lesson = p.lessons.find((l) => !isDone(store, l.key));
      if (lesson) return lesson;
    }
    return null;
  };

  if (currentWeekN == null) {
    const lesson = firstOpen(plans);
    if (lesson) return { kind: 'lesson', lesson, ahead: false };
    return due > 0 ? { kind: 'review', due } : { kind: 'done' };
  }

  const current = firstOpen(plans.filter((p) => p.weekN === currentWeekN));
  if (current) return { kind: 'lesson', lesson: current, ahead: false };
  if (due > 0) return { kind: 'review', due };
  const later = firstOpen(plans.filter((p) => p.weekN > currentWeekN));
  if (later) return { kind: 'lesson', lesson: later, ahead: true };
  return { kind: 'done' };
}
