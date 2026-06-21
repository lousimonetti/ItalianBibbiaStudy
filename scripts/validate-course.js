// CLI: validate every bundled course (config + content). Run: npm run validate-course
// Exits non-zero with a line-pointed error list if any course is invalid.
import { allCourses } from '../courses/registry.js';
import { validateCourse } from '../course/validate.js';

let failed = 0;

for (const { id, config, phases } of allCourses()) {
  const errors = validateCourse(config, phases);
  if (errors.length) {
    failed += 1;
    console.error(`✖ Course "${id ?? '?'}" has ${errors.length} problem(s):`);
    for (const e of errors) console.error('  - ' + e);
  } else {
    const weeks = phases.flatMap((p) => p.weeks);
    const vocab = weeks.reduce((sum, w) => sum + w.vocab.length, 0);
    console.log(`✓ Course "${id}" is valid — ${phases.length} phases, ${weeks.length} weeks, ${vocab} vocab.`);
  }
}

if (failed) process.exit(1);
