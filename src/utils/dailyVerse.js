// Versetto del giorno: one verse a day from the week's passage, and a short
// guided lesson on it in the shape LessonPlayer plays (see devotionLessons.js
// for that shape and its rules). Pure, except the small done-today store at
// the bottom.
//
// Inside the program the week's verses are spread over its seven days, in
// order, so the daily verse walks through the passage the learner is reading.
// Outside it (before the start, after the end) a verse is dealt from the whole
// course, each once per cycle.

import { verseRefs } from './keyVerses';
import { verseChunks } from './verseChunks';
import { verseTokens, fadeOrder } from './verseRecall';
import { buildStep } from './lessonPlan';
import { blankableWords } from './quizGame';
import { rngFor, shuffled, rotatingPick } from './gameRandom';
import { lesson, pickStep, matchStep, storyWords } from './devotionLessons';
import { storageKey } from './storageKey';

const withNeighbours = (rows, i, week) => ({
  ...rows[i],
  weekN: week.n,
  prev: rows[i - 1] || null,
  next: rows[i + 1] || null,
});

// The verse for a day: { id, t, en, ref, weekN, prev, next } or null.
// `dayIndex` is 0–6 within the program week (schedule.getTodayDayIndex).
export function verseForDay({ weeks, currentWeekN, dayIndex = 0, dateStr }) {
  const week = currentWeekN ? weeks.find((w) => w.n === currentWeekN) : null;
  if (week) {
    const rows = verseRefs(week);
    if (!rows.length) return null;
    const day = Math.max(0, Math.min(6, dayIndex));
    return withNeighbours(rows, Math.min(rows.length - 1, Math.floor((day * rows.length) / 7)), week);
  }
  const all = weeks.flatMap((w) => verseRefs(w).map((row, i, rows) => ({ w, i, rows })));
  const pick = rotatingPick(all, dateStr, 'daily-verse');
  return pick ? withNeighbours(pick.rows, pick.i, pick.w) : null;
}

const WORD = /[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g;
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (word) => new RegExp(`(^|[^A-Za-zÀ-ÿ'’])${escapeRe(word)}(?![A-Za-zÀ-ÿ'’])`);

// "In principio era il Verbo" → "I p e i V". Reciting a verse from its initials
// is the oldest memorization trick there is, and it works.
export function firstLetters(text) {
  return (String(text ?? '').match(WORD) || []).map((w) => w[0]).join(' ');
}

// The verse's content words in the order the Memorize drill fades them, kept
// to those that occur once (a blank must not leave its answer on screen).
function blankCandidates(text) {
  const once = new Set(blankableWords(text));
  const tokens = verseTokens(text);
  return fadeOrder(text).map((i) => tokens[i].word).filter((w) => once.has(w));
}

function split(text, word) {
  const m = wordRe(word).exec(text);
  if (!m) return null;
  const at = m.index + m[1].length;
  return { before: text.slice(0, at), answer: word, after: text.slice(at + word.length) };
}

// The lesson for one verse. `weekVerses` (the rows of its week) supply the
// wrong options, so distractors are words the learner is meeting anyway.
export function verseLesson(verse, weekVerses = []) {
  if (!verse?.t) return null;
  const rng = rngFor(`verse:${verse.id}`);
  const others = weekVerses.filter((v) => v.t !== verse.t);
  const here = new Set((verse.t.match(WORD) || []).map((w) => w.toLowerCase()));
  const pool = [...new Set(others.flatMap((v) => blankableWords(v.t)))].filter((w) => !here.has(w.toLowerCase()));
  const [first, second] = blankCandidates(verse.t);

  const steps = [{ kind: 'line', eyebrow: `Versetto del giorno · ${verse.id}`, it: verse.t, en: verse.en, say: verse.t }];

  const words = storyWords(verse.t, 4);
  steps.push(matchStep(words.map((w) => ({ it: w.word, en: w.en })), rng));
  if (words.length >= 3) {
    const w = shuffled(words, rng)[0];
    steps.push(pickStep(w.word, w.en, words.map((x) => x.en), rng, { audio: true }));
  }

  const chunks = verseChunks(verse.t);
  steps.push(...chunks.map((c) => buildStep(c, '', rng, { audio: true })).filter(Boolean).slice(0, 2));

  if (first && split(verse.t, first)) {
    const cut = split(verse.t, first);
    steps.push(pickStep(`${cut.before}____${cut.after}`, first, [first, ...pool], rng, {
      direction: 'fill',
      sentence: true,
      instruction: 'Which word is missing?',
      term: first,
      say: verse.t,
    }));
  }

  steps.push({
    kind: 'tip',
    eyebrow: 'Memory trick',
    title: 'Say it from its first letters',
    body: `${firstLetters(verse.t)} — look only at these initials and say the whole verse aloud. `
      + 'Each letter is just enough of a cue to pull the word back, which is what makes it stick.',
  });

  if (chunks.length >= 4) {
    const i = Math.floor(rng() * (chunks.length - 1));
    steps.push(pickStep(chunks[i], chunks[i + 1], chunks, rng, { instruction: 'What comes next?', say: chunks[i + 1] }));
  }

  if (second && split(verse.t, second)) {
    steps.push({
      kind: 'cloze',
      term: `verse:${verse.id}`,
      card: { it: second, en: verse.en || 'Type the missing word', ex: verse.t, exEn: '' },
      ...split(verse.t, second),
    });
  }

  return lesson(`verse:${verse.id}`, verse.id, 'Versetto del giorno', `Versetto del giorno · ${verse.id}`, steps, { store: 'none' });
}

// ── Done today ──────────────────────────────────────────────────────────────
// { last: 'YYYY-MM-DD' | null, days: n } — days the daily verse was learned.

const KEY = () => storageKey('daily-verse');

export function loadDailyVerse() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY()));
    return raw && typeof raw === 'object' ? { last: raw.last || null, days: raw.days || 0 } : { last: null, days: 0 };
  } catch {
    return { last: null, days: 0 };
  }
}

// Counted once per day, like the streak.
export function recordDailyVerse(date) {
  const state = loadDailyVerse();
  const next = state.last === date ? state : { last: date, days: state.days + 1 };
  try { localStorage.setItem(KEY(), JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
