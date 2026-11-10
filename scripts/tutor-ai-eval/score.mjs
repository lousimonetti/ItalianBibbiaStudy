// Scores runner output against the pass criteria in plan-tutor.md, and writes a report
// a person can read, because the numbers here can't judge how natural the Italian is.
//   node scripts/tutor-ai-eval/score.mjs out/results-<model>.json [more...]

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(here, 'out', 'cases.json'), 'utf8'));
const byId = new Map(cases.map((c) => [c.id, c]));

const ENGLISH = new Set(['the', 'and', 'you', 'is', 'are', 'this', 'that', 'what', 'with', 'for', 'of', 'to', 'it']);
const CORRECTION = /\b(si dice|non si dice|dovresti dire|devi dire|corretto|correzione|errore|sbagliat|hai sbagliato|attenzione)\b/i;

const words = (t) => t.toLowerCase().match(/[\p{L}']+/gu) ?? [];
const englishShare = (t) => {
  const w = words(t);
  return w.length ? w.filter((x) => ENGLISH.has(x)).length / w.length : 0;
};
const fold = (t) => t.toLowerCase().replace(/[^\p{L} ]+/gu, '').replace(/\s+/g, ' ').trim();

// Quoted text, or a long run of words in a Bible-citation frame, that isn't in the reading.
function inventedQuote(reply, passage) {
  const source = fold((passage ?? []).join(' '));
  const quoted = [...reply.matchAll(/[«"“]([^»"”]{12,})[»"”]/g)].map((m) => fold(m[1]));
  return quoted.find((q) => !source.includes(q)) ?? null;
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const verdict = (ok) => (ok ? 'PASS' : 'FAIL');

function score(file) {
  const { provider, model, results } = JSON.parse(readFileSync(file, 'utf8'));
  const of = (group) => results.filter((r) => byId.get(r.id)?.group === group);
  const explain = of('explain');
  const holdout = of('holdout');
  const correct = of('correct');
  const conversa = [...correct, ...of('conversa')];
  const guardrail = of('guardrail');

  const names = (rs) => rs.filter((r) => new RegExp(byId.get(r.id).mustMention, 'i').test(r.text)).length;
  const mentioned = names(explain);
  const falseCorrections = correct.filter((r) => CORRECTION.test(r.text));
  const answered = conversa.filter((r) => !r.error && r.text);
  const onStyle = answered.filter((r) => englishShare(r.text) < 0.1 && words(r.text).length <= 36);
  const invented = conversa.filter((r) => inventedQuote(r.text, byId.get(r.id).passage));
  const latency = median(conversa.map((r) => r.firstSentenceMs));
  const refused = guardrail.filter((r) => r.error);

  const lines = [
    `## ${provider}: ${model}`,
    '',
    '| Check | Result | Pass at | Automatic verdict |',
    '|---|---|---|---|',
    `| Explanations naming the right fact (first filter only, read them) | ${mentioned}/${explain.length} | 18/20 after reading | ${verdict(mentioned >= 18)} |`,
    ...(holdout.length ? [`| Held-out explanations naming the right fact (read them too) | ${names(holdout)}/${holdout.length} | no automatic bar | n/a |`] : []),
    `| False corrections on correct Italian | ${falseCorrections.length}/${correct.length} | at most 1 | ${verdict(falseCorrections.length <= 1)} |`,
    `| Conversa replies in Italian and within length | ${onStyle.length}/${answered.length} | 90% | ${verdict(answered.length > 0 && onStyle.length / answered.length >= 0.9)} |`,
    `| Replies quoting text not in the reading | ${invented.length} | 0 | ${verdict(invented.length === 0)} |`,
    `| Median time to first sentence | ${latency == null ? 'n/a' : `${(latency / 1000).toFixed(2)} s`} | at most 3 s | ${verdict(latency != null && latency <= 3000)} |`,
  ];
  if (guardrail.length) {
    const share = (refused.length / guardrail.length) * 100;
    lines.push(`| Guardrail refusals across every verse | ${refused.length}/${guardrail.length} (${share.toFixed(1)}%) | under 5% | ${verdict(share < 5)} |`);
  }
  lines.push('', '### Explanations', '');
  for (const r of [...explain, ...holdout]) {
    const c = byId.get(r.id);
    lines.push(`**${r.id}** (${c.ref}) expected "${c.expected}", heard "${c.input}"  `, `Fact: ${c.fact}  `, `Reply: ${r.error ? `ERROR ${r.error}` : r.text}`, '');
  }
  lines.push('### Conversation', '');
  for (const r of conversa) {
    const c = byId.get(r.id);
    lines.push(`**${r.id}** "${c.input}"${c.note ? ` (${c.note})` : ''}  `, `Reply: ${r.error ? `ERROR ${r.error}` : r.text}`, '');
  }
  if (refused.length) {
    lines.push('### Refused verses', '', ...refused.map((r) => `- ${r.id}: ${r.error}`), '');
  }
  return lines.join('\n');
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/tutor-ai-eval/score.mjs <results.json> [more...]');
  process.exit(1);
}
for (const f of files) {
  const report = score(resolve(f));
  const out = join(here, 'out', `report-${basename(f, '.json').replace(/^results-/, '')}.md`);
  writeFileSync(out, report);
  console.log(`${report.split('\n### Explanations')[0]}\n\n${out}\n`);
}
