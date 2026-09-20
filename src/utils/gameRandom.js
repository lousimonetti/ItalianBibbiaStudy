// Deterministic per-day randomness for the daily games.
//
// Everything a player sees on a given date has to be reproducible: reload the
// page, cross to another device, come back an hour later — same word, same ten
// questions. That rules out `Math.random` and rules in a small seeded PRNG keyed
// off the calendar date. Pure: no storage, no clock (callers pass the date
// string, so tests can travel in time).

// xmur3 string hash → one 32-bit seed.
export function hashSeed(str) {
  const s = String(str);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

// mulberry32 — 32 bits of state, good enough for shuffling a word list and
// short enough to read.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(seed) {
  return mulberry32(hashSeed(seed));
}

// Fisher-Yates on a copy — the input list is never mutated.
export function shuffled(list, rng) {
  const out = [...(list || [])];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Days since the epoch, from a plain 'YYYY-MM-DD'. Built through Date.UTC so a
// timezone can never shift which day a player is on.
export function dayNumber(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''));
  if (!m) return 0;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
}

// Pick today's item from a deck dealt one card a day and reshuffled when it
// runs out: inside a cycle — the run of `n` days starting at a multiple of `n`
// days since the epoch — every item is served exactly once. A plain
// `hash(date) % n` would repeat words within a week while leaving others unseen
// for months. The only place a near-repeat is possible is across a cycle
// boundary, where the last card of one deck and an early card of the next are
// drawn from different shuffles; with a pool in the hundreds that is a once-a-
// year coincidence, and the alternative costs persistent state.
export function rotatingPick(list, dateStr, salt = '') {
  if (!list || list.length === 0) return null;
  const n = list.length;
  const day = dayNumber(dateStr);
  const cycle = Math.floor(day / n);
  const pos = ((day % n) + n) % n;
  const order = shuffled(
    list.map((_, i) => i),
    rngFor(`${salt}|${cycle}`),
  );
  return list[order[pos]];
}

// A deterministic sample of `count` items for one date.
export function dailySample(list, count, dateStr, salt = '') {
  if (!list || list.length === 0) return [];
  return shuffled(list, rngFor(`${salt}|${dateStr}`)).slice(0, count);
}
