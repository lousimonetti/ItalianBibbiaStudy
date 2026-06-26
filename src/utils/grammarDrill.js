// Grammar drill helpers (O3). A drill item is { q, a, hint } where `q` is a short
// Italian sentence containing a blank marked `___` (one or more underscores), `a`
// is the expected fill, and `hint` is an English/grammar nudge. We anchor drill
// sentences to the week's vetted example sentences where possible, so the Italian
// is already correct — the drill just blanks a grammar-relevant token (article,
// verb ending, preposition) framed by the week's grammar focus. Answer checking
// reuses the forgiving `checkAnswer` from answer.js. Pure + unit-tested.

const BLANK = /_{2,}/;

// Split a drill question into the text before and after the blank, so the UI can
// render an inline input. Returns { before, after } (after empty if no blank —
// degrade by appending the input at the end).
export function splitBlank(q) {
  const s = String(q ?? '');
  const m = s.match(BLANK);
  if (!m) return { before: s, after: '' };
  const idx = m.index;
  return { before: s.slice(0, idx), after: s.slice(idx + m[0].length) };
}

// Normalize a week's drills into a clean array, dropping malformed items.
export function drillItems(week) {
  if (!Array.isArray(week?.drill)) return [];
  return week.drill.filter((d) => d && typeof d.q === 'string' && typeof d.a === 'string' && d.a.trim());
}
