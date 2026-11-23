// Fluency sprints, kept (REVIEW-fluency.md section 4, item 1). FluencySprint.jsx
// used to show a run's words per minute and then forget it, so nobody could
// see whether speaking was getting faster over the weeks. Each finished run is
// now stored under storageKey('sprints'), which rides sync backups.
//
// The trend uses the *first* round's rate: it is the unrehearsed one, so it
// shows how quickly Italian comes before the 4/3/2 repetition helps.

import { storageKey } from './storageKey';

const KEY = () => storageKey('sprints');
export const MAX_SPRINTS = 200;

export function loadSprints() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY()));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Pure: append a run ({ weekN, rounds: [{ seconds, words, wpm }] }). A run in
// which nothing was said is not kept.
export function addSprint(list, run, now = Date.now()) {
  const rounds = (run?.rounds || []).map(({ seconds, words, wpm }) => ({ seconds, words, wpm }));
  if (!rounds.some((r) => r.words > 0)) return list;
  return [...list, { at: now, weekN: run.weekN ?? null, rounds }].slice(-MAX_SPRINTS);
}

export function recordSprint(run, now = Date.now()) {
  const before = loadSprints();
  const next = addSprint(before, run, now);
  if (next === before) return next;
  try {
    localStorage.setItem(KEY(), JSON.stringify(next));
  } catch {
    // storage full or unavailable: the run simply is not kept
  }
  return next;
}

export function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const firstWpm = (run) => run.rounds?.find((r) => r.words > 0)?.wpm ?? null;

// Per phase: { runs, wpm } where wpm is the median first-round rate of the
// runs done on that phase's weeks, plus `change` against the previous phase
// that has runs (null when there is nothing to compare).
export function sprintTrend(runs, phases) {
  const byPhase = phases.map((p) => {
    const weeks = new Set(p.weeks.map((w) => w.n));
    const rates = runs.filter((r) => weeks.has(r.weekN)).map(firstWpm).filter((v) => v != null);
    return { phaseId: p.id, runs: rates.length, wpm: median(rates) };
  });
  let prev = null;
  return byPhase.map((p) => {
    const change = p.wpm != null && prev != null ? p.wpm - prev : null;
    if (p.wpm != null) prev = p.wpm;
    return { ...p, change };
  });
}
