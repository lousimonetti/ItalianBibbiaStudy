// Guided lessons: turn one week of course data into a few short, linear
// lessons — the "press Start and be walked through it" container the app
// lacked. Nothing here is new content; a lesson is a *sequence* over material
// the week already carries (vocab, example sentences, grammar note, drills,
// passage verses, comprehension checks, transforms), graded by the same
// checkers the standalone exercises use.
//
// A week becomes:
//   • one or two WORD lessons (the vocab split into chunks of ~4): meet each
//     word → match pairs → pick the meaning → fill the blank → type it from
//     memory. The week's grammar tip + drills ride on the last word lesson.
//   • one PASSAGE lesson: rebuild two short verses, the comprehension checks,
//     the transformation drills, then a quick recap of all the week's words.
//
// Everything is deterministic (seeded by week + lesson), so a lesson is the
// same every time it is opened and the plan is unit-testable. Pure — the React
// side lives in LessonPlayer.jsx, persistence in lessonStore.js.

import { parseVocab } from '../../course/vocab';
import { makeCloze } from './cloze';
import { scrambleTokens, shuffleScramble, sameOrder, MIN_WORDS, MAX_WORDS } from './scramble';
import { checkAnswer, checkDrill } from './answer';
import { drillItems } from './grammarDrill';
import { transformItems, checkTransform } from './transformDrill';
import { comprehensionItems } from './comprehension';
import { passageLines } from './keyVerses';
import { rngFor, shuffled } from './gameRandom';
import { WEAK_EASE } from './wordStats';

export const WORDS_PER_LESSON = 4;
export const VERSES_PER_LESSON = 2;
// Words per lesson heard before they are read: a pick-the-meaning step with the
// Italian hidden and spoken instead.
export const LISTEN_PER_LESSON = 2;

// Steps that only present something — no verdict, never re-queued.
const UNGRADED = new Set(['intro', 'tip', 'match']);
// Steps where the learner produced the answer from memory by typing. Only
// these are evidence of recall, so only these feed the SRS.
const TYPED = new Set(['cloze', 'recall']);

export const isGraded = (step) => !!step && !UNGRADED.has(step.kind);

function cardsOf(week) {
  return (week?.vocab || [])
    .map((t) => ({ ...parseVocab(t), weekN: week.n }))
    .filter((c) => c.it && c.en);
}

// Split n items into ceil(n / size) groups of near-equal length, larger first
// (7 → 4 + 3, 5 → 3 + 2), so no lesson is left holding a single word.
export function balancedChunks(items, size = WORDS_PER_LESSON) {
  const n = items.length;
  if (!n) return [];
  const groups = Math.ceil(n / size);
  const base = Math.floor(n / groups);
  let extra = n % groups;
  const out = [];
  let at = 0;
  for (let g = 0; g < groups; g++) {
    const len = base + (extra-- > 0 ? 1 : 0);
    out.push(items.slice(at, at + len));
    at += len;
  }
  return out;
}

const isCapitalized = (s) => /^[A-ZÀ-Þ]/.test(String(s || ''));

// Up to `n` wrong options. Candidates sharing the right answer's initial case
// come first: a capitalized answer among lowercase distractors answers itself.
function wrongOptions(pool, correct, rng, n = 3) {
  const uniq = [...new Set(pool)].filter((x) => x && x !== correct);
  const same = uniq.filter((x) => isCapitalized(x) === isCapitalized(correct));
  const rest = uniq.filter((x) => !same.includes(x));
  return [...shuffled(same, rng), ...shuffled(rest, rng)].slice(0, n);
}

// direction 'it-en': see the Italian, pick the meaning. 'en-it': the reverse.
function choiceStep(card, all, rng, direction, extra = {}) {
  const pick = direction === 'it-en' ? (c) => c.en : (c) => c.it;
  const correct = pick(card);
  const wrong = wrongOptions(all.map(pick), correct, rng);
  if (!wrong.length) return null;
  const options = shuffled([correct, ...wrong], rng);
  return {
    kind: 'choice',
    direction,
    term: card.it,
    prompt: direction === 'it-en' ? card.it : card.en,
    options,
    answer: options.indexOf(correct),
    ...extra,
  };
}

function buildStep(text, en, rng, extra = {}) {
  const tokens = scrambleTokens(text);
  if (tokens.length < MIN_WORDS || tokens.length > MAX_WORDS) return null;
  return { kind: 'build', text, en: en || '', chips: shuffleScramble(tokens, rng), ...extra };
}

// The fill-the-blank step for a word, or — when its example never contains the
// word literally — rebuilding that example instead, so every word still gets a
// sentence-level exercise.
function sentenceStep(card, rng) {
  const cloze = makeCloze(card.it, card.ex, card.form);
  if (cloze) return { kind: 'cloze', term: card.it, card, ...cloze };
  return buildStep(card.ex, card.exEn, rng, { term: card.it });
}

function wordSteps(words, all, rng, listenRng) {
  const steps = words.map((card) => ({ kind: 'intro', term: card.it, card }));
  if (words.length >= 2) {
    const idx = words.map((_, i) => i);
    steps.push({
      kind: 'match',
      pairs: words.map((c) => ({ it: c.it, en: c.en })),
      left: shuffled(idx, rng),
      right: shuffled(idx, rng),
    });
  }
  for (const card of shuffled(words, rng)) steps.push(choiceStep(card, all, rng, 'it-en'));
  // Drawn from its own seeded stream, so adding these steps moved none of the
  // random choices made for the steps around them.
  for (const card of shuffled(words, listenRng).slice(0, LISTEN_PER_LESSON)) {
    steps.push(choiceStep(card, all, listenRng, 'it-en', { audio: true }));
  }
  for (const card of words) steps.push(sentenceStep(card, rng));
  for (const card of shuffled(words, rng)) steps.push({ kind: 'recall', term: card.it, card });
  return steps.filter(Boolean);
}

function grammarSteps(week) {
  const steps = [];
  if (week?.grammar?.title && week.grammar.body) {
    steps.push({ kind: 'tip', title: week.grammar.title, body: week.grammar.body });
  }
  for (const d of drillItems(week)) steps.push({ kind: 'drill', q: d.q, a: d.a, hint: d.hint || '' });
  return steps;
}

// A verse to rebuild by ear. A whole verse when it is short enough; otherwise
// its first clause of buildable length. A clause carries no English — the
// authored translation is of the whole verse and would not line up.
function verseStep(line, rng) {
  const extra = { audio: true, ref: line.ref };
  const whole = buildStep(line.t, line.en, rng, extra);
  if (whole) return whole;
  for (const clause of line.t.split(/(?<=[,;:])\s+/)) {
    const step = buildStep(clause, '', rng, { ...extra, partial: true });
    if (step) return step;
  }
  return null;
}

function passageSteps(week, all, rng) {
  const steps = [];
  const verses = passageLines(week)
    .map((l) => verseStep(l, rng))
    .filter(Boolean)
    .slice(0, VERSES_PER_LESSON);
  steps.push(...verses);
  for (const c of comprehensionItems(week)) {
    steps.push({ kind: c.type, it: c.it, en: c.en || '', options: c.options, answer: c.answer, explain: c.explain || '' });
  }
  for (const t of transformItems(week)) {
    steps.push({ kind: 'transform', instruction: t.instruction, base: t.base, answer: t.answer });
  }
  return { steps, recap: shuffled(all, rng).map((card) => choiceStep(card, all, rng, 'en-it')).filter(Boolean) };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

// ── Adapting a lesson to what the learner already knows ─────────────────────
// The plan itself stays deterministic (same lesson for everyone, same keys),
// so adapting happens when a lesson is started, from the SRS store.
//   known — seen at least KNOWN_REPS times, a KNOWN_DAYS+ interval, not due and
//           not relearning: its steps are dropped (the match board stays).
//   weak  — WEAK_LAPSES or more misses, or low ease: one extra recall at the end.
export const KNOWN_REPS = 3;
export const KNOWN_DAYS = 14;
export const WEAK_LAPSES = 2;
const ADAPTED_KINDS = new Set(['intro', 'choice', 'cloze', 'build', 'recall']);

export function wordLevel(st, now = Date.now()) {
  if (!st) return 'normal';
  if ((st.lapses || 0) >= WEAK_LAPSES || (typeof st.ease === 'number' && st.ease < WEAK_EASE)) return 'weak';
  if ((st.reps || 0) >= KNOWN_REPS && (st.interval || 0) >= KNOWN_DAYS && st.due > now && !st.relearn) return 'known';
  return 'normal';
}

export function adaptLesson(lesson, store = {}, now = Date.now()) {
  if (lesson?.kind !== 'words') return lesson;
  const known = new Set();
  const weak = [];
  for (const term of lesson.words) {
    const level = wordLevel(store[term], now);
    if (level === 'known') known.add(term);
    else if (level === 'weak') weak.push(term);
  }
  // Nothing to adapt, or nothing left to learn — keep the lesson whole.
  if ((!known.size && !weak.length) || known.size === lesson.words.length) return lesson;

  const steps = lesson.steps.filter((s) => !(known.has(s.term) && ADAPTED_KINDS.has(s.kind)));
  const lastRecall = steps.map((s) => s.kind === 'recall' && !s.practice).lastIndexOf(true);
  const extras = weak
    .map((term) => {
      const card = lesson.steps.find((s) => s.term === term && s.card)?.card;
      return card ? { kind: 'recall', term, card, practice: true } : null;
    })
    .filter(Boolean);
  steps.splice(lastRecall >= 0 ? lastRecall + 1 : steps.length, 0, ...extras);

  return {
    ...lesson,
    steps: steps.map((s, id) => ({ ...s, id })),
    minutes: Math.max(2, Math.round(steps.length / 3)),
    adapted: { skipped: known.size, extra: extras.length },
  };
}

function finish(week, n, kind, title, sub, words, steps) {
  return {
    key: `${week.n}.${n}`,
    weekN: week.n,
    n,
    kind,
    title,
    sub,
    words: words.map((c) => c.it),
    steps: steps.map((s, id) => ({ ...s, id })),
    // ~20 s a step, honest enough for a "how long is this" label.
    minutes: Math.max(2, Math.round(steps.length / 3)),
  };
}

// All lessons for one week, in the order they should be taken.
export function weekLessons(week) {
  if (!week) return [];
  const all = cardsOf(week);
  const chunks = balancedChunks(all);
  const grammar = grammarSteps(week);
  const lessons = [];

  chunks.forEach((words, i) => {
    const n = lessons.length + 1;
    const rng = rngFor(`lesson:${week.n}:${n}`);
    const last = i === chunks.length - 1;
    const listenRng = rngFor(`lesson:${week.n}:${n}:listen`);
    const steps = [...wordSteps(words, all, rng, listenRng), ...(last ? grammar : [])];
    const title = chunks.length > 1 ? `Parole nuove ${ROMAN[i] || i + 1}` : 'Parole nuove';
    const sub = `${words.length} new word${words.length === 1 ? '' : 's'}${last && grammar.length ? ' + grammar' : ''}`;
    lessons.push(finish(week, n, 'words', title, sub, words, steps));
  });

  const n = lessons.length + 1;
  const rng = rngFor(`lesson:${week.n}:${n}`);
  const passage = passageSteps(week, all, rng);
  // A week with no words keeps its grammar by moving it here.
  const body = [...(chunks.length ? [] : grammar), ...passage.steps];
  if (body.length) {
    lessons.push(finish(week, n, 'passage', 'Il brano', week.r || 'The passage', [], [...body, ...passage.recap]));
  }
  return lessons;
}

// ── Checking ────────────────────────────────────────────────────────────────
// `value` is whatever the step's UI collects: a string for typed steps, an
// array of chip indices for build, an option index for choice/mc, a boolean
// for tf, and `true` once a match board is cleared.

export function isReady(step, value) {
  switch (step?.kind) {
    case 'intro':
    case 'tip':
      return true;
    case 'match':
      return value === true;
    case 'build':
      return Array.isArray(value) && value.length === step.chips.length;
    case 'choice':
    case 'mc':
      return Number.isInteger(value);
    case 'tf':
      return typeof value === 'boolean';
    default:
      return typeof value === 'string' && value.trim().length > 0;
  }
}

// → { correct: true | false | null, answer, note }. `correct: null` means the
// step has no verdict. `answer` is the text to show the learner either way.
export function checkStep(step, value) {
  switch (step?.kind) {
    case 'cloze':
      return { correct: checkAnswer(step.answer, value), answer: step.answer, note: step.card.exEn || '' };
    case 'recall':
      return { correct: checkAnswer(step.card.it, value), answer: step.card.it, note: '' };
    case 'drill':
      return { correct: checkDrill(step.a, value), answer: step.a, note: step.hint };
    case 'transform':
      return { correct: checkTransform(step, value).correct, answer: step.answer, note: '' };
    case 'build':
      return {
        correct: sameOrder(scrambleTokens(step.text), (value || []).map((i) => step.chips[i])),
        answer: step.text,
        note: step.en,
      };
    case 'choice':
      return { correct: value === step.answer, answer: step.options[step.answer], note: '' };
    case 'mc':
      return { correct: value === step.answer, answer: step.options[step.answer], note: step.explain };
    case 'tf':
      return { correct: value === step.answer, answer: step.answer ? 'Vero' : 'Falso', note: step.explain };
    default:
      return { correct: null, answer: '', note: '' };
  }
}

// The value that passes a graded step — what the tests replay a lesson with.
export function solutionFor(step) {
  switch (step?.kind) {
    case 'cloze': return step.answer;
    case 'recall': return step.card.it;
    case 'drill': return step.a;
    case 'transform': return step.answer;
    case 'choice':
    case 'mc':
    case 'tf':
      return step.answer;
    case 'build': {
      const used = new Set();
      return scrambleTokens(step.text).map((tok) => {
        const i = step.chips.findIndex((c, ci) => c === tok && !used.has(ci));
        used.add(i);
        return i;
      });
    }
    default:
      return null;
  }
}

// ── A run through a lesson ──────────────────────────────────────────────────
// A missed graded step comes back once at the end of the queue. Only the first
// attempt at a step counts toward the score and the SRS; the retry is practice.

export function startRun(lesson) {
  return { queue: lesson?.steps || [], index: 0, first: {} };
}

export const currentStep = (run) => run.queue[run.index] || null;
export const isFinished = (run) => run.index >= run.queue.length;
export const progress = (run) => (run.queue.length ? Math.min(1, run.index / run.queue.length) : 1);

// `correct` is the verdict from checkStep (null for ungraded steps).
export function advance(run, correct) {
  const step = currentStep(run);
  if (!step) return run;
  let { queue, first } = run;
  if (correct !== null && correct !== undefined && isGraded(step)) {
    if (!step.retry && !(step.id in first)) first = { ...first, [step.id]: !!correct };
    if (!correct && !step.retry) queue = [...queue, { ...step, retry: true }];
  }
  return { queue, first, index: run.index + 1 };
}

export function summarize(run) {
  const results = Object.values(run.first);
  const correct = results.filter(Boolean).length;
  return {
    graded: results.length,
    correct,
    pct: results.length ? Math.round((correct / results.length) * 100) : 100,
  };
}

// SRS grades earned by a run: one per word that was typed from memory.
//   recall missed        → 'again'
//   recall right, but the fill-the-blank missed → 'hard'
//   every typed answer right → 'good'
// Taps (match, multiple choice) never count — a one-in-four guess is not
// recall. A word already scheduled and not yet due is left alone, so redoing a
// lesson cannot inflate its interval.
export function srsGrades(lesson, run, store = {}, now = Date.now()) {
  const byTerm = new Map();
  for (const step of lesson?.steps || []) {
    if (!TYPED.has(step.kind) || step.practice || !(step.id in run.first)) continue;
    const entry = byTerm.get(step.term) || { recall: null, other: true };
    if (step.kind === 'recall') entry.recall = run.first[step.id];
    else entry.other = entry.other && run.first[step.id];
    byTerm.set(step.term, entry);
  }
  const out = [];
  for (const [term, r] of byTerm) {
    if (r.recall === null) continue;
    const st = store[term];
    if (st && st.due > now) continue;
    out.push({ term, grade: !r.recall ? 'again' : r.other ? 'good' : 'hard' });
  }
  return out;
}
