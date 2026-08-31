// Resolves to the ACTIVE course's verb-form recognition dataset (see
// course/config.js for how active-course selection works). Optional: courses
// without one resolve to an empty list and the drill UI hides itself.
import { getActiveCourse } from '../courses/registry.js';

export const VERB_FORMS = getActiveCourse().verbForms ?? [];
export const FORM_CATEGORIES = getActiveCourse().formCategories ?? {};
