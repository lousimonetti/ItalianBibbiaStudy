// Guided lessons for the Prayers, Rosary and Saints tabs: the same "press
// start and be walked through it" container the weeks have (lessonPlan.js,
// played by LessonPlayer), built over material those tabs already carry.
//
//   • a PRAYER becomes one lesson per ~5 lines: hear each line, match it to
//     its meaning, recognise it by ear, type the word that carries the
//     grammar, rebuild the line, then say which line comes next.
//   • a set of MYSTERIES becomes one lesson: meet the five, match them, pick
//     the one announced, place them in order, rebuild the announcement.
//   • a SAINT'S STORY (fetched text, so nothing is authored) becomes a short
//     lesson on up to five of its words: meet each in its sentence, match,
//     hear, put it back in the sentence, produce it from the English.
//
// Everything is seeded, so a lesson is the same each time it is opened. None
// of it reaches the vocabulary SRS: prayer lines are not vocab cards, and a
// word lifted from a Wikipedia extract has no card to schedule.

import { rngFor, shuffled } from './gameRandom';
import { buildStep, wrongOptions, balancedChunks } from './lessonPlan';
import { blankableWords } from './quizGame';
import { splitSentences } from './keyVerses';
import { announcement, announcementEn, capitalize, ORDINALS } from './rosary';
import { lookupWord } from './vocabIndex';
import { lookupCommon } from './it2en';

export const LINES_PER_LESSON = 5;
export const STORY_WORDS = 5;
const MATCH_MAX = 5;

const WORD = /[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g;
const wordsOf = (text) => String(text ?? '').match(WORD) || [];
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function lesson(key, title, sub, label, steps, extra = {}) {
  const list = steps.filter(Boolean);
  return {
    key,
    kind: 'devotion',
    title,
    sub,
    label,
    words: [],
    steps: list.map((s, id) => ({ ...s, id })),
    minutes: Math.max(2, Math.round(list.length / 3)),
    ...extra,
  };
}

// A pick-one step in the shape LessonPlayer's `choice` already plays. `term`
// is the Italian the player speaks (before the answer for an `audio` step,
// after it otherwise).
function pickStep(prompt, correct, pool, rng, extra = {}) {
  const wrong = wrongOptions(pool.filter((x) => x !== prompt), correct, rng);
  if (wrong.length < 2) return null;
  const options = shuffled([correct, ...wrong], rng);
  return {
    kind: 'choice',
    direction: 'it-en',
    term: prompt,
    prompt,
    options,
    answer: options.indexOf(correct),
    ...extra,
  };
}

function matchStep(pairs, rng, instruction = '') {
  const seen = new Set();
  const unique = pairs.filter((p) => {
    if (seen.has(p.it) || seen.has(p.en)) return false;
    seen.add(p.it);
    seen.add(p.en);
    return true;
  }).slice(0, MATCH_MAX);
  if (unique.length < 2) return null;
  const idx = unique.map((_, i) => i);
  return { kind: 'match', pairs: unique, left: shuffled(idx, rng), right: shuffled(idx, rng), ...(instruction ? { instruction } : {}) };
}

// ── Prayers ─────────────────────────────────────────────────────────────────

// Where a line's blank sits. The author's `blank` when given (chosen for its
// grammar: sia, venga, dello), else the longest word. Whole words only, so
// `del` is never cut out of `della`. A word that occurs twice in the line
// ("al Padre e al Figlio", "i secoli dei secoli") cannot be the blank — the
// second one would show the answer — so the longest word that occurs once
// stands in for it.
export function lineCloze(line) {
  const words = wordsOf(line?.it);
  if (words.length < 2) return null;
  const times = (w) => words.filter((x) => x.toLowerCase() === w.toLowerCase()).length;
  const blank = [line.blank, ...[...words].sort((a, b) => b.length - a.length)]
    .find((w) => w && times(w) <= 1);
  if (!blank) return null;
  const m = new RegExp(`(^|[^A-Za-zÀ-ÿ'’])${escapeRe(blank)}(?![A-Za-zÀ-ÿ'’])`, 'i').exec(line.it);
  const at = m ? m.index + m[1].length : line.it.toLowerCase().indexOf(blank.toLowerCase());
  if (at < 0) return null;
  return {
    before: line.it.slice(0, at),
    answer: line.it.slice(at, at + blank.length),
    after: line.it.slice(at + blank.length),
  };
}

// The lessons for one prayer, in order. Empty when it has no line-by-line
// version (a one-word line such as "Amen." is not a line to learn).
export function prayerLessons(prayer) {
  const lines = (prayer?.lines || []).filter((l) => wordsOf(l.it).length >= 2);
  if (lines.length < 2) return [];
  const parts = balancedChunks(lines, LINES_PER_LESSON);
  const allIt = lines.map((l) => l.it);
  const allEn = lines.map((l) => l.en);

  return parts.map((part, i) => {
    const rng = rngFor(`prayer:${prayer.id}:${i + 1}`);
    const steps = part.map((l) => ({ kind: 'line', eyebrow: prayer.title, it: l.it, en: l.en, say: l.it }));
    steps.push(matchStep(part.map((l) => ({ it: l.it, en: l.en })), rng, 'Match each line to its meaning'));
    for (const l of shuffled(part, rng).slice(0, 2)) {
      steps.push(pickStep(l.it, l.en, allEn, rng, { audio: true }));
    }
    for (const l of part) {
      const cloze = lineCloze(l);
      if (!cloze) continue;
      steps.push({
        kind: 'cloze',
        strict: true,
        term: `prayer:${prayer.id}`,
        card: { it: cloze.answer, en: l.en, ex: l.it, exEn: '' },
        ...cloze,
      });
    }
    steps.push(...part.map((l) => buildStep(l.it, l.en, rng, { audio: true })).filter(Boolean).slice(0, 2));
    for (const l of shuffled(part, rng).slice(0, 2)) {
      const next = lines[lines.indexOf(l) + 1];
      if (!next || next.it === l.it) continue;
      steps.push(pickStep(l.it, next.it, allIt, rng, { instruction: 'Which line comes next?', say: next.it }));
    }
    const sub = parts.length > 1 ? `Part ${i + 1} of ${parts.length} · ${part.length} lines` : `${part.length} lines`;
    return lesson(`prayer:${prayer.id}:${i + 1}`, prayer.title, sub, prayer.title, steps, { store: 'devotion', n: i + 1 });
  });
}

// ── Rosary mysteries ────────────────────────────────────────────────────────

export const mysteryLessonKey = (set) => `rosary:${set.id}`;

export function mysteryLesson(set) {
  if (!set?.mysteries?.length) return null;
  const rng = rngFor(mysteryLessonKey(set));
  const ms = set.mysteries;
  const itOf = (m) => capitalize(m.it);
  const order = ms.map((_, d) => d);
  const allIt = ms.map(itOf);
  const allEn = ms.map((m) => m.en);

  const steps = ms.map((m, d) => ({
    kind: 'line',
    eyebrow: `${capitalize(ORDINALS[d])} mistero ${set.adjective}`,
    it: itOf(m),
    en: `${m.en} · ${m.ref}`,
    say: announcement(set, d),
    note: m.fruitEn ? `Fruit of the mystery: ${m.fruitEn}` : '',
    image: m.wiki || '',
  }));
  steps.push(matchStep(ms.map((m) => ({ it: itOf(m), en: m.en })), rng, 'Match each mystery to its English name'));
  for (const d of shuffled(order, rng).slice(0, 2)) {
    steps.push(pickStep(announcement(set, d), ms[d].en, allEn, rng, { audio: true }));
  }
  for (const d of shuffled(order, rng).slice(0, 2)) {
    steps.push(pickStep(`Qual è il ${ORDINALS[d]} mistero ${set.adjective}?`, itOf(ms[d]), allIt, rng, {
      instruction: 'Choose the mystery',
      say: announcement(set, d),
    }));
  }
  steps.push(...order
    .map((d) => buildStep(announcement(set, d), announcementEn(set, d), rng, { audio: true }))
    .filter(Boolean)
    .slice(0, 2));
  for (const d of shuffled(order, rng)) {
    steps.push(pickStep(ms[d].en, itOf(ms[d]), allIt, rng, { direction: 'en-it', term: itOf(ms[d]) }));
  }
  return lesson(mysteryLessonKey(set), set.title, `${ms.length} mysteries`, set.title, steps, { store: 'devotion' });
}

// ── Saints ──────────────────────────────────────────────────────────────────

const SENTENCE_MAX = 260;
// Grammar words the gloss dictionary knows but nobody needs a lesson on.
const NOT_WORTH = new Set([
  'stato', 'stata', 'stati', 'state', 'essendo', 'avendo', 'prima', 'dopo', 'tuttavia', 'mentre',
  'quindi', 'inoltre', 'sempre', 'durante', 'secondo', 'ancora', 'circa', 'anche', 'oltre', 'verso',
]);

// Up to `max` words worth learning from a fetched story, each with the
// sentence it came from: [{ word, en, sentence }], in story order. Course
// vocabulary met in the wild comes first, then the longest glossed words. A
// word must be lowercase (names teach nothing), occur once in its sentence (it
// is blanked there later) and have a gloss no other pick shares.
export function storyWords(extract, max = STORY_WORDS) {
  const found = [];
  const seenWord = new Set();
  const seenEn = new Set();
  splitSentences(String(extract ?? '')).forEach((sentence, at) => {
    if (sentence.length > SENTENCE_MAX) return;
    for (const word of blankableWords(sentence)) {
      const key = word.toLowerCase();
      if (word !== key || seenWord.has(key) || NOT_WORTH.has(key)) continue;
      const vocab = lookupWord(word);
      // A form that points back at its lemma would be glossed as the lemma.
      const en = (vocab && !vocab.lemma ? vocab.en : '') || lookupCommon(word);
      if (!en || seenEn.has(en) || (!vocab && key.length < 5)) continue;
      seenWord.add(key);
      seenEn.add(en);
      found.push({ word, en, sentence, at, vocab: !!vocab });
    }
  });
  return found
    .map((f, i) => ({ ...f, i }))
    .sort((a, b) => (b.vocab - a.vocab) || (b.word.length - a.word.length) || (a.i - b.i))
    .slice(0, max)
    .sort((a, b) => a.i - b.i)
    .map(({ word, en, sentence }) => ({ word, en, sentence }));
}

const blanked = (sentence, word) =>
  sentence.replace(new RegExp(`(^|[^A-Za-zÀ-ÿ'’])${escapeRe(word)}(?![A-Za-zÀ-ÿ'’])`), (m, before) => `${before}____`);

// A lesson on one saint's story, or null when the text yields too few words.
// Never recorded — it belongs to the day, not to the course.
export function saintLesson(name, extract) {
  const picks = storyWords(extract);
  if (picks.length < 3) return null;
  const rng = rngFor(`saint:${name}`);
  const allIt = picks.map((p) => p.word);
  const allEn = picks.map((p) => p.en);

  const steps = picks.map((p) => ({
    kind: 'line',
    eyebrow: 'Dal racconto',
    it: p.word,
    en: p.en,
    say: p.word,
    example: p.sentence,
  }));
  steps.push(matchStep(picks.map((p) => ({ it: p.word, en: p.en })), rng));
  for (const p of shuffled(picks, rng).slice(0, 2)) {
    steps.push(pickStep(p.word, p.en, allEn, rng, { audio: true }));
  }
  for (const p of picks) {
    steps.push(pickStep(blanked(p.sentence, p.word), p.word, allIt, rng, {
      direction: 'fill',
      sentence: true,
      instruction: 'Which word is missing?',
      term: p.word,
      say: p.sentence,
    }));
  }
  for (const p of shuffled(picks, rng)) {
    steps.push(pickStep(p.en, p.word, allIt, rng, { direction: 'en-it', term: p.word }));
  }
  return lesson(`saint:${name}`, name, `${picks.length} words from the story`, name, steps, { store: 'none' });
}
