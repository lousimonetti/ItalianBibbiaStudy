import { storageKey } from './storageKey';

// The guided Rosary, as a flat list of steps the Rosario tab walks through.
//
// The whole prayer is 79 steps: crucifix (Sign of the Cross, Creed), the
// introductory beads (Our Father, three Hail Marys, Glory Be), five decades of
// fourteen steps each (announce the mystery, Our Father, ten Hail Marys, Glory
// Be, Fatima prayer), and the close (Hail Holy Queen, Sign of the Cross).
// Flattening it means the UI only ever needs "step i of n" — back, next,
// resume — and every structural fact (which decade, which bead, which Hail
// Mary of ten) is precomputed on the step itself.

export const ORDINALS = ['primo', 'secondo', 'terzo', 'quarto', 'quinto'];

// Which set is prayed on a given weekday (0 = Sunday, as Date#getDay).
export function setForDay(day, sets) {
  return sets.find((s) => s.days.includes(day)) ?? sets[0];
}

// "Nel terzo mistero doloroso si contempla la coronazione di spine."
export function announcement(set, index) {
  return `Nel ${ORDINALS[index]} mistero ${set.adjective} si contempla ${set.mysteries[index].it}.`;
}

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Build the step list for one set of mysteries. `rosary` is the course data
// (courses/<id>/rosary.js); prayer texts are looked up from it by the UI, so a
// step carries only the devotion id.
export function buildSteps(rosary, set) {
  const p = rosary.prayers;
  const steps = [];
  const add = (step) => steps.push({ ...step, index: steps.length });

  add({ kind: 'prayer', prayerId: p.sign, section: 'intro', bead: 'cross' });
  add({ kind: 'prayer', prayerId: p.creed, section: 'intro', bead: 'cross' });
  add({ kind: 'prayer', prayerId: p.our, section: 'intro', bead: 'large' });
  rosary.virtues.forEach((v, i) => {
    add({ kind: 'prayer', prayerId: p.hail, section: 'intro', bead: 'small', count: { n: i + 1, of: rosary.virtues.length }, virtue: v });
  });
  add({ kind: 'prayer', prayerId: p.glory, section: 'intro', bead: 'chain' });

  set.mysteries.forEach((mystery, d) => {
    add({ kind: 'mystery', section: d, bead: 'large', mystery, text: announcement(set, d) });
    add({ kind: 'prayer', prayerId: p.our, section: d, bead: 'large' });
    for (let n = 1; n <= 10; n++) {
      add({ kind: 'prayer', prayerId: p.hail, section: d, bead: 'small', count: { n, of: 10 } });
    }
    add({ kind: 'prayer', prayerId: p.glory, section: d, bead: 'chain' });
    add({ kind: 'prayer', prayerId: p.fatima, section: d, bead: 'chain' });
  });

  add({ kind: 'prayer', prayerId: p.salve, section: 'closing', bead: 'medal' });
  add({ kind: 'prayer', prayerId: p.sign, section: 'closing', bead: 'cross' });
  return steps;
}

// The steps that share a section with `step` — what the bead strip draws.
export function sectionSteps(steps, step) {
  return steps.filter((s) => s.section === step.section);
}

// ── Persistence ─────────────────────────────────────────────────────────────
// { resume: { date, setId, step } | null, completed: n, last: date | null }
// `resume` only counts on the day it was saved: a Rosary left half-prayed
// yesterday is not one to pick up in the middle of today.

const KEY = () => storageKey('rosary');
const EMPTY = { resume: null, completed: 0, last: null };

export function loadRosary() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY()));
    return raw && typeof raw === 'object' ? { ...EMPTY, ...raw } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function save(state) {
  try { localStorage.setItem(KEY(), JSON.stringify(state)); } catch { /* storage unavailable */ }
  return state;
}

export function resumeFor(state, date) {
  return state.resume && state.resume.date === date ? state.resume : null;
}

export function savePosition(date, setId, step) {
  return save({ ...loadRosary(), resume: { date, setId, step } });
}

export function clearPosition() {
  return save({ ...loadRosary(), resume: null });
}

// A finished Rosary. Counted once per day — praying a second one is welcome,
// but the tally is of days, like the streak.
export function recordComplete(date) {
  const state = loadRosary();
  const completed = state.last === date ? state.completed : state.completed + 1;
  return save({ ...state, resume: null, completed, last: date });
}
