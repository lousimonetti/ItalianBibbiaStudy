// Course registry — the list of courses bundled into this deploy, and the
// active-course selection. ALL courses are statically imported (bundled); the
// active one is chosen at module-load from localStorage, and switching reloads
// the page so every module re-resolves to the new course.
//
// ── To add a course ──────────────────────────────────────────────────────────
//   1) scaffold it:  npm run new-course -- --weeks N --phases P --id my-id --out courses/my-id
//   2) import it below and add an entry to COURSES.
// With two or more courses, a course picker appears in the header automatically.

import { config as itBibleConfig } from './it-bible-cei/config.js';
import { phases as itBiblePhases } from './it-bible-cei/content.js';

const COURSES = [
  { config: itBibleConfig, phases: itBiblePhases },
  // { config: myConfig, phases: myPhases },
];

export const ACTIVE_KEY = 'coursekit-active-course'; // global (not per-course)
export const DEFAULT_ID = COURSES[0].config.id;

// Pure: pick the active id — the stored one if it's still a registered course,
// otherwise the default. (Unit-tested.)
export function pickActive(availableIds, storedId, defaultId) {
  return storedId && availableIds.includes(storedId) ? storedId : defaultId;
}

function readStored() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null; // Node (build scripts) or storage unavailable
  }
}

export function getActiveId() {
  return pickActive(COURSES.map((c) => c.config.id), readStored(), DEFAULT_ID);
}

export function getActiveCourse() {
  const id = getActiveId();
  return COURSES.find((c) => c.config.id === id) || COURSES[0];
}

// Metadata for the picker.
export function listCourses() {
  return COURSES.map((c) => ({ id: c.config.id, name: c.config.brand.name }));
}

// All courses (for validate-course, which checks every bundled course).
export function allCourses() {
  return COURSES.map((c) => ({ id: c.config.id, config: c.config, phases: c.phases }));
}

// Switch the active course: persist + reload so the whole module graph
// re-resolves (config/phases/locale/schedule are read at module-load time).
export function setActiveCourse(id) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // storage unavailable — can't switch
  }
  if (typeof window !== 'undefined' && window.location) window.location.reload();
}
