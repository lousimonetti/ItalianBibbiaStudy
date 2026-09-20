// "Sfida del giorno" — the daily mixed quiz.
//
// The word game drills vocabulary; this one walks the whole course. Ten
// questions built from five different kinds of course content — vocabulary,
// grammar drills, the authored verses, the prayers, the comprehension checks —
// so a single two-minute round touches everything the app teaches instead of
// one slice of it.
//
// Deterministic for a given date (see gameRandom.js) and pure: pools come in as
// arguments, questions go out, nothing is read from storage and nothing is
// written. Every builder returns `null` rather than a broken question when its
// pool is too thin, and the assembler fills the gap from another kind — so a
// course with no prayers, no passages or only two weeks authored still gets a
// full round.

import { PHASES } from '../data/studyData';
import { parseVocab } from '../../course/vocab';
import { devotionSections } from '../../course/devotions';
import { normalize } from './pronunciation';
import { rngFor, shuffled } from './gameRandom';

export const QUIZ_LENGTH = 10;

// The shape of a round: which kind of question comes in which slot. Vocabulary
// carries the round (it is the one pool every course has), the rest punctuate
// it. Slots whose pool is empty fall through to the next kind that still has
// material.
const PLAN = [
  'vocab-en-it',
  'verse',
  'grammar',
  'vocab-it-en',
  'prayer',
  'vocab-en-it',
  'comprehension',
  'verse',
  'grammar',
  'vocab-it-en',
];

const KIND_LABELS = {
  'vocab-en-it': { it: 'Vocabolario', en: 'Vocabulary' },
  'vocab-it-en': { it: 'Vocabolario', en: 'Vocabulary' },
  grammar: { it: 'Grammatica', en: 'Grammar' },
  verse: { it: 'Versetto', en: 'Verse' },
  prayer: { it: 'Preghiera', en: 'Prayer' },
  comprehension: { it: 'Comprensione', en: 'Comprehension' },
};

// Function words are never blanked in a verse: hiding "della" tests nothing.
const FUNCTION_WORDS = new Set([
  'della', 'dello', 'delle', 'degli', 'dalla', 'dallo', 'dalle', 'dagli',
  'nella', 'nello', 'nelle', 'negli', 'sulla', 'sullo', 'sulle', 'sugli',
  'alla', 'allo', 'alle', 'agli', 'come', 'quando', 'perche', 'perché',
  'anche', 'ancora', 'dove', 'ogni', 'tutto', 'tutti', 'tutte', 'tutta',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli',
  'quelle', 'loro', 'suoi', 'sua', 'suo', 'mio', 'miei', 'nostro', 'nostra',
  'vostro', 'vostra', 'sono', 'essere', 'avere', 'stato', 'cosa', 'molto',
]);

// ── pools ───────────────────────────────────────────────────────────────────

// Weeks the round may draw from. `weekMax` keeps a learner in week 3 from being
// quizzed on week 30 material; if it would leave nothing, the whole course is
// used instead — an empty round is worse than an early spoiler.
export function weeksInScope(phases = PHASES, weekMax = null) {
  const all = (phases || []).flatMap((p) => p.weeks || []);
  if (!weekMax) return all;
  const scoped = all.filter((w) => w.n <= weekMax);
  return scoped.length ? scoped : all;
}

export function vocabPool(weeks) {
  const out = [];
  for (const week of weeks) {
    for (const tuple of week.vocab || []) {
      const v = parseVocab(tuple);
      if (v.it && v.en) out.push({ ...v, weekN: week.n, reading: week.r });
    }
  }
  return out;
}

export function drillPool(weeks) {
  const out = [];
  for (const week of weeks) {
    for (const d of week.drill || []) {
      if (d && d.q && d.a) out.push({ ...d, weekN: week.n });
    }
  }
  return out;
}

export function versePool(weeks) {
  const out = [];
  for (const week of weeks) {
    const p = week.passage;
    if (!p) continue;
    for (const verse of p.verses || []) {
      if (verse && verse.t) {
        out.push({ ...verse, ref: p.ref, weekN: week.n });
      }
    }
  }
  return out;
}

export function comprehensionPool(weeks) {
  const out = [];
  for (const week of weeks) {
    for (const c of week.comprehension || []) {
      if (!c || !c.it) continue;
      if (c.type === 'tf' && typeof c.answer === 'boolean') out.push({ ...c, weekN: week.n });
      if (c.type === 'mc' && Array.isArray(c.options) && c.options.length >= 2) {
        out.push({ ...c, weekN: week.n });
      }
    }
  }
  return out;
}

export function prayerPool(sections = devotionSections) {
  const out = [];
  for (const section of sections || []) {
    for (const prayer of section.prayers || []) {
      for (const line of prayer.lines || []) {
        if (line && line.blank && blankOut(line.it, line.blank)) {
          out.push({ ...line, title: prayer.title, titleEn: prayer.titleEn });
        }
      }
    }
  }
  return out;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const words = (text) => String(text ?? '').match(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g) || [];

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Replace one standalone occurrence of `word` with a blank. Plain
// `String.replace` is not safe here: blanking "del" out of "della gloria del
// Padre" would gut the first word instead of the third.
export function blankOut(text, word) {
  if (!text || !word) return null;
  const re = new RegExp(`(^|[^A-Za-zÀ-ÿ'’])${escapeRe(word)}(?![A-Za-zÀ-ÿ'’])`);
  if (!re.test(text)) return null;
  return text.replace(re, (m, before) => `${before}___`);
}

const isCapitalized = (w) => /^[A-ZÀ-Þ]/.test(String(w || ''));

// Give a distractor the same initial case as the right answer.
function matchCase(word, like) {
  if (!word) return word;
  return isCapitalized(like)
    ? word[0].toUpperCase() + word.slice(1)
    : word[0].toLowerCase() + word.slice(1);
}

// Wrong answers must not be distinguishable by anything except meaning. Case is
// the leak that matters here: a capitalized "Cristo" among three lowercase
// distractors answers itself. Prefer candidates that already match the right
// answer's case; only if that starves the question, shift their case instead.
function levelCase(pool, correct, rng, pick) {
  const same = pool.filter((c) => isCapitalized(pick(c)) === isCapitalized(correct));
  const wrong = distractors(same, correct, rng, 3, pick);
  if (wrong.length >= 2) return wrong;
  return distractors(pool, correct, rng, 3, pick).map((w) => matchCase(w, correct));
}

// Up to `n` wrong answers, deterministically drawn and never colliding with the
// right one or with each other.
function distractors(pool, correct, rng, n = 3, pick = (x) => x) {
  const seen = new Set([normalize(correct)]);
  const out = [];
  for (const candidate of shuffled(pool, rng)) {
    const value = pick(candidate);
    if (!value) continue;
    const key = normalize(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= n) break;
  }
  return out;
}

// Assemble the question, shuffling the options so the right answer does not sit
// in the same place every time.
function finalize(base, correct, wrong, rng) {
  const options = shuffled([correct, ...wrong], rng);
  if (options.length < 2) return null;
  return { ...base, options, answer: options.indexOf(correct) };
}

// ── question builders ───────────────────────────────────────────────────────
// Each takes one item plus the pools it needs for distractors, and returns a
// question or null.

function vocabEnIt(item, pool, rng) {
  const wrong = levelCase(pool.filter((v) => v !== item), item.it, rng, (v) => v.it);
  if (wrong.length < 2) return null;
  return finalize(
    {
      kind: 'vocab-en-it',
      prompt: item.en,
      promptLang: 'en',
      audio: item.it,
      explainIt: item.ex,
      explainEn: item.exEn,
      source: `Settimana ${item.weekN}`,
    },
    item.it,
    wrong,
    rng,
  );
}

function vocabItEn(item, pool, rng) {
  const wrong = levelCase(pool.filter((v) => v !== item), item.en, rng, (v) => v.en);
  if (wrong.length < 2) return null;
  return finalize(
    {
      kind: 'vocab-it-en',
      prompt: item.it,
      promptLang: 'it',
      audio: item.it,
      explainIt: item.ex,
      explainEn: item.exEn,
      source: `Settimana ${item.weekN}`,
    },
    item.en,
    wrong,
    rng,
  );
}

function grammar(item, pool, rng) {
  const wrong = levelCase(pool.filter((d) => d !== item), item.a, rng, (d) => d.a);
  if (wrong.length < 2) return null;
  return finalize(
    {
      kind: 'grammar',
      prompt: item.q,
      promptLang: 'it',
      audio: item.q.replace('___', item.a),
      explainIt: item.q.replace('___', item.a),
      explainEn: item.hint || '',
      source: `Settimana ${item.weekN}`,
    },
    item.a,
    wrong,
    rng,
  );
}

// Blank one content word of a verse. The word must occur exactly once, or
// blanking it would leave the answer visible elsewhere in the line.
export function blankableWords(text) {
  const all = words(text);
  const counts = new Map();
  for (const w of all) {
    const k = normalize(w);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return all.filter((w) => {
    const k = normalize(w);
    return k.length >= 4 && counts.get(k) === 1 && !FUNCTION_WORDS.has(k);
  });
}

function verse(item, pool, rng) {
  const choices = blankableWords(item.t);
  if (!choices.length) return null;
  const target = shuffled(choices, rng)[0];
  const blanked = blankOut(item.t, target);
  if (!blanked) return null;
  const here = new Set(words(item.t).map(normalize));
  const candidates = pool
    .flatMap((v) => (v === item ? [] : blankableWords(v.t)))
    .filter((w) => !here.has(normalize(w)) && Math.abs(w.length - target.length) <= 3);
  const wrong = levelCase(candidates, target, rng, (w) => w);
  if (wrong.length < 2) return null;
  return finalize(
    {
      kind: 'verse',
      prompt: blanked,
      promptLang: 'it',
      audio: item.t,
      explainIt: item.t,
      explainEn: item.en || '',
      source: `${item.ref}${item.n ? ` · v.${item.n}` : ''}`,
    },
    target,
    wrong,
    rng,
  );
}

function prayer(item, pool, rng) {
  const wrong = levelCase(pool.filter((l) => l !== item), item.blank, rng, (l) => l.blank);
  if (wrong.length < 2) return null;
  return finalize(
    {
      kind: 'prayer',
      prompt: blankOut(item.it, item.blank),
      promptLang: 'it',
      audio: item.it,
      explainIt: item.it,
      explainEn: item.en || '',
      source: item.title,
    },
    item.blank,
    wrong,
    rng,
  );
}

function comprehension(item, pool, rng) {
  if (item.type === 'tf') {
    const correct = item.answer ? 'Vero' : 'Falso';
    return {
      kind: 'comprehension',
      prompt: item.it,
      promptLang: 'it',
      audio: item.it,
      explainIt: '',
      explainEn: item.explain || item.en || '',
      source: `Settimana ${item.weekN}`,
      options: ['Vero', 'Falso'],
      answer: item.answer ? 0 : 1,
      correctText: correct,
    };
  }
  const correct = item.options[item.answer];
  if (!correct) return null;
  return finalize(
    {
      kind: 'comprehension',
      prompt: item.it,
      promptLang: 'it',
      audio: item.it,
      explainIt: '',
      explainEn: item.explain || item.en || '',
      source: `Settimana ${item.weekN}`,
    },
    correct,
    item.options.filter((_, i) => i !== item.answer),
    rng,
  );
}

// ── assembly ────────────────────────────────────────────────────────────────

export function buildQuiz({
  date = '',
  count = QUIZ_LENGTH,
  phases = PHASES,
  sections = devotionSections,
  weekMax = null,
  salt = 'sfida',
} = {}) {
  const weeks = weeksInScope(phases, weekMax);
  const pools = {
    vocab: vocabPool(weeks),
    drill: drillPool(weeks),
    verse: versePool(weeks),
    prayer: prayerPool(sections),
    comprehension: comprehensionPool(weeks),
  };

  // One shuffled queue per kind, so nothing repeats inside a round.
  const seed = `${salt}|${date}|${weekMax || 'all'}`;
  const queues = {
    'vocab-en-it': shuffled(pools.vocab, rngFor(`${seed}|v1`)),
    'vocab-it-en': shuffled(pools.vocab, rngFor(`${seed}|v2`)),
    grammar: shuffled(pools.drill, rngFor(`${seed}|g`)),
    verse: shuffled(pools.verse, rngFor(`${seed}|s`)),
    prayer: shuffled(pools.prayer, rngFor(`${seed}|p`)),
    comprehension: shuffled(pools.comprehension, rngFor(`${seed}|c`)),
  };
  const builders = {
    'vocab-en-it': (item, rng) => vocabEnIt(item, pools.vocab, rng),
    'vocab-it-en': (item, rng) => vocabItEn(item, pools.vocab, rng),
    grammar: (item, rng) => grammar(item, pools.drill, rng),
    verse: (item, rng) => verse(item, pools.verse, rng),
    prayer: (item, rng) => prayer(item, pools.prayer, rng),
    comprehension: (item, rng) => comprehension(item, pools.comprehension, rng),
  };
  const used = { 'vocab-en-it': new Set(), 'vocab-it-en': new Set() };

  const questions = [];
  for (let slot = 0; questions.length < count && slot < count * 4; slot++) {
    const wanted = PLAN[slot % PLAN.length];
    // Try the planned kind first, then every other kind that still has material.
    const order = [wanted, ...Object.keys(queues).filter((k) => k !== wanted)];
    let made = null;
    for (const kind of order) {
      const rng = rngFor(`${seed}|${slot}|${kind}`);
      while (queues[kind].length && !made) {
        const item = queues[kind].shift();
        // The two vocab directions share a pool: don't ask the same word twice.
        if (kind.startsWith('vocab')) {
          const key = normalize(item.it);
          if (used['vocab-en-it'].has(key) || used['vocab-it-en'].has(key)) continue;
        }
        const q = builders[kind](item, rng);
        if (!q) continue;
        if (kind.startsWith('vocab')) used[kind].add(normalize(item.it));
        made = q;
      }
      if (made) break;
    }
    if (!made) break; // every pool is exhausted
    questions.push({
      ...made,
      id: `${date}-${questions.length}`,
      label: KIND_LABELS[made.kind] || { it: '', en: '' },
    });
  }
  return questions;
}
