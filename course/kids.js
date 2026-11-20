// Resolves to the ACTIVE course's children's corner (see courses/registry.js).
// Optional per course: when a course defines none, the Bambini view hides.
import { getActiveCourse } from '../courses/registry.js';

export const kids = getActiveCourse().kids ?? null;
