// The three vocabulary decks Practice can review (REVIEW-fluency.md B1, B2):
//
//   course  the course's own words, week by week (buildCards over PHASES)
//   core    "Parole di base": everyday high-frequency words (course/core.js)
//   mine    "Mie parole": words the learner saved (src/utils/mined.js)
//
// All three share one SRS store keyed by term, so a single daily new-card cap
// covers everything the learner studies. coreVocab.test.js guarantees that no
// core term is also a course term, and mined.js refuses a word that is already
// a card, so keys never collide.

import { PHASES } from '../data/studyData';
import { buildCards, parseVocab } from '../../course/vocab';
import { CORE_VOCAB, CORE_DOMAINS } from '../../course/core';
import { toIPA } from './it2ipa';
import { HAS_IPA, LEADING_ARTICLE } from './locale';
import { lookupWord } from './vocabIndex';
import { loadMined, toCards as minedCards } from './mined';

export const COURSE_CARDS = buildCards(PHASES);

// Approximate IPA for a term of one or more words. Core rows carry no stored
// IPA, and an unverified transcription should say so.
function approxIPA(term) {
  return term.split(/\s+/).map((w) => toIPA(w)).filter(Boolean).join(' ');
}

export function buildCoreCards(tuples, domains = {}) {
  return tuples.map((tuple) => {
    const card = parseVocab(tuple);
    const domain = tuple[4]?.domain || '';
    // 'tatoeba:<it>/<en>' for a native speaker's sentence, 'authored' otherwise.
    const src = tuple[4]?.src || 'authored';
    const ipa = card.ipa || (HAS_IPA ? approxIPA(card.it) : '');
    return {
      ...card,
      ipa,
      ipaApprox: !card.ipa && !!ipa,
      domain,
      src,
      deck: 'core',
      meta: domains[domain] ? `Parole di base · ${domains[domain]}` : 'Parole di base',
    };
  });
}

export const CORE_CARDS = buildCoreCards(CORE_VOCAB, CORE_DOMAINS);

export function hasCoreDeck() {
  return CORE_CARDS.length > 0;
}

// Saved words, read fresh: the list changes while the app is open.
export function mineCards() {
  return minedCards(loadMined());
}

// Every card the learner can be due on, for the due badge.
export function allReviewCards() {
  return [...COURSE_CARDS, ...CORE_CARDS, ...mineCards()];
}

const coreIndex = (() => {
  const m = new Map();
  for (const c of CORE_CARDS) {
    const t = c.it.toLowerCase();
    m.set(t, c);
    m.set(t.replace(LEADING_ARTICLE, '').trim(), c);
    if (c.form) m.set(c.form.toLowerCase(), c);
  }
  return m;
})();

// Is this word already studied in a deck? 'course' | 'core' | null. Used to
// decide whether a tapped word can be saved to "Mie parole".
export function deckOf(word) {
  if (!word) return null;
  if (lookupWord(word)) return 'course';
  if (coreIndex.has(word.toLowerCase().replace(/’/g, "'"))) return 'core';
  return null;
}
