// Derive a "words you struggle with" list from the two persisted stores:
//   - the SRS store (italian-bible-srs): lapses + low ease ⇒ recognition trouble
//   - the pronunciation store (italian-bible-pronun): low average score ⇒
//     speaking trouble
//
// Pure and unit-tested; the React glue reads the stores and renders the panel.

export const WEAK_EASE = 2.2;      // ease at/below this counts as shaky recall
export const WEAK_PRONUN = 60;     // average pronunciation score below this is weak

// Returns a ranked array of { card, score, reasons[] } for cards the learner is
// struggling with (highest score first), capped at `limit`. Cards with no
// trouble signal are omitted.
export function struggleList(cards, srsStore = {}, pronunStore = {}, { limit = 12 } = {}) {
  const out = [];
  for (const c of cards) {
    const srs = srsStore[c.it];
    const pr = pronunStore[c.it];

    const lapses = srs?.lapses || 0;
    const lowEase = srs && srs.ease < WEAK_EASE ? WEAK_EASE - srs.ease : 0;
    const weakPronun = pr && pr.avg < WEAK_PRONUN ? (WEAK_PRONUN - pr.avg) / WEAK_PRONUN : 0;

    const score = lapses + lowEase * 2 + weakPronun * 3;
    if (score <= 0) continue;

    const reasons = [];
    if (lapses > 0) reasons.push(`${lapses} miss${lapses > 1 ? 'es' : ''} in review`);
    if (pr && pr.avg < WEAK_PRONUN) reasons.push(`pronunciation ${pr.avg}%`);
    else if (lowEase > 0 && lapses === 0) reasons.push('shaky recall');

    out.push({ card: c, score, reasons });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
