import { PHASES } from '../data/studyData';

// A leading Italian article (definite/indefinite) so that a vocab entry like
// "il Verbo" or "la luce" is also reachable by its bare content word ("verbo",
// "luce") — which is how the word appears inside an example sentence.
const LEADING_ARTICLE = /^(l['’]|gli\s+|le\s+|il\s+|lo\s+|la\s+|i\s+|uno\s+|una\s+|un['’]?\s*)/i;

function clean(s) {
  return s.toLowerCase().trim();
}

function stripArticle(s) {
  return s.replace(LEADING_ARTICLE, '').trim();
}

let INDEX = null;

// Build once: maps a normalized Italian term → { it, en, ipa }. Both the full
// term and its article-stripped form are indexed. First write wins, so the
// earliest (lowest-week) gloss is the canonical one for a repeated word.
export function getVocabIndex() {
  if (INDEX) return INDEX;
  INDEX = new Map();
  const add = (key, val) => {
    const k = clean(key);
    if (k && !INDEX.has(k)) INDEX.set(k, val);
  };
  for (const phase of PHASES) {
    for (const week of phase.weeks) {
      for (const [it, en, , ipa] of week.vocab) {
        const val = { it, en, ipa: ipa || '' };
        add(it, val);
        const stripped = stripArticle(clean(it));
        if (stripped && stripped !== clean(it)) add(stripped, val);
      }
    }
  }
  return INDEX;
}

// Look up a single word/token. Returns { it, en, ipa } or null. Tries the word
// as-is, then with any leading article stripped (so "l'unzione" and "unzione"
// both resolve).
export function lookupWord(word) {
  if (!word) return null;
  const idx = getVocabIndex();
  const w = clean(word);
  return idx.get(w) || idx.get(stripArticle(w)) || null;
}

// Split an Italian string into word / non-word tokens, preserving every
// character so the original text can be reconstructed exactly. A "word" keeps
// internal apostrophes (l'unzione, dov'è) as a single token.
export function tokenize(text) {
  const tokens = [];
  const re = /[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), isWord: false });
    tokens.push({ text: m[0], isWord: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), isWord: false });
  return tokens;
}
