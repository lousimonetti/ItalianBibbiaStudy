// The small decisions that make a lesson feel alive, kept pure so the web
// player and the iOS player (LessonFeedback.swift, pinned by lessonFeedback.json)
// cannot drift: which word of praise, how long the run of right answers is,
// and which sound an answer earns.

// Praise for a right answer, varied by where the step sits in the lesson so the
// same word is not repeated down the screen (and the lesson reads the same each
// time it is opened).
export const PRAISE = ['Giusto!', 'Esatto!', 'Ottimo!', 'Benissimo!', 'Perfetto!'];
export const praiseFor = (index) => PRAISE[((index % PRAISE.length) + PRAISE.length) % PRAISE.length];

// A run of this many first-try answers in a row is called out.
export const COMBO_MIN = 3;

// The run after an answer: one longer for a right first try; a miss, or a
// step that has come back for its retry, ends it.
export const nextCombo = (combo, correct, retry = false) => (correct && !retry ? combo + 1 : 0);

// The sound an answer earns, given the run *after* it (see sfx.js).
export function soundFor(correct, combo) {
  if (!correct) return 'wrong';
  return combo >= COMBO_MIN && combo % COMBO_MIN === 0 ? 'combo' : 'correct';
}
