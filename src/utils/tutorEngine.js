// The voice tutor's lesson logic. A pure state machine with no DOM, timers or
// speech: `next(state, event)` returns the new state plus the effects the caller
// must carry out (speak this, listen now, stop everything), and the caller reports
// back with events such as `spoken` and `heard`. Keeping it pure is what lets a
// whole lesson be replayed in a test, and pinned against the Swift port by fixture.
//
// The tutor grades with the app's existing deterministic checks and never with a
// model. A lesson is: intro, listen, repeat each chunk, drill the words missed,
// answer questions, recall a missing word, recap.

import { readingLines, splitSentences, verseRefs } from './keyVerses';
import { lookupWord } from './vocabIndex';
import { lookupCommon } from './it2en';
import { verseChunks } from './verseChunks';
import { canonSpoken, matchesSpoken, questionItems } from './spokenAnswer';
import { scorePronunciation } from './pronunciation';
import { diffReconstruction } from './dictogloss';
import { TUTOR_LINES as L, TUTOR_PRAISE } from '../data/tutorScript';

export const PASS_SCORE = 70;     // recognizers mangle names, so be forgiving
export const MAX_RETRIES = 2;     // retries on a chunk before moving on
export const MAX_REPEATS = 12;    // keeps a lesson in the 5-8 minute range
export const MAX_FOCUS_WORDS = 3;
export const MAX_RECALLS = 2;
export const SILENT_LIMIT = 3;    // silent turns in a row before pausing
export const SUPPORT_MAX = 3;     // 0 shows the whole line; 3 is audio only
export const SUPPORT_RAISE_AFTER = 2; // first-try passes in a row to fade the text further
export const MAX_BREAKDOWNS = 3;  // lines split into pieces per lesson, to protect its length
export const MIN_BREAKDOWN_WORDS = 6; // anything shorter is already short enough to say

const COMMANDS = {
  ripeti: 'repeat', ancora: 'repeat', repeat: 'repeat', again: 'repeat',
  'piu lentamente': 'slower', lentamente: 'slower', 'piu piano': 'slower', slower: 'slower',
  avanti: 'skip', salta: 'skip', next: 'skip', skip: 'skip',
  basta: 'stop', stop: 'stop',
};

const canon = (s) => canonSpoken(String(s ?? '').replace(/[—–…-]/g, ' '));
const stripPunct = (w) => String(w).replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');

// A command must be the whole utterance, so a verse containing "avanti" is never
// mistaken for one. The caller also grades first, so a right answer always wins.
export function parseCommand(transcript) {
  return COMMANDS[canon(transcript)] ?? null;
}

const QUESTION_OPENERS = [
  'che cosa vuol dire', 'che cosa vuole dire', 'che cosa significa',
  'cosa vuol dire', 'cosa vuole dire', 'cosa significa',
  'che vuol dire', 'che vuole dire', 'che significa',
].map((o) => o.split(' '));
const MAX_ASKED_WORDS = 4; // longer than this is a sentence, not a word being asked about

const isTrimmedMark = (c) => '?!.,;:…"“”«»'.includes(c);

function trimMarks(text) {
  const chars = Array.from(text);
  let start = 0;
  let end = chars.length;
  while (start < end && isTrimmedMark(chars[start])) start++;
  while (end > start && isTrimmedMark(chars[end - 1])) end--;
  return chars.slice(start, end).join('');
}

// The word a learner is asking about, or null. Kept in the form it was said, since
// the accents and apostrophes that canon() removes are what the glossary looks up.
export function parseWordQuestion(transcript) {
  const tokens = String(transcript ?? '').trim().split(/\s+/).map(trimMarks).filter(Boolean);
  const lower = tokens.map((t) => t.toLowerCase());
  let asked = null;
  if (lower[0] === 'what' && lower[1] === 'does' && lower.at(-1) === 'mean') {
    asked = tokens.slice(2, -1);
  } else {
    const opener = QUESTION_OPENERS.find((o) => o.every((w, i) => lower[i] === w));
    if (opener) asked = tokens.slice(opener.length);
  }
  if (!asked?.length) return null;
  const leadIn = asked.slice(0, 2).map((t) => t.toLowerCase()).join(' ');
  if (leadIn === 'la parola' || leadIn === 'the word') asked = asked.slice(2);
  if (!asked.length || asked.length > MAX_ASKED_WORDS) return null;
  return asked.join(' ');
}

// The English for a word or short phrase, from the same glossary as tap-to-translate.
// A phrase nothing matches falls back to its last word ("la luce" to "luce").
export function glossWord(phrase) {
  const last = phrase.split(/\s+/).at(-1);
  for (const candidate of phrase === last ? [phrase] : [phrase, last]) {
    const en = lookupWord(candidate)?.en ?? lookupCommon(candidate);
    if (en) return en;
  }
  return null;
}

// Pieces for a line the learner can't get whole, or [] if it shouldn't be split.
export function breakdownPieces(text) {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  if (count < MIN_BREAKDOWN_WORDS) return [];
  const pieces = verseChunks(text, { maxWords: Math.ceil(count / 2), minWords: 2 });
  return pieces.length >= 2 ? pieces : [];
}

// Punctuation is stripped from both sides first: the recognizer returns none, and
// verses carry quotes and commas that would otherwise lower a correct repeat's score.
export function scoreRepeat(target, heard) {
  return scorePronunciation(canon(target), canon(heard));
}

// Evenly spaced picks in their original order, so a capped lesson still spans the
// whole passage instead of only drilling its opening.
export function pickEvenly(items, max) {
  if (items.length <= max) return items;
  return Array.from({ length: max }, (_, i) => items[Math.floor((i * items.length) / max)]);
}

function vocabKeys(week) {
  const keys = new Set();
  for (const tuple of week.vocab ?? []) {
    for (const raw of [tuple[0], tuple[4]?.form]) {
      for (const w of String(raw ?? '').split(/\s+/)) {
        const k = canon(stripPunct(w));
        if (k.length >= 4) keys.add(k);
      }
    }
  }
  return keys;
}

// One blanked word per verse, preferring the week's own vocabulary and falling
// back to the verse's longest word. Deterministic, so a lesson replays identically.
function buildRecalls(week, rows) {
  const vocab = vocabKeys(week);
  const candidates = rows.flatMap((row) => verseChunks(row.t).flatMap((chunk) => {
    const tokens = chunk.split(/\s+/).filter(Boolean);
    if (tokens.length < 4) return [];
    const scored = tokens
      .map((tok, i) => ({ i, word: stripPunct(tok), key: canon(stripPunct(tok)) }))
      .filter((c) => c.key.length >= 5)
      .sort((a, b) => Number(vocab.has(b.key)) - Number(vocab.has(a.key)) || b.key.length - a.key.length);
    const best = scored[0];
    if (!best) return [];
    const tok = tokens[best.i];
    const at = tok.indexOf(best.word);
    return [{
      kind: 'recall',
      verseId: row.id,
      en: row.en,
      // Punctuation stuck to the blanked word stays with its side of the gap.
      before: [...tokens.slice(0, best.i), tok.slice(0, at)].join(' ').trim(),
      answer: best.word,
      after: [tok.slice(at + best.word.length), ...tokens.slice(best.i + 1)].join(' ').trim(),
      full: chunk,
      inVocab: vocab.has(best.key),
    }];
  }));
  const seen = new Set();
  const perVerse = [...candidates]
    .sort((a, b) => Number(b.inVocab) - Number(a.inVocab))
    .filter((c) => (seen.has(c.verseId) ? false : seen.add(c.verseId)));
  return pickEvenly(perVerse, MAX_RECALLS).map(({ inVocab: _inVocab, ...step }) => step);
}

// The lesson is about the passage on screen, so it only asks what the passage
// answers. Questions on the week's wider reading stay in Rispondi subito.
function anchoredQuestions(week, lines) {
  const text = lines.map((l) => l.t).join(' ');
  return questionItems(week).filter((q) => matchesSpoken(q, text));
}

// The shortest stretch of the passage that answers a question, to replay as a hint.
function hintFor(q, rows) {
  for (const row of rows) {
    const chunk = verseChunks(row.t).find((c) => matchesSpoken(q, c));
    if (chunk) return { hint: chunk, hintEn: row.en };
  }
  const row = rows.find((r) => matchesSpoken(q, r.t));
  return row ? { hint: row.t, hintEn: row.en } : { hint: '', hintEn: '' };
}

export function buildLesson(week) {
  const lines = readingLines(week);
  if (!lines.length) return { weekN: week?.n ?? null, steps: [] };
  const rows = verseRefs(week);
  const chunks = rows.flatMap((row) => verseChunks(row.t).map((text) => ({ text, en: row.en, verseId: row.id })));
  return {
    weekN: week.n,
    steps: [
      { kind: 'intro' },
      { kind: 'listen', lines: rows.map(({ ref, t, en }) => ({ ref, t, en })) },
      ...pickEvenly(chunks, MAX_REPEATS).map((c, i) => ({ kind: 'repeat', ...c, first: i === 0 })),
      { kind: 'focus' },
      ...anchoredQuestions(week, lines).map((q, i) => ({
        kind: 'ask', q: q.q, answers: q.answers, model: q.model || q.answers[0], first: i === 0, ...hintFor(q, rows),
      })),
      ...buildRecalls(week, rows).map((r, i) => ({ ...r, first: i === 0 })),
      { kind: 'recap' },
    ],
  };
}

// Words missed most often, most-missed first, ties in code-point order so the web
// and Swift agree (localeCompare would depend on the device's locale).
export function rankFocusWords(wordMisses, max = MAX_FOCUS_WORDS) {
  return Object.entries(wordMisses)
    .sort(([a, x], [b, y]) => y - x || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, max)
    .map(([w]) => w);
}

const say = (line, en) => ({ text: line.it ?? line, en: line.en ?? en ?? '', rate: 'normal' });

// What the learner is being asked to say right now: a piece during a breakdown,
// otherwise the whole line.
export function repeatText(state, step) {
  return state.pieces.length ? state.pieces[state.pieceI] : step.text;
}

// How much of a Repeat line to hide, on the same 0-3 scale as `support`. Any retry
// or breakdown shows it all, since hiding text from someone already struggling
// would only punish them.
export function textLevel(state) {
  return state.attempt > 0 || state.peek || state.pieces.length ? 0 : state.support;
}

function prompt(state, step, withIntro) {
  const rate = state.slow ? 'slow' : 'normal';
  const speak = (text, en) => ({ text, en: en ?? '', rate });
  switch (step.kind) {
    case 'intro':
      return [say(L.intro)];
    case 'listen':
      return [
        ...(withIntro ? [say(L.listen)] : []),
        ...step.lines.flatMap((line, i) => splitSentences(line.t).map((text) => ({ ...speak(text, line.en), line: i }))),
      ];
    case 'repeat':
      return [...(withIntro && step.first ? [say(L.repeat)] : []), speak(repeatText(state, step), step.en)];
    case 'focus': {
      const word = state.focusWords[state.sub];
      return [...(withIntro && state.sub === 0 ? [say(L.focus)] : []), speak(word)];
    }
    case 'ask':
      return [...(withIntro && step.first ? [say(L.ask)] : []), speak(step.q)];
    case 'recall':
      return [
        ...(withIntro && step.first ? [say(L.recall)] : []),
        ...(/\p{L}/u.test(step.before) ? [speak(step.before, step.en)] : []),
        ...(/\p{L}/u.test(step.after) ? [speak(step.after, step.en)] : []),
      ];
    case 'recap':
      return [say(L.recap)];
    default:
      return [];
  }
}

const isInteractive = (step) => ['repeat', 'focus', 'ask', 'recall'].includes(step?.kind);
const currentStep = (state) => state.lesson.steps[state.i];

export function summarize(state, completed) {
  const { ok, total } = state.totals;
  return {
    weekN: state.lesson.weekN,
    ok,
    total,
    score: total ? Math.round((ok / total) * 100) : 0,
    missed: state.missed,
    recalled: state.recalled,
    completed,
  };
}

// Shared exit: say what is queued, then do what `then` says.
function run(state, extra = []) {
  if (state.queue.length) {
    return { state: { ...state, phase: 'speaking' }, effects: [...extra, { type: 'speak', utterance: state.queue[0] }] };
  }
  if (state.then === 'listen') {
    if (state.typing) return { state: { ...state, phase: 'typing' }, effects: extra };
    return { state: { ...state, phase: 'listening' }, effects: [...extra, { type: 'listen' }] };
  }
  if (state.then === 'finish') {
    return { state: { ...state, phase: 'done' }, effects: [...extra, { type: 'finish', summary: summarize(state, true) }] };
  }
  return advance(state, extra);
}

function enter(state, extra = []) {
  let s = {
    ...state, attempt: 0, stepOk: null, pieces: [], pieceI: 0, peek: false, hinted: false, glossed: null, supportDropped: false,
  };
  const step = currentStep(s);
  if (step.kind === 'focus') {
    const focusWords = s.sub === 0 && !s.focusWords.length ? rankFocusWords(s.wordMisses) : s.focusWords;
    s = { ...s, focusWords };
    if (s.sub >= focusWords.length) return advance(s, extra);
  }
  const then = isInteractive(step) ? 'listen' : step.kind === 'recap' ? 'finish' : 'advance';
  return run({ ...s, queue: prompt(s, step, true), then }, extra);
}

function advance(state, extra = []) {
  const step = currentStep(state);
  let { totals, missed, recalled } = state;
  const counted = isInteractive(step) && step.kind !== 'focus' && state.stepOk !== null;
  if (counted) {
    totals = { ok: totals.ok + (state.stepOk ? 1 : 0), total: totals.total + 1 };
    if (!state.stepOk && step.verseId && !missed.includes(step.verseId)) missed = [...missed, step.verseId];
    if (state.stepOk && step.kind === 'recall' && !recalled.includes(step.verseId)) recalled = [...recalled, step.verseId];
  }
  const base = { ...state, totals, missed, recalled, feedback: null };
  if (step.kind === 'focus' && state.sub + 1 < state.focusWords.length) {
    return enter({ ...base, sub: state.sub + 1 }, extra);
  }
  return enter({ ...base, i: state.i + 1, sub: 0 }, extra);
}

function grade(state, step, alternatives) {
  const alts = alternatives.filter((a) => String(a ?? '').trim());
  if (step.kind === 'repeat') {
    const target = repeatText(state, step);
    let best = alts[0] ?? '';
    let score = best ? scoreRepeat(target, best) : 0;
    for (const alt of alts) {
      const s = scoreRepeat(target, alt);
      if (s > score) { best = alt; score = s; }
    }
    return { ok: score >= PASS_SCORE, heard: best, score };
  }
  const item = step.kind === 'ask'
    ? step
    : { answers: [step.kind === 'focus' ? state.focusWords[state.sub] : step.answer] };
  const match = alts.find((alt) => matchesSpoken(item, alt));
  return { ok: match !== undefined, heard: match ?? alts[0] ?? '', score: null };
}

export const firstLetter = (word) => (Array.from(String(word))[0] ?? '').toUpperCase();

const praise = (state) => TUTOR_PRAISE[(state.i + state.sub + state.pieceI) % TUTOR_PRAISE.length];

// Only an unaided first try earns less text next time.
function creditPass(state, step) {
  if (step.kind !== 'repeat') return state;
  if (state.attempt > 0 || state.peek) return { ...state, passStreak: 0 };
  const passStreak = state.passStreak + 1;
  return passStreak >= SUPPORT_RAISE_AFTER
    ? { ...state, passStreak: 0, support: Math.min(SUPPORT_MAX, state.support + 1) }
    : { ...state, passStreak };
}

// A piece gets one ungraded try and then the lesson moves along, finishing on the
// whole line, which is the only try that counts.
function nextPiece(state, step, result) {
  const lead = result.ok ? [say(praise(state))] : result.heard ? [] : [say(L.notHeard)];
  const feedback = {
    tone: result.ok ? 'ok' : result.heard ? 'retry' : 'silent',
    heard: result.heard,
    score: result.score,
    words: [],
    piece: true,
  };
  const pieceI = state.pieceI + 1;
  const silentStreak = result.heard ? 0 : state.silentStreak;
  if (pieceI < state.pieces.length) {
    return run({
      ...state,
      feedback,
      silentStreak,
      pieceI,
      queue: [...lead, { text: state.pieces[pieceI], en: step.en, rate: 'slow' }],
      then: 'listen',
    });
  }
  return run({
    ...state,
    feedback,
    silentStreak,
    pieces: [],
    pieceI: 0,
    queue: [...lead, say(L.wholeLine), { text: step.text, en: step.en, rate: 'slow' }],
    then: 'listen',
  });
}

// A question costs no attempt: answer it, then ask again what was being asked.
function onWordQuestion(state, step, word) {
  const en = glossWord(word);
  return run({
    ...state,
    silentStreak: 0,
    glossed: en ? { word, en } : null,
    queue: [...(en ? [{ text: word, en, rate: 'slow' }] : [say(L.unknownWord)]), ...prompt(state, step, false)],
    then: 'listen',
  });
}

function onPass(state, step, result, extra = []) {
  const closing = step.kind === 'ask'
    ? [{ text: step.model, en: '', rate: 'normal' }]
    : step.kind === 'recall' ? [{ text: step.full, en: step.en, rate: 'normal' }] : [];
  return run({
    ...state,
    pieces: [],
    pieceI: 0,
    stepOk: true,
    silentStreak: 0,
    feedback: { tone: 'ok', heard: result.heard, score: result.score, words: [] },
    queue: [say(praise(state)), ...closing],
    then: 'advance',
  }, extra);
}

function missedWords(step, heard) {
  return diffReconstruction(step.text, heard).original
    .filter((m) => !m.ok)
    .map((m) => stripPunct(m.w).toLowerCase())
    .filter((w) => canon(w).length >= 3);
}

// A nudge after a wrong answer. Silence gets none, since nothing was tried yet.
function wrongAnswerHint(step) {
  if (step.kind === 'ask' && step.hint) {
    return [say(L.hint), { text: step.hint, en: step.hintEn, rate: 'normal' }];
  }
  if (step.kind === 'recall') {
    return [say(L.startsWith), { text: firstLetter(step.answer), en: '', rate: 'normal' }];
  }
  return [];
}

function onFail(state, step, result) {
  const silent = !result.heard;
  const prefix = silent ? [say(L.notHeard)] : [];
  const words = step.kind === 'repeat' && !silent ? missedWords(step, result.heard) : [];
  let wordMisses = state.wordMisses;
  if (words.length) {
    wordMisses = { ...wordMisses };
    for (const w of words) wordMisses[w] = (wordMisses[w] ?? 0) + 1;
  }
  // Silence isn't a miss, so it leaves the learner's support level alone.
  const dropSupport = step.kind === 'repeat' && !silent && !state.supportDropped;
  const base = {
    ...state,
    wordMisses,
    passStreak: step.kind === 'repeat' && !silent ? 0 : state.passStreak,
    support: dropSupport ? Math.max(0, state.support - 1) : state.support,
    supportDropped: state.supportDropped || dropSupport,
    feedback: { tone: silent ? 'silent' : 'retry', heard: result.heard, score: result.score, words },
  };
  const retries = step.kind === 'repeat' ? MAX_RETRIES : 1;

  if (state.attempt < retries) {
    const next = { ...base, attempt: state.attempt + 1 };
    if (step.kind === 'repeat') {
      const pieces = !silent && state.attempt === 1 && state.breakdowns < MAX_BREAKDOWNS ? breakdownPieces(step.text) : [];
      if (pieces.length) {
        return run({
          ...next,
          // Leaves one attempt, for the whole line once the pieces are done.
          attempt: retries,
          pieces,
          pieceI: 0,
          breakdowns: state.breakdowns + 1,
          queue: [say(L.piecemeal), { text: pieces[0], en: step.en, rate: 'slow' }],
          then: 'listen',
        });
      }
      const slowModel = { text: step.text, en: step.en, rate: 'slow' };
      const careful = words.length
        ? [say(L.careful), { text: words.slice(0, 2).join(', '), en: '', rate: 'slow' }]
        : [];
      return run({ ...next, queue: [...prefix, say(L.again), ...careful, slowModel], then: 'listen' });
    }
    const hint = silent ? [] : wrongAnswerHint(step);
    return run({
      ...next,
      hinted: hint.length > 0,
      queue: [...prefix, ...hint, say(L.tryAgain), ...prompt(state, step, false)],
      then: 'listen',
    });
  }

  const reveal = step.kind === 'ask'
    ? [say(L.answerIs), { text: step.model, en: '', rate: 'normal' }]
    : step.kind === 'recall'
      ? [say(L.answerIs), { text: step.full, en: step.en, rate: 'normal' }]
      : [say(L.moveOn)];
  return run({ ...base, stepOk: false, feedback: { ...base.feedback, tone: 'miss' }, queue: [...prefix, ...reveal], then: 'advance' });
}

function onCommand(state, command) {
  const step = currentStep(state);
  const stopAll = [{ type: 'cancel' }];
  switch (command) {
    case 'repeat':
    case 'slower': {
      const s = command === 'slower' ? { ...state, slow: true } : state;
      const then = isInteractive(step) ? 'listen' : step.kind === 'recap' ? 'finish' : 'advance';
      return run({ ...s, queue: prompt(s, step, false), then }, stopAll);
    }
    case 'skip':
      return step.kind === 'recap' ? { state, effects: [] } : advance({ ...state, stepOk: null, queue: [] }, stopAll);
    case 'stop':
      return {
        state: { ...state, phase: 'done', queue: [] },
        effects: [...stopAll, { type: 'finish', summary: summarize(state, false) }],
      };
    default:
      return { state, effects: [] };
  }
}

export function createTutor(lesson, { typing = false, resume = null } = {}) {
  return {
    lesson,
    i: resume?.i ?? 0,
    sub: resume?.sub ?? 0,
    phase: 'idle',
    queue: [],
    then: 'advance',
    attempt: 0,
    stepOk: null,
    feedback: null,
    slow: resume?.slow ?? false,
    typing,
    silentStreak: 0,
    pausedReason: null,
    totals: resume?.totals ?? { ok: 0, total: 0 },
    missed: resume?.missed ?? [],
    recalled: resume?.recalled ?? [],
    wordMisses: resume?.wordMisses ?? {},
    focusWords: resume?.focusWords ?? [],
    support: resume?.support ?? 0,
    passStreak: 0,
    supportDropped: false,
    breakdowns: resume?.breakdowns ?? 0,
    pieces: [],
    pieceI: 0,
    peek: false,
    hinted: false,
    glossed: null,
  };
}

// The part of a lesson worth keeping for a same-day resume.
export function snapshot(state) {
  const { i, sub, slow, totals, missed, recalled, wordMisses, focusWords, support, breakdowns } = state;
  return { i, sub, slow, totals, missed, recalled, wordMisses, focusWords, support, breakdowns };
}

export function next(state, event) {
  const nothing = { state, effects: [] };
  if (state.phase === 'done') return nothing;

  switch (event.type) {
    case 'start':
      return state.phase === 'idle' && state.lesson.steps.length ? enter(state) : nothing;

    case 'spoken': {
      if (state.phase !== 'speaking') return nothing;
      return run({ ...state, queue: state.queue.slice(1) });
    }

    case 'heard':
    case 'typed': {
      if (state.phase !== 'listening' && state.phase !== 'typing') return nothing;
      const step = currentStep(state);
      const alternatives = event.type === 'typed' ? [event.text] : event.alternatives;
      // The order matters. matchesSpoken accepts an answer inside a longer utterance,
      // so "che vuol dire la luce?" would pass as the answer "luce" if graded first.
      // On Repeat grading has to win instead: no verse in the course contains one of
      // these phrases today, but a course could add one, and repeating it isn't asking.
      const asked = parseWordQuestion(alternatives[0]);
      if (asked && step.kind !== 'repeat') return onWordQuestion(state, step, asked);
      const result = grade(state, step, alternatives);
      const inPieces = state.pieces.length > 0;
      if (result.ok) {
        return inPieces ? nextPiece(state, step, result) : onPass(creditPass(state, step), step, result);
      }
      const command = parseCommand(alternatives[0]);
      if (command) return onCommand({ ...state, silentStreak: 0 }, command);
      if (asked) return onWordQuestion(state, step, asked);
      if (inPieces) return nextPiece(state, step, result);
      return onFail({ ...state, silentStreak: result.heard ? 0 : state.silentStreak }, step, result);
    }

    case 'noSpeech': {
      if (state.phase !== 'listening') return nothing;
      const step = currentStep(state);
      const silentStreak = state.silentStreak + 1;
      if (silentStreak >= SILENT_LIMIT) {
        // Nobody is answering, so stop here instead of running through the lesson.
        return {
          state: { ...state, silentStreak, phase: 'paused', pausedReason: 'silent', queue: prompt(state, step, false), then: 'listen' },
          effects: [{ type: 'cancel' }],
        };
      }
      const quiet = { ...state, silentStreak };
      if (state.pieces.length) return nextPiece(quiet, step, { ok: false, heard: '', score: null });
      return onFail(quiet, step, { heard: '', score: null });
    }

    case 'micUnavailable': {
      const s = { ...state, typing: true };
      return state.phase === 'listening' ? { state: { ...s, phase: 'typing' }, effects: [] } : { state: s, effects: [] };
    }

    case 'setTyping': {
      const s = { ...state, typing: event.on };
      if (event.on && state.phase === 'listening') return { state: { ...s, phase: 'typing' }, effects: [{ type: 'cancel' }] };
      if (!event.on && state.phase === 'typing') return run(s);
      return { state: s, effects: [] };
    }

    case 'override': {
      const step = currentStep(state);
      if (!isInteractive(step) || state.stepOk === true || state.phase === 'paused' || state.phase === 'idle') return nothing;
      if (state.feedback?.piece) return nothing; // pieces are ungraded, so there is nothing to overturn
      return onPass(state, step, { heard: state.feedback?.heard ?? '', score: state.feedback?.score ?? null }, [{ type: 'cancel' }]);
    }

    case 'showText': {
      if (currentStep(state)?.kind !== 'repeat' || textLevel(state) === 0) return nothing;
      return { state: { ...state, peek: true, passStreak: 0, support: Math.max(0, state.support - 1) }, effects: [] };
    }

    case 'command':
      if (state.phase === 'idle' || state.phase === 'paused') {
        return event.command === 'stop' ? onCommand(state, 'stop') : nothing;
      }
      return onCommand(state, event.command);

    case 'pause':
      if (!['speaking', 'listening', 'typing'].includes(state.phase)) return nothing;
      return { state: { ...state, phase: 'paused', pausedReason: event.reason ?? 'manual' }, effects: [{ type: 'cancel' }] };

    case 'resume':
      if (state.phase !== 'paused') return nothing;
      return run({ ...state, pausedReason: null, silentStreak: 0 });

    default:
      return nothing;
  }
}
