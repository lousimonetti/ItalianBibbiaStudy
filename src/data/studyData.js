// Compatibility shim. The course content now lives in `course/` (config +
// content); this re-exports it under the historical names so existing imports
// keep working. New code can import from `course/index.js` directly.

import { config } from '../../course/config';

export { phases as PHASES } from '../../course/content';
export { course as COURSE } from '../../course/index';

// The 7-item weekly rhythm now lives in the course schedule.
export const DAILY = config.schedule.daily;
