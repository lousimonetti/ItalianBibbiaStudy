// Sentence-scramble ("Costruisci") logic: split an example sentence into word
// chips, shuffle them so the learner rebuilds the original word order, and
// check the rebuilt order. Chips keep their punctuation and capitalization —
// the capital on the first word and the final period are legitimate syntactic
// hints, the same ones a real sentence gives you.

// Split on whitespace; tokens keep attached punctuation ("carne.", "l'uomo").
export function scrambleTokens(sentence) {
  if (!sentence) return [];
  return sentence.trim().split(/\s+/).filter(Boolean);
}

// A card is buildable when its example has enough words to make ordering a
// real task but not so many that tapping chips becomes tedious.
export const MIN_WORDS = 4;
export const MAX_WORDS = 12;

export function isScrambleEligible(card) {
  const n = scrambleTokens(card?.ex).length;
  return n >= MIN_WORDS && n <= MAX_WORDS;
}

// Fisher-Yates over a copy; guaranteed to differ from the original order
// whenever the tokens allow it (i.e. they aren't all identical). `rand` is
// injectable for tests.
export function shuffleScramble(tokens, rand = Math.random) {
  const out = [...tokens];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (sameOrder(tokens, out)) {
    // Nudge: swap the first pair of positions holding different values.
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (out[i] !== out[j]) {
          [out[i], out[j]] = [out[j], out[i]];
          return out;
        }
      }
    }
  }
  return out;
}

// Order check compares token values, so duplicate words are interchangeable —
// any arrangement that reads back as the original sentence is correct.
export function sameOrder(expected, picked) {
  return (
    expected.length === picked.length &&
    expected.every((w, i) => w === picked[i])
  );
}
