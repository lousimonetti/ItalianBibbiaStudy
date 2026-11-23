// Resolves to the ACTIVE course's progress-check statements (see
// courses/registry.js). Optional per course: without them the progress check
// shows only what it can measure.
import { getActiveCourse } from '../courses/registry.js';

export const canDo = getActiveCourse().canDo ?? null;
