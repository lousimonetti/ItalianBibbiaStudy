// Scaffold a blank course skeleton you then fill in.
//   npm run new-course -- --weeks 40 --phases 4 --id my-course
// Writes course/config.js + course/content.js (refuses to overwrite unless
// --force; use --out <dir> to write elsewhere). After scaffolding:
//   1) edit course/config.js (brand, locale, schedule, resources)
//   2) fill course/content.js (each week's reading, vocab, grammar, prompt)
//   3) npm run validate-course   ← your checklist of what's still blank
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const weeks = Number(args.weeks);
const phaseCount = Number(args.phases ?? 1);
const id = String(args.id ?? 'my-course');
const outDir = String(args.out ?? 'course');
const force = !!args.force;

if (!Number.isInteger(weeks) || weeks < 1) {
  console.error('Usage: npm run new-course -- --weeks <N> [--phases P] [--id slug] [--out dir] [--force]');
  process.exit(1);
}

// Split `weeks` into `phaseCount` roughly-equal contiguous groups.
function phaseSizes(total, groups) {
  const base = Math.floor(total / groups);
  const extra = total % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < extra ? 1 : 0));
}

const configTemplate = `// Course configuration — edit me. See course/schema.md and AUTHORING.md.
export const config = {
  id: ${JSON.stringify(id)},

  brand: {
    name: 'My Course',
    tagline: 'A ${weeks}-week course',
    goal: '',
    topicLabel: 'Weekly focus',
    accent: '#008C45',
    accentDim: '#d4edda',
    ribbon: ['#008C45', '#c8c4ba', '#CE2B37'],
    about: 'Describe your course in a sentence or two.',
  },

  locale: {
    target: 'xx-XX',     // TTS / speech-recognition language, e.g. 'es-ES'
    native: 'en',        // the learner's language
    grammarLang: '',     // LanguageTool code, e.g. 'es' ('' disables grammar check)
    hasIPA: false,       // true ⇒ show the 4th vocab element as IPA
    articles: [],        // leading articles to strip, e.g. ['el','la','los','las',"l'"]
  },

  schedule: {
    startDate: '2026-01-01',
    weeks: ${weeks},
    daily: [
      { day: 'Mon', task: '' },
      { day: 'Tue', task: '' },
      { day: 'Wed', task: '' },
      { day: 'Thu', task: '' },
      { day: 'Fri', task: '' },
      { day: 'Sat', task: '' },
      { day: 'Sun', task: '' },
    ],
  },

  resources: [
    { id: 'text', name: 'Primary material', badge: 'Reading', role: 'reading', desc: '' },
  ],
};
`;

const sizes = phaseSizes(weeks, phaseCount);
let n = 0;
const phaseBlocks = sizes.map((size, pi) => {
  const weekObjs = Array.from({ length: size }, () => {
    n += 1;
    return `      { n: ${n}, d: '', r: '', b: '', review: false,
        vocab: [['', '', '']],
        grammar: { title: '', body: '' },
        prompt: { it: '', en: '' } },`;
  }).join('\n');
  return `  {
    id: 'p${pi + 1}', title: 'Phase ${pi + 1}', book: '', badgeLabel: '', badgeBg: '#E1F5EE', badgeColor: '#085041',
    weeks: [
${weekObjs}
    ],
  },`;
}).join('\n');

const contentTemplate = `// Course content — fill in each week. Vocab tuples are
// [target, native, example, ipa?] (the IPA 4th element is optional).
export const phases = [
${phaseBlocks}
];
`;

const configPath = path.join(outDir, 'config.js');
const contentPath = path.join(outDir, 'content.js');

if (!force && (existsSync(configPath) || existsSync(contentPath))) {
  console.error(`Refusing to overwrite ${outDir}/. Use --out <dir> for a fresh folder, or --force to replace.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(configPath, configTemplate);
writeFileSync(contentPath, contentTemplate);

console.log(`✓ Scaffolded a ${weeks}-week, ${phaseCount}-phase course in ${outDir}/`);
console.log('  Next: edit config.js + content.js, then `npm run validate-course`.');
