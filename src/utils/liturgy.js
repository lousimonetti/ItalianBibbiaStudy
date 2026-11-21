// Liturgia del giorno: what the Church in Italy celebrates on a given date.
// Pure: dates in, plain objects out. No storage, no network, no clock except
// the date the caller passes.
//
// How a day is worked out, for one civil year at a time:
//   1. The base day: its season and its Sunday or weekday name (seasonOf,
//      baseDay), with the precedence of a plain Sunday or weekday.
//   2. The candidates: the fixed solemnities and feasts, and the movable ones.
//   3. The winner is the lowest `prec` (see src/data/liturgicalCalendar.js).
//      A solemnity that loses to a privileged day moves (transfer rules below);
//      a feast that loses is simply not celebrated that year.
// Memorials are not ranked here, except the two that move with Easter: the
// saint card under the liturgy card already names the day's saint.

import { FIXED, MOVABLE, PRECETTO_IT, SAINTS_ALIASES, SEASONS, RANKS, COLOURS } from '../data/liturgicalCalendar';
import { SAINTS } from '../data/saintsCalendar';

// ── Day numbers ─────────────────────────────────────────────────────────────
// Days since 1970-01-01, through Date.UTC so a timezone or a clock change can
// never move a date.
const DAY = 86400000;
export const dn = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / DAY);
export const dnOf = (date) => dn(date.getFullYear(), date.getMonth() + 1, date.getDate());
export function ymd(n) {
  const t = new Date(n * DAY);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
export const dateOf = (n) => { const { y, m, d } = ymd(n); return new Date(y, m - 1, d); };
// 0 = Sunday. Day 0 was a Thursday.
export const dow = (n) => (((n + 4) % 7) + 7) % 7;
const pad = (x) => String(x).padStart(2, '0');
export const mdOf = (n) => { const { m, d } = ymd(n); return `${pad(m)}-${pad(d)}`; };
export const isoOf = (n) => { const { y } = ymd(n); return `${y}-${mdOf(n)}`; };

// ── Easter and the fixed points of the year ────────────────────────────────

// Gregorian Easter (the "anonymous" algorithm, Meeus/Jones/Butcher).
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dn(year, month, day);
}

// The first Sunday on or after a day.
const sundayOnOrAfter = (n) => n + ((7 - dow(n)) % 7);

export function yearPoints(year) {
  const E = easter(year);
  const advent1 = sundayOnOrAfter(dn(year, 11, 27));
  // In Italy the Epiphany stays on 6 January, so the Baptism is the Sunday
  // after it (13 January when the 6th is itself a Sunday).
  const baptism = sundayOnOrAfter(dn(year, 1, 7));
  const octaveSunday = [26, 27, 28, 29, 30, 31].map((d) => dn(year, 12, d)).find((n) => dow(n) === 0);
  return {
    easter: E,
    ash: E - 46,
    palm: E - 7,
    holyThursday: E - 3,
    pentecost: E + 49,
    advent1,
    christTheKing: advent1 - 7,
    baptism,
    // The Sunday in the Christmas Octave, or 30 December when there is none.
    holyFamily: octaveSunday ?? dn(year, 12, 30),
  };
}

// ── The base day: season, name, colour ─────────────────────────────────────

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function roman(n) {
  if (n <= 0) return '';
  const tens = ['', 'X', 'XX', 'XXX', 'XL'];
  return tens[Math.floor(n / 10)] + ROMAN[n % 10];
}
const WEEKDAY_IT = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ORD_EN = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export function seasonOf(n) {
  const { y, m, d } = ymd(n);
  const p = yearPoints(y);
  if (m === 12 && d >= 25) return 'natale';
  if (n >= p.advent1) return 'avvento';
  if (n <= p.baptism) return 'natale';
  if (n < p.ash) return 'ordinario';
  if (n < p.holyThursday) return 'quaresima';
  if (n < p.easter) return 'triduo';
  if (n <= p.pentecost) return 'pasqua';
  return 'ordinario';
}

// The week of Ordinary Time a day belongs to. Before Lent, week 1 starts the
// Monday after the Baptism. After Pentecost the weeks are counted back from
// Christ the King, which is always the 34th Sunday, so the weeks that Lent and
// Easter displaced simply drop out.
export function ordinaryWeek(n) {
  const { y } = ymd(n);
  const p = yearPoints(y);
  const sunday = n - dow(n);
  if (n < p.ash) return Math.floor((sunday - p.baptism) / 7) + 1;
  return 34 - (p.christTheKing - sunday) / 7;
}

function baseDay(n) {
  const { y, m, d } = ymd(n);
  const p = yearPoints(y);
  const season = seasonOf(n);
  const wd = dow(n);
  const sun = wd === 0;
  const wdIt = cap(WEEKDAY_IT[wd]);
  const wdEn = WEEKDAY_EN[wd];
  const base = { season, source: 'base' };

  if (season === 'avvento') {
    const k = Math.floor((n - p.advent1) / 7) + 1;
    if (sun) {
      return { ...base, name: `${roman(k)} domenica di Avvento`, en: `${ORD_EN(k)} Sunday of Advent`, rank: 'sunday', prec: 2, colour: k === 3 ? 'rosaceo' : 'viola', seasonStart: k === 1 };
    }
    return { ...base, name: `${wdIt} della ${roman(k)} settimana di Avvento`, en: `${wdEn} of the ${ORD_EN(k)} week of Advent`, rank: 'weekday', prec: d >= 17 && m === 12 ? 9 : 13, colour: 'viola' };
  }

  if (season === 'natale') {
    if (m === 12) {
      // 26-31 December: the days of the Christmas Octave.
      const k = d - 24;
      return { ...base, name: `${roman(k)} giorno fra l'Ottava di Natale`, en: `${ORD_EN(k)} day within the Octave of Christmas`, rank: 'weekday', prec: 9, colour: 'bianco' };
    }
    if (sun) {
      return { ...base, name: 'II domenica dopo Natale', en: 'Second Sunday after Christmas', rank: 'sunday', prec: 6, colour: 'bianco' };
    }
    if (d < 6) {
      return { ...base, name: `${wdIt} del Tempo di Natale`, en: `${wdEn} of Christmas Time`, rank: 'weekday', prec: 13, colour: 'bianco' };
    }
    return { ...base, name: `${wdIt} dopo l'Epifania`, en: `${wdEn} after Epiphany`, rank: 'weekday', prec: 13, colour: 'bianco' };
  }

  if (season === 'ordinario') {
    const k = ordinaryWeek(n);
    if (sun) {
      return { ...base, name: `${roman(k)} domenica del Tempo Ordinario`, en: `${ORD_EN(k)} Sunday in Ordinary Time`, rank: 'sunday', prec: 6, colour: 'verde' };
    }
    return { ...base, name: `${wdIt} della ${roman(k)} settimana del Tempo Ordinario`, en: `${wdEn} of the ${ORD_EN(k)} week in Ordinary Time`, rank: 'weekday', prec: 13, colour: 'verde' };
  }

  if (season === 'quaresima') {
    const lent1 = p.ash + 4;
    if (n < lent1) {
      return { ...base, name: `${wdIt} dopo le Ceneri`, en: `${wdEn} after Ash Wednesday`, rank: 'weekday', prec: 9, colour: 'viola' };
    }
    const k = Math.floor((n - lent1) / 7) + 1;
    if (k === 6) {
      // Holy Week: Palm Sunday itself is a movable entry.
      return { ...base, name: `${wdIt} della Settimana Santa`, en: `${wdEn} of Holy Week`, rank: 'weekday', prec: 2, colour: 'viola' };
    }
    if (sun) {
      return { ...base, name: `${roman(k)} domenica di Quaresima`, en: `${ORD_EN(k)} Sunday of Lent`, rank: 'sunday', prec: 2, colour: k === 4 ? 'rosaceo' : 'viola' };
    }
    return { ...base, name: `${wdIt} della ${roman(k)} settimana di Quaresima`, en: `${wdEn} of the ${ORD_EN(k)} week of Lent`, rank: 'weekday', prec: 9, colour: 'viola' };
  }

  if (season === 'pasqua') {
    const k = Math.floor((n - p.easter) / 7) + 1;
    if (k === 1) {
      return { ...base, name: `${wdIt} fra l'Ottava di Pasqua`, en: `${wdEn} within the Octave of Easter`, rank: 'octave', prec: 2, colour: 'bianco' };
    }
    if (sun) {
      return { ...base, name: `${roman(k)} domenica di Pasqua`, en: `${ORD_EN(k)} Sunday of Easter`, rank: 'sunday', prec: 2, colour: 'bianco' };
    }
    return { ...base, name: `${wdIt} della ${roman(k)} settimana di Pasqua`, en: `${wdEn} of the ${ORD_EN(k)} week of Easter`, rank: 'weekday', prec: 13, colour: 'bianco' };
  }

  // The Triduum days are all movable entries; this only fills the gap safely.
  return { ...base, name: wdIt, en: wdEn, rank: 'weekday', prec: 14, colour: 'bianco' };
}

// ── Building a year ────────────────────────────────────────────────────────

function movableDate(entry, p) {
  if (entry.easter !== undefined) return p.easter + entry.easter;
  if (entry.rule === 'baptism') return p.baptism;
  if (entry.rule === 'christ-the-king') return p.christTheKing;
  if (entry.rule === 'holy-family') return p.holyFamily;
  return null;
}

// Where a solemnity goes when a privileged day takes its date. The two special
// cases are the Congregation for Divine Worship's rules for the Annunciation
// and for Saint Joseph; anything else moves to the next day not taken by
// another day of rank 1 to 8 (in practice, the Monday).
function transferTarget(fixed, n, p, winnerAt) {
  const inHolyWeekOrOctave = n >= p.palm && n <= p.easter + 7;
  if (fixed.md === '03-25' && inHolyWeekOrOctave) return p.easter + 8;
  if (fixed.md === '03-19' && n >= p.palm && n <= p.easter) return p.palm - 1;
  let t = n + 1;
  while (winnerAt(t).prec <= 8) t += 1;
  return t;
}

const cache = new Map();

export function buildYear(year) {
  if (cache.has(year)) return cache.get(year);
  const p = yearPoints(year);
  const first = dn(year, 1, 1);
  const last = dn(year, 12, 31);
  const days = new Map();
  for (let n = first; n <= last; n++) days.set(n, [baseDay(n)]);
  const add = (n, cel) => { if (days.has(n)) days.get(n).push(cel); };

  for (const e of MOVABLE) {
    const n = movableDate(e, p);
    if (n !== null) add(n, { ...e, source: 'movable', season: seasonOf(n) });
  }
  const winnerAt = (n) => (days.get(n) || [{ prec: 99 }]).reduce((a, b) => (b.prec < a.prec ? b : a));

  const moved = {}; // md → { to, omitted }
  // Feasts and solemnities on their own dates, then the ones that lose.
  const pendingTransfers = [];
  for (const f of FIXED) {
    const [m, d] = f.md.split('-').map(Number);
    const n = dn(year, m, d);
    const cel = { ...f, source: 'fixed', season: seasonOf(n), wiki: SAINTS[f.md] ? { it: SAINTS[f.md].it, en: SAINTS[f.md].en } : undefined };
    const rival = winnerAt(n);
    if (rival.prec < f.prec) {
      if (f.prec <= 3) pendingTransfers.push({ cel, n });
      else moved[f.md] = { omitted: true, by: rival.name };
      continue;
    }
    add(n, cel);
  }
  for (const { cel, n } of pendingTransfers) {
    const to = transferTarget(cel, n, p, winnerAt);
    add(to, { ...cel, movedFrom: cel.md, season: seasonOf(to) });
    moved[cel.md] = { to };
  }

  // Resolve each day. Two celebrations of equal rank (a movable solemnity on
  // the date of a fixed one) are both shown; which one moves in such a year is
  // settled by decree, and guessing it would be worse than saying so.
  const resolved = new Map();
  for (const [n, list] of days) {
    const sorted = [...list].sort((a, b) => a.prec - b.prec || (a.source === 'base') - (b.source === 'base'));
    const win = sorted[0];
    const also = sorted.filter((c) => c !== win && c.source !== 'base' && c.prec === win.prec);
    resolved.set(n, { ...win, also: also.length ? also : undefined });
  }
  const out = { points: p, days: resolved, moved };
  cache.set(year, out);
  return out;
}

// ── Public API ──────────────────────────────────────────────────────────────

// The Sunday cycle: the liturgical year that begins at Advent of year Y is
// named for Y + 1; its Sunday readings are A, B or C and its weekday readings
// I (odd) or II (even). The year ending in 2026 is A and II.
export function cycles(n) {
  const { y } = ymd(n);
  const endYear = n >= yearPoints(y).advent1 ? y + 1 : y;
  return { sundayYear: 'CAB'[endYear % 3], weekdayCycle: endYear % 2 ? 'I' : 'II' };
}

export function liturgyFor(date) {
  const n = date instanceof Date ? dnOf(date) : date;
  const { y } = ymd(n);
  const cel = buildYear(y).days.get(n);
  const md = mdOf(n);
  return {
    ...cel,
    iso: isoOf(n),
    seasonLabel: SEASONS[cel.season],
    rankLabel: RANKS[cel.rank],
    colourEn: cel.colour ? COLOURS[cel.colour].en : null,
    precetto: dow(n) === 0 || PRECETTO_IT.includes(md),
    ...cycles(n),
  };
}

// Where a calendar date's usual celebration falls this year, for the note on
// the saint card. `null` when it is on its own date.
export function movedThisYear(md, year) {
  const alias = SAINTS_ALIASES[md];
  if (alias) {
    const e = MOVABLE.find((x) => x.id === alias);
    const to = movableDate(e, yearPoints(year));
    return mdOf(to) === md ? null : { to: dateOf(to) };
  }
  const m = buildYear(year).moved[md];
  if (!m) return null;
  return m.omitted ? { omitted: true, by: m.by } : { to: dateOf(m.to) };
}

// The coming great days after `date`: solemnities, feasts, the Triduum, Ash
// Wednesday, Palm Sunday and the start of Advent.
export function isHighlight(cel) {
  if (cel.seasonStart) return true;
  if (cel.source === 'base') return false;
  return ['solemnity', 'commemoration', 'feast', 'triduum'].includes(cel.rank) || cel.id === 'palme';
}

export function upcoming(date, count = 6) {
  const start = (date instanceof Date ? dnOf(date) : date) + 1;
  const out = [];
  for (let n = start; n < start + 400 && out.length < count; n++) {
    const cel = liturgyFor(n);
    if (isHighlight(cel)) out.push({ ...cel, date: dateOf(n) });
  }
  return out;
}

// The subject the Saints tab should tell the story of: the day's great
// celebration when it is not already the saint of the day (Pentecost, Christ
// the King, a feast moved onto another saint's date).
export function storySubject(cel, saint) {
  if (!cel?.wiki || !saint) return saint;
  if (!['solemnity', 'feast', 'triduum', 'commemoration'].includes(cel.rank) && cel.id !== 'ceneri' && cel.id !== 'palme') return saint;
  if (cel.wiki.it === saint.it) return saint;
  return { key: saint.key, name: cel.name, it: cel.wiki.it, en: cel.wiki.en, feast: true };
}
