// Resolves to the ACTIVE course's content (from courses/registry.js). See
// course/config.js for how active-course selection works.
import { getActiveCourse } from '../courses/registry.js';

export const phases = getActiveCourse().phases;
