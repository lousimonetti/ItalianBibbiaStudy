// Resolves to the ACTIVE course's config (from courses/registry.js). The whole
// app imports config from here; switching courses (registry.setActiveCourse)
// reloads the page so this re-resolves to the newly-selected course.
import { getActiveCourse } from '../courses/registry.js';

export const config = getActiveCourse().config;
