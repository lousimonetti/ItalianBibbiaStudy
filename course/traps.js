// Resolves to the ACTIVE course's contrastive "Trappole" dataset (see
// course/config.js for how active-course selection works). Optional: courses
// without one resolve to an empty list and the drill UI hides itself.
import { getActiveCourse } from '../courses/registry.js';

export const TRAPS = getActiveCourse().traps ?? [];
export const TRAP_CATEGORIES = getActiveCourse().trapCategories ?? {};
