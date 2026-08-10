// Vocab tuple normalization.
//
// A vocab entry is a tuple:
//   [target, native, example, ipa?, extra?]
//
// `extra` is an optional object carrying the fields added in the pedagogy pass:
//   { exEn, form }
//     exEn — the example sentence's translation into the learner's language.
//            Without it, Listening mode has nothing truthful to show (it used
//            to display the single word's gloss as if it translated the whole
//            sentence) and sentence-level recall is impossible.
//     form — the inflected form of the headword as it actually appears in the
//            example ("credere" → "ha creduto"). Drives cloze matching and the
//            Transformation practice style; without it ~39% of cards silently
//            fell out of cloze because the literal headword isn't in its own
//            example.
//
// Both are optional so existing/scaffolded courses stay valid — every consumer
// degrades gracefully when they're absent.

// Normalize one tuple into a flat object. Always returns strings (never
// undefined) so consumers can test truthiness without guarding.
export function parseVocab(tuple) {
  const [it, en, ex, ipa, extra] = Array.isArray(tuple) ? tuple : [];
  const x = extra && typeof extra === 'object' && !Array.isArray(extra) ? extra : {};
  return {
    it: it ?? '',
    en: en ?? '',
    ex: ex ?? '',
    ipa: ipa ?? '',
    exEn: x.exEn ?? '',
    form: x.form ?? '',
  };
}

// The form that actually appears in the example — `form` when the author
// supplied one, else the headword itself.
export function surfaceForm(card) {
  return card.form || card.it;
}

// Flatten a course's phases into practice cards. Both PracticeMode and
// PronunciationPractice previously carried identical private copies of this.
export function buildCards(phases) {
  const cards = [];
  for (const phase of phases) {
    for (const week of phase.weeks) {
      for (const tuple of week.vocab) {
        cards.push({
          ...parseVocab(tuple),
          weekN: week.n,
          reading: week.r,
          phaseId: phase.id,
        });
      }
    }
  }
  return cards;
}
