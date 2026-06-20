// Daily streak + today's-goal tracking (localStorage `italian-bible-streak`).
//
// A day counts as "active" when the learner does any tracked thing — reviews a
// flashcard, writes a journal line, or ticks the reading box. The streak is the
// run of consecutive active days ending today (or yesterday — today just hasn't
// happened yet). Pure date/streak logic is unit-tested; thin localStorage
// wrappers live at the bottom.

export const STORAGE_KEY = 'italian-bible-streak';

export const FLAGS = ['read', 'practiced', 'journaled'];

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayBefore(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

function freshToday(date) {
  return { date, read: false, practiced: false, journaled: false };
}

function normalize(store) {
  return { current: 0, best: 0, last: null, today: null, ...(store || {}) };
}

// Pure: advance the streak for an active `today`.
export function withActivity(store, today = todayStr()) {
  const s = normalize(store);
  if (s.last === today) {
    // already counted today
  } else if (s.last === dayBefore(today)) {
    s.current = (s.current || 0) + 1;
  } else {
    s.current = 1;
  }
  s.best = Math.max(s.best || 0, s.current);
  s.last = today;
  return s;
}

// Pure: set one of today's goal flags (and advance the streak, since any flag is
// activity). Resets today's flags when the date rolls over.
export function setFlag(store, flag, today = todayStr()) {
  let s = normalize(store);
  if (!s.today || s.today.date !== today) s.today = freshToday(today);
  if (flag) s.today = { ...s.today, [flag]: true };
  s = withActivity(s, today);
  return s;
}

// Pure: the streak honoring a gap — if the last active day isn't today or
// yesterday, the streak is broken (0).
export function currentStreak(store, today = todayStr()) {
  const s = normalize(store);
  if (!s.last) return 0;
  if (s.last === today || s.last === dayBefore(today)) return s.current || 0;
  return 0;
}

// Pure: today's flags (fresh when the stored day isn't today).
export function todayFlags(store, today = todayStr()) {
  const s = normalize(store);
  return s.today && s.today.date === today ? s.today : freshToday(today);
}

// ── localStorage wrappers ───────────────────────────────────────────────────
export function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable — degrade silently
  }
}

// Record activity of a given flag ('read' | 'practiced' | 'journaled'); returns
// the updated store. Safe to call repeatedly — only the first per day advances.
export function recordActivity(flag) {
  const next = setFlag(loadStreak(), flag);
  save(next);
  return next;
}
