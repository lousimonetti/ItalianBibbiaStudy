// Reading source for a week (O2 interactive reading, O4 dictogloss, O5
// comprehension). Prefers an authored `passage` (full connected verses) when the
// course provides one; otherwise falls back to the week's vetted vocab example
// sentences — short CEI excerpts already in the course data — so every week has
// real, tappable Italian to read even before full passages are authored.
//
// Returns a flat array of sentence strings (the unit the reader/dictogloss work
// on). `readingLines` returns richer { ref, t } rows for display. Pure +
// unit-tested.

export function passageLines(week) {
  if (!week?.passage?.verses?.length) return [];
  return week.passage.verses
    .map((v) => ({ ref: v.n != null ? String(v.n) : '', t: (v.t || '').trim() }))
    .filter((v) => v.t);
}

// Unique example sentences from the week's vocab, in order, deduped.
export function exampleLines(week) {
  if (!Array.isArray(week?.vocab)) return [];
  const seen = new Set();
  const out = [];
  for (const v of week.vocab) {
    const ex = (v[2] || '').trim();
    if (!ex) continue;
    const key = ex.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ref: '', t: ex });
  }
  return out;
}

// Display rows: authored passage if present, else example sentences. Each row is
// { ref, t }.
export function readingLines(week) {
  const p = passageLines(week);
  return p.length ? p : exampleLines(week);
}

// True when the reading comes from an authored full passage (vs. example-sentence
// fallback) — lets the UI label the source honestly.
export function hasPassage(week) {
  return passageLines(week).length > 0;
}

// Flat sentence strings (used by dictogloss). When an authored passage exists we
// split its verses into sentences; otherwise each example sentence is one item.
export function keyVerses(week) {
  return readingLines(week)
    .flatMap((row) => splitSentences(row.t))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Light sentence splitter — splits on . ! ? ; while keeping the text intact
// enough for reconstruction. Good enough for short biblical verses.
export function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
