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
import { register } from 'node:module';

// The web modules use Vite-style extension-less imports; teach Node to
// resolve them before dynamically importing anything from src/.
register(new URL('./resolve-js-hook.mjs', import.meta.url));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const outDir = join(here, '..', 'BibbiaCore', 'Tests', 'BibbiaCoreTests', 'Fixtures');
mkdirSync(outDir, { recursive: true });

const { toIPA } = await import(join(repoRoot, 'src/utils/it2ipa.js'));
const { scorePronunciation, normalize } = await import(join(repoRoot, 'src/utils/pronunciation.js'));
const { canonical, checkAnswer } = await import(join(repoRoot, 'src/utils/answer.js'));
const { makeCloze } = await import(join(repoRoot, 'src/utils/cloze.js'));
const { review } = await import(join(repoRoot, 'src/utils/srs.js'));
const { setFlag, currentStreak, todayFlags } = await import(join(repoRoot, 'src/utils/streak.js'));
const { diffReconstruction } = await import(join(repoRoot, 'src/utils/dictogloss.js'));
const { tokenize } = await import(join(repoRoot, 'src/utils/vocabIndex.js'));
const { phases } = await import(join(repoRoot, 'courses/it-bible-cei/content.js'));

const cards = phases.flatMap((p) => p.weeks.flatMap((w) => w.vocab))
  .map(([it, en, ex, ipa]) => ({ it, en, ex, ipa }));

function write(name, obj) {
  writeFileSync(join(outDir, name), JSON.stringify(obj, null, 1) + '\n');
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

console.log('done');
