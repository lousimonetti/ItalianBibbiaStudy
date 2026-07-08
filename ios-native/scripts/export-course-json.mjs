// Export the active course definition to ios-native's bundled course.json.
//
//   node ios-native/scripts/export-course-json.mjs
//
// The iOS app is a native SwiftUI client of the same course data the web app
// uses. Rather than hand-transcribing 37 weeks into Swift source (which would
// drift), this script serializes courses/it-bible-cei into a stable JSON shape
// decoded by BibbiaCore's Course.swift. Re-run whenever the course content
// changes, then rebuild the app.
//
// Shape notes for the Swift Codable side:
//   - vocab tuples [it, en, ex, ipa?] become objects { it, en, ex, ipa? }
//   - comprehension `answer` (bool for tf, index for mc) is split into
//     `answerBool` / `answerIndex` so Swift avoids a union type
//   - speaking-layer fields (phrases/transform/questions) are exported too so a
//     future iOS version can render them without a schema change

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

const { config } = await import(join(repoRoot, 'courses/it-bible-cei/config.js'));
const { phases } = await import(join(repoRoot, 'courses/it-bible-cei/content.js'));
const { commonWordsData } = await import(join(repoRoot, 'src/utils/it2en.js'));

function exportVocab(tuples = []) {
  return tuples.map(([it, en, ex, ipa]) => ({ it, en, ex, ...(ipa ? { ipa } : {}) }));
}

function exportComprehension(items = []) {
  return items.map((item) => {
    const { answer, ...rest } = item;
    if (item.type === 'tf') return { ...rest, answerBool: answer };
    return { ...rest, answerIndex: answer };
  });
}

function exportWeek(week) {
  const out = {
    n: week.n,
    d: week.d,
    r: week.r,
    b: week.b,
    review: !!week.review,
    vocab: exportVocab(week.vocab),
    grammar: week.grammar,
    prompt: week.prompt,
  };
  if (week.italki) out.italki = week.italki;
  if (week.passage) out.passage = week.passage;
  if (week.drill) out.drill = week.drill;
  if (week.comprehension) out.comprehension = exportComprehension(week.comprehension);
  if (week.phrases) out.phrases = week.phrases;
  if (week.transform) out.transform = week.transform;
  if (week.questions) out.questions = week.questions;
  return out;
}

const course = {
  id: config.id,
  brand: {
    name: config.brand.name,
    tagline: config.brand.tagline,
    goal: config.brand.goal,
    topicLabel: config.brand.topicLabel,
    about: config.brand.about,
  },
  locale: config.locale,
  schedule: config.schedule,
  resources: config.resources,
  phases: phases.map((p) => ({
    id: p.id,
    title: p.title,
    book: p.book,
    badgeLabel: p.badgeLabel,
    weeks: p.weeks.map(exportWeek),
  })),
};

// Sanity checks mirroring course/validate.js invariants.
const weekCount = course.phases.reduce((n, p) => n + p.weeks.length, 0);
if (weekCount !== config.schedule.weeks) {
  throw new Error(`week count ${weekCount} != schedule.weeks ${config.schedule.weeks}`);
}
const vocabCount = course.phases.flatMap((p) => p.weeks).reduce((n, w) => n + w.vocab.length, 0);
console.log(`phases=${course.phases.length} weeks=${weekCount} vocab=${vocabCount}`);

const outPath = join(here, '..', 'BibbiaCore', 'Sources', 'BibbiaCore', 'Resources', 'course.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(course, null, 1) + '\n');
console.log(`wrote ${outPath}`);

// Common Italian→English word map (src/utils/it2en.js) — the tap-a-word
// fallback gloss for words outside the vocab, decoded by CommonWords.swift.
const commonWords = commonWordsData();
const wordsPath = join(dirname(outPath), 'common-words.json');
writeFileSync(wordsPath, JSON.stringify(commonWords, null, 1) + '\n');
console.log(`wrote ${wordsPath} (${Object.keys(commonWords.words).length} words)`);
