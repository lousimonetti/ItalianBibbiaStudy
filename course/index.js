// Resolved course: merges config + content and exposes derived totals so the UI
// never hardcodes counts. Import `course` (or the named pieces) from here.

import { config } from './config';
import { phases } from './content';

const allWeeks = phases.flatMap((p) => p.weeks);

export const course = {
  ...config,
  phases,
  weeks: allWeeks,
  totals: {
    phases: phases.length,
    weeks: allWeeks.length,
    vocab: allWeeks.reduce((sum, w) => sum + w.vocab.length, 0),
  },
};

export { config, phases };
