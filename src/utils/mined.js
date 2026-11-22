// "Mie parole": words the learner saves from what they read, or notes after a
// conversation (REVIEW-fluency.md B2 and B4).
//
// Sentence mining is the habit of keeping a word *with the sentence you met it
// in*. It matters for two reasons: the learner picks words they actually needed
// (the input they are reading right now), and the sentence gives every review a
// context, which is what turns a word pair into something you can use.
//
// Saved words go through the same spaced-repetition store as the course cards
// (`storageKey('srs')`), keyed by the saved term. That keeps one daily new-card
// cap for everything and lets the due badge, the struggle list and New Session
// treat them like any other card. A word that is already a course or core card
// is never saved twice: it is already being reviewed.
//
// The list itself lives under `storageKey('mined')`, so it rides sync backups.

import { storageKey } from './storageKey';

export const MINED_EVENT = 'coursekit:mined';
const KEY = () => storageKey('mined');
export const MAX_MINED = 500;

const norm = (s) => (s || '').trim().toLowerCase().replace(/’/g, "'");

// The sentence of `text` that contains character `offset`: from just after
// the previous . ! ? ; or line break to the next one, trimmed. Verses and
// prayer lines can be long, and the card only needs the sentence the word is in.
export function sentenceAt(text, offset) {
  if (!text) return '';
  const stop = /[.!?;\n]/;
  let start = offset;
  while (start > 0 && !stop.test(text[start - 1])) start -= 1;
  let end = offset;
  while (end < text.length && !stop.test(text[end])) end += 1;
  if (end < text.length && text[end] !== '\n') end += 1; // keep the full stop
  return text.slice(start, end).replace(/^[\s«“"(]+/, '').trim();
}

// Pure: add `entry` ({ it, en, ex?, src? }) to `list`. Returns
// { list, added, reason } where reason is 'empty' | 'duplicate' | 'full'.
export function addEntry(list, entry, now = Date.now()) {
  const it = (entry?.it || '').trim().replace(/’/g, "'");
  if (!it) return { list, added: false, reason: 'empty' };
  if (list.some((e) => norm(e.it) === norm(it))) return { list, added: false, reason: 'duplicate' };
  if (list.length >= MAX_MINED) return { list, added: false, reason: 'full' };
  const next = {
    it,
    en: (entry.en || '').trim(),
    ex: (entry.ex || '').trim().replace(/’/g, "'"),
    src: (entry.src || '').trim(),
    added: now,
  };
  return { list: [...list, next], added: true, reason: null };
}

export function removeEntry(list, it) {
  return list.filter((e) => norm(e.it) !== norm(it));
}

// Pure: change the meaning of a saved word (the learner can correct or fill in
// a gloss the dictionary did not have).
export function updateEntry(list, it, patch) {
  return list.map((e) => (norm(e.it) === norm(it) ? { ...e, ...patch, it: e.it, added: e.added } : e));
}

export function hasEntry(list, it) {
  return list.some((e) => norm(e.it) === norm(it));
}

// Saved entries as practice cards, in the same flat shape as buildCards().
// Without a gloss a card has nothing to ask in Recall, so those are left out
// until the learner fills the meaning in.
export function toCards(list) {
  return list
    .filter((e) => e.it && e.en)
    .map((e) => ({
      it: e.it,
      en: e.en,
      ex: e.ex || '',
      exEn: '',
      ipa: '',
      form: '',
      deck: 'mine',
      meta: e.src ? `My words · ${e.src}` : 'My words',
    }));
}

export function loadMined() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY()));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveMined(list) {
  try {
    localStorage.setItem(KEY(), JSON.stringify(list));
    window.dispatchEvent(new Event(MINED_EVENT));
  } catch {
    // storage unavailable: degrade silently
  }
}

// Convenience wrappers for components: read, change, write, notify.
export function mineWord(entry) {
  const r = addEntry(loadMined(), entry);
  if (r.added) saveMined(r.list);
  return r;
}

export function forgetWord(it) {
  saveMined(removeEntry(loadMined(), it));
}

export function editWord(it, patch) {
  saveMined(updateEntry(loadMined(), it, patch));
}
