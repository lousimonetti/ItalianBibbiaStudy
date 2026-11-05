// Runs the evaluation cases through a local Ollama model, recording the reply and timing.
//   node scripts/tutor-ai-eval/run-ollama.mjs <model>
// Writes out/results-<model>.json. Calls only localhost.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const model = process.argv[2];
if (!model) {
  console.error('usage: node scripts/tutor-ai-eval/run-ollama.mjs <model>');
  process.exit(1);
}

const cases = JSON.parse(readFileSync(join(here, 'out', 'cases.json'), 'utf8')).filter((c) => c.group !== 'guardrail');
const FIRST_SENTENCE = /[.!?](\s|$)/;

async function generate(c) {
  const started = performance.now();
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model,
      stream: true,
      think: false,
      keep_alive: '10m',
      options: { temperature: 0.4, num_predict: 200, num_ctx: 2048 },
      messages: [{ role: 'system', content: c.system }, ...c.messages],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  let text = '';
  let firstSentenceMs = null;
  let pending = '';
  const decoder = new TextDecoder();
  for await (const bytes of res.body) {
    pending += decoder.decode(bytes, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const data = JSON.parse(line);
      if (data.error) throw new Error(data.error);
      text += data.message?.content ?? '';
      if (firstSentenceMs === null && FIRST_SENTENCE.test(text)) firstSentenceMs = performance.now() - started;
    }
  }
  return { text: text.trim(), firstSentenceMs, totalMs: performance.now() - started };
}

// The first call also loads the model, which would distort the "already loaded" timing.
await generate({ system: 'Reply with one word.', messages: [{ role: 'user', content: 'Ciao' }] });

const results = [];
for (const c of cases) {
  try {
    results.push({ id: c.id, ...(await generate(c)), error: null });
  } catch (e) {
    results.push({ id: c.id, text: '', firstSentenceMs: null, totalMs: null, error: String(e.message ?? e) });
  }
  process.stdout.write(results.at(-1).error ? 'x' : '.');
}
const file = join(here, 'out', `results-${model.replace(/[^\w.-]+/g, '_')}.json`);
writeFileSync(file, JSON.stringify({ provider: 'ollama', model, results }, null, 1));
console.log(`\n${file}`);
