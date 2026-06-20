// Lightweight spaced-repetition scheduler (SM-2 flavored, binary grade).
//
// Practice grades a card with one of two buttons: "Got it" (good) or "Still
// learning" (again). Each reviewed card stores
//   { ease, interval, reps, lapses, due, last }
// keyed by its Italian term in localStorage. This module is pure and
// fully unit-tested; the React glue lives in src/hooks/useSrs.js.

export const DAY = 86400000; // ms in a day
export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const DAILY_NEW_CAP = 15; // max brand-new cards introduced per calendar day

// Apply one review to a card's prior state and return its next state.
// `grade` is 'good' or 'again'. `now` is injectable for tests.
export function review(card, grade, now = Date.now()) {
  let ease = card?.ease ?? DEFAULT_EASE;
  let reps = card?.reps ?? 0;
  let lapses = card?.lapses ?? 0;
  let interval = card?.interval ?? 0;
  // Stamp when a card was first introduced, so the daily new-card cap can count
  // today's new cards across sessions.
  const created = card?.created ?? now;

  if (grade === 'again') {
    // Lower the ease, reset the streak, and make the card due immediately so it
    // resurfaces this session and in the next one.
    reps = 0;
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0;
    return { ease, interval, reps, lapses, due: now, last: now, created };
  }

  // grade === 'good': advance the interval (1d, 3d, then interval * ease).
  reps += 1;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.max(1, Math.round(interval * ease));

  return { ease, interval, reps, lapses, due: now + interval * DAY, last: now, created };
}

export function isDue(card, now = Date.now()) {
  return !!card && card.due <= now;
}

// Build a practice queue from the full (already phase-filtered) card list and
// the SRS store. Due cards come first (earliest due first), then up to `newCap`
// never-seen cards, capped at `maxSession` total.
export function buildQueue(cards, store, { now = Date.now(), newCap = 12, maxSession = 20 } = {}) {
  const due = [];
  const fresh = [];
  for (const c of cards) {
    const st = store[c.it];
    if (!st) fresh.push(c);
    else if (st.due <= now) due.push({ c, due: st.due });
  }
  due.sort((a, b) => a.due - b.due);
  const dueCards = due.map((d) => d.c);
  const newCards = fresh.slice(0, newCap);
  return [...dueCards, ...newCards].slice(0, maxSession);
}

function sameLocalDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// How many brand-new cards were first introduced on the same calendar day as
// `now` — drives the daily new-card cap.
export function newIntroducedToday(store, now = Date.now()) {
  let count = 0;
  for (const key in store) {
    const c = store[key];
    if (c && c.created && sameLocalDay(c.created, now)) count += 1;
  }
  return count;
}

// The new-card allowance left for today given the daily cap.
export function newAllowanceToday(store, now = Date.now(), cap = DAILY_NEW_CAP) {
  return Math.max(0, cap - newIntroducedToday(store, now));
}

// Counts for the start screen: how many are due now, never seen, or already
// learned (seen at least once).
export function stats(cards, store, now = Date.now()) {
  let due = 0;
  let fresh = 0;
  let learned = 0;
  for (const c of cards) {
    const st = store[c.it];
    if (!st) {
      fresh += 1;
    } else {
      learned += 1;
      if (st.due <= now) due += 1;
    }
  }
  return { due, new: fresh, learned, total: cards.length };
}
