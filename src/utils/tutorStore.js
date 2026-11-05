// Voice tutor progress under storageKey('tutor'): per-week completion and best
// score, plus one same-day resume point. The store is shaped to ride sync backups.
import { storageKey } from './storageKey';

const KEY = storageKey('tutor');

export function dayStamp(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

export function loadTutor() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return { weeks: v?.weeks ?? {}, resume: v?.resume ?? null };
  } catch {
    return { weeks: {}, resume: null };
  }
}

function save(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ }
}

// A resume point only counts on the day it was made, and only for its own week.
export function resumeFor(weekN, now = new Date()) {
  const { resume } = loadTutor();
  return resume && resume.weekN === weekN && resume.date === dayStamp(now) ? resume.snap : null;
}

export function saveResume(weekN, snap, now = new Date()) {
  save({ ...loadTutor(), resume: { weekN, date: dayStamp(now), snap } });
}

export function clearResume() {
  const store = loadTutor();
  if (store.resume) save({ ...store, resume: null });
}

export function recordLesson(summary, now = new Date()) {
  const store = loadTutor();
  const prev = store.weeks[summary.weekN] ?? { done: 0, best: 0, last: null };
  save({
    weeks: {
      ...store.weeks,
      [summary.weekN]: {
        done: prev.done + 1,
        best: Math.max(prev.best, summary.score),
        last: dayStamp(now),
      },
    },
    resume: null,
  });
}
