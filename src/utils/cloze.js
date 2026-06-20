// Build a fill-in-the-blank ("cloze") from a vocab term and its example
// sentence. Prefers blanking the bare content word (so the article stays as a
// gender hint), falling back to the full term. Returns { before, answer, after }
// or null when the term doesn't literally appear in the example (e.g. the
// example uses a conjugated/derived form), in which case the card is not
// cloze-eligible.

import { LEADING_ARTICLE } from './locale';

export function makeCloze(term, example) {
  if (!term || !example) return null;
  const stripped = term.replace(LEADING_ARTICLE, '').trim();
  for (const cand of [stripped, term]) {
    if (cand.length < 2) continue;
    const idx = example.toLowerCase().indexOf(cand.toLowerCase());
    if (idx >= 0) {
      return {
        before: example.slice(0, idx),
        answer: example.slice(idx, idx + cand.length),
        after: example.slice(idx + cand.length),
      };
    }
  }
  return null;
}

export function isClozeEligible(card) {
  return makeCloze(card.it, card.ex) !== null;
}
