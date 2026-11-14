// Generate cross-validation fixtures for BibbiaCore's Swift tests by running
// the web app's REAL JS logic modules and recording their outputs.
//
//   node ios-native/scripts/generate-fixtures.mjs
//
// The Swift ports in BibbiaCore must reproduce these outputs exactly — the
// XCTest suite (FixtureTests.swift) loads these JSON files and asserts
// equality, so any behavioral drift between the web and iOS logic layers
// fails CI. Re-run whenever the JS utils or the course content change.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';
import { resolve as resolveExtensionless } from './resolve-js-hook.mjs';

// The web modules use Vite-style extension-less imports; teach Node to
// resolve them before dynamically importing anything from src/.
// `registerHooks` (in-thread, synchronous hooks) replaces the deprecated
// `register` (DEP0205); it needs Node >= 22.15, which CI pins to 24.
registerHooks({ resolve: resolveExtensionless });

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const outDir = join(here, '..', 'BibbiaCore', 'Tests', 'BibbiaCoreTests', 'Fixtures');
mkdirSync(outDir, { recursive: true });

const { toIPA } = await import(join(repoRoot, 'src/utils/it2ipa.js'));
const { scorePronunciation, normalize } = await import(join(repoRoot, 'src/utils/pronunciation.js'));
const { canonical, checkAnswer } = await import(join(repoRoot, 'src/utils/answer.js'));
const { makeCloze } = await import(join(repoRoot, 'src/utils/cloze.js'));
const { review } = await import(join(repoRoot, 'src/utils/srs.js'));
const { setFlag, currentStreak, todayFlags, weekStrip } = await import(join(repoRoot, 'src/utils/streak.js'));
const lessonFeedback = await import(join(repoRoot, 'src/utils/lessonFeedback.js'));
const { SOUNDS } = await import(join(repoRoot, 'src/utils/sfx.js'));
const { diffReconstruction } = await import(join(repoRoot, 'src/utils/dictogloss.js'));
const { tokenize } = await import(join(repoRoot, 'src/utils/vocabIndex.js'));
const { lookupCommon } = await import(join(repoRoot, 'src/utils/it2en.js'));
const { phases } = await import(join(repoRoot, 'courses/it-bible-cei/content.js'));

const cards = phases.flatMap((p) => p.weeks.flatMap((w) => w.vocab))
  .map(([it, en, ex, ipa]) => ({ it, en, ex, ipa }));

function write(name, obj) {
  writeFileSync(join(outDir, name), JSON.stringify(obj, null, name === 'tutor.json' || name === 'lessons.json' ? 0 : 1) + '\n');
  console.log(`wrote ${name}`);
}

// ── IPA: every distinct word in the vocab terms + examples, plus tricky cases ──
const ipaWords = new Set([
  'figlio', 'figli', 'gli', 'gnocchi', 'agnello', 'scienza', 'pesce', 'scheda',
  'chiesa', 'perché', 'città', 'virtù', 'ghiaccio', 'oggi', 'faccia', 'braccio',
  'azzurro', 'pizza', 'zio', 'casa', 'cosa', 'passo', 'stella', 'quando', 'acqua',
  'uomo', 'piede', 'più', 'già', 'però', 'sciogliere', 'esempio', 'principio',
]);
for (const c of cards) {
  for (const src of [c.it, c.ex]) {
    for (const t of tokenize(src)) {
      if (t.isWord) ipaWords.add(t.text.toLowerCase());
    }
  }
}
const ipa = {};
for (const w of [...ipaWords].sort()) ipa[w] = toIPA(w);
write('ipa.json', ipa);

// ── Pronunciation scoring ──
const pronunCases = [];
for (const c of cards.slice(0, 80)) {
  pronunCases.push({ target: c.it, recognized: c.it });
  pronunCases.push({ target: c.it, recognized: c.en });
  pronunCases.push({ target: c.ex, recognized: c.ex.split(' ').slice(0, -1).join(' ') });
}
pronunCases.push({ target: 'perché', recognized: 'perche' });
pronunCases.push({ target: 'la luce', recognized: 'la lucé' });
pronunCases.push({ target: 'x', recognized: '' });
write('pronunciation.json', pronunCases.map((p) => ({ ...p, score: scorePronunciation(p.target, p.recognized) })));

// ── normalize() ──
const normCases = ['La Luce!', "l'unzione", 'PERCHÉ', '  già detto  ', 'Gesù è il Signore'];
write('normalize.json', normCases.map((s) => ({ input: s, out: normalize(s) })));

// ── canonical() + checkAnswer() ──
const answerCases = [];
for (const c of cards) {
  const stripped = c.it.replace(/^\S+\s+/, '');
  answerCases.push({ expected: c.it, given: c.it });
  answerCases.push({ expected: c.it, given: stripped });
  answerCases.push({ expected: c.it, given: c.it.slice(0, -1) });    // 1-char typo
  answerCases.push({ expected: c.it, given: c.en });                 // wrong language
}
answerCases.push({ expected: 'la luce', given: 'La Luce!' });
answerCases.push({ expected: "l'alleluja", given: 'alleluja' });
answerCases.push({ expected: 'credere', given: '' });
answerCases.push({ expected: 'perché', given: 'perche' });
write('answer.json', answerCases.map((p) => ({ ...p, ok: checkAnswer(p.expected, p.given) })));
write('canonical.json', cards.slice(0, 60).map((c) => ({ input: c.it, out: canonical(c.it) })));

// ── Cloze for every card ──
write('cloze.json', cards.map((c) => ({
  term: c.it,
  example: c.ex,
  result: makeCloze(c.it, c.ex),
})));

// ── SRS review sequences (fixed timestamps, 1 day apart) ──
const T0 = 1750000000000; // fixed epoch ms
const seqs = [
  ['good'],
  ['good', 'good'],
  ['good', 'good', 'good'],
  ['good', 'good', 'good', 'good'],
  ['again'],
  ['again', 'again', 'again'],
  ['good', 'again', 'good'],
  ['good', 'good', 'again', 'good', 'good'],
  ['good', 'good', 'good', 'again', 'good', 'good', 'good'],
];
write('srs.json', seqs.map((grades) => {
  let card = null;
  const states = [];
  grades.forEach((g, i) => {
    card = review(card, g, T0 + i * 86400000);
    states.push({ ...card });
  });
  return { grades, now0: T0, stepMs: 86400000, states };
}));

// ── The Today card's seven-day strip ──
write('weekStrip.json', [
  { store: {}, today: '2026-11-14' },
  { store: { last: '2026-11-14', current: 3, best: 3 }, today: '2026-11-14' },
  { store: { last: '2026-11-13', current: 2, best: 5 }, today: '2026-11-14' },
  { store: { last: '2026-11-11', current: 5, best: 5 }, today: '2026-11-14' },
  { store: { last: '2026-11-14', current: 40, best: 40 }, today: '2026-11-14' },
  { store: { last: '2026-03-02', current: 4, best: 4 }, today: '2026-03-02' },
  { store: { last: '2027-01-01', current: 2, best: 2 }, today: '2027-01-02' },
].map((sc) => ({ ...sc, days: weekStrip(sc.store, sc.today) })));

// ── Lesson feedback: praise, the run of right answers, the sound table ──
{
  const answers = [true, true, true, false, true, true, true, true, true, true, false, true];
  const retries = [false, false, false, false, false, true, false, false, false, false, false, false];
  let combo = 0;
  write('lessonFeedback.json', {
    comboMin: lessonFeedback.COMBO_MIN,
    praise: Array.from({ length: 12 }, (_, i) => lessonFeedback.praiseFor(i)),
    run: answers.map((correct, i) => {
      combo = lessonFeedback.nextCombo(combo, correct, retries[i]);
      return { correct, retry: retries[i], combo, sound: lessonFeedback.soundFor(correct, combo) };
    }),
    sounds: Object.entries(SOUNDS).map(([name, notes]) => ({
      name, notes: notes.map(([freq, start, length, wave]) => ({ freq, start, length, wave })),
    })),
  });
}

// ── Streak scenarios (explicit `today` strings → timezone-independent) ──
// Each scenario replays `ops` (setFlag calls) from an empty store, then checks
// the resulting store, the streak as seen on `streakOn`, and today's flags.
const streakOps = [
  { name: 'first-day', ops: [['read', '2026-07-01']], streakOn: '2026-07-01' },
  { name: 'three-days',
    ops: [['read', '2026-07-01'], ['practiced', '2026-07-02'], ['journaled', '2026-07-03']],
    streakOn: '2026-07-03' },
  { name: 'next-day-grace',
    ops: [['read', '2026-07-01'], ['practiced', '2026-07-02'], ['journaled', '2026-07-03']],
    streakOn: '2026-07-04' },
  { name: 'gap-breaks',
    ops: [['read', '2026-07-01'], ['practiced', '2026-07-02'], ['journaled', '2026-07-03']],
    streakOn: '2026-07-06' },
  { name: 'restart-after-gap',
    ops: [['read', '2026-07-01'], ['practiced', '2026-07-02'], ['journaled', '2026-07-03'], ['read', '2026-07-06']],
    streakOn: '2026-07-06' },
  { name: 'month-rollover',
    ops: [['read', '2026-02-28'], ['read', '2026-03-01']],
    streakOn: '2026-03-01' },
  { name: 'same-day-twice',
    ops: [['read', '2026-07-05'], ['practiced', '2026-07-05']],
    streakOn: '2026-07-05' },
  { name: 'flags-roll-over',
    ops: [['read', '2026-07-05'], ['practiced', '2026-07-05']],
    streakOn: '2026-07-06', flagsOn: '2026-07-06' },
];
write('streak.json', streakOps.map((sc) => {
  let s = {};
  for (const [flag, today] of sc.ops) s = setFlag(s, flag, today);
  const out = {
    name: sc.name,
    ops: sc.ops.map(([flag, today]) => ({ flag, today })),
    store: { ...s },
    streakOn: sc.streakOn,
    streak: currentStreak(s, sc.streakOn),
  };
  if (sc.flagsOn) {
    out.flagsOn = sc.flagsOn;
    out.flags = todayFlags(s, sc.flagsOn);
  }
  return out;
}));

// ── Dictogloss ──
const v1 = 'In principio era il Verbo, il Verbo era presso Dio e il Verbo era Dio.';
const dictoCases = [
  { original: v1, attempt: v1 },
  { original: v1, attempt: 'in principio era il verbo' },
  { original: v1, attempt: 'Il Verbo era presso Dio' },
  { original: v1, attempt: '' },
  { original: 'La luce splende nelle tenebre', attempt: 'la lucé splende nélle tenebre!' },
  { original: "se conoscessi il dono di Dio", attempt: 'il dono di dio se conoscessi' },
  { original: 'la la la', attempt: 'la la' },
];
write('dictogloss.json', dictoCases.map((c) => {
  const d = diffReconstruction(c.original, c.attempt);
  return { ...c, score: d.score, originalOk: d.original.map((m) => m.ok), attemptOk: d.attempt.map((m) => m.ok) };
}));

// ── Common-word glosses (it2en) over every distinct word in the course text ──
// Tokens keep their original casing so the fixture also exercises the
// case-insensitive lookup; curly-apostrophe and unknown-word cases are added
// explicitly. gloss is null when the web returns no gloss — the Swift port
// must return nil for exactly the same words.
const glossWords = new Set(['l’uomo', "L'UOMO", 'xyzzy', "l'xyzzy", "un'ora"]);
for (const p of phases) {
  for (const w of p.weeks) {
    const texts = [
      w.prompt?.it,
      ...w.vocab.map((v) => v[2]),
      ...(w.passage?.verses || []).map((v) => v.t),
    ];
    for (const text of texts) {
      for (const t of tokenize(text || '')) if (t.isWord) glossWords.add(t.text);
    }
  }
}
write('commonGloss.json', [...glossWords].sort().map((w) => ({ word: w, gloss: lookupCommon(w) })));

// ── Clause skeleton (Struttura): every passage verse + vocab example, plus the
// hand-picked cases the JS tests pin. Per token, one role letter
// (. plain, f finite, c compound, p participle) and one dim bit, so a
// mismatch names the exact token that drifted.
const { analyze } = await import(join(repoRoot, 'src/utils/clauseSkeleton.js'));
const ROLE = { plain: '.', finite: 'f', compound: 'c', participle: 'p' };
const skeletonTexts = new Set([
  'Tommaso, uno dei Dodici, chiamato Dìdimo, non era con loro.',
  'Pochi giorni dopo, il figlio più giovane, raccolte tutte le sue cose, partì per un paese lontano.',
  'Li condusse a casa sua, apparecchiò la mensa.',
  'ma, entrate, non trovarono il corpo',
  'a portare ai poveri il lieto annuncio',
  "senza averne sentito parlare?",
]);
for (const p of phases) {
  for (const w of p.weeks) {
    for (const v of w.passage?.verses || []) skeletonTexts.add(v.t);
    for (const v of w.vocab) if (v[2]) skeletonTexts.add(v[2]);
  }
}
write('clauseSkeleton.json', [...skeletonTexts].map((text) => {
  const r = analyze(text);
  return {
    text,
    roles: r.tokens.map((t) => ROLE[t.role]).join(''),
    dims: r.tokens.map((t) => (t.dim ? '1' : '0')).join(''),
    finiteCount: r.finiteCount,
    hasParenthetical: r.hasParenthetical,
  };
}));

// ── Rosary: the full step list for every mystery set, plus the weekday map ──
// buildSteps is pure structure, so recording it for all four sets pins the
// Swift port to the same 79 steps in the same order with the same metadata.
const { rosary } = await import(join(repoRoot, 'courses/it-bible-cei/rosary.js'));
const { buildSteps, setForDay } = await import(join(repoRoot, 'src/utils/rosary.js'));
write('rosary.json', {
  weekdays: [0, 1, 2, 3, 4, 5, 6].map((d) => setForDay(d, rosary.sets).id),
  sets: rosary.sets.map((set) => ({
    id: set.id,
    steps: buildSteps(rosary, set).map((s) => ({
      kind: s.kind,
      prayerId: s.prayerId ?? null,
      section: String(s.section),
      bead: s.bead,
      count: s.count ? `${s.count.n}/${s.count.of}` : null,
      virtue: s.virtue?.it ?? null,
      text: s.text ?? null,
    })),
  })),
});

// ── Voice tutor + verse practice: chunks, fade order, spoken matching, every week's
// lesson, and whole lessons replayed event by event against the real engine.
const { readingLines, expandRef, verseRefs, splitSentences } = await import(join(repoRoot, 'src/utils/keyVerses.js'));
const { verseChunks } = await import(join(repoRoot, 'src/utils/verseChunks.js'));
const { canonSpoken, matchesSpoken } = await import(join(repoRoot, 'src/utils/spokenAnswer.js'));
const { verseTokens, fadeOrder, stageSizes, wordMatches } = await import(join(repoRoot, 'src/utils/verseRecall.js'));
const {
  buildLesson, createTutor, next: tutorNext, parseCommand, scoreRepeat, rankFocusWords, pickEvenly,
  parseWordQuestion, glossWord, breakdownPieces, repeatText, textLevel, firstLetter,
} =
  await import(join(repoRoot, 'src/utils/tutorEngine.js'));

const allWeeks = phases.flatMap((p) => p.weeks);
const verseTexts = allWeeks.flatMap((w) => readingLines(w).map((l) => l.t));

function stepJson(s) {
  return {
    kind: s.kind, lines: (s.lines ?? []).map((l) => ({ ref: l.ref, t: l.t, en: l.en })),
    text: s.text ?? '', en: s.en ?? '', verseId: s.verseId ?? '', first: !!s.first, q: s.q ?? '',
    answers: s.answers ?? [], model: s.model ?? '', before: s.before ?? '', answer: s.answer ?? '',
    after: s.after ?? '', full: s.full ?? '', hint: s.hint ?? '', hintEn: s.hintEn ?? '',
  };
}
const utter = (u) => ({ text: u.text, en: u.en, slow: u.rate === 'slow', line: u.line ?? null });
function effectJson(e) {
  if (e.type === 'speak') return { type: 'speak', utterance: utter(e.utterance) };
  if (e.type === 'finish') return { type: 'finish', summary: e.summary };
  return { type: e.type };
}
function stateJson(s) {
  return {
    i: s.i, sub: s.sub, phase: s.phase, attempt: s.attempt, stepOk: s.stepOk, slow: s.slow, typing: s.typing,
    silentStreak: s.silentStreak, pausedReason: s.pausedReason, then: s.then, queue: s.queue.map(utter),
    tone: s.feedback?.tone ?? null, heard: s.feedback?.heard ?? null, score: s.feedback?.score ?? null,
    words: s.feedback?.words ?? [], totals: s.totals, missed: s.missed, recalled: s.recalled,
    wordMisses: s.wordMisses, focusWords: s.focusWords,
    support: s.support, passStreak: s.passStreak, breakdowns: s.breakdowns, pieces: s.pieces, pieceI: s.pieceI,
    peek: s.peek, hinted: s.hinted, glossed: s.glossed, piece: !!s.feedback?.piece, textLevel: textLevel(s),
  };
}

function rightAnswer(st) {
  const step = st.lesson.steps[st.i];
  if (step.kind === 'repeat') return repeatText(st, step);
  if (step.kind === 'ask') return step.answers[0];
  if (step.kind === 'recall') return step.answer;
  return st.focusWords[st.sub];
}
// A policy looks at the state at each turn and picks the learner's next event.
const POLICIES = {
  perfect: (st) => ({ type: 'heard', alternatives: [rightAnswer(st)] }),
  wrong: (st) => (st.lesson.steps[st.i].kind === 'focus'
    ? { type: 'heard', alternatives: [rightAnswer(st)] }
    : { type: 'heard', alternatives: ['la casa grande'] }),
  silent: (st, n) => (n % 7 === 6 ? { type: 'resume' } : { type: 'noSpeech' }),
  commands: (st, n) => {
    const cycle = [
      { type: 'command', command: 'repeat' }, { type: 'command', command: 'slower' },
      { type: 'heard', alternatives: ['ripeti'] }, { type: 'heard', alternatives: ['andiamo avanti insieme'] },
      { type: 'override' }, { type: 'command', command: 'skip' }, { type: 'pause', reason: null },
      { type: 'resume' }, { type: 'setTyping', on: true }, { type: 'typed', text: 'non lo so' },
      { type: 'setTyping', on: false }, { type: 'micUnavailable' }, { type: 'typed', text: rightAnswer(st) },
      { type: 'setTyping', on: false },
    ];
    return cycle[n % cycle.length];
  },
  // Good, then bad: support rises and falls, and retried passes earn no credit.
  mixed: (st, n) => (n % 3 === 2 && st.lesson.steps[st.i].kind !== 'focus'
    ? { type: 'heard', alternatives: ['la casa grande'] }
    : { type: 'heard', alternatives: [rightAnswer(st)] }),
  // Fails each line into its breakdown, gets the pieces right, then the whole line.
  recovering: (st) => {
    const step = st.lesson.steps[st.i];
    const fail = step.kind === 'repeat' && !st.pieces.length && st.attempt < 2;
    return { type: 'heard', alternatives: [fail ? 'la casa grande' : rightAnswer(st)] };
  },
  // Silence and overrides inside a breakdown.
  quietPieces: (st, n) => {
    if (!st.pieces.length) {
      const step = st.lesson.steps[st.i];
      return { type: 'heard', alternatives: [step.kind === 'repeat' && st.attempt >= 2 ? rightAnswer(st) : step.kind === 'repeat' ? 'la casa grande' : rightAnswer(st)] };
    }
    return n % 2 ? { type: 'noSpeech' } : { type: 'override' };
  },
  // Word questions, known and unknown, before every answer.
  questions: (st, n) => [
    { type: 'heard', alternatives: ['che vuol dire principio?'] },
    { type: 'heard', alternatives: ['cosa significa pizza'] },
    { type: 'typed', text: "What does l'uomo mean?" },
    { type: 'heard', alternatives: [rightAnswer(st)] },
  ][n % 4],
  // Reveals the faded text before answering, whenever there is any to reveal.
  peeking: (st) => (textLevel(st) > 0 ? { type: 'showText' } : { type: 'heard', alternatives: [rightAnswer(st)] }),
  stops: (st, n) => (n < 4 ? { type: 'heard', alternatives: [rightAnswer(st)] } : { type: 'heard', alternatives: ['basta'] }),
};
function replay(week, policy) {
  let cur = tutorNext(createTutor(buildLesson(week)), { type: 'start' });
  const turns = [{ event: { type: 'start' }, effects: cur.effects.map(effectJson), state: stateJson(cur.state) }];
  let n = 0;
  for (let guard = 0; guard < 1500 && cur.state.phase !== 'done'; guard++) {
    const event = cur.state.phase === 'speaking' ? { type: 'spoken' } : POLICIES[policy](cur.state, n++);
    cur = tutorNext(cur.state, event);
    turns.push({ event, effects: cur.effects.map(effectJson), state: stateJson(cur.state) });
  }
  return { week: week.n, policy, turns };
}
const answerProbes = ['il Verbo', 'è il Verbo', 'verbo', 'la casa', '', "l'uomo", 'Gesù Cristo', 'non lo so'];
write('tutor.json', {
  canon: [...verseTexts.slice(0, 60), '«Pace a voi!».', "L'uomo’s  (test)"].map((s) => ({ input: s, out: canonSpoken(s) })),
  match: allWeeks.flatMap((w) => (w.questions ?? []).flatMap((q) =>
    [q.model, q.answers[0], ...answerProbes.slice(0, 4)].map((t) => ({ answers: q.answers, transcript: t, ok: matchesSpoken(q, t) })))),
  sentences: verseTexts.map((t) => ({ text: t, out: splitSentences(t) })),
  chunks: verseTexts.map((t) => ({ text: t, out: verseChunks(t) })),
  refs: allWeeks.map((w) => ({
    week: w.n, ref: w.passage?.ref ?? '', expanded: expandRef(w.passage?.ref ?? ''),
    rows: verseRefs(w).map((r) => ({ ref: r.ref, t: r.t, en: r.en, id: r.id, fullRef: r.fullRef })),
  })),
  badRefs: ['', 'Giovanni', '1,2', 'Giovanni x,y'].map((r) => ({ ref: r, out: expandRef(r) })),
  recall: verseTexts.map((t) => ({ text: t, tokens: verseTokens(t), order: fadeOrder(t), sizes: stageSizes(fadeOrder(t).length) })),
  words: [['il', 'al'], ['la', 'le'], ['la', 'la'], ['Verbo', 'verbo'], ['perché', 'perche'], ['principio', 'principo'],
    ['Verbo', ' '], ['tenebre', 'luce'], ["l'uomo", 'uomo'], ['è', 'e']].map(([e, g]) => ({ expected: e, given: g, ok: wordMatches(e, g) })),
  commands: ['Ripeti', 'più lentamente', 'Avanti.', 'basta', 'stop', 'andiamo avanti', 'ancora una volta', 'Piu piano', ''].map((t) => ({ text: t, out: parseCommand(t) })),
  scores: verseTexts.slice(0, 20).flatMap((t) => [t, t.replace(/[«»,.;:!?]/g, ''), 'la casa grande'].map((h) => ({ target: t, heard: h, score: scoreRepeat(t, h) }))),
  focus: [{ tenebre: 1, verbo: 3, luce: 1, vita: 1 }, { è: 2, e: 2, città: 2 }, {}].map((m) => ({ misses: m, out: rankFocusWords(m) })),
  even: [[8, 4], [37, 12], [3, 5], [13, 12]].map(([n, max]) => ({ n, max, out: pickEvenly(Array.from({ length: n }, (_, i) => i), max) })),
  lessons: allWeeks.map((w) => ({ week: w.n, steps: buildLesson(w).steps.map(stepJson) })),
  wordQuestions: [
    'Che vuol dire vinsero?', 'cosa significa la luce', 'che cosa vuol dire città', 'che cosa vuole dire «tenebre»?',
    "cosa vuol dire l'uomo", 'che cosa vuol dire la parola città', 'What does tenebre mean?', 'what does the word tenebre mean',
    'che vuol dire', 'what does mean', 'the word', 'la casa significa molto', 'che vuol dire la parola',
    'che vuol dire questo versetto nel vangelo di oggi', '', 'what does a b c d e mean', '?',
  ].map((text) => ({ text, out: parseWordQuestion(text) })),
  gloss: [...new Set([
    ...allWeeks.flatMap((w) => w.vocab.flatMap((t) => [t[0], t[4]?.form].filter(Boolean))),
    ...allWeeks.flatMap((w) => buildLesson(w).steps.filter((s) => s.kind === 'recall').map((s) => s.answer)),
    'la luce', 'vinsero', "l'uomo", 'pizza', 'una pizza', 'LUCE', 'il pane della vita',
  ])].map((word) => ({ word, out: glossWord(word) })),
  pieces: [...new Set(allWeeks.flatMap((w) => buildLesson(w).steps).filter((s) => s.kind === 'repeat').map((s) => s.text))]
    .map((text) => ({ text, out: breakdownPieces(text) })),
  letters: ['verbo', 'è', 'Àncora', ''].map((word) => ({ word, out: firstLetter(word) })),
  runs: [
    ...[1, 26, 37].map((n) => replay(allWeeks.find((w) => w.n === n), 'perfect')),
    ...[1, 26, 30].flatMap((n) => ['wrong', 'silent', 'commands', 'stops'].map((p) => replay(allWeeks.find((w) => w.n === n), p))),
    ...[26].flatMap((n) => ['mixed', 'recovering', 'quietPieces', 'questions', 'peeking'].map((p) => replay(allWeeks.find((w) => w.n === n), p))),
  ],
});

// ── Conversa: prompts for every week, sentence splitting, and whole conversations replayed
// event by event against the real engine, with scripted model replies.
const { conversaOpening, conversaSystem, passageText, trimHistory, translatePrompt } =
  await import(join(repoRoot, 'src/utils/tutorPrompts.js'));
const { cleanReply, pushDelta, flushBuffer } = await import(join(repoRoot, 'src/utils/sentenceStream.js'));
const { createConversa, next: conversaNext, MAX_TURNS, STREAK_TURNS } = await import(join(repoRoot, 'src/utils/conversaEngine.js'));

function streamOf(deltas) {
  let buffer = '';
  const out = [];
  for (const d of deltas) {
    const r = pushDelta(buffer, d);
    out.push(...r.sentences);
    buffer = r.buffer;
  }
  return { deltas, out: [...out, ...flushBuffer(buffer)] };
}

const convoUtter = (u) => ({ text: u.text, en: u.en, slow: u.rate === 'slow' });
function convoEffect(e) {
  if (e.type === 'speak') return { type: 'speak', utterance: convoUtter(e.utterance) };
  if (e.type === 'finish') return { type: 'finish', summary: e.summary };
  if (e.type === 'generate') return { type: 'generate', id: e.id, system: e.system, messages: e.messages };
  return { type: e.type };
}
function convoState(s) {
  return {
    phase: s.phase, queue: s.queue.map(convoUtter), history: s.history, turns: s.turns, genId: s.genId,
    generating: s.generating, regenerate: s.regenerate, buffer: s.buffer, reply: s.reply, lastReply: s.lastReply,
    slow: s.slow, typing: s.typing, silentStreak: s.silentStreak, pausedReason: s.pausedReason, failure: s.failure,
    closing: s.closing, glossed: s.glossed,
  };
}

// A step is an event, or a name for a common one. 'drain' plays out queued speech, and
// events with no id get the current generation's. `stale` uses the one before it.
const heard = (text) => ({ type: 'heard', alternatives: [text] });
const delta = (text, extra = {}) => ({ type: 'delta', text, ...extra });
const GEN = { type: 'generated' };
function conversation(name, weekN, steps, { typing = false, missedWords = [] } = {}) {
  const week = allWeeks.find((w) => w.n === weekN);
  const turns = [];
  let cur = { state: createConversa(week, { typing, missedWords }) };
  const apply = (event) => {
    cur = conversaNext(cur.state, event);
    turns.push({ event, effects: cur.effects.map(convoEffect), state: convoState(cur.state) });
  };
  const drain = () => { for (let g = 0; g < 100 && cur.state.phase === 'speaking'; g++) apply({ type: 'spoken' }); };
  apply({ type: 'start' });
  drain();
  for (const step of steps) {
    if (step === 'drain') { drain(); continue; }
    const { stale, ...event } = step;
    const needsId = ['delta', 'generated', 'failed'].includes(event.type);
    apply(needsId ? { ...event, id: stale ? cur.state.genId - 1 : cur.state.genId } : event);
  }
  drain();
  return { name, week: weekN, typing, missedWords, turns };
}
const oneTurn = (text, reply = 'Va bene. Che cosa pensi?') => [heard(text), delta(reply), GEN, 'drain'];

write('conversa.json', {
  prompts: allWeeks.flatMap((w) => [[], ['tenebre', 'città']].map((hard) => ({
    week: w.n, hard, opening: conversaOpening(w), passage: passageText(w), system: conversaSystem(w, { missedWords: hard }),
  }))),
  trims: [
    { messages: [], max: 100 },
    { messages: [['user', 'x'.repeat(10)], ['assistant', 'x'.repeat(10)], ['user', 'x'.repeat(10)]], max: 100 },
    { messages: [['user', 'x'.repeat(50)], ['assistant', 'x'.repeat(50)], ['user', 'x'.repeat(50)]], max: 60 },
    { messages: [['user', 'x'.repeat(90)], ['assistant', 'x'.repeat(20)], ['user', 'x'.repeat(20)]], max: 45 },
    { messages: [['assistant', 'Che cosa?'], ['user', 'Città è perché']], max: 1600 },
    { messages: [['user', 'è'.repeat(50)]], max: 10 },
  ].map(({ messages, max }) => {
    const ms = messages.map(([role, content]) => ({ role, content }));
    return { messages: ms, max, out: trimHistory(ms, max) };
  }),
  cleans: ['**Bene!** Questa è la `parola`.', '# Titolo', '- primo\n- secondo', '1. primo', '> citazione', "Va' e anche tu fa' così.", '_corsivo_ ~x~', '  a   b  ', '']
    .map((input) => ({ input, out: cleanReply(input) })),
  streams: [
    ['Sì, è vero. Che ', 'cosa pensi? '], ['Bene.'], ['Bene.', ' Ora'], ['Giovanni 1,1.5 e poi.'], ['Primo.\n\n  Secondo.'],
    ['Sì, è così. Perché?'], ['*** --- '], ['...'], ['Uno! Due? Tre; quattro.'], Array.from('La luce splende! Che cosa pensi?'),
    ['**Bene!** Che', ' cosa pensi?'], ['«Pace a voi!». E poi.'], [''], [],
  ].map(streamOf),
  translate: { text: 'Che cosa hai letto?', system: translatePrompt('Che cosa hai letto?').system },
  maxTurns: MAX_TURNS,
  streakTurns: STREAK_TURNS,
  runs: [
    conversation('a plain turn', 1, oneTurn('La luce è bella.')),
    conversation('hard words reach the prompt', 26, oneTurn('Paolo parla.'), { missedWords: ['tenebre'] }),
    conversation('a reply in many pieces, speaking as it goes', 1, [
      heard('Ciao'), delta('Sì, è '), delta('vero. Che '), { type: 'spoken' }, delta('cosa pensi? E '), delta('tu?'), GEN, 'drain',
    ]),
    conversation('markdown', 1, oneTurn('Ciao', '**Bene!** Che `cosa` pensi?')),
    conversation('a stale stream changes nothing', 1, [
      heard('Ciao'), { type: 'pause' }, delta('Tardi. ', { stale: true }), { type: 'generated', stale: true },
      { type: 'failed', reason: 'error', stale: true }, { type: 'resume' }, delta('Nuovo. ', { stale: true }), delta('Nuovo. '), GEN, 'drain',
    ]),
    conversation('pausing a reply half way asks afresh', 1, [
      heard('Ciao'), delta('Metà. '), { type: 'pause', reason: 'manual' }, { type: 'resume' }, delta('Intera. '), GEN, 'drain',
    ]),
    conversation('pausing a finished reply repeats the same sentence', 1, [
      heard('Ciao'), delta('Uno. Due.'), GEN, { type: 'pause' }, { type: 'resume' }, 'drain',
    ]),
    conversation('failure, then retry', 1, [
      heard('Ciao'), { type: 'failed', reason: 'error' }, 'drain', { type: 'retry' }, delta('Eccomi.'), GEN, 'drain',
    ]),
    conversation('refusal, then rephrase', 30, [
      heard('Tutti hanno bisogno della grazia.'), { type: 'failed', reason: 'refused' }, 'drain', { type: 'rephrase' }, heard('Altro'), delta('Bene.'), GEN, 'drain',
    ]),
    conversation('an empty reply fails', 1, [heard('Ciao'), GEN, 'drain', { type: 'command', command: 'stop' }]),
    conversation('a letterless reply fails', 1, [heard('Ciao'), delta('*** ---'), GEN, 'drain', { type: 'rephrase' }]),
    conversation('failure mid-reply drops the rest', 1, [heard('Ciao'), delta('Uno. Due. '), { type: 'failed' }, 'drain']),
    conversation('commands', 1, [
      ...oneTurn('Ciao', 'Uno. Due.'), heard('ripeti'), 'drain', heard('più lentamente'), 'drain',
      ...oneTurn('Altro'), { type: 'command', command: 'repeat' }, 'drain',
      heard('avanti'), { type: 'command', command: 'repeat' }, delta('Nuovo.'), GEN, 'drain', heard('basta'),
    ]),
    conversation('a failed change of topic takes no turn away', 1, [
      ...oneTurn('Ciao'), heard('avanti'), { type: 'failed' }, 'drain', { type: 'rephrase' }, { type: 'command', command: 'stop' },
    ]),
    conversation('word questions', 1, [
      heard('che vuol dire principio?'), 'drain', heard('cosa significa pizza'), 'drain', ...oneTurn('Ciao'),
    ]),
    conversation('silence, then a pause, then resuming', 1, [
      { type: 'noSpeech' }, 'drain', heard('   '), 'drain', { type: 'noSpeech' }, { type: 'resume' }, 'drain', ...oneTurn('Ciao'),
    ]),
    conversation('typing from the start', 1, [
      heard('ignorato'), { type: 'typed', text: 'Ciao' }, delta('Bene.'), GEN, 'drain', { type: 'setTyping', on: false }, { type: 'setTyping', on: true },
    ], { typing: true }),
    conversation('the mic failing mid-way', 1, [{ type: 'micUnavailable' }, { type: 'typed', text: 'Ciao' }, delta('Bene.'), GEN, 'drain']),
    conversation('all the way to the closing line', 1, Array.from({ length: MAX_TURNS }, (_, n) => oneTurn(`Turno ${n}`)).flat()),
    conversation('a long conversation trims its history', 37, Array.from({ length: 8 }, (_, n) => oneTurn(`Turno ${n} ${'parola '.repeat(40)}`, `Risposta ${n}. ${'altra '.repeat(30)}fine.`)).flat()),
  ],
});

console.log('done');

// ── Guided lessons: the seeded PRNG, the strict checkers, every week's full
// lesson plan, replayed runs with their SRS grades, the Continue decision, and
// the smart-mix style ladder. The plan is deterministic, so the Swift port has
// to reproduce every shuffle — this pins it step for step.
const { hashSeed, rngFor, shuffled } = await import(join(repoRoot, 'src/utils/gameRandom.js'));
const { checkDrill } = await import(join(repoRoot, 'src/utils/answer.js'));
const { checkTransform } = await import(join(repoRoot, 'src/utils/transformDrill.js'));
const lessonPlan = await import(join(repoRoot, 'src/utils/lessonPlan.js'));
const lessonStore = await import(join(repoRoot, 'src/utils/lessonStore.js'));
const { styleFor } = await import(join(repoRoot, 'src/utils/reviewMix.js'));
const { buildCards } = await import(join(repoRoot, 'course/vocab.js'));

const lessonStepJson = (s) => ({
  id: s.id, kind: s.kind, term: s.term ?? null, cardIt: s.card?.it ?? null,
  direction: s.direction ?? null, prompt: s.prompt ?? null,
  options: s.options ?? [],
  answerIndex: s.kind === 'choice' || s.kind === 'mc' ? s.answer : null,
  answerBool: s.kind === 'tf' ? s.answer : null,
  pairs: (s.pairs ?? []).map((p) => `${p.it}=${p.en}`), left: s.left ?? [], right: s.right ?? [],
  before: s.before ?? null,
  answerText: s.kind === 'drill' ? s.a : s.kind === 'cloze' || s.kind === 'transform' ? s.answer : null,
  after: s.after ?? null,
  text: s.kind === 'build' ? s.text : s.kind === 'tf' || s.kind === 'mc' ? s.it : s.kind === 'transform' ? s.base : null,
  en: s.en ?? null, chips: s.chips ?? [], audio: !!s.audio, partial: !!s.partial, ref: s.ref ?? null,
  title: s.title ?? null, body: s.body ?? null, q: s.q ?? null, hint: s.hint ?? null,
  explain: s.explain ?? null, instruction: s.instruction ?? null,
});

const allLessons = allWeeks.flatMap((w) => lessonPlan.weekLessons(w));

function lessonRun(lesson, missIds, store, now) {
  let run = lessonPlan.startRun(lesson);
  while (!lessonPlan.isFinished(run)) {
    const step = lessonPlan.currentStep(run);
    const correct = lessonPlan.isGraded(step) ? (step.retry ? true : !missIds.includes(step.id)) : null;
    run = lessonPlan.advance(run, correct);
  }
  return {
    key: lesson.key, miss: missIds, store, now,
    queue: run.queue.map((s) => `${s.id}${s.retry ? 'r' : ''}`),
    first: Object.fromEntries(Object.entries(run.first).map(([k, v]) => [String(k), v])),
    summary: lessonPlan.summarize(run),
    grades: lessonPlan.srsGrades(lesson, run, store, now).map((g) => `${g.term}=${g.grade}`),
  };
}
const idsOf = (lesson, kind) => lesson.steps.filter((s) => s.kind === kind).map((s) => s.id);
const LESSON_NOW = 1_800_000_000_000;
const runCases = [];
for (const lesson of [allLessons[0], allLessons[1], allLessons[2], allLessons[40], allLessons.at(-1)]) {
  runCases.push(lessonRun(lesson, [], {}, LESSON_NOW));
  runCases.push(lessonRun(lesson, idsOf(lesson, 'recall'), {}, LESSON_NOW));
  runCases.push(lessonRun(lesson, [...idsOf(lesson, 'cloze').slice(0, 1), ...idsOf(lesson, 'choice').slice(0, 1),
    ...idsOf(lesson, 'build').slice(0, 1), ...idsOf(lesson, 'tf')], {}, LESSON_NOW));
  const [a, b] = lesson.words;
  if (a && b) {
    runCases.push(lessonRun(lesson, [], {
      [a]: { ease: 2.5, interval: 3, reps: 2, lapses: 0, due: LESSON_NOW + 1000 },
      [b]: { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: LESSON_NOW - 1000 },
    }, LESSON_NOW));
  }
}

const lessonPlans = allWeeks.map((w) => ({ weekN: w.n, lessons: lessonPlan.weekLessons(w) }));
const keysOfWeek = (n) => lessonPlans.find((p) => p.weekN === n).lessons.map((l) => l.key);
const nextCases = [
  { done: [], currentWeekN: 1, due: 0 },
  { done: ['1.1'], currentWeekN: 1, due: 7 },
  { done: keysOfWeek(1), currentWeekN: 1, due: 7 },
  { done: keysOfWeek(1), currentWeekN: 1, due: 0 },
  { done: ['5.1'], currentWeekN: 5, due: 0 },
  { done: keysOfWeek(37), currentWeekN: 37, due: 0 },
  { done: keysOfWeek(37), currentWeekN: 37, due: 2 },
  { done: ['1.1', '1.2'], currentWeekN: null, due: 5 },
  { done: lessonPlans.flatMap((p) => p.lessons.map((l) => l.key)), currentWeekN: null, due: 5 },
  { done: lessonPlans.flatMap((p) => p.lessons.map((l) => l.key)), currentWeekN: null, due: 0 },
].map((c) => {
  const store = c.done.reduce((s, k) => lessonStore.completeLesson(s, k, 100, '2026-01-01'), { done: {} });
  const a = lessonStore.nextAction({ plans: lessonPlans, store, currentWeekN: c.currentWeekN, due: c.due });
  return { ...c, out: { kind: a.kind, key: a.lesson?.key ?? null, ahead: !!a.ahead, due: a.due ?? null } };
});

const allDrills = allWeeks.flatMap((w) => w.drill ?? []);
const drillCases = [
  ...allDrills.flatMap((d) => [
    { expected: d.a, given: d.a },
    { expected: d.a, given: `  ${d.a.toUpperCase()}. ` },
    { expected: d.a, given: normalize(d.a) },
    { expected: d.a, given: `${d.a}x` },
    { expected: d.a, given: d.a.slice(1) },
  ]),
  { expected: 'è', given: 'e' }, { expected: 'perché', given: 'perche' }, { expected: "l'uomo", given: 'l’uomo' },
  { expected: 'abbiamo creduto', given: 'abbiamo  credutto' }, { expected: 'ha', given: '' },
];
const allTransforms = allWeeks.flatMap((w) => w.transform ?? []);
const transformCases = allTransforms.flatMap((t) => [
  { answer: t.answer, typed: t.answer },
  { answer: t.answer, typed: t.base },
  { answer: t.answer, typed: normalize(t.answer).replace(/[.,;:!?]/g, '').toUpperCase() },
  { answer: t.answer, typed: `${t.answer} sì` },
]);

const mixCards = buildCards(phases).slice(0, 40);
const mixStates = [null, { reps: 0, relearn: 0 }, { reps: 1, relearn: null }, { reps: 2, relearn: null },
  { reps: 3 }, { reps: 4, relearn: null }, { reps: 9, relearn: 1 }];

write('lessons.json', {
  rng: ['lesson:1:1', 'lesson:37:3', '', 'città è', '2026-11-09'].map((seed) => {
    const rng = rngFor(seed);
    return {
      seed, hash: hashSeed(seed),
      values: [rng(), rng(), rng(), rng()],
      shuffle: shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rngFor(seed)),
    };
  }),
  drill: drillCases.map((c) => ({ ...c, ok: checkDrill(c.expected, c.given) })),
  transform: transformCases.map((c) => ({ ...c, ok: checkTransform({ answer: c.answer }, c.typed).correct })),
  weeks: lessonPlans.map((p) => ({
    n: p.weekN,
    lessons: p.lessons.map((l) => ({
      key: l.key, n: l.n, kind: l.kind, title: l.title, sub: l.sub, words: l.words, minutes: l.minutes,
      steps: l.steps.map(lessonStepJson),
    })),
  })),
  runs: runCases,
  next: nextCases,
  mix: mixCards.flatMap((card) => mixStates.map((st) => ({
    it: card.it, reps: st?.reps ?? null, relearn: st?.relearn ?? null, hasState: !!st,
    style: styleFor(card, st ?? undefined),
  }))),
});
