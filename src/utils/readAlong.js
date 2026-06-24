// Pure helpers for the prayer "read-along" highlighter.
//
// `tokenizeReadAlong` splits a string into ordered segments that cover the
// whole input exactly — each is `{ text, start, isWord }`. Word segments
// (runs of non-whitespace) are the ones the highlighter targets; whitespace
// runs are preserved so the rendered text is byte-identical to the input.
export function tokenizeReadAlong(text) {
  const tokens = [];
  const re = /\s+|\S+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ text: m[0], start: m.index, isWord: !/^\s/.test(m[0]) });
  }
  return tokens;
}

// Map a char offset from a SpeechSynthesis `boundary` event to the index of the
// word token it falls in. The event's `charIndex` points at the start of the
// word being spoken, so we return the last word token starting at or before it
// (which is the word containing the offset). Returns -1 before the first word.
export function wordIndexAtChar(tokens, charIndex) {
  let idx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].isWord && tokens[i].start <= charIndex) idx = i;
  }
  return idx;
}
