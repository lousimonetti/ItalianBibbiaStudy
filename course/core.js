// Resolves to the ACTIVE course's everyday core deck ("Parole di base",
// REVIEW-fluency.md B1). Optional: courses without one resolve to an empty
// list and the deck chooser hides the option.
import { getActiveCourse } from '../courses/registry.js';

export const CORE_VOCAB = getActiveCourse().core ?? [];
export const CORE_DOMAINS = getActiveCourse().coreDomains ?? {};
