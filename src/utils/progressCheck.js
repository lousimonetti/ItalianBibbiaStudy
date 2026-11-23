// The progress check (REVIEW-fluency.md section 4, item 1): is the course
// working? Three measures, each shown per phase on the Tracker.
//
//   coverage    how much of a passage's running text is words the learner has
//               reviewed to maturity. Reading research puts comfortable reading
//               without a dictionary at about 95-98% known words, so this is
//               the number that says whether the next reading will feel easy.
//   sprints     speaking rate in the fluency sprints over time (sprintStore.js).
//   can-do      the learner's own rating of a few "I can..." statements per
//               phase, kept with a date so a repeat shows the change.
//
// Coverage counts *cards*: a word no deck teaches (a name, a word only the
// common-word gloss list knows) is counted apart and left out of the
// percentage, so the figure never claims to measure every word.
// Nothing here grades into the SRS or ticks the streak.

import { tokenize, lookupWord } from './vocabIndex';
import { lookupCoreTerm } from './decks';
import { readingLines } from './keyVerses';
import { KNOWN_REPS, KNOWN_DAYS } from './lessonPlan';
import { storageKey } from './storageKey';
import { LEADING_ARTICLE } from './locale';

const bare = (s) => s.toLowerCase().replace(LEADING_ARTICLE, '').trim();
const norm = (s) => (s || '').trim().toLowerCase().replace(/’/g, "'");

// Mature: seen KNOWN_REPS+ times with a KNOWN_DAYS+ interval and not
// relearning. Unlike wordLevel() in lessonPlan.js this ignores `due`, because
// a mature word does not stop being known on the day it falls due.
export function isWellKnown(st) {
  return !!st && (st.reps || 0) >= KNOWN_REPS && (st.interval || 0) >= KNOWN_DAYS && st.relearn == null;
}

// The SRS key of the card a word of running text belongs to, or null. Tries
// the word, then the part after an elision ("dell'uomo" → "uomo").
export function cardKeyFor(word, mined = []) {
  const tries = [word];
  const cut = word.lastIndexOf("'") >= 0 ? word.lastIndexOf("'") : word.lastIndexOf('’');
  if (cut > 0 && cut < word.length - 1) tries.push(word.slice(cut + 1));
  for (const w of tries) {
    const course = lookupWord(w);
    if (course) return course.lemma ?? course.it;
    const core = lookupCoreTerm(w);
    if (core) return core.it;
    const saved = mined.find((e) => norm(e.it) === norm(w));
    if (saved) return saved.it;
  }
  return null;
}

// Coverage of the passages of `weeks` (one week or several, pooled).
// Returns { tokens, carded, known, learning, unseen, noCard, pct, toLearn }:
//   tokens    running words in the text
//   carded    of those, words some deck teaches (known + learning + unseen)
//   pct       known / carded, rounded, or null when nothing is carded
//   toLearn   up to `limit` card keys not yet known, most frequent first.
//             Short grammar words (e, di, non, che) are counted but not listed:
//             they are learned by meeting them everywhere, not by a list.
export function passageCoverage(weeks, srsStore = {}, { mined = [], limit = 8 } = {}) {
  const counts = { tokens: 0, known: 0, learning: 0, unseen: 0, noCard: 0 };
  const missing = new Map();
  for (const week of [].concat(weeks || [])) {
    for (const line of readingLines(week)) {
      for (const tok of tokenize(line.t)) {
        if (!tok.isWord || !/\p{L}/u.test(tok.text)) continue;
        counts.tokens += 1;
        const key = cardKeyFor(tok.text, mined);
        if (!key) { counts.noCard += 1; continue; }
        const st = srsStore[key];
        if (isWellKnown(st)) { counts.known += 1; continue; }
        if (st) counts.learning += 1; else counts.unseen += 1;
        if (bare(key).length > 3) missing.set(key, (missing.get(key) || 0) + 1);
      }
    }
  }
  const carded = counts.known + counts.learning + counts.unseen;
  const toLearn = [...missing.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it'))
    .slice(0, limit)
    .map(([term]) => term);
  return { ...counts, carded, pct: carded ? Math.round((counts.known / carded) * 100) : null, toLearn };
}

// The week whose passage comes next: the one after the current week, the last
// week at the end, week 1 when the program has not started or is over.
export function nextWeekN(currentWeekN, totalWeeks) {
  if (!currentWeekN) return 1;
  return Math.min(currentWeekN + 1, totalWeeks);
}

// ── Can-do self-check store: { [phaseId]: [{ at, answers: { [id]: 0|1|2 } }] }
export const ANSWERS = [
  { value: 0, label: 'Not yet' },
  { value: 1, label: 'With help' },
  { value: 2, label: 'Yes' },
];
const CHECKS_KEY = () => storageKey('checks');
export const MAX_CHECKS_PER_PHASE = 20;

export function loadChecks() {
  try {
    const v = JSON.parse(localStorage.getItem(CHECKS_KEY()));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

// Pure: add a check for `phaseId`, oldest dropped past the cap.
export function addCheck(store, phaseId, answers, now = Date.now()) {
  const list = [...(store[phaseId] || []), { at: now, answers: { ...answers } }];
  return { ...store, [phaseId]: list.slice(-MAX_CHECKS_PER_PHASE) };
}

export function recordCheck(phaseId, answers, now = Date.now()) {
  const next = addCheck(loadChecks(), phaseId, answers, now);
  try {
    localStorage.setItem(CHECKS_KEY(), JSON.stringify(next));
  } catch {
    // storage full or unavailable: the check simply is not kept
  }
  return next;
}

// Tally one check against the statements: { at, yes, help, notYet, total }.
function tally(entry, items) {
  const t = { at: entry.at, yes: 0, help: 0, notYet: 0, total: items.length };
  for (const { id } of items) {
    const a = entry.answers?.[id];
    if (a === 2) t.yes += 1;
    else if (a === 1) t.help += 1;
    else t.notYet += 1;
  }
  return t;
}

// The latest check for a phase and the one before it, tallied, or nulls.
export function checkSummary(entries = [], items = []) {
  const n = entries.length;
  return {
    latest: n ? tally(entries[n - 1], items) : null,
    previous: n > 1 ? tally(entries[n - 2], items) : null,
  };
}
