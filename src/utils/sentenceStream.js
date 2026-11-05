// Splits a model's reply into sentences as it streams in, so the tutor can start speaking
// the first one while the rest is still being generated. Sentence ends follow
// splitSentences() in keyVerses.js. Also strips markdown, which a voice would otherwise
// read out or a screen would show as stray symbols. Pure.

function isBoundaryMark(c) {
  return c === '.' || c === '!' || c === '?' || c === ';';
}

function isSpace(c) {
  return /\s/.test(c);
}

export function cleanReply(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*)/, ''))
    .join(' ')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Text with no letters ("---", a lone emoji) isn't worth speaking.
const hasLetters = (s) => /\p{L}/u.test(s);

// Takes the buffer so far plus new text. Returns the sentences now complete, and what to
// carry over. A mark only ends a sentence once whitespace follows it, because more text
// could still arrive ("..." or a closing quote).
export function pushDelta(buffer, delta) {
  const chars = Array.from(`${buffer}${delta}`);
  const sentences = [];
  let start = 0;
  let i = 0;
  while (i < chars.length) {
    if (isBoundaryMark(chars[i]) && i + 1 < chars.length && isSpace(chars[i + 1])) {
      let end = i + 1;
      while (end < chars.length && isSpace(chars[end])) end++;
      const sentence = cleanReply(chars.slice(start, i + 1).join(''));
      if (hasLetters(sentence)) sentences.push(sentence);
      start = end;
      i = end;
    } else {
      i++;
    }
  }
  return { sentences, buffer: chars.slice(start).join('') };
}

// The last, unterminated stretch once the stream has ended.
export function flushBuffer(buffer) {
  const sentence = cleanReply(buffer);
  return hasLetters(sentence) ? [sentence] : [];
}
