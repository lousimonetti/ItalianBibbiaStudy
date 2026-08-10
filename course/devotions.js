// Resolves to the ACTIVE course's devotional/memorized texts (see
// courses/registry.js). Optional per course — when a course defines none, the
// Devotions tab hides itself entirely.
//
// "Devotions" is the general category: memorized texts a learner already knows
// by heart in their own language (prayers, creeds, psalms, poems, songs,
// oaths). They are unusually good language material because comprehension is
// free — the learner already knows the meaning, so all attention goes to form.
import { getActiveCourse } from '../courses/registry.js';

export const devotionSections = getActiveCourse().devotions ?? [];
