// CLI: validate the active course (config + content). Run: npm run validate-course
// Exits non-zero with a line-pointed error list when the course is invalid.
import { config } from '../course/config.js';
import { phases } from '../course/content.js';
import { validateCourse } from '../course/validate.js';

const errors = validateCourse(config, phases);

if (errors.length) {
  console.error(`✖ Course "${config?.id ?? '?'}" has ${errors.length} problem(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const weeks = phases.flatMap((p) => p.weeks);
const vocab = weeks.reduce((sum, w) => sum + w.vocab.length, 0);
console.log(`✓ Course "${config.id}" is valid — ${phases.length} phases, ${weeks.length} weeks, ${vocab} vocab.`);
