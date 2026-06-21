import { config } from '../../course/config';

// Per-course localStorage key namespacing. Every persisted store keys off the
// course's prefix so different courses/forks never collide. The reference course
// keeps the historical 'italian-bible' prefix, so existing data needs no
// migration; a scaffolded course gets its own prefix.

export const STORAGE_PREFIX = config.storagePrefix || config.id || 'course';

export function storageKey(name) {
  return `${STORAGE_PREFIX}-${name}`;
}
