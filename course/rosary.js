// Resolves to the ACTIVE course's guided-Rosary data (see courses/registry.js).
// Optional per course — when a course defines none, or ships no devotions for
// it to point at, the Rosario tab hides itself.
import { getActiveCourse } from '../courses/registry.js';

export const rosary = getActiveCourse().rosary ?? null;
