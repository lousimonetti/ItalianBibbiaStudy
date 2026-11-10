// "Smart mix" review: pick the exercise for each card from how well it is
// known, instead of asking the learner to choose a practice style up front.
// The ladder runs from easiest to hardest retrieval:
//   new, barely seen, or relearning after a lapse → recognition (see it, recall the meaning)
//   recalled a couple of times                    → cloze (produce it inside its sentence)
//   established                                   → recall (produce it from the English alone)
// `st` is the card's SRS state ({ reps, relearn, … }) or undefined when new.

import { isClozeEligible } from './cloze';

export const CLOZE_FROM_REPS = 2;
export const RECALL_FROM_REPS = 4;

export function styleFor(card, st) {
  if (!st || (st.reps ?? 0) < CLOZE_FROM_REPS || (st.relearn !== null && st.relearn !== undefined)) {
    return 'recognition';
  }
  if (st.reps < RECALL_FROM_REPS && isClozeEligible(card)) return 'cloze';
  return 'recall';
}

export function mixStyles(cards, store = {}) {
  return cards.map((c) => styleFor(c, store[c.it]));
}
