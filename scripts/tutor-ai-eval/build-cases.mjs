// Turns the labelled cases into ready-to-run prompts, so the Ollama and Foundation Models
// runners send exactly the same text. Writes out/cases.json.
//   node scripts/tutor-ai-eval/build-cases.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';
import { resolve as resolveExtensionless } from '../../ios-native/scripts/resolve-js-hook.mjs';

// The web modules use Vite-style extensionless imports.
registerHooks({ resolve: resolveExtensionless });

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const { phases } = await import(join(root, 'courses/it-bible-cei/content.js'));
const { verseRefs } = await import(join(root, 'src/utils/keyVerses.js'));
const { explainPrompt, conversaPrompt, conversaOpening, missContext } = await import(join(root, 'src/utils/tutorPrompts.js'));
const { EXPLAIN_CASES, EXPLAIN_HOLDOUT, CORRECT_UTTERANCES, CONVERSA_TURNS } = await import(join(here, 'cases.mjs'));

const weeks = phases.flatMap((p) => p.weeks);
const weekN = (n) => weeks.find((w) => w.n === n);
const fold = (s) => s.replace(/[«»"]/g, '').replace(/\s+/g, ' ');

// Finds the case's text in the whole course, because the week noted beside a case is
// only a starting guess. A case that isn't in the course at all stops the run.
function verseFor(c) {
  const rows = (w) => verseRefs(w).map((row) => ({ week: w, row }));
  const hit = [...rows(weekN(c.week)), ...weeks.flatMap(rows)].find(({ row }) => fold(row.t).includes(fold(c.expected)));
  if (!hit) throw new Error(`Not in the course: "${c.expected}"`);
  return hit;
}

const explainCase = (group) => (c, i) => {
  const { week, row } = verseFor(c);
  const miss = missContext({ kind: 'repeat', text: c.expected, en: row.en }, c.heard, week);
  return {
    id: `${group}-${i + 1}`, group, week: week.n, ref: row.id, input: c.heard, expected: c.expected,
    fact: c.fact, mustMention: c.mustMention.source, ...explainPrompt(miss),
  };
};
const explain = EXPLAIN_CASES.map(explainCase('explain'));
const holdout = EXPLAIN_HOLDOUT.map(explainCase('holdout'));

const history = (w, text) => [
  { role: 'assistant', content: conversaOpening(w) },
  { role: 'user', content: text },
];
const conversa = (group) => (c, i) => {
  const w = weekN(c.week);
  if (c.about && !verseRefs(w).some((r) => r.t.includes(c.about))) {
    throw new Error(`Week ${c.week}'s reading doesn't contain "${c.about}": ${c.text}`);
  }
  return {
    id: `${group}-${i + 1}`, group, week: c.week, input: c.text, note: c.note ?? '',
    passage: verseRefs(w).map((r) => r.t), ...conversaPrompt(w, history(w, c.text)),
  };
};

// Every verse, to count how often Apple's guardrails refuse biblical text. Ollama skips these.
const guardrails = weeks.flatMap((w) => verseRefs(w).map((row) => ({
  id: `verse-${row.id}`, group: 'guardrail', week: w.n, input: row.t,
  ...explainPrompt(missContext({ kind: 'repeat', text: row.t, en: row.en }, 'la casa grande', w)),
})));

const out = join(here, 'out');
mkdirSync(out, { recursive: true });
const cases = [
  ...explain,
  ...holdout,
  ...CORRECT_UTTERANCES.map(conversa('correct')),
  ...CONVERSA_TURNS.map(conversa('conversa')),
  ...guardrails,
];
writeFileSync(join(out, 'cases.json'), JSON.stringify(cases, null, 1));
console.log(`${cases.length} cases: ${explain.length} explain, ${holdout.length} holdout, ${CORRECT_UTTERANCES.length} correct, ${CONVERSA_TURNS.length} conversa, ${guardrails.length} guardrail`);
