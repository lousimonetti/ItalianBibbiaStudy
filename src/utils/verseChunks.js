// Splits a verse into pieces short enough to hear once and say back. A learner
// cannot shadow a 40-word periodic sentence, but cutting at arbitrary word counts
// produces fragments no Italian speaker would pause on. So: sentence boundaries
// first, then clause punctuation, and only a hard word-count split for the rare
// stretch with no punctuation at all. Used by the voice tutor's Repeat step and
// by the verse Build drill, whose chips stop being a puzzle past MAX_WORDS. Pure.

import { splitSentences } from './keyVerses';
import { MAX_WORDS } from './scramble';

export const MIN_CHUNK_WORDS = 3;

const wordCount = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// Split after clause punctuation, keeping the mark on the left-hand piece.
function splitClauses(sentence) {
  return sentence.split(/(?<=[,:])\s+/).map((s) => s.trim()).filter(Boolean);
}

function splitHard(piece, maxWords) {
  const words = piece.trim().split(/\s+/).filter(Boolean);
  // Even pieces, so a 13-word stretch becomes 7 + 6 and not 12 + a stranded word.
  const count = Math.ceil(words.length / maxWords);
  return Array.from({ length: count }, (_, i) =>
    words.slice(Math.floor((i * words.length) / count), Math.floor(((i + 1) * words.length) / count)).join(' '));
}

// Folds fragments like "e disse:" into a neighbour, as long as the merged piece
// still fits. A short fragment joins the piece after it when it has no sentence
// end of its own, since a clause opener belongs with what it introduces.
function mergeShort(pieces, maxWords, minWords) {
  const out = [];
  let carry = '';
  for (const piece of pieces) {
    const joined = carry ? `${carry} ${piece}` : piece;
    if (carry && wordCount(joined) > maxWords) {
      out.push(carry);
      carry = wordCount(piece) < minWords ? piece : '';
      if (!carry) out.push(piece);
    } else if (wordCount(joined) < minWords) {
      carry = joined;
    } else {
      out.push(joined);
      carry = '';
    }
  }
  if (carry) {
    const last = out[out.length - 1];
    if (last && wordCount(`${last} ${carry}`) <= maxWords) out[out.length - 1] = `${last} ${carry}`;
    else out.push(carry);
  }
  return out;
}

export function verseChunks(text, { maxWords = MAX_WORDS, minWords = MIN_CHUNK_WORDS } = {}) {
  const pieces = splitSentences(text).flatMap((sentence) => {
    if (wordCount(sentence) <= maxWords) return [sentence];
    const clauses = splitClauses(sentence).flatMap((clause) =>
      wordCount(clause) <= maxWords ? [clause] : splitHard(clause, maxWords));
    return mergeShort(clauses, maxWords, minWords);
  });
  return mergeShort(pieces, maxWords, minWords);
}
