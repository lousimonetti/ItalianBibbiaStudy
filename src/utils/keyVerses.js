// Reading source for a week (O2 interactive reading, O4 dictogloss, O5
// comprehension). Prefers an authored `passage` (full connected verses) when the
// course provides one; otherwise falls back to the week's vetted vocab example
// sentences — short CEI excerpts already in the course data — so every week has
// real, tappable Italian to read even before full passages are authored.
//
// Returns a flat array of sentence strings (the unit the reader/dictogloss work
// on). `readingLines` returns richer { ref, t, en } rows for display, where `en`
// is the optional English of that line — an authored `verse.en` for a passage,
// the vocab tuple's `exEn` for the example-sentence fallback. Pure +
// unit-tested.

export function passageLines(week) {
  if (!week?.passage?.verses?.length) return [];
  return week.passage.verses
    .map((v) => ({
      ref: v.n != null ? String(v.n) : '',
      t: (v.t || '').trim(),
      en: (v.en || '').trim(),
    }))
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
    out.push({ ref: '', t: ex, en: (v[4]?.exEn || '').trim() });
  }
  return out;
}

// Display rows: authored passage if present, else example sentences. Each row is
// { ref, t, en }.
export function readingLines(week) {
  const p = passageLines(week);
  return p.length ? p : exampleLines(week);
}

// True when the reading comes from an authored full passage (vs. example-sentence
// fallback) — lets the UI label the source honestly.
export function hasPassage(week) {
  return passageLines(week).length > 0;
}

// True when at least one reading line carries English, so the reader can offer
// the translation toggle only where there is something to show.
export function hasEnglish(week) {
  return readingLines(week).some((l) => l.en);
}

// Expands a passage ref like "Atti 22,26-28; 23,11" into one full reference per
// verse: ["Atti 22,26", "Atti 22,27", "Atti 22,28", "Atti 23,11"]. A verse number
// alone is not an identity, because a passage can span chapters. Returns [] when
// the ref cannot be parsed.
export function expandRef(ref) {
  const m = /^(.+?)\s+(\d.*)$/.exec(String(ref ?? '').trim());
  if (!m) return [];
  const [, book, rest] = m;
  const out = [];
  let chapter = null;
  for (const raw of rest.split(';')) {
    let part = raw.trim();
    const comma = part.indexOf(',');
    if (comma !== -1) {
      chapter = part.slice(0, comma).trim();
      part = part.slice(comma + 1);
    }
    if (chapter === null) return [];
    for (const seg of part.split('.')) {
      const [a, b] = seg.split('-').map((x) => Number.parseInt(x, 10));
      if (!Number.isInteger(a)) return [];
      const end = Number.isInteger(b) ? b : a;
      for (let v = a; v <= end; v++) out.push(`${book} ${chapter},${v}`);
    }
  }
  return out;
}

// Reading rows plus a stable `id` for storing per-verse state such as reviews.
// Passage verses use their full reference; if the ref and the verses disagree, or
// the reading is the example-sentence fallback, the id falls back to the week and
// position so it stays unique.
export function verseRefs(week) {
  const rows = readingLines(week);
  const refs = hasPassage(week) ? expandRef(week.passage.ref) : [];
  const aligned = refs.length === rows.length;
  return rows.map((row, i) => ({
    ...row,
    id: aligned ? refs[i] : `w${week.n}:${i + 1}`,
    fullRef: aligned ? refs[i] : '',
  }));
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
